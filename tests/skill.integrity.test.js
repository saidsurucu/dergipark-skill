const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const skill = fs.readFileSync(path.join(ROOT, "SKILL.md"), "utf8");

test("SKILL.md has name + description frontmatter", () => {
  assert.match(skill, /^---\n[\s\S]*\nname:\s*dergipark[\s\S]*\ndescription:\s*\S[\s\S]*\n---/);
});

test("SKILL.md references every script and reference.md", () => {
  ["scripts/lib.js", "scripts/search.js", "scripts/references.js", "scripts/pdf_extract.js", "reference.md"]
    .forEach((f) => assert.ok(skill.includes(f), `SKILL.md should mention ${f}`));
});

test("all referenced script files exist", () => {
  ["scripts/lib.js", "scripts/search.js", "scripts/references.js", "scripts/pdf_extract.js"]
    .forEach((f) => assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} must exist`));
});
