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

  function styleButtons() {
    var style = document.getElementById('kofiBtnStyle');
    if (!style) {
      style = document.createElement('style');
      style.id = 'kofiBtnStyle';
      document.head.appendChild(style);
    }
    style.textContent = [
      'a.btn-d { display: none !important; }',
      '.btn-row { display: flex; gap: 10px; align-items: center; }',
      '.btn-s { flex: 1; background: #7C3AED !important; color: #fff !important; border-radius: 999px !important; padding: 14px 12px !important; font-weight: 800 !important; font-size: 1rem !important; text-align: center; }',
      '#kofi-widget-overlay, .floatingchat-container { position: static !important; display: inline-flex !important; margin: 0 !important; }',
      '.kofi-button, .floatingchat-donate-button { position: static !important; border-radius: 999px !important; padding: 14px 20px !important; font-weight: 800 !important; font-size: 1rem !important; height: auto !important; min-height: 48px; }'
    ].join('');
  }

  function placeWidget() {
    styleButtons();
    var row = document.querySelector('.btn-row');
    var widget = document.querySelector('#kofi-widget-overlay, .floatingchat-container, .kofi-button');
    if (row && widget && widget.parentElement !== row) {
      row.insertBefore(widget, row.firstChild);
    }
    var btn = document.querySelector('.kofi-button, .floatingchat-donate-button');
    if (btn && !btn.dataset.logged) {
      btn.dataset.logged = '1';
      btn.addEventListener('click', function() {
        recordIntent(getCampaignId(), getCampaignTitle());
      });
    }
  }

  function initWidget() {
    styleButtons();
    function draw() {
      if (window.__kofiDrawn) { placeWidget(); return; }
      window.kofiWidgetOverlay.draw(KOFI_USER, {
        type: 'floating-chat',
        'floating-chat.donateButton.text': 'Donate',
        'floating-chat.donateButton.background-color': '#7C3AED',
        'floating-chat.donateButton.text-color': '#ffffff'
      });
      window.__kofiDrawn = true;
      setTimeout(placeWidget, 400);
    }
    if (window.kofiWidgetOverlay) { draw(); return; }
    var s = document.createElement('script');
    s.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
    s.onload = draw;
    document.head.appendChild(s);
  }

  if (document.readyState === 'complete') {
    setTimeout(initWidget, 300);
  } else {
    window.addEventListener('load', function(){ setTimeout(initWidget, 300); });
  }

  var obs = new MutationObserver(function(){ placeWidget(); });
  obs.observe(document.body, { childList: true, subtree: true });
  var tries = 0;
  var iv = setInterval(function() {
    placeWidget();
    if (++tries > 15) clearInterval(iv);
  }, 500);
})();
