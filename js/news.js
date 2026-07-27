(function () {
  'use strict';

  const GA_ID = 'G-6HJ7194FZC';
  const YM_ID = 99684184;
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

  function initFilters() {
    const buttons = Array.from(document.querySelectorAll('[data-news-filter]'));
    const cards = Array.from(document.querySelectorAll('[data-news-card]'));
    const status = document.querySelector('[data-news-status]');
    if (!buttons.length || !cards.length) return;

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const filter = button.dataset.newsFilter;

        buttons.forEach((candidate) => {
          const active = candidate === button;
          candidate.classList.toggle('is-active', active);
          candidate.setAttribute('aria-pressed', String(active));
        });

        let visibleCount = 0;
        cards.forEach((card) => {
          const visible = filter === 'all' || card.dataset.category === filter;
          card.hidden = !visible;
          if (visible) visibleCount += 1;
        });

        if (status) {
          status.textContent = `Показано материалов: ${visibleCount}`;
        }
      });
    });
  }

  function initMobileNavigation() {
    const toggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.nav-menu');
    if (!toggle || !menu) return;
    const mobileQuery = window.matchMedia('(max-width: 768px)');
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
      toggle.setAttribute('aria-label', 'Открыть меню');
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
      toggle.setAttribute('aria-label', 'Закрыть меню');
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
    if (!links.length || !('IntersectionObserver' in window)) return;

    const targets = links
      .map((link) => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);

    const linkById = new Map(links.map((link) => [link.getAttribute('href').slice(1), link]));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible.length) return;

      links.forEach((link) => link.classList.remove('is-active'));
      const active = linkById.get(visible[0].target.id);
      if (active) active.classList.add('is-active');
    }, {
      rootMargin: '-18% 0px -68% 0px',
      threshold: 0
    });

    targets.forEach((target) => observer.observe(target));
  }

  function initTracking() {
    const article = document.querySelector('.article-page article');
    const slug = window.location.pathname.split('/').filter(Boolean).pop() || 'news-index';

    if (article && analyticsLoaded && !articleViewTracked) {
      trackEvent('news_article_view', { article_slug: slug });
      articleViewTracked = true;
    }

    if (document.documentElement.dataset.newsTrackingInitialized === 'true') return;
    document.documentElement.dataset.newsTrackingInitialized = 'true';

    document.querySelectorAll('[data-news-cta]').forEach((link) => {
      link.addEventListener('click', () => {
        trackEvent('news_cta_click', {
          article_slug: slug,
          cta_position: link.dataset.ctaPosition || 'unknown',
          cta_variant: 'rank-calculator'
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadAnalytics();
    initMobileNavigation();
    initFilters();
    initReadingProgress();
    initTableOfContents();
    initTracking();
  });

  window.addEventListener('mlbb:consent-granted', () => {
    loadAnalytics();
    initTracking();
  }, { once: true });
})();
