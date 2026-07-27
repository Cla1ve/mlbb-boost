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
    { text: 'Главная', link: '/', icon: 'fas fa-home', section: 'home' },
    { text: 'Услуги', link: '/services.html', icon: 'fas fa-star', section: 'services' },
    { text: 'Цены', link: '/prices.html', icon: 'fas fa-tags', section: 'prices' },
    { text: 'Отзывы', link: '/reviews.html', icon: 'fas fa-comments', section: 'reviews' },
    { text: 'Новости', link: '/news/', icon: 'fas fa-newspaper', section: 'news' },
    { text: 'FAQ', link: '/faq.html', icon: 'fas fa-question-circle', section: 'faq' },
    { text: 'О нас', link: '/about.html', icon: 'fas fa-users', section: 'about' }
  ];

  const navList = document.querySelector('.nav-list');
  const currentPath = window.location.pathname;
  const normalizedPath = currentPath.replace(/\/index\.html$/i, '/');
  // Очищаем текущий список
  if (navList) {
    navList.innerHTML = '';
    
    // Добавляем новые пункты меню
    menuItems.forEach((item) => {
      const li = document.createElement('li');
      
      // Определяем активную страницу
      const isActive = item.section === 'home'
        ? normalizedPath === '/'
        : item.section === 'news'
          ? normalizedPath.startsWith('/news/')
          : normalizedPath === item.link;
      
      li.innerHTML = `
        <a href="${item.link}" class="nav-link ${isActive ? 'active' : ''}" ${isActive ? 'aria-current="page"' : ''}>
          <i class="${item.icon}"></i>
          ${item.text}
        </a>
      `;
      
      navList.appendChild(li);
    });

    // Добавляем кнопку CTA в конец
    const ctaLi = document.createElement('li');
    const isOrderPage = normalizedPath === '/order.html';
    ctaLi.innerHTML = `
      <a href="/order.html?type=standard" class="nav-link cta ${isOrderPage ? 'active' : ''}" ${isOrderPage ? 'aria-current="page"' : ''}>
        <i class="fas fa-shopping-cart"></i>
        Купить буст
      </a>
    `;
    navList.appendChild(ctaLi);

    // Добавляем стили для корректного отображения
    if (window.innerWidth > 1024) {
      navList.style.display = 'flex';
      navList.style.alignItems = 'center';
      navList.style.gap = '0.5rem';
    }
  }

  // Particles.js Config
  const particlesContainer = document.getElementById('particles-js');
  const isMobile = window.innerWidth <= 768;
  if (particlesContainer && typeof particlesJS !== 'undefined') {
    particlesJS('particles-js', {
      particles: {
        number: {
          value: isMobile ? 30 : 80,
          density: {
            enable: true,
            value_area: isMobile ? 600 : 800
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
      const targetSelector = this.getAttribute('href');
      e.preventDefault();
      if (targetSelector === '#') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const target = document.querySelector(targetSelector);
      if (target) {
        const headerOffset = 80;
        const offsetPosition = window.scrollY + target.getBoundingClientRect().top - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        if (!target.matches('a[href], button, input, select, textarea, [tabindex]')) {
          target.setAttribute('tabindex', '-1');
        }
        target.focus({ preventScroll: true });
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
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
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
