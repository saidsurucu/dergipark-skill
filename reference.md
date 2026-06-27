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
