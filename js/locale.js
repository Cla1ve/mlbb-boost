/* Static page locale: preserve order parameters and avoid full-page translation work. */
(function () {
  'use strict';
  var language = document.documentElement.lang === 'en' ? 'en' : 'ru';
  function navigate(target) {
    var url = new URL(location.href);
    var pathname = url.pathname.replace(/^\/en(?=\/)/, '').replace(/\/index\.html$/i, '/');
    url.pathname = target === 'en' ? '/en' + pathname : pathname;
    url.searchParams.delete('lang');
    try { localStorage.setItem('mlbb_lang', target); } catch (e) {}
    location.assign(url.toString());
  }
  window.MLBBi18n = { get: function () { return language; }, set: navigate, refresh: function () {}, registerTransform: function () {} };
  var requested = new URL(location.href).searchParams.get('lang');
  if ((requested === 'ru' || requested === 'en') && requested !== language) { navigate(requested); return; }
  document.addEventListener('click', function (event) {
    var link = event.target.closest('.lang-switcher a[data-lang]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(link.getAttribute('data-lang'));
  });
})();
