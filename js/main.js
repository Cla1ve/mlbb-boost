document.addEventListener('DOMContentLoaded', () => {
  // Loader
  const loader = document.querySelector('.loader');
  if (loader) {
    window.addEventListener('load', () => {
      loader.classList.add('hidden');
    });
  }

  // Particles.js Config
  const particlesContainer = document.getElementById('particles-js');
  const isMobile = window.innerWidth <= 768;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (particlesContainer && !isMobile && !reducedMotion && typeof particlesJS !== 'undefined') {
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
        window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        return;
      }

      const target = document.querySelector(targetSelector);
      if (target) {
        const headerOffset = 80;
        const offsetPosition = window.scrollY + target.getBoundingClientRect().top - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
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
