const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Execute the published calculator; only the DOM is a lightweight fake.
const fields = {};
function field(id, value = '') {
  const hidden = new Set();
  fields[id] = {
    value, dataset: {}, selectedOptions: [{ dataset: {} }], checked: false,
    classList: {
      add: c => hidden.add(c), remove: c => hidden.delete(c),
      contains: c => hidden.has(c),
      toggle: (c, on) => on ? hidden.add(c) : hidden.delete(c),
    },
  };
  return fields[id];
}
for (const id of ['rank-from', 'rank-to', 'stars-from', 'stars-to', 'calibration-card',
                 'calibration-progress', 'calibration-matches', 'calibration-wins-wrap',
                 'calibration-wins', 'placement-target-note']) field(id);
const status = { value: 'active', checked: true };
const context = vm.createContext({
  window: { location: { hostname: 'boostmlbb.ru', search: '' } },
  document: {
    addEventListener() {}, documentElement: { lang: 'ru' },
    getElementById: id => fields[id],
    querySelector: () => status.checked ? status : null,
    querySelectorAll: () => [status],
  },
  URLSearchParams, console,
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/calculator.js'), 'utf8'), context);
for (const from of ['warrior', 'elite', 'master', 'grandmaster', 'epic', 'legend']) {
  fields['rank-from'].selectedOptions[0].dataset.rankKey = from;
  fields['rank-to'].selectedOptions[0].dataset.rankKey = 'mythic';
  fields['stars-to'].value = '0';
  status.checked = true;
  fields['calibration-matches'].value = '7';
  assert.equal(vm.runInContext('needsCalibrationQuestion()', context), false);
  assert.equal(vm.runInContext('readCalibration()', context), null);
  vm.runInContext('updateCalibrationFields()', context);
  assert.equal(fields['calibration-card'].classList.contains('hidden'), true);
  assert.equal(status.checked, false);
  assert.equal(fields['calibration-matches'].value, '');
  fields['stars-to'].value = '1';
  assert.equal(vm.runInContext('needsCalibrationQuestion()', context), true);
}
fields['rank-from'].selectedOptions[0].dataset.rankKey = 'mythic';
for (const [start, goal, matches, actual] of [[6, 9, 7, 10], [6, 9, 9, 9], [6, 10, 7, 10], [8, 13, 9, 13]]) {
  vm.runInContext('requestedCalibrationTargetStars = null', context);
  fields['stars-from'].value = String(start);
  fields['stars-to'].value = String(goal);
  fields['calibration-matches'].value = String(matches);
  status.checked = true;
  vm.runInContext('updatePlacementTargetPreview()', context);
  assert.equal(Number(fields['stars-to'].value), actual);
}
function element() {
  return {
    dataset: {}, children: [],
    appendChild(child) { this.children.push(child); },
    cloneNode() { return { ...element(), value: this.value, dataset: { ...this.dataset } }; },
  };
}
context.document.createElement = element;
for (const side of ['from', 'to']) {
  fields['rank-' + side].children = [];
  fields['rank-' + side].appendChild = function (child) { this.children.push(child); };
}
vm.runInContext('generateRankOptions()', context);
const mythicOption = fields['rank-to'].children.flatMap(group => group.children)
  .find(option => option.dataset.rankKey === 'mythic');
assert.equal(mythicOption.dataset.minStars, 0);
console.log('Calibration entry, selectable zero goal, stale input clearing and odd-target cases passed.');
