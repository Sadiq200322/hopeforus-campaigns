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
    var host=(location&&location.origin)?location.origin:'https://munowatchplus.watch';
    return host+'/c/'+encodeURIComponent(code);
  }
  function realShareUrl(code){
    return shortLink(code);
  }

  setTimeout(function(){
    try{
      var id=new URLSearchParams(location.search).get('id')||'';
      var list=JSON.parse(localStorage.getItem('hopeforus_campaigns')||'[]');
      var c=list.find(function(x){return x.id===id});
      var urls=[];
      if(c){
        if(c.media&&c.media.length)urls=c.media.slice();
        else if(c.image)urls=[c.image];
        if(c.cover&&c.cover.dataUrl&&(!c.cover.type||c.cover.type.indexOf('video')!==0))urls.unshift(c.cover.dataUrl);
      }
      urls=urls.filter(Boolean);
      if(urls.length>1){
        var gallery=document.querySelector('.gallery')||document.querySelector('.photo-gallery');
        if(gallery){
          var main=gallery.querySelector('img');
          if(main){
            var idx=0;
            main.src=urls[0];
            setInterval(function(){idx=(idx+1)%urls.length;main.src=urls[idx];},4500);
          }
        }
        var thumbs=document.querySelector('.thumbs');
        if(thumbs){
          thumbs.innerHTML='';
          urls.forEach(function(u,i){
            var b=document.createElement('button');
            b.type='button';
            b.style.cssText='width:56px;height:56px;border-radius:8px;overflow:hidden;border:2px solid '+(i===0?'#02a95c':'transparent')+';padding:0;cursor:pointer;background:#eee';
            b.innerHTML='<img src="'+u+'" style="width:100%;height:100%;object-fit:cover" alt="">';
            b.onclick=function(){
              var m=document.querySelector('.gallery img')||document.querySelector('.photo-gallery img');
              if(m)m.src=u;
              thumbs.querySelectorAll('button').forEach(function(x){x.style.borderColor='transparent'});
              b.style.borderColor='#02a95c';
            };
            thumbs.appendChild(b);
          });
        }
      }
    }catch(e){}
  },400);

  setTimeout(function(){
    var thumbs=document.querySelectorAll('.thumbs button');
    if(thumbs.length<2)return;
    var gIdx=0;
    setInterval(function(){gIdx=(gIdx+1)%thumbs.length;if(thumbs[gIdx])thumbs[gIdx].click()},4500);
  },1500);

  var ICO={
    link:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
    fb:'<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z"/></svg>',
    wa:'<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.87 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35zM12.05 21.78h-.01a9.78 9.78 0 01-4.98-1.36l-.36-.21-3.7.97.99-3.61-.24-.37a9.78 9.78 0 01-1.5-5.22c0-5.4 4.4-9.8 9.81-9.8a9.73 9.73 0 016.93 2.87 9.73 9.73 0 012.87 6.93c0 5.4-4.4 9.8-9.81 9.8zm8.34-18.14A11.7 11.7 0 0012.04 0C5.46 0 .1 5.36.1 11.94c0 2.1.55 4.16 1.59 5.97L0 24l6.26-1.64a11.9 11.9 0 005.78 1.47h.01c6.58 0 11.94-5.36 11.94-11.94 0-3.19-1.24-6.19-3.5-8.45z"/></svg>',
    x:'<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.21-6.82-5.96 6.82H1.69l7.73-8.84L1.25 2.25h6.81l4.71 6.23 5.47-6.23zm-1.16 17.52h1.83L7.08 4.13H5.11l11.97 15.64z"/></svg>',
    li:'<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.23 0z"/></svg>'
  };

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
    var imgEl=document.querySelector('.gallery img')||document.querySelector('.photo-gallery img');
    var imgSrc=imgEl?imgEl.src:'';
    var codeEl=document.getElementById('modalCode');
    var code=codeEl?codeEl.textContent.trim():'';
    if(!code||code==='—'){
      try{
        var id=new URLSearchParams(location.search).get('id')||'';
        var qCode=new URLSearchParams(location.search).get('code')||'';
        var list=JSON.parse(localStorage.getItem('hopeforus_campaigns')||'[]');
        var c=list.find(function(x){return x.id===id});
        if(c&&c.code)code=c.code; else if(qCode)code=qCode; else code=id||'CAMPAIGN';
      }catch(e){code='CAMPAIGN'}
    }
    var short=shortLink(code);
    var real=realShareUrl(code);
    var fb='https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(real);
    var wa='https://wa.me/?text='+encodeURIComponent(title+' '+short);
    var tw='https://twitter.com/intent/tweet?url='+encodeURIComponent(short)+'&text='+encodeURIComponent(title);
    var li='https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(real);
    var safeTitle=title.replace(/</g,'<').slice(0,64);

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
      (imgSrc?'<div style="width:42%;min-width:100px;position:relative"><img src="'+imgSrc+'" alt="" style="width:100%;height:100%;object-fit:cover;display:block;min-height:120px"><span style="position:absolute;top:8px;right:8px;width:28px;height:28px;background:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.12);color:#e11">♡</span></div>':'')+
      '</div>'+
      '<div style="display:flex;justify-content:center;gap:10px;margin-top:14px;flex-wrap:wrap">'+
      '<button type="button" id="copyShort" title="Copy link" style="width:42px;height:42px;border-radius:50%;border:1px solid #e5e7eb;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#333">'+ICO.link+'</button>'+
      '<a href="'+fb+'" target="_blank" rel="noopener" style="width:42px;height:42px;border-radius:50%;background:#1877F2;display:flex;align-items:center;justify-content:center;text-decoration:none">'+ICO.fb+'</a>'+
      '<a href="'+wa+'" target="_blank" rel="noopener" style="width:42px;height:42px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;text-decoration:none">'+ICO.wa+'</a>'+
      '<a href="'+tw+'" target="_blank" rel="noopener" style="width:42px;height:42px;border-radius:50%;background:#000;display:flex;align-items:center;justify-content:center;text-decoration:none">'+ICO.x+'</a>'+
      '<a href="'+li+'" target="_blank" rel="noopener" style="width:42px;height:42px;border-radius:50%;background:#0A66C2;display:flex;align-items:center;justify-content:center;text-decoration:none">'+ICO.li+'</a>'+
      '</div>'+
      '<div style="margin-top:12px;text-align:center"><input id="shortLinkInput" readonly value="'+short+'" style="width:100%;max-width:280px;padding:10px 12px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:.85rem;text-align:center;font-weight:600">'+
      '<div id="shortToast" style="font-size:.8rem;color:#02a95c;font-weight:600;margin-top:6px;opacity:0">Link copied!</div></div></div>';

    function copyShort(){
      var doCopy=function(){var t=document.getElementById('shortToast');if(t){t.style.opacity='1';setTimeout(function(){t.style.opacity='0'},2000)}};
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(short).then(doCopy).catch(function(){navigator.clipboard.writeText(real).then(doCopy)});
      try{localStorage.setItem('hopeforus_last_share',short)}catch(e){}
    }
    var btn=document.getElementById('copyShort');if(btn)btn.onclick=copyShort;
    var inp=document.getElementById('shortLinkInput');if(inp)inp.onclick=function(){this.select();copyShort()};
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
