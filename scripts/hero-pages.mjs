// Builds per-hero pages and the /heroes/ hub as landing "guides" from content/heroes.json
// (official MOONTON hero statistics). Imported by site-build.mjs.
const BOT_PRICE = '/order.html?type=hero';
// Date of the last content change on hero pages.
const UPDATED = '2026-11-23';
const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const RANK_ROWS = [['epic', 'Epic', 'Эпик', 'Epic'], ['legend', 'Legend', 'Легенда', 'Legend'], ['mythic', 'Mythic', 'Мифик', 'Mythic'], ['honor', 'Mythical_Honor', 'Честь', 'Honor'], ['glory', 'Mythical_Glory', 'Слава', 'Glory']];

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
const LANE_ICONS = { 'EXP Lane': 'exp', 'Gold Lane': 'gold', 'Mid Lane': 'mid', Jungle: 'jungle', Roam: 'roam' };
const LANE_SHORT = { 'EXP Lane': ['Опыт', 'EXP'], 'Gold Lane': ['Золото', 'Gold'], 'Mid Lane': ['Мид', 'Mid'], Jungle: ['Лес', 'Jungle'], Roam: ['Роум', 'Roam'] };
const ROLE_HUB = { Tank: ['Лучшие танки', 'Best tanks'], Fighter: ['Лучшие бойцы', 'Best fighters'], Assassin: ['Лучшие убийцы', 'Best assassins'], Mage: ['Лучшие маги', 'Best mages'], Marksman: ['Лучшие стрелки', 'Best marksmen'], Support: ['Лучшая поддержка', 'Best supports'] };
const TIERS = ['S', 'A', 'B', 'C', 'D'];

// Tier = how contested a hero is in current high-rank drafts, corrected by how well the hero wins.
// Data: official MOONTON statistics for the last 7 days at Mythic, Honor and Glory (mean of the three); older data
// (30 days, all ranks) is the fallback. "Presence" is the share of matches in which the hero is picked or banned:
// a pick rate is a share of all picks (ten per match), a ban rate is a share of matches, so presence = 10 * pick + ban.
// Score = presence (60%) + win rate pulled toward 50% when the hero is rarely picked (40%), both as z-scores.
export const TIER_WEIGHTS = { presence: 0.6, win: 0.4 };
export const TIER_CUTS = [['S', 1.45], ['A', 0.55], ['B', -0.25], ['C', -0.95]];
// Ranks of the official statistics page (the 7-day tables). Glory is the top bracket and includes Immortal players;
// "top" is the mean of Mythic, Honor and Glory. Glory is the default: it is where drafts are contested hardest.
export const RANKS = [
  ['glory', 'Слава', 'Glory', 'Мифическая слава', 'Mythical Glory'],
  ['top', 'Мифик+', 'Mythic+', 'Мифик и выше', 'Mythic and above'],
  ['honor', 'Честь', 'Honor', 'Мифическая честь', 'Mythical Honor'],
  ['mythic', 'Мифик', 'Mythic', 'Мифик', 'Mythic'],
  ['legend', 'Легенда', 'Legend', 'Легенда', 'Legend'],
  ['epic', 'Эпик', 'Epic', 'Эпик', 'Epic'],
  ['all', 'Все', 'All', 'Все ранги', 'All ranks']
];
export const DEFAULT_RANK = 'glory';
const base30 = hero => ({ win: hero.win, pick: hero.pick, ban: hero.ban });
export const statsOf = (hero, key = DEFAULT_RANK) => (key === 'top' ? hero.top : hero.r7?.[key]) || hero.top || base30(hero);
const meta = hero => statsOf(hero);
export function rateHeroes(list, key = DEFAULT_RANK) {
  const meta = hero => statsOf(hero, key);
  const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
  const deviation = values => { const m = mean(values); return Math.sqrt(mean(values.map(value => (value - m) ** 2))) || 1; };
  const presence = list.map(hero => { const m = meta(hero); return 10 * m.pick + m.ban; });
  const win = list.map(hero => { const m = meta(hero); return 50 + (m.win - 50) * (m.pick / (m.pick + 0.3)); });
  const z = values => values.map(value => (value - mean(values)) / deviation(values));
  const zp = z(presence.map(Math.sqrt)), zw = z(win);
  const raw = list.map((_, i) => TIER_WEIGHTS.presence * zp[i] + TIER_WEIGHTS.win * zw[i]);
  const center = mean(raw), spread = deviation(raw);
  const rated = list.map((hero, i) => {
    const zScore = (raw[i] - center) / spread;
    return { ...hero, winRank: hero.rank, presence: Math.round(presence[i] * 10) / 10, z: zScore, score: Math.max(1, Math.min(99, Math.round(50 + 15 * zScore))), tier: (TIER_CUTS.find(([, cut]) => zScore >= cut) || ['D'])[0] };
  });
  const order = [...rated].sort((a, b) => b.z - a.z || a.winRank - b.winRank);
  order.forEach((hero, index) => { hero.rank = index + 1; });
  return order;
}

