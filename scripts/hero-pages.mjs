// Builds per-hero pages and the /heroes/ hub as landing "guides" from content/heroes.json
// (official MOONTON hero statistics, 30 days, all ranks). Imported by site-build.mjs.
const BOT_PRICE = '/order.html?type=hero';
// Date of the last content change on hero pages (stats 21.11, roles and lanes from the official hero page 23.11).
const UPDATED = '2026-11-23';
const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const RANK_ROWS = [['epic', 'Epic', 'Эпик', 'Epic'], ['legend', 'Legend', 'Легенда', 'Legend'], ['mythic', 'Mythic', 'Мифический', 'Mythic'], ['honor', 'Mythical_Honor', 'Мифическая честь', 'Mythical Honor'], ['glory', 'Mythical_Glory', 'Мифическая слава', 'Mythical Glory']];

// Official role and lane names (mobilelegends.com/hero, RU and EN versions).
const ROLE = {
  Tank: { ru: 'танк', plural: 'танки', gen: 'танков', en: 'tank', enPlural: 'tanks' },
  Fighter: { ru: 'боец', plural: 'бойцы', gen: 'бойцов', en: 'fighter', enPlural: 'fighters' },
  Assassin: { ru: 'убийца', plural: 'убийцы', gen: 'убийц', en: 'assassin', enPlural: 'assassins' },
  Mage: { ru: 'маг', plural: 'маги', gen: 'магов', en: 'mage', enPlural: 'mages' },
  Marksman: { ru: 'стрелок', plural: 'стрелки', gen: 'стрелков', en: 'marksman', enPlural: 'marksmen' },
  Support: { ru: 'поддержка', plural: 'герои поддержки', gen: 'героев поддержки', en: 'support', enPlural: 'supports' }
};
const LANE = {
  'EXP Lane': { ru: 'Линия опыта', gen: 'линии опыта', en: 'EXP Lane' },
  'Gold Lane': { ru: 'Линия золота', gen: 'линии золота', en: 'Gold Lane' },
  'Mid Lane': { ru: 'Средняя линия', gen: 'средней линии', en: 'Mid Lane' },
  Jungle: { ru: 'Лес', gen: 'леса', en: 'Jungle' },
  Roam: { ru: 'Роум', gen: 'роума', en: 'Roam' }
};
const ROLE_HUB = { Tank: ['Лучшие танки', 'Best tanks'], Fighter: ['Лучшие бойцы', 'Best fighters'], Assassin: ['Лучшие убийцы', 'Best assassins'], Mage: ['Лучшие маги', 'Best mages'], Marksman: ['Лучшие стрелки', 'Best marksmen'], Support: ['Лучшая поддержка', 'Best supports'] };

