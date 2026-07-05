/**
 * MLBB Boost - Prices Module
 * Загрузка цен из API по stale-while-revalidate:
 * сначала последняя валидная копия, потом фоновое обновление.
 */

// Базовый URL API
const API_BASE_HTTPS = 'https://cla1veisapi.ru';

// Всегда используем HTTPS: HTTP-версия API отвечает 301-редиректом,
// из-за чего запросы с локальных/HTTP-хостов обрывались.
const getPricesApiUrl = () => {
  return `${API_BASE_HTTPS}/prices/formatted`;
};

const PRICES_API_URL = getPricesApiUrl();
const CACHE_KEY = 'mlbb_prices_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 час в миллисекундах
const BACKGROUND_REFRESH_AFTER = 30 * 60 * 1000;
let lastDataStatusMode = 'fallback';
let lastDataStatusTimestamp = null;

// Последний проверенный fallback с API на 2026-07-05.
// Он нужен для первого визита, если API временно недоступен и localStorage ещё пуст.
const LAST_KNOWN_PRICES = [
  {
    category: 'warrior_elite',
    category_name: 'Воин, Элита',
    prices: [
      { type: 'hero', type_name: 'На герое', price: 65 },
      { type: 'party', type_name: 'В пати', price: 90 },
      { type: 'role', type_name: 'На роли', price: 55 },
      { type: 'standard', type_name: 'Стандарт', price: 50 }
    ]
  },
  {
    category: 'master_gm',
    category_name: 'Мастер, ГМ',
    prices: [
      { type: 'hero', type_name: 'На герое', price: 100 },
      { type: 'party', type_name: 'В пати', price: 115 },
      { type: 'role', type_name: 'На роли', price: 80 },
      { type: 'standard', type_name: 'Стандарт', price: 75 }
    ]
  },
  {
    category: 'epic',
    category_name: 'Эпик',
    prices: [
      { type: 'hero', type_name: 'На герое', price: 115 },
      { type: 'party', type_name: 'В пати', price: 190 },
      { type: 'role', type_name: 'На роли', price: 95 },
      { type: 'standard', type_name: 'Стандарт', price: 90 }
    ]
  },
  {
    category: 'legend',
    category_name: 'Легенда',
    prices: [
      { type: 'hero', type_name: 'На герое', price: 120 },
      { type: 'party', type_name: 'В пати', price: 205 },
      { type: 'role', type_name: 'На роли', price: 100 },
      { type: 'standard', type_name: 'Стандарт', price: 95 }
    ]
  },
  {
    category: 'mythic',
    category_name: 'Мифик',
    prices: [
      { type: 'hero', type_name: 'На герое', price: 140 },
      { type: 'party', type_name: 'В пати', price: 240 },
      { type: 'role', type_name: 'На роли', price: 120 },
      { type: 'standard', type_name: 'Стандарт', price: 115 }
    ]
  },
  {
    category: 'honor',
    category_name: 'Честь',
    prices: [
      { type: 'hero', type_name: 'На герое', price: 165 },
      { type: 'party', type_name: 'В пати', price: 290 },
      { type: 'role', type_name: 'На роли', price: 140 },
      { type: 'standard', type_name: 'Стандарт', price: 125 }
    ]
  },
  {
    category: 'glory',
    category_name: 'Слава',
    prices: [
      { type: 'hero', type_name: 'На герое', price: 205 },
      { type: 'party', type_name: 'В пати', price: 380 },
      { type: 'role', type_name: 'На роли', price: 165 },
      { type: 'standard', type_name: 'Стандарт', price: 160 }
    ]
  },
  {
    category: 'immortal',
    category_name: 'Бессмертный',
    prices: [
      { type: 'hero', type_name: 'На герое', price: 240 },
      { type: 'party', type_name: 'В пати', price: 445 },
      { type: 'role', type_name: 'На роли', price: 185 },
      { type: 'standard', type_name: 'Стандарт', price: 175 }
    ]
  }
];

// Маппинг категорий API на типы буста
const TYPE_MAPPING = {
  'standard': 'standard',
  'role': 'role',
  'hero': 'hero',
  'party': 'party'
};

const SCHEMA_OFFER_NAMES = {
  warrior_elite: 'Warrior/Elite буст',
  master_gm: 'Master/GM буст',
  epic: 'Epic буст',
  legend: 'Legend буст',
  mythic: 'Mythic буст',
  honor: 'Mythical Honor буст',
  glory: 'Mythical Glory буст',
  immortal: 'Mythical Immortal буст'
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  loadPrices();
});

/**
 * Загрузка цен из API или кэша
 */
