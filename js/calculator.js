/**
 * MLBB Boost - Calculator Module v3.2
 * С поддержкой HTTPS для GitHub Pages
 */

// Базовый URL API
const API_BASE_HTTPS = window.location.hostname === 'localhost'
  ? 'http://127.0.0.1:8766' : 'https://cla1veisapi.ru';

// Всегда используем HTTPS: HTTP-версия API отвечает 301-редиректом,
// из-за чего POST-запросы (fetch) обрывались с ошибкой соединения.
const getApiUrl = () => {
  return `${API_BASE_HTTPS}/calculate`;
};

const CALCULATE_API_URL = getApiUrl();
const DISCOUNT_PERCENT = 10;
const MIN_STARS_ORDER = 5;

// Структура рангов
const RANK_STRUCTURE = {
  warrior: { name: 'Воин', divisions: 3, starsPerDiv: 3, order: 0, img: '/images/ranks/Warrior.webp' },
  elite: { name: 'Элита', divisions: 3, starsPerDiv: 4, order: 1, img: '/images/ranks/Elite.webp' },
  master: { name: 'Мастер', divisions: 4, starsPerDiv: 4, order: 2, img: '/images/ranks/Master.webp' },
  grandmaster: { name: 'Грандмастер', divisions: 5, starsPerDiv: 5, order: 3, img: '/images/ranks/Grandmaster.webp' },
  epic: { name: 'Эпик', divisions: 5, starsPerDiv: 5, order: 4, img: '/images/ranks/Epic.webp' },
  legend: { name: 'Легенда', divisions: 5, starsPerDiv: 5, order: 5, img: '/images/ranks/Legend.webp' }
};

