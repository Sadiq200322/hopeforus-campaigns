/* Approval removed — all campaigns are auto-approved */
(function(){
  function hideApprove(){
    document.querySelectorAll('[data-approve], #adminMenu, #adminNav, [data-tab="admin"]').forEach(function(el){
      el.style.display = 'none';
      el.classList.add('hide');
    });
    document.querySelectorAll('.acts button').forEach(function(b){
      if(/approve/i.test(b.textContent||'')){
        b.style.display = 'none';
        b.disabled = true;
      }
    });
  }
  hideApprove();
  var obs = new MutationObserver(hideApprove);
  if(document.body) obs.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', hideApprove);
  setInterval(hideApprove, 2000);
})();