async function loadPrices() {
  // Сначала всегда показываем последнюю валидную информацию, даже если она старая.
  const cached = getCachedPrices({ allowStale: true });

  if (cached && cached.data) {
    renderPrices(cached.data);
    setDataStatus(cached.fresh ? 'cache-fresh' : 'cache-stale', cached.timestamp);
    hideLoading();
    if (!cached.fresh || shouldRefreshCache()) {
      refreshPricesInBackground();
    }
    return;
  }

  renderPrices(LAST_KNOWN_PRICES);
  setDataStatus('fallback');
  showLoading();

  try {
    const prices = await fetchPricesFromAPI();
    if (isValidPricesData(prices)) {
      cachePrices(prices);
      renderPrices(prices);
      setDataStatus('live', Date.now());
    }
  } catch (error) {
    console.warn('API цен временно недоступен, используем резервные данные:', error);
    const oldCache = getCachedPrices({ allowStale: true });
    if (oldCache && oldCache.data) {
      renderPrices(oldCache.data);
      setDataStatus('cache-stale', oldCache.timestamp);
    } else {
      renderPrices(LAST_KNOWN_PRICES);
      setDataStatus('fallback');
    }
  }

  hideLoading();
}

/**
 * Получение цен из кэша
 */
function getCachedPrices(options) {
  try {
    const allowStale = !!(options && options.allowStale);
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (!isValidPricesData(data) || typeof timestamp !== 'number') return null;
    const age = Date.now() - timestamp;

    if (allowStale || age < CACHE_DURATION) {
      return {
        data,
        timestamp,
        age,
        fresh: age < CACHE_DURATION
      };
    }

    return null;
  } catch (error) {
    console.error('Ошибка чтения кэша:', error);
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
    
    return age > BACKGROUND_REFRESH_AFTER;
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
    if (isValidPricesData(prices)) {
      cachePrices(prices);
      renderPrices(prices);
      setDataStatus('live', Date.now());
    }
  } catch (error) {
    const cached = getCachedPrices({ allowStale: true });
    if (cached && cached.data) {
      setDataStatus('cache-stale', cached.timestamp);
    }
    console.log('Фоновое обновление не удалось, используем последнюю валидную копию');
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

    if (result.success && isValidPricesData(result.data)) {
      return result.data;
    }

    throw new Error('Неверный формат данных');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Проверка формы данных: кэшируем только полноценный прайс-лист.
 */
function isValidPricesData(data) {
  if (!Array.isArray(data) || data.length === 0) return false;

  return data.every(category => {
    if (!category || typeof category.category !== 'string' || !Array.isArray(category.prices)) return false;
    return category.prices.every(item => {
      return item &&
        TYPE_MAPPING[item.type] &&
        typeof item.price === 'number' &&
        isFinite(item.price) &&
        item.price > 0;
    });
  });
}

/**
 * Сохранение цен в кэш
 */
function cachePrices(data) {
  try {
    if (!isValidPricesData(data)) return;
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
  if (!isValidPricesData(pricesData)) return;

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

  updatePriceSchema(pricesData);

  // Добавляем анимацию обновления
  animatePriceUpdate();
}

/**
 * Синхронизация JSON-LD OfferCatalog с теми же валидными ценами, что видит пользователь.
 */
function updatePriceSchema(pricesData) {
  const standardPricesByName = {};

  pricesData.forEach(category => {
    const offerName = SCHEMA_OFFER_NAMES[category.category];
    const standard = category.prices.find(priceItem => priceItem.type === 'standard');
    if (offerName && standard && typeof standard.price === 'number') {
      standardPricesByName[offerName] = String(standard.price);
    }
  });

  if (!Object.keys(standardPricesByName).length) return;

  document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
    if (!script.textContent || !script.textContent.includes('hasOfferCatalog')) return;

    try {
      const data = JSON.parse(script.textContent);
      const offers = data &&
        data.hasOfferCatalog &&
        Array.isArray(data.hasOfferCatalog.itemListElement)
        ? data.hasOfferCatalog.itemListElement
        : [];

      let changed = false;
      offers.forEach(offer => {
        if (!offer || !standardPricesByName[offer.name]) return;
        const nextPrice = standardPricesByName[offer.name];
        if (String(offer.price) !== nextPrice) {
          offer.price = nextPrice;
          changed = true;
        }
      });

      if (changed) {
        script.textContent = JSON.stringify(data, null, 2);
      }
    } catch (error) {
      console.warn('Не удалось обновить JSON-LD цен:', error);
    }
  });
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
 * Статус свежести данных для доверия и диагностики.
 */
function setDataStatus(mode, timestamp) {
  const node = document.getElementById('prices-data-status');
  lastDataStatusMode = mode;
  lastDataStatusTimestamp = timestamp || null;

  if (node) {
    node.textContent = '';
    node.hidden = true;
    node.setAttribute('aria-hidden', 'true');
    node.dataset.status = mode;
  }
}

document.addEventListener('mlbb:langchange', () => {
  setDataStatus(lastDataStatusMode, lastDataStatusTimestamp);
});

/**
 * Экспорт функций для использования в других модулях
 */
window.PricesModule = {
  loadPrices,
  getCachedPrices,
  fetchPricesFromAPI,
  isValidPricesData,
  LAST_KNOWN_PRICES,
  CACHE_KEY,
  CACHE_DURATION
};
