/* Refresh raised from Supabase so admin-set amounts always show */
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
      var local = list.find(function(c){ return c && (c.id === id || c.code === id); });
      if(local && Number(remote.raised) > Number(local.raised || 0)){
        local.raised = remote.raised;
        local.donations = remote.donations || local.donations;
        try { localStorage.setItem('hopeforus_campaigns', JSON.stringify(list)); } catch(e){}
        location.reload();
      }
    }).catch(function(){});
  }, 800);
})();
