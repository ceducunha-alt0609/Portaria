from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

if 'mobileHistoryShortcut' in s:
    raise SystemExit('Atalho mobile já existe')

marker = '<div id="turnoCardArea"></div>'
insert = '''<div class="mobileHistoryShortcut"><button type="button" class="mobileHistoryShortcutBtn" onclick="openAccessHistory()"><span class="mobileHistoryShortcutIcon">⌕</span><span><b>Consultar histórico de acessos</b><small>Buscar visitas e prestadores anteriores</small></span><span class="mobileHistoryShortcutArrow">›</span></button></div>\n      ''' + marker

if s.count(marker) != 1:
    raise SystemExit(f'Marcador turnoCardArea encontrado {s.count(marker)}x')
s = s.replace(marker, insert, 1)

css = r'''
/* v151 — Atalho mobile para Histórico de acessos no Resumo */
.mobileHistoryShortcut{display:none}
@media(max-width:760px){
  .mobileHistoryShortcut{display:block;margin:12px 0 2px}
  .mobileHistoryShortcutBtn{width:100%;min-height:66px;border:1px solid rgba(200,162,74,.42);border-radius:14px;background:linear-gradient(145deg,#0d1b2a,#17314d);color:#fff;display:grid;grid-template-columns:38px minmax(0,1fr) 22px;align-items:center;gap:10px;padding:11px 13px;text-align:left;box-shadow:0 10px 24px rgba(13,27,42,.18);font-family:'Merriweather',Georgia,'Times New Roman',serif;cursor:pointer}
  .mobileHistoryShortcutBtn:active{transform:translateY(1px)}
  .mobileHistoryShortcutIcon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.08);color:#f3d27a;font-size:23px;font-weight:900}
  .mobileHistoryShortcutBtn b{display:block;font-size:13px;line-height:1.25;color:#fff}
  .mobileHistoryShortcutBtn small{display:block;margin-top:4px;font-size:10px;line-height:1.35;color:rgba(255,255,255,.67);font-weight:400}
  .mobileHistoryShortcutArrow{font-size:28px;line-height:1;color:#f3d27a;text-align:right}
}
body.theme-light .mobileHistoryShortcutBtn{background:linear-gradient(145deg,#0d1b2a,#17314d)!important;color:#fff!important}
body.theme-dark .mobileHistoryShortcutBtn{border-color:rgba(214,178,95,.42)!important}
'''

head_marker = '</head>'
if head_marker not in s:
    raise SystemExit('</head> não encontrado')
s = s.replace(head_marker, f'<style>{css}</style>\n</head>', 1)

p.write_text(s, encoding='utf-8')
