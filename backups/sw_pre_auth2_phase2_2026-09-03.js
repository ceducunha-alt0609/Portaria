const CACHE_NAME = 'portaria-primavera-v1-0-6';
const CACHE_PREFIX = 'portaria-primavera-';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/screenshots/desktop-dark.png',
  './assets/screenshots/desktop-light.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin === self.location.origin && !url.pathname.startsWith(self.registration.scope.replace(self.location.origin, ''))) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, copy))
            .catch(() => {});
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request)
          .then(cached => cached || (event.request.mode === 'navigate' ? caches.match('./index.html') : undefined))
      )
  );
});
