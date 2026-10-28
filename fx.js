/* HopeForUs micro-interactions: click press + scroll reveal */
(function(){
  if(window.__hfFx) return; window.__hfFx=1;

  function bindPress(root){
    (root||document).querySelectorAll('a,button,.btn,.go,.btn-donate,.btn-share,.share-btn,.cta,.pill').forEach(function(el){
      if(el.__hfPress) return; el.__hfPress=1;
      el.style.transition = (el.style.transition||'') + ', transform .12s ease';
      el.addEventListener('pointerdown', function(){ el.style.transform='scale(.97)'; });
      el.addEventListener('pointerup', function(){ el.style.transform=''; });
      el.addEventListener('pointerleave', function(){ el.style.transform=''; });
      el.addEventListener('pointercancel', function(){ el.style.transform=''; });
    });
  }
  bindPress(document);

  var style=document.createElement('style');
  style.textContent=
    '.hf-reveal{opacity:0;transform:translateY(18px);transition:opacity .55s ease,transform .55s ease}'+
    '.hf-reveal.hf-in{opacity:1;transform:none}'+
    '@media (prefers-reduced-motion:reduce){.hf-reveal{opacity:1;transform:none;transition:none}}';
  document.head.appendChild(style);

  function markReveal(){
    var sels=['.section','.share-promo','.hero','.how','.disc','.topics','.tr','.yel','.stat'];
    sels.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        if(!el.classList.contains('hf-reveal')) el.classList.add('hf-reveal');
      });
    });
  }
  markReveal();

  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add('hf-in'); io.unobserve(en.target); }
      });
    },{threshold:0.12,rootMargin:'0px 0px -40px 0px'});
    document.querySelectorAll('.hf-reveal').forEach(function(el){ io.observe(el); });
  }else{
    document.querySelectorAll('.hf-reveal').forEach(function(el){ el.classList.add('hf-in'); });
  }

  var mo=new MutationObserver(function(){
    bindPress(document);
    markReveal();
  });
  mo.observe(document.body,{childList:true,subtree:true});
})();
