/* Sync Supabase profiles into local users so admin Users list shows all registered accounts */
(function(){
  function mergeProfiles(rows){
    if(!Array.isArray(rows)) return;
    var local=[];
    try{ local=JSON.parse(localStorage.getItem('hopeforus_users')||'[]'); }catch(e){ local=[]; }
    if(!Array.isArray(local)) local=[];
    var by={};
    local.forEach(function(u){ if(u&&u.email) by[String(u.email).toLowerCase()]=u; });
    rows.forEach(function(p){
      if(!p||!p.email) return;
      var em=String(p.email).toLowerCase();
      var cur=by[em]||{};
      by[em]={
        id:cur.id||p.id||('p_'+em.replace(/[^a-z0-9]/g,'_')),
        email:em,
        name:p.name||cur.name||em.split('@')[0],
        pass:cur.pass||'',
        whatsapp:p.whatsapp||cur.whatsapp||'',
        avatar:p.avatar||p.avatar_url||cur.avatar||'',
        verified:true,
        isAdmin:!!(p.isAdmin||p.is_admin||cur.isAdmin),
        created:cur.created||p.created||Date.now(),
        donors:cur.donors||[], chats:cur.chats||[], clicks:cur.clicks||0
      };
    });
    localStorage.setItem('hopeforus_users', JSON.stringify(Object.keys(by).map(function(k){return by[k];})));
  }
  function sync(){
    if(!(window.HFDB&&HFDB.listProfiles)) return;
    HFDB.listProfiles().then(function(rows){
      mergeProfiles(rows);
    }).catch(function(){});
  }
  var tries=0;
  function boot(){
    tries++;
    if(window.HFDB&&HFDB.listProfiles){
      sync();
      setInterval(sync, 30000);
      return;
    }
    if(tries<40) setTimeout(boot, 250);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
