from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
css='''\n/* Auth 2.0 — modais de recuperação acima da tela de login */\n#passwordRecoveryModal,#passwordResetModal{z-index:1205!important}\n'''
if '#passwordRecoveryModal,#passwordResetModal{z-index:1205!important}' not in s:
    if '</head>' not in s: raise SystemExit('</head> ausente')
    s=s.replace('</head>',f'<style>{css}</style>\n</head>',1)
p.write_text(s,encoding='utf-8')
sw=Path('sw.js')
w=sw.read_text(encoding='utf-8')
if "portaria-primavera-v1-0-8" not in w: raise SystemExit('SW inesperado')
w=w.replace("portaria-primavera-v1-0-8","portaria-primavera-v1-0-9",1)
sw.write_text(w,encoding='utf-8')
