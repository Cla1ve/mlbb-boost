/* Decorative homepage network with a static baseline and bounded motion. */
(function () {
  'use strict';
  function init() {
    var container = document.getElementById('particles-js');
    if (!container) return;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var deadline = performance.now() + 4500;
    var visible = true;
    var instance = null;
    var running = false;
    function start() {
      if (instance || typeof window.particlesJS !== 'function') return;
      var mobile = window.innerWidth <= 768;
      try {
        window.particlesJS('particles-js', {
          particles: {
            number: { value: mobile ? 30 : 80, density: { enable: true, value_area: mobile ? 600 : 800 } },
            color: { value: '#00FF9D' }, shape: { type: 'circle' },
            opacity: { value: .5, random: false }, size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: '#00FF9D', opacity: .4, width: 1 },
            move: { enable: true, speed: 2, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false }
          },
          interactivity: { detect_on: 'canvas', events: { onhover: { enable: false, mode: 'repulse' }, onclick: { enable: false, mode: 'push' }, resize: true } },
          retina_detect: true
        });
        instance = window.pJSDom && window.pJSDom.find(function (item) { return item.pJS.canvas.el.parentNode === container; });
        if (instance && instance.pJS.canvas.el.width > 0) {
          container.classList.add('particles-running');
          running = true;
        }
      } catch (_) { container.classList.remove('particles-running'); }
    }
    function sync() {
      var next = !reduced.matches && performance.now() < deadline && visible && !document.hidden;
      if (next) start();
      if (!instance) return;
      var system = instance.pJS;
      if (running && !next) {
        system.particles.move.enable = false;
        window.cancelAnimationFrame(system.fn.drawAnimFrame);
        running = false;
      } else if (!running && next) {
        system.particles.move.enable = true;
        system.fn.vendors.draw();
        running = true;
      }
    }
    reduced.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pagehide', function () { visible = false; sync(); });
    window.addEventListener('pageshow', function () { visible = true; sync(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; sync(); }).observe(container.closest('.hero'));
    }
    sync();
    window.setTimeout(sync, 4500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
