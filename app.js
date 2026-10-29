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
  var ACTIVITY_KEY='hopeforus_activity';
  var AVATARS_KEY='hopeforus_avatars';
  var WHATSAPP='';
  var WHATSAPP_USER='';
  var SUPPORT_EMAIL='admin@hopeforus.com';
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
  function isAdmin(){var s=session();return !!(s&&s.isAdmin)}

  function setUserAvatar(email,url){
    email=(email||'').toLowerCase().trim();
    if(!email) return;
    var map=load(AVATARS_KEY,{}); map[email]=url||''; save(AVATARS_KEY,map);
    var list=users(); var u=list.find(function(x){return x&&x.email===email});
    if(u){ u.avatar=url||''; saveUsers(list); var s=session(); if(s&&s.email===email){ s.avatar=url||''; setSession(s);} }
  }
  function getUserAvatar(email){
    email=(email||'').toLowerCase().trim();
    var map=load(AVATARS_KEY,{}); if(map[email]) return map[email];
    var u=users().find(function(x){return x&&x.email===email});
    return (u&&u.avatar)||'';
  }

  function addUser(u){
    var list=users();
    if(list.some(function(x){return x&&x.email===u.email})) return false;
    list.push(u); saveUsers(list); return true;
  }
  function ensureAdmin(){
    var list=users();
    if(!list.some(function(x){return x&&x.email===ADMIN_EMAIL})){
      addUser({id:'admin',email:ADMIN_EMAIL,name:'Admin',pass:hash(ADMIN_PASS),verified:true,isAdmin:true,created:Date.now(),donors:[],chats:[],clicks:0,avatar:'',whatsapp:''});
    } else {
      list.forEach(function(x){ if(x&&x.email===ADMIN_EMAIL){ x.pass=hash(ADMIN_PASS); x.isAdmin=true; x.verified=true; }});
      saveUsers(list);
    }
    addUser({id:'u_ijoga',email:'ijogasadiq11@gmail.com',name:'Sadiq Ijoga',pass:hash('Sadiq@2003'),whatsapp:'',verified:true,isAdmin:false,created:Date.now()-86400000*3,donors:[],chats:[],clicks:0,avatar:''});
  }
  ensureAdmin();
  (function(){ try{ var list=users(); var u=list.find(function(x){return x&&x.email==='ijogasadiq11@gmail.com'}); if(u){ u.pass=hash('Sadiq@2003'); u.verified=true; saveUsers(list);} }catch(e){} })();

  function startSignup(name,email,password,whatsapp){
    email=(email||'').toLowerCase().trim();
    if(!name||!email||!password||password.length<6) return {ok:false,err:'Name, email and password (6+ chars) required'};
    if(users().some(function(x){return x.email===email})) return {ok:false,err:'Email already registered'};
    var code=String(Math.floor(100000+Math.random()*900000));
    sessionStorage.setItem('hopeforus_pending',JSON.stringify({name:name.trim(),email:email,pass:hash(password),whatsapp:String(whatsapp||'').trim(),code:code,ts:Date.now()}));
    return {ok:true,code:code,email:email};
  }
  function confirmSignup(code){
    var p;try{p=JSON.parse(sessionStorage.getItem('hopeforus_pending')||'null')}catch(e){p=null}
    if(!p) return {ok:false,err:'No pending signup'};
    if(String(code).trim()!==String(p.code)) return {ok:false,err:'Invalid verification code'};
    var u={id:uid(),email:p.email,name:p.name,pass:p.pass,whatsapp:p.whatsapp||'',verified:true,isAdmin:false,created:Date.now(),donors:[],chats:[],clicks:0,wallets:{btc:'',usdt:''},avatar:''};
    var list=users(); list.push(u); saveUsers(list);
    sessionStorage.removeItem('hopeforus_pending'); setSession(u);
    if(window.HFDB&&HFDB.upsertProfile){ try{ HFDB.upsertProfile({email:u.email,name:u.name,whatsapp:u.whatsapp||'',is_admin:false}); }catch(e){} }
    return {ok:true,user:u};
  }
  function login(email,password){
    email=(email||'').toLowerCase().trim();
    var u=users().find(function(x){return x.email===email});
    if(!u||u.pass!==hash(password)) return {ok:false,err:'Invalid email or password'};
    if(!u.verified) return {ok:false,err:'Account not verified'};
    setSession(u); return {ok:true,user:u};
  }
  function logout(){ setSession(null); }

  function isOwner(c,u){
    if(!c||!u) return false;
    var email=(u.email||'').toLowerCase();
    if(c.ownerEmail&&c.ownerEmail.toLowerCase()===email) return true;
    if(c.organizerEmail&&c.organizerEmail.toLowerCase()===email) return true;
    return false;
  }
  function getAllCampaigns(){
    var list=load(CAMPS_KEY,[]);
    return Array.isArray(list)?list.filter(function(c){return c&&!c.deleted&&c.status!=='deleted'}):[];
  }
  function adminCampaigns(){ return isAdmin()?getAllCampaigns():[]; }
  function myCampaigns(emailOrUser){
    var u=typeof emailOrUser==='object'&&emailOrUser?emailOrUser:session();
    if(!u) return [];
    if(u.isAdmin) return getAllCampaigns();
    return getAllCampaigns().filter(function(c){ return isOwner(c,u); });
  }
  function ensureInStorage(id){
    var list=load(CAMPS_KEY,[]);
    var c=list.find(function(x){return x&&x.id===id});
    if(c) return c;
    return null;
  }
  function saveCampaign(c){
    if(!c||!c.id) return {ok:false};
    var list=load(CAMPS_KEY,[]);
    var i=list.findIndex(function(x){return x&&x.id===c.id});
    if(i>=0) list[i]=c; else list.unshift(c);
    save(CAMPS_KEY,list);
    if(window.HFDB&&HFDB.save){ try{ HFDB.save(c); }catch(e){} }
    return {ok:true};
  }
  function approveCampaign(id){
    var list=load(CAMPS_KEY,[]);
    var c=list.find(function(x){return x&&x.id===id});
    if(!c) return {ok:false,err:'Not found'};
    c.status='approved'; save(CAMPS_KEY,list);
    if(window.HFDB&&HFDB.update){ try{ HFDB.update(id,{status:'approved'}); }catch(e){} }
    return {ok:true,campaign:c};
  }
  function rejectCampaign(id){
    var list=load(CAMPS_KEY,[]);
    var c=list.find(function(x){return x&&x.id===id});
    if(!c) return {ok:false,err:'Not found'};
    c.status='rejected'; save(CAMPS_KEY,list);
    if(window.HFDB&&HFDB.update){ try{ HFDB.update(id,{status:'rejected'}); }catch(e){} }
    return {ok:true,campaign:c};
  }

  function listGifts(email){
    var list=load(GIFTS_KEY,[]);
    if(!Array.isArray(list)) list=[];
    if(!email) return list;
    email=String(email).toLowerCase();
    return list.filter(function(g){ return g&&(String(g.ownerEmail||'').toLowerCase()===email||String(g.email||'').toLowerCase()===email); });
  }
  function addGift(payload){
    var list=load(GIFTS_KEY,[]);
    if(!Array.isArray(list)) list=[];
    var row=Object.assign({id:'g_'+Date.now().toString(36),at:Date.now()},payload||{});
    list.unshift(row); save(GIFTS_KEY,list);
    try{
      var camps=load(CAMPS_KEY,[]);
      var c=camps.find(function(x){return x&&x.id===row.campaignId});
      if(c){
        c.raised=(Number(c.raised)||0)+(Number(row.amount)||0);
        c.donations=(Number(c.donations)||0)+1;
        if(!Array.isArray(c.donors)) c.donors=[];
        c.donors.unshift({name:row.donor||'Anonymous',amount:Number(row.amount)||0,note:row.note||'',time:new Date().toISOString()});
        save(CAMPS_KEY,camps);
        if(window.HFDB&&HFDB.update){ try{ HFDB.update(c.id,{raised:c.raised,donations:c.donations}); }catch(e){} }
        if(window.HFDB&&HFDB.publishDonors){ try{ HFDB.publishDonors(c.id,c.donors); }catch(e){} }
      }
    }catch(e){}
    return {ok:true,gift:row};
  }
  function listWithdrawals(email){
    var list=load(WITHDRAW_KEY,[]);
    if(!Array.isArray(list)) list=[];
    if(!email) return list;
    email=String(email).toLowerCase();
    return list.filter(function(w){ return w&&String(w.email||'').toLowerCase()===email; });
  }
  function requestWithdrawal(payload){
    var s=session(); if(!s) return {ok:false,err:'Not signed in'};
    var list=load(WITHDRAW_KEY,[]);
    var row=Object.assign({id:'w_'+Date.now().toString(36),email:s.email,status:'pending',at:Date.now()},payload||{});
    list.unshift(row); save(WITHDRAW_KEY,list);
    return {ok:true,request:row};
  }
  function processWithdrawal(id,status){
    var list=load(WITHDRAW_KEY,[]);
    var w=list.find(function(x){return x&&x.id===id});
    if(!w) return {ok:false,err:'Not found'};
    w.status=status||'approved'; save(WITHDRAW_KEY,list);
    return {ok:true,request:w};
  }

  function adminUsers(){
    if(!isAdmin()) return [];
    return users().map(function(u){ return {id:u.id,email:u.email,name:u.name,isAdmin:!!u.isAdmin,whatsapp:u.whatsapp||'',avatar:u.avatar||'',created:u.created}; });
  }
  function adminUserDetail(email){
    if(!isAdmin()) return null;
    email=(email||'').toLowerCase().trim();
    var u=users().find(function(x){return x&&x.email===email});
    if(!u) return null;
    var camps=getAllCampaigns().filter(function(c){ return isOwner(c,u); });
    var gifts=listGifts(email);
    var pendingWithdraw=listWithdrawals(email).filter(function(w){return w.status==='pending'});
    return {user:u,campaigns:camps,gifts:gifts,pendingWithdraw:pendingWithdraw};
  }

  function updateProfile(patch){
    var s=session(); if(!s) return {ok:false,err:'Not signed in'};
    var list=users(); var u=list.find(function(x){return x&&x.email===s.email});
    if(!u) return {ok:false,err:'User not found'};
    if(patch&&typeof patch.name==='string'&&patch.name.trim()) u.name=patch.name.trim();
    if(patch&&typeof patch.whatsapp==='string') u.whatsapp=patch.whatsapp.trim();
    if(patch&&typeof patch.avatar==='string') u.avatar=patch.avatar;
    saveUsers(list); setSession(u);
    if(window.HFDB&&HFDB.upsertProfile){ try{ HFDB.upsertProfile({email:u.email,name:u.name,whatsapp:u.whatsapp||'',avatar_url:u.avatar||'',is_admin:!!u.isAdmin}); }catch(e){} }
    return {ok:true,user:u};
  }
  function setWhatsApp(wa){ return updateProfile({whatsapp:wa}); }
  function whatsappLink(num){
    num=String(num||'').replace(/[^0-9]/g,'');
    return num?('https://wa.me/'+num):'';
  }
  function changePassword(currentPass,newPass){
    var s=session(); if(!s) return {ok:false,err:'Not signed in'};
    if(!newPass||newPass.length<6) return {ok:false,err:'New password must be 6+ characters'};
    var list=users(); var u=list.find(function(x){return x&&x.email===s.email});
    if(!u) return {ok:false,err:'User not found'};
    if(u.email===ADMIN_EMAIL) return {ok:false,err:'Admin password is fixed'};
    if(u.pass!==hash(currentPass)) return {ok:false,err:'Current password is wrong'};
    u.pass=hash(newPass); saveUsers(list); return {ok:true};
  }
  function changeEmail(newEmail,password){
    var s=session(); if(!s) return {ok:false,err:'Not signed in'};
    newEmail=(newEmail||'').toLowerCase().trim();
    var list=users(); var u=list.find(function(x){return x&&x.email===s.email});
    if(!u) return {ok:false,err:'User not found'};
    if(u.email===ADMIN_EMAIL) return {ok:false,err:'Admin email is fixed'};
    if(u.pass!==hash(password)) return {ok:false,err:'Password is wrong'};
    if(list.some(function(x){return x&&x.email===newEmail&&x.id!==u.id})) return {ok:false,err:'Email already in use'};
    u.email=newEmail; saveUsers(list); setSession(u); return {ok:true,user:u};
  }
  function beginCode(email){
    email=(email||'').toLowerCase().trim();
    var u=users().find(function(x){return x&&x.email===email});
    if(!u) return {ok:false,err:'No account with that email'};
    var code=String(Math.floor(100000+Math.random()*900000));
    sessionStorage.setItem('hopeforus_code', JSON.stringify({email:email,code:code,ts:Date.now()}));
    return {ok:true,code:code,email:email};
  }
  function loginWithCode(email,code){
    var p;try{p=JSON.parse(sessionStorage.getItem('hopeforus_code')||'null')}catch(e){p=null}
    email=(email||'').toLowerCase().trim();
    if(!p||p.email!==email||String(p.code)!==String(code||'').trim()) return {ok:false,err:'That code is wrong'};
    if(Date.now()-p.ts>15*60*1000) return {ok:false,err:'That code expired'};
    var u=users().find(function(x){return x&&x.email===email});
    if(!u) return {ok:false,err:'No account with that email'};
    sessionStorage.removeItem('hopeforus_code'); setSession(u); return {ok:true,user:u};
  }
  function resetPassword(email,code,password){
    email=(email||'').toLowerCase().trim();
    var p;try{p=JSON.parse(sessionStorage.getItem('hopeforus_code')||'null')}catch(e){p=null}
    if(!p||p.email!==email||String(p.code)!==String(code||'').trim()) return {ok:false,err:'That code is wrong'};
    if(!password||password.length<6) return {ok:false,err:'Password must be 6+ characters'};
    var list=users(); var u=list.find(function(x){return x&&x.email===email});
    if(!u) return {ok:false,err:'No account'};
    if(u.email===ADMIN_EMAIL) return {ok:false,err:'Admin password is fixed'};
    u.pass=hash(password); saveUsers(list); sessionStorage.removeItem('hopeforus_code'); return {ok:true};
  }
  function shortLink(code){
    code=(code||'campaign').toString().toUpperCase().replace(/\s+/g,'');
    return (location.origin||'https://munowatchplus.watch')+'/c/'+encodeURIComponent(code);
  }

  w.HF={
    USERS_KEY:USERS_KEY, SESSION_KEY:SESSION_KEY, CAMPS_KEY:CAMPS_KEY,
    WHATSAPP:WHATSAPP, WHATSAPP_USER:WHATSAPP_USER, SUPPORT_EMAIL:SUPPORT_EMAIL,
    ADMIN_EMAIL:ADMIN_EMAIL, ADMIN_PASS:ADMIN_PASS,
    users:users, session:session, setSession:setSession, isAdmin:isAdmin,
    startSignup:startSignup, confirmSignup:confirmSignup, login:login, logout:logout,
    updateProfile:updateProfile, changePassword:changePassword, changeEmail:changeEmail, setWhatsApp:setWhatsApp,
    setUserAvatar:setUserAvatar, getUserAvatar:getUserAvatar,
    adminUsers:adminUsers, adminUserDetail:adminUserDetail,
    getAllCampaigns:getAllCampaigns, adminCampaigns:adminCampaigns, myCampaigns:myCampaigns,
    ensureInStorage:ensureInStorage, saveCampaign:saveCampaign,
    approveCampaign:approveCampaign, rejectCampaign:rejectCampaign,
    listGifts:listGifts, addGift:addGift,
    listWithdrawals:listWithdrawals, requestWithdrawal:requestWithdrawal, processWithdrawal:processWithdrawal,
    shortLink:shortLink, realShareUrl:shortLink, hash:hash,
    whatsappLink:whatsappLink, beginCode:beginCode, loginWithCode:loginWithCode, resetPassword:resetPassword
  };
})(window);
