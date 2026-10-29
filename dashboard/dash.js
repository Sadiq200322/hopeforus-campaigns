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
  var box=document.getElementById('main'), all, list, m, html='';
  if(HF.isAdmin&&HF.isAdmin()){
    all=allCamps().filter(function(c){return c && c.status!=='rejected' && c.status!=='deleted' && !c.deleted});
  } else {
    all=camps().filter(function(c){return c && c.status!=='rejected' && c.status!=='deleted' && !c.deleted});
  }
  list=all; m=money(all);
  if(HF.isAdmin&&HF.isAdmin() && tab==='home') list=all.filter(function(c){return c.status==='approved'||!c.status});
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
    if(!list.length) html+='<p class="note">No campaigns yet. Hard-refresh to load from server.</p>';
    list.forEach(function(c){
      var r=Number(c.raised)||0,g=Math.max(1,Number(c.goal)||1),pct=Math.min(100,Math.round(r/g*100));
      html+='<article class="camp card"><button type="button" class="camp-top" data-open="'+esc(c.id)+'">'+(c.image?'<img src="'+esc(c.image)+'" alt="">':'')+'<div class="body"><strong>'+esc(c.title||'Untitled')+'</strong><div class="bar"><i style="width:'+pct+'%"></i></div><div class="note">$'+r.toLocaleString()+' of $'+g.toLocaleString()+' · '+esc(c.status||'')+(HF.isAdmin()&&(c.ownerEmail||c.organizer)?(' · '+esc(c.organizer||'')+' · '+esc(c.ownerEmail||'')):'')+'</div></div></button><div class="acts"><button type="button" class="go" data-view="'+esc(c.id)+'">View</button><button type="button" data-edit="'+esc(c.id)+'">Edit</button></div></article>';
    });
    html+='</div></div>';
  }else if(tab==='donations' && HF.isAdmin()){
    var allG=HF.listGifts();
    html='<div class="pane"><h1>Donations received</h1><p class="sub">Search the real campaign id from server (e.g. Save Molly), then add donor + amount. This syncs to the owner phone.</p><div class="card" style="padding:14px"><label>Campaign</label><input id="gfind" placeholder="Search title or email"><input id="gcamp" type="hidden"><div id="gpick"></div><label>Donor name</label><input id="gname"><label>Amount (USD)</label><input id="gamt" inputmode="decimal"><button class="btn" id="gadd" type="button">Add donation</button><p class="note" id="gmsg"></p></div><div class="card" style="padding:8px 14px;margin-top:12px">';
    (allG||[]).forEach(function(g){html+='<div class="donor"><div style="flex:1"><strong>'+esc(g.donor)+'</strong><div class="note">'+esc(g.title)+'</div></div><strong>$'+Number(g.amount).toLocaleString()+'</strong></div>'});
    if(!(allG||[]).length) html+='<p class="note">None in this browser yet.</p>';
    html+='</div></div>';
  }else if(tab==='donations'){
    var mine=HF.listGifts(u.email)||[];
    var fromCamps=[];
    camps().forEach(function(c){
      (c.donors||[]).forEach(function(d){
        fromCamps.push({donor:d.name||d.donor||'Anonymous', amount:d.amount, title:c.title});
      });
    });
    if(!mine.length && fromCamps.length) mine=fromCamps;
    else if(fromCamps.length){
      var seen={}; mine.forEach(function(g){seen[(g.donor||'')+g.amount]=1;});
      fromCamps.forEach(function(g){ if(!seen[(g.donor||'')+g.amount]) mine.push(g); });
    }
    html='<div class="pane"><h1>Donations Received</h1><p class="sub">$'+m.received.toLocaleString()+' total</p><div class="card" style="padding:8px 14px">';
    if(!mine.length) html+='<p class="note">No gifts yet. When admin records a donation on your campaign, it shows here after refresh.</p>';
    mine.forEach(function(g){html+='<div class="donor"><div style="flex:1"><strong>'+esc(g.donor)+'</strong><div class="note">'+esc(g.title||'')+'</div></div><strong>$'+Number(g.amount).toLocaleString()+'</strong></div>'});
    html+='</div></div>';
  }else if(tab==='users' && HF.isAdmin() && openUser){
    var d=HF.adminUserDetail?HF.adminUserDetail(openUser):null;
    html='<div class="pane"><button type="button" class="mini-btn" id="backUsers">← All users</button>';
    if(!d) html+='<p class="note">User not found</p></div>';
    else {
      var xu=d.user||{};
      html+='<h1 style="margin-top:12px">'+esc(xu.name||openUser)+'</h1><p class="sub">'+esc(xu.email||openUser)+'</p>';
      html+='<div class="stats"><div class="stat"><span>Raised</span><b>$'+Number(d.raised||0).toLocaleString()+'</b></div><div class="stat"><span>Pending WD</span><b>$'+Number(d.pendingWithdraw||0).toLocaleString()+'</b></div><div class="stat"><span>Paid out</span><b>$'+Number(d.completedWithdraw||0).toLocaleString()+'</b></div><div class="stat"><span>Campaigns</span><b>'+(d.camps||[]).length+'</b></div></div>';
      html+='<div class="card" style="padding:14px;margin-bottom:12px"><strong>Contact this user</strong>';
      html+='<div style="margin-top:10px"><div class="note">Email</div><div style="font-weight:600;word-break:break-all;margin:4px 0 10px">'+esc(xu.email||openUser)+'</div>';
      html+='<div class="note">WhatsApp</div><div style="font-weight:600;margin:4px 0 12px">'+(xu.whatsapp?('+'+esc(String(xu.whatsapp))):'— not set yet')+'</div>';
      html+='<div style="display:flex;gap:10px">';
      html+='<a href="mailto:'+esc(xu.email||openUser)+'" title="Email" aria-label="Email user" style="width:48px;height:48px;border-radius:14px;background:#f3f0ff;border:1px solid #e9e5f5;display:grid;place-items:center;text-decoration:none;color:#7C3AED;font-size:1.25rem">✉</a>';
      if(xu.whatsapp) html+='<a href="https://wa.me/'+esc(String(xu.whatsapp).replace(/[^0-9]/g,''))+'" target="_blank" rel="noopener" title="WhatsApp" aria-label="WhatsApp user" style="width:48px;height:48px;border-radius:14px;background:#ecfdf5;border:1px solid #d1fae5;display:grid;place-items:center;text-decoration:none;color:#059669;font-size:1.25rem">💬</a>';
      html+='</div></div></div>';
      html+='<div class="card" style="padding:8px 14px;margin-bottom:12px"><strong>Campaigns</strong>';
      (d.camps||[]).forEach(function(c){html+='<div class="donor"><div style="flex:1"><strong>'+esc(c.title||c.id)+'</strong><div class="note">$'+Number(c.raised||0).toLocaleString()+' · '+esc(c.status||'')+'</div></div></div>'});
      if(!(d.camps||[]).length) html+='<p class="note">None</p>';
      html+='</div></div>';
    }
  }else if(tab==='users' && HF.isAdmin()){
    var ulist=(HF.adminUsers&&HF.adminUsers())||[];
    ulist=ulist.slice().sort(function(a,b){return (b.created||0)-(a.created||0);});
    html='<div class="pane"><h1>Registered users</h1><p class="sub">'+ulist.length+' accounts · tap a user for details</p><div class="card" style="padding:8px 14px">';
    ulist.forEach(function(x){
      html+='<button type="button" data-openuser="'+esc(x.email)+'" class="donor" style="width:100%;border:0;background:transparent;text-align:left;cursor:pointer;color:inherit;font:inherit"><div class="dot">'+esc((x.name||x.email||'?').charAt(0).toUpperCase())+'</div><div style="flex:1"><strong>'+esc(x.name||'—')+'</strong><div class="note">'+esc(x.email||'')+(x.isAdmin?' · Admin':'')+(x.whatsapp?' · WA +'+esc(x.whatsapp):'')+'</div></div></button>';
    });
    if(!ulist.length) html+='<p class="note">No users yet.</p>';
    html+='</div></div>';
  }else if(tab==='transfers' && HF.isAdmin()){
    html='<div class="pane"><h1>Withdrawal requests</h1><p class="sub">Pending payouts</p></div>';
  }else if(tab==='transfers'){
    html='<div class="pane"><h1>Transfers</h1><p class="sub">Available: $'+m.available.toLocaleString()+'</p></div>';
  }else if(tab==='updates' && HF.isAdmin()){
    html='<div class="pane"><h1>Site updates</h1></div>';
  }else if(tab==='updates'){
    html='<div class="pane"><h1>Updates</h1><div class="card" style="padding:14px;margin-top:12px"><h2 style="font-size:1rem">Need help?</h2><p class="note">Tap an icon to contact support.</p><div style="display:flex;gap:14px;margin-top:12px"><a href="'+(HF.whatsappLink?HF.whatsappLink('Hi HopeForUs support'):'https://wa.me/447446315764')+'" target="_blank" rel="noopener" title="WhatsApp" aria-label="WhatsApp support" style="width:52px;height:52px;border-radius:16px;background:#ecfdf5;border:1px solid #d1fae5;display:grid;place-items:center;text-decoration:none;color:#059669;font-size:1.4rem">💬</a><a href="mailto:'+(HF.SUPPORT_EMAIL||'admin@hopeforus.com')+'?subject=HopeForUs%20support" title="Email" aria-label="Email support" style="width:52px;height:52px;border-radius:16px;background:#f3f0ff;border:1px solid #e9e5f5;display:grid;place-items:center;text-decoration:none;color:#7C3AED;font-size:1.4rem">✉</a></div></div></div>';
  }else if(tab==='settings'){
    var isAdm=!!(HF.isAdmin&&HF.isAdmin());
    var curWa='';
    try{ var fullU=(HF.users?HF.users():[]).find(function(x){return x&&x.email===u.email}); if(fullU&&fullU.whatsapp) curWa=String(fullU.whatsapp); }catch(e){}
    html='<div class="pane"><h1>Account settings</h1><div class="card" style="padding:16px;margin-bottom:14px"><h2 style="font-size:1rem">Display name</h2><label>Name</label><input id="setName" value="'+esc(u.name||'')+'"><button class="btn" type="button" id="saveName">Save name</button><p class="note" id="nameMsg"></p></div>';
    html+='<div class="card" style="padding:16px;margin-bottom:14px"><h2 style="font-size:1rem">WhatsApp number</h2><p class="note">Include country code.</p><label>WhatsApp</label><input id="setWa" type="tel" placeholder="+447..." value="'+(curWa?('+'+esc(curWa)):'')+'"><button class="btn" type="button" id="saveWa">Save WhatsApp</button><p class="note" id="waMsg"></p></div>';
    html+='<div class="card" style="padding:16px"><h2 style="font-size:1rem">Email</h2><label>Current</label><input value="'+esc(u.email||'')+'" disabled>';
    if(isAdm) html+='<p class="note">Admin fixed: admin@hopeforus.com / Admin@2026</p>';
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
  var saveWa=document.getElementById('saveWa'); if(saveWa) saveWa.onclick=function(){var r=HF.setWhatsApp&&HF.setWhatsApp(document.getElementById('setWa').value);var m=document.getElementById('waMsg');if(r&&r.ok)m.textContent='WhatsApp saved.';else m.textContent=(r&&r.err)||'Failed';};
  var saveName=document.getElementById('saveName'); if(saveName) saveName.onclick=function(){var r=HF.updateProfile({name:document.getElementById('setName').value});var m=document.getElementById('nameMsg');if(r&&r.ok){u=HF.session()||u;m.textContent='Saved.';drawAv();}else m.textContent=(r&&r.err)||'Failed';};
  box.querySelectorAll('[data-open],[data-view]').forEach(function(b){b.onclick=function(){location.href='/campaign/index.html?id='+encodeURIComponent(b.getAttribute('data-open')||b.getAttribute('data-view'));};});
  box.querySelectorAll('[data-edit]').forEach(function(b){b.onclick=function(){editId=b.getAttribute('data-edit');render();};});
  box.querySelectorAll('[data-approve]').forEach(function(b){b.onclick=function(){if(HF.approveCampaign)HF.approveCampaign(b.getAttribute('data-approve'));render();};});
  box.querySelectorAll('[data-reject]').forEach(function(b){b.onclick=function(){if(HF.rejectCampaign)HF.rejectCampaign(b.getAttribute('data-reject'));render();};});
  var gadd=document.getElementById('gadd');
  if(gadd){
    var gfind=document.getElementById('gfind'),gpick=document.getElementById('gpick'),gcamp=document.getElementById('gcamp');
    function pickList(q){q=(q||'').toLowerCase();var hits=allCamps().filter(function(c){return c&&c.status!=='deleted'&&(!q||String(c.title||'').toLowerCase().indexOf(q)>=0||String(c.ownerEmail||'').toLowerCase().indexOf(q)>=0);}).slice(0,12);gpick.innerHTML=hits.map(function(c){return '<button type="button" class="mini-btn" data-cid="'+esc(c.id)+'">'+esc(c.title||c.id)+' · '+esc(c.ownerEmail||'')+'</button>';}).join('');gpick.querySelectorAll('[data-cid]').forEach(function(b){b.onclick=function(){gcamp.value=b.getAttribute('data-cid');gfind.value=b.textContent;gpick.innerHTML='';};});}
    if(gfind) gfind.oninput=function(){pickList(gfind.value);};
    gadd.onclick=function(){var r=HF.addGift({campaignId:gcamp.value,donor:document.getElementById('gname').value,amount:document.getElementById('gamt').value});var msg=document.getElementById('gmsg');if(r&&r.ok){msg.textContent='Added and synced to server.';render();}else msg.textContent=(r&&r.err)||'Failed — pick a campaign from the search list';};
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
function pullServer(){
  if(!(window.HFDB&&HFDB.list)) return Promise.resolve();
  return HFDB.list().then(function(rows){
    if(!Array.isArray(rows)) return;
    var list=[]; try{list=JSON.parse(localStorage.getItem('hopeforus_campaigns')||'[]')}catch(e){}
    if(!Array.isArray(list)) list=[];
    var by={}; list.forEach(function(c){ if(c&&c.id) by[c.id]=c; });
    rows.forEach(function(c){
      if(!c||!c.id||c.status==='deleted') return;
      var prev=by[c.id]||{};
      by[c.id]=Object.assign({}, prev, c, {
        ownerEmail:c.ownerEmail||prev.ownerEmail||'',
        organizer:c.organizer||prev.organizer||'',
        raised:Math.max(Number(c.raised)||0, Number(prev.raised)||0),
        donations:Math.max(Number(c.donations)||0, Number(prev.donations)||0),
        donors:(Array.isArray(c.donors)&&c.donors.length)?c.donors:(prev.donors||[])
      });
    });
    var merged=Object.keys(by).map(function(k){return by[k];});
    localStorage.setItem('hopeforus_campaigns', JSON.stringify(merged));
    if(HFDB.loadDonors){
      merged.filter(function(c){return c&&c.status==='approved';}).slice(0,40).forEach(function(c){
        HFDB.loadDonors(c.id).then(function(dons){
          if(!Array.isArray(dons)||!dons.length) return;
          try{
            var L=JSON.parse(localStorage.getItem('hopeforus_campaigns')||'[]');
            var i=L.findIndex(function(x){return x&&x.id===c.id});
            if(i>=0){ L[i].donors=dons; localStorage.setItem('hopeforus_campaigns',JSON.stringify(L)); }
          }catch(e){}
        }).catch(function(){});
      });
    }
  }).catch(function(){});
}
if(window.HFDB&&HFDB.ready)HFDB.ready().then(function(){return pullServer();}).then(boot);
else pullServer().then(boot);