export function heroGuides(data) {
  const heroes = data.heroes;
  // Stats refresh automatically (scripts/heroes-refresh.mjs); dates in the text follow the data.
  const statsDay = data.updated.slice(0, 10);
  const [year, month, day] = statsDay.split('-').map(Number);
  const statsDate = lang => lang === 'en' ? `${day} ${MONTHS_EN[month - 1]} ${year}` : `${day} ${MONTHS_RU[month - 1]} ${year} года`;
  const updated = statsDay > UPDATED ? statsDay : UPDATED;
  const bySlug = Object.fromEntries(heroes.map(hero => [hero.slug, hero]));
  const pct = (value, lang) => lang === 'en' ? `${value.toFixed(2)}%` : `${value.toFixed(2).replace('.', ',')}%`;
  const num = (value, lang) => lang === 'en' ? value.toFixed(2) : value.toFixed(2).replace('.', ',');
  const name = (hero, lang) => lang === 'en' ? hero.en : hero.ru;
  const byWin = list => [...list].sort((a, b) => b.win - a.win);
  const withRole = role => byWin(heroes.filter(hero => hero.roles.includes(role)));
  const withLane = lane => byWin(heroes.filter(hero => hero.lanes.includes(lane)));
  const capital = text => text.charAt(0).toUpperCase() + text.slice(1);
  const roleList = (hero, lang) => hero.roles.map(role => lang === 'en' ? ROLE[role].en : ROLE[role].ru).join(lang === 'en' ? ' and ' : ' и ');
  const laneList = (hero, lang) => hero.lanes.map(lane => lang === 'en' ? LANE[lane].en : LANE[lane].ru.toLowerCase()).join(lang === 'en' ? ' or ' : ' или ');
  const chip = (slug, lang, valueKey = 'win') => {
    const hero = bySlug[slug];
    return `<a class="hero-chip" href="/heroes/${slug}.html"><img src="/images/heroes/${slug}.webp" width="96" height="96" alt="${name(hero, lang)}" loading="lazy" decoding="async"><span class="hero-chip__name">${name(hero, lang)}</span><span class="hero-chip__value">${pct(hero[valueKey], lang)}</span></a>`;
  };
  const chips = (slugs, lang) => `<div class="hero-chips">${slugs.map(slug => chip(slug, lang)).join('')}</div>`;
  const stats = items => '<div class="lp-stats">' + items.map(([value, label]) => `<div class="lp-stat"><strong>${value}</strong><span>${label}</span></div>`).join('') + '</div>';
  const section = (title, inner, intro = '') => `<section class="lp-section"><h2>${title}</h2>${intro ? `<p class="lp-intro">${intro}</p>` : ''}${inner}</section>`;
  const final = (title, text, button) => `<section class="lp-final"><h2>${title}</h2><p>${text}</p><a class="calc-btn" href="${BOT_PRICE}"><i class="fas fa-calculator" aria-hidden="true"></i><span>${button}</span></a></section>`;
  const patchText = {
    ru: { rework: 'переработан к 10-летию игры', buff: 'усилен', nerf: 'ослаблен', adjusted: 'изменён без явного усиления или ослабления' },
    en: { rework: 'reworked for the game’s 10th anniversary', buff: 'buffed', nerf: 'nerfed', adjusted: 'adjusted without a clear buff or nerf' }
  };
  const tierTitle = { S: 'S', A: 'A', B: 'B', C: 'C', D: 'D' };

  const pages = heroes.map(hero => {
    const strong = [...hero.strongAgainst].sort((a, b) => bySlug[b].pick - bySlug[a].pick).slice(0, 10);
    const counterNames = lang => hero.counters.map(slug => name(bySlug[slug], lang));
    const join = (list, lang) => list.length > 1 ? `${list.slice(0, -1).join(', ')} ${lang === 'en' ? 'and' : 'и'} ${list.at(-1)}` : list[0];
    const roleRank = role => withRole(role).findIndex(item => item.slug === hero.slug) + 1;
    const laneRank = lane => withLane(lane).findIndex(item => item.slug === hero.slug) + 1;
    const laneAt = { 'EXP Lane': ['на линии опыта', 'in the EXP Lane'], 'Gold Lane': ['на линии золота', 'in the Gold Lane'], 'Mid Lane': ['на средней линии', 'in the Mid Lane'], Jungle: ['в лесу', 'in the jungle'], Roam: ['в роуме', 'on roam'] };
    const counterRoles = {};
    hero.counters.forEach(slug => bySlug[slug].roles.forEach(role => { counterRoles[role] = (counterRoles[role] || 0) + 1; }));
    const [topCounterRole, topCounterCount] = Object.entries(counterRoles).sort((a, b) => b[1] - a[1])[0] || [];
    const sameLane = withLane(hero.lanes[0]).filter(item => item.slug !== hero.slug).slice(0, 6);
    const body = lang => {
      const en = lang === 'en';
      const quoted = en ? hero.en : `«${hero.ru}»`;
      let html = stats([
        [pct(hero.win, lang), en ? 'win rate, 30 days' : 'побед за 30 дней'],
        [pct(hero.pick, lang), en ? 'pick rate' : 'выбирают в матчах'],
        [pct(hero.ban, lang), en ? 'ban rate' : 'банят в матчах'],
        [pct(hero.gloryWin, lang), en ? 'wins in Mythical Glory' : 'побед в Мифической славе']
      ]);
      const facts = [
        [en ? 'Role' : 'Роль', capital(roleList(hero, lang))],
        [en ? 'Lane' : 'Линия', capital(laneList(hero, lang))],
        ...hero.roles.map(role => [en ? `Among ${ROLE[role].enPlural}` : `Среди ${ROLE[role].gen}`, en ? `#${roleRank(role)} of ${withRole(role).length}` : `${roleRank(role)}-е из ${withRole(role).length}`]),
        ...hero.lanes.map(lane => [en ? capital(laneAt[lane][1]) : capital(laneAt[lane][0]), en ? `#${laneRank(lane)} of ${withLane(lane).length}` : `${laneRank(lane)}-е из ${withLane(lane).length}`])
      ];
      html += section(en ? 'Role and lane' : 'Роль и линия', `<ul class="hero-facts">${facts.map(([label, value]) => `<li><span>${label}</span><strong>${value}</strong></li>`).join('')}</ul>`,
        en ? `MOONTON’s official hero page lists ${hero.en} as a ${roleList(hero, 'en')} for the ${laneList(hero, 'en')}. Places are by win rate over the last 30 days among heroes of the same role or lane.`
           : `По официальной странице героев MOONTON ${quoted} — ${roleList(hero, 'ru')}, играет ${hero.lanes.map(lane => laneAt[lane][0]).join(' или ')}. Место — по проценту побед за 30 дней среди героев той же роли или линии.`);
      const counterNote = topCounterCount >= 2
        ? (en ? ` ${topCounterCount} of the ${hero.counters.length} counters are ${ROLE[topCounterRole].enPlural}.` : ` ${topCounterCount} из ${hero.counters.length} контрпиков — ${ROLE[topCounterRole].plural}.`)
        : '';
      html += section(en ? `Who counters ${hero.en}` : 'Кто контрит этого героя', chips(hero.counters, lang),
        (en ? `MOONTON’s official statistics list these heroes as the toughest opponents for ${hero.en}. The number is each hero’s own win rate.`
           : `Официальная статистика MOONTON называет этих героев самыми неудобными противниками для героя ${quoted}. Под иконкой — их собственный процент побед.`) + counterNote);
      if (strong.length) html += section(en ? `Who ${hero.en} is strong against` : 'Против кого силён', chips(strong, lang),
        en ? `${hero.en} is listed as a counter for these heroes.` : `${quoted} числится контрпиком для этих героев.`);
      const meta = [];
      meta.push(en ? `${hero.en} sits in tier ${tierTitle[hero.tier]} of our win-rate tier list and ranks ${hero.rank} of 133 heroes.` : `${quoted} — тир ${tierTitle[hero.tier]} в нашем тир-листе по проценту побед, ${hero.rank}-е место из 133 героев.`);
      if (hero.lowPick) meta.push(en ? 'The hero is picked in under 0.5% of matches, so the win rate can swing a lot.' : 'Героя выбирают реже чем в 0,5% матчей, поэтому процент побед может заметно колебаться.');
      const gloryDelta = hero.gloryWin - hero.win;
      if (Math.abs(gloryDelta) >= 0.5) meta.push(en
        ? `In Mythical Glory the win rate is ${gloryDelta > 0 ? 'higher' : 'lower'}: ${pct(hero.gloryWin, 'en')} against ${pct(hero.win, 'en')} across all ranks, a ${num(Math.abs(gloryDelta), 'en')}-point gap.`
        : `В Мифической славе процент побед ${gloryDelta > 0 ? 'выше' : 'ниже'}: ${pct(hero.gloryWin, 'ru')} против ${pct(hero.win, 'ru')} на всех рангах, разница ${num(Math.abs(gloryDelta), 'ru')} п. п.`);
      else meta.push(en ? `In Mythical Glory the result is almost the same: ${pct(hero.gloryWin, 'en')}.` : `В Мифической славе результат почти такой же: ${pct(hero.gloryWin, 'ru')}.`);
      if (typeof hero.gloryBan === 'number' && hero.gloryBan >= 20) meta.push(en ? `At that rank the hero is banned in ${pct(hero.gloryBan, 'en')} of matches.` : `На этом ранге героя банят в ${pct(hero.gloryBan, 'ru')} матчей.`);
      if (hero.patch) meta.push(en ? `In patch 2.2.16 the hero was ${patchText.en[hero.patch]}.` : `В патче 2.2.16 герой ${patchText.ru[hero.patch]}.`);
      if (hero.orders) meta.push(en ? `BOOST MLBB customers ordered ${hero.orders} hero boosts on ${hero.en} over the past year.` : `За год клиенты BOOST MLBB заказали ${hero.orders} бустов на герое ${quoted}.`);
      if (hero.byRank && RANK_ROWS.every(([key]) => typeof hero.byRank[key] === 'number')) {
        const values = RANK_ROWS.map(([key]) => hero.byRank[key]);
        const best = RANK_ROWS[values.indexOf(Math.max(...values))];
        const worst = RANK_ROWS[values.indexOf(Math.min(...values))];
        const bar = value => Math.max(4, Math.min(100, (value - 40) / 25 * 100)).toFixed(1);
        const rows = RANK_ROWS.map(([key, icon, ru, enName]) => `<li><img src="/images/ranks/${icon}.webp" width="40" height="40" alt="" loading="lazy" decoding="async"><span class="hero-ranks__name">${en ? enName : ru}</span><span class="hero-ranks__bar"><i style="width:${bar(hero.byRank[key])}%"></i></span><strong>${pct(hero.byRank[key], lang)}</strong></li>`).join('');
        html += section(en ? 'Win rate by rank' : 'Процент побед по рангам', `<ul class="hero-ranks">${rows}</ul>`,
          en ? `Best result in ${best[3]} (${pct(hero.byRank[best[0]], 'en')}), weakest in ${worst[3]} (${pct(hero.byRank[worst[0]], 'en')}). Official MOONTON statistics for the last 30 days.`
             : `Лучший результат — на ранге «${best[2]}» (${pct(hero.byRank[best[0]], 'ru')}), слабее всего — «${worst[2]}» (${pct(hero.byRank[worst[0]], 'ru')}). Официальная статистика MOONTON за последние 30 дней.`);
      }
      html += section(en ? 'Place in the meta' : 'Место в мете', `<p>${meta.join(' ')} ${en ? 'See the full' : 'Полный'} <a href="/news/mlbb-meta-tier-list/">${en ? 'tier list' : 'тир-лист ноября'}</a> ${en ? 'and the' : 'и'} <a href="/news/mlbb-current-patch/">${en ? 'patch breakdown' : 'разбор патча'}</a>.</p>`);
      if (sameLane.length) html += section(en ? `Other ${LANE[hero.lanes[0]].en} heroes` : `Другие герои ${LANE[hero.lanes[0]].gen}`, chips(sameLane.map(item => item.slug), lang),
        en ? 'The strongest by win rate over the last 30 days.' : 'Самые сильные по проценту побед за последние 30 дней.');
      const wiki = `https://mobile-legends.fandom.com/wiki/${encodeURIComponent(hero.en.replace(/ /g, '_')).replace(/%2E/gi, '.')}`;
      html += section(en ? 'Lore and skills' : 'История и навыки', `<div class="lp-callout"><img src="/images/heroes/${hero.slug}.webp" width="96" height="96" alt="${name(hero, lang)}" loading="lazy" decoding="async"><p>${en ? `The hero’s backstory, skills and voice lines are collected on the <a href="${wiki}" target="_blank" rel="noopener noreferrer">${hero.en} page of the MLBB Wiki</a>. Official skill descriptions, skill order and combos are on the <a href="https://www.mobilelegends.com/hero" target="_blank" rel="noopener noreferrer">MOONTON heroes page</a>.` : `Историю героя, навыки и реплики собирает <a href="${wiki}" target="_blank" rel="noopener noreferrer">страница ${hero.en} в MLBB Wiki</a> (на английском). Официальные описания навыков, порядок прокачки и комбо — на <a href="https://www.mobilelegends.com/hero" target="_blank" rel="noopener noreferrer">странице героев MOONTON</a>.`}</p></div>`);
      html += final(en ? `Boost on ${hero.en}` : `Буст на герое ${quoted}`, en ? 'The booster plays only this hero, so the hero rating grows with your rank.' : 'Бустер играет только этим героем: вместе с рангом растёт и рейтинг героя.', en ? 'Calculate the price' : 'Рассчитать стоимость');
      return html;
    };
    const faq = lang => {
      const en = lang === 'en';
      const quoted = en ? hero.en : `«${hero.ru}»`;
      return [
        [en ? `Who counters ${hero.en} in MLBB?` : `Кто контрпик для героя ${quoted} в MLBB?`, en ? `By MOONTON’s official 30-day statistics: ${join(counterNames('en'), 'en')}.` : `По официальной статистике MOONTON за 30 дней: ${join(counterNames('ru'), 'ru')}.`],
        [en ? `What is ${hero.en}’s win rate right now?` : `Какой процент побед у героя ${quoted} сейчас?`, en ? `${pct(hero.win, 'en')} over the last 30 days across all ranks and ${pct(hero.gloryWin, 'en')} in Mythical Glory, as of ${statsDate('en')}.` : `${pct(hero.win, 'ru')} за последние 30 дней на всех рангах и ${pct(hero.gloryWin, 'ru')} в Мифической славе, данные на ${statsDate('ru')}.`],
        [en ? `What role and lane does ${hero.en} play?` : `Какая роль и линия у героя ${quoted}?`, en ? `${capital(roleList(hero, 'en'))}, ${laneList(hero, 'en')}, according to MOONTON’s official hero page.` : `${capital(roleList(hero, 'ru'))}, играет ${hero.lanes.map(lane => laneAt[lane][0]).join(' или ')}. Так героя распределяет официальная страница героев MOONTON.`],
        [en ? `Is ${hero.en} strong in the current meta?` : `Силён ли герой ${quoted} в текущей мете?`, en ? `Tier ${hero.tier}: #${hero.rank} of 133 heroes by 30-day win rate and #${roleRank(hero.roles[0])} among ${ROLE[hero.roles[0]].enPlural}.` : `Тир ${hero.tier}: ${hero.rank}-е место из 133 героев по проценту побед за 30 дней и ${roleRank(hero.roles[0])}-е среди ${ROLE[hero.roles[0]].gen}.`]
      ];
    };
    const meta = lang => lang === 'en'
      ? [`${hero.en} MLBB: counters, win rate and tier | MLBB Boost`, `Who counters ${hero.en} in Mobile Legends: ${roleList(hero, 'en')}, ${laneList(hero, 'en')}, ${pct(hero.win, 'en')} win rate, tier ${hero.tier}, pick and ban rates from official 30-day statistics.`]
      : [`${hero.ru} MLBB: контрпики, процент побед и тир | MLBB Boost`, `Кто контрит героя ${hero.ru} в Mobile Legends: ${roleList(hero, 'ru')}, ${laneList(hero, 'ru')}, ${pct(hero.win, 'ru')} побед, тир ${hero.tier}, выборы и баны по официальной статистике за 30 дней.`];
    const heroHead = lang => {
      const en = lang === 'en';
      return { badge: en ? `Tier ${hero.tier}` : `Тир ${hero.tier}`, icon: 'fa-user-shield', h1: en ? `${hero.en} in Mobile Legends: counters and stats` : `${hero.ru} в Mobile Legends: контрпики и статистика`,
        sub: en ? `${capital(roleList(hero, 'en'))}, ${laneList(hero, 'en')}. ${hero.en} wins ${pct(hero.win, 'en')} of matches over the last 30 days. Counter heroes and figures come from MOONTON’s official statistics.` : `${capital(roleList(hero, 'ru'))}, ${laneList(hero, 'ru')}. ${hero.ru} выигрывает ${pct(hero.win, 'ru')} матчей за последние 30 дней. Контрпики и цифры — из официальной статистики MOONTON.`,
        primary: [en ? 'Boost on this hero' : 'Буст на этом герое', BOT_PRICE], secondary: [en ? 'All heroes' : 'Все герои', '/heroes/'], secondaryIcon: 'fa-users' };
    };
    const lang = l => [...meta(l), body(l), faq(l), heroHead(l)];
    return { file: `heroes/${hero.slug}.html`, kind: 'hero', layout: 'landing', art: `profile:${hero.slug}`, published: '2026-11-22', updated, noLlms: true, ruOnly: true,
      crumb: ['/heroes/', 'Герои', 'Heroes'], ru: lang('ru'), en: lang('en') };
  });

  const tiers = ['S', 'A', 'B', 'C', 'D'];
  const hubBody = lang => {
    const en = lang === 'en';
    const roleBlocks = Object.keys(ROLE).map(role => `<h3 class="hero-group__title">${en ? ROLE_HUB[role][1] : ROLE_HUB[role][0]}</h3>${chips(withRole(role).slice(0, 6).map(hero => hero.slug), lang)}`).join('');
    const laneBlocks = Object.keys(LANE).map(lane => `<h3 class="hero-group__title">${en ? LANE[lane].en : LANE[lane].ru}</h3>${chips(withLane(lane).slice(0, 6).map(hero => hero.slug), lang)}`).join('');
    return section(en ? 'Best heroes by role' : 'Лучшие герои по ролям', roleBlocks,
      en ? 'Top six of each official role by win rate over the last 30 days. A hero with two roles appears in both lists.' : 'Шесть самых сильных героев каждой официальной роли по проценту побед за 30 дней. Герой с двумя ролями есть в обоих списках.')
      + section(en ? 'Best heroes by lane' : 'Лучшие герои по линиям', laneBlocks,
      en ? 'The same ranking split by the lanes MOONTON lists for each hero.' : 'Тот же рейтинг по линиям, которые MOONTON указывает для каждого героя.')
      + section(en ? 'Tier list of all 133 heroes' : 'Тир-лист всех 133 героев', '', en ? 'Tiers by win rate: S from 53%, A from 51%, B from 49%, C from 47%, D below.' : 'Тиры по проценту побед: S от 53%, A от 51%, B от 49%, C от 47%, D ниже.')
      + tiers.map(tier => {
      const list = heroes.filter(hero => hero.tier === tier).sort((a, b) => b.win - a.win);
      return section(en ? `Tier ${tier}` : `Тир ${tier}`, chips(list.map(hero => hero.slug), lang));
    }).join('') + `<p class="lp-note">${en ? `Win rate over the last 30 days across all ranks, official MOONTON statistics updated on ${statsDate('en')}. Updated automatically every day. Hero icons: MOONTON.` : `Процент побед за последние 30 дней на всех рангах, официальная статистика MOONTON, обновление ${statsDate('ru')}. Страница обновляется автоматически каждый день. Иконки героев — MOONTON.`}</p>`;
  };
  const hubHead = lang => lang === 'en'
    ? { badge: '133 heroes', icon: 'fa-users', h1: 'MLBB tier list and every hero’s stats', sub: 'All 133 heroes by tier, role and lane with official win rates. Open a hero to see who counters it and who it beats.', primary: ['Hero boost price', BOT_PRICE], secondary: ['November tier list', '/news/mlbb-meta-tier-list/'], secondaryIcon: 'fa-list' }
    : { badge: '133 героя', icon: 'fa-users', h1: 'Тир-лист MLBB и статистика всех героев', sub: 'Все 133 героя по тирам, ролям и линиям с официальным процентом побед. Откройте героя, чтобы увидеть, кто его контрит и против кого он силён.', primary: ['Цена буста на герое', BOT_PRICE], secondary: ['Тир-лист ноября', '/news/mlbb-meta-tier-list/'], secondaryIcon: 'fa-list' };
  const hub = { file: 'heroes/index.html', kind: 'hero', layout: 'landing', published: '2026-11-22', updated, ruOnly: true, crumb: ['/news/', 'Новости', 'News'],
    ru: ['Тир-лист MLBB: все 133 героя, роли, линии и контрпики | MLBB Boost', 'Тир-лист Mobile Legends по официальной статистике MOONTON за 30 дней: лучшие герои каждой роли и линии, процент побед и страница с контрпиками для всех 133 героев.', hubBody('ru'), [], hubHead('ru')],
    en: ['MLBB tier list: all 133 heroes, roles, lanes and counters | MLBB Boost', 'Mobile Legends tier list from official MOONTON 30-day statistics: the best heroes of each role and lane, win rates and a counters page for all 133 heroes.', hubBody('en'), [], hubHead('en')] };
  return [hub, ...pages];
}

