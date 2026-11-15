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
      // Guarda a cópia EXATA no navegador; nenhuma alteração aplicada antes disso.
      const recoveryKey = 'pp_pre_reconcile_full_20261115';
      localStorage.setItem(recoveryKey, raw);
      if (localStorage.getItem(recoveryKey) !== raw) throw new Error('Falha ao conferir cópia local.');
      // Arquivo bruto de recuperação: pode conter dados privados. Manter em local seguro.
      downloadJson({format:'pp-estado-integral-antes-conciliacao-v1',
        generatedAt:new Date().toISOString(), state:JSON.parse(raw)},
        'portaria-backup-integral-antes-conciliacao-' + new Date().toISOString().slice(0,10) + '.json');
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
  function restorePreReconcile() {
    if (!isAdminSession()) return;
    if (typeof syncInProgress !== 'undefined' && syncInProgress) {
      alert('Sincronização em andamento. Não é seguro reverter agora.'); return;
    }
    const raw = localStorage.getItem('pp_pre_reconcile_full_20261115');
    if (!raw) { alert('Nenhum ponto de retorno local foi encontrado neste navegador.'); return; }
    if (!confirm('Reverter a conciliação neste PC?\\n\\nIsso restaura o estado EXATO preservado antes da conciliação, inclusive módulos administrativos.\\n\\nAlterações feitas depois dela serão desfeitas.')) return;
    const current = localStorage.getItem(KEY);
    if (!current) { alert('Estado atual indisponível. Nenhum dado alterado.'); return; }
    try {
      const original = JSON.parse(raw);
      if (!original || !Array.isArray(original.accesses)) throw new Error('Ponto de retorno inválido');
      localStorage.setItem(KEY,raw);
      state = original;
      try { renderAll?.(); } catch(e) { console.warn(e); }
      alert('Ponto de retorno aplicado somente neste PC. Nenhuma informação enviada à nuvem.');
    } catch(e) { alert('Não foi possível reverter: '+e.message); }
  }
  function ensureButton() {
    const existing = document.getElementById(BUTTON_ID);
    if (!isAdminSession()) { existing?.remove(); return; }
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
      undo.textContent='Desfazer conciliação'; undo.onclick=restorePreReconcile;
      undo.title='Reverter ao ponto de retorno local anterior à última conciliação';
      host.appendChild(undo);
    }
    if (!document.getElementById(INPUT_ID)) {
      const input = document.createElement('input');
      input.id = INPUT_ID; input.type='file'; input.accept='.json,application/json';
      input.style.display='none'; input.addEventListener('change',receiveFile);
      host.appendChild(input);
    }
  }
  document.addEventListener('DOMContentLoaded',ensureButton);
  setInterval(ensureButton,3000);
  ensureButton();
})();