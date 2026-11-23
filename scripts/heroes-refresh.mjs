// Refreshes content/heroes.json from the public MOONTON hero ranking page (https://www.mobilelegends.com/rank).
// The page is rendered in a headless browser exactly as a visitor sees it; heroes are identified by their
// portrait file hash (content/news/research/heroes/icons-2026-11-22.json), so the page language does not matter.
// On any doubt (page changed, too few heroes, odd numbers) the script exits with code 1 and leaves the file untouched.
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const SOURCE = 'https://www.mobilelegends.com/rank';
const RANKS = { all: '101', epic: '5', legend: '6', mythic: '7', honor: '8', glory: '9' };
const browserPath = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe'
].find(candidate => candidate && existsSync(candidate));
if (!browserPath) throw new Error('No Chrome or Edge found; set CHROME_PATH.');

const iconFile = JSON.parse(await readFile('content/news/research/heroes/icons-2026-11-22.json', 'utf8'));
const heroByHash = Object.fromEntries(Object.entries(iconFile.icons).map(([en, hash]) => [hash, en]));
const data = JSON.parse(await readFile('content/heroes.json', 'utf8'));
const slugByEn = Object.fromEntries(data.heroes.map(hero => [hero.en, hero.slug]));

const browser = await chromium.launch({ executablePath: browserPath, headless: true });
const fail = async message => { console.error(`heroes-refresh: ${message}`); await browser.close(); process.exit(1); };
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'en-US' });
await page.goto(SOURCE, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForSelector('img[src*="/svnres/"]', { timeout: 90000 }).catch(() => null);

// Select an option of the period (values 1/3/7/15/30) or rank (101 = all ranks) dropdown by its value.
async function choose(kind, value) {
  return page.evaluate(async ({ kind, value }) => {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    // Each option holds a label and a hidden value node with digits only (e.g. "Past 30 days" + "30").
    const valueNodes = list => [...list.querySelectorAll('*')].filter(node => node.children.length === 0 && /^\d+$/.test(node.textContent.trim()));
    const lists = [...document.querySelectorAll('div.mt-dropdown-list')];
    const list = lists.find(item => {
      const values = valueNodes(item).map(node => node.textContent.trim());
      return kind === 'period' ? values.includes('30') && values.includes('15') : values.includes('101');
    });
    if (!list) return 'no dropdown';
    (list.closest('div.mt-dropdown') || list.parentElement).click();
    await sleep(500);
    const valueNode = valueNodes(list).find(node => node.textContent.trim() === value);
    if (!valueNode) return 'no option';
    (valueNode.parentElement || valueNode).click();
    await sleep(3000);
    return 'ok';
  }, { kind, value });
}

// Scroll the virtual list until every hero row is loaded, then read rows as { hash, counters, pick, win, ban }.
async function readTable() {
  let previous = -1;
  let stable = 0;
  for (let step = 0; step < 40 && stable < 3; step++) {
    const count = await page.evaluate(() => {
      for (const node of [document.scrollingElement, ...document.querySelectorAll('div')]) {
        if (node && node.scrollHeight > node.clientHeight + 50 && (node === document.scrollingElement || /auto|scroll/.test(getComputedStyle(node).overflowY))) node.scrollTop = node.scrollHeight;
      }
      return document.querySelectorAll('img[src*="/svnres/"]').length;
    });
    await page.waitForTimeout(800);
    stable = count === previous ? stable + 1 : 0;
    previous = count;
  }
  return page.evaluate(() => {
    const hashOf = src => (src.match(/\/100_([0-9a-f]{32})\./) || [])[1];
    const rows = [...document.querySelectorAll('div.mt-list-item')].map(row => {
      const hashes = [...row.querySelectorAll('img')].map(img => hashOf(img.src)).filter(Boolean);
      const numbers = (row.innerText.match(/\d+(?:\.\d+)?%/g) || []).map(parseFloat);
      return { row, hashes, numbers };
    }).filter(item => item.hashes.length >= 2 && item.numbers.length === 3);
    const outer = rows.filter(item => !rows.some(other => other !== item && other.row.contains(item.row)));
    const updated = (document.body.innerText.match(/(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})/) || []);
    return {
      updated: updated.length ? `${updated[3]}-${updated[2]}-${updated[1]}T${updated[4]}:${updated[5]}:${updated[6]}` : null,
      rows: outer.map(({ hashes, numbers }) => ({ hash: hashes[0], counters: hashes.slice(1, 6), pick: numbers[0], win: numbers[1], ban: numbers[2] }))
    };
  });
}

const tables = {};
if (await choose('period', '30') !== 'ok') await fail('period dropdown not found');
for (const [key, value] of Object.entries(RANKS)) {
  const result = await choose('rank', value);
  if (result !== 'ok') await fail(`rank ${key}: ${result}`);
  tables[key] = await readTable();
}
await browser.close();

const all = tables.all;
const unknown = all.rows.filter(row => !heroByHash[row.hash]).length;
const known = all.rows.filter(row => slugByEn[heroByHash[row.hash]]);
if (known.length < data.heroes.length - 3) await fail(`only ${known.length} of ${data.heroes.length} heroes read`);
if (known.some(row => !(row.win > 20 && row.win < 80 && row.pick >= 0 && row.pick < 50 && row.ban >= 0 && row.ban <= 100))) await fail('implausible numbers');
if (!all.updated) await fail('update time not found');
if (unknown) console.warn(`heroes-refresh: ${unknown} unknown portrait(s) skipped (a new hero?)`);

const tier = win => win >= 53 ? 'S' : win >= 51 ? 'A' : win >= 49 ? 'B' : win >= 47 ? 'C' : 'D';
const rowFor = (key, en) => tables[key].rows.find(row => heroByHash[row.hash] === en);
const strong = {};
for (const row of known) {
  const en = heroByHash[row.hash];
  for (const counter of row.counters) {
    const target = slugByEn[heroByHash[counter]];
    if (target) (strong[target] ||= []).push(slugByEn[en]);
  }
}
for (const hero of data.heroes) {
  const index = known.findIndex(row => heroByHash[row.hash] === hero.en);
  if (index < 0) continue;
  const row = known[index];
  Object.assign(hero, { rank: index + 1, pick: row.pick, win: row.win, ban: row.ban, tier: tier(row.win), lowPick: row.pick < 0.5 });
  const counters = row.counters.map(hash => slugByEn[heroByHash[hash]]).filter(Boolean);
  if (counters.length >= 3) hero.counters = counters;
  hero.strongAgainst = strong[hero.slug] || [];
  const glory = rowFor('glory', hero.en);
  if (glory) Object.assign(hero, { gloryWin: glory.win, gloryBan: glory.ban });
  hero.byRank = Object.fromEntries(['epic', 'legend', 'mythic', 'honor', 'glory'].map(key => [key, rowFor(key, hero.en)?.win ?? null]));
}
data.heroes.sort((a, b) => a.rank - b.rank);
data.updated = all.updated;
data.period = '30 days, all ranks';
const next = JSON.stringify(data, null, 1) + '\n';
const before = await readFile('content/heroes.json', 'utf8');
if (next === before) console.log('heroes-refresh: no changes');
else {
  await writeFile('content/heroes.json', next);
  console.log(`heroes-refresh: ${known.length} heroes updated, MOONTON update time ${all.updated}`);
}