export function profileArt(slug, lang, data) {
  const hero = data.heroes.find(item => item.slug === slug);
  const en = lang === 'en';
  const pct = value => en ? `${value.toFixed(2)}%` : `${value.toFixed(2).replace('.', ',')}%`;
  const counters = hero.counters.slice(0, 3).map(item => `<img src="/images/heroes/${item}.webp" width="96" height="96" alt="" loading="lazy" decoding="async">`).join('');
  return `<div class="ui-art" aria-hidden="true"><div class="ui-card"><div class="ui-card__head"><span>${en ? 'Hero stats' : 'Статистика героя'}</span><span class="ui-pill">${en ? 'Tier' : 'Тир'} ${hero.tier}</span></div><div class="ui-hero"><img class="ui-hero__icon" src="/images/heroes/${hero.slug}.webp" width="96" height="96" alt="" decoding="async"><div><strong>${en ? hero.en : hero.ru}</strong><span>${en ? 'Ban' : 'Бан'} ${pct(hero.ban)} · ${en ? 'Pick' : 'Выбор'} ${pct(hero.pick)}</span></div></div><div class="ui-counters"><span>${en ? 'Counters' : 'Контрпики'}</span><div>${counters}</div></div><div class="ui-card__foot"><span>${en ? 'Win rate, 30 days' : 'Победы за 30 дней'}</span><strong>${pct(hero.win)}</strong></div></div></div>`;
}
