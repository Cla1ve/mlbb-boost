/**
 * MLBB Boost - Currency module (RUB -> USD)
 * ------------------------------------------------------------
 * When the site language is English, every RUB price ("50 ₽",
 * "1 000 ₽", "от 100₽", calculator results, etc.) is shown in USD
 * using the LIVE exchange rate.
 *
 * - The live rate (USD per 1 RUB) is fetched from open.er-api.com,
 *   with the Central Bank of Russia feed as a fallback, and a static
 *   constant as the last resort. The result is cached for 6 hours.
 * - Conversion of generic price text is performed through an i18n
 *   text transform (registered with the i18n engine), so it runs in
 *   the same pass that translates the page and on dynamically added
 *   nodes (price API updates, etc.).
 * - The calculator's split price widget (#original-price /
 *   #discounted-price) is rendered directly by calculator.js, which
 *   asks this module how to format the amount.
 * - In Russian mode everything stays in roubles (₽).
 */
(function () {
  'use strict';

  var CACHE_KEY = 'mlbb_usd_rate';
  var CACHE_TTL = 6 * 60 * 60 * 1000;        // 6 hours
  // Last-resort fallback if every network source fails.
  // ~ 1 USD = 92 RUB  ->  1 RUB = 0.0109 USD (auto-corrected once a live rate loads)
  var FALLBACK_RATE = 0.0109;

  // Matches a rouble amount: digits with optional space/nbsp thousands
  // separators, optional spaces, then the ₽ sign. Examples:
  //   "50 ₽", "50₽", "1 000 ₽", "10 000₽"
  var PRICE_RE = /(\d[\d\s\u00A0]*?)\s*\u20BD/g;

  var usdPerRub = FALLBACK_RATE;
  var haveLiveRate = false;

  var usdFormatter = (typeof Intl !== 'undefined' && Intl.NumberFormat)
    ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;

  /* ---------------- rate cache ---------------- */

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || typeof obj.rate !== 'number') return null;
      return obj;
    } catch (e) { return null; }
  }

  function writeCache(rate) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ rate: rate, ts: Date.now() }));
    } catch (e) {}
  }

  function setRate(rate, live) {
    if (!rate || !isFinite(rate) || rate <= 0) return;
    var changed = Math.abs(rate - usdPerRub) > 1e-9;
    usdPerRub = rate;
    if (live) { haveLiveRate = true; writeCache(rate); }
    if (changed) {
      // Re-render everything that depends on the rate (only matters in EN).
      try {
        if (window.MLBBi18n && window.MLBBi18n.get && window.MLBBi18n.get() === 'en'
            && window.MLBBi18n.refresh) {
          window.MLBBi18n.refresh();
        }
      } catch (e) {}
      try {
        document.dispatchEvent(new CustomEvent('mlbb:ratechange', { detail: { rate: rate } }));
      } catch (e) {}
    }
  }

  /* ---------------- rate fetching ---------------- */

  function fetchRate() {
    // Primary source: open.er-api.com (free, no key, CORS-enabled)
    fetchJson('https://open.er-api.com/v6/latest/RUB')
      .then(function (data) {
        if (data && data.rates && typeof data.rates.USD === 'number') {
          setRate(data.rates.USD, true);
        } else {
          throw new Error('bad payload');
        }
      })
      .catch(function () {
        // Fallback: Central Bank of Russia daily feed (Value = RUB per 1 USD)
        return fetchJson('https://www.cbr-xml-daily.ru/daily_json.js')
          .then(function (data) {
            if (data && data.Valute && data.Valute.USD && data.Valute.USD.Value) {
              setRate(1 / data.Valute.USD.Value, true);
            }
          })
          .catch(function () { /* keep cached / fallback rate */ });
      });
  }

  function fetchJson(url) {
    var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 8000) : null;
    return fetch(url, controller ? { signal: controller.signal } : undefined)
      .then(function (r) {
        if (timer) clearTimeout(timer);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      });
  }

  /* ---------------- formatting ---------------- */

  function rubToUsd(rub) { return rub * usdPerRub; }

  function formatUsd(rub) {
    var usd = rubToUsd(rub);
    var body = usdFormatter ? usdFormatter.format(usd) : usd.toFixed(2);
    return '$' + body;
  }

  function isEnglish() {
    return !!(window.MLBBi18n && window.MLBBi18n.get && window.MLBBi18n.get() === 'en');
  }

  // i18n text transform: convert every "N ₽" in an (already translated) string.
  function convertText(str) {
    if (!str || str.indexOf('\u20BD') === -1) return str;
    return str.replace(PRICE_RE, function (match, num) {
      var rub = parseInt(String(num).replace(/[\s\u00A0]/g, ''), 10);
      if (isNaN(rub)) return match;
      return formatUsd(rub);
    });
  }

  /* ---------------- init ---------------- */

  // Seed from cache so the very first paint already uses a sensible rate.
  var cached = readCache();
  if (cached) {
    usdPerRub = cached.rate;
    haveLiveRate = true;
    // Refresh in the background if the cache is stale.
    if (Date.now() - cached.ts > CACHE_TTL) fetchRate();
  } else {
    fetchRate();
  }

  // Register the price transform with the i18n engine (runs only in EN).
  if (window.MLBBi18n && window.MLBBi18n.registerTransform) {
    window.MLBBi18n.registerTransform(convertText);
  }

  /* ---------------- public API ---------------- */

  window.MLBBCurrency = {
    isEnglish: isEnglish,
    getRate: function () { return usdPerRub; },
    hasLiveRate: function () { return haveLiveRate; },
    toUsd: rubToUsd,
    // Full formatted amount for the CURRENT language: "$12.50" or "1 000 ₽".
    format: function (rub) {
      rub = Number(rub) || 0;
      if (isEnglish()) return formatUsd(rub);
      return rub.toLocaleString('ru-RU') + ' \u20BD';
    },
    // USD amount without symbol, e.g. "12.50" (used by split widgets).
    amountUsd: function (rub) {
      var usd = rubToUsd(Number(rub) || 0);
      return usdFormatter ? usdFormatter.format(usd) : usd.toFixed(2);
    },
    convertText: convertText
  };
})();
