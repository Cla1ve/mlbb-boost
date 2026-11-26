// Collects every MLBB skin into content/skins.json and downloads the missing pictures.
// Sources:
//  - MLBBDex public JSON API (https://mlbbdex.com/api/v1/, data from the Mobile Legends Wiki, CC BY-SA):
//    the skin list per hero with the game skin id, name, release, availability, rarity, series and price, plus the
//    skin card art (240x390) and the splash art (1280x720) for most skins. It is fresher than the wiki module.
//  - Mobile Legends Wiki on Fandom, Module:Skin/data (MediaWiki API): what a skin changes ("feature") and the painted
//    (recoloured) versions of a skin. Optional: the build keeps the previous values when the wiki does not answer.
// Pictures go to images/skins/cards/<hero>/<skin>.webp (previews, re-encoded smaller) and images/skins/art/<hero>/<skin>.webp
// (the splash art byte for byte as MLBBDex serves it: it is the full-screen view, so it is not compressed again).
// Usage: node scripts/skins-data.mjs [--no-images] [--if-stale <days>] [--if-new]
//   --if-new: one request to the list of the latest skins; the full refresh runs only when one of them is not here yet.
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'content/skins.json');
const DEX = 'https://mlbbdex.com';
const WIKI = 'https://mobile-legends.fandom.com/api.php';
const UA = 'BoostMLBB-site/1.0 (+https://boostmlbb.ru; skins catalog, polite crawler)';
const args = process.argv.slice(2);
const noImages = args.includes('--no-images');
const staleAt = args.indexOf('--if-stale');
const ifNew = args.includes('--if-new');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const exists = file => access(file).then(() => true, () => false);
// Hero slugs that differ between MLBBDex and this site.
const SLUG = { 'chang-e': 'change' };

let previous = null;
try { previous = JSON.parse(await readFile(OUT, 'utf8')); } catch {}
if (staleAt >= 0 && previous?.updated) {
  const days = Number(args[staleAt + 1] || 7);
  if (Date.now() - Date.parse(previous.updated) < days * 864e5) { console.log(`Skins are fresher than ${days} days, nothing to do.`); process.exit(0); }
}

async function get(url, type = 'json', tries = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': UA, Accept: type === 'json' ? 'application/json' : '*/*' } });
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      if (type === 'json') return await response.json();
      const buffer = Buffer.from(await response.arrayBuffer());
      if (/text\/html/.test(response.headers.get('content-type') || '')) throw new Error(`HTML instead of a picture: ${url}`);
      return buffer;
    } catch (error) {
      if (attempt >= tries) throw error;
      await sleep(2000 * attempt);
    }
  }
}

// Daily check: MLBBDex lists the newest skins at /api/v1/skins; nothing new there means nothing to refresh.
if (ifNew && previous?.heroes) {
  const known = new Set(Object.entries(previous.heroes).flatMap(([slug, skins]) => skins.map(skin => `${slug}:${skin.id}`)));
  const latest = await get(`${DEX}/api/v1/skins`).then(json => json.data || []).catch(() => []);
  const fresh = latest.filter(skin => !known.has(`${SLUG[skin.hero] || skin.hero}:${skin.id}`));
  if (!fresh.length) { console.log(`No new skins among the latest ${latest.length}.`); process.exit(0); }
  console.log(`New skins: ${fresh.map(skin => `${skin.hero} ${skin.name}`).join(', ')}.`);
}

// ---------- The wiki module: features and painted skins ----------
const norm = text => String(text || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');
let wiki = null;
try {
  const url = `${WIKI}?action=query&prop=revisions&rvprop=content&rvslots=main&titles=${encodeURIComponent('Module:Skin/data')}&format=json&formatversion=2`;
  const lua = (await get(url)).query.pages[0].revisions[0].slots.main.content;
  const json = lua.replace(/^[\s\S]*?return\s*/, '').replace(/--[^\n]*/g, '')
    .replace(/\[\s*"((?:[^"\\]|\\.)*)"\s*\]\s*=/g, (_, key) => JSON.stringify(key) + ':')
    .replace(/\[\s*(\d+)\s*\]\s*=/g, '"$1":').replace(/\bnil\b/g, 'null').replace(/,(\s*[}\]])/g, '$1');
  wiki = JSON.parse(json);
  console.log(`Wiki module: ${Object.keys(wiki).length} heroes.`);
} catch (error) {
  console.warn(`Wiki module unavailable (${error.message}); keeping the previous features and painted skins.`);
}
const wikiHero = name => wiki && (wiki[name] || Object.entries(wiki).find(([key]) => norm(key) === norm(name))?.[1]);
const features = text => String(text || '').split(/\s*,\s*/).map(part => part.trim()).filter(Boolean);
const cleanPrice = price => Object.fromEntries(Object.entries(price || {}).map(([key, value]) => [key, String(value ?? '').trim()]).filter(([, value]) => value));

