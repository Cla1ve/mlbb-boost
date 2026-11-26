// "How to play" data for hero pages: official skill combos and win rate by match length, from the Rone Arena API
// (in-game Academy, MOONTON). Writes content/heroes-play.json. Combo texts are English in the source; Russian
// translations live in content/combos-ru.json keyed by a hash of the English text (a changed text shows no
// translation until it is added, never a stale one).
// Usage: node scripts/heroes-play.mjs [--force] [--from raw.json]   (skips if the data is younger than 7 days)
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://arena.rone.dev/api';
const OUT = path.join(root, 'content/heroes-play.json');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export const textHash = text => createHash('sha1').update(String(text).trim()).digest('hex').slice(0, 10);

// Skill pictures identify the skill: the combo list uses its own ids, the hero card lists skills in order.
const iconKey = url => {
  let value = String(url || '');
  try { const u = new URL(value); if (u.hostname === 'wsrv.nl') value = u.searchParams.get('url'); } catch {}
  return (value.match(/100_([a-f0-9]{32})/) || [])[1] || value.slice(-48);
};
export function toEntry(raw) {
  const position = new Map();
  for (const group of raw.skillIcons || []) group.forEach((skill, index) => { const key = iconKey(skill.icon); if (!position.has(key)) position.set(key, index); });
  const combos = (raw.combos || []).map(combo => {
    const title = String(combo.title || '').toLowerCase();
    const steps = (combo.skills || []).map(skill => {
      const at = position.get(iconKey(skill.icon));
      if (at !== undefined) return at;
      return String(skill.skillid || '').endsWith('00') ? 'attack' : null;
    }).filter(step => step !== null);
    return { type: title.includes('lan') ? 'lane' : title.includes('jung') ? 'jungle' : 'fight', steps, en: String(combo.desc || '').replace(/\s+/g, ' ').trim() };
  }).filter(combo => combo.steps.length > 1 && combo.en);
  const timeline = (raw.timeline || []).map(row => [row.time_min, row.time_max ?? null, Math.round(row.win_rate * 1000) / 10]);
  return { combos, timeline };
}

async function get(pathname) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(API + pathname, { headers: { 'User-Agent': 'boostmlbb.ru hero pages (contact via site)' }, signal: AbortSignal.timeout(30000) }).catch(() => null);
    if (response?.ok) { const json = await response.json(); if (json.code === 0) return json.data; }
    if (response?.status === 429) throw new Error('rate limited');
    await sleep(2000 * attempt);
  }
  throw new Error(`${pathname}: no data`);
}

async function fetchRaw(academy) {
  const raw = {};
  for (const [slug, hero] of Object.entries(academy)) {
    const combos = await get(`/heroes/${hero.id}/skill-combos`);
    await sleep(900);
    const timeline = await get(`/academy/heroes/${hero.id}/win-rate/timeline?lane=${hero.lane}&rank=all`);
    await sleep(900);
    const detail = await get(`/heroes/${hero.id}?lang=en`);
    await sleep(900);
    raw[slug] = {
      combos: (combos.records || []).map(r => ({ title: r.data.title, desc: r.data.desc, skills: (r.data.skill_id || []).map(s => ({ skillid: s.data?.skillid, icon: s.data?.skillicon })) })),
      timeline: timeline.records?.[0]?.data?.time_win_rate || [],
      skillIcons: (detail.records[0].data.hero.data.heroskilllist || []).map(g => g.skilllist.map(s => ({ icon: s.skillicon })))
    };
  }
  return raw;
}

async function main() {
  const args = process.argv.slice(2);
  const from = args.includes('--from') ? args[args.indexOf('--from') + 1] : null;
  if (!from && !args.includes('--force')) {
    try {
      const previous = JSON.parse(await readFile(OUT, 'utf8'));
      if (Date.now() - Date.parse(previous.updated) < 7 * 864e5) { console.log(`heroes-play: data from ${previous.updated} is fresh, skipped`); return; }
    } catch {}
  }
  const academy = JSON.parse(await readFile(path.join(root, 'content/heroes-academy.json'), 'utf8')).heroes;
  const raw = from ? JSON.parse(await readFile(path.resolve(from), 'utf8')) : await fetchRaw(academy);
  const heroes = Object.fromEntries(Object.entries(raw).map(([slug, value]) => [slug, toEntry(value)]));
  const withData = Object.values(heroes).filter(h => h.combos.length && h.timeline.length).length;
  if (withData < 110) throw new Error(`only ${withData} heroes have combos and timings, keeping the previous file`);
  await writeFile(OUT, JSON.stringify({ updated: new Date().toISOString(), source: 'Rone Arena API (ridwaanhall / RoneAI), game data © MOONTON (in-game Academy)', heroes }) + '\n');
  console.log(`heroes-play: ${withData} heroes written`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
