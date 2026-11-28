const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const code = readFileSync(path.join(__dirname, '../js/consent.js'), 'utf8');
const origin = 'https://boostmlbb.ru';
const article = origin + '/news/mlbb-current-patch/';
const calculator = origin + '/order.html?type=standard';
const telegram = 'https://t.me/cla1ve_boost_bot?start=siteq1_s_3-1-2_5-1-2_0_n_0_0';

function page(url, referrer, storage = new Map()) {
  const handlers = new Map();
  const location = new URL(url);
  const window = { addEventListener() {} };
  const document = {
    referrer,
    documentElement: { lang: 'ru' },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: (event, listener) => {
      if (!handlers.has(event)) handlers.set(event, []);
      handlers.get(event).push(listener);
    }
  };
  const localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value)
  };
  vm.runInNewContext(code, { URL, location, window, document, localStorage });
  return {
    start: () => new URL(window.mlbbSiteBotLink(telegram)).searchParams.get('start'),
    click: (href) => {
      const link = new URL(href);
      link.closest = () => null;
      for (const listener of handlers.get('click') || []) listener({ target: { closest: () => link } });
      return link.href;
    }
  };
}

const noConsent = new Map();
const orderLink = page(article, 'https://www.google.com/', noConsent).click(calculator);
assert.equal(new URL(orderLink).searchParams.get('site_entry'), 'Rnmlbb-current-patch');
assert.match(page(orderLink, '', noConsent).start(), /__Rnmlbb-current-patch$/);
assert.equal(noConsent.size, 0, 'Opening and ordering must work without storing browsing history');
assert.match(page(calculator, article).start(), /__Rnmlbb-current-patch$/, 'Older links use the previous page');
assert.match(page(calculator, '').start(), /__Rporder$/, 'Direct entry to the calculator records the calculator');
const known = new Map([['mlbb_first_landing_v1', 'Rskalea'], ['mlbb_consent_accepted', 'true']]);
assert.match(page(orderLink, article, known).start(), /__Rskalea$/, 'First recorded page takes precedence');
assert.equal(new URL(page(article, '').click(origin + '/prices.html')).searchParams.has('site_entry'), false);
console.log('Site attribution: consenting visit, consent-free article-to-calculator, direct and older links passed.');
