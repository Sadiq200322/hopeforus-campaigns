/* Shared campaign list so a fundraiser created on one device shows up for approval on another. */
(function(w){
  var TOPIC='hopeforus-camps-sadiq200322-k7';
  var URL='https://ntfy.sh/'+TOPIC;
  function pack(c){
    var image=c.image||'';
    if(String(image).indexOf('data:')===0 && image.length>2200) image='';
    var o={
      id:c.id, code:c.code||c.id,
      ownerId:c.ownerId||'', ownerEmail:c.ownerEmail||c.organizerEmail||'',
      organizerEmail:c.organizerEmail||c.ownerEmail||'', organizer:c.organizer||'',
      title:c.title||'', story:String(c.story||'').slice(0,700),
      goal:Number(c.goal)||0, raised:Number(c.raised)||0, donations:Number(c.donations)||0,
      currency:c.currency||'USD', category:c.category||'',
      image:image, status:c.status||'pending',
      donationLink:c.donationLink||'', createdAt:c.createdAt||''
    };
    var body=JSON.stringify(o);
    if(body.length>3800){ o.story=o.story.slice(0,180); body=JSON.stringify(o); }
    if(body.length>3800){ o.image=''; body=JSON.stringify(o); }
    return body;
  }
  function shrink(src){
    return new Promise(function(resolve){
      if(!src){ resolve(''); return; }
      if(String(src).indexOf('data:')!==0){ resolve(String(src).slice(0,500)); return; }
      var img=new Image();
      img.onload=function(){
        try{
          var max=80, sc=Math.min(1, max/Math.max(img.width||1, img.height||1));
          var canvas=document.createElement('canvas');
          canvas.width=Math.max(1, Math.round(img.width*sc));
          canvas.height=Math.max(1, Math.round(img.height*sc));
          canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
          var url=canvas.toDataURL('image/jpeg',0.42);
          resolve(url.length>2200?'':url);
        }catch(e){ resolve(''); }
      };
      img.onerror=function(){ resolve(''); };
      img.src=src;
    });
  }
  function push(c){
    if(!c||!c.id) return Promise.resolve();
    return shrink(c.image).then(function(image){
      var copy={};
      Object.keys(c).forEach(function(k){ copy[k]=c[k]; });
      copy.image=image||c.image||'';
      if(String(copy.image).indexOf('data:')===0 && copy.image.length>2600) copy.image='';
      return fetch(URL,{method:'POST',headers:{'Content-Type':'text/plain','Title':'camp'},body:pack(copy)});
    }).catch(function(){});
  }
  function pull(){
    return fetch(URL+'/json?poll=1&since=all').then(function(r){return r.text()}).then(function(text){
      var by={};
      String(text||'').split('\n').forEach(function(line){
        if(!line.trim()) return;
        var ev; try{ev=JSON.parse(line)}catch(e){return}
        if(!ev||ev.event!=='message'||!ev.message) return;
        var c; try{c=JSON.parse(ev.message)}catch(e){return}
        if(!c||!c.id||c.id==='c_test'||c.id==='c_long') return;
        var prev=by[c.id];
        if(!prev||(ev.time||0)>=(prev._t||0)){ c._t=ev.time||0; by[c.id]=c; }
      });
      return Object.keys(by).map(function(k){ var c=by[k]; delete c._t; return c; });
    });
  }
  function localList(){
    try{ var list=JSON.parse(localStorage.getItem('hopeforus_campaigns')||'[]'); return Array.isArray(list)?list:[]; }
    catch(e){ return []; }
  }
  function saveLocal(list){
    try{ localStorage.setItem('hopeforus_campaigns', JSON.stringify(list)); }catch(e){}
  }
  function merge(remote){
    var list=localList(), by={};
    list.forEach(function(c){ if(c&&c.id) by[c.id]=c; });
    (remote||[]).forEach(function(c){
      if(!c||!c.id) return;
      var cur=by[c.id];
      if(!cur){ by[c.id]=c; return; }
      if(c.status) cur.status=c.status;
      if(c.donationLink) cur.donationLink=c.donationLink;
      if(!cur.story&&c.story) cur.story=c.story;
      if(!cur.title&&c.title) cur.title=c.title;
      if(!cur.ownerEmail&&c.ownerEmail) cur.ownerEmail=c.ownerEmail;
      if(!cur.organizer&&c.organizer) cur.organizer=c.organizer;
      if((!cur.image||String(cur.image).indexOf('placeholder')>=0)&&c.image) cur.image=c.image;
      if(!cur.goal&&c.goal) cur.goal=c.goal;
      if(!cur.code&&c.code) cur.code=c.code;
    });
    var next=Object.keys(by).map(function(k){return by[k]});
    saveLocal(next);
    return next;
  }
  function sync(){
    return pull().then(function(remote){
      var by={}; (remote||[]).forEach(function(c){ by[c.id]=c; });
      var list=localList();
      var jobs=[];
      list.forEach(function(c){
        if(!c||!(c.ownerEmail||c.ownerId||c.organizerEmail)) return;
        var r=by[c.id];
        if(r&&r.status==='approved'&&c.status!=='approved'){
          c.status='approved';
          if(r.donationLink) c.donationLink=r.donationLink;
          return;
        }
        if(r&&r.status==='rejected'&&c.status!=='rejected'){ c.status='rejected'; return; }
        if(!r||r.status!==(c.status||'pending')||(r.donationLink||'')!==(c.donationLink||'')||(r.title||'')!==(c.title||'')||(!r.image&&c.image)) jobs.push(push(c));
      });
      saveLocal(list);
      merge(remote);
      return Promise.all(jobs).then(function(){ return remote; });
    }).catch(function(){ return []; });
  }
  w.HFShared={pull:pull, merge:merge, push:push, sync:sync};
})(window);
