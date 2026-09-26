"use strict";

const assert = require("assert");
require("./v2-dice-control.js");

const control = globalThis.V2DiceControl;
assert(control, "V2DiceControl must be exported.");
assert.strictEqual(control.cards.length, 18, "All 18 card abilities must be registered.");
assert.strictEqual(new Set(control.cards.map((card) => card.id)).size, 18, "Card ids must be unique.");

for (let value = 1; value <= 6; value += 1) {
  assert.strictEqual(control.resolve(`fixed-${value}`).value, value, `Fixed ${value} must roll ${value}.`);
  const excluded = new Set(Array.from({ length: 5 }, (_, index) => control.resolve(`exclude-${value}`, {}, () => index / 5).value));
  assert(!excluded.has(value) && excluded.size === 5, `Exclude ${value} must produce every other face.`);
}

const pools = { low: [1, 2, 3], high: [4, 5, 6], odd: [1, 3, 5], even: [2, 4, 6] };
for (const [id, expected] of Object.entries(pools)) {
  assert.deepStrictEqual(expected.map((_, index) => control.resolve(id, {}, () => index / expected.length).value), expected, `${id} pool is incorrect.`);
}

assert.strictEqual(control.resolve("repeat", { previousRoll: 5 }).value, 5, "Repeat must reuse the previous die result.");
assert.strictEqual(control.resolve("echo", { previousCardId: "high", previousRoll: 2 }, () => 0).value, 4, "Effect Reactivation must reactivate the previous card.");
assert.strictEqual(control.resolve("echo", { previousCardId: "repeat", previousRoll: 3 }).value, 3, "Effect Reactivation must support Repeat.");
assert.strictEqual(control.canUse("repeat", {}).ok, false, "Repeat needs a previous result.");
assert.strictEqual(control.canUse("echo", {}).ok, false, "Effect Reactivation needs a previous card.");

for (const card of control.cards) {
  assert(control.imagePath(card, "ko").endsWith(`dice-control-ko-${card.image}.png`));
  assert(control.imagePath(card, "en").endsWith(`dice-control-${card.image}.png`));
}

console.log("SUCCESS: all 18 dice control card abilities passed.");
