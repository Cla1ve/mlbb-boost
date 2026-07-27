(function () {
  'use strict';

  const STORAGE_KEY = 'mlbb_lang';
  const htmlLanguage = document.documentElement.lang === 'en' ? 'en' : 'ru';
  const currentUrl = new URL(window.location.href);
  const requestedLanguage = currentUrl.searchParams.get('lang');
  const isEnglishNewsPath = currentUrl.pathname.startsWith('/en/news/');
  const isRussianNewsPath = currentUrl.pathname.startsWith('/news/');

  function pairedPath(targetLanguage) {
    if (targetLanguage === 'en' && isRussianNewsPath) {
      return currentUrl.pathname.replace(/^\/news\//, '/en/news/');
    }
    if (targetLanguage === 'ru' && isEnglishNewsPath) {
      return currentUrl.pathname.replace(/^\/en\/news\//, '/news/');
    }
    return currentUrl.pathname;
  }

  function compatibilityRedirect() {
    const needsEnglish = requestedLanguage === 'en' && isRussianNewsPath;
    const needsRussian = requestedLanguage === 'ru' && isEnglishNewsPath;
    if (!needsEnglish && !needsRussian) return false;

    const targetLanguage = needsEnglish ? 'en' : 'ru';
    const target = new URL(currentUrl);
    target.pathname = pairedPath(targetLanguage);
    target.searchParams.delete('lang');
    try {
      window.localStorage.setItem(STORAGE_KEY, targetLanguage);
    } catch {}
    window.location.replace(target.toString());
    return true;
  }

  if (compatibilityRedirect()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, htmlLanguage);
  } catch {}

  const stateKeys = ['category', 'page'];
  document.querySelectorAll('[data-news-language-link]').forEach((link) => {
    const targetLanguage = link.getAttribute('data-news-language-link');
    const target = new URL(link.href, window.location.origin);
    stateKeys.forEach((key) => {
      const value = currentUrl.searchParams.get(key);
      if (value) target.searchParams.set(key, value);
    });
    target.hash = currentUrl.hash;
    link.href = target.toString();
    link.addEventListener('click', () => {
      try {
        window.localStorage.setItem(STORAGE_KEY, targetLanguage);
      } catch {}
    });
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    }, { once: true });
  }
})();
