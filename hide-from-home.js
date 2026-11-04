/* Hide campaigns from main Discover page; direct links still work */
(function(w){
  var KEY='hopeforus_hidden_home';
  function load(){ try{ var a=JSON.parse(localStorage.getItem(KEY)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
  function save(ids){ try{ localStorage.setItem(KEY, JSON.stringify(ids||[])); }catch(e){} }
  function isHidden(id){
    id=String(id||'');
    if(!id) return false;
    if(load().indexOf(id)>=0) return true;
    try{
      var list=JSON.parse(localStorage.getItem('hopeforus_campaigns')||'[]')||[];
      for(var i=0;i<list.length;i++){
        if(list[i]&&list[i].id===id&&list[i].hiddenFromHome) return true;
      }
    }catch(e){}
    return false;
  }
  function hide(id){
    id=String(id||''); if(!id) return false;
    var a=load(); if(a.indexOf(id)<0){ a.push(id); save(a); }
    markCampaign(id, true);
    pushServer(a);
    applyNow();
    return true;
  }
  function show(id){
    id=String(id||''); if(!id) return false;
    save(load().filter(function(x){ return x!==id; }));
    markCampaign(id, false);
    pushServer(load());
    applyNow();
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
    if(!w.HFDB||!HFDB.url) return;
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
  function pullServer(){
    if(!w.HFDB||!HFDB.url) return Promise.resolve(load());
    var URL=HFDB.url;
    var KEY2='sb_publishable_hSBxsefa3AzA7sLngR07Vw_ruW60q_h';
    return fetch(URL+'/storage/v1/object/public/campaign-media/meta/hidden-home.json?t='+Date.now(),{cache:'no-store'})
      .then(function(r){ return r.ok?r.json():null; })
      .then(function(data){
        if(Array.isArray(data)){
          var local=load(), by={};
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
      if(!x||!x.c||!x.c.id) return false;
      if(x.c.hiddenFromHome) return false;
      if(isHidden(x.c.id)) return false;
      return true;
    });
  }
  function removeFromDOM(){
    var hidden=load();
    var roots=[document.getElementById('feat'), document.getElementById('grid'), document.querySelector('.discover-grid')];
    roots.forEach(function(root){
      if(!root) return;
      root.querySelectorAll('a.campaign-card, .campaign-card').forEach(function(card){
        var href=card.getAttribute('href')||'';
        var text=(card.textContent||'').toLowerCase();
        var drop=false;
        hidden.forEach(function(id){
          if(href.indexOf(encodeURIComponent(id))>=0 || href.indexOf(id)>=0) drop=true;
        });
        if(!drop){
          try{
            var list=JSON.parse(localStorage.getItem('hopeforus_campaigns')||'[]')||[];
            list.forEach(function(c){
              if(!c||!(c.hiddenFromHome||isHidden(c.id))) return;
              var t=(c.title||'').toLowerCase();
              if(t && text.indexOf(t)>=0) drop=true;
            });
          }catch(e){}
        }
        if(drop) card.style.display='none';
      });
    });
  }
  function applyNow(){
    filterALL();
    if(typeof w.renderCampaigns==='function'){
      try{ w.renderCampaigns(); }catch(e){}
    }
    setTimeout(removeFromDOM, 50);
    setTimeout(removeFromDOM, 400);
  }
  function wrapRender(){
    if(typeof w.renderCampaigns!=='function') return;
    if(w.renderCampaigns.__hideWrapped) return;
    var orig=w.renderCampaigns;
    w.renderCampaigns=function(){
      filterALL();
      var r=orig.apply(this, arguments);
      setTimeout(removeFromDOM, 0);
      return r;
    };
    w.renderCampaigns.__hideWrapped=true;
  }
  wrapRender();
  var n=0;
  var iv=setInterval(function(){
    wrapRender();
    filterALL();
    removeFromDOM();
    n++;
    if(n>25) clearInterval(iv);
  }, 400);
  w.addEventListener('storage', function(e){
    if(e.key===KEY || e.key==='hopeforus_campaigns') applyNow();
  });
  pullServer().then(function(){ applyNow(); });
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', applyNow);
  else applyNow();
  w.HFHideHome={ isHidden:isHidden, hide:hide, show:show, list:load, pull:pullServer, apply:applyNow };
  if(w.HF){
    w.HF.isHiddenFromHome=isHidden;
    w.HF.hideFromHome=hide;
    w.HF.showOnHome=show;
  }
})(window);
