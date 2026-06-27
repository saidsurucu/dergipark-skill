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

  // Advanced search field aliases -> DergiPark q-operator prefixes (discovered live).
  const ADV_FIELDS = {
    title: "title", short_title: "running_title", running_title: "running_title",
    journal: "journal_title", journal_title: "journal_title",
    issn: "issn", eissn: "eissn",
    abstract: "abstract", keywords: "keywords",
    doi: "doi", doi_url: "doi_url", doi_prefix: "crossref_prefix", crossref_prefix: "crossref_prefix",
    author: "author", orcid: "author_orcid", author_orcid: "author_orcid",
    institution: "institution", translator: "translator",
    year: "year", citation: "citation", publisher: "publisher",
  };

  function normOp(op) {
    const s = String(op == null ? "AND" : op).trim().toLowerCase();
    if (s === "or" || s === "veya" || s === "1") return "OR";
    if (s === "not" || s === "içermesin" || s === "icermesin" || s === "2") return "NOT";
    return "AND";
  }

  function buildAdvancedQuery(criteria, opts) {
    opts = opts || {};
    const parts = [];
    (criteria || []).forEach((c, i) => {
      if (!c || !c.term) return;
      const prefix = ADV_FIELDS[c.field] || c.field;
      const frag = prefix + ":(" + c.term + ")";
      parts.push(parts.length === 0 ? frag : normOp(c.op) + " " + frag);
    });
    let q = parts.join(" ");
    const fy = opts.firstYear, ly = opts.lastYear;
    if (fy || ly) {
      const range = "year:[" + (fy || "*") + " TO " + (ly || "*") + "]";
      q = q ? q + " AND " + range : range;
    }
    return q;
  }

  function buildAdvancedUrl(criteria, opts) {
    opts = opts || {};
    const q = buildAdvancedQuery(criteria, opts);
    const parts = ["q=" + encodeURIComponent(q), "section=article", "advanced=1"];
    if (opts.page && Number(opts.page) > 1) parts.push("page=" + encodeURIComponent(opts.page));
    if (opts.sort) parts.push("sortBy=" + encodeURIComponent(opts.sort));
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

  function metaMap(doc) {
    const m = {};
    doc.querySelectorAll("meta[name]").forEach((t) => {
      const name = t.getAttribute("name");
      if (name && !(name in m)) m[name] = (t.getAttribute("content") || "").trim();
    });
    return m;
  }

  function parseArticleMeta(html) {
    const doc = parseDoc(html);
    const raw = metaMap(doc);
    const refCount = doc.querySelectorAll('meta[name="citation_reference"]').length;
    let pdf = raw["citation_pdf_url"] || null;
    if (pdf && pdf.startsWith("/")) pdf = ORIGIN + pdf;
    const details = {
      citation_title: raw["citation_title"] || null,
      citation_author: raw["DC.Creator.PersonalName"] || null,
      citation_journal_title: raw["citation_journal_title"] || null,
      citation_publication_date: raw["citation_publication_date"] || null,
      citation_keywords: raw["citation_keywords"] || null,
      citation_doi: raw["citation_doi"] || null,
      citation_issn: raw["citation_issn"] || null,
      citation_abstract: raw["citation_abstract"] || "",
      stats_citation_count: raw["stats_trdizin_citation_count"] || "0",
      stats_reference_count: refCount,
    };
    return { details, pdf_url: pdf, journal_base: raw["DC.Source.URI"] || "" };
  }

  function parseIndexes(html) {
    const doc = parseDoc(html);
    const titles = [];
    // Live-rendered case: index titles as <h5> elements.
    doc.querySelectorAll("h5.j-index-listing-index-title").forEach((h) => {
      const t = (h.textContent || "").trim();
      if (t) titles.push(t);
    });
    // Raw server HTML case: index names live in the alt text of index logos
    // (`/media/cache/journal_index_logo/...`), since the <h5> list is client-rendered.
    if (titles.length === 0) {
      doc.querySelectorAll("img").forEach((img) => {
        if ((img.getAttribute("src") || "").includes("journal_index_logo")) {
          const alt = (img.getAttribute("alt") || img.getAttribute("title") || "").trim();
          if (alt) titles.push(alt);
        }
      });
    }
    return dedupe(titles).join(", ");
  }

  function looksLikeChallenge(html) {
    const s = (html || "").toLowerCase();
    return s.includes("just a moment") || s.includes('name="search_verification"') || s.includes("cf-turnstile");
  }

  function dedupe(arr) {
    const seen = new Set();
    const out = [];
    (arr || []).forEach((x) => { if (!seen.has(x)) { seen.add(x); out.push(x); } });
    return out;
  }

  async function mapPool(items, limit, fn) {
    const results = new Array(items.length);
    let next = 0;
    async function worker() {
      while (next < items.length) {
        const i = next++;
        try {
          results[i] = { status: "fulfilled", value: await fn(items[i], i) };
        } catch (e) {
          results[i] = { status: "rejected", reason: e };
        }
      }
    }
    const n = Math.max(1, Math.min(limit, items.length));
    await Promise.all(Array.from({ length: n }, worker));
    return results;
  }

  function parseReferences(html) {
    const doc = parseDoc(html);
    const refs = [];
    doc.querySelectorAll('meta[name="citation_reference"]').forEach((t) => {
      const c = (t.getAttribute("content") || "").trim();
      if (c) refs.push(c);
    });
    const titleTag = doc.querySelector('meta[name="citation_title"]');
    const title = titleTag ? (titleTag.getAttribute("content") || "").trim() : null;
    return { title, reference_count: refs.length, references: refs };
  }

  return { ORIGIN, buildSearchUrl, buildAdvancedQuery, buildAdvancedUrl, ADV_FIELDS,
           passesIndexFilter, parseDoc, parseCards,
           parseArticleMeta, parseIndexes, looksLikeChallenge, dedupe, mapPool, parseReferences };
});
