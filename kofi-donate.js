(function() {
  var KOFI_USER = 'hope1forus';
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

  function loadAndOpen() {
    function openPanel() {
      if (!window.kofiWidgetOverlay) return;
      if (!window.__kofiDrawn) {
        window.kofiWidgetOverlay.draw(KOFI_USER, {
          type: 'floating-chat',
          'floating-chat.donateButton.text': 'Donate',
          'floating-chat.donateButton.background-color': '#7C3AED',
          'floating-chat.donateButton.text-color': '#ffffff'
        });
        window.__kofiDrawn = true;
      }
      setTimeout(function() {
        var btn = document.querySelector('.kofi-button, .floatingchat-donate-button, [class*="kofi"] button');
        if (btn) btn.click();
      }, 400);
    }

    if (window.kofiWidgetOverlay) { openPanel(); return; }
    var s = document.createElement('script');
    s.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
    s.onload = openPanel;
    document.head.appendChild(s);
  }

  window.openKofi = function() {
    var campId = getCampaignId();
    var title = getCampaignTitle();
    recordIntent(campId, title);
    loadAndOpen();
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
