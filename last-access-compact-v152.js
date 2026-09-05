/* Portaria Primavera v152 — Últimos acessos compacto */
(()=>{
  if(window.__ppLastAccessCompactV152Loaded)return;
  window.__ppLastAccessCompactV152Loaded=true;

  const norm=v=>String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));

  function getAccesses(){
    try{if(Array.isArray(window.state?.accesses))return window.state.accesses}catch(e){}
    try{
      for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i); if(!key)continue;
        const raw=localStorage.getItem(key); if(!raw||raw[0]!=='{')continue;
        let obj=null; try{obj=JSON.parse(raw)}catch(e){continue}
        if(Array.isArray(obj?.accesses))return obj.accesses;
        if(Array.isArray(obj?.dados?.accesses))return obj.dados.accesses;
      }
    }catch(e){}
    return [];
  }

  function accessByRow(tr){
    const raw=tr.getAttribute('onclick')||'';
    const m=raw.match(/openAccessDetail\(['\"]([^'\"]+)['\"]\)/);
    if(!m)return null;
    return getAccesses().find(a=>String(a?.id||'')===m[1])||null;
  }

  function typeInfo(a){
    const label=String(a?.tipoAcesso||'').trim()||'Não informado';
    const n=norm(label);
    return {label,cls:n==='prestador'?'service':n==='visitante'?'visitor':'legacy'};
  }

  function compact(){
    const host=document.getElementById('lastAccess');
    if(!host)return;
    const table=host.querySelector('.accessTableDesktop table');
    if(!table||table.dataset.compactV152==='1')return;

    const heads=[...table.querySelectorAll('thead th')].map(th=>norm(th.textContent));
    const find=(...names)=>heads.findIndex(h=>names.some(n=>h===norm(n)));
    const ix={
      data:find('Data'),
      entrada:find('Entrada'),
      nome:find('Nome'),
      destino:find('Apto visitado','Destino','Unidade'),
      tempo:find('Tempo'),
      saida:find('Saída','Saida')
    };
    if(Object.values(ix).some(v=>v<0))return;

    const rows=[...table.querySelectorAll('tbody tr')];
    for(const tr of rows){
      const cells=[...tr.children];
      if(cells.length<=Math.max(...Object.values(ix)))continue;
      const data=cells[ix.data]?.textContent?.trim()||'—';
      const entrada=cells[ix.entrada]?.textContent?.trim()||'—';
      const nome=cells[ix.nome]?.textContent?.trim()||'—';
      const destino=cells[ix.destino]?.textContent?.trim()||'—';
      const tempo=cells[ix.tempo]?.textContent?.trim()||'—';
      const saidaHtml=cells[ix.saida]?.innerHTML||'—';
      const t=typeInfo(accessByRow(tr));
      tr.innerHTML=`<td><div class="lastAccessWhen"><b>${esc(data)}</b><small>${esc(entrada)}</small></div></td><td><b>${esc(nome)}</b></td><td><span class="accessTypePill ${t.cls}">${esc(t.label)}</span></td><td>${esc(destino)}</td><td>${esc(tempo)}</td><td>${saidaHtml}</td>`;
    }

    const hr=table.querySelector('thead tr');
    if(hr)hr.innerHTML='<th>Data / Entrada</th><th>Nome</th><th>Tipo</th><th>Destino</th><th>Tempo</th><th>Saída</th>';
    table.dataset.compactV152='1';
  }

  function installStyle(){
    if(document.getElementById('ppLastAccessCompactStyle'))return;
    const s=document.createElement('style');
    s.id='ppLastAccessCompactStyle';
    s.textContent=`
      #lastAccess .lastAccessWhen{display:grid;gap:2px;min-width:94px}
      #lastAccess .lastAccessWhen b{font-size:12px;color:var(--ink)}
      #lastAccess .lastAccessWhen small{font-size:11px;color:var(--muted);font-weight:800}
      #lastAccess .accessTypePill{display:inline-flex;padding:5px 8px;border-radius:999px;font-size:10px;font-weight:900;white-space:nowrap}
      #lastAccess .accessTypePill.service{background:#eef4ff;color:#1f5eb7}
      #lastAccess .accessTypePill.visitor{background:#fff5df;color:#9a6200}
      #lastAccess .accessTypePill.legacy{background:#f1f3f7;color:#667085}
      body.theme-dark #lastAccess .accessTypePill.legacy{background:#1a2638;color:#a7b0c0}
    `;
    document.head.appendChild(s);
  }

  function setup(){
    installStyle();
    const host=document.getElementById('lastAccess');
    if(!host){setTimeout(setup,250);return}
    compact();
    const obs=new MutationObserver(()=>compact());
    obs.observe(host,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
  window.PortariaLastAccessCompactV152={version:'152.0',refresh:compact};
})();
