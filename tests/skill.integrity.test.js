const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const skill = fs.readFileSync(path.join(ROOT, "SKILL.md"), "utf8");

test("SKILL.md has name + description frontmatter", () => {
  const m = skill.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(m, "frontmatter block present");
  assert.match(m[1], /(^|\n)name:\s*dergipark(\n|$)/);
  assert.match(m[1], /(^|\n)description:\s*\S/);
});

test("SKILL.md references every script and reference.md", () => {
  ["scripts/lib.js", "scripts/scrape.js", "scripts/search.js", "scripts/advanced_search.js",
   "scripts/references.js", "scripts/pdf_extract.js", "reference.md"]
    .forEach((f) => assert.ok(skill.includes(f), `SKILL.md should mention ${f}`));
});

test("all referenced script files exist", () => {
  ["scripts/lib.js", "scripts/scrape.js", "scripts/search.js", "scripts/advanced_search.js",
   "scripts/references.js", "scripts/pdf_extract.js"]
    .forEach((f) => assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} must exist`));
});
