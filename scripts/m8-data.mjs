// M8 World Championship: schedule, groups, results and participants from Liquipedia (CC BY-SA 3.0).
// Writes content/m8.json, used by the live block on /news/m8-istanbul-world-road/.
//
// One request reads all four event pages, a second expands team names. Same identified client and pace as
// scripts/pro-meta.mjs. Without --event the script writes only when something changed.
// Usage: node scripts/m8-data.mjs [--force] [--if-window] [--event "M7 World Championship" --out file.json]
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const API = 'https://liquipedia.net/mobilelegends/api.php';
const AGENT = 'mlbb-meta-research/1.0 (tournament draft statistics; low request rate; non-commercial)';
const OUT = path.join(root, 'content/m8.json');
// The frequent workflow only works while the event is near or running.
export const WINDOW = ['2026-12-01', '2027-01-31'];
const OFFSETS = { ICT: '+07:00', TRT: '+03:00', MSK: '+03:00', PHT: '+08:00', WIB: '+07:00', MYT: '+08:00', CET: '+01:00', UTC: '+00:00' };
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

// ---------- wikitext ----------
const strip = text => text.replace(/<!--[\s\S]*?-->/g, '');

// Splits the body of a template at top-level "|" (nested {{…}} and [[…]] stay whole).
export function params(body) {
  const parts = [];
  let depth = 0, link = 0, from = 0;
  for (let i = 0; i < body.length; i++) {
    const two = body.slice(i, i + 2);
    if (two === '{{') { depth++; i++; } else if (two === '}}') { depth--; i++; }
    else if (two === '[[') { link++; i++; } else if (two === ']]') { link--; i++; }
    else if (body[i] === '|' && !depth && !link) { parts.push(body.slice(from, i)); from = i + 1; }
  }
  parts.push(body.slice(from));
  const named = {}, list = [];
  const [name, ...rest] = parts;
  for (const part of rest) {
    const eq = part.indexOf('=');
    const brace = part.indexOf('{{');
    if (eq > -1 && (brace === -1 || eq < brace)) named[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
    else list.push(part.trim());
  }
  return { name: name.trim(), named, list };
}

// Every template whose name matches, in order, with its position.
export function templates(text, wanted) {
  const found = [];
  const open = new RegExp(`\\{\\{\\s*(?:${wanted})\\s*(?=[|}\\n])`, 'g');
  for (let match; (match = open.exec(text));) {
    let depth = 0, i = match.index;
    for (; i < text.length; i++) {
      const two = text.slice(i, i + 2);
      if (two === '{{') { depth++; i++; }
      else if (two === '}}') { depth--; i++; if (!depth) break; }
    }
    found.push({ at: match.index, ...params(text.slice(match.index + 2, i - 1)) });
    open.lastIndex = match.index + 2;
  }
  return found;
}

export function parseDate(value) {
  const match = String(value).match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(20\d\d)(?:\s*-\s*(\d{1,2}):(\d{2}))?\s*(?:\{\{[Aa]bbr\/([A-Z]+)\}\})?/);
  if (!match) return null;
  const month = MONTHS.indexOf(match[1].toLowerCase());
  if (month < 0) return null;
  const pad = n => String(n).padStart(2, '0');
  const day = `${match[3]}-${pad(month + 1)}-${pad(match[2])}`;
  return match[4] ? { day, at: `${day}T${pad(match[4])}:${match[5]}:00${OFFSETS[match[6]] || '+00:00'}` } : { day, at: null };
}

const opponent = value => {
  const found = templates(String(value || ''), 'TeamOpponent')[0];
  if (!found) return { key: '', score: null };
  const key = (found.list[0] || '').trim();
  const score = found.named.score !== undefined && found.named.score !== '' ? Number(found.named.score) : null;
  return { key: key.toLowerCase() === 'tbd' ? '' : key.toLowerCase(), score: Number.isFinite(score) ? score : null };
};

