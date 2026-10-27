/* HopeForUs core – auth, shares, withdraw, admin helpers */
(function(w){
  var USERS_KEY='hopeforus_users';
  var SESSION_KEY='hopeforus_user';
  var CAMPS_KEY='hopeforus_campaigns';
  var CLICKS_KEY='hopeforus_clicks';
  var WITHDRAW_KEY='hopeforus_withdrawals';
  var ADMIN_EMAIL='admin@hopeforus.com';
  var ADMIN_PASS='Admin@2026';

  function load(k,d){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(e){return d}}
  function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
  function hash(p){var s='hf_'+p+'_salt';try{return btoa(unescape(encodeURIComponent(s))).slice(0,48)}catch(e){return s}}
  function uid(){return 'u_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}

  function users(){return load(USERS_KEY,[])}
  function saveUsers(u){save(USERS_KEY,u)}
  function session(){return load(SESSION_KEY,null)}
  function setSession(u){if(u)save(SESSION_KEY,{id:u.id,email:u.email,name:u.name,isAdmin:!!u.isAdmin});else localStorage.removeItem(SESSION_KEY)}

  function ensureAdmin(){
    var list=users();
    if(!list.some(function(x){return x.email===ADMIN_EMAIL})){
      list.push({id:'admin',email:ADMIN_EMAIL,name:'Admin',pass:hash(ADMIN_PASS),verified:true,isAdmin:true,created:Date.now(),donors:[],chats:[],clicks:0});
      saveUsers(list);
    }
  }
  ensureAdmin();

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
  function verifySignup(code){
    var p;try{p=JSON.parse(sessionStorage.getItem('hopeforus_pending')||'null')}catch(e){p=null}
    if(!p) return {ok:false,err:'No pending signup'};
    if(String(code).trim()!==String(p.code)) return {ok:false,err:'Invalid verification code'};
    var list=users();
    var u={id:uid(),email:p.email,name:p.name,pass:p.pass,verified:true,isAdmin:false,created:Date.now(),donors:[],chats:[],clicks:0,wallets:{btc:'',usdt:''}};
    list.push(u);saveUsers(list);
    sessionStorage.removeItem('hopeforus_pending');
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
  function logout(){setSession(null)}

  function ownsCampaign(c,u){
    if(!c||!u) return false;
    if(u.isAdmin) return true;
    var email=(u.email||'').toLowerCase();
    if(c.ownerId&&u.id&&c.ownerId===u.id) return true;
    if(c.ownerEmail&&c.ownerEmail.toLowerCase()===email) return true;
    if(c.organizerEmail&&c.organizerEmail.toLowerCase()===email) return true;
    if(c.organizer&&typeof c.organizer==='string'&&c.organizer.toLowerCase()===email) return true;
    return false;
  }

  function myCampaigns(emailOrUser){
    var u=typeof emailOrUser==='object'&&emailOrUser?emailOrUser:session();
    if(!u) return [];
    var list=load(CAMPS_KEY,[]);
    return list.filter(function(c){return ownsCampaign(c,u)});
  }

  function deleteCampaign(id){
    var u=session();
    if(!u) return {ok:false,err:'Login required'};
    id=String(id||'');
    if(!id) return {ok:false,err:'Missing campaign'};
    var list=load(CAMPS_KEY,[]);
    var c=list.find(function(x){return x&&x.id===id});
    if(!c) return {ok:false,err:'Campaign not found'};
    if(!ownsCampaign(c,u)) return {ok:false,err:'You can only delete your own campaigns'};
    var next=list.filter(function(x){return !x||x.id!==id});
    save(CAMPS_KEY,next);
    try{
      var code=(c.code||c.id||'').toString().toUpperCase();
      var clicks=load(CLICKS_KEY,{});
      if(clicks[code]){delete clicks[code];save(CLICKS_KEY,clicks)}
    }catch(e){}
    return {ok:true};
  }

  function shortLink(code){
    code=(code||'campaign').toString().toUpperCase().replace(/\s+/g,'');
    return 'https://hopeforus.me/f/'+encodeURIComponent(code);
  }
  function realShareUrl(code){
    var base=(location.origin+location.pathname).replace(/[^/]+$/,'');
    return base+'f.html?c='+encodeURIComponent((code||'').toString().toUpperCase());
  }
  function trackClick(code,meta){
    code=(code||'').toString().toUpperCase();
    var all=load(CLICKS_KEY,{});
    if(!all[code]) all[code]={total:0,byCountry:{},byDay:{},recent:[]};
    all[code].total++;
    var country=(meta&&meta.country)||guessCountry();
    all[code].byCountry[country]=(all[code].byCountry[country]||0)+1;
    var day=new Date().toISOString().slice(0,10);
    all[code].byDay[day]=(all[code].byDay[day]||0)+1;
    all[code].recent.unshift({t:Date.now(),country:country,ua:(navigator.userAgent||'').slice(0,80)});
    if(all[code].recent.length>100) all[code].recent=all[code].recent.slice(0,100);
    save(CLICKS_KEY,all);
    return all[code];
  }
  function guessCountry(){
    try{
      var tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';
      var map={'Africa/Nairobi':'KE','Africa/Lagos':'NG','Africa/Johannesburg':'ZA','America/New_York':'US','America/Los_Angeles':'US','Europe/London':'GB','Europe/Paris':'FR','Asia/Dubai':'AE','Asia/Kolkata':'IN'};
      if(map[tz]) return map[tz];
      if(tz.indexOf('Africa/')===0) return 'AF';
      if(tz.indexOf('America/')===0) return 'US';
      if(tz.indexOf('Europe/')===0) return 'EU';
      return tz.split('/').pop()||'XX';
    }catch(e){return 'XX'}
  }
  function getClicks(code){var all=load(CLICKS_KEY,{});return all[(code||'').toUpperCase()]||{total:0,byCountry:{},byDay:{},recent:[]}}
  function clicksForUser(email){
    var u=session();
    var camps=u?myCampaigns(u):load(CAMPS_KEY,[]).filter(function(c){return c.ownerEmail===email||c.organizerEmail===email});
    var out=[];
    camps.forEach(function(c){var cl=getClicks(c.code||c.id);out.push({campaign:c,clicks:cl})});
    return out;
  }

  function requestWithdraw(payload){
    var u=session();if(!u) return {ok:false,err:'Login required'};
    var method=(payload.method||'').toLowerCase();
    var allowed=['btc','usdt','mtn','airtel'];
    if(allowed.indexOf(method)===-1) return {ok:false,err:'Choose USDT, BTC, MTN or Airtel'};
    var isMobile=method==='mtn'||method==='airtel';
    var addr=(payload.address||'').trim();
    var accountName=(payload.accountName||'').trim();
    if(isMobile){
      if(!addr||addr.replace(/\D/g,'').length<9) return {ok:false,err:'Enter a valid mobile number'};
      if(!accountName||accountName.length<2) return {ok:false,err:'Enter the full name registered on this number'};
    }else{
      if(!addr||addr.length<10) return {ok:false,err:'Valid wallet address required'};
    }
    var amount=parseFloat(payload.amount);
    if(!(amount>0)) return {ok:false,err:'Enter amount'};
    var list=load(WITHDRAW_KEY,[]);
    var row={
      id:'w_'+Date.now().toString(36),
      userId:u.id,
      email:u.email,
      method:method,
      network:payload.network||(method==='usdt'?'TRC20':isMobile?'MOBILE':method.toUpperCase()),
      address:addr,
      accountName:accountName||'',
      amount:amount,
      status:'pending',
      created:Date.now(),
      note:payload.note||''
    };
    list.unshift(row);save(WITHDRAW_KEY,list);
    return {ok:true,row:row};
  }
  function listWithdrawals(filterEmail){
    var list=load(WITHDRAW_KEY,[]);
    if(filterEmail) list=list.filter(function(x){return x.email===filterEmail});
    return list;
  }
  function setWithdrawStatus(id,status){
    var list=load(WITHDRAW_KEY,[]);
    var r=list.find(function(x){return x.id===id});
    if(!r) return false;
    r.status=status;r.updated=Date.now();
    save(WITHDRAW_KEY,list);return true;
  }

  function isAdmin(){var s=session();return s&&s.isAdmin}
  function adminUsers(){return users().map(function(u){return {id:u.id,email:u.email,name:u.name,verified:u.verified,isAdmin:u.isAdmin,created:u.created,donors:(u.donors||[]).length,chats:(u.chats||[]).length}})}
  function adminCampaigns(){return load(CAMPS_KEY,[])}
  function setCampaignStatus(id,status){
    var list=load(CAMPS_KEY,[]);
    var c=list.find(function(x){return x.id===id});
    if(!c) return false;
    c.status=status;c.reviewedAt=Date.now();
    save(CAMPS_KEY,list);return true;
  }
  function setCampaignDonationLink(id, link){
    var list=load(CAMPS_KEY,[]);
    var c=list.find(function(x){return x.id===id});
    if(!c) return false;
    c.donationLink=String(link||'').trim();
    c.reviewedAt=Date.now();
    if(c.donationLink) c.status='approved';
    save(CAMPS_KEY,list);return true;
  }

  w.HF={
    hash:hash,users:users,session:session,setSession:setSession,logout:logout,
    startSignup:startSignup,verifySignup:verifySignup,login:login,
    ownsCampaign:ownsCampaign,myCampaigns:myCampaigns,deleteCampaign:deleteCampaign,
    shortLink:shortLink,realShareUrl:realShareUrl,trackClick:trackClick,getClicks:getClicks,clicksForUser:clicksForUser,
    requestWithdraw:requestWithdraw,listWithdrawals:listWithdrawals,setWithdrawStatus:setWithdrawStatus,
    isAdmin:isAdmin,adminUsers:adminUsers,adminCampaigns:adminCampaigns,setCampaignStatus:setCampaignStatus,
    setCampaignDonationLink:setCampaignDonationLink,
    ADMIN_EMAIL:ADMIN_EMAIL
  };
})(window);
