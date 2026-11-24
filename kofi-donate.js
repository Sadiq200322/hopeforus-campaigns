(function() {
  var KOFI_URL = 'https://ko-fi.com/hope1forus/?hidefeed=true&widget=true&embed=true';
  var SUPABASE_URL = 'https://dmvldmffdwzgqnjfrrww.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_hSBxsefa3AzA7sLngR07Vw_ruW60q_h';
  var preloaded = false;

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
    style.textContent = [
      '.kofi-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;align-items:center;justify-content:center;opacity:0;transition:opacity .25s ease}',
      '.kofi-ov.show{display:flex;opacity:1}',
      '.kofi-box{width:92%;max-width:480px;height:82vh;background:#fff;border-radius:16px;overflow:hidden;position:relative;transform:translateY(12px);transition:transform .25s ease;box-shadow:0 20px 60px rgba(0,0,0,.25)}',
      '.kofi-ov.show .kofi-box{transform:translateY(0)}',
      '.kofi-box iframe{width:100%;height:100%;border:none;opacity:0;transition:opacity .3s ease}',
      '.kofi-box iframe.ready{opacity:1}',
      '.kofi-x{position:absolute;top:10px;right:10px;background:#fff;border:1px solid #e5e5e5;border-radius:50%;width:34px;height:34px;cursor:pointer;font-size:18px;z-index:3;box-shadow:0 2px 8px rgba(0,0,0,.1)}',
      '.kofi-spin{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#fff;z-index:2;transition:opacity .3s ease}',
      '.kofi-spin.hide{opacity:0;pointer-events:none}',
      '.kofi-spin i{width:36px;height:36px;border:3px solid #ede9fe;border-top-color:#7C3AED;border-radius:50%;animation:kspin .7s linear infinite}',
      '@keyframes kspin{to{transform:rotate(360deg)}}'
    ].join('');
    document.head.appendChild(style);
    var ov = document.createElement('div');
    ov.id = 'kofiOverlay';
    ov.className = 'kofi-ov';
    ov.innerHTML = '<div class="kofi-box"><button class="kofi-x" id="kofiClose">×</button><div class="kofi-spin" id="kofiSpin"><i></i></div><iframe id="kofiFrame" src="" allow="payment"></iframe></div>';
    document.body.appendChild(ov);
    var frame = document.getElementById('kofiFrame');
    var spin = document.getElementById('kofiSpin');
    frame.onload = function() {
      frame.classList.add('ready');
      spin.classList.add('hide');
    };
    document.getElementById('kofiClose').onclick = function() {
      ov.classList.remove('show');
    };
    ov.onclick = function(e) { if (e.target === ov) document.getElementById('kofiClose').onclick(); };
  }

  function preload() {
    if (preloaded) return;
    ensureOverlay();
    var frame = document.getElementById('kofiFrame');
    if (frame && !frame.src) {
      frame.src = KOFI_URL;
      preloaded = true;
    }
  }

  window.openKofi = function() {
    var campId = getCampaignId();
    var title = getCampaignTitle();
    recordIntent(campId, title);
    ensureOverlay();
    var frame = document.getElementById('kofiFrame');
    var ov = document.getElementById('kofiOverlay');
    var spin = document.getElementById('kofiSpin');
    if (!frame.src || frame.src === 'about:blank') {
      spin.classList.remove('hide');
      frame.classList.remove('ready');
      frame.src = KOFI_URL;
    }
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

  if (document.readyState === 'complete') {
    setTimeout(preload, 800);
  } else {
    window.addEventListener('load', function(){ setTimeout(preload, 800); });
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
