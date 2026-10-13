// Portaria Primavera SW v28 — atualização automática robusta / GitHub Pages
const CACHE = 'portaria-primavera-v1-0-28';
const CACHE_PREFIX = 'portaria-primavera-';
const OFFLINE_URL = './index.html';

self.addEventListener('install', event => {
  event.waitUntil((async()=>{
    const cache = await caches.open(CACHE);
    try{
      const r = await fetch(OFFLINE_URL + '?sw=28&t=' + Date.now(), {cache:'no-store'});
      if(r && r.ok) await cache.put(OFFLINE_URL, r.clone());
    }catch(e){}
    await self.skipWaiting();
  })());
});
self.addEventListener('message', event => {if(event.data && event.data.type==='SKIP_WAITING') self.skipWaiting();});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
    const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of clients){try{const u=new URL(client.url);if(u.origin===self.location.origin&&!u.searchParams.has('ppsw28')){u.searchParams.set('ppsw28','1');await client.navigate(u.href)}}catch(e){}}
  })());
});
self.addEventListener('fetch', event => {
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url),scopePath=new URL(self.registration.scope).pathname;
  if(url.origin===self.location.origin&&!url.pathname.startsWith(scopePath))return;
  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{try{const fresh=await fetch(event.request,{cache:'no-store'});if(fresh&&fresh.ok){const cache=await caches.open(CACHE);await cache.put(OFFLINE_URL,fresh.clone())}return fresh}catch(e){return (await caches.match(OFFLINE_URL))||Response.error()}})());return;
  }
  event.respondWith((async()=>{try{const fresh=await fetch(event.request,{cache:'no-store'});if(fresh&&fresh.ok&&url.origin===self.location.origin){const cache=await caches.open(CACHE);await cache.put(event.request,fresh.clone())}return fresh}catch(e){return (await caches.match(event.request))||Response.error()}})());
});
