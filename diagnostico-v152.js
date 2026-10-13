/* Portaria Primavera — diagnóstico seguro v152 */
(()=>{
  if(window.__ppDiag152)return; window.__ppDiag152=true;
  const esc=v=>String(v??'—').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  async function info(){
    let sw='não controlado',reg='—';
    try{
      if(navigator.serviceWorker){
        sw=navigator.serviceWorker.controller?.scriptURL||'sem controller';
        const r=await navigator.serviceWorker.getRegistration();
        reg=r?.active?.scriptURL||r?.waiting?.scriptURL||r?.installing?.scriptURL||'sem registro ativo';
      }
    }catch(e){sw='erro: '+e.message}
    return {
      url:location.href,
      origem:location.origin,
      modo:matchMedia('(display-mode: standalone)').matches?'PWA instalado':'navegador/atalho',
      guard:window.PortariaSyncGuardV152?.version||'NÃO CARREGADO',
      sw,reg,
      ultimo:localStorage.getItem('pp_last_sync_at')||'sem registro',
      snap:localStorage.getItem('pp_last_sync_snapshot_id')||'sem registro',
      acessos:Array.isArray(window.state?.accesses)?window.state.accesses.length:'—',
      dentro:Array.isArray(window.state?.accesses)?window.state.accesses.filter(a=>!a?.saida).length:'—'
    };
  }
  async function open(){
    const d=await info();
    let box=document.getElementById('ppDiag152');
    if(!box){box=document.createElement('div');box.id='ppDiag152';document.body.appendChild(box)}
    box.innerHTML=`<div class="ppDiagBack"><div class="ppDiagCard"><div class="ppDiagHead"><b>Diagnóstico Portaria</b><button id="ppDiagClose">×</button></div><div class="ppDiagBadge">SYNC GUARD ${esc(d.guard)}</div><div class="ppDiagGrid"><b>Modo</b><span>${esc(d.modo)}</span><b>Acessos locais</b><span>${esc(d.acessos)}</span><b>Ainda dentro</b><span>${esc(d.dentro)}</span><b>Último sync</b><span>${esc(d.ultimo)}</span><b>Snapshot</b><span>${esc(d.snap)}</span><b>Service Worker</b><span>${esc(d.sw)}</span><b>Registro SW</b><span>${esc(d.reg)}</span><b>Origem</b><span>${esc(d.origem)}</span><b>URL</b><span>${esc(d.url)}</span></div><p>Este painel é somente leitura. Não altera nem exclui dados.</p></div></div>`;
    document.getElementById('ppDiagClose').onclick=()=>box.remove();
  }
  const s=document.createElement('style');s.textContent=`#ppDiag152{position:fixed;inset:0;z-index:99999}.ppDiagBack{position:absolute;inset:0;background:#0d1b2ab8;display:grid;place-items:center;padding:16px}.ppDiagCard{width:min(620px,100%);max-height:88vh;overflow:auto;background:#fff;color:#172033;border-radius:22px;padding:18px;box-shadow:0 24px 70px #0005;font-family:Merriweather,Georgia,serif}.ppDiagHead{display:flex;justify-content:space-between;align-items:center;font-size:20px}.ppDiagHead button{border:0;background:#f3f4f6;border-radius:12px;width:38px;height:38px;font-size:25px}.ppDiagBadge{margin:14px 0;padding:10px;border-radius:12px;background:#f7f1df;font-weight:900;color:#7a5a12}.ppDiagGrid{display:grid;grid-template-columns:120px 1fr;gap:9px;font-size:12px}.ppDiagGrid span{word-break:break-all}.ppDiagCard p{font-size:11px;color:#667085;margin:16px 0 0}`;document.head.appendChild(s);
  function install(){
    let b=document.getElementById('ppDiagBtn');if(b)return;
    b=document.createElement('button');b.id='ppDiagBtn';b.type='button';b.textContent='DIAG';b.title='Diagnóstico de sincronização';
    b.style.cssText='position:fixed;right:14px;bottom:72px;z-index:70;border:1px solid #c8a24a;background:#0d1b2a;color:#fff;border-radius:999px;padding:9px 12px;font:800 10px Merriweather,serif;box-shadow:0 8px 22px #0003';b.onclick=open;document.body.appendChild(b);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  window.PortariaDiagnostico152={open,info};
})();