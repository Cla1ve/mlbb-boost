// The /skins/ section: the hub with every hero, one page per hero with all of its skins and one page per skin.
// Data: content/skins.json (scripts/skins-data.mjs: MLBBDex API and the Mobile Legends Wiki, CC BY-SA; art by MOONTON)
// and content/skins-ru.json (Russian skin names: there is no open source of the names used by the Russian client,
// so the Russian name is ours and the English one, as the game prints it, stays next to it).
// Imported by site-build.mjs, which renders these guides like the hero and item pages.

const BOT_PRICE = '/order.html?type=hero';
const PUBLISHED = '2026-11-26';
const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS_RU_NOM = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const MONTHS_RU_PREP = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Skin classes (the wiki's rarity), from the cheapest to the rarest. The Russian words are ours: the class names of the
// Russian client are not published anywhere, so the English name from the game is shown next to them.
export const SKIN_TIERS = {
  Common: { ru: 'Обычный', order: 1, color: '#8fa3b6' },
  Exceptional: { ru: 'Исключительный', order: 2, color: '#4fb97b' },
  Deluxe: { ru: 'Делюкс', order: 3, color: '#4f9ee8' },
  Exquisite: { ru: 'Изысканный', order: 4, color: '#a77bf3' },
  Grand: { ru: 'Грандиозный', order: 5, color: '#f0a24d' },
  Supreme: { ru: 'Высший', order: 6, color: '#ef6b6b' }
};
const ROLE = {
  Tank: ['Танк', 'Tank', 'tank'], Fighter: ['Боец', 'Fighter', 'fighter'], Assassin: ['Убийца', 'Assassin', 'assassin'],
  Mage: ['Маг', 'Mage', 'mage'], Marksman: ['Стрелок', 'Marksman', 'marksman'], Support: ['Поддержка', 'Support', 'support']
};
// What a skin changes (the wiki's "feature" list).
const FEATURES = {
  'Appearance': ['Новая внешность', 'New look'], 'New Effect': ['Новые эффекты навыков', 'New skill effects'], 'DNew Effect': ['Новые эффекты навыков', 'New skill effects'],
  'Effect Color Change': ['Другой цвет эффектов', 'Recoloured effects'], 'Skill Animation': ['Анимации навыков', 'Skill animations'], 'Skill Sound': ['Звуки навыков', 'Skill sounds'],
  'Voiceover': ['Своя озвучка', 'Voice-over'], 'Voice Over': ['Своя озвучка', 'Voice-over'], 'Skill Icon': ['Иконки навыков', 'Skill icons'],
  'Display Animation': ['Анимация показа', 'Showcase animation'], 'Display Scene': ['Сцена показа', 'Showcase scene'], 'Display Music': ['Музыка показа', 'Showcase music'],
  'Exclusive Spawn Animation': ['Анимация появления', 'Spawn animation'], 'Recall Effect': ['Эффект возвращения', 'Recall effect'], 'Trail Effect': ['След при движении', 'Trail effect'],
  'Special Random Actions': ['Особые действия', 'Special actions'], 'Special Interactive Actions': ['Особые взаимодействия', 'Special interactions'], 'Special Interactive Action': ['Особые взаимодействия', 'Special interactions'],
  'Action': ['Особые действия', 'Special actions'], 'Stunning Special Effects': ['Яркие спецэффекты', 'Stunning effects'], 'Stunning Special Effect': ['Яркие спецэффекты', 'Stunning effects'],
  'Dynamic Portrait': ['Живой портрет', 'Animated portrait'], 'Avatar Border': ['Рамка аватара', 'Avatar border'], 'Achievement': ['Достижение', 'Achievement'],
  'Attribute': ['Бонус к характеристикам', 'Attribute bonus']
};
// Series (the wiki's label): the Russian name and how such skins are obtained.
// kind: shop (sold in the skin shop), starlight, collector, legend, zodiac, lucky, season, collab, esports, event.
const COLLAB = (ru, en) => ({ ru, en: en || null, kind: 'collab' });
const SERIES = {
  'StarLight': { ru: 'Звёздный участник', kind: 'starlight' }, 'Annual StarLight': { ru: 'Ежегодный звёздный участник', kind: 'event' }, 'Annual Starlight': { ru: 'Ежегодный звёздный участник', kind: 'event' },
  'Elite': { ru: 'Элитный', kind: 'shop' }, 'Special': { ru: 'Особый', kind: 'shop' }, 'Epic': { ru: 'Эпический', kind: 'shop' },
  'Legend': { ru: 'Легендарный', kind: 'legend' }, 'Collector': { ru: 'Коллекционный', kind: 'collector' }, 'Collector 10th': { ru: 'Коллекционный, 10 лет MLBB', kind: 'collector' },
  'Collector Titans': { ru: 'Коллекционный: Титаны', kind: 'collector' }, 'Luckybox': { ru: 'Ящик удачи', kind: 'lucky' }, 'Zodiac': { ru: 'Зодиак', kind: 'zodiac' },
  'Valentine': { ru: 'День святого Валентина', kind: 'shop' }, 'Valentine 2026': { ru: 'День святого Валентина 2026', kind: 'shop' }, 'Summer': { ru: 'Летний', kind: 'shop' },
  'Christmas': { ru: 'Рождественский', kind: 'shop' }, 'Halloween': { ru: 'Хэллоуин', kind: 'shop' }, 'Lunar Festival': { ru: 'Лунный фестиваль', kind: 'shop' },
  'Double 11': { ru: 'Распродажа 11.11', kind: 'shop' }, '515': { ru: 'Фестиваль 5.15', kind: 'event' }, 'Golden Month': { ru: 'Золотой месяц', kind: 'event' }, 'Golden Month 2026': { ru: 'Золотой месяц 2026', kind: 'event' },
  'Epic 10th': { ru: 'Эпический, 10 лет MLBB', kind: 'event' }, 'Special 10th': { ru: 'Особый, 10 лет MLBB', kind: 'event' },
  '5th Anniversary': { ru: '5 лет MLBB', kind: 'event' }, '7th Anniversary': { ru: '7 лет MLBB', kind: 'event' }, '8th Anniversary': { ru: '8 лет MLBB', kind: 'event' }, '9th Anniversary': { ru: '9 лет MLBB', kind: 'event' },
  'The Aspirants': { ru: 'Претенденты', kind: 'event' }, 'Lightborn': { ru: 'Рождённые светом', kind: 'event' }, 'Dragon Tamer': { ru: 'Укротители драконов', kind: 'event' },
  'Blazing Bounties': { ru: 'Пылающие награды', kind: 'event' }, 'Dawning Stars': { ru: 'Восходящие звёзды', kind: 'event' }, 'Covenant': { ru: 'Завет', kind: 'event' },
  'The Exorcists': { ru: 'Экзорцисты', kind: 'event' }, 'Clouds': { ru: 'За облаками', kind: 'event' }, 'Metro Zero': { ru: 'Метро Зеро', kind: 'event' },
  'Kishin Densetsu': { ru: 'Кисин дэнсэцу', kind: 'event' }, 'Mystic Meow': { ru: 'Мистические коты', kind: 'event' }, 'Mistbenders': { ru: 'Заклинатели тумана', kind: 'event' },
  'SEASONS': { ru: 'Времена года', kind: 'event' }, 'Soul Vessels': { ru: 'Сосуды души', kind: 'event' }, 'Dino Pals': { ru: 'Динодрузья', kind: 'event' },
  'Nexus Sea': { ru: 'Морской нексус', kind: 'event' }, 'Legend Nexus Sea': { ru: 'Морской нексус', kind: 'event' }, 'Create': { ru: 'Конкурс обликов', kind: 'event' },
  'Limited': { ru: 'Ограниченный', kind: 'event' }, 'Atomic': { ru: 'Atomic Pop', kind: 'shop' }, 'MCGG': { ru: 'Magic Chess: Go Go', kind: 'event' },
  'S.A.B.E.R.': { ru: 'S.A.B.E.R.', kind: 'event' }, 'V.E.N.O.M.': { ru: 'V.E.N.O.M.', kind: 'event' }, 'S.T.U.N.': { ru: 'S.T.U.N.', kind: 'event' },
  'ABYSS': { ru: 'ABYSS', kind: 'event' }, 'PRIME': { ru: 'PRIME', kind: 'event' }, 'P.ACE': { ru: 'P.ACE', kind: 'event' }, 'Sparkle': { ru: 'SPARKLE', kind: 'event' },
  'M-World': { ru: 'M-World', kind: 'event' }, 'Neobeast': { ru: 'Neobeast', kind: 'event' }, 'Neobeast 2': { ru: 'Neobeast', kind: 'event' }, 'Zenith': { ru: 'Zenith', kind: 'event' },
  'Rising': { ru: 'Rising', kind: 'event' }, 'Mythic 2023': { ru: 'Мифический сезон 2023', kind: 'event' }, 'Mythic 2024': { ru: 'Мифический сезон 2024', kind: 'event' }, 'Mythic 2025': { ru: 'Мифический сезон 2025', kind: 'event' },
  'MPL': { ru: 'MPL', kind: 'esports' }, 'Champion': { ru: 'Чемпионский', kind: 'esports' }, 'Finals MVP': { ru: 'MVP финала', kind: 'esports' },
  'AS': { ru: 'Матч всех звёзд', kind: 'esports' }, 'AS 2024': { ru: 'Матч всех звёзд 2024', kind: 'esports' }, 'AS 2025': { ru: 'Матч всех звёзд 2025', kind: 'esports' },
  'ALLSTAR': { ru: 'Матч всех звёзд', kind: 'esports' }, 'ALLSTAR 2024': { ru: 'Матч всех звёзд 2024', kind: 'esports' },
  'KOF': COLLAB('The King of Fighters'), 'Saint Seiya': COLLAB('Рыцари Зодиака', 'Saint Seiya'), 'Transformers': COLLAB('Трансформеры', 'Transformers'),
  'Naruto': COLLAB('Наруто', 'Naruto'), 'Star Wars': COLLAB('Звёздные войны', 'Star Wars'), 'Sanrio': COLLAB('Sanrio'), 'HUNTER×HUNTER': COLLAB('Охотник × Охотник', 'HUNTER×HUNTER'),
  'Jujutsu Kaisen': COLLAB('Магическая битва', 'Jujutsu Kaisen'), 'Kung Fu Panda': COLLAB('Кунг-фу Панда', 'Kung Fu Panda'), 'Attack on Titan': COLLAB('Атака титанов', 'Attack on Titan'),
  'Ducati': COLLAB('Ducati'), 'Neymar Jr': COLLAB('Неймар-младший', 'Neymar Jr'), 'SpongeBob': COLLAB('Губка Боб', 'SpongeBob'), 'Pacquiao Licensed': COLLAB('Мэнни Пакьяо', 'Manny Pacquiao'),
  'Street Fighter': COLLAB('Street Fighter'), 'Street Fighter 6': COLLAB('Street Fighter 6'), 'Avatar': COLLAB('Аватар: Легенда об Аанге', 'Avatar: The Last Airbender')
};
// Season rewards (S1 ... S42) and tournament skins (M1 ... M7, MSC 2018 ...) follow a pattern.
function seriesOf(label) {
  if (!label) return null;
  if (SERIES[label]) return { key: label, ...SERIES[label] };
  let m = label.match(/^S(\d+)$/);
  if (m) return { key: label, ru: `Сезон ${m[1]}`, en: `Season ${m[1]}`, kind: 'season', season: Number(m[1]) };
  m = label.match(/^M(\d+)$/);
  if (m) return { key: label, ru: `Чемпионат мира M${m[1]}`, en: `M${m[1]} World Championship`, kind: 'esports' };
  m = label.match(/^MSC (\d{4})$/);
  if (m) return { key: label, ru: `MSC ${m[1]}`, kind: 'esports' };
  return { key: label, ru: label, kind: 'event' };
}

export function skinGuides(data, ruNames, heroesData, cases = {}) {
  const esc = text => String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const heroList = heroesData.heroes;
  const heroBySlug = Object.fromEntries(heroList.map(hero => [hero.slug, hero]));
  const gen = hero => cases[hero.slug]?.[1] || hero.ru;
  const names = ruNames.names || {};
  const plural = (n, forms) => { const a = n % 100, b = n % 10; return forms[a > 10 && a < 15 ? 2 : b === 1 ? 0 : b > 1 && b < 5 ? 1 : 2]; };
  const num = (value, lang) => new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'ru-RU').format(Number(value)).replace(/[  ]/g, lang === 'en' ? ',' : ' ');
  const skinWord = (n, lang) => lang === 'en' ? (n === 1 ? 'skin' : 'skins') : plural(n, ['скин', 'скина', 'скинов']);

  // ---------- Records ----------
  const all = [];
  const byHero = {};
  for (const [slug, list] of Object.entries(data.heroes)) {
    const hero = heroBySlug[slug];
    if (!hero) continue;
    // The source sometimes lists one skin twice under two ids (Luo Yi, Starborne Matron: 968 and 969): one page per name.
    const seen = new Set();
    const skins = list.filter(skin => !skin.base && skin.card && !seen.has(skin.en) && seen.add(skin.en)).map(skin => {
      const ru = names[skin.en] || skin.en;
      const record = { ...skin, hero, ru, series: seriesOf(skin.series), tierInfo: SKIN_TIERS[skin.tier] || null, url: `/skins/${slug}/${skin.slug}.html`,
        cardSrc: `/images/skins/cards/${slug}/${skin.slug}.webp`, artSrc: skin.art ? `/images/skins/art/${slug}/${skin.slug}.webp` : '' };
      record.sortKey = (skin.release || '0000').padEnd(10, '-') + String(skin.id).padStart(8, '0');
      return record;
    }).sort((a, b) => b.sortKey.localeCompare(a.sortKey));
    if (!skins.length) continue;
    byHero[slug] = skins;
    all.push(...skins);
  }
  const heroSlugs = Object.keys(byHero);
  const total = all.length;
  const newest = [...all].sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  const skinName = (skin, lang) => lang === 'en' ? skin.en : skin.ru;
  // Soft hyphens in long words: Chrome on Windows does not hyphenate Russian by itself, and narrow cards would break
  // "Призматический" mid-letter. The same rule as on the item cards.
  const soft = text => String(text).replace(/[А-Яа-яЁёA-Za-z]{11,}/g, word => {
    const V = /[аеёиоуыэюяaeiouy]/i, C = /[бвгджзклмнпрстфхцчшщbcdfghjklmnpqrstvwxz]/i;
    const middle = Math.floor(word.length / 2);
    for (let offset = 0; offset < middle - 2; offset++) for (const at of [middle + offset, middle - offset]) {
      if (at < 3 || at > word.length - 3) continue;
      if (C.test(word[at]) && V.test(word[at + 1]) && (V.test(word[at - 1]) || (C.test(word[at - 1]) && V.test(word[at - 2])))) return word.slice(0, at) + '\u00ad' + word.slice(at);
    }
    return word;
  });
  const heroName = (hero, lang) => lang === 'en' ? hero.en : hero.ru;

  // Dates: 2026-10-16, 2026-11 or 2016.
  const releaseText = (skin, lang, short = false) => {
    const [y, m, d] = String(skin.release || '').split('-').map(Number);
    if (!y) return '';
    if (short) return String(y);
    if (lang === 'en') return d ? `${d} ${MONTHS_EN[m - 1]} ${y}` : m ? `${MONTHS_EN[m - 1]} ${y}` : String(y);
    return d ? `${d} ${MONTHS_RU[m - 1]} ${y}` : m ? `${MONTHS_RU_NOM[m - 1]} ${y}` : `${y} год`;
  };
  const tierName = (skin, lang) => skin.tierInfo ? (lang === 'en' ? skin.tier : skin.tierInfo.ru) : '';
  const seriesName = (skin, lang) => skin.series ? (lang === 'en' ? (skin.series.en || skin.series.key) : skin.series.ru) : '';

  // Prices as the wiki lists them: diamonds, battle points, tickets, magic crystals and other currencies.
  const priceParts = (price, lang) => {
    const en = lang === 'en';
    const parts = [];
    if (price.dm) parts.push(en ? `${num(price.dm, 'en')} diamonds` : `${num(price.dm, 'ru')} ${plural(Number(price.dm), ['алмаз', 'алмаза', 'алмазов'])}`);
    if (price.bp) parts.push(en ? `${num(price.bp, 'en')} Battle Points` : `${num(price.bp, 'ru')} БО`);
    if (price.ticket) parts.push(en ? `${num(price.ticket, 'en')} tickets` : `${num(price.ticket, 'ru')} ${plural(Number(price.ticket), ['билет', 'билета', 'билетов'])}`);
    if (price.mc) parts.push(en ? `${num(price.mc, 'en')} Magic Crystals` : `${num(price.mc, 'ru')} ${plural(Number(price.mc), ['магический кристалл', 'магических кристалла', 'магических кристаллов'])}`);
    if (price.lg) parts.push(en ? `${num(price.lg, 'en')} Lucky Gems` : `${num(price.lg, 'ru')} ${plural(Number(price.lg), ['камень удачи', 'камня удачи', 'камней удачи'])}`);
    if (price.mythcoin) parts.push(en ? `${num(price.mythcoin, 'en')} Myth Coins` : `${num(price.mythcoin, 'ru')} ${plural(Number(price.mythcoin), ['мифическая монета', 'мифические монеты', 'мифических монет'])}`);
    return parts;
  };
  const joinOr = (list, lang) => list.length > 1 ? `${list.slice(0, -1).join(', ')} ${lang === 'en' ? 'or' : 'или'} ${list.at(-1)}` : list[0] || '';
  const monthYear = (text, lang, prep = false) => {
    const [y, m] = String(text).split(/[\/-]/).map(Number);
    if (!y || !m) return '';
    return lang === 'en' ? `${MONTHS_EN[m - 1]} ${y}` : `${prep ? MONTHS_RU_PREP[m - 1] : MONTHS_RU_NOM[m - 1]} ${y}`;
  };
  // The wiki's free-text "other" field, in a sentence.
  const otherText = (other, lang, skin) => {
    const en = lang === 'en';
    let m = other.match(/^(\d{4})\/(\d{2}) StarLight (Member|Reward)$/);
    if (m) return en ? `StarLight reward for ${monthYear(`${m[1]}-${m[2]}`, 'en')}.` : `Награда «Звёздного участника» в ${monthYear(`${m[1]}-${m[2]}`, 'ru', true)}.`;
    m = other.match(/^Season (\d+)$/);
    if (m) return en ? `Ranked Season ${m[1]} reward.` : `Награда за рейтинговый сезон ${m[1]}.`;
    m = other.match(/^S(\d+) First Recharge$/);
    if (m) return en ? `First top-up gift in Season ${m[1]}.` : `Подарок за первое пополнение в сезоне ${m[1]}.`;
    m = other.match(/^M(\d+) Pass$/);
    if (m) return en ? `M${m[1]} Pass reward.` : `Награда пропуска M${m[1]}.`;
    m = other.match(/^(\d{4}) StarLight Fest$/);
    if (m) return en ? `StarLight Fest ${m[1]} event.` : `Событие StarLight Fest ${m[1]}.`;
    m = other.match(/MLBB\s*[×X&]\s*([^\]|]+?)(?:\||\]\]|\s+(?:collab\s+)?event|\s+Collab Events|$)/i);
    if (m && /obtain|collab/i.test(other)) return en ? `Released in the MLBB × ${m[1].trim()} event.` : `Выходил в событии коллаборации MLBB × ${m[1].trim()}.`;
    const fixed = {
      'Zodiac Summon': ['Выпадает в розыгрыше «Зодиак» (Zodiac Summon).', 'Drawn in the Zodiac Summon.'],
      'Twilight Pass': ['Награда сумеречного пропуска (Twilight Pass).', 'Twilight Pass reward.'],
      'Limited-time Event': ['Выходил в ограниченном событии.', 'Released in a limited-time event.'],
      'MLBB Rising Open': ['Награда турнира MLBB Rising Open.', 'MLBB Rising Open reward.'],
      'Global LAN Event': ['Награда глобального LAN-турнира.', 'Global LAN event reward.'],
      'Mentoring Program': ['Награда программы наставников.', 'Mentoring program reward.'],
      'Credit Score Maintaining Task': ['Награда за задания по сохранению рейтинга доверия.', 'Credit score task reward.'],
      'Avaliable via the Bang Bang Card': ['Выдаётся по карте Bang Bang.', 'Available with the Bang Bang Card.'],
      'Celestial Chest Reward': ['Награда из небесного сундука.', 'Celestial Chest reward.'],
      'MCL Tournament Award': ['Награда турнира MCL.', 'MCL tournament award.']
    };
    if (fixed[other]) return fixed[other][en ? 1 : 0];
    return '';
  };
  // How to get a skin: the price first, then the wiki note, then what the series says.
  const howTo = (skin, lang) => {
    const en = lang === 'en';
    const parts = priceParts(skin.price, lang);
    const kind = skin.series?.kind || '';
    const sentences = [];
    const available = skin.availability === 'Available';
    if (kind === 'legend' && skin.price.mc) sentences.push(en ? `Exchanged for ${num(skin.price.mc, 'en')} Magic Crystals from the Magic Wheel.` : `Обменивается на ${num(skin.price.mc, 'ru')} ${plural(Number(skin.price.mc), ['магический кристалл', 'магических кристалла', 'магических кристаллов'])} из Магического колеса.`);
    else if (parts.length && available) sentences.push(en ? `Sold in the skin shop for ${joinOr(parts, 'en')}.` : `Продаётся в магазине обликов за ${joinOr(parts, 'ru')}.`);
    else if (parts.length) sentences.push(en ? `Price at release: ${joinOr(parts, 'en')}. Not sold in the shop now: it comes back only in events.` : `Цена на старте: ${joinOr(parts, 'ru')}. Сейчас в магазине не продаётся, возвращается только в событиях.`);
    const other = skin.price.other ? otherText(skin.price.other, lang, skin) : '';
    if (other) sentences.push(other);
    if (!parts.length && !other) {
      const month = skin.release && /^\d{4}-\d{2}/.test(skin.release) ? monthYear(skin.release, lang, true) : '';
      const s = skin.series;
      const text = {
        starlight: en ? `StarLight skin${month ? ` of ${monthYear(skin.release, 'en')}` : ''}: it was given for buying the StarLight pass that month.` : `Облик «Звёздного участника»${month ? ` в ${month}` : ''}: его выдавали за покупку звёздного пропуска в этом месяце.`,
        collector: en ? 'The top prize of a Collector event draw, paid with diamonds.' : 'Главный приз розыгрыша в коллекционном событии, попытки покупаются за алмазы.',
        zodiac: en ? 'Drawn in the Zodiac Summon.' : 'Выпадает в розыгрыше «Зодиак».',
        lucky: en ? 'Came out of Lucky Boxes in events.' : 'Выпадал из ящиков удачи в событиях.',
        legend: en ? 'Exchanged for Magic Crystals from the Magic Wheel.' : 'Обменивается на магические кристаллы из Магического колеса.',
        season: en ? `Ranked Season ${s?.season} reward, given for reaching the required rank.` : `Награда за рейтинговый сезон ${s?.season}: её выдают за нужный ранг по итогам сезона.`,
        collab: en ? `Released in the MLBB × ${s?.en || s?.key} collaboration event.` : `Выходил в событии коллаборации MLBB × ${s?.ru}.`,
        esports: en ? `Esports skin of ${s?.en || s?.key}: it was released in the tournament event.` : `Киберспортивный облик (${s?.ru}): выходил в событии турнира.`,
        shop: en ? 'Released in the skin shop during an event.' : 'Выходил в магазине обликов во время события.',
        event: en ? `Released in the ${s?.en || s?.key} event.` : `Выходил в событии «${s?.ru}».`
      }[kind];
      if (text) sentences.push(text);
      else sentences.push(en ? (available ? 'Sold in the skin shop.' : 'Released in a limited-time event.') : (available ? 'Продаётся в магазине обликов.' : 'Выходил в ограниченном событии.'));
      if (!available && kind !== 'season') sentences.push(en ? 'Limited skins come back in event draws from time to time.' : 'Ограниченные облики иногда возвращаются в розыгрышах событий.');
    }
    return sentences.join(' ');
  };
  const priceShort = (skin, lang) => {
    const parts = priceParts(skin.price, lang);
    if (skin.price.mc) return parts.find(part => /кристалл|Crystal/.test(part)) || parts[0];
    return parts[0] || '';
  };

  // ---------- Pieces ----------
  const tierStyle = skin => skin.tierInfo ? ` style="--tier:${skin.tierInfo.color}"` : '';
  const card = (skin, lang, { current = false, hero = false, eager = false } = {}) => {
    const meta = [hero ? heroName(skin.hero, lang) : tierName(skin, lang), releaseText(skin, lang, true)].filter(Boolean).join(' · ');
    return `<a class="scard${current ? ' is-current' : ''}" href="${skin.url}"${current ? ' aria-current="page"' : ''}${tierStyle(skin)}><span class="scard__img"><img src="${skin.cardSrc}" width="240" height="390" alt="" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></span><span class="scard__name">${esc(soft(skinName(skin, lang)))}</span><span class="scard__meta">${esc(meta)}</span></a>`;
  };
  const heroCard = (slug, lang) => {
    const hero = heroBySlug[slug];
    const skins = byHero[slug];
    const top = skins[0];
    const roles = hero.roles.join(' ');
    const names = [hero.ru, hero.en, ...skins.flatMap(skin => [skin.ru, skin.en, skin.series?.ru || '', skin.series?.en || skin.series?.key || ''])].join(' ').toLowerCase();
    return `<a class="hcard" href="/skins/${slug}.html" data-roles="${roles}" data-hero="${esc((hero.ru + ' ' + hero.en).toLowerCase())}" data-names="${esc(names)}"><span class="hcard__img"><img src="/images/heroes/art/${slug}.webp" width="240" height="390" alt="" loading="lazy" decoding="async"></span><span class="hcard__bar"><b>${esc(heroName(hero, lang))}</b><small>${skins.length} ${skinWord(skins.length, lang)}</small></span></a>`;
  };
  const cta = (lang, hero) => {
    const t = (ru, en) => lang === 'en' ? en : ru;
    return `<aside class="hero-cta"><div><strong>${hero ? t(`Сколько стоит буст на герое ${hero.ru}?`, `How much is a rank boost on ${hero.en}?`) : t('Поднимем ранг, пока вы заняты', 'We rank up while you are busy')}</strong><span>${t('Выберите текущий и желаемый ранг. Стоимость появится на сайте.', 'Choose your current and target ranks to see the price here.')}</span></div><a class="calc-btn" href="${BOT_PRICE}">${t('Рассчитать цену', 'Calculate price')}</a></aside>`;
  };
  const crumbs = (lang, steps) => `<nav class="skin-crumbs" aria-label="${lang === 'en' ? 'Breadcrumbs' : 'Хлебные крошки'}">${steps.map(([href, text]) => href ? `<a href="${href}">${esc(text)}</a>` : `<span aria-current="page">${esc(text)}</span>`).join('<span aria-hidden="true">/</span>')}</nav>`;
  const script = '<script src="/js/skins.js?v=2" defer></script>';

  // ---------- Hub ----------
  const heroOrder = lang => [...heroSlugs].sort((a, b) => heroName(heroBySlug[a], lang).localeCompare(heroName(heroBySlug[b], lang), lang === 'en' ? 'en' : 'ru'));
  const hubBody = lang => {
    const en = lang === 'en';
    const t = (ru, english) => en ? english : ru;
    const roleButtons = [['', t('Все', 'All'), null], ...Object.entries(ROLE).map(([key, [ru, english, icon]]) => [key, en ? english : ru, icon])]
      .map(([key, text, icon]) => `<button type="button" data-skin-role="${key}" aria-pressed="${key === ''}">${icon ? `<img src="/images/mlbb/filters/${icon}.webp" width="20" height="20" alt="">` : ''}<span>${text}</span></button>`).join('');
    return `<div class="skins-hub" data-skins-hub data-lang="${lang}">
      <div class="atlas-tools skins-tools" hidden>
        <label class="atlas-search"><span class="arena-sr">${t('Найти героя или скин', 'Find a hero or a skin')}</span><i class="fas fa-search" aria-hidden="true"></i><input type="search" id="skin-query" autocomplete="off" enterkeyhint="search" placeholder="${t('Герой или скин', 'Hero or skin')}"></label>
        <fieldset class="atlas-choice skins-roles"><legend class="arena-sr">${t('Роль', 'Role')}</legend><div>${roleButtons}</div></fieldset>
      </div>
      <p class="arena-sr" role="status" id="skin-status"></p>
      <section class="skins-block" id="new" data-skins-new><h2>${t('Новые скины', 'New skins')}</h2><div class="rail">${newest.slice(0, 12).map((skin, i) => card(skin, lang, { hero: true, eager: i < 4 })).join('')}</div></section>
      <section class="skins-block" id="heroes"><h2 data-heroes-title>${t('Герои', 'Heroes')}</h2><div class="hero-gallery">${heroOrder(lang).map(slug => heroCard(slug, lang)).join('')}</div></section>
      <section class="skins-block" id="found" data-skins-found hidden><h2>${t('Скины', 'Skins')}</h2><div class="skin-grid" data-skins-results></div><button type="button" class="skins-more" data-skins-more hidden>${t('Показать ещё', 'Show more')}</button></section>
      <div class="skins-empty" id="skin-empty" hidden><p>${t('Ничего не нашлось. Проверьте название или сбросьте фильтр.', 'Nothing found. Check the spelling or clear the filter.')}</p><button type="button" data-skin-reset>${t('Сбросить', 'Clear')}</button></div>
    </div>
    ${script}`;
  };
  const hubHead = lang => {
    const en = lang === 'en';
    const h1 = en ? 'MLBB skins' : 'Скины MLBB';
    return { h1, html: `<header class="arena-mast"><div><h1>${h1}</h1><p>${en ? `${num(total, 'en')} skins of ${heroSlugs.length} heroes · prices and how to get them` : `${num(total, 'ru')} ${plural(total, ['облик', 'облика', 'обликов'])} у ${heroSlugs.length} героев · цены и как получить`}</p></div></header>` };
  };
  const hubFaq = lang => {
    const en = lang === 'en';
    const top = Object.entries(byHero).sort((a, b) => b[1].length - a[1].length).slice(0, 3);
    const latest = newest.slice(0, 3);
    return [
      [en ? 'How many skins are there in MLBB?' : 'Сколько скинов в MLBB?', en ? `${num(total, 'en')} skins of ${heroSlugs.length} heroes, not counting default looks and recolours. The most have ${top.map(([slug, list]) => `${heroBySlug[slug].en} (${list.length})`).join(', ')}.` : `${num(total, 'ru')} ${plural(total, ['облик', 'облика', 'обликов'])} у ${heroSlugs.length} героев без стандартных обликов и перекрасок. Больше всего у ${top.map(([slug, list]) => `${gen(heroBySlug[slug])} (${list.length})`).join(', ')}.`],
      [en ? 'What are the newest skins?' : 'Какие скины вышли последними?', en ? `${latest.map(skin => `${skin.en} for ${skin.hero.en}`).join(', ')}.` : `${latest.map(skin => `«${skin.ru}» на ${cases[skin.hero.slug]?.[0] || skin.hero.ru}`).join(', ')}.`],
      [en ? 'How are skin classes ordered?' : 'Чем отличаются классы скинов?', en ? 'From the simplest to the rarest: Common, Exceptional, Deluxe, Exquisite, Grand and Supreme. Higher classes change more: model, skill effects, sounds, voice-over and showcase animation.' : 'От простого к редкому: обычный (Common), исключительный (Exceptional), делюкс (Deluxe), изысканный (Exquisite), грандиозный (Grand) и высший (Supreme). Чем выше класс, тем больше меняется: модель, эффекты и звуки навыков, озвучка, анимация показа.']
    ];
  };
  const hub = { file: 'skins/index.html', kind: 'skin', layout: 'landing', published: PUBLISHED, updated: data.updated, ruOnly: true, crumb: ['/skins/', 'Скины', 'Skins'],
    ogImage: newest[0].artSrc || newest[0].cardSrc,
    itemList: lang => heroOrder(lang).map(slug => ({ name: lang === 'en' ? `${heroBySlug[slug].en} skins` : `Скины ${gen(heroBySlug[slug])}`, url: `/skins/${slug}.html` })),
    ru: [`Скины MLBB: все ${num(total, 'ru')} обликов героев, цены и как получить | MLBB Boost`, `Все скины Mobile Legends по героям: ${num(total, 'ru')} обликов с артами, классом, ценой в алмазах, датой выхода и способом получения. Поиск по названию на русском и английском, фильтр по ролям.`, hubBody('ru'), hubFaq('ru'), hubHead('ru')],
    en: [`MLBB skins: all ${num(total, 'en')} hero skins, prices and how to get them | MLBB Boost`, `Every Mobile Legends skin by hero: ${num(total, 'en')} skins with art, class, diamond price, release date and how to get each one. Search by name and filter by role.`, hubBody('en'), hubFaq('en'), hubHead('en')] };

  // ---------- Hero pages ----------
  const heroPages = heroSlugs.map(slug => {
    const hero = heroBySlug[slug];
    const skins = byHero[slug];
    const baseSkin = (data.heroes[slug] || []).find(skin => skin.base && skin.art);
    const lead = baseSkin ? { artSrc: `/images/skins/art/${slug}/${baseSkin.slug}.webp`, cardSrc: '', en: baseSkin.en, ru: '', base: true } : (skins.find(skin => skin.artSrc) || skins[0]);
    const forSale = skins.filter(skin => skin.availability === 'Available' && (skin.price.dm || skin.price.mc));
    const head = lang => {
      const en = lang === 'en';
      const t = (ru, english) => en ? english : ru;
      const h1 = en ? `${hero.en} skins` : `Скины ${gen(hero)}`;
      const art = lead.artSrc
        ? `<img src="${lead.artSrc}" width="1280" height="720" alt="${esc(lead.base ? (en ? `${hero.en}, default look` : `${hero.ru} в стандартном облике`) : (en ? `${hero.en} — ${lead.en} skin art` : `${hero.ru} в облике «${lead.ru}»`))}" fetchpriority="high">`
        : `<img src="${lead.cardSrc}" width="240" height="390" alt="" fetchpriority="high">`;
      const html = `${crumbs(lang, [[`/skins/`, t('Скины', 'Skins')], [null, heroName(hero, lang)]])}
        <header class="skin-mast${lead.artSrc ? '' : ' skin-mast--card'}">
          <div class="skin-mast__art">${art}</div>
          <div class="skin-mast__copy">
            <h1>${esc(h1)}</h1>
            <dl class="mast-stats">
              <div><dt>${t('Скинов', 'Skins')}</dt><dd>${skins.length}</dd></div>
              <div><dt>${t('Можно купить', 'In the shop')}</dt><dd>${forSale.length || t('нет', 'none')}</dd></div>
              <div class="mast-stats__latest"><dt>${t('Последний', 'Latest')}</dt><dd><a href="${skins[0].url}">${esc(soft(skinName(skins[0], lang)))}</a>${skins[0].release ? `<small>${releaseText(skins[0], lang, true)}</small>` : ''}</dd></div>
            </dl>
            <a class="mast-btn" href="/heroes/${slug}.html"><img src="/images/heroes/${slug}.webp" width="40" height="40" alt="">${t('Профиль героя', 'Hero profile')}<span aria-hidden="true">→</span></a>
          </div>
        </header>`;
      return { h1, html };
    };
    const body = lang => {
      const en = lang === 'en';
      const t = (ru, english) => en ? english : ru;
      // Tier chips only when the hero has skins of several classes; they filter the grid in place.
      const tiers = Object.keys(SKIN_TIERS).filter(key => skins.some(skin => skin.tier === key)).sort((a, b) => SKIN_TIERS[b].order - SKIN_TIERS[a].order);
      const filter = tiers.length > 1 && skins.length > 6 ? `<div class="atlas-choice skin-tierbar" hidden><div role="group" aria-label="${t('Класс скина', 'Skin class')}"><button type="button" data-skin-tier="" aria-pressed="true">${t('Все', 'All')}</button>${tiers.map(key => `<button type="button" data-skin-tier="${key}" aria-pressed="false" style="--tier:${SKIN_TIERS[key].color}"><i class="tier-dot" aria-hidden="true"></i>${en ? key : SKIN_TIERS[key].ru}</button>`).join('')}</div></div>` : '';
      return `<section class="skins-block" id="all"><h2 class="arena-sr">${t('Все скины', 'All skins')}</h2>${filter}<div class="skin-grid">${skins.map((skin, i) => card(skin, lang, { eager: i < 2 }).replace('<a class="scard', `<a data-tier="${skin.tier}" class="scard`)).join('')}</div></section>
        ${cta(lang, hero)}
        ${script}`;
    };
    const faq = lang => {
      const en = lang === 'en';
      const shop = skins.filter(skin => skin.availability === 'Available' && skin.price.dm);
      const top = [...skins].filter(skin => skin.tierInfo).sort((a, b) => b.tierInfo.order - a.tierInfo.order)[0];
      const rows = [[en ? `How many skins does ${hero.en} have?` : `Сколько скинов у ${gen(hero)}?`, en ? `${skins.length} ${skinWord(skins.length, 'en')}, the default look not counted. The newest is ${skins[0].en}${skins[0].release ? ` (${releaseText(skins[0], 'en')})` : ''}.` : `${skins.length} ${skinWord(skins.length, 'ru')} без стандартного облика. Последний — «${skins[0].ru}» (${skins[0].en})${skins[0].release ? `, ${releaseText(skins[0], 'ru')}` : ''}.`]];
      if (shop.length) rows.push([en ? `Which ${hero.en} skins can you buy now?` : `Какие скины ${gen(hero)} можно купить сейчас?`, en ? `${shop.map(skin => `${skin.en} (${num(skin.price.dm, 'en')} diamonds)`).join(', ')}. The other skins were limited and come back only in events.` : `${shop.map(skin => `«${skin.ru}» (${num(skin.price.dm, 'ru')} ${plural(Number(skin.price.dm), ['алмаз', 'алмаза', 'алмазов'])})`).join(', ')}. Остальные облики ограниченные и возвращаются только в событиях.`]);
      if (top) rows.push([en ? `What is the rarest ${hero.en} skin?` : `Какой самый редкий скин ${gen(hero)}?`, en ? `${top.en}, ${top.tier} class${top.series ? `, ${seriesName(top, 'en')} series` : ''}. ${howTo(top, 'en')}` : `«${top.ru}» (${top.en}), класс ${top.tierInfo.ru.toLowerCase()}${top.series ? `, серия «${seriesName(top, 'ru')}»` : ''}. ${howTo(top, 'ru')}`]);
      return rows;
    };
    const meta = lang => {
      const en = lang === 'en';
      const listed = skins.slice(0, 3).map(skin => en ? skin.en : `${skin.ru} (${skin.en})`).join(', ');
      return en
        ? [`${hero.en} skins MLBB: all ${skins.length} ${skinWord(skins.length, 'en')}, prices and how to get | MLBB Boost`, `Every ${hero.en} skin in Mobile Legends: ${listed}${skins.length > 3 ? ' and more' : ''}. Class, diamond price, release date and how to get each skin.`]
        : [`Скины ${gen(hero)} MLBB: все ${skins.length} ${skinWord(skins.length, 'ru')}, цены и как получить | MLBB Boost`, `Все скины ${gen(hero)} (${hero.en}) в Mobile Legends: ${listed}${skins.length > 3 ? ' и другие' : ''}. Класс, цена в алмазах, дата выхода и как получить каждый облик.`];
    };
    const lang = l => [...meta(l), body(l), faq(l), head(l)];
    return { file: `skins/${slug}.html`, kind: 'skin', layout: 'landing', published: PUBLISHED, updated: data.updated, noLlms: true, ruOnly: true,
      crumb: ['/skins/', 'Скины', 'Skins'], ogImage: lead.artSrc || lead.cardSrc,
      itemList: l => skins.map(skin => ({ name: l === 'en' ? skin.en : skin.ru, url: skin.url })),
      ru: lang('ru'), en: lang('en') };
  });

  // ---------- Skin pages ----------
  const bySeries = {};
  for (const skin of all) if (skin.series) (bySeries[skin.series.key] ||= []).push(skin);
  const skinPages = all.map(skin => {
    const hero = skin.hero;
    const siblings = byHero[hero.slug];
    const sameSeries = skin.series ? (bySeries[skin.series.key] || []).filter(other => other !== skin).sort((a, b) => b.sortKey.localeCompare(a.sortKey)).slice(0, 8) : [];
    const head = lang => {
      const en = lang === 'en';
      const t = (ru, english) => en ? english : ru;
      const h1 = skinName(skin, lang);
      const alt = en ? `${hero.en} in the ${skin.en} skin` : `${hero.ru} в облике «${skin.ru}»`;
      const art = skin.artSrc
        ? `<button type="button" class="skin-art" data-zoom="${skin.artSrc}" aria-label="${t('Открыть арт во весь экран', 'Open the art full screen')}"><img src="${skin.artSrc}" width="1280" height="720" alt="${esc(alt)}" fetchpriority="high"><span class="skin-art__zoom" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></button>`
        : `<button type="button" class="skin-art skin-art--card" data-zoom="${skin.cardSrc}" aria-label="${t('Открыть арт крупно', 'Open the art larger')}"><img src="${skin.cardSrc}" width="240" height="390" alt="${esc(alt)}" fetchpriority="high"></button>`;
      const tags = [
        skin.tierInfo ? `<span class="sheet__tag tier-tag"${tierStyle(skin)}><i class="tier-dot" aria-hidden="true"></i>${tierName(skin, lang)}${en ? '' : ` <small lang="en">${skin.tier}</small>`}</span>` : '',
        skin.series ? `<span class="sheet__tag">${esc(seriesName(skin, lang))}</span>` : '',
        skin.availability ? `<span class="sheet__tag">${skin.availability === 'Available' ? t('В продаже', 'In the shop') : t('Ограниченный', 'Limited')}</span>` : ''
      ].join('');
      const price = priceShort(skin, lang);
      const facts = [
        [t('Как получить', 'How to get'), howTo(skin, lang)],
        price ? [t('Цена', 'Price'), price] : null,
        skin.release ? [t('Вышел', 'Released'), releaseText(skin, lang)] : null
      ].filter(Boolean);
      const html = `${crumbs(lang, [[`/skins/`, t('Скины', 'Skins')], [`/skins/${hero.slug}.html`, heroName(hero, lang)], [null, h1]])}
        <header class="skin-hero${skin.artSrc ? '' : ' skin-hero--card'}">
          ${art}
          <div class="skin-hero__copy">
            <a class="skin-hero__who" href="/skins/${hero.slug}.html"><img src="/images/heroes/${hero.slug}.webp" width="40" height="40" alt="">${t(`Скин ${gen(hero)}`, `${hero.en} skin`)}</a>
            <h1>${esc(h1)}</h1>
            ${en || skin.ru === skin.en ? '' : `<p class="skin-hero__en" lang="en">${esc(skin.en)}</p>`}
            <p class="sheet__tags">${tags}</p>
            <dl class="skin-facts">${facts.map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${esc(dd)}</dd></div>`).join('')}</dl>
          </div>
        </header>`;
      return { h1, html };
    };
    const body = lang => {
      const en = lang === 'en';
      const t = (ru, english) => en ? english : ru;
      const blocks = [];
      const order = Object.keys(FEATURES);
      const features = [...new Set([...skin.features].sort((a, b) => order.indexOf(a) - order.indexOf(b)).map(feature => FEATURES[feature]?.[en ? 1 : 0]).filter(Boolean))];
      if (features.length) blocks.push(`<section class="skins-block" id="changes"><h2>${t('Что меняет облик', 'What the skin changes')}</h2><ul class="skin-features">${features.map(text => `<li>${esc(text)}</li>`).join('')}</ul></section>`);
      if (skin.painted.length) blocks.push(`<section class="skins-block" id="painted"><h2>${t('Перекраски', 'Painted versions')}</h2><p class="skins-note">${t('Тот же облик в других цветах. Перекраска открывается, только если у вас уже есть сам облик.', 'The same skin in other colours. A painted version needs the skin itself.')}</p><ul class="skin-painted">${skin.painted.map(row => `<li><b>${esc(en ? row.en : (names[row.en] || row.en))}</b>${!en && names[row.en] ? ` <small lang="en">${esc(row.en)}</small>` : ''}${row.price?.other ? `<span>${esc(otherText(row.price.other, lang) || row.price.other)}</span>` : row.price?.dm ? `<span>${esc(priceParts(row.price, lang).join(', '))}</span>` : ''}</li>`).join('')}</ul></section>`);
      if (siblings.length > 1) blocks.push(`<section class="skins-block" id="hero-skins"><h2>${t(`Все скины ${gen(hero)}`, `All ${hero.en} skins`)} <a class="skins-block__more" href="/skins/${hero.slug}.html">${siblings.length}</a></h2><div class="rail">${siblings.map(other => card(other, lang, { current: other === skin })).join('')}</div></section>`);
      if (sameSeries.length) blocks.push(`<section class="skins-block" id="series"><h2>${t(`Серия «${seriesName(skin, 'ru')}»`, `${seriesName(skin, 'en')} series`)}</h2><div class="rail">${sameSeries.map(other => card(other, lang, { hero: true })).join('')}</div></section>`);
      return `${blocks.join('')}
        ${cta(lang, hero)}
        <dialog class="skin-zoom" data-skin-zoom aria-label="${esc(skinName(skin, lang))}"><button type="button" class="skin-zoom__close" data-zoom-close aria-label="${t('Закрыть', 'Close')}"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button><img alt="${esc(en ? `${hero.en} — ${skin.en}` : `${hero.ru} — «${skin.ru}»`)}" decoding="async"></dialog>
        ${script}`;
    };
    const faq = lang => {
      const en = lang === 'en';
      const rows = [[en ? `How to get the ${skin.en} skin for ${hero.en}?` : `Как получить скин «${skin.ru}» на ${cases[hero.slug]?.[0] || hero.ru}?`, howTo(skin, lang)]];
      if (skin.release) rows.push([en ? `When was ${skin.en} released?` : `Когда вышел скин «${skin.ru}»?`, en ? `${releaseText(skin, 'en')}.` : `${releaseText(skin, 'ru').replace(/^./, c => c.toUpperCase())}.`]);
      if (skin.tierInfo) rows.push([en ? `What class is ${skin.en}?` : `Какой класс у скина «${skin.ru}»?`, en ? `${skin.tier}${skin.series ? `, ${seriesName(skin, 'en')} series` : ''}.` : `${skin.tierInfo.ru} (${skin.tier})${skin.series ? `, серия «${seriesName(skin, 'ru')}»` : ''}.`]);
      return rows;
    };
    const meta = lang => {
      const en = lang === 'en';
      const how = howTo(skin, lang);
      const short = how.length > 120 ? how.slice(0, how.indexOf('.', 60) + 1 || 120) : how;
      const ruTitle = skin.ru === skin.en ? `${skin.en} — скин ${gen(hero)} в MLBB | MLBB Boost` : `${skin.ru} (${skin.en}) — скин ${gen(hero)} в MLBB | MLBB Boost`;
      return en
        ? [`${skin.en} ${hero.en} skin MLBB: price and how to get | MLBB Boost`, `${hero.en} ${skin.en} skin in Mobile Legends${skin.tierInfo ? `: ${skin.tier} class` : ''}${skin.series ? `, ${seriesName(skin, 'en')} series` : ''}${skin.release ? `, released ${releaseText(skin, 'en')}` : ''}. ${short}`]
        : [ruTitle, `Скин ${gen(hero)} «${skin.ru}» (${skin.en}) в Mobile Legends${skin.tierInfo ? `: класс ${skin.tierInfo.ru.toLowerCase()}` : ''}${skin.series ? `, серия «${seriesName(skin, 'ru')}»` : ''}${skin.release ? `, вышел ${releaseText(skin, 'ru')}` : ''}. ${short}`];
    };
    const lang = l => [...meta(l), body(l), faq(l), head(l)];
    return { file: `skins/${hero.slug}/${skin.slug}.html`, kind: 'skin', layout: 'landing', published: PUBLISHED, updated: data.updated, noLlms: true, ruOnly: true,
      crumb: ['/skins/', 'Скины', 'Skins'], crumbs: [['/skins/', 'Скины', 'Skins'], [`/skins/${hero.slug}.html`, `Скины ${gen(hero)}`, `${hero.en} skins`]],
      ogImage: skin.artSrc || skin.cardSrc, ru: lang('ru'), en: lang('en') };
  });

  // The search index for the hub: hero, skin names in both languages, class and picture. Loaded on the first search.
  const index = all.map(skin => [skin.hero.slug, skin.slug, skin.ru, skin.en, skin.tier, String(skin.release || '').slice(0, 4), skin.hero.roles.join(' '), skin.series ? `${skin.series.ru} ${skin.series.en || skin.series.key}` : '']);
  return { guides: [hub, ...heroPages, ...skinPages], index, byHero, total, tiers: SKIN_TIERS, card };
}
