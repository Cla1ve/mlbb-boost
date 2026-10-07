/* Generated public review aggregate. No full review downloads on landing pages. */
(function () {
  'use strict';
  var stats = {"count":1155,"rating":5,"satisfaction":99};
  function apply() {
    document.querySelectorAll('[data-review-stat]').forEach(function (node) {
      var key = node.getAttribute('data-review-stat');
      node.textContent = key === 'rating' ? stats.rating.toFixed(1) : key === 'satisfaction' ? stats.satisfaction + '%' : String(stats[key]);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
})();
