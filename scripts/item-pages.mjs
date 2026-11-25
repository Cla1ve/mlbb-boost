// The /items/ section: the shop catalog, one page per item and two pages for the jungle and roam blessings.
// Data: content/items.json (prices from the in-game shop, attributes, effects and recipes from the in-game Academy,
// stories from Liquipedia) and content/heroes-academy.json (which heroes carry the item in their popular ranked builds).
// Imported by site-build.mjs, which renders these guides like the hero pages.
import { rateHeroes } from './hero-pages.mjs';

const BOT_PRICE = '/order.html';
const PUBLISHED = '2026-11-25';
const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// The shop tabs, in the order of the game.
export const ITEM_TABS = [
  ['attack', 'Атака', 'Attack', 'атаки', 'attack'],
  ['magic', 'Магия', 'Magic', 'магии', 'magic'],
  ['defense', 'Защита', 'Defense', 'защиты', 'defense'],
  ['movement', 'Передвижение', 'Movement', 'передвижения', 'movement'],
  ['jungle', 'Лес', 'Jungle', 'леса', 'jungle'],
  ['roam', 'Роум', 'Roam', 'роума', 'roam']
];
// Attribute names as the Russian client prints them.
const STATS = {
  physAtk: ['Физическая атака', 'Physical Attack'], adaptive: ['Адаптивная атака', 'Adaptive Attack'], magic: ['Магическая сила', 'Magic Power'],
  attackSpeed: ['Скорость атаки', 'Attack Speed'], crit: ['Шанс крит. удара', 'Crit Chance'], critDamage: ['Крит. урон', 'Crit Damage'],
  critReduce: ['Снижение крит. урона', 'Crit Damage Reduction'], lifesteal: ['Вампиризм', 'Lifesteal'], spellVamp: ['Вампиризм навыков', 'Spell Vamp'],
  hybridSteal: ['Гибридный вампиризм', 'Hybrid Lifesteal'], cdr: ['Сокращение перезарядки', 'Cooldown Reduction'], hp: ['ОЗ', 'HP'],
  hpRegen: ['Регенерация ОЗ', 'HP Regen'], mana: ['Мана', 'Mana'], manaRegen: ['Регенерация маны', 'Mana Regen'],
  physPen: ['Физическое проникновение', 'Physical Penetration'], magicPen: ['Магическое проникновение', 'Magic Penetration'],
  physDef: ['Физическая защита', 'Physical Defense'], magicDef: ['Магическая защита', 'Magic Defense'], move: ['Скорость передвижения', 'Movement Speed'],
  slowReduce: ['Сопротивление замедлению', 'Slow Reduction'], healing: ['Эффект лечения', 'Healing Effect']
};
const KIND = { final: ['Готовый предмет', 'Finished item'], part: ['Деталь', 'Component'], potion: ['Зелье', 'Potion'], special: ['Особый предмет', 'Special item'] };
const EFFECT = { passive: ['Уникальный пассивный', 'Unique passive'], active: ['Активный', 'Active'], attr: ['Уникальный атрибут', 'Unique attribute'] };
// Who can get the special items: shown on their pages and in the catalog.
const SPECIAL_HERO = { 'lantern-of-hope': 'floryn', 'flower-of-hope': 'floryn', 'allow-throw': 'jawhead', 'throw-forbidden': 'jawhead', 'broken-heart': 'carmilla' };

