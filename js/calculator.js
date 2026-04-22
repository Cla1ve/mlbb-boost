/**
 * MLBB Boost - Calculator Module v3.2
 * С поддержкой HTTPS для GitHub Pages
 */

// Базовые URL API
const API_BASE_HTTP = 'http://cla1veisapi.ru';
const API_BASE_HTTPS = 'https://cla1veisapi.ru';

// Определяем URL API в зависимости от протокола
const getApiUrl = () => {
  // Если сайт на HTTPS, используем HTTPS версию API
  if (window.location.protocol === 'https:') {
    return `${API_BASE_HTTPS}/calculate`;
  }
  // Для HTTP используем HTTP
  return `${API_BASE_HTTP}/calculate`;
};

const CALCULATE_API_URL = getApiUrl();
const DISCOUNT_PERCENT = 10;
const MIN_STARS_ORDER = 3;

// Структура рангов
const RANK_STRUCTURE = {
  warrior: { name: 'Воин', divisions: 3, starsPerDiv: 3, order: 0, img: 'Ранги/Warrior.webp' },
  elite: { name: 'Элита', divisions: 3, starsPerDiv: 4, order: 1, img: 'Ранги/Elite.webp' },
  master: { name: 'Мастер', divisions: 4, starsPerDiv: 4, order: 2, img: 'Ранги/Master.webp' },
  grandmaster: { name: 'Грандмастер', divisions: 5, starsPerDiv: 5, order: 3, img: 'Ранги/Grandmaster.webp' },
  epic: { name: 'Эпик', divisions: 5, starsPerDiv: 5, order: 4, img: 'Ранги/Epic.webp' },
  legend: { name: 'Легенда', divisions: 5, starsPerDiv: 5, order: 5, img: 'Ранги/Legend.webp' }
};

// Мифические ранги (звёзды вместо дивизионов)
const MYTHIC_RANKS = {
  mythic: { name: 'Мифик', from: 1, to: 24, order: 6, img: 'Ранги/Mythic.webp' },
  honor: { name: 'Мифическая честь', from: 25, to: 49, order: 7, img: 'Ранги/Mythical_Honor.webp' },
  glory: { name: 'Мифическая слава', from: 50, to: 99, order: 8, img: 'Ранги/Mythical_Glory.webp' },
  immortal: { name: 'Мифический бессмертный', from: 100, to: 2000, order: 9, img: 'Ранги/Mythical_Immortal.webp' }
};

// Типы буста
const BOOST_TYPES = {
  standard: { name: 'Обычный буст', apiType: 'standard' },
  role: { name: 'Буст на роли', apiType: 'role' },
  party: { name: 'Совместный буст', apiType: 'party' },
  hero: { name: 'Буст MMR', apiType: 'hero' },
  rising: { name: 'Rising буст', apiType: null }
};

let currentBoostType = 'standard';

document.addEventListener('DOMContentLoaded', () => {
  initCalculator();
  parseUrlParams();
  initAnimations();
});

function initCalculator() {
  generateRankOptions();

  document.querySelectorAll('.boost-type-btn').forEach(btn => {
    btn.addEventListener('click', () => selectBoostType(btn.dataset.type));
  });

  const calculateBtn = document.getElementById('calculate-btn');
  if (calculateBtn) {
    calculateBtn.addEventListener('click', calculatePrice);
  }

  const retryBtn = document.getElementById('retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', calculatePrice);
  }

  document.querySelectorAll('.rising-stage').forEach(stage => {
    stage.addEventListener('click', () => selectRisingStage(stage));
  });

  const rankFromSelect = document.getElementById('rank-from');
  const rankToSelect = document.getElementById('rank-to');
  
  if (rankFromSelect) {
    rankFromSelect.addEventListener('change', () => {
      updateStarsInput('from');
      updateRankImage('from');
      validateAndFilterTargetRanks();
      updateProgressSteps();
    });
  }
  
  if (rankToSelect) {
    rankToSelect.addEventListener('change', () => {
      updateStarsInput('to');
      updateRankImage('to');
      updateProgressSteps();
    });
  }

  // Валидация при изменении звёзд
  document.addEventListener('change', (e) => {
    if (e.target.id === 'stars-from' || e.target.id === 'stars-to') {
      if (e.target.id === 'stars-from') {
        validateAndFilterTargetRanks();
      }
      updateProgressSteps();
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'stars-from' || e.target.id === 'stars-to') {
      if (e.target.id === 'stars-from') {
        validateAndFilterTargetRanks();
      }
    }
  });

  updateRankImage('from');
  updateRankImage('to');
}

