// Ranking pages built from the same data as the tier list: "best <role>" lists and the beginner list.
// Imported by hero-pages.mjs, which passes its helpers in; nothing here fetches data.
const MONTHS_NOM_RU = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const PUBLISHED = '2026-11-24';

// One list per role or lane that people search for ("лучшие лесники", "лучшие стрелки", ...).
// Lists with `off: true` are built in code but not published: demand is only seen in Google suggestions (no Yandex), volume unknown.
const ALL_DEFS = [
  { key: 'jungle', by: 'lane', value: 'Jungle', icon: 'jungle',
    ru: { h1: 'Лучшие лесники MLBB', short: 'Лесники', one: 'лесник', nom: 'лесники', gen: 'лесников', loc: 'лесниках', set: 'В списке все, кто играет в лесу по данным игры.' },
    en: { h1: 'Best MLBB junglers', short: 'Junglers', one: 'jungler', nom: 'junglers', gen: 'junglers', loc: 'junglers', set: 'The list has every hero that plays the jungle, according to the game.' } },
  { key: 'marksman', by: 'role', value: 'Marksman', icon: 'marksman',
    ru: { h1: 'Лучшие стрелки MLBB', short: 'Стрелки', one: 'стрелок', nom: 'стрелки', gen: 'стрелков', loc: 'стрелках', set: 'В списке все герои роли «Стрелок».' },
    en: { h1: 'Best MLBB marksmen', short: 'Marksmen', one: 'marksman', nom: 'marksmen', gen: 'marksmen', loc: 'marksmen', set: 'The list has every hero with the Marksman role.' } },
  { key: 'mage', off: true, by: 'role', value: 'Mage', icon: 'mage',
    ru: { h1: 'Лучшие маги MLBB', short: 'Маги', one: 'маг', nom: 'маги', gen: 'магов', loc: 'магах', set: 'В списке все герои роли «Маг».' },
    en: { h1: 'Best MLBB mages', short: 'Mages', one: 'mage', nom: 'mages', gen: 'mages', loc: 'mages', set: 'The list has every hero with the Mage role.' } },
  { key: 'fighter', by: 'role', value: 'Fighter', icon: 'fighter',
    ru: { h1: 'Лучшие бойцы MLBB', short: 'Бойцы', one: 'боец', nom: 'бойцы', gen: 'бойцов', loc: 'бойцах', set: 'В списке все герои роли «Боец».' },
    en: { h1: 'Best MLBB fighters', short: 'Fighters', one: 'fighter', nom: 'fighters', gen: 'fighters', loc: 'fighters', set: 'The list has every hero with the Fighter role.' } },
  { key: 'tank', off: true, by: 'role', value: 'Tank', icon: 'tank',
    ru: { h1: 'Лучшие танки MLBB', short: 'Танки', one: 'танк', nom: 'танки', gen: 'танков', loc: 'танках', set: 'В списке все герои роли «Танк».' },
    en: { h1: 'Best MLBB tanks', short: 'Tanks', one: 'tank', nom: 'tanks', gen: 'tanks', loc: 'tanks', set: 'The list has every hero with the Tank role.' } },
  { key: 'assassin', off: true, by: 'role', value: 'Assassin', icon: 'assassin',
    ru: { h1: 'Лучшие убийцы MLBB', short: 'Убийцы', one: 'убийца', nom: 'убийцы', gen: 'убийц', loc: 'убийцах', set: 'В списке все герои роли «Убийца».' },
    en: { h1: 'Best MLBB assassins', short: 'Assassins', one: 'assassin', nom: 'assassins', gen: 'assassins', loc: 'assassins', set: 'The list has every hero with the Assassin role.' } },
  { key: 'roam', off: true, by: 'lane', value: 'Roam', icon: 'roam',
    ru: { h1: 'Лучшие роумеры MLBB', short: 'Роум', one: 'роумер', nom: 'роумеры', gen: 'роумеров', loc: 'роумерах', set: 'В списке все, кто играет роум по данным игры.' },
    en: { h1: 'Best MLBB roamers', short: 'Roam', one: 'roamer', nom: 'roamers', gen: 'roamers', loc: 'roamers', set: 'The list has every hero that plays roam, according to the game.' } },
  { key: 'mid', off: true, by: 'lane', value: 'Mid Lane', icon: 'mid',
    ru: { h1: 'Лучшие мидеры MLBB', short: 'Мид', one: 'мидер', nom: 'мидеры', gen: 'мидеров', loc: 'мидерах', set: 'В списке все, кто играет на средней линии по данным игры.' },
    en: { h1: 'Best MLBB mid laners', short: 'Mid', one: 'mid laner', nom: 'mid laners', gen: 'mid laners', loc: 'mid laners', set: 'The list has every hero that plays the mid lane, according to the game.' } }
];
export const LIST_DEFS = ALL_DEFS.filter(def => !def.off);
export const BEGINNER = { key: 'beginners', file: 'heroes/for-beginners.html', url: '/heroes/for-beginners.html' };
export const listFile = def => `heroes/best-${def.key}.html`;
export const listUrl = def => `/heroes/best-${def.key}.html`;
export const members = (def, heroes) => heroes.filter(hero => def.by === 'lane' ? hero.lanes.includes(def.value) : hero.roles.includes(def.value));

