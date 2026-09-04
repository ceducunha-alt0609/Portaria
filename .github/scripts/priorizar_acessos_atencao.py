from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="""  const arr=accesses.filter(a=>!a.saida).filter(a=>!accessQuickType||accessTypeLabel(a)===accessQuickType).filter(a=>(String(a.nome||'')+String(a.docType||'')+String(a.doc||'')+(a.empresa||'')+(a.destino||'')+(a.autorizado||'')+(a.servico||'')+(a.bloco||'')+(a.apto||'')+(a.tipoAcesso||'')+(a.tipo||'')+(a.obs||'')).toLowerCase().includes(q)).sort((a,b)=>new Date(b.entrada||0)-new Date(a.entrada||0));"""
new="""  const accessPriority=a=>{const mins=elapsedMinutes(a);return mins>=240?2:(mins>=90?1:0)};
  const arr=accesses.filter(a=>!a.saida).filter(a=>!accessQuickType||accessTypeLabel(a)===accessQuickType).filter(a=>(String(a.nome||'')+String(a.docType||'')+String(a.doc||'')+(a.empresa||'')+(a.destino||'')+(a.autorizado||'')+(a.servico||'')+(a.bloco||'')+(a.apto||'')+(a.tipoAcesso||'')+(a.tipo||'')+(a.obs||'')).toLowerCase().includes(q)).sort((a,b)=>{const pa=accessPriority(a),pb=accessPriority(b);if(pb!==pa)return pb-pa;return new Date(a.entrada||0)-new Date(b.entrada||0)});"""
if s.count(old)!=1: raise SystemExit('ordenacao atual divergente')
s=s.replace(old,new,1)
for token in ['const accessPriority=a=>','mins>=240?2','if(pb!==pa)return pb-pa','new Date(a.entrada||0)-new Date(b.entrada||0)']:
    if token not in s: raise SystemExit('validacao '+token)
p.write_text(s,encoding='utf-8')
sw=Path('sw.js')
w=sw.read_text(encoding='utf-8')
if 'portaria-primavera-v1-0-21' not in w: raise SystemExit('SW esperado v1-0-21')
w=w.replace('portaria-primavera-v1-0-21','portaria-primavera-v1-0-22',1)
sw.write_text(w,encoding='utf-8')
