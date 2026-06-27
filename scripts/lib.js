(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.__DP = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const ORIGIN = "https://dergipark.org.tr";

  function buildSearchUrl(p) {
    p = p || {};
    const parts = [];
    parts.push("q=" + encodeURIComponent(p.query && p.query.trim() ? p.query : "*"));
    parts.push("section=article");
    if (p.page && Number(p.page) > 1) parts.push("page=" + encodeURIComponent(p.page));
    if (p.articleType) parts.push(encodeURIComponent("filter[article_type][]") + "=" + encodeURIComponent(p.articleType));
    if (p.sort) parts.push("sortBy=" + encodeURIComponent(p.sort));
    if (p.year) parts.push(encodeURIComponent("filter[publication_year][]") + "=" + encodeURIComponent(p.year));
    return ORIGIN + "/tr/search?" + parts.join("&");
  }

  function passesIndexFilter(indicesStr, filter) {
    indicesStr = indicesStr || "";
    if (filter === "tr_dizin_icerenler") return indicesStr.includes("TR Dizin");
    if (filter === "bos_olmayanlar") return indicesStr.trim().length > 0;
    return true;
  }

  return { ORIGIN, buildSearchUrl, passesIndexFilter };
});
