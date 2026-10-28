/* Shared campaign list so a fundraiser created on one device shows up for approval on another. */
(function(w){
  var TOPIC='hopeforus-camps-sadiq200322-k7';
  var URL='https://ntfy.sh/'+TOPIC;
  var DEL_KEY='hopeforus_deleted_ids';
  function norm(s){ return String(s||'').toLowerCase().replace(/\s+/g,' ').trim(); }
  function deletedSet(){
    try{ var a=JSON.parse(localStorage.getItem(DEL_KEY)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; }
  }
  function rememberDeleted(id){
    if(!id) return;
    var a=deletedSet();
    if(a.indexOf(id)<0) a.push(id);
    if(a.length>800) a=a.slice(-800);
    try{ localStorage.setItem(DEL_KEY, JSON.stringify(a)); }catch(e){}
  }
  function isTombstoned(id){ return !!(id && deletedSet().indexOf(id)>=0); }
  function isGone(c){ return !c || c.deleted || c.status==='deleted'; }
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
    var tombs={};
    deletedSet().forEach(function(id){ tombs[id]=1; });
    (remote||[]).forEach(function(c){
      if(c&&c.id&&isGone(c)){ tombs[c.id]=1; rememberDeleted(c.id); }
    });
    var list=localList().filter(function(c){ return c&&c.id&&!tombs[c.id]&&!isGone(c); });
    var by={};
    list.forEach(function(c){ if(c&&c.id) by[c.id]=c; });
    (remote||[]).forEach(function(c){
      if(!c||!c.id||tombs[c.id]||isGone(c)) return;
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
  function scoreOf(c){
    var s=0;
    if(c.status==='approved') s+=1000;
    if(c.donationLink) s+=100;
    if(c.image) s+=10;
    if(c.story&&String(c.story).length>40) s+=5;
    var t=Date.parse(c.createdAt||'')||Number(c.created)||0;
    return s*1e15+t;
  }
  function dupKey(c){
    if(!c||!c.id||!c.title||isGone(c)||c.status==='rejected') return '';
    if(w.HF_SAMPLE_IDS&&w.HF_SAMPLE_IDS[c.id]) return '';
    var who=norm(c.ownerEmail||c.organizerEmail||'')||norm(c.organizer||'');
    if(!who) return '';
    return norm(c.title)+'|'+who;
  }
  function dropIds(ids){
    ids=(ids||[]).filter(function(id,i,arr){ return id&&arr.indexOf(id)===i&&!(w.HF_SAMPLE_IDS&&w.HF_SAMPLE_IDS[id]); });
    if(!ids.length) return Promise.resolve(localList());
    var list=localList().filter(function(c){ return c&&ids.indexOf(c.id)<0; });
    saveLocal(list);
    var jobs=ids.map(function(id){
      rememberDeleted(id);
      var tomb={id:id,status:'deleted',deleted:true,title:'removed'};
      var remote=(w.HFDB&&HFDB.remove)?HFDB.remove(id):Promise.resolve();
      return Promise.all([push(tomb), remote]);
    });
    return Promise.all(jobs).then(function(){ return localList(); });
  }
  function dedupe(){
    var list=localList().filter(function(c){ return c&&c.id&&!isTombstoned(c.id)&&!isGone(c); });
    var best={};
    list.forEach(function(c){
      var k=dupKey(c);
      if(!k) return;
      if(!best[k]||scoreOf(c)>scoreOf(best[k])) best[k]=c;
    });
    var drop=[];
    list.forEach(function(c){
      var k=dupKey(c);
      if(k&&best[k]&&best[k].id!==c.id) drop.push(c.id);
    });
    localList().forEach(function(c){
      if(c&&c.id&&(isTombstoned(c.id)||isGone(c))&&drop.indexOf(c.id)<0) drop.push(c.id);
    });
    if(!drop.length){ saveLocal(list); return Promise.resolve(list); }
    return dropIds(drop);
  }
  function sync(){
    return pull().then(function(remote){
      var by={}; (remote||[]).forEach(function(c){ if(c&&c.id) by[c.id]=c; });
      var list=localList();
      var jobs=[];
      list.forEach(function(c){
        if(!c||!(c.ownerEmail||c.ownerId||c.organizerEmail)) return;
        if(isGone(c)||isTombstoned(c.id)) return;
        var r=by[c.id];
        if(r&&isGone(r)){ rememberDeleted(c.id); return; }
        if(r&&r.status==='approved'&&c.status!=='approved'){
          c.status='approved';
          if(r.donationLink) c.donationLink=r.donationLink;
          return;
        }
        if(r&&r.status==='rejected'&&c.status!=='rejected'){ c.status='rejected'; return; }
        if(!r||r.status!==(c.status||'pending')||(r.donationLink||'')!==(c.donationLink||'')||(r.title||'')!==(c.title||'')||(!r.image&&c.image)) jobs.push(push(c));
      });
      list=list.filter(function(c){ return c&&c.id&&!isGone(c)&&!isTombstoned(c.id)&&!(by[c.id]&&isGone(by[c.id])); });
      saveLocal(list);
      merge(remote);
      return Promise.all(jobs).then(function(){ return dedupe(); });
    }).catch(function(){ return dedupe().catch(function(){ return []; }); });
  }
  w.HFShared={pull:pull, merge:merge, push:push, sync:sync, dedupe:dedupe, dropIds:dropIds, rememberDeleted:rememberDeleted, isTombstoned:isTombstoned};
})(window);
