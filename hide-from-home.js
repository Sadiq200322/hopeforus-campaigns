/* Hide campaigns from main Discover page; direct links still work */
(function(w){
  var KEY='hopeforus_hidden_home';
  function load(){ try{ var a=JSON.parse(localStorage.getItem(KEY)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
  function save(ids){ try{ localStorage.setItem(KEY, JSON.stringify(ids||[])); }catch(e){} }
  function isHidden(id){ id=String(id||''); return load().indexOf(id)>=0; }
  function hide(id){
    id=String(id||''); if(!id) return false;
    var a=load(); if(a.indexOf(id)<0){ a.push(id); save(a); }
    markCampaign(id, true);
    pushServer(a);
    return true;
  }
  function show(id){
    id=String(id||''); if(!id) return false;
    save(load().filter(function(x){ return x!==id; }));
    markCampaign(id, false);
    pushServer(load());
    return true;
  }
  function markCampaign(id, hidden){
    try{
      var list=JSON.parse(localStorage.getItem('hopeforus_campaigns')||'[]')||[];
      if(!Array.isArray(list)) return;
      var changed=false;
      list.forEach(function(c){
        if(c&&c.id===id){ c.hiddenFromHome=!!hidden; changed=true; }
      });
      if(changed) localStorage.setItem('hopeforus_campaigns', JSON.stringify(list));
    }catch(e){}
  }
  function pushServer(ids){
    if(w.HFDB&&HFDB.url){
      try{
        var URL=HFDB.url;
        var KEY2='sb_publishable_hSBxsefa3AzA7sLngR07Vw_ruW60q_h';
        fetch(URL+'/storage/v1/object/campaign-media/meta/hidden-home.json',{
          method:'POST',
          headers:{'apikey':KEY2,'Authorization':'Bearer '+KEY2,'Content-Type':'application/json','x-upsert':'true'},
          body:JSON.stringify(ids||[])
        }).catch(function(){});
      }catch(e){}
    }
  }
  function pullServer(){
    if(!w.HFDB||!HFDB.url) return Promise.resolve(load());
    var URL=HFDB.url;
    var KEY2='sb_publishable_hSBxsefa3AzA7sLngR07Vw_ruW60q_h';
    return fetch(URL+'/storage/v1/object/public/campaign-media/meta/hidden-home.json?t='+Date.now(),{cache:'no-store'})
      .then(function(r){ return r.ok?r.json():null; })
      .then(function(data){
        if(Array.isArray(data)){
          var local=load();
          var by={};
          local.forEach(function(id){ by[id]=1; });
          data.forEach(function(id){ if(id) by[id]=1; });
          var merged=Object.keys(by);
          save(merged);
          return merged;
        }
        return load();
      }).catch(function(){ return load(); });
  }
  function filterALL(){
    if(!Array.isArray(w.ALL)) return;
    w.ALL=w.ALL.filter(function(x){
      if(!x||!x.c) return false;
      if(x.c.hiddenFromHome) return false;
      if(isHidden(x.c.id)) return false;
      return true;
    });
  }
  var _render=w.renderCampaigns;
  if(typeof _render==='function'){
    w.renderCampaigns=function(){
      filterALL();
      return _render.apply(this, arguments);
    };
  }
  setTimeout(function(){
    if(typeof w.renderCampaigns==='function'){
      var r=w.renderCampaigns;
      w.renderCampaigns=function(){ filterALL(); return r.apply(this, arguments); };
    }
    filterALL();
    if(typeof w.renderCampaigns==='function') try{ w.renderCampaigns(); }catch(e){}
  }, 400);
  setTimeout(function(){ filterALL(); if(typeof w.renderCampaigns==='function') try{ w.renderCampaigns(); }catch(e){}; }, 1200);
  pullServer().then(function(){
    filterALL();
    if(typeof w.renderCampaigns==='function') try{ w.renderCampaigns(); }catch(e){}
  });
  w.HFHideHome={ isHidden:isHidden, hide:hide, show:show, list:load, pull:pullServer };
  if(w.HF){
    w.HF.isHiddenFromHome=isHidden;
    w.HF.hideFromHome=hide;
    w.HF.showOnHome=show;
  }
})(window);
