import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';
import TurndownService from 'turndown';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://boostmlbb.ru';
const read = file => readFile(path.join(root, file), 'utf8');
async function save(file, text) {
  const filename = path.join(root, file);
  await mkdir(path.dirname(filename), { recursive: true });
  const normalized = text.replace(/\r\n/g, '\n');
  const next = file.endsWith('.html') ? normalized.replace(/[\t ]+$/gm, '') : normalized;
  let old = '';
  try { old = await readFile(filename, 'utf8'); } catch {}
  if (old !== next) await writeFile(filename, next);
}
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const config = JSON.parse(await read('content/seo-pages.json'));
const data = JSON.parse(await read('content/public-data.json'));
const changedDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(data.checkedAt));
const context = vm.createContext({ window: { MLBB_DICT: {} } });
for (const file of ['i18n-dict', 'i18n-reviews', 'i18n-legal', 'i18n-legal-body']) vm.runInContext(await read(`js/${file}.js`), context);
const translations = JSON.parse(await read('content/seo-translations.json'));
const dict = { ...context.window.MLBB_DICT, ...translations };
const patternMatch = (await read('js/i18n.js')).match(/var PATTERNS = (\[[\s\S]*?\n  \]);/);
const patterns = patternMatch ? vm.runInNewContext(patternMatch[1]) : [];
const untranslated = new Map();
function translate(value, file) {
  const key = value.replace(/\s+/g, ' ').trim();
  if (!key) return value;
  const result = dict[key] || patterns.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), key);
  if (/[А-Яа-яЁё]/.test(result) && !/^ИП:|Маматисаков|Москва|СБП|МИР/.test(result)) {
    if (!untranslated.has(key)) untranslated.set(key, new Set());
    untranslated.get(key).add(file);
  }
  return value.replace(value.trim(), result);
}
function translateDOM(element, file) {
  if (element.nodeType === 3) { element.nodeValue = translate(element.nodeValue, file); return; }
  if (element.nodeType !== 1 || ['SCRIPT', 'STYLE', 'CODE', 'SVG'].includes(element.tagName) || element.closest('[data-i18n-skip]')) return;
  for (const attr of ['placeholder', 'title', 'aria-label', 'alt', 'label']) {
    if (element.hasAttribute(attr)) element.setAttribute(attr, translate(element.getAttribute(attr), file));
  }
  [...element.childNodes].forEach(node => translateDOM(node, file));
}
const pageFiles = (await readdir(root)).filter(file => file.endsWith('.html') && !file.startsWith('enot_'));
const filePath = file => file === 'index.html' ? '/' : `/${file}`;
const localized = (pathname, lang) => lang === 'en' ? `/en${pathname}` : pathname;
const allPaths = new Set([...pageFiles.map(filePath), ...config.guides.map(g => filePath(g.file))]);
function localURL(value, lang, isNavigation) {
  if (!value || /^(?:https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(value)) return value;
  const url = new URL(value, origin + '/');
  if (url.pathname === '/index.html') url.pathname = '/';
  if (isNavigation && lang === 'en' && (allPaths.has(url.pathname) || url.pathname.startsWith('/news/'))) url.pathname = '/en' + url.pathname;
  url.searchParams.delete('lang');
  return url.pathname + url.search + url.hash;
}
function links(document, lang) {
  for (const element of document.querySelectorAll('[href], [src], [srcset]')) {
    if (element.hasAttribute('href') && !element.matches('link[rel="canonical"],link[hreflang]') && !element.closest('.lang-switcher')) element.setAttribute('href', localURL(element.getAttribute('href'), lang, element.tagName === 'A' || element.matches('link[rel="service-doc"],link[rel="describedby"]')));
    if (element.hasAttribute('src')) element.setAttribute('src', localURL(element.getAttribute('src'), lang, false));
    if (element.hasAttribute('srcset')) element.setAttribute('srcset', element.getAttribute('srcset').split(',').map(candidate => {
      const [src, ...descriptor] = candidate.trim().split(/\s+/);
      return [localURL(src, lang, false), ...descriptor].join(' ');
    }).join(', '));
  }
}
function meta(document, selector, name, value, property = false) {
  const nodes = [...document.querySelectorAll(selector)];
  const element = nodes.shift() || document.createElement('meta');
  nodes.forEach(node => node.remove());
  element.setAttribute(property ? 'property' : 'name', name);
  element.setAttribute('content', value);
  if (!element.parentNode) document.head.append(element);
}
function block(document, tag, content) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = content;
  wrapper.firstElementChild.setAttribute('data-seo-generated', tag);
  document.querySelector(`[data-seo-generated="${tag}"]`)?.remove();
  document.querySelector('main').append(...wrapper.childNodes);
}
function schema(document, file, lang, title, description, url) {
  document.querySelectorAll('script[type="application/ld+json"]').forEach(node => node.remove());
  const org = {
    '@type': 'Organization', '@id': `${origin}/#organization`, name: 'MLBB Boost', url: origin + '/',
    legalName: 'ИП Маматисаков Э.С.', identifier: { '@type': 'PropertyValue', propertyID: 'ОГРНИП', value: '326690000001430' },
    logo: { '@type': 'ImageObject', url: `${origin}/images/logo-512x512.png`, width: 512, height: 512 },
    email: 'cla1veisdetta@gmail.com', telephone: '+7-933-203-29-10',
    sameAs: ['https://t.me/Cla1ve', 'https://t.me/cla1ve_boost', 'https://t.me/cla1ve_boost_bot'],
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', url: 'https://t.me/Cla1ve', availableLanguage: ['Russian', 'English'] }
  };
  const web = { '@type': 'WebSite', '@id': `${origin}/#website`, name: 'MLBB Boost', alternateName: 'Boost MLBB', url: origin + '/', publisher: { '@id': org['@id'] }, inLanguage: ['ru', 'en'] };
  const page = { '@type': file.startsWith('guides/') ? 'Article' : file === 'about.html' ? 'AboutPage' : file === 'reviews.html' ? 'CollectionPage' : 'WebPage', '@id': `${url}#page`, url, name: title, description, inLanguage: lang, isPartOf: { '@id': web['@id'] }, publisher: { '@id': org['@id'] } };
  if (file.startsWith('guides/')) { page.headline = document.querySelector('h1').textContent.trim(); page.author = { '@id': org['@id'] }; page.image = `${origin}/images/social-${lang}.png`; page.datePublished = '2026-10-05'; page.dateModified = '2026-10-05'; }
  const graph = [org, web, page];
  if (file !== 'index.html' && file !== '404.html') graph.push({ '@type': 'BreadcrumbList', '@id': `${url}#breadcrumbs`, itemListElement: [
    { '@type': 'ListItem', position: 1, name: lang === 'en' ? 'Home' : 'Главная', item: origin + localized('/', lang) },
    { '@type': 'ListItem', position: 2, name: document.querySelector('h1')?.textContent.trim() || title, item: url }
  ] });
  if (['index.html', 'services.html', 'prices.html'].includes(file)) {
    const service = { '@type': 'Service', '@id': `${origin}/services.html#service`, name: lang === 'en' ? 'Mobile Legends rank boost arrangements' : 'Организация буста Mobile Legends', serviceType: 'Mobile Legends: Bang Bang rank boosting', provider: { '@id': org['@id'] }, url: origin + localized('/services.html', lang) };
    if (file === 'prices.html') service.hasOfferCatalog = {
      '@type': 'OfferCatalog', name: lang === 'en' ? 'Base rank boost rates in RUB' : 'Базовые тарифы рангового буста в рублях',
      itemListElement: data.prices.map(row => ({ '@type': 'Offer', url, itemOffered: { '@type': 'Service', name: lang === 'en' ? translate(row.category_name, file) + ' rank boost' : row.category_name + ' — обычный буст' }, priceSpecification: {
        '@type': 'UnitPriceSpecification', price: row.prices.find(p => p.type === 'standard').price, priceCurrency: 'RUB', unitText: row.category === 'mythic_calibration' ? (lang === 'en' ? 'placement win' : 'победа в калибровке') : (lang === 'en' ? 'star' : 'звезда')
      } }))
    };
    graph.push(service);
  }
  if (file === 'order.html') graph.push({ '@type': 'WebApplication', '@id': `${url}#calculator`, name: title, url, applicationCategory: 'UtilityApplication', operatingSystem: 'Web browser', offers: { '@type': 'Offer', price: 0, priceCurrency: 'RUB' } });
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = '\n' + JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replace(/</g, '\\u003c') + '\n';
  document.head.append(script);
}

