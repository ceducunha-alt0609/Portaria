from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

old="""function accessCard(a){const mins=elapsedMinutes(a), stayClass=mins>=240?'long':(mins>=90?'medium':''); const destino=a.destino||(a.bloco? a.bloco+' '+a.apto:'—'); return `<article class=\"accessCard accessCard-${accessTypeClass(a)}\" onclick=\"openAccessDetail('${a.id}')\"><div class=\"accessCardTop\"><div class=\"accessPerson\">${esc(a.nome||'Sem nome')} <span class=\"accessTypePill ${accessTypeClass(a)}\">${esc(accessTypeLabel(a))}</span></div><span class=\"accessDest\">${esc(destino)}</span></div><div class=\"accessMeta\"><div class=\"accessMetaItem\"><b>Dia</b><span>${esc(dateBR(a.data||dateOnly(a.entrada)))}</span></div><div class=\"accessMetaItem\"><b>Entrada</b><span>${esc(a.entradaHora||timeOnly(a.entrada))}</span></div></div><div class=\"stayPill ${stayClass}\">⏱ ${esc(elapsed(a))}</div><div class=\"operatorLine\"><span>👤 ${esc(a.createdByName||'Operador não registrado')}</span></div></article>`}"""
new="""function accessStayAlert(mins){
  if(mins>=240)return {cls:'critical',label:'⚠ Verificar saída'};
  if(mins>=90)return {cls:'warning',label:'⏳ Permanência prolongada'};
  return {cls:'',label:''};
}
function accessCard(a){const mins=elapsedMinutes(a), stayClass=mins>=240?'long':(mins>=90?'medium':''); const stayAlert=accessStayAlert(mins); const destino=a.destino||(a.bloco? a.bloco+' '+a.apto:'—'); return `<article class=\"accessCard accessCard-${accessTypeClass(a)} ${stayAlert.cls?'accessStay-'+stayAlert.cls:''}\" onclick=\"openAccessDetail('${a.id}')\"><div class=\"accessCardTop\"><div class=\"accessPerson\">${esc(a.nome||'Sem nome')} <span class=\"accessTypePill ${accessTypeClass(a)}\">${esc(accessTypeLabel(a))}</span></div><span class=\"accessDest\">${esc(destino)}</span></div>${stayAlert.label?`<div class=\"accessStayAlert ${stayAlert.cls}\">${stayAlert.label}</div>`:''}<div class=\"accessMeta\"><div class=\"accessMetaItem\"><b>Dia</b><span>${esc(dateBR(a.data||dateOnly(a.entrada)))}</span></div><div class=\"accessMetaItem\"><b>Entrada</b><span>${esc(a.entradaHora||timeOnly(a.entrada))}</span></div></div><div class=\"stayPill ${stayClass}\">⏱ ${esc(elapsed(a))}</div><div class=\"operatorLine\"><span>👤 ${esc(a.createdByName||'Operador não registrado')}</span></div></article>`}"""
if s.count(old)!=1: raise SystemExit('accessCard divergente')
s=s.replace(old,new,1)

old2="""function openAccessDetail(id){const a=state.accesses.find(x=>x.id===id); if(!a)return; const destino=a.destino||(a.bloco? a.bloco+' '+a.apto:'—'); const mins=elapsedMinutes(a), stayClass=mins>=240?'long':(mins>=90?'medium':''); const statusHtml=a.saida?`<span class=\"badge out access-status\">SAIU ${esc(a.saidaHora||timeOnly(a.saida))}</span>`:`<span class=\"badge in access-status\">NO LOCAL</span>`;"""
new2="""function openAccessDetail(id){const a=state.accesses.find(x=>x.id===id); if(!a)return; const destino=a.destino||(a.bloco? a.bloco+' '+a.apto:'—'); const mins=elapsedMinutes(a), stayClass=mins>=240?'long':(mins>=90?'medium':''); const stayAlert=accessStayAlert(mins); const statusHtml=a.saida?`<span class=\"badge out access-status\">SAIU ${esc(a.saidaHora||timeOnly(a.saida))}</span>`:`<span class=\"badge in access-status\">NO LOCAL</span>`;"""
if s.count(old2)!=1: raise SystemExit('openAccessDetail inicio divergente')
s=s.replace(old2,new2,1)

old3="""document.getElementById('accessDetailBody').innerHTML=`<div class=\"accessDetailTime\">${statusHtml}<span class=\"stayPill ${stayClass}\">⏱ ${esc(elapsed(a))}</span></div>"""
new3="""document.getElementById('accessDetailBody').innerHTML=`<div class=\"accessDetailTime\">${statusHtml}<span class=\"stayPill ${stayClass}\">⏱ ${esc(elapsed(a))}</span></div>${(!a.saida&&stayAlert.label)?`<div class=\"accessStayAlert detail ${stayAlert.cls}\">${stayAlert.label} • ${esc(elapsed(a))} no local</div>`:''}"""
if s.count(old3)!=1: raise SystemExit('accessDetailBody divergente')
s=s.replace(old3,new3,1)

marker="""/* v155 — filtros rápidos do Controle em andamento */"""
css="""
/* v159 — alertas de permanência em acessos em andamento */
.accessStayAlert{display:inline-flex;align-items:center;width:max-content;max-width:100%;margin:10px 0 2px;padding:6px 9px;border:1px solid var(--line);border-radius:9px;font-size:10px;font-weight:900;letter-spacing:.015em}
.accessStayAlert.warning{background:rgba(213,138,0,.10);border-color:rgba(213,138,0,.28);color:#9a6200}
.accessStayAlert.critical{background:rgba(204,51,68,.10);border-color:rgba(204,51,68,.32);color:#a32636}
.accessStayAlert.detail{margin:0 0 12px;width:100%;justify-content:center;padding:8px 10px}
.accessCard.accessStay-warning{box-shadow:inset 0 0 0 1px rgba(213,138,0,.12)}
.accessCard.accessStay-critical{box-shadow:inset 0 0 0 1px rgba(204,51,68,.14),0 10px 28px rgba(204,51,68,.06)}
body.theme-dark .accessStayAlert.warning{color:#f0c66c;background:rgba(213,138,0,.10)}
body.theme-dark .accessStayAlert.critical{color:#ff9cab;background:rgba(204,51,68,.12)}
@media(max-width:620px){.accessStayAlert{width:100%;justify-content:center}}

"""
if marker not in s: raise SystemExit('marcador CSS ausente')
s=s.replace(marker,css+marker,1)

for token in ['function accessStayAlert','Permanência prolongada','Verificar saída','accessStay-critical']:
    if token not in s: raise SystemExit('validacao '+token)
p.write_text(s,encoding='utf-8')

sw=Path('sw.js')
w=sw.read_text(encoding='utf-8')
if 'portaria-primavera-v1-0-18' not in w: raise SystemExit('SW esperado v1-0-18')
w=w.replace('portaria-primavera-v1-0-18','portaria-primavera-v1-0-19',1)
sw.write_text(w,encoding='utf-8')
