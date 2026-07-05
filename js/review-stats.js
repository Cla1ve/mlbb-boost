/**
 * MLBB Boost — Review Stats (shared)
 * ------------------------------------------------------------
 * Подставляет РЕАЛЬНЫЕ цифры по отзывам в любые места сайта.
 * Берёт точное число отзывов из API (pagination.total) и считает
 * средний рейтинг и % довольных по фактическим данным.
 *
 * Использование в разметке:
 *   <span data-review-stat="count">900</span>          -> точное число отзывов
 *   <span data-review-stat="rating">4.9</span>         -> средний рейтинг (1 знак)
 *   <span data-review-stat="satisfaction">98%</span>   -> % довольных (>=4★)
 *
 * Совместимо с counter-анимацией (data-counter="true"): обновляет и
 * data-counter-end, чтобы анимация заканчивалась на реальном значении.
 * Кэш общий с разделом отзывов (mlbb_reviews_cache_v2).
 */
(function () {
  'use strict';

  var API_HTTPS = 'https://cla1veisapi.ru';
  // Всегда HTTPS: HTTP-вариант API отдаёт 301-редирект и запросы обрываются.
  function base() { return API_HTTPS; }

  var CACHE_KEY = 'mlbb_reviews_cache_v2';
  var TTL = 30 * 60 * 1000;
  var PAGE = 100, TIMEOUT = 12000, DELAY = 140;

  var lastStats = null;

  var BOOST_META = {
    standard: true,
    role: true,
    hero: true,
    party: true,
    rising_login: true,
    rising_party: true
  };

  /* ---------------- helpers ---------------- */
  function hasText(v) {
    return v != null && String(v).trim().length > 0;
  }

  function hasRisingParams(r) {
    if (!r || !r.rising) return false;
    return hasText(r.rising.stage_name) || hasText(r.rising.stage) || r.rising.wins_required != null;
  }

  function isCompleteReview(r) {
    if (!r || r.id == null) return false;
    var rating = parseInt(r.rating, 10);
    if (!(rating >= 1 && rating <= 5)) return false;
    if (!hasText(r.order_short)) return false;
    if (!r.booster || !hasText(r.booster.name)) return false;
    if (!hasText(r.boost_type) || !BOOST_META[r.boost_type]) return false;

    if (r.boost_type === 'rising_login' || r.boost_type === 'rising_party') {
      return hasRisingParams(r);
    }

    if (!hasText(r.rank_from) || !hasText(r.rank_to)) return false;
    if (r.boost_type === 'hero') return hasText(r.hero);
    if (r.boost_type === 'role') return hasText(r.preferred_role) || hasText(r.client_role) || hasText(r.booster_role);
    if (r.boost_type === 'party') return hasText(r.client_role) || hasText(r.preferred_role) || hasText(r.booster_role);
    return hasText(r.duration);
  }

  function sanitizeReviews(data) {
    return Array.isArray(data) ? data.filter(isCompleteReview) : [];
  }

  function fetchJSON(limit, offset) {
    var c = new AbortController();
    var t = setTimeout(function () { c.abort(); }, TIMEOUT);
    return fetch(base() + '/reviews?limit=' + limit + '&offset=' + offset, {
      signal: c.signal, headers: { 'Accept': 'application/json' }
    }).then(function (r) {
      clearTimeout(t);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (j) {
      if (!j || j.success !== true || !Array.isArray(j.data)) throw new Error('bad payload');
      return j;
    });
  }

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || !Array.isArray(o.data) || !o.data.length) return null;
      o.data = sanitizeReviews(o.data);
      o.total = o.data.length;
      if (!o.data.length) return null;
      return o;
    } catch (e) { return null; }
  }
  function writeCache(data, total) {
    try {
      var clean = sanitizeReviews(data);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: clean, total: clean.length, timestamp: Date.now() }));
    } catch (e) {}
  }

  function compute(data, totalFromApi) {
    data = sanitizeReviews(data);
    var sum = 0, rated = 0, happy = 0;
    for (var i = 0; i < data.length; i++) {
      var v = data[i].rating;
      if (v >= 1 && v <= 5) { sum += v; rated++; if (v >= 4) happy++; }
    }
    return {
      count: data.length,
      rating: rated ? sum / rated : 0,
      satisfaction: rated ? Math.floor(happy / rated * 100) : 0
    };
  }

  /* ---------------- DOM apply ---------------- */
  function applyStat(name, raw) {
    var nodes = document.querySelectorAll('[data-review-stat="' + name + '"]');
    if (!nodes.length) return;
    var text, end;
    if (name === 'rating') { end = Number(raw).toFixed(1); text = end; }
    else if (name === 'satisfaction') { end = String(raw); text = raw + '%'; }
    else { end = String(raw); text = String(raw); } // count
    Array.prototype.forEach.call(nodes, function (node) {
      node.textContent = text;
      if (node.getAttribute('data-counter') === 'true') node.setAttribute('data-counter-end', end);
    });
  }

  function applyStats(s) {
    if (!s) return;
    lastStats = s;
    applyStat('count', s.count);
    if (s.rating) applyStat('rating', s.rating);
    if (s.satisfaction) applyStat('satisfaction', s.satisfaction);
    updateSchema(s.count, s.rating);
  }

  function reapply() { if (lastStats) applyStats(lastStats); }

  // Обновляем JSON-LD aggregateRating на фактические значения из валидных отзывов.
  function updateSchema(count, rating) {
    var scripts = document.querySelectorAll('script[type="application/ld+json"]');
    Array.prototype.forEach.call(scripts, function (sc) {
      if (sc.textContent.indexOf('aggregateRating') === -1) return;
      var t = sc.textContent;
      if (count != null) t = t.replace(/("reviewCount"\s*:\s*")\d+(")/g, '$1' + count + '$2');
      if (rating) t = t.replace(/("ratingValue"\s*:\s*")\d+(?:\.\d+)?(")/g, '$1' + Number(rating).toFixed(1) + '$2');
      if (t !== sc.textContent) sc.textContent = t;
    });
  }

  /* ---------------- loaders ---------------- */
  function fetchAll() {
    var acc = [], total = null;
    function step(off) {
      fetchJSON(PAGE, off).then(function (j) {
        if (j.pagination && typeof j.pagination.total === 'number') total = j.pagination.total;
        acc = acc.concat(sanitizeReviews(j.data));
        var more = j.pagination ? j.pagination.has_more : (j.data.length === PAGE);
        if (more && j.data.length) setTimeout(function () { step(off + PAGE); }, DELAY);
        else { writeCache(acc, total); applyStats(compute(acc, total)); }
      }).catch(function () {
        if (acc.length) applyStats(compute(acc, total)); // что успели — применим
      });
    }
    step(0);
  }

  function init() {
    // Работаем только если на странице есть куда подставлять.
    if (!document.querySelector('[data-review-stat]')) return;

    var cache = readCache();
    if (cache) {
      applyStats(compute(cache.data, cache.total));
      if (Date.now() - (cache.timestamp || 0) > TTL) {
        fetchAll();
      }
    } else {
      // Нет кэша: считаем только валидные отзывы, чтобы не показывать сырой total API.
      fetchAll();
    }

    // Перекрываем возможный сброс counter-анимации к старому тексту.
    window.addEventListener('load', reapply);
    setTimeout(reapply, 2600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
