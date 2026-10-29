var CATS=["Animals","Business","Community","Competitions","Creative","Education","Emergencies","Environment","Events","Faith","Family","Funerals & Memorials","Medical","Monthly Bills","Newlyweds","Other","Sports","Travel","Volunteer","Wishes"];
var STEPS=7;
var step=0;
var draft={country:"Uganda",zip:"",category:"",beneficiary:"",goal:"",autoGoal:true,title:"",story:"",media:[]};
var pendingAuth={email:"",pass:"",name:"",whatsapp:"",code:"",sentAt:0};
var lastEmailSent=false;
var user=null;
try{user=JSON.parse(localStorage.getItem("hopeforus_user")||"null")}catch(e){}
function $(id){return document.getElementById(id)}
function esc(s){return String(s||"").replace(/&/g,"&").replace(/</g,"<").replace(/>/g,">").replace(/"/g,""")}
function goalNum(){var n=parseFloat(String(draft.goal).replace(/[^0-9.]/g,""));return isNaN(n)?0:n}
function startGoal(){return Math.max(1,goalNum())}
function makeOtp(){var out="";for(var i=0;i<6;i++) out+=String(Math.floor(Math.random()*10));return out;}
function makeCode(len){var chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";var out="";for(var i=0;i<(len||6);i++) out+=chars.charAt(Math.floor(Math.random()*chars.length));return out;}
function isLoggedIn(){return !!(user&&user.email)}
function showErr(msg){var e=$("err");if(e)e.textContent=msg||"";}
function emailjsReady(){try{return !!(window.emailjs&&window.HOPEFORUS_EMAILJS)}catch(e){return false}}
function sendEmailCode(email,code,name){
  var cfg=window.HOPEFORUS_EMAILJS||{};
  return emailjs.send(cfg.serviceId||'service_w6qtun6',cfg.templateId||'template_zukhkib',{to_email:email,email:email,user_name:name||'Friend',otp_code:code,passcode:code,site_name:'Use this code to verify your HopeForUs account.'},{publicKey:cfg.publicKey||'HHYAAwQ9y_LhuJ7qR'}).then(function(){return true}).catch(function(){return false});
}
function saveUser(email, pass, name, whatsapp){
  user={id:"u_"+email.toLowerCase(),email:email.toLowerCase(),name:(name||email.split("@")[0]),password:pass,whatsapp:(whatsapp||""),provider:"email",verified:true};
  var users=[];try{users=JSON.parse(localStorage.getItem("hopeforus_users")||"[]")}catch(e){}
  if(!Array.isArray(users))users=[];
  users=users.filter(function(u){return u.email!==user.email});
  var passHash = (window.HF && HF.hash) ? HF.hash(pass) : pass;
  var hfRow={id:user.id,email:user.email,name:user.name,pass:passHash,whatsapp:user.whatsapp||"",verified:true,isAdmin:false,created:Date.now(),donors:[],chats:[],clicks:0,avatar:""};
  users.push(hfRow);
  try{localStorage.setItem("hopeforus_users",JSON.stringify(users))}catch(e){}
  try{localStorage.setItem("hopeforus_user",JSON.stringify({id:user.id,email:user.email,name:user.name,provider:"email",verified:true}))}catch(e){}
}
function compressImage(file,maxW,quality){
  return new Promise(function(resolve){
    var r=new FileReader();
    r.onload=function(){
      var img=new Image();
      img.onload=function(){
        var w=img.width,h=img.height,scale=Math.min(1,maxW/w);
        var c=document.createElement('canvas');c.width=Math.round(w*scale);c.height=Math.round(h*scale);
        var ctx=c.getContext('2d');ctx.drawImage(img,0,0,c.width,c.height);
        resolve(c.toDataURL('image/jpeg',quality||0.72));
      };
      img.onerror=function(){resolve(r.result)};
      img.src=r.result;
    };
    r.onerror=function(){resolve('')};
    r.readAsDataURL(file);
  });
}
function render(){
  var body=$("body"),stitle=$("stitle"),ssub=$("ssub"),stepn=$("stepn"),prog=$("prog"),back=$("back"),cont=$("cont"),topr=$("topr");
  if(!body) return;
  showErr("");
  var total=isLoggedIn()?6:7;
  var vis=Math.min(step+1,total);
  if(stepn) stepn.textContent=vis+" of "+total;
  if(prog) prog.style.width=Math.round((vis/total)*100)+"%";
  if(back) back.style.visibility=step===0?"hidden":"visible";
  if(cont){ cont.textContent=step===6|| (isLoggedIn()&&step===5)?"Finish":"Continue"; cont.disabled=false; }
  if(topr) topr.innerHTML=isLoggedIn()?('<span class="note">Signed in as '+esc(user.name||user.email)+'</span>'):'<a href="/login">Sign in</a>';

  if(step===0){
    stitle.textContent="Where will the funds go?";
    ssub.textContent="Tell us the country and city or zip for this fundraiser.";
    body.innerHTML='<label class="f">Country</label><input id="country" value="'+esc(draft.country)+'"><label class="f">City / ZIP</label><input id="zip" value="'+esc(draft.zip)+'" placeholder="e.g. Kampala or 10001"><p class="err" id="err"></p>';
  } else if(step===1){
    stitle.textContent="What best describes your fundraiser?";
    ssub.textContent="Pick a category so people can find you.";
    body.innerHTML='<div class="cats" id="cats">'+CATS.map(function(c){return '<button type="button" class="cat'+(draft.category===c?' on':'')+'" data-c="'+esc(c)+'">'+esc(c)+'</button>'}).join('')+'</div><p class="err" id="err"></p>';
    body.querySelectorAll('[data-c]').forEach(function(b){b.onclick=function(){draft.category=b.getAttribute('data-c');render();};});
  } else if(step===2){
    stitle.textContent="Who are you raising money for?";
    ssub.textContent="Yourself, someone else, or a charity / group.";
    var opts=['Myself','Someone else','Charity or group'];
    body.innerHTML='<div class="cats">'+opts.map(function(o){return '<button type="button" class="cat'+(draft.beneficiary===o?' on':'')+'" data-b="'+esc(o)+'">'+esc(o)+'</button>'}).join('')+'</div><p class="err" id="err"></p>';
    body.querySelectorAll('[data-b]').forEach(function(b){b.onclick=function(){draft.beneficiary=b.getAttribute('data-b');render();};});
  } else if(step===3){
    stitle.textContent="Set your goal";
    ssub.textContent="You can change this later. Amounts are in USD.";
    body.innerHTML='<label class="f">Goal amount (USD)</label><input id="goal" inputmode="decimal" value="'+esc(draft.goal)+'" placeholder="e.g. 5000"><p class="err" id="err"></p>';
  } else if(step===4){
    stitle.textContent="Tell your story";
    ssub.textContent="A clear title and story help people care and donate.";
    body.innerHTML='<label class="f">Title</label><input id="title" value="'+esc(draft.title)+'" maxlength="80" placeholder="e.g. Help Molly get surgery"><label class="f">Story</label><textarea id="story" rows="6" placeholder="Share why you are raising money...">'+esc(draft.story)+'</textarea><p class="err" id="err"></p>';
  } else if(step===5){
    stitle.textContent="Add photos or a video";
    ssub.textContent="At least one photo works best. Video is optional.";
    body.innerHTML='<label class="f">Upload</label><input id="files" type="file" accept="image/*,video/*" multiple><div class="media-grid" id="mgrid"></div><p class="err" id="err"></p>';
    var grid=$("mgrid");
    (draft.media||[]).forEach(function(m){
      if(m.type==='video'){ var v=document.createElement('video'); v.src=m.dataUrl||m.url; v.muted=true; grid.appendChild(v); }
      else { var i=document.createElement('img'); i.src=m.dataUrl||m.url; grid.appendChild(i); }
    });
    $("files").onchange=function(e){
      var files=Array.prototype.slice.call(e.target.files||[]).slice(0,6);
      var jobs=files.map(function(f){
        if(String(f.type).indexOf('video')===0){
          return new Promise(function(res){ var r=new FileReader(); r.onload=function(){res({type:'video',dataUrl:r.result,name:f.name})}; r.readAsDataURL(f); });
        }
        return compressImage(f,1400,0.75).then(function(d){return {type:'image',dataUrl:d,name:f.name}});
      });
      Promise.all(jobs).then(function(rows){ draft.media=(draft.media||[]).concat(rows).slice(0,8); render(); });
    };
  } else if(step===6 && !isLoggedIn()){
    stitle.textContent="Create your account";
    ssub.textContent="So you can manage donations and updates.";
    body.innerHTML='<div class="acct"><label class="f">Full name</label><input id="name" value="'+esc(pendingAuth.name||'')+'"><label class="f">Email</label><input id="email" type="email" value="'+esc(pendingAuth.email||'')+'"><label class="f">Password</label><input id="pass" type="password" placeholder="6+ characters"><label class="f" style="margin-top:12px">WhatsApp number</label><input id="whatsapp" type="tel" placeholder="+447... or +256..." value="'+esc(pendingAuth.whatsapp||'')+'"><p class="note">Include country code. No verification needed — admin can reach you if needed.</p><p class="err" id="err"></p></div>';
  } else if(step===7 || (isLoggedIn() && step===6)){
    stitle.textContent="Check your email";
    ssub.textContent="Enter the 6-digit code we sent.";
    body.innerHTML='<div class="acct"><label class="f">Verification code</label><input id="otp" inputmode="numeric" maxlength="6" placeholder="000000"><p class="note">Code sent to '+esc(pendingAuth.email||user&&user.email||'')+(lastEmailSent?'':' — if email failed, use the code shown in a moment')+'</p><p class="err" id="err"></p></div>';
  } else {
    stitle.textContent="Almost done";
    ssub.textContent="Review and publish.";
    body.innerHTML='<p class="note">Your campaign will be reviewed before it goes live.</p><p class="err" id="err"></p>';
  }
}
function next(){
  showErr("");
  if(step===0){
    draft.country=($("country")&&$("country").value||"").trim()||"Uganda";
    draft.zip=($("zip")&&$("zip").value||"").trim();
    if(!draft.zip){ showErr("Enter a city or ZIP"); return; }
    step=1; render(); return;
  }
  if(step===1){
    if(!draft.category){ showErr("Pick a category"); return; }
    step=2; render(); return;
  }
  if(step===2){
    if(!draft.beneficiary){ showErr("Choose who this is for"); return; }
    step=3; render(); return;
  }
  if(step===3){
    draft.goal=($("goal")&&$("goal").value||"").trim();
    if(!(goalNum()>0)){ showErr("Enter a goal amount"); return; }
    step=4; render(); return;
  }
  if(step===4){
    draft.title=($("title")&&$("title").value||"").trim();
    draft.story=($("story")&&$("story").value||"").trim();
    if(draft.title.length<4){ showErr("Add a short title"); return; }
    if(draft.story.length<20){ showErr("Write a bit more in the story"); return; }
    step=5; render(); return;
  }
  if(step===5){
    if(!(draft.media&&draft.media.length)){ showErr("Add at least one photo"); return; }
    if(isLoggedIn()){ finish(); return; }
    step=6; render(); return;
  }
  if(step===6 && !isLoggedIn()){
    var name=($("name")&&$("name").value||"").trim();
    var email=($("email")&&$("email").value||"").trim().toLowerCase();
    var pass=($("pass")&&$("pass").value||"");
    var whatsapp=($("whatsapp")&&$("whatsapp").value||"").trim();
    if(!name||!email||email.indexOf("@")<1){ showErr("Enter name and a valid email"); return; }
    if(!pass||pass.length<6){ showErr("Password must be 6+ characters"); return; }
    var waDigits=whatsapp.replace(/[\s()+-]/g,"");
    if(waDigits.charAt(0)==='+') waDigits=waDigits.slice(1);
    if(!/^\d{8,15}$/.test(waDigits)){ showErr("Enter a valid WhatsApp number with country code"); return; }
    pendingAuth={email:email,pass:pass,name:name,whatsapp:waDigits,code:makeOtp(),sentAt:Date.now()};
    lastEmailSent=false;
    if(emailjsReady()){
      sendEmailCode(email,pendingAuth.code,name).then(function(ok){ lastEmailSent=!!ok; if(!ok) showErr("Email send failed — code is "+pendingAuth.code+" (dev)"); });
    } else {
      showErr("Email not configured — use code "+pendingAuth.code);
    }
    step=7; render(); return;
  }
  if(step===7 || (isLoggedIn()&&step===6)){
    var otp=($("otp")&&$("otp").value||"").trim();
    if(!isLoggedIn()){
      if(otp!==String(pendingAuth.code)){ showErr("Wrong code"); return; }
      saveUser(pendingAuth.email, pendingAuth.pass, pendingAuth.name, pendingAuth.whatsapp);
    }
    finish(); return;
  }
}
function finish(){
  var id="c_"+Date.now().toString(36);
  var code=makeCode(6);
  var images=[]; var video=""; var image="";
  (draft.media||[]).forEach(function(m){
    if(m.type==='video' && !video) video=m.dataUrl||m.url||"";
    else if(m.type==='image'){ images.push(m.dataUrl||m.url); if(!image) image=m.dataUrl||m.url; }
  });
  var camp={
    id:id, code:code, title:draft.title, story:draft.story, goal:goalNum(), raised:0, donations:0,
    image:image, images:images, video:video, media:(draft.media||[]).map(function(m){return {type:m.type,url:m.dataUrl||m.url,name:m.name}}),
    category:draft.category, country:draft.country, location:draft.zip,
    organizer:(user&&user.name)||"Organizer", ownerEmail:(user&&user.email)||"", organizerEmail:(user&&user.email)||"",
    status:"pending", createdAt:new Date().toISOString(), donors:[], donationLink:""
  };
  var list=[]; try{list=JSON.parse(localStorage.getItem("hopeforus_campaigns")||"[]")}catch(e){}
  if(!Array.isArray(list)) list=[];
  list.unshift(camp);
  try{localStorage.setItem("hopeforus_campaigns",JSON.stringify(list))}catch(e){}
  if(window.HF&&HF.saveCampaign) try{HF.saveCampaign(camp)}catch(e){}
  if(window.HFDB&&HFDB.save){
    try{
      var copy=Object.assign({},camp);
      // strip huge data URLs before server if needed — upload handled later in dashboard
      HFDB.save(copy).catch(function(){});
    }catch(e){}
  }
  location.href="/dashboard/";
}
function back(){ if(step>0){ step--; render(); } }
document.getElementById("cont").onclick=next;
document.getElementById("back").onclick=back;
render();
