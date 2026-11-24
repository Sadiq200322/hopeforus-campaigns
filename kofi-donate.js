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

  function positionWidget() {
    var style = document.getElementById('kofiPos');
    if (!style) {
      style = document.createElement('style');
      style.id = 'kofiPos';
      style.textContent = '#kofi-widget-overlay, .floatingchat-container { bottom: 20px !important; left: 20px !important; right: auto !important; z-index: 9997 !important; }';
      document.head.appendChild(style);
    }
  }

  function initWidget() {
    positionWidget();
    function draw() {
      if (window.__kofiDrawn) return;
      window.kofiWidgetOverlay.draw(KOFI_USER, {
        type: 'floating-chat',
        'floating-chat.donateButton.text': 'Donate',
        'floating-chat.donateButton.background-color': '#7C3AED',
        'floating-chat.donateButton.text-color': '#ffffff'
      });
      window.__kofiDrawn = true;
      setTimeout(function() {
        var btn = document.querySelector('.kofi-button, .floatingchat-donate-button, #kofi-widget-overlay button');
        if (btn && !btn.dataset.logged) {
          btn.dataset.logged = '1';
          btn.addEventListener('click', function() {
            recordIntent(getCampaignId(), getCampaignTitle());
          });
        }
      }, 600);
    }
    if (window.kofiWidgetOverlay) { draw(); return; }
    var s = document.createElement('script');
    s.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
    s.onload = draw;
    document.head.appendChild(s);
  }

  if (document.readyState === 'complete') {
    setTimeout(initWidget, 400);
  } else {
    window.addEventListener('load', function(){ setTimeout(initWidget, 400); });
  }
})();
