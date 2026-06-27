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

  function parseDoc(html) {
    return new DOMParser().parseFromString(html, "text/html");
  }

  function parseCards(html) {
    const doc = parseDoc(html);
    const out = [];
    doc.querySelectorAll("div.card.article-card.dp-card-outline").forEach((card) => {
      const a = card.querySelector("h5.card-title > a");
      let href = a && a.getAttribute("href");
      if (!href) return;
      if (href.startsWith("/")) href = ORIGIN + href;
      out.push({ url: href, title: (a.textContent || "N/A").trim() });
    });
    return out;
  }

  return { ORIGIN, buildSearchUrl, passesIndexFilter, parseDoc, parseCards };
});
