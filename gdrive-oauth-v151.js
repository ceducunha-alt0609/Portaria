/* Portaria Primavera — Google Drive OAuth v151
   Ciclo isolado: autenticação Drive via Google Identity Services.
   Não altera Supabase, login local, splash ou service worker.
*/
(()=>{
  if(window.__ppGDriveOAuthV151Loaded)return;
  window.__ppGDriveOAuthV151Loaded=true;

  const SCOPE='https://www.googleapis.com/auth/drive.file';
  let tokenClient=null;
  let accessToken='';
  let tokenExpiresAt=0;

  function clientId(){
    return (localStorage.getItem('pp_gdrive_client_id')||'').trim();
  }

  function status(msg,type='info'){
    if(typeof window.setDriveStatus==='function'){
      window.setDriveStatus(msg,type);
      return;
    }
    const el=document.getElementById('driveStatus');
    if(!el)return;
    el.style.display='block';
    el.textContent=msg;
  }

  function loadGIS(){
    return new Promise((resolve,reject)=>{
      if(window.google?.accounts?.oauth2)return resolve();
      const existing=document.querySelector('script[data-pp-gis="1"]');
      if(existing){
        existing.addEventListener('load',()=>resolve(),{once:true});
        existing.addEventListener('error',()=>reject(new Error('Falha ao carregar Google Identity Services.')),{once:true});
        return;
      }
      const s=document.createElement('script');
      s.src='https://accounts.google.com/gsi/client';
      s.async=true;
      s.defer=true;
      s.dataset.ppGis='1';
      s.onload=()=>resolve();
      s.onerror=()=>reject(new Error('Falha ao carregar Google Identity Services.'));
      document.head.appendChild(s);
    });
  }

  async function ensureTokenClient(){
    const id=clientId();
    if(!id||!id.includes('.apps.googleusercontent.com')){
      throw new Error('Configure primeiro o OAuth Client ID do Portaria Primavera.');
    }
    await loadGIS();
    if(tokenClient)return tokenClient;
    tokenClient=google.accounts.oauth2.initTokenClient({
      client_id:id,
      scope:SCOPE,
      callback:()=>{}
    });
    return tokenClient;
  }

  async function connect(){
    status('⏳ Abrindo autorização segura do Google Drive...');
    const tc=await ensureTokenClient();
    return new Promise((resolve,reject)=>{
      tc.callback=(resp)=>{
        if(resp?.error){
          accessToken='';tokenExpiresAt=0;
          const err=new Error(resp.error_description||resp.error);
          status('❌ Não foi possível conectar ao Google Drive: '+err.message,'err');
          reject(err);return;
        }
        accessToken=resp.access_token||'';
        const expires=Number(resp.expires_in||3600);
        tokenExpiresAt=Date.now()+Math.max(60,expires-60)*1000;
        window._gdriveToken=accessToken;
        status('✅ Google Drive conectado com segurança.','ok');
        try{window.refreshBackupCenterStatus?.();}catch{}
        window.dispatchEvent(new CustomEvent('pp:gdrive-connected',{detail:{expiresIn:expires}}));
        resolve(accessToken);
      };
      tc.requestAccessToken({prompt:accessToken?'':'consent'});
    });
  }

  function disconnect(){
    const old=accessToken;
    accessToken='';tokenExpiresAt=0;window._gdriveToken=null;
    if(old&&window.google?.accounts?.oauth2?.revoke){
      try{google.accounts.oauth2.revoke(old,()=>{});}catch{}
    }
    status('Google Drive desconectado.');
    try{window.refreshBackupCenterStatus?.();}catch{}
    window.dispatchEvent(new CustomEvent('pp:gdrive-disconnected'));
  }

  function token(){
    if(!accessToken||Date.now()>=tokenExpiresAt)return '';
    return accessToken;
  }

  async function getToken(){
    const current=token();
    if(current)return current;
    return connect();
  }

  window.PortariaGDriveOAuth={
    version:'151',
    scope:SCOPE,
    connect,
    disconnect,
    token,
    getToken,
    isConnected:()=>!!token()
  };
})();
