var CATS=["Animals","Business","Community","Competitions","Creative","Education","Emergencies","Environment","Events","Faith","Family","Funerals & Memorials","Medical","Monthly Bills","Newlyweds","Other","Sports","Travel","Volunteer","Wishes"];
var STEPS=6;
var step=0;
var draft={country:"United States",zip:"",category:"",beneficiary:"",goal:"",autoGoal:true,title:"",story:"",media:[]};
var user=null;
try{user=JSON.parse(localStorage.getItem("hopeforus_user")||"null")}catch(e){}
function $(id){return document.getElementById(id)}
function esc(s){var a=String.fromCharCode(38);return String(s||"").replace(/&/g,a+"amp;").replace(/</g,a+"lt;").replace(/>/g,a+"gt;").replace(/"/g,a+"quot;")}
function goalNum(){var n=parseFloat(String(draft.goal).replace(/[^0-9.]/g,""));return isNaN(n)?0:n}
function startGoal(){return Math.max(1,goalNum())}
var titles=[
  ["Let's begin your fundraising journey","We're here to guide you every step of the way."],
  ["Who are you fundraising for?","This helps us personalize your experience."],
  ["Set your goal","You can always change this later."],
  ["Create your account","Save progress and manage your fundraiser."],
  ["Confirm your details","Almost there."],
  ["Tell your story","Photos and a short video help donors understand fast."]
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
function render(){
  $("stepn").textContent=(step+1)+" of "+STEPS;
  $("stitle").textContent=titles[step][0];
  $("ssub").textContent=titles[step][1];
  $("prog").style.width=((step+1)/STEPS*100)+"%";
  $("back").disabled=step===0;
  $("cont").textContent=step===5?"Publish":"Continue";
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
    var sel=$("country");["United States","Canada","United Kingdom","Australia","Germany","France","Other"].forEach(function(c){var o=document.createElement("option");o.value=c;o.textContent=c;if(c===draft.country)o.selected=true;sel.appendChild(o)});
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
    if(isLoggedIn()){step=5;render();return}
    el.innerHTML=
      '<div class="acct"><h2>Create your account</h2>'+
      '<label class="f">Email</label><input id="email" type="email" placeholder="you@email.com">'+
      '<label class="f" style="margin-top:12px">Password</label><input id="pass" type="password" placeholder="At least 6 characters">'+
      '<label class="f" style="margin-top:12px">Your name</label><input id="name" placeholder="First name">'+
      '<p class="note">By continuing you agree to HopeForUs terms.</p></div>';
  } else if(step===4){
    el.innerHTML=
      '<div class="acct"><h2>You\'re signed in</h2>'+
      '<p style="font-weight:600">Signed in as '+esc(user&&user.email?user.email:"")+'</p>'+
      '</div>';
  } else if(step===5){
    el.innerHTML=
      '<label class="f">Fundraiser title</label>'+
      '<input id="title" placeholder="Help Maya finish nursing school" value="'+esc(draft.title)+'">'+
      '<label class="f" style="margin-top:14px">Story</label>'+
      '<textarea id="story" rows="5" placeholder="What happened, and how will the funds help?">'+esc(draft.story)+'</textarea>'+
      '<label class="f" style="margin-top:14px">Photos and video (required)</label>'+
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
  user={id:"u_"+email.toLowerCase(),email:email.toLowerCase(),name:(name||email.split("@")[0]),password:pass,provider:"email"};
  var users=[];try{users=JSON.parse(localStorage.getItem("hopeforus_users")||"[]")}catch(e){}
  if(!Array.isArray(users))users=[];
  users=users.filter(function(u){return u.email!==user.email});
  users.push(user);
  try{localStorage.setItem("hopeforus_users",JSON.stringify(users))}catch(e){}
  try{localStorage.setItem("hopeforus_user",JSON.stringify({id:user.id,email:user.email,name:user.name,provider:"email"}))}catch(e){}
}
function publish(){
  if(!isLoggedIn()){step=3;render();return}
  if(!draft.title.trim())return showErr("Add a title.");
  if(!draft.media.length)return showErr("Add at least one photo or video.");
  var goal=Math.max(1,goalNum());
  var id="c_"+Date.now().toString(36);
  var media=draft.media.filter(Boolean).slice(0,4);
  var cover="";
  for(var i=0;i<media.length;i++){if(media[i].type==="image"&&media[i].dataUrl){cover=media[i].dataUrl;break}}
  if(!cover&&media[0])cover=media[0].dataUrl||"";
  var camp={
    id:id,ownerId:user.id,organizer:user.name||user.email,title:draft.title.trim(),story:draft.story.trim(),
    country:draft.country,zip:draft.zip,category:draft.category||"Other",beneficiary:draft.beneficiary||"yourself",
    goal:goal,startGoal:startGoal(),autoGoal:draft.autoGoal,raised:0,donations:0,currency:"USD",
    image:cover,media:media,createdAt:new Date().toISOString()
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
  location.href="campaign.html?id="+encodeURIComponent(id);
}
$("back").onclick=function(){
  if(step===0)return;
  if(isLoggedIn()&&step===5){step=2;render();return}
  if(step===5&&!isLoggedIn()){step=4;render();return}
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
    var email=($("email")&&$("email").value||"").trim();
    var pass=($("pass")&&$("pass").value||"");
    var name=($("name")&&$("name").value||"").trim();
    if(!email||email.indexOf("@")<0)return showErr("Enter a valid email.");
    if(pass.length<6)return showErr("Password must be at least 6 characters.");
    saveUser(email,pass,name);
    step=5;render();return;
  }
  if(step===5){publish();return}
  step++;
  render();
};
render();
