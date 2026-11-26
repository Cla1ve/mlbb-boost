// Nickname generator: pure functions, no DOM. Used by js/nicknames/app.js and by the build tests.
import { WORDS, HEADS, TAILS, BASES, JAPANESE, SUFFIXES, ONSETS, MIDDLES, LINKS, ENDINGS, PHRASES, PHRASES_ALONE, PHRASE_WORDS, RUSSIAN, PAIRS, PAIR_HEADS, PAIR_FLIPS, BLOCKED } from './data.js';

export const MAX_LENGTH = 16;
export const STYLES = [
  ['mix', 'Все', 'All'], ['word', 'Одно слово', 'One word'], ['duo', 'Составные', 'Compound'], ['coined', 'Выдуманные', 'Invented'],
  ['styled', 'Стильные', 'Stylised'], ['japan', 'Японские', 'Japanese'], ['phrase', 'Фразы', 'Phrases'], ['russian', 'На русском', 'Russian'], ['pair', 'Парные', 'Pairs']
];

const VOWELS = 'aeiouy';
const isVowel = letter => VOWELS.includes(letter.toLowerCase());
const capital = text => text ? text[0].toUpperCase() + text.slice(1) : text;

const TRANSLIT = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
export function latinize(text) {
  const lower = String(text || '').toLowerCase().replace(/кс/g, 'x').replace(/ий(?=$|\s)/g, 'y');
  return capital([...lower].map(letter => TRANSLIT[letter] ?? letter).join('').replace(/[^a-z0-9]/g, ''));
}
export const cleanInput = text => String(text || '').replace(/[^A-Za-zА-Яа-яЁё0-9]/g, '').slice(0, 12);
const hasCyrillic = text => /[а-яё]/i.test(text);

export const length = name => [...name].length;
export function acceptable(name) {
  const low = name.toLowerCase();
  const size = length(name);
  if (size < 3 || size > MAX_LENGTH) return false;
  if (/(.)\1\1/.test(low)) return false;
  const letters = low.replace(/[^a-zа-яё]/g, '');
  return !BLOCKED.some(part => letters.includes(part));
}

// ---------- helpers ----------
const picker = random => list => list[Math.floor(random() * list.length)];
// "any" takes everything; a chosen reading keeps neutral entries and leans towards the matching ones.
export function byTag(list, gender) {
  if (!gender || gender === 'any') return list;
  const match = list.filter(item => item.tag === gender);
  return [...list.filter(item => !item.tag), ...match, ...match];
}

// Portmanteau pairs: the end of one word is the start of the next ("Raven" + "Venom" = "Ravenom").
let blendCache = null;
export function blends() {
  if (blendCache) return blendCache;
  const pool = [...new Set([...WORDS, ...HEADS, ...TAILS].map(item => item.word.toLowerCase()))].filter(word => word.length >= 3);
  const found = new Map();
  for (const a of pool) for (const b of pool) {
    if (a === b) continue;
    for (let k = Math.min(4, a.length - 1, b.length - 1); k >= 2; k--) {
      if (!a.endsWith(b.slice(0, k))) continue;
      const joined = a + b.slice(k);
      if (joined.length >= 5 && joined.length <= 10 && b !== 'dead' && !pool.includes(joined) && !found.has(joined)) found.set(joined, [a, b, k]);
      break;
    }
  }
  blendCache = [...found].map(([word, [a, b, k]]) => ({ word: capital(word), from: [capital(a), capital(b)], overlap: k }));
  return blendCache;
}

const RESPELL = { Sky: 'Skie', Night: 'Nyte', Soul: 'Soule', Blood: 'Blud', Light: 'Lyte', Fire: 'Fyre', Heart: 'Hart', Dead: 'Ded' };
// Short Japanese words that take a suffix naturally (Kuro + maru).
const SUFFIXABLE = ['Kuro', 'Shiro', 'Yami', 'Kage', 'Yume', 'Sora'];

