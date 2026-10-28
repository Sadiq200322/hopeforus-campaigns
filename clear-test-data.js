(function () {
  try {
    var wantsReset = (location.search || "").toLowerCase().indexOf("resetdemo=1") !== -1;
    if (wantsReset) {
      localStorage.removeItem("hopeforus_user");
      localStorage.removeItem("hopeforus_users");
      localStorage.removeItem("hopeforus_campaigns");
      localStorage.removeItem("hopeforus_reset_v6");
    }
  } catch (e) {}
})();