export function parseMatch(source) {
  const match = templates(source, 'Match')[0];
  if (!match) return null;
  const data = match.named;
  const bo = Number(data.bestof) || 1;
  const a = opponent(data.opponent1), b = opponent(data.opponent2);
  let wins = [0, 0];
  // Every played game: winner, length, the ten picks and a recording when there is one.
  const games = [];
  for (let i = 1; i <= 9; i++) {
    const map = templates(String(data[`map${i}`] || ''), 'Map')[0]?.named;
    if (!map || map.finished === 'skip') continue;
    const winner = Number(map.winner);
    if (winner === 1 || winner === 2) wins[winner - 1]++;
    const side = team => [1, 2, 3, 4, 5].map(n => String(map[`t${team}h${n}`] || '').trim().toLowerCase()).filter(Boolean);
    const picks = [side(1), side(2)];
    if (!(winner === 1 || winner === 2) && !picks[0].length) continue;
    const vod = String(map.vod || '').trim();
    games.push({ w: winner === 1 || winner === 2 ? winner : 0, len: String(map.length || '').trim(), picks, vod: /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(vod) ? vod : '' });
  }
  if (a.score !== null && b.score !== null) wins = [a.score, b.score];
  const need = Math.floor(bo / 2) + 1;
  let winner = Number(data.winner) === 1 || Number(data.winner) === 2 ? Number(data.winner) : 0;
  if (!winner && wins[0] >= need) winner = 1;
  if (!winner && wins[1] >= need) winner = 2;
  const date = parseDate(data.date || '');
  return { bo, a: a.key, b: b.key, score: wins[0] || wins[1] ? wins : null, winner, at: date?.at || null, day: date?.day || null, ...(games.length ? { games } : {}) };
}

// Matches of every {{Matchlist}} on a page, keyed by the list id, with the record heading above it ("High (2-0)").
export function matchlists(text) {
  const headings = [...text.matchAll(/^====\s*(.*?)\s*====\s*$/gm)].map(m => ({ at: m.index, text: m[1] }));
  return templates(text, 'Matchlist').map(list => {
    const heading = headings.filter(h => h.at < list.at).at(-1);
    const record = heading && list.at - heading.at < 400 ? (heading.text.match(/\((\d-\d)\)/) || [])[1] || '' : '';
    const matches = Object.keys(list.named).filter(key => /^M\d+$/.test(key)).sort((x, y) => x.slice(1) - y.slice(1))
      .map(key => ({ id: `${list.named.id}-${key}`, ...parseMatch(list.named[key]) }));
    return { id: list.named.id, record, matches };
  });
}

const BRACKETS = {
  'Bracket/8U4L2DSL1D': [['R1M1', 'R1M2', 'R1M3', 'R1M4', 'ub-qf'], ['R2M1', 'R2M2', 'ub-sf'], ['R4M1', 'ub-final'], ['R1M5', 'R1M6', 'lb-r1'], ['R2M3', 'R2M4', 'lb-qf'], ['R3M1', 'lb-sf'], ['R4M2', 'lb-final'], ['R5M1', 'grand-final']],
  'Bracket/4-1Q': [['R1M1', 'R1M2', 'sf'], ['R2M1', 'final']]
};
export function brackets(text) {
  return templates(text, 'Bracket').map(bracket => {
    const layout = BRACKETS[bracket.list[0]];
    const rounds = layout
      ? layout.map(group => ({ round: group.at(-1), keys: group.slice(0, -1) }))
      : [{ round: 'matches', keys: Object.keys(bracket.named).filter(key => /^R\d+M\d+$/.test(key)) }];
    return {
      id: bracket.named.id,
      rounds: rounds.map(({ round, keys }) => ({ round, matches: keys.filter(key => bracket.named[key]).map(key => ({ id: `${bracket.named.id}-${key}`, ...parseMatch(bracket.named[key]) })) })).filter(r => r.matches.length)
    };
  });
}

