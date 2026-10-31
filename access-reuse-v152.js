/* Portaria Primavera v152 — acesso reutilizável + botão de sincronização para perfil Portaria */
(()=>{
  if(window.__ppAccessReuseV152Loaded)return;
  window.__ppAccessReuseV152Loaded=true;

  // Carrega o guard de sincronização já existente no projeto sem alterar o index.html.
  try{
    if(!window.PortariaSyncGuardV152 && !document.querySelector('script[data-pp-sync-guard="1"]')){
      const s=document.createElement('script');
      s.src='./sync-guard-v152.js?v=152.4';
      s.async=true;
      s.dataset.ppSyncGuard='1';
      document.head.appendChild(s);
    }
  }catch(e){console.warn('Falha ao carregar Sync Guard v152.4',e)}

  function isPortaria(){
    try{return String(currentOperator?.()?.perfil||'').toLowerCase()==='portaria'}catch(e){return false}
  }

  async function portariaSyncNow(btn){
    if(!isPortaria())return;
    const original=btn?.textContent||'Sincronizar agora';
    try{
      if(btn){btn.disabled=true;btn.textContent='Sincronizando...'}
      let pulled=false,pushed=false;
      if(window.PortariaSyncGuardV152?.pull) pulled=await window.PortariaSyncGuardV152.pull(false);
      else if(typeof cloudSyncPullLatest==='function') pulled=await cloudSyncPullLatest(false);
      if(typeof cloudSyncPush==='function') pushed=await cloudSyncPush('manual-portaria');
      try{refreshSyncCenterStatus?.()}catch(e){}
      try{renderAll?.()}catch(e){}
      showCloudToast?.((pulled||pushed)?'Sincronização concluída ✅':'Nenhuma atualização nova encontrada.','ok',4000);
    }catch(e){
      console.warn('Falha na sincronização manual da Portaria',e);
      showCloudToast?.('Não foi possível sincronizar agora. Os dados locais foram preservados.','err',5000);
    }finally{
      if(btn){btn.disabled=false;btn.textContent=original}
    }
  }
  window.portariaSyncNow=portariaSyncNow;

  function ensurePortariaSyncButton(){
    if(!isPortaria())return;
    if(document.getElementById('portariaSyncNowBtn'))return;

    const btn=document.createElement('button');
    btn.id='portariaSyncNowBtn';
    btn.type='button';
    btn.className='btn ghost';
    btn.textContent='🔄 Sincronizar agora';
    btn.title='Atualizar os dados da Portaria com a nuvem';
    btn.style.whiteSpace='nowrap';
    btn.style.minWidth='170px';
    btn.addEventListener('click',()=>portariaSyncNow(btn));

    const candidates=[
      document.querySelector('.subbarInner'),
      document.querySelector('.top'),
      document.querySelector('header .top'),
      document.querySelector('header')
    ].filter(Boolean);
    const host=candidates[0];
    if(host)host.appendChild(btn);
  }

  // Mantém o botão somente para Portaria e reaplica após navegação/renderizações.
  const observer=new MutationObserver(()=>{
    const existing=document.getElementById('portariaSyncNowBtn');
    if(existing&&!isPortaria())existing.remove();
    if(isPortaria())ensurePortariaSyncButton();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(ensurePortariaSyncButton,900);
  setTimeout(ensurePortariaSyncButton,2200);
})();
