/* HopeForUs UI — nav + signed-in header */
(function(){
  var st=document.createElement("style");
  st.textContent=".si svg{display:block}.hdr{display:flex!important;justify-content:center}.hdr-inner{width:100%;max-width:980px;margin:0 auto;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px}.nlink{padding:8px 10px!important;white-space:nowrap}.btn-p{padding:9px 14px!important;white-space:nowrap}";
  document.head.appendChild(st);
  var hdr=document.querySelector(".hdr");
  if(hdr && !hdr.querySelector(".hdr-inner")){
    var wrap=document.createElement("div");wrap.className="hdr-inner";
    while(hdr.firstChild)wrap.appendChild(hdr.firstChild);
    hdr.appendChild(wrap);
  }
  var user=null;try{user=JSON.parse(localStorage.getItem("hopeforus_user")||"null")}catch(e){}
  if(user&&user.email){
    var name=(user.name||user.email.split("@")[0]||"You").trim().split(" ")[0];
    var right=document.querySelector(".hdr-r");
    if(right){
      right.innerHTML='<a href="dashboard.html" class="nlink" style="display:inline-flex">My desk</a><a href="create-campaign.html" class="btn-p" style="display:inline-flex">New fundraiser</a><a href="dashboard.html" class="nlink" style="display:inline-flex;align-items:center;gap:6px;background:#f3f4f6;border-radius:999px;padding:4px 10px 4px 12px">'+name+'<span style="width:26px;height:26px;border-radius:50%;background:#7C3AED;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800">'+name.charAt(0).toUpperCase()+'</span></a>';
    }
  }
})();
