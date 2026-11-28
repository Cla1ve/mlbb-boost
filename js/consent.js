/**
 * MLBB Boost - Consent Manager
 * Компактная полоса согласия на обработку ПД и cookies: на телефоне одна строка внизу экрана
 */

(function() {
  'use strict';

  // Ключи для localStorage
  const CONSENT_KEY = 'mlbb_consent_accepted';
  const CONSENT_DATE_KEY = 'mlbb_consent_date';
  const isEnglish = document.documentElement.lang === 'en';
  const copy = isEnglish
    ? { lead: 'We use cookies. By staying, you accept the', privacy: 'privacy policy', conjunction: 'and', offer: 'offer', accept: 'Accept', close: 'Close', label: 'Cookie notice' }
    : { lead: 'Мы используем cookies. Оставаясь на сайте, вы принимаете', privacy: 'политику конфиденциальности', conjunction: 'и', offer: 'оферту', accept: 'Принять', close: 'Закрыть', label: 'Уведомление о cookies' };

  // Проверяем, давал ли пользователь согласие
  function hasConsent() {
    try { return localStorage.getItem(CONSENT_KEY) === 'true'; } catch { return false; }
  }

  // Сохраняем согласие
  function saveConsent() {
    try {
      localStorage.setItem(CONSENT_KEY, 'true');
      localStorage.setItem(CONSENT_DATE_KEY, new Date().toISOString());
    } catch { /* The banner remains usable when browser storage is unavailable. */ }
    window.dispatchEvent(new CustomEvent('mlbb:consent-granted'));
  }

  // Создаём компактный баннер в правом нижнем углу
  function createConsentBanner() {
    // Не показываем если уже есть согласие
    if (hasConsent()) return;
    
    const banner = document.createElement('div');
    banner.className = 'consent-banner';
    banner.id = 'consent-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', copy.label);
    const base = isEnglish ? '/en' : '';
    banner.innerHTML = `
      <p class="consent-banner__text">${copy.lead} <a href="${base}/privacy.html">${copy.privacy}</a> ${copy.conjunction} <a href="${base}/offer.html">${copy.offer}</a>.</p>
      <div class="consent-banner__actions">
        <button type="button" class="consent-banner__accept" id="consent-accept">${copy.accept}</button>
        <button type="button" class="consent-banner__close" id="consent-close" aria-label="${copy.close}"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
      </div>
    `;
    
    document.body.appendChild(banner);
    
    // Показываем с задержкой и анимацией
    setTimeout(() => {
      banner.classList.add('active');
    }, 1000);
    
    // Обработчики кнопок
    document.getElementById('consent-accept').addEventListener('click', function() {
      saveConsent();
      hideConsentBanner();
    });
    
    document.getElementById('consent-close').addEventListener('click', function() {
      // При закрытии без согласия - просто скрываем до следующего визита
      hideConsentBanner();
    });
  }

  // Скрываем баннер
  function hideConsentBanner() {
    const banner = document.getElementById('consent-banner');
    if (banner) {
      banner.classList.remove('active');
      banner.classList.add('hiding');
      setTimeout(() => {
        banner.remove();
      }, 300);
    }
  }

  // Back to top functionality
  function initBackToTop() {
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
      backToTop.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // Инициализация при загрузке DOM
  document.addEventListener('DOMContentLoaded', function() {
    // Проверяем согласие только на основных страницах (не на юридических)
    const isLegalPage = window.location.pathname.includes('privacy') ||
                        window.location.pathname.includes('offer') ||
                        window.location.pathname.includes('terms') ||
                        window.location.pathname.includes('refund') ||
                        window.location.pathname.includes('disclaimer') ||
                        window.location.pathname.includes('cookies') ||
                        window.location.pathname.includes('security') ||
                        window.location.pathname.includes('sitemap');
    
    // Показываем баннер согласия только на основных страницах
    if (!hasConsent() && !isLegalPage) {
      createConsentBanner();
    }
    
    // Инициализация функций для юридических страниц
    initBackToTop();
  });

  // Экспортируем функции для внешнего использования
  window.MLBBConsent = {
    hasConsent: hasConsent,
    showConsentBanner: createConsentBanner,
    hideConsentBanner: hideConsentBanner
  };

})();

