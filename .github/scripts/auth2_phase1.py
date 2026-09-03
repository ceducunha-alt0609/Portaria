from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

# 1) Botão 'Esqueci minha senha?' na tela de login
old='''      <button class="btn gold" style="width:100%;margin-top:14px" onclick="loginUser()">Entrar</button>\n      <div class="loginMsg" id="loginMsg"></div>'''
new='''      <button class="btn gold" style="width:100%;margin-top:14px" onclick="loginUser()">Entrar</button>\n      <button type="button" class="loginRecoverBtn" onclick="openPasswordRecovery()">Esqueci minha senha</button>\n      <div class="loginMsg" id="loginMsg"></div>'''
if s.count(old)!=1: raise SystemExit(f'Login marker encontrado {s.count(old)}x')
s=s.replace(old,new,1)

# 2) Email no cadastro de usuário
old='''<div class="row"><div><label>Nome</label><input id="uNome" placeholder="Ex.: Portaria Noturna"></div><div><label>Login</label><input id="uLogin" placeholder="Ex.: portaria2"></div></div><div class="row"><div><label>Senha</label><input id="uSenha" type="password" placeholder="Deixe em branco para manter ao editar"></div><div><label>Perfil</label>'''
new='''<div class="row"><div><label>Nome</label><input id="uNome" placeholder="Ex.: Portaria Noturna"></div><div><label>Login</label><input id="uLogin" placeholder="Ex.: portaria2"></div></div><div class="row"><div><label>E-mail de recuperação</label><input id="uEmail" type="email" autocomplete="email" placeholder="nome@exemplo.com"></div><div><label>Senha</label><input id="uSenha" type="password" placeholder="Deixe em branco para manter ao editar"></div></div><div class="row"><div><label>Perfil</label>'''
if s.count(old)!=1: raise SystemExit(f'User modal marker encontrado {s.count(old)}x')
s=s.replace(old,new,1)

# Ajusta fechamento de perfil/turno após a alteração de grid
s=s.replace('''</select></div></div><div class="row"><div><label>Turno / função operacional</label>''','''</select></div><div><label>Turno / função operacional</label>''',1)
s=s.replace('''</select></div><div><label>Status</label>''','''</select></div></div><div class="row"><div><label>Status</label>''',1)

# 3) Modal de recuperação antes do userModal
marker='''  <div class="modal center" id="userModal">'''
recovery='''  <div class="modal center" id="passwordRecoveryModal"><div class="sheet" style="width:min(520px,100%)"><div class="sheetHead"><div><h2>Recuperar acesso</h2><p class="mini">Informe seu usuário. O Portaria verificará se existe um e-mail de recuperação vinculado.</p></div><button class="close" onclick="closePasswordRecovery()">×</button></div><label>Usuário</label><input id="recoveryLogin" autocomplete="username" placeholder="Ex.: admin"><div id="recoveryInfo" class="mini" style="margin-top:10px;line-height:1.55"></div><div class="userModalActions" style="margin-top:14px"><button class="btn gold" onclick="requestPasswordRecovery()">Continuar</button><button class="btn ghost" onclick="closePasswordRecovery()">Cancelar</button></div></div></div>\n'''
if marker not in s: raise SystemExit('userModal marker ausente')
s=s.replace(marker,recovery+marker,1)

# 4) Preenche email ao editar
old="""    document.getElementById('uLogin').value=u.login||'';\n    document.getElementById('uLogin').disabled=true;\n    document.getElementById('uSenha').value='';"""
new="""    document.getElementById('uLogin').value=u.login||'';\n    document.getElementById('uLogin').disabled=true;\n    const emailEl=document.getElementById('uEmail'); if(emailEl)emailEl.value=u.email||'';\n    document.getElementById('uSenha').value='';"""
if s.count(old)!=1: raise SystemExit('openUserModal marker divergente')
s=s.replace(old,new,1)

# 5) Limpa campo email
s=s.replace("['uEditId','uNome','uLogin','uSenha'].forEach", "['uEditId','uNome','uLogin','uEmail','uSenha'].forEach",1)

