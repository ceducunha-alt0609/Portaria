from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

PUBLIC_URL='https://ceducunha-alt0609.github.io/Portaria/'

# 1) URL pública explícita
anchor="const SUPABASE_URL='https://wfqxfgswdhnmmfjeajwn.supabase.co';"
if s.count(anchor)!=1: raise SystemExit('SUPABASE_URL marker divergente')
s=s.replace(anchor,anchor+f"\nconst APP_PUBLIC_URL='{PUBLIC_URL}';",1)

# 2) Usa URL pública em signUp e reset
s=s.replace("const redirectTo=location.origin+location.pathname;", "const redirectTo=APP_PUBLIC_URL;", 2)

# 3) Modal de nova senha
marker='''  <div class="modal center" id="passwordRecoveryModal">'''
reset_modal='''  <div class="modal center" id="passwordResetModal"><div class="sheet" style="width:min(520px,100%)"><div class="sheetHead"><div><h2>Definir nova senha</h2><p class="mini">Crie uma nova senha para o acesso ao Portaria.</p></div></div><label>Nova senha</label><input id="resetNewPassword" type="password" autocomplete="new-password" placeholder="Digite a nova senha"><label>Confirmar nova senha</label><input id="resetNewPassword2" type="password" autocomplete="new-password" placeholder="Repita a nova senha"><div id="resetPasswordInfo" class="mini" style="margin-top:10px;line-height:1.55"></div><div class="userModalActions" style="margin-top:14px"><button class="btn gold" onclick="completePasswordReset()">Salvar nova senha</button></div></div></div>\n'''
if marker not in s: raise SystemExit('passwordRecoveryModal marker ausente')
s=s.replace(marker,reset_modal+marker,1)

# 4) Funções de reset completo antes de openPasswordRecovery
marker='function openPasswordRecovery(){'
funcs=r'''let passwordRecoverySessionEmail='';
function openPasswordResetFromRecovery(session){
  passwordRecoverySessionEmail=String(session?.user?.email||'').trim().toLowerCase();
  const info=document.getElementById('resetPasswordInfo'); if(info)info.textContent='';
  const a=document.getElementById('resetNewPassword'); const b=document.getElementById('resetNewPassword2');
  if(a)a.value=''; if(b)b.value='';
  document.getElementById('passwordResetModal')?.classList.add('show');
  setTimeout(()=>a?.focus(),80);
}
async function completePasswordReset(){
  const p1=document.getElementById('resetNewPassword')?.value||'';
  const p2=document.getElementById('resetNewPassword2')?.value||'';
  const info=document.getElementById('resetPasswordInfo');
  if(p1.length<6){if(info)info.textContent='Use pelo menos 6 caracteres.';return;}
  if(p1!==p2){if(info)info.textContent='As senhas não coincidem.';return;}
  try{
    if(!cloudReady&&!initCloud())throw new Error('Supabase indisponível');
    const {error}=await supabaseClient.auth.updateUser({password:p1});
    if(error)throw error;
    const email=passwordRecoverySessionEmail;
    const u=(state.users||[]).find(x=>String(x.email||'').trim().toLowerCase()===email);
    if(!u)throw new Error('Usuário local não encontrado para este e-mail');
    u.senha=p1;u.authRecoveryEnabled=true;u.authRecoveryPending=false;u.authRecoveryVerifiedAt=new Date().toISOString();
    addLog('Redefiniu senha por e-mail',u.nome+' • '+maskRecoveryEmail(email),'usuario');
    save();
    try{await supabaseClient.auth.signOut()}catch(e){}
    document.getElementById('passwordResetModal')?.classList.remove('show');
    const lu=document.getElementById('loginUser'); if(lu)lu.value=u.login||'';
    const lp=document.getElementById('loginPass'); if(lp)lp.value='';
    openAppConfirm({title:'Senha atualizada',message:'✓ Sua senha foi redefinida com sucesso. Use a nova senha para entrar no Portaria.',okText:'OK'});
  }catch(e){
    console.warn('Falha ao concluir redefinição',e);
    if(info)info.textContent='Não foi possível salvar a nova senha. '+(e?.message||'Tente novamente.');
  }
}
function setupSupabaseRecoveryListener(){
  try{
    if(!supabaseClient)return;
    supabaseClient.auth.onAuthStateChange((event,session)=>{
      if(event==='PASSWORD_RECOVERY'&&session){openPasswordResetFromRecovery(session);}
    });
    supabaseClient.auth.getSession().then(({data})=>{
      const hash=String(location.hash||'');
      if(data?.session&&(/type=recovery/i.test(hash)||/access_token=/i.test(hash))){openPasswordResetFromRecovery(data.session);}
    }).catch(()=>{});
  }catch(e){console.warn('Falha listener recuperação',e)}
}
'''
if marker not in s: raise SystemExit('openPasswordRecovery marker ausente')
s=s.replace(marker,funcs+marker,1)

# 5) Inicializa listener quando Supabase inicia
old="""    supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);\n    cloudReady=true;"""
new="""    supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);\n    cloudReady=true;\n    setTimeout(setupSupabaseRecoveryListener,0);"""
if s.count(old)!=1: raise SystemExit('initCloud marker divergente')
s=s.replace(old,new,1)

# 6) CSS mínimo
css='''\n/* Auth 2.0 fase 3 — redefinição de senha */\n#passwordResetModal .sheet{border:1px solid rgba(216,184,92,.30)}\n#passwordResetModal input{margin-bottom:4px}\n'''
s=s.replace('</head>',f'<style>{css}</style>\n</head>',1)

# 7) validações
for c in [PUBLIC_URL,'passwordResetModal','function completePasswordReset()','PASSWORD_RECOVERY','APP_PUBLIC_URL']:
    if c not in s: raise SystemExit('Validação ausente: '+c)

p.write_text(s,encoding='utf-8')

sw=Path('sw.js'); w=sw.read_text(encoding='utf-8')
if "portaria-primavera-v1-0-7" not in w: raise SystemExit('SW não está em v1-0-7')
w=w.replace("portaria-primavera-v1-0-7","portaria-primavera-v1-0-8",1)
sw.write_text(w,encoding='utf-8')