// The blessings are not shop items with prices: two pages, one per tab. Texts follow the game: owner's screenshots of
// 25.11.2026 for Flame Retribution and all four roam blessings, the Academy for the hunter boots. Ice and Bloody Retribution
// numbers were not on the screenshots and are left out instead of being guessed.
const BLESSINGS = {
  jungle: {
    slug: 'retribution', icon: 'flame-retribution',
    ru: { h1: 'Возмездие', title: 'Возмездие в MLBB: Пламенное, Ледяное и Кровавое | MLBB Boost', description: 'Благословения леса в Mobile Legends: чем отличаются Пламенное, Ледяное и Кровавое Возмездие, что даёт пассивка «Охотник» и какие ботинки можно зачаровать.', tag: 'Благословение леса' },
    en: { h1: 'Retribution', title: 'MLBB Retribution: Flame, Ice and Bloody | MLBB Boost', description: 'Mobile Legends jungle blessings: how Flame, Ice and Bloody Retribution differ, what the Hunter passive does and which boots can be enchanted.', tag: 'Jungle blessing' },
    variants: [
      { id: 'flame', icon: 'flame-retribution', ru: ['Пламенное Возмездие', 'При применении на вражеского героя наносит 100 чистого урона и крадёт 71–120 физической атаки и магической силы (зависит от уровня) на 3 с.', 'Подходит, когда нужно выиграть дуэль: противник слабеет, вы сильнее.'],
        en: ['Flame Retribution', 'Cast on an enemy hero, it deals 100 True Damage and steals 71–120 Physical Attack and Magic Power (scales with level) for 3s.', 'For duels: the enemy gets weaker while you get stronger.'] },
      { id: 'ice', icon: 'ice-retribution', ru: ['Ледяное Возмездие', 'При применении на вражеского героя наносит 100 чистого урона и крадёт у него скорость передвижения на несколько секунд.', 'Подходит, чтобы догнать цель или уйти от погони.'],
        en: ['Ice Retribution', 'Cast on an enemy hero, it deals 100 True Damage and steals Movement Speed from them for a few seconds.', 'For chasing a target down or getting away.'] },
      { id: 'bloody', icon: 'bloody-retribution', ru: ['Кровавое Возмездие', 'При применении на вражеского героя наносит 100 чистого урона и крадёт у него ОЗ на несколько секунд.', 'Подходит лесникам, которым важно пережить бой.'],
        en: ['Bloody Retribution', 'Cast on an enemy hero, it deals 100 True Damage and steals HP from them for a few seconds.', 'For junglers who need to survive the fight.'] }
    ],
    common: { ru: ['Улучшение', '«Возмездие» улучшается, когда убийства монстров, героев и помощи вместе достигают 5.'], en: ['Upgrade', 'Retribution is upgraded once creep kills, hero kills and assists add up to 5.'] },
    hunter: { ru: ['Охотник', 'Ботинки с благословением леса: после урона по монстру наносят ему 40 (+3 × уровень героя) + 1% общих ОЗ героя чистого урона за 3 с. У героев, которые не стрелки, урон вдвое выше.'], en: ['Hunter', 'Boots with a jungle blessing: after damaging a creep, deal 40 (+3 × hero level) + 1% of Total HP as True Damage over 3s, doubled for non-Marksmen.'] }
  },
  roam: {
    slug: 'roam-blessings', icon: 'encourage',
    ru: { h1: 'Благословения роума', title: 'Благословения роума в MLBB: Поощрение, Маскировка, Благосклонность | MLBB Boost', description: 'Благословения роума в Mobile Legends: что дают Поощрение, Благосклонность, Острый удар и Маскировка, как роумер получает золото и когда открывается навык.', tag: 'Благословение роума' },
    en: { h1: 'Roam blessings', title: 'MLBB roam blessings: Encourage, Conceal, Favor, Dire Hit | MLBB Boost', description: 'Mobile Legends roam blessings: what Encourage, Favor, Dire Hit and Conceal do, how a roamer earns gold and when the skill unlocks.', tag: 'Roam blessing' },
    variants: [
      { id: 'encourage', icon: 'encourage', ru: ['Поощрение', 'Пассивный: вы и союзные герои рядом получаете 20 дополнительной гибридной защиты.', 'Для драк всей командой.'], en: ['Encourage', 'Passive: you and nearby allied heroes gain 20 extra Hybrid Defense.', 'For team fights.'] },
      { id: 'favor', icon: 'favor', ru: ['Благосклонность', 'Пассивный: раз в 15 с ваш следующий навык лечения или щита дополнительно восстанавливает 400 ОЗ союзному герою с наименьшим запасом ОЗ в радиусе 5 единиц, включая вас. Навыки, которые действуют только на вас, эффект не запускают.', 'Для героев, которые лечат и дают щиты.'],
        en: ['Favor', 'Passive: every 15s, your next heal or shield skill restores an extra 400 HP to the allied hero with the lowest HP within 5 units, you included. Skills that affect only you do not trigger it.', 'For healers and shielders.'] },
      { id: 'dire-hit', icon: 'dire-hit', ru: ['Острый удар', 'Пассивный: во время движения копится «Сила», скорость передвижения постепенно растёт (до 40). На 20 зарядах следующее попадание тратит все заряды и наносит дополнительный чистый урон, который зависит от их числа.', 'Для роумеров, которые много бегают и сами начинают драку.'],
        en: ['Dire Hit', 'Passive: moving builds up Power and gradually raises Movement Speed (up to 40). At 20 stacks, the next hit spends them all and deals extra True Damage based on the number of stacks.', 'For roamers who move a lot and start fights.'] },
      { id: 'conceal', icon: 'conceal', ru: ['Маскировка', 'Активный: маскирует вас и союзных героев рядом и даёт 40% скорости передвижения на 5 с. Маскировка спадает, если получить или нанести урон.', 'Для засад и быстрых перебежек.'], en: ['Conceal', 'Active: camouflages you and nearby allied heroes and grants 40% Movement Speed for 5s. Dealing or taking damage ends it.', 'For ambushes and rotations.'] }
    ],
    common: { ru: ['Успешное развитие', 'Рядом с союзными героями вы получаете 30% опыта и золота от миньонов и монстров. Урон по вражеским героям (раз в 15 с) и обнаружение врагов тоже приносят опыт и золото. Навык благословения открывается, когда от «Успешного развития» накопится 1000 золота.'],
      en: ['Thriving', 'Near allied heroes you gain 30% of the EXP and Gold from minions and creeps. Damaging enemy heroes (once every 15s) and revealing enemies also grant EXP and Gold. The blessing skill unlocks after 1,000 Gold from Thriving.'] }
  }
};

