(function() {
  var KOFI_URL = 'https://ko-fi.com/hope1forus/?hidefeed=true&widget=true&embed=true';
  var SUPABASE_URL = 'https://dmvldmffdwzgqnjfrrww.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_hSBxsefa3AzA7sLngR07Vw_ruW60q_h';

  function getCampaignId() {
    try {
      var params = new URLSearchParams(location.search);
      var id = (params.get('id') || params.get('c') || '').trim();
      var path = location.pathname.replace(/^\//,'').split('/')[0];
      if (!id && path && path.length > 3 && path.indexOf('.') < 0) id = path;
      return id || '';
    } catch(e) { return ''; }
  }

  function getCampaignTitle() {
    var h1 = document.querySelector('h1');
    if (h1 && h1.textContent) return h1.textContent.trim();
    return (document.title || '').replace(/\s*[\u2013\-]\s*HopeForUs$/i, '').trim() || 'Campaign';
  }

  function recordIntent(campaignId, title) {
    if (!campaignId) return;
    var row = {
      id: 'int_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      campaign_id: campaignId,
      campaign_title: title || '',
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

  function ensureOverlay() {
    if (document.getElementById('kofiOverlay')) return;
    var style = document.createElement('style');
    style.textContent = '.kofi-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;align-items:center;justify-content:center}.kofi-ov.show{display:flex}.kofi-box{width:92%;max-width:480px;height:82vh;background:#fff;border-radius:12px;overflow:hidden;position:relative}.kofi-box iframe{width:100%;height:100%;border:none}.kofi-x{position:absolute;top:8px;right:8px;background:#fff;border:1px solid #ddd;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:18px;z-index:2}';
    document.head.appendChild(style);
    var ov = document.createElement('div');
    ov.id = 'kofiOverlay';
    ov.className = 'kofi-ov';
    ov.innerHTML = '<div class="kofi-box"><button class="kofi-x" id="kofiClose">×</button><iframe id="kofiFrame" src=""></iframe></div>';
    document.body.appendChild(ov);
    document.getElementById('kofiClose').onclick = function() {
      ov.classList.remove('show');
      document.getElementById('kofiFrame').src = '';
    };
    ov.onclick = function(e) { if (e.target === ov) document.getElementById('kofiClose').onclick(); };
  }

  window.openKofi = function() {
    var campId = getCampaignId();
    var title = getCampaignTitle();
    recordIntent(campId, title);
    ensureOverlay();
    var frame = document.getElementById('kofiFrame');
    var ov = document.getElementById('kofiOverlay');
    frame.src = KOFI_URL;
    ov.classList.add('show');
  };

  function overrideButtons() {
    document.querySelectorAll('a.btn-d').forEach(function(a) {
      if (a.dataset.kofi) return;
      a.dataset.kofi = '1';
      a.href = 'javascript:void(0)';
      a.removeAttribute('target');
      a.onclick = function(e) {
        e.preventDefault();
        openKofi();
      };
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
