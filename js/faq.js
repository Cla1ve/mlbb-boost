document.addEventListener('DOMContentLoaded', () => {
  // Находим все элементы FAQ
  const faqItems = document.querySelectorAll('.faq-item');
  
  // Добавляем обработчик на каждый элемент FAQ
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    
    question.addEventListener('click', () => {
      // Закрываем все остальные элементы
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
          otherItem.querySelector('.faq-answer').style.display = 'none';
        }
      });
      
      // Переключаем текущий элемент
      const isActive = item.classList.toggle('active');
      
      // Плавно показываем/скрываем ответ
      if (isActive) {
        answer.style.display = 'block';
        answer.style.animation = 'slideDown 0.3s ease forwards';
      } else {
        answer.style.animation = 'slideUp 0.3s ease forwards';
        setTimeout(() => {
          if (!item.classList.contains('active')) {
            answer.style.display = 'none';
          }
        }, 300);
      }
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
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  // Добавляем задержку для каждого элемента
  faqItems.forEach((item, index) => {
    item.style.animationDelay = `${index * 0.15}s`;
    observer.observe(item);
  });
});