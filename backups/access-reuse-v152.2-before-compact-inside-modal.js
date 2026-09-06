/* Portaria Primavera v152.2 — reaproveitamento de visitantes/prestadores + card Ainda no condomínio */
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

  function formatInsideTime(a){
    if(a?.entradaHora)return String(a.entradaHora).slice(0,5);
    const stamp=accessStamp(a);
    if(!stamp)return '—';
    try{return new Date(stamp).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}catch(e){return '—'}
  }

  function formatInsideDate(a){
    const raw=String(a?.data||'').trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(raw)){
      const [y,m,d]=raw.split('-');
      return `${d}/${m}/${y}`;
    }
    const stamp=accessStamp(a);
    if(!stamp)return '—';
    try{return new Date(stamp).toLocaleDateString('pt-BR')}catch(e){return '—'}
  }

  function formatInsideElapsed(a){
    const stamp=accessStamp(a);
    if(!stamp)return 'tempo não disponível';
    const mins=Math.max(0,Math.floor((Date.now()-stamp)/60000));
    if(mins<60)return `${mins} min`;
    const h=Math.floor(mins/60), m=mins%60;
    return m?`${h}h ${m}min`:`${h}h`;
  }

  function insideDestination(a){
    return String(a?.destino||(a?.bloco?`${a.bloco} ${a.apto||''}`.trim():'—')||'—');
  }

  function openInsideList(){
    const modal=document.getElementById('opListModal');
    const title=document.getElementById('opListTitle');
    const sub=document.getElementById('opListSub');
    const body=document.getElementById('opListBody');
    if(!modal||!title||!sub||!body)return;

    try{document.activeElement?.blur?.()}catch(e){}
    document.querySelectorAll('.opTooltip').forEach(t=>t.style.display='none');

    const arr=getAccesses().filter(a=>a&&!a.saida).sort((a,b)=>accessStamp(b)-accessStamp(a));
    title.textContent='Ainda no condomínio';
    sub.textContent=arr.length?`${arr.length} pessoa(s) sem saída registrada`:'Nenhuma pessoa sem saída registrada';

    if(!arr.length){
      body.innerHTML='<div class="empty">Nenhuma pessoa está com entrada em aberto.</div>';
      modal.classList.add('show');
      return;
    }

    body.innerHTML=`<div class="opListRows insideQuickRows">${arr.map((a,i)=>{
      const nome=esc(a.nome||'Sem nome');
      const destino=esc(insideDestination(a));
      const data=esc(formatInsideDate(a));
      const hora=esc(formatInsideTime(a));
      const tempo=esc(formatInsideElapsed(a));
      return `<button type="button" class="opListRow insideQuickRow" data-inside-index="${i}"><div class="opListRowTop"><b>${nome}</b><span class="badge in">NO LOCAL</span></div><div class="opListMeta"><b>${destino}</b> • Entrada ${data} às ${hora}<br>⏱ ${tempo} no condomínio</div></button>`;
    }).join('')}</div>`;

    [...body.querySelectorAll('.insideQuickRow')].forEach(btn=>btn.addEventListener('click',()=>{
      const a=arr[Number(btn.dataset.insideIndex)];
      if(!a)return;
      modal.classList.remove('show');
      if(typeof window.openAccessDetail==='function')window.openAccessDetail(a.id);
    }));

    modal.classList.add('show');
  }

  function setupInsideCard(){
    const card=document.getElementById('cardInside');
    if(!card||card.dataset.insideQuickV152==='1')return;
    card.dataset.insideQuickV152='1';
    card.classList.add('opMetric');
    card.tabIndex=0;
    card.setAttribute('role','button');
    card.setAttribute('aria-label','Ver pessoas ainda no condomínio');
    card.title='Ver pessoas sem saída registrada';
    card.addEventListener('click',openInsideList);
    card.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){e.preventDefault();openInsideList()}
    });

    if(!document.getElementById('insideQuickV152Style')){
      const style=document.createElement('style');
      style.id='insideQuickV152Style';
      style.textContent=`
        .insideQuickRow{width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;transition:.16s ease}
        .insideQuickRow:hover,.insideQuickRow:focus{outline:none;border-color:rgba(200,162,74,.62);box-shadow:0 10px 24px rgba(13,27,42,.10);transform:translateY(-1px)}
        .insideQuickRow .opListMeta b{color:var(--navy)}
        body.theme-dark .insideQuickRow:hover,body.theme-dark .insideQuickRow:focus{border-color:rgba(216,184,92,.5);box-shadow:0 12px 26px rgba(0,0,0,.18)}
      `;
      document.head.appendChild(style);
    }
  }

  function setup(){
    setupInsideCard();

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
  window.PortariaAccessReuseV152={version:'152.2',refresh:setup,profiles:historyProfiles,getAccesses,openInsideList};
})();
