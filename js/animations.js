document.addEventListener('DOMContentLoaded', () => {
  // Page transition effect
  const pageTransition = document.querySelector('.page-transition');
  
  if (pageTransition) {
    window.addEventListener('load', () => {
      pageTransition.style.transform = 'translateY(-100%)';
    });

    document.querySelectorAll('a').forEach(link => {
      if (!link) return;
      link.addEventListener('click', (e) => {
        if (link.getAttribute('href')?.startsWith('/')) {
          e.preventDefault();
          pageTransition.style.transform = 'translateY(0)';
          
          setTimeout(() => {
            window.location.href = link.getAttribute('href');
          }, 500);
        }
      });
    });
  }

  // Mobile menu functionality
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const body = document.body;
  
  // Create overlay if it doesn't exist
  let overlay = document.querySelector('.menu-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.classList.add('menu-overlay');
    document.body.appendChild(overlay);
  }
  
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
      overlay.classList.toggle('active');
      body.style.overflow = body.style.overflow === 'hidden' ? '' : 'hidden';
    });

    // Close menu when clicking outside
    overlay.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navMenu.classList.remove('active');
      overlay.classList.remove('active');
      body.style.overflow = '';
    });

    // Close menu on link click
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
        overlay.classList.remove('active');
        body.style.overflow = '';
      });
    });

    // Close menu on resize if open
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
        overlay.classList.remove('active');
        body.style.overflow = '';
      }
    });
  }

  // FAQ specific animations
  const faqItems = document.querySelectorAll('.faq-item');
  if (faqItems.length) {
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      if (!question) return;
      
      question.addEventListener('click', () => {
        const currentlyActive = document.querySelector('.faq-item.active');
        if (currentlyActive && currentlyActive !== item) {
          currentlyActive.classList.remove('active');
        }
        item.classList.toggle('active');
      });
    });
    
    // Animate items on scroll
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

    faqItems.forEach(item => {
      observer.observe(item);
    });
  }

  // Navigation link highlight
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
});