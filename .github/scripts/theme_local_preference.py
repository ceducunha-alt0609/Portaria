from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

old="""function applyTheme(){ensureSettings(); const mode=state.settings.theme||'auto'; const resolved=resolveTheme(mode); document.body.classList.toggle('theme-dark',resolved==='dark'); document.body.classList.toggle('theme-light',resolved==='light'); document.querySelectorAll('[data-theme-choice]').forEach(b=>b.classList.toggle('active',b.dataset.themeChoice===mode)); const st=document.getElementById('themeStatus'); if(st){st.textContent=mode==='auto'?`Automático ativo: tema ${resolved==='dark'?'escuro':'claro'} agora.`:`Tema ${mode==='dark'?'escuro':'claro'} ativo.`} updateThemeCycleButton(mode,resolved)}
function setThemeMode(mode){ensureSettings(); state.settings.theme=mode; localStorage.setItem(KEY,JSON.stringify(state)); applyTheme(); const ss=document.getElementById('saveStatus'); if(ss)ss.textContent='Tema salvo às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
function cycleThemeMode(){ensureSettings(); const ordem=['dark','light','auto']; const atual=state.settings.theme||'auto'; const proximo=ordem[(ordem.indexOf(atual)+1+ordem.length)%ordem.length]; setThemeMode(proximo)}"""
new="""const LOCAL_THEME_KEY='pp_local_theme_v1';
function getLocalThemeMode(){
  const local=localStorage.getItem(LOCAL_THEME_KEY)||'';
  if(['dark','light','auto'].includes(local))return local;
  ensureSettings();
  const migrated=['dark','light','auto'].includes(state.settings.theme)?state.settings.theme:'auto';
  localStorage.setItem(LOCAL_THEME_KEY,migrated);
  return migrated;
}
function applyTheme(){ensureSettings(); const mode=getLocalThemeMode(); state.settings.theme=mode; const resolved=resolveTheme(mode); document.body.classList.toggle('theme-dark',resolved==='dark'); document.body.classList.toggle('theme-light',resolved==='light'); document.querySelectorAll('[data-theme-choice]').forEach(b=>b.classList.toggle('active',b.dataset.themeChoice===mode)); const st=document.getElementById('themeStatus'); if(st){st.textContent=mode==='auto'?`Automático ativo: tema ${resolved==='dark'?'escuro':'claro'} agora.`:`Tema ${mode==='dark'?'escuro':'claro'} ativo.`} updateThemeCycleButton(mode,resolved)}
function setThemeMode(mode){ensureSettings(); if(!['dark','light','auto'].includes(mode))mode='auto'; localStorage.setItem(LOCAL_THEME_KEY,mode); state.settings.theme=mode; localStorage.setItem(KEY,JSON.stringify(state)); applyTheme(); const ss=document.getElementById('saveStatus'); if(ss)ss.textContent='Tema salvo neste dispositivo às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
function cycleThemeMode(){const ordem=['dark','light','auto']; const atual=getLocalThemeMode(); const proximo=ordem[(ordem.indexOf(atual)+1+ordem.length)%ordem.length]; setThemeMode(proximo)}"""
if s.count(old)!=1: raise SystemExit('bloco tema divergente')
s=s.replace(old,new,1)

# After remote settings merges, force local preference back into merged state for UI consistency
old2="""    merged.settings={...(merged.settings||{}),...(remoteState.settings||{})};"""
new2="""    merged.settings={...(merged.settings||{}),...(remoteState.settings||{})};
    merged.settings.theme=getLocalThemeMode();"""
if s.count(old2)<1: raise SystemExit('merge settings ausente')
s=s.replace(old2,new2)

for token in ["LOCAL_THEME_KEY='pp_local_theme_v1'",'function getLocalThemeMode()','Tema salvo neste dispositivo','merged.settings.theme=getLocalThemeMode();']:
    if token not in s: raise SystemExit('validacao '+token)

p.write_text(s,encoding='utf-8')

sw=Path('sw.js')
w=sw.read_text(encoding='utf-8')
if 'portaria-primavera-v1-0-17' not in w: raise SystemExit('SW esperado v1-0-17')
w=w.replace('portaria-primavera-v1-0-17','portaria-primavera-v1-0-18',1)
sw.write_text(w,encoding='utf-8')