export function heroGuides(data, academy = null, storyFallbacks = {}) {
  const heroes = rateHeroes(data.heroes);
  const acad = academy?.heroes || {};
  const dict = academy || { items: {}, spells: {}, talents: {}, emblems: {} };
  const dayOf = stamp => stamp.slice(0, 10).split('-').map(Number);
  const hasTop = heroes.some(hero => hero.r7 || hero.top);
  const statsStamp = data.recentUpdated && hasTop ? data.recentUpdated : data.updated;
  const [year, month, day] = dayOf(statsStamp);
  const longDate = lang => lang === 'en' ? `${day} ${MONTHS_EN[month - 1]} ${year}` : `${day} ${MONTHS_RU[month - 1]} ${year} года`;
  const shortDate = lang => lang === 'en' ? `${day} ${MONTHS_EN[month - 1]}` : `${day} ${MONTHS_RU[month - 1]}`;
  const statsDay = statsStamp.slice(0, 10);
  const updated = statsDay > UPDATED ? statsDay : UPDATED;
  const bySlug = Object.fromEntries(heroes.map(hero => [hero.slug, hero]));
  const fmt = (value, lang, digits = 2) => lang === 'en' ? value.toFixed(digits) : value.toFixed(digits).replace('.', ',');
  const pct = (value, lang) => `${fmt(value, lang)}%`;
  const pct1 = (value, lang) => `${fmt(value, lang, 1)}%`;
  const signed = (value, lang) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${fmt(Math.abs(value), lang, 1)}`;
  const name = (hero, lang) => lang === 'en' ? hero.en : hero.ru;
  const byScore = list => [...list].sort((a, b) => a.rank - b.rank);
  const withRole = role => byScore(heroes.filter(hero => hero.roles.includes(role)));
  const capital = text => text.charAt(0).toUpperCase() + text.slice(1);
  const esc = text => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const roleName = (role, lang) => lang === 'en' ? ROLE[role].en : ROLE[role].ru;
  const roleList = (hero, lang) => hero.roles.map(role => roleName(role, lang)).join(lang === 'en' ? ' and ' : ' и ');
  const icon = (file, size = 20) => `<img src="/images/mlbb/filters/${file}.webp" width="${size}" height="${size}" alt="" loading="lazy" decoding="async">`;
  const rankLabel = (key, lang, full = false) => { const row = RANKS.find(item => item[0] === key); return lang === 'en' ? row[full ? 4 : 2] : row[full ? 3 : 1]; };
  const period = (lang, key = DEFAULT_RANK) => hasTop ? `${rankLabel(key, lang, true)}, ${lang === 'en' ? '7 days' : '7 дней'}` : (lang === 'en' ? 'All ranks, 30 days' : 'Все ранги, 30 дней');
  const rankIn = (lang, key = DEFAULT_RANK) => lang === 'en' ? `at ${rankLabel(key, lang, true)}` : `в ${({ glory: 'Мифической славе', top: 'Мифике и выше', honor: 'Мифической чести', mythic: 'Мифике', legend: 'Легенде', epic: 'Эпике', all: 'всех рангах' })[key]}`;
  const chip = (slug, lang, value = '') => {
    const hero = bySlug[slug];
    return `<a class="hero-chip" href="/heroes/${slug}.html"><img src="/images/heroes/${slug}.webp" width="96" height="96" alt="" loading="lazy" decoding="async"><span class="hero-chip__name">${esc(name(hero, lang))}</span>${value ? `<span class="hero-chip__value">${value}</span>` : ''}</a>`;
  };
  const section = (id, title, inner) => `<section class="atlas-section" id="${id}"><h2>${title}</h2>${inner}</section>`;
  const label = (entry, lang) => entry ? esc(lang === 'en' ? entry.en : entry.ru) : '';
  const gear = (entry, lang, extra = '') => entry ? `<figure class="gear${extra}">${entry.icon ? `<img src="${entry.icon}" width="64" height="64" alt="" loading="lazy" decoding="async">` : ''}<figcaption>${label(entry, lang)}</figcaption></figure>` : '';
  const buildCard = (build, lang, index) => {
    const t = (ru, en) => lang === 'en' ? en : ru;
    return `<article class="build" data-build="${index}"${index ? ' hidden' : ''}>
      <div class="build__items"><h3>${t('Предметы', 'Core items')}</h3><div class="build__row">${build.items.map(id => gear(dict.items[id], lang)).join('')}</div></div>
      <div class="build__extras">
        <div><h3>${t('Эмблема', 'Emblem')}</h3><div class="build__row build__row--list">${gear(dict.emblems[build.emblem], lang, ' gear--line')}${build.talents.map(id => gear(dict.talents[id], lang, ' gear--line gear--small')).join('')}</div></div>
        <div><h3>${t('Заклинание', 'Spell')}</h3><div class="build__row build__row--list">${gear(dict.spells[build.spell], lang, ' gear--line')}</div></div>
      </div>
      <dl class="build__stats"><div><dt>${t('Победы', 'Win rate')}</dt><dd>${pct1(build.win, lang)}</dd></div><div><dt>${t('Выбор', 'Pick rate')}</dt><dd>${pct1(build.pick, lang)}</dd></div></dl>
    </article>`;
  };
  const skillNo = (index, total, lang) => index === 0 ? (lang === 'en' ? 'Passive' : 'Пассивный') : index === total - 1 ? (lang === 'en' ? 'Ultimate' : 'Ультимейт') : (lang === 'en' ? `Skill ${index}` : `${index}-й навык`);
  // Official skill text arrives as plain lines: bold the lead-in ("Name": ...) and turn the placeholder level into words.
  const skillText = (desc, lang) => String(desc || '').replace(/\s*\*\s*Hero Level/gi, lang === 'en' ? ' × hero level' : ' × ур. героя').replace(/Hero Level/gi, lang === 'en' ? 'hero level' : 'ур. героя')
    .split(/\n+/).filter(Boolean).map(line => {
      const lead = line.match(/^([^"\n:]{0,32}"[^"]{2,42}"|[^"\n:]{3,42}):\s+(.*)$/s);
      return lead ? `<p><strong>${esc(lead[1].replace(/"/g, ''))}:</strong> ${esc(lead[2])}</p>` : `<p>${esc(line)}</p>`;
    }).join('');
  // Builds from the Academy API: most picked first; a build far below the hero's other builds is a data outlier (e.g. 32% against 55%).
  const buildsOf = ac => {
    const list = [...(ac?.builds || [])].sort((a, b) => b.pick - a.pick);
    const best = Math.max(0, ...list.map(build => build.win));
    const clean = list.filter(build => build.win >= best - 12);
    return clean.length ? clean : list;
  };

  const pages = heroes.map(hero => {
    const strong = [...hero.strongAgainst].sort((a, b) => bySlug[b].pick - bySlug[a].pick).slice(0, 10);
    const counterNames = lang => hero.counters.map(slug => name(bySlug[slug], lang));
    const join = (list, lang) => list.length > 1 ? `${list.slice(0, -1).join(', ')} ${lang === 'en' ? 'and' : 'и'} ${list.at(-1)}` : list[0];
    const roleRank = role => withRole(role).findIndex(item => item.slug === hero.slug) + 1;
    const laneAt = { 'EXP Lane': ['на линии опыта', 'in the EXP Lane'], 'Gold Lane': ['на линии золота', 'in the Gold Lane'], 'Mid Lane': ['на средней линии', 'in the Mid Lane'], Jungle: ['в лесу', 'in the jungle'], Roam: ['в роуме', 'on roam'] };
    const similar = byScore(heroes.filter(other => other.slug !== hero.slug && other.roles[0] === hero.roles[0] && other.lanes.some(lane => hero.lanes.includes(lane)))).slice(0, 8);
    const body = lang => {
      const en = lang === 'en';
      const t = (ru, english) => en ? english : ru;
      const ac = acad[hero.slug];
      const sections = [];
      const add = (id, title, inner, tab = title) => sections.push({ id, title, inner, tab });

      // Overview: attributes, win rate by rank, similar heroes.
      const meters = ac?.ability ? [[t('Живучесть', 'Durability'), ac.ability[0]], [t('Атака', 'Offense'), ac.ability[1]], [t('Эффекты', 'Control'), ac.ability[2]], [t('Сложность', 'Difficulty'), ac.ability[3]]] : [];
      const traits = (ac?.speciality?.[lang] || []).map(text => `<li>${esc(text)}</li>`).join('');
      const metersHTML = meters.length ? `<div class="ov-card"><h3>${t('Характеристики', 'Attributes')}</h3><ul class="meters">${meters.map(([title, value]) => `<li><span>${title}</span><span class="meter" aria-hidden="true"><i style="width:${value}%"></i></span><strong>${value}</strong></li>`).join('')}</ul>${traits ? `<ul class="ov-tags">${traits}</ul>` : ''}</div>` : '';
      const ranksOk = hero.byRank && RANK_ROWS.every(([key]) => Number.isFinite(hero.byRank[key]));
      const low = ranksOk ? Math.min(...RANK_ROWS.map(([key]) => hero.byRank[key])) : 0;
      const high = ranksOk ? Math.max(...RANK_ROWS.map(([key]) => hero.byRank[key])) : 0;
      const floor = Math.floor(Math.min(low, 48) / 2) * 2 - 2, ceil = Math.ceil(Math.max(high, 52) / 2) * 2 + 2;
      const barHeight = value => Math.round(((value - floor) / (ceil - floor)) * 100);
      const ranksHTML = ranksOk ? `<div class="ov-card"><h3>${t('Победы по рангам, 30 дней', 'Win rate by rank, 30 days')}</h3><ol class="rank-bars" style="--mid:${barHeight(50)}%">${RANK_ROWS.map(([key, img, ru, english]) => `<li><strong>${fmt(hero.byRank[key], lang, 1)}%</strong><span class="rank-bars__col"><i style="height:${barHeight(hero.byRank[key])}%" data-above="${hero.byRank[key] >= 50}"></i></span><img src="/images/ranks/${img}.webp" width="40" height="40" alt="" loading="lazy"><span>${t(ru, english)}</span></li>`).join('')}</ol><p class="rank-bars__note">${t('Пунктир: 50% побед', 'Dashed line: 50% win rate')}</p></div>` : '';
      const similarHTML = similar.length ? `<div class="ov-card ov-wide"><h3>${t(`Другие ${ROLE[hero.roles[0]].plural} этой линии`, `More ${ROLE[hero.roles[0]].enPlural} on this lane`)}</h3><div class="draft-grid draft-grid--wide">${similar.map(other => `<a class="draft-hero" href="/heroes/${other.slug}.html"><img src="/images/heroes/${other.slug}.webp" width="96" height="96" alt="" loading="lazy" decoding="async"><span>${esc(name(other, lang))}</span></a>`).join('')}</div></div>` : '';
      add('overview', t('Обзор', 'Overview'), `<div class="ov-grid">${metersHTML}${ranksHTML}${similarHTML}</div>`);

      const builds = buildsOf(ac);
      if (builds.length) {
        const buildLane = { exp: 'EXP Lane', gold: 'Gold Lane', mid: 'Mid Lane', jungle: 'Jungle', roam: 'Roam' }[ac.lane];
        const lane = LANE[buildLane]?.[lang];
        const switcher = builds.length > 1 ? `<div class="build-switch" role="group" aria-label="${t('Выбор сборки', 'Choose a build')}" hidden>${builds.map((build, i) => `<button type="button" data-pick-build="${i}" aria-pressed="${i === 0}"><span>${t('Сборка', 'Build')} ${i + 1}</span><small>${pct1(build.win, lang)}</small></button>`).join('')}</div>` : '';
        add('build', t('Сборка', 'Build'), `${lane ? `<p class="atlas-caption">${esc(lane)} · ${t('по данным рейтинговых матчей', 'from ranked matches')}</p>` : ''}${switcher}<div class="builds">${builds.map((build, i) => buildCard(build, lang, i)).join('')}</div>`);
      }

      const skills = ac?.skills?.[lang] || [];
      if (skills.length) {
        const order = (ac.order || []).map(Number).filter(n => n >= 1 && n < skills.length);
        const priority = order.length ? `<p class="hs-order"><span>${t('Прокачка', 'Level-up')}</span>${order.map(n => `<b>${esc(skills[n].name)}</b>`).join('<i aria-hidden="true">›</i>')}</p>` : '';
        const tabs = skills.map((skill, i) => `<button type="button" class="skill-tab" data-skill="${i}" aria-pressed="${i === 0}" hidden><img src="${skill.icon}" width="56" height="56" alt=""><span>${skillNo(i, skills.length, lang)}</span></button>`).join('');
        const panels = skills.map((skill, i) => `<article class="skill" data-skill-panel="${i}"><header><img src="${skill.icon}" width="64" height="64" alt="" loading="lazy"><div><small>${skillNo(i, skills.length, lang)}</small><h3>${esc(skill.name)}</h3></div>${skill.cd ? `<span class="skill__cd">${t('Перезарядка', 'Cooldown')} <b>${esc(skill.cd)} ${t('с', 's')}</b></span>` : ''}</header>${skill.tags?.length ? `<p class="skill__tags">${skill.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</p>` : ''}<div class="skill__text">${skillText(skill.desc, lang)}</div></article>`).join('');
        add('skills', t('Навыки', 'Skills'), `${priority}<div class="skills"><div class="skill-tabs" role="group" aria-label="${t('Выбор навыка', 'Choose a skill')}">${tabs}</div><div class="skill-panels">${panels}</div></div>`);
      }

      const allies = (ac?.allies || []).filter(ally => bySlug[ally.slug]);
      const lineup = (title, caption, slugs, valueOf = () => '', tone = '') => `<div class="draft-col${tone}"><h3>${title}</h3><p>${caption}</p><div class="draft-grid">${slugs.map(slug => `<a class="draft-hero" href="/heroes/${slug}.html"><img src="/images/heroes/${slug}.webp" width="96" height="96" alt="" loading="lazy" decoding="async"><span>${esc(name(bySlug[slug], lang))}</span>${valueOf(slug) ? `<b>${valueOf(slug)}</b>` : ''}</a>`).join('')}</div></div>`;
      const columns = [];
      if (hero.counters.length) columns.push(lineup(t('Контрпики', 'Counters'), t('Побеждают этого героя', 'Beat this hero'), hero.counters, () => '', ' draft-col--bad'));
      if (strong.length) columns.push(lineup(t('Слабые цели', 'Easy targets'), t('Этот герой побеждает их', 'This hero beats them'), strong, () => '', ' draft-col--good'));
      if (allies.length) columns.push(lineup(t('Союзники', 'Teammates'), t('Рост побед в паре, п. п.', 'Win rate gain as a duo, pp'), allies.map(ally => ally.slug), slug => `+${fmt(allies.find(ally => ally.slug === slug).plus, lang, 1)}`, ' draft-col--team'));
      if (columns.length) add('draft', t('Контрпики и союзники', 'Counters and teammates'), `<div class="draft">${columns.join('')}</div>`, t('Контрпики', 'Counters'));

      const official = `https://www.mobilelegends.com/hero/detail?heroid=${ac?.id || heroes.length + 1 - hero.releaseOrder}`;
      const fallback = storyFallbacks[hero.slug];
      const loreSource = ac?.lore || (fallback ? `https://kazukiofficial.com/stories/${fallback}` : '');
      const sourceName = ac?.lore ? t('Официальный сайт Mobile Legends', 'Official Mobile Legends site') : t('Kazuki Official, английский', 'Kazuki Official');
      add('lore', t('История', 'Lore'), `<div class="arena-lore"><div>
        ${ac?.story?.[lang] ? `<blockquote>${esc(ac.story[lang])}</blockquote>` : ''}
        ${loreSource ? `<a class="arena-lore-primary" href="${esc(loreSource)}" target="_blank" rel="noopener">${t('Читать полную историю', 'Read the full story')} <span aria-hidden="true">↗</span></a><small>${sourceName}</small>` : ''}
        </div><a class="arena-lore-official" href="${official}" target="_blank" rel="noopener">${t('Характеристики на сайте игры', 'Hero stats on the game site')} <span aria-hidden="true">↗</span></a></div>`);
      const heroName = en ? hero.en : `«${hero.ru}»`;
      const wanted = ['overview', 'build', 'skills', 'draft', 'lore'];
      sections.sort((a, b) => wanted.indexOf(a.id) - wanted.indexOf(b.id));
      return `<nav class="atlas-nav" aria-label="${t('Разделы профиля', 'Profile sections')}">${sections.map(({ id, tab }, i) => `<a href="#${id}"${i === 0 ? ' aria-current="location"' : ''}>${tab}</a>`).join('')}</nav>
        <div class="atlas-chapters">${sections.map(({ id, title, inner }) => section(id, title, inner)).join('')}</div>
        <aside class="hero-cta"><div><strong>${t(`Поднимем ранг на герое ${heroName}`, `Rank up on ${hero.en}`)}</strong><span>${t('Цена считается в калькуляторе', 'The calculator shows the price')}</span></div><a class="calc-btn" href="${BOT_PRICE}">${t('Рассчитать цену', 'Calculate price')}</a></aside>
        <script src="/js/hero-profile.js?v=3" defer></script>`;
    };
    const buildFaq = lang => {
      const en = lang === 'en';
      const ac = acad[hero.slug];
      const build = buildsOf(ac)[0];
      if (!build) return [];
      const quoted = en ? hero.en : `«${hero.ru}»`;
      const itemNames = build.items.map(id => dict.items[id]).filter(Boolean).map(entry => en ? entry.en : entry.ru);
      const talentNames = build.talents.map(id => dict.talents[id]).filter(Boolean).map(entry => en ? entry.en : entry.ru);
      const emblem = dict.emblems[build.emblem], spell = dict.spells[build.spell];
      if (!itemNames.length || !emblem || !spell) return [];
      return [[en ? `What is the best build for ${hero.en}?` : `Какая сборка на героя ${quoted} лучшая?`,
        en ? `The most popular ranked build: ${join(itemNames, 'en')} as core items, the ${emblem.en} emblem with ${join(talentNames, 'en')}, and ${spell.en}. It wins ${pct(build.win, 'en')} of matches.`
           : `Самая популярная сборка в рейтинге: ключевые предметы ${join(itemNames.map(n => `«${n}»`), 'ru')}, ${emblem.ru.toLowerCase()} с талантами ${join(talentNames.map(n => `«${n}»`), 'ru')} и заклинание «${spell.ru}». С ней выигрывают ${pct(build.win, 'ru')} матчей.`]];
    };
    const faq = lang => {
      const en = lang === 'en';
      const quoted = en ? hero.en : `«${hero.ru}»`;
      const m = meta(hero);
      return [
        [en ? `Who counters ${hero.en} in MLBB?` : `Кто контрпик для героя ${quoted} в MLBB?`, en ? `Over the last 30 days the toughest opponents are ${join(counterNames('en'), 'en')}.` : `За последние 30 дней чаще всего героя обыгрывают ${join(counterNames('ru'), 'ru')}.`],
        [en ? `What is ${hero.en}’s win rate right now?` : `Какой процент побед у героя ${quoted} сейчас?`, en
          ? `${hasTop ? `${pct(m.win, 'en')} ${rankIn('en')} over the last 7 days and ` : ''}${pct(hero.win, 'en')} across all ranks over 30 days, as of ${longDate('en')}.`
          : `${hasTop ? `${pct(m.win, 'ru')} ${rankIn('ru')} за последние 7 дней и ` : ''}${pct(hero.win, 'ru')} на всех рангах за 30 дней, данные на ${longDate('ru')}.`],
        [en ? `What role and lane does ${hero.en} play?` : `Какая роль и линия у героя ${quoted}?`, en ? `${capital(roleList(hero, 'en'))}, played ${hero.lanes.map(lane => laneAt[lane][1]).join(' or ')}.` : `${capital(roleList(hero, 'ru'))}, играет ${hero.lanes.map(lane => laneAt[lane][0]).join(' или ')}.`],
        [en ? `Is ${hero.en} strong in the current meta?` : `Силён ли герой ${quoted} в текущей мете?`, en
          ? `Tier ${hero.tier}, #${hero.rank} of ${heroes.length} heroes and #${roleRank(hero.roles[0])} among ${ROLE[hero.roles[0]].enPlural}. The tier counts how often the hero is picked and banned and how well it wins${hasTop ? ` ${rankIn('en')} over 7 days` : ''}: banned in ${pct1(m.ban, 'en')} of matches, ${pct1(m.win, 'en')} win rate.`
          : `Тир ${hero.tier}, ${hero.rank}-е место из ${heroes.length} героев и ${roleRank(hero.roles[0])}-е среди ${ROLE[hero.roles[0]].gen}. Тир учитывает, как часто героя берут и банят и как он выигрывает${hasTop ? ` ${rankIn('ru')} за 7 дней` : ''}: бан в ${pct1(m.ban, 'ru')} матчей, ${pct1(m.win, 'ru')} побед.`],
        ...buildFaq(lang)
      ];
    };
    const metaTags = lang => lang === 'en'
      ? [`${hero.en} MLBB: build, counters and skills | MLBB Boost`, `${hero.en} in Mobile Legends: the most popular ranked build, skills, counters and teammates. ${capital(roleList(hero, 'en'))}, ${pct(meta(hero).win, 'en')} win rate, tier ${hero.tier}.`]
      : [`${hero.ru} MLBB: сборка, контрпики и навыки | MLBB Boost`, `${hero.ru} в Mobile Legends: популярная сборка в рейтинге, навыки, контрпики и союзники. ${capital(roleList(hero, 'ru'))}, ${pct(meta(hero).win, 'ru')} побед, тир ${hero.tier}.`];
    const heroHead = lang => {
      const en = lang === 'en';
      const t = (ru, english) => en ? english : ru;
      const ac = acad[hero.slug];
      const m = meta(hero);
      const roles = hero.roles.map(role => `<span class="sheet__tag">${icon(role.toLowerCase(), 18)}${capital(roleName(role, lang))}</span>`).join('');
      const lanes = hero.lanes.map(lane => `<span class="sheet__tag">${icon(LANE_ICONS[lane], 18)}${LANE[lane][lang]}</span>`).join('');
      const stat = (title, value, other, lead = false) => `<div${lead ? ' class="is-lead"' : ''}><dt>${title}</dt><dd>${value}</dd>${hasTop ? `<dd class="sub">${t('все ранги', 'all ranks')} ${other}</dd>` : ''}</div>`;
      const html = `<header class="sheet" data-grade="${hero.tier}">
        <img class="sheet__art" src="/images/heroes/art/${hero.slug}.webp" width="240" height="390" alt="${esc(t(`Арт героя ${hero.ru}`, `${hero.en} hero art`))}" fetchpriority="high">
        <div class="sheet__body">
          <div class="sheet__title"><h1>${name(hero, lang)}</h1><span class="grade" data-grade="${hero.tier}" title="${t('Тир', 'Tier')} ${hero.tier}">${hero.tier}</span></div>
          <p class="sheet__tags">${roles}${lanes}</p>
          ${ac?.story?.[lang] ? `<p class="sheet__epithet">${esc(ac.story[lang])}</p>` : ''}
          <dl class="sheet__stats">${stat(t('Победы', 'Win rate'), pct1(m.win, lang), pct1(hero.win, lang), true)}${stat(t('Выбор', 'Pick rate'), pct1(m.pick, lang), pct1(hero.pick, lang))}${stat(t('Баны', 'Ban rate'), pct1(m.ban, lang), pct1(hero.ban, lang))}</dl>
          <p class="sheet__note">${t('№', '#')}${hero.rank} ${t('в тир-листе', 'in the tier list')} · ${t('№', '#')}${roleRank(hero.roles[0])} ${t('среди', 'among')} ${t(ROLE[hero.roles[0]].gen, ROLE[hero.roles[0]].enPlural)} · ${period(lang)}, ${t('по', 'to')} ${shortDate(lang)}</p>
        </div>
      </header>`;
      return { h1: name(hero, lang), portrait: hero.slug, html };
    };
    const lang = l => [...metaTags(l), body(l), faq(l), heroHead(l)];
    return { file: `heroes/${hero.slug}.html`, kind: 'hero', layout: 'landing', published: '2026-11-22', updated, noLlms: true, ruOnly: true,
      crumb: ['/heroes/', 'Герои', 'Heroes'], ru: lang('ru'), en: lang('en') };
  });

  const hubBody = lang => {
    const en = lang === 'en';
    const t = (ru, english) => en ? english : ru;
    const roles = Object.keys(ROLE);
    const tile = hero => {
      const label = esc(name(hero, lang));
      const m = meta(hero);
      return `<a class="tile" href="/heroes/${hero.slug}.html" data-tier="${hero.tier}" data-roles="${hero.roles.join(' ')}" data-lanes="${esc(hero.lanes.join('|'))}" data-names="${esc(hero.ru + ' ' + hero.en)}" data-slug="${hero.slug}" data-name="${label}" data-rank="${hero.rank}" data-win="${m.win}" data-pick="${m.pick}" data-ban="${m.ban}"><img src="/images/heroes/${hero.slug}.webp" width="96" height="96" alt="" loading="lazy" decoding="async"><span class="tile__name">${label}</span><span class="tile__value" hidden></span></a>`;
    };
    const tiersHTML = TIERS.map(tier => {
      const members = heroes.filter(hero => hero.tier === tier);
      return `<section class="tier-row" id="tier-${tier}" data-tier="${tier}"><h2 aria-label="${t('Тир', 'Tier')} ${tier}">${tier}</h2><div class="tier-roster">${members.map(tile).join('')}</div></section>`;
    }).join('');
    const roleLists = roles.map(role => `<section><h3>${icon(role.toLowerCase(), 22)}<span>${ROLE_HUB[role][en ? 1 : 0]}</span></h3><ol>${withRole(role).slice(0, 5).map(hero => `<li>${chip(hero.slug, lang, pct1(meta(hero).win, lang))}</li>`).join('')}</ol></section>`).join('');
    const option = (value, file, text, full = text) => {
      const image = file ? `<img src="/images/mlbb/filters/${file}.webp" width="22" height="22" alt="">` : '<i class="fas fa-layer-group" aria-hidden="true"></i>';
      return `<button type="button" data-filter-value="${value}" aria-pressed="${value === ''}" aria-label="${full}" title="${full}">${image}<span>${text}</span></button>`;
    };
    const roleButtons = option('', null, t('Все', 'All'), t('Все роли', 'All roles')) + roles.map(role => option(role, role.toLowerCase(), role === 'Support' && !en ? 'Саппорт' : capital(ROLE[role][lang]), capital(ROLE[role][lang]))).join('');
    const laneButtons = option('', null, t('Все', 'All'), t('Все линии', 'All lanes')) + Object.entries(LANE).map(([key, lane]) => option(key, LANE_ICONS[key], LANE_SHORT[key][en ? 1 : 0], lane[lang])).join('');
    const metrics = [['none', t('Без цифр', 'No numbers')], ['ban', t('Баны', 'Ban rate')], ['win', t('Победы', 'Win rate')], ['pick', t('Выбор', 'Pick rate')]];
    const headings = [['name', t('Герой', 'Hero')], ['rank', t('Тир', 'Tier')], ['win', t('Победы', 'Win')], ['pick', t('Выбор', 'Pick')], ['ban', t('Баны', 'Ban')]];

    // What moved: most banned, and the biggest win rate change of the last 7 days against the 30-day figure.
    const moved = heroes.filter(hero => hero.recent && hero.recent.pick >= 0.3).map(hero => ({ hero, delta: hero.recent.win - hero.win }));
    const bans = [...heroes].sort((a, b) => meta(b).ban - meta(a).ban).slice(0, 5);
    const rising = moved.filter(item => item.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 5);
    const falling = moved.filter(item => item.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 5);
    const list = (title, caption, rows) => rows.length ? `<section><h3>${title}</h3><p>${caption}</p><ol>${rows.map(([hero, value]) => `<li>${chip(hero.slug, lang, value)}</li>`).join('')}</ol></section>` : '';
    const changes = [
      list(t('Чаще всего банят', 'Most banned'), period(lang), bans.map(hero => [hero, pct1(meta(hero).ban, lang)])),
      list(t('Растут за неделю', 'Rising this week'), t('победы, все ранги, п. п. к 30 дням', 'win rate, all ranks, pp against 30 days'), rising.map(item => [item.hero, signed(item.delta, lang)])),
      list(t('Падают за неделю', 'Falling this week'), t('победы, все ранги, п. п. к 30 дням', 'win rate, all ranks, pp against 30 days'), falling.map(item => [item.hero, signed(item.delta, lang)]))
    ].join('');
    const method = hasTop
      ? t('Тир строится на официальных данных MOONTON за последние 7 дней. По умолчанию это Мифическая слава: там играют сильнейшие, и драфты оспариваются жёстче всего. Главное — как часто героя берут и банят: 60% веса. Ещё 40% — процент побед, который подтягивается к 50%, если героя берут редко. Поэтому герой с банами в 60% матчей стоит выше сильного, но редкого. У каждого героя есть данные за 30 дней по всем рангам. Бессмертные входят в Мифическую славу: отдельного фильтра в статистике MOONTON нет.',
          'The tier uses official MOONTON data for the last 7 days. The default is Mythical Glory, where the strongest players draft and contest the hardest. How often a hero is picked and banned carries 60% of the weight. The other 40% is win rate, pulled toward 50% when a hero is rarely picked. A hero banned in 60% of matches ranks above a strong but rare one. Each hero page has 30-day figures across all ranks. Immortal players are part of Mythical Glory: MOONTON statistics have no separate filter for them.')
      : t('Тир строится на официальных данных MOONTON. Главное — как часто героя берут и банят: 60% веса. Ещё 40% — процент побед, который подтягивается к 50%, если героя берут редко.', 'The tier uses official MOONTON data. How often a hero is picked and banned carries 60% of the weight; the other 40% is win rate, pulled toward 50% when a hero is rarely picked.');
    return `<div class="arena-workspace">
      <div class="atlas-tools" hidden>
        <label class="atlas-search"><span class="arena-sr">${t('Найти героя', 'Find a hero')}</span><i class="fas fa-search" aria-hidden="true"></i><input type="search" id="hero-query" autocomplete="off" placeholder="${t('Найти героя', 'Find a hero')}"></label>
        <fieldset class="atlas-choice" data-hero-filter="role"><legend>${t('Роль', 'Role')}</legend><div>${roleButtons}</div></fieldset>
        <fieldset class="atlas-choice" data-hero-filter="lane"><legend>${t('Линия', 'Lane')}</legend><div>${laneButtons}</div></fieldset>
      </div>
      <div class="tier-controls">
        <div class="tier-views" role="group" aria-label="${t('Вид списка', 'Display')}" hidden><button type="button" data-hero-view="tiers" aria-pressed="true">${t('Тиры', 'Tiers')}</button><button type="button" data-hero-view="stats" aria-pressed="false">${t('Таблица', 'Table')}</button></div>
        <div class="tier-metric" role="group" aria-label="${t('Что показывать', 'Show')}" hidden>${metrics.map(([key, text], i) => `<button type="button" data-hero-metric="${key}" aria-pressed="${i === 0}">${text}</button>`).join('')}</div>
      </div>
      <div class="tier-board">${tiersHTML}</div>
      <table class="tier-stats" hidden><caption class="arena-sr">${t('Победы, выбор и баны героев', 'Win, pick and ban rates')}</caption><thead><tr>${headings.map(([key, text]) => `<th scope="col"><button type="button" data-hero-sort="${key}">${text}</button></th>`).join('')}</tr></thead><tbody></tbody></table>
      <div id="hero-empty" hidden><p role="status">${t('Герои не найдены.', 'No heroes found.')}</p><button type="button" data-hero-reset>${t('Сбросить фильтры', 'Clear filters')}</button></div>
    </div>
    <details class="tier-method"><summary>${t('Как считается тир', 'How the tier is calculated')}</summary><p>${method}</p></details>
    ${section('week', t('Что изменилось', 'What changed'), `<div class="atlas-roles">${changes}</div>`)}
    ${section('roles', t('Лучшие герои по ролям', 'Best heroes by role'), `<div class="atlas-roles">${roleLists}</div>`)}
    <script src="/js/hero-finder.js?v=7" defer></script>`;
  };
  const hubHead = lang => {
    const en = lang === 'en';
    const h1 = en ? 'MLBB tier list' : 'Тир-лист MLBB';
    const sub = en ? `${heroes.length} heroes · ${period(lang)} to ${longDate(lang)}` : `${heroes.length} героя · ${period(lang)} по ${longDate(lang)}`;
    return { h1, html: `<header class="arena-mast"><div><h1>${h1}</h1><p>${sub}</p></div></header>` };
  };
  const hub = { file: 'heroes/index.html', kind: 'hero', layout: 'landing', published: '2026-11-22', updated, ruOnly: true, crumb: ['/news/', 'Новости', 'News'],
    ru: ['Тир-лист MLBB: все 133 героя, сборки и контрпики | MLBB Boost', 'Тир-лист Mobile Legends по актуальной мете: кого чаще всего берут и банят в Мифической славе за 7 дней. Лучшие герои по ролям, сборки, навыки и контрпики для всех 133 героев.', hubBody('ru'), [], hubHead('ru')],
    en: ['MLBB tier list: all 133 heroes, builds and counters | MLBB Boost', 'Mobile Legends tier list for the current meta: who gets picked and banned most in Mythical Glory over 7 days. The best heroes by role, builds, skills and counters for all 133 heroes.', hubBody('en'), [], hubHead('en')] };
  return [hub, ...pages];
}
