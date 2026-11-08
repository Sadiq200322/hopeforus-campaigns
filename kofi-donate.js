(function() {
  var overlay = document.createElement('div');
  overlay.id = 'kofiOverlay';
  overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;align-items:center;justify-content:center';
  overlay.innerHTML = '<div style="width:92%;max-width:480px;height:82vh;background:#fff;border-radius:12px;overflow:hidden;position:relative"><button id="kofiClose" style="position:absolute;top:8px;right:8px;background:#fff;border:1px solid #ddd;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:18px;z-index:2">\u00d7</button><iframe id="kofiFrame" src="" style="width:100%;height:100%;border:none"></iframe></div>';
  document.body.appendChild(overlay);

  window.openKofi = function() {
    document.getElementById('kofiFrame').src = 'https://ko-fi.com/hopeforus0/?hidefeed=true&widget=true&embed=true';
    overlay.style.display = 'flex';
  };
  document.getElementById('kofiClose').onclick = function() {
    overlay.style.display = 'none';
    document.getElementById('kofiFrame').src = '';
  };
  overlay.onclick = function(e) { if (e.target === overlay) document.getElementById('kofiClose').onclick(); };

  var obs = new MutationObserver(function() {
    document.querySelectorAll('a.btn-d').forEach(function(a) {
      if (a.dataset.kofi) return;
      a.dataset.kofi = '1';
      a.href = 'javascript:void(0)';
      a.removeAttribute('target');
      a.onclick = function(e) { e.preventDefault(); openKofi(); };
    });
  });
  obs.observe(document.body, { childList: true, subtree: true });
})();
