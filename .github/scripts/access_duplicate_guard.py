from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

marker="""function addAccess(){
  let nome=val('aNome');"""
helper="""let accessDuplicateBypass=false;
function normalizeAccessIdentity(v){return String(v||'').trim().toLowerCase().replace(/\\s+/g,' ')}
function findActiveDuplicateAccess(nome,doc,bloco,apto,destino){
  const docKey=String(doc||'').replace(/\\D/g,'');
  const nomeKey=normalizeAccessIdentity(nome);
  const destinoKey=normalizeAccessIdentity(destino||((bloco&&apto)?`${bloco} ${apto}`:''));
  return (state.accesses||[]).find(a=>{
    if(a.saida||String(a.status||'').toLowerCase()==='saiu')return false;
    const oldDoc=String(a.doc||a.cpf||'').replace(/\\D/g,'');
    if(docKey&&oldDoc&&docKey===oldDoc)return true;
    if(!docKey&&nomeKey&&normalizeAccessIdentity(a.nome)===nomeKey){
      const oldDestino=normalizeAccessIdentity(a.destino||((a.bloco&&a.apto)?`${a.bloco} ${a.apto}`:''));
      return !!destinoKey&&oldDestino===destinoKey;
    }
    return false;
  })||null;
}

function addAccess(){
  let nome=val('aNome');"""
if s.count(marker)!=1: raise SystemExit('inicio addAccess divergente')
s=s.replace(marker,helper,1)

old="""  const bloco=val('aBloco'), apto=val('aApto');
  const destino=val('aDestino')||((bloco&&apto)?`${bloco} ${apto}`:'');
  const id=(crypto&&crypto.randomUUID)?crypto.randomUUID():('acesso-'+Date.now()+'-'+Math.random().toString(16).slice(2));"""
new="""  const bloco=val('aBloco'), apto=val('aApto');
  const destino=val('aDestino')||((bloco&&apto)?`${bloco} ${apto}`:'');
  const docAtual=val('aDoc');
  const duplicado=findActiveDuplicateAccess(nome,docAtual,bloco,apto,destino);
  if(duplicado&&!accessDuplicateBypass){
    const entradaAntiga=duplicado.entradaHora||duplicado.entrada?fmt(duplicado.entrada):'horário não informado';
    const unidadeAntiga=duplicado.destino||((duplicado.bloco&&duplicado.apto)?`${duplicado.bloco} ${duplicado.apto}`:'sem unidade');
    openAppConfirm({
      title:'Acesso já em andamento',
      message:`Já existe um acesso ativo para <b>${esc(duplicado.nome||nome)}</b><br>Unidade: <b>${esc(unidadeAntiga)}</b><br>Entrada: <b>${esc(entradaAntiga)}</b><br><br>Confira o Controle em andamento antes de criar outro registro.`,
      okText:'Registrar mesmo',
      onConfirm:()=>{accessDuplicateBypass=true;try{addAccess()}finally{accessDuplicateBypass=false}}
    });
    return;
  }
  const id=(crypto&&crypto.randomUUID)?crypto.randomUUID():('acesso-'+Date.now()+'-'+Math.random().toString(16).slice(2));"""
if s.count(old)!=1: raise SystemExit('ponto duplicidade divergente')
s=s.replace(old,new,1)

# Fix precedence in displayed old time by using explicit expression
s=s.replace("const entradaAntiga=duplicado.entradaHora||duplicado.entrada?fmt(duplicado.entrada):'horário não informado';","const entradaAntiga=duplicado.entradaHora||(duplicado.entrada?fmt(duplicado.entrada):'horário não informado');",1)

for t in ['function findActiveDuplicateAccess','Acesso já em andamento','Registrar mesmo','accessDuplicateBypass=true']:
    if t not in s: raise SystemExit('validacao '+t)
p.write_text(s,encoding='utf-8')

sw=Path('sw.js')
w=sw.read_text(encoding='utf-8')
if "portaria-primavera-v1-0-14" not in w: raise SystemExit('SW esperado v1-0-14')
w=w.replace('portaria-primavera-v1-0-14','portaria-primavera-v1-0-15',1)
sw.write_text(w,encoding='utf-8')
