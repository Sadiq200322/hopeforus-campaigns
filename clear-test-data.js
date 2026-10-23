(function () {
  try {
    var resetFlag = localStorage.getItem("hopeforus_reset_v5");
    var wantsReset = (location.search || "").toLowerCase().indexOf("resetdemo=1") !== -1;

    if (wantsReset) {
      localStorage.removeItem("hopeforus_user");
      localStorage.removeItem("hopeforus_users");
      localStorage.removeItem("hopeforus_campaigns");
      localStorage.removeItem("hopeforus_reset_v5");
      return;
    }

    // Never wipe saved campaigns on normal page loads.
    // This file is only for intentional test resets.
    if (!resetFlag) {
      localStorage.setItem("hopeforus_reset_v5", "1");
    }
  } catch (e) {}
})();
