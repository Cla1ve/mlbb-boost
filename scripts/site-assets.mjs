import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import * as solid from '@fortawesome/free-solid-svg-icons';
import * as brands from '@fortawesome/free-brands-svg-icons';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await mkdir(path.join(root, 'images/ranks'), { recursive: true });
const hero = path.join(root, 'Gusion - Cosmic Gleam-no-bg-preview (carve.photos).png');
for (const width of [480, 736]) await sharp(hero).resize({ width }).webp({ quality: 85 }).toFile(path.join(root, `images/hero-${width}.webp`));
for (const file of (await readdir(path.join(root, 'Ранги'))).filter(f => f.endsWith('.webp'))) {
  if (file === 'rising.webp') {
    await sharp(path.join(root, 'Ранги', file)).resize({ width: 768, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(root, 'images/ranks', file));
  } else {
    await sharp(path.join(root, 'Ранги', file)).resize(160, 160, { fit: 'contain', background: '#00000000' }).webp({ quality: 82 }).toFile(path.join(root, 'images/ranks', file));
  }
}
const names = new Set();
for (const folder of ['', 'js', 'styles']) {
  for (const file of (await readdir(path.join(root, folder))).filter(f => /\.(?:html|js|css)$/.test(f))) {
    const content = await readFile(path.join(root, folder, file), 'utf8');
    for (const match of content.matchAll(/\bfa-([a-z][a-z0-9-]+)\b/g)) names.add(match[1]);
  }
}
const definitions = new Map();
for (const definition of [...Object.values(solid), ...Object.values(brands)]) {
  if (!definition?.icon || !definition?.iconName) continue;
  for (const name of [definition.iconName, ...definition.icon[2].filter(alias => typeof alias === 'string')]) definitions.set(name, definition);
}
let css = '/* Font Awesome Free 6.4.2, icons CC BY 4.0. Generated subset; no webfont downloads. */\n.fas,.far,.fab,.fa-solid,.fa-regular,.fa-brands{display:inline-block;font-style:normal;line-height:1;text-rendering:auto;-webkit-font-smoothing:antialiased}\n.fas::before,.far::before,.fab::before,.fa-solid::before,.fa-regular::before,.fa-brands::before{content:"";display:inline-block;width:1em;height:1em;background-color:currentColor;mask:var(--fa-icon) center/contain no-repeat;-webkit-mask:var(--fa-icon) center/contain no-repeat;vertical-align:-.1em}\n';
const missing = [];
for (const name of [...names].sort()) {
  const def = definitions.get(name);
  if (!def) { if (!['solid','regular','brands','spin','pulse','fw','lg','xl','2x','3x','circle-o-notch'].includes(name)) missing.push(name); continue; }
  const [width, height, , , paths] = def.icon;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${[paths].flat().map(d => `<path d="${d}"/>`).join('')}</svg>`;
  css += `.fa-${name}{--fa-icon:url("data:image/svg+xml,${encodeURIComponent(svg)}")}\n`;
}
css += '.fa-spin{animation:fa-spin 2s linear infinite}.fa-fw{width:1.25em;text-align:center}@keyframes fa-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.fa-spin{animation:none}}\n';
await writeFile(path.join(root, 'styles/icons.css'), css);
await writeFile(path.join(root, 'images/ICON-LICENSE.txt'), 'Font Awesome Free 6.4.2 by Fonticons, Inc.\nIcons licensed under Creative Commons Attribution 4.0: https://creativecommons.org/licenses/by/4.0/\nSource: https://github.com/FortAwesome/Font-Awesome/tree/6.4.2\nSource SVG paths retained without modification in styles/icons.css.\n');
for (const lang of ['ru', 'en']) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="bg"><stop stop-color="#061220"/><stop offset="1" stop-color="#12375a"/></linearGradient></defs><rect width="1200" height="630" fill="url(#bg)"/><rect x="70" y="78" width="64" height="64" rx="18" fill="#00ff9d"/><path d="M86 106l16-14 16 14v22h-32z" fill="#061220"/><text x="162" y="125" fill="#f5f6f7" font-family="Segoe UI,sans-serif" font-size="44" font-weight="700">MLBB BOOST</text><text x="70" y="285" fill="#f5f6f7" font-family="Segoe UI,sans-serif" font-size="76" font-weight="700">Mobile Legends</text><text x="70" y="374" fill="#00ff9d" font-family="Segoe UI,sans-serif" font-size="55" font-weight="700">${lang === 'ru' ? 'Буст · Пати · Калькулятор' : 'Rank Boost · Party · Calculator'}</text><line x1="70" y1="447" x2="1130" y2="447" stroke="#31516c"/><text x="70" y="518" fill="#c8d2df" font-family="Segoe UI,sans-serif" font-size="30">${lang === 'ru' ? 'Сравните форматы и рассчитайте свой маршрут' : 'Compare formats and calculate your rank route'}</text><text x="70" y="574" fill="#c8d2df" font-family="Segoe UI,sans-serif" font-size="25">boostmlbb.ru</text></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(root, `images/social-${lang}.png`));
}
console.log(`Generated responsive hero, 11 rank images, social cards and ${names.size - missing.length} icon selectors. Missing icons: ${missing.join(', ') || 'none'}`);
