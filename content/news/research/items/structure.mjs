// Catalog structure: ids, categories, prices (game screenshots 25.11.2026 win over Liquipedia), recipes from in-game Academy data.
import { readFile, writeFile } from 'node:fs/promises';
const draft = JSON.parse(await readFile(new URL('./draft.json', import.meta.url), 'utf8'));
// Prices read from the owner's in-game screenshots (25.11.2026). Liquipedia is older for these.
const PRICE_FIX = { 'Starlium Scythe': 2120, 'Glowing Wand': 2050, 'Enchanted Talisman': 2070, 'Guardian Helmet': 2500, 'Black Ice Shield': 780,
  'Rose Gold Meteor': 2030, 'Rapid Boots': 720, 'Swift Boots': 720, 'Arcane Boots': 720, 'Magic Boots': 720, 'Tough Boots': 720 };
const CAT = { Attack: 'attack', Magic: 'magic', Defense: 'defense', Movement: 'movement', Jungling: 'jungle', Roaming: 'roam' };
const SPECIAL = new Set(['Lantern of Hope', 'Flower of Hope', 'Allow Throw', 'Throw Forbidden', 'Broken Heart']);
const items = draft.filter(it => !['Roaming', 'Jungling'].includes(it.categories[0]));
const byId = Object.fromEntries(items.filter(it => it.roneId).map(it => [it.roneId, it]));
const byName = Object.fromEntries(items.map(it => [it.en.toLowerCase(), it]));
const out = [];
for (const it of items) {
  const cost = PRICE_FIX[it.en] ?? it.cost;
  const compIds = items.filter(x => x.roneTarget?.includes(it.roneId)).map(x => x.roneId);
  const lqCount = {};
  for (const c of it.components) { const x = byName[c.toLowerCase()]; if (x) lqCount[x.roneId] = (lqCount[x.roneId] || 0) + 1; }
  const components = compIds.flatMap(id => Array(lqCount[id] || 1).fill(id));
  const sum = components.reduce((s, id) => s + (PRICE_FIX[byId[id].en] ?? byId[id].cost), 0);
  const kind = SPECIAL.has(it.en) ? 'special' : it.type === 'Potion' ? 'potion' : (it.tier === '3' ? 'final' : 'part');
  out.push({ id: it.roneId, en: it.en, cats: it.categories.map(c => CAT[c]), cost, kind, components, upgrade: components.length ? cost - sum : 0 });
  const lqSet = it.components.map(c => byName[c.toLowerCase()]?.roneId).sort().join();
  const flag = components.length && (cost - sum < 0) ? ' !!NEGATIVE' : '';
  if (components.length || it.components.length) console.log(it.en.padEnd(26), cost, '=', components.map(id => byId[id].en).join(' + '), '| upgrade', cost - sum, lqSet !== [...components].sort().join() ? `  [LQ: ${it.components.join(' + ')}]` : '', flag);
}
await writeFile(new URL('./structure.json', import.meta.url), JSON.stringify(out, null, 1));
