/* HopeForUs core – auth, shares, withdraw, admin helpers */
(function(w){
  var USERS_KEY='hopeforus_users';
  var SESSION_KEY='hopeforus_user';
  var CAMPS_KEY='hopeforus_campaigns';
  var CLICKS_KEY='hopeforus_clicks';
  var WITHDRAW_KEY='hopeforus_withdrawals';
  var REPORTS_KEY='hopeforus_reports';
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
    if(w.HF_SAMPLE_IDS && w.HF_SAMPLE_IDS[id]) return {ok:false,err:'Showcase campaigns stay on the homepage'};
    var list=load(CAMPS_KEY,[]);
    var c=list.find(function(x){return x&&x.id===id})||{id:id};
    if(list.some(function(x){return x&&x.id===id}) && !ownsCampaign(c,u)) return {ok:false,err:'You can only delete your own campaigns'};
    var next=list.filter(function(x){return !x||x.id!==id});
    save(CAMPS_KEY,next);
    try{
      var code=(c.code||c.id||'').toString().toUpperCase();
      var clicks=load(CLICKS_KEY,{});
      if(clicks[code]){delete clicks[code];save(CLICKS_KEY,clicks)}
    }catch(e){}
    try{
      if(w.HFShared&&HFShared.rememberDeleted) HFShared.rememberDeleted(id);
      var tomb={id:id,status:'deleted',deleted:true,title:c.title||'',ownerEmail:c.ownerEmail||c.organizerEmail||''};
      if(w.HFShared&&HFShared.push) HFShared.push(tomb);
      if(w.HFDB&&HFDB.remove) HFDB.remove(id);
    }catch(e){}
    return {ok:true};
  }

  function shortLink(codeOrId){
    // Use .html — most reliable on GitHub Pages across all devices
    var origin = (typeof location !== 'undefined' && location.origin && location.protocol.indexOf('http')===0)
      ? location.origin : 'https://munowatchplus.watch';
    var raw = String(codeOrId||'').trim();
    if(!raw) return origin + '/';
    var camps = getAllCampaigns ? getAllCampaigns() : [];
    var hit = camps.find(function(c){
      if(!c) return false;
      if(c.id === raw) return true;
      if(String(c.code||'').toUpperCase() === raw.toUpperCase()) return true;
      return false;
    });
    if(hit && hit.id) return origin + '/campaign.html?id=' + encodeURIComponent(hit.id);
    if(/[-_]/.test(raw) || /^c_/i.test(raw)) return origin + '/campaign.html?id=' + encodeURIComponent(raw);
    return origin + '/f.html?c=' + encodeURIComponent(raw.toUpperCase().replace(/\s+/g,''));
  }
  function realShareUrl(code){ return shortLink(code); }
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
    save(WITHDRAW_KEY,list);
    addNotice({email:r.email, title:'Withdrawal '+status, body:'$'+r.amount+' via '+(r.method||''), kind:'withdraw'});
    return true;
  }

  var GIFTS_KEY='hopeforus_gifts';
  var NOTICES_KEY='hopeforus_notices';
  function addNotice(n){
    var list=load(NOTICES_KEY,[]);
    list.unshift({id:'n_'+Date.now().toString(36), email:String(n.email||'all').toLowerCase(), title:n.title||'Update', body:n.body||'', kind:n.kind||'update', at:Date.now()});
    save(NOTICES_KEY, list.slice(0,200));
  }
  function listNotices(email){
    email=String(email||'').toLowerCase();
    return load(NOTICES_KEY,[]).filter(function(n){return n.email==='all'||n.email===email});
  }
  function postSiteUpdate(title, body){
    var u=session(); if(!u||!u.isAdmin) return {ok:false, err:'Admin only'};
    title=String(title||'').trim(); if(!title) return {ok:false, err:'Write an update'};
    addNotice({email:'all', title:title, body:String(body||'').trim(), kind:'update'});
    return {ok:true};
  }
  function syncRaisedToRemote(id, raised, donations){
    if(!w.HFDB || !id) return;
    var patch = {};
    if(typeof raised === 'number') patch.raised = raised;
    if(typeof donations === 'number') patch.donations = donations;
    if(!Object.keys(patch).length) return;
    HFDB.update(id, patch).then(function(){
      var list = load(CAMPS_KEY,[]);
      var c = list.find(function(x){return x && x.id === id;});
      if(c && w.HFShared && HFShared.push) HFShared.push(c);
    }).catch(function(e){ console.warn('Raised sync failed', e); });
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
    var newRaised = (Number(c.raised)||0)+amount;
    var newDons = (Number(c.donations)||0)+1;
    if(saved){
      var list=load(CAMPS_KEY,[]);
      var target=list.find(function(x){return x&&x.id===c.id});
      if(target){
        target.raised=newRaised;
        target.donations=newDons;
        if(!Array.isArray(target.donors)) target.donors=[];
        target.donors.unshift({name:donor, amount:amount, time:'Just now', giftId:row.id});
        save(CAMPS_KEY, list);
        syncRaisedToRemote(c.id, newRaised, newDons);
        if(w.HFDB && HFDB.publishDonors) HFDB.publishDonors(c.id, target.donors);
      }
    }
    if(owner) addNotice({email:owner, title:donor+' donated $'+amount, body:c.title, kind:'donation'});
    return {ok:true, row:row};
  }
  function listGifts(email){
    var gifts=load(GIFTS_KEY,[]);
    if(!email) return gifts;
    email=String(email).toLowerCase();
    var byId={};
    getAllCampaigns().forEach(function(c){ if(c&&c.id) byId[c.id]=c; });
    return gifts.filter(function(g){
      if(String(g.ownerEmail||'').toLowerCase()===email) return true;
      var c=byId[g.campaignId];
      if(!c) return false;
      var owner=String(c.ownerEmail||c.organizerEmail||'').toLowerCase();
      return owner===email;
    });
  }
  function beginCode(email){
    email=String(email||'').toLowerCase().trim();
    var u=users().find(function(x){return x.email===email});
    if(!u) return {ok:false, err:'No account with that email'};
    var code=String(Math.floor(100000+Math.random()*900000));
    sessionStorage.setItem('hopeforus_code', JSON.stringify({email:email, code:code, ts:Date.now()}));
    return {ok:true, code:code, email:email};
  }
  function readCode(email, code){
    var p; try{p=JSON.parse(sessionStorage.getItem('hopeforus_code')||'null')}catch(e){p=null}
    email=String(email||'').toLowerCase().trim();
    if(!p||p.email!==email||String(p.code)!==String(code||'').trim()) return {ok:false, err:'That code is wrong'};
    if(Date.now()-p.ts>15*60*1000) return {ok:false, err:'That code expired. Ask for a new one'};
    var u=users().find(function(x){return x.email===email});
    if(!u) return {ok:false, err:'No account with that email'};
    return {ok:true, user:u};
  }
  function loginWithCode(email, code){
    var r=readCode(email, code); if(!r.ok) return r;
    sessionStorage.removeItem('hopeforus_code');
    setSession(r.user);
    return {ok:true, user:r.user};
  }
  function resetPassword(email, code, password){
    if(!password||password.length<6) return {ok:false, err:'Password needs 6 characters'};
    var r=readCode(email, code); if(!r.ok) return r;
    var list=users();
    var u=list.find(function(x){return x.email===r.user.email});
    if(!u) return {ok:false, err:'No account'};
    u.pass=hash(password);
    saveUsers(list);
    sessionStorage.removeItem('hopeforus_code');
    setSession(u);
    return {ok:true, user:u};
  }

  function submitReport(payload){
    var name=(payload.name||'').trim();
    var email=(payload.email||'').trim().toLowerCase();
    var details=(payload.details||'').trim();
    var reason=(payload.reason||'').trim();
    if(!name||name.length<2) return {ok:false,err:'Name required'};
    if(!email||email.indexOf('@')<0) return {ok:false,err:'Valid email required'};
    if(!reason) return {ok:false,err:'Reason required'};
    if(!details||details.length<10) return {ok:false,err:'Please describe the issue'};
    var list=load(REPORTS_KEY,[]);
    if(!Array.isArray(list)) list=[];
    var row={
      id:'r_'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),
      campaignId:payload.campaignId||'',
      campaignCode:payload.campaignCode||'',
      campaignTitle:payload.campaignTitle||'',
      name:name,
      email:email,
      address:(payload.address||'').trim(),
      reason:reason,
      details:details,
      links:(payload.links||'').trim(),
      status:'open',
      created:Date.now()
    };
    list.unshift(row);
    save(REPORTS_KEY,list);
    return {ok:true,row:row};
  }
  function listReports(){return load(REPORTS_KEY,[])||[]}
  function setReportStatus(id,status){
    var list=load(REPORTS_KEY,[]);
    var r=list.find(function(x){return x&&x.id===id});
    if(!r) return false;
    r.status=status;r.updated=Date.now();
    save(REPORTS_KEY,list);return true;
  }

  function isAdmin(){var s=session();return s&&s.isAdmin}
  function adminUsers(){return users().map(function(u){return {id:u.id,email:u.email,name:u.name,verified:u.verified,isAdmin:u.isAdmin,created:u.created,donors:(u.donors||[]).length,chats:(u.chats||[]).length}})}

  function getAllCampaigns(){
    var stored = load(CAMPS_KEY,[]);
    if(!Array.isArray(stored)) stored = [];
    var byId = {};
    stored.forEach(function(c){ if(c && c.id) byId[c.id] = c; });
    if (typeof SAMPLES !== 'undefined' && Array.isArray(SAMPLES)) {
      SAMPLES.forEach(function(s){
        if (!s || !s.id) return;
        if (!byId[s.id]) {
          byId[s.id] = Object.assign({}, s, {
            status: s.status || 'approved',
            donationLink: s.donationLink || ''
          });
        }
      });
    }
    return Object.keys(byId).map(function(k){ return byId[k]; });
  }

  function adminCampaigns(){ return getAllCampaigns(); }

  function findCampaign(id){
    id = String(id || '');
    var list = load(CAMPS_KEY,[]);
    var c = list.find(function(x){ return x && x.id === id; });
    if (c) return { campaign: c, fromStorage: true };
    if (typeof SAMPLES !== 'undefined' && Array.isArray(SAMPLES)) {
      var s = SAMPLES.find(function(x){ return x && x.id === id; });
      if (s) return { campaign: Object.assign({}, s), fromStorage: false };
    }
    return null;
  }

  function ensureInStorage(id){
    var found = findCampaign(id);
    if (!found) return null;
    if (found.fromStorage) return found.campaign;
    var list = load(CAMPS_KEY,[]);
    if (!Array.isArray(list)) list = [];
    var clone = Object.assign({}, found.campaign, {
      status: found.campaign.status || 'approved',
      donationLink: found.campaign.donationLink || ''
    });
    list.unshift(clone);
    save(CAMPS_KEY, list);
    return clone;
  }

  function setCampaignStatus(id, status){
    var c = ensureInStorage(id);
    if (!c) return false;
    var list = load(CAMPS_KEY,[]);
    var target = list.find(function(x){ return x && x.id === id; });
    if (!target) return false;
    target.status = status;
    target.reviewedAt = Date.now();
    save(CAMPS_KEY, list);
    return true;
  }

  function setCampaignDonationLink(id, link){
    var c = ensureInStorage(id);
    if (!c) return false;
    var list = load(CAMPS_KEY,[]);
    var target = list.find(function(x){ return x && x.id === id; });
    if (!target) return false;
    target.donationLink = String(link || '').trim();
    target.reviewedAt = Date.now();
    if (target.donationLink) target.status = 'approved';
    save(CAMPS_KEY, list);
    return true;
  }

  function updateCampaignRaised(id, raised, donations){
    var c = ensureInStorage(id);
    if (!c) return false;
    var list = load(CAMPS_KEY,[]);
    var target = list.find(function(x){ return x && x.id === id; });
    if (!target) return false;
    if (typeof raised === 'number') target.raised = raised;
    if (typeof donations === 'number') target.donations = donations;
    save(CAMPS_KEY, list);
    syncRaisedToRemote(id, target.raised, target.donations);
    return true;
  }

  w.HF={
    hash:hash,users:users,session:session,setSession:setSession,logout:logout,
    startSignup:startSignup,verifySignup:verifySignup,login:login,
    ownsCampaign:ownsCampaign,myCampaigns:myCampaigns,deleteCampaign:deleteCampaign,
    shortLink:shortLink,realShareUrl:realShareUrl,trackClick:trackClick,getClicks:getClicks,clicksForUser:clicksForUser,
    requestWithdraw:requestWithdraw,listWithdrawals:listWithdrawals,setWithdrawStatus:setWithdrawStatus,
    addGift:addGift,listGifts:listGifts,listNotices:listNotices,postSiteUpdate:postSiteUpdate,
    beginCode:beginCode,loginWithCode:loginWithCode,resetPassword:resetPassword,
    submitReport:submitReport,listReports:listReports,setReportStatus:setReportStatus,
    isAdmin:isAdmin,adminUsers:adminUsers,adminCampaigns:adminCampaigns,
    setCampaignStatus:setCampaignStatus,setCampaignDonationLink:setCampaignDonationLink,
    updateCampaignRaised:updateCampaignRaised,getAllCampaigns:getAllCampaigns,
    ADMIN_EMAIL:ADMIN_EMAIL
  };
})(window);
