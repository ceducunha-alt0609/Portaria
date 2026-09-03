from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

# helper
marker="function renderAccess(){"
helper="""function accessTypeLabel(a){return String(a?.tipoAcesso||'').trim()||'Não informado'}
function accessTypeClass(a){const t=accessTypeLabel(a).toLowerCase();return t==='prestador'?'service':t==='visitante'?'visitor':'legacy'}
"""
if helper not in s:
    if s.count(marker)!=1: raise SystemExit('renderAccess marker divergente')
    s=s.replace(marker,helper+marker,1)

# include type in current search
old="+(a.tipo||'')+(a.obs||'')).toLowerCase().includes(q)"
new="+(a.tipoAcesso||'')+(a.tipo||'')+(a.obs||'')).toLowerCase().includes(q)"
if old not in s: raise SystemExit('busca atual divergente')
s=s.replace(old,new,1)

# card badge
old="<div class=\"accessCardTop\"><div class=\"accessPerson\">${esc(a.nome||'Sem nome')}</div><span class=\"accessDest\">${esc(destino)}</span></div>"
new="<div class=\"accessCardTop\"><div class=\"accessPerson\">${esc(a.nome||'Sem nome')} <span class=\"accessTypePill ${accessTypeClass(a)}\">${esc(accessTypeLabel(a))}</span></div><span class=\"accessDest\">${esc(destino)}</span></div>"
if old not in s: raise SystemExit('accessCard top divergente')
s=s.replace(old,new,1)

# detail type
old="<div class=\"detailLine\"><b>Documento</b><span>${esc(formatAccessDoc(a))}</span></div><div class=\"detailLine\"><b>Empresa</b>"
new="<div class=\"detailLine\"><b>Documento</b><span>${esc(formatAccessDoc(a))}</span></div><div class=\"detailLine\"><b>Tipo de acesso</b><span>${esc(accessTypeLabel(a))}</span></div><div class=\"detailLine\"><b>Empresa</b>"
if old not in s: raise SystemExit('detail divergente')
s=s.replace(old,new,1)

# history modal: grid 6 filters and type select before status
old="grid-template-columns:1.4fr repeat(4,minmax(130px,.7fr));gap:10px;margin-bottom:12px\"><label>Buscar<input id=\"histAccessSearch\" placeholder=\"Nome, documento, empresa, unidade...\" oninput=\"renderAccessHistory()\"></label><label>De<input type=\"date\" id=\"histAccessFrom\" onchange=\"renderAccessHistory()\"></label><label>Até<input type=\"date\" id=\"histAccessTo\" onchange=\"renderAccessHistory()\"></label><label>Status<select id=\"histAccessStatus\""
new="grid-template-columns:1.4fr repeat(5,minmax(120px,.7fr));gap:10px;margin-bottom:12px\"><label>Buscar<input id=\"histAccessSearch\" placeholder=\"Nome, documento, empresa, unidade...\" oninput=\"renderAccessHistory()\"></label><label>De<input type=\"date\" id=\"histAccessFrom\" onchange=\"renderAccessHistory()\"></label><label>Até<input type=\"date\" id=\"histAccessTo\" onchange=\"renderAccessHistory()\"></label><label>Tipo<select id=\"histAccessType\" onchange=\"renderAccessHistory()\"><option value=\"\">Todos</option><option value=\"Visitante\">Visitantes</option><option value=\"Prestador\">Prestadores</option><option value=\"Não informado\">Não informado</option></select></label><label>Status<select id=\"histAccessStatus\""
if old not in s: raise SystemExit('modal filters divergente')
s=s.replace(old,new,1)

# clear filter
old="const st=document.getElementById('histAccessStatus');if(st)st.value='';const to="
new="const tp=document.getElementById('histAccessType');if(tp)tp.value='';const st=document.getElementById('histAccessStatus');if(st)st.value='';const to="
if old not in s: raise SystemExit('clear filters divergente')
s=s.replace(old,new,1)

# render history get type
old="const status=document.getElementById('histAccessStatus')?.value||'';\n  const from="
new="const type=document.getElementById('histAccessType')?.value||'';\n  const status=document.getElementById('histAccessStatus')?.value||'';\n  const from="
if old not in s: raise SystemExit('history vars divergente')
s=s.replace(old,new,1)

# filter type
old="if(status==='dentro'&&a.saida)return false;if(status==='saiu'&&!a.saida)return false;\n    const blob=[a.nome,a.docType,a.doc,a.empresa,a.destino,a.autorizado,a.servico,a.bloco,a.apto,a.tipo].join(' ').toLowerCase();"
new="if(type&&accessTypeLabel(a)!==type)return false;\n    if(status==='dentro'&&a.saida)return false;if(status==='saiu'&&!a.saida)return false;\n    const blob=[a.nome,a.docType,a.doc,a.empresa,a.destino,a.autorizado,a.servico,a.bloco,a.apto,a.tipoAcesso,a.tipo].join(' ').toLowerCase();"
if old not in s: raise SystemExit('history filter divergente')
s=s.replace(old,new,1)

# history table header and row
old="<th>Nome</th><th>Documento</th><th>Empresa</th>"
new="<th>Nome</th><th>Tipo</th><th>Documento</th><th>Empresa</th>"
if old not in s: raise SystemExit('history header divergente')
s=s.replace(old,new,1)
old="<td><b>${esc(a.nome||'—')}</b></td><td>${esc(formatAccessDoc(a)||'—')}</td>"
new="<td><b>${esc(a.nome||'—')}</b></td><td><span class=\"accessTypePill ${accessTypeClass(a)}\">${esc(accessTypeLabel(a))}</span></td><td>${esc(formatAccessDoc(a)||'—')}</td>"
if old not in s: raise SystemExit('history row divergente')
s=s.replace(old,new,1)

# styles
css="""
/* v154 — tipo de acesso no controle e histórico */
.accessTypePill{display:inline-flex;align-items:center;justify-content:center;margin-left:6px;padding:4px 7px;border-radius:999px;font-size:9px;line-height:1;font-weight:900;letter-spacing:.03em;text-transform:uppercase;vertical-align:middle;white-space:nowrap}
.accessTypePill.visitor{background:rgba(44,122,222,.13);color:#2a67b8;border:1px solid rgba(44,122,222,.24)}
.accessTypePill.service{background:rgba(216,184,92,.16);color:#8a6812;border:1px solid rgba(200,162,74,.34)}
.accessTypePill.legacy{background:rgba(120,130,145,.11);color:var(--muted);border:1px solid var(--line)}
body.theme-dark .accessTypePill.visitor{color:#8bbcff;background:rgba(54,126,220,.15)}
body.theme-dark .accessTypePill.service{color:#f0cf72;background:rgba(216,184,92,.12)}
@media(max-width:760px){#accessHistoryModal .historyFilters{grid-template-columns:1fr 1fr!important}}
@media(max-width:620px){#accessHistoryModal .historyFilters{grid-template-columns:1fr!important}}
"""
marker_css='/* v153 — linha principal compacta + relógio de acesso vivo */'
pos=s.find(marker_css)
if pos<0: raise SystemExit('css v153 ausente')
style_end=s.find('</style>',pos)
if style_end<0: raise SystemExit('style end ausente')
s=s[:style_end]+css+s[style_end:]

for token in ['function accessTypeLabel(a)','id="histAccessType"','<th>Tipo</th>','accessTypePill ${accessTypeClass(a)}']:
    if token not in s: raise SystemExit('validacao interna '+token)
p.write_text(s,encoding='utf-8')
