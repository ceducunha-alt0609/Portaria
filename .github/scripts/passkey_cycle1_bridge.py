from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Biblioteca compativel com Passkeys
old='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
new='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.105.0'
if s.count(old)!=1: raise SystemExit(f'CDN Supabase encontrado {s.count(old)}x')
s=s.replace(old,new,1)

# Opt-in experimental e ponte segura para o modulo externo
old="supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);"
new="supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{experimental:{passkey:true}}}); window.portariaSupabaseClient=supabaseClient;"
if s.count(old)!=1: raise SystemExit(f'createClient encontrado {s.count(old)}x')
s=s.replace(old,new,1)

# Botao Passkey na tela de login
old='''<button class="btn gold" style="width:100%;margin-top:14px" onclick="loginUser()">Entrar</button>\n      <button type="button" class="loginRecoverBtn" onclick="openPasswordRecovery()">Esqueci minha senha</button>'''
new='''<button class="btn gold" style="width:100%;margin-top:14px" onclick="loginUser()">Entrar</button>\n      <button type="button" id="loginPasskeyBtn" class="loginPasskeyBtn" onclick="loginWithPasskey()">🔐 Entrar com biometria / passkey</button>\n      <button type="button" class="loginRecoverBtn" onclick="openPasswordRecovery()">Esqueci minha senha</button>'''
if s.count(old)!=1: raise SystemExit('Marcador do login divergente')
s=s.replace(old,new,1)

# Ponte entre Auth Supabase e a sessao local do Portaria
marker='function loginUser(){'
bridge=r'''window.portariaEnsureCloud=function(){
  try{
    if(!cloudReady&&!initCloud())return false;
    window.portariaSupabaseClient=supabaseClient;
    return !!supabaseClient;
  }catch(e){return false;}
};
window.portariaCompletePasskeyLogin=function(email){
  const normalized=String(email||'').trim().toLowerCase();
  const u=(state.users||[]).find(x=>String(x.email||'').trim().toLowerCase()===normalized);
  if(!u)throw new Error('Esta passkey não está vinculada a um usuário do Portaria.');
  if(u.ativo===false)throw new Error('Usuário inativo. Procure o administrador.');
  sessionStorage.setItem('pp_current_user',u.login);
  u.lastAccessAt=new Date().toISOString();
  try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}
  const remember=document.getElementById('rememberLoginUser');
  if(remember&&remember.checked){localStorage.setItem('pp_remember_user','1');localStorage.setItem('pp_saved_login',u.login)}
  const msg=document.getElementById('loginMsg');if(msg)msg.textContent='';
  const pass=document.getElementById('loginPass');if(pass)pass.value='';
  applyPermissions();renderAll();maybeShowHelpTour?.();
  return u;
};
'''
if marker not in s: raise SystemExit('loginUser ausente')
s=s.replace(marker,bridge+marker,1)

# Carrega modulo externo depois do core
if '<script src="./passkey-auth.js"></script>' not in s:
    if '</body>' not in s: raise SystemExit('</body> ausente')
    s=s.replace('</body>','<script src="./passkey-auth.js"></script>\n</body>',1)

# Estilo discreto/premium
css='''\n/* Auth 2.1 — entrada por biometria / passkey */\n.loginPasskeyBtn{display:none;width:100%;margin-top:8px;border:1px solid rgba(216,184,92,.42);border-radius:14px;padding:11px 13px;background:rgba(216,184,92,.08);color:#f3d27a;font-family:inherit;font-weight:900;cursor:pointer}\n.loginPasskeyBtn:hover{background:rgba(216,184,92,.14)}\nbody:not(.dark):not(.theme-dark) .loginPasskeyBtn{color:#7a5a12;background:rgba(200,162,74,.08)}\n'''
if '</head>' not in s: raise SystemExit('</head> ausente')
s=s.replace('</head>',f'<style>{css}</style>\n</head>',1)

for c in ['@supabase/supabase-js@2.105.0','experimental:{passkey:true}','id="loginPasskeyBtn"','portariaCompletePasskeyLogin','./passkey-auth.js']:
    if c not in s: raise SystemExit('Validacao ausente: '+c)

p.write_text(s,encoding='utf-8')

sw=Path('sw.js')
w=sw.read_text(encoding='utf-8')
if "portaria-primavera-v1-0-10" not in w: raise SystemExit('SW nao esta em v1-0-10')
w=w.replace("portaria-primavera-v1-0-10","portaria-primavera-v1-0-11",1)
sw.write_text(w,encoding='utf-8')
