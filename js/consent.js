/**
 * MLBB Boost - Consent Manager
 * Компактный баннер согласия на обработку ПД и cookies в правом нижнем углу
 */

(function() {
  'use strict';

  // Ключи для localStorage
  const CONSENT_KEY = 'mlbb_consent_accepted';
  const CONSENT_DATE_KEY = 'mlbb_consent_date';

  // Проверяем, давал ли пользователь согласие
  function hasConsent() {
    return localStorage.getItem(CONSENT_KEY) === 'true';
  }

  // Сохраняем согласие
  function saveConsent() {
    localStorage.setItem(CONSENT_KEY, 'true');
    localStorage.setItem(CONSENT_DATE_KEY, new Date().toISOString());
  }

  // Создаём компактный баннер в правом нижнем углу
  function createConsentBanner() {
    // Не показываем если уже есть согласие
    if (hasConsent()) return;
    
    const banner = document.createElement('div');
    banner.className = 'consent-banner';
    banner.id = 'consent-banner';
    
    banner.innerHTML = `
      <div class="consent-banner-content">
        <div class="consent-banner-icon">
          <i class="fas fa-shield-alt"></i>
        </div>
        <div class="consent-banner-text">
          <p><strong>Мы заботимся о вашей конфиденциальности</strong></p>
          <p class="consent-banner-desc">
            Используя сайт, вы соглашаетесь с 
            <a href="privacy.html">Политикой конфиденциальности</a> и 
            <a href="offer.html">Публичной офертой</a>. 
            Мы также используем cookies.
          </p>
        </div>
        <div class="consent-banner-actions">
          <button class="consent-banner-btn accept" id="consent-accept">
            <i class="fas fa-check"></i> Принять
          </button>
          <button class="consent-banner-btn more" id="consent-more">
            Подробнее
          </button>
        </div>
        <button class="consent-banner-close" id="consent-close" title="Закрыть">
          <i class="fas fa-times"></i>
        </button>
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
    
    document.getElementById('consent-more').addEventListener('click', function() {
      window.open('privacy.html', '_blank');
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

  // Smooth scroll для якорных ссылок
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
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
    initSmoothScroll();
    initBackToTop();
  });

  // Экспортируем функции для внешнего использования
  window.MLBBConsent = {
    hasConsent: hasConsent,
    showConsentBanner: createConsentBanner,
    hideConsentBanner: hideConsentBanner
  };

})();
