(function howSteps(){
  var step=0,paused=false,timer=null,ms=8000;
  var slides=document.querySelectorAll(".how-slide");
  var rows=document.querySelectorAll(".srow[data-step]");
  var btn=document.getElementById("howPause");
  if(!slides.length||!rows.length)return;
  function show(i){
    step=((i%3)+3)%3;
    slides.forEach(function(s){s.classList.toggle("on",Number(s.dataset.step)===step)});
    rows.forEach(function(r){
      var on=Number(r.dataset.step)===step;
      r.classList.toggle("active",on);
      var prog=r.querySelector(".prog");
      if(prog){prog.style.animation="none";void prog.offsetWidth;if(on&&!paused)prog.style.animation="howProg var(--step-ms) linear forwards"}
    });
  }
  function next(){show(step+1)}
  function start(){stop();if(!paused)timer=setInterval(next,ms)}
  function stop(){if(timer){clearInterval(timer);timer=null}}
  rows.forEach(function(r){r.onclick=function(){show(Number(r.dataset.step));start()}});
  if(btn)btn.onclick=function(){
    paused=!paused;
    btn.setAttribute("aria-pressed",paused?"true":"false");
    btn.innerHTML=paused?'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z"/></svg>':'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z"/></svg>';
    if(paused)stop();else start();show(step);
  };
  show(0);start();
})();
