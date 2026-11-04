/* Admin Reports tab + pull reports from server (loads after dash.js) */
(function(){
  if(typeof render!=='function' || !window.HF) return;

  var _render = render;
  render = function(){
    var box=document.getElementById('main');
    if(!box) return _render();
    var tabName = (typeof tab!=='undefined') ? tab : '';
    if(tabName==='reports' && HF.isAdmin && HF.isAdmin()){
      var u=HF.session(); if(!u){ location.href='/login/'; return; }
      function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
      function matchSearch(q, parts){
        q=String(q||'').toLowerCase().trim(); if(!q) return true;
        return (parts||[]).some(function(p){ return String(p||'').toLowerCase().indexOf(q)>=0; });
      }
      var reps=(HF.listReports&&HF.listReports())||[];
      if(typeof searchQ!=='undefined' && searchQ) reps=reps.filter(function(r){return matchSearch(searchQ,[r.id,r.campaignTitle,r.campaignId,r.reason,r.name,r.details]);});
      var openReps=reps.filter(function(r){return !r.status||r.status==='open';});
      var html='<div class="pane"><h1>Reports</h1><p class="sub">'+openReps.length+' open \u00b7 '+reps.length+' total</p>';
      if(!reps.length) html+='<p class="note">No reports yet. People submit them from a campaign\u2019s Report page \u2014 they also email the admin inbox.</p>';
      reps.forEach(function(r){
        var when=r.at?new Date(r.at).toLocaleString():'';
        var ticket=String(r.id||'').toUpperCase();
        html+='<div class="card" style="padding:14px;margin-bottom:10px">';
        html+='<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">';
        html+='<div style="flex:1">';
        html+='<strong style="font-family:ui-monospace,monospace;letter-spacing:.03em">'+esc(ticket)+'</strong>';
        html+='<div class="note" style="margin-top:4px">'+esc(r.campaignTitle||r.campaignId||'Campaign')+(r.campaignCode?(' \u00b7 '+esc(String(r.campaignCode).toUpperCase())):'')+'</div>';
        html+='<div class="note">'+esc(r.reason||'\u2014')+' \u00b7 '+esc(r.status||'open')+' \u00b7 '+esc(when)+'</div>';
        html+='<div class="note" style="margin-top:6px">'+esc((r.details||'').slice(0,280))+(String(r.details||'').length>280?'\u2026':'')+'</div>';
        if(r.name) html+='<div class="note" style="margin-top:6px">Reporter: '+esc(r.name)+'</div>';
        if(r.links) html+='<div class="note" style="margin-top:4px;word-break:break-all">Links: '+esc(r.links)+'</div>';
        html+='</div>';
        if(!r.status||r.status==='open'){
          html+='<div style="display:flex;flex-direction:column;gap:6px">';
          html+='<button type="button" class="mini-btn go" data-resolve="'+esc(r.id)+'">Resolve</button>';
          html+='<button type="button" class="mini-btn bad" data-dismiss="'+esc(r.id)+'">Dismiss</button>';
          html+='</div>';
        }
        html+='</div></div>';
      });
      html+='</div>';
      box.innerHTML=html;
      box.querySelectorAll('[data-resolve]').forEach(function(b){b.onclick=function(){ if(HF.resolveReport) HF.resolveReport(b.getAttribute('data-resolve'),'resolved'); render(); };});
      box.querySelectorAll('[data-dismiss]').forEach(function(b){b.onclick=function(){ if(HF.resolveReport) HF.resolveReport(b.getAttribute('data-dismiss'),'dismissed'); render(); };});
      return;
    }
    return _render();
  };

  function showReportsNav(){
    if(HF.isAdmin&&HF.isAdmin()){
      var rn=document.getElementById('reportsNav'); if(rn) rn.classList.remove('hide');
      var rm=document.getElementById('reportsMenu'); if(rm) rm.classList.remove('hide');
    }
  }
  showReportsNav();
  setTimeout(showReportsNav, 500);

  if(typeof pullServer==='function'){
    var _pull=pullServer;
    pullServer=function(){
      var p=_pull();
      if(window.HFDB&&HFDB.listReports){
        var extra=HFDB.listReports().then(function(rows){
          if(!Array.isArray(rows)) return;
          var local=[]; try{local=JSON.parse(localStorage.getItem('hopeforus_reports')||'[]')||[]}catch(e){local=[]}
          if(!Array.isArray(local)) local=[];
          var by={}; local.forEach(function(r){ if(r&&r.id) by[r.id]=r; });
          rows.forEach(function(r){ if(r&&r.id) by[r.id]=Object.assign({}, by[r.id]||{}, r); });
          localStorage.setItem('hopeforus_reports', JSON.stringify(Object.keys(by).map(function(k){return by[k];})));
        }).catch(function(){});
        return Promise.all([p, extra]);
      }
      return p;
    };
  }
})();
