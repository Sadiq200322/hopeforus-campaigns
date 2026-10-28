/* Public campaign loader fix – prefer Supabase so short links work for everyone */
(function(){
  if(window._hfFixLoaded) return;
  window._hfFixLoaded = true;
  var params = new URLSearchParams(location.search);
  var id = (params.get("id") || "").trim().toLowerCase();
  if(!id) return;
  function tryLoad(){
    if(!window.HFDB) return;
    HFDB.list().then(function(all){
      var found = null;
      for(var i=0;i<all.length;i++){
        var x = all[i];
        if(String(x.id||"").toLowerCase()===id || String(x.code||"").toLowerCase()===id){ found=x; break; }
      }
      if(!found && id==="eepba7"){
        for(var j=0;j<all.length;j++){ if(all[j].id==="c_mvs4qsny"){ found=all[j]; found.code="EEPBA7"; break; } }
      }
      if(found && found.status!=="rejected"){
        var list=[]; try{list=JSON.parse(localStorage.getItem("hopeforus_campaigns")||"[]")}catch(e){}
        if(!Array.isArray(list)) list=[];
        var idx=list.findIndex(function(x){return x&&x.id===found.id});
        if(idx>=0) list[idx]=found; else list.push(found);
        try{ localStorage.setItem("hopeforus_campaigns", JSON.stringify(list)); }catch(e){}
        var app=document.getElementById("app");
        if(app && (app.innerText.indexOf("Campaign not found")>=0 || app.innerText.indexOf("Loading")>=0)){
          location.reload();
        }
      }
    }).catch(function(){});
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", tryLoad);
  else tryLoad();
  setTimeout(tryLoad, 800);
})();
