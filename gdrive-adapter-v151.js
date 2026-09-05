/* Portaria Primavera — Adapter Google Drive v151
   Integra o OAuth GIS ao motor de backup existente sem alterar Supabase.
*/
(()=>{
  if(window.__ppGDriveAdapterV151Loaded)return;
  window.__ppGDriveAdapterV151Loaded=true;

  function setLegacyToken(token){
    try{ _gdriveToken=token||null; }catch(e){}
    window._gdriveToken=token||null;
  }

  function clientId(){
    try{
      if(typeof gdriveClientId==='function') return String(gdriveClientId()||'').trim();
    }catch(e){}
    return String(localStorage.getItem('pp_gdrive_client_id')||'').trim();
  }

  function status(msg,type='info'){
    try{ if(typeof setDriveStatus==='function') return setDriveStatus(msg,type); }catch(e){}
    const el=document.getElementById('driveStatus');
    if(el){el.style.display='block';el.textContent=msg;}
  }

  function toast(msg,type='ok',ms=4000){
    try{ if(typeof showCloudToast==='function') return showCloudToast(msg,type,ms); }catch(e){}
  }

  function refresh(connected){
    try{ if(typeof gdriveUpdateUI==='function') gdriveUpdateUI(!!connected); }catch(e){}
    try{ if(typeof refreshBackupCenterStatus==='function') refreshBackupCenterStatus(); }catch(e){}
    try{ if(typeof updateIntegrationStatus==='function') updateIntegrationStatus(); }catch(e){}
  }

  async function connectDrive(){
    const id=clientId();
    if(!id || !id.includes('.apps.googleusercontent.com')){
      status('⚠ Configure primeiro o OAuth Client ID em Central Administrativa → Integrações.','err');
      toast('Informe o OAuth Client ID do Portaria Primavera','err',5000);
      return '';
    }
    if(!window.PortariaGDriveOAuth){
      status('❌ Módulo OAuth v151 não carregado.','err');
      return '';
    }
    try{
      const token=await window.PortariaGDriveOAuth.connect();
      setLegacyToken(token);
      refresh(true);
      status('✅ Google Drive conectado com segurança.','ok');
      toast('Google Drive conectado ✅','ok',3500);
      try{ if(typeof audit==='function') audit('Google Drive conectado via OAuth GIS v151.'); }catch(e){}
      return token;
    }catch(e){
      setLegacyToken('');
      refresh(false);
      status('❌ Não foi possível conectar ao Google Drive: '+(e?.message||e),'err');
      toast('Falha ao conectar Google Drive','err',5000);
      return '';
    }
  }

  function disconnectDrive(){
    try{ window.PortariaGDriveOAuth?.disconnect(); }catch(e){}
    setLegacyToken('');
    try{ localStorage.removeItem('pp_gdrive_token'); }catch(e){}
    refresh(false);
    const info=document.getElementById('driveUserInfo');
    if(info)info.style.display='none';
    status('Google Drive desconectado.');
    toast('Google Drive desconectado','ok',3000);
  }

  function saveConfig(){
    const field=document.getElementById('gdriveClientIdConfig') || document.getElementById('gdriveClientId');
    const id=String(field?.value||'').trim();
    if(!id || !id.includes('.apps.googleusercontent.com')){
      toast('Informe um OAuth Client ID válido do Google','err',5000);
      status('⚠ Informe o OAuth Client ID do Portaria Primavera.','err');
      return;
    }
    localStorage.setItem('pp_gdrive_client_id',id);
    // v151 não usa API Key nem Client Secret.
    try{ localStorage.removeItem('pp_gdrive_api_key'); }catch(e){}
    try{
      if(typeof state==='object' && state){
        state.settings=state.settings||{};
        state.settings.integrations=state.settings.integrations||{};
        state.settings.integrations.gdrive=state.settings.integrations.gdrive||{};
        state.settings.integrations.gdrive.clientId=id;
        state.settings.integrations.gdrive.apiKey='';
        if(typeof save==='function') save('configuracao-google-drive-oauth-v151');
      }
    }catch(e){}
    updateStatus();
    status('✅ OAuth Client ID salvo. Clique em Conectar ao Google Drive.','ok');
    toast('Configuração Google Drive salva ✅','ok',4000);
  }

  async function testConfig(){
    const id=String((document.getElementById('gdriveClientIdConfig')||document.getElementById('gdriveClientId'))?.value||clientId()||'').trim();
    if(!id || !id.includes('.apps.googleusercontent.com')){
      toast('Informe um OAuth Client ID válido','err',5000);
      return;
    }
    localStorage.setItem('pp_gdrive_client_id',id);
    status('⏳ Testando OAuth e acesso à Google Drive API...');
    const token=await connectDrive();
    if(!token)return;
    try{
      const r=await fetch('https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id,name)',{
        headers:{Authorization:'Bearer '+token},cache:'no-store'
      });
      if(!r.ok)throw new Error('Drive API respondeu HTTP '+r.status);
      await r.json();
      status('✅ OAuth autorizado e Google Drive API acessível.','ok');
      toast('Integração do Google Drive validada ✅','ok',4500);
      try{ if(typeof audit==='function') audit('Teste OAuth Google Drive v151 concluído com sucesso.'); }catch(e){}
    }catch(e){
      status('❌ OAuth abriu, mas a Drive API falhou: '+(e?.message||e),'err');
      toast('Falha no teste da Drive API','err',5000);
    }
  }

  function updateStatus(){
    const st=document.getElementById('gdriveIntegrationStatus');
    const hasClient=!!clientId();
    const connected=!!window.PortariaGDriveOAuth?.isConnected?.();
    if(st){
      st.className='integrationStatus '+(connected?'ok':hasClient?'warn':'warn');
      st.textContent=connected?'Drive conectado':hasClient?'OAuth Client ID configurado':'Não configurado';
    }
    const keyField=document.getElementById('gdriveApiKeyConfig');
    if(keyField){
      const wrap=keyField.closest('div');
      if(wrap)wrap.style.display='none';
    }
    document.querySelectorAll('label').forEach(label=>{
      if(label.textContent.trim()==='API Key'){
        const wrap=label.closest('div'); if(wrap)wrap.style.display='none';
      }
    });
    const hint=document.getElementById('driveClientIdHint');
    if(hint)hint.style.display=hasClient?'none':'';
    try{ if(typeof refreshBackupCenterStatus==='function') refreshBackupCenterStatus(); }catch(e){}
  }

  // Sobrescreve somente a camada de configuração/autenticação do Drive.
  window.gdriveConnect=connectDrive;
  window.gdriveDisconnect=disconnectDrive;
  window.saveGDriveIntegrationConfig=saveConfig;
  window.testGDriveIntegrationConfig=testConfig;

  window.addEventListener('pp:gdrive-connected',e=>{
    const token=window.PortariaGDriveOAuth?.token?.()||'';
    setLegacyToken(token);
    refresh(true);
    updateStatus();
  });
  window.addEventListener('pp:gdrive-disconnected',()=>{
    setLegacyToken('');refresh(false);updateStatus();
  });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',updateStatus,{once:true});
  else setTimeout(updateStatus,0);

  window.PortariaGDriveAdapter={version:'151',connect:connectDrive,disconnect:disconnectDrive,test:testConfig,refresh:updateStatus};
})();
