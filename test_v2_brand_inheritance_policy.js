"use strict";
const assert = require("node:assert/strict");

const R = require("./v2-rules.js");
const D = require("./v2-design-data.js");

function unitWithBase(slug, baseBrand) {
  return {
    slug,
    brands: [JSON.parse(JSON.stringify(baseBrand))]
  };
}

// 1) Only the original/base first brand may keep a curse.
const baseSlug = Object.keys(D.units).find((slug) => Array.isArray(D.units[slug].brands) && D.units[slug].brands.includes("critical"));
assert(baseSlug, "Need a unit species whose native brand pool contains critical");
const legacy = {
  slug: baseSlug,
  brands: [
    { type: "critical", bless: [2], curse: [6] },
    { type: "summon", bless: [4, 6], curse: [1] },
    { type: "freeze", bless: [3], curse: [5] }
  ]
};
const normalized = R.normalizeUnitBrands(legacy);
assert.deepEqual(normalized[0], { type: "critical", bless: [2], curse: [6] });
assert.deepEqual(normalized[1], { type: "summon", bless: [4], curse: [] });
assert.deepEqual(normalized[2], { type: "freeze", bless: [3], curse: [] });

// 2) A species with no native/base brand may not keep any curse at all.
const noBaseSlug = Object.keys(D.units).find((slug) => Array.isArray(D.units[slug].brands) && D.units[slug].brands.length === 0);
assert(noBaseSlug, "Need a unit species with no native brand");
const noBase = R.normalizeUnitBrands({
  slug: noBaseSlug,
  brands: [{ type: "critical", bless: [2], curse: [6] }]
});
assert.deepEqual(noBase, [{ type: "critical", bless: [2], curse: [] }]);

// 3) Inheritance transfers blessing faces only, and an existing curse face wins.
const receiver = unitWithBase(baseSlug, { type: "critical", bless: [2], curse: [6] });
const partial = R.inheritedBlessing(receiver, { type: "summon", bless: [4, 6], curse: [1] });
assert.deepEqual(partial, { type: "summon", bless: [4], curse: [] });
assert.equal(R.inheritedBlessing(receiver, { type: "freeze", bless: [6], curse: [1] }), null);

const donor = { slug: baseSlug, brands: [{ type: "summon", bless: [4, 6], curse: [1] }] };
const inherited = R.inherit(receiver, donor, 0);
assert.deepEqual(inherited, { type: "summon", bless: [4], curse: [] });
assert.deepEqual(receiver.brands.at(-1), { type: "summon", bless: [4], curse: [] });
assert.equal(donor.brands.length, 0);
assert.equal(R.inheritancePart({ type: "critical", bless: [2], curse: [6] }), "bless");

// 4) Curse face globally suppresses every blessing on that same die face.
const attacker = {
  ...R.individual(baseSlug, () => 0.2),
  team: "ally",
  slot: 0,
  brands: [
    { type: "critical", bless: [2], curse: [6] },
    { type: "healing", bless: [6], curse: [] }
  ]
};
const targetSlug = Object.keys(D.units).find((slug) => D.units[slug].grade !== "special" && slug !== baseSlug);
const target = { ...R.individual(targetSlug, () => 0.3), team: "enemy", slot: 0, brands: [] };
const state = R.create([attacker, target], () => 0.4);
R.roll(state, 6);
assert.equal(attacker.curse.critical, 1);
assert.equal(attacker.bless.healing || 0, 0);
assert.equal(attacker.brandMode, "curse");

// 5) Brand cards are always blessing-only, including legacy loaded cards.
let store = {};
global.sessionStorage = {
  getItem: (key) => store[key] ?? null,
  setItem: (key, value) => { store[key] = value; }
};
delete require.cache[require.resolve("./v2-brand-cards.js")];
const Cards = require("./v2-brand-cards.js");
for (let i = 0; i < 40; i++) {
  let seed = i + 1;
  const rng = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const card = Cards.create(rng);
  assert(card.brand.bless.length >= 1);
  assert.deepEqual(card.brand.curse, []);
}
store[Cards.STORAGE_KEY] = JSON.stringify([
  { id: "legacy-cursed-card", brand: { type: "critical", bless: [3], curse: [6] } }
]);
const legacyCards = Cards.load();
assert.equal(legacyCards.length, 1);
assert.deepEqual(legacyCards[0].brand, { type: "critical", bless: [3], curse: [] });

console.log("PASS: base curse only, blessing-only inheritance/cards, duplicate face curse priority.");


// 6) Old battle checkpoints must be normalized at restore time too.
{
  const native = nativeBrandSlug("critical");
  const enemySlug = Object.keys(D.units).find((slug) => D.units[slug].grade !== "special" && slug !== native);
  const ally = {
    ...R.individual(native, () => 0.2),
    team: "ally",
    slot: 0,
    brands: [
      { type: "critical", bless: [2], curse: [6] },
      { type: "healing", bless: [6], curse: [1] }
    ]
  };
  const enemy = { ...R.individual(enemySlug, () => 0.3), team: "enemy", slot: 0, brands: [] };
  const state = R.create([ally, enemy], () => 0.4);
  const snap = R.snapshot(state);
  snap.units[0].brands[1] = { type: "healing", bless: [6], curse: [1] };
  const restored = R.restore(snap, () => 0.4);
  assert.equal(restored.units[0].brands.length, 1);
}
console.log("PASS: Legacy battle snapshots normalize inherited curses on restore.");
