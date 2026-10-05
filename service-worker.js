const CACHE_VERSION = 'mlbb-boost-v31-order-guide';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

const STATIC_ASSETS = [
  '/', '/en/', '/styles/main.css', '/styles/home.css',
  '/styles/animations.css', '/styles/seo.css', '/styles/icons.css'
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
          if (response.ok) caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, cloned));
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match(url.pathname.startsWith('/en/') ? '/en/' : '/')))
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
