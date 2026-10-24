(function () {
  try {
    var wantsReset = (location.search || "").toLowerCase().indexOf("resetdemo=1") !== -1;
    if (wantsReset) {
      localStorage.removeItem("hopeforus_user");
      localStorage.removeItem("hopeforus_users");
      localStorage.removeItem("hopeforus_campaigns");
      localStorage.removeItem("hopeforus_reset_v6");
      return;
    }
    // One-time: clear old campaign cache so new direct image URLs from SAMPLES load
    if (localStorage.getItem("hopeforus_reset_v6") !== "1") {
      localStorage.removeItem("hopeforus_campaigns");
      localStorage.setItem("hopeforus_reset_v6", "1");
    }
  } catch (e) {}
})();
