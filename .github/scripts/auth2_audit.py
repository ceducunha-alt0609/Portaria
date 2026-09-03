from pathlib import Path

s=Path('index.html').read_text(encoding='utf-8')
markers=['loginUser','loginPass','function loginUser','defaultUsers','supabaseClient','createClient','resetPasswordForEmail','users=','perfil','senha','email']
out=[]
out.append(f'INDEX_BYTES={len(s.encode("utf-8"))}\n')
for m in markers:
    out.append(f'\n===== {m} =====\n')
    start=0
    hits=0
    while True:
        i=s.find(m,start)
        if i<0: break
        hits+=1
        a=max(0,i-700); b=min(len(s),i+1400)
        out.append(f'--- hit {hits} @ {i} ---\n{s[a:b]}\n')
        start=i+len(m)
        if hits>=8: break
    if hits==0: out.append('(sem ocorrencias)\n')
Path('.github/auth2_audit.txt').write_text(''.join(out),encoding='utf-8')
