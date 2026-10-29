/* HopeForUs core – auth, shares, withdraw, admin helpers */
(function(w){
  var USERS_KEY='hopeforus_users';
  var SESSION_KEY='hopeforus_user';
  var CAMPS_KEY='hopeforus_campaigns';
  var CLICKS_KEY='hopeforus_clicks';
  var WITHDRAW_KEY='hopeforus_withdrawals';
  var REPORTS_KEY='hopeforus_reports';
  var GIFTS_KEY='hopeforus_gifts';
  var UPDATES_KEY='hopeforus_site_updates';
  var MSGS_KEY='hopeforus_messages';
  var ACTIVITY_KEY='hopeforus_activity';
  var WHATSAPP='447446315764';
  var WHATSAPP_USER='hopeforus1';
  var SUPPORT_EMAIL='admin@hopeforus.com';
  var ADMIN_EMAIL='admin@hopeforus.com';
  var ADMIN_PASS='Admin@2026';

  function load(k,fb){try{var v=JSON.parse(localStorage.getItem(k));return v==null?fb:v;}catch(e){return fb;}}
  function save(k,v){localStorage.setItem(k,JSON.stringify(v));}
  function hash(s){var h=0,i,c;s=String(s||'');for(i=0;i<s.length;i++){c=s.charCodeAt(i);h=((h<<5)-h)+c;h=h&h;}return 'h'+Math.abs(h).toString(16);}

  function users(){return load(USERS_KEY,[])}
  function saveUsers(u){save(USERS_KEY,u)}

  function logActivity(email, action, detail){
    var list=load(ACTIVITY_KEY,[]); if(!Array.isArray(list)) list=[];
    list.unshift({id:'a_'+Date.now().toString(36), email:(email||'').toLowerCase(), action:action||'', detail:detail||'', at:Date.now()});
    if(list.length>500) list=list.slice(0,500);
    save(ACTIVITY_KEY,list);
  }
  function listActivity(email){
    var list=load(ACTIVITY_KEY,[]); if(!Array.isArray(list)) list=[];
    if(!email) return list;
    email=email.toLowerCase();
    return list.filter(function(x){return x&&(x.email||'')===email;});
  }

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
    } else {
      list.forEach(function(x){
        if(x && x.email===ADMIN_EMAIL){
          x.pass=hash(ADMIN_PASS); x.isAdmin=true; x.verified=true;
          if(!x.name) x.name='Admin';
        }
      });
      changed=true;
    }
    addUser({id:'u_ijoga',email:'ijogasadiq11@gmail.com',name:'Sadiq Ijoga',pass:hash('ChangeMe@2026'),whatsapp:'447446315764',verified:true,isAdmin:false,created:Date.now()-86400000*3,donors:[],chats:[],clicks:0,avatar:''});
    addUser({id:'u_dollar',email:'dollarprince@gmail.com',name:'Dollar Prince',pass:hash('ChangeMe@2026'),verified:true,isAdmin:false,created:Date.now()-86400000*2,donors:[],chats:[],clicks:0,avatar:''});
    addUser({id:'u_dollar2',email:'dollarprince@hopeforus.com',name:'Dollar Prince',pass:hash('ChangeMe@2026'),verified:true,isAdmin:false,created:Date.now()-86400000*2,donors:[],chats:[],clicks:0,avatar:''});
    list.forEach(function(x){
      if(!x||!x.email) return;
      if(x.email==='ijogasadiq11@gmail.com' && !x.whatsapp){ x.whatsapp='447446315764'; changed=true; }
    });
    if(changed) saveUsers(list);
  }
  ensureAdmin();

  function isAdmin(){var u=session();return !!(u&&u.isAdmin);}

  function normalizeWhatsApp(raw){
    var s=String(raw||'').trim().replace(/[\s()-]/g,'');
    if(s.charAt(0)==='+') s=s.slice(1);
    if(!/^\d{8,15}$/.test(s)) return null;
    return s;
  }
  function startSignup(name,email,password,whatsapp){
    email=(email||'').toLowerCase().trim();
    if(!name||!email||!password||password.length<6) return {ok:false,err:'Name, email and password (6+ chars) required'};
    var wa=normalizeWhatsApp(whatsapp);
    if(!wa) return {ok:false,err:'Enter a valid WhatsApp number (with country code, digits only)'};
    var list=users();
    if(list.some(function(x){return x.email===email})) return {ok:false,err:'Email already registered'};
    var code=String(Math.floor(100000+Math.random()*900000));
    var pending={name:name.trim(),email:email,pass:hash(password),whatsapp:wa,code:code,ts:Date.now()};
    sessionStorage.setItem('hopeforus_pending',JSON.stringify(pending));
    return {ok:true,code:code,email:email};
  }
  function confirmSignup(code){
    var pending;try{pending=JSON.parse(sessionStorage.getItem('hopeforus_pending')||'null');}catch(e){pending=null;}
    if(!pending||String(pending.code)!==String(code)) return {ok:false,err:'Invalid code'};
    if(Date.now()-pending.ts>30*60*1000) return {ok:false,err:'Code expired'};
    var list=users();
    if(list.some(function(x){return x.email===pending.email})) return {ok:false,err:'Email already registered'};
    var u={id:'u_'+Date.now().toString(36),email:pending.email,name:pending.name,pass:pending.pass,whatsapp:pending.whatsapp||'',verified:true,isAdmin:false,created:Date.now(),donors:[],chats:[],clicks:0,avatar:''};
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

  function updateProfile(payload){
    var sess=session(); if(!sess) return {ok:false,err:'Not signed in'};
    var list=users();
    var u=list.find(function(x){return x && x.email===sess.email});
    if(!u) return {ok:false,err:'Account not found'};
    var name=String(payload.name||'').trim();
    if(!name) return {ok:false,err:'Enter a display name'};
    u.name=name;
    try{
      var camps=load(CAMPS_KEY,[]);
      if(Array.isArray(camps)){
        var em=u.email.toLowerCase();
        camps.forEach(function(c){
          if(!c) return;
          if((c.ownerEmail||'').toLowerCase()===em || (c.organizerEmail||'').toLowerCase()===em || c.ownerId===u.id){
            c.organizer=name;
          }
        });
        save(CAMPS_KEY,camps);
      }
    }catch(e){}
    saveUsers(list);
    setSession(u);
    logActivity(u.email,'name_change','Display name set to '+name);
    return {ok:true,user:u};
  }

  function changePassword(currentPass, newPass){
    var sess=session(); if(!sess) return {ok:false,err:'Not signed in'};
    if(!newPass || String(newPass).length<6) return {ok:false,err:'New password must be 6+ characters'};
    var list=users();
    var u=list.find(function(x){return x && x.email===sess.email});
    if(!u) return {ok:false,err:'Account not found'};
    if(u.email===ADMIN_EMAIL) return {ok:false,err:'Admin password is fixed and cannot be changed here'};
    if(u.pass!==hash(currentPass)) return {ok:false,err:'Current password is wrong'};
    u.pass=hash(newPass);
    saveUsers(list);
    logActivity(u.email,'password_change','Password updated');
    return {ok:true};
  }

  function changeEmail(newEmail, password){
    var sess=session(); if(!sess) return {ok:false,err:'Not signed in'};
    newEmail=String(newEmail||'').toLowerCase().trim();
    if(!newEmail || newEmail.indexOf('@')<1) return {ok:false,err:'Enter a valid email'};
    var list=users();
    var u=list.find(function(x){return x && x.email===sess.email});
    if(!u) return {ok:false,err:'Account not found'};
    if(u.email===ADMIN_EMAIL) return {ok:false,err:'Admin email is fixed and cannot be changed'};
    if(u.pass!==hash(password)) return {ok:false,err:'Password is wrong'};
    if(list.some(function(x){return x && x.email===newEmail && x.id!==u.id})) return {ok:false,err:'That email is already registered'};
    var oldEmail=u.email;
    u.email=newEmail;
    try{
      var av=localStorage.getItem('hf_avatar_'+oldEmail);
      if(av){ localStorage.setItem('hf_avatar_'+newEmail, av); localStorage.removeItem('hf_avatar_'+oldEmail); }
    }catch(e){}
    try{
      var camps=load(CAMPS_KEY,[]);
      if(Array.isArray(camps)){
        camps.forEach(function(c){
          if(!c) return;
          if((c.ownerEmail||'').toLowerCase()===oldEmail) c.ownerEmail=newEmail;
          if((c.organizerEmail||'').toLowerCase()===oldEmail) c.organizerEmail=newEmail;
        });
        save(CAMPS_KEY,camps);
      }
    }catch(e){}
    saveUsers(list);
    setSession(u);
    logActivity(newEmail,'email_change','Email changed from '+oldEmail);
    return {ok:true,user:u};
  }

  function setWhatsApp(number){
    var sess=session(); if(!sess) return {ok:false,err:'Not signed in'};
    var wa=normalizeWhatsApp(number);
    if(!wa) return {ok:false,err:'Enter a valid WhatsApp number (country code + digits)'};
    var list=users();
    var u=list.find(function(x){return x && x.email===sess.email});
    if(!u) return {ok:false,err:'Account not found'};
    u.whatsapp=wa;
    saveUsers(list);
    logActivity(u.email,'whatsapp_change','WhatsApp set to +'+wa);
    return {ok:true,whatsapp:wa};
  }

  function logout(){setSession(null);}

  function adminUsers(){
    var byEmail={};
    users().forEach(function(u){
      if(!u||!u.email) return;
      byEmail[u.email]={id:u.id,email:u.email,name:u.name||'',whatsapp:u.whatsapp||'',verified:!!u.verified,isAdmin:!!u.isAdmin,created:u.created||0,donors:(u.donors||[]).length,chats:(u.chats||[]).length,avatar:u.avatar||''};
    });
    try{
      var camps=load(CAMPS_KEY,[]);
      if(Array.isArray(camps)) camps.forEach(function(c){
        if(!c) return;
        var em=(c.ownerEmail||c.organizerEmail||'').toLowerCase().trim();
        if(!em) return;
        if(!byEmail[em]){
          byEmail[em]={id:c.ownerId||('camp_'+c.id),email:em,name:c.organizer||em.split('@')[0],whatsapp:'',verified:true,isAdmin:false,created:Date.parse(c.createdAt||c.created||'')||Date.now(),donors:0,chats:0,avatar:c.organizerAvatar||c.ownerAvatar||''};
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
    var gifts=load(GIFTS_KEY,[]); if(!Array.isArray(gifts)) gifts=[]; gifts.unshift(row); save(GIFTS_KEY,gifts);
    ensureInStorage(c.id);
    var list=load(CAMPS_KEY,[]); if(!Array.isArray(list)) list=[];
    var idx=list.findIndex(function(x){return x&&x.id===c.id});
    if(idx<0){ list.unshift(Object.assign({},c)); idx=0; }
    list[idx].raised=(Number(list[idx].raised)||0)+amount;
    list[idx].donations=(Number(list[idx].donations)||0)+1;
    if(!Array.isArray(list[idx].donors)) list[idx].donors=[];
    list[idx].donors.unshift({name:donor,amount:amount,time:'Just now',giftId:row.id});
    save(CAMPS_KEY,list);
    try{
      if(window.HFDB){
        var raised=Number(list[idx].raised)||0;
        var donations=Number(list[idx].donations)||0;
        if(HFDB.update) HFDB.update(c.id, {raised:raised, donations:donations}).catch(function(){});
        if(HFDB.publishDonors) HFDB.publishDonors(c.id, list[idx].donors).catch(function(){});
        if(HFDB.save) HFDB.save(Object.assign({}, list[idx])).catch(function(){});
      }
    }catch(e){}
    return {ok:true,gift:row};
  }

  function listWithdrawals(email){
    var w=load(WITHDRAW_KEY,[]); if(!Array.isArray(w)) w=[];
    if(!email) return w;
    email=email.toLowerCase();
    return w.filter(function(x){return x&&(x.email||'').toLowerCase()===email;});
  }
  function requestWithdrawal(payload){
    var sess=session(); if(!sess) return {ok:false,err:'Sign in first'};
    var amount=parseFloat(payload.amount);
    if(!(amount>0)) return {ok:false,err:'Enter an amount'};
    var method=String(payload.method||'usdt').trim();
    var address=String(payload.address||payload.details||'').trim();
    if(!address) return {ok:false,err:'Enter payout details'};
    var row={id:'w_'+Date.now().toString(36), email:sess.email.toLowerCase(), name:sess.name||sess.email, amount:amount, method:method, address:address, status:'pending', reason:'', at:Date.now(), processedAt:null};
    var list=load(WITHDRAW_KEY,[]); if(!Array.isArray(list)) list=[];
    list.unshift(row); save(WITHDRAW_KEY,list);
    logActivity(sess.email,'withdraw_request','Requested $'+amount+' via '+method);
    return {ok:true,withdrawal:row};
  }
  function processWithdrawal(id, status, reason){
    var sess=session(); if(!sess||!sess.isAdmin) return {ok:false,err:'Admin only'};
    status=String(status||'').toLowerCase();
    if(status!=='completed'&&status!=='rejected') return {ok:false,err:'Use completed or rejected'};
    var list=load(WITHDRAW_KEY,[]); if(!Array.isArray(list)) list=[];
    var w=list.find(function(x){return x&&x.id===id});
    if(!w) return {ok:false,err:'Request not found'};
    w.status=status; w.reason=String(reason||'').trim(); w.processedAt=Date.now(); w.processedBy=sess.email;
    save(WITHDRAW_KEY,list);
    logActivity(w.email,'withdraw_'+status,(status==='completed'?'Paid':'Rejected')+' $'+w.amount+(w.reason?' — '+w.reason:''));
    try{
      var ups=load(UPDATES_KEY,[]); if(!Array.isArray(ups)) ups=[];
      ups.unshift({id:'u_'+Date.now().toString(36), title:status==='completed'?'Withdrawal completed':'Withdrawal update', body:status==='completed'?('Your withdrawal of $'+Number(w.amount).toLocaleString()+' was completed.'+(w.reason?' Note: '+w.reason:'')):('Your withdrawal of $'+Number(w.amount).toLocaleString()+' was rejected.'+(w.reason?' Reason: '+w.reason:'')), audience:w.email, at:Date.now()});
      save(UPDATES_KEY,ups);
    }catch(e){}
    return {ok:true,withdrawal:w};
  }

  function postUpdate(title, body, audience){
    var sess=session(); if(!sess||!sess.isAdmin) return {ok:false,err:'Admin only'};
    title=String(title||'').trim(); body=String(body||'').trim();
    if(!title||!body) return {ok:false,err:'Title and message required'};
    var list=load(UPDATES_KEY,[]); if(!Array.isArray(list)) list=[];
    var row={id:'u_'+Date.now().toString(36), title:title, body:body, audience:audience||'all', at:Date.now(), by:sess.email};
    list.unshift(row); save(UPDATES_KEY,list);
    return {ok:true,update:row};
  }
  function listUpdates(forEmail){
    var list=load(UPDATES_KEY,[]); if(!Array.isArray(list)) list=[];
    if(!forEmail) return list;
    forEmail=forEmail.toLowerCase();
    return list.filter(function(x){ if(!x) return false; var a=(x.audience||'all'); return a==='all'||a===forEmail; });
  }

  function sendMessage(text){
    var sess=session(); if(!sess) return {ok:false,err:'Sign in first'};
    text=String(text||'').trim();
    if(!text) return {ok:false,err:'Write a message'};
    var list=load(MSGS_KEY,[]); if(!Array.isArray(list)) list=[];
    var row={id:'m_'+Date.now().toString(36), from:sess.email, name:sess.name||sess.email, text:text, at:Date.now(), read:false};
    list.unshift(row); save(MSGS_KEY,list);
    logActivity(sess.email,'message','Sent support message');
    return {ok:true,message:row};
  }
  function listMessages(){
    var sess=session(); if(!sess) return [];
    var list=load(MSGS_KEY,[]); if(!Array.isArray(list)) list=[];
    if(sess.isAdmin) return list;
    return list.filter(function(x){return x&&x.from===sess.email;});
  }

  function adminUserDetail(email){
    email=(email||'').toLowerCase();
    var list=users();
    var u=list.find(function(x){return x&&x.email===email})||{email:email,name:email.split('@')[0]};
    var camps=getAllCampaigns().filter(function(c){
      return c&&((c.ownerEmail||'').toLowerCase()===email||(c.organizerEmail||'').toLowerCase()===email);
    });
    var raised=camps.reduce(function(n,c){return n+(Number(c.raised)||0);},0);
    var wds=listWithdrawals(email);
    var pendingWithdraw=wds.filter(function(w){return w.status==='pending';}).reduce(function(n,w){return n+(Number(w.amount)||0);},0);
    var completedWithdraw=wds.filter(function(w){return w.status==='completed';}).reduce(function(n,w){return n+(Number(w.amount)||0);},0);
    return {
      user:u, camps:camps, raised:raised, withdrawals:wds,
      pendingWithdraw:pendingWithdraw, completedWithdraw:completedWithdraw,
      activity:listActivity(email), gifts:listGifts(email)
    };
  }

  function whatsappLink(text){
    var t=encodeURIComponent(text||'Hi HopeForUs support');
    return 'https://wa.me/'+WHATSAPP+'?text='+t;
  }
  function shortLink(id){
    return location.origin+'/campaign/index.html?id='+encodeURIComponent(id);
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
    approveCampaign:approveCampaign, rejectCampaign:rejectCampaign, deleteCampaign:deleteCampaign,
    listGifts:listGifts, addGift:addGift,
    listWithdrawals:listWithdrawals, requestWithdrawal:requestWithdrawal, processWithdrawal:processWithdrawal,
    postUpdate:postUpdate, listUpdates:listUpdates,
    sendMessage:sendMessage, listMessages:listMessages,
    whatsappLink:whatsappLink, normalizeWhatsApp:normalizeWhatsApp,
    listActivity:listActivity, logActivity:logActivity,
    shortLink:shortLink, hash:hash
  };
})(window);