// Мифические ранги (звёзды вместо дивизионов)
const MYTHIC_RANKS = {
  mythic: { name: 'Мифик', from: 0, to: 24, order: 6, img: '/images/ranks/Mythic.webp' },
  honor: { name: 'Мифическая честь', from: 25, to: 49, order: 7, img: '/images/ranks/Mythical_Honor.webp' },
  glory: { name: 'Мифическая слава', from: 50, to: 99, order: 8, img: '/images/ranks/Mythical_Glory.webp' },
  immortal: { name: 'Мифический бессмертный', from: 100, to: 2000, order: 9, img: '/images/ranks/Mythical_Immortal.webp' }
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
let requestedCalibrationTargetStars = null;
let calculationRevision = 0;
const BOT_ORDER_URL = 'https://t.me/cla1ve_boost_bot?start=site';

function calibrationStatus() {
  return document.querySelector('input[name="calibration-status"]:checked')?.value || '';
}

function isEnglish() {
  return window.MLBBi18n?.get?.() === 'en';
}

document.addEventListener('DOMContentLoaded', () => {
  initCalculator();
  parseUrlParams();
  initAnimations();
});

function initCalculator() {
  generateRankOptions();
  for (const eventName of ['change', 'input']) {
    document.getElementById('calculator-form')?.addEventListener(eventName, () => {
      hideError();
      hideResult();
    });
  }

  document.querySelectorAll('.boost-type-btn').forEach(btn => {
    btn.addEventListener('click', () => selectBoostType(btn.dataset.type));
  });

  const calculateBtn = document.getElementById('calculate-btn');
  if (calculateBtn) {
    calculateBtn.addEventListener('click', calculatePrice);
  }

  document.querySelectorAll('.rising-stage').forEach(stage => {
    stage.addEventListener('click', () => selectRisingStage(stage));
  });

  const rankFromSelect = document.getElementById('rank-from');
  const rankToSelect = document.getElementById('rank-to');
  
  if (rankFromSelect) {
    rankFromSelect.addEventListener('change', () => {
      resetCalibrationSelection();
      updateStarsInput('from');
      updateRankImage('from');
      validateAndFilterTargetRanks();
      updateProgressSteps();
      updateCalibrationFields();
    });
  }
  
  if (rankToSelect) {
    rankToSelect.addEventListener('change', () => {
      requestedCalibrationTargetStars = null;
      updateStarsInput('to');
      updateRankImage('to');
      updateProgressSteps();
      updateCalibrationFields();
    });
  }

  // Валидация при изменении звёзд
  document.addEventListener('change', (e) => {
    if (e.target.id === 'stars-from' || e.target.id === 'stars-to') {
      if (e.target.id === 'stars-to') requestedCalibrationTargetStars = null;
      if (e.target.id === 'stars-from') {
        restoreRequestedTarget();
        document.getElementById('calibration-wins').value = '';
        validateAndFilterTargetRanks();
      }
      updateProgressSteps();
      updateCalibrationFields();
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'stars-from' || e.target.id === 'stars-to') {
      if (e.target.id === 'stars-to') requestedCalibrationTargetStars = null;
      if (e.target.id === 'stars-from') {
        restoreRequestedTarget();
        document.getElementById('calibration-wins').value = '';
        validateAndFilterTargetRanks();
      }
      updateCalibrationFields();
    }
  });

  updateRankImage('from');
  updateRankImage('to');
  initializeCalibrationFields();
}

function initializeCalibrationFields() {
  const matches = document.getElementById('calibration-matches');
  if (!matches) return;
  for (let count = 0; count <= 9; count++) {
    matches.add(new Option(String(count), String(count)));
  }
  document.querySelectorAll('input[name="calibration-status"]').forEach(field => {
    field.addEventListener('change', updateCalibrationFields);
  });
  matches.addEventListener('change', updateCalibrationFields);
  document.getElementById('calibration-wins')?.addEventListener('change', updateCalibrationFields);
  updateCalibrationFields();
}

function resetCalibrationSelection() {
  restoreRequestedTarget();
  document.querySelectorAll('input[name="calibration-status"]').forEach(field => {
    field.checked = false;
  });
  for (const id of ['calibration-matches', 'calibration-wins']) {
    const field = document.getElementById(id);
    if (field) field.value = '';
  }
}

function placementInference() {
  if (calibrationStatus() !== 'active' ||
      document.getElementById('rank-from')?.selectedOptions[0]?.dataset.rankKey !== 'mythic') {
    return { wins: null, error: '', origin: '' };
  }
  const stars = getStarsValue('from');
  const starsField = document.getElementById('stars-from');
  if (starsField?.value === '' || !Number.isInteger(stars) || stars < 0 || stars > 24) {
    return { wins: null, error: '', origin: '' };
  }
  const matchesValue = document.getElementById('calibration-matches')?.value;
  const matches = matchesValue === '' ? null : Number(matchesValue);
  if (stars >= 0 && stars <= 10 && stars % 2) {
    return { wins: null, origin: 'status', error: isEnglish()
      ? 'During active placement, enter an even star total up to 10⭐.'
      : 'При активной калибровке до 10⭐ укажите чётное число звёзд.' };
  }
  const wins = stars >= 0 && stars <= 10 ? stars / 2 : null;
  if (matches !== null && stars > 0 && matches === 0) {
    return { wins, origin: 'matches', error: isEnglish()
      ? 'Your rank already has stars. Enter the number of matches played.'
      : 'В текущем ранге уже есть звёзды. Укажите число сыгранных матчей.' };
  }
  if (matches !== null && wins !== null && wins > matches) {
    const winsWord = wins === 1 ? 'победу' : wins >= 2 && wins <= 4 ? 'победы' : 'побед';
    const matchesWord = matches === 1 ? 'матч' : matches >= 2 && matches <= 4 ? 'матча' : 'матчей';
    return { wins, origin: 'matches', error: isEnglish()
      ? `${stars}⭐ means ${wins} ${wins === 1 ? 'win' : 'wins'}, but only ${matches} ${matches === 1 ? 'match was' : 'matches were'} entered. Check your rank and match count.`
      : `Текущий ранг ${stars}⭐ означает ${wins} ${winsWord}, но сыграно только ${matches} ${matchesWord}. Проверьте ранг и число матчей.` };
  }
  return { wins, error: '', origin: '' };
}

function setCalibrationFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(`${fieldId}-error`);
  if (!field || !error) return false;
  error.textContent = message;
  error.classList.remove('hidden');
  field.dataset.calibrationInvalid = 'true';
  field.setAttribute('aria-invalid', 'true');
  const descriptions = new Set((field.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
  descriptions.add(error.id);
  field.setAttribute('aria-describedby', [...descriptions].join(' '));
  return true;
}

function clearCalibrationFieldErrors() {
  for (const fieldId of ['stars-from', 'calibration-status-passed', 'calibration-matches', 'calibration-wins']) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId}-error`);
    error?.classList.add('hidden');
    if (!field?.dataset.calibrationInvalid) continue;
    delete field.dataset.calibrationInvalid;
    field.removeAttribute('aria-invalid');
    const descriptions = (field.getAttribute('aria-describedby') || '').split(' ').filter(id => id && id !== error?.id);
    if (descriptions.length) field.setAttribute('aria-describedby', descriptions.join(' '));
    else field.removeAttribute('aria-describedby');
  }
}

function needsCalibrationQuestion() {
  if (currentBoostType === 'rising') return false;
  const from = document.getElementById('rank-from');
  const to = document.getElementById('rank-to');
  const fromKey = from?.selectedOptions[0]?.dataset.rankKey;
  const toKey = to?.selectedOptions[0]?.dataset.rankKey;
  if (!fromKey || !toKey || !MYTHIC_RANKS[toKey]) return false;
  if (toKey === 'mythic' && getStarsValue('to') === 0) return false;
  if (fromKey === 'mythic') return getStarsValue('from') < 10;
  return !MYTHIC_RANKS[fromKey];
}

function restoreRequestedTarget() {
  if (requestedCalibrationTargetStars !== null) {
    const field = document.getElementById('stars-to');
    if (field) field.value = String(requestedCalibrationTargetStars);
    requestedCalibrationTargetStars = null;
  }
  document.getElementById('placement-target-note')?.classList.add('hidden');
}

function updatePlacementTargetPreview() {
  const note = document.getElementById('placement-target-note');
  const targetField = document.getElementById('stars-to');
  const targetKey = document.getElementById('rank-to')?.selectedOptions[0]?.dataset.rankKey;
  if (!note || !targetField || !needsCalibrationQuestion() ||
      calibrationStatus() !== 'active' || targetKey !== 'mythic') {
    restoreRequestedTarget();
    return;
  }

  const fromKey = document.getElementById('rank-from')?.selectedOptions[0]?.dataset.rankKey;
  const requested = requestedCalibrationTargetStars ?? Number(targetField.value);
  if (!Number.isInteger(requested) || requested < 1 || requested > 24) {
    restoreRequestedTarget();
    return;
  }

  let matches = 0;
  let wins = 0;
  if (fromKey === 'mythic') {
    const matchesValue = document.getElementById('calibration-matches')?.value;
    if (matchesValue === '') { restoreRequestedTarget(); return; }
    matches = Number(matchesValue);
    const inferred = placementInference();
    if (inferred.error) { restoreRequestedTarget(); return; }
    const winsValue = document.getElementById('calibration-wins')?.value;
    if (inferred.wins === null && matches > 0 && winsValue === '') {
      restoreRequestedTarget(); return;
    }
    wins = inferred.wins ?? (matches === 0 ? 0 : Number(winsValue));
  }

  const routeStars = requested - (fromKey === 'mythic' ? getStarsValue('from') : 0);
  if (routeStars <= 0) { restoreRequestedTarget(); return; }
  const doubleWins = Math.min(10 - matches, Math.max(0, 5 - wins));
  const paidWins = Math.min(doubleWins, Math.ceil(routeStars / 2));
  const adjustment = paidWins * 2 - Math.min(routeStars, paidWins * 2);
  if (!adjustment) { restoreRequestedTarget(); return; }

  const actual = requested + adjustment;
  requestedCalibrationTargetStars = requested;
  if (actual <= 24) targetField.value = String(actual);
  const rankName = actual >= 25
    ? (isEnglish() ? 'Mythic Honor' : 'Мифическая честь')
    : (isEnglish() ? 'Mythic' : 'Мифик');
  note.textContent = isEnglish()
    ? `The last win gives +2⭐. Target: ${rankName} ${actual}⭐.`
    : `Последняя победа даёт +2⭐️. Цель: ${rankName} ${actual}⭐️.`;
  note.classList.remove('hidden');
}

function updateCalibrationFields() {
  const card = document.getElementById('calibration-card');
  const progress = document.getElementById('calibration-progress');
  const matches = document.getElementById('calibration-matches');
  const winsWrap = document.getElementById('calibration-wins-wrap');
  const wins = document.getElementById('calibration-wins');
  if (!card || !progress || !matches || !winsWrap || !wins) return;
  clearCalibrationFieldErrors();
  const needed = needsCalibrationQuestion();
  card.classList.toggle('hidden', !needed);
  if (!needed) {
    document.querySelectorAll('input[name="calibration-status"]').forEach(field => {
      field.checked = false;
    });
    matches.value = '';
    wins.value = '';
    restoreRequestedTarget();
    return;
  }
  const fromMythic = document.getElementById('rank-from')?.selectedOptions[0]?.dataset.rankKey === 'mythic';
  const status = calibrationStatus();
  const inferred = placementInference();
  if (inferred.error) {
    setCalibrationFieldError(inferred.origin === 'status' ? 'stars-from' : 'calibration-matches', inferred.error);
  }
  progress.classList.toggle('hidden', status !== 'active' || !fromMythic || inferred.origin === 'status');
  const count = matches.value === '' ? null : Number(matches.value);
  const showWins = fromMythic && status === 'active' && count !== null && count > 0 && inferred.wins === null;
  winsWrap.classList.toggle('hidden', !showWins);
  progress.classList.toggle('with-wins', showWins);
  const selectedWin = wins.value;
  wins.innerHTML = '<option value="">Выберите точное число</option>';
  if (count !== null && count > 0) {
    for (let winCount = 0; winCount <= count; winCount++) {
      wins.add(new Option(String(winCount), String(winCount)));
    }
    if (selectedWin !== '' && Number(selectedWin) <= count) wins.value = selectedWin;
  }
  if (inferred.error) restoreRequestedTarget();
  else updatePlacementTargetPreview();
}

function readCalibration() {
  if (!needsCalibrationQuestion()) return null;
  const status = calibrationStatus();
  if (!status) throw Object.assign(new Error(isEnglish()
    ? 'Select whether you have completed placement this season.'
    : 'Укажите, проходили ли вы калибровку в этом сезоне.'), { fieldId: 'calibration-status-passed' });
  if (status === 'passed') return { status: 'passed' };
  const fromMythic = document.getElementById('rank-from')?.selectedOptions[0]?.dataset.rankKey === 'mythic';
  if (!fromMythic) return { status: 'active', matches_played: 0, wins_played: 0 };
  const inferred = placementInference();
  if (inferred.error) throw Object.assign(new Error(inferred.error), {
    fieldId: inferred.origin === 'status' ? 'stars-from' : 'calibration-matches',
  });
  const matchesValue = document.getElementById('calibration-matches')?.value;
  if (matchesValue === '') throw Object.assign(new Error(isEnglish()
    ? 'Select the exact number of placement matches played, from 0 to 9.'
    : 'Укажите точное число сыгранных матчей калибровки: от 0 до 9.'), { fieldId: 'calibration-matches' });
  const matches = Number(matchesValue);
  if (inferred.wins !== null) {
    return { status: 'active', matches_played: matches, wins_played: inferred.wins };
  }
  const winsValue = document.getElementById('calibration-wins')?.value;
  if (matches > 0 && winsValue === '') throw Object.assign(new Error(isEnglish()
    ? 'Select the exact number of placement wins.'
    : 'Укажите точное число побед в калибровке.'), { fieldId: 'calibration-wins' });
  return { status: 'active', matches_played: matches, wins_played: matches === 0 ? 0 : Number(winsValue) };
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
    const minStars = Number(selectedOption.dataset.minStars);
    const maxStars = Number(selectedOption.dataset.maxStars);
    const defaultVal = type === 'from' ? minStars : minStars;
    
    starsContainer.innerHTML = `
      <label for="stars-${type}">
        <i class="fas fa-star"></i> Звёзды
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
  if (value === '') return 1;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 1 : parsed;
}

/**
 * Вычисление абсолютных звёзд
 */
function calculateAbsoluteStars(type, starsOverride = null) {
  const rankSelect = document.getElementById(`rank-${type}`);
  
  if (!rankSelect) return 0;

  const option = rankSelect.options[rankSelect.selectedIndex];
  if (!option || !option.value) return 0;

  const rankKey = option.dataset.rankKey;
  const isMythic = option.dataset.isMythic === 'true';
  const stars = starsOverride === null ? getStarsValue(type) : starsOverride;
  
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
    btn.setAttribute('aria-pressed', String(btn.dataset.type === type));
  });

  document.querySelectorAll('.description-content').forEach(desc => {
    desc.classList.toggle('hidden', desc.dataset.type !== type);
  });

  const calculatorForm = document.getElementById('calculator-form');
  const risingCalculator = document.getElementById('rising-calculator');

  if (type === 'rising') {
    calculatorForm?.classList.add('hidden');
    risingCalculator?.classList.remove('hidden');
  } else {
    calculatorForm?.classList.remove('hidden');
    risingCalculator?.classList.add('hidden');
  }
  
  hideResult();
  updateCalibrationFields();
}

