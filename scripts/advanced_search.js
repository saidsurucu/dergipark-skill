// Advanced search orchestrator. DergiPark's advanced search form just builds a
// q-string with field operators (title:, author:, abstract:, year:[F TO L], ...)
// and hits /tr/search?...&advanced=1, which returns SERVER-RENDERED cards. So we
// build the URL from `criteria` and fetch it in-page (same-origin, carries the
// user's logged-in session) — no form/CSRF token/navigation needed. Requires the
// user to be logged in (the advanced search capability is login-gated).
// Inject lib.js + scrape.js first. criteria: [{field, term, op}] (op for non-first:
// AND|OR|NOT). opts: {firstYear, lastYear, page, sort, indexFilter}.
window.__DP_advanced_search = async function (criteria, opts, batch) {
  const DP = window.__DP;
  opts = opts || {};
  const url = DP.buildAdvancedUrl(criteria, opts);
  let cards;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    let html;
    try {
      const res = await fetch(url, { credentials: "include", signal: ctrl.signal });
      html = await res.text();
      if (!res.ok || DP.looksLikeChallenge(html)) throw new Error("blocked-or-challenge:" + res.status);
    } finally {
      clearTimeout(timer);
    }
    cards = DP.parseCards(html);
  } catch (e) {
    return { query: DP.buildAdvancedQuery(criteria, opts), url, error: String(e && e.message || e),
             pagination: { page: Number(opts.page) || 1, per_page: 24, count: 0 }, articles: [], total_cards: 0 };
  }
  const r = await window.__DP_scrape(cards, opts.indexFilter || "hepsi", batch || { start: 0, size: 1000 });
  return {
    query: DP.buildAdvancedQuery(criteria, opts),
    url,
    pagination: { page: Number(opts.page) || 1, per_page: 24, count: r.total_cards },
    articles: r.articles,
    total_cards: r.total_cards,
  };
};
