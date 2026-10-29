var u=HF.session();
if(!u){ location.replace('/login?return='+encodeURIComponent('/dashboard/')); throw 0; }
var tab=(HF.isAdmin&&HF.isAdmin()&&location.hash==='#admin')?'admin':'home', openId='', editId='', openUser='', method='usdt', adminView='overview';
var av=localStorage.getItem('hf_avatar_'+u.email)||'';
if(window.HF&&HF.getUserAvatar){ var ga=HF.getUserAvatar(u.email); if(ga) av=ga; }
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function allCamps(){
  var by={}, list=[];
  try{list=JSON.parse(localStorage.getItem('hopeforus_campaigns')||'[]')}catch(e){}
  if(!Array.isArray(list)) list=[];
  list.forEach(function(c){ if(c&&c.id) by[c.id]=c; });
  (HF.adminCampaigns?HF.adminCampaigns():[]).forEach(function(c){ if(c&&c.id&&!by[c.id]) by[c.id]=c; });
  return Object.keys(by).map(function(k){ return by[k]; });
}
function camps(){return HF.myCampaigns(u)||[]}
function money(list){
  var now=Date.now(), ten=10*86400000, received=0, hold=0, ready=0;
  list.forEach(function(c){
    var amt=Number(c.raised)||0; received+=amt;
    var at=Date.parse(c.createdAt||c.created||'')||now;
    if(now-at>=ten) ready+=amt; else hold+=amt;
  });
  var wd=(HF.listWithdrawals(u.email)||[]).filter(function(w){return w.status!=='rejected'&&w.status!=='cancelled'});
  var withdrawn=wd.reduce(function(n,w){return n+(Number(w.amount)||0)},0);
  return {received:received,hold:hold,ready:ready,withdrawn:withdrawn,balance:Math.max(0,received-withdrawn),available:Math.max(0,ready-withdrawn)};
}
function saveCamp(c){
  var list=[]; try{list=JSON.parse(localStorage.getItem('hopeforus_campaigns')||'[]')}catch(e){}
  if(!Array.isArray(list)) list=[];
  var i=list.findIndex(function(x){return x&&x.id===c.id});
  var fields={title:c.title,story:c.story,goal:c.goal,image:c.image,images:c.images||[],video:c.video||'',organizerAvatar:c.organizerAvatar||'',ownerAvatar:c.ownerAvatar||''};
  if(i>=0){ Object.keys(fields).forEach(function(k){list[i][k]=fields[k]}); }
  else { var copy={}; Object.keys(c).forEach(function(k){copy[k]=c[k]}); Object.keys(fields).forEach(function(k){copy[k]=fields[k]}); list.unshift(copy); }
  localStorage.setItem('hopeforus_campaigns',JSON.stringify(list));
  if(HF.saveCampaign) try{HF.saveCampaign(list[i>=0?i:0]);}catch(e){}
}
function drawAv(){
  var b=document.getElementById('avBtn');
  b.innerHTML=av?'<img alt="" src="'+av+'">':esc((u.name||u.email||'J').slice(0,1).toUpperCase());
}
function setTab(name){tab=name;openId='';editId='';openUser='';document.getElementById('menu').classList.add('hide');if(name==='admin')location.hash='admin';else if(location.hash==='#admin')history.replaceState(null,'',location.pathname);render()}
function render(){
  document.querySelectorAll('[data-tab]').forEach(function(el){el.classList.toggle('on', el.getAttribute('data-tab')===tab)});
  if(HF.isAdmin&&HF.isAdmin()){
    var waitN=allCamps().filter(function(c){return c&&c.status!=='approved'&&c.status!=='rejected'&&c.status!=='deleted'&&!c.deleted&&!(window.HF_SAMPLE_IDS&&HF_SAMPLE_IDS[c.id])&&(c.ownerEmail||c.ownerId||c.organizerEmail)}).length;
    var nav=document.getElementById('adminNav');
    if(nav) nav.innerHTML='<i>✓</i> Approve'+(waitN?' ('+waitN+')':'');
    var un=document.getElementById('usersNav'); if(un) un.classList.remove('hide');
  }
  var box=document.getElementById('main'), all=camps().filter(function(c){return c && c.status!=='rejected' && c.status!=='deleted' && !c.deleted}), list=all, m=money(all), html='';
  if(HF.isAdmin&&HF.isAdmin() && tab==='home') list=all.filter(function(c){return c.status==='approved'});
  if(editId){
    var c=all.find(function(x){return x.id===editId}) || (HF.adminCampaigns?HF.adminCampaigns():[]).find(function(x){return x.id===editId});
    if(!c){editId='';render();return}
    html='<div class="pane"><form id="editForm" class="card" style="padding:16px"><h1>Edit campaign</h1><label>Name</label><input id="eTitle" value="'+esc(c.title)+'"><label>Story</label><textarea id="eStory">'+esc(c.story||'')+'</textarea><label>Goal</label><input id="eGoal" value="'+esc(c.goal)+'"><div class="row"><button class="btn" type="submit">Save</button><button class="btn" type="button" id="back" style="background:transparent;color:#333;border:1px solid #e5e5e5">Back</button></div></form></div>';
    box.innerHTML=html;
    document.getElementById('back').onclick=function(){editId='';render()};
    document.getElementById('editForm').onsubmit=function(e){e.preventDefault();c.title=document.getElementById('eTitle').value.trim();c.story=document.getElementById('eStory').value;c.goal=parseFloat(document.getElementById('eGoal').value)||c.goal;saveCamp(c);editId='';render();};
    return;
  }
  if(tab==='home'){
    html='<div class="pane"><h1>Dashboard</h1><p class="sub">Welcome'+(u.name?', '+esc(u.name):'')+'.</p><div class="stats"><div class="stat"><span>Raised</span><b>$'+m.received.toLocaleString()+'</b></div><div class="stat"><span>Available</span><b>$'+m.available.toLocaleString()+'</b></div><div class="stat"><span>On hold</span><b>$'+m.hold.toLocaleString()+'</b></div><div class="stat"><span>Campaigns</span><b>'+list.length+'</b></div></div><div class="camp-grid">';
    if(!list.length) html+='<p class="note">No campaigns yet.</p>';
    list.forEach(function(c){
      var r=Number(c.raised)||0,g=Math.max(1,Number(c.goal)||1),pct=Math.min(100,Math.round(r/g*100));
      html+='<article class="camp card"><button type="button" class="camp-top" data-open="'+esc(c.id)+'">'+(c.image?'<img src="'+esc(c.image)+'" alt="">':'')+'<div class="body"><strong>'+esc(c.title||'Untitled')+'</strong><div class="bar"><i style="width:'+pct+'%"></i></div><div class="note">$'+r.toLocaleString()+' · '+esc(c.status||'')+'</div></div></button><div class="acts"><button type="button" class="go" data-view="'+esc(c.id)+'">View</button><button type="button" data-edit="'+esc(c.id)+'">Edit</button></div></article>';
    });
    html+='</div></div>';
  }else if(tab==='donations' && HF.isAdmin()){
    var allG=HF.listGifts();
    html='<div class="pane"><h1>Donations received</h1><p class="sub">Add donor + amount to a campaign</p><div class="card" style="padding:14px"><label>Campaign</label><input id="gfind" placeholder="Search title or email"><input id="gcamp" type="hidden"><div id="gpick"></div><label>Donor name</label><input id="gname"><label>Amount (USD)</label><input id="gamt" inputmode="decimal"><button class="btn" id="gadd" type="button">Add donation</button><p class="note" id="gmsg"></p></div><div class="card" style="padding:8px 14px;margin-top:12px">';
    (allG||[]).forEach(function(g){html+='<div class="donor"><div style="flex:1"><strong>'+esc(g.donor)+'</strong><div class="note">'+esc(g.title)+'</div></div><strong>$'+Number(g.amount).toLocaleString()+'</strong></div>'});
    if(!(allG||[]).length) html+='<p class="note">None yet.</p>';
    html+='</div></div>';
  }else if(tab==='donations'){
    var mine=HF.listGifts(u.email)||[];
    html='<div class="pane"><h1>Donations Received</h1><div class="card" style="padding:8px 14px">';
    if(!mine.length) html+='<p class="note">No gifts yet.</p>';
    mine.forEach(function(g){html+='<div class="donor"><div style="flex:1"><strong>'+esc(g.donor)+'</strong><div class="note">'+esc(g.title)+'</div></div><strong>$'+Number(g.amount).toLocaleString()+'</strong></div>'});
    html+='</div></div>';
  }else if(tab==='users' && HF.isAdmin() && openUser){
    var d=HF.adminUserDetail?HF.adminUserDetail(openUser):null;
    html='<div class="pane"><button type="button" class="mini-btn" id="backUsers">← All users</button>';
    if(!d) html+='<p class="note">User not found</p></div>';
    else {
      var xu=d.user||{};
      html+='<h1 style="margin-top:12px">'+esc(xu.name||openUser)+'</h1><p class="sub">'+esc(xu.email||openUser)+'</p>';
      html+='<div class="stats"><div class="stat"><span>Raised</span><b>$'+Number(d.raised||0).toLocaleString()+'</b></div><div class="stat"><span>Pending WD</span><b>$'+Number(d.pendingWithdraw||0).toLocaleString()+'</b></div><div class="stat"><span>Paid out</span><b>$'+Number(d.completedWithdraw||0).toLocaleString()+'</b></div><div class="stat"><span>Campaigns</span><b>'+(d.camps||[]).length+'</b></div></div>';
      html+='<div class="card" style="padding:14px;margin-bottom:12px"><strong>Contact</strong><div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">';
      html+='<a href="mailto:'+esc(xu.email||openUser)+'" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #e5e5e5;border-radius:10px;text-decoration:none;color:#1a1a1a;background:#fafafa;font-size:.9rem;font-weight:600"><span style="width:28px;height:28px;border-radius:8px;background:#f3f0ff;color:#7C3AED;display:grid;place-items:center;font-size:.85rem">✉</span><span>Email '+esc(xu.email||openUser)+'</span></a>';
      if(d.hasApproved) html+='<a href="'+(HF.whatsappLink?HF.whatsappLink('Hi, HopeForUs account '+ (xu.email||'')):'https://wa.me/256745901115')+'" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #e5e5e5;border-radius:10px;text-decoration:none;color:#1a1a1a;background:#fafafa;font-size:.9rem;font-weight:600"><span style="width:28px;height:28px;border-radius:8px;background:#ecfdf5;color:#059669;display:grid;place-items:center;font-size:.85rem">💬</span><span>WhatsApp · +256 745 901115</span></a>';
      html+='</div></div><div class="card" style="padding:8px 14px;margin-bottom:12px"><strong>Campaigns</strong>';
      (d.camps||[]).forEach(function(c){html+='<div class="donor"><div style="flex:1"><strong>'+esc(c.title||c.id)+'</strong><div class="note">$'+Number(c.raised||0).toLocaleString()+' · '+esc(c.status||'')+'</div></div></div>'});
      if(!(d.camps||[]).length) html+='<p class="note">None</p>';
      html+='</div><div class="card" style="padding:8px 14px;margin-bottom:12px"><strong>Withdrawals</strong>';
      (d.withdrawals||[]).forEach(function(w){html+='<div class="donor"><div style="flex:1"><strong>$'+Number(w.amount).toLocaleString()+'</strong><div class="note">'+esc(w.status)+(w.reason?' — '+esc(w.reason):'')+'</div></div></div>'});
      if(!(d.withdrawals||[]).length) html+='<p class="note">None</p>';
      html+='</div><div class="card" style="padding:8px 14px"><strong>Activity</strong>';
      (d.activity||[]).slice(0,40).forEach(function(a){html+='<div class="donor"><div style="flex:1"><strong>'+esc(a.action)+'</strong><div class="note">'+esc(a.detail||'')+'</div></div><div class="note">'+(a.at?new Date(a.at).toLocaleString():'')+'</div></div>'});
      if(!(d.activity||[]).length) html+='<p class="note">No activity</p>';
      html+='</div></div>';
    }
  }else if(tab==='users' && HF.isAdmin()){
    var ulist=(HF.adminUsers&&HF.adminUsers())||[];
    ulist=ulist.slice().sort(function(a,b){return (b.created||0)-(a.created||0);});
    var msgs=(HF.listMessages&&HF.listMessages())||[];
    html='<div class="pane"><h1>Registered users</h1><p class="sub">'+ulist.length+' accounts · tap a user for details</p>';
    if(msgs.length){
      html+='<div class="card" style="padding:8px 14px;margin-bottom:12px"><strong>Support messages</strong>';
      msgs.slice(0,20).forEach(function(m){
        html+='<div class="donor" style="align-items:flex-start"><div style="flex:1"><strong>'+esc(m.name||m.from)+'</strong><div class="note">'+esc(m.text)+'</div></div><button type="button" class="mini-btn" data-openuser="'+esc(m.from)+'">User</button></div>';
        if(HF.markMessageRead&&m.id) HF.markMessageRead(m.id);
      });
      html+='</div>';
    }
    html+='<div class="card" style="padding:8px 14px">';
    ulist.forEach(function(x){
      html+='<button type="button" data-openuser="'+esc(x.email)+'" class="donor" style="width:100%;border:0;background:transparent;text-align:left;cursor:pointer;color:inherit;font:inherit"><div class="dot">'+esc((x.name||x.email||'?').charAt(0).toUpperCase())+'</div><div style="flex:1"><strong>'+esc(x.name||'—')+'</strong><div class="note">'+esc(x.email||'')+(x.isAdmin?' · Admin':'')+'</div></div></button>';
    });
    if(!ulist.length) html+='<p class="note">No users yet.</p>';
    html+='</div></div>';
  }else if(tab==='transfers' && HF.isAdmin()){
    var allW=HF.listWithdrawals?HF.listWithdrawals():[];
    var pending=(allW||[]).filter(function(w){return w&&w.status==='pending';});
    var done=(allW||[]).filter(function(w){return w&&w.status!=='pending';});
    html='<div class="pane"><h1>Withdrawal requests</h1><p class="sub">'+pending.length+' pending</p>';
    if(!pending.length) html+='<div class="card" style="padding:14px"><p class="note">No pending requests.</p></div>';
    pending.forEach(function(w){
      html+='<div class="card" style="padding:14px;margin-bottom:10px"><div style="display:flex;justify-content:space-between"><strong>'+esc(w.name||w.email)+'</strong><strong>$'+Number(w.amount).toLocaleString()+'</strong></div>';
      html+='<div class="note">'+esc(w.email)+' · '+esc(w.method||'')+' · '+esc(w.address||'')+'</div>';
      html+='<label>Note / reason</label><input id="wr_'+esc(w.id)+'" placeholder="Optional note">';
      html+='<div class="row" style="margin-top:8px"><button type="button" class="btn" data-wdone="'+esc(w.id)+'">Mark completed</button><button type="button" class="btn" data-wrej="'+esc(w.id)+'" style="background:#fff;color:#b91c1c;border:1px solid #fecaca">Reject</button></div></div>';
    });
    if(done.length){ html+='<h2 style="font-size:1rem;margin:18px 0 8px">History</h2>'; done.slice(0,30).forEach(function(w){ html+='<div class="donor"><div style="flex:1"><strong>'+esc(w.name||w.email)+'</strong><div class="note">$'+Number(w.amount).toLocaleString()+' · '+esc(w.status)+(w.reason?' — '+esc(w.reason):'')+'</div></div></div>'; }); }
    html+='</div>';
  }else if(tab==='transfers'){
    html='<div class="pane"><h1>Transfers</h1><p class="sub">Available: $'+m.available.toLocaleString()+'</p><div class="card" style="padding:14px"><label>Amount</label><input id="wdAmt" inputmode="decimal"><label>Method</label><select id="wdMethod"><option value="usdt">USDT</option><option value="bank">Bank</option><option value="mobile">Mobile money</option></select><label>Payout details</label><input id="wdAddr" placeholder="Wallet / account"><button class="btn" type="button" id="wdReq">Request withdrawal</button><p class="note" id="wdMsg"></p></div>';
    var myW=HF.listWithdrawals(u.email)||[];
    html+='<div class="card" style="padding:8px 14px;margin-top:12px">';
    if(!myW.length) html+='<p class="note">No requests yet.</p>';
    myW.forEach(function(w){html+='<div class="donor"><div style="flex:1"><strong>$'+Number(w.amount).toLocaleString()+'</strong><div class="note">'+esc(w.status)+(w.reason?' — '+esc(w.reason):'')+'</div></div></div>'});
    html+='</div></div>';
  }else if(tab==='updates' && HF.isAdmin()){
    html='<div class="pane"><h1>Site updates</h1><p class="sub">Notify all users</p><div class="card" style="padding:14px"><label>Title</label><input id="upTitle"><label>Message</label><textarea id="upBody"></textarea><label>Audience</label><input id="upAud" value="all" placeholder="all or user email"><button class="btn" type="button" id="upPost">Post update</button><p class="note" id="upMsg"></p></div>';
    var ups=HF.listUpdates?HF.listUpdates():[];
    html+='<div class="card" style="padding:8px 14px;margin-top:12px">';
    (ups||[]).slice(0,40).forEach(function(x){html+='<div class="donor" style="align-items:flex-start"><div style="flex:1"><strong>'+esc(x.title)+'</strong><div class="note">'+esc(x.body)+'</div></div></div>'});
    if(!(ups||[]).length) html+='<p class="note">No updates yet.</p>';
    html+='</div></div>';
  }else if(tab==='updates'){
    var ups=HF.listUpdates?HF.listUpdates(u.email):[];
    html='<div class="pane"><h1>Updates</h1><div class="card" style="padding:8px 14px">';
    if(!ups.length) html+='<p class="note">No updates yet.</p>';
    ups.forEach(function(x){html+='<div class="donor" style="align-items:flex-start"><div style="flex:1"><strong>'+esc(x.title)+'</strong><div class="note">'+esc(x.body)+'</div></div></div>'});
    html+='</div>';
    var canWA=HF.userHasApprovedCampaign&&HF.userHasApprovedCampaign(u.email);
    html+='<div class="card" style="padding:14px;margin-top:12px"><h2 style="font-size:1rem">Need help?</h2>';
    if(canWA){
      html+='<p class="note">Chat with support for campaign help.</p><a href="'+(HF.whatsappLink?HF.whatsappLink('Hi HopeForUs, I need help ('+u.email+')'):'https://wa.me/256745901115')+'" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid #e5e5e5;border-radius:12px;text-decoration:none;color:#1a1a1a;background:#fafafa;font-weight:600;font-size:.95rem"><span style="width:32px;height:32px;border-radius:8px;background:#ecfdf5;color:#059669;display:grid;place-items:center">💬</span><span>Message on WhatsApp</span></a>';
    } else {
      html+='<p class="note">Message admin (WhatsApp unlocks after campaign approval).</p><label>Message</label><textarea id="supMsg"></textarea><button class="btn" type="button" id="supSend">Send to admin</button><p class="note" id="supNote"></p>';
    }
    html+='</div></div>';
  }else if(tab==='settings'){
    var isAdm=!!(HF.isAdmin&&HF.isAdmin());
    html='<div class="pane"><h1>Account settings</h1><div class="card" style="padding:16px;margin-bottom:14px"><h2 style="font-size:1rem">Display name</h2><p class="note">Shows on your campaigns</p><label>Name</label><input id="setName" value="'+esc(u.name||'')+'"><button class="btn" type="button" id="saveName">Save name</button><p class="note" id="nameMsg"></p></div>';
    html+='<div class="card" style="padding:16px;margin-bottom:14px"><h2 style="font-size:1rem">Email</h2><label>Current</label><input value="'+esc(u.email||'')+'" disabled>';
    if(isAdm) html+='<p class="note">Admin email fixed: admin@hopeforus.com</p>';
    else html+='<label>New email</label><input id="setEmail" type="email"><label>Password</label><input id="setEmailPass" type="password"><button class="btn" type="button" id="saveEmail">Update email</button><p class="note" id="emailMsg"></p>';
    html+='</div><div class="card" style="padding:16px"><h2 style="font-size:1rem">Password</h2>';
    if(isAdm) html+='<p class="note">Admin password fixed: <strong>Admin@2026</strong></p>';
    else html+='<label>Current</label><input id="setCurPass" type="password"><label>New</label><input id="setNewPass" type="password"><label>Confirm</label><input id="setNewPass2" type="password"><button class="btn" type="button" id="savePass">Change password</button><p class="note" id="passMsg"></p>';
    html+='</div></div>';
  }else if(tab==='admin' && HF.isAdmin()){
    var pending=allCamps().filter(function(c){return c&&c.status!=='approved'&&c.status!=='rejected'&&c.status!=='deleted'&&!c.deleted&&!(window.HF_SAMPLE_IDS&&HF_SAMPLE_IDS[c.id])&&(c.ownerEmail||c.ownerId||c.organizerEmail)});
    html='<div class="pane"><h1>Approve campaigns</h1><p class="sub">'+pending.length+' waiting</p>';
    pending.forEach(function(c){
      html+='<div class="approve-card" style="margin-bottom:10px"><div class="approve-row"><div style="flex:1"><strong>'+esc(c.title)+'</strong><div class="note">'+esc(c.ownerEmail||c.organizer||'')+'</div></div><button type="button" class="mini-btn go" data-approve="'+esc(c.id)+'">Approve</button><button type="button" class="mini-btn bad" data-reject="'+esc(c.id)+'">Reject</button></div></div>';
    });
    if(!pending.length) html+='<p class="note">Nothing pending.</p>';
    html+='</div>';
  }else html='<div class="pane"><h1>Dashboard</h1></div>';
  box.innerHTML=html;
  var backUsers=document.getElementById('backUsers'); if(backUsers) backUsers.onclick=function(){openUser='';render();};
  box.querySelectorAll('[data-openuser]').forEach(function(b){b.onclick=function(){openUser=b.getAttribute('data-openuser');tab='users';render();};});
  box.querySelectorAll('[data-wdone]').forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-wdone');var el=document.getElementById('wr_'+id);var r=HF.processWithdrawal(id,'completed',el?el.value:'');if(r&&r.ok)render();else alert((r&&r.err)||'Failed');};});
  box.querySelectorAll('[data-wrej]').forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-wrej');var el=document.getElementById('wr_'+id);var reason=el?el.value:'';if(!reason)reason=prompt('Reason?')||'';var r=HF.processWithdrawal(id,'rejected',reason);if(r&&r.ok)render();else alert((r&&r.err)||'Failed');};});
  var wdReq=document.getElementById('wdReq'); if(wdReq) wdReq.onclick=function(){var r=HF.requestWithdrawal({amount:document.getElementById('wdAmt').value,method:document.getElementById('wdMethod').value,address:document.getElementById('wdAddr').value});var m=document.getElementById('wdMsg');if(r&&r.ok){m.textContent='Submitted.';render();}else m.textContent=(r&&r.err)||'Failed';};
  var upPost=document.getElementById('upPost'); if(upPost) upPost.onclick=function(){var r=HF.postUpdate(document.getElementById('upTitle').value,document.getElementById('upBody').value,document.getElementById('upAud').value||'all');var m=document.getElementById('upMsg');if(r&&r.ok){m.textContent='Posted.';render();}else m.textContent=(r&&r.err)||'Failed';};
  var supSend=document.getElementById('supSend'); if(supSend) supSend.onclick=function(){var r=HF.sendMessage(document.getElementById('supMsg').value);var m=document.getElementById('supNote');if(r&&r.ok){m.textContent='Sent.';document.getElementById('supMsg').value='';}else m.textContent=(r&&r.err)||'Failed';};
  var saveName=document.getElementById('saveName'); if(saveName) saveName.onclick=function(){var r=HF.updateProfile({name:document.getElementById('setName').value});var m=document.getElementById('nameMsg');if(r&&r.ok){u=HF.session()||u;m.textContent='Saved.';drawAv();}else m.textContent=(r&&r.err)||'Failed';};
  var saveEmail=document.getElementById('saveEmail'); if(saveEmail) saveEmail.onclick=function(){var r=HF.changeEmail(document.getElementById('setEmail').value,document.getElementById('setEmailPass').value);var m=document.getElementById('emailMsg');if(r&&r.ok){u=HF.session()||u;m.textContent='Updated.';render();}else m.textContent=(r&&r.err)||'Failed';};
  var savePass=document.getElementById('savePass'); if(savePass) savePass.onclick=function(){var p1=document.getElementById('setNewPass').value,p2=document.getElementById('setNewPass2').value,m=document.getElementById('passMsg');if(p1!==p2){m.textContent='Passwords do not match';return;}var r=HF.changePassword(document.getElementById('setCurPass').value,p1);if(r&&r.ok)m.textContent='Changed.';else m.textContent=(r&&r.err)||'Failed';};
  box.querySelectorAll('[data-open],[data-view]').forEach(function(b){b.onclick=function(){location.href='/campaign/index.html?id='+encodeURIComponent(b.getAttribute('data-open')||b.getAttribute('data-view'));};});
  box.querySelectorAll('[data-edit]').forEach(function(b){b.onclick=function(){editId=b.getAttribute('data-edit');render();};});
  box.querySelectorAll('[data-approve]').forEach(function(b){b.onclick=function(){if(HF.approveCampaign)HF.approveCampaign(b.getAttribute('data-approve'));render();};});
  box.querySelectorAll('[data-reject]').forEach(function(b){b.onclick=function(){if(HF.rejectCampaign)HF.rejectCampaign(b.getAttribute('data-reject'));render();};});
  var gadd=document.getElementById('gadd');
  if(gadd){
    var gfind=document.getElementById('gfind'),gpick=document.getElementById('gpick'),gcamp=document.getElementById('gcamp');
    function pickList(q){q=(q||'').toLowerCase();var hits=allCamps().filter(function(c){return c&&(!q||String(c.title||'').toLowerCase().indexOf(q)>=0||String(c.ownerEmail||'').toLowerCase().indexOf(q)>=0);}).slice(0,8);gpick.innerHTML=hits.map(function(c){return '<button type="button" class="mini-btn" data-cid="'+esc(c.id)+'">'+esc(c.title||c.id)+'</button>';}).join('');gpick.querySelectorAll('[data-cid]').forEach(function(b){b.onclick=function(){gcamp.value=b.getAttribute('data-cid');gfind.value=b.textContent;gpick.innerHTML='';};});}
    if(gfind) gfind.oninput=function(){pickList(gfind.value);};
    gadd.onclick=function(){var r=HF.addGift({campaignId:gcamp.value,donor:document.getElementById('gname').value,amount:document.getElementById('gamt').value});var msg=document.getElementById('gmsg');if(r&&r.ok){msg.textContent='Added.';render();}else msg.textContent=(r&&r.err)||'Failed';};
  }
}
document.querySelectorAll('[data-tab]').forEach(function(el){el.addEventListener('click',function(){setTab(el.getAttribute('data-tab'));});});
document.getElementById('homeBtn').onclick=function(){setTab('home');};
document.getElementById('avBtn').onclick=function(){document.getElementById('menu').classList.toggle('hide');};
document.getElementById('lo').onclick=function(){if(HF.logout)HF.logout();location.href='/login';};
if(HF.isAdmin&&HF.isAdmin()){document.getElementById('adminNav').classList.remove('hide');document.getElementById('adminMenu').classList.remove('hide');var un=document.getElementById('usersNav');if(un)un.classList.remove('hide');}
document.getElementById('photoBtn')&&document.getElementById('photoBtn').addEventListener('click',function(){document.getElementById('photoFile').click();});
document.getElementById('photoFile')&&document.getElementById('photoFile').addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];if(!f)return;var reader=new FileReader();reader.onload=function(){av=reader.result;try{localStorage.setItem('hf_avatar_'+u.email,av);}catch(err){}if(HF.setUserAvatar)HF.setUserAvatar(u.email,av);drawAv();};reader.readAsDataURL(f);});
drawAv();
function boot(){render();}
function pullServer(){if(window.HFDB&&HFDB.list)return HFDB.list().catch(function(){return[];}).then(function(){});return Promise.resolve();}
if(window.HFDB&&HFDB.ready)HFDB.ready().then(function(){return pullServer();}).then(boot);
else pullServer().then(boot);
