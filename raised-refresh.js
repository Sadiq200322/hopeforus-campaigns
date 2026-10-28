/* Refresh raised from Supabase — keep the higher of local and remote so gifts never get wiped to 0 */
(function(){
  if(!window.HFDB) return;
  var params = new URLSearchParams(location.search);
  var id = (params.get('id') || '').trim();
  if(!id) return;
  setTimeout(function(){
    HFDB.one(id).then(function(remote){
      if(!remote) return;
      var list = [];
      try { list = JSON.parse(localStorage.getItem('hopeforus_campaigns') || '[]'); } catch(e){}
      if(!Array.isArray(list)) list = [];
      var local = list.find(function(c){ return c && (c.id === id || String(c.code||'').toUpperCase() === id.toUpperCase()); });
      var rr = Number(remote.raised) || 0;
      var lr = local ? (Number(local.raised) || 0) : 0;
      var rd = Number(remote.donations) || 0;
      var ld = local ? (Number(local.donations) || 0) : 0;
      if(rr > lr && local){
        local.raised = rr;
        local.donations = Math.max(ld, rd);
        try { localStorage.setItem('hopeforus_campaigns', JSON.stringify(list)); } catch(e){}
        location.reload();
      }
      // If local is higher, leave it alone (do not overwrite with 0 or lower)
    }).catch(function(){});
  }, 800);
})();
