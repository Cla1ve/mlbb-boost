const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const fields = {};
for (const id of ['rank-from', 'rank-to', 'stars-from', 'stars-to', 'weak-account',
                 'calculate-btn', 'calculation-result', 'order-btn']) {
  const classes = new Set();
  fields[id] = {
    value: '0', dataset: {}, selectedOptions: [{ value: 'selected', dataset: {} }],
    checked: false, querySelector: () => null,
    classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c) },
    scrollIntoView() {},
  };
}
const context = vm.createContext({
  window: { location: { hostname: 'boostmlbb.ru', search: '' } },
  document: {
    documentElement: { lang: 'ru' }, addEventListener() {},
    getElementById: id => fields[id], querySelector: () => null, querySelectorAll: () => [],
  },
  URLSearchParams, console, setTimeout: fn => fn(),
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/calculator.js'), 'utf8'), context);
function route(from, to, fromStars = 0, toStars = 0) {
  for (const [side, key, stars] of [['from', from, fromStars], ['to', to, toStars]]) {
    fields[`rank-${side}`].selectedOptions[0].dataset = {
      rankKey: key, division: side === 'from' ? 4 : 1,
      isMythic: ['mythic', 'honor', 'glory', 'immortal'].includes(key) ? 'true' : 'false',
      minStars: 0, maxStars: 2000,
    };
    fields[`rank-${side}`].options = fields[`rank-${side}`].selectedOptions;
    fields[`rank-${side}`].selectedIndex = 0;
    fields[`stars-${side}`].value = String(stars);
  }
}
const payloads = [];
for (const lang of ['ru', 'en']) {
  context.document.documentElement.lang = lang;
  vm.runInContext('requestedCalibrationTargetStars = null', context);
  route('epic', 'legend');
  for (const type of ['standard', 'role', 'party', 'hero']) {
    const url = vm.runInContext(`buildBotOrderUrl('${type}', true, null)`, context);
    const payload = new URL(url).searchParams.get('start');
    assert.equal(payload, `siteq1_${{standard:'s',role:'r',party:'p',hero:'h'}[type]}_4-4-0_5-1-0_${type === 'party' ? 0 : 1}_n_0_0`);
    assert.match(payload, /^[A-Za-z0-9_-]{1,64}$/);
    payloads.push(payload);
  }
  route('mythic', 'mythic', 4, 14);
  vm.runInContext('requestedCalibrationTargetStars = 13', context);
  const url = vm.runInContext("buildBotOrderUrl('standard', false, {status:'active',matches_played:3,wins_played:2})", context);
  assert.equal(new URL(url).searchParams.get('start'), 'siteq1_s_6-0-4_6-0-13_0_a_3_2');
  payloads.push(new URL(url).searchParams.get('start'));
}

(async () => {
  route('epic', 'legend');
  vm.runInContext('requestedCalibrationTargetStars = null', context);
  fields['weak-account'].checked = true;
  let resolve;
  context.fetch = () => new Promise(r => { resolve = r; });
  const pending = vm.runInContext('calculatePrice()', context);
  vm.runInContext('hideResult()', context);
  resolve({ ok: true, json: async () => ({ success: true, total: 1000 }) });
  await pending;
  assert.equal(fields['calculation-result'].classList.contains('hidden'), true);
  assert.equal(fields['order-btn'].href, 'https://t.me/cla1ve_boost_bot?start=site');
  const switching = vm.runInContext('calculatePrice()', context);
  vm.runInContext("selectBoostType('role')", context);
  resolve({ ok: true, json: async () => ({ success: true, total: 1000 }) });
  await switching;
  assert.equal(fields['calculation-result'].classList.contains('hidden'), true);
  vm.runInContext("selectBoostType('standard')", context);
  context.fetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    assert.equal(request.boost_type, 'standard');
    assert.equal(request.weak_account_markup, 10);
    return { ok: true, json: async () => ({ success: true, total: 1000 }) };
  };
  await vm.runInContext('calculatePrice()', context);
  assert.equal(fields['calculation-result'].classList.contains('hidden'), false);
  assert.equal(new URL(fields['order-btn'].href).searchParams.get('start'), payloads[0]);
  console.log('Bot links: both languages, all Rank types, original placement target and stale responses passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
