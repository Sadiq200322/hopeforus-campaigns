/* One-time: remove test sign-ins and user-created campaigns; keep sample fundraisers */
(function () {
  try {
    if (localStorage.getItem("hopeforus_reset_v3") === "1") return;
    localStorage.removeItem("hopeforus_user");
    var keep = {
      "plotzlich-papa": 1,
      "sebastian-heart": 1,
      "ellie-cagnolina": 1,
      "zeehonden": 1,
      "silver-rail": 1,
      "maya-nursing": 1,
      "team-beta": 1,
      "community-kitchen": 1,
      "john-memorial": 1
    };
    var list = JSON.parse(localStorage.getItem("hopeforus_campaigns") || "[]");
    if (Array.isArray(list)) {
      list = list.filter(function (c) { return c && keep[c.id]; });
      localStorage.setItem("hopeforus_campaigns", JSON.stringify(list));
    }
    localStorage.setItem("hopeforus_reset_v3", "1");
  } catch (e) {}
})();
