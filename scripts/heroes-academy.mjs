// Builds, skills, allies and skill order for every hero from the Rone Arena API (https://arena.rone.dev,
// ridwaanhall / RoneAI, BSD-3), which serves data from MOONTON's public game services (in-game Academy).
// Writes content/heroes-academy.json and caches small WebP icons in images/mlbb/.
// Usage: node scripts/heroes-academy.mjs [--force]   (skips if the data is younger than 3 days)
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://arena.rone.dev/api';
const OUT = path.join(root, 'content', 'heroes-academy.json');
const LANE_API = { 'EXP Lane': 'exp', 'Gold Lane': 'gold', 'Mid Lane': 'mid', Jungle: 'jungle', Roam: 'roam' };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const norm = text => String(text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const plain = html => String(html || '').replace(/<[^>]+>/g, '').replace(/\[[A-Z0-9]{2}/g, '').replace(/\]/g, '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
const cdn = url => { try { const u = new URL(url); return u.hostname === 'wsrv.nl' ? u.searchParams.get('url') : url; } catch { return url; } };

async function get(pathname, tries = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(API + pathname, { headers: { 'User-Agent': 'boostmlbb.ru hero pages (contact via site)' }, signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.code !== 0) throw new Error(json.message || 'API error');
      await sleep(250);
      return json.data;
    } catch (error) {
      if (attempt >= tries) throw new Error(`${pathname}: ${error.message}`);
      await sleep(1500 * attempt);
    }
  }
}

async function icon(url, dir, name) {
  if (!url) return null;
  const rel = `/images/mlbb/${dir}/${name}.webp`;
  const file = path.join(root, rel);
  try { await access(file); return rel; } catch {}
  try {
    const response = await fetch(cdn(url), { signal: AbortSignal.timeout(30000) });
    if (!response.ok) return null;
    await mkdir(path.dirname(file), { recursive: true });
    await sharp(Buffer.from(await response.arrayBuffer())).resize(64, 64, { fit: 'cover' }).webp({ quality: 82 }).toFile(file);
    return rel;
  } catch { return null; }
}

const force = process.argv.includes('--force');
try {
  const previous = JSON.parse(await readFile(OUT, 'utf8'));
  if (!force && Date.now() - Date.parse(previous.updated) < 3 * 864e5) { console.log(`heroes-academy: data from ${previous.updated} is fresh, skipped`); process.exit(0); }
} catch {}

const ours = JSON.parse(await readFile(path.join(root, 'content', 'heroes.json'), 'utf8')).heroes;
const names = JSON.parse(await readFile(path.join(root, 'content', 'mlbb-names-ru.json'), 'utf8'));

const list = (await get('/heroes?size=200')).records.map(r => ({ id: r.data.hero_id, en: r.data.hero.data.name }));
const idBySlug = {};
for (const hero of ours) {
  const match = list.find(h => norm(h.en) === norm(hero.en));
  if (match) idBySlug[hero.slug] = match.id;
}
const slugById = Object.fromEntries(Object.entries(idBySlug).map(([slug, id]) => [id, slug]));
const missing = ours.filter(h => !idBySlug[h.slug]).map(h => h.en);
if (missing.length > 5) throw new Error(`too many heroes not found in the API: ${missing.join(', ')}`);

const items = {}, spells = {}, talents = {}, emblems = {};
for (const r of (await get('/academy/equipment?size=500')).records) {
  const d = r.data;
  items[d.equipid] = { en: d.equipname, ru: names.items[d.equipname] || d.equipname, iconUrl: d.equipicon };
}
for (const r of (await get('/academy/spells?size=100')).records) {
  const d = r.data.__data || r.data;
  spells[d.skillid] = { en: d.skillname, ru: names.spells[d.skillname] || d.skillname, iconUrl: d.skillicon };
}
for (const r of (await get('/academy/emblems?size=100')).records) {
  const d = r.data;
  talents[d.giftid] = { en: d.emblemskill.skillname, ru: names.talents[d.emblemskill.skillname] || d.emblemskill.skillname, tier: d.gifttiers, iconUrl: d.emblemskill.skillicon };
}

const heroes = {};
let done = 0;
for (const hero of ours) {
  const id = idBySlug[hero.slug];
  if (!id) continue;
  try {
    const detail = {};
    for (const lang of ['ru', 'en']) detail[lang] = (await get(`/heroes/${id}?lang=${lang}`)).records[0].data;
    const info = detail.ru.hero.data;
    const lane = LANE_API[hero.lanes?.[0]] || 'exp';
    const buildRecords = (await get(`/academy/heroes/${id}/builds?lane=${lane}&rank=all&size=1`)).records;
    const builds = (buildRecords[0]?.data.build || []).slice(0, 3).map(b => {
      const emblem = b.emblem?.data;
      if (emblem) emblems[emblem.emblemid] = { en: emblem.emblemname === 'All' ? 'Common' : emblem.emblemname, ru: names.emblems[emblem.emblemname] || emblem.emblemname, iconUrl: emblem.attriicon };
      return { items: b.equipid, emblem: emblem?.emblemid, talents: b.new_rune_skill, spell: b.battleskillid || b.skillid, win: +(b.build_win_rate * 100).toFixed(2), pick: +(b.build_pick_rate * 100).toFixed(2) };
    });
    const mates = (await get(`/academy/heroes/${id}/teammates?rank=all&size=1`)).records[0]?.data.sub_hero || [];
    const allies = mates.filter(m => slugById[m.heroid] && m.increase_win_rate > 0).sort((a, b) => b.increase_win_rate - a.increase_win_rate).slice(0, 4)
      .map(m => ({ slug: slugById[m.heroid], plus: +(m.increase_win_rate * 100).toFixed(2), win: +(m.hero_win_rate * 100).toFixed(2) }));
    const skills = {};
    for (const lang of ['ru', 'en']) {
      const list = detail[lang].hero.data.heroskilllist?.[0]?.skilllist || [];
      skills[lang] = [];
      for (const [index, s] of list.entries()) {
        let tags = [];
        try { tags = JSON.parse(String(s.skilltag || '[]').replace(/'/g, '"')).map(t => t.tagname); } catch {}
        skills[lang].push({ name: s.skillname, cd: String(s['skillcd&cost'] || '').replace(/^CD:\s*/i, '').trim(), tags, desc: plain(s.skilldesc), icon: lang === 'ru' ? await icon(s.skillicon, 'skills', `${hero.slug}-${index}`) : `/images/mlbb/skills/${hero.slug}-${index}.webp` });
      }
    }
    heroes[hero.slug] = {
      id, lane, builds, allies, skills,
      order: info.recommendlevel || [],
      ability: (info.abilityshow || []).map(Number),
      speciality: { ru: detail.ru.hero.data.speciality || [], en: detail.en.hero.data.speciality || [] },
      story: { ru: plain(detail.ru.hero.data.story), en: plain(detail.en.hero.data.story) },
      lore: detail.ru.url || null
    };
  } catch (error) {
    console.warn(`heroes-academy: ${hero.en} skipped (${error.message})`);
  }
  if (++done % 20 === 0) console.log(`heroes-academy: ${done}/${ours.length}`);
}

const used = { items: new Set(), spells: new Set(), talents: new Set(), emblems: new Set() };
for (const h of Object.values(heroes)) for (const b of h.builds) {
  b.items.forEach(i => used.items.add(i)); b.talents.forEach(t => used.talents.add(t)); used.spells.add(b.spell); used.emblems.add(b.emblem);
}
const dict = {};
for (const [kind, source] of Object.entries({ items, spells, talents, emblems })) {
  dict[kind] = {};
  for (const key of used[kind]) {
    const entry = source[key];
    if (!entry) continue;
    const { iconUrl, ...rest } = entry;
    dict[kind][key] = { ...rest, icon: await icon(iconUrl, kind, key) };
  }
}

const count = Object.keys(heroes).length;
if (count < 120) throw new Error(`only ${count} heroes collected, not writing`);
const data = {
  updated: new Date().toISOString(),
  source: 'Rone Arena API (ridwaanhall / RoneAI), game data © MOONTON (in-game Academy)',
  ...dict,
  heroes
};
await writeFile(OUT, JSON.stringify(data, null, 1) + '\n');
console.log(`heroes-academy: ${count} heroes, ${Object.keys(dict.items).length} items, ${Object.keys(dict.talents).length} talents written`);
