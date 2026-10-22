(function () {
  try {
    if (localStorage.getItem("hopeforus_reset_v5") === "1") return;
    localStorage.removeItem("hopeforus_user");
    localStorage.removeItem("hopeforus_users");
    localStorage.removeItem("hopeforus_campaigns");
    localStorage.setItem("hopeforus_reset_v5", "1");
  } catch (e) {}
})();