// Spelling tricks players actually use. Each returns null when it would make the word unreadable.
export const TRICKS = {
  x(word, random) {
    if (/x/i.test(word) || [...word].filter(isVowel).length < 2) return null;
    const spots = [...word].map((letter, i) => (i > 0 && i < word.length - 1 && 'aeo'.includes(letter.toLowerCase()) && !isVowel(word[i - 1]) && !isVowel(word[i + 1])) ? i : -1).filter(i => i > 0);
    if (!spots.length) return null;
    const at = spots[Math.floor(random() * spots.length)];
    return word.slice(0, at) + 'x' + word.slice(at + 1);
  },
  y(word) {
    const at = word.slice(1).search(/i(?![aeiouy])/);
    return at < 0 ? null : word.slice(0, at + 1) + 'y' + word.slice(at + 2);
  },
  k(word) {
    const next = word.search(/[Cc](?=[aourl]|$)/);
    return next < 0 ? null : word.slice(0, next) + (word[next] === 'C' ? 'K' : 'k') + word.slice(next + 1);
  },
  double(word) {
    const last = word.at(-1), before = word.at(-2) || '';
    return /[bdfgklmnprstz]/i.test(last) && last.toLowerCase() !== before.toLowerCase() ? word + last : null;
  },
  z(word) { return /[aeiou]s$/i.test(word) ? word.slice(0, -1) + 'z' : null; },
  ie(word) { return /[^aeiou]y$/i.test(word) ? word.slice(0, -1) + 'ie' : null; },
  lower(word) { return word === word.toLowerCase() ? null : word.toLowerCase(); },
  digit(word) {
    const at = word.slice(1).search(/[ie]/);
    if (at < 0 || word.length < 6 || /x/i.test(word)) return null;
    const i = at + 1;
    return word.slice(0, i) + (word[i] === 'i' ? '1' : '3') + word.slice(i + 1);
  }
};
// One real spelling trick per name; sometimes the whole thing goes lowercase on top. Digits stay rare.
const TRICK_ORDER = ['x', 'x', 'x', 'x', 'double', 'double', 'double', 'y', 'y', 'k', 'k', 'z', 'ie', 'digit'];
export function stylise(word, random) {
  const pick = picker(random);
  let result = null;
  for (let attempt = 0; attempt < 12 && !result; attempt++) {
    const id = pick(TRICK_ORDER);
    if (id === 'double' && word.length < 5) continue;
    const next = TRICKS[id](word, random);
    if (next && next !== word) result = next;
  }
  if (!result) return null;
  return random() < 0.18 ? result.toLowerCase() : result;
}

// Invented names: one open syllable pattern, at most one diphthong, no mushy vowel runs.
function coin(gender, random) {
  const pick = picker(random);
  const first = random() < 0.14 ? pick(['ae', 'ei', 'ia']) : pick(['a', 'a', 'e', 'e', 'i', 'o', 'o', 'y']);
  const onset = pick(ONSETS.filter(o => !/^(ae|al|el)$/.test(o) || first.length === 1));
  const word = capital(onset + first + (random() < 0.55
    ? pick(LINKS) + pick(['a', 'e', 'i', 'o']) + pick(['n', 'r', 's', 'th', 'l', 'x', '', ''])
    : pick(byTag(ENDINGS, gender)).word));
  const low = word.toLowerCase();
  if (/[aeiouy]{3}/.test(low) || /[^aeiouy]{3}/.test(low.replace(/th|kh|sh/g, 'f')) || /(..)\1/.test(low) || /([aeiouy])\1/.test(low) || /[aeiouy]{2}.*[aeiouy]{2}/.test(low)) return null;
  return word.length >= 4 && word.length <= 8 ? word : null;
}

// ---------- recipes ----------
function recipes({ gender, input, random, mixing }) {
  const pick = picker(random);
  const typed = cleanInput(input);
  const me = latinize(typed).slice(0, 9);
  const mine = me.length >= 2;
  const words = byTag(WORDS, gender), heads = byTag(HEADS, gender), tails = byTag(TAILS, gender);
  const result = (name, ru = '', en = '', personal = false) => ({ name, ru, en, personal });
  return {
    word() { const w = pick(words); return result(w.word, w.ru); },
    duo() {
      const withName = mine;
      let head = pick(heads).word, tail = pick(tails).word;
      if (withName) { if (random() < 0.5) head = me; else tail = me; }
      if (!withName && random() < 0.22) { head = RESPELL[head] || head; tail = RESPELL[tail] || tail; }
      if (head.slice(0, 3) === tail.slice(0, 3) || head.at(-1).toLowerCase() === tail[0].toLowerCase()) return null;
      const name = head + capital(tail);
      return name.length <= 13 ? result(name, '', '', withName) : null;
    },
    coined() {
      if (mine) {
        const root = me.slice(0, Math.min(me.length, 3 + Math.floor(random() * 2)));
        let ending = pick(byTag(ENDINGS, gender)).word;
        if (isVowel(root.at(-1)) && isVowel(ending[0])) ending = pick(LINKS) + ending;
        const name = capital(root.toLowerCase() + ending);
        return name.toLowerCase() !== me.toLowerCase() && !/[^aeiouy]{3}|[aeiouy]{3}/i.test(name) ? result(name, '', '', true) : null;
      }
      if (random() < 0.5) {
        const blend = pick(blends());
        return result(blend.word, `сплав ${blend.from[0]} и ${blend.from[1]}`, `${blend.from[0]} + ${blend.from[1]}`);
      }
      const name = coin(gender, random);
      return name ? result(name) : null;
    },
    styled() {
      const source = mine ? me : pick(random() < 0.6 ? byTag(BASES, gender) : words).word;
      const name = stylise(source, random);
      return name ? result(name, source === me ? '' : `от слова ${source}`, source === me ? '' : `from ${source}`, source === me) : null;
    },
    japan() {
      if (mine && (mixing || random() < 0.5)) {
        let root = me.toLowerCase();
        const suffix = pick(SUFFIXES);
        if (!isVowel(root.at(-1))) root += suffix === 'maru' ? '' : 'u';
        return result(capital(root + suffix), '', '', true);
      }
      const entry = pick(byTag(JAPANESE, gender));
      if (SUFFIXABLE.includes(entry.word) && random() < 0.6) {
        const suffix = pick(SUFFIXES.filter(s => !entry.word.toLowerCase().endsWith(s)));
        return result(entry.word + suffix, `${entry.ru} + суффикс`, `${entry.en} + suffix`);
      }
      return result(entry.word, entry.ru, entry.en);
    },
    phrase() {
      if (mine) return result(pick(PHRASES).replace('{n}', me.toLowerCase()), '', '', true);
      return random() < 0.55 ? result(pick(PHRASES_ALONE)) : result(pick(PHRASES).replace('{n}', pick(PHRASE_WORDS)));
    },
    russian() {
      if (typed && hasCyrillic(typed)) {
        return result(pick(['просто {n}', 'это {n}', '{n} спит', '{n} не тут', 'не {n}', 'где {n}?', 'ищи {n}', 'тот самый {n}', '{n} в деле']).replace('{n}', capital(typed.toLowerCase())), '', '', true);
      }
      return result(pick(byTag(RUSSIAN, gender)).word);
    },
    pair() {
      if (random() < 0.7) {
        const [a, b] = pick(PAIRS);
        return { name: a, pair: b, ru: '', en: '', personal: false };
      }
      const [a, b] = pick(PAIR_FLIPS);
      const tail = pick(TAILS.filter(t => !PAIR_HEADS.includes(t.word))).word;
      return { name: a + tail, pair: b + tail, ru: '', en: '', personal: false };
    }
  };
}

