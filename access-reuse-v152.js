/* Portaria Primavera v152.1 — reaproveitamento de visitantes/prestadores */
(()=>{
  if(window.__ppAccessReuseV152Loaded)return;
  window.__ppAccessReuseV152Loaded=true;

  const norm=v=>String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
  const digits=v=>String(v||'').replace(/\D/g,'');
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));

  function getAccesses(){
    try{
      if(Array.isArray(window.state?.accesses))return window.state.accesses;
    }catch(e){}
    try{
      for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i);
        if(!key)continue;
        const raw=localStorage.getItem(key);
        if(!raw||raw[0]!=='{')continue;
        let obj=null;
        try{obj=JSON.parse(raw)}catch(e){continue}
        if(Array.isArray(obj?.accesses))return obj.accesses;
        if(Array.isArray(obj?.dados?.accesses))return obj.dados.accesses;
      }
    }catch(e){}
    return [];
  }

  function accessStamp(a){
    const raw=a?.entrada||a?.createdAt||((a?.data&&a?.entradaHora)?`${a.data}T${a.entradaHora}`:a?.data)||'';
    const t=new Date(raw).getTime();
    return Number.isFinite(t)?t:0;
  }

  function historyProfiles(){
    const accesses=getAccesses();
    const ordered=[...accesses].sort((a,b)=>accessStamp(b)-accessStamp(a));
    const seen=new Set();
    const out=[];
    for(const a of ordered){
      const nome=String(a?.nome||'').trim();
      if(!nome)continue;
      const doc=String(a?.doc||'').trim();
      const empresa=String(a?.empresa||'').trim();
      const docKey=digits(doc);
      const key=docKey?`doc:${docKey}`:`nome:${norm(nome)}|empresa:${norm(empresa)}`;
      if(seen.has(key))continue;
      seen.add(key);
      out.push({
        nome,
        doc,
        docType:String(a?.docType||'').trim()||'CPF',
        empresa,
        tipo:String(a?.tipoAcesso||'').trim()||'Visitante',
        stamp:accessStamp(a)
      });
    }
    return out;
  }

  function findMatches(q){
    const nq=norm(q), dq=digits(q);
    if(nq.length<2 && dq.length<2)return [];
    return historyProfiles().filter(p=>{
      const text=norm([p.nome,p.empresa,p.docType,p.doc].join(' '));
      if(nq&&text.includes(nq))return true;
      return dq&&digits(p.doc).includes(dq);
    }).slice(0,6);
  }

  function setup(){
    const input=document.getElementById('aNome');
    if(!input||input.dataset.reuseV152==='1')return;
    input.dataset.reuseV152='1';
    input.setAttribute('autocomplete','off');

    const host=input.parentElement||input;
    const prevPosition=getComputedStyle(host).position;
    if(prevPosition==='static')host.style.position='relative';

    const box=document.createElement('div');
    box.className='accessReuseSuggestions';
    box.setAttribute('role','listbox');
    box.setAttribute('aria-label','Visitantes e prestadores já cadastrados no histórico');
    box.hidden=true;
    host.appendChild(box);

    const style=document.createElement('style');
    style.textContent=`
      .accessReuseSuggestions{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:95;background:var(--card,#fff);border:1px solid rgba(200,162,74,.38);border-radius:16px;box-shadow:0 20px 48px rgba(13,27,42,.22);padding:6px;max-height:310px;overflow:auto}
      .accessReuseSuggestions[hidden]{display:none!important}
      .accessReuseItem{width:100%;border:1px solid var(--line,#e5e7ef);background:linear-gradient(180deg,#fff,#fbfcff);border-radius:12px;padding:9px 10px;text-align:left;cursor:pointer;font-family:inherit;color:var(--ink,#172033);margin:0 0 6px}
      .accessReuseItem:last-child{margin-bottom:0}.accessReuseItem:hover,.accessReuseItem:focus{outline:none;border-color:rgba(200,162,74,.75);background:#fffaf0}
      .accessReuseName{font-weight:900;color:var(--navy,#0d1b2a);font-size:12px;line-height:1.25}.accessReuseMeta{font-size:10.5px;color:var(--muted,#667085);line-height:1.4;margin-top:3px}.accessReuseMeta b{color:#7a5a12}
      body.theme-dark .accessReuseSuggestions{background:#111c2c;border-color:rgba(216,184,92,.35)}body.theme-dark .accessReuseItem{background:linear-gradient(180deg,#121f31,#0e1827);border-color:rgba(185,199,219,.18);color:#edf2f7}body.theme-dark .accessReuseItem:hover,body.theme-dark .accessReuseItem:focus{background:#241f12;border-color:rgba(216,184,92,.55)}body.theme-dark .accessReuseName{color:#edf2f7}body.theme-dark .accessReuseMeta{color:#a7b0c0}
    `;
    document.head.appendChild(style);

    function close(){box.hidden=true;box.innerHTML=''}
    function render(){
      const q=input.value.trim();
      const matches=findMatches(q);
      if(!matches.length){close();return}
      box.innerHTML=matches.map((p,i)=>{
        const doc=p.doc?`${p.docType||'Documento'} ${p.doc}`:'Sem documento';
        const meta=[doc,p.empresa||'',p.tipo||''].filter(Boolean).join(' • ');
        return `<button type="button" class="accessReuseItem" data-i="${i}" role="option"><div class="accessReuseName">${esc(p.nome)}</div><div class="accessReuseMeta">${esc(meta)}</div></button>`;
      }).join('');
      box.hidden=false;
      [...box.querySelectorAll('.accessReuseItem')].forEach((btn,i)=>btn.addEventListener('mousedown',ev=>{
        ev.preventDefault();
        const p=matches[i];
        input.value=p.nome;
        const empresa=document.getElementById('aEmpresa'); if(empresa)empresa.value=p.empresa||'';
        const tipo=document.getElementById('aTipo'); if(tipo&&p.tipo)tipo.value=p.tipo;
        const dt=document.getElementById('aDocType'); if(dt)dt.value=p.docType||'CPF';
        const dn=document.getElementById('aDoc'); if(dn)dn.value=p.doc||'';
        const disp=document.getElementById('aDocDisplay');if(disp)disp.textContent=p.doc?`${p.docType||'Documento'} ${p.doc}`:'Selecionar documento';
        const docBtn=document.getElementById('aDocButton');if(docBtn)docBtn.classList.toggle('empty',!p.doc);
        ['aBloco','aApto','aDestino','aServico'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});
        const auth=document.getElementById('aAutorizado'); if(auth){auth.innerHTML='<option value="">Selecione a unidade</option>';auth.disabled=true;}
        try{window.updateDestinoOptions?.();window.updateUnitPickButton?.()}catch(e){}
        close();
      }));
    }

    input.addEventListener('input',render);
    input.addEventListener('focus',()=>{if(input.value.trim().length>=2)render()});
    input.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
    document.addEventListener('mousedown',e=>{if(e.target!==input&&!box.contains(e.target))close()});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
  window.PortariaAccessReuseV152={version:'152.1',refresh:setup,profiles:historyProfiles,getAccesses};
})();

