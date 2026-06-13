/**
 * MLBB Boost — Reviews Module v4.0
 * ------------------------------------------------------------
 * Живые отзывы из API (GET /reviews) — https://cla1veisapi.ru/reviews
 *
 * Возможности:
 *  - Выгружает ВСЕ опубликованные отзывы постранично (limit/offset, до конца).
 *  - Понятная карточка: явно показан БУСТЕР, оценка клиента и все параметры
 *    заказа (тип буста, ранги, герой, роли, срок, № заказа) — как в канале.
 *  - Фильтры: по оценке, по типу буста (стандартный/на роли/на герое/в пати/rising),
 *    по конкретному бустеру. Поиск по тексту/бустеру/герою/рангу/№. Сортировка.
 *  - Кнопка «Открыть отзыв» -> прямой пост в Telegram (message_link).
 *  - Авто-обновление: новые отзывы подмешиваются сверху (плашка).
 *  - Кэш в localStorage + фоновое обновление. Скелетоны и состояния.
 *  - Полностью двуязычный (RU/EN): реагирует на переключатель языка в шапке.
 *
 * Раздел сам управляет своим текстом (data-i18n-skip), чтобы локализация была
 * достоверной и не конфликтовала с глобальным i18n-движком.
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

  var PAGE_SIZE = 100;
  var INITIAL_VISIBLE = 9;
  var STEP_VISIBLE = 9;
  var POLL_INTERVAL = 60000;
  var REQUEST_TIMEOUT = 12000;
  var PAGE_DELAY = 140;
  var SEARCH_DEBOUNCE = 220;
  var CACHE_KEY = 'mlbb_reviews_cache_v2';
  var CACHE_TTL = 5 * 60 * 1000;
  var TG_CHANNEL = 'https://t.me/Cla1ve_boost';

  /* ============================================================
   * Двуязычные словари (источник правды для текста раздела)
   * ============================================================ */
  function L(key) {
    var d = LABELS[key];
    if (!d) return key;
    return d[state.lang] != null ? d[state.lang] : d.ru;
  }

  var LABELS = {
    searchPlaceholder: { ru: 'Поиск: бустер, герой, ранг, текст, № заказа…', en: 'Search: booster, hero, rank, text, order №…' },
    ratingLabel:    { ru: 'Оценка',        en: 'Rating' },
    boostTypeLabel: { ru: 'Тип буста',     en: 'Boost type' },
    boosterLabel:   { ru: 'Бустер',        en: 'Booster' },
    sortLabel:      { ru: 'Сортировка',    en: 'Sort' },
    all:            { ru: 'Все',           en: 'All' },
    allTypes:       { ru: 'Все типы',      en: 'All types' },
    allBoosters:    { ru: 'Все бустеры',   en: 'All boosters' },
    stars5:         { ru: '5 звёзд',       en: '5 stars' },
    stars4:         { ru: '4+ звезды',     en: '4+ stars' },
    stars3:         { ru: '3+ звезды',     en: '3+ stars' },
    sortNewest:     { ru: 'Сначала новые', en: 'Newest first' },
    sortOldest:     { ru: 'Сначала старые',en: 'Oldest first' },
    sortRating:     { ru: 'По оценке',     en: 'Highest rated' },
    routeFrom:      { ru: 'Старт',         en: 'From' },
    routeTo:        { ru: 'Цель',          en: 'To' },
    star1:          { ru: '1 звезда',      en: '1 star' },
    star2:          { ru: '2 звезды',      en: '2 stars' },
    star3:          { ru: '3 звезды',      en: '3 stars' },
    star4:          { ru: '4 звезды',      en: '4 stars' },
    star5:          { ru: '5 звёзд',       en: '5 stars' },
    verified:       { ru: 'Проверенный бустер', en: 'Verified booster' },
    boosterDid:     { ru: 'Выполнил заказ',     en: 'Completed the order' },
    clientRated:    { ru: 'Оценка клиента',     en: 'Client rating' },
    heroLabel:      { ru: 'Герой',         en: 'Hero' },
    roleLabel:      { ru: 'Роль',          en: 'Role' },
    clientRoleLabel:{ ru: 'Роль клиента',  en: 'Client role' },
    boosterRoleLabel:{ ru: 'Роль бустера', en: 'Booster role' },
    rankLabel:      { ru: 'Ранг',          en: 'Rank' },
    durationLabel:  { ru: 'Срок',          en: 'Duration' },
    orderLabel:     { ru: 'Заказ',         en: 'Order' },
    stageLabel:     { ru: 'Этап',          en: 'Stage' },
    winsLabel:      { ru: 'Нужно побед',   en: 'Wins required' },
    noComment:      { ru: 'Без комментария', en: 'No comment' },
    openReview:     { ru: 'Открыть отзыв', en: 'Open in Telegram' },
    showMore:       { ru: 'Показать ещё',  en: 'Show more' },
    nothingTitle:   { ru: 'Ничего не найдено', en: 'Nothing found' },
    nothingDesc:    { ru: 'Под выбранные условия отзывов нет. Сбросьте фильтры или измените запрос.', en: 'No reviews match the current filters. Reset filters or change your query.' },
    resetFilters:   { ru: 'Сбросить фильтры', en: 'Reset filters' },
    errorTitle:     { ru: 'Не удалось загрузить отзывы', en: 'Failed to load reviews' },
    errorDesc:      { ru: 'Проверьте соединение и попробуйте ещё раз.', en: 'Check your connection and try again.' },
    retry:          { ru: 'Повторить',     en: 'Retry' },
    tgReviews:      { ru: 'Отзывы в Telegram', en: 'Reviews on Telegram' },
    ratingShort:    { ru: 'Рейтинг',       en: 'Rating' }
  };

  // Типы буста: иконка + двуязычный ярлык
  var BOOST_META = {
    standard:     { icon: 'fa-bolt',           cls: 'boost-standard', ru: 'Стандартный', en: 'Standard' },
    role:         { icon: 'fa-shield-halved',  cls: 'boost-role',     ru: 'На роли',     en: 'Role' },
    hero:         { icon: 'fa-khanda',         cls: 'boost-hero',     ru: 'На герое',    en: 'On a hero' },
    party:        { icon: 'fa-users',          cls: 'boost-party',    ru: 'В пати',      en: 'In a party' },
    rising_login: { icon: 'fa-arrow-trend-up', cls: 'boost-rising',   ru: 'Rising: вход',en: 'Rising: login' },
    rising_party: { icon: 'fa-arrow-trend-up', cls: 'boost-rising',   ru: 'Rising: пати',en: 'Rising: party' }
  };
  // Канонический порядок типов в фильтре
  var BOOST_ORDER = ['standard', 'role', 'hero', 'party', 'rising_login', 'rising_party'];

  function boostMeta(type) { return (type && BOOST_META[type]) ? BOOST_META[type] : null; }
  function boostLabel(type, name) {
    var m = boostMeta(type);
    if (m) return m[state.lang] != null ? m[state.lang] : m.ru;
    return name || '';
  }

  // Роли по ключу (для client_role_key / booster_role_key)
  var ROLE_BY_KEY = {
    roamer:   { ru: 'Роумер',  en: 'Roamer' },
    mage:     { ru: 'Мидер',   en: 'Mid laner' },
    fighter:  { ru: 'Файтер',  en: 'Fighter' },
    marksman: { ru: 'Стрелок', en: 'Marksman' },
    jungler:  { ru: 'Лесник',  en: 'Jungler' },
    support:  { ru: 'Саппорт', en: 'Support' }
  };
  // Роли без ключа (preferred_role) — перевод по тексту
  var ROLE_RU2EN = {
    'Любая': 'Any', 'Любой': 'Any', 'Мидер': 'Mid laner', 'Мид': 'Mid laner',
    'Роумер': 'Roamer', 'Роум': 'Roamer', 'Стрелок': 'Marksman', 'Голд': 'Gold laner',
    'Голдер': 'Gold laner', 'Лесник': 'Jungler', 'Лес': 'Jungler', 'Файтер': 'Fighter',
    'Эксп': 'EXP laner', 'Эксперт': 'EXP laner', 'Саппорт': 'Support', 'Танк': 'Tank'
  };

  function localizeRole(text, key) {
    if (state.lang !== 'en') return text || '';
    if (key && ROLE_BY_KEY[key]) return ROLE_BY_KEY[key].en;
    if (text && ROLE_RU2EN[text.trim()]) return ROLE_RU2EN[text.trim()];
    return text || '';
  }

  // Перевод рангов на EN (тексты вида "Мифическая слава, 90⭐")
  var RANK_REPL = [
    [/Мифический\s+бессмертный/gi, 'Mythic Immortal'],
    [/Мифическая\s+слава/gi, 'Mythic Glory'],
    [/Мифическая\s+честь/gi, 'Mythic Honor'],
    [/Мифик/gi, 'Mythic'],
    [/Грандмастер/gi, 'Grandmaster'],
    [/Легенда/gi, 'Legend'],
    [/Эпик/gi, 'Epic'],
    [/Мастер/gi, 'Master'],
    [/Элита/gi, 'Elite'],
    [/Воин/gi, 'Warrior']
  ];
  function localizeRank(text) {
    if (!text) return '';
    if (state.lang !== 'en') return text;
    var out = text;
    for (var i = 0; i < RANK_REPL.length; i++) out = out.replace(RANK_REPL[i][0], RANK_REPL[i][1]);
    return out;
  }

  // Локализация срока: "2д 21ч 58м после оплаты" -> "2d 21h 58m after payment"
  function localizeDuration(text) {
    if (!text) return '';
    if (state.lang !== 'en') return text;
    return text
      .replace(/после\s+оплаты/gi, 'after payment')
      .replace(/(\d+)\s*д/gi, '$1d')
      .replace(/(\d+)\s*ч/gi, '$1h')
      .replace(/(\d+)\s*м/gi, '$1m');
  }

  /* ============================================================
   * Состояние
   * ============================================================ */
  var state = {
    lang: 'ru',
    all: [],
    ids: Object.create(null),
    total: null,
    visible: INITIAL_VISIBLE,
    filterRating: 'all',
    filterBoost: 'all',
    filterBooster: 'all',     // ref бустера
    search: '',
    sort: 'newest',           // newest | oldest | rating
    loadingAll: false,
    loadedAll: false,
    failed: false,
    firstPainted: false,
    pollTimer: null,
    searchTimer: null,
    newCount: 0
  };

  function getLang() {
    try { return (window.MLBBi18n && window.MLBBi18n.get && window.MLBBi18n.get()) || 'ru'; }
    catch (e) { return 'ru'; }
  }

  /* ============================================================
   * DOM
   * ============================================================ */
  var container, ratingFilters, boostFilters, boosterSelect, sortSelect,
      searchInput, searchClear, metaLine, loadMoreWrap, loadMoreBtn,
      newPill, statCount, statRating, statHappy, bannerCount;

  /* ============================================================
   * Утилиты
   * ============================================================ */
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function icon(cls) { var i = document.createElement('i'); i.className = cls; return i; }

  function parseDate(s) {
    if (!s) return null;
    var d = new Date(String(s).replace(' ', 'T'));
    return isNaN(d.getTime()) ? null : d;
  }
  function formatDate(s) {
    var d = parseDate(s);
    if (!d) return '';
    try {
      return d.toLocaleDateString(state.lang === 'en' ? 'en-GB' : 'ru-RU',
        { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return d.toISOString().slice(0, 10); }
  }
  function timeKey(r) {
    var d = parseDate(r.published_at) || parseDate(r.created_at);
    return d ? d.getTime() : 0;
  }
  function sortNewestFirst(list) {
    list.sort(function (a, b) {
      var diff = timeKey(b) - timeKey(a);
      return diff !== 0 ? diff : (b.id || 0) - (a.id || 0);
    });
    return list;
  }
  function gradientFor(seed) {
    var str = String(seed || ''), h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
    return 'linear-gradient(135deg, hsl(' + h + ',70%,46%), hsl(' + ((h + 42) % 360) + ',72%,38%))';
  }
  function initials(name) {
    var n = (name || '').trim();
    return n ? n.charAt(0).toUpperCase() : '?';
  }
  // нормализация для поиска (без регистра, без ⭐ и лишних пробелов)
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/⭐/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /* ============================================================
   * Слияние / сеть / кэш
   * ============================================================ */
  function merge(list) {
    var added = 0;
    if (!Array.isArray(list)) return 0;
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (!r || r.id == null || state.ids[r.id]) continue;
      state.ids[r.id] = true;
      // предвычислим строку для поиска
      r.__search = norm([
        r.text, r.booster && r.booster.name, r.hero, r.rank_from, r.rank_to,
        r.preferred_role, r.client_role, r.booster_role, r.boost_type_name,
        r.order_short, r.post_no != null ? ('№' + r.post_no + ' ' + r.post_no) : ''
      ].join(' '));
      state.all.push(r);
      added++;
    }
    if (added) sortNewestFirst(state.all);
    return added;
  }

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
      if (!json || json.success !== true || !Array.isArray(json.data)) throw new Error('bad payload');
      return json;
    });
  }

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
        data: state.all, total: state.total, timestamp: Date.now()
      }));
    } catch (e) {}
  }

  /* ============================================================
   * Параметры буста в карточке
   * ============================================================ */
  function paramRow(iconCls, label, value) {
    var row = el('div', 'rc-param');
    row.appendChild(icon('fas ' + iconCls));
    var body = el('div', 'rc-param-body');
    body.appendChild(el('span', 'rc-param-label', label));
    body.appendChild(el('span', 'rc-param-value', value));
    row.appendChild(body);
    return row;
  }

  function buildParams(r) {
    var box = el('div', 'rc-params');
    var any = false;

    // Rising
    if (r.rising) {
      var stage = r.rising.stage_name || r.rising.stage;
      if (stage != null) { box.appendChild(paramRow('fa-arrow-trend-up', L('stageLabel'), String(stage))); any = true; }
      if (r.rising.wins_required != null) {
        box.appendChild(paramRow('fa-trophy', L('winsLabel'), String(r.rising.wins_required))); any = true;
      }
    }

    // Герой ИЛИ роли (логика канала)
    if (r.hero) {
      box.appendChild(paramRow('fa-user-ninja', L('heroLabel'), r.hero)); any = true;
    } else {
      if (r.preferred_role) { box.appendChild(paramRow('fa-compass', L('roleLabel'), localizeRole(r.preferred_role))); any = true; }
      if (r.client_role)    { box.appendChild(paramRow('fa-user', L('clientRoleLabel'), localizeRole(r.client_role, r.client_role_key))); any = true; }
      if (r.booster_role)   { box.appendChild(paramRow('fa-headset', L('boosterRoleLabel'), localizeRole(r.booster_role, r.booster_role_key))); any = true; }
    }

    // Срок
    if (r.duration) { box.appendChild(paramRow('fa-clock', L('durationLabel'), localizeDuration(r.duration))); any = true; }

    return any ? box : null;
  }

  // Заметный блок «Старт -> Цель»
  function buildRoute(r) {
    if (r.is_legacy || (!r.rank_from && !r.rank_to)) return null;
    var route = el('div', 'rc-route');

    var from = el('div', 'rc-route-col');
    from.appendChild(el('span', 'rc-route-cap', L('routeFrom')));
    from.appendChild(el('span', 'rc-route-rank', localizeRank(r.rank_from) || '—'));
    route.appendChild(from);

    var arrow = el('div', 'rc-route-arrow');
    arrow.appendChild(icon('fas fa-arrow-right-long'));
    route.appendChild(arrow);

    var to = el('div', 'rc-route-col rc-route-col--to');
    to.appendChild(el('span', 'rc-route-cap', L('routeTo')));
    to.appendChild(el('span', 'rc-route-rank', localizeRank(r.rank_to) || '—'));
    route.appendChild(to);

    return route;
  }

  function buildStars(rating) {
    var r = Math.max(0, Math.min(5, parseInt(rating, 10) || 0));
    var wrap = el('div', 'rc-rating');
    wrap.setAttribute('title', r + '/5');
    wrap.appendChild(el('span', 'rc-stars-full', '★★★★★'.slice(0, r)));
    wrap.appendChild(el('span', 'rc-stars-empty', '★★★★★'.slice(0, 5 - r)));
    return wrap;
  }

  function createCard(r) {
    var card = el('article', 'review-card rc-reveal');
    card.setAttribute('data-id', r.id);

    /* --- Шапка: явно БУСТЕР + оценка --- */
    var head = el('div', 'rc-head');

    var booster = el('div', 'rc-booster');
    var avatar = el('div', 'rc-avatar');
    avatar.style.background = gradientFor(r.booster && (r.booster.ref || r.booster.name));
    avatar.appendChild(el('span', null, initials(r.booster && r.booster.name)));
    var check = el('span', 'rc-avatar-check');
    check.appendChild(icon('fas fa-check'));
    avatar.appendChild(check);
    booster.appendChild(avatar);

    var bmeta = el('div', 'rc-booster-meta');
    var roleTag = el('span', 'rc-role-tag');
    roleTag.appendChild(icon('fas fa-headset'));
    roleTag.appendChild(el('span', null, L('boosterLabel')));
    bmeta.appendChild(roleTag);
    bmeta.appendChild(el('h4', 'reviewer-name', (r.booster && r.booster.name) || 'Booster'));
    var sub = el('div', 'rc-booster-sub');
    sub.appendChild(icon('fas fa-circle-check'));
    sub.appendChild(el('span', null, L('verified')));
    bmeta.appendChild(sub);
    booster.appendChild(bmeta);
    head.appendChild(booster);

    var ratingWrap = el('div', 'rc-rating-wrap');
    ratingWrap.appendChild(buildStars(r.rating));
    ratingWrap.appendChild(el('span', 'rc-rating-cap', L('clientRated')));
    head.appendChild(ratingWrap);

    card.appendChild(head);

    /* --- Бейдж типа буста --- */
    if (r.boost_type || r.boost_type_name) {
      var bm = boostMeta(r.boost_type);
      var badge = el('div', 'rc-boost-badge ' + (bm ? bm.cls : 'boost-standard'));
      badge.appendChild(icon('fas ' + (bm ? bm.icon : 'fa-bolt')));
      badge.appendChild(el('span', null, boostLabel(r.boost_type, r.boost_type_name)));
      if (r.post_no != null) {
        var pn = el('span', 'rc-postno');
        pn.appendChild(document.createTextNode('№' + r.post_no));
        badge.appendChild(pn);
      }
      card.appendChild(badge);
    }

    /* --- Заметный маршрут Старт -> Цель --- */
    var route = buildRoute(r);
    if (route) card.appendChild(route);

    /* --- Текст отзыва клиента --- */
    var content = el('div', 'rc-content');
    var quote = icon('fas fa-quote-left rc-quote');
    content.appendChild(quote);
    if (r.text && String(r.text).trim()) {
      content.appendChild(el('p', 'rc-text', r.text));
    } else {
      content.appendChild(el('p', 'rc-text rc-text--empty', L('noComment')));
    }
    card.appendChild(content);

    /* --- Параметры заказа --- */
    var params = buildParams(r);
    if (params) card.appendChild(params);

    /* --- Футер: дата/№заказа + кнопка в Telegram --- */
    var foot = el('div', 'rc-foot');
    var info = el('div', 'rc-foot-info');
    var date = el('span', 'rc-date');
    date.appendChild(icon('far fa-calendar'));
    date.appendChild(document.createTextNode(' ' + (formatDate(r.published_at || r.created_at) || '')));
    info.appendChild(date);
    if (r.order_short) {
      var ord = el('span', 'rc-order');
      ord.appendChild(icon('fas fa-receipt'));
      ord.appendChild(document.createTextNode(' ' + L('orderLabel') + ' ' + r.order_short));
      info.appendChild(ord);
    }
    foot.appendChild(info);

    if (r.message_link) {
      var btn = document.createElement('a');
      btn.className = 'rc-tg-btn';
      btn.href = r.message_link;
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      btn.appendChild(icon('fab fa-telegram'));
      btn.appendChild(el('span', null, L('openReview')));
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

  function renderMessage(iconCls, title, desc, mode) {
    container.innerHTML = '';
    if (loadMoreWrap) loadMoreWrap.style.display = 'none';
    if (metaLine) metaLine.textContent = '';
    var box = el('div', 'reviews-message');
    box.appendChild(icon(iconCls));
    box.appendChild(el('h3', null, title));
    if (desc) box.appendChild(el('p', null, desc));

    var actions = el('div', 'reviews-message-actions');
    if (mode === 'error') {
      var retry = el('button', 'reviews-retry-btn', L('retry'));
      retry.addEventListener('click', function () { boot(true); });
      actions.appendChild(retry);
      var tg = document.createElement('a');
      tg.className = 'reviews-tg-link';
      tg.href = TG_CHANNEL; tg.target = '_blank'; tg.rel = 'noopener noreferrer';
      tg.appendChild(icon('fab fa-telegram'));
      tg.appendChild(el('span', null, L('tgReviews')));
      actions.appendChild(tg);
    } else if (mode === 'empty') {
      var reset = el('button', 'reviews-retry-btn', L('resetFilters'));
      reset.addEventListener('click', resetFilters);
      actions.appendChild(reset);
    }
    if (actions.childNodes.length) box.appendChild(actions);
    container.appendChild(box);
  }

  /* ============================================================
   * Фильтрация / сортировка / поиск
   * ============================================================ */
  function getFiltered() {
    var q = norm(state.search);
    var out = state.all.filter(function (r) {
      if (state.filterRating !== 'all') {
        var rt = r.rating == null ? 0 : r.rating;
        if (rt !== parseInt(state.filterRating, 10)) return false;
      }
      if (state.filterBoost !== 'all' && (r.boost_type || '') !== state.filterBoost) return false;
      if (state.filterBooster !== 'all' && (!r.booster || r.booster.ref !== state.filterBooster)) return false;
      if (q && (r.__search || '').indexOf(q) === -1) return false;
      return true;
    });

    if (state.sort === 'oldest') {
      out = out.slice().sort(function (a, b) { return timeKey(a) - timeKey(b) || (a.id || 0) - (b.id || 0); });
    } else if (state.sort === 'rating') {
      out = out.slice().sort(function (a, b) {
        var d = (b.rating || 0) - (a.rating || 0);
        return d !== 0 ? d : timeKey(b) - timeKey(a);
      });
    }
    return out;
  }

  /* ============================================================
   * Отрисовка
   * ============================================================ */
  var io = null;
  function ensureObserver() {
    if (io || !('IntersectionObserver' in window)) return;
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
  }

  function render() {
    if (state.failed && !state.all.length) return;
    var filtered = getFiltered();

    if (!filtered.length) {
      if (state.loadingAll && !state.loadedAll && !state.search &&
          state.filterRating === 'all' && state.filterBoost === 'all' && state.filterBooster === 'all') {
        renderSkeletons(INITIAL_VISIBLE);
      } else {
        renderMessage('fas fa-magnifying-glass', L('nothingTitle'), L('nothingDesc'), 'empty');
      }
      state.firstPainted = true;
      return;
    }

    var slice = filtered.slice(0, state.visible);
    container.innerHTML = '';
    ensureObserver();
    var frag = document.createDocumentFragment();
    slice.forEach(function (r, idx) {
      var card = createCard(r);
      card.style.setProperty('--rc-delay', (idx % STEP_VISIBLE) * 0.045 + 's');
      frag.appendChild(card);
    });
    container.appendChild(frag);

    var cards = container.querySelectorAll('.review-card.rc-reveal');
    if (io) cards.forEach(function (c) { io.observe(c); });
    else cards.forEach(function (c) { c.classList.add('visible'); });

    updateLoadMore(filtered.length);
    updateMeta(slice.length, filtered.length);
    updateStats();
    state.firstPainted = true;
  }

  function updateLoadMore(filteredLen) {
    if (!loadMoreWrap) return;
    var n = filteredLen != null ? filteredLen : getFiltered().length;
    if (state.visible < n) {
      loadMoreWrap.style.display = '';
      if (loadMoreBtn) loadMoreBtn.disabled = false;
    } else {
      loadMoreWrap.style.display = 'none';
    }
  }

  function updateMeta(shown, total) {
    if (!metaLine) return;
    var word = state.lang === 'en' ? ('Showing ' + shown + ' of ' + total)
                                   : ('Показано ' + shown + ' из ' + total);
    metaLine.textContent = word;
  }

  function updateStats() {
    var total = state.total != null ? state.total : state.all.length;
    if (statCount) statCount.textContent = String(total);
    if (bannerCount) bannerCount.textContent = String(total);

    if (state.all.length) {
      var sum = 0, rated = 0, happy = 0;
      for (var i = 0; i < state.all.length; i++) {
        var v = state.all[i].rating;
        if (v >= 1 && v <= 5) { sum += v; rated++; if (v >= 4) happy++; }
      }
      if (rated) {
        if (statRating) statRating.textContent = (sum / rated).toFixed(1);
        if (statHappy) statHappy.textContent = Math.floor(happy / rated * 100) + '%';
        updateSchema(total, sum / rated);
      }
    }
  }

  // Синхронизируем JSON-LD aggregateRating (плейсхолдеры 350 / 4.9) один раз.
  var schemaDone = false;
  function updateSchema(count, rating) {
    if (schemaDone || count == null) return;
    var scripts = document.querySelectorAll('script[type="application/ld+json"]');
    Array.prototype.forEach.call(scripts, function (sc) {
      if (sc.textContent.indexOf('aggregateRating') === -1) return;
      var t = sc.textContent
        .replace(/("reviewCount"\s*:\s*")350(")/g, '$1' + count + '$2')
        .replace(/("ratingValue"\s*:\s*")4\.9(")/g, '$1' + rating.toFixed(1) + '$2');
      if (t !== sc.textContent) sc.textContent = t;
    });
    schemaDone = true;
  }

  /* ============================================================
   * Построение панели фильтров
   * ============================================================ */
  function ratingCounts() {
    var c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (var i = 0; i < state.all.length; i++) {
      var v = state.all[i].rating;
      if (v >= 1 && v <= 5) c[v]++;
    }
    return c;
  }
  function boostCounts() {
    var c = Object.create(null);
    for (var i = 0; i < state.all.length; i++) {
      var t = state.all[i].boost_type;
      if (t && BOOST_META[t]) c[t] = (c[t] || 0) + 1;
    }
    return c;
  }
  function countBadge(n) { return el('span', 'fb-count', String(n)); }

  function buildRatingFilters() {
    if (!ratingFilters) return;
    var counts = ratingCounts();
    var totalAll = state.total != null ? state.total : state.all.length;
    ratingFilters.innerHTML = '';

    var addBtn = function (value, build, count, empty) {
      var b = el('button', 'filter-btn' + (value === state.filterRating ? ' active' : '') + (empty ? ' is-empty' : ''));
      b.setAttribute('data-rating', value);
      build(b);
      b.appendChild(countBadge(count));
      b.addEventListener('click', function () {
        state.filterRating = value; state.visible = INITIAL_VISIBLE;
        syncActive(ratingFilters, 'data-rating', value); render();
      });
      ratingFilters.appendChild(b);
    };

    addBtn('all', function (b) {
      b.appendChild(icon('fas fa-layer-group'));
      b.appendChild(el('span', null, ' ' + L('all')));
    }, totalAll, false);

    for (var s = 5; s >= 1; s--) {
      (function (star) {
        addBtn(String(star), function (b) {
          b.setAttribute('aria-label', L('star' + star));
          b.setAttribute('title', L('star' + star));
          var lab = el('span', 'fb-stars');
          lab.appendChild(el('span', 'fb-num', String(star)));
          lab.appendChild(icon('fas fa-star'));
          b.appendChild(lab);
        }, counts[star] || 0, (counts[star] || 0) === 0);
      })(s);
    }
  }

  function buildBoostFilters() {
    if (!boostFilters) return;
    var counts = boostCounts();
    var present = Object.create(null);
    state.all.forEach(function (r) { if (r.boost_type && BOOST_META[r.boost_type]) present[r.boost_type] = true; });
    var types = BOOST_ORDER.filter(function (t) { return present[t]; });
    var allCount = state.total != null ? state.total : state.all.length;

    boostFilters.innerHTML = '';
    var mk = function (value, iconCls, label, count) {
      var b = el('button', 'filter-btn' + (value === state.filterBoost ? ' active' : ''));
      b.setAttribute('data-boost', value);
      b.appendChild(icon('fas ' + iconCls));
      b.appendChild(el('span', null, ' ' + label));
      b.appendChild(countBadge(count));
      b.addEventListener('click', function () {
        state.filterBoost = value; state.visible = INITIAL_VISIBLE;
        syncActive(boostFilters, 'data-boost', value); render();
      });
      return b;
    };
    boostFilters.appendChild(mk('all', 'fa-layer-group', L('allTypes'), allCount));
    types.forEach(function (t) {
      var m = BOOST_META[t];
      boostFilters.appendChild(mk(t, m.icon, m[state.lang] != null ? m[state.lang] : m.ru, counts[t] || 0));
    });
    boostFilters.parentNode.style.display = types.length ? '' : 'none';
  }

  function buildBoosterFilter() {
    if (!boosterSelect) return;
    var map = Object.create(null);
    state.all.forEach(function (r) {
      if (!r.booster || !r.booster.ref) return;
      var ref = r.booster.ref;
      if (!map[ref]) map[ref] = { ref: ref, name: r.booster.name || ref, count: 0 };
      map[ref].count++;
    });
    var list = Object.keys(map).map(function (k) { return map[k]; });
    list.sort(function (a, b) { return b.count - a.count || a.name.localeCompare(b.name); });

    var prev = state.filterBooster;
    boosterSelect.innerHTML = '';
    var optAll = el('option', null, L('allBoosters'));
    optAll.value = 'all';
    boosterSelect.appendChild(optAll);
    list.forEach(function (b) {
      var o = el('option', null, b.name + ' (' + b.count + ')');
      o.value = b.ref;
      boosterSelect.appendChild(o);
    });
    // сохраняем выбор, если бустер ещё присутствует
    boosterSelect.value = map[prev] ? prev : 'all';
    if (boosterSelect.value !== prev) state.filterBooster = boosterSelect.value;
  }

  function buildSortSelect() {
    if (!sortSelect) return;
    var cur = state.sort;
    sortSelect.innerHTML = '';
    [['newest', L('sortNewest')], ['oldest', L('sortOldest')], ['rating', L('sortRating')]].forEach(function (d) {
      var o = el('option', null, d[1]); o.value = d[0];
      sortSelect.appendChild(o);
    });
    sortSelect.value = cur;
  }

  function syncActive(root, attr, value) {
    Array.prototype.forEach.call(root.querySelectorAll('.filter-btn'), function (b) {
      b.classList.toggle('active', b.getAttribute(attr) === value);
    });
  }

  function rebuildFilters() {
    buildRatingFilters();
    buildBoostFilters();
    buildBoosterFilter();
  }

  function resetFilters() {
    state.filterRating = 'all';
    state.filterBoost = 'all';
    state.filterBooster = 'all';
    state.search = '';
    state.visible = INITIAL_VISIBLE;
    if (searchInput) searchInput.value = '';
    if (searchClear) searchClear.classList.remove('show');
    buildRatingFilters();
    rebuildFilters();
    if (sortSelect) sortSelect.value = state.sort;
    render();
  }

  /* ============================================================
   * Авто-обновление
   * ============================================================ */
  function startPolling() {
    if (state.pollTimer) return;
    state.pollTimer = setInterval(function () {
      if (document.hidden) return;
      fetchPage(20, 0).then(function (json) {
        if (json.pagination && typeof json.pagination.total === 'number') state.total = json.pagination.total;
        var added = merge(json.data);
        if (added > 0) {
          state.newCount += added;
          rebuildFilters(); updateStats(); writeCache(); showNewPill();
        }
      }).catch(function () {});
    }, POLL_INTERVAL);
  }

  function showNewPill() {
    if (!newPill) return;
    var n = state.newCount, text;
    if (state.lang === 'en') {
      text = n + (n === 1 ? ' new review' : ' new reviews') + ' available';
    } else {
      var m10 = n % 10, m100 = n % 100, word;
      if (m10 === 1 && m100 !== 11) word = 'новый отзыв';
      else if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) word = 'новых отзыва';
      else word = 'новых отзывов';
      text = 'Появилось ' + n + ' ' + word;
    }
    newPill.querySelector('.new-pill-text').textContent = text;
    newPill.classList.add('show');
  }

  function applyNewReviews() {
    state.newCount = 0;
    if (newPill) newPill.classList.remove('show');
    resetFilters();
    if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        if (json.pagination && typeof json.pagination.total === 'number') state.total = json.pagination.total;
        merge(json.data);
        rebuildFilters();
        if (!state.firstPainted) render();
        else { updateStats(); updateLoadMore(); updateMeta(Math.min(state.visible, getFiltered().length), getFiltered().length); }

        var hasMore = json.pagination ? json.pagination.has_more : (json.data.length === PAGE_SIZE);
        offset += PAGE_SIZE;
        if (hasMore && json.data.length > 0) {
          setTimeout(step, PAGE_DELAY);
        } else {
          state.loadingAll = false; state.loadedAll = true;
          writeCache(); updateStats(); startPolling();
        }
      }).catch(function () {
        state.loadingAll = false;
        if (!state.all.length) {
          state.failed = true;
          renderMessage('fas fa-triangle-exclamation', L('errorTitle'), L('errorDesc'), 'error');
        } else {
          state.loadedAll = true; writeCache(); startPolling();
        }
      });
    }
    step();
  }

  /* ============================================================
   * Локализация панели (метки/плейсхолдеры) + реакция на смену языка
   * ============================================================ */
  function applyStaticLabels() {
    setLabel('rating', L('ratingLabel'));
    setLabel('boostType', L('boostTypeLabel'));
    setLabel('booster', L('boosterLabel'));
    setLabel('sort', L('sortLabel'));
    if (searchInput) searchInput.setAttribute('placeholder', L('searchPlaceholder'));
    if (searchClear) searchClear.setAttribute('aria-label', state.lang === 'en' ? 'Clear search' : 'Очистить поиск');
    if (loadMoreBtn) {
      loadMoreBtn.innerHTML = '';
      loadMoreBtn.appendChild(document.createTextNode(L('showMore') + ' '));
      loadMoreBtn.appendChild(icon('fas fa-chevron-down'));
    }
  }
  function setLabel(name, text) {
    var nodes = document.querySelectorAll('[data-label="' + name + '"]');
    Array.prototype.forEach.call(nodes, function (n) { n.textContent = text; });
  }

  function applyLang() {
    state.lang = getLang();
    applyStaticLabels();
    buildRatingFilters();
    buildBoostFilters();
    buildBoosterFilter();
    buildSortSelect();
    if (state.newCount > 0) showNewPill();
    render();
  }

  /* ============================================================
   * Привязка событий
   * ============================================================ */
  function bindEvents() {
    if (loadMoreBtn) loadMoreBtn.addEventListener('click', function () {
      state.visible += STEP_VISIBLE; render();
    });
    if (newPill) newPill.addEventListener('click', applyNewReviews);

    if (boosterSelect) boosterSelect.addEventListener('change', function () {
      state.filterBooster = boosterSelect.value; state.visible = INITIAL_VISIBLE; render();
    });
    if (sortSelect) sortSelect.addEventListener('change', function () {
      state.sort = sortSelect.value; state.visible = INITIAL_VISIBLE; render();
    });

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        if (searchClear) searchClear.classList.toggle('show', !!searchInput.value);
        clearTimeout(state.searchTimer);
        state.searchTimer = setTimeout(function () {
          state.search = searchInput.value || '';
          state.visible = INITIAL_VISIBLE; render();
        }, SEARCH_DEBOUNCE);
      });
    }
    if (searchClear) searchClear.addEventListener('click', function () {
      searchInput.value = ''; searchClear.classList.remove('show');
      state.search = ''; state.visible = INITIAL_VISIBLE; render(); searchInput.focus();
    });

    // Реакция на переключатель языка в шапке
    document.addEventListener('mlbb:langchange', function () { applyLang(); });
  }

  /* ============================================================
   * Старт
   * ============================================================ */
  function boot(force) {
    state.failed = false;
    if (!force) {
      var cache = readCache();
      if (cache && cache.data.length) {
        merge(cache.data);
        if (typeof cache.total === 'number') state.total = cache.total;
        rebuildFilters();
        render();
        var fresh = (Date.now() - (cache.timestamp || 0)) < CACHE_TTL;
        if (fresh) {
          startPolling();
          fetchPage(20, 0).then(function (json) {
            if (json.pagination) state.total = json.pagination.total;
            var added = merge(json.data);
            if (added) { state.newCount += added; rebuildFilters(); updateStats(); writeCache(); showNewPill(); }
          }).catch(function () {});
          return;
        }
        state.firstPainted = false;
        loadAllPages(0);
        return;
      }
    }
    renderSkeletons(INITIAL_VISIBLE);
    state.firstPainted = false;
    loadAllPages(0);
  }

  function init() {
    container = document.getElementById('reviews-container');
    if (!container) return;

    ratingFilters = document.getElementById('rating-filters');
    boostFilters = document.getElementById('boost-filters');
    boosterSelect = document.getElementById('booster-filter');
    sortSelect = document.getElementById('sort-select');
    searchInput = document.getElementById('reviews-search');
    searchClear = document.getElementById('reviews-search-clear');
    metaLine = document.getElementById('reviews-meta');
    loadMoreWrap = document.querySelector('.load-more');
    loadMoreBtn = document.getElementById('load-more-btn');
    newPill = document.getElementById('reviews-new-pill');
    statCount = document.getElementById('stat-reviews-count');
    statRating = document.getElementById('stat-reviews-rating');
    statHappy = document.getElementById('stat-reviews-happy');
    bannerCount = document.getElementById('reviews-banner-count');

    state.lang = getLang();
    applyStaticLabels();
    buildRatingFilters();
    buildSortSelect();
    bindEvents();
    boot(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
