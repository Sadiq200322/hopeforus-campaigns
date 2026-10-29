var u=HF.session();
if(!u){ location.replace('/login?return='+encodeURIComponent('/dashboard/')); throw 0; }
var tab=(HF.isAdmin&&HF.isAdmin()&&location.hash==='#admin')?'admin':'home', openId='', editId='', method='usdt', adminView='overview';
var av=localStorage.getItem('hf_avatar_'+u.email)||'';
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&','<':'<','>':'>','"':'"',"'":'&#39;'}[c]})}
function allCamps(){
  var by={}, list=[];
  try{list=JSON.parse(localStorage.getItem('hopeforus_campaigns')||'[]')}catch(e){}
  if(!Array.isArray(list)) list=[];
  list.forEach(function(c){ if(c&&c.id) by[c.id]=c; });
  (HF.adminCampaigns?HF.adminCampaigns():[]).forEach(function(c){ if(c&&c.id&&!by[c.id]) by[c.id]=c; });
  return Object.keys(by).map(function(k){ return by[k]; });
}
function isUserCamp(c){ return !!(c&&(c.ownerEmail||c.ownerId||c.organizerEmail)); }
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
function nextPayout(){
  var n=new Date(), d=n.getDate(), t=d<10?new Date(n.getFullYear(),n.getMonth(),10):d<25?new Date(n.getFullYear(),n.getMonth(),25):new Date(n.getFullYear(),n.getMonth()+1,10);
  return t.toLocaleDateString(undefined,{month:'short',day:'numeric'});
}
function saveCamp(c){
  var list=[]; try{list=JSON.parse(localStorage.getItem('hopeforus_campaigns')||'[]')}catch(e){}
  if(!Array.isArray(list)) list=[];
  var i=list.findIndex(function(x){return x&&x.id===c.id});
  var fields={title:c.title,story:c.story,goal:c.goal,image:c.image,images:c.images||[],video:c.video||''};
  if(i>=0){ Object.keys(fields).forEach(function(k){list[i][k]=fields[k]}); }
  else { var copy={}; Object.keys(c).forEach(function(k){copy[k]=c[k]}); Object.keys(fields).forEach(function(k){copy[k]=fields[k]}); list.unshift(copy); }
  localStorage.setItem('hopeforus_campaigns',JSON.stringify(list));
}
function updates(){try{return JSON.parse(localStorage.getItem('hf_updates_'+u.email)||'[]')}catch(e){return []}}
function saveUpdates(list){localStorage.setItem('hf_updates_'+u.email,JSON.stringify(list))}
function drawAv(){
  var b=document.getElementById('avBtn');
  b.innerHTML=av?'<img alt="" src="'+av+'">':esc((u.name||u.email||'J').slice(0,1).toUpperCase());
}
function setTab(name){tab=name;openId='';editId='';document.getElementById('menu').classList.add('hide');if(name==='admin')location.hash='admin';else if(location.hash==='#admin')history.replaceState(null,'',location.pathname);render()}
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
    if(!Array.isArray(c.images)||!c.images.length) c.images=c.image?[c.image]:[];
    html='<div class="pane"><form id="editForm" class="card" style="padding:16px"><h1>Edit campaign</h1>'
      +'<label>Photos and video</label><div class="gals" id="gals"></div>'
      +'<div class="row"><label class="btn" style="display:inline-flex">Add photos<input id="addPhotos" type="file" accept="image/*" multiple class="hide"></label>'
      +'<label class="btn" style="display:inline-flex;background:#fff;color:#4C1D95;border:1px solid #e5e5e5">Add video<input id="addVideo" type="file" accept="video/*" class="hide"></label></div>'
      +(c.video?'<p class="note" id="vidNote">A video is attached. It plays on the campaign page.</p>':'<p class="note" id="vidNote"></p>')
      +'<div id="cropBox" class="crop hide"><strong>Crop</strong><p class="note">Drag the photo. Use the slider to zoom. Save crop replaces that photo.</p><canvas id="cropCvs" width="360" height="360"></canvas><input id="cropZoom" type="range" min="1" max="3" step="0.01" value="1" style="width:100%;max-width:360px"><div class="row"><button class="btn" id="cropSave" type="button">Save crop</button><button class="btn" id="cropCancel" type="button" style="background:transparent;color:#333;border:1px solid #e5e5e5">Cancel</button></div></div>'
      +'<label>Name</label><input id="eTitle" value="'+esc(c.title)+'"><label>Story</label><textarea id="eStory">'+esc(c.story||'')+'</textarea><label>Goal (USD)</label><input id="eGoal" value="'+esc(c.goal)+'">'
      +'<p class="note">$'+(Number(c.raised)||0).toLocaleString()+' already raised. That number stays.</p><div class="row"><button class="btn" type="submit">Save</button><button class="btn" type="button" id="back" style="background:transparent;color:#333;border:1px solid #e5e5e5">Back</button></div></form></div>';
    box.innerHTML=html;
    /* edit handlers continue in full file */
    document.getElementById('back').onclick=function(){editId='';render()};
    document.getElementById('editForm').onsubmit=function(e){
      e.preventDefault();
      c.title=document.getElementById('eTitle').value.trim();
      c.story=document.getElementById('eStory').value;
      c.goal=parseFloat(document.getElementById('eGoal').value)||c.goal;
      c.image=c.images[0]||c.image||'';
      saveCamp(c); if(HF.saveCampaign) try{HF.saveCampaign(c)}catch(err){}
      editId='';render();
    };
    return;
  }
  if(tab==='home'){
    html='<div class="pane"><h1>Dashboard</h1><p class="sub">Welcome back'+(u.name?', '+esc(u.name):'')+'.</p>';
    html+='<div class="stats"><div class="stat"><span>Raised</span><b>$'+m.received.toLocaleString()+'</b></div><div class="stat"><span>Available</span><b>$'+m.available.toLocaleString()+'</b></div><div class="stat"><span>On hold</span><b>$'+m.hold.toLocaleString()+'</b></div><div class="stat"><span>Campaigns</span><b>'+list.length+'</b></div></div>';
    html+='<div class="camp-grid">';
    if(!list.length) html+='<p class="note">No campaigns yet. <a href="/start">Start one</a></p>';
    list.forEach(function(c){
      var r=Number(c.raised)||0,g=Math.max(1,Number(c.goal)||1),pct=Math.min(100,Math.round(r/g*100));
      html+='<article class="camp card"><button type="button" class="camp-top" data-open="'+esc(c.id)+'">'+(c.image?'<img src="'+esc(c.image)+'" alt="">':'')+'<div class="body"><strong>'+esc(c.title||'Untitled')+'</strong><div class="bar"><i style="width:'+pct+'%"></i></div><div class="note">$'+r.toLocaleString()+' of $'+g.toLocaleString()+' · '+esc(c.status||'')+'</div></div></button>';
      html+='<div class="acts"><button type="button" class="go" data-view="'+esc(c.id)+'">View</button><button type="button" data-edit="'+esc(c.id)+'">Edit</button><button type="button" class="bad" data-del="'+esc(c.id)+'">Delete</button></div></article>';
    });
    html+='</div></div>';
  }else if(tab==='donations' && HF.isAdmin()){
    var allG=HF.listGifts();
    var allC=allCamps();
    html='<div class="pane"><h1>Donations received</h1><p class="sub">Search for a campaign, then add the donor and the amount.</p><div class="card" style="padding:14px"><label>Campaign</label><input id="gfind" placeholder="Search title or email" autocomplete="off"><input id="gcamp" type="hidden"><div id="gpick"></div><label>Donor name</label><input id="gname" placeholder="Name"><label>Amount (USD)</label><input id="gamt" inputmode="decimal" placeholder="25"><button class="btn" id="gadd" type="button">Add donation</button><p class="note" id="gmsg"></p></div>';
    html+='<div class="card" style="padding:8px 14px;margin-top:12px">';
    if(!allG.length) html+='<p class="note">None yet.</p>';
    allG.forEach(function(g){html+='<div class="donor"><div style="flex:1"><strong>'+esc(g.donor)+'</strong><div class="note">'+esc(g.title)+'</div></div><div><strong>$'+Number(g.amount).toLocaleString()+'</strong></div></div>'});
    html+='</div></div>';
  }else if(tab==='donations'){
    var mine=HF.listGifts(u.email);
    html='<div class="pane"><h1>Donations Received</h1><p class="sub">$'+m.received.toLocaleString()+' total</p><div class="card" style="padding:8px 14px">';
    if(!mine.length) html+='<p class="note">No gifts yet.</p>';
    mine.forEach(function(g){html+='<div class="donor"><div style="flex:1"><strong>'+esc(g.donor)+'</strong><div class="note">'+esc(g.title)+'</div></div><div><strong>$'+Number(g.amount).toLocaleString()+'</strong></div></div>'});
    html+='</div></div>';
  }else if(tab==='users' && HF.isAdmin()){
    var ulist=(HF.adminUsers&&HF.adminUsers())||[];
    ulist=ulist.slice().sort(function(a,b){return (b.created||0)-(a.created||0);});
    html='<div class="pane"><h1>Registered users</h1><p class="sub">'+ulist.length+' account'+(ulist.length===1?'':'s')+' · newest first</p><div class="card" style="padding:8px 14px">';
    if(!ulist.length) html+='<p class="note">No users yet.</p>';
    ulist.forEach(function(x){
      var when=x.created?new Date(x.created).toLocaleString():'—';
      html+='<div class="donor" style="align-items:flex-start"><div class="dot">'+(esc((x.name||x.email||'?').charAt(0).toUpperCase()))+'</div><div style="flex:1"><strong>'+esc(x.name||'—')+'</strong><div class="note">'+esc(x.email||'')+(x.isAdmin?' · Admin':'')+(x.verified?' · Verified':'')+'</div><div class="note">Joined '+esc(when)+'</div></div></div>';
    });
    html+='</div></div>';
  }else if(tab==='transfers' && HF.isAdmin()){
    html='<div class="pane"><h1>Withdrawal requests</h1><p class="sub">Review and process payouts.</p></div>';
  }else if(tab==='transfers'){
    html='<div class="pane"><h1>Transfers</h1><p class="sub">Available: $'+m.available.toLocaleString()+'</p></div>';
  }else if(tab==='updates' && HF.isAdmin()){
    html='<div class="pane"><h1>Updates</h1><p class="sub">Site news for organizers.</p></div>';
  }else if(tab==='updates'){
    html='<div class="pane"><h1>Updates</h1><p class="sub">News and gifts on your campaigns.</p></div>';
  }else if(tab==='settings'){
    html='<div class="pane"><h1>Account settings</h1><div class="card" style="padding:16px"><p class="note">Signed in as '+esc(u.email)+'</p></div></div>';
  }else if(tab==='admin' && HF.isAdmin()){
    var pending=allCamps().filter(function(c){return c&&c.status!=='approved'&&c.status!=='rejected'&&c.status!=='deleted'&&!c.deleted&&!(window.HF_SAMPLE_IDS&&HF_SAMPLE_IDS[c.id])&&(c.ownerEmail||c.ownerId||c.organizerEmail)});
    html='<div class="pane"><h1>Approve campaigns</h1><p class="sub">'+pending.length+' waiting</p>';
    pending.forEach(function(c){
      html+='<div class="approve-card" style="margin-bottom:10px"><div class="approve-row"><div style="flex:1"><strong>'+esc(c.title)+'</strong><div class="note">'+esc(c.ownerEmail||c.organizer||'')+'</div></div><button type="button" class="mini-btn go" data-approve="'+esc(c.id)+'">Approve</button><button type="button" class="mini-btn bad" data-reject="'+esc(c.id)+'">Reject</button></div></div>';
    });
    if(!pending.length) html+='<p class="note">Nothing pending.</p>';
    html+='</div>';
  }else{
    html='<div class="pane"><h1>Dashboard</h1></div>';
  }
  box.innerHTML=html;
  box.querySelectorAll('[data-tab]').forEach(function(b){});
  box.querySelectorAll('[data-open],[data-view]').forEach(function(b){
    b.onclick=function(){ location.href='/campaign/index.html?id='+encodeURIComponent(b.getAttribute('data-open')||b.getAttribute('data-view')); };
  });
  box.querySelectorAll('[data-edit]').forEach(function(b){b.onclick=function(){editId=b.getAttribute('data-edit');render();};});
  box.querySelectorAll('[data-del]').forEach(function(b){b.onclick=function(){if(!confirm('Delete this campaign?'))return;var id=b.getAttribute('data-del');if(HF.deleteCampaign)HF.deleteCampaign(id);render();};});
  box.querySelectorAll('[data-approve]').forEach(function(b){b.onclick=function(){if(HF.approveCampaign)HF.approveCampaign(b.getAttribute('data-approve'));render();};});
  box.querySelectorAll('[data-reject]').forEach(function(b){b.onclick=function(){if(HF.rejectCampaign)HF.rejectCampaign(b.getAttribute('data-reject'));render();};});
  var gadd=document.getElementById('gadd');
  if(gadd){
    var gfind=document.getElementById('gfind'), gpick=document.getElementById('gpick'), gcamp=document.getElementById('gcamp');
    function pickList(q){
      q=(q||'').toLowerCase();
      var hits=allCamps().filter(function(c){return c&&(!q||String(c.title||'').toLowerCase().indexOf(q)>=0||String(c.ownerEmail||'').toLowerCase().indexOf(q)>=0);}).slice(0,8);
      gpick.innerHTML=hits.map(function(c){return '<button type="button" class="mini-btn" data-cid="'+esc(c.id)+'" style="margin:4px 4px 0 0">'+esc(c.title||c.id)+'</button>';}).join('');
      gpick.querySelectorAll('[data-cid]').forEach(function(b){b.onclick=function(){gcamp.value=b.getAttribute('data-cid');gfind.value=b.textContent;gpick.innerHTML='';};});
    }
    if(gfind){gfind.oninput=function(){pickList(gfind.value)};}
    gadd.onclick=function(){
      var id=gcamp.value, name=document.getElementById('gname').value, amt=document.getElementById('gamt').value;
      var r=HF.addGift({campaignId:id, donor:name, amount:amt});
      var msg=document.getElementById('gmsg');
      if(r&&r.ok){msg.textContent='Donation added.';render();}else{msg.textContent=(r&&r.err)||'Failed';}
    };
  }
}
document.querySelectorAll('[data-tab]').forEach(function(el){
  el.addEventListener('click',function(){setTab(el.getAttribute('data-tab'));});
});
document.getElementById('homeBtn').onclick=function(){setTab('home');};
document.getElementById('avBtn').onclick=function(){document.getElementById('menu').classList.toggle('hide');};
document.getElementById('lo').onclick=function(){if(HF.logout)HF.logout();location.href='/login';};
if(HF.isAdmin&&HF.isAdmin()){document.getElementById('adminNav').classList.remove('hide');document.getElementById('adminMenu').classList.remove('hide');var un=document.getElementById('usersNav');if(un)un.classList.remove('hide');}
drawAv();
function boot(){render();}
function pullServer(){
  if(window.HFDB&&HFDB.list) return HFDB.list().catch(function(){return [];}).then(function(){});
  return Promise.resolve();
}
if(window.HFDB&&HFDB.ready) HFDB.ready().then(function(){ return pullServer(); }).then(boot);
else pullServer().then(boot);
