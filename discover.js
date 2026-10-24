/* Discover: GFM layout + real social icons + category filter */
(function(){
  document.querySelectorAll(".social-icons").forEach(function(box){
    box.innerHTML=
      '<span class="si" aria-label="Facebook"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.8-4.7 4.54-4.7 1.32 0 2.7.24 2.7.24v2.97h-1.52c-1.5 0-1.97.93-1.97 1.89v2.26h3.35l-.54 3.49h-2.81V24C19.61 23.1 24 18.1 24 12.07z"/></svg></span>'+
      '<span class="si" aria-label="Instagram"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="#E4405F" d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.69 21.31.27 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-11.85a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/></svg></span>'+
      '<span class="si" aria-label="YouTube"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="#FF0000" d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 00.5 6.2 31.5 31.5 0 000 12a31.5 31.5 0 00.5 5.8 3 3 0 002.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 002.1-2.1A31.5 31.5 0 0024 12a31.5 31.5 0 00-.5-5.8zM9.6 15.5V8.5L15.8 12l-6.2 3.5z"/></svg></span>'+
      '<span class="si" aria-label="TikTok"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="#000" d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.45 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.54-.15 1.22-.14 1.81.23 1.64 1.94 3.02 3.56 2.87 1.12-.07 2.2-.66 2.81-1.58.23-.33.39-.72.41-1.12.1-2.72.07-5.44.08-8.16z"/></svg></span>';
  });
  var st=document.createElement("style");
  st.textContent=
    ".si{width:40px;height:40px;border-radius:50%;background:#f3f4f6;display:inline-flex;align-items:center;justify-content:center;overflow:hidden}"+
    ".si svg{display:block}"+
    ".more-grid{display:none!important}"+
    ".discover-grid{display:grid!important;grid-template-columns:1fr!important;gap:16px!important;width:100%!important;align-items:stretch!important}"+
    "@media(min-width:860px){.discover-grid{grid-template-columns:1.35fr 1fr!important;gap:16px!important}}"+
    ".mini-cards-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:12px!important;width:100%!important;height:100%!important}"+
    ".campaign-card{display:flex!important;flex-direction:column!important;height:100%!important}"+
    ".campaign-card .image-container{flex:1 1 auto;min-height:140px}"+
    ".campaign-card.featured .image-container{min-height:280px}"+
    ".campaign-card.mini .image-container{flex:0 0 auto;height:120px;min-height:120px}"+
    "@media(min-width:860px){.campaign-card.featured .image-container{min-height:320px}.campaign-card.mini .image-container{height:130px;min-height:130px}}";
  document.head.appendChild(st);

  if(typeof money!=="function"){
    window.money=function(n,c){n=Number(n)||0;var s=n.toLocaleString();if(c==="EUR")return"€"+s;if(c==="GBP")return"£"+s;return"$"+s};
  }
  if(typeof fmtDon!=="function"){
    window.fmtDon=function(n){n=Number(n)||0;if(n>=1000)return(Math.round(n/100)/10)+"K";return String(n)};
  }
  if(typeof esc!=="function"){
    window.esc=function(s){return String(s||"").replace(/&/g,"&").replace(/</g,"<").replace(/"/g,""")};
  }

  window.currentFilter=window.currentFilter||"all";

  window.pickFilter=function(btn){
    window.currentFilter=(btn.getAttribute("data-filter")||"all").toLowerCase();
    var lab=document.getElementById("pillLabel");if(lab)lab.textContent=btn.textContent.trim();
    document.querySelectorAll("#pillMenu [data-filter]").forEach(function(b){b.classList.remove("active")});
    btn.classList.add("active");
    var menu=document.getElementById("pillMenu");if(menu)menu.classList.remove("open");
    var pill=document.getElementById("worldPill");if(pill)pill.classList.remove("open");
    window.renderCampaigns();
  };

  window.renderCampaigns=function(){
    var filter=window.currentFilter||"all";
    var source=window.ALL||[];
    var filtered=source.filter(function(x){
      if(!x||!x.c||!x.src)return false;
      if(filter==="all")return true;
      var cat=(x.c.category||"").toLowerCase();
      return cat===filter||cat.indexOf(filter)!==-1;
    }).slice(0,5);
    var feat=document.getElementById("feat");
    var grid=document.getElementById("grid");
    if(grid)grid.innerHTML="";
    if(!feat)return;
    if(!filtered.length){
      feat.innerHTML="<p style='color:#5c5c5c;padding:24px 0;text-align:center'>No fundraisers in this category yet. <a href='create-campaign.html' style='color:#7C3AED;font-weight:600'>Start one →</a></p>";
      return;
    }
    function badge(c){
      var d=Number(c.donations)||0;
      if(d>0)return fmtDon(d)+" donations";
      var r=Number(c.raised)||0;
      if(r>0)return money(r,c.currency)+" raised";
      return "";
    }
    function card(x,cls){
      var c=x.c;
      var p=Math.min(100,Math.round((Number(c.raised)||0)/Math.max(1,Number(c.goal)||1)*100));
      var b=badge(c);
      var bhtml=b?'<span class="donation-badge">'+b+'</span>':"";
      return '<a class="campaign-card '+cls+'" href="campaign.html?id='+encodeURIComponent(c.id)+'"><div class="image-container"><img class="card-image" src="'+x.src+'" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=720&h=405&fit=crop&auto=format&q=70\'">'+bhtml+'</div><div class="card-content"><h3 class="card-title">'+esc(c.title)+'</h3><div class="progress-track"><div class="progress-fill" style="width:'+p+'%"></div></div><span class="raised-label">'+money(c.raised,c.currency)+' raised</span></div></a>';
    }
    var fh=card(filtered[0],"featured");
    if(filtered.length>1){
      fh+='<div class="mini-cards-grid">';
      filtered.slice(1,5).forEach(function(x){fh+=card(x,"mini")});
      fh+='</div>';
    }
    feat.innerHTML=fh;
  };

  if(window.ALL && window.ALL.length){
    window.renderCampaigns();
  } else {
    setTimeout(function(){ if(window.ALL&&window.ALL.length) window.renderCampaigns(); }, 50);
    setTimeout(function(){ if(window.ALL&&window.ALL.length) window.renderCampaigns(); }, 300);
  }
})();
