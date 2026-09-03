const CACHE_NAME = 'portaria-primavera-v1-0-3';
const CACHE_PREFIX = 'portaria-primavera-';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.png',
  './login-fix.js',
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

async function injectLoginFix(response){
  try{
    if(!response || !response.ok) return response;
    const type=response.headers.get('content-type')||'';
    if(!type.includes('text/html')) return response;
    let html=await response.text();
    if(!html.includes('login-fix.js')){
      html=html.replace('</body>','<script src="./login-fix.js?v=20260903"></script></body>');
    }
    const headers=new Headers(response.headers);
    headers.delete('content-length');
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  }catch(e){
    return response;
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin === self.location.origin && !url.pathname.startsWith(self.registration.scope.replace(self.location.origin, ''))) {
    return;
  }

  if(event.request.mode === 'navigate'){
    event.respondWith(
      fetch(event.request)
        .then(async response => {
          if(response && response.ok){
            const raw=response.clone();
            caches.open(CACHE_NAME).then(cache=>cache.put(event.request,raw)).catch(()=>{});
          }
          return injectLoginFix(response);
        })
        .catch(async ()=>{
          const cached=await caches.match(event.request) || await caches.match('./index.html');
          return injectLoginFix(cached);
        })
    );
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
      .catch(() => caches.match(event.request))
  );
});
