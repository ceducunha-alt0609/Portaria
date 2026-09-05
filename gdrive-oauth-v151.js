/* Portaria Primavera — Google Drive OAuth v151
   Fluxo consolidado a partir da v151.8 validada.
   - Client ID isolado da configuração legada v150
   - Google Identity Services executa em janela própria
   - access token somente em memória
   - escopo mínimo: drive.file
   - não altera Supabase, login, splash ou service worker
*/
(()=>{
  if(window.__ppGDriveOAuthV151Loaded)return;
  window.__ppGDriveOAuthV151Loaded=true;

  const KEY='pp_gdrive_oauth_client_id_v151';
  const SCOPE='https://www.googleapis.com/auth/drive.file';
  const BRIDGE='./gdrive-oauth-bridge-v151.html';
  let accessToken='';
  let tokenExpiresAt=0;
  let pending=null;

  function clientId(){
    return String(localStorage.getItem(KEY)||'').trim();
  }

  function status(msg,type='info'){
    try{
      if(typeof window.setDriveStatus==='function'){
        window.setDriveStatus(msg,type);
        return;
      }
    }catch(e){}
    const el=document.getElementById('driveStatus');
    if(!el)return;
    el.style.display='block';
    el.textContent=msg;
  }

  function token(){
    if(!accessToken || Date.now()>=tokenExpiresAt){
      accessToken='';tokenExpiresAt=0;
      return '';
    }
    return accessToken;
  }

  function waitForBridge(){
    if(pending)return pending;
    pending=new Promise((resolve,reject)=>{
      let done=false;
      const timer=setTimeout(()=>finish(new Error('Tempo esgotado aguardando autorização do Google.')),120000);
      function cleanup(){
        clearTimeout(timer);
        window.removeEventListener('message',onMessage);
        pending=null;
      }
      function finish(err,data){
        if(done)return;done=true;cleanup();
        err?reject(err):resolve(data);
      }
      function onMessage(ev){
        if(ev.origin!==location.origin)return;
        if(ev.data?.type==='pp:gdrive-oauth-token'){
          finish(null,ev.data);
        }else if(ev.data?.type==='pp:gdrive-oauth-error'){
          finish(new Error(ev.data.message||'Falha no OAuth do Google Drive.'));
        }
      }
      window.addEventListener('message',onMessage);
      const pop=window.open(BRIDGE+'?v=1518','pp-gdrive-oauth-v151','width=560,height=720');
      if(!pop)finish(new Error('O navegador bloqueou a janela de autorização do Google Drive.'));
    });
    return pending;
  }

  async function connect(){
    const id=clientId();
    if(!id || !id.endsWith('.apps.googleusercontent.com')){
      throw new Error('Configure primeiro o OAuth Client ID do Portaria Primavera.');
    }
    const current=token();
    if(current)return current;

    status('⏳ Abrindo autorização segura do Google Drive...');
    try{
      const auth=await waitForBridge();
      accessToken=String(auth?.token||'');
      if(!accessToken)throw new Error('Google não retornou access token.');
      const expires=Number(auth?.expires_in||3600);
      tokenExpiresAt=Date.now()+Math.max(60,expires-60)*1000;
      window._gdriveToken=accessToken;
      status('✅ Google Drive conectado com segurança.','ok');
      try{window.refreshBackupCenterStatus?.();}catch(e){}
      window.dispatchEvent(new CustomEvent('pp:gdrive-connected',{detail:{expiresIn:expires}}));
      return accessToken;
    }catch(e){
      accessToken='';tokenExpiresAt=0;window._gdriveToken=null;
      status('❌ Não foi possível conectar ao Google Drive: '+(e?.message||e),'err');
      throw e;
    }
  }

  function disconnect(){
    accessToken='';tokenExpiresAt=0;window._gdriveToken=null;
    status('Google Drive desconectado.');
    try{window.refreshBackupCenterStatus?.();}catch(e){}
    window.dispatchEvent(new CustomEvent('pp:gdrive-disconnected'));
  }

  async function getToken(){
    return token()||connect();
  }

  window.PortariaGDriveOAuth={
    version:'151.8-consolidado',
    key:KEY,
    scope:SCOPE,
    clientId,
    connect,
    disconnect,
    token,
    getToken,
    isConnected:()=>!!token()
  };
})();
