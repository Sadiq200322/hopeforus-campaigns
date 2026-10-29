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
        c.getContext('2d').drawImage(img,0,0,c.width,c.height);
        resolve({src:c.toDataURL('image/jpeg',quality||0.72),type:'image'});
      };
      img.onerror=function(){resolve(null)};
      img.src=r.result;
    };
    r.onerror=function(){resolve(null)};
    r.readAsDataURL(file);
  });
}
function paintMedia(){
  var box=$("mediaBox"); if(!box) return;
  box.innerHTML=draft.media.map(function(m,i){
    return '<div class="ph"><img src="'+m.src+'" alt=""><button type="button" data-rm="'+i+'">×</button></div>';
  }).join('')||'<p class="note">No photos yet</p>';
  box.querySelectorAll('[data-rm]').forEach(function(b){b.onclick=function(){draft.media.splice(+b.getAttribute('data-rm'),1);paintMedia();};});
}
function render(){
  $("stepn").textContent=(step+1)+" of "+STEPS;
  $("prog").style.width=((step+1)/STEPS*100)+"%";
  var el=$("body"); el.innerHTML="";
  var err=document.createElement("p"); err.id="err"; err.className="note"; err.style.color="#b91c1c";
  if(step===0){
    el.innerHTML='<h2>Where are you fundraising?</h2><label class="f">Country</label><input id="country" value="'+esc(draft.country)+'"><label class="f" style="margin-top:12px">Postal code</label><input id="zip" value="'+esc(draft.zip)+'">';
  } else if(step===1){
    el.innerHTML='<h2>Who are you fundraising for?</h2><div class="chips">'+['Yourself','Someone else','Charity'].map(function(b){return '<button type="button" class="chip'+(draft.beneficiary===b?' on':'')+'" data-b="'+b+'">'+b+'</button>';}).join('')+'</div>';
    el.querySelectorAll('[data-b]').forEach(function(b){b.onclick=function(){draft.beneficiary=b.getAttribute('data-b');render();};});
  } else if(step===2){
    el.innerHTML='<h2>Choose a category</h2><div class="chips">'+CATS.map(function(c){return '<button type="button" class="chip'+(draft.category===c?' on':'')+'" data-c="'+esc(c)+'">'+esc(c)+'</button>';}).join('')+'</div>';
    el.querySelectorAll('[data-c]').forEach(function(b){b.onclick=function(){draft.category=b.getAttribute('data-c');render();};});
  } else if(step===3){
    if(isLoggedIn()){ step=4; render(); return; }
    el.innerHTML='<div class="acct"><h2>Create your account</h2>'+
      '<label class="f">Email</label><input id="email" type="email" placeholder="you@email.com" value="'+esc(pendingAuth.email)+'">'+ 
      '<label class="f" style="margin-top:12px">Password</label><input id="pass" type="password" placeholder="At least 6 characters">'+
      '<label class="f" style="margin-top:12px">Your name</label><input id="name" placeholder="First name" value="'+esc(pendingAuth.name)+'">'+ 
      '<label class="f" style="margin-top:12px">WhatsApp number</label><input id="whatsapp" type="tel" placeholder="+447... or +256..." value="'+esc(pendingAuth.whatsapp||'')+'">'+ 
      '<p class="note" style="margin-top:6px">Include country code. No verification — so we can reach you if needed.</p>'+
      '<p class="note">We will email a 6-digit code. You must enter it to continue.</p></div>';
  } else if(step===4 && !isLoggedIn()){
    el.innerHTML='<div class="acct"><h2>Check your email</h2><p class="note">Enter the 6-digit code we sent to '+esc(pendingAuth.email)+'</p><label class="f">Code</label><input id="code" inputmode="numeric" maxlength="6" placeholder="000000"><p class="note">Code expires in 30 minutes.</p></div>';
  } else if(step===4 || step===5){
    var real=step===4 && isLoggedIn() ? 4 : step;
    if(!isLoggedIn() && step===5){ step=3; render(); return; }
    if(step===4 && isLoggedIn()){
      el.innerHTML='<h2>Campaign title</h2><label class="f">Title</label><input id="title" value="'+esc(draft.title)+'" placeholder="Help…"><label class="f" style="margin-top:12px">Goal (USD)</label><input id="goal" value="'+esc(draft.goal)+'" inputmode="decimal"><label class="f" style="margin-top:12px">Your story</label><textarea id="story" rows="6">'+esc(draft.story)+'</textarea>';
    } else if(step===5){
      el.innerHTML='<h2>Add photos</h2><div id="mediaBox" class="gals"></div><label class="btn" style="display:inline-flex;margin-top:12px">Add photos<input id="files" type="file" accept="image/*" multiple class="hide"></label>';
      paintMedia();
      var inp=$("files");
      if(inp) inp.onchange=function(){
        var files=Array.prototype.slice.call(inp.files||[]);
        var remaining=8-draft.media.length;
        if(remaining<=0){showErr("Max 8 photos");return;}
        files=files.slice(0,remaining);
        var chain=Promise.resolve();
        files.forEach(function(file){
          chain=chain.then(function(){
            return compressImage(file,1200,0.72).then(function(item){
              if(item){draft.media.push(item);paintMedia();}
              else showErr("Could not process that image.");
            });
          });
        });
      };
    }
  } else if(step===6){
    el.innerHTML='<h2>Review & publish</h2><p class="note">Title: <strong>'+esc(draft.title)+'</strong></p><p class="note">Goal: $'+startGoal().toLocaleString()+'</p><p class="note">Photos: '+draft.media.length+'</p>';
  }
  el.appendChild(err);
}
function publish(){
  if(!isLoggedIn()){step=3;render();return}
  if(!draft.title.trim())return showErr("Add a title.");
  if(!draft.media.length)return showErr("Add at least one photo.");
  var goal=Math.max(1,goalNum());
  var id="c_"+Date.now().toString(36);
  var camp={id:id,code:makeCode(6),title:draft.title.trim(),story:draft.story||'',goal:goal,raised:0,donations:0,status:'pending',image:draft.media[0]&&draft.media[0].src||'',images:draft.media.map(function(m){return m.src}),organizer:user.name||user.email,ownerEmail:user.email,organizerEmail:user.email,ownerId:user.id,category:draft.category,beneficiary:draft.beneficiary,country:draft.country,createdAt:new Date().toISOString(),donors:[]};
  var list=[];try{list=JSON.parse(localStorage.getItem('hopeforus_campaigns')||'[]')}catch(e){}
  if(!Array.isArray(list))list=[];
  list.unshift(camp);
  try{localStorage.setItem('hopeforus_campaigns',JSON.stringify(list))}catch(e){return showErr('Could not save campaign (storage full).');}
  if(window.HF&&HF.saveCampaign) try{HF.saveCampaign(camp)}catch(e){}
  location.href='/dashboard/';
}
$("cont").onclick=function(){
  showErr("");
  if(step===0){
    draft.country=($("country")&&$("country").value||"").trim()||draft.country;
    draft.zip=($("zip")&&$("zip").value||"").trim();
    step=1;render();return;
  }
  if(step===1){ if(!draft.beneficiary) return showErr("Pick who you are fundraising for."); step=2;render();return; }
  if(step===2){ if(!draft.category) return showErr("Pick a category."); step=3;render();return; }
  if(step===3){
    if(isLoggedIn()){step=4;render();return;}
    var email=($("email")&&$("email").value||"").trim().toLowerCase();
    var pass=($("pass")&&$("pass").value||"");
    var name=($("name")&&$("name").value||"").trim();
    var whatsapp=($("whatsapp")&&$("whatsapp").value||"").trim();
    if(!email||email.indexOf("@")<0)return showErr("Enter a valid email.");
    if(pass.length<6)return showErr("Password must be at least 6 characters.");
    var waDigits=whatsapp.replace(/[\s()+-]/g,"");
    if(waDigits.charAt(0)==="+") waDigits=waDigits.slice(1);
    if(!/^\d{8,15}$/.test(waDigits)) return showErr("Enter a valid WhatsApp number with country code.");
    if(!emailjsReady()){
      return showErr("Email service is not ready. Refresh the page and try again.");
    }
    pendingAuth={email:email,pass:pass,name:name,whatsapp:waDigits,code:makeOtp(),sentAt:Date.now()};
    $("cont").disabled=true;$("cont").textContent="Sending code…";
    sendEmailCode(email,pendingAuth.code,name).then(function(sent){
      $("cont").disabled=false;$("cont").textContent="Continue";
      if(!sent) return showErr("Could not send email. Try again.");
      step=4;render();
    });
    return;
  }
  if(step===4 && !isLoggedIn()){
    var code=($("code")&&$("code").value||"").trim();
    if(code!==pendingAuth.code) return showErr("Wrong code.");
    if(Date.now()-pendingAuth.sentAt>30*60*1000) return showErr("Code expired. Go back and resend.");
    saveUser(pendingAuth.email, pendingAuth.pass, pendingAuth.name, pendingAuth.whatsapp);
    step=4; render(); return;
  }
  if(step===4 && isLoggedIn()){
    draft.title=($("title")&&$("title").value||"").trim();
    draft.goal=($("goal")&&$("goal").value||"");
    draft.story=($("story")&&$("story").value||"");
    if(!draft.title) return showErr("Add a title.");
    step=5;render();return;
  }
  if(step===5){
    if(!draft.media.length) return showErr("Add at least one photo.");
    step=6;render();return;
  }
  if(step===6){ publish(); return; }
};
$("back").onclick=function(){
  if(step<=0){ location.href='/'; return; }
  if(step===4 && isLoggedIn()){ step=3; }
  else step=Math.max(0,step-1);
  render();
};
render();
