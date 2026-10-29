/* loginAsync: shared password store first, then Supabase Auth */
(function(){
  function install(){
    if(!window.HF || !HF.login) return false;
    if(HF._loginPatched) return true;
    var origLogin = HF.login;
    var hash = HF.hash || function(s){ var h=0,i,c; s=String(s||''); for(i=0;i<s.length;i++){ c=s.charCodeAt(i); h=((h<<5)-h)+c; h=h&h; } return 'h'+Math.abs(h).toString(16); };
    function ensureLocalUser(email,password,name){
      email=(email||'').toLowerCase().trim();
      var list=[];
      try{ list=JSON.parse(localStorage.getItem('hopeforus_users')||'[]'); }catch(e){ list=[]; }
      if(!Array.isArray(list)) list=[];
      var u=list.find(function(x){return x&&x.email===email});
      if(!u){
        u={id:'u_'+Date.now().toString(36),email:email,name:name||email.split('@')[0],pass:hash(password),verified:true,isAdmin:email==='admin@hopeforus.com',created:Date.now(),donors:[],chats:[],clicks:0,avatar:''};
        list.push(u);
      } else {
        u.pass=hash(password); u.verified=true;
        if(name&&!u.name) u.name=name;
      }
      try{ localStorage.setItem('hopeforus_users', JSON.stringify(list)); }catch(e){}
      try{ localStorage.setItem('hopeforus_user', JSON.stringify({id:u.id,email:u.email,name:u.name,isAdmin:!!u.isAdmin,avatar:u.avatar||'',whatsapp:u.whatsapp||''})); }catch(e){}
      if(HF.setSession) HF.setSession(u);
      return u;
    }
    HF.loginAsync = function(email, password){
      email=(email||'').toLowerCase().trim();
      var local=origLogin.call(HF, email, password);
      if(local&&local.ok) return Promise.resolve(local);
      var chain=Promise.resolve(null);
      if(window.HFDB&&HFDB.verifyAccount){
        chain=HFDB.verifyAccount(email,password).then(function(row){
          var u=ensureLocalUser(email,password,row&&row.name);
          if(HFDB.upsertProfile){ try{ HFDB.upsertProfile({email:email,name:u.name,is_admin:!!u.isAdmin}); }catch(e){} }
          return {ok:true,user:u,cloud:true,via:'accounts'};
        }).catch(function(){ return null; });
      }
      return chain.then(function(hit){
        if(hit&&hit.ok) return hit;
        if(!(window.HFDB&&HFDB.authLogin)) return local||{ok:false,err:'Invalid email or password'};
        return HFDB.authLogin(email,password).then(function(data){
          var name=(data.user&&data.user.user_metadata&&data.user.user_metadata.name)||email.split('@')[0];
          var u=ensureLocalUser(email,password,name);
          try{ sessionStorage.setItem('hf_sb_token', data.access_token||''); }catch(e){}
          return {ok:true,user:u,cloud:true,via:'auth'};
        }).catch(function(){
          return local&&local.ok?local:{ok:false,err:'Invalid email or password'};
        });
      });
    };
    HF._loginPatched = true;
    return true;
  }
  var n=0;
  function boot(){
    if(install()) return;
    if(++n<50) setTimeout(boot, 150);
  }
  boot();
})();
