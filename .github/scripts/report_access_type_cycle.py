from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

old="""  const r=buildReportData();
  const total=r.accesses.length, noLocal=r.inside.length, saidas=r.exits.length;
  const salaos=r.ops.filter(o=>o.tipo==='salao').length, mudancas=r.ops.filter(o=>o.tipo==='mudanca').length;"""
new="""  const r=buildReportData();
  const total=r.accesses.length, noLocal=r.inside.length, saidas=r.exits.length;
  const visitantes=r.accesses.filter(a=>accessTypeLabel(a)==='Visitante').length;
  const prestadores=r.accesses.filter(a=>accessTypeLabel(a)==='Prestador').length;
  const tipoNaoInformado=Math.max(0,total-visitantes-prestadores);
  const salaos=r.ops.filter(o=>o.tipo==='salao').length, mudancas=r.ops.filter(o=>o.tipo==='mudanca').length;"""
if s.count(old)!=1: raise SystemExit('renderReports inicio divergente')
s=s.replace(old,new,1)

old="""      <div class=\"card reportPanel\"><h3>Saídas registradas</h3><div class=\"reportMiniGrid\"><div class=\"reportMini\"><b>${saidas}</b><span>saídas no período</span></div><div class=\"reportMini\"><b>${noLocal}</b><span>sem saída registrada</span></div><div class=\"reportMini\"><b>${total}</b><span>entradas analisadas</span></div></div></div>"""
new="""      <div class=\"card reportPanel\"><h3>Tipos de acesso</h3><div class=\"reportMiniGrid\"><div class=\"reportMini\"><b>${visitantes}</b><span>visitantes</span></div><div class=\"reportMini\"><b>${prestadores}</b><span>prestadores</span></div><div class=\"reportMini\"><b>${tipoNaoInformado}</b><span>não informado</span></div></div></div>
      <div class=\"card reportPanel\"><h3>Saídas registradas</h3><div class=\"reportMiniGrid\"><div class=\"reportMini\"><b>${saidas}</b><span>saídas no período</span></div><div class=\"reportMini\"><b>${noLocal}</b><span>sem saída registrada</span></div><div class=\"reportMini\"><b>${total}</b><span>entradas analisadas</span></div></div></div>"""
if s.count(old)!=1: raise SystemExit('painel saidas divergente')
s=s.replace(old,new,1)

old="""${reportAccordion('acessos','🚪','Acessos','Unidades, empresas, autorizadores e saídas do período.',[`${total} entradas`,`${noLocal} dentro`],acessosBody,false)}"""
new="""${reportAccordion('acessos','🚪','Acessos','Visitantes, prestadores, unidades, autorizadores e saídas do período.',[`${total} entradas`,`${visitantes} visitantes`,`${prestadores} prestadores`,`${noLocal} dentro`],acessosBody,false)}"""
if s.count(old)!=1: raise SystemExit('accordion acessos divergente')
s=s.replace(old,new,1)

old="""  const payload={geradoEm:new Date().toISOString(),periodo:r.range.label,acessos:{total:r.accesses.length,noLocal:r.inside.length,saidas:r.exits.length,topUnidades:r.topUnits,topEmpresas:r.topCompanies,autorizados:r.topAuthorized},moradores:r.residents,agenda:{resumo:r.byAgenda,eventos:r.ops},logs:r.byLogType};"""
new="""  const tipos={visitantes:r.accesses.filter(a=>accessTypeLabel(a)==='Visitante').length,prestadores:r.accesses.filter(a=>accessTypeLabel(a)==='Prestador').length,naoInformado:r.accesses.filter(a=>accessTypeLabel(a)==='Não informado').length};
  const payload={geradoEm:new Date().toISOString(),periodo:r.range.label,acessos:{total:r.accesses.length,noLocal:r.inside.length,saidas:r.exits.length,tipos,topUnidades:r.topUnits,topEmpresas:r.topCompanies,autorizados:r.topAuthorized},moradores:r.residents,agenda:{resumo:r.byAgenda,eventos:r.ops},logs:r.byLogType};"""
if s.count(old)!=1: raise SystemExit('payload relatorio divergente')
s=s.replace(old,new,1)

old="""  const rows=[['Data entrada','Hora entrada','Nome','CPF','Empresa/Tipo','Unidade visitada','Autorizado por','Serviço','Saída']];"""
new="""  const rows=[['Data entrada','Hora entrada','Nome','CPF','Tipo de acesso','Empresa','Unidade visitada','Autorizado por','Serviço','Saída']];"""
if s.count(old)!=1: raise SystemExit('cabecalho CSV divergente')
s=s.replace(old,new,1)

old="""      a.cpf||'',
      a.empresa||a.tipo||'',
      a.destino||(a.bloco&&a.apto?`${a.bloco} ${a.apto}`:''),"""
new="""      a.cpf||'',
      accessTypeLabel(a),
      a.empresa||'',
      a.destino||(a.bloco&&a.apto?`${a.bloco} ${a.apto}`:''),"""
if s.count(old)!=1: raise SystemExit('linha CSV divergente')
s=s.replace(old,new,1)

old="""<button class=\"reportsExportOption\" onclick=\"exportReportsFromMenu('accessCsv')\"><span class=\"ico\">🚪</span><span><b>CSV de acessos</b><small>Entradas, saídas, empresa, unidade e autorizador.</small></span></button>"""
new="""<button class=\"reportsExportOption\" onclick=\"exportReportsFromMenu('accessCsv')\"><span class=\"ico\">🚪</span><span><b>CSV de acessos</b><small>Visitante/prestador, entradas, saídas, empresa, unidade e autorizador.</small></span></button>"""
if s.count(old)!=1: raise SystemExit('descricao CSV divergente')
s=s.replace(old,new,1)

for t in ['const visitantes=r.accesses.filter','<h3>Tipos de acesso</h3>','\'Tipo de acesso\',\'Empresa\'','accessTypeLabel(a),','tipos={visitantes:']:
    if t not in s: raise SystemExit('validacao '+t)
p.write_text(s,encoding='utf-8')

sw=Path('sw.js')
w=sw.read_text(encoding='utf-8')
if "portaria-primavera-v1-0-13" not in w: raise SystemExit('SW esperado v1-0-13')
w=w.replace('portaria-primavera-v1-0-13','portaria-primavera-v1-0-14',1)
sw.write_text(w,encoding='utf-8')
