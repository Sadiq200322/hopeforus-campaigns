(function() {
  var KOFI_URL = 'https://ko-fi.com/hope1forus';
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

  function applyStyles() {
    var style = document.getElementById('btnStyle');
    if (!style) {
      style = document.createElement('style');
      style.id = 'btnStyle';
      document.head.appendChild(style);
    }
    style.textContent = [
      '.btn-row { display: flex !important; gap: 10px !important; }',
      'a.btn-d, a.btn-s { flex: 1 1 50% !important; background: #7C3AED !important; color: #fff !important; border-radius: 999px !important; padding: 14px 12px !important; font-weight: 800 !important; font-size: 1rem !important; text-align: center !important; text-decoration: none !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; margin: 0 !important; }'
    ].join('');
  }

  window.openKofi = function() {
    var campId = getCampaignId();
    var title = getCampaignTitle();
    recordIntent(campId, title);
    var w = Math.min(480, screen.width - 20);
    var h = Math.min(740, screen.height - 40);
    var left = Math.max(0, (screen.width - w) / 2);
    var top = Math.max(0, (screen.height - h) / 2);
    var popup = window.open(KOFI_URL, 'kofiDonate', 'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top + ',resizable=yes,scrollbars=yes');
    if (popup) popup.focus();
  };

  function wireButtons() {
    applyStyles();
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

  wireButtons();
  var obs = new MutationObserver(wireButtons);
  obs.observe(document.body, { childList: true, subtree: true });
  var tries = 0;
  var iv = setInterval(function() {
    wireButtons();
    if (++tries > 15) clearInterval(iv);
  }, 400);
})();