// ---------- MLBBDex ----------
const list = (await get(`${DEX}/api/v1/heroes`)).data;
const heroes = {};
let cards = 0, arts = 0, fetched = 0;
const queue = [];
for (const entry of list) {
  await sleep(1200);
  const hero = (await get(`${DEX}/api/v1/heroes/${entry.slug}`)).data;
  const slug = SLUG[hero.slug] || hero.slug;
  const old = Object.fromEntries((previous?.heroes?.[slug] || []).map(skin => [skin.id, skin]));
  const wikiData = wikiHero(hero.name);
  const wikiSkins = Object.values(wikiData?.skins || {});
  const wikiPainted = Object.values(wikiData?.['painted-skins'] || {});
  const used = new Set();
  const skins = hero.skins.filter(skin => skin.released !== false).map((skin, index) => {
    const file = hero.images?.skins?.[skin.id] || '';
    const skinSlug = (file.match(/\/\d+-([a-z0-9-]+)\.webp$/)?.[1] || norm(skin.name) || skin.id).replace(/^-+|-+$/g, '');
    let unique = skinSlug, n = 2;
    while (used.has(unique)) unique = `${skinSlug}-${n++}`;
    used.add(unique);
    const fromWiki = wikiSkins.find(row => norm(row.name) === norm(skin.name)) || wikiSkins.find(row => row.id === skin.id);
    // The default look: MLBBDex gives the hero's title, which is the default skin's name (Kalea: Surging Wave). Long ids sort
    // before short ones in its list, so the first skin is not always the default one.
    const base = norm(skin.name) === norm(hero.title) || (!hero.skins.some(other => norm(other.name) === norm(hero.title)) && index === 0 && !skin.rarity && !skin.label);
    // Painted versions: the wiki keeps them under the id of the skin they recolour.
    const painted = wiki ? wikiPainted.filter(row => row.id && (row.id === skin.id || row.id === fromWiki?.id)).map(row => ({ en: row.name, release: row.release || '', price: cleanPrice(row.price) })) : (old[skin.id]?.painted || []);
    const illustration = hero.illustrations?.[skin.name] || '';
    const record = {
      id: skin.id, slug: unique, en: skin.name, base,
      release: String(skin.release || '').replace(/-XX/g, ''), availability: skin.availability || '',
      tier: skin.rarity || '', series: skin.label || '', price: cleanPrice(skin.price),
      features: wiki ? features(fromWiki?.feature) : (old[skin.id]?.features || []),
      painted
    };
    if (file) queue.push({ url: DEX + file, out: `images/skins/cards/${slug}/${unique}.webp`, kind: 'card' });
    if (illustration) queue.push({ url: DEX + illustration, out: `images/skins/art/${slug}/${unique}.webp`, kind: 'art' });
    record.card = Boolean(file);
    record.art = Boolean(illustration);
    return record;
  });
  // The default look without a splash on MLBBDex: the official MOONTON wallpaper of the default skin ("skin00") from the
  // in-game Academy data (Rone API), straight from MOONTON's CDN. Used for the banner of the hero's skins page.
  const base = skins.find(skin => skin.base);
  const baseFile = base && `images/skins/art/${slug}/${base.slug}.webp`;
  if (base && !base.art && !noImages) {
    if (await exists(path.join(root, baseFile))) base.art = true;
    else {
      try {
        await sleep(800);
        const records = (await get(`https://arena.rone.dev/api/heroes/${entry.slug}/wallpapers`)).data?.records || [];
        const wallpaper = records.find(row => row.data?.skinid === 'skin00');
        const picture = wallpaper?.data?.pictures?.find(row => row.resolution === '1920x1080');
        const direct = picture && new URL(picture.url).searchParams.get('url');
        if (direct) queue.push({ url: direct, out: baseFile, kind: 'wallpaper' });
        base.art = Boolean(direct);
      } catch (error) {
        console.warn(`No default wallpaper for ${slug}: ${error.message}`);
      }
    }
  }
  heroes[slug] = skins;
  fetched++;
  if (fetched % 20 === 0) console.log(`${fetched}/${list.length} heroes`);
}

