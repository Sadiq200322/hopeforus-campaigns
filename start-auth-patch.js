/* Ensure registration creates Supabase Auth + profile (cross-device login) */
(function(){
  function wrap(){
    if(typeof saveUser !== 'function') return false;
    if(saveUser._authPatched) return true;
    var orig = saveUser;
    saveUser = function(email, pass, name, whatsapp){
      var r = orig.apply(this, arguments);
      try{
        email = String(email||'').toLowerCase().trim();
        if(window.HFDB){
          if(HFDB.upsertProfile){
            HFDB.upsertProfile({email:email, name:name||'', whatsapp:whatsapp||'', is_admin:false}).catch(function(){});
          }
          if(HFDB.authSignup && pass){
            HFDB.authSignup(email, pass, name||'').catch(function(){});
          }
        }
      }catch(e){}
      return r;
    };
    saveUser._authPatched = true;
    return true;
  }
  var n=0;
  function boot(){
    if(wrap()) return;
    if(++n<40) setTimeout(boot, 200);
  }
  boot();
})();
