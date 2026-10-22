/* One-time wipe of old test accounts; keep sample fundraiser ids */
(function () {
  try {
    if (localStorage.getItem("hopeforus_reset_v4") === "1") return;
    localStorage.removeItem("hopeforus_user");
    localStorage.removeItem("hopeforus_users");
    var keep = {
      "plotzlich-papa": 1,
      "sebastian-heart": 1,
      "ellie-cagnolina": 1,
      "zeehonden": 1
    };
    var list = JSON.parse(localStorage.getItem("hopeforus_campaigns") || "[]");
    if (Array.isArray(list)) {
      list = list.filter(function (c) { return c && keep[c.id]; });
      localStorage.setItem("hopeforus_campaigns", JSON.stringify(list));
    }
    localStorage.setItem("hopeforus_reset_v4", "1");
  } catch (e) {}
})();
