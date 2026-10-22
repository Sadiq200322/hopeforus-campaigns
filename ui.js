/* HopeForUs UI – menu drawer + worldwide dropdown (standalone, no deps) */
(function () {
  function $(id) { return document.getElementById(id); }

  /* ---- Mobile menu ---- */
  var dr = $("dr");
  var mBtn = $("mBtn");
  var closeBtn = $("closeMenu");

  window.openHFMenu = function () {
    if (!dr) return;
    dr.classList.add("on");
    if (mBtn) mBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };
  window.closeHFMenu = function () {
    if (!dr) return;
    dr.classList.remove("on");
    if (mBtn) mBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  if (mBtn) {
    mBtn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (dr && dr.classList.contains("on")) window.closeHFMenu();
      else window.openHFMenu();
    };
  }
  if (closeBtn) closeBtn.onclick = function (e) { e.preventDefault(); window.closeHFMenu(); };
  if (dr) {
    dr.onclick = function (e) { if (e.target === dr) window.closeHFMenu(); };
    dr.querySelectorAll("[data-close]").forEach(function (a) {
      a.addEventListener("click", function () { window.closeHFMenu(); });
    });
  }

  /* ---- Happening worldwide dropdown ---- */
  var pill = $("worldPill");
  var menu = $("pillMenu");
  var label = $("pillLabel");

  window.toggleWorldPill = function (e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!menu || !pill) return;
    var open = menu.classList.toggle("open");
    pill.classList.toggle("open", open);
    pill.setAttribute("aria-expanded", open ? "true" : "false");
  };
  window.closeWorldPill = function () {
    if (!menu || !pill) return;
    menu.classList.remove("open");
    pill.classList.remove("open");
    pill.setAttribute("aria-expanded", "false");
  };

  if (pill) {
    pill.onclick = function (e) { window.toggleWorldPill(e); };
  }
  if (menu) {
    menu.onclick = function (e) { e.stopPropagation(); };
    menu.querySelectorAll("[data-filter]").forEach(function (btn) {
      btn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        var f = btn.getAttribute("data-filter") || "all";
        if (label) label.textContent = btn.textContent.trim();
        menu.querySelectorAll("[data-filter]").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        window.closeWorldPill();
        if (typeof window.applyCampaignFilter === "function") window.applyCampaignFilter(f);
      };
    });
  }

  document.addEventListener("click", function () {
    window.closeWorldPill();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      window.closeHFMenu();
      window.closeWorldPill();
    }
  });
})();
