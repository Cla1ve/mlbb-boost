document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('boost-order-form');
  const steps = document.querySelectorAll('.form-step');
  const progress = document.querySelector('.progress');
  const prevBtn = document.querySelector('.nav-button.prev');
  const nextBtn = document.querySelector('.nav-button.next');
  const submitBtn = document.querySelector('.submit-order');
  
  let currentStep = 1;
  
  function updateStep(direction) {
    steps[currentStep - 1].classList.remove('active');
    currentStep += direction;
    steps[currentStep - 1].classList.add('active');
    
    // Update progress bar
    progress.style.width = `${(currentStep / steps.length) * 100}%`;
    
    // Update navigation buttons
    prevBtn.disabled = currentStep === 1;
    nextBtn.style.display = currentStep === steps.length ? 'none' : 'block';
    submitBtn.disabled = currentStep !== steps.length;
    
    // Animate new step
    steps[currentStep - 1].style.animation = direction > 0 ? 
      'slideInRight 0.5s ease forwards' : 
      'slideInLeft 0.5s ease forwards';
  }
  
  prevBtn.addEventListener('click', () => updateStep(-1));
  nextBtn.addEventListener('click', () => updateStep(1));
  
  // Handle rank selection
  const rankOptions = document.querySelectorAll('.rank-option');
  const ranks = {
    warrior: 0,
    elite: 1,
    master: 2,
    grandmaster: 3,
    epic: 4,
    legend: 5,
    mythic: 6
  };
  rankOptions.forEach(option => {
    option.addEventListener('click', () => {
      const currentSelected = option.parentElement.querySelector('.selected');
      if (currentSelected) {
        currentSelected.classList.remove('selected');
      }
      option.classList.add('selected');
      
      // Update summary
      updateOrderSummary();
    });
  });
  
  // Handle additional options
  const optionInputs = document.querySelectorAll('.option-card input');
  optionInputs.forEach(input => {
    input.addEventListener('change', updateOrderSummary);
  });
  
  function updateOrderSummary() {
    // Update displays and calculate price
    const currentRank = document.querySelector('.rank-option.selected[data-rank="current"]')?.dataset.rank;
    const desiredRank = document.querySelector('.rank-option.selected[data-rank="desired"]')?.dataset.rank;
    
    document.getElementById('current-rank-display').textContent = currentRank || '-';
    document.getElementById('desired-rank-display').textContent = desiredRank || '-';
    
    // Calculate and update price
    calculatePrice();
  }
  
  function calculatePrice() {
    // Add your price calculation logic here
    const basePrice = 500;
    let totalPrice = basePrice;
    
    // Get current and desired ranks
    const currentRank = document.querySelector('.rank-option.selected[data-rank="current"]')?.dataset.rank;
    const desiredRank = document.querySelector('.rank-option.selected[data-rank="desired"]')?.dataset.rank;
    
    // Check if desired rank is higher than current rank
    if (ranks[desiredRank] <= ranks[currentRank]) {
      showNotification('Желаемый ранг должен быть выше текущего!');
      return;
    }
    
    // Calculate price based on rank difference
    const rankDifference = ranks[desiredRank] - ranks[currentRank];
    totalPrice = basePrice * rankDifference;
    
    // Add option prices
    optionInputs.forEach(input => {
      if (input.checked) {
        totalPrice += 500; // Example additional cost
      }
    });
    
    document.getElementById('total-price').textContent = `${totalPrice} ₽`;
  }
  
  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обработка...';
    
    try {
      // Get current and desired ranks
      const currentRank = document.querySelector('.rank-option.selected[data-rank="current"]')?.dataset.rank;
      const desiredRank = document.querySelector('.rank-option.selected[data-rank="desired"]')?.dataset.rank;
      const server = document.getElementById('server').value;
      
      // Calculate price
      calculatePrice();
      
      // Show confirmation dialog
      const confirmed = await showConfirmationDialog({
        currentRank,
        desiredRank,
        server,
        price: document.getElementById('total-price').textContent
      });
      
      if (confirmed) {
        // Add your order submission logic here
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
        
        showNotification('Заказ успешно оформлен!', 'success');
        setTimeout(() => {
          window.location.href = '/order-success.html';
        }, 1500);
      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Оформить заказ <i class="fas fa-arrow-right"></i>';
      }
    } catch (error) {
      showNotification('Произошла ошибка. Попробуйте позже.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Оформить заказ <i class="fas fa-arrow-right"></i>';
    }
  });
  
  function showConfirmationDialog({ currentRank, desiredRank, server, price }) {
    return new Promise((resolve) => {
      const confirmed = confirm(
        `Подтвердите заказ:\n
        От: ${currentRank.toUpperCase()}\n
        До: ${desiredRank.toUpperCase()}\n
        Сервер: ${server}\n
        Стоимость: ${price}`
      );
      resolve(confirmed);
    });
  }
  
  function showNotification(message, type = 'success') {
    alert(message);
  }
});