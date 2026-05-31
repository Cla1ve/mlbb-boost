/**
 * MLBB Boost - i18n Engine (RU <-> EN)
 * ------------------------------------------------------------
 * - Default language: Russian (ru). User can switch to English (en).
 * - Translation is dictionary driven (window.MLBB_DICT), keyed by the
 *   trimmed Russian source string, so we never tag elements by hand.
 * - A TreeWalker translates all visible text nodes + key attributes.
 * - A MutationObserver re-translates content injected at runtime
 *   (reviews, calculator results, rebuilt navigation, consent banner...).
 * - Regex PATTERNS act as a fallback for rank names / stars combinations.
 * - Proper names inside reviews are transliterated RU -> Latin.
 * - In English mode every "@cla1ve_boost_bot" bot reference (links + text)
 *   becomes "@Cla1ve" (https://t.me/Cla1ve), per requirement.
 * - SEO: <html lang>, <title>, meta description/keywords/OG/Twitter and
 *   hreflang/canonical are updated, language is reflected in the URL (?lang=).
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'mlbb_lang';
  var DEFAULT_LANG = 'ru';
  var SUPPORTED = ['ru', 'en'];

  // Dictionary is provided by js/i18n-dict.js (loaded before this file).
  var DICT = (window.MLBB_DICT = window.MLBB_DICT || {});

  // Attributes that may hold translatable copy.
  var ATTR_LIST = ['placeholder', 'title', 'aria-label', 'alt', 'label'];

  // Tags we never descend into.
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CODE: 1, svg: 1, SVG: 1 };

  // Elements whose leftover Cyrillic text are proper names -> transliterate.
  var TRANSLIT_SELECTORS = ['.reviewer-info h4', '.reviewer-name', '.review-card h4'];

  /* ----------------------------------------------------------------
   * Fallback patterns: applied ONLY to text nodes that still contain
   * Cyrillic after a failed dictionary lookup. Order matters (longest
   * / most specific first). These mainly cover rank combinations that
   * are impossible to enumerate (e.g. "Мифик 5★ → Мифик 20★").
   * ---------------------------------------------------------------- */
  var PATTERNS = [
    [/Мифическая\s+Честь/g, 'Mythic Honor'],
    [/Мифическая\s+честь/g, 'Mythic Honor'],
    [/Мифическая\s+Слава/g, 'Mythic Glory'],
    [/Мифическая\s+слава/g, 'Mythic Glory'],
    [/Мифический\s+Бессмертный/g, 'Mythic Immortal'],
    [/Мифический\s+бессмертный/g, 'Mythic Immortal'],
    [/Мифик\s+Честь/g, 'Mythic Honor'],
    [/Мифик\s+честь/g, 'Mythic Honor'],
    [/Мифик\s+Слава/g, 'Mythic Glory'],
    [/Мифик\s+слава/g, 'Mythic Glory'],
    [/Грандмастер/g, 'Grandmaster'],
    [/\bГМ\b/g, 'GM'],
    [/Мифик/g, 'Mythic'],
    [/Легенда/g, 'Legend'],
    [/Эпик/g, 'Epic'],
    [/Мастер/g, 'Master'],
    [/Элита/g, 'Elite'],
    [/Воин/g, 'Warrior'],
    [/Этап/g, 'Stage'],
    [/(\d+)\s+января/g, '$1 January'],
    [/(\d+)\s+февраля/g, '$1 February'],
    [/(\d+)\s+марта/g, '$1 March'],
    [/(\d+)\s+апреля/g, '$1 April'],
    [/(\d+)\s+мая/g, '$1 May'],
    [/(\d+)\s+июня/g, '$1 June'],
    [/(\d+)\s+июля/g, '$1 July'],
    [/(\d+)\s+августа/g, '$1 August'],
    [/(\d+)\s+сентября/g, '$1 September'],
    [/(\d+)\s+октября/g, '$1 October'],
    [/(\d+)\s+ноября/g, '$1 November'],
    [/(\d+)\s+декабря/g, '$1 December'],
    [/\s*г\.\s*$/g, ''],
    [/звёздами/g, 'stars'],
    [/звёздах/g, 'stars'],
    [/звёзды/g, 'stars'],
    [/звезды/g, 'stars'],
    [/звёзд/g, 'stars'],
    [/звезда/g, 'star']
  ];

  // Telegram bot rewrite (EN only).
  var TG_BOT_TEXT_RE = /@cla1ve_boost_bot/gi;
  var TG_BOT_HREF_RE = /https?:\/\/t\.me\/cla1ve_boost_bot[^"'\s]*/i;

  /* ---------------- state ---------------- */
  var currentLang = DEFAULT_LANG;
  var origText = new WeakMap();   // textNode -> original RU value
  var origAttr = new WeakMap();   // element  -> { attrName: original value }
  var origHref = new WeakMap();   // element  -> original href
  var observer = null;
  var booting = true;

  // Post-translation text transforms (e.g. currency conversion).
  // Each transform receives the EN string and returns a possibly modified one.
  var transforms = [];
  function runTransforms(str) {
    for (var i = 0; i < transforms.length; i++) {
      try { str = transforms[i](str); } catch (e) {}
    }
    return str;
  }

  /* ---------------- helpers ---------------- */

  function hasCyrillic(s) { return /[А-Яа-яЁё]/.test(s); }

  var TRANSLIT_MAP = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };

  function transliterate(str) {
    var out = '';
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      var lower = ch.toLowerCase();
      if (TRANSLIT_MAP.hasOwnProperty(lower)) {
        var rep = TRANSLIT_MAP[lower];
        if (ch !== lower && rep) rep = rep.charAt(0).toUpperCase() + rep.slice(1);
        out += rep;
      } else {
        out += ch;
      }
    }
    return out;
  }

  function applyPatterns(str) {
    var res = str;
    for (var i = 0; i < PATTERNS.length; i++) {
      res = res.replace(PATTERNS[i][0], PATTERNS[i][1]);
    }
    return res;
  }

  // Translate a trimmed Russian phrase. Returns the EN string or null.
  function translatePhrase(trimmed) {
    if (DICT.hasOwnProperty(trimmed)) return DICT[trimmed];
    if (hasCyrillic(trimmed)) {
      var patched = applyPatterns(trimmed);
      if (patched !== trimmed) return patched;
    }
    return null;
  }

  function isInsideTranslitTarget(node) {
    var el = node.parentElement;
    if (!el) return false;
    for (var i = 0; i < TRANSLIT_SELECTORS.length; i++) {
      if (el.closest && el.closest(TRANSLIT_SELECTORS[i])) return true;
    }
    return false;
  }

  /* ---------------- text node translation ---------------- */

  function handleTextNode(node) {
    // Remember the original Russian value the first time we see the node.
    if (!origText.has(node)) origText.set(node, node.nodeValue);
    var original = origText.get(node);

    if (currentLang === 'ru') {
      if (node.nodeValue !== original) node.nodeValue = original;
      return;
    }

    var trimmed = original.replace(/\s+/g, ' ').trim();
    if (!trimmed) return;

    var translated = translatePhrase(trimmed);

    // Proper names (reviewers) with no dictionary entry -> transliterate.
    if (translated === null && hasCyrillic(trimmed) && isInsideTranslitTarget(node)) {
      translated = transliterate(trimmed);
    }

    // Base EN string: dictionary/translit result, otherwise the original.
    var base = (translated !== null) ? translated : trimmed;

    // Apply post-translation transforms (currency, etc.).
    var finalText = transforms.length ? runTransforms(base) : base;

    if (finalText !== trimmed) {
      // Preserve leading / trailing whitespace of the original node.
      var lead = (original.match(/^\s*/) || [''])[0];
      var trail = (original.match(/\s*$/) || [''])[0];
      var value = lead + finalText + trail;
      if (node.nodeValue !== value) node.nodeValue = value;
    }
  }

  /* ---------------- attribute translation ---------------- */

  function rememberAttr(el, attr) {
    var store = origAttr.get(el);
    if (!store) { store = {}; origAttr.set(el, store); }
    if (!store.hasOwnProperty(attr)) store[attr] = el.getAttribute(attr);
    return store[attr];
  }

  function handleAttributes(el) {
    for (var i = 0; i < ATTR_LIST.length; i++) {
      var attr = ATTR_LIST[i];
      if (!el.hasAttribute(attr)) continue;
      var original = rememberAttr(el, attr);
      if (original == null) continue;
      if (currentLang === 'ru') {
        if (el.getAttribute(attr) !== original) el.setAttribute(attr, original);
        continue;
      }
      var trimmed = original.trim();
      var t = translatePhrase(trimmed);
      var base = (t !== null) ? t : trimmed;
      var finalText = transforms.length ? runTransforms(base) : base;
      if (finalText !== trimmed) el.setAttribute(attr, finalText);
    }
  }

  /* ---------------- telegram bot rewrite ---------------- */

  function handleTelegram(el) {
    if (!el.hasAttribute || !el.hasAttribute('href')) return;
    if (!origHref.has(el)) origHref.set(el, el.getAttribute('href'));
    var original = origHref.get(el);
    if (!/t\.me\/cla1ve_boost_bot/i.test(original)) return;
    if (currentLang === 'en') {
      el.setAttribute('href', 'https://t.me/Cla1ve');
    } else {
      el.setAttribute('href', original);
    }
  }

  /* ---------------- tree walking ---------------- */

  function walk(root) {
    // Skip the language switcher entirely.
    if (root.nodeType === 1) {
      if (root.hasAttribute && root.hasAttribute('data-i18n-skip')) return;
      if (SKIP_TAGS[root.tagName]) return;
    }

    // Attributes + telegram on element nodes.
    if (root.nodeType === 1) {
      handleAttributes(root);
      if (root.tagName === 'A') handleTelegram(root);
    }

    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var p = node.parentNode;
        while (p && p.nodeType === 1) {
          if (SKIP_TAGS[p.tagName]) return NodeFilter.FILTER_REJECT;
          if (p.hasAttribute && p.hasAttribute('data-i18n-skip')) return NodeFilter.FILTER_REJECT;
          p = p.parentNode;
        }
        return node.nodeValue && node.nodeValue.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      }
    });

    var current;
    var batch = [];
    while ((current = walker.nextNode())) batch.push(current);
    batch.forEach(handleTextNode);

    // Attributes + telegram for descendant elements.
    if (root.querySelectorAll) {
      var els = root.querySelectorAll('*');
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (SKIP_TAGS[el.tagName]) continue;
        if (el.closest && el.closest('[data-i18n-skip]')) continue;
        handleAttributes(el);
        if (el.tagName === 'A') handleTelegram(el);
      }
    }
  }

  /* ---------------- head / SEO ---------------- */

  var origTitle = null;
  function handleHead() {
    if (origTitle === null) origTitle = document.title;
    if (currentLang === 'en') {
      var t = translatePhrase(origTitle.trim());
      var base = t || origTitle;
      document.title = transforms.length ? runTransforms(base) : base;
    } else {
      document.title = origTitle;
    }

    var metas = document.querySelectorAll(
      'meta[name="description"],meta[name="keywords"],' +
      'meta[property="og:title"],meta[property="og:description"],' +
      'meta[property="og:locale"],meta[name="twitter:title"],' +
      'meta[name="twitter:description"]'
    );
    for (var i = 0; i < metas.length; i++) {
      var m = metas[i];
      var original = rememberAttr(m, 'content');
      if (original == null) continue;
      if (currentLang === 'ru') {
        if (m.getAttribute('content') !== original) m.setAttribute('content', original);
        continue;
      }
      if (m.getAttribute('property') === 'og:locale') {
        m.setAttribute('content', 'en_US');
        continue;
      }
      var tr = translatePhrase(original.trim());
      var metaBase = (tr !== null) ? tr : original;
      m.setAttribute('content', transforms.length ? runTransforms(metaBase) : metaBase);
    }

    // hreflang + html lang
    document.documentElement.lang = currentLang;
    ensureHreflang();
  }

  function ensureHreflang() {
    if (document.querySelector('link[hreflang="en"]')) return;
    var head = document.head;
    var base = location.origin + location.pathname;
    var add = function (lang, href) {
      var l = document.createElement('link');
      l.setAttribute('rel', 'alternate');
      l.setAttribute('hreflang', lang);
      l.setAttribute('href', href);
      head.appendChild(l);
    };
    add('en', base + '?lang=en');
  }

  /* ---------------- apply language ---------------- */

  function applyLanguage(lang, persist) {
    if (SUPPORTED.indexOf(lang) === -1) lang = DEFAULT_LANG;
    currentLang = lang;

    if (observer) observer.disconnect();

    handleHead();
    walk(document.body);

    // Telegram bot visible text "@cla1ve_boost_bot" -> "@Cla1ve" handled via
    // dictionary; ensure any stray occurrence is covered too.
    rewriteBotText(document.body);

    updateSwitcherUI();

    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
      syncUrl(lang);
    }

    // Notify listeners (e.g. calculator) that the language changed.
    try {
      document.dispatchEvent(new CustomEvent('mlbb:langchange', { detail: { lang: lang } }));
    } catch (e) {}

    if (observer) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function rewriteBotText(root) {
    if (currentLang !== 'en') return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n, list = [];
    while ((n = walker.nextNode())) {
      if (n.nodeValue && TG_BOT_TEXT_RE.test(n.nodeValue)) list.push(n);
    }
    list.forEach(function (node) {
      if (!origText.has(node)) origText.set(node, node.nodeValue);
      node.nodeValue = node.nodeValue.replace(TG_BOT_TEXT_RE, '@Cla1ve');
    });
  }

  function syncUrl(lang) {
    try {
      var url = new URL(location.href);
      if (lang === 'en') url.searchParams.set('lang', 'en');
      else url.searchParams.delete('lang');
      history.replaceState(null, '', url.toString());
    } catch (e) {}
  }

  /* ---------------- switcher UI ---------------- */

  function buildSwitcher() {
    if (document.querySelector('.lang-switcher')) return;

    var wrap = document.createElement('div');
    wrap.className = 'lang-switcher';
    wrap.setAttribute('data-i18n-skip', '');
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Language / Язык');
    wrap.innerHTML =
      '<button type="button" class="lang-option" data-lang="ru" aria-label="Русский">' +
        '<span class="lang-flag">RU</span>' +
      '</button>' +
      '<button type="button" class="lang-option" data-lang="en" aria-label="English">' +
        '<span class="lang-flag">EN</span>' +
      '</button>';

    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.lang-option');
      if (!btn) return;
      var lang = btn.getAttribute('data-lang');
      if (lang === currentLang) return;
      applyLanguage(lang, true);
    });

    // Preferred mount: the shared header bar.
    var navContainer = document.querySelector('.nav-container');
    if (navContainer) {
      var toggle = navContainer.querySelector('.menu-toggle');
      if (toggle) navContainer.insertBefore(wrap, toggle);
      else navContainer.appendChild(wrap);
      return;
    }

    // Fallback for the legacy order.html navigation.
    var mainNav = document.querySelector('.main-nav');
    if (mainNav) {
      var mb = mainNav.querySelector('.mobile-menu-btn');
      if (mb) mainNav.insertBefore(wrap, mb);
      else mainNav.appendChild(wrap);
      return;
    }

    // Last resort: floating switcher.
    wrap.classList.add('lang-switcher--floating');
    document.body.appendChild(wrap);
  }

  function updateSwitcherUI() {
    var opts = document.querySelectorAll('.lang-switcher .lang-option');
    for (var i = 0; i < opts.length; i++) {
      var on = opts[i].getAttribute('data-lang') === currentLang;
      opts[i].classList.toggle('active', on);
      opts[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  /* ---------------- mutation observer ---------------- */

  function setupObserver() {
    observer = new MutationObserver(function (mutations) {
      if (currentLang === 'ru') return; // nothing to do, originals are RU
      var roots = [];
      mutations.forEach(function (m) {
        for (var i = 0; i < m.addedNodes.length; i++) {
          var node = m.addedNodes[i];
          if (node.nodeType === 1) roots.push(node);
          else if (node.nodeType === 3) handleTextNode(node);
        }
      });
      if (!roots.length) return;
      observer.disconnect();
      roots.forEach(function (r) {
        if (r.closest && r.closest('[data-i18n-skip]')) return;
        walk(r);
        rewriteBotText(r);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  /* ---------------- init ---------------- */

  function detectInitialLang() {
    var fromUrl = null;
    try {
      fromUrl = new URL(location.href).searchParams.get('lang');
    } catch (e) {}
    if (fromUrl && SUPPORTED.indexOf(fromUrl) !== -1) return fromUrl;

    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;

    return DEFAULT_LANG;
  }

  function init() {
    buildSwitcher();
    setupObserver();
    var lang = detectInitialLang();
    // Persist only if it came from URL/storage choice; default stays RU silently.
    applyLanguage(lang, lang !== DEFAULT_LANG);
    booting = false;

    // Safety re-pass after late scripts (nav rebuild, particles, etc.).
    window.addEventListener('load', function () {
      if (currentLang !== DEFAULT_LANG) {
        walk(document.body);
        rewriteBotText(document.body);
        handleHead();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  window.MLBBi18n = {
    set: function (lang) { applyLanguage(lang, true); },
    get: function () { return currentLang; },
    // Register a post-translation text transform (e.g. currency conversion).
    registerTransform: function (fn) {
      if (typeof fn === 'function' && transforms.indexOf(fn) === -1) {
        transforms.push(fn);
        if (!booting && currentLang !== DEFAULT_LANG) {
          walk(document.body);
          rewriteBotText(document.body);
          handleHead();
        }
      }
    },
    // Re-run translation + transforms (used when the exchange rate updates).
    refresh: function () {
      if (currentLang === DEFAULT_LANG) return;
      walk(document.body);
      rewriteBotText(document.body);
      handleHead();
    }
  };
})();
