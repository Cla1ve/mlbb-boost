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

export function heroGuides(data, academy = null) {
  const heroes = data.heroes;
  const acad = academy?.heroes || {};
  const dict = academy || { items: {}, spells: {}, talents: {}, emblems: {} };
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
  const capital = text => text.charAt(0).toUpperCase() + text.slice(1);
  const roleList = (hero, lang) => hero.roles.map(role => lang === 'en' ? ROLE[role].en : ROLE[role].ru).join(lang === 'en' ? ' and ' : ' и ');
  const laneList = (hero, lang) => hero.lanes.map(lane => lang === 'en' ? LANE[lane].en : LANE[lane].ru.toLowerCase()).join(lang === 'en' ? ' or ' : ' или ');
  const chip = (slug, lang, value = '') => {
    const hero = bySlug[slug];
    return `<a class="hero-chip" href="/heroes/${slug}.html" data-roles="${hero.roles.join(' ')}" data-names="${esc(hero.ru + ' ' + hero.en)}"><img src="/images/heroes/${slug}.webp" width="96" height="96" alt="" loading="lazy" decoding="async"><span class="hero-chip__name">${esc(name(hero, lang))}</span>${value ? `<span class="hero-chip__value">${value}</span>` : ''}</a>`;
  };
  const chips = (slugs, lang) => `<div class="hero-chips">${slugs.map(slug => chip(slug, lang)).join('')}</div>`;
  const section = (id, title, inner) => `<section class="atlas-section" id="${id}"><h2>${title}</h2>${inner}</section>`;
  const esc = text => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const label = (entry, lang) => entry ? esc(lang === 'en' ? entry.en : entry.ru) : '';
  const token = (entry, lang, cls = '') => entry ? `<span class="hb-token${cls}">${entry.icon ? `<img src="${entry.icon}" width="40" height="40" alt="" loading="lazy" decoding="async">` : ''}<span>${label(entry, lang)}</span></span>` : '';
  const buildCard = (build, lang) => {
    const en = lang === 'en';
    const items = build.items.map(id => token(dict.items[id], lang)).join('');
    const talents = build.talents.map(id => token(dict.talents[id], lang, ' hb-token--small')).join('');
    return `<div class="hb-card"><div class="hb-group hb-group--items"><span class="hb-label">${en ? 'Core items' : 'Ключевые предметы'}</span><div class="hb-row">${items}</div></div>`
      + `<div class="hb-group"><span class="hb-label">${en ? 'Emblem and talents' : 'Эмблема и таланты'}</span><div class="hb-row">${token(dict.emblems[build.emblem], lang, ' hb-token--emblem')}${talents}</div></div>`
      + `<div class="hb-group"><span class="hb-label">${en ? 'Battle spell' : 'Боевое заклинание'}</span><div class="hb-row">${token(dict.spells[build.spell], lang)}</div></div>`
      + `<div class="hb-foot"><span>${en ? 'Wins with this build' : 'Побед с этой сборкой'} <strong>${pct(build.win, lang)}</strong></span><span>${en ? 'Picked in' : 'Выбирают в'} <strong>${pct(build.pick, lang)}</strong> ${en ? 'of matches' : 'матчей'}</span></div></div>`;
  };
  const skillNo = (index, total, lang) => index === 0 ? (lang === 'en' ? 'Passive' : 'Пассивный') : index === total - 1 ? (lang === 'en' ? 'Ultimate' : 'Ультимейт') : (lang === 'en' ? `Skill ${index}` : `${index}-й навык`);
  const pages = heroes.map(hero => {
    const strong = [...hero.strongAgainst].sort((a, b) => bySlug[b].pick - bySlug[a].pick).slice(0, 10);
    const counterNames = lang => hero.counters.map(slug => name(bySlug[slug], lang));
    const join = (list, lang) => list.length > 1 ? `${list.slice(0, -1).join(', ')} ${lang === 'en' ? 'and' : 'и'} ${list.at(-1)}` : list[0];
    const roleRank = role => withRole(role).findIndex(item => item.slug === hero.slug) + 1;
    const laneAt = { 'EXP Lane': ['на линии опыта', 'in the EXP Lane'], 'Gold Lane': ['на линии золота', 'in the Gold Lane'], 'Mid Lane': ['на средней линии', 'in the Mid Lane'], Jungle: ['в лесу', 'in the jungle'], Roam: ['в роуме', 'on roam'] };
    const body = lang => {
      const en = lang === 'en';
      const t = (ru, english) => en ? english : ru;
      const ac = acad[hero.slug];
      const sections = [];
      const add = (id, title, inner) => sections.push({ id, title, inner });
      if (ac?.builds?.length) {
        const [main, ...alternatives] = ac.builds;
        const buildLane = { exp: 'EXP Lane', gold: 'Gold Lane', mid: 'Mid Lane', jungle: 'Jungle', roam: 'Roam' }[ac.lane];
        const lane = LANE[buildLane]?.[lang];
        add('build', t('Сборка', 'Build'), `<p class="atlas-caption">${t('Самый частый выбор в рейтинге', 'Most picked in ranked')}${lane ? ' · ' + lane : ''}</p>` + buildCard(main, lang)
          + (alternatives.length ? `<details class="atlas-disclosure"><summary>${t('Другие сборки', 'Alternative builds')} (${alternatives.length})</summary>${alternatives.map(build => buildCard(build, lang)).join('')}</details>` : ''));
      }
      const groups = [
        [t('Кто контрит', 'Counters'), hero.counters],
        [t('Против кого силён', 'Strong against'), strong]
      ].filter(([, slugs]) => slugs.length);
      const allies = (ac?.allies || []).filter(ally => bySlug[ally.slug]);
      const matchups = groups.map(([title, slugs]) => `<div><h3>${title}</h3>${chips(slugs, lang)}</div>`);
      if (allies.length) matchups.push(`<div><h3>${t('Союзники', 'Teammates')}</h3><p class="atlas-caption">${t('Прибавка к доле побед в одной команде', 'Win rate gain when playing together')}</p><div class="hero-chips">${allies.map(ally => chip(ally.slug, lang, `+${num(ally.plus, lang)} ${t('п. п.', 'pp')}`)).join('')}</div></div>`);
      if (matchups.length) add('draft', t('Контрпики и союзники', 'Counters and teammates'), `<div class="atlas-draft">${matchups.join('')}</div>`);
      const skills = ac?.skills?.[lang] || [];
      if (skills.length) {
        const order = (ac.order || []).map(Number).filter(n => n >= 1 && n < skills.length);
        const priority = order.length ? `<p class="hs-order">${t('Приоритет прокачки', 'Level-up priority')} · ${order.map(n => esc(skills[n].name)).join(' → ')}</p>` : '';
        const cards = skills.map((skill, i) => `<details class="atlas-skill"><summary><img src="${skill.icon}" width="48" height="48" loading="lazy" alt=""><span><small>${skillNo(i, skills.length, lang)}</small><strong>${esc(skill.name)}</strong></span></summary><div>${skill.cd ? `<strong>${t('Перезарядка', 'Cooldown')} ${esc(skill.cd)} ${t('с', 's')}</strong>` : ''}${skill.tags?.length ? `<small>${skill.tags.map(esc).join(' · ')}</small>` : ''}<p>${esc(skill.desc).replace(/\n+/g, '<br>')}</p></div></details>`);
        add('skills', t('Навыки', 'Skills'), priority + `<div class="atlas-skills">${cards.join('')}</div>`);
      }
      if (hero.byRank && RANK_ROWS.every(([key]) => Number.isFinite(hero.byRank[key]))) {
        const rows = RANK_ROWS.map(([key, icon, ru, english]) => `<li><img src="/images/ranks/${icon}.webp" width="40" height="40" alt="" loading="lazy"><span class="hero-ranks__name">${t(ru, english)}</span><span class="hero-ranks__bar" aria-hidden="true"><i style="width:${hero.byRank[key]}%"></i></span><strong>${pct(hero.byRank[key], lang)}</strong></li>`);
        add('ranks', t('Победы по рангам', 'Win rate by rank'), `<ul class="hero-ranks">${rows.join('')}</ul>`);
      }
      const official = `https://www.mobilelegends.com/hero/detail?heroid=${ac?.id || heroes.length + 1 - hero.releaseOrder}`;
      const wiki = `https://mobile-legends.fandom.com/wiki/${encodeURIComponent(hero.en.replace(/ /g, '_'))}`;
      add('lore', t('История', 'Lore'), `${ac?.story?.[lang] ? `<p>${esc(ac.story[lang])}</p>` : ''}<div class="atlas-links">${ac?.lore ? `<a href="${esc(ac.lore)}">${t('Читать историю', 'Read the lore')}</a>` : ''}<a href="${official}">${t('Карточка героя', 'Hero card')}</a><a href="${wiki}">MLBB Wiki</a></div>`);
      const traits = [...(ac?.speciality?.[lang] || [])];
      if (ac?.ability?.[3]) traits.push(`${t('Сложность', 'Difficulty')} ${ac.ability[3]}/100`);
      const traitsHTML = traits.length ? `<p class="atlas-traits">${traits.map(esc).join(' · ')}</p>` : '';
      const metrics = [[hero.win,t('Победы','Win rate')],[hero.pick,t('Выбор','Pick rate')],[hero.ban,t('Баны','Ban rate')]];
      return `<dl class="atlas-metrics">${metrics.map(([value,title])=>`<div><dt>${title}</dt><dd>${pct(value,lang)}</dd></div>`).join('')}</dl>
        ${traitsHTML}<nav class="atlas-nav" aria-label="${t('Разделы профиля','Profile sections')}">${sections.map(({id,title})=>`<a href="#${id}">${title}</a>`).join('')}</nav>
        ${sections.map(({id,title,inner})=>section(id,title,inner)).join('')}<div class="atlas-links"><a href="${BOT_PRICE}">${t('Стоимость буста на герое','Hero boost pricing')}</a></div>`;
    };
    const buildFaq = lang => {
      const en = lang === 'en';
      const ac = acad[hero.slug];
      const build = ac?.builds?.[0];
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
      return [
        [en ? `Who counters ${hero.en} in MLBB?` : `Кто контрпик для героя ${quoted} в MLBB?`, en ? `Over the last 30 days the toughest opponents are ${join(counterNames('en'), 'en')}.` : `За последние 30 дней чаще всего героя обыгрывают ${join(counterNames('ru'), 'ru')}.`],
        [en ? `What is ${hero.en}’s win rate right now?` : `Какой процент побед у героя ${quoted} сейчас?`, en ? `${pct(hero.win, 'en')} over the last 30 days across all ranks and ${pct(hero.gloryWin, 'en')} in Mythical Glory, as of ${statsDate('en')}.` : `${pct(hero.win, 'ru')} за последние 30 дней на всех рангах и ${pct(hero.gloryWin, 'ru')} в Мифической славе, данные на ${statsDate('ru')}.`],
        [en ? `What role and lane does ${hero.en} play?` : `Какая роль и линия у героя ${quoted}?`, en ? `${capital(roleList(hero, 'en'))}, played ${hero.lanes.map(lane => laneAt[lane][1]).join(' or ')}.` : `${capital(roleList(hero, 'ru'))}, играет ${hero.lanes.map(lane => laneAt[lane][0]).join(' или ')}.`],
        [en ? `Is ${hero.en} strong in the current meta?` : `Силён ли герой ${quoted} в текущей мете?`, en ? `Tier ${hero.tier}: #${hero.rank} of ${heroes.length} heroes by 30-day win rate and #${roleRank(hero.roles[0])} among ${ROLE[hero.roles[0]].enPlural}.` : `Тир ${hero.tier}: ${hero.rank}-е место из ${heroes.length} героев по проценту побед за 30 дней и ${roleRank(hero.roles[0])}-е среди ${ROLE[hero.roles[0]].gen}.`],
        ...buildFaq(lang)
      ];
    };
    const meta = lang => lang === 'en'
      ? [`${hero.en} MLBB: build, counters and skills | MLBB Boost`, `${hero.en} in Mobile Legends: the most popular ranked build, skills, counters and teammates. ${capital(roleList(hero, 'en'))}, ${pct(hero.win, 'en')} win rate, tier ${hero.tier}.`]
      : [`${hero.ru} MLBB: сборка, контрпики и навыки | MLBB Boost`, `${hero.ru} в Mobile Legends: популярная сборка в рейтинге, навыки, контрпики и союзники. ${capital(roleList(hero, 'ru'))}, ${pct(hero.win, 'ru')} побед, тир ${hero.tier}.`];
    const heroHead = lang => {
      const en = lang === 'en';
      return { h1: name(hero, lang), portrait: hero.slug, tier: hero.tier,
        sub: `${capital(roleList(hero, lang))} · ${capital(laneList(hero, lang))}`,
        context: en ? `#${hero.rank} of ${heroes.length} by win rate` : `№ ${hero.rank} из ${heroes.length} по доле побед`,
        period: en ? `All ranks · 30 days to ${statsDate(lang)}` : `Все ранги · 30 дней по ${statsDate(lang)}` };
    };
    const lang = l => [...meta(l), body(l), faq(l), heroHead(l)];
    return { file: `heroes/${hero.slug}.html`, kind: 'hero', layout: 'landing', art: `profile:${hero.slug}`, published: '2026-11-22', updated, noLlms: true, ruOnly: true,
      crumb: ['/heroes/', 'Герои', 'Heroes'], ru: lang('ru'), en: lang('en') };
  });

  const tiers = ['S', 'A', 'B', 'C', 'D'];
  const hubBody = lang => {
    const en = lang === 'en';
    const thresholds = ['≥ 53%', '≥ 51%', '≥ 49%', '≥ 47%', '< 47%'];
    const tierRows = tiers.map((tier,index) => {
      const members = byWin(heroes.filter(hero => hero.tier === tier));
      return `<section class="tier-row" id="tier-${tier}" data-tier="${tier}"><header><h2>${tier}</h2><small>${esc(thresholds[index])}</small></header><div class="tier-roster">${members.map(hero=>chip(hero.slug,lang,pct(hero.win,lang))).join('')}</div></section>`;
    });
    const roles = Object.keys(ROLE);
    const roleLists = roles.map(role => `<section><h3>${ROLE_HUB[role][en ? 1 : 0]}</h3><ol>${withRole(role).slice(0,6).map(hero=>`<li>${chip(hero.slug,lang,pct(hero.win,lang))}</li>`).join('')}</ol></section>`);
    return `<div class="atlas-tools" hidden><label>${en ? 'Hero name' : 'Имя героя'}<input type="search" id="hero-query" autocomplete="off"></label><label>${en ? 'Role' : 'Роль'}<select id="hero-role"><option value="">${en ? 'All roles' : 'Все роли'}</option>${roles.map(r=>`<option value="${r}">${capital(ROLE[r][lang])}</option>`).join('')}</select></label></div>
    <nav class="tier-jump" aria-label="${en ? 'Tier list sections' : 'Разделы тир-листа'}">${tiers.map(tier => `<a href="#tier-${tier}" data-tier-link="${tier}">${tier}</a>`).join('')}<a href="#roles">${en ? 'Best by role' : 'Лучшие по ролям'}</a></nav>
    <div class="tier-board">${tierRows.join('')}</div><p id="hero-empty" role="status" hidden>${en ? 'No heroes match. Change the name or role.' : 'Герои не найдены. Измените имя или роль.'}</p>
    ${section('roles', en ? 'Best heroes by role' : 'Лучшие герои по ролям', `<div class="atlas-roles">${roleLists.join('')}</div>`)}
    <script src="/js/hero-finder.js" defer></script>`;
  };
  const hubHead = lang => ({
    h1: lang === 'en' ? 'MLBB tier list' : 'Тир-лист MLBB',
    sub: lang === 'en' ? `${heroes.length} heroes by ranked win rate` : `${heroes.length} героя по доле побед в рейтинге`,
    period: lang === 'en' ? `All ranks · 30 days to ${statsDate(lang)}` : `Все ранги · 30 дней по ${statsDate(lang)}`
  });
  const hub = { file: 'heroes/index.html', kind: 'hero', layout: 'landing', published: '2026-11-22', updated, ruOnly: true, crumb: ['/news/', 'Новости', 'News'],
    ru: ['Тир-лист MLBB: все 133 героя, сборки и контрпики | MLBB Boost', 'Тир-лист Mobile Legends по официальной статистике MOONTON за 30 дней: лучшие герои по ролям, популярные сборки, навыки и контрпики для всех 133 героев.', hubBody('ru'), [], hubHead('ru')],
    en: ['MLBB tier list: all 133 heroes, builds and counters | MLBB Boost', 'Mobile Legends tier list from official MOONTON 30-day statistics: the best heroes by role, popular builds, skills and counters for all 133 heroes.', hubBody('en'), [], hubHead('en')] };
  return [hub, ...pages];
}
