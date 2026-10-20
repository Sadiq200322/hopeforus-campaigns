(function(){
  var user=null;try{user=JSON.parse(localStorage.getItem('hopeforus_user')||'null')}catch(e){}
  var hdr=document.querySelector('.top');
  if(!hdr)return;
  var signup=hdr.querySelector('a.signup');
  if(user&&user.email){
    var name=(user.name||user.email.split('@')[0]||'You').trim().split(' ')[0];
    var html='<a href="dashboard.html" style="display:inline-flex;align-items:center;gap:8px;background:#f3f4f6;border-radius:999px;padding:4px 4px 4px 12px;text-decoration:none;color:#1a1a1a;font-weight:600;font-size:.9rem"><span>'+name+'</span><span style="width:28px;height:28px;border-radius:50%;background:#02a95c;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:800">'+name.charAt(0).toUpperCase()+'</span></a>';
    if(signup)signup.outerHTML=html;
  }
  setTimeout(function(){
    var thumbs=document.querySelectorAll('.thumbs button');
    if(thumbs.length<2)return;
    var gIdx=0;
    setInterval(function(){
      gIdx=(gIdx+1)%thumbs.length;
      if(thumbs[gIdx])thumbs[gIdx].click();
    },4500);
  },1200);
})();
