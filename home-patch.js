(function(){
  document.querySelectorAll(".social-icons").forEach(function(box){
    box.innerHTML=
      '<span class="si" title="Facebook" aria-label="Facebook"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.8-4.7 4.54-4.7 1.32 0 2.7.24 2.7.24v2.97h-1.52c-1.5 0-1.97.93-1.97 1.89v2.26h3.35l-.54 3.49h-2.81V24C19.61 23.1 24 18.1 24 12.07z"/></svg></span>'+
      '<span class="si" title="Instagram" aria-label="Instagram"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="#E4405F" d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.69 21.31.27 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-11.85a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/></svg></span>'+
      '<span class="si" title="YouTube" aria-label="YouTube"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="#FF0000" d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 00.5 6.2 31.5 31.5 0 000 12a31.5 31.5 0 00.5 5.8 3 3 0 002.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 002.1-2.1A31.5 31.5 0 0024 12a31.5 31.5 0 00-.5-5.8zM9.6 15.5V8.5L15.8 12l-6.2 3.5z"/></svg></span>'+
      '<span class="si" title="TikTok" aria-label="TikTok"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="#111" d="M19.6 6.2a4.8 4.8 0 01-2.8-2.7h-2.5v12.7a2.7 2.7 0 11-1.9-2.6V11a5.3 5.3 0 104.4 5.2V9.4a7.4 7.4 0 004.3 1.4V8.2a4.8 4.8 0 01-1.5-.2z"/></svg></span>'+
      '<span class="si" title="Google" aria-label="Google"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg></span>';
  });
  var st=document.createElement("style");
  st.textContent=".si{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.08)}.hdr{display:flex!important;justify-content:center}.hdr-inner{width:100%;max-width:980px;margin:0 auto;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px}.nlink{padding:8px 10px!important;white-space:nowrap}.btn-p{padding:9px 14px!important;white-space:nowrap}";
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
