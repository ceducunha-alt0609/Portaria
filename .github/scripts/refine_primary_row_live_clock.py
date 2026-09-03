from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

first='''<div><label>Data</label><input id="aData" type="date"></div>
            <div><label>Entrada</label><input id="aEntrada" type="time"></div>
            <div class="wide"><label>Nome completo</label><input id="aNome"></div>
            <div><label>Documento</label><input id="aDocType" type="hidden" value="CPF"><input id="aDoc" type="hidden"><button type="button" class="docPickButton empty" id="aDocButton" onclick="openDocModal('new')"><b id="aDocDisplay">Selecionar documento</b><span>CPF, RG, CNH...</span></button></div>'''
wrapped='<div class="accessPrimaryRow">'+first+'</div>'
if s.count(first)!=1: raise SystemExit('linha principal divergente')
s=s.replace(first,wrapped,1)

old='''function addAccess(){
  let nome=val('aNome');
  if(!nome){alert('Informe o nome.');return}
  const data=val('aData')||new Date().toISOString().slice(0,10);
  const hora=val('aEntrada')||new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});'''
new='''function addAccess(){
  let nome=val('aNome');
  if(!nome){alert('Informe o nome.');return}
  syncAccessClock(true);
  const data=val('aData')||new Date().toISOString().slice(0,10);
  const hora=val('aEntrada')||new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});'''
if s.count(old)!=1: raise SystemExit('inicio addAccess divergente')
s=s.replace(old,new,1)

marker='function addAccess(){'
helper='''let accessClockTimer=null;
function syncAccessClock(force=false){
  const dataEl=document.getElementById('aData');
  const timeEl=document.getElementById('aEntrada');
  if(!dataEl||!timeEl)return;
  if(!force&&(document.activeElement===timeEl||document.activeElement===dataEl))return;
  const now=new Date();
  const pad=n=>String(n).padStart(2,'0');
  dataEl.value=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  timeEl.value=`${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
function startAccessClock(){
  syncAccessClock(false);
  if(accessClockTimer)clearInterval(accessClockTimer);
  accessClockTimer=setInterval(()=>syncAccessClock(false),15000);
}
setTimeout(startAccessClock,0);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncAccessClock(false)});

'''
if s.count(marker)!=1: raise SystemExit('marker addAccess ambiguo')
s=s.replace(marker,helper+marker,1)

css='''
/* v153 — linha principal compacta + relógio de acesso vivo */
.accessLine.sheetModel .accessPrimaryRow{
  grid-column:1/-1;
  display:grid;
  grid-template-columns:160px 120px minmax(280px,1.55fr) minmax(240px,1fr);
  gap:12px;
  align-items:end;
}
.accessLine.sheetModel .accessPrimaryRow>div{min-width:0}
.accessLine.sheetModel .accessPrimaryRow .wide{min-width:0}
@media(max-width:1050px){
  .accessLine.sheetModel .accessPrimaryRow{grid-template-columns:150px 115px minmax(230px,1.35fr) minmax(220px,1fr);gap:10px}
}
@media(max-width:760px){
  .accessLine.sheetModel .accessPrimaryRow{grid-template-columns:1fr 1fr}
  .accessLine.sheetModel .accessPrimaryRow .wide{grid-column:1/-1}
}
@media(max-width:520px){
  .accessLine.sheetModel .accessPrimaryRow{grid-template-columns:1fr}
  .accessLine.sheetModel .accessPrimaryRow .wide{grid-column:auto}
}
'''
marker_css='/* v152 — refino do cadastro: Tipo de acesso + Empresa em linha 50/50 */'
pos=s.find(marker_css)
if pos<0: raise SystemExit('CSS v152 ausente')
style_end=s.find('</style>',pos)
if style_end<0: raise SystemExit('fim style ausente')
s=s[:style_end]+css+s[style_end:]

for token in ['class="accessPrimaryRow"','function syncAccessClock(force=false)','setInterval(()=>syncAccessClock(false),15000)','syncAccessClock(true);']:
    if token not in s: raise SystemExit('validacao interna: '+token)
p.write_text(s,encoding='utf-8')
