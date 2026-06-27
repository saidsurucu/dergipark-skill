window.__DP_references = async function (articleUrl) {
  const DP = window.__DP;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    let html;
    try {
      const res = await fetch(articleUrl, { credentials: "include", signal: ctrl.signal });
      html = await res.text();
      if (!res.ok || DP.looksLikeChallenge(html)) throw new Error("blocked-or-challenge:" + res.status);
    } finally {
      clearTimeout(timer);
    }
    return Object.assign({ article_url: articleUrl }, DP.parseReferences(html));
  } catch (e) {
    return { article_url: articleUrl, error: String(e && e.message || e), reference_count: 0, references: [] };
  }
};
