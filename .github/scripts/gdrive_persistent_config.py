from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

old="""function gdriveClientId(){
  return localStorage.getItem('pp_gdrive_client_id')||'';
}
function gdriveApiKey(){
  return localStorage.getItem('pp_gdrive_api_key')||'';
}
"""
new="""function ensureGDriveSettings(){
  if(!state.settings||typeof state.settings!=='object')state.settings={theme:'auto'};
  if(!state.settings.gdrive||typeof state.settings.gdrive!=='object')state.settings.gdrive={clientId:'',apiKey:''};
  return state.settings.gdrive;
}
function syncGDriveConfigStores({persistState=false}={}){
  const cfg=ensureGDriveSettings();
  const localCid=localStorage.getItem('pp_gdrive_client_id')||'';
  const localKey=localStorage.getItem('pp_gdrive_api_key')||'';
  let changed=false;
  if(!cfg.clientId&&localCid){cfg.clientId=localCid;changed=true;}
  if(!cfg.apiKey&&localKey){cfg.apiKey=localKey;changed=true;}
  if(cfg.clientId&&localCid!==cfg.clientId)localStorage.setItem('pp_gdrive_client_id',cfg.clientId);
  if(cfg.apiKey&&localKey!==cfg.apiKey)localStorage.setItem('pp_gdrive_api_key',cfg.apiKey);
  if(persistState&&changed){
    try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
  }
  return cfg;
}
function gdriveClientId(){
  const cfg=syncGDriveConfigStores();
  return String(cfg.clientId||localStorage.getItem('pp_gdrive_client_id')||'').trim();
}
function gdriveApiKey(){
  const cfg=syncGDriveConfigStores();
  return String(cfg.apiKey||localStorage.getItem('pp_gdrive_api_key')||'').trim();
}
"""
if s.count(old)!=1: raise SystemExit('funcoes gdrive base divergentes')
s=s.replace(old,new,1)

old="""function loadIntegrationConfigs(){
  const cid=document.getElementById('gdriveClientIdConfig');
  const key=document.getElementById('gdriveApiKeyConfig');
  if(cid)cid.value=localStorage.getItem('pp_gdrive_client_id')||'';
  if(key)key.value=localStorage.getItem('pp_gdrive_api_key')||'';"""
new="""function loadIntegrationConfigs(){
  syncGDriveConfigStores({persistState:true});
  const cid=document.getElementById('gdriveClientIdConfig');
  const key=document.getElementById('gdriveApiKeyConfig');
  if(cid)cid.value=gdriveClientId();
  if(key)key.value=gdriveApiKey();"""
if s.count(old)!=1: raise SystemExit('loadIntegrationConfigs divergente')
s=s.replace(old,new,1)

old="""  localStorage.setItem('pp_gdrive_client_id',cid);
  localStorage.setItem('pp_gdrive_api_key',key);
  addLog?.('Integração Google Drive','Credenciais salvas em Central Administrativa → Integrações','sistema');"""
new="""  const cfg=ensureGDriveSettings();
  cfg.clientId=cid;
  cfg.apiKey=key;
  localStorage.setItem('pp_gdrive_client_id',cid);
  localStorage.setItem('pp_gdrive_api_key',key);
  save('configuracao-google-drive');
  addLog?.('Integração Google Drive','Credenciais salvas em Central Administrativa → Integrações e proteção de dados','sistema');"""
if s.count(old)!=1: raise SystemExit('saveGDrive config divergente')
s=s.replace(old,new,1)

# clear function body exact targeted lines
old="""  localStorage.removeItem('pp_gdrive_client_id');
  localStorage.removeItem('pp_gdrive_api_key');
  _gdriveToken=null;"""
new="""  const cfg=ensureGDriveSettings();
  cfg.clientId='';
  cfg.apiKey='';
  localStorage.removeItem('pp_gdrive_client_id');
  localStorage.removeItem('pp_gdrive_api_key');
  _gdriveToken=null;
  save('limpeza-configuracao-google-drive');"""
if s.count(old)!=1: raise SystemExit('clearGDrive config divergente')
s=s.replace(old,new,1)

# after imported state settings normalization, mirror gdrive stores
old="""  ensureSettings(); normalizeImportedVehicles?.(); normalizeAccesses?.();
  localStorage.setItem(KEY,JSON.stringify(state));"""
new="""  ensureSettings(); normalizeImportedVehicles?.(); normalizeAccesses?.();
  syncGDriveConfigStores();
  localStorage.setItem(KEY,JSON.stringify(state));"""
if s.count(old)!=1: raise SystemExit('applyBackupData ponto divergente')
s=s.replace(old,new,1)

# migrate during initial state load before return
old="""    data.comunicados=Array.isArray(data.comunicados)?data.comunicados:[];
    data.users.forEach(u=>normalizeUserOperational(u));
    return data;"""
new="""    data.comunicados=Array.isArray(data.comunicados)?data.comunicados:[];
    data.users.forEach(u=>normalizeUserOperational(u));
    const legacyCid=localStorage.getItem('pp_gdrive_client_id')||'';
    const legacyKey=localStorage.getItem('pp_gdrive_api_key')||'';
    if(!data.settings.gdrive||typeof data.settings.gdrive!=='object')data.settings.gdrive={clientId:'',apiKey:''};
    if(!data.settings.gdrive.clientId&&legacyCid)data.settings.gdrive.clientId=legacyCid;
    if(!data.settings.gdrive.apiKey&&legacyKey)data.settings.gdrive.apiKey=legacyKey;
    return data;"""
if s.count(old)!=1: raise SystemExit('load migration ponto divergente')
s=s.replace(old,new,1)

for token in ['function ensureGDriveSettings','syncGDriveConfigStores({persistState:true})',"save('configuracao-google-drive')",'data.settings.gdrive={clientId:\'\',apiKey:\'\'}','syncGDriveConfigStores();']:
    if token not in s: raise SystemExit('validacao '+token)
p.write_text(s,encoding='utf-8')

sw=Path('sw.js')
w=sw.read_text(encoding='utf-8')
if 'portaria-primavera-v1-0-15' not in w: raise SystemExit('SW esperado v1-0-15')
w=w.replace('portaria-primavera-v1-0-15','portaria-primavera-v1-0-16',1)
sw.write_text(w,encoding='utf-8')
