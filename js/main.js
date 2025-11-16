document.addEventListener('DOMContentLoaded', () => {
  // Loader
  const loader = document.querySelector('.loader');
  if (loader) {
    window.addEventListener('load', () => {
      loader.classList.add('hidden');
    });
  }

  // Добавляем разделы в мобильное меню
  const menuItems = [
    { text: 'Главная', link: 'index.html', icon: 'fas fa-home' },
    { text: 'Услуги', link: 'services.html', icon: 'fas fa-star' },
    { text: 'Отзывы', link: 'reviews.html', icon: 'fas fa-comments' },
    { text: 'FAQ', link: 'faq.html', icon: 'fas fa-question-circle' }
  ];

  const navList = document.querySelector('.nav-list');
  // Очищаем текущий список
  if (navList) {
    navList.innerHTML = '';
    
    // Добавляем новые пункты меню
    menuItems.forEach((item, index) => {
      const li = document.createElement('li');
      const isActive = window.location.pathname.endsWith(item.link);
      
      li.innerHTML = `
        <a href="${item.link}" class="nav-link ${isActive ? 'active' : ''}">
          <i class="${item.icon}"></i>
          ${item.text}
        </a>
      `;
      
      navList.appendChild(li);
      
      // Добавляем разделитель после каждого пункта, кроме последнего
      if (index < menuItems.length - 1) {
        const divider = document.createElement('div');
        divider.className = 'nav-divider';
        navList.appendChild(divider);
      }
    });

    // Добавляем кнопку CTA в конец
    const ctaLi = document.createElement('li');
    ctaLi.innerHTML = `
      <a href="https://t.me/cla1ve_boost_bot" target="_blank" class="nav-link cta">
        <i class="fab fa-telegram"></i>
        Купить буст
      </a>
    `;
    navList.appendChild(ctaLi);

    // Добавляем стили для корректного отображения
    navList.style.display = 'flex';
    navList.style.alignItems = 'center';
    navList.style.gap = '2rem';
  }

  // Particles.js Config
  const particlesContainer = document.getElementById('particles-js');
  if (particlesContainer && typeof particlesJS !== 'undefined') {
    particlesJS('particles-js', {
      particles: {
        number: {
          value: 80,
          density: {
            enable: true,
            value_area: 800
          }
        },
        color: {
          value: '#00FF9D'
        },
        shape: {
          type: 'circle'
        },
        opacity: {
          value: 0.5,
          random: false
        },
        size: {
          value: 3,
          random: true
        },
        line_linked: {
          enable: true,
          distance: 150,
          color: '#00FF9D',
          opacity: 0.4,
          width: 1
        },
        move: {
          enable: true,
          speed: 2,
          direction: 'none',
          random: false,
          straight: false,
          out_mode: 'out',
          bounce: false
        }
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: {
            enable: true,
            mode: 'repulse'
          },
          onclick: {
            enable: true,
            mode: 'push'
          },
          resize: true
        }
      },
      retina_detect: true
    });
  }

  // Smooth Scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollBy({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Scroll Animation
  const scrollElements = document.querySelectorAll('.animate-on-scroll');
  
  const elementInView = (el, offset = 0) => {
    const elementTop = el.getBoundingClientRect().top;
    return (
      elementTop <= 
      ((window.innerHeight || document.documentElement.clientHeight) * (1 - offset))
    );
  };

  const displayScrollElement = (element) => {
    element.classList.add('scrolled');
  };

  const hideScrollElement = (element) => {
    element.classList.remove('scrolled');
  };

  const handleScrollAnimation = () => {
    scrollElements.forEach((el) => {
      if (elementInView(el, 0.25)) {
        displayScrollElement(el);
      } else {
        hideScrollElement(el);
      }
    });
  };

  if (scrollElements.length > 0) {
    window.addEventListener('scroll', () => {
      handleScrollAnimation();
    });

    // Initialize scroll animation check
    handleScrollAnimation();
  }

  // Ленивая загрузка изображений
  const lazyImages = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.1
  });

  lazyImages.forEach(img => imageObserver.observe(img));

  // Кэширование для ускорения загрузки
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful');
        })
        .catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
    });
  }
});