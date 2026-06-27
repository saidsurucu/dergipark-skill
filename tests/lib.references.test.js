const { test } = require("node:test");
const assert = require("node:assert");
const DP = require("../scripts/lib.js");

const HTML = `<head>
<meta name="citation_title" content="Kaynaklı Makale">
<meta name="citation_reference" content="Smith 2020">
<meta name="citation_reference" content="Doe 2021">
<meta name="citation_reference" content="  ">
</head>`;

test("parseReferences returns title, count and non-empty refs", () => {
  const r = DP.parseReferences(HTML);
  assert.equal(r.title, "Kaynaklı Makale");
  assert.deepEqual(r.references, ["Smith 2020", "Doe 2021"]);
  assert.equal(r.reference_count, 2);
});
