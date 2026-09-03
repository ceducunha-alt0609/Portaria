from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

EMAIL='c.edu.cunha1977@gmail.com'

# 1) Default Admin com e-mail de recuperação
old="{id:'u-admin',nome:'Administrador',login:'admin',senha:'admin123',perfil:'admin',turno:'administracao',ativo:true}"
new="{id:'u-admin',nome:'Administrador',login:'admin',email:'%s',senha:'admin123',perfil:'admin',turno:'administracao',ativo:true,authRecoveryEnabled:false,authRecoveryPending:false}" % EMAIL
if s.count(old)!=1:
    raise SystemExit(f'Default admin encontrado {s.count(old)}x')
s=s.replace(old,new,1)

# 2) Migração: instalação existente recebe e-mail do Admin se ainda estiver vazio
marker="data.users=repairLocalUserPasswords(Array.isArray(data.users)&&data.users.length?data.users:defaultUsers());"
addition=marker+"\n    const migratedAdmin=data.users.find(u=>u&&(u.id==='u-admin'||u.login==='admin')); if(migratedAdmin&&!String(migratedAdmin.email||'').trim())migratedAdmin.email='%s';" % EMAIL
if s.count(marker)!=1:
    raise SystemExit(f'load users marker encontrado {s.count(marker)}x')
s=s.replace(marker,addition,1)

# 3) Área de status/ativação dentro do modal de usuário, antes das ações Salvar/Cancelar
marker='<div class="userModalActions" style="margin-top:14px"><button class="btn gold" onclick="saveUserForm()">Salvar usuário</button>'
insert='''<div id="uRecoveryAuthBox" class="recoveryAuthBox" style="display:none"><div><b>Recuperação por e-mail</b><div id="uRecoveryAuthStatus" class="mini"></div></div><button type="button" id="uRecoveryAuthBtn" class="btn ghost" onclick="handleUserRecoveryAuth()">Ativar recuperação por e-mail</button></div><div class="userModalActions" style="margin-top:14px"><button class="btn gold" onclick="saveUserForm()">Salvar usuário</button>'''
if s.count(marker)!=1: raise SystemExit('Ações do userModal divergentes')
s=s.replace(marker,insert,1)

# 4) Ao abrir usuário, renderiza status Auth
old="""    if(title)title.textContent='Editar usuário';"""
new="""    if(title)title.textContent='Editar usuário';\n    renderUserRecoveryAuth(u);"""
if s.count(old)!=1: raise SystemExit('title user modal marker divergente')
s=s.replace(old,new,1)

# Ao criar novo, esconde bloco
old="""  if(modal)modal.classList.add('show');\n}"""
new="""  if(!id){const rb=document.getElementById('uRecoveryAuthBox');if(rb)rb.style.display='none';}\n  if(modal)modal.classList.add('show');\n}"""
# Só primeira ocorrência depois de openUserModal; como pode haver várias, restringe pela posição
pos=s.find('function openUserModal(')
if pos<0: raise SystemExit('openUserModal ausente')
idx=s.find(old,pos)
if idx<0: raise SystemExit('fim openUserModal não localizado')
s=s[:idx]+new+s[idx+len(old):]