// ---------- Pictures: only the missing ones ----------
if (!noImages) {
  const missing = [];
  for (const job of queue) if (!(await exists(path.join(root, job.out)))) missing.push(job);
  console.log(`Pictures: ${queue.length} known, ${missing.length} to download.`);
  let done = 0, failed = 0;
  const worker = async () => {
    while (missing.length) {
      const job = missing.shift();
      try {
        const buffer = await get(job.url, 'bin');
        const target = path.join(root, job.out);
        await mkdir(path.dirname(target), { recursive: true });
        // Cards keep their 240x390 size at WebP quality 78 (MLBBDex serves them at ~35 KB); splash art is saved untouched.
        // MOONTON wallpapers come as 1920x1080 JPEG: WebP at a high quality keeps the detail at a third of the size.
        const output = job.kind === 'art' ? buffer : job.kind === 'wallpaper' ? await sharp(buffer).webp({ quality: 85, effort: 5 }).toBuffer() : await sharp(buffer).webp({ quality: 78, effort: 6 }).toBuffer();
        await writeFile(target, output);
        job.kind === 'card' ? cards++ : arts++;
      } catch (error) {
        failed++;
        console.warn(`Skipped ${job.url}: ${error.message}`);
      }
      if (++done % 100 === 0) console.log(`${done} pictures`);
      await sleep(350);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  console.log(`Downloaded ${cards} cards and ${arts} splash arts and wallpapers, ${failed} failed.`);
}
// A record points to a picture only when the file is really there.
for (const [slug, skins] of Object.entries(heroes)) for (const skin of skins) {
  skin.card = skin.card && await exists(path.join(root, `images/skins/cards/${slug}/${skin.slug}.webp`));
  skin.art = skin.art && await exists(path.join(root, `images/skins/art/${slug}/${skin.slug}.webp`));
}

const total = Object.values(heroes).reduce((sum, skins) => sum + skins.filter(skin => !skin.base).length, 0);
const data = {
  updated: new Date().toISOString().slice(0, 10),
  sources: {
    list: 'MLBBDex API (mlbbdex.com/api/v1), data from the Mobile Legends Wiki, CC BY-SA',
    details: 'Mobile Legends Wiki (mobile-legends.fandom.com), Module:Skin/data, CC BY-SA',
    art: 'MOONTON artwork via MLBBDex'
  },
  total,
  heroes: Object.fromEntries(Object.entries(heroes).sort(([a], [b]) => a.localeCompare(b)))
};
// Keep the date when nothing but the date would change, so the daily job does not commit an empty update.
if (previous && JSON.stringify({ ...previous, updated: '' }) === JSON.stringify({ ...data, updated: '' })) data.updated = previous.updated;
await writeFile(OUT, JSON.stringify(data, null, 1) + '\n');
console.log(`content/skins.json: ${Object.keys(heroes).length} heroes, ${total} skins.`);
