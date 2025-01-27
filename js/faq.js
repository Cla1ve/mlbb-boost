document.addEventListener('DOMContentLoaded', () => {
  // Находим все элементы FAQ
  const faqItems = document.querySelectorAll('.faq-item');
  
  // Добавляем обработчик на каждый элемент FAQ
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
      // Закрываем все остальные элементы
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
        }
      });
      
      // Переключаем текущий элемент
      item.classList.toggle('active');
    });
  });

  // Анимация появления элементов при скролле
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1
  });

  // Добавляем задержку для каждого элемента
  faqItems.forEach((item, index) => {
    item.style.animationDelay = `${index * 0.15}s`;
    observer.observe(item);
  });
});