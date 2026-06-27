// Simple search orchestrator. Reads the rendered result cards from the current
// page, then delegates detail/index fetching to window.__DP_scrape (scrape.js,
// which must be injected first). The page must already be on the rendered
// /tr/search results for the desired query.
window.__DP_search = async function (params, batch) {
  const DP = window.__DP;
  params = params || {};
  const cards = DP.parseCards(document.documentElement.outerHTML);
  const r = await window.__DP_scrape(cards, params.indexFilter || "hepsi", batch || { start: 0, size: 1000 });
  return {
    pagination: { page: Number(params.page) || 1, per_page: 24, count: r.total_cards },
    articles: r.articles,
    total_cards: r.total_cards,
  };
};
