from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old=""".accessQuickFilters{display:flex;align-items:center;gap:8px;margin:10px 0 12px;flex-wrap:wrap}
.accessQuickFilter{min-height:34px;padding:7px 13px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--muted);font:inherit;font-size:10px;font-weight:900;letter-spacing:.025em;cursor:pointer;transition:.15s ease}
.accessQuickFilter:hover{border-color:rgba(200,162,74,.45);color:var(--text)}
.accessQuickFilter.active{border-color:rgba(200,162,74,.58);background:rgba(200,162,74,.12);color:var(--gold,#c8a24a);box-shadow:inset 0 0 0 1px rgba(200,162,74,.08)}"""
new=""".accessQuickFilters{display:flex;align-items:center;gap:12px;margin:12px 0 14px;flex-wrap:wrap}
.accessQuickFilter{min-height:36px;min-width:112px;padding:8px 16px;border:1px solid var(--line);border-radius:10px;background:transparent;color:var(--muted);font:inherit;font-size:10px;font-weight:900;letter-spacing:.025em;cursor:pointer;transition:.15s ease;text-align:center}
.accessQuickFilter:hover{border-color:rgba(200,162,74,.45);color:var(--text);background:rgba(255,255,255,.025)}
.accessQuickFilter.active{border-color:rgba(200,162,74,.58);background:rgba(200,162,74,.10);color:var(--gold,#c8a24a);box-shadow:inset 0 0 0 1px rgba(200,162,74,.06)}"""
if s.count(old)!=1: raise SystemExit('CSS dos filtros rapidos divergente')
s=s.replace(old,new,1)
old_mobile="@media(max-width:620px){.accessQuickFilters{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.accessQuickFilter{width:100%;padding-left:6px;padding-right:6px}}"
new_mobile="@media(max-width:620px){.accessQuickFilters{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.accessQuickFilter{width:100%;min-width:0;padding-left:8px;padding-right:8px;border-radius:9px}}"
if s.count(old_mobile)!=1: raise SystemExit('CSS mobile dos filtros divergente')
s=s.replace(old_mobile,new_mobile,1)
for token in ['border-radius:10px','min-width:112px','gap:12px','margin:12px 0 14px']:
    if token not in s: raise SystemExit('validacao '+token)
p.write_text(s,encoding='utf-8')
