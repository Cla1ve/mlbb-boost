// Builds per-hero pages and the /heroes/ hub as landing "guides" from content/heroes.json
// (official MOONTON hero statistics, 30 days, all ranks). Imported by site-build.mjs.
const BOT_PRICE = '/order.html?type=hero';

export function heroGuides(data) {
  const heroes = data.heroes;
  const bySlug = Object.fromEntries(heroes.map(hero => [hero.slug, hero]));
  const pct = (value, lang) => lang === 'en' ? `${value.toFixed(2)}%` : `${value.toFixed(2).replace('.', ',')}%`;
  const name = (hero, lang) => lang === 'en' ? hero.en : hero.ru;
  const chip = (slug, lang, valueKey = 'win') => {
    const hero = bySlug[slug];
    return `<a class="hero-chip" href="/heroes/${slug}.html"><img src="/images/heroes/${slug}.webp" width="96" height="96" alt="" loading="lazy" decoding="async"><span class="hero-chip__name">${name(hero, lang)}</span><span class="hero-chip__value">${pct(hero[valueKey], lang)}</span></a>`;
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
    const body = lang => {
      const en = lang === 'en';
      const quoted = en ? hero.en : `«${hero.ru}»`;
      let html = stats([
        [pct(hero.win, lang), en ? 'win rate, 30 days' : 'побед за 30 дней'],
        [pct(hero.pick, lang), en ? 'pick rate' : 'выбирают в матчах'],
        [pct(hero.ban, lang), en ? 'ban rate' : 'банят в матчах'],
        [pct(hero.gloryWin, lang), en ? 'wins in Mythical Glory' : 'побед в Мифической славе']
      ]);
      html += section(en ? `Who counters ${hero.en}` : 'Кто контрит этого героя', chips(hero.counters, lang),
        en ? `MOONTON’s official statistics list these heroes as the toughest opponents for ${hero.en}. The number is each hero’s own win rate.`
           : `Официальная статистика MOONTON называет этих героев самыми неудобными противниками для героя ${quoted}. Под иконкой — их собственный процент побед.`);
      if (strong.length) html += section(en ? `Who ${hero.en} is strong against` : 'Против кого силён', chips(strong, lang),
        en ? `${hero.en} is listed as a counter for these heroes.` : `Для этих героев ${quoted} сам числится контрпиком.`);
      const meta = [];
      meta.push(en ? `${hero.en} sits in tier ${tierTitle[hero.tier]} of our win-rate tier list and ranks ${hero.rank} of 133 heroes.` : `${quoted} — тир ${tierTitle[hero.tier]} в нашем тир-листе по проценту побед, ${hero.rank}-е место из 133 героев.`);
      if (hero.lowPick) meta.push(en ? 'The hero is picked in under 0.5% of matches, so the win rate can swing a lot.' : 'Героя выбирают реже чем в 0,5% матчей, поэтому процент побед может заметно колебаться.');
      if (hero.patch) meta.push(en ? `In patch 2.2.16 the hero was ${patchText.en[hero.patch]}.` : `В патче 2.2.16 герой ${patchText.ru[hero.patch]}.`);
      if (hero.orders) meta.push(en ? `BOOST MLBB customers ordered ${hero.orders} hero boosts on ${hero.en} over the past year.` : `За год клиенты BOOST MLBB заказали ${hero.orders} бустов на герое ${quoted}.`);
      html += section(en ? 'Place in the meta' : 'Место в мете', `<p>${meta.join(' ')} ${en ? 'See the full' : 'Полный'} <a href="/news/mlbb-meta-tier-list/">${en ? 'tier list' : 'тир-лист ноября'}</a> ${en ? 'and the' : 'и'} <a href="/news/mlbb-current-patch/">${en ? 'patch breakdown' : 'разбор патча'}</a>.</p>`);
      html += final(en ? `Boost on ${hero.en}` : `Буст на герое ${quoted}`, en ? 'The booster plays only this hero, so the hero rating grows with your rank.' : 'Бустер играет только этим героем: вместе с рангом растёт и рейтинг героя.', en ? 'Calculate the price' : 'Рассчитать стоимость');
      return html;
    };
    const faq = lang => {
      const en = lang === 'en';
      const quoted = en ? hero.en : `«${hero.ru}»`;
      return [
        [en ? `Who counters ${hero.en} in MLBB?` : `Кто контрпик для героя ${quoted} в MLBB?`, en ? `By MOONTON’s official 30-day statistics: ${join(counterNames('en'), 'en')}.` : `По официальной статистике MOONTON за 30 дней: ${join(counterNames('ru'), 'ru')}.`],
        [en ? `What is ${hero.en}’s win rate right now?` : `Какой процент побед у героя ${quoted} сейчас?`, en ? `${pct(hero.win, 'en')} over the last 30 days across all ranks and ${pct(hero.gloryWin, 'en')} in Mythical Glory, as of 21 November 2026.` : `${pct(hero.win, 'ru')} за последние 30 дней на всех рангах и ${pct(hero.gloryWin, 'ru')} в Мифической славе, данные на 21 ноября 2026 года.`]
      ];
    };
    const meta = lang => lang === 'en'
      ? [`${hero.en} MLBB: counters, win rate and tier | MLBB Boost`, `Who counters ${hero.en} in Mobile Legends, ${pct(hero.win, 'en')} win rate, pick and ban rates from official 30-day statistics, tier ${hero.tier} and patch 2.2.16 changes.`]
      : [`${hero.ru} MLBB: контрпики, процент побед и тир | MLBB Boost`, `Кто контрит героя ${hero.ru} в Mobile Legends, процент побед ${pct(hero.win, 'ru')}, выбора и банов по официальной статистике за 30 дней, тир ${hero.tier} и патч 2.2.16.`];
    const heroHead = lang => {
      const en = lang === 'en';
      return { badge: en ? `Tier ${hero.tier}` : `Тир ${hero.tier}`, icon: 'fa-user-shield', h1: en ? `${hero.en} in Mobile Legends: counters and stats` : `${hero.ru} в Mobile Legends: контрпики и статистика`,
        sub: en ? `${hero.en} wins ${pct(hero.win, 'en')} of matches over the last 30 days. Counter heroes and figures come from MOONTON’s official statistics.` : `${hero.ru} выигрывает ${pct(hero.win, 'ru')} матчей за последние 30 дней. Контрпики и цифры — из официальной статистики MOONTON.`,
        primary: [en ? 'Boost on this hero' : 'Буст на этом герое', BOT_PRICE], secondary: [en ? 'All heroes' : 'Все герои', '/heroes/'], secondaryIcon: 'fa-users' };
    };
    const lang = l => [...meta(l), body(l), faq(l), heroHead(l)];
    return { file: `heroes/${hero.slug}.html`, kind: 'hero', layout: 'landing', art: `profile:${hero.slug}`, published: '2026-11-22', updated: '2026-11-22', noLlms: true,
      crumb: ['/heroes/', 'Герои', 'Heroes'], ru: lang('ru'), en: lang('en') };
  });

  const tiers = ['S', 'A', 'B', 'C', 'D'];
  const hubBody = lang => {
    const en = lang === 'en';
    return tiers.map(tier => {
      const list = heroes.filter(hero => hero.tier === tier).sort((a, b) => b.win - a.win);
      return section(en ? `Tier ${tier}` : `Тир ${tier}`, chips(list.map(hero => hero.slug), lang));
    }).join('') + `<p class="lp-note">${en ? 'Win rate over the last 30 days across all ranks, official MOONTON statistics updated on 21 November 2026. Hero icons: MOONTON.' : 'Процент побед за последние 30 дней на всех рангах, официальная статистика MOONTON, обновление 21 ноября 2026 года. Иконки героев — MOONTON.'}</p>`;
  };
  const hubHead = lang => lang === 'en'
    ? { badge: '133 heroes', icon: 'fa-users', h1: 'All Mobile Legends heroes: stats and counters', sub: 'Every hero with its win rate and tier. Open a hero to see who counters it and who it beats.', primary: ['Hero boost price', BOT_PRICE], secondary: ['November tier list', '/news/mlbb-meta-tier-list/'], secondaryIcon: 'fa-list' }
    : { badge: '133 героя', icon: 'fa-users', h1: 'Все герои Mobile Legends: статистика и контрпики', sub: 'Каждый герой с процентом побед и тиром. Откройте героя, чтобы увидеть, кто его контрит и против кого он силён.', primary: ['Цена буста на герое', BOT_PRICE], secondary: ['Тир-лист ноября', '/news/mlbb-meta-tier-list/'], secondaryIcon: 'fa-list' };
  const hub = { file: 'heroes/index.html', kind: 'hero', layout: 'landing', published: '2026-11-22', updated: '2026-11-22', crumb: ['/news/', 'Новости', 'News'],
    ru: ['Герои MLBB: процент побед, тир и контрпики всех героев | MLBB Boost', 'Все 133 героя Mobile Legends с процентом побед, тиром и контрпиками по официальной статистике MOONTON за 30 дней. Страница каждого героя с контрпиками.', hubBody('ru'), [], hubHead('ru')],
    en: ['MLBB heroes: win rate, tier and counters for every hero | MLBB Boost', 'All 133 Mobile Legends heroes with win rate, tier and counters from official MOONTON 30-day statistics. A page for every hero with its counters.', hubBody('en'), [], hubHead('en')] };
  return [hub, ...pages];
}