/* v152.5 — botão de sincronização manual apenas para perfil Portaria */
(()=>{
  if(window.__ppPortariaSyncButtonLoaded)return;
  window.__ppPortariaSyncButtonLoaded=true;

  function isPortaria(){
    try{return String(currentOperator?.()?.perfil||'').toLowerCase()==='portaria'}catch(e){return false}
  }

  async function portariaSyncNow(btn){
    if(!isPortaria())return;
    const original=btn?.textContent||'🔄 Sincronizar agora';
    try{
      if(btn){btn.disabled=true;btn.textContent='Sincronizando...'}
      let pulled=false,pushed=false;
      if(window.PortariaSyncGuardV152?.pull) pulled=await window.PortariaSyncGuardV152.pull(false);
      else if(typeof cloudSyncPullLatest==='function') pulled=await cloudSyncPullLatest(false);
      // Atualização manual é somente leitura: nunca publicar uma base possivelmente desatualizada.
      // Um envio é permitido apenas pelas rotinas normais após alterações locais legítimas.
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
    const existing=document.getElementById('portariaSyncNowBtn');
    if(!isPortaria()){
      existing?.remove();
      document.getElementById('portariaSyncButtonRow')?.remove();
      return;
    }
    const host=document.querySelector('.statusGroup');
    if(!host)return;
    const btn=existing||document.createElement('button');
    if(!existing){
      btn.id='portariaSyncNowBtn';btn.type='button';btn.className='btn ghost';
      btn.textContent='🔄';
      btn.setAttribute('aria-label','Sincronizar agora');
      btn.title='Atualizar os dados da Portaria com a nuvem';
      btn.addEventListener('click',()=>portariaSyncNow(btn));
    }
    if(btn.parentElement!==host)host.appendChild(btn);
    btn.style.cssText='position:static;flex:0 0 auto;padding:6px 9px;font-size:17px;line-height:1;width:auto;min-height:0;border-radius:10px';
    document.getElementById('portariaSyncButtonRow')?.remove();
  }

  try{
    if(!window.PortariaSyncGuardV152&&!document.querySelector('script[data-pp-sync-guard="1"]')){
      const s=document.createElement('script');
      s.src='./sync-guard-v152.js?v=152.4';
      s.async=true;
      s.dataset.ppSyncGuard='1';
      document.head.appendChild(s);
    }
  }catch(e){console.warn('Falha ao carregar Sync Guard v152.4',e)}

  // Desktop: mantém os valores dos indicadores legíveis sem depender do hover.
  // Restrito ao tema escuro e ao Resumo; não altera o comportamento dos cards.
  const metricStyle=document.createElement('style');
  metricStyle.id='pp-desktop-metric-visibility';
  metricStyle.textContent='@media (min-width:851px){body.theme-dark #dashboard .dashboardCards .card.metric .n{color:var(--ink)!important;opacity:1!important;visibility:visible!important;display:block!important}#dashboard .dashboardCards{padding-top:0!important;overflow:visible!important}}';
  document.head.appendChild(metricStyle);

  const observer=new MutationObserver(()=>ensurePortariaSyncButton());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(ensurePortariaSyncButton,900);
  setTimeout(ensurePortariaSyncButton,2200);
})();
