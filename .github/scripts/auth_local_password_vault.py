from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

# 1) key must exist before state=load()
needle="""const aptos=['01','02','03','04','11','12','13','14','21','22','23','24','31','32','33','34','41','42','43','44'];
let state=load();"""
repl="""const LOCAL_USER_PASSWORDS_KEY='pp_local_user_passwords_v1';
const aptos=['01','02','03','04','11','12','13','14','21','22','23','24','31','32','33','34','41','42','43','44'];
let state=load();"""
if s.count(needle)!=1: raise SystemExit('ponto chave local divergente')
s=s.replace(needle,repl,1)

# 2) replace repair with vault-aware version
old="""function repairLocalUserPasswords(users){
  const defaults=defaultUsers();
  const byId=new Map(defaults.map(u=>[u.id,u]));
  const byLogin=new Map(defaults.map(u=>[u.login,u]));
  return (Array.isArray(users)?users:[]).map(u=>{
    if(u&&String(u.senha||'')!=='')return u;
    const d=byId.get(u?.id)||byLogin.get(u?.login);
    return d?{...u,senha:d.senha}:u;
  });
}"""
new="""function getLocalUserPasswordVault(){
  try{const v=JSON.parse(localStorage.getItem(LOCAL_USER_PASSWORDS_KEY)||'{}');return v&&typeof v==='object'?v:{}}catch(e){return{}}
}
function rememberLocalUserPasswords(users){
  const vault=getLocalUserPasswordVault();
  (Array.isArray(users)?users:[]).forEach(u=>{
    const senha=String(u?.senha||''); if(!senha)return;
    if(u?.id)vault['id:'+u.id]=senha;
    if(u?.login)vault['login:'+String(u.login).toLowerCase()]=senha;
  });
  try{localStorage.setItem(LOCAL_USER_PASSWORDS_KEY,JSON.stringify(vault))}catch(e){}
  return vault;
}
function repairLocalUserPasswords(users){
  const defaults=defaultUsers();
  const byId=new Map(defaults.map(u=>[u.id,u]));
  const byLogin=new Map(defaults.map(u=>[u.login,u]));
  const vault=getLocalUserPasswordVault();
  const repaired=(Array.isArray(users)?users:[]).map(u=>{
    if(u&&String(u.senha||'')!=='')return u;
    const saved=(u?.id&&vault['id:'+u.id])||(u?.login&&vault['login:'+String(u.login).toLowerCase()])||'';
    if(saved)return {...u,senha:saved};
    const d=byId.get(u?.id)||byLogin.get(u?.login);
    return d?{...u,senha:d.senha}:u;
  });
  rememberLocalUserPasswords(repaired);
  return repaired;
}"""
if s.count(old)!=1: raise SystemExit('repairLocalUserPasswords divergente')
s=s.replace(old,new,1)

# 3) save always refreshes vault first
old="""function save(syncReason='alteracao'){
  normalizeAccesses();
  touchStateMeta(syncReason);
  localStorage.setItem(KEY,JSON.stringify(state));"""
new="""function save(syncReason='alteracao'){
  normalizeAccesses();
  touchStateMeta(syncReason);
  rememberLocalUserPasswords(state.users);
  localStorage.setItem(KEY,JSON.stringify(state));"""
if s.count(old)!=1: raise SystemExit('save divergente')
s=s.replace(old,new,1)

# 4) full/import restores must repair every user, not only empty arrays
old="""  if(!Array.isArray(state.logs))state.logs=[];
  if(!Array.isArray(state.users)||!state.users.length)state.users=defaultUsers();
  state.users.forEach(u=>normalizeUserOperational(u));"""
new="""  if(!Array.isArray(state.logs))state.logs=[];
  state.users=repairLocalUserPasswords(Array.isArray(state.users)&&state.users.length?state.users:defaultUsers());
  state.users.forEach(u=>normalizeUserOperational(u));"""
if s.count(old)<1: raise SystemExit('apply/restore users pattern ausente')
# replace all matching restoration guards; safe and intended
s=s.replace(old,new)

# 5) sync post-merge guard also repair, not just defaults
old2="""    if(!Array.isArray(state.users)||!state.users.length)state.users=defaultUsers();
    state.users.forEach(u=>{if(u.ativo===undefined)u.ativo=true});"""
new2="""    state.users=repairLocalUserPasswords(Array.isArray(state.users)&&state.users.length?state.users:defaultUsers());
    state.users.forEach(u=>{if(u.ativo===undefined)u.ativo=true});"""
if s.count(old2)<1: raise SystemExit('sync users guard ausente')
s=s.replace(old2,new2)

# 6) explicit cloud restore safeguard right after merge call
old3="""    state.users=mergeUsersPreservingPasswords(localUsersBeforeRestore,state.users);
      if(!Array.isArray(state.users)||!state.users.length)state.users=defaultUsers();"""
new3="""    state.users=mergeUsersPreservingPasswords(localUsersBeforeRestore,state.users);
      state.users=repairLocalUserPasswords(Array.isArray(state.users)&&state.users.length?state.users:defaultUsers());"""
if old3 in s:s=s.replace(old3,new3)

for token in ["LOCAL_USER_PASSWORDS_KEY='pp_local_user_passwords_v1'",'function rememberLocalUserPasswords','const vault=getLocalUserPasswordVault()', 'rememberLocalUserPasswords(state.users);']:
    if token not in s: raise SystemExit('validacao '+token)

p.write_text(s,encoding='utf-8')

sw=Path('sw.js')
w=sw.read_text(encoding='utf-8')
if 'portaria-primavera-v1-0-16' not in w: raise SystemExit('SW esperado v1-0-16')
w=w.replace('portaria-primavera-v1-0-16','portaria-primavera-v1-0-17',1)
sw.write_text(w,encoding='utf-8')
