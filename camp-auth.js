(function(){
  document.querySelectorAll('.mark, .logo-icon, .logo .mark').forEach(function(el){
    if(el.tagName==='IMG')return;
    el.innerHTML='';
    el.style.cssText='width:32px;height:32px;background:transparent;border-radius:0;padding:0;display:inline-flex;align-items:center;justify-content:center;box-shadow:none';
    el.innerHTML='<img src="logo-mark.svg" alt="" width="32" height="32" style="display:block">';
  });

  var user=null;try{user=JSON.parse(localStorage.getItem('hopeforus_user')||'null')}catch(e){}
  var hdr=document.querySelector('.top');
  if(hdr){
    var signup=hdr.querySelector('a.signup');
    if(user&&user.email){
      var name=(user.name||user.email.split('@')[0]||'You').trim().split(' ')[0];
      var html='<a href="dashboard.html" style="display:inline-flex;align-items:center;gap:8px;background:#f3f4f6;border-radius:999px;padding:4px 4px 4px 12px;text-decoration:none;color:#1a1a1a;font-weight:600;font-size:.9rem"><span>'+name+'</span><span style="width:28px;height:28px;border-radius:50%;background:#02a95c;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:800">'+name.charAt(0).toUpperCase()+'</span></a>';
      if(signup)signup.outerHTML=html;
    }
  }

  function shortLink(code){
    code=(code||'campaign').toString().toUpperCase().replace(/\s+/g,'');
    return 'https://hopeforus.me/f/'+encodeURIComponent(code);
  }
  function realShareUrl(code,id){
    var base=location.origin+location.pathname.replace(/[^/]+$/,'');
    return base+'f.html?c='+encodeURIComponent((code||id||'').toString().toUpperCase());
  }

  setTimeout(function(){
    var thumbs=document.querySelectorAll('.thumbs button');
    if(thumbs.length<2)return;
    var gIdx=0;
    setInterval(function(){gIdx=(gIdx+1)%thumbs.length;if(thumbs[gIdx])thumbs[gIdx].click()},4500);
  },1200);

  function buildShareCard(){
    var panel=document.getElementById('sharePanel');
    if(!panel||panel.dataset.enhanced)return;
    panel.dataset.enhanced='1';
    var titleEl=document.querySelector('.title');
    var title=titleEl?titleEl.textContent.trim():'Campaign';
    var amtEl=document.querySelector('.amt');
    var raised=amtEl?amtEl.textContent.replace(/\s*raised.*/,'').trim():'$0';
    var pctEl=document.querySelector('.ring .pct');
    var pct=pctEl?parseInt(pctEl.textContent,10)||0:0;
    var imgEl=document.querySelector('.gallery img');
    var imgSrc=imgEl?imgEl.src:'';
    var codeEl=document.getElementById('modalCode');
    var code=codeEl?codeEl.textContent.trim():'';
    if(!code||code==='—'){
      try{
        var id=new URLSearchParams(location.search).get('id')||'';
        var list=JSON.parse(localStorage.getItem('hopeforus_campaigns')||'[]');
        var c=list.find(function(x){return x.id===id});
        if(c&&c.code)code=c.code; else code=id||'CAMPAIGN';
      }catch(e){code='CAMPAIGN'}
    }
    var short=shortLink(code);
    var real=realShareUrl(code);
    var fb='https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(real);
    var wa='https://wa.me/?text='+encodeURIComponent(title+' '+short);
    var tw='https://twitter.com/intent/tweet?url='+encodeURIComponent(short)+'&text='+encodeURIComponent(title);
    var li='https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(real);
    var safeTitle=title.replace(/</g,'&lt;').slice(0,64);

    panel.innerHTML=
      '<div style="text-align:center;margin-bottom:14px">'+
      '<p style="font-size:.95rem;font-weight:800;margin:0 0 6px;letter-spacing:-.02em">Sharing helps more than you think</p>'+
      '<p style="font-size:.85rem;color:#5c5c5c;margin:0;line-height:1.4">On average, each share can inspire more donations by helping this fundraiser reach more people.</p></div>'+
      '<div style="background:#f7f7f7;border-radius:16px;padding:14px;border:1px solid #eee">'+
      '<div style="display:flex;gap:12px;align-items:stretch;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e8e8e8">'+
      '<div style="flex:1;padding:14px 12px;min-width:0">'+
      '<img src="logo-mark.svg" alt="" width="22" height="22" style="margin-bottom:8px">'+
      '<div style="font-weight:800;font-size:.9rem;line-height:1.25;margin-bottom:8px;letter-spacing:-.02em">'+safeTitle+'</div>'+
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">'+
      '<svg width="44" height="44" viewBox="0 0 56 56"><circle cx="28" cy="28" r="22" fill="none" stroke="#e5e7eb" stroke-width="5"/><circle cx="28" cy="28" r="22" fill="none" stroke="#02a95c" stroke-width="5" stroke-dasharray="138.2" stroke-dashoffset="'+(138.2-(138.2*pct/100))+'" stroke-linecap="round" transform="rotate(-90 28 28)"/></svg>'+
      '<div><span style="display:inline-block;background:#d4f54a;color:#1a1a1a;font-weight:800;font-size:.8rem;padding:4px 10px;border-radius:999px;margin-bottom:4px">'+raised+' raised</span><br>'+
      '<span style="display:inline-block;background:#d4f54a;color:#1a1a1a;font-weight:800;font-size:.75rem;padding:4px 10px;border-radius:999px">Donate now!</span></div></div></div>'+
      (imgSrc?'<div style="width:42%;min-width:100px;position:relative"><img src="'+imgSrc+'" alt="" style="width:100%;height:100%;object-fit:cover;display:block;min-height:120px"><span style="position:absolute;top:8px;right:8px;width:28px;height:28px;background:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.12)">♡</span></div>':'')+
      '</div>'+
      '<div style="display:flex;justify-content:center;gap:10px;margin-top:14px;flex-wrap:wrap">'+
      '<button type="button" id="copyShort" title="Copy link" style="width:40px;height:40px;border-radius:50%;border:1px solid #e5e7eb;background:#fff;cursor:pointer;font-size:1rem">🔗</button>'+
      '<a href="'+fb+'" target="_blank" rel="noopener" style="width:40px;height:40px;border-radius:50%;background:#1877F2;display:flex;align-items:center;justify-content:center;text-decoration:none;color:#fff;font-weight:800;font-size:.85rem">f</a>'+
      '<a href="'+wa+'" target="_blank" rel="noopener" style="width:40px;height:40px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;text-decoration:none;color:#fff;font-size:1.1rem">✆</a>'+
      '<a href="'+tw+'" target="_blank" rel="noopener" style="width:40px;height:40px;border-radius:50%;background:#000;display:flex;align-items:center;justify-content:center;text-decoration:none;color:#fff;font-weight:800;font-size:.75rem">𝕏</a>'+
      '<a href="'+li+'" target="_blank" rel="noopener" style="width:40px;height:40px;border-radius:50%;background:#0A66C2;display:flex;align-items:center;justify-content:center;text-decoration:none;color:#fff;font-weight:800;font-size:.75rem">in</a>'+
      '</div>'+
      '<div style="margin-top:12px;text-align:center"><input id="shortLinkInput" readonly value="'+short+'" style="width:100%;max-width:280px;padding:10px 12px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:.85rem;text-align:center;font-weight:600">'+
      '<div id="shortToast" style="font-size:.8rem;color:#02a95c;font-weight:600;margin-top:6px;opacity:0">Link copied!</div></div></div>';

    function copyShort(){
      var text=short;
      var doCopy=function(){
        var t=document.getElementById('shortToast');
        if(t){t.style.opacity='1';setTimeout(function(){t.style.opacity='0'},2000)}
      };
      if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(doCopy).catch(function(){
          navigator.clipboard.writeText(real).then(doCopy);
        });
      }
      try{localStorage.setItem('hopeforus_last_share',real)}catch(e){}
    }
    var btn=document.getElementById('copyShort');
    if(btn)btn.onclick=copyShort;
    var inp=document.getElementById('shortLinkInput');
    if(inp)inp.onclick=function(){this.select();copyShort()};
  }

  function hookShare(){
    ['sideShare','midShare','mShare'].forEach(function(id){
      var el=document.getElementById(id);
      if(!el)return;
      el.addEventListener('click',function(){setTimeout(buildShareCard,50)});
    });
  }
  hookShare();
  setTimeout(hookShare,500);
  setTimeout(buildShareCard,800);

  window.hopeforusShortLink=shortLink;
  window.hopeforusRealShareUrl=realShareUrl;
})();
