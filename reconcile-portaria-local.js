/* Portaria Primavera — Conciliação local de acessos, 2026-11-15.
   Não envia dados à nuvem. Não modifica módulos administrativos.
   Exige Admin, arquivo local do perfil Portaria e duas confirmações. */
(() => {
  'use strict';
  if (window.__ppAccessReconcileLoaded) return;
  window.__ppAccessReconcileLoaded = true;
  const BUTTON_ID = 'ppReconcilePortariaBtn';
  const INPUT_ID = 'ppReconcilePortariaFile';

  function isAdminSession() {
    try { return typeof isAdmin === 'function' && isAdmin() &&
      !!(typeof getCurrentUser === 'function' && getCurrentUser()); }
    catch (_) { return false; }
  }
  function timeOf(a) {
    const t = new Date(a?.updatedAt || a?.exitAt || a?.saida || a?.createdAt || a?.entrada || 0).getTime();
    return Number.isFinite(t) ? t : 0;
  }
  function closed(a) { return !!(a && (a.saida || String(a.status || '').toLowerCase() === 'saiu')); }
  function mergeRecord(local, source) {
    if (!local) return source;
    if (!source) return local;
    // A saída confirmada jamais pode voltar a "Dentro".
    if (closed(local) !== closed(source)) return closed(source) ? source : local;
    return timeOf(source) >= timeOf(local) ? source : local;
  }
  function validateExport(input) {
    if (!input || input.format !== 'portaria-primavera-historico-local-v1' ||
        input.source !== 'localStorage' || !Array.isArray(input.accesses) ||
        !Array.isArray(input.deletedAccessIds) ||
        input.recordCount !== input.accesses.length ||
        input.deletedCount !== input.deletedAccessIds.length) {
      throw new Error('Este não é o exportador local da Portaria ou o arquivo está incompleto.');
    }
    const seen = new Set();
    for (const a of input.accesses) {
      if (!a || typeof a.id !== 'string' || !a.id.trim() || seen.has(a.id)) {
        throw new Error('IDs ausentes ou repetidos no histórico de origem.');
      }
      seen.add(a.id);
    }
    for (const d of input.deletedAccessIds) {
      const id = typeof d === 'string' ? d : d?.id;
      if (typeof id !== 'string' || !id.trim()) throw new Error('Marcador de exclusão inválido.');
    }
    return input;
  }
  function planMerge(source) {
    const current = state || {};
    if (!Array.isArray(current.accesses)) throw new Error('Histórico atual indisponível.');
    const local = new Map(current.accesses.filter(a => a?.id).map(a => [a.id, a]));
    if (local.size !== current.accesses.length) throw new Error('O histórico atual possui IDs ausentes ou repetidos. Nenhum dado alterado.');
    const tombstones = new Map();
    for (const d of [...(current.deletedAccessIds || []), ...source.deletedAccessIds]) {
      const item = typeof d === 'string' ? {id:d, deletedAt:''} : d;
      if (!item?.id) continue;
      const previous = tombstones.get(item.id);
      if (!previous || new Date(item.deletedAt || 0).getTime() >= new Date(previous.deletedAt || 0).getTime())
        tombstones.set(item.id, item);
    }
    let added = 0, correctedExit = 0, adjusted = 0;
    for (const record of source.accesses) {
      if (tombstones.has(record.id)) continue;
      const previous = local.get(record.id);
      if (!previous) { local.set(record.id, record); added++; continue; }
      const chosen = mergeRecord(previous, record);
      if (chosen !== previous) {
        if (!closed(previous) && closed(chosen)) correctedExit++;
        else if (JSON.stringify(previous) !== JSON.stringify(chosen)) adjusted++;
        local.set(record.id, chosen);
      }
    }
    const removedByMarkers = [...local.keys()].filter(id => tombstones.has(id)).length;
    const accesses = [...local.values()].filter(a => !tombstones.has(a.id)).sort((a,b) =>
      new Date(b.entrada || b.createdAt || 0) - new Date(a.entrada || a.createdAt || 0));
    return { accesses, deletedAccessIds: [...tombstones.values()],
      added, correctedExit, adjusted, removedByMarkers,
      before: current.accesses.length, after: accesses.length };
  }
  function downloadJson(data, name) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  async function receiveFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !isAdminSession()) return;
    try {
      const source = validateExport(JSON.parse(await file.text()));
      if (!isAdminSession()) return;
      if (typeof syncInProgress !== 'undefined' && syncInProgress) {
        alert('Há sincronização em andamento. Tente novamente quando ela terminar.');
        return;
      }
      const plan = planMerge(source);
      const message = 'Conciliação LOCAL (sem Supabase):\n' +
        'Neste PC: ' + plan.before + ' acessos\n' +
        'Arquivo Portaria: ' + source.accesses.length + ' acessos\n\n' +
        'Novos: ' + plan.added + '\n' +
        'Saídas corrigidas: ' + plan.correctedExit + '\n' +
        'Outros registros atualizados: ' + plan.adjusted + '\n' +
        'Removidos por marcadores explícitos: ' + plan.removedByMarkers + '\n' +
        'Total resultante: ' + plan.after + '\n\n' +
        'Moradores, usuários, comunicados e configurações não serão alterados.\n' +
        'Deseja preparar uma cópia integral de segurança antes de continuar?';
      if (!confirm(message)) return;
      if (!isAdminSession()) return;
      const raw = localStorage.getItem(KEY);
      if (!raw) throw new Error('Não foi possível ler o estado atual para backup.');
      // NÃO duplicar o estado no localStorage: pode exceder a cota do navegador.
      // Backup descarregado como arquivo; nenhuma informação é enviada ao Supabase.
      const backupFileName = 'portaria-backup-integral-antes-conciliacao-' +
        new Date().toISOString().replace(/[:.]/g,'-') + '.json';
      downloadJson({format:'pp-estado-integral-antes-conciliacao-v1',
        generatedAt:new Date().toISOString(), state:JSON.parse(raw)},
        backupFileName);
      if (!confirm('A cópia de segurança foi solicitada para download.\n\n' +
        'CONFIRA se o arquivo foi salvo antes de continuar.\n\n' +
        'Aplicar somente os acessos e marcadores de exclusão neste PC?')) return;
      if (!isAdminSession()) return;
      if (localStorage.getItem(KEY) !== raw) {
        alert('Os dados mudaram durante a confirmação. Nada foi aplicado. Recomece a comparação.');
        return;
      }
      if (typeof syncInProgress !== 'undefined' && syncInProgress) {
        alert('Sincronização iniciada durante a confirmação. Nenhum dado alterado.');
        return;
      }
      const before = state;
      const updated = {...before, accesses:plan.accesses, deletedAccessIds:plan.deletedAccessIds};
      localStorage.setItem(KEY,JSON.stringify(updated));
      state = updated;
      try { renderAll?.(); } catch (renderError) { console.warn('Recarregamento da tela:',renderError); }
      if (typeof showCloudToast === 'function')
        showCloudToast('Acessos conciliados localmente. Nenhum envio à nuvem foi realizado.','ok',6000);
      alert('Conciliação concluída SOMENTE NESTE PC.\n' +
        plan.before + ' → ' + plan.after + ' acessos.\n' +
        'Nuvem e outros dispositivos não foram alterados.');
    } catch (error) {
      console.error('Conciliação local cancelada:', error);
      alert('Não foi possível conciliar: ' + (error?.message || 'erro desconhecido') + '\nNenhum envio à nuvem realizado.');
    }
  }
  async function restorePreReconcile(event) {
    const file=event.target.files?.[0];
    event.target.value='';
    if (!file || !isAdminSession()) return;
    if (typeof syncInProgress !== 'undefined' && syncInProgress) {
      alert('Sincronização em andamento. Não é seguro reverter agora.'); return;
    }
    try {
      const envelope=JSON.parse(await file.text());
      if (envelope?.format!=='pp-estado-integral-antes-conciliacao-v1' ||
          !envelope?.state || !Array.isArray(envelope.state.accesses) ||
          !Array.isArray(envelope.state.deletedAccessIds || [])) {
        throw new Error('Escolha o backup integral gerado ANTES da conciliação.');
      }
      const currentRaw=localStorage.getItem(KEY);
      if (!currentRaw) throw new Error('Dados atuais indisponíveis.');
      const current=JSON.parse(currentRaw);
      const count=envelope.state.accesses.length;
      if (!confirm('Restaurar apenas o histórico de acessos do arquivo escolhido?\\n\\n' +
        'Acessos no arquivo: '+count+'\\n' +
        'Acessos neste PC: '+(current.accesses||[]).length+'\\n\\n' +
        'Moradores, usuários, configurações e demais módulos NÃO serão substituídos.\\n' +
        'Alterações de acesso posteriores à conciliação serão desfeitas.')) return;
      if (!isAdminSession() || (typeof syncInProgress!=='undefined' && syncInProgress))
        throw new Error('Sessão alterada ou sincronização iniciada.');
      if (localStorage.getItem(KEY)!==currentRaw)
        throw new Error('Histórico alterado durante confirmação. Tente novamente.');
      const next={...current, accesses:envelope.state.accesses,
        deletedAccessIds:envelope.state.deletedAccessIds||[]};
      // A versão atual ainda ocupa o localStorage; uma gravação maior pode falhar
      // sem perda do estado anterior (Storage.setItem é atômico).
      localStorage.setItem(KEY,JSON.stringify(next));
      state=next;
      try { renderAll?.(); } catch(e) { console.warn(e); }
      alert('Histórico de acessos restaurado somente neste PC. Nenhum envio à nuvem.');
    } catch(e) {
      alert('Não foi possível desfazer: '+(e?.message||e));
    }
  }
  function ensureMobileImportButton() {
    const id='ppMobileImportHistoryBtn';
    const existing=document.getElementById(id);
    const mobile=!!document.body?.classList.contains('mobileExperience');
    if (!mobile || !isAdminSession()) { existing?.remove(); return; }
    const host=document.querySelector('header .statusGroup');
    if (!host) return;
    const button=existing || document.createElement('button');
    if (!existing) {
      button.type='button'; button.id=id; button.className='btn ghost';
      button.textContent='📥';
      button.setAttribute('aria-label','Recuperar histórico local da Portaria por arquivo');
      button.title='Recuperar histórico local (JSON), sem Supabase';
      button.style.cssText='position:static;flex:0 0 auto;min-width:36px;padding:7px;border-radius:10px;font-size:17px;line-height:1';
      button.addEventListener('click',() => {
        const input=document.getElementById(INPUT_ID);
        if(input)input.click();
        else alert('Importação ainda não disponível nesta tela.');
      });
    }
    if(button.parentElement!==host)host.appendChild(button);
  }
  function ensureButton() {
    const existing = document.getElementById(BUTTON_ID);
    if (!isAdminSession()) { existing?.remove(); ensureMobileImportButton(); return; }
    const host = document.querySelector('.recoveryActionsTop');
    if (!host) return;
    const button = existing || document.createElement('button');
    if (!existing) {
      button.id = BUTTON_ID; button.type = 'button'; button.className = 'btn ghost adminOnly';
      button.textContent = 'Conciliar acessos da Portaria';
      button.title = 'Comparar e incorporar somente os acessos do arquivo local da Portaria';
      button.onclick = () => document.getElementById(INPUT_ID)?.click();
    }
    if (!button.parentElement) host.appendChild(button);
    if (!document.getElementById('ppRevertReconcileBtn')) {
      const undo = document.createElement('button');
      undo.id='ppRevertReconcileBtn'; undo.type='button'; undo.className='btn ghost adminOnly';
      undo.textContent='Desfazer conciliação'; undo.onclick=() => document.getElementById('ppRevertReconcileFile')?.click();
      undo.title='Escolher o arquivo de backup anterior para restaurar somente acessos';
      host.appendChild(undo);
    }
    if (!document.getElementById('ppRevertReconcileFile')) {
      const undoFile=document.createElement('input');
      undoFile.id='ppRevertReconcileFile'; undoFile.type='file';
      undoFile.accept='.json,application/json'; undoFile.style.display='none';
      undoFile.addEventListener('change',restorePreReconcile);
      host.appendChild(undoFile);
    }
    if (!document.getElementById(INPUT_ID)) {
      const input = document.createElement('input');
      input.id = INPUT_ID; input.type='file'; input.accept='.json,application/json';
      input.style.display='none'; input.addEventListener('change',receiveFile);
      host.appendChild(input);
    }
    ensureMobileImportButton();
  }
  document.addEventListener('DOMContentLoaded',ensureButton);
  setInterval(ensureButton,3000);
  ensureButton();
})();