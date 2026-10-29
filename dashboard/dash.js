var u=HF.session();
if(!u){ location.replace('/login?return='+encodeURIComponent('/dashboard/')); throw 0; }
var tab=(HF.isAdmin&&HF.isAdmin()&&location.hash==='#admin')?'admin':'home';
var openId='', editId='', openUser='', openWd='', searchQ='', busy=false;
var av=localStorage.getItem('hf_avatar_'+u.email)||'';
if(window.HF&&HF.getUserAvatar){ var ga=HF.getUserAvatar(u.email); if(ga) av=ga; }
function esc(s){var a=String.fromCharCode(38);return String(s==null?'':s).replace(/&/g,a+'amp;').replace(/</g,a+'lt;').replace(/>/g,a+'gt;').replace(/"/g,a+'quot;').replace(/'/g,'&#39;')}
function readLocalCamps(){ var list=[]; try{list=JSON.parse(localStorage.getItem('hopeforus_campaigns')||'[]')}catch(e){} return Array.isArray(list)?list:[]; }
function allCamps(){
  var by={}; readLocalCamps().forEach(function(c){ if(c&&c.id) by[c.id]=c; });
  if(HF.adminCampaigns) (HF.adminCampaigns()||[]).forEach(function(c){ if(c&&c.id&&!by[c.id]) by[c.id]=c; });
  return Object.keys(by).map(function(k){return by[k];});
}
function camps(){
  var email=String((u&&u.email)||'').toLowerCase();
  if(HF.isAdmin&&HF.isAdmin()) return allCamps();
  return allCamps().filter(function(c){
    if(!c||c.deleted||c.status==='deleted') return false;
    return String(c.ownerEmail||c.organizerEmail||'').toLowerCase()===email;
  });
}
function money(list){
  var now=Date.now(), ten=10*86400000, received=0, hold=0, ready=0;
  list.forEach(function(c){
    var amt=Number(c.raised)||0; received+=amt;
    var at=Date.parse(c.createdAt||c.created||'')||now;
    if(now-at>=ten) ready+=amt; else hold+=amt;
  });
  var wd=(HF.listWithdrawals(u.email)||[]).filter(function(w){return w.status!=='rejected'&&w.status!=='cancelled'});
  var withdrawn=wd.filter(function(w){return w.status==='approved'||w.status==='paid';}).reduce(function(n,w){return n+(Number(w.amount)||0)},0);
  return {received:received,hold:hold,ready:ready,withdrawn:withdrawn,balance:Math.max(0,received-withdrawn),available:Math.max(0,ready-withdrawn)};
}
function moneyForEmail(email){
  email=String(email||'').toLowerCase();
  var list=allCamps().filter(function(c){ return c&&String(c.ownerEmail||c.organizerEmail||'').toLowerCase()===email; });
  var now=Date.now(), ten=10*86400000, received=0, hold=0, ready=0;
  list.forEach(function(c){
    var amt=Number(c.raised)||0; received+=amt;
    var at=Date.parse(c.createdAt||c.created||'')||now;
    if(now-at>=ten) ready+=amt; else hold+=amt;
  });
  var wd=(HF.listWithdrawals(email)||[]).filter(function(w){return w.status==='approved'||w.status==='paid';});
  var withdrawn=wd.reduce(function(n,w){return n+(Number(w.amount)||0)},0);
  return {received:received,hold:hold,available:Math.max(0,ready-withdrawn),campaigns:list.length};
}
function saveCamp(c){
  var list=readLocalCamps();
  var i=list.findIndex(function(x){return x&&x.id===c.id});
  if(i>=0) list[i]=Object.assign({},list[i],c); else list.unshift(c);
  localStorage.setItem('hopeforus_campaigns',JSON.stringify(list));
  if(HF.saveCampaign) try{HF.saveCampaign(list[i>=0?i:0]);}catch(e){}
  if(window.HFDB&&HFDB.update&&c.id){
    HFDB.update(c.id,{title:c.title||'',story:c.story||'',goal:Number(c.goal)||0,status:c.status||'pending'}).catch(function(){});
  }
}
function setBusy(btn,on,label){
  if(!btn) return;
  btn.disabled=!!on;
  if(on){ btn.dataset.label=btn.textContent; btn.innerHTML='<span class="spin"></span> '+(label||'Please wait…'); }
  else { btn.textContent=btn.dataset.label||label||'OK'; }
}
function drawAv(){
  var b=document.getElementById('avBtn');
  if(b) b.innerHTML=av?'<img alt="" src="'+av+'">':esc((u.name||u.email||'J').slice(0,1).toUpperCase());
}
function setTab(name){
  tab=name; openId=''; editId=''; openUser=''; openWd='';
  document.getElementById('menu').classList.add('hide');
  if(name==='admin') location.hash='admin';
  else if(location.hash==='#admin') history.replaceState(null,'',location.pathname);
  render();
}
function matchSearch(q, parts){
  q=String(q||'').toLowerCase().trim();
  if(!q) return true;
  return parts.some(function(p){ return String(p||'').toLowerCase().indexOf(q)>=0; });
}
function supportCard(){
  var wa=HF.SUPPORT_WA||'447446315764';
  var em=HF.SUPPORT_EMAIL||'admin@hopeforus.com';
  var waLink=HF.whatsappLink?HF.whatsappLink(wa):('https://wa.me/'+String(wa).replace(/[^0-9]/g,''));
  return '<div class="card" style="padding:16px;margin-top:14px"><h2 style="font-size:1rem;margin-bottom:8px">Contact support</h2><p class="note">Need help with your campaign or payout?</p><div style="display:flex;gap:12px;margin-top:12px;flex-wrap:wrap">'+
    '<a class="icon-btn wa" href="'+esc(waLink)+'" target="_blank" rel="noopener" title="WhatsApp"><span>💬</span><small>WhatsApp</small></a>'+
    '<a class="icon-btn mail" href="mailto:'+esc(em)+'?subject=HopeForUs%20support" title="Email"><span>✉</span><small>Email</small></a>'+
    '</div></div>';
}
function render(){
  document.querySelectorAll('[data-tab]').forEach(function(el){ el.classList.toggle('on', el.getAttribute('data-tab')===tab); });
  if(HF.isAdmin&&HF.isAdmin()){
    var waitN=allCamps().filter(function(c){return c&&c.status!=='approved'&&c.status!=='rejected'&&c.status!=='deleted'&&!c.deleted&&(c.ownerEmail||c.organizerEmail);}).length;
    var nav=document.getElementById('adminNav');
    if(nav) nav.innerHTML='<i>✓</i> Approve'+(waitN?' ('+waitN+')':'');
    var un=document.getElementById('usersNav'); if(un) un.classList.remove('hide');
  }
  var box=document.getElementById('main'), all, list, m, html='';
  if(HF.isAdmin&&HF.isAdmin()) all=allCamps().filter(function(c){return c&&c.status!=='rejected'&&c.status!=='deleted'&&!c.deleted});
  else all=camps().filter(function(c){return c&&c.status!=='rejected'&&c.status!=='deleted'&&!c.deleted});
  list=all; m=money(all);
  if(HF.isAdmin&&HF.isAdmin()&&tab==='home') list=all.filter(function(c){return c.status==='approved'||!c.status});
  if(searchQ&&(tab==='home'||tab==='admin')) list=list.filter(function(c){ return matchSearch(searchQ,[c.title,c.ownerEmail,c.organizer,c.story]); });
  if(editId){
    var c=all.find(function(x){return x.id===editId});
    if(!c){editId='';render();return}
    html='<div class="pane"><form id="editForm" class="card" style="padding:16px"><h1>Edit campaign</h1><label>Name</label><input id="eTitle" value="'+esc(c.title)+'"><label>Story</label><textarea id="eStory">'+esc(c.story||'')+'</textarea><label>Goal</label><input id="eGoal" value="'+esc(c.goal)+'"><div class="row"><button class="btn" type="submit">Save</button><button class="btn ghost" type="button" id="back">Back</button></div></form></div>';
    box.innerHTML=html;
    document.getElementById('back').onclick=function(){editId='';render();};
    document.getElementById('editForm').onsubmit=function(e){e.preventDefault();var btn=e.target.querySelector('[type=submit]');setBusy(btn,true,'Saving…');c.title=document.getElementById('eTitle').value.trim();c.story=document.getElementById('eStory').value;c.goal=parseFloat(document.getElementById('eGoal').value)||c.goal;saveCamp(c);setTimeout(function(){editId='';render();},400);};
    return;
  }
  if(tab==='home'){
    html='<div class="pane"><h1>Dashboard</h1><p class="sub">Welcome'+(u.name?', '+esc(u.name):'')+'.</p><div class="stats"><div class="stat"><span>Raised</span><b>$'+m.received.toLocaleString()+'</b></div><div class="stat"><span>Available</span><b>$'+m.available.toLocaleString()+'</b></div><div class="stat"><span>On hold</span><b>$'+m.hold.toLocaleString()+'</b></div><div class="stat"><span>Campaigns</span><b>'+list.length+'</b></div></div><div class="camp-grid">';
    if(!list.length) html+='<p class="note">No campaigns yet.</p>';
    list.forEach(function(c){
      var r=Number(c.raised)||0,g=Math.max(1,Number(c.goal)||1),pct=Math.min(100,Math.round(r/g*100));
      html+='<article class="camp card"><button type="button" class="camp-top" data-open="'+esc(c.id)+'">'+(c.image?'<img src="'+esc(c.image)+'" alt="">':'')+'<div class="body"><strong>'+esc(c.title||'Untitled')+'</strong><div class="bar"><i style="width:'+pct+'%"></i></div><div class="note">$'+r.toLocaleString()+' of $'+g.toLocaleString()+' · '+esc(c.status||'')+(HF.isAdmin()&&c.ownerEmail?(' · '+esc(c.ownerEmail)):'')+'</div></div></button><div class="acts"><button type="button" class="go" data-view="'+esc(c.id)+'">👁 View</button><button type="button" data-edit="'+esc(c.id)+'">✎ Edit</button></div></article>';
    });
    html+='</div>'+supportCard()+'</div>';
  }else if(tab==='donations'&&HF.isAdmin()){
    var allG=HF.listGifts?HF.listGifts():[];
    html='<div class="pane"><h1>Donations received</h1><div class="card" style="padding:14px"><label>Campaign</label><input id="gfind" placeholder="Search title or email"><input id="gcamp" type="hidden"><div id="gpick"></div><label>Donor name</label><input id="gname"><label>Amount (USD)</label><input id="gamt" inputmode="decimal"><button class="btn" id="gadd" type="button">Add donation</button><p class="note" id="gmsg"></p></div><div class="card" style="padding:8px 14px;margin-top:12px">';
    (allG||[]).forEach(function(g){html+='<div class="donor"><div style="flex:1"><strong>'+esc(g.donor)+'</strong><div class="note">'+esc(g.title||'')+'</div></div><strong>$'+Number(g.amount).toLocaleString()+'</strong></div>'});
    if(!(allG||[]).length) html+='<p class="note">No donations yet.</p>';
    html+='</div></div>';
  }else if(tab==='donations'){
    var mine=HF.listGifts?HF.listGifts(u.email):[];
    camps().forEach(function(c){ (c.donors||[]).forEach(function(d){ mine.push({donor:d.name||d.donor||'Anonymous',amount:d.amount,title:c.title}); }); });
    html='<div class="pane"><h1>Donations Received</h1><div class="card" style="padding:8px 14px">';
    if(!mine.length) html+='<p class="note">No gifts yet.</p>';
    mine.forEach(function(g){html+='<div class="donor"><div style="flex:1"><strong>'+esc(g.donor)+'</strong><div class="note">'+esc(g.title||'')+'</div></div><strong>$'+Number(g.amount).toLocaleString()+'</strong></div>'});
    html+='</div>'+supportCard()+'</div>';
  }else if(tab==='transfers'){
    if(HF.isAdmin&&HF.isAdmin()){
      var wds=(HF.listWithdrawals&&HF.listWithdrawals())||[];
      if(searchQ) wds=wds.filter(function(w){ return matchSearch(searchQ,[w.email,w.method,w.address,w.status]); });
      if(openWd){
        var w=wds.find(function(x){return x&&x.id===openWd})||(HF.listWithdrawals()||[]).find(function(x){return x&&x.id===openWd});
        if(w){
          var mm=moneyForEmail(w.email);
          html='<div class="pane"><button type="button" class="mini-btn" id="backWd">← All requests</button><h1 style="margin-top:12px">Withdrawal detail</h1>';
          html+='<div class="card" style="padding:16px;margin-top:10px"><div class="note">User</div><strong>'+esc(w.email)+'</strong>';
          html+='<div class="stats" style="margin-top:12px"><div class="stat"><span>Available</span><b>$'+mm.available.toLocaleString()+'</b></div><div class="stat"><span>On hold</span><b>$'+mm.hold.toLocaleString()+'</b></div><div class="stat"><span>Raised</span><b>$'+mm.received.toLocaleString()+'</b></div><div class="stat"><span>Campaigns</span><b>'+mm.campaigns+'</b></div></div>';
          html+='<div style="margin-top:12px"><strong>$'+Number(w.amount||0).toLocaleString()+'</strong> · '+esc(w.method||'')+' · '+esc(w.status||'pending')+'</div>';
          html+='<div class="note">'+esc(w.address||'')+'</div>';
          if((w.status||'pending')==='pending') html+='<div class="row" style="margin-top:16px"><button class="btn" type="button" id="wdPaid">Mark paid</button><button class="btn ghost bad" type="button" id="wdReject">Reject</button></div>';
          html+='</div></div>';
        } else openWd='';
      }
      if(!openWd){
        html='<div class="pane"><h1>Withdrawal requests</h1><p class="sub">Tap a request to review the user balance</p><div class="card" style="padding:8px 14px">';
        if(!wds.length) html+='<p class="note">No withdrawal requests yet.</p>';
        wds.forEach(function(w){ html+='<button type="button" class="donor" style="width:100%;border:0;background:transparent;text-align:left;cursor:pointer;color:inherit;font:inherit" data-wd="'+esc(w.id)+'"><div style="flex:1"><strong>$'+Number(w.amount||0).toLocaleString()+'</strong><div class="note">'+esc(w.email||'')+' · '+esc(w.method||'')+' · '+esc(w.status||'pending')+'</div></div><span class="note">›</span></button>'; });
        html+='</div></div>';
      }
    } else {
      var myWd=HF.listWithdrawals?HF.listWithdrawals(u.email):[];
      html='<div class="pane"><h1>Transfers</h1><p class="sub">Available: $'+m.available.toLocaleString()+' · On hold: $'+m.hold.toLocaleString()+'</p>';
      html+='<div class="card" style="padding:16px;margin-top:12px"><label>Amount (USD)</label><input id="wdAmt" inputmode="decimal"><label>Method</label><select id="wdMethod"><option value="usdt">USDT</option><option value="btc">BTC</option><option value="bank">Bank</option><option value="airtel">Airtel Money</option><option value="mtn">MTN Mobile Money</option></select><label>Address / phone / details</label><input id="wdAddr" placeholder="Wallet, IBAN, or phone number"><button class="btn" type="button" id="wdReq">Request withdrawal</button><p class="note" id="wdMsg"></p></div>';
      html+='<div class="card" style="padding:8px 14px;margin-top:14px"><strong>Your requests</strong>';
      if(!myWd.length) html+='<p class="note">None yet.</p>';
      myWd.forEach(function(w){ html+='<div class="donor"><div style="flex:1"><strong>$'+Number(w.amount||0).toLocaleString()+'</strong><div class="note">'+esc(w.method||'')+' · '+esc(w.status||'pending')+'</div></div></div>'; });
      html+='</div>'+supportCard()+'</div>';
    }
  }else if(tab==='updates'){
    var notes=HF.listNotices?HF.listNotices(u.email):[];
    var myWd2=HF.listWithdrawals?HF.listWithdrawals(u.email):[];
    html='<div class="pane"><h1>Updates</h1><p class="sub">Payout status and notices</p><div class="card" style="padding:8px 14px">';
    if(!notes.length&&!myWd2.filter(function(w){return w.status!=='pending';}).length) html+='<p class="note">No updates yet.</p>';
    notes.forEach(function(n){ html+='<div class="donor"><div style="flex:1"><strong>'+esc(n.text||'')+'</strong><div class="note">'+(n.kind||'')+' · '+new Date(n.at||Date.now()).toLocaleString()+'</div></div></div>'; });
    myWd2.forEach(function(w){ if(w.status==='pending') return; html+='<div class="donor"><div style="flex:1"><strong>Withdrawal $'+Number(w.amount||0).toLocaleString()+' — '+esc(w.status)+'</strong><div class="note">'+esc(w.method||'')+'</div></div></div>'; });
    html+='</div>'+supportCard()+'</div>';
  }else if(tab==='users'&&HF.isAdmin()){
    var ulist=(HF.adminUsers&&HF.adminUsers())||[];
    if(searchQ) ulist=ulist.filter(function(x){ return matchSearch(searchQ,[x.name,x.email]); });
    ulist=ulist.slice().sort(function(a,b){return (b.created||0)-(a.created||0);});
    if(openUser){
      var mm=moneyForEmail(openUser);
      var d=HF.adminUserDetail?HF.adminUserDetail(openUser):null;
      html='<div class="pane"><button type="button" class="mini-btn" id="backUsers">← All users</button>';
      html+='<h1 style="margin-top:12px">'+esc((d&&d.user&&d.user.name)||openUser)+'</h1><p class="sub">'+esc(openUser)+'</p>';
      html+='<div class="stats"><div class="stat"><span>Available</span><b>$'+mm.available.toLocaleString()+'</b></div><div class="stat"><span>On hold</span><b>$'+mm.hold.toLocaleString()+'</b></div><div class="stat"><span>Raised</span><b>$'+mm.received.toLocaleString()+'</b></div><div class="stat"><span>Campaigns</span><b>'+mm.campaigns+'</b></div></div>';
      html+='<button class="btn bad" type="button" id="delUser" style="background:#b91c1c;margin-top:8px">Delete user</button></div>';
    } else {
      html='<div class="pane"><h1>Registered users</h1><p class="sub">'+ulist.length+' accounts</p><div class="card" style="padding:8px 14px">';
      ulist.forEach(function(x){ html+='<button type="button" data-openuser="'+esc(x.email)+'" class="donor" style="width:100%;border:0;background:transparent;text-align:left;cursor:pointer;color:inherit;font:inherit"><div class="dot">'+esc((x.name||x.email||'?').charAt(0).toUpperCase())+'</div><div style="flex:1"><strong>'+esc(x.name||'—')+'</strong><div class="note">'+esc(x.email||'')+(x.isAdmin?' · Admin':'')+'</div></div></button>'; });
      if(!ulist.length) html+='<p class="note">No users yet.</p>';
      html+='</div></div>';
    }
  }else if(tab==='admin'&&HF.isAdmin()){
    var pending=allCamps().filter(function(c){return c&&c.status!=='approved'&&c.status!=='rejected'&&c.status!=='deleted'&&!c.deleted&&(c.ownerEmail||c.organizerEmail);});
    if(searchQ) pending=pending.filter(function(c){return matchSearch(searchQ,[c.title,c.ownerEmail,c.organizer]);});
    html='<div class="pane"><h1>Approve campaigns</h1><p class="sub">'+pending.length+' waiting</p>';
    pending.forEach(function(c){ html+='<div class="approve-card" style="margin-bottom:10px"><div class="approve-row"><div style="flex:1"><strong>'+esc(c.title)+'</strong><div class="note">'+esc(c.ownerEmail||c.organizer||'')+'</div></div><button type="button" class="mini-btn go" data-approve="'+esc(c.id)+'">Approve</button><button type="button" class="mini-btn bad" data-reject="'+esc(c.id)+'">Reject</button></div></div>'; });
    if(!pending.length) html+='<p class="note">Nothing pending.</p>';
    html+='</div>';
  }else if(tab==='settings'){
    html='<div class="pane"><h1>Account settings</h1><div class="card" style="padding:16px"><label>Name</label><input id="setName" value="'+esc(u.name||'')+'"><button class="btn" type="button" id="saveName">Save name</button><p class="note" id="nameMsg"></p><label>Email</label><input value="'+esc(u.email||'')+'" disabled></div>'+supportCard()+'</div>';
  }else html='<div class="pane"><h1>Dashboard</h1>'+supportCard()+'</div>';
  box.innerHTML=html;
  var backUsers=document.getElementById('backUsers'); if(backUsers) backUsers.onclick=function(){openUser='';render();};
  var backWd=document.getElementById('backWd'); if(backWd) backWd.onclick=function(){openWd='';render();};
  box.querySelectorAll('[data-openuser]').forEach(function(b){b.onclick=function(){openUser=b.getAttribute('data-openuser');tab='users';render();};});
  box.querySelectorAll('[data-wd]').forEach(function(b){b.onclick=function(){openWd=b.getAttribute('data-wd');render();};});
  var delUser=document.getElementById('delUser');
  if(delUser) delUser.onclick=function(){ if(!confirm('Delete user '+openUser+'?')) return; setBusy(delUser,true,'Deleting…'); if(HF.deleteUser) HF.deleteUser(openUser); setTimeout(function(){ openUser=''; render(); }, 400); };
  var wdPaid=document.getElementById('wdPaid');
  if(wdPaid) wdPaid.onclick=function(){ setBusy(wdPaid,true,'Processing…'); if(HF.processWithdrawal) HF.processWithdrawal(openWd,'paid'); pullServer().then(function(){ openWd=''; render(); }); };
  var wdReject=document.getElementById('wdReject');
  if(wdReject) wdReject.onclick=function(){ setBusy(wdReject,true,'Rejecting…'); if(HF.processWithdrawal) HF.processWithdrawal(openWd,'rejected'); pullServer().then(function(){ openWd=''; render(); }); };
  var saveName=document.getElementById('saveName');
  if(saveName) saveName.onclick=function(){ setBusy(saveName,true,'Saving…'); var r=HF.updateProfile({name:document.getElementById('setName').value}); var msg=document.getElementById('nameMsg'); if(r&&r.ok){u=HF.session()||u;msg.textContent='Saved.';drawAv();}else msg.textContent=(r&&r.err)||'Failed'; setBusy(saveName,false,'Save name'); };
  box.querySelectorAll('[data-open],[data-view]').forEach(function(b){b.onclick=function(){location.href='/campaign.html?id='+encodeURIComponent(b.getAttribute('data-open')||b.getAttribute('data-view'));};});
  box.querySelectorAll('[data-edit]').forEach(function(b){b.onclick=function(){editId=b.getAttribute('data-edit');render();};});
  box.querySelectorAll('[data-approve]').forEach(function(b){b.onclick=function(){ var id=b.getAttribute('data-approve'); setBusy(b,true,'…'); var p=(window.HFDB&&HFDB.update)?HFDB.update(id,{status:'approved'}):Promise.resolve(); p.then(function(){ if(HF.approveCampaign) HF.approveCampaign(id); return pullServer(); }).then(function(){render();}).catch(function(){render();}); };});
  box.querySelectorAll('[data-reject]').forEach(function(b){b.onclick=function(){ var id=b.getAttribute('data-reject'); setBusy(b,true,'…'); var p=(window.HFDB&&HFDB.update)?HFDB.update(id,{status:'rejected'}):Promise.resolve(); p.then(function(){ if(HF.rejectCampaign) HF.rejectCampaign(id); return pullServer(); }).then(function(){render();}).catch(function(){render();}); };});
  var wdReq=document.getElementById('wdReq');
  if(wdReq) wdReq.onclick=function(){ setBusy(wdReq,true,'Submitting…'); var r=HF.requestWithdrawal({amount:document.getElementById('wdAmt').value, method:document.getElementById('wdMethod').value, address:document.getElementById('wdAddr').value}); var msg=document.getElementById('wdMsg'); if(r&&r.ok){ msg.textContent='Request submitted.'; pullServer().then(function(){render();}); } else { msg.textContent=(r&&r.err)||'Failed'; setBusy(wdReq,false,'Request withdrawal'); } };
  var gadd=document.getElementById('gadd');
  if(gadd){
    var gfind=document.getElementById('gfind'),gpick=document.getElementById('gpick'),gcamp=document.getElementById('gcamp');
    function pickList(q){ q=(q||'').toLowerCase(); var hits=allCamps().filter(function(c){return c&&c.status!=='deleted'&&(!q||String(c.title||'').toLowerCase().indexOf(q)>=0||String(c.ownerEmail||'').toLowerCase().indexOf(q)>=0);}).slice(0,12); gpick.innerHTML=hits.map(function(c){return '<button type="button" class="mini-btn" data-cid="'+esc(c.id)+'">'+esc(c.title||c.id)+' · '+esc(c.ownerEmail||'')+'</button>';}).join(''); gpick.querySelectorAll('[data-cid]').forEach(function(b){b.onclick=function(){gcamp.value=b.getAttribute('data-cid');gfind.value=b.textContent;gpick.innerHTML='';};}); }
    if(gfind) gfind.oninput=function(){pickList(gfind.value);};
    gadd.onclick=function(){ setBusy(gadd,true,'Saving…'); var r=HF.addGift({campaignId:gcamp.value,donor:document.getElementById('gname').value,amount:document.getElementById('gamt').value,title:(document.getElementById('gfind').value||'').split('·')[0].trim()}); var msg=document.getElementById('gmsg'); if(r&&r.ok){msg.textContent='Added and synced.';pullServer().then(function(){render();});} else {msg.textContent=(r&&r.err)||'Failed — pick a campaign'; setBusy(gadd,false,'Add donation');} };
  }
}
document.querySelectorAll('[data-tab]').forEach(function(el){el.addEventListener('click',function(){setTab(el.getAttribute('data-tab'));});});
document.getElementById('homeBtn').onclick=function(){setTab('home');};
document.getElementById('avBtn').onclick=function(){document.getElementById('menu').classList.toggle('hide');};
document.getElementById('lo').onclick=function(){if(HF.logout)HF.logout();location.href='/login';};
if(HF.isAdmin&&HF.isAdmin()){ document.getElementById('adminNav').classList.remove('hide'); document.getElementById('adminMenu').classList.remove('hide'); var un=document.getElementById('usersNav'); if(un) un.classList.remove('hide'); }
var searchBtn=document.getElementById('searchBtn');
if(searchBtn){ searchBtn.onclick=function(){ var q=prompt('Search campaigns or users by name or email', searchQ||''); if(q===null) return; searchQ=q.trim(); searchBtn.textContent=searchQ?('Search: '+searchQ.slice(0,16)):('Search'); render(); }; }
function pullServer(){
  if(!(window.HFDB&&HFDB.list)) return Promise.resolve();
  return HFDB.list().then(function(rows){
    if(!Array.isArray(rows)) return;
    var list=readLocalCamps(); var by={}; list.forEach(function(c){ if(c&&c.id) by[c.id]=c; });
    rows.forEach(function(c){ if(!c||!c.id||c.status==='deleted') return; var prev=by[c.id]||{}; by[c.id]=Object.assign({}, prev, c, { ownerEmail:c.ownerEmail||prev.ownerEmail||'', status:c.status||prev.status||'pending', raised:Math.max(Number(c.raised)||0, Number(prev.raised)||0), donations:Math.max(Number(c.donations)||0, Number(prev.donations)||0), donors:(Array.isArray(c.donors)&&c.donors.length)?c.donors:(prev.donors||[]), image:c.image||prev.image||'', title:c.title||prev.title||'', story:c.story||prev.story||'' }); });
    localStorage.setItem('hopeforus_campaigns', JSON.stringify(Object.keys(by).map(function(k){return by[k];})));
    var jobs=[];
    if(window.HF&&HF.pullMoneyFromServer) jobs.push(HF.pullMoneyFromServer());
    if(HFDB.listProfiles){ jobs.push(HFDB.listProfiles().then(function(rows){ if(!Array.isArray(rows)||!rows.length) return; var local=[]; try{local=JSON.parse(localStorage.getItem('hopeforus_users')||'[]')}catch(e){} if(!Array.isArray(local)) local=[]; var byU={}; local.forEach(function(usr){ if(usr&&usr.email) byU[String(usr.email).toLowerCase()]=usr; }); rows.forEach(function(p){ if(!p||!p.email) return; var em=String(p.email).toLowerCase(); var prev=byU[em]||{}; byU[em]={ id:prev.id||('p_'+em), email:em, name:p.name||prev.name||em.split('@')[0], pass:prev.pass||'', whatsapp:p.whatsapp||prev.whatsapp||'', verified:true, isAdmin:!!(prev.isAdmin||p.isAdmin), created:p.created||prev.created||Date.now(), avatar:p.avatar||p.avatar_url||prev.avatar||'' }; }); localStorage.setItem('hopeforus_users', JSON.stringify(Object.keys(byU).map(function(k){return byU[k];}))); }).catch(function(){})); }
    return Promise.all(jobs);
  }).catch(function(e){ console.warn('pullServer', e); });
}
function boot(){ drawAv(); render(); }
function start(){ boot(); var box=document.getElementById('main'); if(box){ var note=document.createElement('p'); note.id='syncNote'; note.className='note'; note.style.padding='8px 22px'; note.textContent='Syncing from server…'; box.parentNode.insertBefore(note, box); } function done(){ var n=document.getElementById('syncNote'); if(n) n.remove(); render(); drawAv(); } pullServer().then(done).catch(done); setInterval(function(){ pullServer().then(function(){ render(); }).catch(function(){}); }, 30000); }
start();
