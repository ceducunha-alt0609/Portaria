/* Portaria Primavera — Exportação de segurança local, versão de auditoria 2026-11-15.
 * Somente leitura: não grava localStorage, não consulta rede, não altera o estado.
 * Destinado a preservar acessos e exclusões locais antes de conciliação.
 */
(() => {
  'use strict';
  if (window.__ppLocalAccessExportLoaded) return;
  window.__ppLocalAccessExportLoaded = true;
  const BUTTON_ID = 'ppLocalAccessExportBtn';

  function isPortariaSession() {
    try {
      const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
      const op = typeof currentOperator === 'function' ? currentOperator() : null;
      return !!user && String(op?.perfil || '').toLowerCase() === 'portaria';
    } catch (_) { return false; }
  }

  function getLocalAccessState() {
    if (typeof KEY !== 'string' || !KEY) throw new Error('Chave dos registros indisponível');
    const raw = localStorage.getItem(KEY);
    if (!raw) throw new Error('Nenhum estado local encontrado neste navegador');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.accesses)) throw new Error('Histórico local ausente ou inválido');
    return {
      accesses: parsed.accesses,
      deletedAccessIds: Array.isArray(parsed.deletedAccessIds) ? parsed.deletedAccessIds : []
    };
  }

  function exportLocalAccessHistory() {
    if (!isPortariaSession()) return;
    try {
      const records = getLocalAccessState();
      const ok = window.confirm(
        'Exportar cópia LOCAL do histórico de acessos deste dispositivo?\n\n' +
        records.accesses.length + ' acessos e ' + records.deletedAccessIds.length + ' marcadores de exclusão.\n\n' +
        'O arquivo pode conter dados pessoais de visitantes. Guarde em local seguro e entregue somente ao administrador. ' +
        'Nenhuma informação será enviada à nuvem.'
      );
      if (!ok) return;
      // Revalidar o perfil caso a sessão tenha mudado durante a confirmação.
      if (!isPortariaSession()) return;
      const payload = {
        format: 'portaria-primavera-historico-local-v1',
        exportedAt: new Date().toISOString(),
        source: 'localStorage',
        deviceId: (typeof localDeviceId === 'string' ? localDeviceId : null),
        recordCount: records.accesses.length,
        deletedCount: records.deletedAccessIds.length,
        accesses: records.accesses,
        deletedAccessIds: records.deletedAccessIds
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.href = url;
      link.download = 'portaria-historico-local-' + stamp + '.json';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      if (typeof showCloudToast === 'function') showCloudToast('Cópia local gerada. Guarde o arquivo com segurança.', 'ok', 5000);
    } catch (error) {
      console.warn('Exportação local indisponível:', error);
      window.alert('Não foi possível gerar a cópia local. Nenhum dado foi alterado.\n' + error.message);
    }
  }

  function ensureExportButton() {
    const existing = document.getElementById(BUTTON_ID);
    if (!isPortariaSession()) { if (existing) existing.remove(); return; }
    const syncBtn = document.getElementById('portariaSyncNowBtn');
    const host = syncBtn?.parentElement || document.querySelector('.statusGroup');
    if (!host) return;
    const button = existing || document.createElement('button');
    if (!existing) {
      button.id = BUTTON_ID;
      button.type = 'button';
      button.className = 'btn ghost';
      button.textContent = '⬇️';
      button.title = 'Exportar somente o histórico local de acessos (arquivo JSON)';
      button.setAttribute('aria-label', 'Exportar histórico local de acessos');
      button.addEventListener('click', exportLocalAccessHistory);
      button.style.cssText = 'position:static;flex:0 0 auto;padding:6px 9px;font-size:17px;line-height:1;width:auto;min-height:0;border-radius:10px';
    }
    if (button.parentElement !== host) host.appendChild(button);
  }

  document.addEventListener('DOMContentLoaded', ensureExportButton);
  window.addEventListener('load', ensureExportButton);
  // Apenas verifica a presença de um botão DOM; não executa qualquer consulta ou sincronização.
  setInterval(ensureExportButton, 3000);
  ensureExportButton();
})();