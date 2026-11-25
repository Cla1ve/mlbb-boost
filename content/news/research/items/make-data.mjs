// One-off: compose content/items.json for the site from the structure, the Academy stats and the Russian texts.
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { TEXTS } from './texts.mjs';
const here = new URL('.', import.meta.url);
const SITE = 'C:/Users/mamat/Downloads/boostmlbb 29/mlbb-boost';
const j = async f => JSON.parse(await readFile(new URL(f, here), 'utf8'));
const structure = await j('structure.json');
const draft = await j('draft.json');
import { createRequire } from "node:module";
const sharp = createRequire(SITE + "/package.json")("sharp");
const draftOf = Object.fromEntries(draft.map(it => [it.en, it]));
// Cursed Helmet: the Academy lists four direct parts worth more than the item; Liquipedia's three-part recipe fits the price.
// Magic Wand: the in-game recipe tree (owner's screenshot) shows one Mystery Codex, Liquipedia counts two.
const RECIPE_FIX = { 'Cursed Helmet': [2201, 2202, 1203], 'Magic Wand': [1101] };
const STAT = [
  [/Extra Physical Attack|Physical Attack/, 'physAtk'], [/Adaptive Attack/, 'adaptive'], [/Magic Power/, 'magic'], [/Extra Attack Speed|Attack Speed/, 'attackSpeed'],
  [/Crit Damage Reduction/, 'critReduce'], [/Crit Chance/, 'crit'], [/Crit Damage/, 'critDamage'], [/Hybrid Lifesteal/, 'hybridSteal'], [/Spell Vamp/, 'spellVamp'], [/Lifesteal/, 'lifesteal'],
  [/Cooldown Reduction/, 'cdr'], [/Max HP/, 'hp'], [/HP Regen/, 'hpRegen'], [/Mana Regen/, 'manaRegen'], [/Mana/, 'mana'],
  [/Physical Penetration/, 'physPen'], [/Magic Penetration/, 'magicPen'], [/Physical Defense/, 'physDef'], [/Magic Defense/, 'magicDef'],
  [/Movement Speed/, 'move'], [/Slow Reduction/, 'slowReduce'], [/Healing Effect/, 'healing']
];
const parseStat = line => {
  const m = line.trim().match(/^\+?([\d.]+)(%?)\s*(.+)$/);
  if (!m) return null;
  const key = STAT.find(([re]) => re.test(m[3]))?.[1];
  if (!key) throw new Error('stat ' + line);
  return [key, Number(m[1]), m[2] ? '%' : ''];
};
const slugOf = en => en.toLowerCase().replace(/'s\b/g, 's').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const order = {};
for (const it of draft) for (const cat of it.categories) { order[cat] ??= 0; }
const navOrder = (await j('raw/lq_items.json')).sections;
const items = structure.map(s => {
  const t = TEXTS[s.en];
  if (!t) throw new Error('no texts ' + s.en);
  const d = draftOf[s.en];
  const components = RECIPE_FIX[s.en] || s.components;
  return {
    id: s.id, slug: slugOf(s.en), en: s.en, ru: t.ru, cats: s.cats, kind: s.kind, cost: s.cost, components,
    stats: (d.roneTips || []).map(parseStat).filter(Boolean),
    short: t.short ? { ru: t.short[0], en: t.short[1] } : null,
    effects: t.p.map(([kind, ru, en, textRu, textEn]) => ({ kind, name: { ru, en }, text: { ru: textRu, en: textEn } })),
    story: t.story ? { ru: t.story[0], en: t.story[1] } : null,
    liquipedia: s.en.replace(/ /g, '_').replace("Haas's", "Haas's")
  };
});
const byId = Object.fromEntries(items.map(it => [it.id, it]));
for (const it of items) {
  const sum = it.components.reduce((total, id) => total + byId[id].cost, 0);
  it.upgrade = it.components.length ? it.cost - sum : 0;
  if (it.upgrade < 0) throw new Error('negative ' + it.en);
  it.into = items.filter(other => other.components.includes(it.id)).map(other => other.id);
}
// In-game order of each tab (Liquipedia navbox follows the client).
const CAT = { Attack: 'attack', Magic: 'magic', Defense: 'defense', Movement: 'movement' };
const tabs = Object.fromEntries(Object.entries(navOrder).filter(([k]) => CAT[k]).map(([k, list]) => [CAT[k], list.map(en => items.find(it => it.en.toLowerCase() === en.toLowerCase())?.id).filter(Boolean)]));
// Icons: 100 px originals from the game CDN → WebP.
const iconDir = path.join(SITE, 'images/mlbb/items');
await mkdir(iconDir, { recursive: true });
for (const it of items) {
  const url = draftOf[it.en].icon;
  const file = path.join(iconDir, `${it.id}.webp`);
  const res = await fetch(url);
  if (!res.ok) throw new Error('icon ' + it.en + ' ' + res.status);
  await sharp(Buffer.from(await res.arrayBuffer())).webp({ quality: 90, alphaQuality: 100 }).toFile(file);
}
const data = {
  updated: '2026-11-25',
  source: 'Prices: in-game shop, 25.11.2026. Attributes, effects and recipes: in-game Academy via Rone Arena API (ridwaanhall / RoneAI). Stories and patch history: Liquipedia (CC BY-SA). Game data © MOONTON.',
  tabs,
  items
};
await writeFile(path.join(SITE, 'content/items.json'), JSON.stringify(data, null, 1) + '\n');
console.log(items.length, 'items', Object.fromEntries(Object.entries(tabs).map(([k, v]) => [k, v.length])));
