(function() {
  var KOFI_USER = 'hope1forus';
  var KOFI_PAGE = 'https://ko-fi.com/' + KOFI_USER;
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
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(row)
    }).catch(function(){});
  }

  function positionWidget() {
    var style = document.getElementById('kofiPos');
    if (!style) {
      style = document.createElement('style');
      style.id = 'kofiPos';
      document.head.appendChild(style);
    }
    function place() {
      var card = document.querySelector('.side .card') || document.querySelector('.card');
      var bottom = 8, left = 18;
      if (card) {
        var r = card.getBoundingClientRect();
        left = Math.max(8, Math.round(r.left + 6));
        bottom = Math.max(6, Math.round(window.innerHeight - r.bottom - 18));
      }
      style.textContent = '#kofi-widget-overlay, .floatingchat-container, .floatingchat-container-wrap { bottom: ' + bottom + 'px !important; left: ' + left + 'px !important; right: auto !important; top: auto !important; z-index: 70 !important; }';
    }
    place();
    if (!window.__kofiPlace) {
      window.__kofiPlace = 1;
      window.addEventListener('resize', place);
      window.addEventListener('scroll', place, {passive:true});
      setInterval(place, 700);
    }
  }

  function widgetOn() {
    return document.querySelector('#kofi-widget-overlay, .floatingchat-container, .floatingchat-container-wrap, [class*="floatingchat"]');
  }

  function realButton() {
    return document.querySelector('.floatingchat-donate-button, .kofi-button, #kofi-widget-overlay button, #kofi-widget-overlay a, .floatingchat-container button, .floatingchat-container a');
  }

  function openKofi() {
    recordIntent(getCampaignId(), getCampaignTitle());
    var real = realButton();
    if (real) { real.click(); return; }
    var w = 420, h = 680;
    var left = Math.max(0, (screen.width - w) / 2);
    var top = Math.max(0, (screen.height - h) / 2);
    var pop = window.open(KOFI_PAGE, 'kofi', 'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top);
    if (!pop) location.href = KOFI_PAGE;
  }

  function wireFallback() {
    var btn = document.getElementById('donateBtn');
    if (!btn || btn.dataset.wired) return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', openKofi);
  }

  function hideFallback() {
    if (!widgetOn() && !realButton()) return;
    document.documentElement.classList.add('kofi-on');
    var btn = document.getElementById('donateBtn');
    if (btn) btn.classList.add('hide');
  }

  function draw() {
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
      var btn = realButton();
      if (btn && !btn.dataset.logged) {
        btn.dataset.logged = '1';
        btn.addEventListener('click', function() {
          recordIntent(getCampaignId(), getCampaignTitle());
        });
      }
      hideFallback();
    }, 400);
  }

  function loadWidget() {
    positionWidget();
    wireFallback();
    if (window.kofiWidgetOverlay) { draw(); return; }
    var s = document.createElement('script');
    s.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
    s.async = true;
    s.onload = draw;
    document.head.appendChild(s);
  }

  // Start now. Do not wait for window load — Instagram's browser
  // holds that until every image finishes, so Donate never appeared.
  loadWidget();
  document.addEventListener('DOMContentLoaded', wireFallback);
  var watch = new MutationObserver(function() {
    wireFallback();
    hideFallback();
  });
  watch.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(function() {
    wireFallback();
    if (window.kofiWidgetOverlay) draw();
    hideFallback();
  }, 400);
})();
