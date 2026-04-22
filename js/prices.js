/**
 * MLBB Boost - Prices Module
 * Загрузка цен из API с кэшированием на 1 час
 */

// Базовые URL API
const API_BASE_HTTP = 'http://cla1veisapi.ru';
const API_BASE_HTTPS = 'https://cla1veisapi.ru';

// Определяем URL API в зависимости от протокола
const getPricesApiUrl = () => {
  if (window.location.protocol === 'https:') {
    return `${API_BASE_HTTPS}/prices/formatted`;
  }
  return `${API_BASE_HTTP}/prices/formatted`;
};

const PRICES_API_URL = getPricesApiUrl();
const CACHE_KEY = 'mlbb_prices_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 час в миллисекундах

// Маппинг категорий API на типы буста
const TYPE_MAPPING = {
  'standard': 'standard',
  'role': 'role',
  'hero': 'hero',
  'party': 'party'
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  loadPrices();
});

/**
 * Загрузка цен из API или кэша
 */
async function loadPrices() {
  const loadingIndicator = document.getElementById('loading-indicator');
  
  // Пробуем загрузить из кэша
  const cached = getCachedPrices();
  
  if (cached) {
    // Кэш валиден - используем его
    renderPrices(cached);
    hideLoading();
    
    // Асинхронно проверяем, не пора ли обновить
    if (shouldRefreshCache()) {
      refreshPricesInBackground();
    }
    return;
  }
  
  // Нет валидного кэша - загружаем из API
  showLoading();
  
  try {
    const prices = await fetchPricesFromAPI();
    if (prices) {
      cachePrices(prices);
      renderPrices(prices);
    }
  } catch (error) {
    console.error('Ошибка загрузки цен:', error);
    // Пробуем использовать старый кэш если есть
    const oldCache = getOldCache();
    if (oldCache) {
      renderPrices(oldCache);
    }
    // Иначе оставляем статичные значения из HTML
  }
  
  hideLoading();
}

/**
 * Получение цен из кэша
 */
function getCachedPrices() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age < CACHE_DURATION) {
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Ошибка чтения кэша:', error);
    return null;
  }
}

/**
 * Получение старого кэша (даже если истёк)
 */
function getOldCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data } = JSON.parse(cached);
    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Проверка, нужно ли обновить кэш в фоне
 */
function shouldRefreshCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return true;
    
    const { timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    // Обновляем если кэшу больше 30 минут
    return age > (30 * 60 * 1000);
  } catch (error) {
    return true;
  }
}

/**
 * Фоновое обновление цен
 */
async function refreshPricesInBackground() {
  try {
    const prices = await fetchPricesFromAPI();
    if (prices) {
      cachePrices(prices);
      renderPrices(prices);
    }
  } catch (error) {
    console.log('Фоновое обновление не удалось, используем кэш');
  }
}

/**
 * Запрос цен из API
 */
async function fetchPricesFromAPI() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут
  
  try {
    const response = await fetch(PRICES_API_URL, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && Array.isArray(result.data)) {
      return result.data;
    }
    
    throw new Error('Неверный формат данных');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Сохранение цен в кэш
 */
function cachePrices(data) {
  try {
    const cacheData = {
      data: data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Ошибка сохранения в кэш:', error);
  }
}

/**
 * Рендеринг цен на странице
 */
function renderPrices(pricesData) {
  if (!pricesData || !Array.isArray(pricesData)) return;
  
  pricesData.forEach(category => {
    const card = document.querySelector(`[data-category="${category.category}"]`);
    if (!card) return;
    
    category.prices.forEach(priceItem => {
      const priceElement = card.querySelector(`[data-type="${priceItem.type}"]`);
      if (priceElement) {
        priceElement.textContent = `${priceItem.price} ₽`;
        priceElement.classList.add('updated');
      }
    });
  });
  
  // Добавляем анимацию обновления
  animatePriceUpdate();
}

/**
 * Анимация обновления цен
 */
function animatePriceUpdate() {
  const priceValues = document.querySelectorAll('.price-value.updated');
  
  priceValues.forEach((el, index) => {
    setTimeout(() => {
      el.classList.add('animate');
      setTimeout(() => {
        el.classList.remove('animate');
        el.classList.remove('updated');
      }, 600);
    }, index * 50);
  });
}

/**
 * Показать индикатор загрузки
 */
function showLoading() {
  const indicator = document.getElementById('loading-indicator');
  if (indicator) {
    indicator.classList.add('visible');
  }
}

/**
 * Скрыть индикатор загрузки
 */
function hideLoading() {
  const indicator = document.getElementById('loading-indicator');
  if (indicator) {
    indicator.classList.remove('visible');
  }
}

/**
 * Экспорт функций для использования в других модулях
 */
window.PricesModule = {
  loadPrices,
  getCachedPrices,
  fetchPricesFromAPI,
  CACHE_KEY,
  CACHE_DURATION
};
