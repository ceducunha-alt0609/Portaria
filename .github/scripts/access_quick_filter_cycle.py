from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

old='''<div class="searchbar accessSearchRow" style="margin-top:12px"><input id="accessSearch" oninput="renderAccess()" placeholder="Buscar por nome, doc, bloco ou apto"><button type="button" class="accessSearchClearBtn" onclick="clearAccessSearch()">Limpar</button></div>
          <div id="accessTable"></div>'''
new='''<div class="searchbar accessSearchRow" style="margin-top:12px"><input id="accessSearch" oninput="renderAccess()" placeholder="Buscar por nome, doc, bloco ou apto"><button type="button" class="accessSearchClearBtn" onclick="clearAccessSearch()">Limpar</button></div>
          <div class="accessQuickFilters" id="accessQuickFilters" aria-label="Filtrar acessos em andamento por tipo">
            <button type="button" class="accessQuickFilter active" data-access-type="" onclick="setAccessQuickFilter('')">Todos</button>
            <button type="button" class="accessQuickFilter" data-access-type="Visitante" onclick="setAccessQuickFilter('Visitante')">Visitantes</button>
            <button type="button" class="accessQuickFilter" data-access-type="Prestador" onclick="setAccessQuickFilter('Prestador')">Prestadores</button>
          </div>
          <div id="accessTable"></div>'''
if s.count(old)!=1: raise SystemExit('toolbar divergente')
s=s.replace(old,new,1)

marker='function renderAccess(){'
helper='''let accessQuickType='';
function setAccessQuickFilter(type=''){
  accessQuickType=String(type||'');
  document.querySelectorAll('.accessQuickFilter').forEach(btn=>btn.classList.toggle('active',(btn.dataset.accessType||'')===accessQuickType));
  renderAccess();
}
'''
if helper not in s:
    if s.count(marker)!=1: raise SystemExit('renderAccess marker divergente')
    s=s.replace(marker,helper+marker,1)

old="const arr=accesses.filter(a=>!a.saida).filter(a=>(String(a.nome||'')+String(a.docType||'')+String(a.doc||'')+(a.empresa||'')+(a.destino||'')+(a.autorizado||'')+(a.servico||'')+(a.bloco||'')+(a.apto||'')+(a.tipoAcesso||'')+(a.tipo||'')+(a.obs||'')).toLowerCase().includes(q)).sort((a,b)=>new Date(b.entrada||0)-new Date(a.entrada||0));"
new="const arr=accesses.filter(a=>!a.saida).filter(a=>!accessQuickType||accessTypeLabel(a)===accessQuickType).filter(a=>(String(a.nome||'')+String(a.docType||'')+String(a.doc||'')+(a.empresa||'')+(a.destino||'')+(a.autorizado||'')+(a.servico||'')+(a.bloco||'')+(a.apto||'')+(a.tipoAcesso||'')+(a.tipo||'')+(a.obs||'')).toLowerCase().includes(q)).sort((a,b)=>new Date(b.entrada||0)-new Date(a.entrada||0));"
if s.count(old)!=1: raise SystemExit('filtro renderAccess divergente')
s=s.replace(old,new,1)

old="function accessCard(a){const mins=elapsedMinutes(a), stayClass=mins>=240?'long':(mins>=90?'medium':''); const destino=a.destino||(a.bloco? a.bloco+' '+a.apto:'—'); return `<article class=\"accessCard\""
new="function accessCard(a){const mins=elapsedMinutes(a), stayClass=mins>=240?'long':(mins>=90?'medium':''); const destino=a.destino||(a.bloco? a.bloco+' '+a.apto:'—'); return `<article class=\"accessCard accessCard-${accessTypeClass(a)}\""
if s.count(old)!=1: raise SystemExit('accessCard class divergente')
s=s.replace(old,new,1)

css='''
/* v155 — filtros rápidos do Controle em andamento */
.accessQuickFilters{display:flex;align-items:center;gap:8px;margin:10px 0 12px;flex-wrap:wrap}
.accessQuickFilter{min-height:34px;padding:7px 13px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--muted);font:inherit;font-size:10px;font-weight:900;letter-spacing:.025em;cursor:pointer;transition:.15s ease}
.accessQuickFilter:hover{border-color:rgba(200,162,74,.45);color:var(--text)}
.accessQuickFilter.active{border-color:rgba(200,162,74,.58);background:rgba(200,162,74,.12);color:var(--gold,#c8a24a);box-shadow:inset 0 0 0 1px rgba(200,162,74,.08)}
.accessCard-visitor{border-left:3px solid rgba(70,132,220,.55)}
.accessCard-service{border-left:3px solid rgba(200,162,74,.68)}
.accessCard-legacy{border-left:3px solid rgba(130,140,155,.28)}
.accessCard .accessTypePill{font-size:9.5px;padding:5px 8px}
@media(max-width:620px){.accessQuickFilters{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.accessQuickFilter{width:100%;padding-left:6px;padding-right:6px}}
'''
marker_css='/* v154 — tipo de acesso no controle e histórico */'
pos=s.find(marker_css)
if pos<0: raise SystemExit('CSS v154 ausente')
style_end=s.find('</style>',pos)
if style_end<0: raise SystemExit('style end ausente')
s=s[:style_end]+css+s[style_end:]

for token in ['id="accessQuickFilters"','function setAccessQuickFilter','!accessQuickType||accessTypeLabel(a)===accessQuickType','accessCard-${accessTypeClass(a)}']:
    if token not in s: raise SystemExit('validacao '+token)
p.write_text(s,encoding='utf-8')
