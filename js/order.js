document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('boost-order-form');
  const steps = Array.from(document.querySelectorAll('.form-step'));
  const progress = document.querySelector('.progress');
  const prevBtn = document.querySelector('.nav-button.prev');
  const nextBtn = document.querySelector('.nav-button.next');
  const submitBtn = document.querySelector('.submit-order');
  const currentRankDisplay = document.getElementById('current-rank-display');
  const desiredRankDisplay = document.getElementById('desired-rank-display');
  const optionsDisplay = document.getElementById('options-display');
  const totalPriceDisplay = document.getElementById('total-price');

  if (!form || !steps.length || !progress || !prevBtn || !nextBtn || !submitBtn) return;

  const ranks = {
    warrior: { order: 0, label: 'Warrior' },
    elite: { order: 1, label: 'Elite' },
    master: { order: 2, label: 'Master' },
    grandmaster: { order: 3, label: 'Grandmaster' },
    epic: { order: 4, label: 'Epic' },
    legend: { order: 5, label: 'Legend' },
    mythic: { order: 6, label: 'Mythic' }
  };

  const tierPrices = {
    elite: 450,
    master: 700,
    grandmaster: 900,
    epic: 1350,
    legend: 1800,
    mythic: 2500
  };

  const optionPrices = {
    stream: 300,
    priority: 500,
    heroes: 400
  };

  const optionLabels = {
    stream: 'Стрим буста',
    priority: 'Приоритетный буст',
    heroes: 'Выбор героев'
  };

  let currentStep = 1;

  function getSelectedRank(stepNumber) {
    const step = form.querySelector(`.form-step[data-step="${stepNumber}"]`);
    const selected = step ? step.querySelector('.rank-option.selected') : null;
    return selected ? selected.dataset.rank : null;
  }

  function getCurrentRank() {
    return getSelectedRank(1);
  }

  function getDesiredRank() {
    return getSelectedRank(2);
  }

  function getSelectedOptions() {
    return Array.from(document.querySelectorAll('.option-card input:checked')).map(input => input.name);
  }

  function rankLabel(rankKey) {
    return ranks[rankKey] ? ranks[rankKey].label : '-';
  }

  function canGoToNextStep() {
    if (currentStep === 1 && !getCurrentRank()) {
      showNotification('Сначала выберите текущий ранг.', 'warning');
      return false;
    }

    if (currentStep === 2) {
      const currentRank = getCurrentRank();
      const desiredRank = getDesiredRank();

      if (!desiredRank) {
        showNotification('Выберите желаемый ранг.', 'warning');
        return false;
      }

      if (currentRank && ranks[desiredRank].order <= ranks[currentRank].order) {
        showNotification('Желаемый ранг должен быть выше текущего.', 'warning');
        return false;
      }
    }

    return true;
  }

  function setStep(nextStep) {
    const bounded = Math.max(1, Math.min(steps.length, nextStep));
    const previousStep = currentStep;
    steps[currentStep - 1].classList.remove('active');
    currentStep = bounded;
    steps[currentStep - 1].classList.add('active');

    progress.style.width = `${(currentStep / steps.length) * 100}%`;
    prevBtn.disabled = currentStep === 1;
    nextBtn.style.display = currentStep === steps.length ? 'none' : 'block';
    submitBtn.disabled = !isOrderReady();

    steps[currentStep - 1].style.animation = bounded > previousStep
      ? 'slideInRight 0.5s ease forwards'
      : 'slideInLeft 0.5s ease forwards';
  }

  function calculatePrice() {
    const currentRank = getCurrentRank();
    const desiredRank = getDesiredRank();

    if (!currentRank || !desiredRank || ranks[desiredRank].order <= ranks[currentRank].order) {
      return 0;
    }

    let total = 0;
    Object.keys(ranks).forEach(rankKey => {
      const order = ranks[rankKey].order;
      if (order > ranks[currentRank].order && order <= ranks[desiredRank].order) {
        total += tierPrices[rankKey] || 0;
      }
    });

    getSelectedOptions().forEach(option => {
      total += optionPrices[option] || 0;
    });

    return total;
  }

  function isOrderReady() {
    const currentRank = getCurrentRank();
    const desiredRank = getDesiredRank();
    return !!(
      currentRank &&
      desiredRank &&
      ranks[desiredRank] &&
      ranks[currentRank] &&
      ranks[desiredRank].order > ranks[currentRank].order
    );
  }

  function updateOrderSummary() {
    const currentRank = getCurrentRank();
    const desiredRank = getDesiredRank();
    const selectedOptions = getSelectedOptions();
    const totalPrice = calculatePrice();

    if (currentRankDisplay) currentRankDisplay.textContent = rankLabel(currentRank);
    if (desiredRankDisplay) desiredRankDisplay.textContent = rankLabel(desiredRank);

    if (optionsDisplay) {
      optionsDisplay.innerHTML = '';
      if (selectedOptions.length) {
        selectedOptions.forEach(option => {
          const item = document.createElement('li');
          item.textContent = optionLabels[option] || option;
          optionsDisplay.appendChild(item);
        });
      } else {
        const item = document.createElement('li');
        item.textContent = 'Без доп. опций';
        optionsDisplay.appendChild(item);
      }
    }

    if (totalPriceDisplay) {
      totalPriceDisplay.textContent = totalPrice
        ? `от ${totalPrice.toLocaleString('ru-RU')} ₽`
        : '0 ₽';
    }

    submitBtn.disabled = !isOrderReady();
  }

  function handleRankSelection(option) {
    const step = option.closest('.form-step');
    if (!step) return;

    step.querySelectorAll('.rank-option').forEach(item => item.classList.remove('selected'));
    option.classList.add('selected');

    const currentRank = getCurrentRank();
    const desiredRank = getDesiredRank();

    if (currentRank && desiredRank && ranks[desiredRank].order <= ranks[currentRank].order) {
      const desiredStep = form.querySelector('.form-step[data-step="2"]');
      const selectedDesired = desiredStep ? desiredStep.querySelector('.rank-option.selected') : null;
      if (selectedDesired) selectedDesired.classList.remove('selected');
    }

    updateOrderSummary();
  }

  function submitOrder(event) {
    if (event) event.preventDefault();

    if (!isOrderReady()) {
      showNotification('Проверьте текущий и желаемый ранг перед оформлением.', 'warning');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Открываем Telegram...';

    const currentRank = rankLabel(getCurrentRank());
    const desiredRank = rankLabel(getDesiredRank());
    const selectedOptions = getSelectedOptions().map(option => optionLabels[option]).join(', ') || 'без доп. опций';
    const totalPrice = calculatePrice();

    try {
      sessionStorage.setItem('mlbb_order_draft', JSON.stringify({
        currentRank,
        desiredRank,
        options: selectedOptions,
        estimatedPriceRub: totalPrice,
        createdAt: new Date().toISOString()
      }));
    } catch (error) {}

    window.location.href = 'https://t.me/cla1ve_boost_bot?start=site_order';
  }

  function showNotification(message, type) {
    const existing = document.querySelector('.order-notification');
    if (existing) existing.remove();

    const note = document.createElement('div');
    note.className = `order-notification ${type || 'info'}`;
    note.textContent = message;
    document.body.appendChild(note);

    setTimeout(() => {
      note.classList.add('visible');
    }, 10);

    setTimeout(() => {
      note.classList.remove('visible');
      setTimeout(() => note.remove(), 250);
    }, 2600);
  }

  prevBtn.addEventListener('click', () => setStep(currentStep - 1));
  nextBtn.addEventListener('click', () => {
    if (canGoToNextStep()) setStep(currentStep + 1);
  });

  form.addEventListener('submit', submitOrder);
  submitBtn.addEventListener('click', submitOrder);

  document.querySelectorAll('.rank-option').forEach(option => {
    option.addEventListener('click', () => handleRankSelection(option));
  });

  document.querySelectorAll('.option-card input').forEach(input => {
    input.addEventListener('change', updateOrderSummary);
  });

  setStep(1);
  updateOrderSummary();
});
