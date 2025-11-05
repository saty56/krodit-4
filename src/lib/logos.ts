export function domainFromName(name?: string): string {
	if (!name?.trim()) return "";
	const raw = name.trim().toLowerCase();
	if (raw.includes('.')) return raw;
	const tokens = raw.split(/\s+/).filter(Boolean);
	const last = (tokens[tokens.length - 1] || raw).replace(/[^a-z0-9-]/g, "");
	return `${last}.com`;
}

export function logoDevFromName(name?: string, size: number = 64): string {
	const domain = domainFromName(name);
	if (!domain) return "";
	// Prefer Clearbit first (fast, anonymous)
	return `https://logo.clearbit.com/${encodeURIComponent(domain)}?size=${size}`;
}

const BRANDFETCH_CLIENT_ID = process.env.BRANDFETCH_CLIENT_ID;

/**
 * Builds the best logo CDN URL for a service name.
 * Prioritizes Brandfetch CDN with client ID if set, or falls back to Clearbit, then Brandfetch/image providers.
 */
export function logoFromName(name?: string, size: number = 64): string {
	const domain = domainFromName(name);
	if (!domain) return "";
	if (BRANDFETCH_CLIENT_ID) {
		return `https://cdn.brandfetch.io/${encodeURIComponent(domain)}?c=${BRANDFETCH_CLIENT_ID}`;
	}
	// Fallback to Clearbit (no key required)
	return `https://logo.clearbit.com/${encodeURIComponent(domain)}?size=${size}`;
}

/**
 * Returns a fallback logo chain: Brandfetch CDN (clientId, if any), Clearbit, Brandfetch CDN (generic), Logo.dev, DuckDuckGo, UI Avatars.
 */
export function fallbackIconUrls(name?: string, size: number = 64): string[] {
	const domain = domainFromName(name);
	const urls: string[] = [];
	if (domain) {
		if (BRANDFETCH_CLIENT_ID) urls.push(`https://cdn.brandfetch.io/${encodeURIComponent(domain)}?c=${BRANDFETCH_CLIENT_ID}`);
		urls.push(`https://img.brandfetch.io/${encodeURIComponent(domain)}/icon?size=${size}`);
		urls.push(`https://logo.clearbit.com/${encodeURIComponent(domain)}?size=${size}`);
		urls.push(`https://img.logo.dev/${encodeURIComponent(domain)}?format=png&size=${size}`);
		urls.push(`https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`);
	}
	const letter = name?.trim() ? name.trim()[0].toUpperCase() : "?";
	urls.push(`https://ui-avatars.com/api/?name=${encodeURIComponent(letter)}&size=${size * 2}`);
	return urls;
}