function selectRisingStage(stageElement) {
  document.querySelectorAll('.rising-stage').forEach(s => {
    s.classList.remove('selected');
    s.setAttribute('aria-pressed', 'false');
  });
  stageElement.classList.add('selected');
  stageElement.setAttribute('aria-pressed', 'true');
}

/**
 * Формирование строки ранга для API
 */
function buildRankString(type, starsOverride = null) {
  const rankSelect = document.getElementById(`rank-${type}`);
  
  if (!rankSelect) return '';

  const option = rankSelect.options[rankSelect.selectedIndex];
  if (!option || !option.value) return '';

  const rankKey = option.dataset.rankKey;
  const isMythic = option.dataset.isMythic === 'true';
  const stars = starsOverride === null ? getStarsValue(type) : starsOverride;
  
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

function validateSelectedStars(type) {
  const option = document.getElementById(`rank-${type}`)?.selectedOptions[0];
  if (!option || option.dataset.isMythic !== 'true') return true;
  const field = document.getElementById(`stars-${type}`);
  const value = Number(field?.value);
  const min = Number(option.dataset.minStars);
  const max = Number(option.dataset.maxStars);
  if (field?.value !== '' && Number.isInteger(value) && value >= min && value <= max) return true;
  showError(
    isEnglish() ? `Enter a whole number from ${min} to ${max}.`
      : `Укажите целое число очков от ${min} до ${max}.`,
    `stars-${type}`,
  );
  return false;
}

/**
 * Расчёт стоимости
 */
async function calculatePrice() {
  hideError();
  const rankFrom = buildRankString('from');
  const rankTo = buildRankString('to', requestedCalibrationTargetStars);
  const isWeakAccount = document.getElementById('weak-account')?.checked || false;

  if (!rankFrom) {
    showError('Пожалуйста, выберите текущий ранг', 'rank-from');
    return;
  }
  
  if (!rankTo) {
    showError('Пожалуйста, выберите желаемый ранг', 'rank-to');
    return;
  }

  if (!validateSelectedStars('from') || !validateSelectedStars('to')) return;

  const fromStars = calculateAbsoluteStars('from');
  const toStars = calculateAbsoluteStars('to', requestedCalibrationTargetStars);
  const starsDiff = toStars - fromStars;
  
  if (starsDiff <= 0) {
    showError('Желаемый ранг должен быть выше текущего', 'rank-to');
    return;
  }

  if (starsDiff < MIN_STARS_ORDER) {
    showError(`Минимальный заказ — ${MIN_STARS_ORDER} звёзд. Выберите более высокий целевой ранг.`, 'stars-to');
    return;
  }

  let calibration;
  try {
    calibration = readCalibration();
  } catch (error) {
    showError(error.message, error.fieldId);
    return;
  }

  const boostType = currentBoostType;
  const orderUrl = buildBotOrderUrl(boostType, isWeakAccount, calibration);

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
  const revision = calculationRevision;

  try {
    const response = await fetch(CALCULATE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rank_from: rankFrom,
        rank_to: rankTo,
        boost_type: BOOST_TYPES[boostType].apiType,
        weak_account_markup: isWeakAccount ? 10 : 0,
        calibration
      }),
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (revision !== calculationRevision) return;

    if (result.success && result.total !== undefined) {
      const orderButton = document.getElementById('order-btn');
      if (orderButton) orderButton.href = orderUrl;
      displayResult(
        result.total, 
        formatResultRank(result.rank_from, rankFrom),
        formatResultRank(result.rank_to, rankTo),
        result.estimated_time || 'уточняется',
        result.winrate || 'уточняется',
        result
      );
    } else {
      showError(document.documentElement.lang === 'en'
        ? 'Could not calculate the price. Check your selected ranks and try again.'
        : 'Не удалось рассчитать стоимость. Проверьте выбранные ранги и попробуйте ещё раз.');
    }
  } catch (error) {
    if (revision !== calculationRevision) return;
    console.error('Ошибка расчёта:', error);
    
    showError(document.documentElement.lang === 'en'
      ? 'Could not calculate the price. Try again or place your order through the Telegram bot.'
      : 'Не удалось рассчитать стоимость. Попробуйте ещё раз или оформите заказ в Telegram-боте.');
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

function buildBotOrderUrl(boostType, weakAccount, calibration) {
  const rankToken = (type, starsOverride = null) => {
    const option = document.getElementById(`rank-${type}`).selectedOptions[0];
    const rank = RANK_STRUCTURE[option.dataset.rankKey] || MYTHIC_RANKS[option.dataset.rankKey];
    const division = option.dataset.isMythic === 'true' ? 0 : Number(option.dataset.division);
    const stars = starsOverride === null ? getStarsValue(type) : starsOverride;
    return `${rank.order}-${division}-${stars}`;
  };
  const type = { standard: 's', role: 'r', party: 'p', hero: 'h' }[boostType];
  const status = { passed: 'p', active: 'a' }[calibration?.status] || 'n';
  const payload = `siteq1_${type}_${rankToken('from')}_${rankToken('to', requestedCalibrationTargetStars)}_${weakAccount && boostType !== 'party' ? 1 : 0}_${status}_${calibration?.matches_played || 0}_${calibration?.wins_played || 0}`;
  return `https://t.me/cla1ve_boost_bot?start=${payload}`;
}

function formatResultRank(rank, fallback) {
  return String(rank?.display || fallback)
    .replace(/(\d+)\s+зв[её]зд(?:ы|а)?/gi, '$1⭐');
}

function displayResult(originalPrice, rankFrom, rankTo, estimatedTime, winrate, calculation) {
  const resultBlock = document.getElementById('calculation-result');
  const resultType = document.getElementById('result-type');
  const resultRoute = document.getElementById('result-route');
  const originalPriceEl = document.getElementById('original-price');
  const discountedPriceEl = document.getElementById('discounted-price');
  const resultTime = document.getElementById('result-time');
  const resultWinrate = document.getElementById('result-winrate');

  const discountedPrice = Math.round(originalPrice * (1 - DISCOUNT_PERCENT / 100));

  // Remember raw RUB amounts so we can re-render on language/rate change.
  if (originalPriceEl) originalPriceEl.dataset.rub = originalPrice;
  if (discountedPriceEl) discountedPriceEl.dataset.rub = discountedPrice;

  const useUsd = !!(window.MLBBCurrency && window.MLBBCurrency.isEnglish && window.MLBBCurrency.isEnglish());

  if (resultType) resultType.textContent = BOOST_TYPES[currentBoostType].name;
  if (resultRoute) resultRoute.textContent = `${rankFrom} → ${rankTo}`;
  const targetNote = document.getElementById('result-target-note');
  if (targetNote) {
    targetNote.dataset.adjusted = calculation?.calibration?.target_adjustment_stars ? 'true' : 'false';
    targetNote.classList.toggle('hidden', targetNote.dataset.adjusted !== 'true');
    renderResultTargetNote();
  }
  if (originalPriceEl) originalPriceEl.textContent = formatPrice(originalPrice);

  // Обновленный формат для нового дизайна
  if (discountedPriceEl) {
    const priceNumber = discountedPriceEl.querySelector('.price-number');
    const priceCurrency = discountedPriceEl.querySelector('.price-currency');

    if (priceNumber && priceCurrency) {
      if (useUsd) {
        // USD: symbol goes before the amount -> render in the number span.
        priceNumber.textContent = window.MLBBCurrency.format(discountedPrice);
        priceCurrency.textContent = '';
      } else {
        priceNumber.textContent = discountedPrice.toLocaleString('ru-RU');
        priceCurrency.textContent = '\u20BD';
      }
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

/**
 * Перерисовка цены результата при смене языка/курса (RUB <-> USD)
 */
function refreshResultCurrency() {
  const originalPriceEl = document.getElementById('original-price');
  const discountedPriceEl = document.getElementById('discounted-price');
  const useUsd = !!(window.MLBBCurrency && window.MLBBCurrency.isEnglish && window.MLBBCurrency.isEnglish());

  if (originalPriceEl) {
    const rub = parseInt(originalPriceEl.dataset.rub || '0', 10);
    originalPriceEl.textContent = formatPrice(rub);
  }
  if (discountedPriceEl) {
    const rub = parseInt(discountedPriceEl.dataset.rub || '0', 10);
    const priceNumber = discountedPriceEl.querySelector('.price-number');
    const priceCurrency = discountedPriceEl.querySelector('.price-currency');
    if (priceNumber && priceCurrency) {
      if (useUsd) {
        priceNumber.textContent = window.MLBBCurrency.format(rub);
        priceCurrency.textContent = '';
      } else {
        priceNumber.textContent = rub.toLocaleString('ru-RU');
        priceCurrency.textContent = '\u20BD';
      }
    } else {
      discountedPriceEl.textContent = formatPrice(rub);
    }
  }
}

// Initialize the placeholder in the right currency on load.
document.addEventListener('DOMContentLoaded', refreshResultCurrency);

// Re-render the result if the exchange rate loads/changes after calculation.
document.addEventListener('mlbb:ratechange', refreshResultCurrency);
// Re-render the result when the site language switches (RUB <-> USD).
document.addEventListener('mlbb:langchange', refreshResultCurrency);
document.addEventListener('mlbb:langchange', () => {
  updateCalibrationFields();
  renderResultTargetNote();
});

function renderResultTargetNote() {
  const note = document.getElementById('result-target-note');
  if (!note || note.dataset.adjusted !== 'true') return;
  note.textContent = isEnglish()
    ? 'The last placement win gives +2⭐.'
    : 'Последняя победа даёт +2⭐️.';
}

function formatPrice(price) {
  if (window.MLBBCurrency && window.MLBBCurrency.format) {
    return window.MLBBCurrency.format(price);
  }
  return price.toLocaleString('ru-RU') + ' ₽';
}

function showError(message, fieldId = null) {
  const field = fieldId ? document.getElementById(fieldId) : null;
  if (field && setCalibrationFieldError(fieldId, message)) {
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field.focus({ preventScroll: true });
    return;
  }
  const error = document.getElementById('form-error');
  if (!error) return;
  error.textContent = message;
  error.classList.remove('hidden');
  if (field) {
    field.setAttribute('aria-invalid', 'true');
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field.focus({ preventScroll: true });
  } else {
    error.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function hideError() {
  document.getElementById('form-error')?.classList.add('hidden');
  document.querySelectorAll('#calculator-form [aria-invalid="true"]').forEach(field => {
    if (!field.dataset.calibrationInvalid) field.removeAttribute('aria-invalid');
  });
}

function hideResult() {
  calculationRevision++;
  const orderButton = document.getElementById('order-btn');
  if (orderButton) orderButton.href = BOT_ORDER_URL;
  document.getElementById('calculation-result')?.classList.add('hidden');
}

window.CalculatorModule = {
  calculatePrice,
  selectBoostType,
  BOOST_TYPES,
  RANK_STRUCTURE,
  MYTHIC_RANKS
};
