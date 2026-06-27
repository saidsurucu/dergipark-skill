const { test } = require("node:test");
const assert = require("node:assert");
const DP = require("../scripts/lib.js");

test("buildSearchUrl: empty query becomes * and section=article", () => {
  const url = DP.buildSearchUrl({});
  assert.match(url, /^https:\/\/dergipark\.org\.tr\/tr\/search\?/);
  assert.match(url, /q=\*/);
  assert.match(url, /section=article/);
  assert.ok(!/page=/.test(url), "page omitted when 1");
});

test("buildSearchUrl: all params encoded correctly", () => {
  const url = DP.buildSearchUrl({
    query: "yapay zeka", page: 2, sort: "newest", articleType: "54", year: "2024",
  });
  assert.match(url, /q=yapay%20zeka/);
  assert.match(url, /page=2/);
  assert.match(url, /sortBy=newest/);
  assert.match(url, /filter%5Barticle_type%5D%5B%5D=54/);
  assert.match(url, /filter%5Bpublication_year%5D%5B%5D=2024/);
});

test("passesIndexFilter", () => {
  assert.equal(DP.passesIndexFilter("TR Dizin, Scopus", "tr_dizin_icerenler"), true);
  assert.equal(DP.passesIndexFilter("Scopus", "tr_dizin_icerenler"), false);
  assert.equal(DP.passesIndexFilter("", "bos_olmayanlar"), false);
  assert.equal(DP.passesIndexFilter("Scopus", "bos_olmayanlar"), true);
  assert.equal(DP.passesIndexFilter("", "hepsi"), true);
});
