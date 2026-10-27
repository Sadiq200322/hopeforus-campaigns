var CATS=["Animals","Business","Community","Competitions","Creative","Education","Emergencies","Environment","Events","Faith","Family","Funerals & Memorials","Medical","Monthly Bills","Newlyweds","Other","Sports","Travel","Volunteer","Wishes"];
var STEPS=7;
var step=0;
var draft={country:"United States",zip:"",category:"",beneficiary:"",goal:"",autoGoal:true,title:"",story:"",media:[]};
var pendingAuth={email:"",pass:"",name:"",code:"",sentAt:0};
var lastEmailSent=false;
var user=null;
try{user=JSON.parse(localStorage.getItem("hopeforus_user")||"null")}catch(e){}
function $(id){return document.getElementById(id)}
function esc(s){var a=String.fromCharCode(38);return String(s||"").replace(/&/g,a+"amp;").replace(/</g,a+"lt;").replace(/>/g,a+"gt;").replace(/\"/g,a+"quot;")}
function goalNum(){var n=parseFloat(String(draft.goal).replace(/[^0-9.]/g,""));return isNaN(n)?0:n}
function startGoal(){return Math.max(1,goalNum())}
function makeCode(len){
  var chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var out="";
  for(var i=0;i<(len||6);i++) out+=chars.charAt(Math.floor(Math.random()*chars.length));
  return out;
}
function makeShortCode(){
  var list=[];try{list=JSON.parse(localStorage.getItem("hopeforus_campaigns")||"[]")}catch(e){}
  if(!Array.isArray(list))list=[];
  var used={};
  list.forEach(function(c){if(c&&c.code)used[String(c.code).toUpperCase()]=1});
  var code,tries=0;
  do{code=makeCode(6);tries++}while(used[code]&&tries<40);
  return code;
}
function shortShareUrl(code){
  var host=location.origin||"https://munowatchplus.watch";
  return host+"/c/"+encodeURIComponent(String(code||"").toUpperCase());
}
function emailjsReady(){
  var cfg=window.HOPEFORUS_EMAILJS||{};
  return !!(window.emailjs && cfg.publicKey && cfg.serviceId && cfg.templateId &&
    cfg.publicKey!=="YOUR_PUBLIC_KEY" && cfg.serviceId!=="YOUR_SERVICE_ID" && cfg.templateId!=="YOUR_TEMPLATE_ID");
}
var titles=[
  ["Let's begin your fundraising journey","We're here to guide you every step of the way."],
  ["Who are you fundraising for?","This helps us personalize your experience."],
  ["Set your goal","You can always change this later."],
  ["Create your account","We'll send a code to your email."],
  ["Verify your email","Enter the 6-digit code we sent."],
  ["Confirm your details","Almost there."],
  ["Tell your story","Photos help donors understand fast."]
];
function showErr(msg){var e=$("err");if(e){e.textContent=msg;e.classList.add("show")}}
function isLoggedIn(){return !!(user&&user.email)}
function paintMedia(){
  var mg=$("mg");if(!mg)return;mg.innerHTML="";
  draft.media.forEach(function(m,idx){
    var wrap=document.createElement("div");wrap.style.position="relative";wrap.style.flexShrink="0";
    if(m.type==="video"){var v=document.createElement("video");v.src=m.dataUrl;v.muted=true;v.autoplay=true;v.loop=true;v.playsInline=true;wrap.appendChild(v)}
    else{var img=document.createElement("img");img.src=m.dataUrl;img.alt="";wrap.appendChild(img)}
    var rm=document.createElement("button");rm.type="button";rm.textContent="\u00d7";rm.setAttribute("aria-label","Remove");
    rm.style.cssText="position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:50%;border:0;background:rgba(0,0,0,.6);color:#fff;font-size:14px;line-height:24px;padding:0;cursor:pointer";
    rm.onclick=function(){draft.media.splice(idx,1);paintMedia()};
    wrap.appendChild(rm);mg.appendChild(wrap);
  });
  var hint=$("mediaHint");
  if(hint)hint.textContent=draft.media.length?draft.media.length+" photo"+(draft.media.length>1?"s":""):"";
}
function compressImage(file,maxW,quality){
  return new Promise(function(resolve){
    if(!file||file.type.indexOf("image")!==0){resolve(null);return}
    var url=URL.createObjectURL(file);
    var img=new Image();
    img.onload=function(){
      var w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
      var scale=Math.min(1,maxW/Math.max(w,h));
      var cw=Math.max(1,Math.round(w*scale)),ch=Math.max(1,Math.round(h*scale));
      var canvas=document.createElement("canvas");
      canvas.width=cw;canvas.height=ch;
      var ctx=canvas.getContext("2d");
      ctx.drawImage(img,0,0,cw,ch);
      URL.revokeObjectURL(url);
      var dataUrl=canvas.toDataURL("image/jpeg",quality);
      resolve({type:"image",dataUrl:dataUrl,name:file.name});
    };
    img.onerror=function(){URL.revokeObjectURL(url);resolve(null)};
    img.src=url;
  });
}
function sendEmailCode(email,code,name){
  try{
    localStorage.setItem("hopeforus_otp",JSON.stringify({email:email.toLowerCase(),code:String(code),expires:Date.now()+15*60*1000}));
  }catch(e){}
  if(!emailjsReady()){
    lastEmailSent=false;
    return Promise.resolve(false);
  }
  var cfg=window.HOPEFORUS_EMAILJS;
  try{
    if(!window.__emailjs_inited){
      emailjs.init({publicKey:cfg.publicKey});
      window.__emailjs_inited=true;
    }
    return emailjs.send(cfg.serviceId, cfg.templateId, {
      to_email: email,
      otp_code: String(code),
      user_name: name||email.split("@")[0],
      site_name: "HopeForUs"
    }).then(function(){
      lastEmailSent=true;
      return true;
    }).catch(function(err){
      console.warn("EmailJS send failed", err);
      lastEmailSent=false;
      return false;
    });
  }catch(e){
    console.warn("EmailJS error", e);
    lastEmailSent=false;
    return Promise.resolve(false);
  }
}
function alertAdminNewCampaign(camp){
  // Best-effort admin alert via EmailJS if configured. Does not block publish.
  if(!emailjsReady()) return;
  var cfg=window.HOPEFORUS_EMAILJS;
  var adminEmail=(window.HF&&window.HF.ADMIN_EMAIL)||"admin@hopeforus.com";
  try{
    if(!window.__emailjs_inited){
      emailjs.init({publicKey:cfg.publicKey});
      window.__emailjs_inited=true;
    }
    emailjs.send(cfg.serviceId, cfg.templateId, {
      to_email: adminEmail,
      otp_code: "NEW",
      user_name: "Admin",
      site_name: "HopeForUs — New campaign: "+(camp.title||"")+" by "+(camp.ownerEmail||"")
    }).catch(function(){});
  }catch(e){}
}
function render(){
  $("stepn").textContent=(step+1)+" of "+STEPS;
  $("stitle").textContent=titles[step][0];
  $("ssub").textContent=titles[step][1];
  $("prog").style.width=((step+1)/STEPS*100)+"%";
  $("back").disabled=step===0;
  $("cont").textContent=step===6?"Publish":(step===4?"Verify":"Continue");
  if(isLoggedIn()){$("topr").innerHTML='<a href="dashboard.html">'+esc(user.name||user.email)+'</a>'}
  else{$("topr").innerHTML='<a href="login.html">Sign in</a>'}
  var el=$("body");
  el.innerHTML="";
  var err=document.createElement("p");err.className="err";err.id="err";
  if(step===0){
    el.innerHTML=
      '<h2>Where will the funds go?</h2>'+
      '<p class="hint">Choose the location where you plan to withdraw your funds.</p>'+
      '<div class="row2">'+
        '<div><label class="f">Country</label><select id="country"></select></div>'+
        '<div><label class="f">Postal / ZIP code</label><input id="zip" placeholder="Zip code" value="'+esc(draft.zip)+'"></div>'+
      '</div>'+
      '<h2 style="margin-top:28px">What best describes why you\'re fundraising?</h2>'+
      '<div class="chips" id="chips"></div>';
    var sel=$("country");["Uganda","Kenya","United States","Canada","United Kingdom","Australia","Germany","France","Other"].forEach(function(c){var o=document.createElement("option");o.value=c;o.textContent=c;if(c===draft.country)o.selected=true;sel.appendChild(o)});
    sel.onchange=function(){draft.country=this.value};
    $("zip").oninput=function(){draft.zip=this.value};
    var chips=$("chips");
    CATS.forEach(function(c){
      var b=document.createElement("button");b.type="button";b.className="chip"+(draft.category===c?" on":"");b.textContent=c;
      b.onclick=function(){draft.category=c;render()};
      chips.appendChild(b);
    });
  } else if(step===1){
    el.innerHTML='<h2>Who are you fundraising for?</h2><p class="hint">This helps us personalize your experience.</p><div id="bens"></div>';
    ["Yourself","Someone else","Charity"].forEach(function(b){
      var btn=document.createElement("button");btn.type="button";btn.className="choice"+(draft.beneficiary===b.toLowerCase()?" on":"");
      btn.innerHTML='<strong>'+b+'</strong>';
      btn.onclick=function(){draft.beneficiary=b.toLowerCase();render()};
      $("bens").appendChild(btn);
    });
  } else if(step===2){
    el.innerHTML=
      '<h2>How much would you like to raise?</h2>'+
      '<div class="amt"><span class="cur">USD</span><input id="goal" inputmode="decimal" placeholder="5,000" value="'+esc(draft.goal)+'"></div>'+
      '<div class="auto"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><span class="badge">Recommended</span><p style="margin-top:8px;font-size:.9rem">Keep goal flexible so donors can still give after you reach it.</p></div>'+
      '<button type="button" class="sw'+(draft.autoGoal?" on":"")+'" id="sw"><i></i></button></div></div>';
    $("goal").oninput=function(){draft.goal=this.value};
    $("sw").onclick=function(){draft.autoGoal=!draft.autoGoal;this.classList.toggle("on",draft.autoGoal)};
  } else if(step===3){
    if(isLoggedIn()){step=6;render();return}
    el.innerHTML=
      '<div class="acct"><h2>Create your account</h2>'+
      '<label class="f">Email</label><input id="email" type="email" placeholder="you@email.com" value="'+esc(pendingAuth.email)+'">'+
      '<label class="f" style="margin-top:12px">Password</label><input id="pass" type="password" placeholder="At least 6 characters">'+
      '<label class="f" style="margin-top:12px">Your name</label><input id="name" placeholder="First name" value="'+esc(pendingAuth.name)+'">'+
      '<p class="note">We\'ll email a 6-digit code to verify it\'s you.</p></div>';
  } else if(step===4){
    el.innerHTML=
      '<div class="acct"><h2>Check your email</h2>'+
      '<p style="font-size:.95rem;color:#5c5c5c;margin-bottom:14px">We sent a code to <strong>'+esc(pendingAuth.email)+'</strong></p>'+
      '<label class="f">Verification code</label>'+
      '<input id="otp" inputmode="numeric" maxlength="6" placeholder="6-digit code" style="letter-spacing:.2em;font-weight:700;font-size:1.2rem;text-align:center">'+
      '<p class="note" id="otpHint" style="margin-top:12px">Code expires in 15 minutes. <button type="button" id="resend" style="background:none;border:0;color:#7C3AED;font-weight:700;cursor:pointer;font-size:inherit">Resend code</button></p>'+
      '<p class="note" id="devCode" style="margin-top:8px;display:none;background:#f3f4f6;padding:10px;border-radius:10px;font-weight:600"></p>'+
      '</div>';
    setTimeout(function(){
      var resend=$("resend");
      if(resend)resend.onclick=function(){
        pendingAuth.code=makeCode(6);
        pendingAuth.sentAt=Date.now();
        sendEmailCode(pendingAuth.email,pendingAuth.code,pendingAuth.name).then(function(sent){
          var d=$("devCode");
          if(!d)return;
          if(sent){d.style.display="block";d.style.background="#ecfdf5";d.style.color="#065f46";d.textContent="Code resent — check your inbox (and spam).";}
          else{d.style.display="block";d.innerHTML="Could not send email. Use this code: <strong style=\"font-size:1.2rem;letter-spacing:.15em\">"+pendingAuth.code+"</strong>";}
        });
      };
      var d=$("devCode");
      if(d){
        if(lastEmailSent){
          d.style.display="block";d.style.background="#ecfdf5";d.style.color="#065f46";
          d.textContent="Email sent. Check your inbox and spam folder.";
        } else {
          d.style.display="block";
          d.innerHTML="EmailJS not configured yet — use code: <strong style=\"font-size:1.2rem;letter-spacing:.15em\">"+pendingAuth.code+"</strong>";
        }
      }
    },50);
  } else if(step===5){
    el.innerHTML=
      '<div class="acct"><h2>You\'re signed in</h2>'+
      '<p style="font-weight:600">Signed in as '+esc(user&&user.email?user.email:"")+'</p>'+
      '</div>';
  } else if(step===6){
    el.innerHTML=
      '<label class="f">Fundraiser title</label>'+
      '<input id="title" placeholder="Help Maya finish nursing school" value="'+esc(draft.title)+'">'+
      '<label class="f" style="margin-top:14px">Story</label>'+
      '<textarea id="story" rows="5" placeholder="What happened, and how will the funds help?">'+esc(draft.story)+'</textarea>'+
      '<label class="f" style="margin-top:14px">Photos (required)</label>'+
      '<input type="file" id="files" accept="image/*" multiple>'+
      '<p class="hint" id="mediaHint" style="margin-top:6px">Up to 4 photos. We compress them automatically.</p>'+
      '<div class="media-grid" id="mg"></div>';
    $("title").oninput=function(){draft.title=this.value};
    $("story").oninput=function(){draft.story=this.value};
    paintMedia();
    $("files").onchange=function(e){
      var files=Array.from(e.target.files||[]);
      e.target.value="";
      if(!files.length)return;
      var remaining=Math.max(0,4-draft.media.length);
      if(!remaining){showErr("Max 4 photos. Remove one to add another.");return}
      files=files.slice(0,remaining);
      var chain=Promise.resolve();
      files.forEach(function(file){
        chain=chain.then(function(){
          return compressImage(file,1200,0.72).then(function(item){
            if(item){draft.media.push(item);paintMedia()}
            else showErr("Could not process that image.");
          });
        });
      });
    };
  }
  el.appendChild(err);
}
function saveUser(email, pass, name){
  user={id:"u_"+email.toLowerCase(),email:email.toLowerCase(),name:(name||email.split("@")[0]),password:pass,provider:"email",verified:true};
  var users=[];try{users=JSON.parse(localStorage.getItem("hopeforus_users")||"[]")}catch(e){}
  if(!Array.isArray(users))users=[];
  users=users.filter(function(u){return u.email!==user.email});
  users.push(user);
  try{localStorage.setItem("hopeforus_users",JSON.stringify(users))}catch(e){}
  try{localStorage.setItem("hopeforus_user",JSON.stringify({id:user.id,email:user.email,name:user.name,provider:"email",verified:true}))}catch(e){}
}
function publish(){
  if(!isLoggedIn()){step=3;render();return}
  if(!draft.title.trim())return showErr("Add a title.");
  if(!draft.media.length)return showErr("Add at least one photo.");
  var goal=Math.max(1,goalNum());
  var id="c_"+Date.now().toString(36);
  var code=makeShortCode();
  var media=draft.media.filter(Boolean).slice(0,4);
  var cover="";
  for(var i=0;i<media.length;i++){if(media[i].type==="image"&&media[i].dataUrl){cover=media[i].dataUrl;break}}
  if(!cover&&media[0])cover=media[0].dataUrl||"";
  var camp={
    id:id,code:code,ownerId:user.id,ownerEmail:user.email,organizerEmail:user.email,organizer:user.name||user.email,title:draft.title.trim(),story:draft.story.trim(),
    country:draft.country,zip:draft.zip,category:draft.category||"Other",beneficiary:draft.beneficiary||"yourself",
    goal:goal,startGoal:startGoal(),autoGoal:draft.autoGoal,raised:0,donations:0,currency:"USD",
    image:cover,media:media,createdAt:new Date().toISOString(),shareUrl:shortShareUrl(code),
    status:"pending",donationLink:""
  };
  var list=[];try{list=JSON.parse(localStorage.getItem("hopeforus_campaigns")||"[]")}catch(e){}
  if(!Array.isArray(list))list=[];
  list=list.map(function(c){
    if(!c||c.id===id)return c;
    if(c.media&&c.media.length>1)c.media=c.media.slice(0,1);
    return c;
  });
  list.unshift(camp);
  function trySave(payload){
    try{localStorage.setItem("hopeforus_campaigns",JSON.stringify(payload));return true}catch(e){return false}
  }
  if(!trySave(list)){
    camp.media=cover?[{type:"image",dataUrl:cover,name:"cover.jpg"}]:[];
    list[0]=camp;
    if(!trySave(list)){
      list=list.map(function(c,i){if(i===0)return c;var x=Object.assign({},c);x.media=[];if(x.image&&x.image.length>200000)x.image="";return x});
      if(!trySave(list))return showErr("Storage full — try 1 smaller photo (under 1MB) and publish again.");
    }
  }
  alertAdminNewCampaign(camp);
  try{localStorage.setItem("hopeforus_last_share",shortShareUrl(code))}catch(e){}
  location.href="campaign.html?id="+encodeURIComponent(id)+"&code="+encodeURIComponent(code)+"&pending=1";
}
$("back").onclick=function(){
  if(step===0)return;
  if(isLoggedIn()&&step===6){step=2;render();return}
  if(step===6&&!isLoggedIn()){step=5;render();return}
  if(step===4){step=3;render();return}
  step--;
  render();
};
$("cont").onclick=function(){
  if(step===0){
    if(!draft.category)return showErr("Pick a category.");
    if(!draft.zip.trim())return showErr("Enter a postal / ZIP code.");
  }
  if(step===1&&!draft.beneficiary)return showErr("Choose who you are fundraising for.");
  if(step===2&&goalNum()<=0)return showErr("Enter a goal amount.");
  if(step===3){
    var email=($("email")&&$("email").value||"").trim().toLowerCase();
    var pass=($("pass")&&$("pass").value||"");
    var name=($("name")&&$("name").value||"").trim();
    if(!email||email.indexOf("@")<0)return showErr("Enter a valid email.");
    if(pass.length<6)return showErr("Password must be at least 6 characters.");
    pendingAuth={email:email,pass:pass,name:name,code:makeCode(6),sentAt:Date.now()};
    $("cont").disabled=true;$("cont").textContent="Sending…";
    sendEmailCode(email,pendingAuth.code,name).then(function(){
      $("cont").disabled=false;
      step=4;render();
    });
    return;
  }
  if(step===4){
    var otp=(($("otp")&&$("otp").value)||"").trim().toUpperCase();
    if(!otp||otp.length<4)return showErr("Enter the verification code.");
    var ok=false;
    if(pendingAuth.code && otp===String(pendingAuth.code).toUpperCase()) ok=true;
    try{
      var stored=JSON.parse(localStorage.getItem("hopeforus_otp")||"null");
      if(stored&&stored.email===pendingAuth.email&&String(stored.code).toUpperCase()===otp&&stored.expires>Date.now()) ok=true;
    }catch(e){}
    if(!ok)return showErr("Wrong or expired code. Try again or resend.");
    saveUser(pendingAuth.email,pendingAuth.pass,pendingAuth.name);
    try{localStorage.removeItem("hopeforus_otp")}catch(e){}
    step=6;render();return;
  }
  if(step===6){publish();return}
  step++;
  render();
};
render();