// Group tables: the team list of {{GroupStandings}} plus the ids of its match lists.
export function groups(text) {
  const lists = new Map(matchlists(text).map(list => [list.id, list]));
  return templates(text, 'GroupStandings').map((table, index) => {
    const ids = String(table.named.matchgroups || '').split(',').map(id => id.trim()).filter(Boolean);
    // Undrawn slots stay in the list as empty keys, so the table shows five places before the draw.
    return { name: String.fromCharCode(65 + index), teams: table.list.filter(entry => /TeamOpponent/.test(entry)).map(entry => opponent(entry).key), matches: ids.flatMap(id => lists.get(id)?.matches || []) };
  });
}

export function swiss(text) {
  const table = templates(text, 'SwissStandings|SwissTableLeague')[0];
  const teams = table
    ? [...table.list.map(entry => opponent(entry).key), ...Object.keys(table.named).filter(key => /^(team|t)\d+$/.test(key)).map(key => table.named[key].toLowerCase())].filter(Boolean)
    : [];
  const rounds = [];
  for (const list of matchlists(text)) {
    const number = Number((String(list.id).match(/SWISSR(?:D)?(\d)/i) || [])[1]) || rounds.length + 1;
    rounds.push({ round: number, record: list.record, matches: list.matches });
  }
  return { teams, rounds: rounds.sort((a, b) => a.round - b.round || String(b.record).localeCompare(String(a.record))) };
}

// Participants of the main page: name (or the qualifier still to be played), route and place there.
export function participants(text) {
  const clean = strip(text);
  const section = (from, to) => clean.slice(clean.indexOf(from), clean.indexOf(to));
  const parse = chunk => templates(chunk, 'Opponent').filter(item => item.named.qualification !== undefined).map(item => {
    const q = templates(item.named.qualification, 'Qualification')[0]?.named || {};
    return { name: (item.list[0] || '').trim(), route: q.page || q.text || '', place: Number(q.placement) || 0 };
  });
  return { swiss: parse(section('===Swiss Stage===', '===Wildcard===')), wildcard: parse(section('===Wildcard===', '==Results==')) };
}

