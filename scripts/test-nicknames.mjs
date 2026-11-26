// The nickname generator keeps its promises: short, clean, varied, and built from a typed name.
import assert from 'node:assert/strict';
import { generate, STYLES, MAX_LENGTH, length, latinize, variants } from '../js/nicknames/engine.js';
import { BLOCKED } from '../js/nicknames/data.js';

let seed = 99;
const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

for (const [style] of STYLES) {
  for (const gender of ['any', 'm', 'f']) {
    const seen = new Set();
    const items = [...generate({ style, gender, seen, random, count: 20 }), ...generate({ style, gender, seen, random, count: 20 })];
    assert.ok(items.length >= 20, `${style}/${gender}: only ${items.length} names`);
    assert.equal(new Set(items.map(i => (i.name + (i.pair || '')).toLowerCase())).size, items.length, `${style}: repeats`);
    for (const item of items) for (const name of [item.name, item.pair].filter(Boolean)) {
      assert.ok(length(name) >= 3 && length(name) <= MAX_LENGTH, `${style}: length ${name}`);
      assert.ok(!BLOCKED.some(part => name.toLowerCase().includes(part)), `${style}: blocked ${name}`);
      assert.ok(!/(.)\1\1/.test(name.toLowerCase()), `${style}: triple letter ${name}`);
    }
  }
}
for (const input of ['Максим', 'sasha', 'Лиза']) {
  const items = generate({ input, random, count: 24 });
  const root = latinize(input).toLowerCase().slice(0, 3);
  const mine = items.filter(i => i.name.toLowerCase().includes(root) || i.name.toLowerCase().includes(input.toLowerCase()) || i.personal);
  assert.ok(mine.length / items.length >= 0.75, `${input}: only ${mine.length}/${items.length} use the name`);
}
assert.equal(latinize('Максим'), 'Maxim');
assert.ok(variants('Nova').some(v => v.id === 'caps'));
assert.equal(variants('Мрак').length, 0, 'Latin-only fonts are not offered for Cyrillic names');
console.log('Nickname generator: lengths, blocklist, variety, personal names and fonts passed.');