export function itemGuides(itemsData, heroesData, academy) {
  const items = itemsData.items;
  const byId = Object.fromEntries(items.map(item => [item.id, item]));
  const heroes = rateHeroes(heroesData.heroes);
  const heroBySlug = Object.fromEntries(heroes.map(hero => [hero.slug, hero]));
  const acad = academy?.heroes || {};
  const [year, month, day] = itemsData.updated.split('-').map(Number);
  const priceDate = lang => lang === 'en' ? `${day} ${MONTHS_EN[month - 1]} ${year}` : `${day} ${MONTHS_RU[month - 1]} ${year}`;
  const esc = text => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const name = (item, lang) => lang === 'en' ? item.en : item.ru;
  // Soft hyphens in long words, so narrow cards break "Концентри-рованная" at a syllable instead of mid-letter.
  const vowels = /[аеёиоуыэюяaeiouy]/i;
  const soft = text => text.replace(/[А-Яа-яЁёA-Za-z]{13,}/g, word => {
    const middle = Math.floor(word.length / 2);
    for (let offset = 0; offset < middle - 3; offset++) for (const at of [middle + offset, middle - offset]) {
      if (vowels.test(word[at - 1]) && !vowels.test(word[at]) && !/[ьъй]/i.test(word[at])) return word.slice(0, at) + '­' + word.slice(at);
    }
    return word;
  });
  const cardName = (item, lang) => esc(soft(name(item, lang)));
  const quoted = (item, lang) => lang === 'en' ? item.en : `«${item.ru}»`;
  const join = (list, lang) => list.length > 1 ? `${list.slice(0, -1).join(', ')} ${lang === 'en' ? 'and' : 'и'} ${list.at(-1)}` : list[0] || '';
  const num = (value, lang) => new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'ru-RU').format(value).replace(/[  ]/g, lang === 'en' ? ',' : ' ');
  const pct1 = (value, lang) => `${lang === 'en' ? value.toFixed(1) : value.toFixed(1).replace('.', ',')}%`;
  const statValue = ([, value, unit]) => `+${String(value).replace('.', ',')}${unit}`;
  const statLabel = (stat, lang) => STATS[stat[0]][lang === 'en' ? 1 : 0];
  const statLine = (stat, lang) => `${lang === 'en' ? statValue(stat).replace(',', '.') : statValue(stat)} ${lang === 'en' ? statLabel(stat, lang) : statLabel(stat, lang).toLowerCase()}`;
  const url = item => `/items/${item.slug}.html`;
  // Two identical parts read as one entry: «Нож» ×2.
  const grouped = parts => parts.reduce((list, part) => { const row = list.find(entry => entry.item === part); if (row) row.count++; else list.push({ item: part, count: 1 }); return list; }, []);
  const tabName = (key, lang) => { const tab = ITEM_TABS.find(row => row[0] === key); return lang === 'en' ? tab[2] : tab[1]; };
  const tabGen = (key, lang) => { const tab = ITEM_TABS.find(row => row[0] === key); return lang === 'en' ? tab[4] : tab[3]; };
  const icon = (item, size, extra = '') => `<img src="/images/mlbb/items/${item.id}.webp" width="${size}" height="${size}" alt=""${extra} loading="lazy" decoding="async">`;
  const price = (value, lang) => `<span class="coin" aria-label="${num(value, lang)} ${lang === 'en' ? 'gold' : 'золота'}">${num(value, 'ru').replace(' ', ' ')}</span>`;

  // Which heroes carry an item in their popular ranked builds (Academy data, the same builds the hero pages show).
  const carriers = {};
  for (const [slug, ac] of Object.entries(acad)) {
    const hero = heroBySlug[slug];
    if (!hero) continue;
    const builds = [...(ac.builds || [])].sort((a, b) => b.pick - a.pick);
    const best = Math.max(0, ...builds.map(build => build.win));
    const clean = builds.filter(build => build.win >= best - 12);
    for (const build of clean) for (const id of new Set(build.items)) {
      const list = carriers[id] ||= [];
      if (!list.some(row => row.slug === slug)) list.push({ slug, win: build.win, pick: build.pick, lane: ac.lane });
    }
  }
  for (const list of Object.values(carriers)) list.sort((a, b) => heroBySlug[a.slug].rank - heroBySlug[b.slug].rank);
  const carriersOf = item => carriers[item.id] || [];

  // A shop card: round icon with the price under it, name and the short line from the game.
  const ware = (item, lang, attrs = '') => `<a class="ware" href="${url(item)}"${attrs}><span class="ware__icon">${icon(item, 64)}${item.cost ? price(item.cost, lang) : ''}</span><span class="ware__text"><span class="ware__name">${cardName(item, lang)}</span>${item.short ? `<span class="ware__note">${esc(item.short[lang])}</span>` : ''}</span></a>`;
  const blessingCard = (key, variant, lang) => `<a class="ware" href="/items/${BLESSINGS[key].slug}.html#${variant.id}" data-names="${esc((variant.ru[0] + ' ' + variant.en[0]).toLowerCase())}"><span class="ware__icon"><img src="/images/mlbb/blessings/${variant.icon}.webp" width="64" height="64" alt="" loading="lazy" decoding="async"></span><span class="ware__text"><span class="ware__name">${esc(variant[lang][0])}</span><span class="ware__note">${esc(variant[lang][2])}</span></span></a>`;
  const heroRow = (row, lang) => {
    const hero = heroBySlug[row.slug];
    return `<li><a class="hero-chip" href="/heroes/${hero.slug}.html#build"><img src="/images/heroes/${hero.slug}.webp" width="96" height="96" alt="" loading="lazy" decoding="async"><span class="hero-chip__name">${esc(lang === 'en' ? hero.en : hero.ru)}</span><span class="hero-chip__value">${pct1(row.win, lang)}</span></a></li>`;
  };

  // ---------- Catalog ----------
  const tabItems = key => (itemsData.tabs[key] || []).map(id => byId[id]);
  const hubBody = lang => {
    const en = lang === 'en';
    const t = (ru, english) => en ? english : ru;
    const shopTabs = ITEM_TABS.filter(([key]) => itemsData.tabs[key]);
    // Finished items as cards; parts, potions and special items as small tiles in one row, as the game lists them last.
    const attrs = (item, key) => ` data-names="${esc((item.ru + ' ' + item.en).toLowerCase())}"${item.cats[0] !== key ? ' data-dup' : ''}`;
    const restLabel = list => {
      const kinds = new Set(list.map(item => item.kind));
      const words = [kinds.has('part') && t('Детали', 'Components'), kinds.has('potion') && t('зелья', 'potions'), kinds.has('special') && t('особые предметы', 'special items')].filter(Boolean);
      const text = words.length > 1 ? `${words.slice(0, -1).join(', ')} ${t('и', 'and')} ${words.at(-1)}` : words[0];
      return text.charAt(0).toUpperCase() + text.slice(1);
    };
    const sections = shopTabs.map(([key]) => {
      const list = tabItems(key);
      const finals = list.filter(item => item.kind === 'final');
      const rest = list.filter(item => item.kind !== 'final');
      const cards = finals.map(item => ware(item, lang, attrs(item, key))).join('');
      const tiles = rest.map(item => `<a class="part" href="${url(item)}"${attrs(item, key)}><span class="ware__icon">${icon(item, 52)}${item.cost ? price(item.cost, lang) : ''}</span><span class="part__name">${cardName(item, lang)}</span></a>`).join('');
      return `<section class="shop" id="${key}" data-tab="${key}"><h2>${tabName(key, lang)}</h2><div class="shop-grid">${cards}</div>${tiles ? `<div class="shop-rest"><h3>${restLabel(rest)}</h3><div class="parts">${tiles}</div></div>` : ''}</section>`;
    });
    for (const key of ['jungle', 'roam']) {
      const blessing = BLESSINGS[key];
      sections.push(`<section class="shop" id="${key}" data-tab="${key}"><h2>${tabName(key, lang)}</h2><div class="shop-grid">${blessing.variants.map(variant => blessingCard(key, variant, lang)).join('')}</div></section>`);
    }
    const tabButtons = [['', t('Все', 'All')], ...ITEM_TABS.map(([key, ru, english]) => [key, en ? english : ru])]
      .map(([key, text]) => `<button type="button" data-item-tab="${key}" aria-pressed="${key === ''}">${text}</button>`).join('');
    // The most carried items across all heroes' popular builds.
    const popular = items.filter(item => carriersOf(item).length).sort((a, b) => carriersOf(b).length - carriersOf(a).length).slice(0, 9);
    const heroWord = n => en ? (n === 1 ? 'hero' : 'heroes') : (n % 10 === 1 && n % 100 !== 11 ? 'героя' : 'героев');
    const popularHTML = `<section class="atlas-section items-popular" id="popular"><h2>${t('Чаще всего в сборках', 'Most built')}</h2><ul class="usage">${popular.map(item => `<li><a href="${url(item)}">${icon(item, 56)}<span class="usage__name">${esc(name(item, lang))}</span><span class="usage__count">${t(`в сборках ${carriersOf(item).length} ${heroWord(carriersOf(item).length)}`, `in ${carriersOf(item).length} ${heroWord(carriersOf(item).length)}’ builds`)}</span></a></li>`).join('')}</ul></section>`;
    return `<div class="arena-workspace">
      <div class="atlas-tools" hidden>
        <label class="atlas-search"><span class="arena-sr">${t('Найти предмет', 'Find an item')}</span><i class="fas fa-search" aria-hidden="true"></i><input type="search" id="item-query" autocomplete="off" placeholder="${t('Найти предмет', 'Find an item')}"></label>
        <div class="item-tabs" role="group" aria-label="${t('Раздел магазина', 'Shop tab')}">${tabButtons}</div>
      </div>
      <p class="arena-sr" role="status" id="item-status"></p>
      <div class="shop-board" data-all>${sections.join('')}</div>
      <div id="item-empty" hidden><p>${t('Такого предмета нет. Проверьте название.', 'No item with that name. Check the spelling.')}</p><button type="button" data-item-reset>${t('Показать все', 'Show all')}</button></div>
    </div>
    ${popularHTML}
    <script src="/js/items-finder.js?v=1" defer></script>`;
  };
  const shopCount = items.length;
  const hubHead = lang => {
    const en = lang === 'en';
    const h1 = en ? 'MLBB items' : 'Предметы MLBB';
    return { h1, html: `<header class="arena-mast"><div><h1>${h1}</h1><p>${en ? `${shopCount} items · prices as in the game on ${priceDate('en')}` : `${shopCount} предметов · цены как в игре на ${priceDate('ru')}`}</p></div></header>` };
  };
  const itemList = lang => items.map(item => ({ name: name(item, lang), url: url(item) }));
  const hub = { file: 'items/index.html', kind: 'item', layout: 'landing', published: PUBLISHED, updated: itemsData.updated, ruOnly: true, crumb: ['/items/', 'Предметы', 'Items'], itemList,
    ru: [`Предметы MLBB: все ${shopCount} предметов, цены и сборки | MLBB Boost`, 'Все предметы Mobile Legends с ценами из игры: характеристики, пассивки, из чего собирается каждый предмет и какие герои его берут. Атака, магия, защита, ботинки, благословения леса и роума.', hubBody('ru'), [], hubHead('ru')],
    en: [`MLBB items: all ${shopCount} items, prices and builds | MLBB Boost`, 'Every Mobile Legends item with in-game prices: attributes, passives, what each item builds from and which heroes buy it. Attack, magic, defense, boots, jungle and roam blessings.', hubBody('en'), [], hubHead('en')] };

  // ---------- Item pages ----------
  // The recipe as the game draws it: the item, its parts in a row, the parts of each part under it.
  const node = (item, lang, size, here = false) => `<${here ? 'span' : 'a'} class="recipe__node${here ? ' is-here' : ''}"${here ? '' : ` href="${url(item)}"`} title="${esc(name(item, lang))}">${icon(item, size)}${price(item.cost, lang)}<span class="recipe__name">${cardName(item, lang)}</span></${here ? 'span' : 'a'}>`;
  const recipe = (item, lang) => {
    if (!item.components.length) return '';
    const parts = item.components.map(id => byId[id]);
    return `<div class="recipe" style="--parts:${parts.length}"><div class="recipe__top">${node(item, lang, 88, true)}</div><ul class="recipe__row">${parts.map(part => `<li>${node(part, lang, 64)}${part.components.length ? `<ul class="recipe__sub">${part.components.map(id => `<li>${node(byId[id], lang, 48)}</li>`).join('')}</ul>` : ''}</li>`).join('')}</ul></div>`;
  };
  const pages = items.map(item => {
    const parts = item.components.map(id => byId[id]);
    const into = item.into.map(id => byId[id]);
    const heroes = carriersOf(item);
    const primary = item.cats[0];
    const similar = tabItems(primary).filter(other => other.id !== item.id && other.kind === item.kind).slice(0, 8);
    const specialHero = heroBySlug[SPECIAL_HERO[item.slug]];
    const body = lang => {
      const en = lang === 'en';
      const t = (ru, english) => en ? english : ru;
      const blocks = [];
      if (item.effects.length) blocks.push(`<section class="atlas-section" id="effect"><h2>${t('Эффект', 'Effect')}</h2><div class="effects">${item.effects.map(effect => `<article class="effect"><small>${EFFECT[effect.kind][en ? 1 : 0]}</small><h3>${esc(effect.name[lang])}</h3><p>${esc(effect.text[lang])}</p></article>`).join('')}</div></section>`);
      if (parts.length || into.length) {
        const upgrade = item.upgrade ? `<p class="recipe__note">${t(`Детали стоят ${num(item.cost - item.upgrade, 'ru')}, сборка — ещё ${num(item.upgrade, 'ru')} золота.`, `Parts cost ${num(item.cost - item.upgrade, 'en')}, assembly adds ${num(item.upgrade, 'en')} gold.`)}</p>` : '';
        const intoHTML = into.length ? `<div class="into"><h3>${t('Входит в', 'Builds into')}</h3><div class="shop-grid">${into.map(other => ware(other, lang)).join('')}</div></div>` : '';
        blocks.push(`<section class="atlas-section" id="recipe"><h2>${t('Сборка', 'Recipe')}</h2>${recipe(item, lang)}${upgrade}${intoHTML}</section>`);
      }
      if (heroes.length) blocks.push(`<section class="atlas-section" id="heroes"><h2>${t('Кто собирает', 'Who builds it')}</h2><p class="atlas-caption">${t('Герои, у которых предмет есть в популярной сборке в рейтинге, и процент побед с ней', 'Heroes whose popular ranked build has the item, with the build’s win rate')}</p><ul class="chip-grid">${heroes.map(row => heroRow(row, lang)).join('')}</ul></section>`);
      if (item.story) blocks.push(`<section class="atlas-section" id="story"><h2>${t('История', 'Story')}</h2><div class="arena-lore"><blockquote>${esc(item.story[lang])}</blockquote><a class="arena-lore-official" href="https://liquipedia.net/mobilelegends/${encodeURIComponent(item.liquipedia).replace(/%27/g, "'")}#Version_History" target="_blank" rel="noopener">${t('Изменения по патчам', 'Patch history')} <span aria-hidden="true">↗</span></a></div></section>`);
      if (similar.length) blocks.push(`<section class="atlas-section" id="more"><h2>${t(`Другие предметы ${tabGen(primary, lang)}`, `More ${tabGen(primary, lang)} items`)}</h2><div class="shop-grid">${similar.map(other => ware(other, lang)).join('')}</div><p class="list-more"><a href="/items/#${primary}">${t('Все предметы', 'All items')}</a></p></section>`);
      return `<div class="item-chapters">${blocks.join('')}</div>
        <aside class="hero-cta"><div><strong>${t('Поднимем ранг, пока вы заняты', 'We rank up while you are busy')}</strong><span>${t('Цена считается в калькуляторе', 'The calculator shows the price')}</span></div><a class="calc-btn" href="${BOT_PRICE}">${t('Рассчитать цену', 'Calculate price')}</a></aside>`;
    };
    const head = lang => {
      const en = lang === 'en';
      const t = (ru, english) => en ? english : ru;
      const tags = [...item.cats.map(cat => `<a class="sheet__tag" href="/items/#${cat}">${tabName(cat, lang)}</a>`), `<span class="sheet__tag">${KIND[item.kind][en ? 1 : 0]}</span>`, specialHero ? `<a class="sheet__tag" href="/heroes/${specialHero.slug}.html">${t('Только с героем', 'Hero')} ${esc(en ? specialHero.en : specialHero.ru)}</a>` : ''].join('');
      const stats = item.stats.length ? `<ul class="relic__stats">${item.stats.map(stat => `<li><b>${en ? statValue(stat).replace(',', '.') : statValue(stat)}</b><span>${statLabel(stat, lang)}</span></li>`).join('')}</ul>` : '';
      const html = `<header class="relic">
        <img class="relic__icon" src="/images/mlbb/items/${item.id}.webp" width="100" height="100" alt="${esc(t(`Иконка предмета ${item.ru}`, `${item.en} item icon`))}" fetchpriority="high">
        <div class="relic__body">
          <h1>${esc(name(item, lang))}</h1>
          ${en ? '' : `<p class="relic__alt" lang="en">${esc(item.en)}</p>`}
          <p class="sheet__tags">${tags}</p>
        </div>
        <dl class="relic__price"><dt>${t('Цена', 'Price')}</dt><dd>${item.cost ? price(item.cost, lang) : t('Бесплатно', 'Free')}</dd></dl>
        ${stats}
      </header>`;
      return { h1: name(item, lang), html };
    };
    const faq = lang => {
      const en = lang === 'en';
      const q = quoted(item, lang);
      const rows = [];
      if (parts.length) {
        const partText = grouped(parts).map(({ item: part, count }) => `${en ? part.en : `«${part.ru}»`}${count > 1 ? ` ×${count}` : ''} (${count > 1 ? (en ? `${num(part.cost, lang)} each` : `по ${num(part.cost, lang)}`) : num(part.cost, lang)})`);
        rows.push([en ? `How much does ${item.en} cost and what does it build from?` : `Сколько стоит ${q} и из чего собирается?`,
          en ? `${num(item.cost, 'en')} gold. Parts: ${join(partText, 'en')}; assembly adds ${num(item.upgrade, 'en')} gold.` : `${num(item.cost, 'ru')} золота. Детали: ${join(partText, 'ru')}, сборка — ещё ${num(item.upgrade, 'ru')} золота.`]);
      } else if (item.cost) {
        rows.push([en ? `How much does ${item.en} cost?` : `Сколько стоит ${q}?`, en ? `${num(item.cost, 'en')} gold. It is a basic item with no parts${into.length ? `; it builds into ${join(into.map(other => other.en), 'en')}` : ''}.` : `${num(item.cost, 'ru')} золота. Это базовая деталь, она не собирается из других${into.length ? ` и входит в ${join(into.map(other => `«${other.ru}»`), 'ru')}` : ''}.`]);
      }
      const effects = item.effects.map(effect => `${en ? effect.name.en : `«${effect.name.ru}»`}: ${effect.text[lang].charAt(0).toLowerCase()}${effect.text[lang].slice(1)}`);
      if (item.stats.length || effects.length) rows.push([en ? `What does ${item.en} give?` : `Что даёт ${q}?`, [item.stats.length ? (en ? `${item.stats.map(stat => statLine(stat, 'en')).join(', ')}.` : `${item.stats.map(stat => statLine(stat, 'ru')).join(', ')}.`) : '', ...effects].filter(Boolean).join(' ')]);
      if (heroes.length) {
        const names = heroes.slice(0, 6).map(row => en ? heroBySlug[row.slug].en : heroBySlug[row.slug].ru);
        rows.push([en ? `Which heroes build ${item.en}?` : `Каким героям собирать ${q}?`, en ? `It is in the popular ranked builds of ${heroes.length} ${heroes.length === 1 ? 'hero' : 'heroes'}, among them ${join(names, 'en')}.` : `Предмет есть в популярных сборках ${heroes.length} ${heroes.length % 10 === 1 && heroes.length % 100 !== 11 ? 'героя' : 'героев'} в рейтинге, среди них ${join(names, 'ru')}.`]);
      }
      return rows;
    };
    const meta = lang => {
      const en = lang === 'en';
      const statsText = item.stats.slice(0, 3).map(stat => statLine(stat, lang)).join(', ');
      const effect = item.effects[0];
      const heroNames = heroes.slice(0, 3).map(row => en ? heroBySlug[row.slug].en : heroBySlug[row.slug].ru);
      const partsText = parts.length ? (en ? ` Builds from ${join(grouped(parts).map(({ item: part, count }) => `${part.en}${count > 1 ? ` ×${count}` : ''}`), 'en')}.` : ` Собирается из: ${join(grouped(parts).map(({ item: part, count }) => `${part.ru}${count > 1 ? ` ×${count}` : ''}`), 'ru')}.`) : '';
      const title = en
        ? `${item.en} MLBB: ${item.cost ? `${num(item.cost, 'en')} gold, ` : ''}recipe and effect | MLBB Boost`
        : `${item.ru} в MLBB: ${item.cost ? `цена ${item.cost}, ` : ''}сборка и эффект | MLBB Boost`;
      const description = en
        ? `${item.en} in Mobile Legends${statsText ? `: ${statsText}` : ''}.${effect ? ` ${EFFECT[effect.kind][1]} ${effect.name.en}.` : ''}${partsText}${heroNames.length ? ` Built by ${join(heroNames, 'en')}.` : ''}`
        : `${item.ru} (${item.en}) в Mobile Legends${statsText ? `: ${statsText}` : ''}.${effect ? ` ${effect.kind === 'active' ? 'Активный эффект' : 'Пассивка'} «${effect.name.ru}».` : ''}${partsText}${heroNames.length ? ` Собирают ${join(heroNames, 'ru')}.` : ''}`;
      return [title, description];
    };
    const lang = l => [...meta(l), body(l), faq(l), head(l)];
    return { file: `items/${item.slug}.html`, kind: 'item', layout: 'landing', published: PUBLISHED, updated: itemsData.updated, noLlms: true, ruOnly: true,
      crumb: ['/items/', 'Предметы', 'Items'], ru: lang('ru'), en: lang('en') };
  });

  // ---------- Blessing pages ----------
  const boots = tabItems('movement').filter(item => item.kind === 'final');
  const blessingPages = Object.entries(BLESSINGS).map(([key, blessing]) => {
    const body = lang => {
      const en = lang === 'en';
      const t = (ru, english) => en ? english : ru;
      const cards = blessing.variants.map(variant => `<article class="effect effect--blessing" id="${variant.id}"><img src="/images/mlbb/blessings/${variant.icon}.webp" width="64" height="64" alt="" loading="lazy" decoding="async"><div><h3>${esc(variant[lang][0])}</h3><p>${esc(variant[lang][1])}</p><p class="effect__use">${esc(variant[lang][2])}</p></div></article>`).join('');
      const rules = [blessing.common, blessing.hunter].filter(Boolean).map(rule => `<article class="effect"><h3>${esc(rule[lang][0])}</h3><p>${esc(rule[lang][1])}</p></article>`).join('');
      return `<div class="item-chapters">
        <section class="atlas-section" id="variants"><h2>${t('Варианты', 'Options')}</h2><div class="effects effects--blessings">${cards}</div></section>
        <section class="atlas-section" id="rules"><h2>${t('Как работает', 'How it works')}</h2><div class="effects">${rules}</div></section>
        <section class="atlas-section" id="boots"><h2>${t('Какие ботинки зачаровать', 'Boots you can enchant')}</h2><div class="shop-grid">${boots.map(item => ware(item, lang)).join('')}</div></section>
      </div>
      <aside class="hero-cta"><div><strong>${t('Поднимем ранг, пока вы заняты', 'We rank up while you are busy')}</strong><span>${t('Цена считается в калькуляторе', 'The calculator shows the price')}</span></div><a class="calc-btn" href="${BOT_PRICE}">${t('Рассчитать цену', 'Calculate price')}</a></aside>`;
    };
    const head = lang => {
      const copy = blessing[lang];
      const html = `<header class="relic relic--blessing">
        <img class="relic__icon" src="/images/mlbb/blessings/${blessing.icon}.webp" width="100" height="100" alt="" fetchpriority="high">
        <div class="relic__body"><h1>${esc(copy.h1)}</h1><p class="sheet__tags"><a class="sheet__tag" href="/items/#${key}">${tabName(key, lang)}</a><span class="sheet__tag">${copy.tag}</span></p></div>
      </header>`;
      return { h1: copy.h1, html };
    };
    const faq = lang => {
      const en = lang === 'en';
      const names = blessing.variants.map(variant => variant[lang][0]);
      return [[en ? `What ${key === 'jungle' ? 'Retribution options' : 'roam blessings'} are there in MLBB?` : `Какие ${key === 'jungle' ? 'есть виды Возмездия' : 'есть благословения роума'} в MLBB?`,
        `${en ? 'There are' : 'В игре'} ${blessing.variants.length}${en ? ':' : ':'} ${join(names, lang)}. ${blessing.variants.map(variant => `${variant[lang][0]} — ${variant[lang][2].charAt(0).toLowerCase()}${variant[lang][2].slice(1)}`).join(' ')}`]];
    };
    const lang = l => [blessing[l].title, blessing[l].description, body(l), faq(l), head(l)];
    return { file: `items/${blessing.slug}.html`, kind: 'item', layout: 'landing', published: PUBLISHED, updated: itemsData.updated, noLlms: true, ruOnly: true,
      crumb: ['/items/', 'Предметы', 'Items'], ru: lang('ru'), en: lang('en') };
  });
  return [hub, ...pages, ...blessingPages];
}

// Item slug and Russian name by game id: used by the hero pages and articles to name and link items.
export const itemIndex = itemsData => Object.fromEntries(itemsData.items.map(item => [item.id, { slug: item.slug, ru: item.ru, en: item.en }]));