# 6) Persiste email
old="""  const editId=val('uEditId'), nome=val('uNome'), login=val('uLogin'), senha=val('uSenha'), perfil=val('uPerfil')||'portaria', turno=val('uTurno')||'';"""
new="""  const editId=val('uEditId'), nome=val('uNome'), login=val('uLogin'), email=val('uEmail').trim().toLowerCase(), senha=val('uSenha'), perfil=val('uPerfil')||'portaria', turno=val('uTurno')||'';"""
if s.count(old)!=1: raise SystemExit('saveUserForm header divergente')
s=s.replace(old,new,1)
s=s.replace("u.nome=nome; u.perfil=perfil; u.turno=turno; u.ativo=ativo; if(senha)u.senha=senha;", "u.nome=nome; u.email=email; u.perfil=perfil; u.turno=turno; u.ativo=ativo; if(senha)u.senha=senha;",1)
s=s.replace("{id:'u-'+Date.now(),nome,login,senha,perfil,turno,ativo}", "{id:'u-'+Date.now(),nome,login,email,senha,perfil,turno,ativo}",1)

# 7) Funções de recuperação - somente envia se vínculo Auth estiver explicitamente confirmado
insert_before='''function logoutUser(){sessionStorage.removeItem('pp_current_user'); applyPermissions();}'''
funcs=r'''function openPasswordRecovery(){
  const modal=document.getElementById('passwordRecoveryModal');
  const login=document.getElementById('recoveryLogin');
  const typed=(document.getElementById('loginUser')?.value||'').trim();
  if(login)login.value=typed;
  const info=document.getElementById('recoveryInfo'); if(info)info.textContent='';
  modal?.classList.add('show');
  setTimeout(()=>login?.focus(),80);
}
function closePasswordRecovery(){document.getElementById('passwordRecoveryModal')?.classList.remove('show')}
function maskRecoveryEmail(email=''){
  const [name,domain]=String(email).split('@'); if(!domain)return '';
  const shown=name.length<=2?name[0]||'*':name.slice(0,2);
  return shown+'***@'+domain;
}
async function requestPasswordRecovery(){
  const login=(document.getElementById('recoveryLogin')?.value||'').trim();
  const info=document.getElementById('recoveryInfo');
  if(!login){if(info)info.textContent='Informe o usuário para continuar.';return;}
  const u=(state.users||[]).find(x=>String(x.login||'').toLowerCase()===login.toLowerCase()&&x.ativo!==false);
  if(!u||!u.email){if(info)info.textContent='Este usuário ainda não possui e-mail de recuperação cadastrado. Entre com um administrador para vincular um e-mail.';return;}
  if(u.authRecoveryEnabled!==true){if(info)info.textContent='E-mail cadastrado: '+maskRecoveryEmail(u.email)+'. O vínculo de recuperação segura ainda precisa ser ativado no Supabase Auth para esta conta.';return;}
  try{
    if(!cloudReady&&!initCloud())throw new Error('Supabase indisponível');
    const redirectTo=location.origin+location.pathname;
    const {error}=await supabaseClient.auth.resetPasswordForEmail(u.email,{redirectTo});
    if(error)throw error;
    if(info)info.textContent='Se a conta estiver ativa no serviço de autenticação, enviaremos as instruções para '+maskRecoveryEmail(u.email)+'.';
  }catch(e){
    console.warn('Falha recuperação de senha',e);
    if(info)info.textContent='Não foi possível iniciar a recuperação agora. O login atual continua funcionando normalmente.';
  }
}
'''
if insert_before not in s: raise SystemExit('logout marker ausente')
s=s.replace(insert_before,funcs+insert_before,1)

# 8) CSS discreto para botão de recuperação
css='''\n/* Auth 2.0 fase 1 — recuperação segura preparada */\n.loginRecoverBtn{display:block;width:100%;margin:8px 0 0;border:0;background:transparent;color:#d8b85c;font-family:inherit;font-size:11px;font-weight:900;cursor:pointer;text-align:center;text-decoration:underline;text-underline-offset:3px}\n.loginRecoverBtn:hover{color:#f3d27a}\nbody.theme-light .loginRecoverBtn{color:#7a5a12}\n'''
head='</head>'
if head not in s: raise SystemExit('</head> ausente')
s=s.replace(head,f'<style>{css}</style>\n</head>',1)

for c in ['loginRecoverBtn','passwordRecoveryModal','id="uEmail"','function requestPasswordRecovery()','authRecoveryEnabled']:
    if c not in s: raise SystemExit('Validação ausente: '+c)

p.write_text(s,encoding='utf-8')

# Atualiza somente cache para entregar a nova UI sem tocar na lógica do SW
sw=Path('sw.js')
w=sw.read_text(encoding='utf-8')
if "portaria-primavera-v1-0-5" not in w: raise SystemExit('Versão SW inesperada')
w=w.replace("portaria-primavera-v1-0-5","portaria-primavera-v1-0-6",1)
sw.write_text(w,encoding='utf-8')
