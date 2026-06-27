// Shared browser pipeline: given parsed cards, fetch each detail page + journal
// /indexes (bounded concurrency, same-origin, carries the user's session) and
// assemble article objects, applying index_filter. Used by both search.js and
// advanced_search.js. Browser-only (uses fetch); verified live, not unit-tested.
window.__DP_scrape = async function (cards, indexFilter, batch) {
  const DP = window.__DP;
  indexFilter = indexFilter || "hepsi";
  batch = batch || { start: 0, size: 1000 };
  const total = cards.length;
  const slice = cards.slice(batch.start, batch.start + batch.size);

  async function fetchText(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(url, { credentials: "include", signal: ctrl.signal });
      const text = await res.text();
      if (!res.ok || DP.looksLikeChallenge(text)) throw new Error("blocked-or-challenge:" + res.status);
      return text;
    } finally {
      clearTimeout(timer);
    }
  }

  const detailSettled = await DP.mapPool(slice, 4, async (card) => {
    const html = await fetchText(card.url);
    return Object.assign({ card }, DP.parseArticleMeta(html));
  });

  const indexUrls = DP.dedupe(
    detailSettled
      .filter((r) => r.status === "fulfilled" && r.value.journal_base)
      .map((r) => r.value.journal_base.replace(/\/$/, "") + "/indexes")
  );
  const indexResults = {};
  await DP.mapPool(indexUrls, 4, async (u) => { indexResults[u] = DP.parseIndexes(await fetchText(u)); });

  const articles = [];
  detailSettled.forEach((r, i) => {
    const card = slice[i];
    if (r.status === "rejected") {
      articles.push({ title: card.title, url: card.url, error: "Blocked", details: null, indices: "", pdf_url: null });
      return;
    }
    const v = r.value;
    const idxUrl = v.journal_base ? v.journal_base.replace(/\/$/, "") + "/indexes" : "";
    const indices = indexResults[idxUrl] || "";
    if (!DP.passesIndexFilter(indices, indexFilter)) return;
    articles.push({ title: card.title, url: card.url, error: null, details: v.details, indices, pdf_url: v.pdf_url });
  });

  return { articles, total_cards: total };
};