const markdown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' });
const rendered = [];
const aboutTemplate = await read('about.html');
for (const guide of config.guides) {
  const { document } = parseHTML(aboutTemplate);
  document.querySelector('main').innerHTML = `<article class="seo-guide container"><nav aria-label="Хлебные крошки"><a href="/">Главная</a> / <a href="/services.html">Услуги</a></nav>${guide.ru[2]}<p class="seo-date">Редакция MLBB Boost · Обновлено 5 октября 2026</p></article>`;
  await save(guide.file, '<!DOCTYPE html>\n' + document.documentElement.outerHTML + '\n');
}
for (const file of [...pageFiles, ...config.guides.map(g => g.file)]) {
  const source = await read(file);
  for (const lang of ['ru', 'en']) {
    const { document } = parseHTML(source);
    const navigation = document.querySelector('.nav-list');
    if (navigation) navigation.innerHTML = [['/', 'Главная', 'fa-home'], ['/services.html', 'Услуги', 'fa-gamepad'], ['/prices.html', 'Цены', 'fa-tags'], ['/reviews.html', 'Отзывы', 'fa-star'], ['/news/', 'Новости', 'fa-newspaper'], ['/faq.html', 'FAQ', 'fa-question-circle'], ['/about.html', 'О нас', 'fa-info-circle']].map(([href, label, icon]) => `<li><a href="${href}" class="nav-link"><i class="fas ${icon}" aria-hidden="true"></i>${label}</a></li>`).join('') + '<li><a href="/order.html" class="nav-link cta"><i class="fas fa-shopping-cart" aria-hidden="true"></i>Заказать</a></li>';
    for (const element of document.querySelectorAll('.channel-title, .site-footer a')) {
      element.innerHTML = element.innerHTML.replace(/\d+\+? отзывов/g, `${data.reviewStats.count} отзывов`).replace(/Отзывы \(\d+\+?\)/g, `Отзывы (${data.reviewStats.count})`);
    }
    document.querySelectorAll('[data-seo-generated]').forEach(node => node.remove());
    if (file.startsWith('guides/')) document.querySelector('main').innerHTML = '';
    if (lang === 'en') translateDOM(document.body, file);
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-static-locale', lang);
    const guide = config.guides.find(g => g.file === file);
    const metadata = guide ? guide[lang] : config.pages[file]?.[lang];
    const title = metadata?.[0] || (lang === 'en' ? translate(document.title, file) : document.title);
    const description = metadata?.[1] || (lang === 'en' ? translate(document.querySelector('meta[name="description"]')?.content || '', file) : document.querySelector('meta[name="description"]')?.content || '');
    if (guide) document.querySelector('main').innerHTML = `<article class="seo-guide container"><nav aria-label="${lang === 'en' ? 'Breadcrumbs' : 'Хлебные крошки'}"><a href="${localized('/', lang)}">${lang === 'en' ? 'Home' : 'Главная'}</a> / <a href="${localized('/services.html', lang)}">${lang === 'en' ? 'Services' : 'Услуги'}</a></nav>${guide[lang][2]}<p class="seo-date">${lang === 'en' ? 'MLBB Boost editorial team · Updated 5 October 2026' : 'Редакция MLBB Boost · Обновлено 5 октября 2026'}</p></article>`;
    document.title = title;
    for (const [name, value, property] of [
      ['description', description], ['robots', file === '404.html' ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'],
      ['og:title', title, true], ['og:description', description, true], ['og:type', guide ? 'article' : 'website', true], ['og:locale', lang === 'en' ? 'en_US' : 'ru_RU', true],
      ['og:url', origin + localized(filePath(file), lang), true], ['og:image', `${origin}/images/social-${lang}.png`, true],
      ['og:image:width', '1200', true], ['og:image:height', '630', true], ['og:image:alt', lang === 'en' ? 'MLBB Boost — rank boost options and calculator' : 'MLBB Boost — услуги буста и калькулятор', true],
      ['twitter:card', 'summary_large_image'], ['twitter:title', title], ['twitter:description', description], ['twitter:image', `${origin}/images/social-${lang}.png`], ['theme-color', '#0A1A2F']
    ]) meta(document, `meta[${property ? 'property' : 'name'}="${name}"]`, name, value, property);
    document.querySelectorAll('meta[name="keywords"],meta[name="revisit-after"],meta[name="geo.position"],meta[name="ICBM"],meta[name="language"],meta[name="distribution"],meta[name="rating"]').forEach(node => node.remove());
    document.querySelectorAll('link[rel="canonical"],link[hreflang],link[rel="alternate"][type="text/markdown"]').forEach(node => node.remove());
    const canonical = origin + localized(filePath(file), lang);
    for (const [rel, hreflang, href] of [['canonical', null, canonical], ['alternate', 'ru', origin + filePath(file)], ['alternate', 'en', origin + localized(filePath(file), 'en')], ['alternate', 'x-default', origin + filePath(file)]]) {
      const link = document.createElement('link'); link.rel = rel; link.href = href; if (hreflang) link.hreflang = hreflang; document.head.append(link);
    }
    const mdPath = `/markdown/${lang === 'en' ? 'en/' : ''}${file.replace(/\.html$/, '.md')}`;
    const mdLink = document.createElement('link'); mdLink.rel = 'alternate'; mdLink.type = 'text/markdown'; mdLink.href = mdPath; document.head.append(mdLink);
    document.querySelectorAll('link[rel="api-catalog"]').forEach(link => link.href = '/.well-known/api-catalog.json');
    if (config.blocks[file]) block(document, 'content', config.blocks[file][lang]);
    if (file === 'prices.html') {
      for (const row of data.prices) for (const price of row.prices) {
        const element = document.querySelector(`[data-category="${row.category}"] [data-type="${price.type}"]`);
        if (element) element.textContent = `${price.price} ₽/${row.category === 'mythic_calibration' ? (lang === 'en' ? 'win' : 'победа') : '⭐'}`;
      }
      document.querySelector('#prices-data-status')?.remove();
    }
    for (const row of data.prices) {
      if (row.category !== 'warrior_elite') continue;
      for (const price of row.prices) {
        const element = document.querySelector(`[data-boost-type="${price.type}"] .price-from`);
        if (element) element.textContent = lang === 'en' ? `from ${price.price} ₽/star` : `от ${price.price}₽/звезда`;
      }
    }
    for (const element of document.querySelectorAll('[data-review-stat]')) {
      const key = element.getAttribute('data-review-stat');
      const value = key === 'rating' ? data.reviewStats[key].toFixed(1) : key === 'satisfaction' ? data.reviewStats[key] + '%' : String(data.reviewStats[key]);
      element.textContent = value;
      element.removeAttribute('data-counter');
    }
    if (file === 'reviews.html') {
      const stats = data.reviewStats;
      for (const [id, value] of [['stat-reviews-count', stats.count], ['reviews-banner-count', stats.count], ['stat-reviews-rating', stats.rating.toFixed(1)], ['stat-reviews-happy', stats.satisfaction + '%']]) {
        const node = document.getElementById(id); if (node) node.textContent = String(value);
      }
      const descriptionText = lang === 'en' ? `${stats.count} customer reviews, average rating ${stats.rating.toFixed(1)}/5. Read the original reviews on Telegram.` : `${stats.count} отзывов клиентов, средняя оценка ${stats.rating.toFixed(1)}/5. Оригиналы отзывов доступны в Telegram.`;
      const quotes = data.reviews.slice(0, 3).map(r => {
        const { document: fragment } = parseHTML(`<div>${r.text.replace(/^review_html_v1::/, '')}</div>`);
        const text = fragment.querySelector('div').textContent;
        return `<blockquote><p lang="ru">${escape(text)}</p><footer>${r.rating}/5 · <a href="${escape(r.messageLink)}" target="_blank" rel="noopener noreferrer">${lang === 'en' ? 'Original Telegram review' : 'Исходный отзыв в Telegram'}</a></footer></blockquote>`;
      }).join('');
      block(document, 'reviews-snapshot', `<section class="seo-section"><div class="container"><h2>${lang === 'en' ? 'Customer reviews on Telegram' : 'Отзывы клиентов в Telegram'}</h2><p>${descriptionText}</p><div class="seo-quotes" data-i18n-skip>${quotes}</div></div></section>`);
    }
    const nav = document.querySelector('.nav-container');
    if (nav) {
      nav.querySelector('.lang-switcher')?.remove();
      const switcher = document.createElement('div'); switcher.className = 'lang-switcher'; switcher.setAttribute('role', 'group'); switcher.setAttribute('data-i18n-skip', ''); switcher.setAttribute('aria-label', lang === 'en' ? 'Language selector' : 'Переключатель языка');
      switcher.innerHTML = ['ru', 'en'].map(l => `<a href="${localized(filePath(file), l)}" hreflang="${l}" lang="${l}" class="lang-option${l === lang ? ' active' : ''}" data-lang="${l}"${l === lang ? ' aria-current="true"' : ''}>${l.toUpperCase()}</a>`).join('');
      nav.insertBefore(switcher, nav.querySelector('.menu-toggle'));
    }
    const main = document.querySelector('main');
    if (main) main.id = 'main-content';
    if (!document.querySelector('.skip-link')) { const skip = document.createElement('a'); skip.className = 'skip-link'; skip.href = '#main-content'; skip.textContent = lang === 'en' ? 'Skip to content' : 'Перейти к содержимому'; document.body.prepend(skip); }
    if (!document.querySelector('link[href*="/styles/seo.css"]')) { const style = document.createElement('link'); style.rel = 'stylesheet'; style.href = '/styles/seo.css'; document.head.append(style); }
    for (const node of document.querySelectorAll('script[src],link[href*="/styles/seo.css"]')) {
      const attribute = node.tagName === 'SCRIPT' ? 'src' : 'href';
      const asset = new URL(node.getAttribute(attribute), origin);
      if (['/js/main.js', '/js/prices.js', '/js/i18n.js', '/js/i18n-seo.js', '/styles/seo.css'].includes(asset.pathname)) {
        asset.searchParams.set('v', '24');
        node.setAttribute(attribute, asset.pathname + asset.search);
      }
    }
    if (file === 'index.html' && !document.querySelector('script[src*="particles.min.js"]')) {
      const effects = document.createElement('script'); effects.src = '/js/vendor/particles.min.js'; effects.setAttribute('defer', ''); document.head.append(effects);
    }
    document.querySelector('#particles-js')?.setAttribute('aria-hidden', 'true');
    document.querySelectorAll('link[href*="font-awesome"]').forEach(node => node.setAttribute('href', '/styles/icons.css'));
    document.querySelectorAll('link[rel="preconnect"][href*="cdnjs"]').forEach(node => node.remove());
    for (const node of document.querySelectorAll('script[src*="i18n-legal"],script[src*="i18n-reviews"]')) {
      if (config.pages[file] || guide) {
        if (!(file === 'reviews.html' && node.getAttribute('src').includes('i18n-reviews'))) node.remove();
      }
    }
    if (!document.querySelector('script[src*="i18n-seo.js"]')) {
      const script = document.createElement('script'); script.setAttribute('defer', ''); script.src = '/js/i18n-seo.js';
      const engine = document.querySelector('script[src*="/i18n.js"],script[src="js/i18n.js"]');
      if (engine) engine.before(script); else document.head.append(script);
    }
    document.querySelector('script[src*="i18n-seo.js"]')?.setAttribute('defer', '');
    if (!['services.html', 'order.html', 'prices.html', 'reviews.html'].includes(file)) {
      document.querySelectorAll('script[src*="/i18n"],script[src*="/currency.js"]').forEach(node => node.remove());
      if (!document.querySelector('script[src*="/locale.js"]')) {
        const script = document.createElement('script'); script.setAttribute('defer', ''); script.src = '/js/locale.js'; document.head.append(script);
      }
    }
    for (const img of document.querySelectorAll('img')) {
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
      if (img.getAttribute('src')?.includes('Ранги/') || decodeURI(img.getAttribute('src') || '').includes('Ранги/')) {
        img.src = '/images/ranks/' + decodeURI(img.getAttribute('src')).split('/').pop();
        img.setAttribute('width', '160'); img.setAttribute('height', img.src.includes('rising.webp') ? '68' : '160');
      }
    }
    if (file === 'prices.html') { const first = document.querySelector('.rank-img'); if (first) { first.setAttribute('loading', 'eager'); first.setAttribute('fetchpriority', 'high'); } }
    document.querySelector('link[rel="manifest"]')?.setAttribute('href', lang === 'en' ? '/manifest-en.json' : '/manifest.json');
    links(document, lang);
    for (const link of document.querySelectorAll('.nav-list a')) {
      const pathname = new URL(link.getAttribute('href'), origin).pathname;
      const current = pathname === localized(filePath(file), lang);
      link.classList.toggle('active', current);
      if (current) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    }
    if (lang === 'en') {
      document.querySelectorAll('[data-news-en-src]').forEach(el => el.setAttribute('src', el.getAttribute('data-news-en-src')));
      document.querySelectorAll('[data-news-en-srcset]').forEach(el => el.setAttribute('srcset', el.getAttribute('data-news-en-srcset')));
      document.querySelectorAll('[data-news-en-alt]').forEach(el => el.setAttribute('alt', el.getAttribute('data-news-en-alt')));
    }
    schema(document, file, lang, title, description, canonical);
    const output = lang === 'en' ? 'en/' + file : file;
    await save(output, '<!DOCTYPE html>\n' + document.documentElement.outerHTML + '\n');
    const mainCopy = main.cloneNode(true);
    mainCopy.querySelectorAll('script, style, .loader, #particles-js, .hero-gradient-overlay, .hero-character').forEach(el => el.remove());
    for (const anchor of mainCopy.querySelectorAll('a[href]')) anchor.href = new URL(anchor.getAttribute('href'), origin).href;
    const text = markdown.turndown(mainCopy.innerHTML).replace(/[\t ]+$/gm, '');
    await save(mdPath.slice(1), `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\ncanonical: ${canonical}\nlanguage: ${lang}\n---\n\n${text}\n`);
    rendered.push({ file, lang, title, url: canonical, text });
  }
}
await save('js/i18n-seo.js', `/* Generated from content/seo-translations.json. */\nObject.assign(window.MLBB_DICT, ${JSON.stringify(translations, null, 2)});\n`);
const pricesJS = await read('js/prices.js');
await save('js/prices.js', pricesJS.replace(/const LAST_KNOWN_PRICES = \[[\s\S]*?\n\];/, `const LAST_KNOWN_PRICES = ${JSON.stringify(data.prices, null, 2)};`).replace(/Последний проверенный fallback с API на [\d-]+\./, `Последний проверенный fallback с API на ${changedDate}.`));
await save('js/review-stats.js', `/* Generated public review aggregate. No full review downloads on landing pages. */\n(function () {\n  'use strict';\n  var stats = ${JSON.stringify(data.reviewStats)};\n  function apply() {\n    document.querySelectorAll('[data-review-stat]').forEach(function (node) {\n      var key = node.getAttribute('data-review-stat');\n      node.textContent = key === 'rating' ? stats.rating.toFixed(1) : key === 'satisfaction' ? stats.satisfaction + '%' : String(stats[key]);\n    });\n  }\n  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();\n})();\n`);
await save('llms.txt', `# MLBB Boost\n\n> Independent service for arranging Mobile Legends: Bang Bang rank boosts and party play. Not affiliated with MOONTON Games.\n\nOrders are arranged through Telegram. Check the website prices and calculator for order estimates; first-order discount eligibility and timing must be confirmed before payment. Account access carries risks; no guarantee of no sanctions. Published reviews are not independently certified.\n\n## Services and policies\n${rendered.filter(p => ['index.html', 'services.html', 'prices.html', 'order.html', 'faq.html', 'about.html', 'reviews.html', 'refund.html', 'security.html', 'disclaimer.html'].includes(p.file) && p.lang === 'en').map(p => `- [${p.title}](${p.url})`).join('\n')}\n\n## Guides\n${rendered.filter(p => p.file.startsWith('guides/') && p.lang === 'en').map(p => `- [${p.title}](${p.url})`).join('\n')}\n\n## Machine-readable public resources\n- [Full content in Markdown](${origin}/llms-full.txt)\n- [Russian news feed](${origin}/news/rss.xml)\n- [English news feed](${origin}/en/news/rss.xml)\n\nRead the linked website pages for the complete service terms.\n`);
await save('llms-full.txt', `# MLBB Boost public content\n\nGenerated from the same HTML content available to visitors. Canonical website pages remain authoritative.\n\n${rendered.filter(p => p.lang === 'en' && (config.pages[p.file] || p.file.startsWith('guides/'))).map(p => `## ${p.title}\n\nSource: ${p.url}\n\n${p.text}`).join('\n\n---\n\n')}\n`);
const catalogue = await read('.well-known/api-catalog');
await save('.well-known/api-catalog.json', catalogue);
const skills = JSON.parse(await read('.well-known/agent-skills/index.json'));
for (const skill of skills.skills) {
  const pathname = new URL(skill.url).pathname.slice(1);
  const skillText = (await read(pathname)).replace(/\r\n/g, '\n');
  await save(pathname, skillText);
  skill.sha256 = createHash('sha256').update(skillText).digest('hex');
}
await save('.well-known/agent-skills/index.json', JSON.stringify(skills, null, 2) + '\n');
const manifest = JSON.parse(await read('content/site-pages.json'));
for (const file of [...pageFiles.filter(f => f !== '404.html'), ...config.guides.map(g => g.file)]) {
  for (const lang of ['ru', 'en']) {
    const pathname = localized(filePath(file), lang);
    const existing = manifest.pages.find(p => p.pathname === pathname);
    if (!existing) manifest.pages.push({ pathname, lastmod: '2026-10-05' });
    else if (existing.lastmod < '2026-10-05') existing.lastmod = '2026-10-05';
    const entry = manifest.pages.find(p => p.pathname === pathname);
    if (['index.html', 'about.html', 'prices.html', 'services.html', 'reviews.html'].includes(file) && entry.lastmod < changedDate) entry.lastmod = changedDate;
  }
}
await save('content/site-pages.json', JSON.stringify(manifest, null, 2) + '\n');
await save('content/translation-gaps.json', JSON.stringify([...untranslated].map(([text, files]) => ({ text, files: [...files] })), null, 2) + '\n');
console.log(`Built ${rendered.length} HTML pages and Markdown alternatives; ${untranslated.size} translation gaps to review.`);
