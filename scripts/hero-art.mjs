// Downloads the official tall hero card art (240x390) listed on mobilelegends.com/hero
// and stores it as images/heroes/art/<slug>.webp. Hash map: content/hero-art.json (slug -> hash),
// taken from the rendered public page; run with --force to re-download existing files.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'content/hero-art.json'), 'utf8'));
const outDir = path.join(root, 'images/heroes/art');
fs.mkdirSync(outDir, { recursive: true });
const force = process.argv.includes('--force');
const base = 'https://akmweb.youngjoygame.com/web/svnres/img/test/homepage_2_2_16_1235_1/100_';

let done = 0, skipped = 0, failed = [];
for (const [slug, hash] of Object.entries(map)) {
  const file = path.join(outDir, `${slug}.webp`);
  if (!force && fs.existsSync(file)) { skipped++; continue; }
  try {
    const res = await fetch(`${base}${hash}.png`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const image = sharp(buffer);
    const meta = await image.metadata();
    if (!meta.width || meta.width < 200) throw new Error(`unexpected size ${meta.width}x${meta.height}`);
    await image.webp({ quality: 86, effort: 5 }).toFile(file);
    done++;
  } catch (error) {
    failed.push(`${slug}: ${error.message}`);
  }
  await new Promise(resolve => setTimeout(resolve, 80));
}
console.log(`hero art: ${done} saved, ${skipped} kept, ${failed.length} failed`);
if (failed.length) { console.log(failed.join('\n')); process.exitCode = 1; }