/* The Telegram start parameter also carries a calculator draft. Keep it within 64 characters. */
(() => {
  const routes = { h:'heroes', i:'items', s:'skins', n:'news', b:'boost', g:'guides', t:'nickname-generator' };
  function landingCode(path) {
    const en = path.startsWith('/en/');
    path = path.replace(/^\/en\//, '/').replace(/index\.html$/, '');
    const parts = path.split('/').filter(Boolean);
    const section = Object.keys(routes).find(k => routes[k] === parts[0]);
    const slug = (section ? parts.slice(1) : parts).join('_').replace(/\.html$/, '');
    if (!/^[a-z0-9_-]*$/.test(slug) || (!section && parts.length > 1)) return '';
    return (en ? 'E' : 'R') + (section || 'p') + slug;
  }
  const key = 'mlbb_first_landing_v1';
  let code = '';
  try {
    code = localStorage.getItem(key) || '';
    if (!code && (!document.referrer || new URL(document.referrer).origin !== location.origin))
      code = landingCode(location.pathname);
    const remember = () => { if (code && !localStorage.getItem(key)) localStorage.setItem(key, code); };
    if (localStorage.getItem('mlbb_consent_accepted') === 'true') remember();
    window.addEventListener('mlbb:consent-granted', remember);
  } catch { /* Unavailable storage leaves previous visits unknown. */ }
  function tracked(href) {
    if (!code || !href) return href;
    const url = new URL(href, location.href);
    if (url.origin !== 'https://t.me' || url.pathname !== '/cla1ve_boost_bot') return href;
    const start = url.searchParams.get('start');
    if (!/^(site|site_order|siteq1_[a-z0-9_-]+)$/.test(start || '') || start.includes('__')) return href;
    const suffix = start.length + 2 + code.length <= 64 ? code : code[1] === 'p' ? '' : code.slice(0,2) + 'X';
    if (suffix) url.searchParams.set('start', start + '__' + suffix);
    return url.href;
  }
  window.mlbbSiteBotLink = tracked;
  function measure(event, details = {}) {
    try {
      if (localStorage.getItem('mlbb_consent_accepted') !== 'true') return;
      const section = routes[code[1]] || (code ? code.slice(2) || 'home' : 'unknown');
      const params = { first_section: section, content_language: document.documentElement.lang, ...details };
      window.gtag?.('event', event, params);
      window.ym?.(99684184, 'reachGoal', event, params);
    } catch { /* Measurement must not interrupt navigation. */ }
  }
  window.mlbbMeasure = measure;
  const offerSelector = '.rank-cta, .hero-cta';
  function startMeasurement() {
    if (!hasStoredConsent()) return;
    if (location.pathname.endsWith('/order.html')) measure('calculator_open');
    if (!window.IntersectionObserver) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.intersectionRatio >= 0.5) {
        measure('rank_offer_view', { offer_position: entry.target.matches('.rank-cta') ? 'article' : 'profile' });
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.5 });
    document.querySelectorAll(offerSelector).forEach(offer => {
      if (offer.querySelector('a[href*="order.html"]')) observer.observe(offer);
    });
  }
  function hasStoredConsent() {
    try { return localStorage.getItem('mlbb_consent_accepted') === 'true'; } catch { return false; }
  }
  if (hasStoredConsent()) startMeasurement();
  else window.addEventListener('mlbb:consent-granted', startMeasurement, { once: true });
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    if (link.hostname === 't.me' && link.pathname === '/cla1ve_boost_bot') measure('site_bot_click');
    if (link.origin === location.origin && link.pathname.endsWith('/order.html')) measure('calculator_link_click', { offer_position: link.closest('.rank-cta') ? 'article' : link.closest('.hero-cta') ? 'profile' : 'other' });
  }, true);
  const decorate = () => document.querySelectorAll('a[href^="https://t.me/cla1ve_boost_bot"]').forEach(a => { a.href = tracked(a.href); });
  decorate();
  for (const event of ['pointerdown','click','contextmenu','focusin']) document.addEventListener(event, e => {
    const a = e.target.closest?.('a[href^="https://t.me/cla1ve_boost_bot"]');
    if (a) a.href = tracked(a.href);
  }, true);
  const sectionsMenu = document.querySelector('.game-menu details');
  if (sectionsMenu) {
    const closeOutside = (event) => {
      if (sectionsMenu.open && !sectionsMenu.contains(event.target)) sectionsMenu.open = false;
    };
    document.addEventListener('click', closeOutside);
    document.addEventListener('focusin', closeOutside);
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !sectionsMenu.open) return;
      event.preventDefault();
      event.stopPropagation();
      sectionsMenu.open = false;
      sectionsMenu.querySelector('summary').focus();
    }, true);
  }
})();
