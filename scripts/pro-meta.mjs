// Professional-scene draft statistics for the tier list (internal calculation, not shown as such in the UI).
//
// Source: Liquipedia Mobile Legends (CC BY-SA), public MediaWiki API with an identifying User-Agent, gzip and the
// documented rate limit for cheap queries (one request per 2 s; this script never uses the 30 s "parse" action).
//
// What it does
// 1. Finds tournaments of tier S, A and B ({{TournamentsList}}) with a prize pool of $10,000 or more that ended in the
//    last 30 days. If too few games qualify, the prize threshold steps down (10k, 5k, 2.5k, 1k).
// 2. Reads the wikitext of every stage page of those tournaments, one batched request per tournament, and extracts every
//    played game: date, ten picks, ten bans, winner. The window is made of games, not tournaments: only games played in the
//    last 30 days count.
// 3. Caches every tournament in content/pro-meta/<id>.json. A finished tournament never changes, so it is fetched once;
//    a running one (or one that ended in the last two days) is fetched again at most once a day.
// 4. Writes content/pro-meta.json: per hero, the weighted share of games in which the hero was drafted (picked or banned).
//    Game weight = tier of the tournament x recency (half-life 12 days).
//
// Usage: node scripts/pro-meta.mjs [--discover] [--force]
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const API = 'https://liquipedia.net/mobilelegends/api.php';
const AGENT = 'mlbb-meta-research/1.0 (tournament draft statistics; low request rate; non-commercial)';
const CACHE_DIR = path.join(root, 'content/pro-meta');
const OUT = path.join(root, 'content/pro-meta.json');
const args = process.argv.slice(2);
const flag = name => args.includes(name);

export const PRIZE_STEPS = [10000, 5000, 2500, 1000];
export const WINDOW_DAYS = 30;                           // only games played in the last month
const MIN_GAMES = 150;                                   // below this the prize threshold steps down
const TIER_WEIGHT = { 1: 1, 2: 0.7, 3: 0.45 };           // S, A, B
const HALF_LIFE_DAYS = 12;
const SKIP_PAGE = /statistics|qualif|results|prize|teams|rosters/i;
const EXCLUDE = /women|academy|collegiate|showmatch/i;
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const MONTH_NAMES = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

let lastCall = 0;
async function call(params) {
  const wait = lastCall + 2500 - Date.now();
  if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    lastCall = Date.now();
    const response = await fetch(url, { headers: { 'user-agent': AGENT, 'accept-encoding': 'gzip' } });
    if (response.status === 429 || response.status >= 500) { await new Promise(resolve => setTimeout(resolve, 60000 * attempt)); continue; }
    if (!response.ok) throw new Error(`Liquipedia ${response.status} for ${params.action}`);
    const json = await response.json();
    if (json.error) throw new Error(`Liquipedia error: ${json.error.code}`);
    return json;
  }
  throw new Error('Liquipedia is rate limiting this client; try again later');
}

// "Aug 04–09, 2026", "Jul 01 – Aug 01, 2026", "Dec 29, 2025 – Jan 04, 2026"
export function parseRange(text) {
  const clean = text.replace(/&nbsp;| /g, ' ').replace(/<[^>]+>/g, '').trim();
  const year = Number((clean.match(/(20\d\d)\s*$/) || [])[1]);
  const [left, right] = clean.split(/\s*[–—-]\s*/);
  if (!year || !left) return null;
  const startMonth = MONTHS[left.trim().slice(0, 3).toLowerCase()];
  const startDay = Number((left.match(/\b(\d{1,2})\b/) || [])[1]);
  const startYear = Number((left.match(/(20\d\d)/) || [])[1]) || year;
  let endMonth = startMonth, endDay = startDay, endYear = year;
  if (right) {
    const monthName = right.trim().slice(0, 3).toLowerCase();
    if (MONTHS[monthName] !== undefined) endMonth = MONTHS[monthName];
    endDay = Number((right.match(/\b(\d{1,2})\b/) || [])[1]) || endDay;
    endYear = Number((right.match(/(20\d\d)/) || [])[1]) || year;
  }
  const iso = (y, m, d) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
  return { start: iso(startYear, startMonth, startDay), end: iso(endYear, endMonth, endDay) };
}

