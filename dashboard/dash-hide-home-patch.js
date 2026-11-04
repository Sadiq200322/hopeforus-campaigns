/* Admin: hide/show campaign on main Discover page */
(function(){
  if(typeof render!=='function' || !window.HF) return;
  var _render=render;
  render=function(){
    _render();
    if(!(HF.isAdmin&&HF.isAdmin())) return;
    if(typeof tab==='undefined' || tab!=='home') return;
    var box=document.getElementById('main');
    if(!box) return;
    box.querySelectorAll('article.camp').forEach(function(art){
      var viewBtn=art.querySelector('[data-view],[data-open]');
      var id=(viewBtn&&(viewBtn.getAttribute('data-view')||viewBtn.getAttribute('data-open')))||'';
      if(!id) return;
      var acts=art.querySelector('.acts');
      if(!acts) return;
      if(acts.querySelector('[data-hidehome]')) return;
      var hidden=(window.HFHideHome&&HFHideHome.isHidden(id))||false;
      var btn=document.createElement('button');
      btn.type='button';
      btn.setAttribute('data-hidehome', id);
      btn.textContent=hidden?'Show on site':'Hide from site';
      if(hidden) btn.style.cssText='background:#02a95c;color:#fff;border-color:#02a95c';
      btn.onclick=function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        var nowHidden=(window.HFHideHome&&HFHideHome.isHidden(id));
        if(nowHidden){ if(HF.showOnHome) HF.showOnHome(id); else if(HFHideHome) HFHideHome.show(id); }
        else { if(HF.hideFromHome) HF.hideFromHome(id); else if(HFHideHome) HFHideHome.hide(id); }
        render();
      };
      acts.appendChild(btn);
      acts.style.gridTemplateColumns='1fr 1fr 1fr';
    });
  };
})();
