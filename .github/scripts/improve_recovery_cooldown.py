from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old='''<div id="recoveryInfo" class="mini" style="margin-top:10px;line-height:1.55"></div><div class="userModalActions" style="margin-top:14px"><button class="btn gold" onclick="requestPasswordRecovery()">Continuar</button><button class="btn ghost" onclick="closePasswordRecovery()">Cancelar</button></div>'''
new='''<div id="recoveryInfo" class="mini" style="margin-top:10px;line-height:1.55"></div><div class="userModalActions" style="margin-top:14px"><button id="recoveryContinueBtn" class="btn gold" onclick="requestPasswordRecovery()">Continuar</button><button class="btn ghost" onclick="closePasswordRecovery()">Cancelar</button></div>'''
if s.count(old)!=1: raise SystemExit('Botao recovery divergente')
s=s.replace(old,new,1)
marker='''async function requestPasswordRecovery(){'''
helper=r'''let recoveryCooldownTimer=null;
let recoveryCooldownUntil=0;
function startRecoveryCooldown(seconds=60,message='E-mail solicitado. Aguarde antes de pedir novamente.'){
  recoveryCooldownUntil=Date.now()+(Math.max(1,seconds)*1000);
  const btn=document.getElementById('recoveryContinueBtn');
  const info=document.getElementById('recoveryInfo');
  if(recoveryCooldownTimer)clearInterval(recoveryCooldownTimer);
  const tick=()=>{
    const left=Math.max(0,Math.ceil((recoveryCooldownUntil-Date.now())/1000));
    if(btn){btn.disabled=left>0;btn.textContent=left>0?'Aguarde '+left+'s':'Continuar';}
    if(info&&left>0)info.textContent=message+' Liberação em '+left+'s.';
    if(left<=0){clearInterval(recoveryCooldownTimer);recoveryCooldownTimer=null;if(info)info.textContent='Você já pode solicitar um novo e-mail de recuperação.';}
  };
  tick();recoveryCooldownTimer=setInterval(tick,1000);
}
function recoveryRetrySeconds(error){
  const raw=String(error?.message||'');
  const m=raw.match(/after\s+(\d+)\s+seconds?/i);
  return m?Math.max(1,Number(m[1])):60;
}
'''
if marker not in s: raise SystemExit('requestPasswordRecovery ausente')
s=s.replace(marker,helper+marker,1)
old='''    if(error)throw error;
    if(info)info.textContent='Se a conta estiver ativa no serviço de autenticação, enviaremos as instruções para '+maskRecoveryEmail(u.email)+'.';
  }catch(e){
    console.warn('Falha recuperação de senha',e);
    if(info)info.textContent='Não foi possível iniciar a recuperação agora. O login atual continua funcionando normalmente.';
  }'''
new='''    if(error)throw error;
    startRecoveryCooldown(60,'E-mail de recuperação enviado para '+maskRecoveryEmail(u.email)+'.');
  }catch(e){
    console.warn('Falha recuperação de senha',e);
    const code=String(e?.code||'');
    const msg=String(e?.message||'');
    if(code==='over_email_send_rate_limit'||/security purposes|request this after|rate limit|too many/i.test(msg)){
      startRecoveryCooldown(recoveryRetrySeconds(e),'Um e-mail já foi solicitado recentemente.');
    }else if(info){
      info.textContent='Não foi possível iniciar a recuperação agora. O login atual continua funcionando normalmente.';
    }
  }'''
if s.count(old)!=1: raise SystemExit('Catch recovery divergente')
s=s.replace(old,new,1)
for c in ['recoveryContinueBtn','startRecoveryCooldown','recoveryRetrySeconds','Um e-mail já foi solicitado recentemente.']:
    if c not in s: raise SystemExit('Validacao ausente '+c)
p.write_text(s,encoding='utf-8')
sw=Path('sw.js'); w=sw.read_text(encoding='utf-8')
if "portaria-primavera-v1-0-9" not in w: raise SystemExit('SW inesperado')
w=w.replace("portaria-primavera-v1-0-9","portaria-primavera-v1-0-10",1)
sw.write_text(w,encoding='utf-8')
