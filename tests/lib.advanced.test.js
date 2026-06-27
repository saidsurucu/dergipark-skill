const { test } = require("node:test");
const assert = require("node:assert");
const DP = require("../scripts/lib.js");

test("buildAdvancedQuery: single criterion", () => {
  assert.equal(DP.buildAdvancedQuery([{ field: "author", term: "Mustafa" }]), "author:(Mustafa)");
});

test("buildAdvancedQuery: aliases map to DergiPark prefixes", () => {
  const q = DP.buildAdvancedQuery([
    { field: "title", term: "A" },
    { field: "abstract", term: "B", op: "OR" },
    { field: "orcid", term: "0000", op: "NOT" },
    { field: "journal", term: "X", op: "and" },
  ]);
  assert.equal(q, "title:(A) OR abstract:(B) NOT author_orcid:(0000) AND journal_title:(X)");
});

test("buildAdvancedQuery: turkish + numeric operators normalize", () => {
  const q = DP.buildAdvancedQuery([
    { field: "title", term: "A" },
    { field: "keywords", term: "B", op: "veya" },
    { field: "author", term: "C", op: 2 },
  ]);
  assert.equal(q, "title:(A) OR keywords:(B) NOT author:(C)");
});

test("buildAdvancedQuery: year range with open ends", () => {
  assert.equal(DP.buildAdvancedQuery([{ field: "title", term: "A" }], { firstYear: "2020", lastYear: "2022" }),
    "title:(A) AND year:[2020 TO 2022]");
  assert.equal(DP.buildAdvancedQuery([{ field: "title", term: "A" }], { firstYear: "2015" }),
    "title:(A) AND year:[2015 TO *]");
  assert.equal(DP.buildAdvancedQuery([{ field: "title", term: "A" }], { lastYear: "2000" }),
    "title:(A) AND year:[* TO 2000]");
});

test("buildAdvancedQuery: skips empty terms", () => {
  assert.equal(DP.buildAdvancedQuery([{ field: "title", term: "A" }, { field: "author", term: "" }]), "title:(A)");
});

test("buildAdvancedQuery: raw prefix passes through", () => {
  assert.equal(DP.buildAdvancedQuery([{ field: "running_title", term: "Z" }]), "running_title:(Z)");
});

test("buildAdvancedUrl: encodes q and adds advanced=1, page, sort", () => {
  const url = DP.buildAdvancedUrl([{ field: "author", term: "Mustafa" }], { page: 2, sort: "newest" });
  assert.match(url, /^https:\/\/dergipark\.org\.tr\/tr\/search\?/);
  assert.match(url, /q=author%3A\(Mustafa\)/);
  assert.match(url, /section=article/);
  assert.match(url, /advanced=1/);
  assert.match(url, /page=2/);
  assert.match(url, /sortBy=newest/);
});