// "ноябрь 2026" / "November 2026" from a data stamp (2026-11-24 ...).
export const monthLabelOf = (lang, stamp, monthsEn) => { const [y, mo] = stamp.slice(0, 10).split('-').map(Number); return lang === 'en' ? `${monthsEn[mo - 1]} ${y}` : `${MONTHS_NOM_RU[mo - 1]} ${y}`; };
const plural = (n, [one, few, many]) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? few : many; };
const avg = values => values.reduce((sum, value) => sum + value, 0) / values.length;

export function rankingGuides(ctx) {
  const { heroes, acad, dict, buildsOf, statsOf, name, esc, fmt, pct1, chip, gear, icon, longDate, shortDate, statsStamp, hasTop, updated, ROLE, BOT_PRICE, MONTHS_EN } = ctx;
  const [year, monthNo] = statsStamp.slice(0, 10).split('-').map(Number);
  const m = hero => statsOf(hero);
  const diff = hero => acad[hero.slug]?.ability?.[3];
  const hasPro = heroes.some(hero => hero.pro?.presence > 0);
  const section = (id, title, inner) => `<section class="atlas-section" id="${id}"><h2>${title}</h2>${inner}</section>`;
  const label = (entry, lang) => entry ? esc(lang === 'en' ? entry.en : entry.ru) : '';
  const quote = (entry, lang) => entry ? (lang === 'en' ? entry.en : `«${entry.ru}»`) : '';
  const joinNames = (list, lang) => list.length > 1 ? `${list.slice(0, -1).join(', ')} ${lang === 'en' ? 'and' : 'и'} ${list.at(-1)}` : list[0] || '';
  const heroWord = (n, lang) => lang === 'en' ? (n === 1 ? 'hero' : 'heroes') : plural(n, ['герой', 'героя', 'героев']);
  const monthLabel = lang => lang === 'en' ? `${MONTHS_EN[monthNo - 1]} ${year}` : `${MONTHS_NOM_RU[monthNo - 1]} ${year}`;

  const mast = (h1, count, lang) => `<header class="arena-mast"><div><h1>${h1}</h1><p>${count} · <time datetime="${statsStamp.slice(0, 10)}" data-ago>${lang === 'en' ? `Updated ${shortDate('en')}` : `Обновлено ${shortDate('ru')}`}</time></p></div></header>`;
  const chips = (lang, current) => {
    const t = (ru, en) => lang === 'en' ? en : ru;
    const items = [...LIST_DEFS.map(def => [def.key, listUrl(def), def[lang].short, def.icon]), [BEGINNER.key, BEGINNER.url, t('Для новичков', 'For beginners'), null]];
    return `<nav class="list-chips" aria-label="${t('Списки героев', 'Hero lists')}">${items.map(([key, href, text, ic]) => `<a href="${href}"${key === current ? ' aria-current="page"' : ''}>${ic ? icon(ic, 20) : ''}<span>${text}</span></a>`).join('')}</nav>`;
  };
  const cta = (title, text, href, button) => `<aside class="hero-cta"><div><strong>${title}</strong><span>${text}</span></div><a class="calc-btn" href="${href}">${button}</a></aside>`;
  const chipList = (rows, lang) => `<ol class="chip-grid">${rows.map(([hero, value]) => `<li>${chip(hero.slug, lang, value)}</li>`).join('')}</ol>`;
  const gearRow = (ids, kind, lang) => ids.map(id => dict[kind][id]).filter(Boolean).map(entry => gear(entry, lang, 'sm')).join('');

  // A hero card: official art, the three numbers and the most common build.
  const card = (hero, no, stats, lang) => {
    const t = (ru, en) => lang === 'en' ? en : ru;
    const build = buildsOf(acad[hero.slug])[0];
    const spell = build && dict.spells[build.spell], emblem = build && dict.emblems[build.emblem];
    const buildHTML = build ? `<div class="pick__items">${gearRow(build.items, 'items', lang)}${emblem ? gear(emblem, lang, 'round') : ''}${spell ? gear(spell, lang, 'round') : ''}</div>` : '';
    return `<article class="pick" data-grade="${hero.tier}">
      <a class="pick__art" href="/heroes/${hero.slug}.html" tabindex="-1" aria-hidden="true"><img src="/images/heroes/art/${hero.slug}.webp" width="240" height="390" alt="" loading="lazy" decoding="async"></a>
      <div class="pick__body">
        <header><span class="pick__no">${no}</span><h3><a href="/heroes/${hero.slug}.html">${esc(name(hero, lang))}</a></h3><span class="grade" data-grade="${hero.tier}" title="${t('Тир', 'Tier')} ${hero.tier}">${hero.tier}</span></header>
        <dl class="pick__stats">${stats.map(([title, value, kind]) => `<div${kind ? ` class="is-${kind}"` : ''}><dt>${title}</dt><dd>${value}</dd></div>`).join('')}</dl>
        ${buildHTML}
      </div></article>`;
  };

  const listGuide = def => {
    const set = members(def, heroes);
    const top = set.slice(0, 3);
    const page = lang => {
      const t = (ru, en) => lang === 'en' ? en : ru;
      const text = def[lang];
      const names = top.map(hero => name(hero, lang));
      const lead = top[0];
      const sa = set.filter(hero => hero.tier === 'S' || hero.tier === 'A').length;
      const when = monthLabel(lang);
      // First build of every hero in the list: which items, spell and emblem repeat.
      const builds = set.map(hero => ({ hero, build: buildsOf(acad[hero.slug])[0] })).filter(item => item.build);
      const tally = (pick, source) => {
        const counts = new Map();
        for (const { build } of builds) for (const id of [].concat(pick(build))) counts.set(id, (counts.get(id) || 0) + 1);
        return [...counts].filter(([id]) => dict[source][id]).sort((a, b) => b[1] - a[1] || a[0] - b[0]);
      };
      const items = tally(build => build.items, 'items').slice(0, 6);
      const spells = tally(build => build.spell, 'spells').slice(0, 2);
      const emblems = tally(build => build.emblem, 'emblems').slice(0, 2);
      // Official counters of every hero in the list: who shows up most often.
      const against = new Map();
      for (const hero of set) for (const slug of hero.counters) against.set(slug, (against.get(slug) || 0) + 1);
      const threats = [...against].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6);
      const bySlug = Object.fromEntries(heroes.map(hero => [hero.slug, hero]));
      // Solo picks: wins in Legend and Mythic over 30 days among heroes that are played and not banned out.
      const solo = set.filter(hero => hero.byRank && hero.pick >= 0.25 && m(hero).ban < 30)
        .map(hero => [hero, avg([hero.byRank.legend, hero.byRank.mythic])]).sort((a, b) => b[1] - a[1]).slice(0, 6);
      if (solo.length < 6) solo.length = solo.length >= 3 ? 3 : 0;
      const easiest = set.filter(hero => diff(hero) != null).sort((a, b) => diff(a) - diff(b) || a.rank - b.rank).slice(0, 3);
      const banned = [...set].sort((a, b) => m(b).ban - m(a).ban).slice(0, 3);

      const intro = `<p class="list-lead">${t(
        `Среди ${text.gen} сейчас лидируют ${joinNames(names, 'ru')}. ${names[0]}: ${fmt(m(lead).win, 'ru', 1)}% побед и бан в ${fmt(m(lead).ban, 'ru', 1)}% матчей Мифической славы за 7 дней. В списке ${set.length} ${heroWord(set.length, 'ru')}${sa ? `, из них ${sa} в тире S или A` : ''}.`,
        `${joinNames(names, 'en')} lead the ${text.gen} right now. ${names[0]} wins ${fmt(m(lead).win, 'en', 1)}% of Mythical Glory games over 7 days and is banned in ${fmt(m(lead).ban, 'en', 1)}% of them. The list has ${set.length} ${heroWord(set.length, 'en')}${sa ? `, ${sa} of them in tier S or A` : ''}.`)}</p>`;

      const spotlight = section('top', t('Топ-3 и их сборки', 'Top 3 and their builds'),
        `<div class="picks">${top.map((hero, i) => card(hero, i + 1, [[t('Победы', 'Win rate'), pct1(m(hero).win, lang), 'lead'], [t('Выбор', 'Pick rate'), pct1(m(hero).pick, lang)], [t('Баны', 'Ban rate'), pct1(m(hero).ban, lang), 'ban']], lang)).join('')}</div>`);

      const head = [['n', '№', 'col-n'], ['hero', t('Герой', 'Hero'), 'th-left'], ['tier', t('Тир', 'Tier')], ['win', t('Победы', 'Win')], ['pick', t('Выбор', 'Pick'), 'col-pick'], ['ban', t('Баны', 'Ban')], ...(hasPro ? [['pro', t('Турниры', 'Pro'), 'col-pro']] : [])];
      const rows = set.map((hero, i) => `<tr><td class="col-n">${i + 1}</td><th scope="row"><a class="row-hero" href="/heroes/${hero.slug}.html"><img src="/images/heroes/${hero.slug}.webp" width="40" height="40" alt="" loading="lazy" decoding="async"><span>${esc(name(hero, lang))}</span></a></th><td><span class="grade" data-grade="${hero.tier}">${hero.tier}</span></td><td>${pct1(m(hero).win, lang)}</td><td class="col-pick">${pct1(m(hero).pick, lang)}</td><td class="is-ban">${pct1(m(hero).ban, lang)}</td>${hasPro ? `<td class="col-pro is-pro">${hero.pro?.presence > 0 ? pct1(hero.pro.presence, lang) : '—'}</td>` : ''}</tr>`).join('');
      const table = section('table', t(`Все ${text.nom} по рейтингу`, `All ${text.nom} ranked`),
        `<p class="atlas-caption">${t('Мифическая слава, 7 дней.', 'Mythical Glory, 7 days.')}${hasPro ? ' ' + t('«Турниры»: доля профессиональных катков за месяц, где героя взяли или забанили.', '“Pro”: the share of professional games over the last month in which the hero was picked or banned.') : ''}</p>
        <div class="table-scroll"><table class="tier-stats rank-table"><thead><tr>${head.map(([, title, cls]) => `<th scope="col"${cls ? ` class="${cls}"` : ''}>${title}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`);

      const usage = items.length ? section('usage', t('Что собирают чаще всего', 'What they build most'),
        `<ul class="usage">${items.map(([id, count]) => `<li><img src="${dict.items[id].icon}" width="56" height="56" alt="" loading="lazy" decoding="async"><span class="usage__name">${label(dict.items[id], lang)}</span><span class="usage__count">${t(`у ${count} из ${builds.length}`, `${count} of ${builds.length}`)}</span></li>`).join('')}</ul>
        <p class="atlas-caption">${t('Три ключевых предмета самой частой сборки каждого героя.', 'The three core items of every hero’s most common build.')}${spells.length ? ' ' + t(`Заклинание: ${joinNames(spells.map(([id, count]) => `${quote(dict.spells[id], 'ru')} у ${count}`), 'ru')}.`, `Spell: ${joinNames(spells.map(([id, count]) => `${quote(dict.spells[id], 'en')} on ${count}`), 'en')}.`) : ''}${emblems.length ? ' ' + t(`${emblems.map(([id, count], i) => `${i ? dict.emblems[id].ru.charAt(0).toLowerCase() + dict.emblems[id].ru.slice(1) : dict.emblems[id].ru} у ${count}`).join(', ')}.`, `${emblems.map(([id, count]) => `${dict.emblems[id].en} on ${count}`).join(', ')}.`) : ''}</p>`) : '';

      const soloSection = solo.length >= 3 ? section('solo', t('Кого брать в соло', 'Who to pick solo'),
        `<p class="atlas-caption">${t('Победы в Легенде и Мифике за 30 дней. Только герои, которых банят реже чем в 30% матчей Мифической славы.', 'Win rate in Legend and Mythic over 30 days. Only heroes banned in fewer than 30% of Mythical Glory games.')}</p>${chipList(solo.map(([hero, win]) => [hero, pct1(win, lang)]), lang)}`) : '';

      const threatSection = threats.length ? section('counters', t(`Кто обыгрывает ${text.gen}`, `Who beats ${text.gen}`),
        `<p class="atlas-caption">${t('Сколько героев списка он обыгрывает по официальным контрпикам.', 'How many heroes of this list it beats, by official counters.')}</p>${chipList(threats.map(([slug, count]) => [bySlug[slug], t(`${count} из ${set.length}`, `${count} of ${set.length}`)]), lang)}`) : '';

      const faq = [
        [t(`Кто лучший ${text.one} в MLBB сейчас?`, `Who is the best ${text.one} in MLBB right now?`), t(
          `${names[0]}: тир ${lead.tier}, ${fmt(m(lead).win, 'ru', 1)}% побед, бан в ${fmt(m(lead).ban, 'ru', 1)}% матчей Мифической славы за 7 дней. Следом идут ${names[1]} и ${names[2]}. Данные на ${longDate('ru')}.`,
          `${names[0]}: tier ${lead.tier}, ${fmt(m(lead).win, 'en', 1)}% win rate, banned in ${fmt(m(lead).ban, 'en', 1)}% of Mythical Glory games over 7 days. ${names[1]} and ${names[2]} follow. Data as of ${longDate('en')}.`)],
        [t(`Что выбрать новичку среди ${text.gen}?`, `Which of the ${text.gen} should a beginner pick?`), easiest.length === 3 ? t(
          `Проще всего играть ${joinNames(easiest.map(hero => name(hero, 'ru')), 'ru')}: по шкале сложности из карточки героя в игре у них ${joinNames(easiest.map(hero => String(diff(hero))), 'ru')} из 100. Простых героев всех ролей мы собрали на <a href="${BEGINNER.url}">отдельной странице</a>.`,
          `${joinNames(easiest.map(hero => name(hero, 'en')), 'en')} are the easiest to play: their difficulty on the in-game hero card is ${joinNames(easiest.map(hero => String(diff(hero))), 'en')} out of 100. Easy heroes of every role are on a <a href="${BEGINNER.url}">separate page</a>.`) : t('Смотрите страницу для новичков.', 'See the page for beginners.')],
        [t(`Каких ${text.gen} чаще всего банят?`, `Which ${text.gen} get banned most?`), t(
          `${joinNames(banned.map(hero => `${name(hero, 'ru')} (${pct1(m(hero).ban, 'ru')})`), 'ru')}. Это доля матчей Мифической славы за 7 дней, где героя забанили.`,
          `${joinNames(banned.map(hero => `${name(hero, 'en')} (${pct1(m(hero).ban, 'en')})`), 'en')}. That is the share of Mythical Glory games over 7 days in which the hero was banned.`)],
        [t(`Сколько ${text.gen} в Mobile Legends?`, `How many ${text.gen} are there in Mobile Legends?`), t(
          `${set.length} из ${heroes.length} героев на ${longDate('ru')}. ${text.set}`,
          `${set.length} of ${heroes.length} heroes as of ${longDate('en')}. ${text.set}`)],
        ...(items.length >= 3 ? [[t(`Какие предметы чаще всего собирают на ${text.loc}?`, `Which items do ${text.gen} build most often?`), t(
          `В самой частой сборке героя чаще всего встречаются ${joinNames(items.slice(0, 3).map(([id, count]) => `${quote(dict.items[id], 'ru')} (у ${count} из ${builds.length})`), 'ru')}. Полная сборка каждого героя лежит на его странице, во вкладке «Сборка».`,
          `The most common builds most often include ${joinNames(items.slice(0, 3).map(([id, count]) => `${quote(dict.items[id], 'en')} (${count} of ${builds.length})`), 'en')}. Every hero’s full build is on its page, in the Build tab.`)]] : [])
      ];

      const body = `<div class="list-page">${chips(lang, def.key)}${intro}${spotlight}${table}${usage}${soloSection}${threatSection}${cta(
        t(`Поднимем ранг на любом из ${text.gen}`, `We can rank up on any of the ${text.gen}`),
        t('Цена считается в калькуляторе', 'The calculator shows the price'), BOT_PRICE, t('Рассчитать цену', 'Calculate price'))}</div>
        <script src="/js/hero-finder.js?v=10" defer></script>`;
      const title = t(`${text.h1}: рейтинг на ${when} | MLBB Boost`, `${text.h1}: ranking for ${when} | MLBB Boost`);
      const description = t(
        `Рейтинг ${text.gen} Mobile Legends на ${when}: победы, выбор и баны, профессиональные драфты, частые сборки и контрпики. Лидируют ${joinNames(names, 'ru')}.`,
        `Ranking of ${text.gen} in Mobile Legends for ${when}: win, pick and ban rates, pro drafts, common builds and counters. ${joinNames(names, 'en')} lead.`);
      const count = `${set.length} ${heroWord(set.length, lang)}`;
      return [title, description, body, faq, { h1: text.h1, html: mast(text.h1, count, lang) }];
    };
    return { file: listFile(def), kind: 'hero', layout: 'landing', published: PUBLISHED, updated, noLlms: true, ruOnly: true, crumb: ['/heroes/', 'Герои', 'Heroes'], list: set.map(hero => hero.slug), ru: page('ru'), en: page('en') };
  };

  // Beginner list: low difficulty on the in-game hero card, ranked by wins in Epic and Legend over 30 days.
  const beginnerGuide = () => {
    const rated = heroes.filter(hero => diff(hero) != null && hero.byRank);
    const wins = hero => avg([hero.byRank.epic, hero.byRank.legend]);
    // Easy on the game's scale, played enough to trust the numbers, and not losing in Epic and Legend.
    const easyAll = rated.filter(hero => diff(hero) <= 30 && hero.pick >= 0.2);
    const easy = easyAll.filter(hero => wins(hero) >= 49).sort((a, b) => wins(b) - wins(a));
    const hard = rated.filter(hero => diff(hero) >= 80).sort((a, b) => diff(b) - diff(a) || a.rank - b.rank);
    const roles = Object.keys(ROLE);
    const roleStats = roles.map(role => { const list = rated.filter(hero => hero.roles.includes(role)); return { role, mean: avg(list.map(diff)), easy: list.filter(hero => diff(hero) <= 30).length, total: list.length }; });
    const roleOrder = [...roleStats].sort((a, b) => a.mean - b.mean);
    // Genitive for "heroes of ...", plus the English phrase.
    const laneNames = { 'EXP Lane': ['линии опыта', 'the EXP lane'], 'Gold Lane': ['линии золота', 'the gold lane'], 'Mid Lane': ['средней линии', 'the mid lane'], Jungle: ['леса', 'the jungle'], Roam: ['роума', 'roam'] };
    const laneMean = Object.keys(laneNames).map(lane => ({ lane, mean: avg(rated.filter(hero => hero.lanes.includes(lane)).map(diff)) })).sort((a, b) => a.mean - b.mean);
    const top = easy.slice(0, 3);
    const page = lang => {
      const t = (ru, en) => lang === 'en' ? en : ru;
      const names = top.map(hero => name(hero, lang));
      const when = monthLabel(lang);
      const star = hero => [[t('Победы, Эпик', 'Win, Epic'), pct1(hero.byRank.epic, lang), 'lead'], [t('Победы, Легенда', 'Win, Legend'), pct1(hero.byRank.legend, lang), 'lead'], [t('Сложность', 'Difficulty'), `${diff(hero)}`]];
      const roleName = (role, l = lang) => l === 'en' ? ROLE[role].enPlural : ROLE[role].plural;
      const intro = `<p class="list-lead">${t(
        `Новичку проще начинать с героев, у которых в игре сложность от 10 до 30 из 100. Таких героев ${easyAll.length}, и у ${easy.length} из них в Эпике и Легенде не меньше 49% побед. Лучше всех выигрывают ${joinNames(names, 'ru')}.`,
        `A beginner has an easier start with heroes rated 10 to 30 out of 100 in difficulty in the game. There are ${easyAll.length} of them, and ${easy.length} win at least 49% in Epic and Legend. ${joinNames(names, 'en')} win the most.`)}</p>`;
      const spotlight = section('top', t('Три героя для старта', 'Three heroes to start with'), `<div class="picks">${top.map((hero, i) => card(hero, i + 1, star(hero), lang)).join('')}</div>`);
      const groups = roles.map(role => ({ role, list: easy.filter(hero => hero.roles.includes(role)).slice(0, 4) })).filter(group => group.list.length);
      const byRole = section('roles', t('Простые герои по ролям', 'Easy heroes by role'), `<p class="atlas-caption">${t('Победы в Эпике и Легенде за 30 дней.', 'Win rate in Epic and Legend over 30 days.')}</p><div class="atlas-roles">${groups.map(({ role, list }) => `<section><h3>${icon(role.toLowerCase(), 22)}<span>${lang === 'en' ? `Easy ${ROLE[role].enPlural}` : `Простые ${ROLE[role].plural}`}</span></h3><ol>${list.map(hero => `<li>${chip(hero.slug, lang, pct1(wins(hero), lang))}</li>`).join('')}</ol></section>`).join('')}</div>`);
      const head = [['hero', t('Герой', 'Hero'), 'th-left'], ['role', t('Роль', 'Role'), 'col-role'], ['diff', t('Сложность', 'Difficulty')], ['epic', t('Эпик', 'Epic')], ['legend', t('Легенда', 'Legend')], ['pick', t('Выбор', 'Pick'), 'col-pick']];
      const rows = easy.map(hero => `<tr><th scope="row"><a class="row-hero" href="/heroes/${hero.slug}.html"><img src="/images/heroes/${hero.slug}.webp" width="40" height="40" alt="" loading="lazy" decoding="async"><span>${esc(name(hero, lang))}</span></a></th><td class="col-role">${hero.roles.map(role => lang === 'en' ? ROLE[role].en : ROLE[role].ru).join(', ')}</td><td>${diff(hero)}</td><td>${pct1(hero.byRank.epic, lang)}</td><td>${pct1(hero.byRank.legend, lang)}</td><td class="col-pick">${pct1(hero.pick, lang)}</td></tr>`).join('');
      const table = section('table', t('Простые и сильные герои', 'Easy and strong heroes'),
        `<p class="atlas-caption">${t('Сложность по шкале игры от 10 до 100. Победы за 30 дней. Выбор по всем рангам.', 'Difficulty on the game’s scale from 10 to 100. Win rates for 30 days. Pick rate across all ranks.')}</p><div class="table-scroll"><table class="tier-stats rank-table"><thead><tr>${head.map(([, title, cls]) => `<th scope="col"${cls ? ` class="${cls}"` : ''}>${title}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`);
      const diffTable = section('difficulty', t('Какие роли проще', 'Which roles are easier'),
        `<p class="atlas-caption">${t('Средняя сложность героев роли по шкале игры.', 'Average difficulty of the role’s heroes on the game’s scale.')}</p><div class="table-scroll"><table class="tier-stats rank-table"><thead><tr><th scope="col" class="th-left">${t('Роль', 'Role')}</th><th scope="col">${t('Средняя сложность', 'Average difficulty')}</th><th scope="col">${t('Простых героев', 'Easy heroes')}</th></tr></thead><tbody>${roleOrder.map(item => `<tr><th scope="row"><span class="row-role">${icon(item.role.toLowerCase(), 24)}<span>${capital(roleName(item.role))}</span></span></th><td>${fmt(item.mean, lang, 0)}</td><td>${item.easy} ${t('из', 'of')} ${item.total}</td></tr>`).join('')}</tbody></table></div>`);
      const hardSection = hard.length ? section('hard', t('Что отложить на потом', 'Leave for later'),
        `<p class="atlas-caption">${t('Сложность от 80 из 100 по шкале игры.', 'Difficulty 80 out of 100 or higher.')}</p>${chipList(hard.map(hero => [hero, `${diff(hero)}`]), lang)}`) : '';
      const faq = [
        [t('Какой герой самый простой в Mobile Legends?', 'Which hero is the easiest in Mobile Legends?'), t(
          `Сложность 10 из 100 у ${rated.filter(hero => diff(hero) === 10).length} ${plural(rated.filter(hero => diff(hero) === 10).length, ['героя', 'героев', 'героев'])}. Среди простых лучше всех выигрывают в Эпике и Легенде ${joinNames(top.map(hero => name(hero, 'ru')), 'ru')}.`,
          `${rated.filter(hero => diff(hero) === 10).length} heroes have a difficulty of 10 out of 100. Among the easy ones, ${joinNames(top.map(hero => name(hero, 'en')), 'en')} win the most in Epic and Legend.`)],
        [t('Какая роль проще для новичка?', 'Which role is easiest for a beginner?'), t(
          `В среднем проще всего ${roleName(roleOrder[0].role, 'ru')} (сложность ${fmt(roleOrder[0].mean, 'ru', 0)}) и ${roleName(roleOrder[1].role, 'ru')} (${fmt(roleOrder[1].mean, 'ru', 0)}), сложнее всего ${roleName(roleOrder.at(-1).role, 'ru')} (${fmt(roleOrder.at(-1).mean, 'ru', 0)}).`,
          `On average ${roleName(roleOrder[0].role, 'en')} (difficulty ${fmt(roleOrder[0].mean, 'en', 0)}) and ${roleName(roleOrder[1].role, 'en')} (${fmt(roleOrder[1].mean, 'en', 0)}) are the easiest, ${roleName(roleOrder.at(-1).role, 'en')} the hardest (${fmt(roleOrder.at(-1).mean, 'en', 0)}).`)],
        [t('Какую линию выбрать новичку?', 'Which lane should a beginner pick?'), t(
          `Самая низкая средняя сложность у героев ${laneNames[laneMean[0].lane][0]}: ${fmt(laneMean[0].mean, 'ru', 0)} из 100. Выше всего она у героев ${laneNames[laneMean.at(-1).lane][0]}: ${fmt(laneMean.at(-1).mean, 'ru', 0)}.`,
          `Heroes of ${laneNames[laneMean[0].lane][1]} have the lowest average difficulty, ${fmt(laneMean[0].mean, 'en', 0)} out of 100. Heroes of ${laneNames[laneMean.at(-1).lane][1]} have the highest, ${fmt(laneMean.at(-1).mean, 'en', 0)}.`)],
        [t('Каких героев лучше не брать в начале?', 'Which heroes should a beginner avoid?'), t(
          `Тех, у кого сложность от 80 из 100: сейчас таких ${hard.length}, среди них ${joinNames(hard.slice(0, 4).map(hero => name(hero, 'ru')), 'ru')}.`,
          `Those rated 80 out of 100 or more: there are ${hard.length} now, including ${joinNames(hard.slice(0, 4).map(hero => name(hero, 'en')), 'en')}.`)]
      ];
      const body = `<div class="list-page">${chips(lang, BEGINNER.key)}${intro}${spotlight}${byRole}${table}${diffTable}${hardSection}${cta(
        t('Не хотите терять звёзды на обучении?', 'Do not want to lose stars while learning?'),
        t('В пати-бусте вы играете вместе с бустером, аккаунт остаётся у вас', 'In party boost you play together with the booster and keep your account'), '/order.html?type=party', t('Рассчитать цену', 'Calculate price'))}</div>
        <script src="/js/hero-finder.js?v=10" defer></script>`;
      const h1 = t('Лучшие герои для новичков в MLBB', 'Best MLBB heroes for beginners');
      const title = t(`Герои для новичков MLBB: рейтинг на ${when} | MLBB Boost`, `MLBB heroes for beginners: ranking for ${when} | MLBB Boost`);
      const description = t(
        `Лучшие герои для новичков Mobile Legends на ${when}: простые по шкале игры и сильные в Эпике и Легенде. Таблица по ролям и список сложных героев.`,
        `The best Mobile Legends heroes for beginners for ${when}: easy on the game’s scale and strong in Epic and Legend. A table by role and a list of hard heroes.`);
      return [title, description, body, faq, { h1, html: mast(h1, `${easy.length} ${heroWord(easy.length, lang)}`, lang) }];
    };
    return { file: BEGINNER.file, kind: 'hero', layout: 'landing', published: PUBLISHED, updated, noLlms: true, ruOnly: true, crumb: ['/heroes/', 'Герои', 'Heroes'], list: easy.map(hero => hero.slug), ru: page('ru'), en: page('en') };
  };
  const capital = text => text.charAt(0).toUpperCase() + text.slice(1);
  return [...LIST_DEFS.map(listGuide), beginnerGuide()];
}
