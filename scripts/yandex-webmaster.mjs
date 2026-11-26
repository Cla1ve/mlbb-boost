// Daily search-engine housekeeping for boostmlbb.ru, run by .github/workflows/yandex-webmaster.yml.
//
// 1. IndexNow (Yandex, Bing): the sitemap URLs whose <lastmod> changed since the last notice.
// 2. Yandex Webmaster API v4 (needs YANDEX_WEBMASTER_TOKEN, an OAuth token of the account that owns the site):
//    - the site is added and verified (by the meta tag already on the home page);
//    - sitemap.xml and news-sitemap.xml are registered;
//    - pages that are not in Yandex search yet go to the recrawl queue, most important first, as many as the daily quota allows;
//      a page is sent again only if it is still out of search a week later. Pages already in search are left to IndexNow;
//    - a report (quality index, pages in search, excluded pages and why, site problems) goes to the job summary.
// State (what was sent and when) lives in .yandex-state/state.json, kept between runs by actions/cache.
//
// Usage: node scripts/yandex-webmaster.mjs [--dry-run] [--no-indexnow] [--no-recrawl]
import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';

const SITE = 'https://boostmlbb.ru';
const HOST = 'boostmlbb.ru';
const HOST_ID = 'https:boostmlbb.ru:443';
const SITEMAPS = [`${SITE}/sitemap.xml`, `${SITE}/news-sitemap.xml`];
const INDEXNOW_KEY = '4de65f4422ad3883aae2c2956a70256a';
const API = 'https://api.webmaster.yandex.net/v4';
const STATE_FILE = '.yandex-state/state.json';
const RESEND_DAYS = 7;
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const token = process.env.YANDEX_WEBMASTER_TOKEN?.trim();
const report = [];
const say = line => { console.log(line); report.push(line); };

const today = new Date().toISOString().slice(0, 10);
const daysSince = iso => (Date.now() - Date.parse(iso)) / 864e5;
const state = await readFile(STATE_FILE, 'utf8').then(JSON.parse).catch(() => ({ indexnow: {}, recrawl: {} }));
state.indexnow ||= {};
state.recrawl ||= {};

// ---------- Sitemap ----------
async function sitemapEntries() {
  let xml = '';
  try { const response = await fetch(`${SITE}/sitemap.xml`, { cache: 'no-store' }); if (response.ok) xml = await response.text(); } catch {}
  if (!xml) xml = await readFile('sitemap.xml', 'utf8');
  return [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*(?:<lastmod>([^<]+)<\/lastmod>)?/g)].map(([, loc, lastmod]) => ({ url: loc.trim(), lastmod: (lastmod || today).slice(0, 10) }));
}
const entries = await sitemapEntries();
say(`## Поисковики: ${today}`);
say(`В карте сайта ${entries.length} адресов.`);

// Importance for the recrawl queue: what sells and what people search for first, legal pages and English copies last.
const heroRank = await readFile('content/heroes.json', 'utf8').then(text => Object.fromEntries(JSON.parse(text).heroes.map(hero => [hero.slug, hero.rank]))).catch(() => ({}));
const itemKind = await readFile('content/items.json', 'utf8').then(text => Object.fromEntries(JSON.parse(text).items.map(item => [item.slug, item.kind]))).catch(() => ({}));
const newsDate = Object.fromEntries(entries.filter(entry => /\/news\/[^/]+\/$/.test(entry.url)).map(entry => [entry.url, entry.lastmod]));
function priority(url) {
  const path = new URL(url).pathname;
  if (path.startsWith('/en/')) return 900 + (path.includes('/news/') ? 0 : 50);
  if (/^\/(offer|privacy|terms|cookies|disclaimer|refund|security|documents|sitemap-page)\.html$/.test(path)) return 800;
  const core = ['/', '/prices.html', '/services.html', '/order.html', '/boost/mythic.html', '/boost/hero.html', '/guides/mythic-placement.html', '/guides/party-boost.html', '/heroes/', '/items/', '/skins/', '/news/', '/reviews.html', '/faq.html', '/about.html'];
  if (core.includes(path)) return core.indexOf(path);
  // Ranking lists (best junglers, heroes for beginners): right after the core pages, they are the entry points for hero searches.
  if (/^\/heroes\/(best-[a-z]+|for-beginners)\.html$/.test(path)) return 20;
  if (newsDate[url]) return 100 + (1 - Date.parse(newsDate[url]) / 1e13);
  const hero = path.match(/^\/heroes\/([a-z0-9-]+)\.html$/);
  if (hero) return 200 + (heroRank[hero[1]] || 150);
  // Item pages: finished items first (people search for them by name), parts after.
  const item = path.match(/^\/items\/([a-z0-9-]+)\.html$/);
  if (item) return itemKind[item[1]] === 'part' ? 380 : 360;
  // Skins: hero pages ("скины лейлы") before the single skins; a skin page is searched by its own name.
  if (/^\/skins\/[a-z0-9-]+\.html$/.test(path)) return 340;
  if (/^\/skins\/[a-z0-9-]+\/[a-z0-9-]+\.html$/.test(path)) return 420;
  return 500;
}