# 5) Funções de ativação/verificação antes de openUserModal
marker='function openUserModal(id=\'\'){'
funcs=r'''function renderUserRecoveryAuth(u){
  const box=document.getElementById('uRecoveryAuthBox');
  const status=document.getElementById('uRecoveryAuthStatus');
  const btn=document.getElementById('uRecoveryAuthBtn');
  if(!box||!status||!btn)return;
  if(!u||!u.id){box.style.display='none';return;}
  box.style.display='flex';
  const email=String(u.email||'').trim();
  if(!email){status.textContent='Cadastre e salve um e-mail para habilitar esta proteção.';btn.textContent='Ativar recuperação por e-mail';btn.disabled=true;return;}
  btn.disabled=false;
  if(u.authRecoveryEnabled===true){status.textContent='✓ Ativa para '+maskRecoveryEmail(email);btn.textContent='Verificar novamente';return;}
  if(u.authRecoveryPending===true){status.textContent='Confirmação pendente em '+maskRecoveryEmail(email)+'. Após confirmar no e-mail, clique em verificar.';btn.textContent='Verificar ativação';return;}
  status.textContent='E-mail cadastrado: '+maskRecoveryEmail(email)+'. Ainda não vinculado ao Supabase Auth.';btn.textContent='Ativar recuperação por e-mail';
}
async function handleUserRecoveryAuth(){
  if(!isAdmin())return;
  const id=val('uEditId');
  const u=(state.users||[]).find(x=>x.id===id); if(!u)return;
  const email=(val('uEmail')||u.email||'').trim().toLowerCase();
  if(!email){openAppConfirm({title:'E-mail necessário',message:'Informe e salve um e-mail de recuperação antes de ativar.',okText:'OK'});return;}
  if(email!==String(u.email||'').trim().toLowerCase()){
    openAppConfirm({title:'Salve primeiro',message:'O e-mail foi alterado. Salve o usuário antes de ativar a recuperação.',okText:'OK'});return;
  }
  if(!String(u.senha||'')){
    openAppConfirm({title:'Senha indisponível',message:'Defina uma senha local para este usuário antes de ativar a recuperação.',okText:'OK'});return;
  }
  if(u.authRecoveryPending===true||u.authRecoveryEnabled===true){
    await verifyUserRecoveryAuth(u); return;
  }
  openAppConfirm({
    title:'Ativar recuperação por e-mail',
    message:'O Portaria enviará ao Supabase o e-mail '+maskRecoveryEmail(email)+' e a senha atual deste usuário somente para criar o vínculo de autenticação. O login local continuará funcionando normalmente.',
    okText:'Ativar',cancelText:'Cancelar',
    onConfirm:async()=>{
      try{
        if(!cloudReady&&!initCloud())throw new Error('Supabase indisponível');
        const redirectTo=location.origin+location.pathname;
        const {data,error}=await supabaseClient.auth.signUp({email,password:String(u.senha),options:{emailRedirectTo:redirectTo}});
        if(error)throw error;
        try{await supabaseClient.auth.signOut()}catch(e){}
        u.authRecoveryPending=true;u.authRecoveryEnabled=false;u.authRecoveryEmail=email;
        addLog('Ativou recuperação por e-mail',u.nome+' • confirmação pendente','usuario');
        save();renderUserRecoveryAuth(u);
        openAppConfirm({title:'Confirme seu e-mail',message:'Solicitação enviada. Abra a mensagem recebida em '+maskRecoveryEmail(email)+' e confirme o cadastro. Depois volte aqui e clique em “Verificar ativação”.',okText:'Entendi'});
      }catch(e){
        console.warn('Falha ao ativar recuperação',e);
        openAppConfirm({title:'Não foi possível ativar',message:'O Supabase não concluiu a ativação. O login atual não foi alterado. Detalhe: '+(e?.message||'falha de autenticação'),okText:'OK'});
      }
    }
  });
}
async function verifyUserRecoveryAuth(u){
  try{
    if(!cloudReady&&!initCloud())throw new Error('Supabase indisponível');
    const email=String(u.email||'').trim().toLowerCase();
    const {data,error}=await supabaseClient.auth.signInWithPassword({email,password:String(u.senha||'')});
    if(error)throw error;
    try{await supabaseClient.auth.signOut()}catch(e){}
    u.authRecoveryPending=false;u.authRecoveryEnabled=true;u.authRecoveryVerifiedAt=new Date().toISOString();
    addLog('Verificou recuperação por e-mail',u.nome+' • '+maskRecoveryEmail(email),'usuario');
    save();renderUserRecoveryAuth(u);
    openAppConfirm({title:'Recuperação ativada',message:'✓ O e-mail foi validado. A opção “Esqueci minha senha” já pode solicitar uma redefinição segura para '+maskRecoveryEmail(email)+'.',okText:'OK'});
  }catch(e){
    console.warn('Verificação recuperação',e);
    const msg=String(e?.message||'');
    const pending=/confirm|confirmed|verification/i.test(msg);
    openAppConfirm({title:pending?'Confirmação ainda pendente':'Não foi possível verificar',message:pending?'Confirme primeiro a mensagem recebida no e-mail e tente novamente.':'A conta ainda não pôde ser validada. O login local continua normal. Detalhe: '+(msg||'falha de autenticação'),okText:'OK'});
  }
}
'''
if marker not in s: raise SystemExit('openUserModal marker ausente para funções')
s=s.replace(marker,funcs+marker,1)

# 6) Se e-mail mudar, desabilita vínculo antigo ao salvar
old="u.nome=nome; u.email=email; u.perfil=perfil; u.turno=turno; u.ativo=ativo; if(senha)u.senha=senha;"
new="const oldEmail=String(u.email||'').trim().toLowerCase(); u.nome=nome; u.email=email; if(email!==oldEmail){u.authRecoveryEnabled=false;u.authRecoveryPending=false;delete u.authRecoveryVerifiedAt;} u.perfil=perfil; u.turno=turno; u.ativo=ativo; if(senha)u.senha=senha;"
if s.count(old)!=1: raise SystemExit('save edit marker divergente')
s=s.replace(old,new,1)

# 7) CSS do box
css='''\n/* Auth 2.0 fase 2 — vínculo e verificação do e-mail */\n.recoveryAuthBox{margin-top:14px;padding:12px 13px;border:1px solid rgba(200,162,74,.34);border-radius:14px;background:rgba(247,241,223,.38);display:flex;align-items:center;justify-content:space-between;gap:12px}\n.recoveryAuthBox b{display:block;color:var(--navy);font-size:12px;margin-bottom:4px}\n.recoveryAuthBox .btn{flex:0 0 auto;padding:9px 11px;font-size:11px}\nbody.theme-dark .recoveryAuthBox{background:#151b24;border-color:rgba(216,184,92,.34)}\n@media(max-width:620px){.recoveryAuthBox{align-items:stretch;flex-direction:column}.recoveryAuthBox .btn{width:100%}}\n'''
if '</head>' not in s: raise SystemExit('</head> ausente')
s=s.replace('</head>',f'<style>{css}</style>\n</head>',1)

# 8) Validações
for c in [EMAIL,'function handleUserRecoveryAuth()','function verifyUserRecoveryAuth(u)','uRecoveryAuthBox','authRecoveryVerifiedAt']:
    if c not in s: raise SystemExit('Validação ausente: '+c)

p.write_text(s,encoding='utf-8')

# Cache somente para distribuição da nova UI
sw=Path('sw.js'); w=sw.read_text(encoding='utf-8')
if "portaria-primavera-v1-0-6" not in w: raise SystemExit('SW não está em v1-0-6')
w=w.replace("portaria-primavera-v1-0-6","portaria-primavera-v1-0-7",1)
sw.write_text(w,encoding='utf-8')
