(function () {
  'use strict';

  const GA_ID = 'G-6HJ7194FZC';
  const YM_ID = 99684184;
  const locale = document.documentElement.lang === 'en' ? 'en' : 'ru';
  const copy = locale === 'en'
    ? {
        noPublished: 'No stories have been published yet.',
        page: 'Page',
        allTopics: 'across all topics',
        inTopic: (topic) => `in “${topic}”`,
        status: (start, end, total, topic, page, pages) => (
          `Showing stories ${start}–${end} of ${total} ${topic}. Page ${page} of ${pages}.`
        ),
        empty: (topic) => `There are no stories ${topic} yet.`,
        menuOpen: 'Open menu',
        menuClose: 'Close menu'
      }
    : {
        noPublished: 'Опубликованных материалов пока нет.',
        page: 'Страница',
        allTopics: 'во всех темах',
        inTopic: (topic) => `в теме «${topic}»`,
        status: (start, end, total, topic, page, pages) => (
          `Показаны материалы ${start}–${end} из ${total} ${topic}. Страница ${page} из ${pages}.`
        ),
        empty: (topic) => `Материалов ${topic} пока нет.`,
        menuOpen: 'Открыть меню',
        menuClose: 'Закрыть меню'
      };
  let analyticsLoaded = false;
  let articleViewTracked = false;

  function loadAnalytics() {
    if (analyticsLoaded || !window.MLBBConsent || !window.MLBBConsent.hasConsent()) return;
    analyticsLoaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });

    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
    document.head.appendChild(gaScript);

    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () {
        (m[i].a = m[i].a || []).push(arguments);
      };
      m[i].l = 1 * new Date();
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

    window.ym(YM_ID, 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: false,
      defer: true
    });
  }

  function trackEvent(name, params) {
    if (!analyticsLoaded) return;
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
    if (typeof window.ym === 'function') window.ym(YM_ID, 'reachGoal', name, params);
  }

  function initNewsListing() {
    const feed = document.querySelector('[data-news-feed]');
    const buttons = Array.from(document.querySelectorAll('[data-news-filter]'));
    const controls = document.querySelector('[data-news-controls]');
    const select = document.querySelector('[data-news-filter-select]');
    const cards = Array.from(document.querySelectorAll('[data-news-card]'));
    const status = document.querySelector('[data-news-status]');
    const empty = document.querySelector('[data-news-filter-empty]');
    const pagination = document.querySelector('[data-news-pagination]');
    const pages = document.querySelector('[data-news-pages]');
    const previous = document.querySelector('[data-news-page-step="previous"]');
    const next = document.querySelector('[data-news-page-step="next"]');
    const heading = document.querySelector('#news-results-title');
    const grid = document.querySelector('.news-grid');
    if (!feed || !buttons.length) return;
    if (!cards.length) {
      if (status) status.textContent = copy.noPublished;
      const url = new URL(window.location.href);
      url.searchParams.delete('category');
      url.searchParams.delete('page');
      window.history.replaceState({}, '', url);
      return;
    }

    const pageSize = Math.max(1, Number.parseInt(feed.dataset.pageSize || '10', 10) || 10);
    const availableFilters = new Set(buttons.map((button) => button.dataset.newsFilter));
    let activeFilter = 'all';
    let currentPage = 1;

    const readUrlState = () => {
      const params = new URL(window.location.href).searchParams;
      const requestedFilter = params.get('category') || 'all';
      const rawPage = params.get('page') || '1';
      const requestedPage = /^[1-9]\d*$/.test(rawPage) ? Number(rawPage) : 1;
      activeFilter = availableFilters.has(requestedFilter) ? requestedFilter : 'all';
      currentPage = Number.isSafeInteger(requestedPage) ? requestedPage : 1;
    };

    const writeUrlState = (mode) => {
      const url = new URL(window.location.href);
      if (activeFilter === 'all') url.searchParams.delete('category');
      else url.searchParams.set('category', activeFilter);
      if (currentPage > 1) url.searchParams.set('page', String(currentPage));
      else url.searchParams.delete('page');
      window.history[mode === 'push' ? 'pushState' : 'replaceState']({}, '', url);
    };

    const pageTokens = (totalPages) => {
      if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
      const values = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
      const numbers = [...values]
        .filter((value) => value >= 1 && value <= totalPages)
        .sort((a, b) => a - b);
      const tokens = [];
      numbers.forEach((number, index) => {
        if (index > 0 && number - numbers[index - 1] > 1) tokens.push('ellipsis');
        tokens.push(number);
      });
      return tokens;
    };

    const renderPagination = (totalPages) => {
      if (!pagination || !pages || !previous || !next) return;
      pagination.hidden = totalPages <= 1;
      previous.disabled = currentPage <= 1;
      next.disabled = currentPage >= totalPages;
      pages.replaceChildren();

      pageTokens(totalPages).forEach((token) => {
        if (token === 'ellipsis') {
          const ellipsis = document.createElement('span');
          ellipsis.className = 'news-pagination__ellipsis';
          ellipsis.textContent = '…';
          ellipsis.setAttribute('aria-hidden', 'true');
          pages.appendChild(ellipsis);
          return;
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'news-pagination__page';
        button.dataset.newsPageNumber = String(token);
        button.textContent = String(token);
        button.setAttribute('aria-label', `${copy.page} ${token}`);
        if (token === currentPage) {
          button.classList.add('is-current');
          button.setAttribute('aria-current', 'page');
        }
        pages.appendChild(button);
      });
    };

    const scrollToResults = () => {
      if (!heading) return;
      heading.focus({ preventScroll: true });
      heading.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start'
      });
    };

    const render = ({ historyMode = null, shouldScroll = false } = {}) => {
      const matching = cards.filter(
        (card) => activeFilter === 'all' || card.dataset.category === activeFilter
      );
      const totalPages = Math.max(1, Math.ceil(matching.length / pageSize));
      currentPage = Math.min(Math.max(currentPage, 1), totalPages);
      const start = (currentPage - 1) * pageSize;
      const visible = new Set(matching.slice(start, start + pageSize));

      cards.forEach((card) => {
        card.hidden = !visible.has(card);
      });
      if (grid) {
        const gridCards = Array.from(grid.querySelectorAll('[data-news-card]'));
        grid.hidden = gridCards.length > 0 && gridCards.every((card) => card.hidden);
      }
      buttons.forEach((button) => {
        const active = button.dataset.newsFilter === activeFilter;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      if (select) select.value = activeFilter;
      if (empty) empty.hidden = matching.length > 0;
      renderPagination(matching.length ? totalPages : 0);

      if (status) {
        const rangeStart = matching.length ? start + 1 : 0;
        const rangeEnd = Math.min(start + pageSize, matching.length);
        const activeButton = buttons.find((button) => button.dataset.newsFilter === activeFilter);
        const activeLabel = activeButton?.textContent.trim() || activeFilter;
        const categoryText = activeFilter === 'all' ? copy.allTopics : copy.inTopic(activeLabel);
        status.textContent = matching.length
          ? copy.status(rangeStart, rangeEnd, matching.length, categoryText, currentPage, totalPages)
          : copy.empty(categoryText);
      }
      if (historyMode) writeUrlState(historyMode);
      if (shouldScroll) scrollToResults();
      if (controls) controls.hidden = false;
    };

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        if (button.dataset.newsFilter === activeFilter && currentPage === 1) return;
        activeFilter = button.dataset.newsFilter;
        currentPage = 1;
        render({ historyMode: 'push' });
      });
    });
    select?.addEventListener('change', () => {
      if (select.value === activeFilter && currentPage === 1) return;
      activeFilter = select.value;
      currentPage = 1;
      render({ historyMode: 'push' });
    });
    pagination?.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const pageButton = event.target.closest('[data-news-page-number]');
      const stepButton = event.target.closest('[data-news-page-step]');
      let targetPage = currentPage;
      if (pageButton) targetPage = Number.parseInt(pageButton.dataset.newsPageNumber, 10);
      if (stepButton?.dataset.newsPageStep === 'previous') targetPage -= 1;
      if (stepButton?.dataset.newsPageStep === 'next') targetPage += 1;
      if (!Number.isInteger(targetPage) || targetPage === currentPage) return;
      currentPage = targetPage;
      render({ historyMode: 'push', shouldScroll: true });
    });
    window.addEventListener('popstate', () => {
      readUrlState();
      render();
    });

    readUrlState();
    render({ historyMode: 'replace' });
  }

  function initMobileNavigation() {
    const toggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.nav-menu');
    if (!toggle || !menu) return;
    const mobileQuery = window.matchMedia('(max-width: 1024px)');
    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    let overlay = document.querySelector('.menu-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'menu-overlay';
      document.body.appendChild(overlay);
    }

    const syncClosedAccessibility = () => {
      const closedOnMobile = mobileQuery.matches && !menu.classList.contains('active');
      menu.inert = closedOnMobile;
      if (closedOnMobile) menu.setAttribute('aria-hidden', 'true');
      else menu.removeAttribute('aria-hidden');
    };

    const closeMenu = ({ restoreFocus = false } = {}) => {
      toggle.classList.remove('active');
      menu.classList.remove('active');
      overlay.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', copy.menuOpen);
      document.body.style.overflow = '';
      syncClosedAccessibility();
      if (restoreFocus) toggle.focus();
    };

    const openMenu = () => {
      menu.inert = false;
      menu.removeAttribute('aria-hidden');
      toggle.classList.add('active');
      menu.classList.add('active');
      overlay.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', copy.menuClose);
      document.body.style.overflow = 'hidden';
      menu.querySelector(focusableSelector)?.focus();
    };

    toggle.addEventListener('click', () => {
      if (menu.classList.contains('active')) closeMenu();
      else openMenu();
    });
    overlay.addEventListener('click', () => closeMenu({ restoreFocus: true }));
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.classList.contains('active')) {
        closeMenu({ restoreFocus: true });
        return;
      }
      if (event.key === 'Tab' && menu.classList.contains('active')) {
        const focusable = Array.from(menu.querySelectorAll(focusableSelector))
          .filter((element) => !element.inert && element.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    mobileQuery.addEventListener('change', () => {
      if (!mobileQuery.matches && menu.classList.contains('active')) closeMenu();
      syncClosedAccessibility();
    });
    syncClosedAccessibility();
  }

  function initReadingProgress() {
    const progress = document.querySelector('[data-reading-progress]');
    const article = document.querySelector('.article-content');
    if (!progress || !article) return;

    let ticking = false;
    const update = () => {
      const articleRect = article.getBoundingClientRect();
      const articleTop = window.scrollY + articleRect.top;
      const articleHeight = Math.max(article.scrollHeight - window.innerHeight, 1);
      const value = Math.min(1, Math.max(0, (window.scrollY - articleTop) / articleHeight));
      progress.style.transform = `scaleX(${value})`;
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    window.addEventListener('resize', update, { passive: true });
    update();
  }

  function initTableOfContents() {
    const links = Array.from(document.querySelectorAll('.article-toc a[href^="#"]'));
    if (!links.length) return;

    const targets = links
      .map((link) => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);
    if (!targets.length) return;

    const linkById = new Map(links.map((link) => [link.getAttribute('href').slice(1), link]));
    let activeId = '';
    let ticking = false;
    const setActive = (target) => {
      if (!target || target.id === activeId) return;
      activeId = target.id;
      links.forEach((link) => {
        link.classList.remove('is-active');
        link.removeAttribute('aria-current');
      });
      const active = linkById.get(target.id);
      if (active) {
        active.classList.add('is-active');
        active.setAttribute('aria-current', 'location');
      }
    };

    const update = () => {
      const activationLine = Math.min(220, Math.max(112, window.innerHeight * 0.22));
      let activeTarget = targets[0];
      for (const target of targets) {
        if (target.getBoundingClientRect().top > activationLine) break;
        activeTarget = target;
      }
      setActive(activeTarget);
      ticking = false;
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    window.addEventListener('hashchange', requestUpdate);
    update();
  }

  function initTracking() {
    const article = document.querySelector('.article-page article');
    const slug = window.location.pathname.split('/').filter(Boolean).pop() || 'news-index';

    if (article && analyticsLoaded && !articleViewTracked) {
      trackEvent('news_article_view', { article_slug: slug, content_language: locale });
      articleViewTracked = true;
    }

    if (document.documentElement.dataset.newsTrackingInitialized === 'true') return;
    document.documentElement.dataset.newsTrackingInitialized = 'true';

    document.querySelectorAll('[data-news-cta]').forEach((link) => {
      link.addEventListener('click', () => {
        trackEvent('news_cta_click', {
          article_slug: slug,
          content_language: locale,
          cta_position: link.dataset.ctaPosition || 'unknown',
          cta_variant: 'rank-calculator'
        });
      });
    });
  }

  const initPage = () => {
    loadAnalytics();
    initMobileNavigation();
    initNewsListing();
    initReadingProgress();
    initTableOfContents();
    initTracking();
  };

  initPage();

  window.addEventListener('mlbb:consent-granted', () => {
    loadAnalytics();
    initTracking();
  }, { once: true });
})();
