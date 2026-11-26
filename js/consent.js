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
