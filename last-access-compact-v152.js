/* Portaria Primavera v152.2 — bootstrap dos módulos v152 */
(()=>{
  if(window.__ppV152BootstrapLoaded)return;
  window.__ppV152BootstrapLoaded=true;
  const load=src=>new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src=src;
    s.onload=resolve;
    s.onerror=reject;
    document.head.appendChild(s);
  });
  load('./last-access-compact-v152-core.js?v=1522')
    .then(()=>load('./sync-guard-v152.js?v=1522'))
    .catch(err=>console.warn('Falha ao carregar módulos v152.2',err));
})();
