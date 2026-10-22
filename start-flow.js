var CATS=["Animals","Business","Community","Competitions","Creative","Education","Emergencies","Environment","Events","Faith","Family","Funerals & Memorials","Medical","Monthly Bills","Newlyweds","Other","Sports","Travel","Volunteer","Wishes"];
var COUNTRIES=["United States","United Kingdom","Canada","Kenya","Uganda","Nigeria","Germany","France","India","Australia"];
var STEPS=6;
var step=0;
var draft={country:"United States",zip:"",category:"",beneficiary:"",goal:"",autoGoal:true,title:"",story:"",media:[]};
var user=null;
try{user=JSON.parse(localStorage.getItem("hopeforus_user")||"null")}catch(e){}
var titles=[
  ["Let's begin your fundraising journey","We're here to guide you every step of the way."],
  ["Tell us who you're raising funds for","This helps us tailor guidance for your fundraiser."],
  ["Tell us how much you'd like to raise","You can change this later from your organizer desk."],
  ["Create your account","Email and password so you can return to your fundraiser."],
  ["You're almost ready","Next, add the story people will see."],
  ["Add the story people will see","Photos and a short video help donors understand fast."]
];
function $(id){return document.getElementById(id)}
function goalNum(){return Number(draft.goal)||0}
function startGoal(){var g=goalNum();return draft.autoGoal?Math.max(50,Math.round(g*0.6)):g}
function esc(s){var amp=String.fromCharCode(38);var t=String(s==null?"":s);return t.split(amp).join(amp+"amp;").split("<").join(amp+"lt;").split(">").join(amp+"gt;").split('"').join(amp+"quot;");}
function showErr(msg){var e=$("err");if(e){e.textContent=msg;e.classList.add("show")}}
function isLoggedIn(){return !!(user&&user.email)}
function paintMedia(){
  var mg=$("mg");if(!mg)return;mg.innerHTML="";
  draft.media.forEach(function(m){
    if(m.type==="video"){var v=document.createElement("video");v.src=m.dataUrl;v.muted=true;v.autoplay=true;v.loop=true;v.playsInline=true;mg.appendChild(v)}
    else{var img=document.createElement("img");img.src=m.dataUrl;img.alt="";mg.appendChild(img)}
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
    var sel=$("country");
    COUNTRIES.forEach(function(c){
      var o=document.createElement("option");o.value=c;o.textContent=c;
      if(c===draft.country)o.selected=true;sel.appendChild(o);
    });
    var chips=$("chips");
    CATS.forEach(function(c){
      var b=document.createElement("button");b.type="button";
      b.className="chip"+(draft.category===c?" on":"");
      b.textContent=c;
      b.onclick=function(){draft.category=c;render()};
      chips.appendChild(b);
    });
  } else if(step===1){
    el.innerHTML='<h2>Who are you fundraising for?</h2>';
    [
      ["yourself","Yourself","Funds go to your account for your own use.","1"],
      ["someone","Someone else","Invite a beneficiary or distribute funds yourself.","2"],
      ["charity","Charity","Funds go to a nonprofit you name in the story.","3"]
    ].forEach(function(x){
      var b=document.createElement("button");b.type="button";
      b.className="choice"+(draft.beneficiary===x[0]?" on":"");
      b.innerHTML='<span class="ic">'+x[3]+'</span><span><strong>'+x[1]+'</strong><span>'+x[2]+'</span></span>';
      b.onclick=function(){draft.beneficiary=x[0];render()};
      el.appendChild(b);
    });
  } else if(step===2){
    el.innerHTML=
      '<div class="amt"><span>$</span><input id="goal" inputmode="numeric" placeholder="Enter amount" value="'+esc(draft.goal)+'"><span class="cur">USD</span></div>'+
      '<p class="hint" style="margin-top:8px">Fundraisers like yours typically aim to raise $5,000</p>'+
      '<div class="auto"><div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start">'+
        '<div><span class="badge">RECOMMENDED</span><p style="font-weight:700;margin-top:8px">Automated goal setting</p>'+
        '<p class="hint" style="margin:4px 0 0">Start lower and raise the public goal as donations come in.</p></div>'+
        '<button type="button" class="sw'+(draft.autoGoal?" on":"")+'" id="autoSw"><i></i></button></div>'+
        '<div id="startHint" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line);font-size:.9rem;display:'+(draft.autoGoal&&goalNum()>=50?"block":"none")+'">Your starting goal would be: <strong>$'+startGoal().toLocaleString()+'</strong></div></div>';
    $("goal").oninput=function(){
      draft.goal=this.value.replace(/[^\d]/g,"");this.value=draft.goal;
      var sh=$("startHint");
      if(sh){sh.style.display=draft.autoGoal&&goalNum()>=50?"block":"none";sh.innerHTML='Your starting goal would be: <strong>$'+startGoal().toLocaleString()+'</strong>'}
    };
    $("autoSw").onclick=function(){draft.autoGoal=!draft.autoGoal;render()};
  } else if(step===3){
    el.innerHTML=
      '<div class="acct">'+
        '<h2>Your preferred email</h2>'+
        '<p class="hint">Just email and a password — no Google or Apple required.</p>'+
        '<label class="f">Email</label>'+
        '<input type="email" id="regEmail" placeholder="you@email.com" autocomplete="email">'+
        '<label class="f" style="margin-top:12px">Password</label>'+
        '<input type="password" id="regPass" placeholder="At least 6 characters" autocomplete="new-password">'+
        '<label class="f" style="margin-top:12px">Display name (optional)</label>'+
        '<input type="text" id="regName" placeholder="How donors see you" autocomplete="name">'+
        '<p class="note">Already have an account? <a href="login.html" style="color:var(--p);font-weight:700">Sign in</a> first, then start a fundraiser.</p>'+
      '</div>';
  } else if(step===4){
    el.innerHTML=
      '<div class="acct">'+
        '<h2>You\'re set</h2>'+
        '<p class="hint">Next, add a title, story, and at least one photo or video.</p>'+
        '<p style="font-weight:600">Signed in as '+esc(user&&user.email?user.email:"")+'</p>'+
      '</div>';
  } else if(step===5){
    el.innerHTML=
      '<label class="f">Fundraiser title</label>'+
      '<input id="title" placeholder="Help Maya finish nursing school" value="'+esc(draft.title)+'">'+
      '<label class="f" style="margin-top:14px">Story</label>'+
      '<textarea id="story" rows="5" placeholder="What happened, and how will the funds help?">'+esc(draft.story)+'</textarea>'+
      '<label class="f" style="margin-top:14px">Photos and video (required)</label>'+
      '<input type="file" id="files" accept="image/*,video/*" multiple>'+
      '<div class="media-grid" id="mg"></div>';
    $("title").oninput=function(){draft.title=this.value};
    $("story").oninput=function(){draft.story=this.value};
    paintMedia();
    $("files").onchange=function(e){
      Array.from(e.target.files||[]).slice(0,6).forEach(function(file){
        var r=new FileReader();
        r.onload=function(){
          draft.media.push({type:file.type.indexOf("video")===0?"video":"image",dataUrl:String(r.result),name:file.name});
          if(draft.media.length>8)draft.media=draft.media.slice(0,8);
          paintMedia();
        };
        r.readAsDataURL(file);
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
  var camp={
    id:id,ownerId:user.id,organizer:user.name,title:draft.title.trim(),story:draft.story.trim(),
    country:draft.country,zip:draft.zip,category:draft.category||"Other",beneficiary:draft.beneficiary||"yourself",
    goal:goal,startGoal:startGoal(),autoGoal:draft.autoGoal,raised:0,donations:0,currency:"USD",
    image:draft.media[0]&&draft.media[0].type==="image"?draft.media[0].dataUrl:"",
    media:draft.media,createdAt:new Date().toISOString()
  };
  var list=[];try{list=JSON.parse(localStorage.getItem("hopeforus_campaigns")||"[]")}catch(e){}
  if(!Array.isArray(list))list=[];
  list.unshift(camp);
  try{localStorage.setItem("hopeforus_campaigns",JSON.stringify(list))}catch(e){return showErr("Could not save media — try fewer or smaller files.")}
  location.href="dashboard.html";
}
$("back").onclick=function(){
  if(step===0)return;
  if(isLoggedIn()&&step===5){step=2;render();return}
  if(step===5&&!isLoggedIn()){step=4;render();return}
  step--;render();
};
$("cont").onclick=function(){
  if(step===0){
    draft.country=$("country").value;draft.zip=$("zip").value;
    if(!draft.category)return showErr("Choose what best describes the fundraiser.");
    step=1;render();return;
  }
  if(step===1){
    if(!draft.beneficiary)return showErr("Choose who the funds are for.");
    step=2;render();return;
  }
  if(step===2){
    if(goalNum()<50)return showErr("Enter a goal of at least 50.");
    if(isLoggedIn()){step=5;render();return}
    step=3;render();return;
  }
  if(step===3){
    var email=($("regEmail").value||"").trim();
    var pass=($("regPass").value||"");
    var name=($("regName").value||"").trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return showErr("Enter a valid email.");
    if(pass.length<6)return showErr("Password must be at least 6 characters.");
    saveUser(email,pass,name);step=4;render();return;
  }
  if(step===4){step=5;render();return}
  if(step===5){publish();return}
};
render();