export function profileArt(slug, lang, data) {
  const hero = data.heroes.find(item => item.slug === slug);
  const en = lang === 'en';
  const pct = value => en ? `${value.toFixed(2)}%` : `${value.toFixed(2).replace('.', ',')}%`;
  const counters = hero.counters.slice(0, 3).map(item => `<img src="/images/heroes/${item}.webp" width="96" height="96" alt="" loading="lazy" decoding="async">`).join('');
  return `<div class="ui-art" aria-hidden="true"><div class="ui-card"><div class="ui-card__head"><span>${en ? 'Hero stats' : 'Статистика героя'}</span><span class="ui-pill">${en ? 'Tier' : 'Тир'} ${hero.tier}</span></div><div class="ui-hero"><img class="ui-hero__icon" src="/images/heroes/${hero.slug}.webp" width="96" height="96" alt="" decoding="async"><div><strong>${en ? hero.en : hero.ru}</strong><span>${en ? 'Ban' : 'Бан'} ${pct(hero.ban)} · ${en ? 'Pick' : 'Выбор'} ${pct(hero.pick)}</span></div></div><div class="ui-counters"><span>${en ? 'Counters' : 'Контрпики'}</span><div>${counters}</div></div><div class="ui-card__foot"><span>${en ? 'Win rate, 30 days' : 'Победы за 30 дней'}</span><strong>${pct(hero.win)}</strong></div></div></div>`;
}
