/* HopeForUs core – auth, shares, withdraw, admin helpers */
(function(w){
  var USERS_KEY='hopeforus_users';
  var SESSION_KEY='hopeforus_user';
  var CAMPS_KEY='hopeforus_campaigns';
  var CLICKS_KEY='hopeforus_clicks';
  var WITHDRAW_KEY='hopeforus_withdrawals';
  var REPORTS_KEY='hopeforus_reports';
  var GIFTS_KEY='hopeforus_gifts';
  var NOTICES_KEY='hopeforus_notices';
  var UPDATES_KEY='hopeforus_updates';
  var MESSAGES_KEY='hopeforus_messages';
  var SUPPORT_WA='';
  var SUPPORT_TG='hopeforus1';
  var ADMIN_EMAIL='admin@hopeforus.com';
  var ADMIN_PASS='Admin@2026';

  function load(k,d){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(e){return d}}
  function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  function hash(s){var h=0,i,c;s=String(s||'');for(i=0;i<s.length;i++){c=s.charCodeAt(i);h=((h<<5)-h)+c;h=h&h;}return 'h'+Math.abs(h).toString(16);}
  function uid(){return 'u_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
  function users(){return load(USERS_KEY,[])}
  function saveUsers(u){save(USERS_KEY,u)}
  function session(){return load(SESSION_KEY,null)}
  function setSession(u){if(u)save(SESSION_KEY,{id:u.id,email:u.email,name:u.name,isAdmin:!!u.isAdmin,avatar:u.avatar||'',whatsapp:u.whatsapp||''});else localStorage.removeItem(SESSION_KEY)}

  function addUser(u){
    var list=users();
    if(list.some(function(x){return x&&x.email===u.email})) return false;
    list.push(u); saveUsers(list); return true;
  }

  function ensureAdmin(){
    var list=users();
    function addIfMissing(u){
      if(!list.some(function(x){return x&&x.email===u.email})){ list.push(u); }
    }
    if(!list.some(function(x){return x.email===ADMIN_EMAIL})){
      addUser({id:'admin',email:ADMIN_EMAIL,name:'Admin',pass:hash(ADMIN_PASS),verified:true,isAdmin:true,created:Date.now(),donors:[],chats:[],clicks:0,avatar:'',whatsapp:''});
    } else {
      list.forEach(function(x){
        if(x && x.email===ADMIN_EMAIL){
          x.pass=hash(ADMIN_PASS); x.isAdmin=true; x.verified=true;
        }
      });
      saveUsers(list);
    }
    list=users();
    addUser({id:'u_ijoga',email:'ijogasadiq11@gmail.com',name:'Sadiq Ijoga',pass:hash('Sadiq@2003'),whatsapp:'',verified:true,isAdmin:false,created:Date.now()-86400000*3,donors:[],chats:[],clicks:0,avatar:''});
    addUser({id:'u_dollar',email:'dollarprince@gmail.com',name:'Dollar Prince',pass:hash('ChangeMe@2026'),whatsapp:'',verified:true,isAdmin:false,created:Date.now()-86400000*2,donors:[],chats:[],clicks:0,avatar:''});
    addUser({id:'u_dollar2',email:'dollarprince@hopeforus.com',name:'Dollar Prince',pass:hash('ChangeMe@2026'),whatsapp:'',verified:true,isAdmin:false,created:Date.now()-86400000*2,donors:[],chats:[],clicks:0,avatar:''});
  }
  ensureAdmin();
  (function forceIjogaPass(){
    try{
      var list=users();
      var u=list.find(function(x){return x&&x.email==='ijogasadiq11@gmail.com'});
      if(u){ u.pass=hash('Sadiq@2003'); u.verified=true; if(!u.name) u.name='Sadiq Ijoga'; saveUsers(list); }
      else { addUser({id:'u_ijoga',email:'ijogasadiq11@gmail.com',name:'Sadiq Ijoga',pass:hash('Sadiq@2003'),whatsapp:'',verified:true,isAdmin:false,created:Date.now(),donors:[],chats:[],clicks:0,avatar:''}); }
    }catch(e){}
  })();

  function startSignup(name,email,password,whatsapp){
    email=(email||'').toLowerCase().trim();
    var wa=String(whatsapp||'').trim();
    if(!name||!email||!password||password.length<6) return {ok:false,err:'Name, email and password (6+ chars) required'};
    var list=users();
    if(list.some(function(x){return x.email===email})) return {ok:false,err:'Email already registered'};
    var code=String(Math.floor(100000+Math.random()*900000));
    var pending={name:name.trim(),email:email,pass:hash(password),whatsapp:wa,code:code,ts:Date.now()};
    sessionStorage.setItem('hopeforus_pending',JSON.stringify(pending));
    return {ok:true,code:code,email:email};
  }
  function verifySignup(code){
    var p;try{p=JSON.parse(sessionStorage.getItem('hopeforus_pending')||'null')}catch(e){p=null}
    if(!p) return {ok:false,err:'No pending signup'};
    if(String(code).trim()!==String(p.code)) return {ok:false,err:'Invalid verification code'};
    var list=users();
    var u={id:uid(),email:p.email,name:p.name,pass:p.pass,whatsapp:p.whatsapp||'',verified:true,isAdmin:false,created:Date.now(),donors:[],chats:[],clicks:0,wallets:{btc:'',usdt:''},avatar:''};
    list.push(u);saveUsers(list);
    sessionStorage.removeItem('hopeforus_pending');
    setSession(u);
    if(window.HFDB&&HFDB.upsertProfile){ try{ HFDB.upsertProfile({email:u.email,name:u.name,whatsapp:u.whatsapp||'',is_admin:false}); }catch(e){} }
    return {ok:true,user:u};
  }
  function login(email,password){
    email=(email||'').toLowerCase().trim();
    var list=users();
    var u=list.find(function(x){return x.email===email});
    if(!u||u.pass!==hash(password)) return {ok:false,err:'Invalid email or password'};
    if(!u.verified) return {ok:false,err:'Account not verified'};
    setSession(u);
    return {ok:true,user:u};
  }
  function logout(){ setSession(null); }

  function isOwner(c,u){
    if(!c||!u) return false;
    var email=(u.email||'').toLowerCase();
    if(c.ownerEmail&&c.ownerEmail.toLowerCase()===email) return true;
    if(c.organizerEmail&&c.organizerEmail.toLowerCase()===email) return true;
    if(c.organizer&&typeof c.organizer==='string'&&c.organizer.toLowerCase()===email) return true;
    return false;
  }
  function myCampaigns(emailOrUser){
    var u=typeof emailOrUser==='object'&&emailOrUser?emailOrUser:session();
    if(!u) return [];
    var list=load(CAMPS_KEY,[]);
    if(!Array.isArray(list)) list=[];
    return list.filter(function(c){ return c&&!c.deleted&&c.status!=='deleted'&&isOwner(c,u); });
  }

  function changePassword(currentPass,newPass){
    var s=session(); if(!s) return {ok:false,err:'Not signed in'};
    if(!newPass||newPass.length<6) return {ok:false,err:'New password must be 6+ characters'};
    var list=users();
    var u=list.find(function(x){return x&&x.email===s.email});
    if(!u) return {ok:false,err:'User not found'};
    if(u.email===ADMIN_EMAIL) return {ok:false,err:'Admin password is fixed and cannot be changed here'};
    if(u.pass!==hash(currentPass)) return {ok:false,err:'Current password is wrong'};
    u.pass=hash(newPass);
    saveUsers(list);
    return {ok:true};
  }
  function changeEmail(newEmail,password){
    var s=session(); if(!s) return {ok:false,err:'Not signed in'};
    newEmail=(newEmail||'').toLowerCase().trim();
    if(!newEmail||newEmail.indexOf('@')<1) return {ok:false,err:'Enter a valid email'};
    var list=users();
    var u=list.find(function(x){return x&&x.email===s.email});
    if(!u) return {ok:false,err:'User not found'};
    if(u.email===ADMIN_EMAIL) return {ok:false,err:'Admin email is fixed and cannot be changed'};
    if(u.pass!==hash(password)) return {ok:false,err:'Password is wrong'};
    if(list.some(function(x){return x&&x.email===newEmail&&x.id!==u.id})) return {ok:false,err:'Email already in use'};
    var old=u.email;
    u.email=newEmail;
    saveUsers(list);
    setSession(u);
    try{
      var camps=load(CAMPS_KEY,[]);
      camps.forEach(function(c){
        if(!c) return;
        if((c.ownerEmail||'').toLowerCase()===old) c.ownerEmail=newEmail;
        if((c.organizerEmail||'').toLowerCase()===old) c.organizerEmail=newEmail;
      });
      save(CAMPS_KEY,camps);
    }catch(e){}
    if(window.HFDB&&HFDB.upsertProfile){ try{ HFDB.upsertProfile({email:newEmail,name:u.name,whatsapp:u.whatsapp||'',is_admin:!!u.isAdmin}); }catch(e){} }
    return {ok:true,user:u};
  }
  function updateProfile(patch){
    var s=session(); if(!s) return {ok:false,err:'Not signed in'};
    var list=users();
    var u=list.find(function(x){return x&&x.email===s.email});
    if(!u) return {ok:false,err:'User not found'};
    if(patch&&typeof patch.name==='string'&&patch.name.trim()){
      var nm=patch.name.trim();
      u.name=nm;
      try{
        var camps=load(CAMPS_KEY,[]);
        camps.forEach(function(c){
          if(c&&isOwner(c,u)) c.organizer=nm;
        });
        save(CAMPS_KEY,camps);
      }catch(e){}
    }
    if(patch&&typeof patch.whatsapp==='string') u.whatsapp=patch.whatsapp.trim();
    if(patch&&typeof patch.avatar==='string') u.avatar=patch.avatar;
    saveUsers(list);
    setSession(u);
    if(window.HFDB&&HFDB.upsertProfile){
      try{ HFDB.upsertProfile({email:u.email,name:u.name,whatsapp:u.whatsapp||'',avatar_url:u.avatar||'',is_admin:!!u.isAdmin}); }catch(e){}
    }
    return {ok:true,user:u};
  }

  function beginCode(email){
    email=(email||'').toLowerCase().trim();
    if(!email||email.indexOf('@')<1) return {ok:false,err:'Enter a valid email'};
    var list=users();
    var u=list.find(function(x){return x&&x.email===email});
    if(!u) return {ok:false,err:'No account with that email'};
    var code=String(Math.floor(100000+Math.random()*900000));
    sessionStorage.setItem('hopeforus_code', JSON.stringify({email:email, code:code, ts:Date.now()}));
    return {ok:true, code:code, email:email};
  }
  function readCode(email, code){
    var p; try{p=JSON.parse(sessionStorage.getItem('hopeforus_code')||'null')}catch(e){p=null}
    if(!p) return {ok:false, err:'No code requested'};
    if(!p||p.email!==email||String(p.code)!==String(code||'').trim()) return {ok:false, err:'That code is wrong'};
    if(Date.now()-p.ts>15*60*1000) return {ok:false, err:'That code expired. Ask for a new one'};
    return {ok:true};
  }
  function loginWithCode(email, code){
    var r=readCode(email, code); if(!r.ok) return r;
    sessionStorage.removeItem('hopeforus_code');
    var list=users();
    var u=list.find(function(x){return x&&x.email===(email||'').toLowerCase().trim()});
    if(!u) return {ok:false,err:'No account with that email'};
    setSession(u);
    return {ok:true,user:u};
  }
  function resetPassword(email, code, password){
    email=(email||'').toLowerCase().trim();
    var r=readCode(email, code); if(!r.ok) return r;
    if(!password||password.length<6) return {ok:false,err:'Password must be 6+ characters'};
    var list=users();
    var u=list.find(function(x){return x&&x.email===email});
    if(!u) return {ok:false,err:'No account with that email'};
    if(u.email===ADMIN_EMAIL) return {ok:false,err:'Admin password is fixed'};
    u.pass=hash(password);
    saveUsers(list);
    sessionStorage.removeItem('hopeforus_code');
    return {ok:true};
  }

  function shortLink(code){
    code=(code||'campaign').toString().toUpperCase().replace(/\s+/g,'');
    return (location.origin||'https://munowatchplus.watch')+'/c/'+encodeURIComponent(code);
  }
  function realShareUrl(code){return shortLink(code);}
  function trackClick(code,meta){
    code=(code||'').toString().toUpperCase();
    var all=load(CLICKS_KEY,{});
    if(!all[code]) all[code]={total:0,byCountry:{},byDay:{},recent:[]};
    all[code].total++;
    var country=(meta&&meta.country)||'Unknown';
    all[code].byCountry[country]=(all[code].byCountry[country]||0)+1;
    var day=new Date().toISOString().slice(0,10);
    all[code].byDay[day]=(all[code].byDay[day]||0)+1;
    all[code].recent.unshift({t:Date.now(),country:country,ua:(navigator.userAgent||'').slice(0,80)});
    if(all[code].recent.length>100) all[code].recent=all[code].recent.slice(0,100);
    save(CLICKS_KEY,all);
    return all[code];
  }
  function getClicks(code){var all=load(CLICKS_KEY,{});return all[(code||'').toUpperCase()]||{total:0,byCountry:{},byDay:{},recent:[]}}
  function clicksForUser(email){
    var u=session();
    var camps=u?myCampaigns(u):load(CAMPS_KEY,[]).filter(function(c){return c.ownerEmail===email||c.organizerEmail===email});
    var out=[];
    camps.forEach(function(c){var cl=getClicks(c.code||c.id);out.push({campaign:c,clicks:cl})});
    return out;
  }

  function findCampaign(id){
    id = String(id || '');
    var list = load(CAMPS_KEY,[]);
    var c = list.find(function(x){ return x && (x.id === id || String(x.code||'').toUpperCase()===id.toUpperCase()); });
    if (c) return { campaign: c, fromStorage: true };
    if (typeof SAMPLES !== 'undefined' && Array.isArray(SAMPLES)) {
      var s = SAMPLES.find(function(x){ return x && x.id === id; });
      if (s) return { campaign: Object.assign({}, s), fromStorage: false };
    }
    return null;
  }

  function deleteCampaign(id){
    var list=load(CAMPS_KEY,[]);
    var c=list.find(function(x){return x&&x.id===id});
    if(!c) return {ok:false,err:'Not found'};
    c.status='deleted'; c.deleted=true;
    save(CAMPS_KEY,list);
    if(window.HFDB&&HFDB.update){ try{ HFDB.update(id,{status:'deleted'}); }catch(e){} }
    return {ok:true};
  }

  function addGift(payload){
    var list=load(GIFTS_KEY,[]);
    if(!Array.isArray(list)) list=[];
    var row=Object.assign({id:'g_'+Date.now().toString(36),at:Date.now()},payload||{});
    list.unshift(row);
    save(GIFTS_KEY,list);
    try{
      var camps=load(CAMPS_KEY,[]);
      var c=camps.find(function(x){return x&&x.id===row.campaignId});
      if(c){
        c.raised=(Number(c.raised)||0)+(Number(row.amount)||0);
        c.donations=(Number(c.donations)||0)+1;
        if(!Array.isArray(c.donors)) c.donors=[];
        c.donors.unshift({name:row.donor||'Anonymous',amount:Number(row.amount)||0,note:row.note||'',time:new Date().toISOString()});
        save(CAMPS_KEY,camps);
        if(window.HFDB&&HFDB.update){
          try{ HFDB.update(c.id,{raised:c.raised,donations:c.donations}); }catch(e){}
        }
        if(window.HFDB&&HFDB.publishDonors){
          try{ HFDB.publishDonors(c.id,c.donors); }catch(e){}
        }
      }
    }catch(e){}
    return {ok:true,gift:row};
  }

  w.HF={
    USERS_KEY:USERS_KEY, SESSION_KEY:SESSION_KEY, CAMPS_KEY:CAMPS_KEY,
    ADMIN_EMAIL:ADMIN_EMAIL, ADMIN_PASS:ADMIN_PASS,
    SUPPORT_WA:SUPPORT_WA, SUPPORT_TG:SUPPORT_TG,
    load:load, save:save, hash:hash, users:users, session:session, setSession:setSession,
    startSignup:startSignup, verifySignup:verifySignup, login:login, logout:logout,
    isOwner:isOwner, myCampaigns:myCampaigns,
    changePassword:changePassword, changeEmail:changeEmail, updateProfile:updateProfile,
    beginCode:beginCode, loginWithCode:loginWithCode, resetPassword:resetPassword,
    shortLink:shortLink, realShareUrl:realShareUrl, trackClick:trackClick, getClicks:getClicks, clicksForUser:clicksForUser,
    findCampaign:findCampaign, deleteCampaign:deleteCampaign, addGift:addGift
  };
})(window);
