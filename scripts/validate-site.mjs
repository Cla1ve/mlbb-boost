import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://boostmlbb.ru';
const read = file => readFile(path.join(root, file), 'utf8');
const filename = pathname => decodeURIComponent(pathname.endsWith('/') ? pathname + 'index.html' : pathname).replace(/^\//, '');
const { document: sitemap } = parseHTML(await read('sitemap.xml'));
const entries = [...sitemap.querySelectorAll('url')];
assert(entries.length >= 42, 'Commercial pages, guides and both news languages must be in the sitemap');
const urls = entries.map(e => e.querySelector('loc').textContent.trim());
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');
const pages = new Map();
const titles = new Set();
const paths = [...urls.map(url => new URL(url).pathname), '/404.html', '/en/404.html'];
for (const pathname of paths) {
  const source = await read(filename(pathname));
  const { document } = parseHTML(source);
  const canonical = origin + pathname;
  const lang = pathname.startsWith('/en/') ? 'en' : 'ru';
  assert.equal(document.documentElement.lang, lang, `${pathname}: incorrect language`);
  assert.equal(document.querySelectorAll('link[rel="canonical"]').length, 1, `${pathname}: duplicate canonical`);
  assert.equal(document.querySelector('link[rel="canonical"]').href, canonical, `${pathname}: canonical mismatch`);
  assert(document.title.trim().length > 10, `${pathname}: missing descriptive title`);
  assert(!titles.has(document.title), `${pathname}: duplicate title`);
  titles.add(document.title);
  assert(document.querySelector('meta[name="description"]')?.content.length > 30, `${pathname}: missing description`);
  assert.equal(document.querySelectorAll('main h1').length, 1, `${pathname}: expected one primary heading`);
  assert.equal(document.querySelector('meta[property="og:url"]').content, canonical);
  assert(Number(document.querySelector('meta[property="og:image:width"]').content) >= 1200, `${pathname}: small social preview`);
  const alternatives = [...document.querySelectorAll('link[hreflang]')];
  assert.equal(alternatives.length, 3, `${pathname}: incomplete hreflang`);
  const targets = Object.fromEntries(alternatives.map(e => [e.hreflang, e.href]));
  assert.deepEqual(Object.keys(targets).sort(), ['en', 'ru', 'x-default']);
  assert.equal(targets[lang], canonical);
  assert.equal(targets['x-default'], targets.ru);
  assert.equal(new URL(targets.en).pathname, '/en' + new URL(targets.ru).pathname);
  for (const schema of document.querySelectorAll('script[type="application/ld+json"]')) {
    const json = JSON.parse(schema.textContent);
    assert.equal(json['@context'], 'https://schema.org');
    const serialized = JSON.stringify(json);
    assert(!serialized.includes('AggregateRating'), `${pathname}: self-serving aggregate markup`);
    assert(!serialized.includes('40802810500009266500'), `${pathname}: invalid registration number`);
  }
  assert(document.querySelector('.nav-list a[href*="/news/"]'), `${pathname}: news navigation missing`);
  for (const element of document.querySelectorAll('[href], [src]')) {
    for (const attr of ['href', 'src']) {
      const value = element.getAttribute(attr);
      if (!value || /^(?:mailto:|tel:|data:|javascript:|#)/i.test(value)) continue;
      const url = new URL(value, canonical);
      if (url.origin !== origin) continue;
      const targetFile = filename(url.pathname);
      assert(!targetFile.split('/').includes('..'), 'Unsafe local path');
      assert((await stat(path.join(root, targetFile))).isFile(), `${pathname}: missing ${value}`);
    }
  }
  const markdown = document.querySelector('link[type="text/markdown"]');
  for (const link of document.querySelectorAll('main a[href], .site-footer a[href]')) {
    assert(!link.getAttribute('href').includes('cla1veisapi.ru'), `${pathname}: backend link shown to customers`);
  }
  if (markdown) assert((await read(filename(new URL(markdown.href, canonical).pathname))).includes(`canonical: ${canonical}`));
  if (pathname.includes('404.html')) assert(document.querySelector('meta[name="robots"]').content.includes('noindex'));
  pages.set(canonical, { document, targets });
}
for (const [url, page] of pages) {
  for (const target of [page.targets.ru, page.targets.en]) {
    assert(pages.has(target), `${url}: hreflang target missing`);
    assert.deepEqual(pages.get(target).targets, page.targets, `${url}: non-reciprocal hreflang`);
  }
}
for (const entry of entries) {
  const url = entry.querySelector('loc').textContent.trim();
  const alternates = [...entry.querySelectorAll('[hreflang]')];
  assert.equal(alternates.length, 3, `${url}: sitemap language alternatives missing`);
  for (const link of alternates) assert.equal(link.getAttribute('href'), pages.get(url).targets[link.getAttribute('hreflang')]);
  assert(/^\d{4}-\d{2}-\d{2}/.test(entry.querySelector('lastmod').textContent));
}
const data = JSON.parse(await read('content/public-data.json'));
assert.equal(data.prices.length, 9);
assert(Number.isFinite(Date.parse(data.checkedAt)));
for (const langPath of ['', '/en']) {
  const pricePage = pages.get(origin + langPath + '/prices.html').document;
  assert(!pricePage.querySelector('[data-seo-generated="price-date"],[data-seo-generated="content"]'), 'Technical price information must stay out of the customer page');
  for (const price of pricePage.querySelectorAll('[data-category="mythic_calibration"] [data-type]')) {
    assert(price.textContent.endsWith(langPath ? '/win' : '/победа'), 'Incorrect placement price unit');
  }
  for (const row of data.prices) for (const price of row.prices) {
    assert.equal(Number.parseFloat(pricePage.querySelector(`[data-category="${row.category}"] [data-type="${price.type}"]`).textContent), price.price, 'Static prices differ from the API snapshot');
  }
  assert.equal(pages.get(origin + langPath + '/reviews.html').document.getElementById('stat-reviews-happy').textContent, data.reviewStats.satisfaction + '%');
}
assert.deepEqual(JSON.parse(await read('content/translation-gaps.json')), [], 'Untranslated English content');
for (const [url, { document }] of pages) {
  if (!url.includes('/en/') || !/^\/(en\/)?(index|services|order|prices|reviews|faq|about)\.html$|\/en\/$|\/en\/guides\//.test(new URL(url).pathname)) continue;
  const main = document.querySelector('main').cloneNode(true);
  main.querySelectorAll('script, style, [lang="ru"]').forEach(e => e.remove());
  assert(!/[А-Яа-яЁё]/.test(main.textContent), `${url}: Russian text in English main content`);
}
const skills = JSON.parse(await read('.well-known/agent-skills/index.json'));
for (const skill of skills.skills) {
  assert.equal(createHash('sha256').update(await readFile(path.join(root, filename(new URL(skill.url).pathname)))).digest('hex'), skill.sha256, `Integrity mismatch: ${skill.id || skill.name}`);
}
assert.equal(JSON.parse(await read('.well-known/api-catalog.json')).linkset.length > 0, true);
for (const file of ['llms.txt', 'llms-full.txt', 'auth.md']) assert((await read(file)).length > 300);
console.log(`Validated ${paths.length} HTML pages, ${urls.length} sitemap URLs, reciprocal languages, local resources, live snapshot prices and skill integrity.`);
