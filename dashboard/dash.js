var u=HF.session();
if(!u){ location.replace('/login?return='+encodeURIComponent('/dashboard/')); throw 0; }
var tab=(HF.isAdmin&&HF.isAdmin()&&location.hash==='#admin')?'admin':'home', openId='', editId='', openUser='', method='usdt', adminView='overview';
var av=localStorage.getItem('hf_avatar_'+u.email)||'';
if(window.HF&&HF.getUserAvatar){ var ga=HF.getUserAvatar(u.email); if(ga) av=ga; }
function esc(s){var a=String.fromCharCode(38);return String(s==null?'':s).replace(/&/g,a+'amp;').replace(/</g,a+'lt;').replace(/>/g,a+'gt;').replace(/"/g,a+'quot;').replace(/'/g,'&#39;')}
function readLocalCamps(){
  var list=[]; try{list=JSON.parse(localStorage.getItem('hopeforus_campaigns')||'[]')}catch(e){}
  return Array.isArray(list)?list:[];
}
function allCamps(){
  var by={};
  readLocalCamps().forEach(function(c){ if(c&&c.id) by[c.id]=c; });
  if(HF.adminCampaigns) (HF.adminCampaigns()||[]).forEach(function(c){ if(c&&c.id&&!by[c.id]) by[c.id]=c; });
  return Object.keys(by).map(function(k){ return by[k]; });
}
function camps(){
  var email=String((u&&u.email)||'').toLowerCase();
  if(HF.isAdmin&&HF.isAdmin()) return allCamps();
  return allCamps().filter(function(c){
    if(!c||c.deleted||c.status==='deleted') return false;
    var oe=String(c.ownerEmail||c.organizerEmail||'').toLowerCase();
    return oe&&oe===email;
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
  var withdrawn=wd.reduce(function(n,w){return n+(Number(w.amount)||0)},0);
  return {received:received,hold:hold,ready:ready,withdrawn:withdrawn,balance:Math.max(0,received-withdrawn),available:Math.max(0,ready-withdrawn)};
}
function saveCamp(c){
  var list=readLocalCamps();
  var i=list.findIndex(function(x){return x&&x.id===c.id});
  var fields={title:c.title,story:c.story,goal:c.goal,image:c.image,status:c.status};
  if(i>=0){ Object.keys(fields).forEach(function(k){ if(fields[k]!==undefined) list[i][k]=fields[k]; }); }
  else { list.unshift(Object.assign({}, c, fields)); }
  localStorage.setItem('hopeforus_campaigns',JSON.stringify(list));
  if(HF.saveCampaign) try{HF.saveCampaign(list[i>=0?i:0]);}catch(e){}
  if(window.HFDB&&HFDB.update&&c.id){
    var patch={title:c.title||'', story:c.story||'', goal:Number(c.goal)||0};
    if(c.status) patch.status=c.status;
    HFDB.update(c.id, patch).catch(function(){});
  }
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
    var c=all.find(function(x){return x.id===editId});
    if(!c){editId='';render();return}
    html='<div class="pane"><form id="editForm" class="card" style="padding:16px"><h1>Edit campaign</h1><label>Name</label><input id="eTitle" value="'+esc(c.title)+'"><label>Story</label><textarea id="eStory">'+esc(c.story||'')+'</textarea><label>Goal</label><input id="eGoal" value="'+esc(c.goal)+'"><div class="row"><button class="btn" type="submit">Save</button><button class="btn" type="button" id="back" style="background:transparent;color:#333;border:1px solid #e5e5e5">Back</button></div></form></div>';
    box.innerHTML=html;
    document.getElementById('back').onclick=function(){editId='';render()};
    document.getElementById('editForm').onsubmit=function(e){e.preventDefault();c.title=document.getElementById('eTitle').value.trim();c.story=document.getElementById('eStory').value;c.goal=parseFloat(document.getElementById('eGoal').value)||c.goal;saveCamp(c);editId='';render();};
    return;
  }
  if(tab==='home'){
    html='<div class="pane"><h1>Dashboard</h1><p class="sub">Welcome'+(u.name?', '+esc(u.name):'')+'. Synced from server.</p><div class="stats"><div class="stat"><span>Raised</span><b>$'+m.received.toLocaleString()+'</b></div><div class="stat"><span>Available</span><b>$'+m.available.toLocaleString()+'</b></div><div class="stat"><span>On hold</span><b>$'+m.hold.toLocaleString()+'</b></div><div class="stat"><span>Campaigns</span><b>'+list.length+'</b></div></div><div class="camp-grid">';
    if(!list.length) html+='<p class="note">No campaigns yet.</p>';
    list.forEach(function(c){
      var r=Number(c.raised)||0,g=Math.max(1,Number(c.goal)||1),pct=Math.min(100,Math.round(r/g*100));
      html+='<article class="camp card"><button type="button" class="camp-top" data-open="'+esc(c.id)+'">'+(c.image?'<img src="'+esc(c.image)+'" alt="">':'')+'<div class="body"><strong>'+esc(c.title||'Untitled')+'</strong><div class="bar"><i style="width:'+pct+'%"></i></div><div class="note">$'+r.toLocaleString()+' of $'+g.toLocaleString()+' · '+esc(c.status||'')+(HF.isAdmin()&&(c.ownerEmail||c.organizer)?(' · '+esc(c.ownerEmail||'')):'')+'</div></div></button><div class="acts"><button type="button" class="go" data-view="'+esc(c.id)+'">View</button><button type="button" data-edit="'+esc(c.id)+'">Edit</button></div></article>';
    });
    html+='</div></div>';
  }else if(tab==='donations' && HF.isAdmin()){
    var allG=HF.listGifts?HF.listGifts():[];
    html='<div class="pane"><h1>Donations received</h1><p class="sub">Add donor + amount — syncs to server</p><div class="card" style="padding:14px"><label>Campaign</label><input id="gfind" placeholder="Search title or email"><input id="gcamp" type="hidden"><div id="gpick"></div><label>Donor name</label><input id="gname"><label>Amount (USD)</label><input id="gamt" inputmode="decimal"><button class="btn" id="gadd" type="button">Add donation</button><p class="note" id="gmsg"></p></div><div class="card" style="padding:8px 14px;margin-top:12px">';
    (allG||[]).forEach(function(g){html+='<div class="donor"><div style="flex:1"><strong>'+esc(g.donor)+'</strong><div class="note">'+esc(g.title||'')+'</div></div><strong>$'+Number(g.amount).toLocaleString()+'</strong></div>'});
    if(!(allG||[]).length) html+='<p class="note">No donations yet.</p>';
    html+='</div></div>';
  }else if(tab==='donations'){
    var mine=HF.listGifts?HF.listGifts(u.email):[];
    camps().forEach(function(c){ (c.donors||[]).forEach(function(d){ mine.push({donor:d.name||d.donor||'Anonymous', amount:d.amount, title:c.title}); }); });
    html='<div class="pane"><h1>Donations Received</h1><p class="sub">$'+m.received.toLocaleString()+' total</p><div class="card" style="padding:8px 14px">';
    if(!mine.length) html+='<p class="note">No gifts yet.</p>';
    mine.forEach(function(g){html+='<div class="donor"><div style="flex:1"><strong>'+esc(g.donor)+'</strong><div class="note">'+esc(g.title||'')+'</div></div><strong>$'+Number(g.amount).toLocaleString()+'</strong></div>'});
    html+='</div></div>';
  }else if(tab==='transfers'){
    if(HF.isAdmin&&HF.isAdmin()){
      var wds=(HF.listWithdrawals&&HF.listWithdrawals())||[];
      html='<div class="pane"><h1>Withdrawal requests</h1><p class="sub">From server</p><div class="card" style="padding:8px 14px">';
      if(!wds.length) html+='<p class="note">No withdrawal requests yet.</p>';
      wds.forEach(function(w){
        html+='<div class="donor"><div style="flex:1"><strong>$'+Number(w.amount||0).toLocaleString()+'</strong><div class="note">'+esc(w.email||'')+' · '+esc(w.method||'')+' · '+esc(w.status||'pending')+'</div><div class="note">'+esc(w.address||'')+'</div></div>';
        if((w.status||'pending')==='pending'){
          html+='<button type="button" class="mini-btn go" data-wd-ok="'+esc(w.id)+'">Pay</button>';
          html+='<button type="button" class="mini-btn bad" data-wd-no="'+esc(w.id)+'">Reject</button>';
        }
        html+='</div>';
      });
      html+='</div></div>';
    } else {
      html='<div class="pane"><h1>Transfers</h1><p class="sub">Available: $'+m.available.toLocaleString()+'</p>';
      html+='<div class="card" style="padding:16px;margin-top:12px"><label>Amount (USD)</label><input id="wdAmt" inputmode="decimal"><label>Method</label><select id="wdMethod"><option value="usdt">USDT</option><option value="btc">BTC</option><option value="bank">Bank</option></select><label>Address / details</label><input id="wdAddr"><button class="btn" type="button" id="wdReq">Request withdrawal</button><p class="note" id="wdMsg"></p></div></div>';
    }
  }else if(tab==='users' && HF.isAdmin()){
    var ulist=(HF.adminUsers&&HF.adminUsers())||[];
    html='<div class="pane"><h1>Users</h1><div class="card" style="padding:8px 14px">';
    ulist.forEach(function(x){ html+='<div class="donor"><div class="dot">'+esc((x.name||x.email||'?').charAt(0).toUpperCase())+'</div><div style="flex:1"><strong>'+esc(x.name||'—')+'</strong><div class="note">'+esc(x.email||'')+'</div></div></div>'; });
    if(!ulist.length) html+='<p class="note">No users yet.</p>';
    html+='</div></div>';
  }else if(tab==='admin' && HF.isAdmin()){
    var pending=allCamps().filter(function(c){return c&&c.status!=='approved'&&c.status!=='rejected'&&c.status!=='deleted'&&!c.deleted&&!(window.HF_SAMPLE_IDS&&HF_SAMPLE_IDS[c.id])&&(c.ownerEmail||c.ownerId||c.organizerEmail)});
    html='<div class="pane"><h1>Approve campaigns</h1><p class="sub">'+pending.length+' waiting</p>';
    pending.forEach(function(c){
      html+='<div class="approve-card" style="margin-bottom:10px"><div class="approve-row"><div style="flex:1"><strong>'+esc(c.title)+'</strong><div class="note">'+esc(c.ownerEmail||c.organizer||'')+'</div></div><button type="button" class="mini-btn go" data-approve="'+esc(c.id)+'">Approve</button><button type="button" class="mini-btn bad" data-reject="'+esc(c.id)+'">Reject</button></div></div>';
    });
    if(!pending.length) html+='<p class="note">Nothing pending.</p>';
    html+='</div>';
  }else if(tab==='settings'){
    html='<div class="pane"><h1>Account settings</h1><div class="card" style="padding:16px"><label>Name</label><input id="setName" value="'+esc(u.name||'')+'"><button class="btn" type="button" id="saveName">Save name</button><p class="note" id="nameMsg"></p><label>Email</label><input value="'+esc(u.email||'')+'" disabled></div></div>';
  }else html='<div class="pane"><h1>Dashboard</h1></div>';
  box.innerHTML=html;
  var saveName=document.getElementById('saveName'); if(saveName) saveName.onclick=function(){var r=HF.updateProfile({name:document.getElementById('setName').value});var m=document.getElementById('nameMsg');if(r&&r.ok){u=HF.session()||u;m.textContent='Saved.';drawAv();}else m.textContent=(r&&r.err)||'Failed';};
  box.querySelectorAll('[data-open],[data-view]').forEach(function(b){b.onclick=function(){location.href='/campaign.html?id='+encodeURIComponent(b.getAttribute('data-open')||b.getAttribute('data-view'));};});
  box.querySelectorAll('[data-edit]').forEach(function(b){b.onclick=function(){editId=b.getAttribute('data-edit');render();};});
  box.querySelectorAll('[data-approve]').forEach(function(b){b.onclick=function(){
    var id=b.getAttribute('data-approve'); b.disabled=true;
    var p=(window.HFDB&&HFDB.update)?HFDB.update(id,{status:'approved'}):Promise.resolve();
    p.then(function(){ if(HF.approveCampaign) HF.approveCampaign(id); return pullServer(); }).then(function(){render();}).catch(function(){render();});
  };});
  box.querySelectorAll('[data-reject]').forEach(function(b){b.onclick=function(){
    var id=b.getAttribute('data-reject'); b.disabled=true;
    var p=(window.HFDB&&HFDB.update)?HFDB.update(id,{status:'rejected'}):Promise.resolve();
    p.then(function(){ if(HF.rejectCampaign) HF.rejectCampaign(id); return pullServer(); }).then(function(){render();}).catch(function(){render();});
  };});
  box.querySelectorAll('[data-wd-ok]').forEach(function(b){b.onclick=function(){ if(HF.processWithdrawal) HF.processWithdrawal(b.getAttribute('data-wd-ok'),'approved'); pullServer().then(function(){render();}); };});
  box.querySelectorAll('[data-wd-no]').forEach(function(b){b.onclick=function(){ if(HF.processWithdrawal) HF.processWithdrawal(b.getAttribute('data-wd-no'),'rejected'); pullServer().then(function(){render();}); };});
  var wdReq=document.getElementById('wdReq');
  if(wdReq) wdReq.onclick=function(){
    var r=HF.requestWithdrawal({amount:document.getElementById('wdAmt').value, method:document.getElementById('wdMethod').value, address:document.getElementById('wdAddr').value});
    var msg=document.getElementById('wdMsg');
    if(r&&r.ok){ msg.textContent='Request submitted.'; pullServer().then(function(){render();}); }
    else msg.textContent=(r&&r.err)||'Failed';
  };
  var gadd=document.getElementById('gadd');
  if(gadd){
    var gfind=document.getElementById('gfind'),gpick=document.getElementById('gpick'),gcamp=document.getElementById('gcamp');
    function pickList(q){q=(q||'').toLowerCase();var hits=allCamps().filter(function(c){return c&&c.status!=='deleted'&&(!q||String(c.title||'').toLowerCase().indexOf(q)>=0||String(c.ownerEmail||'').toLowerCase().indexOf(q)>=0);}).slice(0,12);gpick.innerHTML=hits.map(function(c){return '<button type="button" class="mini-btn" data-cid="'+esc(c.id)+'">'+esc(c.title||c.id)+' · '+esc(c.ownerEmail||'')+'</button>';}).join('');gpick.querySelectorAll('[data-cid]').forEach(function(b){b.onclick=function(){gcamp.value=b.getAttribute('data-cid');gfind.value=b.textContent;gpick.innerHTML='';};});}
    if(gfind) gfind.oninput=function(){pickList(gfind.value);};
    gadd.onclick=function(){var r=HF.addGift({campaignId:gcamp.value,donor:document.getElementById('gname').value,amount:document.getElementById('gamt').value,title:(document.getElementById('gfind').value||'').split('·')[0].trim()});var msg=document.getElementById('gmsg');if(r&&r.ok){msg.textContent='Added and synced to server.';pullServer().then(function(){render();});}else msg.textContent=(r&&r.err)||'Failed — pick a campaign';};
  }
}
document.querySelectorAll('[data-tab]').forEach(function(el){el.addEventListener('click',function(){setTab(el.getAttribute('data-tab'));});});
document.getElementById('homeBtn').onclick=function(){setTab('home');};
document.getElementById('avBtn').onclick=function(){document.getElementById('menu').classList.toggle('hide');};
document.getElementById('lo').onclick=function(){if(HF.logout)HF.logout();location.href='/login';};
if(HF.isAdmin&&HF.isAdmin()){document.getElementById('adminNav').classList.remove('hide');document.getElementById('adminMenu').classList.remove('hide');var un=document.getElementById('usersNav');if(un)un.classList.remove('hide');}

function pullServer(){
  if(!(window.HFDB&&HFDB.list)) return Promise.resolve();
  return HFDB.list().then(function(rows){
    if(!Array.isArray(rows)) return;
    var list=readLocalCamps();
    var by={}; list.forEach(function(c){ if(c&&c.id) by[c.id]=c; });
    rows.forEach(function(c){
      if(!c||!c.id||c.status==='deleted') return;
      var prev=by[c.id]||{};
      by[c.id]=Object.assign({}, prev, c, {
        ownerEmail:c.ownerEmail||prev.ownerEmail||'',
        status:c.status||prev.status||'pending',
        raised:Math.max(Number(c.raised)||0, Number(prev.raised)||0),
        donations:Math.max(Number(c.donations)||0, Number(prev.donations)||0),
        donors:(Array.isArray(c.donors)&&c.donors.length)?c.donors:(prev.donors||[]),
        image:c.image||prev.image||'',
        title:c.title||prev.title||'',
        story:c.story||prev.story||''
      });
    });
    localStorage.setItem('hopeforus_campaigns', JSON.stringify(Object.keys(by).map(function(k){return by[k];})));
    var jobs=[];
    if(window.HF&&HF.pullMoneyFromServer) jobs.push(HF.pullMoneyFromServer());
    else {
      if(HFDB.listGifts) jobs.push(HFDB.listGifts().then(function(rows){ if(Array.isArray(rows)) try{ localStorage.setItem('hopeforus_gifts', JSON.stringify(rows)); }catch(e){} }).catch(function(){}));
      if(HFDB.listWithdrawals) jobs.push(HFDB.listWithdrawals().then(function(rows){ if(Array.isArray(rows)) try{ localStorage.setItem('hopeforus_withdrawals', JSON.stringify(rows)); }catch(e){} }).catch(function(){}));
    }
    return Promise.all(jobs);
  }).catch(function(e){ console.warn('pullServer', e); });
}
function boot(){ drawAv(); render(); }
function start(){
  boot();
  var box=document.getElementById('main');
  if(box){ var note=document.createElement('p'); note.id='syncNote'; note.className='note'; note.style.padding='8px 22px'; note.textContent='Syncing from server…'; box.parentNode.insertBefore(note, box); }
  function done(){ var n=document.getElementById('syncNote'); if(n) n.remove(); render(); drawAv(); }
  pullServer().then(done).catch(done);
  setInterval(function(){ pullServer().then(function(){ render(); }).catch(function(){}); }, 30000);
}
start();
