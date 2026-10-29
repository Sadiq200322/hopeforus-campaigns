/* HopeForUs core – auth, shares, withdraw, admin helpers */
(function(w){
  var USERS_KEY='hopeforus_users';
  var SESSION_KEY='hopeforus_user';
  var CAMPS_KEY='hopeforus_campaigns';
  var CLICKS_KEY='hopeforus_clicks';
  var WITHDRAW_KEY='hopeforus_withdrawals';
  var REPORTS_KEY='hopeforus_reports';
  var GIFTS_KEY='hopeforus_gifts';
  var ADMIN_EMAIL='admin@hopeforus.com';
  var ADMIN_PASS='Admin@2026';

  function load(k,fb){try{var v=JSON.parse(localStorage.getItem(k));return v==null?fb:v;}catch(e){return fb;}}
  function save(k,v){localStorage.setItem(k,JSON.stringify(v));}
  function hash(s){var h=0,i,c;s=String(s||'');for(i=0;i<s.length;i++){c=s.charCodeAt(i);h=((h<<5)-h)+c;h=h&h;}return 'h'+Math.abs(h).toString(16);}

  function users(){return load(USERS_KEY,[])}
  function saveUsers(u){save(USERS_KEY,u)}

  function setUserAvatar(email, dataUrl){
    email=(email||'').toLowerCase().trim();
    if(!email||!dataUrl) return {ok:false};
    var list=users();
    var u=list.find(function(x){return x.email===email});
    if(u){ u.avatar=dataUrl; saveUsers(list); }
    try{ localStorage.setItem('hf_avatar_'+email, dataUrl); }catch(e){}
    try{
      var camps=load(CAMPS_KEY,[]);
      if(Array.isArray(camps)){
        var changed=false;
        camps.forEach(function(c){
          if(!c) return;
          var em=(c.ownerEmail||c.organizerEmail||'').toLowerCase();
          if(em===email){ c.organizerAvatar=dataUrl; c.ownerAvatar=dataUrl; changed=true; }
        });
        if(changed) save(CAMPS_KEY, camps);
      }
    }catch(e){}
    return {ok:true};
  }
  function getUserAvatar(email){
    email=(email||'').toLowerCase().trim();
    if(!email) return '';
    var list=users();
    var u=list.find(function(x){return x.email===email});
    if(u&&u.avatar) return u.avatar;
    try{ return localStorage.getItem('hf_avatar_'+email)||''; }catch(e){ return ''; }
  }

  function session(){return load(SESSION_KEY,null)}
  function setSession(u){if(u)save(SESSION_KEY,{id:u.id,email:u.email,name:u.name,isAdmin:!!u.isAdmin});else localStorage.removeItem(SESSION_KEY)}

  function ensureAdmin(){
    var list=users();
    var changed=false;
    function addUser(row){
      if(list.some(function(x){return x.email===row.email})) return;
      list.push(row); changed=true;
    }
    if(!list.some(function(x){return x.email===ADMIN_EMAIL})){
      addUser({id:'admin',email:ADMIN_EMAIL,name:'Admin',pass:hash(ADMIN_PASS),verified:true,isAdmin:true,created:Date.now(),donors:[],chats:[],clicks:0,avatar:''});
    }
    addUser({id:'u_ijoga',email:'ijogasadiq11@gmail.com',name:'Sadiq Ijoga',pass:hash('ChangeMe@2026'),verified:true,isAdmin:false,created:Date.now()-86400000*3,donors:[],chats:[],clicks:0,avatar:''});
    addUser({id:'u_dollar',email:'dollarprince@gmail.com',name:'Dollar Prince',pass:hash('ChangeMe@2026'),verified:true,isAdmin:false,created:Date.now()-86400000*2,donors:[],chats:[],clicks:0,avatar:''});
    addUser({id:'u_dollar2',email:'dollarprince@hopeforus.com',name:'Dollar Prince',pass:hash('ChangeMe@2026'),verified:true,isAdmin:false,created:Date.now()-86400000*2,donors:[],chats:[],clicks:0,avatar:''});
    if(changed) saveUsers(list);
  }
  ensureAdmin();

  function isAdmin(){var u=session();return !!(u&&u.isAdmin);}

  function startSignup(name,email,password){
    email=(email||'').toLowerCase().trim();
    if(!name||!email||!password||password.length<6) return {ok:false,err:'Name, email and password (6+ chars) required'};
    var list=users();
    if(list.some(function(x){return x.email===email})) return {ok:false,err:'Email already registered'};
    var code=String(Math.floor(100000+Math.random()*900000));
    var pending={name:name.trim(),email:email,pass:hash(password),code:code,ts:Date.now()};
    sessionStorage.setItem('hopeforus_pending',JSON.stringify(pending));
    return {ok:true,code:code,email:email};
  }
  function confirmSignup(code){
    var pending;try{pending=JSON.parse(sessionStorage.getItem('hopeforus_pending')||'null');}catch(e){pending=null;}
    if(!pending||String(pending.code)!==String(code)) return {ok:false,err:'Invalid code'};
    if(Date.now()-pending.ts>30*60*1000) return {ok:false,err:'Code expired'};
    var list=users();
    if(list.some(function(x){return x.email===pending.email})) return {ok:false,err:'Email already registered'};
    var u={id:'u_'+Date.now().toString(36),email:pending.email,name:pending.name,pass:pending.pass,verified:true,isAdmin:false,created:Date.now(),donors:[],chats:[],clicks:0,avatar:''};
    list.push(u); saveUsers(list); sessionStorage.removeItem('hopeforus_pending');
    setSession(u);
    return {ok:true,user:u};
  }
  function login(email,password){
    email=(email||'').toLowerCase().trim();
    var list=users();
    var u=list.find(function(x){return x.email===email});
    if(!u||u.pass!==hash(password)) return {ok:false,err:'Invalid email or password'};
    if(!u.verified) return {ok:false,err:'Email not verified'};
    setSession(u);
    return {ok:true,user:u};
  }
  function logout(){setSession(null);}

  function adminUsers(){
    var byEmail={};
    users().forEach(function(u){
      if(!u||!u.email) return;
      byEmail[u.email]={id:u.id,email:u.email,name:u.name||'',verified:!!u.verified,isAdmin:!!u.isAdmin,created:u.created||0,donors:(u.donors||[]).length,chats:(u.chats||[]).length,avatar:u.avatar||''};
    });
    try{
      var camps=load(CAMPS_KEY,[]);
      if(Array.isArray(camps)) camps.forEach(function(c){
        if(!c) return;
        var em=(c.ownerEmail||c.organizerEmail||'').toLowerCase().trim();
        if(!em) return;
        if(!byEmail[em]){
          byEmail[em]={id:c.ownerId||('camp_'+c.id),email:em,name:c.organizer||em.split('@')[0],verified:true,isAdmin:false,created:Date.parse(c.createdAt||c.created||'')||Date.now(),donors:0,chats:0,avatar:c.organizerAvatar||c.ownerAvatar||''};
        } else {
          if(!byEmail[em].avatar && (c.organizerAvatar||c.ownerAvatar)) byEmail[em].avatar=c.organizerAvatar||c.ownerAvatar;
          if(!byEmail[em].name && c.organizer) byEmail[em].name=c.organizer;
        }
      });
    }catch(e){}
    return Object.keys(byEmail).map(function(k){return byEmail[k];});
  }

  function getAllCampaigns(){
    var stored = load(CAMPS_KEY,[]);
    if(!Array.isArray(stored)) stored = [];
    var byId = {};
    stored.forEach(function(c){ if(c && c.id) byId[c.id] = c; });
    if(typeof SAMPLES!=='undefined' && Array.isArray(SAMPLES)){
      SAMPLES.forEach(function(c){ if(c&&c.id&&!byId[c.id]) byId[c.id]=Object.assign({},c); });
    }
    return Object.keys(byId).map(function(k){return byId[k];});
  }
  function adminCampaigns(){return getAllCampaigns();}
  function myCampaigns(u){
    u=u||session(); if(!u) return [];
    var em=(u.email||'').toLowerCase();
    return getAllCampaigns().filter(function(c){
      return c && ((c.ownerEmail||'').toLowerCase()===em || (c.organizerEmail||'').toLowerCase()===em || c.ownerId===u.id);
    });
  }
  function ensureInStorage(id){
    var list=load(CAMPS_KEY,[]); if(!Array.isArray(list)) list=[];
    var c=list.find(function(x){return x&&x.id===id});
    if(c) return c;
    var all=getAllCampaigns(); c=all.find(function(x){return x&&x.id===id});
    if(c){ list.unshift(c); save(CAMPS_KEY,list); }
    return c||null;
  }
  function saveCampaign(c){
    if(!c||!c.id) return;
    var list=load(CAMPS_KEY,[]); if(!Array.isArray(list)) list=[];
    var i=list.findIndex(function(x){return x&&x.id===c.id});
    if(i>=0) list[i]=c; else list.unshift(c);
    save(CAMPS_KEY,list);
  }
  function approveCampaign(id){
    var list=load(CAMPS_KEY,[]); var c=list.find(function(x){return x&&x.id===id});
    if(!c){ c=ensureInStorage(id); list=load(CAMPS_KEY,[]); c=list.find(function(x){return x&&x.id===id}); }
    if(c){ c.status='approved'; save(CAMPS_KEY,list); return true; }
    return false;
  }
  function rejectCampaign(id){
    var list=load(CAMPS_KEY,[]); var c=list.find(function(x){return x&&x.id===id});
    if(c){ c.status='rejected'; save(CAMPS_KEY,list); return true; }
    return false;
  }
  function deleteCampaign(id){
    var list=load(CAMPS_KEY,[]).filter(function(x){return !x||x.id!==id});
    save(CAMPS_KEY,list);
  }

  function listGifts(ownerEmail){
    var g=load(GIFTS_KEY,[]); if(!Array.isArray(g)) g=[];
    if(!ownerEmail) return g;
    ownerEmail=ownerEmail.toLowerCase();
    return g.filter(function(x){return x&&(x.ownerEmail||'').toLowerCase()===ownerEmail;});
  }
  function addGift(payload){
    var u=session(); if(!u||!u.isAdmin) return {ok:false, err:'Admin only'};
    var camps=getAllCampaigns();
    var c=camps.find(function(x){return x&&x.id===payload.campaignId});
    if(!c) return {ok:false, err:'Pick a campaign'};
    var amount=parseFloat(payload.amount);
    if(!(amount>0)) return {ok:false, err:'Enter an amount'};
    var donor=String(payload.donor||'Anonymous').trim()||'Anonymous';
    var owner=String(c.ownerEmail||c.organizerEmail||'').toLowerCase();
    var row={id:'g_'+Date.now().toString(36), campaignId:c.id, code:c.code||c.id, title:c.title, ownerEmail:owner, donor:donor, amount:amount, note:String(payload.note||'').trim(), at:Date.now()};
    var gifts=load(GIFTS_KEY,[]); gifts.unshift(row); save(GIFTS_KEY,gifts);
    var saved=ensureInStorage(c.id);
    var list=load(CAMPS_KEY,[]);
    var idx=list.findIndex(function(x){return x&&x.id===c.id});
    if(idx>=0){
      list[idx].raised=(Number(list[idx].raised)||0)+amount;
      list[idx].donations=(Number(list[idx].donations)||0)+1;
      if(!Array.isArray(list[idx].donors)) list[idx].donors=[];
      list[idx].donors.unshift({name:donor,amount:amount,time:'Just now',giftId:row.id});
      save(CAMPS_KEY,list);
    }
    return {ok:true,gift:row};
  }

  function listWithdrawals(email){
    var w=load(WITHDRAW_KEY,[]); if(!Array.isArray(w)) w=[];
    if(!email) return w;
    email=email.toLowerCase();
    return w.filter(function(x){return x&&(x.email||'').toLowerCase()===email;});
  }

  function shortLink(id){
    id=String(id||'').trim();
    return (location.origin||'https://munowatchplus.watch')+'/campaign/index.html?id='+encodeURIComponent(id);
  }

  w.HF={
    USERS_KEY:USERS_KEY, SESSION_KEY:SESSION_KEY, CAMPS_KEY:CAMPS_KEY, ADMIN_EMAIL:ADMIN_EMAIL,
    users:users, session:session, setSession:setSession, isAdmin:isAdmin,
    startSignup:startSignup, confirmSignup:confirmSignup, login:login, logout:logout,
    adminUsers:adminUsers,
    setUserAvatar:setUserAvatar,
    getUserAvatar:getUserAvatar,
    getAllCampaigns:getAllCampaigns, adminCampaigns:adminCampaigns, myCampaigns:myCampaigns,
    ensureInStorage:ensureInStorage, saveCampaign:saveCampaign,
    approveCampaign:approveCampaign, rejectCampaign:rejectCampaign, deleteCampaign:deleteCampaign,
    listGifts:listGifts, addGift:addGift, listWithdrawals:listWithdrawals,
    shortLink:shortLink, hash:hash
  };
})(window);
