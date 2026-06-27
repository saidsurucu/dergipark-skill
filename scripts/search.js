window.__DP_search = async function (params, batch) {
  const DP = window.__DP;
  params = params || {};
  batch = batch || { start: 0, size: 1000 };
  const indexFilter = params.indexFilter || "hepsi";

  const cards = DP.parseCards(document.documentElement.outerHTML);
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

  // 1) Fetch detail pages with bounded concurrency.
  const detailSettled = await DP.mapPool(slice, 4, async (card) => {
    const html = await fetchText(card.url);
    return Object.assign({ card }, DP.parseArticleMeta(html));
  });

  // 2) Collect + dedupe journal index URLs from successful details.
  const indexUrls = DP.dedupe(
    detailSettled
      .filter((r) => r.status === "fulfilled" && r.value.journal_base)
      .map((r) => r.value.journal_base.replace(/\/$/, "") + "/indexes")
  );
  const indexResults = {};
  const idxSettled = await DP.mapPool(indexUrls, 4, async (u) => {
    indexResults[u] = DP.parseIndexes(await fetchText(u));
  });
  void idxSettled;

  // 3) Assemble articles in card order, applying index_filter.
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

  return {
    pagination: { page: Number(params.page) || 1, per_page: 24, count: total },
    articles,
    total_cards: total,
  };
};
