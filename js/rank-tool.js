/* Matches-to-rank calculator for /guides/mlbb-ranks.html.
 * Star model is shared with the order calculator (js/calculator.js) and the bot's
 * "play it yourself" estimate (utils/self_play_estimate.py):
 *   win +1 star, loss -1 star; from Epic upward star protection about once per 6 losses;
 *   star raising points add a star about every 35 (Epic) / 50 (Legend) matches;
 *   open Mythic placement: first 10 Mythic stars come from double wins, losses cost nothing.
 */
(function () {
  'use strict';

  var EN = document.documentElement.lang === 'en';
  var DIVISION_RANKS = [
    { key: 'warrior', ru: 'Воин', en: 'Warrior', divisions: 3, stars: 3, price: 'warrior_elite' },
    { key: 'elite', ru: 'Элита', en: 'Elite', divisions: 3, stars: 4, price: 'warrior_elite' },
    { key: 'master', ru: 'Мастер', en: 'Master', divisions: 4, stars: 4, price: 'master_gm' },
    { key: 'grandmaster', ru: 'Грандмастер', en: 'Grandmaster', divisions: 5, stars: 5, price: 'master_gm' },
    { key: 'epic', ru: 'Эпик', en: 'Epic', divisions: 5, stars: 5, price: 'epic' },
    { key: 'legend', ru: 'Легенда', en: 'Legend', divisions: 5, stars: 5, price: 'legend' }
  ];
  var MYTHIC_RANKS = [
    { key: 'mythic', ru: 'Мифик', en: 'Mythic', from: 0, to: 24 },
    { key: 'honor', ru: 'Мифическая честь', en: 'Mythical Honor', from: 25, to: 49 },
    { key: 'glory', ru: 'Мифическая слава', en: 'Mythical Glory', from: 50, to: 99 },
    { key: 'immortal', ru: 'Мифический бессмертный', en: 'Mythical Immortal', from: 100, to: 2000 }
  ];
  var ROMAN = ['I', 'II', 'III', 'IV', 'V'];
  var BEFORE_MYTHIC = DIVISION_RANKS.reduce(function (sum, r) { return sum + r.divisions * r.stars; }, 0); // 112
  var LOSING = { epic: 1, legend: 1, mythic: 1, honor: 1, glory: 1, immortal: 1 };
  var RAISE_EVERY = { epic: 35, legend: 50 };
  var API = 'https://cla1veisapi.ru/calculate';

  function text(ru, en) { return EN ? en : ru; }
  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }
  function number(n) { return new Intl.NumberFormat(EN ? 'en-US' : 'ru-RU').format(n); }

  // Same absolute scale as calculateAbsoluteStars() in js/calculator.js.
  function absolute(rank, stars) {
    if (rank.mythic) return BEFORE_MYTHIC + 1 + stars;
    var total = 0;
    for (var i = 0; i < DIVISION_RANKS.length; i++) {
      var r = DIVISION_RANKS[i];
      if (r.key === rank.key) return total + (r.divisions - rank.division) * r.stars + stars;
      total += r.divisions * r.stars;
    }
    return total;
  }
  // Rank (key) that the star number `n` (1-based absolute) belongs to.
  function rankOfStar(n) {
    var total = 0;
    for (var i = 0; i < DIVISION_RANKS.length; i++) {
      var r = DIVISION_RANKS[i];
      total += r.divisions * r.stars;
      if (n <= total) return { key: r.key, price: r.price };
    }
    var mythicStars = n - BEFORE_MYTHIC - 1;
    var key = mythicStars < 25 ? 'mythic' : mythicStars < 50 ? 'honor' : mythicStars < 100 ? 'glory' : 'immortal';
    return { key: key, price: key, mythicStars: mythicStars };
  }
  function starsPerMatch(key, winrate) {
    var protect = LOSING[key] ? 1 / 6 : 0;
    var raise = RAISE_EVERY[key] ? 1 / RAISE_EVERY[key] : 0;
    return winrate - (1 - winrate) * (1 - protect) + raise;
  }
  function estimate(start, end, winrate, placementOpen) {
    var matches = 0;
    for (var total = start; total < end; total++) {
      var star = rankOfStar(total + 1);
      if (placementOpen && star.key === 'mythic' && star.mythicStars >= 1 && star.mythicStars <= 10) {
        matches += 1 / (2 * winrate);
        continue;
      }
      var rate = starsPerMatch(star.key, winrate);
      if (rate <= 0.005) return null;
      matches += 1 / rate;
    }
    return matches;
  }
  function localPrice(start, end, prices, type) {
    var sum = 0;
    for (var total = start; total < end; total++) {
      var category = rankOfStar(total + 1).price;
      var price = prices[category] && prices[category][type];
      if (!price) return null;
      sum += price;
    }
    return sum;
  }

  function parseRank(value) {
    var parts = String(value || '').split('|');
    for (var i = 0; i < DIVISION_RANKS.length; i++) {
      if (DIVISION_RANKS[i].key === parts[0]) return { key: parts[0], division: Number(parts[1]), maxStars: DIVISION_RANKS[i].stars, minStars: 1, mythic: false, rank: DIVISION_RANKS[i] };
    }
    for (var j = 0; j < MYTHIC_RANKS.length; j++) {
      var m = MYTHIC_RANKS[j];
      if (m.key === parts[0]) return { key: m.key, mythic: true, minStars: m.from, maxStars: m.to, rank: m };
    }
    return null;
  }
  function apiRankString(rank, stars) {
    if (rank.mythic) return rank.rank.ru + ' ' + stars;
    return rank.rank.ru + ' ' + ROMAN[rank.division - 1] + ' ' + stars + ' звезд';
  }
  function orderLink(from, fromStars, to, toStars, type) {
    var params = new URLSearchParams({ type: type, from: from.mythic ? from.key : from.key + '-' + from.division, fs: String(fromStars), to: to.mythic ? to.key : to.key + '-' + to.division, ts: String(toStars) });
    return (EN ? '/en' : '') + '/order.html?' + params.toString();
  }

  function fillSelect(select, selected) {
    select.innerHTML = '';
    DIVISION_RANKS.forEach(function (r) {
      var group = document.createElement('optgroup');
      group.label = EN ? r.en : r.ru;
      for (var d = r.divisions; d >= 1; d--) {
        var option = document.createElement('option');
        option.value = r.key + '|' + d;
        option.textContent = (EN ? r.en : r.ru) + ' ' + ROMAN[d - 1];
        group.appendChild(option);
      }
      select.appendChild(group);
    });
    var mythicGroup = document.createElement('optgroup');
    mythicGroup.label = text('Мифические ранги', 'Mythic ranks');
    MYTHIC_RANKS.forEach(function (m) {
      var option = document.createElement('option');
      option.value = m.key;
      option.textContent = (EN ? m.en : m.ru) + ' (' + m.from + (m.key === 'immortal' ? '+' : '–' + m.to) + '⭐)';
      mythicGroup.appendChild(option);
    });
    select.appendChild(mythicGroup);
    select.value = selected;
  }

  // Yandex Metrica JS goals (create them in Metrica with these identifiers to see conversions).
  function goal(name) { try { if (typeof window.ym === 'function') window.ym(99684184, 'reachGoal', name); } catch (e) { /* analytics is optional */ } }

  function init(root) {
    var form = root.querySelector('form');
    var result = root.querySelector('.rank-tool-result');
    var errorBox = root.querySelector('[data-out="error"]');
    var out = function (name) { return root.querySelector('[data-out="' + name + '"]'); };
    var prices = {};
    try { prices = JSON.parse(document.getElementById('rank-tool-prices').textContent); } catch (e) { prices = {}; }
    var formatSelect = document.createElement('select');
    formatSelect.name = 'type';
    [['standard', 'Обычный буст', 'Account boost'], ['role', 'На роли', 'Role'], ['hero', 'На герое', 'Hero'], ['party', 'В пати', 'Party']].forEach(function (f) {
      var option = document.createElement('option'); option.value = f[0]; option.textContent = EN ? f[2] : f[1]; formatSelect.appendChild(option);
    });
    var formatLabel = document.createElement('label');
    formatLabel.textContent = text('Формат буста', 'Boost format');
    formatLabel.appendChild(formatSelect);
    form.querySelector('.rank-tool-wide').appendChild(formatLabel);

    fillSelect(form.elements.from, 'legend|5');
    fillSelect(form.elements.to, 'mythic');
    form.elements.fromStars.value = '1';
    form.elements.toStars.value = '0';
    var request = 0;

    function syncStars(name) {
      var rank = parseRank(form.elements[name].value);
      var input = form.elements[name + 'Stars'];
      if (!rank) return;
      input.min = String(rank.minStars);
      input.max = String(rank.maxStars);
      var value = Number(input.value);
      if (!Number.isInteger(value) || value < rank.minStars) input.value = String(rank.minStars);
      if (value > rank.maxStars) input.value = String(rank.maxStars);
    }
    function fail(message) {
      result.hidden = true;
      errorBox.hidden = false;
      errorBox.textContent = message;
    }
    function render() {
      var from = parseRank(form.elements.from.value);
      var to = parseRank(form.elements.to.value);
      var fromStars = Number(form.elements.fromStars.value);
      var toStars = Number(form.elements.toStars.value);
      var winrate = Number(form.elements.wr.value) / 100;
      var perDay = Math.max(1, Math.min(60, Number(form.elements.perDay.value) || 8));
      var type = formatSelect.value;
      form.elements.wrOut.value = Math.round(winrate * 100) + '%';
      if (!from || !to) return;
      if (!Number.isInteger(fromStars) || fromStars < from.minStars || fromStars > from.maxStars || !Number.isInteger(toStars) || toStars < to.minStars || toStars > to.maxStars) {
        fail(text('Проверьте звёзды: для выбранного ранга допустимо ', 'Check the stars: the selected rank allows ') + (fromStars < from.minStars || fromStars > from.maxStars ? from.minStars + '–' + from.maxStars : to.minStars + '–' + to.maxStars) + '.');
        return;
      }
      var start = absolute(from, fromStars);
      var end = absolute(to, toStars);
      if (end <= start) { fail(text('Цель должна быть выше текущего ранга.', 'The goal must be above your current rank.')); return; }
      errorBox.hidden = true;
      var startsBelowMythic = !from.mythic;
      var placementOpen = startsBelowMythic || (from.key === 'mythic' && fromStars < 10 && !form.elements.placementDone.checked);
      var stars = end - start;
      var matches = estimate(start, end, winrate, placementOpen);
      out('stars').textContent = number(stars);
      if (matches === null) {
        out('matches').textContent = text('нет прогресса', 'no progress');
        out('days').textContent = '—';
      } else {
        var rounded = Math.max(1, Math.round(matches));
        out('matches').textContent = '~' + number(rounded);
        var days = Math.max(1, Math.ceil(matches / perDay));
        out('days').textContent = '~' + number(days);
      }
      var price = localPrice(start, end, prices, type);
      out('price').textContent = price ? text('от ', 'from ') + number(price) + ' ₽' : '—';
      var notes = [];
      if (matches === null) notes.push(text('При таком проценте побед звёзды почти не растут: поражения съедают победы.', 'At this win rate stars barely grow: losses cancel the wins.'));
      else notes.push(text('Оценка при ' + Math.round(winrate * 100) + '% побед и ' + perDay + ' ' + plural(perDay, 'матче', 'матчах', 'матчах') + ' в день.', 'Estimate at a ' + Math.round(winrate * 100) + '% win rate and ' + perDay + ' matches a day.'));
      if (placementOpen && end > BEFORE_MYTHIC + 1 && start < BEFORE_MYTHIC + 11) notes.push(text('Учтена калибровка Мифика: первые 10 звёзд — двойными победами.', 'Mythic placement is included: the first 10 stars come from double wins.'));
      if (from.key === 'warrior' || from.key === 'elite' || from.key === 'master' || from.key === 'grandmaster') notes.push(text('Ниже Эпика звёзды теряются реже, реальный путь обычно короче.', 'Below Epic stars are lost less often, so the real road is usually shorter.'));
      notes.push(text('Цена — по базовому тарифу без скидки; точную сумму с калибровкой и скидкой покажет калькулятор.', 'The price uses the base rate before discounts; the calculator shows the exact total with placement and discounts.'));
      out('note').textContent = notes.join(' ');
      out('order').href = orderLink(from, fromStars, to, toStars, type);
      result.hidden = false;

      // Refine with the live public API when it answers; the local snapshot stays as a fallback.
      var revision = ++request;
      if (!window.fetch || placementOpen && to.mythic && end > BEFORE_MYTHIC + 1) return;
      fetch(API, {
        method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rank_from: apiRankString(from, fromStars), rank_to: apiRankString(to, toStars), boost_type: type, weak_account_markup: 0, calibration: null })
      }).then(function (response) { return response.ok ? response.json() : null; }).then(function (data) {
        if (revision !== request || !data || !data.success || !Number.isFinite(data.total)) return;
        out('price').textContent = text('от ', 'from ') + number(Math.round(data.total)) + ' ₽';
      }).catch(function () {});
    }

    var used = false;
    function markUsed() { if (!used) { used = true; goal('rank_tool_used'); } }
    out('order').addEventListener('click', function () { goal('rank_tool_calculator'); });
    root.querySelector('.rank-tool-actions a[href^="https://t.me/"]').addEventListener('click', function () { goal('rank_tool_telegram'); });
    form.addEventListener('change', markUsed);
    form.addEventListener('change', function (event) {
      if (event.target === form.elements.from) syncStars('from');
      if (event.target === form.elements.to) syncStars('to');
      render();
    });
    form.addEventListener('input', function (event) {
      if (event.target === form.elements.wr || event.target === form.elements.perDay) render();
    });
    form.addEventListener('submit', function (event) { event.preventDefault(); render(); });
    syncStars('from');
    syncStars('to');
    render();
  }

  function start() {
    var root = document.getElementById('rank-tool');
    if (root) init(root);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
