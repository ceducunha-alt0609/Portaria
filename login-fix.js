(()=>{
  'use strict';

  const DEFAULTS=[
    {id:'u-admin',login:'admin',senha:'admin123'},
    {id:'u-portaria-dia',login:'portaria',senha:'1234'},
    {id:'u-portaria-noite',login:'portaria-noite',senha:'1234'},
    {id:'u-zelador',login:'zelador',senha:'1234'}
  ];

  function findDefault(u){
    return DEFAULTS.find(d=>(u&&u.id&&d.id===u.id)||(u&&u.login&&d.login===u.login));
  }

  function repairMissingPasswords(){
    try{
      if(typeof state==='undefined'||!state||!Array.isArray(state.users)) return false;
      let changed=false;
      state.users=state.users.map(u=>{
        if(String(u?.senha??'').length) return u;
        const d=findDefault(u);
        if(!d) return u;
        changed=true;
        return {...u,senha:d.senha};
      });
      if(changed && typeof KEY!=='undefined'){
        try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
      }
      return changed;
    }catch(e){
      console.warn('Falha ao reparar credenciais locais',e);
      return false;
    }
  }

  repairMissingPasswords();

  try{
    if(typeof mergeStatesForSync==='function'){
      const originalMerge=mergeStatesForSync;
      mergeStatesForSync=function(localState,remoteState,remoteMeta={}){
        const localUsers=Array.isArray(localState?.users)?localState.users:[];
        const merged=originalMerge(localState,remoteState,remoteMeta);
        if(merged&&Array.isArray(merged.users)){
          merged.users=merged.users.map(r=>{
            const l=localUsers.find(x=>(r?.id&&x.id===r.id)||(r?.login&&x.login===r.login));
            if(String(l?.senha??'').length) return {...r,senha:l.senha};
            if(String(r?.senha??'').length) return r;
            const d=findDefault(r);
            return d?{...r,senha:d.senha}:r;
          });
        }
        return merged;
      };
    }
  }catch(e){
    console.warn('Falha ao proteger credenciais durante sync',e);
  }

  try{
    if(typeof loginUser==='function'){
      const originalLogin=loginUser;
      loginUser=function(){
        repairMissingPasswords();
        return originalLogin();
      };
    }
  }catch(e){
    console.warn('Falha ao proteger login',e);
  }
})();
