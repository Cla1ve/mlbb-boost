document.addEventListener('DOMContentLoaded', () => {
  // ============================================
  // SCROLL REVEAL - IntersectionObserver
  // ============================================
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  
  if (revealElements.length > 0 && 'IntersectionObserver' in window) {
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
  
  let overlay = document.querySelector('.menu-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.classList.add('menu-overlay');
    document.body.appendChild(overlay);
  }

  const closeMenu = () => {
    if (menuToggle) menuToggle.classList.remove('active');
    if (navMenu) navMenu.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    body.style.overflow = '';
  };
  
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      const isActive = navMenu.classList.contains('active');
      if (isActive) {
        closeMenu();
      } else {
        menuToggle.classList.add('active');
        navMenu.classList.add('active');
        overlay.classList.add('active');
        body.style.overflow = 'hidden';
      }
    });

    overlay.addEventListener('click', closeMenu);

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
        closeMenu();
      }
    });
  }

  // ============================================
  // CARD TILT EFFECT (desktop only)
  // ============================================
  if (window.innerWidth > 768) {
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