// ---------- IndexNow: changed pages only ----------
async function indexNow() {
  const changed = entries.filter(entry => state.indexnow[entry.url] !== entry.lastmod);
  if (!changed.length) { say('IndexNow: изменённых страниц нет.'); return; }
  if (dryRun) { say(`IndexNow (проба): отправил бы ${changed.length} адресов.`); return; }
  const keyLocation = `${SITE}/${INDEXNOW_KEY}.txt`;
  const live = await fetch(keyLocation).then(response => response.ok ? response.text() : '').catch(() => '');
  if (live.trim() !== INDEXNOW_KEY) { say('IndexNow: файл ключа недоступен на сайте, пропускаю.'); return; }
  let accepted = false;
  for (const endpoint of ['https://yandex.com/indexnow', 'https://api.indexnow.org/indexnow']) {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation, urlList: changed.map(entry => entry.url) }) }).catch(error => ({ ok: false, status: error.message }));
    say(`IndexNow ${new URL(endpoint).host}: HTTP ${response.status}, ${changed.length} адресов.`);
    if (response.ok || response.status === 202) accepted = true;
  }
  if (accepted) for (const entry of changed) state.indexnow[entry.url] = entry.lastmod;
}

// ---------- Yandex Webmaster API ----------
async function api(method, path, body, retry = true) {
  const response = await fetch(`${API}${path}`, {
    method, headers: { Authorization: `OAuth ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text.slice(0, 200) }; }
  if (response.status >= 500 && retry) { await new Promise(resolve => setTimeout(resolve, 5000)); return api(method, path, body, false); }
  if (!response.ok) { const error = new Error(`${method} ${path}: HTTP ${response.status} ${data.error_code || ''} ${data.error_message || ''}`.trim()); error.status = response.status; error.code = data.error_code; throw error; }
  return data;
}

async function webmaster() {
  if (!token) { say('Вебмастер: секрет YANDEX_WEBMASTER_TOKEN не задан, шаги Вебмастера пропущены.'); return; }
  const { user_id: user } = await api('GET', '/user');
  const hostPath = `/user/${user}/hosts/${HOST_ID}`;
  const { hosts = [] } = await api('GET', `/user/${user}/hosts`);
  let host = hosts.find(item => item.host_id === HOST_ID);
  if (!host) {
    if (dryRun) { say('Вебмастер (проба): сайт не добавлен, добавил бы.'); return; }
    await api('POST', `/user/${user}/hosts`, { host_url: `${SITE}/` });
    say('Вебмастер: сайт добавлен в аккаунт.');
    host = { verified: false };
  }
  if (!host.verified) {
    const verification = await api('GET', `${hostPath}/verification`).catch(() => ({}));
    const home = await fetch(`${SITE}/`).then(response => response.text()).catch(() => '');
    const uin = verification.verification_uin;
    if (uin && home.includes(uin)) {
      if (!dryRun) await api('POST', `${hostPath}/verification?verification_type=META_TAG`).catch(error => say(`Вебмастер: проверка прав не запустилась (${error.message}).`));
      say(`Вебмастер: права не подтверждены, запущена проверка по метатегу ${uin}. Повторю завтра.`);
    } else {
      say(`Вебмастер: права не подтверждены. Нужен метатег <meta name="yandex-verification" content="${uin || '?'}"> на главной (добавить в index.html и news-pipeline.mjs).`);
    }
    return;
  }

  // Sitemaps
  const { sitemaps = [] } = await api('GET', `${hostPath}/user-added-sitemaps`).catch(() => ({}));
  for (const url of SITEMAPS) {
    if (sitemaps.some(item => item.sitemap_url === url)) continue;
    if (dryRun) { say(`Вебмастер (проба): добавил бы карту ${url}.`); continue; }
    await api('POST', `${hostPath}/user-added-sitemaps`, { url }).then(() => say(`Вебмастер: добавлена карта ${url}.`)).catch(error => say(`Вебмастер: карту ${url} добавить не удалось (${error.message}).`));
  }

  // Pages already in search (samples, paged)
  const inSearch = new Set();
  try {
    for (let offset = 0; offset < 3000; offset += 100) {
      const page = await api('GET', `${hostPath}/search-urls/in-search/samples?offset=${offset}&limit=100`);
      for (const sample of page.samples || []) inSearch.add(sample.url);
      if (!page.samples?.length || offset + 100 >= (page.count || 0)) break;
    }
  } catch (error) {
    say(error.code === 'HOST_NOT_LOADED'
      ? 'Вебмастер: Яндекс ещё загружает данные о сайте (HOST_NOT_LOADED), список страниц в поиске пока недоступен. Обычно это проходит за 1–2 дня.'
      : `Вебмастер: список страниц в поиске не получен (${error.message}).`);
  }

  // Recrawl queue: pages out of search, the most important first
  if (!args.has('--no-recrawl')) {
    const quota = await api('GET', `${hostPath}/recrawl/quota`).catch(() => null);
    let left = quota?.quota_remainder ?? 0;
    const candidates = entries
      .filter(entry => !inSearch.has(entry.url))
      .filter(entry => !state.recrawl[entry.url] || daysSince(state.recrawl[entry.url]) >= RESEND_DAYS)
      .sort((a, b) => (state.recrawl[a.url] ? 1 : 0) - (state.recrawl[b.url] ? 1 : 0) || priority(a.url) - priority(b.url));
    say(`Переобход: лимит на сегодня ${quota?.daily_quota ?? '?'}, осталось ${left}; ждут переобхода ${candidates.length} страниц не из поиска.`);
    const sent = [];
    let failures = 0;
    for (const entry of candidates) {
      if (failures >= 3) { say('Переобход: три ошибки подряд, остановлено до следующего запуска.'); break; }
      if (left <= 0) break;
      if (dryRun) { sent.push(entry.url); left--; continue; }
      try {
        const result = await api('POST', `${hostPath}/recrawl/queue`, { url: entry.url });
        state.recrawl[entry.url] = new Date().toISOString();
        sent.push(entry.url);
        left = result.quota_remainder ?? left - 1;
        failures = 0;
      } catch (error) {
        failures++;
        if (error.code === 'QUOTA_EXCEEDED' || error.status === 429) break;
        say(`Переобход ${entry.url}: ${error.message}`);
      }
    }
    say(`${dryRun ? 'Отправил бы' : 'Отправлено'} на переобход: ${sent.length}.`);
    if (sent.length) say(sent.map(url => `- ${url.replace(SITE, '')}`).join('\n'));
  }

  // Report
  const summary = await api('GET', `${hostPath}/summary`).catch(() => null);
  if (summary) {
    const problems = Object.entries(summary.site_problems || {}).filter(([, count]) => count).map(([level, count]) => `${level}: ${count}`).join(', ');
    say(`\n### Сводка Вебмастера\n- ИКС: ${summary.sqi ?? '?'}\n- Страниц в поиске: ${summary.searchable_pages_count ?? '?'}\n- Исключено: ${summary.excluded_pages_count ?? '?'}\n- Проблемы сайта: ${problems || 'нет'}`);
  }
  const missing = entries.filter(entry => !inSearch.has(entry.url) && !entry.url.includes('/en/'));
  if (inSearch.size) say(`- Русских адресов карты ещё нет в поиске: ${missing.length} из ${entries.filter(entry => !entry.url.includes('/en/')).length}`);
  const diagnostics = await api('GET', `${hostPath}/diagnostics`).catch(() => null);
  const active = Object.entries(diagnostics?.problems || {}).filter(([, item]) => item.state === 'PRESENT');
  if (active.length) say(`- Диагностика: ${active.map(([name, item]) => `${name} (${item.severity})`).join(', ')}`);
  const events = await api('GET', `${hostPath}/search-urls/events/samples?offset=0&limit=100`).catch(() => null);
  const removed = (events?.samples || []).filter(sample => sample.event === 'REMOVED_FROM_SEARCH');
  if (removed.length) {
    const reasons = {};
    for (const sample of removed) reasons[sample.excluded_url_status || 'OTHER'] = (reasons[sample.excluded_url_status || 'OTHER'] || 0) + 1;
    say(`- Недавно выпали из поиска: ${removed.length} (${Object.entries(reasons).map(([reason, count]) => `${reason}: ${count}`).join(', ')})`);
    say(removed.slice(0, 10).map(sample => `  - ${sample.url.replace(SITE, '')}: ${sample.excluded_url_status || ''}`).join('\n'));
  }
}

let failed = false;
if (!args.has('--no-indexnow')) await indexNow().catch(error => { failed = true; say(`IndexNow: ошибка ${error.message}`); });
await webmaster().catch(error => {
  failed = true;
  say(error.status === 401 || error.code === 'INVALID_OAUTH_TOKEN'
    ? 'Вебмастер: токен недействителен или истёк (живёт 6 месяцев). Получите новый по ссылке oauth.yandex.ru/authorize?response_type=token&client_id=<ClientID> и обновите секрет YANDEX_WEBMASTER_TOKEN.'
    : `Вебмастер: ошибка ${error.message}`);
});

if (!dryRun) { await mkdir('.yandex-state', { recursive: true }); await writeFile(STATE_FILE, JSON.stringify(state, null, 1)); }
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, report.join('\n') + '\n');
// The same report as a run annotation: annotations of a public repository can be read without signing in.
if (process.env.GITHUB_ACTIONS) console.log(`::notice title=Yandex Webmaster ${today}::${report.join('\n').replace(/%/g, '%25').replace(/\r/g, '').replace(/\n/g, '%0A')}`);
if (failed) process.exitCode = 1;
