/* HopeForUs UI — nav + signed-in header */
(function(){
  var st=document.createElement("style");
  st.textContent=
    ".si svg{display:block}"+
    ".hdr{display:flex!important;justify-content:center}"+
    ".hdr-inner{width:100%;max-width:980px;margin:0 auto;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:6px;min-width:0}"+
    ".nlink{padding:8px 10px!important;white-space:nowrap}"+
    ".btn-p{padding:9px 14px!important;white-space:nowrap}"+
    ".hdr-r{min-width:0;flex-wrap:nowrap;overflow:hidden}"+
    "@media(max-width:959px){"+
    "  .hdr-r .nlink.desk-only,.hdr-r .btn-p.desk-only{display:none!important}"+
    "  .hdr-r .nlink.user-chip{display:none!important}"+
    "  .hdr .logo{font-size:1.05rem;max-width:42vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"+
    "}";
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
      right.innerHTML=
        '<a href="dashboard.html" class="nlink desk-only" style="display:inline-flex">My desk</a>'+
        '<a href="create-campaign.html" class="btn-p desk-only" style="display:inline-flex">New fundraiser</a>'+
        '<a href="dashboard.html" class="nlink user-chip" style="display:inline-flex;align-items:center;gap:6px;background:#f3f4f6;border-radius:999px;padding:4px 10px 4px 12px">'+name+
        '<span style="width:26px;height:26px;border-radius:50%;background:#7C3AED;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800">'+name.charAt(0).toUpperCase()+'</span></a>';
    }
    // Ensure mobile menu includes dashboard links
    var pn=document.querySelector(".pn");
    if(pn && !pn.querySelector("[data-desk]")){
      var desk=document.createElement("a");
      desk.href="dashboard.html";
      desk.setAttribute("data-desk","1");
      desk.textContent="My desk";
      var create=document.createElement("a");
      create.href="create-campaign.html";
      create.setAttribute("data-desk","1");
      create.textContent="New fundraiser";
      var first=pn.querySelector("a");
      if(first){pn.insertBefore(create,first);pn.insertBefore(desk,create);}
      else{pn.appendChild(desk);pn.appendChild(create);}
    }
  }

  // Modern social icons for "Ready to share" slide
  document.querySelectorAll(".social-icons").forEach(function(box){
    if(box.querySelector("svg")) return;
    box.innerHTML=
      '<span class="si" title="Facebook" aria-label="Facebook"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.8-4.7 4.54-4.7 1.32 0 2.7.24 2.7.24v2.97h-1.52c-1.5 0-1.97.93-1.97 1.89v2.26h3.35l-.54 3.49h-2.81V24C19.61 23.1 24 18.1 24 12.07z"/></svg></span>'+
      '<span class="si" title="WhatsApp" aria-label="WhatsApp"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="#25D366" d="M12 0C5.37 0 0 5.37 0 12c0 2.12.55 4.12 1.52 5.85L.05 24l6.34-1.66A11.94 11.94 0 0012 24c6.63 0 12-5.37 12-12S18.63 0 12 0zm5.15 16.4c-.25.7-1.44 1.32-2.01 1.41-.51.08-1.16.11-1.87-.12-.43-.14-.98-.33-1.69-.63-2.98-1.29-4.93-4.29-5.08-4.49-.15-.2-1.22-1.61-1.22-3.07 0-1.46.77-2.18 1.04-2.48.28-.3.6-.37.8-.37h.57c.18 0 .43-.08.67.5.25.59.85 2.05.92 2.2.07.15.12.32.02.52-.1.2-.15.33-.3.5-.15.17-.32.39-.45.52-.15.14-.3.3-.13.6.17.29.76 1.26 1.64 2.04 1.13 1.01 2.08 1.32 2.38 1.47.29.15.47.13.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.09 1.73.81 2.03.96.3.15.5.22.57.35.08.12.08.71-.17 1.41z"/></svg></span>'+
      '<span class="si" title="X" aria-label="X"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="#111" d="M18.9 1.5h3.5l-7.6 8.7L24 22.5h-7.4l-5.8-7.6-6.6 7.6H.7l8.1-9.3L0 1.5h7.6l5.2 6.9 6.1-6.9zm-1.2 19h1.9L6.4 3.4H4.3l13.4 17.1z"/></svg></span>'+
      '<span class="si" title="TikTok" aria-label="TikTok"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="#111" d="M19.6 6.2a4.8 4.8 0 01-2.8-2.7h-2.5v12.7a2.7 2.7 0 11-1.9-2.6V11a5.3 5.3 0 104.4 5.2V9.4a7.4 7.4 0 004.3 1.4V8.2a4.8 4.8 0 01-1.5-.2z"/></svg></span>';
  });
  var siStyle=document.createElement("style");
  siStyle.textContent=".si{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.08)}";
  document.head.appendChild(siStyle);
})();
