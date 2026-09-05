/* Portaria Primavera — Adapter Google Drive v151
   Consolidação da bancada v151.8–v151.12.
   Substitui somente configuração/autenticação do Drive e preserva o motor nativo
   de backup/restauração do Portaria Primavera.
*/
(()=>{
  if(window.__ppGDriveAdapterV151Loaded)return;
  window.__ppGDriveAdapterV151Loaded=true;

  const KEY='pp_gdrive_oauth_client_id_v151';

  function clientId(){return String(localStorage.getItem(KEY)||'').trim();}
  function setLegacyToken(token){try{_gdriveToken=token||null;}catch(e){}window._gdriveToken=token||null;}
  function status(msg,type='info'){try{if(typeof setDriveStatus==='function')return setDriveStatus(msg,type);}catch(e){}const el=document.getElementById('driveStatus');if(el){el.style.display='block';el.textContent=msg;}}
  function toast(msg,type='ok',ms=4000){try{if(typeof showCloudToast==='function')return showCloudToast(msg,type,ms);}catch(e){}}
  function hideApiKey(){const keyField=document.getElementById('gdriveApiKeyConfig');if(keyField){const wrap=keyField.closest('div');if(wrap)wrap.style.display='none';}document.querySelectorAll('label').forEach(label=>{if(label.textContent.trim()==='API Key'){const wrap=label.closest('div');if(wrap)wrap.style.display='none';}});}
  function field(){return document.getElementById('gdriveClientIdConfig')||document.getElementById('gdriveClientId');}
  function hydrateField(force=false){const f=field();const saved=clientId();if(f&&(force||!String(f.value||'').trim()))f.value=saved;}

  function updateStatus({hydrate=false}={}){
    hideApiKey();
    if(hydrate)hydrateField(true);
    const hasClient=!!clientId();
    const connected=!!window.PortariaGDriveOAuth?.isConnected?.();
    const st=document.getElementById('gdriveIntegrationStatus');
    if(st){st.className='integrationStatus '+(connected?'ok':'warn');st.textContent=connected?'Drive conectado':hasClient?'OAuth v151 configurado':'OAuth v151 não configurado';}
    const hint=document.getElementById('driveClientIdHint');if(hint)hint.style.display=hasClient?'none':'';
    try{if(typeof refreshBackupCenterStatus==='function')refreshBackupCenterStatus();}catch(e){}
  }

  function loadConfigs(){
    hydrateField(true);hideApiKey();
    const sbUrl=document.getElementById('supabaseUrlConfig'),sbKey=document.getElementById('supabaseKeyConfig');
    try{if(sbUrl)sbUrl.value=typeof SUPABASE_URL!=='undefined'?SUPABASE_URL:'';}catch(e){}
    try{if(sbKey)sbKey.value=typeof SUPABASE_KEY!=='undefined'&&typeof maskCredential==='function'?maskCredential(SUPABASE_KEY):'';}catch(e){}
    updateStatus();
  }

  function saveConfig(){
    const id=String(field()?.value||'').trim();
    if(!id||!id.endsWith('.apps.googleusercontent.com')){toast('Informe um OAuth Client ID válido do Google','err',5000);status('⚠ Informe o OAuth Client ID do Portaria Primavera.','err');return;}
    localStorage.setItem(KEY,id);try{localStorage.removeItem('pp_gdrive_api_key');}catch(e){}
    updateStatus();
    status('✅ OAuth Client ID salvo neste navegador. Clique em Testar configuração.','ok');toast('Configuração Google Drive salva ✅','ok',4000);
    try{if(typeof addLog==='function')addLog('Integração Google Drive','OAuth v151 salvo localmente','sistema');}catch(e){}
  }

  function clearConfig(){
    localStorage.removeItem(KEY);try{localStorage.removeItem('pp_gdrive_api_key');}catch(e){}
    try{window.PortariaGDriveOAuth?.disconnect();}catch(e){}setLegacyToken('');
    const f=field();if(f)f.value='';updateStatus();status('Configuração Google Drive removida deste navegador.');toast('Configuração Google Drive removida','ok',3000);
  }

  async function connectDrive(){
    const id=clientId();
    if(!id||!id.endsWith('.apps.googleusercontent.com')){status('⚠ Configure primeiro o OAuth Client ID em Central Administrativa → Integrações.','err');toast('Informe o OAuth Client ID do Portaria Primavera','err',5000);return '';}
    if(!window.PortariaGDriveOAuth){status('❌ Módulo OAuth v151 não carregado.','err');return '';}
    try{
      const token=await window.PortariaGDriveOAuth.connect();setLegacyToken(token);
      try{if(typeof gdriveUpdateUI==='function')gdriveUpdateUI(true);}catch(e){}updateStatus();toast('Google Drive conectado ✅','ok',3500);
      try{if(typeof audit==='function')audit('Google Drive conectado via OAuth v151.');}catch(e){}return token;
    }catch(e){setLegacyToken('');try{if(typeof gdriveUpdateUI==='function')gdriveUpdateUI(false);}catch(_e){}updateStatus();toast('Falha ao conectar Google Drive','err',5000);return '';}
  }

  function disconnectDrive(){
    try{window.PortariaGDriveOAuth?.disconnect();}catch(e){}setLegacyToken('');
    try{localStorage.removeItem('pp_gdrive_token');localStorage.removeItem('pp_gdrive_token_exp');}catch(e){}
    try{if(typeof gdriveUpdateUI==='function')gdriveUpdateUI(false);}catch(e){}updateStatus();
    const info=document.getElementById('driveUserInfo');if(info)info.style.display='none';toast('Google Drive desconectado','ok',3000);
  }

  async function testConfig(){
    const typed=String(field()?.value||'').trim();
    if(typed&&typed!==clientId())localStorage.setItem(KEY,typed);
    const id=clientId();if(!id||!id.endsWith('.apps.googleusercontent.com')){toast('Informe um OAuth Client ID válido','err',5000);return;}
    status('⏳ Testando OAuth e acesso à Google Drive API...');const token=await connectDrive();if(!token)return;
    try{const r=await fetch('https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id,name)',{headers:{Authorization:'Bearer '+token},cache:'no-store'});if(!r.ok)throw new Error('Drive API respondeu HTTP '+r.status);await r.json();status('✅ OAuth autorizado e Google Drive API acessível.','ok');toast('Integração do Google Drive validada ✅','ok',4500);}catch(e){status('❌ OAuth abriu, mas a Drive API falhou: '+(e?.message||e),'err');toast('Falha no teste da Drive API','err',5000);}
  }

  try{window.gdriveClientId=clientId;}catch(e){}try{window.gdriveApiKey=()=>'';}catch(e){}
  window.loadIntegrationConfigs=loadConfigs;window.updateIntegrationStatus=()=>updateStatus();window.saveGDriveIntegrationConfig=saveConfig;window.clearGDriveIntegrationConfig=clearConfig;window.testGDriveIntegrationConfig=testConfig;window.gdriveConnect=connectDrive;window.gdriveDisconnect=disconnectDrive;
  window.addEventListener('pp:gdrive-connected',()=>{setLegacyToken(window.PortariaGDriveOAuth?.token?.()||'');try{if(typeof gdriveUpdateUI==='function')gdriveUpdateUI(true);}catch(e){}updateStatus();});
  window.addEventListener('pp:gdrive-disconnected',()=>{setLegacyToken('');try{if(typeof gdriveUpdateUI==='function')gdriveUpdateUI(false);}catch(e){}updateStatus();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadConfigs,{once:true});else setTimeout(loadConfigs,0);
  window.PortariaGDriveAdapter={version:'151.12-consolidado',key:KEY,connect:connectDrive,disconnect:disconnectDrive,test:testConfig,save:saveConfig,clear:clearConfig,refresh:()=>updateStatus({hydrate:true})};
})();
