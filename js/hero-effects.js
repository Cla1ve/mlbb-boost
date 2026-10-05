/* Homepage network starts on every device, then settles after 4.5 seconds. */
(function () {
  'use strict';
  function init() {
    var container = document.getElementById('particles-js');
    if (!container) return;
    if (typeof window.particlesJS !== 'function') return;
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
      var instance = window.pJSDom && window.pJSDom.find(function (item) { return item.pJS.canvas.el.parentNode === container; });
      if (instance && instance.pJS.canvas.el.width > 0) {
        container.classList.add('particles-running');
        window.setTimeout(function () {
          instance.pJS.particles.move.enable = false;
          window.cancelAnimationFrame(instance.pJS.fn.drawAnimFrame);
        }, 4500);
      }
    } catch (_) { container.classList.remove('particles-running'); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
