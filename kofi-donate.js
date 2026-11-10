(function() {
  var TRIBUTE_LINK = 'https://web.tribute.tg/d/T60';
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

  window.openTribute = function() {
    var campId = getCampaignId();
    var title = getCampaignTitle();
    recordIntent(campId, title);
    window.open(TRIBUTE_LINK, '_blank', 'noopener');
  };

  function overrideButtons() {
    document.querySelectorAll('a.btn-d').forEach(function(a) {
      if (a.dataset.tribute) return;
      a.dataset.tribute = '1';
      a.href = 'javascript:void(0)';
      a.removeAttribute('target');
      a.onclick = function(e) {
        e.preventDefault();
        openTribute();
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