/**
 * Инициализация анимаций
 */
function initAnimations() {
  // Добавляем интерактивные частицы
  createParticles();
  
  // Анимация карточек при наведении
  initCardHoverEffects();
}

/**
 * Создание дополнительных частиц
 */
function createParticles() {
  const container = document.getElementById('particles-bg');
  if (!container) return;
  
  for (let i = 0; i < 10; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 10}s`;
    particle.style.animationDuration = `${12 + Math.random() * 10}s`;
    particle.style.opacity = `${0.1 + Math.random() * 0.3}`;
    container.appendChild(particle);
  }
}

/**
 * Эффекты при наведении на карточки
 */
function initCardHoverEffects() {
  const cards = document.querySelectorAll('.rank-selector-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
    });
  });
}

/**
 * Обновление индикатора прогресса
 */
function updateProgressSteps() {
  const rankFrom = document.getElementById('rank-from');
  const rankTo = document.getElementById('rank-to');
  const steps = document.querySelectorAll('.progress-step');
  
  if (!steps.length) return;
  
  // Сбрасываем все шаги
  steps.forEach(step => {
    step.classList.remove('active', 'completed');
  });
  
  // Шаг 1 - текущий ранг
  if (rankFrom && rankFrom.value) {
    steps[0]?.classList.add('completed');
    steps[1]?.classList.add('active');
  } else {
    steps[0]?.classList.add('active');
  }
  
  // Шаг 2 - желаемый ранг  
  if (rankTo && rankTo.value) {
    steps[1]?.classList.add('completed');
    steps[2]?.classList.add('active');
  }
}

/**
 * Генерация опций рангов
 */
function generateRankOptions() {
  const rankFromSelect = document.getElementById('rank-from');
  const rankToSelect = document.getElementById('rank-to');
  
  if (!rankFromSelect || !rankToSelect) return;

  rankFromSelect.innerHTML = '<option value="" disabled selected>Выберите ранг</option>';
  rankToSelect.innerHTML = '<option value="" disabled selected>Выберите ранг</option>';

  const rankOrder = ['warrior', 'elite', 'master', 'grandmaster', 'epic', 'legend'];
  
  // Дивизионные ранги
  rankOrder.forEach(rankKey => {
    const rank = RANK_STRUCTURE[rankKey];
    const optgroupFrom = document.createElement('optgroup');
    const optgroupTo = document.createElement('optgroup');
    optgroupFrom.label = rank.name;
    optgroupTo.label = rank.name;

    for (let div = rank.divisions; div >= 1; div--) {
      const divRoman = ['I', 'II', 'III', 'IV', 'V'][div - 1];
      const value = `${rankKey}|${div}`;
      
      const optionFrom = document.createElement('option');
      optionFrom.value = value;
      optionFrom.textContent = `${rank.name} ${divRoman}`;
      optionFrom.dataset.rankKey = rankKey;
      optionFrom.dataset.division = div;
      optionFrom.dataset.maxStars = rank.starsPerDiv;
      optionFrom.dataset.isMythic = 'false';
      
      const optionTo = optionFrom.cloneNode(true);
      
      optgroupFrom.appendChild(optionFrom);
      optgroupTo.appendChild(optionTo);
    }
    
    rankFromSelect.appendChild(optgroupFrom);
    rankToSelect.appendChild(optgroupTo);
  });

  // Мифические ранги
  Object.entries(MYTHIC_RANKS).forEach(([key, rank]) => {
    const optgroupFrom = document.createElement('optgroup');
    const optgroupTo = document.createElement('optgroup');
    optgroupFrom.label = rank.name;
    optgroupTo.label = rank.name;

    const value = `${key}|mythic`;
    
    const optionFrom = document.createElement('option');
    optionFrom.value = value;
    optionFrom.textContent = rank.name;
    optionFrom.dataset.rankKey = key;
    optionFrom.dataset.isMythic = 'true';
    optionFrom.dataset.minStars = rank.from;
    optionFrom.dataset.maxStars = rank.to;
    
    const optionTo = optionFrom.cloneNode(true);
    
    optgroupFrom.appendChild(optionFrom);
    optgroupTo.appendChild(optionTo);
    
    rankFromSelect.appendChild(optgroupFrom);
    rankToSelect.appendChild(optgroupTo);
  });
}

/**
 * Обновление поля ввода звёзд
 */
function updateStarsInput(type) {
  const rankSelect = document.getElementById(`rank-${type}`);
  const starsContainer = document.getElementById(`stars-container-${type}`);
  
  if (!rankSelect || !starsContainer) return;

  const selectedOption = rankSelect.options[rankSelect.selectedIndex];
  if (!selectedOption || !selectedOption.value) {
    starsContainer.innerHTML = createStarsSelect(type, 5, false);
    return;
  }

  const isMythic = selectedOption.dataset.isMythic === 'true';
  
  if (isMythic) {
    // Мифические ранги - текстовый ввод
    const minStars = parseInt(selectedOption.dataset.minStars) || 1;
    const maxStars = parseInt(selectedOption.dataset.maxStars) || 999;
    const defaultVal = type === 'from' ? minStars : minStars;
    
    starsContainer.innerHTML = `
      <label for="stars-${type}">
        <i class="fas fa-star"></i> Очки
      </label>
      <div class="select-wrapper">
        <input type="number" 
               id="stars-${type}" 
               class="stars-input" 
               min="${minStars}" 
               max="${maxStars}" 
               value="${defaultVal}"
               placeholder="${minStars}-${maxStars}">
      </div>
      <span class="stars-hint">${minStars} - ${maxStars}</span>
    `;
  } else {
    // Дивизионные ранги - выпадающий список
    const maxStars = parseInt(selectedOption.dataset.maxStars) || 5;
    starsContainer.innerHTML = createStarsSelect(type, maxStars, type === 'to');
  }
}

/**
 * Создание селекта звёзд
 */
function createStarsSelect(type, maxStars, selectMax) {
  let options = '';
  for (let i = 1; i <= maxStars; i++) {
    const text = i === 1 ? '1 звезда' : i < 5 ? `${i} звезды` : `${i} звёзд`;
    const selected = (selectMax && i === maxStars) || (!selectMax && i === 1) ? 'selected' : '';
    options += `<option value="${i}" ${selected}>${text}</option>`;
  }
  
  return `
    <label for="stars-${type}">
      <i class="fas fa-star"></i> Звёзды
    </label>
    <div class="select-wrapper">
      <select id="stars-${type}" class="stars-select">
        ${options}
      </select>
      <i class="fas fa-caret-down select-arrow"></i>
    </div>
  `;
}

/**
 * Валидация целевых рангов
 */
function validateAndFilterTargetRanks() {
  const rankFromSelect = document.getElementById('rank-from');
  const rankToSelect = document.getElementById('rank-to');
  
  if (!rankFromSelect || !rankToSelect) return;
  
  const fromOption = rankFromSelect.options[rankFromSelect.selectedIndex];
  if (!fromOption || !fromOption.value) return;
  
  const fromAbsoluteStars = calculateAbsoluteStars('from');
  
  const toOption = rankToSelect.options[rankToSelect.selectedIndex];
  if (toOption && toOption.value) {
    const toAbsoluteStars = calculateAbsoluteStars('to');
    
    if (fromAbsoluteStars >= toAbsoluteStars) {
      rankToSelect.selectedIndex = 0;
      document.getElementById('rank-image-to').innerHTML = '<div class="rank-placeholder"><i class="fas fa-trophy"></i></div>';
      
      const starsContainer = document.getElementById('stars-container-to');
      if (starsContainer) {
        starsContainer.innerHTML = createStarsSelect('to', 5, true);
      }
    }
  }
}

/**
 * Получение значения звёзд
 */
function getStarsValue(type) {
  const starsEl = document.getElementById(`stars-${type}`);
  if (!starsEl) return 1;
  const value = starsEl.value;
  if (!value || value === '') return 1;
  return parseInt(value) || 1;
}

/**
 * Вычисление абсолютных звёзд
 */
function calculateAbsoluteStars(type) {
  const rankSelect = document.getElementById(`rank-${type}`);
  
  if (!rankSelect) return 0;

  const option = rankSelect.options[rankSelect.selectedIndex];
  if (!option || !option.value) return 0;

  const rankKey = option.dataset.rankKey;
  const isMythic = option.dataset.isMythic === 'true';
  const stars = getStarsValue(type);
  
  let total = 0;
  const rankOrder = ['warrior', 'elite', 'master', 'grandmaster', 'epic', 'legend'];
  
  if (!isMythic) {
    const division = parseInt(option.dataset.division) || 1;
    const idx = rankOrder.indexOf(rankKey);
    
    for (let i = 0; i < idx; i++) {
      const r = RANK_STRUCTURE[rankOrder[i]];
      total += r.divisions * r.starsPerDiv;
    }
    
    const rank = RANK_STRUCTURE[rankKey];
    total += (rank.divisions - division) * rank.starsPerDiv;
    total += stars;
  } else {
    for (const key of rankOrder) {
      const r = RANK_STRUCTURE[key];
      total += r.divisions * r.starsPerDiv;
    }
    total += 1;
    total += stars;
  }
  
  return total;
}

/**
 * Обновление изображения ранга
 */
function updateRankImage(type) {
  const rankSelect = document.getElementById(`rank-${type}`);
  const imageContainer = document.getElementById(`rank-image-${type}`);
  
  if (!rankSelect || !imageContainer) return;

  const selectedOption = rankSelect.options[rankSelect.selectedIndex];
  if (!selectedOption || !selectedOption.value) {
    const icon = type === 'from' ? 'fa-question' : 'fa-trophy';
    imageContainer.innerHTML = `<div class="rank-placeholder"><i class="fas ${icon}"></i></div>`;
    return;
  }

  const rankKey = selectedOption.dataset.rankKey;
  let imgSrc = '';
  
  if (rankKey in RANK_STRUCTURE) {
    imgSrc = RANK_STRUCTURE[rankKey].img;
  } else if (rankKey in MYTHIC_RANKS) {
    imgSrc = MYTHIC_RANKS[rankKey].img;
  }
  
  if (imgSrc) {
    imageContainer.innerHTML = `<img src="${imgSrc}" alt="${rankKey}" class="rank-preview-img">`;
  }
}

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type');
  
  if (type && BOOST_TYPES[type]) {
    selectBoostType(type);
  }
}

function selectBoostType(type) {
  currentBoostType = type;
  
  document.querySelectorAll('.boost-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });

  document.querySelectorAll('.description-content').forEach(desc => {
    desc.classList.toggle('hidden', desc.dataset.type !== type);
  });

  const calculatorForm = document.getElementById('calculator-form');
  const risingCalculator = document.getElementById('rising-calculator');
  const calculationResult = document.getElementById('calculation-result');
  const calculationError = document.getElementById('calculation-error');

  if (type === 'rising') {
    calculatorForm?.classList.add('hidden');
    risingCalculator?.classList.remove('hidden');
  } else {
    calculatorForm?.classList.remove('hidden');
    risingCalculator?.classList.add('hidden');
  }
  
  calculationResult?.classList.add('hidden');
  calculationError?.classList.add('hidden');
}

function selectRisingStage(stageElement) {
  document.querySelectorAll('.rising-stage').forEach(s => s.classList.remove('selected'));
  stageElement.classList.add('selected');
}

/**
 * Формирование строки ранга для API
 */
function buildRankString(type) {
  const rankSelect = document.getElementById(`rank-${type}`);
  
  if (!rankSelect) return '';

  const option = rankSelect.options[rankSelect.selectedIndex];
  if (!option || !option.value) return '';

  const rankKey = option.dataset.rankKey;
  const isMythic = option.dataset.isMythic === 'true';
  const stars = getStarsValue(type);
  
  if (isMythic) {
    const rankName = MYTHIC_RANKS[rankKey]?.name || rankKey;
    return `${rankName} ${stars}`;
  } else {
    const division = parseInt(option.dataset.division) || 1;
    const divRoman = ['I', 'II', 'III', 'IV', 'V'][division - 1];
    const rankName = RANK_STRUCTURE[rankKey]?.name || rankKey;
    return `${rankName} ${divRoman} ${stars} звезд`;
  }
}

/**
 * Расчёт стоимости
 */
async function calculatePrice() {
  const rankFrom = buildRankString('from');
  const rankTo = buildRankString('to');
  const isWeakAccount = document.getElementById('weak-account')?.checked || false;

  if (!rankFrom) {
    showError('Пожалуйста, выберите текущий ранг');
    return;
  }
  
  if (!rankTo) {
    showError('Пожалуйста, выберите желаемый ранг');
    return;
  }

  const fromStars = calculateAbsoluteStars('from');
  const toStars = calculateAbsoluteStars('to');
  const starsDiff = toStars - fromStars;
  
  if (starsDiff <= 0) {
    showError('Желаемый ранг должен быть выше текущего');
    return;
  }

  if (starsDiff < MIN_STARS_ORDER) {
    showError(`Минимальный заказ — ${MIN_STARS_ORDER} звезды. Выберите более высокий целевой ранг.`);
    return;
  }

  const calculateBtn = document.getElementById('calculate-btn');
  const btnContent = calculateBtn.querySelector('.btn-content');
  const btnLoading = calculateBtn.querySelector('.btn-loading');
  
  // Показываем загрузку
  if (btnContent && btnLoading) {
    btnContent.classList.add('hidden');
    btnLoading.classList.remove('hidden');
  } else {
    calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Расчёт...';
  }
  calculateBtn.disabled = true;

  hideResult();
  hideError();

  try {
    const response = await fetch(CALCULATE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rank_from: rankFrom,
        rank_to: rankTo,
        boost_type: BOOST_TYPES[currentBoostType].apiType,
        weak_account_markup: isWeakAccount ? 10 : 0
      }),
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success && result.total !== undefined) {
      displayResult(
        result.total, 
        result.rank_from?.display || rankFrom, 
        result.rank_to?.display || rankTo,
        result.estimated_time || 'уточняется',
        result.winrate || '90%+'
      );
    } else if (result.error) {
      showError(result.error);
    } else {
      showError('Не удалось рассчитать стоимость. Проверьте выбранные ранги.');
    }
  } catch (error) {
    console.error('Ошибка расчёта:', error);
    
    let errorMessage = 'Ошибка соединения с сервером. ';
    
    if (error.message && error.message.includes('Failed to fetch')) {
      if (window.location.protocol === 'https:') {
        errorMessage += 'Проблема с HTTPS соединением. ';
        errorMessage += 'Если HTTPS ещё не настроен на сервере, используйте локальную версию сайта или закажите буст через Telegram-бота.';
      } else {
        errorMessage += 'Проверьте подключение к интернету или попробуйте позже.';
      }
    } else {
      errorMessage += 'Попробуйте позже или закажите буст через Telegram-бота.';
    }
    
    showError(errorMessage);
  } finally {
    // Восстанавливаем кнопку
    const btnContentRestore = calculateBtn.querySelector('.btn-content');
    const btnLoadingRestore = calculateBtn.querySelector('.btn-loading');
    
    if (btnContentRestore && btnLoadingRestore) {
      btnContentRestore.classList.remove('hidden');
      btnLoadingRestore.classList.add('hidden');
    } else {
      calculateBtn.innerHTML = '<i class="fas fa-calculator"></i> Рассчитать стоимость';
    }
    calculateBtn.disabled = false;
  }
}

function displayResult(originalPrice, rankFrom, rankTo, estimatedTime, winrate) {
  const resultBlock = document.getElementById('calculation-result');
  const resultType = document.getElementById('result-type');
  const resultRoute = document.getElementById('result-route');
  const originalPriceEl = document.getElementById('original-price');
  const discountedPriceEl = document.getElementById('discounted-price');
  const resultTime = document.getElementById('result-time');
  const resultWinrate = document.getElementById('result-winrate');

  const discountedPrice = Math.round(originalPrice * (1 - DISCOUNT_PERCENT / 100));

  if (resultType) resultType.textContent = BOOST_TYPES[currentBoostType].name;
  if (resultRoute) resultRoute.textContent = `${rankFrom} → ${rankTo}`;
  if (originalPriceEl) originalPriceEl.textContent = formatPrice(originalPrice);
  
  // Обновленный формат для нового дизайна
  if (discountedPriceEl) {
    const priceNumber = discountedPriceEl.querySelector('.price-number');
    const priceCurrency = discountedPriceEl.querySelector('.price-currency');
    
    if (priceNumber && priceCurrency) {
      priceNumber.textContent = discountedPrice.toLocaleString('ru-RU');
    } else {
      discountedPriceEl.textContent = formatPrice(discountedPrice);
    }
  }
  
  if (resultTime) resultTime.textContent = estimatedTime;
  if (resultWinrate) resultWinrate.textContent = winrate;

  // Обновляем прогресс-шаги
  const steps = document.querySelectorAll('.progress-step');
  steps.forEach(step => step.classList.add('completed'));

  resultBlock?.classList.remove('hidden');
  
  // Анимация появления результата
  setTimeout(() => {
    resultBlock?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

function formatPrice(price) {
  return price.toLocaleString('ru-RU') + ' ₽';
}

function showError(message) {
  const errorBlock = document.getElementById('calculation-error');
  const errorMessage = document.getElementById('error-message');
  
  if (errorMessage) errorMessage.textContent = message;
  errorBlock?.classList.remove('hidden');
  errorBlock?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideError() {
  document.getElementById('calculation-error')?.classList.add('hidden');
}

function hideResult() {
  document.getElementById('calculation-result')?.classList.add('hidden');
}

window.CalculatorModule = {
  calculatePrice,
  selectBoostType,
  BOOST_TYPES,
  RANK_STRUCTURE,
  MYTHIC_RANKS
};
