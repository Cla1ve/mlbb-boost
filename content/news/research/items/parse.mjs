// Merge Liquipedia item pages with the Rone Arena (in-game Academy) data into one draft file.
import { readFile, writeFile } from 'node:fs/promises';
const dir = new URL('./raw/', import.meta.url);
const j = async f => JSON.parse(await readFile(new URL(f, dir), 'utf8'));
const lq = await j('lq_items.json');
const ronePlain = (await j('eq_en.json')).data.records.map(r => r.data);
const roneX = Object.fromEntries((await j('eqx_en.json')).data.records.map(r => [r.data.equipid, r.data]));
const norm = s => s.toLowerCase().replace(/[’']/g, "'").replace(/haas's/, "haas'").replace(/\s*-\s*/g, ' - ').replace(/\s+/g, ' ').trim();
const roneByName = {};
for (const d of ronePlain) roneByName[norm(d.equipname)] ??= d;
const decodeIcon = u => decodeURIComponent((u || '').split('url=')[1] || u || '');
const field = (text, key) => (text.match(new RegExp(`^\\|${key}=(.*)$`, 'm')) || [])[1]?.trim() ?? '';
const section = (text, name) => {
  const m = text.match(new RegExp(`==\\s*${name}\\s*==([\\s\\S]*?)(?=\\n==[^=]|$)`));
  return m ? m[1].trim() : '';
};
const clean = s => s.replace(/<\/?p>/g, '').replace(/\{\{Heroes icon\|([^}]+)\}\}/g, '$1').replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1').replace(/'''/g, '').replace(/\s+\n/g, '\n').trim();
const categoryOf = {};
for (const [cat, list] of Object.entries(lq.sections)) for (const name of list) (categoryOf[name] ||= []).push(cat);
const items = [];
for (const [name, text] of Object.entries(lq.pages)) {
  const infobox = text.split(/\n}}\n/)[0];
  const attrs = {};
  const attrBlock = infobox.split('<!--Attributes-->')[1]?.split('<!--')[0] || '';
  for (const line of attrBlock.split('\n')) { const m = line.match(/^\|(\w+)=(.+)$/); if (m) attrs[m[1]] = m[2].trim(); }
  const recipeBlock = infobox.split('<!--Recipe-->')[1] || '';
  const components = [...recipeBlock.matchAll(/\|bottomitem\d=(.+)/g)].map(m => m[1].trim());
  const passives = [...text.split('==Jungling==')[0].matchAll(/\{\{SpellCard([\s\S]*?)\n\}\}/g)].map(m => ({ name: field(m[1], 'name'), ability: field(m[1], 'ability'), description: clean((m[1].split('|description=')[1] || '').trim()) }));
  const rone = roneByName[norm(name)] || roneByName[norm(name.replace("Haas's", "Haas'"))];
  const rx = rone ? roneX[rone.equipid] : null;
  items.push({
    en: name,
    categories: categoryOf[name],
    cost: Number(field(text, 'itemcost')) || 0,
    tier: field(text, 'tier'),
    type: field(text, 'type'),
    status: field(text, 'status'),
    lqAttrs: attrs,
    components,
    lqPassives: passives,
    story: clean(section(text, 'Story')),
    history: section(text, 'Version History'),
    intro: clean((text.match(/^: (.+)$/m) || [])[1] || ''),
    roneId: rone?.equipid ?? null,
    icon: rone ? decodeIcon(rone.equipicon) : null,
    roneTips: rx ? rx.equiptips.split('<br>').filter(Boolean) : null,
    roneDesc: rx ? rx.equipskilldesc.trim() : null,
    roneSkills: rx ? [1, 2, 3, 4, 5, 6, 7].map(i => rx[`equipskill${i}`].trim()).filter(s => s && s !== ':') : null,
    roneTarget: rx ? rx.targetequipid.split(';').filter(Boolean).map(Number) : null
  });
}
await writeFile(new URL('../draft.json', dir), JSON.stringify(items, null, 1));
for (const it of items) console.log([it.en, it.categories.join('/'), it.cost, 't' + it.tier, it.type, it.roneId, it.components.join('+'), (it.roneTips || []).join(' ')].join(' | '));
