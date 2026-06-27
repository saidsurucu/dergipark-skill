const { test } = require("node:test");
const assert = require("node:assert");
const DP = require("../scripts/lib.js");

const ARTICLE = `<html><head>
<meta name="citation_title" content="Bir Makale">
<meta name="DC.Creator.PersonalName" content="Ada Lovelace">
<meta name="citation_journal_title" content="Test Dergisi">
<meta name="citation_publication_date" content="2024-01-01">
<meta name="citation_keywords" content="ai; ml">
<meta name="citation_doi" content="10.1234/x">
<meta name="citation_issn" content="1234-5678">
<meta name="citation_abstract" content="Ozet metni">
<meta name="citation_pdf_url" content="/tr/download/article-file/999">
<meta name="DC.Source.URI" content="https://dergipark.org.tr/tr/pub/testdergisi">
<meta name="stats_trdizin_citation_count" content="7">
<meta name="citation_reference" content="Ref 1">
<meta name="citation_reference" content="Ref 2">
</head><body></body></html>`;

test("parseArticleMeta maps fields, counts references, absolutizes pdf url", () => {
  const { details, pdf_url, journal_base } = DP.parseArticleMeta(ARTICLE);
  assert.equal(details.citation_title, "Bir Makale");
  assert.equal(details.citation_author, "Ada Lovelace");
  assert.equal(details.citation_abstract, "Ozet metni");
  assert.equal(details.citation_doi, "10.1234/x");
  assert.equal(details.stats_citation_count, "7");
  assert.equal(details.stats_reference_count, 2);
  assert.equal(pdf_url, "https://dergipark.org.tr/tr/download/article-file/999");
  assert.equal(journal_base, "https://dergipark.org.tr/tr/pub/testdergisi");
});

test("parseIndexes joins titles", () => {
  const html = `<h5 class="j-index-listing-index-title">TR Dizin</h5>
                <h5 class="j-index-listing-index-title">Scopus</h5>`;
  assert.equal(DP.parseIndexes(html), "TR Dizin, Scopus");
});

test("looksLikeChallenge detects Cloudflare interstitial", () => {
  assert.equal(DP.looksLikeChallenge("<title>Just a moment...</title>"), true);
  assert.equal(DP.looksLikeChallenge('<form name="search_verification">'), true);
  assert.equal(DP.looksLikeChallenge("<html><meta name='citation_title'></html>"), false);
});

test("dedupe keeps first occurrence order", () => {
  assert.deepEqual(DP.dedupe(["a", "b", "a", "c", "b"]), ["a", "b", "c"]);
});