const MIX = ['word', 'duo', 'coined', 'styled', 'japan', 'word', 'phrase', 'coined', 'duo', 'styled', 'russian', 'japan'];

export function generate({ style = 'mix', gender = 'any', input = '', count = 12, seen = new Set(), random = Math.random } = {}) {
  const make = recipes({ gender, input, random, mixing: style === 'mix' });
  const typed = cleanInput(input);
  const order = style === 'mix'
    ? (typed ? ['duo', 'styled', 'coined', 'phrase', 'duo', 'styled', 'japan', hasCyrillic(typed) ? 'russian' : 'coined', 'duo', 'phrase', 'styled', 'coined'] : MIX)
    : [style];
  const out = [];
  for (let step = 0; out.length < count && step < count * 40; step++) {
    const id = order[(out.length + Math.floor(step / 12)) % order.length];
    const item = make[id]();
    if (!item) continue;
    const key = (item.name + (item.pair || '')).toLowerCase();
    if (seen.has(key) || !acceptable(item.name) || (item.pair && !acceptable(item.pair))) continue;
    seen.add(key);
    out.push({ ...item, style: id });
  }
  return out;
}

// ---------- fonts and frames ----------
const range = (upper, lower, digit, holes = {}) => text => [...text].map(letter => {
  if (holes[letter]) return holes[letter];
  const code = letter.codePointAt(0);
  if (upper && code >= 65 && code <= 90) return String.fromCodePoint(upper + code - 65);
  if (lower && code >= 97 && code <= 122) return String.fromCodePoint(lower + code - 97);
  if (digit && code >= 48 && code <= 57) return String.fromCodePoint(digit + code - 48);
  return letter;
}).join('');
const SMALL = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ';
// rare: characters outside the basic Unicode plane, which some phones show as boxes.
export const FONTS = [
  { id: 'caps', ru: 'Капитель', en: 'Small caps', map: text => [...text].map(l => /[a-z]/i.test(l) ? SMALL[l.toLowerCase().charCodeAt(0) - 97] : l).join('') },
  { id: 'wide', ru: 'Широкий', en: 'Wide', map: range(0xFF21, 0xFF41, 0xFF10) },
  { id: 'circle', ru: 'В кружках', en: 'Circled', map: range(0x24B6, 0x24D0, 0) },
  { id: 'bold', ru: 'Жирный', en: 'Bold', rare: true, map: range(0x1D5D4, 0x1D5EE, 0x1D7EC) },
  { id: 'script', ru: 'Рукописный', en: 'Script', rare: true, map: range(0x1D4D0, 0x1D4EA, 0) },
  { id: 'gothic', ru: 'Готический', en: 'Gothic', rare: true, map: range(0x1D56C, 0x1D586, 0) },
  { id: 'double', ru: 'Двойной', en: 'Double', rare: true, map: range(0x1D538, 0x1D552, 0x1D7D8, { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' }) }
];
export const FRAMES = [['彡', '彡'], ['『', '』'], ['「', '」'], ['✦', '✦'], ['★', '★'], ['꧁', '꧂'], ['乂', '乂'], ['', 'ツ'], ['', '々'], ['丶', '']];
export const variants = name => FONTS.map(font => ({ ...font, text: font.map(name) })).filter(font => font.text !== name);
export const framed = name => FRAMES.map(([left, right]) => left + name + right);
