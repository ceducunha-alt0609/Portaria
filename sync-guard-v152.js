/* Portaria Primavera v152.3 — Sync Guard */
(()=>{
  if(window.__ppSyncGuardV152Loaded)return;
  window.__ppSyncGuardV152Loaded=true;
  const originalPush=cloudSyncPush;
  async function guardedPull(silent=false){
    if(!cloudReady||!supabaseClient)return false;
    if(syncInProgress){syncPendingPull=true;return false}
    try{
      syncInProgress=true;syncPendingPull=false;updateSyncButtonStatus?.('syncing');
      const {data,error}=await supabaseClient.from('snapshots').select('id,descricao,dados,criado_em').eq('dados->>reason','sync').order('criado_em',{ascending:false}).limit(100);
      if(error)throw error;
      const rows=Array.isArray(data)?data:[];if(!rows.length)return false;
      const before=JSON.stringify({a:(state.accesses||[]).length,u:Object.keys(state.units||{}).length,l:(state.logs||[]).length,c:(state.comunicados||[]).length});
      let applied=false;
      const adminSnap=rows.find(r=>String(r?.dados?.syncMeta?.role||'').toLowerCase()==='admin')||null;
      if(adminSnap){
        const adminState=adminSnap.dados?.state||adminSnap.dados||{};
        state=mergeAdminAuthority(state,adminState);
        lastAdminSnapshotId=String(adminSnap.id||'');
        if(lastAdminSnapshotId)localStorage.setItem('pp_last_admin_snapshot_id',lastAdminSnapshotId);
        applied=true;
      }
      for(const snap of [...rows].reverse()){
        const payload=snap?.dados||{},remoteState=payload.state||payload,remoteMeta=payload.syncMeta||{};
        if(!remoteState||typeof remoteState!=='object')continue;
        state=mergeStatesForSync(state,remoteState,remoteMeta);applied=true;
      }
      if(!applied)return false;

      // A conciliação usa snapshots antigos para recuperar saídas perdidas, mas o localStorage
      // continua respeitando a janela operacional de 90 dias. O histórico antigo segue arquivado no Supabase.
      const cutoff=Date.now()-90*86400000;
      state.accesses=(state.accesses||[]).filter(a=>{
        if(!a?.saida)return true;
        const ts=new Date(a.saida||a.updatedAt||a.createdAt||a.entrada||0).getTime();
        return !Number.isFinite(ts)||ts>=cutoff;
      });

      normalizeImportedVehicles?.();normalizeAccesses?.();ensureSettings?.();ensureOperational?.();
      state.users=repairLocalUserPasswords(Array.isArray(state.users)&&state.users.length?state.users:defaultUsers());state.users.forEach(u=>{if(u.ativo===undefined)u.ativo=true});
      localStorage.setItem(KEY,JSON.stringify(state));
      lastSyncSnapshotId=String(rows[0]?.id||'');if(lastSyncSnapshotId)localStorage.setItem('pp_last_sync_snapshot_id',lastSyncSnapshotId);
      lastSyncAt=new Date().toISOString();localStorage.setItem('pp_last_sync_at',lastSyncAt);
      applyTheme?.();applyPermissions?.();renderAll?.();
      const after=JSON.stringify({a:(state.accesses||[]).length,u:Object.keys(state.units||{}).length,l:(state.logs||[]).length,c:(state.comunicados||[]).length});
      if(before!==after&&!silent)showCloudToast?.('Dados conciliados com a nuvem.','ok',3500);
      setCloudStatus?.((syncRealtimeReady?'☁️ Sync em tempo real ativo. Conciliado às ':'☁️ Sync ativo. Conciliado às ')+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}));
      return true;
    }catch(e){console.warn('Falha no Sync Guard v152.3',e);if(!silent)setCloudStatus?.('☁️ Não foi possível conciliar a nuvem agora.');return false}
    finally{syncInProgress=false;refreshSyncCenterStatus?.()}
  }
  cloudSyncPullLatest=guardedPull;
  window.cloudSyncPullLatest=guardedPull;
  cloudSyncPush=async function(reason='alteracao'){await guardedPull(true);return originalPush(reason)};
  window.cloudSyncPush=cloudSyncPush;
  setTimeout(()=>guardedPull(true),1200);
  window.PortariaSyncGuardV152={version:'152.3',pull:guardedPull};
})();
