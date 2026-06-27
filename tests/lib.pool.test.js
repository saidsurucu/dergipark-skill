const { test } = require("node:test");
const assert = require("node:assert");
const DP = require("../scripts/lib.js");

test("mapPool respects the concurrency limit and preserves order", async () => {
  let inFlight = 0, maxSeen = 0;
  const fn = async (x) => {
    inFlight++; maxSeen = Math.max(maxSeen, inFlight);
    await new Promise((r) => setTimeout(r, 5));
    inFlight--;
    return x * 2;
  };
  const res = await DP.mapPool([1, 2, 3, 4, 5, 6, 7], 3, fn);
  assert.ok(maxSeen <= 3, `max concurrency ${maxSeen} should be <= 3`);
  assert.deepEqual(res.map((r) => r.value), [2, 4, 6, 8, 10, 12, 14]);
});

test("mapPool settles rejections without throwing", async () => {
  const fn = async (x) => { if (x === 2) throw new Error("boom"); return x; };
  const res = await DP.mapPool([1, 2, 3], 2, fn);
  assert.equal(res[0].status, "fulfilled");
  assert.equal(res[1].status, "rejected");
  assert.equal(res[1].reason.message, "boom");
  assert.equal(res[2].value, 3);
});