// ---------- network ----------
let last = 0;
async function call(args) {
  const wait = last + 2600 - Date.now();
  if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
  last = Date.now();
  const response = await fetch(`${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...args })}`, { headers: { 'user-agent': AGENT, 'accept-encoding': 'gzip' }, signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`Liquipedia ${response.status}`);
  const json = await response.json();
  if (json.error) throw new Error(`Liquipedia error: ${json.error.code}`);
  return json;
}

async function teamNames(keys) {
  if (!keys.length) return {};
  // Own separators: the expanded short templates are HTML and contain "<" and ">".
  const text = keys.map((key, i) => `${i}@@A@@{{TeamPage|${key}}}@@A@@{{TeamShort|${key}}}@@Z@@`).join('\n');
  const { expandtemplates } = await call({ action: 'expandtemplates', prop: 'wikitext', text });
  const out = {};
  for (const line of expandtemplates.wikitext.split('@@Z@@')) {
    const [index, name, short] = line.trim().split('@@A@@');
    const key = keys[Number(index)];
    if (!key || !name || /error|<|\{/.test(name)) continue;
    const tag = (String(short).match(/team-template-text">\[\[[^|\]]+\|([^\]]+)\]\]/) || [])[1];
    // The dark-theme picture of the team template, else its only picture.
    const files = [...String(short).matchAll(/team-template-image-icon( team-template-(lightmode|darkmode))?">\[\[File:([^|\]]+)/g)].map(m => ({ mode: m[2] || 'all', file: m[3].trim() }));
    const file = (files.find(x => x.mode === 'darkmode') || files.find(x => x.mode === 'all') || files[0])?.file || '';
    out[key] = { name: name.trim(), short: (tag || name).trim(), file };
  }
  return out;
}

export async function collect(event) {
  const pages = [event, `${event}/Wildcard`, `${event}/Swiss Stage`, `${event}/Knockout Stage`];
  const { query } = await call({ action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', titles: pages.join('|'), redirects: '1' });
  const byTitle = Object.fromEntries(query.pages.map(page => [page.title, strip(page.revisions?.[0].slots.main.content || '')]));
  const [main, wild, swissText, knockout] = pages.map(title => byTitle[title] || '');
  const info = templates(main, 'Infobox league')[0]?.named || {};
  const data = {
    event, source: `https://liquipedia.net/mobilelegends/${event.replace(/ /g, '_')}`,
    start: info.sdate || null, end: info.edate || null, prize: Number(String(info.prizepoolusd || '').replace(/\D/g, '')) || null,
    wildcard: { groups: groups(wild), bracket: brackets(wild)[0] || null },
    swiss: swiss(swissText),
    knockout: brackets(knockout)[0] || null,
    participants: participants(main)
  };
  const keys = new Set();
  const eachMatch = m => { if (m.a) keys.add(m.a); if (m.b) keys.add(m.b); };
  data.wildcard.groups.forEach(g => { g.teams.forEach(t => keys.add(t)); g.matches.forEach(eachMatch); });
  data.wildcard.bracket?.rounds.forEach(r => r.matches.forEach(eachMatch));
  data.swiss.teams.forEach(t => keys.add(t));
  data.swiss.rounds.forEach(r => r.matches.forEach(eachMatch));
  data.knockout?.rounds.forEach(r => r.matches.forEach(eachMatch));
  for (const list of Object.values(data.participants)) for (const team of list) if (team.name) keys.add(team.name.toLowerCase());
  data.teams = await teamNames([...keys]);
  canonicalize(data);
  await logos(data.teams);
  data.streams = streams(main);
  return data;
}

// Broadcast channels per language from {{Streams}} on the event page.
const STREAM_ORDER = ['twitch', 'youtube', 'vk', 'tiktok', 'kick'];
export function streams(text) {
  const table = templates(text, 'Streams')[0]?.named || {};
  const out = {};
  for (const [key, lang] of Object.entries(table)) {
    const n = (key.match(/^lang(\d+)$/) || [])[1];
    if (!n) continue;
    const list = [];
    for (const [field, value] of Object.entries(table)) {
      const m = field.match(new RegExp('^(\\d?)(' + STREAM_ORDER.join('|') + ')' + n + '$'));
      if (!m || !value.trim()) continue;
      const handle = value.trim();
      const at = handle.startsWith('@') ? handle : '@' + handle;
      const url = { twitch: 'https://www.twitch.tv/' + handle, youtube: 'https://www.youtube.com/' + at, vk: 'https://vk.com/' + handle, tiktok: 'https://www.tiktok.com/' + at, kick: 'https://kick.com/' + handle }[m[2]];
      list.push({ kind: m[2], handle: handle.replace(/\/live$/, ''), url, order: Number(m[1] || 1) });
    }
    out[lang.trim()] = list.sort((a, b) => STREAM_ORDER.indexOf(a.kind) - STREAM_ORDER.indexOf(b.kind) || a.order - b.order).map(({ order, ...rest }) => rest);
  }
  return { ru: out.ru || [], en: out.usuk || [] };
}

// Team logos as small local WebP files (images/esports/teams), downloaded once per team.
const LOGO_DIR = path.join(root, 'images/esports/teams');
export const logoSlug = name => name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
async function logos(teams) {
  const { mkdir, access } = await import('node:fs/promises');
  await mkdir(LOGO_DIR, { recursive: true });
  const missing = [];
  for (const info of Object.values(teams)) {
    const rel = `/images/esports/teams/${logoSlug(info.name)}.webp`;
    const exists = await access(path.join(root, rel)).then(() => true, () => false);
    if (exists) info.logo = rel;
    else if (info.file) missing.push({ info, rel, file: info.file });
    delete info.file;
  }
  if (!missing.length) return;
  let sharp;
  try { sharp = (await import('sharp')).default; } catch { console.warn('m8: sharp is not installed, logos skipped'); return; }
  const titles = [...new Set(missing.map(item => `File:${item.file}`))];
  const urls = {};
  for (let from = 0; from < titles.length; from += 40) {
    const { query } = await call({ action: 'query', prop: 'imageinfo', iiprop: 'url', iiurlwidth: '160', titles: titles.slice(from, from + 40).join('|') });
    const normalized = Object.fromEntries((query.normalized || []).map(n => [n.to, n.from]));
    for (const page of query.pages || []) {
      const info = page.imageinfo?.[0];
      if (info) urls[normalized[page.title] || page.title] = info.thumburl || info.url;
    }
  }
  const done = new Set();
  for (const item of missing) {
    if (done.has(item.rel)) { item.info.logo = item.rel; continue; }
    const url = urls[`File:${item.file}`];
    if (!url) continue;
    await new Promise(resolve => setTimeout(resolve, 1200));
    try {
      const response = await fetch(url, { headers: { 'user-agent': AGENT }, signal: AbortSignal.timeout(30000) });
      if (!response.ok) continue;
      await sharp(Buffer.from(await response.arrayBuffer())).resize(72, 72, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 88 }).toFile(path.join(root, item.rel));
      item.info.logo = item.rel;
      done.add(item.rel);
    } catch (error) { console.warn(`m8: logo of ${item.info.name} skipped (${error.message})`); }
  }
}

// One team can appear under several template keys ("srg.og" and "selangor red giants"): standings and the CIS mark
// need one identity, so every reference becomes the full name in lower case.
export function canonicalize(data) {
  const canon = key => key ? (data.teams[key]?.name || key).toLowerCase() : '';
  const match = m => { m.a = canon(m.a); m.b = canon(m.b); };
  data.wildcard.groups.forEach(g => { g.teams = g.teams.map(canon); g.matches.forEach(match); });
  data.wildcard.bracket?.rounds.forEach(r => r.matches.forEach(match));
  data.swiss.teams = [...new Set(data.swiss.teams.map(canon))];
  data.swiss.rounds.forEach(r => r.matches.forEach(match));
  data.knockout?.rounds.forEach(r => r.matches.forEach(match));
  data.teams = Object.fromEntries(Object.entries(data.teams).map(([key, info]) => [canon(key), info]));
}

export function totalMatches(data) {
  return data.wildcard.groups.reduce((sum, g) => sum + g.matches.length, 0)
    + (data.wildcard.bracket?.rounds.reduce((sum, r) => sum + r.matches.length, 0) || 0)
    + data.swiss.rounds.reduce((sum, r) => sum + r.matches.length, 0)
    + (data.knockout?.rounds.reduce((sum, r) => sum + r.matches.length, 0) || 0);
}

async function main() {
  const args = process.argv.slice(2);
  const option = name => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; };
  const event = option('--event') || 'M8 World Championship';
  const out = option('--out') ? path.resolve(option('--out')) : OUT;
  const today = new Date().toISOString().slice(0, 10);
  if (args.includes('--if-window') && (today < WINDOW[0] || today > WINDOW[1])) { console.log(`m8: outside ${WINDOW.join('..')}, nothing to do`); return; }
  const data = await collect(event);
  // A broken page or a template change must not wipe the schedule.
  if (totalMatches(data) < 40 || (!option('--event') && data.participants.swiss.length < 10)) throw new Error(`m8: suspicious data (${totalMatches(data)} matches), keeping the previous file`);
  const previous = await readFile(out, 'utf8').then(JSON.parse).catch(() => null);
  const body = JSON.stringify({ ...data });
  if (previous && !args.includes('--force')) {
    const { updated, ...rest } = previous;
    if (JSON.stringify(rest) === body) { console.log(`m8: no changes since ${updated}`); return; }
  }
  await writeFile(out, JSON.stringify({ updated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), ...data }, null, 1) + '\n');
  console.log(`m8: ${totalMatches(data)} matches, ${Object.keys(data.teams).length} teams written`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
