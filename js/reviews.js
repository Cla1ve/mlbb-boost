/**
 * MLBB Boost — Reviews Module v3.0
 * ------------------------------------------------------------
 * Живые отзывы из API (GET /reviews). Заменяет старые статичные отзывы.
 *
 * Возможности:
 *  - Подгрузка всех опубликованных отзывов постранично (limit/offset).
 *  - Динамическая карточка под каждый тип буста (standard/role/hero/party/rising_*).
 *  - Фильтры: по оценке (звёздам) и по типу буста. Сортировка по новизне.
 *  - Кнопка «Открыть отзыв» -> прямая ссылка на пост в Telegram (message_link).
 *  - Авто-обновление: периодический опрос, новые отзывы подмешиваются сверху.
 *  - Кэш в localStorage (мгновенный повторный визит) + фоновое обновление.
 *  - Совместимость с i18n: ранги переводятся паттернами, имена — транслитом.
 *
 * Работает на статике (GitHub Pages) — только чтение API, без бэкенда.
 */
(function () {
  'use strict';

  /* ============================================================
   * Конфигурация
   * ============================================================ */
  var API_BASE_HTTP = 'http://cla1veisapi.ru';
  var API_BASE_HTTPS = 'https://cla1veisapi.ru';

  function apiBase() {
    return window.location.protocol === 'https:' ? API_BASE_HTTPS : API_BASE_HTTP;
  }
  function reviewsUrl(limit, offset) {
    return apiBase() + '/reviews?limit=' + limit + '&offset=' + offset;
  }

  var PAGE_SIZE = 100;          // размер страницы при выгрузке (API: 1..100)
  var INITIAL_VISIBLE = 9;      // сколько карточек показать сразу
  var STEP_VISIBLE = 9;         // шаг кнопки «Показать ещё»
  var POLL_INTERVAL = 60000;    // авто-обновление: 60 c (API кэш ~30 c, лимит 60/мин)
  var REQUEST_TIMEOUT = 12000;  // таймаут запроса
  var PAGE_DELAY = 160;         // пауза между фоновыми страницами, мс
  var CACHE_KEY = 'mlbb_reviews_cache_v1';
  var CACHE_TTL = 5 * 60 * 1000; // 5 минут

  /* ============================================================
   * Метаданные типов буста (иконка + локализуемый ярлык RU)
   * EN-перевод ярлыков добавлен в js/i18n-reviews.js
   * ============================================================ */
  var BOOST_META = {
    standard:     { icon: 'fa-bolt',            label: 'Стандартный буст', cls: 'boost-standard' },
    role:         { icon: 'fa-shield-halved',   label: 'Буст на роли',     cls: 'boost-role' },
    hero:         { icon: 'fa-khanda',          label: 'Буст на герое',    cls: 'boost-hero' },
    party:        { icon: 'fa-users',           label: 'Буст в пати',      cls: 'boost-party' },
    rising_login: { icon: 'fa-arrow-trend-up',  label: 'Rising: вход',     cls: 'boost-rising' },
    rising_party: { icon: 'fa-arrow-trend-up',  label: 'Rising: пати',     cls: 'boost-rising' }
  };

  function boostMeta(type) {
    return (type && BOOST_META[type]) ? BOOST_META[type] : null;
  }

  /* ============================================================
   * Состояние
   * ============================================================ */
  var state = {
    all: [],                 // накопленные отзывы (уникальные по id)
    ids: Object.create(null),// id -> true
    total: null,             // pagination.total
    visible: INITIAL_VISIBLE,
    filterRating: 'all',     // 'all' | '5' | '4' | '3'
    filterBoost: 'all',      // 'all' | ключ типа буста
    loadingAll: false,
    loadedAll: false,
    failed: false,
    firstPainted: false,
    pollTimer: null,
    newCount: 0              // новые отзывы, появившиеся при опросе
  };

  /* ============================================================
   * DOM
   * ============================================================ */
  var container, ratingFilters, boostFilters, loadMoreWrap, loadMoreBtn,
      newPill, statCount, statRating;

  /* ============================================================
   * Утилиты
   * ============================================================ */
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function parseDate(s) {
    if (!s) return null;
    // "YYYY-MM-DD HH:MM:SS" -> ISO для Safari
    var d = new Date(String(s).replace(' ', 'T'));
    return isNaN(d.getTime()) ? null : d;
  }

  function formatDate(s) {
    var d = parseDate(s);
    if (!d) return '';
    try {
      return d.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return d.toISOString().slice(0, 10);
    }
  }

  // Ключ сортировки: новые сверху (published_at, затем created_at).
  function sortKey(r) {
    var d = parseDate(r.published_at) || parseDate(r.created_at);
    return d ? d.getTime() : 0;
  }

  function sortNewestFirst(list) {
    list.sort(function (a, b) {
      var diff = sortKey(b) - sortKey(a);
      if (diff !== 0) return diff;
      return (b.id || 0) - (a.id || 0);
    });
    return list;
  }

  function gradientFor(seed) {
    var str = String(seed || '');
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
    var h2 = (h + 40) % 360;
    return 'linear-gradient(135deg, hsl(' + h + ',70%,45%), hsl(' + h2 + ',75%,38%))';
  }

  function initials(name) {
    var n = (name || '').trim();
    if (!n) return '?';
    var ch = n.charAt(0);
    return ch.toUpperCase();
  }

  /* ============================================================
   * Слияние отзывов (уникальность по id, сортировка по новизне)
   * ============================================================ */
  function merge(list) {
    var added = 0;
    if (!Array.isArray(list)) return 0;
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (!r || r.id == null) continue;
      if (state.ids[r.id]) continue;
      state.ids[r.id] = true;
      state.all.push(r);
      added++;
    }
    if (added) sortNewestFirst(state.all);
    return added;
  }

  /* ============================================================
   * Сеть
   * ============================================================ */
  function fetchPage(limit, offset) {
    var controller = new AbortController();
    var t = setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT);
    return fetch(reviewsUrl(limit, offset), {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      clearTimeout(t);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (json) {
      if (!json || json.success !== true || !Array.isArray(json.data)) {
        throw new Error('bad payload');
      }
      return json;
    });
  }

  /* ============================================================
   * Кэш
   * ============================================================ */
  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || !Array.isArray(obj.data)) return null;
      return obj;
    } catch (e) { return null; }
  }

  function writeCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: state.all,
        total: state.total,
        timestamp: Date.now()
      }));
    } catch (e) {}
  }

  /* ============================================================
   * Построение карточки
   * ============================================================ */
  function buildStars(rating) {
    var r = Math.max(0, Math.min(5, parseInt(rating, 10) || 0));
    var wrap = el('div', 'rc-rating');
    wrap.setAttribute('title', r + '/5');
    wrap.setAttribute('aria-label', r + ' / 5');
    var full = el('span', 'rc-stars-full', '★★★★★'.slice(0, r));
    var empty = el('span', 'rc-stars-empty', '★★★★★'.slice(0, 5 - r));
    wrap.appendChild(full);
    wrap.appendChild(empty);
    return wrap;
  }

  function buildChip(iconCls, labelText, valueText) {
    var chip = el('span', 'rc-chip');
    var icon = document.createElement('i');
    icon.className = 'fas ' + iconCls;
    chip.appendChild(icon);
    if (labelText) {
      chip.appendChild(el('span', 'rc-chip-label', labelText));
    }
    chip.appendChild(document.createTextNode(' ' + valueText));
    return chip;
  }

  function createCard(r) {
    var card = el('article', 'review-card rc-reveal');
    card.setAttribute('data-id', r.id);
    card.setAttribute('data-rating', r.rating != null ? r.rating : '');
    card.setAttribute('data-boost', r.boost_type || '');

    /* --- шапка: бустер + оценка --- */
    var top = el('div', 'rc-top');

    var user = el('div', 'rc-user');
    var avatar = el('div', 'rc-avatar');
    avatar.style.background = gradientFor(r.booster && (r.booster.ref || r.booster.name));
    avatar.appendChild(el('span', null, initials(r.booster && r.booster.name)));
    user.appendChild(avatar);

    var meta = el('div', 'rc-user-meta');
    meta.appendChild(el('h4', 'reviewer-name', (r.booster && r.booster.name) || 'Booster'));
    var sub = el('div', 'rc-sub');
    var tag = el('span', 'rc-booster-tag');
    var tagIcon = document.createElement('i');
    tagIcon.className = 'fas fa-headset';
    tag.appendChild(tagIcon);
    tag.appendChild(el('span', null, 'Бустер'));
    sub.appendChild(tag);
    if (r.post_no != null) {
      var pn = el('span', 'rc-postno');
      var hi = document.createElement('i');
      hi.className = 'fas fa-hashtag';
      pn.appendChild(hi);
      pn.appendChild(document.createTextNode(String(r.post_no)));
      sub.appendChild(pn);
    }
    meta.appendChild(sub);
    user.appendChild(meta);
    top.appendChild(user);

    top.appendChild(buildStars(r.rating));
    card.appendChild(top);

    /* --- бейдж типа буста --- */
    var bm = boostMeta(r.boost_type);
    if (bm || r.boost_type_name) {
      var badge = el('div', 'rc-boost-badge ' + (bm ? bm.cls : 'boost-standard'));
      var bIcon = document.createElement('i');
      bIcon.className = 'fas ' + (bm ? bm.icon : 'fa-bolt');
      badge.appendChild(bIcon);
      badge.appendChild(el('span', null, bm ? bm.label : r.boost_type_name));
      card.appendChild(badge);
    }

    /* --- маршрут рангов (нет у legacy) --- */
    if (!r.is_legacy && (r.rank_from || r.rank_to)) {
      var rank = el('div', 'rc-rank');
      rank.appendChild(el('span', 'rc-rank-from', r.rank_from || '—'));
      var arrow = document.createElement('i');
      arrow.className = 'fas fa-arrow-right-long';
      rank.appendChild(arrow);
      rank.appendChild(el('span', 'rc-rank-to', r.rank_to || '—'));
      card.appendChild(rank);
    }

    /* --- доп. чипы: герой / роль / срок --- */
    var chips = el('div', 'rc-chips');
    var hasChip = false;
    if (r.hero) { chips.appendChild(buildChip('fa-user-ninja', 'Герой:', r.hero)); hasChip = true; }
    if (r.role) { chips.appendChild(buildChip('fa-chess-knight', 'Роль:', r.role)); hasChip = true; }
    if (r.duration) { chips.appendChild(buildChip('fa-clock', null, r.duration)); hasChip = true; }
    if (hasChip) card.appendChild(chips);

    /* --- текст отзыва --- */
    var content = el('div', 'rc-content');
    if (r.text && String(r.text).trim()) {
      content.appendChild(el('p', 'rc-text', r.text));
    } else {
      content.appendChild(el('p', 'rc-text rc-text--empty', 'Без комментария'));
    }
    card.appendChild(content);

    /* --- футер: дата + кнопка в Telegram --- */
    var foot = el('div', 'rc-foot');
    var date = el('span', 'rc-date');
    var cIcon = document.createElement('i');
    cIcon.className = 'far fa-calendar';
    date.appendChild(cIcon);
    date.appendChild(document.createTextNode(' ' + (formatDate(r.published_at || r.created_at) || '')));
    foot.appendChild(date);

    if (r.message_link) {
      var btn = document.createElement('a');
      btn.className = 'rc-tg-btn';
      btn.href = r.message_link;
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      var tgIcon = document.createElement('i');
      tgIcon.className = 'fab fa-telegram';
      btn.appendChild(tgIcon);
      btn.appendChild(el('span', null, 'Открыть отзыв'));
      foot.appendChild(btn);
    }
    card.appendChild(foot);

    return card;
  }

  /* ============================================================
   * Скелетоны / состояния
   * ============================================================ */
  function renderSkeletons(n) {
    container.innerHTML = '';
    if (loadMoreWrap) loadMoreWrap.style.display = 'none';
    for (var i = 0; i < n; i++) {
      var sk = el('div', 'review-card skeleton-card');
      sk.innerHTML =
        '<div class="sk-top"><div class="sk-avatar"></div>' +
        '<div class="sk-lines"><span class="sk-line w60"></span><span class="sk-line w40"></span></div></div>' +
        '<div class="sk-badge"></div>' +
        '<div class="sk-line w90"></div><div class="sk-line w80"></div><div class="sk-line w50"></div>' +
        '<div class="sk-foot"></div>';
      container.appendChild(sk);
    }
  }

  function renderMessage(iconCls, title, desc, withRetry) {
    container.innerHTML = '';
    if (loadMoreWrap) loadMoreWrap.style.display = 'none';
    var box = el('div', 'reviews-message');
    var icon = document.createElement('i');
    icon.className = iconCls;
    box.appendChild(icon);
    box.appendChild(el('h3', null, title));
    if (desc) box.appendChild(el('p', null, desc));
    if (withRetry) {
      var btn = el('button', 'reviews-retry-btn', 'Повторить');
      btn.addEventListener('click', function () { boot(true); });
      box.appendChild(btn);
    }
    container.appendChild(box);
  }

  /* ============================================================
   * Фильтрация
   * ============================================================ */
  function getFiltered() {
    return state.all.filter(function (r) {
      if (state.filterRating !== 'all') {
        var min = parseInt(state.filterRating, 10);
        var rt = r.rating == null ? -1 : r.rating;
        if (state.filterRating === '5') { if (rt !== 5) return false; }
        else if (rt < min) return false;
      }
      if (state.filterBoost !== 'all') {
        if ((r.boost_type || '') !== state.filterBoost) return false;
      }
      return true;
    });
  }

  /* ============================================================
   * Отрисовка
   * ============================================================ */
  var io = null;
  function ensureObserver() {
    if (io || !('IntersectionObserver' in window)) return;
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
  }

  function render() {
    if (state.failed && !state.all.length) return;

    var filtered = getFiltered();

    if (!filtered.length) {
      if (state.loadingAll && !state.loadedAll) {
        renderSkeletons(INITIAL_VISIBLE);
      } else {
        renderMessage('fas fa-filter', 'Ничего не найдено',
          'Под выбранные фильтры пока нет отзывов. Попробуйте смягчить условия.', false);
      }
      return;
    }

    var slice = filtered.slice(0, state.visible);
    container.innerHTML = '';
    ensureObserver();

    var frag = document.createDocumentFragment();
    slice.forEach(function (r, idx) {
      var card = createCard(r);
      card.style.setProperty('--rc-delay', (idx % STEP_VISIBLE) * 0.05 + 's');
      frag.appendChild(card);
    });
    container.appendChild(frag);

    if (io) {
      container.querySelectorAll('.review-card.rc-reveal').forEach(function (c) { io.observe(c); });
    } else {
      container.querySelectorAll('.review-card.rc-reveal').forEach(function (c) { c.classList.add('visible'); });
    }

    // Кнопка «Показать ещё»
    if (loadMoreWrap) {
      if (state.visible < filtered.length) {
        loadMoreWrap.style.display = '';
        if (loadMoreBtn) loadMoreBtn.disabled = false;
      } else {
        loadMoreWrap.style.display = 'none';
      }
    }

    updateStats();
    state.firstPainted = true;
  }

  function updateLoadMore() {
    if (!loadMoreWrap) return;
    var n = getFiltered().length;
    if (state.visible < n) {
      loadMoreWrap.style.display = '';
      if (loadMoreBtn) loadMoreBtn.disabled = false;
    } else {
      loadMoreWrap.style.display = 'none';
    }
  }

  function updateStats() {
    if (statCount) {
      var total = state.total != null ? state.total : state.all.length;
      statCount.textContent = total + (state.loadedAll || state.total == null ? '' : '+');
    }
    if (statRating && state.all.length) {
      var sum = 0, cnt = 0;
      for (var i = 0; i < state.all.length; i++) {
        if (state.all[i].rating != null) { sum += state.all[i].rating; cnt++; }
      }
      if (cnt) statRating.textContent = (sum / cnt).toFixed(1);
    }
  }

  /* ============================================================
   * Фильтры буста (генерим чипы по присутствующим типам)
   * ============================================================ */
  function rebuildBoostFilters() {
    if (!boostFilters) return;
    var present = Object.create(null);
    state.all.forEach(function (r) { if (r.boost_type) present[r.boost_type] = true; });
    var types = Object.keys(present);

    // Если типов нет вовсе — прячем строку фильтра по типу.
    if (!types.length) { boostFilters.style.display = 'none'; return; }
    boostFilters.style.display = '';

    // не пересобираем, если набор не изменился
    var signature = 'all|' + types.sort().join('|');
    if (boostFilters.getAttribute('data-sig') === signature) return;
    boostFilters.setAttribute('data-sig', signature);

    boostFilters.innerHTML = '';
    var mk = function (value, iconCls, label) {
      var b = el('button', 'filter-btn' + (value === state.filterBoost ? ' active' : ''));
      b.setAttribute('data-boost', value);
      if (iconCls) {
        var i = document.createElement('i');
        i.className = 'fas ' + iconCls;
        b.appendChild(i);
        b.appendChild(document.createTextNode(' '));
      }
      b.appendChild(el('span', null, label));
      b.addEventListener('click', function () {
        state.filterBoost = value;
        state.visible = INITIAL_VISIBLE;
        Array.prototype.forEach.call(boostFilters.children, function (c) {
          c.classList.toggle('active', c.getAttribute('data-boost') === value);
        });
        render();
      });
      return b;
    };

    boostFilters.appendChild(mk('all', 'fa-layer-group', 'Все типы'));
    types.forEach(function (t) {
      var m = boostMeta(t);
      boostFilters.appendChild(mk(t, m ? m.icon : 'fa-bolt', m ? m.label : t));
    });
  }

  /* ============================================================
   * Авто-обновление (опрос новых отзывов)
   * ============================================================ */
  function startPolling() {
    if (state.pollTimer) return;
    state.pollTimer = setInterval(function () {
      if (document.hidden) return;
      fetchPage(20, 0).then(function (json) {
        if (json.pagination && typeof json.pagination.total === 'number') {
          state.total = json.pagination.total;
        }
        var added = merge(json.data);
        if (added > 0) {
          state.newCount += added;
          showNewPill();
          // Если пользователь смотрит «все» сверху — мягко докинем количество.
          rebuildBoostFilters();
          updateStats();
        }
      }).catch(function () { /* тихо игнорируем сбой опроса */ });
    }, POLL_INTERVAL);
  }

  function currentLang() {
    try { return (window.MLBBi18n && window.MLBBi18n.get()) || 'ru'; }
    catch (e) { return 'ru'; }
  }

  function showNewPill() {
    if (!newPill) return;
    var n = state.newCount, text;
    if (currentLang() === 'en') {
      text = n + (n === 1 ? ' new review' : ' new reviews') + ' available';
    } else {
      // 1 отзыв, 2-4 отзыва, 5+ отзывов (рус. склонение)
      var word;
      var mod10 = n % 10, mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) word = 'новый отзыв';
      else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = 'новых отзыва';
      else word = 'новых отзывов';
      text = 'Появилось ' + n + ' ' + word;
    }
    newPill.querySelector('.new-pill-text').textContent = text;
    newPill.classList.add('show');
  }

  function applyNewReviews() {
    state.newCount = 0;
    if (newPill) newPill.classList.remove('show');
    state.visible = INITIAL_VISIBLE;
    state.filterRating = 'all';
    state.filterBoost = 'all';
    syncFilterButtons();
    render();
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function syncFilterButtons() {
    if (ratingFilters) {
      Array.prototype.forEach.call(ratingFilters.querySelectorAll('.filter-btn'), function (b) {
        b.classList.toggle('active', b.getAttribute('data-rating') === state.filterRating);
      });
    }
    if (boostFilters) {
      Array.prototype.forEach.call(boostFilters.children, function (c) {
        c.classList.toggle('active', c.getAttribute('data-boost') === state.filterBoost);
      });
    }
  }

  /* ============================================================
   * Загрузка всех страниц
   * ============================================================ */
  function loadAllPages(startOffset) {
    if (state.loadingAll) return;
    state.loadingAll = true;

    var offset = startOffset || 0;

    function step() {
      fetchPage(PAGE_SIZE, offset).then(function (json) {
        if (json.pagination && typeof json.pagination.total === 'number') {
          state.total = json.pagination.total;
        }
        merge(json.data);
        rebuildBoostFilters();
        // Первая страница рисует карточки; последующие тихо растят датасет,
        // чтобы не пере-анимировать уже показанные карточки.
        if (!state.firstPainted) {
          render();
        } else {
          updateStats();
          updateLoadMore();
        }

        var hasMore = json.pagination ? json.pagination.has_more : (json.data.length === PAGE_SIZE);
        offset += PAGE_SIZE;

        if (hasMore && json.data.length > 0) {
          setTimeout(step, PAGE_DELAY);
        } else {
          state.loadingAll = false;
          state.loadedAll = true;
          writeCache();
          updateStats();
          startPolling();
        }
      }).catch(function () {
        state.loadingAll = false;
        if (!state.all.length) {
          state.failed = true;
          renderMessage('fas fa-triangle-exclamation', 'Не удалось загрузить отзывы',
            'Проверьте соединение и попробуйте ещё раз.', true);
        } else {
          // часть данных есть — оставляем что загрузили, поднимем опрос
          state.loadedAll = true;
          writeCache();
          startPolling();
        }
      });
    }

    step();
  }

  /* ============================================================
   * Старт
   * ============================================================ */
  function bindFilters() {
    if (ratingFilters) {
      ratingFilters.addEventListener('click', function (e) {
        var btn = e.target.closest('.filter-btn');
        if (!btn) return;
        var val = btn.getAttribute('data-rating');
        if (val == null) return;
        state.filterRating = val;
        state.visible = INITIAL_VISIBLE;
        Array.prototype.forEach.call(ratingFilters.querySelectorAll('.filter-btn'), function (b) {
          b.classList.toggle('active', b === btn);
        });
        render();
      });
    }

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function () {
        state.visible += STEP_VISIBLE;
        render();
      });
    }

    if (newPill) {
      newPill.addEventListener('click', applyNewReviews);
    }
  }

  function boot(force) {
    state.failed = false;

    // 1) Кэш — мгновенный показ
    if (!force) {
      var cache = readCache();
      if (cache && cache.data.length) {
        merge(cache.data);
        if (typeof cache.total === 'number') state.total = cache.total;
        rebuildBoostFilters();
        render();
        var fresh = (Date.now() - (cache.timestamp || 0)) < CACHE_TTL;
        // Свежий кэш: только опрос новых. Иначе — полная фоновая перезагрузка.
        if (fresh) {
          startPolling();
          // лёгкая проверка новинок сразу
          fetchPage(20, 0).then(function (json) {
            if (json.pagination) state.total = json.pagination.total;
            var added = merge(json.data);
            if (added) {
              state.newCount += added;
              rebuildBoostFilters();
              updateStats();
              showNewPill();
              writeCache();
            }
          }).catch(function () {});
          return;
        }
        // Кэш устарел — перезагружаем и перерисовываем актуальные данные.
        state.firstPainted = false;
        loadAllPages(0);
        return;
      }
    }

    // 2) Нет кэша — скелетоны + полная загрузка
    renderSkeletons(INITIAL_VISIBLE);
    loadAllPages(0);
  }

  function init() {
    container = document.getElementById('reviews-container');
    if (!container) return;

    ratingFilters = document.getElementById('rating-filters');
    boostFilters = document.getElementById('boost-filters');
    loadMoreWrap = document.querySelector('.load-more');
    loadMoreBtn = document.getElementById('load-more-btn');
    newPill = document.getElementById('reviews-new-pill');
    statCount = document.getElementById('stat-reviews-count');
    statRating = document.getElementById('stat-reviews-rating');

    bindFilters();
    boot(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
