/* Use cloud login when local password is missing (cross-device) */
(function(){
  function patch(){
    var go = document.getElementById('go');
    if(!go || go._asyncPatched) return !!go;
    go._asyncPatched = true;
    go.addEventListener('click', function(ev){
      if(!window.HF || !HF.loginAsync) return;
      var emailEl = document.getElementById('email') || document.querySelector('input[type=email]');
      var passEl = document.getElementById('passw') || document.querySelector('input[type=password]');
      if(!emailEl || !passEl) return;
      var email = (emailEl.value||'').trim().toLowerCase();
      var pass = passEl.value||'';
      if(!email || !pass) return;
      ev.stopImmediatePropagation();
      ev.preventDefault();
      var err = document.getElementById('perr');
      if(err) err.textContent = '';
      go.disabled = true;
      var old = go.textContent;
      go.textContent = 'Signing in\u2026';
      HF.loginAsync(email, pass).then(function(result){
        go.disabled = false;
        go.textContent = old || 'Log in';
        if(!result || !result.ok){
          if(err) err.textContent = (result && result.err) || 'Email or password is incorrect.';
          return;
        }
        var ret = new URLSearchParams(location.search).get('return') || '/dashboard/';
        location.href = ret;
      }).catch(function(){
        go.disabled = false;
        go.textContent = old || 'Log in';
        if(err) err.textContent = 'Login failed. Try again.';
      });
    }, true);
    return true;
  }
  var n=0;
  function boot(){
    if(patch()) return;
    if(++n<40) setTimeout(boot, 200);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
