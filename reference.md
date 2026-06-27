# DergiPark reference

## Search URL
Base: `https://dergipark.org.tr/tr/search`
Params:
- `q` — query (use `*` when empty)
- `section` — always `article`
- `page` — only when > 1
- `filter[article_type][]` — article type code
- `sortBy` — `newest` | `oldest`
- `filter[publication_year][]` — year string

## article_type codes
54 Research Article · 55 Case Report · 56 Review · 58 Conference Paper · 65 Book Review · 10 Review Article

## index_filter
- `tr_dizin_icerenler` — keep only articles whose journal indexes include "TR Dizin"
- `bos_olmayanlar` — keep articles whose journal has any index
- `hepsi` — keep all (default)

## Selectors (production-proven in core.py)
- Result card: `div.card.article-card.dp-card-outline`
- Card link: `h5.card-title > a` (href + text)
- Journal indexes page: `<journal_base>/indexes`, items `h5.j-index-listing-index-title`

## Article meta tags (on detail page)
citation_title, DC.Creator.PersonalName (author), citation_journal_title,
citation_publication_date, citation_keywords, citation_doi, citation_issn,
citation_abstract, citation_pdf_url, DC.Source.URI (journal base),
stats_trdizin_citation_count, citation_reference (one per reference).

## PDF
Download URL: `https://dergipark.org.tr/tr/download/article-file/<id>`

## Troubleshooting
- Cloudflare challenge (`/verification` URL, "Just a moment" title, or challenge HTML in a subrequest): ask the user to solve it in their tab, then retry the inject.
- pdf.js blocked by CSP: fall back to navigating to the download URL and using get_page_text.

## Verified (2026-06-27, live against dergipark.org.tr)
- **javascript_tool contract:** REPL semantics — top-level `await` works and the
  last expression is returned. End orchestrator injections with
  `await window.__DP_xxx(...)` (no explicit `return`, no async wrapper needed).
- **Cloudflare:** `/tr/search` redirected once to `/tr/search/verification`, which
  cleared on its own in the real browser (no interaction needed this run). After
  that, 24 cards rendered. In-page same-origin `fetch()` of all detail pages
  returned **0 "Blocked"** — clearance carried, fixing the old server's limitation.
- **Search:** selectors from core.py are accurate. Batched fetch (size 8, pool 4)
  returned full meta (abstract, DOI, refs count, pdf_url) for every article.
- **index_filter:** the `/indexes` page is client-rendered, so `h5.j-index-listing-index-title`
  is empty in raw HTML. **Fix applied:** `parseIndexes` falls back to the `alt`
  text of `img[src*="journal_index_logo"]`, which IS in the raw HTML. "TR Dizin"
  appears verbatim in alt text, so `tr_dizin_icerenler` filtering works
  (verified: hepsi→6, tr_dizin_icerenler→4, all containing "TR Dizin").
- **PDF:** DergiPark sends **no CSP** — `pdf_extract.js` self-loads pdf.js v3 (UMD,
  `window.pdfjsLib`) from CDN and runs the worker from a blob URL. Cold start
  verified: 17-page PDF → 67k chars of correctly-ordered text. Vendored
  `pdfjs.min.js` / `pdfjs.worker.min.js` are kept as the offline fallback.
- **References:** 48 references extracted from a sample article via in-page fetch.
