/* HopeForUs UI — GFM-style nav + signed-in header */
(function(){
  var user=null;
  try{user=JSON.parse(localStorage.getItem("hopeforus_user")||"null")}catch(e){}
  var loggedIn=!!(user&&user.email);
  var name=loggedIn?(user.name||user.email.split("@")[0]||"You").trim().split(" ")[0]:"";

  var st=document.createElement("style");
  st.textContent=
    ".si svg{display:block}"+
    ".hdr{display:flex!important;justify-content:center;position:sticky;top:0;z-index:100;background:rgba(255,255,255,.98);border-bottom:1px solid #e8e8e8;height:56px}"+
    ".hdr-inner{width:100%;max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:6px;padding:0 12px;min-width:0;height:56px}"+
    ".hdr-l{justify-self:start;display:flex;align-items:center;gap:2px}"+
    ".hdr-r{justify-self:end;display:flex;align-items:center;gap:6px;min-width:0}"+
    ".logo{justify-self:center;display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:1.1rem;text-decoration:none;color:#1a1a1a}"+
    ".logo img{width:26px;height:26px;flex-shrink:0}"+
    ".nlink{font-size:.9rem;font-weight:600;padding:8px 12px;text-decoration:none;color:#1a1a1a;white-space:nowrap}"+
    ".nlink:hover{color:#7C3AED}"+
    ".btn-p{font-size:.88rem;font-weight:700;padding:9px 16px;border-radius:999px;background:#7C3AED;color:#fff;text-decoration:none;white-space:nowrap}"+
    ".ibtn{width:44px;height:44px;border:0;background:0;cursor:pointer;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#1a1a1a}"+
    ".desk-only{display:none}"+
    "@media(min-width:960px){"+
    "  .desk-only{display:inline-flex!important}"+
    "  .js-menu{display:none!important}"+
    "  .mob{display:none!important}"+
    "}"+
    "@media(max-width:959px){"+
    "  .desk-only{display:none!important}"+
    "  .hdr .logo{font-size:1.05rem}"+
    "}"+
    /* Drawer – GoFundMe style */
    ".dr{display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.4)}"+
    ".dr.on{display:block}"+
    ".pn{position:absolute;top:0;right:0;width:min(360px,92vw);height:100%;background:#fff;padding:0;box-shadow:-8px 0 32px rgba(0,0,0,.15);overflow-y:auto;display:flex;flex-direction:column}"+
    ".pn-head{display:flex;align-items:center;justify-content:flex-end;padding:12px 16px;border-bottom:1px solid #f0f0f0}"+
    ".close-btn{width:40px;height:40px;border:0;background:transparent;border-radius:50%;cursor:pointer;font-size:1.5rem;color:#1a1a1a;line-height:1}"+
    ".pn-body{padding:8px 0 24px;flex:1}"+
    ".pn-item{display:block;padding:16px 24px;text-decoration:none;color:#1a1a1a;border:0;background:0;width:100%;text-align:left;cursor:pointer;font-family:inherit}"+
    ".pn-item:active,.pn-item:hover{background:#f7f7f7}"+
    ".pn-item .t{font-size:1.05rem;font-weight:700;display:block;margin-bottom:2px}"+
    ".pn-item .d{font-size:.85rem;color:#6b7280;line-height:1.35;display:block}"+
    ".pn-item .row{display:flex;align-items:center;justify-content:space-between;gap:12px}"+
    ".pn-item .chev{color:#9ca3af;font-size:1.1rem;flex-shrink:0}"+
    ".pn-actions{padding:16px 24px 28px;display:flex;flex-direction:column;gap:10px;margin-top:auto;border-top:1px solid #f0f0f0}"+
    ".pn-cta{display:block;text-align:center;padding:14px 18px;border-radius:999px;background:#4C1D95;color:#E9D5FF;font-weight:700;text-decoration:none;font-size:.95rem}"+
    ".pn-ghost{display:block;text-align:center;padding:14px 18px;border-radius:999px;border:1.5px solid #d1d5db;background:#fff;color:#1a1a1a;font-weight:700;text-decoration:none;font-size:.95rem}"+
    ".user-chip{display:inline-flex;align-items:center;gap:6px;background:#f3f4f6;border-radius:999px;padding:4px 10px 4px 12px;font-weight:600;font-size:.9rem;text-decoration:none;color:#1a1a1a}"+
    ".user-chip span.av{width:26px;height:26px;border-radius:50%;background:#7C3AED;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800}"+
    ".si{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.08)}";
  document.head.appendChild(st);

  // Ensure header structure
  var hdr=document.querySelector(".hdr");
  if(hdr){
    if(!hdr.querySelector(".hdr-inner")){
      var wrap=document.createElement("div");wrap.className="hdr-inner";
      while(hdr.firstChild)wrap.appendChild(hdr.firstChild);
      hdr.appendChild(wrap);
    }
    var inner=hdr.querySelector(".hdr-inner");
    var left=inner.querySelector(".hdr-l");
    var right=inner.querySelector(".hdr-r");
    if(!left){
      left=document.createElement("div");left.className="hdr-l";
      inner.insertBefore(left,inner.firstChild);
    }
    if(!right){
      right=document.createElement("div");right.className="hdr-r";
      inner.appendChild(right);
    }

    // Left: search icon (mobile) + desk links
    left.innerHTML=
      '<button type="button" class="ibtn mob" aria-label="Search" onclick="var e=document.getElementById(\'disc\');if(e)e.scrollIntoView({behavior:\'smooth\'})">'+
      '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6"></circle><path d="M16 16l5 5"></path></svg></button>'+
      '<a href="#disc" class="nlink desk-only">Search</a>'+
      '<a href="#disc" class="nlink desk-only">Donate</a>'+
      '<a href="create-campaign.html" class="nlink desk-only">Fundraise</a>';

    // Right: desktop signed-in / guest + always hamburger on mobile
    if(loggedIn){
      right.innerHTML=
        '<a href="dashboard.html" class="nlink desk-only">My campaigns</a>'+
        '<a href="dashboard.html#withdraw" class="nlink desk-only">Withdraw</a>'+
        '<a href="create-campaign.html" class="btn-p desk-only">New fundraiser</a>'+
        '<a href="dashboard.html" class="user-chip desk-only">'+name+
        '<span class="av">'+name.charAt(0).toUpperCase()+'</span></a>'+
        '<button type="button" class="ibtn js-menu" id="mBtn" aria-label="Menu">'+
        '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"></path></svg></button>';
    }else{
      right.innerHTML=
        '<a href="#how" class="nlink desk-only">About</a>'+
        '<a href="login.html" class="nlink desk-only">Sign in</a>'+
        '<a href="create-campaign.html" class="btn-p desk-only">Start a HopeForUs</a>'+
        '<button type="button" class="ibtn js-menu" id="mBtn" aria-label="Menu">'+
        '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"></path></svg></button>';
    }
  }

  // Build / replace drawer
  var existing=document.getElementById("dr");
  if(existing)existing.remove();

  function closeDrawer(){
    var d=document.getElementById("dr");
    if(d){d.classList.remove("on");document.body.style.overflow=""}
  }
  function openDrawer(){
    var d=document.getElementById("dr");
    if(d){d.classList.add("on");document.body.style.overflow="hidden"}
  }

  var drawer=document.createElement("div");
  drawer.className="dr";
  drawer.id="dr";
  drawer.onclick=function(e){if(e.target===drawer)closeDrawer()};

  var items="";
  if(loggedIn){
    items=
      '<a class="pn-item" href="dashboard.html"><span class="row"><span><span class="t">Manage your activity</span><span class="d">Campaigns, withdrawals, and share analytics</span></span><span class="chev">›</span></span></a>'+
      '<a class="pn-item" href="dashboard.html"><span class="row"><span><span class="t">My campaigns</span><span class="d">View and manage your fundraisers</span></span><span class="chev">›</span></span></a>'+
      '<a class="pn-item" href="dashboard.html"><span class="row"><span><span class="t">Donations & activity</span><span class="d">Track support and share clicks</span></span><span class="chev">›</span></span></a>'+
      '<a class="pn-item" href="dashboard.html#withdraw"><span class="row"><span><span class="t">Withdraw</span><span class="d">USDT, BTC, MTN & Airtel Money</span></span><span class="chev">›</span></span></a>'+
      '<a class="pn-item" href="#disc" data-close="1"><span class="row"><span><span class="t">Donate</span><span class="d">Discover fundraisers to support</span></span><span class="chev">›</span></span></a>'+
      '<a class="pn-item" href="create-campaign.html"><span class="row"><span><span class="t">Fundraise</span><span class="d">Start fundraising, tips, and resources</span></span><span class="chev">›</span></span></a>'+
      '<a class="pn-item" href="#how" data-close="1"><span class="row"><span><span class="t">About</span><span class="d">How it works, pricing, and more</span></span><span class="chev">›</span></span></a>'+
      '<a class="pn-item" href="mailto:support@hopeforus.com"><span class="row"><span><span class="t">Help Center</span><span class="d">Technical support and help</span></span><span class="chev">›</span></span></a>';
  }else{
    items=
      '<a class="pn-item" href="login.html"><span class="row"><span><span class="t">Manage your activity</span><span class="d">Sign in or sign up to manage your donations, fundraisers and more</span></span><span class="chev">›</span></span></a>'+
      '<a class="pn-item" href="#disc" data-close="1"><span class="row"><span><span class="t">Donate</span><span class="d">Discover fundraisers and causes to support</span></span><span class="chev">›</span></span></a>'+
      '<a class="pn-item" href="create-campaign.html"><span class="row"><span><span class="t">Fundraise</span><span class="d">Start fundraising, tips, and resources</span></span><span class="chev">›</span></span></a>'+
      '<a class="pn-item" href="#how" data-close="1"><span class="row"><span><span class="t">About</span><span class="d">How it works, pricing, and more</span></span><span class="chev">›</span></span></a>'+
      '<a class="pn-item" href="mailto:support@hopeforus.com"><span class="row"><span><span class="t">Help Center</span><span class="d">Technical support and help</span></span><span class="chev">›</span></span></a>';
  }

  var actions=loggedIn
    ? '<a class="pn-cta" href="create-campaign.html">Start a HopeForUs</a><a class="pn-ghost" href="dashboard.html">My desk</a><a class="pn-ghost" href="#" id="pnLogout">Log out</a>'
    : '<a class="pn-cta" href="create-campaign.html">Start a HopeForUs</a><a class="pn-ghost" href="login.html">Sign in</a>';

  drawer.innerHTML=
    '<div class="pn" onclick="event.stopPropagation()">'+
    '<div class="pn-head"><button type="button" class="close-btn" id="pnClose" aria-label="Close">×</button></div>'+
    '<div class="pn-body">'+items+'</div>'+
    '<div class="pn-actions">'+actions+'</div>'+
    '</div>';

  document.body.appendChild(drawer);

  document.getElementById("pnClose").onclick=closeDrawer;
  var lo=document.getElementById("pnLogout");
  if(lo)lo.onclick=function(e){
    e.preventDefault();
    try{localStorage.removeItem("hopeforus_user")}catch(err){}
    if(window.HF&&HF.logout)HF.logout();
    location.href="index.html";
  };
  drawer.querySelectorAll("[data-close]").forEach(function(a){
    a.addEventListener("click",function(){closeDrawer()});
  });

  var menuBtn=document.getElementById("mBtn");
  if(menuBtn)menuBtn.onclick=function(e){e.preventDefault();openDrawer()};

  // Social icons for how-it-works
  document.querySelectorAll(".social-icons").forEach(function(box){
    if(box.querySelector("svg")) return;
    box.innerHTML=
      '<span class="si" title="Facebook" aria-label="Facebook"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.8-4.7 4.54-4.7 1.32 0 2.7.24 2.7.24v2.97h-1.52c-1.5 0-1.97.93-1.97 1.89v2.26h3.35l-.54 3.49h-2.81V24C19.61 23.1 24 18.1 24 12.07z"/></svg></span>'+
      '<span class="si" title="WhatsApp" aria-label="WhatsApp"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="#25D366" d="M12 0C5.37 0 0 5.37 0 12c0 2.12.55 4.12 1.52 5.85L.05 24l6.34-1.66A11.94 11.94 0 0012 24c6.63 0 12-5.37 12-12S18.63 0 12 0zm5.15 16.4c-.25.7-1.44 1.32-2.01 1.41-.51.08-1.16.11-1.87-.12-.43-.14-.98-.33-1.69-.63-2.98-1.29-4.93-4.29-5.08-4.49-.15-.2-1.22-1.61-1.22-3.07 0-1.46.77-2.18 1.04-2.48.28-.3.6-.37.8-.37h.57c.18 0 .43-.08.67.5.25.59.85 2.05.92 2.2.07.15.12.32.02.52-.1.2-.15.33-.3.5-.15.17-.32.39-.45.52-.15.14-.3.3-.13.6.17.29.76 1.26 1.64 2.04 1.13 1.01 2.08 1.32 2.38 1.47.29.15.47.13.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.09 1.73.81 2.03.96.3.15.5.22.57.35.08.12.08.71-.17 1.41z"/></svg></span>'+
      '<span class="si" title="X" aria-label="X"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="#111" d="M18.9 1.5h3.5l-7.6 8.7L24 22.5h-7.4l-5.8-7.6-6.6 7.6H.7l8.1-9.3L0 1.5h7.6l5.2 6.9 6.1-6.9zm-1.2 19h1.9L6.4 3.4H4.3l13.4 17.1z"/></svg></span>'+
      '<span class="si" title="TikTok" aria-label="TikTok"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="#111" d="M19.6 6.2a4.8 4.8 0 01-2.8-2.7h-2.5v12.7a2.7 2.7 0 11-1.9-2.6V11a5.3 5.3 0 104.4 5.2V9.4a7.4 7.4 0 004.3 1.4V8.2a4.8 4.8 0 01-1.5-.2z"/></svg></span>';
  });
})();
