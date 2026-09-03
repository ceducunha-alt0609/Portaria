const CACHE_NAME = 'portaria-primavera-v1-0-4';
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

const DEFAULT_LOCAL_PASSWORDS={
  'u-admin':'admin123',
  'u-portaria-dia':'1234',
  'u-portaria-noite':'1234',
  'u-zelador':'1234',
  'admin':'admin123',
  'portaria':'1234',
  'portaria-noite':'1234',
  'zelador':'1234'
};

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

function repairSnapshotUsers(payload){
  try{
    const rows=Array.isArray(payload)?payload:[payload];
    rows.forEach(row=>{
      const root=row&&row.dados?row.dados:row;
      const state=root&&root.state?root.state:root;
      if(!state||!Array.isArray(state.users))return;
      state.users=state.users.map(u=>{
        if(!u||String(u.senha||'').length)return u;
        const senha=DEFAULT_LOCAL_PASSWORDS[u.id]||DEFAULT_LOCAL_PASSWORDS[u.login]||'';
        return senha?{...u,senha}:u;
      });
    });
    return payload;
  }catch(e){
    return payload;
  }
}

async function fetchSupabaseSnapshot(request){
  const response=await fetch(request);
  if(!response||!response.ok)return response;
  try{
    const data=await response.clone().json();
    const repaired=repairSnapshotUsers(data);
    const headers=new Headers(response.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    return new Response(JSON.stringify(repaired),{
      status:response.status,
      statusText:response.statusText,
      headers
    });
  }catch(e){
    return response;
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Corrige somente o JSON de snapshots recebido do Supabase.
  // A navegação/index.html continua exatamente no fluxo original do PWA.
  if(url.hostname==='wfqxfgswdhnmmfjeajwn.supabase.co' && url.pathname==='/rest/v1/snapshots'){
    event.respondWith(fetchSupabaseSnapshot(event.request));
    return;
  }

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
