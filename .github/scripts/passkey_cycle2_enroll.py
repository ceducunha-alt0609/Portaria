from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

old='''<div id="uRecoveryAuthBox" class="recoveryAuthBox" style="display:none"><div><b>Recuperação por e-mail</b><div id="uRecoveryAuthStatus" class="mini"></div></div><button type="button" id="uRecoveryAuthBtn" class="btn ghost" onclick="handleUserRecoveryAuth()">Ativar recuperação por e-mail</button></div><div class="userModalActions" style="margin-top:14px">'''
new='''<div id="uRecoveryAuthBox" class="recoveryAuthBox" style="display:none"><div><b>Recuperação por e-mail</b><div id="uRecoveryAuthStatus" class="mini"></div></div><button type="button" id="uRecoveryAuthBtn" class="btn ghost" onclick="handleUserRecoveryAuth()">Ativar recuperação por e-mail</button></div><div id="uPasskeyBox" class="recoveryAuthBox passkeyEnrollBox" style="display:none"><div><b>Biometria / Passkey</b><div id="uPasskeyStatus" class="mini">Cadastre uma passkey neste dispositivo para entrar sem digitar a senha.</div></div><button type="button" id="uPasskeyBtn" class="btn ghost" onclick="openPasskeyEnroll()">Ativar biometria neste dispositivo</button></div><div class="userModalActions" style="margin-top:14px">'''
if s.count(old)!=1: raise SystemExit('box recuperacao divergente')
s=s.replace(old,new,1)

marker='<div class="modal center" id="passwordRecoveryModal">'
modal='''<div class="modal center" id="passkeyEnrollModal"><div class="sheet" style="width:min(520px,100%)"><div class="sheetHead"><div><h2>Ativar biometria / passkey</h2><p class="mini">Confirme a senha atual deste usuário. Em seguida o próprio dispositivo solicitará digital, rosto, PIN ou chave de segurança.</p></div><button class="close" onclick="closePasskeyEnroll()">×</button></div><label>Senha atual</label><input id="passkeyEnrollPassword" type="password" autocomplete="current-password" placeholder="Digite a senha atual"><div id="passkeyEnrollInfo" class="mini" style="margin-top:10px;line-height:1.55"></div><div class="userModalActions" style="margin-top:14px"><button id="passkeyEnrollConfirmBtn" class="btn gold" onclick="confirmPasskeyEnroll()">Continuar</button><button class="btn ghost" onclick="closePasskeyEnroll()">Cancelar</button></div></div></div>\n  '''
if marker not in s: raise SystemExit('marcador modal ausente')
s=s.replace(marker,modal+marker,1)

