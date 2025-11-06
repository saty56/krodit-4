import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const CLEARBIT_URL = (domain: string, size = 128) => `https://logo.clearbit.com/${domain}?size=${size}`;
const BRANDFETCH_API = 'https://api.brandfetch.io/v2/brands/';
const BRANDFETCH_SEARCH = 'https://api.brandfetch.io/v2/search/';
const BRANDFETCH_KEY = process.env.BRANDFETCH_API_KEY;
const BRANDFETCH_CLIENT_ID = process.env.BRANDFETCH_CLIENT_ID;

function getCandidateDomains(input: string): string[] {
  try {
    const raw = String(input || '').trim().toLowerCase();
    if (!raw) return ['example.com'];
    if (raw.includes('.')) return [raw];
    const tokens = raw.split(/\s+/).filter(Boolean);
    const compact = raw.replace(/\s+/g, '');
    const lastToken = tokens[tokens.length - 1] || raw;
    const sanitizedLast = lastToken.replace(/[^a-z0-9-]/g, '');
    const candidates = [
      `${sanitizedLast}.com`,
      `${compact}.com`,
    ];
    // Remove duplicates while preserving order
    return Array.from(new Set(candidates));
  } catch {
    return ['example.com'];
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter ?q=' }, { status: 400 });
  }
  const candidates = getCandidateDomains(query);
  const preferred = candidates[0];

  // Helper: persist a remote logo URL to /public/brand-logos and return the local URL
  async function cacheLogoForDomain(domain: string, remoteUrl: string): Promise<string> {
    try {
      const safeDomain = domain.toLowerCase().replace(/[^a-z0-9.-]/g, '');
      const fileName = `${safeDomain}.png`;
      const publicDir = path.join(process.cwd(), 'public');
      const logosDir = path.join(publicDir, 'brand-logos');
      const filePath = path.join(logosDir, fileName);

      // If already cached, serve it
      try {
        await fs.access(filePath);
        return `/brand-logos/${fileName}`;
      } catch {}

      // Ensure directory exists
      await fs.mkdir(logosDir, { recursive: true });

      const res = await fetch(remoteUrl);
      if (!res.ok) throw new Error(`Failed to download logo: ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(filePath, buffer);
      return `/brand-logos/${fileName}`;
    } catch (e) {
      // In environments with read-only FS (e.g., serverless), fall back to remote URL
      console.warn('Logo cache write failed, falling back to remote', { error: (e as Error)?.message });
      return remoteUrl;
    }
  }

  // 1. Prefer Brandfetch
  // 1a. If API key is available, try Brandfetch search to resolve product names to their specific domains
  if (BRANDFETCH_KEY) {
    try {
      const searchRes = await fetch(`${BRANDFETCH_SEARCH}${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${BRANDFETCH_KEY}` },
      });
      if (searchRes.ok) {
        const results = await searchRes.json().catch(() => []);
        const top = Array.isArray(results) ? results[0] : null;
        const topDomain = top?.domain as string | undefined;
        if (topDomain) {
          if (BRANDFETCH_CLIENT_ID) {
            const cdnUrl = `https://cdn.brandfetch.io/${encodeURIComponent(topDomain)}?c=${BRANDFETCH_CLIENT_ID}`;
            const localUrl = await cacheLogoForDomain(topDomain, cdnUrl);
            return NextResponse.json({ source: 'brandfetch-cached', logo: localUrl });
          }
          const imgCdn = `https://img.brandfetch.io/${encodeURIComponent(topDomain)}/icon?size=128`;
          const localUrl = await cacheLogoForDomain(topDomain, imgCdn);
          return NextResponse.json({ source: 'brandfetch-cached', logo: localUrl });
        }
      } else {
        const text = await searchRes.text().catch(() => '');
        console.warn('Brandfetch SEARCH non-OK', {
          query,
          status: searchRes.status,
          statusText: searchRes.statusText,
          bodySnippet: text?.slice(0, 200),
        });
      }
    } catch (e) {
      console.error('Brandfetch SEARCH error', { query, error: (e as Error)?.message || e });
    }
  }

  // If we have a client id, we can use the Brandfetch CDN directly (hotlink-safe)
  if (BRANDFETCH_CLIENT_ID) {
    const cdnUrl = `https://cdn.brandfetch.io/${encodeURIComponent(preferred)}?c=${BRANDFETCH_CLIENT_ID}`;
    const localUrl = await cacheLogoForDomain(preferred, cdnUrl);
    return NextResponse.json({ source: 'brandfetch-cached', logo: localUrl });
  }

  // If we have a server API key, try the Brandfetch API
  if (BRANDFETCH_KEY) {
    try {
      // Try each candidate until one resolves
      for (const domain of candidates) {
        const brandfetchRes = await fetch(`${BRANDFETCH_API}${domain}`, {
        headers: {
          Authorization: `Bearer ${BRANDFETCH_KEY}`,
        },
      });
        if (brandfetchRes.ok) {
          // Use CDN/img for the specific matched domain
          const imgCdn = `https://img.brandfetch.io/${encodeURIComponent(domain)}/icon?size=128`;
          const localUrl = await cacheLogoForDomain(domain, imgCdn);
          return NextResponse.json({ source: 'brandfetch-cached', logo: localUrl });
        } else {
          const text = await brandfetchRes.text().catch(() => '');
          console.warn('Brandfetch API non-OK', {
            domain,
            status: brandfetchRes.status,
            statusText: brandfetchRes.statusText,
            bodySnippet: text?.slice(0, 200),
          });
        }
      }
    } catch (e) {
      console.error('Brandfetch API error', { candidates, error: (e as Error)?.message || e });
    }
  }

  // 2. Without API key, still try Brandfetch public image CDN as best-effort
  {
    const imgCdn = `https://img.brandfetch.io/${encodeURIComponent(preferred)}/icon?size=128`;
    const localUrl = await cacheLogoForDomain(preferred, imgCdn);
    return NextResponse.json({ source: 'brandfetch-cached', logo: localUrl });
  }

  // 3. Final fallback (unreachable in current flow, reserved)
  return NextResponse.json({ source: 'fallback', logo: '/default-logo.png' });
}


