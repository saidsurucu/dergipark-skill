const { test } = require("node:test");
const assert = require("node:assert");
const DP = require("../scripts/lib.js");

const HTML = `
<div class="card article-card dp-card-outline">
  <h5 class="card-title"><a href="/tr/pub/journalx/article/111"> First Title </a></h5>
</div>
<div class="card article-card dp-card-outline">
  <h5 class="card-title"><a href="https://dergipark.org.tr/tr/pub/journaly/article/222">Second</a></h5>
</div>
<div class="card article-card dp-card-outline">
  <h5 class="card-title"><a>No href</a></h5>
</div>`;

test("parseCards extracts absolute url + trimmed title and skips hrefless cards", () => {
  const cards = DP.parseCards(HTML);
  assert.equal(cards.length, 2);
  assert.deepEqual(cards[0], { url: "https://dergipark.org.tr/tr/pub/journalx/article/111", title: "First Title" });
  assert.equal(cards[1].url, "https://dergipark.org.tr/tr/pub/journaly/article/222");
});
