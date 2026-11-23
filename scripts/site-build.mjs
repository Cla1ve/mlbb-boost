import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';
import TurndownService from 'turndown';
import reviewText from '../js/review-text.js';
import { heroGuides, profileArt } from './hero-pages.mjs';

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
const heroesData = JSON.parse(await read('content/heroes.json'));
const HOME_NEWS_SLUG = 'msc-2026-playoff-schedule';
const newsPosts = JSON.parse(await read('content/news/posts.json')).posts.filter(post => post.status === 'published');
config.guides.push(...heroGuides(heroesData));
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
const filePath = file => file === 'index.html' ? '/' : file.endsWith('/index.html') ? `/${file.slice(0, -'index.html'.length)}` : `/${file}`;
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
const guideOf = file => config.guides.find(g => g.file === file);
const footerGuides = [
  ['/news/mlbb-ranks-in-order/', 'Ранги по порядку', 'Ranks in order'],
  ['/news/mlbb-season-end-rank-reset/', 'Конец сезона и сброс', 'Season end and reset'],
  ['/boost/mythic.html', 'Буст Мифика', 'Mythic boost'],
  ['/boost/hero.html', 'Буст на герое', 'Hero boost'],
  ['/guides/mythic-placement.html', 'Калибровка Мифика', 'Mythic placement'],
  ['/heroes/', 'Все герои MLBB', 'All MLBB heroes']
];
const typeLabels = { ru: { standard: 'Обычный', role: 'На роли', hero: 'На герое', party: 'В пати' }, en: { standard: 'Account', role: 'Role', hero: 'Hero', party: 'Party' } };
const typeOrder = ['standard', 'role', 'hero', 'party'];
const priceOf = (category, type) => data.prices.find(r => r.category === category)?.prices.find(p => p.type === type)?.price;
const money = (value, lang) => `${new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'ru-RU').format(value).replace(/[\u00a0\u202f]/g, ' ')} ₽`;
const categoryName = (row, lang) => lang === 'en' ? translate(row.category_name, 'content/seo-pages.json') : row.category_name;
function formatDate(iso, lang) {
  const text = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
  return text.replace(/\s*г\.$/, '');
}
// Route examples priced from the same public snapshot as /prices.html (stars × base rate).
const routeExamples = [
  ['legend', 25, 'Легенда V 1⭐ → Мифик 0⭐', 'Legend V 1⭐ → Mythic 0⭐', ['Легенда V', 'Legend V', 'Legend'], ['Мифик', 'Mythic', 'Mythic'], ['около 5 ч', 'about 5 h']],
  ['mythic', 15, 'Мифик 10⭐ → Мифическая честь 25⭐', 'Mythic 10⭐ → Mythical Honor 25⭐', ['Мифик 10⭐', 'Mythic 10⭐', 'Mythic'], ['Честь 25⭐', 'Honor 25⭐', 'Mythical_Honor'], ['около 6 ч', 'about 6 h']],
  ['honor', 25, 'Мифическая честь 25⭐ → Мифическая слава 50⭐', 'Mythical Honor 25⭐ → Mythical Glory 50⭐', ['Честь 25⭐', 'Honor 25⭐', 'Mythical_Honor'], ['Слава 50⭐', 'Glory 50⭐', 'Mythical_Glory'], ['около 8 ч', 'about 8 h']],
  ['glory', 50, 'Мифическая слава 50⭐ → Мифический бессмертный 100⭐', 'Mythical Glory 50⭐ → Mythical Immortal 100⭐', ['Слава 50⭐', 'Glory 50⭐', 'Mythical_Glory'], ['Бессмертный 100⭐', 'Immortal 100⭐', 'Mythical_Immortal'], ['около 6,5 ч', 'about 6.5 h']],
  ['immortal', 50, 'Мифический бессмертный 100⭐ → 150⭐', 'Mythical Immortal 100⭐ → 150⭐', ['Бессмертный 100⭐', 'Immortal 100⭐', 'Mythical_Immortal'], ['Бессмертный 150⭐', 'Immortal 150⭐', 'Mythical_Immortal'], null]
];
const rankImages = { warrior_elite: ['Warrior', 'Elite'], master_gm: ['Master', 'Grandmaster'], epic: ['Epic'], legend: ['Legend'], mythic_calibration: ['Mythic'], mythic: ['Mythic'], honor: ['Mythical_Honor'], glory: ['Mythical_Glory'], immortal: ['Mythical_Immortal'] };
const unitLabel = (category, lang) => category === 'mythic_calibration' ? (lang === 'en' ? '/win' : '/победа') : '/⭐';
function rankCards(list, highlight, lang) {
  const en = lang === 'en';
  const rows = list === 'all' ? data.prices : list.split(',').map(category => data.prices.find(r => r.category === category)).filter(Boolean);
  return `<div class="prices-grid lp-prices">${rows.map(row => `<div class="rank-price-card" data-category="${row.category}"><div class="rank-images">${rankImages[row.category].map(name => `<img height="160" width="160" loading="lazy" decoding="async" src="/images/ranks/${name}.webp" alt="" class="rank-img${rankImages[row.category].length === 1 ? ' single' : ''}">`).join('')}</div><div class="rank-info"><h3 class="rank-name">${categoryName(row, lang)}</h3><div class="prices-row">${typeOrder.map(type => `<div class="price-item${type === highlight ? ' lp-highlight' : ''}"><span class="price-label">${typeLabels[lang][type]}</span><span class="price-value">${priceOf(row.category, type)} ₽${unitLabel(row.category, lang)}</span></div>`).join('')}</div><a class="price-card-link" href="${localized('/order.html', lang)}?type=${highlight || 'standard'}">${en ? 'Calculate order' : 'Рассчитать заказ'} <i class="fas fa-arrow-right" aria-hidden="true"></i></a></div></div>`).join('')}</div>`;
}
function routeTiles(type, lang) {
  const en = lang === 'en';
  return `<div class="lp-routes">${routeExamples.map(([category, stars, , , from, to, time]) => `<a class="lp-route" href="${localized('/order.html', lang)}?type=${type}"><span class="lp-route__icons" aria-hidden="true"><img src="/images/ranks/${from[2]}.webp" width="48" height="48" alt="" loading="lazy" decoding="async"><i class="fas fa-arrow-right"></i><img src="/images/ranks/${to[2]}.webp" width="48" height="48" alt="" loading="lazy" decoding="async"></span><span class="lp-route__name">${en ? from[1] : from[0]} → ${en ? to[1] : to[0]}</span><span class="lp-route__meta">${stars} ${en ? 'stars' : 'звёзд'}${time ? ` · ${en ? time[1] : time[0]}` : ''}</span><strong class="lp-route__price">${en ? 'from' : 'от'} ${money(priceOf(category, type) * stars, lang)}</strong></a>`).join('')}</div>`;
}
function fillTokens(html, lang) {
  const en = lang === 'en';
  return html
    .replace(/\{\{prices:(\w+(?:,\w+)*)\}\}/g, (_, list) => {
      const categories = list.split(',');
      const rows = data.prices.filter(r => categories.includes(r.category) || list === 'all');
      return `<div class="seo-table-wrap"><table class="seo-table"><caption>${en ? 'Base rate per star in RUB; Mythic placement is per win' : 'Базовый тариф за звезду, ₽; калибровка Мифика — за победу'}</caption><thead><tr><th scope="col">${en ? 'Rank' : 'Ранг'}</th>${typeOrder.map(t => `<th scope="col">${typeLabels[lang][t]}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr><th scope="row">${categoryName(r, lang)}</th>${typeOrder.map(t => `<td>${money(priceOf(r.category, t), lang)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    })
    .replace(/\{\{routes(?::(\w+))?\}\}/g, (_, only) => {
      const types = only ? [only] : typeOrder;
      return `<div class="seo-table-wrap"><table class="seo-table"><caption>${en ? 'Example routes: stars × base rate, before discounts' : 'Примеры маршрутов: звёзды × базовый тариф, без скидок'}</caption><thead><tr><th scope="col">${en ? 'Route' : 'Маршрут'}</th><th scope="col">${en ? 'Stars' : 'Звёзд'}</th>${types.map(t => `<th scope="col">${typeLabels[lang][t]}</th>`).join('')}</tr></thead><tbody>${routeExamples.map(([category, stars, ru, enName]) => `<tr><th scope="row">${en ? enName : ru}</th><td>${stars}</td>${types.map(t => `<td>${money(priceOf(category, t) * stars, lang)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    })
    .replace(/\{\{rankCards:([\w,]+)(?:\|(\w+))?\}\}/g, (_, list, highlight) => rankCards(list, highlight, lang))
    .replace(/\{\{routeTiles:(\w+)\}\}/g, (_, type) => routeTiles(type, lang))
    .replace(/\{\{reviews:(\w+)\}\}/g, (_, kind) => {
      const pick = data.reviews.filter(r => kind === 'hero' ? r.boostType === 'hero' : kind === 'party' ? r.boostType === 'party' : kind === 'mythic' ? /Миф/.test(r.rankTo || '') : true).slice(0, 3);
      return pick.length ? reviewWall(pick, lang) : '';
    })
    .replace(/\{\{priceData\}\}/g, () => `<script type="application/json" id="rank-tool-prices">${JSON.stringify(Object.fromEntries(data.prices.map(r => [r.category, Object.fromEntries(r.prices.map(p => [p.type, p.price]))])))}</script>`)
    .replace(/\{\{reviewCount\}\}/g, () => new Intl.NumberFormat(en ? 'en-US' : 'ru-RU').format(data.reviewStats.count).replace(/[\u00a0\u202f]/g, ' '))
    .replace(/\{\{checkedDate\}\}/g, () => formatDate(changedDate, lang))
    .replace(/\{\{(\w+)\}\}/g, (token, name) => {
      const named = {
        mythicFrom: priceOf('mythic', 'standard'), immortalStd: priceOf('immortal', 'standard'),
        heroFrom: Math.min(...data.prices.map(r => priceOf(r.category, 'hero'))), heroMythic: priceOf('mythic', 'hero'), heroImmortal: priceOf('immortal', 'hero'),
        calibrationStd: priceOf('mythic_calibration', 'standard'), calibrationParty: priceOf('mythic_calibration', 'party'),
        stdFrom: Math.min(...data.prices.map(r => priceOf(r.category, 'standard'))), partyFrom: Math.min(...data.prices.map(r => priceOf(r.category, 'party'))),
        roleFrom: Math.min(...data.prices.map(r => priceOf(r.category, 'role'))),
        gloryRouteStd: priceOf('glory', 'standard') * 50, gloryRouteHero: priceOf('glory', 'hero') * 50, gloryRouteParty: priceOf('glory', 'party') * 50
      };
      if (!(name in named)) throw new Error(`Unknown content token ${token}`);
      return money(named[name], lang);
    });
}
function reviewCard(r, lang) {
  const en = lang === 'en';
  const stars = '★'.repeat(Math.max(0, Math.min(5, r.rating))) + '☆'.repeat(5 - Math.max(0, Math.min(5, r.rating)));
  const date = r.published ? formatDate(r.published, lang) : '';
  const split = value => { const m = String(value).match(/^(.*?),\s*(\d+⭐)$/); return m ? [m[1], m[2]] : [String(value), '']; };
  const [fromRank, fromStars] = split(r.rankFrom || ''), [toRank, toStars] = split(r.rankTo || '');
  const routeText = fromRank === toRank && fromStars && toStars ? `${fromRank} ${fromStars} → ${toStars}` : `${r.rankFrom} → ${r.rankTo}`;
  const route = r.rankFrom && r.rankTo ? `<p class="review-card__route" lang="ru">${escape(routeText)}</p>` : '';
  const chips = [r.boostType && typeLabels[lang][r.boostType] ? `<span>${typeLabels[lang][r.boostType]}</span>` : '', r.hero ? `<span lang="ru">${escape(r.hero)}</span>` : '', r.duration ? `<span lang="ru">${escape(String(r.duration).replace(/\s*после оплаты$/, ''))}</span>` : ''].join('');
  return `<article class="review-card"><header><span class="review-card__stars" aria-label="${en ? 'Rating' : 'Оценка'} ${r.rating}/5">${stars}</span>${date ? `<time datetime="${r.published}">${date}</time>` : ''}</header>${route}${chips ? `<div class="review-card__chips">${chips}</div>` : ''}<blockquote lang="ru">${escape(reviewText.clean(r.text))}</blockquote><footer>${r.booster ? `<span>${en ? 'Booster' : 'Бустер'}: <b lang="ru">${escape(r.booster)}</b></span>` : ''}<a href="${escape(r.messageLink)}" target="_blank" rel="noopener noreferrer">${en ? 'Original on Telegram' : 'Оригинал в Telegram'}</a></footer></article>`;
}
function reviewWall(reviews, lang) {
  return `<div class="review-wall" data-i18n-skip>${reviews.map(r => reviewCard(r, lang)).join('')}</div>`;
}
const rankImg = (name, cls = '') => `<img class="${cls}" src="/images/ranks/${name}.webp" width="160" height="160" alt="" loading="lazy" decoding="async">`;
const heroImg = (slug, cls = '') => `<img class="${cls}" src="/images/heroes/${slug}.webp" width="96" height="96" alt="" loading="lazy" decoding="async">`;
function hubVisual(spec) {
  const [kind, value] = spec.split(':');
  if (kind === 'rank') return rankImg(value, 'hub-tile__rank');
  if (kind === 'ranks') return value.split(',').map(name => rankImg(name, 'hub-tile__rank hub-tile__rank--pair')).join('');
  if (kind === 'hero') return heroImg(value, 'hub-tile__hero');
  return `<i class="fas ${value}" aria-hidden="true"></i>`;
}
function guideHub(hub, lang) {
  const en = lang === 'en';
  const tiles = hub.items.map(([title, text, href, visual, kind]) => `<a class="hub-tile" href="${href}"><span class="hub-tile__media" aria-hidden="true">${hubVisual(visual)}</span><span class="hub-tile__body"><span class="hub-tile__kind">${kind}</span><strong>${title}</strong><span class="hub-tile__text">${text}</span></span><i class="fas fa-arrow-right hub-tile__go" aria-hidden="true"></i></a>`).join('');
  return `<section class="guide-hub" aria-labelledby="hub-${hub.id}"><div class="container"><div class="guide-hub__head"><span class="guide-hub__label">${hub.label}</span><h2 id="hub-${hub.id}">${hub.title}</h2>${hub.text ? `<p>${hub.text}</p>` : ''}</div><div class="guide-hub__grid">${tiles}</div></div></section>`;
}
// Product-style illustrations for landing heroes: the order as the bot shows it, with real rank icons.
function uiArt(kind, lang) {
  const en = lang === 'en';
  const t = (ru, enText) => en ? enText : ru;
  const card = (head, pill, body, foot) => `<div class="ui-art" aria-hidden="true"><div class="ui-card"><div class="ui-card__head"><span>${head}</span>${pill ? `<span class="ui-pill">${pill}</span>` : ''}</div>${body}<div class="ui-card__foot">${foot}</div></div></div>`;
  const route = (a, aLabel, b, bLabel) => `<div class="ui-route"><figure>${rankImg(a)}<figcaption>${aLabel}</figcaption></figure><span class="ui-route__arrow"><i class="fas fa-arrow-right"></i></span><figure>${rankImg(b)}<figcaption>${bLabel}</figcaption></figure></div>`;
  const progress = (pct, label) => `<div class="ui-progress"><span class="ui-progress__track"><span class="ui-progress__fill" style="width:${pct}%"></span></span><span class="ui-progress__label">${label}</span></div>`;
  if (kind === 'mythic') return fillTokens(card(t('Ваш заказ', 'Your order'), t('Обычный', 'Account'),
    route('Mythical_Glory', t('Слава 50⭐', 'Glory 50⭐'), 'Mythical_Immortal', t('Бессмертный 100⭐', 'Immortal 100⭐')) + progress(68, t('34 из 50⭐ · 21W 4L', '34 of 50⭐ · 21W 4L')),
    `<span>${t('Итого', 'Total')}</span><strong>{{gloryRouteStd}}</strong>`), lang);
  if (kind === 'hero') return fillTokens(card(t('Буст на герое', 'Hero boost'), t('На герое', 'Hero'),
    `<div class="ui-hero">${heroImg('harley', 'ui-hero__icon')}<div><strong>${t('Харли', 'Harley')}</strong><span>${t('Бессмертный 157⭐ → 168⭐', 'Immortal 157⭐ → 168⭐')}</span></div>${rankImg('Mythical_Immortal', 'ui-hero__rank')}</div>` + progress(82, t('9 из 11⭐ · 10W 1L', '9 of 11⭐ · 10W 1L')),
    `<span>${t('Медиана заказа', 'Median order')}</span><strong>${t('≈ 6 ч', '≈ 6 h')}</strong>`), lang);
  if (kind === 'placement') {
    const dots = ['w', 'w', 'l', 'w', 'w', 'l', '', '', '', ''].map((r, i) => `<span class="ui-match ui-match--${r || 'next'}">${r === 'w' ? '+2' : r === 'l' ? '0' : i + 1}</span>`).join('');
    return card(t('Калибровка Мифика', 'Mythic placement'), t('6 из 10', '6 of 10'),
      `<div class="ui-placement">${rankImg('Mythic', 'ui-placement__rank')}<div class="ui-matches">${dots}</div></div>`,
      `<span>${t('Мифик', 'Mythic')}</span><strong>8⭐</strong>`);
  }
  if (kind.startsWith('profile:')) return profileArt(kind.slice(8), lang, heroesData);
  if (kind === 'party') return card(t('Пати', 'Party'), t('Готовы', 'Ready'),
    `<div class="ui-lobby"><div class="ui-player">${rankImg('Mythical_Glory')}<div><strong>${t('Вы', 'You')}</strong><span>${t('Мифическая слава', 'Mythical Glory')}</span></div><span class="ui-ready"></span></div><div class="ui-player">${rankImg('Mythical_Immortal')}<div><strong>${t('Бустер', 'Booster')}</strong><span>${t('Бессмертный', 'Immortal')}</span></div><span class="ui-ready"></span></div></div>`,
    `<span>${t('Вход в аккаунт', 'Account login')}</span><strong>${t('не нужен', 'not needed')}</strong>`);
  return '';
}
function guideArticle(guide, lang) {
  const en = lang === 'en';
  const [, , body, rawFaq = []] = guide[lang];
  const faq = rawFaq.map(([q, a]) => [q, fillTokens(a, lang)]);
  const updated = guide.updated || '2026-10-05';
  const crumbs = guide.crumb ? [localized(guide.crumb[0], lang), en ? guide.crumb[2] : guide.crumb[1]] : [localized('/services.html', lang), en ? 'Services' : 'Услуги'];
  const faqHTML = faq.length ? `<section class="seo-faq" aria-labelledby="faq-${guide.file.replace(/\W+/g, '-')}"><h2 id="faq-${guide.file.replace(/\W+/g, '-')}">${en ? 'Frequently asked questions' : 'Частые вопросы'}</h2>${faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</section>` : '';
  if (guide.layout === 'landing') {
    const hero = guide[lang][4];
    const art = guide.art ? `<div class="lp-hero__art">${uiArt(guide.art, lang)}</div>` : '';
    return `<div class="prices-page lp-page"><div class="prices-hero lp-hero${guide.art ? ' lp-hero--art' : ''}"><div class="hero-glow"></div><div class="container lp-hero__grid"><div class="lp-hero__copy"><nav class="lp-crumbs" aria-label="${en ? 'Breadcrumbs' : 'Хлебные крошки'}"><a href="${localized('/', lang)}">${en ? 'Home' : 'Главная'}</a> / <a href="${crumbs[0]}">${crumbs[1]}</a></nav><div class="hero-badge"><i aria-hidden="true" class="fas ${hero.icon}"></i><span>${hero.badge}</span></div><h1 class="prices-title">${hero.h1}</h1><p class="prices-subtitle lp-subtitle">${fillTokens(hero.sub, lang)}</p><div class="hero-cta lp-actions"><a href="${localized(hero.primary[1].split('?')[0], lang)}${hero.primary[1].includes('?') ? '?' + hero.primary[1].split('?')[1] : ''}" class="calc-btn"><i aria-hidden="true" class="fas fa-calculator"></i><span>${hero.primary[0]}</span></a><a href="${hero.secondary[1]}" class="lp-ghost"><i aria-hidden="true" class="${hero.secondaryIcon ? `fas ${hero.secondaryIcon}` : 'fab fa-telegram'}"></i><span>${hero.secondary[0]}</span></a></div></div>${art}</div></div><div class="container lp-body">${fillTokens(body, lang)}${faqHTML}<p class="seo-date">${en ? 'MLBB Boost editorial team · Updated' : 'Редакция MLBB Boost · Обновлено'} <time datetime="${updated}">${formatDate(updated, lang)}</time></p></div></div>`;
  }
  return `<article class="seo-guide container${guide.wide ? ' seo-guide-wide' : ''}"><nav aria-label="${en ? 'Breadcrumbs' : 'Хлебные крошки'}"><a href="${localized('/', lang)}">${en ? 'Home' : 'Главная'}</a> / <a href="${crumbs[0]}">${crumbs[1]}</a></nav>${fillTokens(body, lang)}${faqHTML}<p class="seo-date">${en ? 'MLBB Boost editorial team · Updated' : 'Редакция MLBB Boost · Обновлено'} <time datetime="${updated}">${formatDate(updated, lang)}</time></p></article>`;
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
  const guide = guideOf(file);
  const isArticle = guide && guide.kind !== 'service';
  const page = { '@type': isArticle ? 'Article' : file === 'about.html' ? 'AboutPage' : file === 'reviews.html' ? 'CollectionPage' : 'WebPage', '@id': `${url}#page`, url, name: title, description, inLanguage: lang, isPartOf: { '@id': web['@id'] }, publisher: { '@id': org['@id'] } };
  if (guide) { page.headline = document.querySelector('h1').textContent.trim(); page.author = { '@id': org['@id'] }; page.image = guide.image ? `${origin}/images/guides/${guide.image}.jpg` : `${origin}/images/social-${lang}.png`; page.datePublished = guide.published || '2026-10-05'; page.dateModified = guide.updated || guide.published || '2026-10-05'; }
  const graph = [org, web, page];
  if (guide?.kind === 'service') graph.push({ '@type': 'Service', '@id': `${url}#service`, name: document.querySelector('h1').textContent.trim(), serviceType: 'Mobile Legends: Bang Bang rank boosting', provider: { '@id': org['@id'] }, areaServed: lang === 'en' ? 'Worldwide' : 'RU', url, offers: { '@type': 'AggregateOffer', priceCurrency: 'RUB', lowPrice: Math.min(...data.prices.filter(r => guide.priceCategories?.includes(r.category) ?? true).map(r => r.prices.find(p => p.type === (guide.priceType || 'standard')).price)), offerCount: data.prices.length } });
  if (guide?.[lang][3]?.length) graph.push({ '@type': 'FAQPage', '@id': `${url}#faq`, mainEntity: guide[lang][3].map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: fillTokens(a, lang).replace(/<[^>]+>/g, '') } })) });
  if (guide?.tool) graph.push({ '@type': 'WebApplication', '@id': `${url}#tool`, name: guide.tool[lang], url, applicationCategory: 'GameApplication', operatingSystem: 'Web browser', offers: { '@type': 'Offer', price: 0, priceCurrency: 'RUB' } });
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
  document.querySelector('main').innerHTML = guideArticle(guide, 'ru');
  await save(guide.file, '<!DOCTYPE html>\n' + document.documentElement.outerHTML + '\n');
}
for (const file of [...pageFiles, ...config.guides.map(g => g.file)]) {
  const source = await read(file);
  for (const lang of ['ru', 'en']) {
    const { document } = parseHTML(source);
    const navigation = document.querySelector('.nav-list');
    if (navigation) navigation.innerHTML = [['/', 'Главная', 'fa-home'], ['/services.html', 'Услуги', 'fa-star'], ['/prices.html', 'Цены', 'fa-tags'], ['/reviews.html', 'Отзывы', 'fa-comments'], ['/news/', 'Новости', 'fa-newspaper'], ['/faq.html', 'FAQ', 'fa-question-circle'], ['/about.html', 'О нас', 'fa-users']].map(([href, label, icon]) => `<li><a href="${href}" class="nav-link"><i class="fas ${icon}" aria-hidden="true"></i>${label}</a></li>`).join('') + '<li><a href="/order.html" class="nav-link cta"><i class="fas fa-shopping-cart" aria-hidden="true"></i>Купить буст</a></li>';
    for (const element of document.querySelectorAll('.channel-title, .site-footer a')) {
      element.innerHTML = element.innerHTML.replace(/\d+\+? отзывов/g, `${data.reviewStats.count} отзывов`).replace(/Отзывы \(\d+\+?\)/g, `Отзывы (${data.reviewStats.count})`);
    }
    document.querySelectorAll('[data-seo-generated]').forEach(node => node.remove());
    if (guideOf(file)) document.querySelector('main').innerHTML = '';
    if (file === 'index.html') {
      // The home "fresh article" card shows the pinned post (owner's choice), otherwise the newest one.
      const card = document.querySelector('.home-news-card');
      const newest = newsPosts.find(post => post.slug === HOME_NEWS_SLUG) || [...newsPosts].sort((a, b) => Date.parse(b.datePublished) - Date.parse(a.datePublished))[0];
      if (card && newest) {
        const post = lang === 'en' ? { ...newest, ...newest.translations.en, hero: { ...newest.hero, ...(newest.translations.en.hero || {}) } } : newest;
        card.setAttribute('href', `${lang === 'en' ? '/en' : ''}/news/${newest.slug}/`);
        const source = card.querySelector('source');
        if (source) { source.setAttribute('srcset', post.hero.webpSrcset); source.removeAttribute('data-news-en-srcset'); }
        const img = card.querySelector('img');
        if (img) { img.setAttribute('src', post.hero.src); img.setAttribute('width', String(post.hero.width)); img.setAttribute('height', String(post.hero.height)); img.setAttribute('alt', post.hero.alt); img.setAttribute('style', `object-position: ${post.hero.focalPoint || '50% 50%'}`); for (const attr of ['data-news-en-src', 'data-news-en-alt']) img.removeAttribute(attr); img.closest('figure')?.setAttribute('data-i18n-skip', ''); }
        const title = card.querySelector('h2'); if (title) { title.textContent = post.title; title.setAttribute('data-i18n-skip', ''); }
        const text = card.querySelector('.home-news-card__content p'); if (text) { text.textContent = post.excerpt; text.setAttribute('data-i18n-skip', ''); }
      }
    }
    if (lang === 'en') translateDOM(document.body, file);
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-static-locale', lang);
    const guide = config.guides.find(g => g.file === file);
    const metadata = guide ? guide[lang] : config.pages[file]?.[lang];
    const title = metadata?.[0] || (lang === 'en' ? translate(document.title, file) : document.title);
    const description = metadata?.[1] || (lang === 'en' ? translate(document.querySelector('meta[name="description"]')?.content || '', file) : document.querySelector('meta[name="description"]')?.content || '');
    if (guide) document.querySelector('main').innerHTML = guideArticle(guide, lang);
    if (guide?.layout === 'landing' && !document.querySelector('link[href*="/styles/prices.css"]')) {
      const style = document.createElement('link'); style.rel = 'stylesheet'; style.href = '/styles/prices.css?v=mythic-calibration-3'; document.head.append(style);
    }
    for (const src of guide?.scripts || []) {
      document.querySelector(`script[src^="${src}"]`)?.remove();
      const script = document.createElement('script'); script.src = `${src}?v=${guide.updated || 1}`; script.setAttribute('defer', ''); document.head.append(script);
    }
    const footerGrid = document.querySelector('.site-footer .footer-grid');
    if (footerGrid) {
      footerGrid.querySelector('.footer-guides')?.remove();
      const column = document.createElement('div'); column.className = 'footer-column footer-guides'; column.setAttribute('data-i18n-skip', '');
      column.innerHTML = `<h4>${lang === 'en' ? 'Guides' : 'Полезное'}</h4><ul>${footerGuides.map(([href, ru, en]) => `<li><a href="${href}">${lang === 'en' ? en : ru}</a></li>`).join('')}</ul>`;
      const columns = [...footerGrid.children].filter(node => node.classList.contains('footer-column'));
      if (columns[1]) columns[1].after(column); else footerGrid.append(column);
    }
    document.title = title;
    for (const [name, value, property] of [
      ['description', description], ['robots', file === '404.html' || (lang === 'en' && guideOf(file)?.ruOnly) ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'],
      ['og:title', title, true], ['og:description', description, true], ['og:type', guide ? 'article' : 'website', true], ['og:locale', lang === 'en' ? 'en_US' : 'ru_RU', true],
      ['og:url', origin + localized(filePath(file), lang), true], ['og:image', guide?.image ? `${origin}/images/guides/${guide.image}.jpg` : `${origin}/images/social-${lang}.png`, true],
      ['og:image:width', '1200', true], ['og:image:height', guide?.image ? '675' : '630', true], ['og:image:alt', lang === 'en' ? 'MLBB Boost — rank boost options and calculator' : 'MLBB Boost — услуги буста и калькулятор', true],
      ['twitter:card', 'summary_large_image'], ['twitter:title', title], ['twitter:description', description], ['twitter:image', guide?.image ? `${origin}/images/guides/${guide.image}.jpg` : `${origin}/images/social-${lang}.png`], ['theme-color', '#0A1A2F']
    ]) meta(document, `meta[${property ? 'property' : 'name'}="${name}"]`, name, value, property);
    document.querySelectorAll('meta[name="keywords"],meta[name="revisit-after"],meta[name="geo.position"],meta[name="ICBM"],meta[name="language"],meta[name="distribution"],meta[name="rating"]').forEach(node => node.remove());
    document.querySelectorAll('link[rel="canonical"],link[hreflang],link[rel="alternate"][type="text/markdown"]').forEach(node => node.remove());
    const canonical = origin + localized(filePath(file), lang);
    // Russian-only pages (hero stats) have no English alternate: the English copy stays reachable but is not indexed.
    for (const [rel, hreflang, href] of [['canonical', null, canonical], ...(guideOf(file)?.ruOnly ? [] : [['alternate', 'ru', origin + filePath(file)], ['alternate', 'en', origin + localized(filePath(file), 'en')], ['alternate', 'x-default', origin + filePath(file)]])]) {
      const link = document.createElement('link'); link.rel = rel; link.href = href; if (hreflang) link.hreflang = hreflang; document.head.append(link);
    }
    const mdPath = `/markdown/${lang === 'en' ? 'en/' : ''}${file.replace(/\.html$/, '.md')}`;
    const mdLink = document.createElement('link'); mdLink.rel = 'alternate'; mdLink.type = 'text/markdown'; mdLink.href = mdPath; document.head.append(mdLink);
    document.querySelectorAll('link[rel="api-catalog"]').forEach(link => link.href = '/.well-known/api-catalog.json');
    if (config.blocks[file]) block(document, 'content', fillTokens(config.blocks[file][lang], lang));
    if (config.related?.[file]) block(document, 'related', typeof config.related[file][lang] === 'string' ? config.related[file][lang] : guideHub(config.related[file][lang], lang));
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
      block(document, 'reviews-snapshot', `<section class="seo-section review-wall-section"><div class="container"><h2>${lang === 'en' ? 'Latest customer reviews' : 'Последние отзывы клиентов'}</h2><p>${descriptionText}</p>${reviewWall(data.reviews, lang)}</div></section>`);
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
    document.querySelector('link[href*="/styles/ui.css"]')?.remove();
    const interfaceStyle = document.createElement('link'); interfaceStyle.rel = 'stylesheet'; interfaceStyle.href = '/styles/ui.css?v=32'; document.head.append(interfaceStyle);
    document.querySelector('script[src*="/js/ui.js"]')?.remove();
    if (['prices.html', 'reviews.html'].includes(file)) {
      const interfaceScript = document.createElement('script'); interfaceScript.src = '/js/ui.js?v=30'; interfaceScript.setAttribute('defer', ''); document.head.append(interfaceScript);
    }
    for (const node of document.querySelectorAll('script[src],link[href*="/styles/seo.css"]')) {
      const attribute = node.tagName === 'SCRIPT' ? 'src' : 'href';
      const asset = new URL(node.getAttribute(attribute), origin);
      if (['/js/main.js', '/js/prices.js', '/js/reviews.js', '/js/consent.js', '/js/calculator.js', '/js/i18n.js', '/js/i18n-seo.js', '/styles/seo.css'].includes(asset.pathname)) {
        asset.searchParams.set('v', asset.pathname === '/js/calculator.js' ? '33' : asset.pathname === '/styles/seo.css' ? '40' : '30');
        node.setAttribute(attribute, asset.pathname + asset.search);
      }
    }
    if (file === 'index.html' && !document.querySelector('script[src*="particles.min.js"]')) {
      const effects = document.createElement('script'); effects.src = '/js/vendor/particles.min.js'; effects.setAttribute('defer', ''); document.head.append(effects);
    }
    if (file === 'index.html') {
      const container = document.querySelector('#particles-js');
      container.innerHTML = '<img class="hero-lightning-fallback" src="/images/hero-network.svg" width="1440" height="900" alt="">';
      document.querySelector('.effects-toggle')?.remove();
      const controls = document.querySelector('.hero-controls');
      if (controls) { controls.before(...controls.childNodes); controls.remove(); }
      document.querySelector('script[src*="/js/hero-effects.js"]')?.remove();
      const controller = document.createElement('script'); controller.src = '/js/hero-effects.js?v=32'; controller.setAttribute('defer', ''); document.head.append(controller);
    }
    if (file === 'reviews.html') {
      document.querySelector('script[src*="/js/review-text.js"]')?.remove();
      const cleaner = document.createElement('script'); cleaner.src = '/js/review-text.js?v=30';
      document.querySelector('script[src*="/js/reviews.js"]').before(cleaner);
      document.querySelector('#reviews-search').setAttribute('aria-label', lang === 'en' ? 'Search customer reviews' : 'Поиск по отзывам клиентов');
      const toolbar = document.querySelector('.reviews-toolbar');
      let disclosure = toolbar.querySelector('.review-filter-options');
      if (!disclosure) {
        disclosure = document.createElement('details'); disclosure.className = 'review-filter-options'; disclosure.open = true;
        toolbar.querySelector('.reviews-search').after(disclosure);
        toolbar.querySelectorAll('.filter-block').forEach(node => disclosure.append(node));
      }
      disclosure.querySelector('summary')?.remove();
      const summary = document.createElement('summary'); summary.textContent = lang === 'en' ? 'Review filters' : 'Фильтры отзывов'; summary.setAttribute('data-i18n-skip', ''); disclosure.prepend(summary);
      let footer = toolbar.querySelector('.reviews-controls-footer');
      if (!footer) { footer = document.createElement('div'); footer.className = 'reviews-controls-footer'; footer.append(document.querySelector('#reviews-meta')); toolbar.append(footer); }
      footer.querySelector('.reviews-reset')?.remove();
      const reset = document.createElement('button'); reset.type = 'button'; reset.className = 'reviews-reset'; reset.id = 'reviews-reset'; reset.textContent = lang === 'en' ? 'Reset filters' : 'Сбросить фильтры'; reset.setAttribute('data-i18n-skip', ''); footer.append(reset);
    }
    if (file === 'order.html' && lang === 'en') document.getElementById('order-btn')?.setAttribute('href', 'https://t.me/Cla1ve');
    if (file === 'prices.html') {
      document.querySelector('.price-format-bar')?.remove();
      const bar = document.createElement('div'); bar.className = 'price-format-bar'; bar.hidden = true; bar.setAttribute('data-i18n-skip', '');
      const formats = lang === 'en' ? [['all','All formats'],['standard','Account'],['party','Party'],['role','Role'],['hero','Hero']] : [['all','Все форматы'],['standard','Обычный'],['party','В пати'],['role','На роли'],['hero','На герое']];
      bar.innerHTML = `<span class="price-format-label">${lang === 'en' ? 'Compare rates by format' : 'Сравните тарифы по формату'}</span><div class="price-format-options" role="group" aria-label="${lang === 'en' ? 'Boost format' : 'Формат буста'}">${formats.map(([value,label]) => `<button type="button" data-price-format="${value}" aria-pressed="${value === 'all'}">${label}</button>`).join('')}</div>`;
      const grid = document.querySelector('#prices-grid'); grid.before(bar);
      grid.querySelectorAll('.price-card-link').forEach(node => node.remove());
      grid.querySelectorAll('.rank-info').forEach(node => {
        const link = document.createElement('a'); link.href = localized('/order.html', lang); link.className = 'price-card-link'; link.setAttribute('data-i18n-skip', ''); link.innerHTML = `${lang === 'en' ? 'Calculate order' : 'Рассчитать заказ'} <i class="fas fa-arrow-right" aria-hidden="true"></i>`; node.append(link);
      });
    }
    document.querySelector('#particles-js')?.setAttribute('aria-hidden', 'true');
    document.querySelectorAll('link[href*="font-awesome"]').forEach(node => node.setAttribute('href', '/styles/icons.css'));
    document.querySelectorAll('link[href*="/styles/icons.css"]').forEach(node => node.setAttribute('href', '/styles/icons.css?v=30'));
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
    mainCopy.querySelectorAll('script, style, .loader, #particles-js, .hero-gradient-overlay, .hero-character, .effects-toggle, .price-format-bar').forEach(el => el.remove());
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
await save('llms.txt', `# MLBB Boost\n\n> Independent service for arranging Mobile Legends: Bang Bang rank boosts and party play. Not affiliated with MOONTON Games.\n\nOrders are arranged through Telegram. Check the website prices and calculator for order estimates; first-order discount eligibility and timing must be confirmed before payment. Account access carries risks; no guarantee of no sanctions. Published reviews are not independently certified.\n\n## Services and policies\n${rendered.filter(p => ['index.html', 'services.html', 'prices.html', 'order.html', 'faq.html', 'about.html', 'reviews.html', 'refund.html', 'security.html', 'disclaimer.html'].includes(p.file) && p.lang === 'en').map(p => `- [${p.title}](${p.url})`).join('\n')}\n\n## Guides\n${rendered.filter(p => guideOf(p.file) && !guideOf(p.file).noLlms && p.lang === 'en').map(p => `- [${p.title}](${p.url})`).join('\n')}\n\n## Machine-readable public resources\n- [Full content in Markdown](${origin}/llms-full.txt)\n- [Russian news feed](${origin}/news/rss.xml)\n- [English news feed](${origin}/en/news/rss.xml)\n\nRead the linked website pages for the complete service terms.\n`);
await save('llms-full.txt', `# MLBB Boost public content\n\nGenerated from the same HTML content available to visitors. Canonical website pages remain authoritative.\n\n${rendered.filter(p => p.lang === 'en' && (config.pages[p.file] || (guideOf(p.file) && !guideOf(p.file).noLlms))).map(p => `## ${p.title}\n\nSource: ${p.url}\n\n${p.text}`).join('\n\n---\n\n')}\n`);
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
    if (lang === 'en' && guideOf(file)?.ruOnly) { manifest.pages = manifest.pages.filter(p => p.pathname !== pathname); continue; }
    const existing = manifest.pages.find(p => p.pathname === pathname);
    if (!existing) manifest.pages.push({ pathname, lastmod: guideOf(file)?.published || '2026-10-05' });
    else if (existing.lastmod < '2026-10-05') existing.lastmod = '2026-10-05';
    const entry = manifest.pages.find(p => p.pathname === pathname);
    const guideUpdated = guideOf(file)?.updated;
    if (guideUpdated && entry.lastmod < guideUpdated) entry.lastmod = guideUpdated;
    if (['index.html', 'about.html', 'prices.html', 'services.html', 'reviews.html'].includes(file) && entry.lastmod < changedDate) entry.lastmod = changedDate;
    if (guideOf(file)?.ruOnly) entry.ruOnly = true; else delete entry.ruOnly;
  }
}
await save('content/site-pages.json', JSON.stringify(manifest, null, 2) + '\n');
await save('content/translation-gaps.json', JSON.stringify([...untranslated].map(([text, files]) => ({ text, files: [...files] })), null, 2) + '\n');
console.log(`Built ${rendered.length} HTML pages and Markdown alternatives; ${untranslated.size} translation gaps to review.`);
