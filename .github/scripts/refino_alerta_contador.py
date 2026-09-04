from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

old="""function accessCard(a){const mins=elapsedMinutes(a), stayClass=mins>=240?'long':(mins>=90?'medium':''); const stayAlert=accessStayAlert(mins); const destino=a.destino||(a.bloco? a.bloco+' '+a.apto:'—'); return `<article class=\"accessCard accessCard-${accessTypeClass(a)} ${stayAlert.cls?'accessStay-'+stayAlert.cls:''}\" onclick=\"openAccessDetail('${a.id}')\"><div class=\"accessCardTop\"><div class=\"accessPerson\">${esc(a.nome||'Sem nome')} <span class=\"accessTypePill ${accessTypeClass(a)}\">${esc(accessTypeLabel(a))}</span></div><span class=\"accessDest\">${esc(destino)}</span></div>${stayAlert.label?`<div class=\"accessStayAlert ${stayAlert.cls}\">${stayAlert.label}</div>`:''}<div class=\"accessMeta\"><div class=\"accessMetaItem\"><b>Dia</b><span>${esc(dateBR(a.data||dateOnly(a.entrada)))}</span></div><div class=\"accessMetaItem\"><b>Entrada</b><span>${esc(a.entradaHora||timeOnly(a.entrada))}</span></div></div><div class=\"stayPill ${stayClass}\">⏱ ${esc(elapsed(a))}</div><div class=\"operatorLine\"><span>👤 ${esc(a.createdByName||'Operador não registrado')}</span></div></article>`}"""
new="""function accessCard(a){const mins=elapsedMinutes(a), stayClass=mins>=240?'long':(mins>=90?'medium':''); const stayAlert=accessStayAlert(mins); const destino=a.destino||(a.bloco? a.bloco+' '+a.apto:'—'); return `<article class=\"accessCard accessCard-${accessTypeClass(a)} ${stayAlert.cls?'accessStay-'+stayAlert.cls:''}\" onclick=\"openAccessDetail('${a.id}')\"><div class=\"accessCardTop\"><div class=\"accessPerson\">${esc(a.nome||'Sem nome')} <span class=\"accessTypePill ${accessTypeClass(a)}\">${esc(accessTypeLabel(a))}</span></div><span class=\"accessDest\">${esc(destino)}</span></div><div class=\"accessMeta\"><div class=\"accessMetaItem\"><b>Dia</b><span>${esc(dateBR(a.data||dateOnly(a.entrada)))}</span></div><div class=\"accessMetaItem\"><b>Entrada</b><span>${esc(a.entradaHora||timeOnly(a.entrada))}</span></div></div><div class=\"accessStayLine\"><div class=\"stayPill ${stayClass}\">⏱ ${esc(elapsed(a))}</div>${stayAlert.label?`<div class=\"accessStayAlert inline ${stayAlert.cls}\">${stayAlert.label}</div>`:''}</div><div class=\"operatorLine\"><span>👤 ${esc(a.createdByName||'Operador não registrado')}</span></div></article>`}"""
if s.count(old)!=1: raise SystemExit('accessCard atual não localizado')
s=s.replace(old,new,1)

oldcss=""".accessStayAlert{display:inline-flex;align-items:center;width:max-content;max-width:100%;margin:10px 0 2px;padding:6px 9px;border:1px solid var(--line);border-radius:9px;font-size:10px;font-weight:900;letter-spacing:.015em}"""
newcss=""".accessStayLine{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px}.accessStayLine .stayPill{margin:0}.accessStayAlert{display:inline-flex;align-items:center;width:max-content;max-width:100%;margin:10px 0 2px;padding:6px 9px;border:1px solid var(--line);border-radius:9px;font-size:10px;font-weight:900;letter-spacing:.015em}.accessStayAlert.inline{margin:0;min-height:34px}"""
if s.count(oldcss)!=1: raise SystemExit('CSS base alerta não localizado')
s=s.replace(oldcss,newcss,1)

oldmedia="""@media(max-width:620px){.accessStayAlert{width:100%;justify-content:center}}"""
newmedia="""@media(max-width:620px){.accessStayLine{align-items:stretch}.accessStayAlert.inline{width:auto;justify-content:center}.accessStayAlert:not(.inline){width:100%;justify-content:center}}"""
if s.count(oldmedia)!=1: raise SystemExit('media alerta não localizada')
s=s.replace(oldmedia,newmedia,1)

for token in ['accessStayLine','accessStayAlert inline','Verificar saída','Permanência prolongada']:
    if token not in s: raise SystemExit('validação falhou: '+token)
p.write_text(s,encoding='utf-8')

sw=Path('sw.js')
w=sw.read_text(encoding='utf-8')
if 'portaria-primavera-v1-0-19' not in w: raise SystemExit('SW esperado v1-0-19')
w=w.replace('portaria-primavera-v1-0-19','portaria-primavera-v1-0-20',1)
sw.write_text(w,encoding='utf-8')
