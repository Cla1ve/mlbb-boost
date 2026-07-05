const CACHE_VERSION = 'mlbb-boost-v7';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/services.html',
  '/prices.html',
  '/contact.html',
  '/reviews.html',
  '/faq.html',
  '/about.html',
  '/order.html',
  '/styles/main.css',
  '/styles/animations.css',
  '/styles/about.css',
  '/styles/contact.css',
  '/styles/faq.css',
  '/styles/home.css',
  '/styles/legal.css',
  '/styles/order.css',
  '/styles/prices.css',
  '/styles/reviews.css',
  '/styles/services.css',
  '/js/main.js',
  '/js/animations.js',
  '/js/calculator.js',
  '/js/consent.js',
  '/js/faq.js',
  '/js/i18n-dict.js',
  '/js/i18n-reviews.js',
  '/js/i18n-legal.js',
  '/js/i18n-legal-body.js',
  '/js/i18n.js',
  '/js/currency.js',
  '/js/order.js',
  '/js/prices.js',
  '/js/review-stats.js',
  '/js/reviews.js',
  '/manifest.json'
];

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico'];

function isImageRequest(request) {
  const url = new URL(request.url);
  return IMAGE_EXTENSIONS.some(ext => url.pathname.endsWith(ext));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('mlbb-boost-') && key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== IMAGE_CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Никогда не перехватываем кросс-доменные запросы (API, шрифты, CDN):
  // кэширование ответов API приводило к устаревшим ценам и отзывам.
  if (url.origin !== self.location.origin) return;

  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const cloned = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, cloned));
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('/index.html')))
    );
    return;
  }

  if (isImageRequest(request)) {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          const fetchPromise = fetch(request).then(response => {
            const cloned = response.clone();
            caches.open(IMAGE_CACHE).then(cache => cache.put(request, cloned));
            return response;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
    );
    return;
  }

  // JS/CSS: сеть в приоритете, кэш — только как офлайн-фолбэк.
  // Раньше отдавался кэш прежде сети, из-за чего пользователи
  // получали устаревшие скрипты после обновления сайта.
  event.respondWith(
    fetch(request)
      .then(response => {
        const cloned = response.clone();
        caches.open(STATIC_CACHE).then(cache => cache.put(request, cloned));
        return response;
      })
      .catch(() => caches.match(request).then(cached =>
        cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' })
      ))
  );
});