marker='function renderUserRecoveryAuth(u){'
helpers=r'''function renderUserPasskey(u){
  const box=document.getElementById('uPasskeyBox'),status=document.getElementById('uPasskeyStatus'),btn=document.getElementById('uPasskeyBtn');
  if(!box||!status||!btn)return;
  if(!u||!u.id||u.perfil!=='admin'){box.style.display='none';return;}
  box.style.display='flex';
  const email=String(u.email||'').trim();
  const supported=typeof window.portariaPasskeySupported==='function'&&window.portariaPasskeySupported();
  if(!supported){status.textContent='Este navegador ou dispositivo não oferece suporte a passkeys.';btn.disabled=true;return;}
  if(!email){status.textContent='Informe e salve um e-mail antes de ativar.';btn.disabled=true;return;}
  if(u.authRecoveryEnabled!==true){status.textContent='Confirme primeiro o e-mail de recuperação deste usuário.';btn.disabled=true;return;}
  btn.disabled=false;
  if(u.passkeyEnabled===true){const name=u.passkeyFriendlyName?(' • '+u.passkeyFriendlyName):'';status.textContent='✓ Passkey cadastrada'+name;btn.textContent='Cadastrar outra passkey';}
  else{status.textContent='Pronta para cadastro neste dispositivo.';btn.textContent='Ativar biometria neste dispositivo';}
}
function openPasskeyEnroll(){
  if(!isAdmin())return;
  const id=val('uEditId'),u=(state.users||[]).find(x=>x.id===id);if(!u)return;
  renderUserPasskey(u);
  const box=document.getElementById('uPasskeyBox'),btn=document.getElementById('uPasskeyBtn');if(!box||!btn||btn.disabled)return;
  const input=document.getElementById('passkeyEnrollPassword'),info=document.getElementById('passkeyEnrollInfo');if(input)input.value='';if(info)info.textContent='';
  document.getElementById('passkeyEnrollModal')?.classList.add('show');setTimeout(()=>input?.focus(),80);
}
function closePasskeyEnroll(){document.getElementById('passkeyEnrollModal')?.classList.remove('show');const p=document.getElementById('passkeyEnrollPassword');if(p)p.value='';}
async function confirmPasskeyEnroll(){
  if(!isAdmin())return;
  const id=val('uEditId'),u=(state.users||[]).find(x=>x.id===id);if(!u)return;
  const password=String(val('passkeyEnrollPassword')||''),info=document.getElementById('passkeyEnrollInfo'),btn=document.getElementById('passkeyEnrollConfirmBtn');
  if(!password){if(info)info.textContent='Informe a senha atual.';return;}
  const email=String(u.email||'').trim().toLowerCase();
  if(!email||u.authRecoveryEnabled!==true){if(info)info.textContent='O e-mail deste usuário precisa estar confirmado primeiro.';return;}
  try{
    if(btn)btn.disabled=true;if(info)info.textContent='Validando senha...';
    if(!cloudReady&&!initCloud())throw new Error('Supabase indisponível');
    const login=await supabaseClient.auth.signInWithPassword({email,password});if(login.error)throw login.error;
    if(info)info.textContent='Senha confirmada. Conclua a biometria / passkey no dispositivo.';
    const reg=await supabaseClient.auth.registerPasskey();if(reg.error)throw reg.error;
    u.passkeyEnabled=true;u.passkeyRegisteredAt=new Date().toISOString();u.passkeyId=reg.data?.id||u.passkeyId||'';u.passkeyFriendlyName=reg.data?.friendly_name||'';
    addLog('Cadastrou passkey',u.nome+(u.passkeyFriendlyName?' • '+u.passkeyFriendlyName:''),'usuario');save();renderUserPasskey(u);closePasskeyEnroll();
    openAppConfirm({title:'Biometria / passkey ativada',message:'✓ Passkey cadastrada com sucesso. A partir de agora este usuário pode usar “Entrar com biometria / passkey” na tela de login.',okText:'OK'});
  }catch(e){console.warn('Cadastro passkey',e);const msg=typeof window.portariaPasskeyErrorMessage==='function'?window.portariaPasskeyErrorMessage(e):String(e?.message||'Falha no cadastro');if(info)info.textContent=msg;}
  finally{try{await supabaseClient?.auth?.signOut()}catch(e){}if(btn)btn.disabled=false;const p=document.getElementById('passkeyEnrollPassword');if(p)p.value='';}
}
'''
if marker not in s: raise SystemExit('renderUserRecoveryAuth ausente')
s=s.replace(marker,helpers+marker,1)

old='''    renderUserRecoveryAuth(u);'''
new='''    renderUserRecoveryAuth(u);\n    renderUserPasskey(u);'''
if s.count(old)<1: raise SystemExit('chamada render recovery ausente')
s=s.replace(old,new,1)

old="if(!id){const rb=document.getElementById('uRecoveryAuthBox');if(rb)rb.style.display='none';}"
new="if(!id){const rb=document.getElementById('uRecoveryAuthBox');if(rb)rb.style.display='none';const pb=document.getElementById('uPasskeyBox');if(pb)pb.style.display='none';}"
if old not in s: raise SystemExit('novo usuario marker ausente')
s=s.replace(old,new,1)

css='''\n/* Auth 2.2 — cadastro de biometria / passkey */\n.passkeyEnrollBox{border-color:rgba(200,162,74,.35);background:linear-gradient(145deg,rgba(200,162,74,.08),rgba(13,27,42,.025))}\nbody.dark .passkeyEnrollBox{background:linear-gradient(145deg,rgba(216,184,92,.08),rgba(255,255,255,.02))}\n'''
if '</head>' not in s: raise SystemExit('head ausente')
s=s.replace('</head>',f'<style>{css}</style>\n</head>',1)

for c in ['uPasskeyBox','passkeyEnrollModal','confirmPasskeyEnroll','registerPasskey()','renderUserPasskey(u)']:
    if c not in s: raise SystemExit('validacao ausente '+c)
p.write_text(s,encoding='utf-8')

sw=Path('sw.js')
w=sw.read_text(encoding='utf-8')
if "portaria-primavera-v1-0-11" not in w: raise SystemExit('SW esperado v1-0-11')
w=w.replace("portaria-primavera-v1-0-11","portaria-primavera-v1-0-12",1)
if "'./passkey-auth.js'" not in w:
    w=w.replace("  './favicon.png',","  './favicon.png',\n  './passkey-auth.js',",1)
sw.write_text(w,encoding='utf-8')
