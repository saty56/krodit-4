// Generates tightly-cropped favicons from the source PNG.
// - Trims surrounding background (based on top-left pixel color)
// - Resizes to 32x32 and 16x16 PNGs
// - Builds a multi-size favicon.ico (16,32)
// Run: npm run gen:favicons

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const root = path.resolve(process.cwd());
const publicDir = path.join(root, 'public');
const srcPng = path.join(publicDir, 'file (1).png');

async function ensureExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function run() {
  if (!(await ensureExists(srcPng))) {
    console.error('Source PNG not found:', srcPng);
    process.exit(1);
  }

  // Read the source and trim background (top-left color)
  const srcImage = sharp(srcPng);
  const metadata = await srcImage.metadata();

  // Trim surrounding edge area of same color as top-left pixel; if not trim-able, continue gracefully
  let trimmed = srcImage.clone();
  try {
    trimmed = trimmed.trim();
  } catch (e) {
    // Some formats/inputs might not support trim without alpha; ignore
  }

  // Create a reasonably large, cropped master to downscale from
  const masterPng = await trimmed
    .png({ compressionLevel: 9 })
    .toBuffer();

  const out16 = path.join(publicDir, 'favicon-16x16.png');
  const out32 = path.join(publicDir, 'favicon-32x32.png');
  const outIco = path.join(publicDir, 'favicon.ico');

  // Generate specific sizes with no extra padding
  await sharp(masterPng).resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 }).toFile(out32);
  await sharp(masterPng).resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 }).toFile(out16);

  // Create ICO from PNGs
  try {
    const icoBuffer = await pngToIco([out16, out32]);
    await fs.writeFile(outIco, icoBuffer);
  } catch (err) {
    console.warn('Failed to generate favicon.ico via png-to-ico:', err?.message || err);
  }

  console.log('Favicons generated:', { out16, out32, outIco });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
