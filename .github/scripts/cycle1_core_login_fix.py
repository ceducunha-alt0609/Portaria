from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

if 'function mergeUsersPreservingPasswords(' in s:
    raise SystemExit('Core de preservação de senhas já existe; abortando para evitar duplicação.')

# 1) Helpers de credenciais logo após defaultUsers()
m=re.search(r"function defaultUsers\(\)\{return\[[^\n]+?\]\}", s)
if not m:
    raise SystemExit('defaultUsers() não localizado com segurança')
helpers=r'''
function repairLocalUserPasswords(users){
  const defaults=defaultUsers();
  const byId=new Map(defaults.map(u=>[u.id,u]));
  const byLogin=new Map(defaults.map(u=>[u.login,u]));
  return (Array.isArray(users)?users:[]).map(u=>{
    if(u&&String(u.senha||'')!=='')return u;
    const d=byId.get(u?.id)||byLogin.get(u?.login);
    return d?{...u,senha:d.senha}:u;
  });
}
function mergeUsersPreservingPasswords(localUsers,remoteUsers){
  const local=Array.isArray(localUsers)?localUsers:[];
  const remote=Array.isArray(remoteUsers)?remoteUsers:[];
  if(!remote.length)return repairLocalUserPasswords(local.length?local:defaultUsers());
  const localById=new Map(local.filter(Boolean).map(u=>[u.id,u]));
  const localByLogin=new Map(local.filter(Boolean).map(u=>[u.login,u]));
  return repairLocalUserPasswords(remote.map(r=>{
    const l=localById.get(r?.id)||localByLogin.get(r?.login);
    return {...r,...(l&&String(l.senha||'')!==''?{senha:l.senha}:{})};
  }));
}
'''
s=s[:m.end()]+helpers+s[m.end():]

# 2) Carregamento local: reparar credenciais conhecidas se vierem vazias
old="data.users=Array.isArray(data.users)&&data.users.length?data.users:defaultUsers();"
new="data.users=repairLocalUserPasswords(Array.isArray(data.users)&&data.users.length?data.users:defaultUsers());"
if s.count(old)!=1:
    raise SystemExit(f'Linha de load users encontrada {s.count(old)}x')
s=s.replace(old,new,1)

# 3) Merge cloud: roster remoto continua autoritativo, mas senha local é preservada
old_merge="merged.users=Array.isArray(remoteState.users)&&remoteState.users.length?remoteState.users:(merged.users||defaultUsers());"
count=s.count(old_merge)
if count!=2:
    raise SystemExit(f'Merge users esperado 2x, encontrado {count}x')
new_merge="merged.users=mergeUsersPreservingPasswords(localState?.users,Array.isArray(remoteState.users)&&remoteState.users.length?remoteState.users:(merged.users||defaultUsers()));"
s=s.replace(old_merge,new_merge)

# 4) Restore manual da nuvem: capturar usuários locais e reaplicar a senha após state=...
start=s.find('async function cloudRestoreLatest(){')
if start<0:
    raise SystemExit('cloudRestoreLatest() não localizado')
# brace matching
brace=s.find('{',start)
depth=0
end=None
for i in range(brace,len(s)):
    if s[i]=='{': depth+=1
    elif s[i]=='}':
        depth-=1
        if depth==0:
            end=i+1
            break
if end is None:
    raise SystemExit('Fim de cloudRestoreLatest() não localizado')
fn=s[start:end]
fn=fn.replace('async function cloudRestoreLatest(){','async function cloudRestoreLatest(){\n  const localUsersBeforeRestore=Array.isArray(state?.users)?state.users.map(u=>({...u})):[];',1)
assigns=list(re.finditer(r'\bstate\s*=\s*[^;]+;',fn))
if not assigns:
    raise SystemExit('Nenhuma atribuição state=... encontrada em cloudRestoreLatest()')
# Insere após a primeira atribuição de state dentro da função de restore
mt=assigns[0]
patched=fn[:mt.end()]+"\n    state.users=mergeUsersPreservingPasswords(localUsersBeforeRestore,state.users);"+fn[mt.end():]
s=s[:start]+patched+s[end:]

# Validações finais
checks=[
 'function repairLocalUserPasswords(',
 'function mergeUsersPreservingPasswords(',
 'data.users=repairLocalUserPasswords(',
 'merged.users=mergeUsersPreservingPasswords(',
 'localUsersBeforeRestore',
 'state.users=mergeUsersPreservingPasswords(localUsersBeforeRestore,state.users);',
 'Consultar histórico de acessos',
 'mobileHistoryShortcut'
]
for c in checks:
    if c not in s: raise SystemExit(f'Validação ausente: {c}')

p.write_text(s,encoding='utf-8')

# Service worker: volta a cuidar apenas de instalação/cache, sem credenciais
sw=Path('sw.js')
ws=sw.read_text(encoding='utf-8')
assets="""  './',\n  './index.html',\n  './manifest.webmanifest',\n  './favicon.png',\n  './assets/icons/icon-192.png',\n  './assets/icons/icon-512.png',\n  './assets/screenshots/desktop-dark.png',\n  './assets/screenshots/desktop-light.png'"""
clean=f"""const CACHE_NAME = 'portaria-primavera-v1-0-5';
const CACHE_PREFIX = 'portaria-primavera-';
const CORE_ASSETS = [
{assets}
];

self.addEventListener('install', event => {{
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
}});

self.addEventListener('activate', event => {{
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
}});

self.addEventListener('fetch', event => {{
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin === self.location.origin && !url.pathname.startsWith(self.registration.scope.replace(self.location.origin, ''))) {{
    return;
  }}

  event.respondWith(
    fetch(event.request)
      .then(response => {{
        if (response && response.ok) {{
          const copy = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, copy))
            .catch(() => {{}});
        }}
        return response;
      }})
      .catch(() =>
        caches.match(event.request)
          .then(cached => cached || (event.request.mode === 'navigate' ? caches.match('./index.html') : undefined))
      )
  );
}});
"""
if 'DEFAULT_LOCAL_PASSWORDS' not in ws or 'repairSnapshotUsers' not in ws:
    raise SystemExit('sw.js atual não corresponde ao workaround de login esperado')
sw.write_text(clean,encoding='utf-8')
