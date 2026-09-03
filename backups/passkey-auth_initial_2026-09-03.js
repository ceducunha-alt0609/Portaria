(()=>{
'use strict';
function supported(){return !!(window.PublicKeyCredential&&navigator.credentials&&window.isSecureContext)}
function message(e){
 const code=String(e?.code||''), msg=String(e?.message||''), name=String(e?.name||'');
 if(name==='NotAllowedError'||/cancel|not allowed/i.test(msg)) return 'Biometria / passkey cancelada.';
 if(code==='passkey_disabled') return 'Passkeys ainda não estão habilitadas no Supabase.';
 if(code==='webauthn_credential_exists') return 'Esta passkey já está cadastrada.';
 if(code==='too_many_passkeys') return 'Esta conta atingiu o limite de passkeys.';
 return msg||'Não foi possível concluir a autenticação por passkey.';
}
async function loginWithPasskey(){
 const msg=document.getElementById('loginMsg'); if(msg)msg.textContent='';
 if(!supported()){if(msg)msg.textContent='Este dispositivo ou navegador não oferece suporte a passkeys.';return;}
 try{
  if(!window.cloudReady&&!window.initCloud()) throw new Error('Supabase indisponível');
  const {data,error}=await window.supabaseClient.auth.signInWithPasskey();
  if(error)throw error;
  const email=String(data?.user?.email||'').trim().toLowerCase();
  const u=(window.state?.users||[]).find(x=>String(x.email||'').trim().toLowerCase()===email);
  if(!u)throw new Error('Esta passkey não está vinculada a um usuário do Portaria.');
  if(u.ativo===false)throw new Error('Usuário inativo. Procure o administrador.');
  sessionStorage.setItem('pp_current_user',u.login); u.lastAccessAt=new Date().toISOString();
  try{localStorage.setItem(window.KEY,JSON.stringify(window.state))}catch(_){ }
  const pass=document.getElementById('loginPass');if(pass)pass.value='';
  window.applyPermissions();window.renderAll();window.maybeShowHelpTour?.();
 }catch(e){console.warn('Falha login passkey',e);if(msg)msg.textContent=message(e)}
 finally{try{await window.supabaseClient?.auth?.signOut()}catch(_){}}
}
window.loginWithPasskey=loginWithPasskey;
window.portariaPasskeySupported=supported;
window.portariaPasskeyErrorMessage=message;
})();
