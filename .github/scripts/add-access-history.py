from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old='<div class="panelHead"><div class="title" style="margin:0"><h2>Controle em andamento</h2></div><button class="btn ghost adminOnly" onclick="exportData()">Exportar backup</button></div>'
new='<div class="panelHead"><div class="title" style="margin:0"><h2>Controle em andamento</h2></div><div class="actions" style="margin:0"><button class="btn ghost" onclick="openAccessHistory()">Histórico de acessos</button><button class="btn ghost adminOnly" onclick="exportData()">Exportar backup</button></div></div>'
if s.count(old)!=1: raise SystemExit(f'header alvo encontrado {s.count(old)}x')
s=s.replace(old,new,1)
marker='function clearAccessSearch(){'
block=r'''function openAccessHistory(){
  let modal=document.getElementById('accessHistoryModal');
  if(!modal){
    modal=document.createElement('div'); modal.id='accessHistoryModal'; modal.className='modal';
    modal.innerHTML=`<div class="sheet" style="width:min(1180px,100%);max-height:92vh"><div class="sheetHead"><div><h2 style="margin:0">Histórico de acessos</h2><div class="mini">Consulte visitantes e prestadores já finalizados ou ainda no condomínio.</div></div><button class="close" onclick="closeAccessHistory()">×</button></div><div class="historyFilters" style="display:grid;grid-template-columns:1.4fr repeat(4,minmax(130px,.7fr));gap:10px;margin-bottom:12px"><label>Buscar<input id="histAccessSearch" placeholder="Nome, documento, empresa, unidade..." oninput="renderAccessHistory()"></label><label>De<input type="date" id="histAccessFrom" onchange="renderAccessHistory()"></label><label>Até<input type="date" id="histAccessTo" onchange="renderAccessHistory()"></label><label>Status<select id="histAccessStatus" onchange="renderAccessHistory()"><option value="">Todos</option><option value="dentro">Dentro</option><option value="saiu">Saiu</option></select></label><label>Unidade<input id="histAccessUnit" placeholder="Ex: Bloco 2 31" oninput="renderAccessHistory()"></label></div><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px"><div id="histAccessSummary" class="mini"></div><button class="btn ghost" onclick="clearAccessHistoryFilters()">Limpar filtros</button></div><div id="histAccessList"></div></div>`;
    document.body.appendChild(modal);
  }
  const to=document.getElementById('histAccessTo'),from=document.getElementById('histAccessFrom');
  if(to&&!to.value){const d=new Date();to.value=d.toISOString().slice(0,10)}
  if(from&&!from.value){const d=new Date();d.setDate(d.getDate()-30);from.value=d.toISOString().slice(0,10)}
  modal.classList.add('show'); renderAccessHistory();
}
function closeAccessHistory(){document.getElementById('accessHistoryModal')?.classList.remove('show')}
function clearAccessHistoryFilters(){['histAccessSearch','histAccessUnit'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});const st=document.getElementById('histAccessStatus');if(st)st.value='';const to=document.getElementById('histAccessTo'),from=document.getElementById('histAccessFrom');const d=new Date();if(to)to.value=d.toISOString().slice(0,10);d.setDate(d.getDate()-30);if(from)from.value=d.toISOString().slice(0,10);renderAccessHistory()}
function renderAccessHistory(){
  normalizeAccesses();
  const q=(document.getElementById('histAccessSearch')?.value||'').trim().toLowerCase();
  const unit=(document.getElementById('histAccessUnit')?.value||'').trim().toLowerCase();
  const status=document.getElementById('histAccessStatus')?.value||'';
  const from=document.getElementById('histAccessFrom')?.value||'';
  const to=document.getElementById('histAccessTo')?.value||'';
  let arr=(state.accesses||[]).filter(a=>{
    const dt=(a.data||String(a.entrada||'').slice(0,10));
    if(from&&dt<from)return false;if(to&&dt>to)return false;
    if(status==='dentro'&&a.saida)return false;if(status==='saiu'&&!a.saida)return false;
    const blob=[a.nome,a.docType,a.doc,a.empresa,a.destino,a.autorizado,a.servico,a.bloco,a.apto,a.tipo].join(' ').toLowerCase();
    if(q&&!blob.includes(q))return false;
    const ub=[a.destino,a.bloco,a.apto].join(' ').toLowerCase(); if(unit&&!ub.includes(unit))return false;
    return true;
  }).sort((a,b)=>new Date(b.entrada||b.createdAt||0)-new Date(a.entrada||a.createdAt||0));
  const summary=document.getElementById('histAccessSummary');if(summary)summary.textContent=`${arr.length} registro${arr.length===1?'':'s'} encontrado${arr.length===1?'':'s'}`;
  const box=document.getElementById('histAccessList');if(!box)return;
  if(!arr.length){box.innerHTML='<div class="empty">Nenhum acesso encontrado para os filtros selecionados.</div>';return;}
  box.innerHTML=`<div style="overflow:auto"><table><thead><tr><th>Data</th><th>Entrada</th><th>Saída</th><th>Nome</th><th>Documento</th><th>Empresa</th><th>Unidade</th><th>Autorizado por</th><th>Serviço</th><th>Status</th></tr></thead><tbody>${arr.map(a=>`<tr><td>${esc(a.data||String(a.entrada||'').slice(0,10)||'—')}</td><td>${esc(a.entradaHora||timeOnly(a.entrada)||'—')}</td><td>${esc(a.saidaHora||timeOnly(a.saida)||'—')}</td><td><b>${esc(a.nome||'—')}</b></td><td>${esc(formatAccessDoc(a)||'—')}</td><td>${esc(a.empresa||'—')}</td><td>${esc(a.destino||[a.bloco,a.apto].filter(Boolean).join(' ')||'—')}</td><td>${esc(a.autorizado||'—')}</td><td>${esc(a.servico||'—')}</td><td><span class="badge ${a.saida?'out':'in'}">${a.saida?'Saiu':'Dentro'}</span></td></tr>`).join('')}</tbody></table></div>`;
}

'''
if s.count(marker)!=1: raise SystemExit(f'marker historico encontrado {s.count(marker)}x')
s=s.replace(marker,block+marker,1)
css='@media(max-width:900px){#accessHistoryModal .historyFilters{grid-template-columns:1fr 1fr!important}}\n@media(max-width:620px){#accessHistoryModal .historyFilters{grid-template-columns:1fr!important}}\n'
s=s.replace('</style>',css+'</style>',1)
p.write_text(s,encoding='utf-8')
