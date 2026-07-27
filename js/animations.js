document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ============================================
  // SCROLL REVEAL - IntersectionObserver
  // с автоматическим stagger для соседних карточек
  // ============================================
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

  if (prefersReducedMotion) {
    revealElements.forEach(el => el.classList.add('revealed'));
  } else if (revealElements.length > 0 && 'IntersectionObserver' in window) {
    // Даём соседним reveal-элементам внутри одного родителя
    // небольшую каскадную задержку — секции "оживают" волной.
    const parentGroups = new Map();
    revealElements.forEach(el => {
      const parent = el.parentElement;
      if (!parentGroups.has(parent)) parentGroups.set(parent, []);
      parentGroups.get(parent).push(el);
    });
    parentGroups.forEach(group => {
      if (group.length > 1) {
        group.forEach((el, i) => {
          if (!el.style.transitionDelay) {
            el.style.transitionDelay = `${Math.min(i * 70, 350)}ms`;
          }
        });
      }
    });

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('revealed'));
  }

  // ============================================
  // HEADER SCROLL EFFECT
  // ============================================
  const header = document.querySelector('.site-header');
  let lastScrollY = 0;
  let ticking = false;
  
  if (header) {
    const updateHeader = () => {
      const scrollY = window.scrollY;
      
      if (scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      
      lastScrollY = scrollY;
      ticking = false;
    };
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });
  }

  // ============================================
  // COUNTER ANIMATION
  // ============================================
  const counterElements = document.querySelectorAll('[data-counter="true"]');
  
  if (counterElements.length > 0 && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const endValue = el.getAttribute('data-counter-end');
          const originalText = el.textContent;
          const suffix = originalText.replace(/[\d.]/g, '');
          const isFloat = endValue.includes('.');
          const target = parseFloat(endValue);
          const duration = 1500;
          const startTime = performance.now();
          
          const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * target;
            
            if (isFloat) {
              el.textContent = current.toFixed(1) + suffix;
            } else {
              el.textContent = Math.floor(current) + suffix;
            }
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              el.textContent = originalText;
            }
          };
          
          requestAnimationFrame(animate);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    
    counterElements.forEach(el => counterObserver.observe(el));
  }

  // ============================================
  // MOBILE MENU
  // ============================================
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const body = document.body;
  const mobileMenuQuery = window.matchMedia('(max-width: 1024px)');
  const menuFocusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  
  let overlay = document.querySelector('.menu-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.classList.add('menu-overlay');
    document.body.appendChild(overlay);
  }

  const syncMenuAccessibility = () => {
    if (!navMenu) return;
    const closedOnMobile = mobileMenuQuery.matches && !navMenu.classList.contains('active');
    navMenu.inert = closedOnMobile;
    if (closedOnMobile) navMenu.setAttribute('aria-hidden', 'true');
    else navMenu.removeAttribute('aria-hidden');
  };

  const closeMenu = ({ restoreFocus = false } = {}) => {
    if (menuToggle) {
      menuToggle.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Открыть меню');
    }
    if (navMenu) navMenu.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    body.style.overflow = '';
    syncMenuAccessibility();
    if (restoreFocus && menuToggle) menuToggle.focus();
  };
  
  if (menuToggle && navMenu) {
    if (!navMenu.id) navMenu.id = 'site-navigation';
    menuToggle.setAttribute('aria-controls', navMenu.id);
    menuToggle.setAttribute('aria-label', 'Открыть меню');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.addEventListener('click', () => {
      const isActive = navMenu.classList.contains('active');
      if (isActive) {
        closeMenu({ restoreFocus: true });
      } else {
        navMenu.inert = false;
        navMenu.removeAttribute('aria-hidden');
        menuToggle.classList.add('active');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.setAttribute('aria-label', 'Закрыть меню');
        navMenu.classList.add('active');
        overlay.classList.add('active');
        body.style.overflow = 'hidden';
        navMenu.querySelector(menuFocusableSelector)?.focus();
      }
    });

    overlay.addEventListener('click', () => closeMenu({ restoreFocus: true }));

    // Escape и Tab удерживают фокус внутри открытого мобильного меню.
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        closeMenu({ restoreFocus: true });
        return;
      }
      if (e.key === 'Tab' && navMenu.classList.contains('active')) {
        const focusable = Array.from(navMenu.querySelectorAll(menuFocusableSelector))
          .filter((element) => !element.inert && element.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    navMenu.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });

    mobileMenuQuery.addEventListener('change', () => {
      if (!mobileMenuQuery.matches && navMenu.classList.contains('active')) closeMenu();
      syncMenuAccessibility();
    });
    syncMenuAccessibility();
  }

  // ============================================
  // CARD TILT EFFECT (desktop only, отключается при reduced motion)
  // ============================================
  if (window.innerWidth > 768 && !prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
    const tiltCards = document.querySelectorAll('.service-preview-card, .why-card, .stat-card');
    
    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / centerY * -3;
        const rotateY = (x - centerX) / centerX * 3;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ============================================
  // NAV HIGHLIGHT
  // ============================================
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    if (href === currentPath || currentPath.endsWith('/' + href)) {
      link.classList.add('active');
    }
  });
});
