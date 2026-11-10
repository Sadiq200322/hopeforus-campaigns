(function() {
  var SUPABASE_URL = 'https://dmvldmffdwzgqnjfrrww.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_hSBxsefa3AzA7sLngR07Vw_ruW60q_h';

  function getCampaignId() {
    try {
      var params = new URLSearchParams(location.search);
      var id = (params.get('id') || '').trim();
      var code = (params.get('code') || '').toUpperCase().trim();
      var KNOWN = {'EEPBA7':'c_mvsfhl1e','VY84Q4':'c_mvs9eg5p'};
      if (KNOWN[id.toUpperCase()]) id = KNOWN[id.toUpperCase()];
      if (id) return id;
      if (code && KNOWN[code]) return KNOWN[code];
      return id || code || '';
    } catch(e) { return ''; }
  }

  function recordIntent(campaignId) {
    if (!campaignId) return;
    var row = {
      id: 'int_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      campaign_id: campaignId,
      created_at: new Date().toISOString()
    };
    fetch(SUPABASE_URL + '/rest/v1/donation_intents', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(row)
    }).catch(function(){});
  }

  var overlay = document.createElement('div');
  overlay.id = 'kofiOverlay';
  overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;align-items:center;justify-content:center';
  overlay.innerHTML = '<div style="width:92%;max-width:480px;height:82vh;background:#fff;border-radius:12px;overflow:hidden;position:relative"><button id="kofiClose" style="position:absolute;top:8px;right:8px;background:#fff;border:1px solid #ddd;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:18px;z-index:2">&times;</button><iframe id="kofiFrame" src="" style="width:100%;height:100%;border:none" allow="payment"></iframe></div>';
  document.body.appendChild(overlay);

  window.openKofi = function() {
    var campId = getCampaignId();
    recordIntent(campId);
    // Cache-bust so Ko-fi settings changes (goal, description, payment methods, etc.) appear immediately
    var bust = Date.now();
    var frame = document.getElementById('kofiFrame');
    frame.src = 'https://ko-fi.com/hopeforus0/?hidefeed=true&widget=true&embed=true&_=' + bust;
    overlay.style.display = 'flex';
  };
  document.getElementById('kofiClose').onclick = function() {
    overlay.style.display = 'none';
    document.getElementById('kofiFrame').src = '';
  };
  overlay.onclick = function(e) { if (e.target === overlay) document.getElementById('kofiClose').onclick(); };

  function overrideButtons() {
    document.querySelectorAll('a.btn-d').forEach(function(a) {
      if (a.dataset.kofi) return;
      a.dataset.kofi = '1';
      a.href = 'javascript:void(0)';
      a.removeAttribute('target');
      a.onclick = function(e) { e.preventDefault(); openKofi(); };
    });
  }

  overrideButtons();
  var obs = new MutationObserver(overrideButtons);
  obs.observe(document.body, { childList: true, subtree: true });

  var tries = 0;
  var iv = setInterval(function() {
    overrideButtons();
    if (++tries > 20) clearInterval(iv);
  }, 500);
})();
