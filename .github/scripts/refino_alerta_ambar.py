from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old=""".accessStayAlert.warning{background:rgba(213,138,0,.10);border-color:rgba(213,138,0,.28);color:#9a6200}"""
new=""".accessStayAlert.warning{background:rgba(213,138,0,.14);border-color:rgba(213,138,0,.42);color:#8a5600;box-shadow:inset 0 0 0 1px rgba(213,138,0,.05)}"""
if s.count(old)!=1: raise SystemExit('warning claro divergente')
s=s.replace(old,new,1)
old2="""body.theme-dark .accessStayAlert.warning{color:#f0c66c;background:rgba(213,138,0,.10)}"""
new2="""body.theme-dark .accessStayAlert.warning{color:#ffd47c;background:rgba(213,138,0,.16);border-color:rgba(240,184,68,.42)}"""
if s.count(old2)!=1: raise SystemExit('warning escuro divergente')
s=s.replace(old2,new2,1)
old3=""".accessCard.accessStay-warning{box-shadow:inset 0 0 0 1px rgba(213,138,0,.12)}"""
new3=""".accessCard.accessStay-warning{box-shadow:inset 0 0 0 1px rgba(213,138,0,.18)}"""
if s.count(old3)!=1: raise SystemExit('card warning divergente')
s=s.replace(old3,new3,1)
for token in ['rgba(213,138,0,.14)','rgba(240,184,68,.42)','accessCard.accessStay-warning']:
    if token not in s: raise SystemExit('validacao '+token)
p.write_text(s,encoding='utf-8')
sw=Path('sw.js')
w=sw.read_text(encoding='utf-8')
if 'portaria-primavera-v1-0-20' not in w: raise SystemExit('SW esperado v1-0-20')
w=w.replace('portaria-primavera-v1-0-20','portaria-primavera-v1-0-21',1)
sw.write_text(w,encoding='utf-8')
