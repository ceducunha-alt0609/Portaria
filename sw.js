// Portaria Primavera SW v25 — atualização automática / GitHub Pages
const CACHE = 'portaria-primavera-v1-0-25';
const CACHE_PREFIX = 'portaria-primavera-';
const OFFLINE_URL = './index.html';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => fetch(OFFLINE_URL, { cache: 'no-store' }).then(r => {
        if (r && r.ok) return cache.put(OFFLINE_URL, r.clone());
      }))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.origin === self.location.origin && !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(event.request, { cache: 'no-store' });
        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE);
          cache.put(OFFLINE_URL, fresh.clone());
        }
        return fresh;
      } catch (_) {
        return (await caches.match(OFFLINE_URL)) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    try {
      const fresh = await fetch(event.request, { cache: 'no-store' });
      if (fresh && fresh.ok && url.origin === self.location.origin) {
        const cache = await caches.open(CACHE);
        cache.put(event.request, fresh.clone());
      }
      return fresh;
    } catch (_) {
      return (await caches.match(event.request)) || Response.error();
    }
  })());
});
