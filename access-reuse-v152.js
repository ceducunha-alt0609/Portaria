/* Portaria Primavera v152.5 — reaproveitamento + modal dedicado Ainda no condomínio */
(()=>{
  if(window.__ppAccessReuseV152Loaded)return;
  window.__ppAccessReuseV152Loaded=true;

  const norm=v=>String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
  const digits=v=>String(v||'').replace(/\D/g,'');
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));

  function getAccesses(){
    try{if(Array.isArray(window.state?.accesses))return window.state.accesses}catch(e){}
    try{
      for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i);if(!key)continue;
        const raw=localStorage.getItem(key);if(!raw||raw[0]!=='{')continue;
        let obj=null;try{obj=JSON.parse(raw)}catch(e){continue}
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
    const ordered=[...getAccesses()].sort((a,b)=>accessStamp(b)-accessStamp(a));
    const seen=new Set(),out=[];
    for(const a of ordered){
      const nome=String(a?.nome||'').trim();if(!nome)continue;
      const doc=String(a?.doc||'').trim();
      const empresa=String(a?.empresa||'').trim();
      const docKey=digits(doc);
      const key=docKey?`doc:${docKey}`:`nome:${norm(nome)}|empresa:${norm(empresa)}`;
      if(seen.has(key))continue;
      seen.add(key);
      out.push({nome,doc,docType:String(a?.docType||'').trim()||'CPF',empresa,tipo:String(a?.tipoAcesso||'').trim()||'Visitante',stamp:accessStamp(a)});
    }
    return out;
  }

  function findMatches(q){
    const nq=norm(q),dq=digits(q);
    if(nq.length<2&&dq.length<2)return [];
    return historyProfiles().filter(p=>{
      const text=norm([p.nome,p.empresa,p.docType,p.doc].join(' '));
      return (nq&&text.includes(nq))||(dq&&digits(p.doc).includes(dq));
    }).slice(0,6);
  }

  function insideDestination(a){return String(a?.destino||(a?.bloco?`${a.bloco} ${a.apto||''}`.trim():'—')||'—')}
  function insideDate(a){
    const raw=String(a?.data||'').trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(raw)){const [y,m,d]=raw.split('-');return `${d}/${m}/${y}`}
    const t=accessStamp(a);return t?new Date(t).toLocaleDateString('pt-BR'):'—';
  }
  function insideTime(a){
    if(a?.entradaHora)return String(a.entradaHora).slice(0,5);
    const t=accessStamp(a);return t?new Date(t).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'—';
  }
  function insideElapsed(a){
    const t=accessStamp(a);if(!t)return 'tempo não disponível';
    const mins=Math.max(0,Math.floor((Date.now()-t)/60000));
    if(mins<60)return `${mins} min`;
    const h=Math.floor(mins/60),m=mins%60;
    return m?`${h}h ${m}min`:`${h}h`;
  }

  function ensureInsideModal(){
    let modal=document.getElementById('insideQuickModalV152');
    if(modal)return modal;

    const style=document.createElement('style');
    style.id='insideQuickModalV152Style';
    style.textContent=`
      #insideQuickModalV152{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(2,8,18,.74);backdrop-filter:blur(8px)}
      #insideQuickModalV152.show{display:flex}
      #insideQuickModalV152 .insideQuickPanel{width:min(500px,calc(100vw - 40px));max-height:min(72vh,620px);overflow:hidden;background:var(--card,#fff);color:var(--ink,#172033);border:1px solid rgba(200,162,74,.34);border-radius:18px;box-shadow:0 28px 80px rgba(0,0,0,.36);font-family:inherit}
      #insideQuickModalV152 .insideQuickHead{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:16px 18px 12px;border-bottom:1px solid var(--line,#e5e7ef)}
      #insideQuickModalV152 .insideQuickHead h2{margin:0 0 4px;font-size:22px;line-height:1.15;color:var(--ink,#172033)}
      #insideQuickModalV152 .insideQuickHead p{margin:0;font-size:12px;color:var(--muted,#667085)}
      #insideQuickModalV152 .insideQuickClose{width:34px;height:34px;flex:0 0 34px;border:1px solid var(--line,#e5e7ef);border-radius:10px;background:transparent;color:inherit;font:700 22px/1 inherit;cursor:pointer;display:grid;place-items:center}
      #insideQuickModalV152 .insideQuickClose:hover,#insideQuickModalV152 .insideQuickClose:focus{outline:none;border-color:rgba(200,162,74,.7);background:rgba(200,162,74,.08)}
      #insideQuickModalV152 .insideQuickBody{padding:12px;max-height:calc(min(72vh,620px) - 76px);overflow:auto}
      #insideQuickModalV152 .insideQuickEmpty{min-height:86px;display:grid;place-items:center;text-align:center;color:var(--muted,#667085);padding:18px}
      #insideQuickModalV152 .insideQuickRow{width:100%;display:block;text-align:left;border:1px solid var(--line,#e5e7ef);background:transparent;color:inherit;border-radius:12px;padding:10px 12px;margin:0 0 8px;cursor:pointer;font:inherit}
      #insideQuickModalV152 .insideQuickRow:last-child{margin-bottom:0}
      #insideQuickModalV152 .insideQuickRow:hover,#insideQuickModalV152 .insideQuickRow:focus{outline:none;border-color:rgba(200,162,74,.65);background:rgba(200,162,74,.06)}
      #insideQuickModalV152 .insideQuickTop{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:5px}
      #insideQuickModalV152 .insideQuickTop b{font-size:13px}
      #insideQuickModalV152 .insideQuickBadge{font-size:9px;font-weight:900;letter-spacing:.08em;padding:4px 7px;border-radius:999px;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.28)}
      #insideQuickModalV152 .insideQuickMeta{font-size:11px;line-height:1.45;color:var(--muted,#667085)}
      #insideQuickModalV152 .insideQuickMeta b{color:var(--ink,#172033)}
      body.theme-dark #insideQuickModalV152 .insideQuickPanel{background:#0f1a29;color:#edf2f7;border-color:rgba(216,184,92,.34)}
      body.theme-dark #insideQuickModalV152 .insideQuickHead{border-color:rgba(185,199,219,.16)}
      body.theme-dark #insideQuickModalV152 .insideQuickHead h2,body.theme-dark #insideQuickModalV152 .insideQuickMeta b{color:#edf2f7}
      body.theme-dark #insideQuickModalV152 .insideQuickHead p,body.theme-dark #insideQuickModalV152 .insideQuickMeta,body.theme-dark #insideQuickModalV152 .insideQuickEmpty{color:#a7b0c0}
      body.theme-dark #insideQuickModalV152 .insideQuickRow,body.theme-dark #insideQuickModalV152 .insideQuickClose{border-color:rgba(185,199,219,.18)}
      @media(max-width:600px){#insideQuickModalV152{padding:10px}#insideQuickModalV152 .insideQuickPanel{width:calc(100vw - 20px);max-height:82vh;border-radius:16px}#insideQuickModalV152 .insideQuickHead{padding:14px}#insideQuickModalV152 .insideQuickHead h2{font-size:20px}}
    `;
    document.head.appendChild(style);

    modal=document.createElement('div');
    modal.id='insideQuickModalV152';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-labelledby','insideQuickTitleV152');
    modal.innerHTML=`<div class="insideQuickPanel" role="document"><div class="insideQuickHead"><div><h2 id="insideQuickTitleV152">Ainda no condomínio</h2><p id="insideQuickSubV152"></p></div><button type="button" class="insideQuickClose" aria-label="Fechar">×</button></div><div class="insideQuickBody" id="insideQuickBodyV152"></div></div>`;
    document.body.appendChild(modal);

    const close=()=>closeInsideList();
    modal.querySelector('.insideQuickClose').addEventListener('click',close);
    modal.addEventListener('click',e=>{if(e.target===modal)close()});
    modal.querySelector('.insideQuickPanel').addEventListener('click',e=>e.stopPropagation());
    return modal;
  }

  function closeInsideList(){
    const modal=document.getElementById('insideQuickModalV152');
    if(modal)modal.classList.remove('show');
    document.body.classList.remove('insideQuickModalOpen');
    document.body.style.removeProperty('overflow');
    const card=document.getElementById('cardInside');
    if(card){card.style.removeProperty('visibility');card.style.removeProperty('pointer-events');card.removeAttribute('aria-hidden')}
  }

  function openInsideList(){
    const modal=ensureInsideModal();
    const sub=document.getElementById('insideQuickSubV152');
    const body=document.getElementById('insideQuickBodyV152');
    const arr=getAccesses().filter(a=>a&&!a.saida).sort((a,b)=>accessStamp(b)-accessStamp(a));

    const card=document.getElementById('cardInside');
    if(card){
      card.blur?.();
      card.style.setProperty('visibility','hidden','important');
      card.style.setProperty('pointer-events','none','important');
      card.setAttribute('aria-hidden','true');
    }
    document.querySelectorAll('.opTooltip').forEach(t=>t.style.setProperty('display','none','important'));
    document.body.classList.add('insideQuickModalOpen');
    document.body.style.setProperty('overflow','hidden');

    sub.textContent=arr.length?`${arr.length} pessoa(s) sem saída registrada`:'Nenhuma pessoa sem saída registrada';
    body.innerHTML=arr.length?arr.map((a,i)=>`<button type="button" class="insideQuickRow" data-i="${i}"><div class="insideQuickTop"><b>${esc(a.nome||'Sem nome')}</b><span class="insideQuickBadge">NO LOCAL</span></div><div class="insideQuickMeta"><b>${esc(insideDestination(a))}</b> • Entrada ${esc(insideDate(a))} às ${esc(insideTime(a))}<br>⏱ ${esc(insideElapsed(a))} no condomínio</div></button>`).join(''):'<div class="insideQuickEmpty">Nenhuma pessoa está com entrada em aberto.</div>';

    body.querySelectorAll('.insideQuickRow').forEach(btn=>btn.addEventListener('click',()=>{
      const a=arr[Number(btn.dataset.i)];
      if(!a)return;
      closeInsideList();
      if(typeof window.openAccessDetail==='function')window.openAccessDetail(a.id);
    }));

    modal.classList.add('show');
    setTimeout(()=>modal.querySelector('.insideQuickClose')?.focus(),0);
  }

  function setupInsideCard(){
    const card=document.getElementById('cardInside');
    if(!card)return;
    card.classList.add('opMetric');
    card.tabIndex=0;
    card.setAttribute('role','button');
    card.setAttribute('aria-label','Ver pessoas ainda no condomínio');
    card.title='Ver pessoas sem saída registrada';

    card.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openInsideList()},{capture:true});
    card.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopImmediatePropagation();openInsideList()}
    },{capture:true});

    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&document.getElementById('insideQuickModalV152')?.classList.contains('show'))closeInsideList();
    });
  }

  function setupReuse(){
    const input=document.getElementById('aNome');
    if(!input||input.dataset.reuseV152==='1')return;
    input.dataset.reuseV152='1';
    input.setAttribute('autocomplete','off');

    const host=input.parentElement||input;
    if(getComputedStyle(host).position==='static')host.style.position='relative';

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
      const q=input.value.trim(),matches=findMatches(q);
      if(!matches.length){close();return}
      box.innerHTML=matches.map((p,i)=>{
        const doc=p.doc?`${p.docType||'Documento'} ${p.doc}`:'Sem documento';
        const meta=[doc,p.empresa||'',p.tipo||''].filter(Boolean).join(' • ');
        return `<button type="button" class="accessReuseItem" data-i="${i}" role="option"><div class="accessReuseName">${esc(p.nome)}</div><div class="accessReuseMeta">${esc(meta)}</div></button>`;
      }).join('');
      box.hidden=false;
      box.querySelectorAll('.accessReuseItem').forEach((btn,i)=>btn.addEventListener('mousedown',ev=>{
        ev.preventDefault();
        const p=matches[i];
        input.value=p.nome;
        const empresa=document.getElementById('aEmpresa');if(empresa)empresa.value=p.empresa||'';
        const tipo=document.getElementById('aTipo');if(tipo&&p.tipo)tipo.value=p.tipo;
        const dt=document.getElementById('aDocType');if(dt)dt.value=p.docType||'CPF';
        const dn=document.getElementById('aDoc');if(dn)dn.value=p.doc||'';
        const disp=document.getElementById('aDocDisplay');if(disp)disp.textContent=p.doc?`${p.docType||'Documento'} ${p.doc}`:'Selecionar documento';
        const docBtn=document.getElementById('aDocButton');if(docBtn)docBtn.classList.toggle('empty',!p.doc);
        ['aBloco','aApto','aDestino','aServico'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});
        const auth=document.getElementById('aAutorizado');if(auth){auth.innerHTML='<option value="">Selecione a unidade</option>';auth.disabled=true}
        try{window.updateDestinoOptions?.();window.updateUnitPickButton?.()}catch(e){}
        close();
      }));
    }

    input.addEventListener('input',render);
    input.addEventListener('focus',()=>{if(input.value.trim().length>=2)render()});
    input.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
    document.addEventListener('mousedown',e=>{if(e.target!==input&&!box.contains(e.target))close()});
  }

  function setup(){setupInsideCard();setupReuse()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
  window.PortariaAccessReuseV152={version:'152.5',refresh:setup,profiles:historyProfiles,getAccesses,openInsideList,closeInsideList};
})();
