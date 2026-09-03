(()=>{
'use strict';
function supported(){return !!(window.PublicKeyCredential&&navigator.credentials&&window.isSecureContext)}
function message(e){
 const code=String(e?.code||''), msg=String(e?.message||''), name=String(e?.name||'');
 if(name==='NotAllowedError'||/cancel|cancelled|canceled|not allowed/i.test(msg)) return 'Biometria / passkey cancelada.';
 if(code==='passkey_disabled') return 'Passkeys ainda não estão habilitadas no Supabase.';
 if(code==='webauthn_credential_exists') return 'Esta passkey já está cadastrada.';
 if(code==='too_many_passkeys') return 'Esta conta atingiu o limite de passkeys.';
 if(code==='webauthn_credential_not_found') return 'Nenhuma passkey compatível foi encontrada neste dispositivo.';
 return msg||'Não foi possível concluir a autenticação por passkey.';
}
async function loginWithPasskey(){
 const msg=document.getElementById('loginMsg'); if(msg)msg.textContent='';
 if(!supported()){if(msg)msg.textContent='Este dispositivo ou navegador não oferece suporte a passkeys.';return;}
 try{
  if(typeof window.portariaEnsureCloud!=='function'||!window.portariaEnsureCloud()) throw new Error('Supabase indisponível');
  const client=window.portariaSupabaseClient;
  if(!client?.auth||typeof client.auth.signInWithPasskey!=='function') throw new Error('Biblioteca Supabase sem suporte a passkeys.');
  const {data,error}=await client.auth.signInWithPasskey();
  if(error)throw error;
  const email=String(data?.user?.email||'').trim().toLowerCase();
  if(typeof window.portariaCompletePasskeyLogin!=='function') throw new Error('Integração local da passkey indisponível.');
  window.portariaCompletePasskeyLogin(email);
 }catch(e){console.warn('Falha login passkey',e);if(msg)msg.textContent=message(e)}
 finally{try{await window.portariaSupabaseClient?.auth?.signOut()}catch(_){}}
}
function refreshButton(){
 const b=document.getElementById('loginPasskeyBtn');
 if(b)b.style.display=supported()?'block':'none';
}
window.loginWithPasskey=loginWithPasskey;
window.portariaPasskeySupported=supported;
window.portariaPasskeyErrorMessage=message;
window.portariaRefreshPasskeyButton=refreshButton;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refreshButton,{once:true});else refreshButton();
})();
