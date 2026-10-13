// Portaria Primavera SW v29 — bootstrap do Sync Guard / diagnóstico
const CACHE='portaria-primavera-v1-0-29';
const CACHE_PREFIX='portaria-primavera-';
const OFFLINE_URL='./index.html';
const BOOT='<script src="./sync-guard-v152.js?v=1524"></script><script src="./diagnostico-v152.js?v=1524"></script>';
async function bootResponse(r){
  if(!r||!r.ok)return r;
  const type=r.headers.get('content-type')||'';
  if(!type.includes('text/html'))return r;
  let html=await r.text();
  if(!html.includes('sync-guard-v152.js'))html=html.replace(/<\/body>/i,BOOT+'</body>');
  const h=new Headers(r.headers);h.delete('content-length');
  return new Response(html,{status:r.status,statusText:r.statusText,headers:h});
}
self.addEventListener('install',e=>e.waitUntil((async()=>{await caches.open(CACHE);await self.skipWaiting()})()));
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
  const cs=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const c of cs){try{const u=new URL(c.url);if(u.origin===self.location.origin&&!u.searchParams.has('ppsw29')){u.searchParams.set('ppsw29','1');await c.navigate(u.href)}}catch(_){}}
})()));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url),scope=new URL(self.registration.scope).pathname;
  if(u.origin===self.location.origin&&!u.pathname.startsWith(scope))return;
  if(e.request.mode==='navigate'){
    e.respondWith((async()=>{try{const raw=await fetch(e.request,{cache:'no-store'});const fresh=await bootResponse(raw);if(fresh&&fresh.ok){const cache=await caches.open(CACHE);await cache.put(OFFLINE_URL,fresh.clone())}return fresh}catch(_){return(await caches.match(OFFLINE_URL))||Response.error()}})());return;
  }
  e.respondWith((async()=>{try{const fresh=await fetch(e.request,{cache:'no-store'});if(fresh&&fresh.ok&&u.origin===self.location.origin){const cache=await caches.open(CACHE);await cache.put(e.request,fresh.clone())}return fresh}catch(_){return(await caches.match(e.request))||Response.error()}})());
});
