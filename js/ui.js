/* View controls only. Service rates and order calculations stay in their original modules. */
(function () {
  'use strict';
  function init() {
    var grid = document.getElementById('prices-grid');
    var buttons = document.querySelectorAll('[data-price-format]');
    if (grid && buttons.length) {
      var bar = document.querySelector('.price-format-bar');
      if (bar) bar.hidden = false;
      buttons.forEach(function (button) {
        button.addEventListener('click', function () {
          var type = button.getAttribute('data-price-format');
          grid.dataset.selectedType = type;
          buttons.forEach(function (item) { item.setAttribute('aria-pressed', String(item === button)); });
          grid.querySelectorAll('.price-item').forEach(function (item) {
            var matches = type === 'all' || item.querySelector('[data-type="' + type + '"]');
            item.hidden = !matches;
            item.classList.toggle('price-selected', type !== 'all' && !!matches);
          });
          grid.querySelectorAll('.price-card-link').forEach(function (link) {
            var url = new URL(link.href);
            if (type === 'all') url.searchParams.delete('type'); else url.searchParams.set('type', type);
            link.href = url.pathname + url.search;
          });
        });
      });
    }
    var disclosure = document.querySelector('.review-filter-options');
    if (disclosure) {
      var desktop = window.matchMedia('(min-width: 769px)');
      disclosure.open = desktop.matches;
      desktop.addEventListener('change', function () { disclosure.open = desktop.matches; });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