async function discover(today) {
  const found = new Map();
  const years = today.getUTCMonth() < 2 ? [today.getUTCFullYear(), today.getUTCFullYear() - 1] : [today.getUTCFullYear()];
  for (const year of years) {
    for (const tier of [1, 2, 3]) {
      const { expandtemplates } = await call({ action: 'expandtemplates', prop: 'wikitext', text: `{{TournamentsList|tier=${tier}|tiertype=none|year=${year}}}` });
      for (const row of expandtemplates.wikitext.split('<tr class="table2__row--body">').slice(1)) {
        const link = row.match(/column__tournament"[^>]*>\[\[([^\]|]+)\|([^\]]+)\]\]/);
        const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(match => match[1]);
        const plain = cell => cell.replace(/<[^>]+>/g, '');
        const dateCell = cells.find(cell => /\b(20\d\d)\b/.test(plain(cell)) && /[A-Za-z]{3}\s+\d/.test(plain(cell)) && !/\[\[/.test(cell));
        const prizeCell = cells.find(cell => /^\s*\$[\d,]+/.test(plain(cell)));
        if (!link || !dateCell) continue;
        const range = parseRange(dateCell);
        const prize = prizeCell ? Number(plain(prizeCell).replace(/[^\d]/g, '')) : 0;
        if (!range || prize < PRIZE_STEPS.at(-1)) continue;
        const page = link[1].replace(/_/g, ' ');
        found.set(page, { page, name: link[2], tier, prize, ...range });
      }
    }
  }
  return [...found.values()].filter(item => !EXCLUDE.test(item.name)).sort((a, b) => b.end.localeCompare(a.end));
}

// "November 4, 2026 - 14:30 {{Abbr/ICT}}" -> "2026-11-04"
function parseMatchDate(text) {
  const match = String(text).match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(20\d\d)/);
  if (!match) return null;
  const month = MONTH_NAMES.indexOf(match[1].toLowerCase());
  return month < 0 ? null : new Date(Date.UTC(Number(match[3]), month, Number(match[2]))).toISOString().slice(0, 10);
}

// Every {{Map ...}} with ten picks and ten bans, dated by the closest |date= above it.
export function parseGames(wikitext) {
  const games = [];
  let date = null;
  const scan = /\|\s*date\s*=\s*([^\n|]*)|\{\{Map([\s\S]*?)\}\}/g;
  for (const match of wikitext.matchAll(scan)) {
    if (match[1] !== undefined) { date = parseMatchDate(match[1]) || date; continue; }
    const body = match[2];
    const field = key => (body.match(new RegExp(`\\|\\s*${key}\\s*=\\s*([^\\n|]*)`)) || [])[1]?.trim().toLowerCase() || '';
    const picks = [], bans = [];
    for (const team of [1, 2]) for (let i = 1; i <= 5; i++) { picks.push(field(`t${team}h${i}`)); bans.push(field(`t${team}b${i}`)); }
    if (!date || picks.some(name => !name) || bans.some(name => !name)) continue;
    games.push({ d: date, p: picks, b: bans, w: Number(field('winner')) || 0 });
  }
  return games;
}

const clean = name => { const key = String(name).toLowerCase().replace(/[^a-z0-9]/g, ''); return key && key !== 'none' ? key : ''; };
const slugify = text => text.toLowerCase().replace(/[^a-z0-9]/g, '');
async function readJson(file, fallback = null) { try { return JSON.parse(await readFile(file, 'utf8')); } catch { return fallback; } }
const idOf = page => page.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const daysBetween = (a, b) => (new Date(a) - new Date(b)) / 864e5;

async function loadGames(item, today, todayIso) {
  const id = idOf(item.page);
  const file = path.join(CACHE_DIR, `${id}.json`);
  const cached = await readJson(file);
  const running = item.end >= todayIso || daysBetween(todayIso, item.end) <= 2;
  if (cached && (flag('--recompute') || (!flag('--force') && !(running && cached.fetchedAt.slice(0, 10) !== todayIso)))) return cached;
  if (false && !(running && cached.fetchedAt.slice(0, 10) !== todayIso)) return cached;
  const { query: { prefixsearch } } = await call({ action: 'query', list: 'prefixsearch', pssearch: `${item.page}/`, pslimit: '30' });
  const titles = [item.page, ...prefixsearch.map(entry => entry.title)].filter((title, index, all) => all.indexOf(title) === index && !SKIP_PAGE.test(title.slice(item.page.length)));
  const games = [];
  for (let from = 0; from < titles.length; from += 8) {
    const { query: { pages } } = await call({ action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', titles: titles.slice(from, from + 8).join('|') });
    for (const page of pages) if (page.revisions) games.push(...parseGames(page.revisions[0].slots.main.content));
  }
  const entry = { id, page: item.page, name: item.name, tier: item.tier, prize: item.prize, start: item.start, end: item.end, fetchedAt: today.toISOString(), games };
  await writeFile(file, JSON.stringify(entry) + '\n');
  return entry;
}

async function main() {
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  await mkdir(CACHE_DIR, { recursive: true });
  const previous = await readJson(OUT, null);
  // A week-old file is good enough: skip the network entirely.
  if (!flag('--force') && !flag('--discover') && !flag('--recompute') && previous && daysBetween(todayIso, previous.updated.slice(0, 10)) < 6) {
    console.log(`pro-meta: data from ${previous.updated.slice(0, 10)} is fresh, skipped`);
    return;
  }
  const cutoff = new Date(today.getTime() - WINDOW_DAYS * 864e5).toISOString().slice(0, 10);
  const candidates = (await discover(today)).filter(item => item.start <= todayIso && item.end >= cutoff);
  console.log(`pro-meta: ${candidates.length} tournaments ended since ${cutoff}`);
  if (flag('--discover')) { for (const item of candidates) console.log(`  T${item.tier} ${item.start}..${item.end}  $${item.prize}  ${item.name}`); return; }

  // Raise the pool of tournaments step by step until enough games are in the window.
  let chosen = [], prizeUsed = PRIZE_STEPS[0], windowGames = [];
  for (const step of PRIZE_STEPS) {
    prizeUsed = step;
    chosen = [];
    windowGames = [];
    for (const item of candidates.filter(candidate => candidate.prize >= step)) {
      const entry = await loadGames(item, today, todayIso);
      const inWindow = entry.games.filter(game => game.d >= cutoff && game.d <= todayIso);
      if (!inWindow.length) continue;
      chosen.push({ ...item, games: inWindow.length });
      windowGames.push(...inWindow.map(game => ({ ...game, tier: item.tier })));
    }
    console.log(`  prize >= $${step}: ${chosen.length} tournaments, ${windowGames.length} games`);
    if (windowGames.length >= MIN_GAMES) break;
  }
  if (windowGames.length < 40) throw new Error(`only ${windowGames.length} games in the window; keeping the previous file`);

  const heroesFile = await readJson(path.join(root, 'content/heroes.json'));
  const bySlug = Object.fromEntries(heroesFile.heroes.flatMap(hero => [[slugify(hero.en), hero.slug], [slugify(hero.slug), hero.slug]]));
  // Liquipedia often writes short forms (esme, paqu, obsi): exact name, a few fixed aliases, then a unique prefix.
  const aliases = { changee: 'change', popol: 'popol-and-kupa', popolkupa: 'popol-and-kupa', xb: 'x-borg', yz: 'yu-zhong', yss: 'yi-sun-shin', zx: 'zhuxin', val: 'valir', lapu: 'lapu-lapu', pove: 'phoveus', ls: 'lesley' };
  const keys = Object.keys(bySlug);
  const slugOf = name => {
    const key = slugify(name);
    if (!key || key === 'none') return null;
    if (bySlug[key]) return bySlug[key];
    if (aliases[key]) return aliases[key];
    const matches = new Set(keys.filter(candidate => key.length >= 3 && candidate.startsWith(key)).map(candidate => bySlug[candidate]));
    return matches.size === 1 ? [...matches][0] : null;
  };

  const heroes = Object.fromEntries(heroesFile.heroes.map(hero => [hero.slug, { presence: 0, pick: 0, ban: 0, win: null, games: 0, picks: 0, wins: 0 }]));
  const unknown = new Set();
  let total = 0;
  for (const game of windowGames) {
    const age = Math.max(0, daysBetween(todayIso, game.d));
    const weight = (TIER_WEIGHT[game.tier] ?? 0.4) * 0.5 ** (age / HALF_LIFE_DAYS);
    total += weight;
    // A hero counts once per game: picked, or else banned (both teams may ban the same hero).
    const picked = new Map();
    game.p.forEach((name, index) => { const slug = slugOf(name); if (slug) picked.set(slug, index < 5 ? 1 : 2); else if (clean(name)) unknown.add(name); });
    const banned = new Set();
    for (const name of game.b) { const slug = slugOf(name); if (slug && !picked.has(slug)) banned.add(slug); else if (!slug && clean(name)) unknown.add(name); }
    for (const [slug, side] of picked) {
      const hero = heroes[slug];
      hero.pick += weight; hero.presence += weight; hero.picks++; hero.games++;
      if (game.w && game.w === side) hero.wins++;
    }
    for (const slug of banned) { heroes[slug].ban += weight; heroes[slug].presence += weight; heroes[slug].games++; }
  }
  const pct = value => Math.round(value / total * 10000) / 100;
  for (const hero of Object.values(heroes)) {
    hero.presence = pct(hero.presence); hero.pick = pct(hero.pick); hero.ban = pct(hero.ban);
    hero.win = hero.picks >= 5 ? Math.round(hero.wins / hero.picks * 10000) / 100 : null;
    delete hero.wins;
  }
  if (unknown.size) console.warn(`pro-meta: unmatched hero names: ${[...unknown].join(', ')}`);
  const unused = Object.values(heroes).filter(hero => hero.presence === 0).length;
  const output = {
    updated: today.toISOString(), source: 'Liquipedia Mobile Legends (CC BY-SA)', windowDays: WINDOW_DAYS, windowStart: cutoff, minPrize: prizeUsed,
    games: windowGames.length, tournaments: chosen.map(item => ({ name: item.name, tier: item.tier, prize: item.prize, end: item.end, games: item.games })), unused, heroes
  };
  await writeFile(OUT, JSON.stringify(output, null, 1) + '\n');
  console.log(`pro-meta: ${windowGames.length} games from ${chosen.length} tournaments since ${cutoff}, ${unused} heroes never drafted`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
