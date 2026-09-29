"use strict";
const assert = require("node:assert/strict");
const Rng = require("./v2-battle-rng.js");

{
  const a = Rng.create(123456789);
  const seq = Array.from({ length: 8 }, () => a.next());
  const b = Rng.create(123456789);
  assert.deepEqual(Array.from({ length: 8 }, () => b.next()), seq, "Same seed must reproduce the same sequence.");
}

{
  const live = Rng.create(987654321);
  const prefix = Array.from({ length: 5 }, () => live.next());
  assert.equal(prefix.length, 5);
  const snap = live.snapshot();
  const expected = Array.from({ length: 12 }, () => live.next());
  const restored = Rng.restore(snap);
  assert.deepEqual(Array.from({ length: 12 }, () => restored.next()), expected,
    "Restored RNG must continue from the exact next gameplay random value.");
}

{
  const a = Rng.create(0);
  assert.notEqual(a.value(), 0, "Zero seed must be normalized away from xorshift32 lock-up.");
  assert.throws(() => Rng.restore({ version: 99, algorithm: "xorshift32", state: 1 }));
  assert.throws(() => Rng.restore({ version: 1, algorithm: "xorshift32", state: -1 }));
}

console.log("PASS: serializable battle RNG seed and exact continuation");
