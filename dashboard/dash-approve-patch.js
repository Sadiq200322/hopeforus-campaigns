/* Approve: require Tribute donation link */
(function(){
  function wire(){
    document.querySelectorAll('[data-approve]').forEach(function(b){
      if(b._tributeWired) return;
      b._tributeWired = true;
      b.addEventListener('click', function(ev){
        ev.preventDefault();
        ev.stopImmediatePropagation();
        var id = b.getAttribute('data-approve');
        if(!id) return;
        var link = prompt('Tribute donation link for this campaign (required):\nExample: https://web.tribute.tg/d/Ta9','') || '';
        link = String(link).trim();
        if(!link || link.indexOf('http') !== 0){
          alert('Paste a full Tribute link starting with https://');
          return;
        }
        b.disabled = true;
        b.textContent = '\u2026';
        var patch = { status: 'approved', donation_link: link };
        var p = (window.HFDB && HFDB.update) ? HFDB.update(id, patch) : Promise.resolve();
        p.then(function(){
          try{
            var L = JSON.parse(localStorage.getItem('hopeforus_campaigns') || '[]');
            if(Array.isArray(L)){
              L.forEach(function(c){ if(c && c.id === id){ c.status = 'approved'; c.donationLink = link; c.donation_link = link; } });
              localStorage.setItem('hopeforus_campaigns', JSON.stringify(L));
            }
          }catch(e){}
          if(window.HF && HF.approveCampaign) HF.approveCampaign(id);
        }).then(function(){
          if(typeof pullServer === 'function') return pullServer();
        }).then(function(){
          if(typeof render === 'function') render();
          else location.reload();
        }).catch(function(){
          b.disabled = false;
          b.textContent = 'Approve';
          if(typeof render === 'function') render();
        });
      }, true);
    });
  }
  var obs = new MutationObserver(function(){ wire(); });
  if(document.body) obs.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', wire);
  setInterval(wire, 1500);
})();
