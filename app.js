/* HopeForUs core – auth, shares, withdraw, admin helpers */
(function(w){
  var USERS_KEY='hopeforus_users';
  var SESSION_KEY='hopeforus_user';
  var CAMPS_KEY='hopeforus_campaigns';
  var CLICKS_KEY='hopeforus_clicks';
  var WITHDRAW_KEY='hopeforus_withdrawals';
  var REJECTED_WD_KEY='hopeforus_rejected_wd';
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
  var SUPPORT_WA='447446315764';
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

  function notifyAdmin(subject, body){
    try{
      var cfg=window.HOPEFORUS_EMAILJS||{};
      var adminTo=cfg.reportEmail||ADMIN_EMAIL||'admin@hopeforus.com';
      if(typeof emailjs==='undefined'||!cfg.publicKey||!cfg.serviceId||!cfg.templateId||cfg.publicKey==='YOUR_PUBLIC_KEY') return false;
      if(!window.__emailjs_inited){ emailjs.init({publicKey:cfg.publicKey}); window.__emailjs_inited=true; }
      emailjs.send(cfg.serviceId, cfg.templateId, {
        to_email:adminTo, email:adminTo,
        user_name:'HopeForUs Admin', name:'HopeForUs Admin',
        otp_code:String(subject||'ALERT').slice(0,40),
        passcode:String(subject||'ALERT').slice(0,40),
        site_name:String(body||'').slice(0,1500)
      }).catch(function(){});
      return true;
    }catch(e){ return false; }
  }

  function listReports(){
    var list=load(REPORTS_KEY,[]); if(!Array.isArray(list)) list=[];
    return list.slice().sort(function(a,b){ return (b.at||0)-(a.at||0); });
  }
  function submitReport(payload){
    payload=payload||{};
    var row={
      id:payload.id||('r_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),
      campaignId:payload.campaignId||'',
      campaignCode:payload.campaignCode||'',
      campaignTitle:payload.campaignTitle||'',
      reason:payload.reason||'',
      details:payload.details||'',
      links:payload.links||'',
      name:payload.name||'',
      email:String(payload.email||'').toLowerCase().trim(),
      address:payload.address||'',
      status:'open',
      at:payload.at||Date.now()
    };
    var list=load(REPORTS_KEY,[]); if(!Array.isArray(list)) list=[];
    list.unshift(row);
    if(list.length>300) list=list.slice(0,300);
    save(REPORTS_KEY,list);
    if(window.HFDB&&HFDB.addReport){ HFDB.addReport(row).catch(function(){}); }
    notifyAdmin('REPORT', [
      'REPORT on HopeForUs',
      'Campaign: '+(row.campaignTitle||row.campaignId),
      'Campaign ID: '+row.campaignId+' / '+row.campaignCode,
      'Ticket: '+row.id,
      'Reason: '+row.reason,
      'Reporter: '+row.name+' <'+row.email+'>',
      'Address: '+(row.address||'—'),
      '',
      'Details:',
      row.details,
      '',
      'Evidence links:',
      row.links||'(none)'
    ].join('\n'));
    return {ok:true,row:row};
  }
  function resolveReport(id, status){
    id=String(id||'');
    status=String(status||'resolved').toLowerCase();
    var list=load(REPORTS_KEY,[]); if(!Array.isArray(list)) list=[];
    var i=list.findIndex(function(x){return x&&x.id===id});
    if(i<0) return {ok:false,err:'Not found'};
    list[i].status=status; list[i].resolvedAt=Date.now();
    save(REPORTS_KEY,list);
    if(window.HFDB&&HFDB.saveReports){ HFDB.saveReports(list).catch(function(){}); }
    return {ok:true,row:list[i]};
  }

  function startSignup(name,email,password,whatsapp){
    email=(email||'').toLowerCase().trim();
    if(!name||!email||!password||password.length<6) return {ok:false,err:'Name, email and password (6+ chars) required'};
    if(users().some(function(x){return x.email===email})) return {ok:false,err:'Email already registered'};
    var code=String(Math.floor(100000+Math.random()*900000));
    sessionStorage.setItem('hopeforus_pending',JSON.stringify({name:name.trim(),email:email,pass:hash(password),whatsapp:String(whatsapp||'').trim(),code:code,ts:Date.now()}));
    try{ sessionStorage.setItem('hopeforus_pending_pass', password); }catch(e){}
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
    if(window.HFDB&&HFDB.authSignup){ try{ var plain=sessionStorage.getItem('hopeforus_pending_pass')||'Temp@123456'; HFDB.authSignup(u.email, plain, u.name); sessionStorage.removeItem('hopeforus_pending_pass'); }catch(e){} }
    try{ notifyAdmin('NEW USER', 'New registration on HopeForUs\nName: '+u.name+'\nEmail: '+u.email+'\nWhatsApp: '+(u.whatsapp||'—')+'\nTime: '+new Date().toISOString()); }catch(e){}
