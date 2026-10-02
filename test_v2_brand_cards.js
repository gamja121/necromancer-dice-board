"use strict";
const fs = require("node:fs");
const path = require("node:path");
const root = __dirname;
const V2Rules = require("./v2-rules.js");

let store = {};
global.sessionStorage = {
  getItem: (key) => store[key] ?? null,
  setItem: (key, value) => { store[key] = value; }
};
delete require.cache[require.resolve("./v2-brand-cards.js")];
const V2BrandCards = require("./v2-brand-cards.js");
const brandCardSource = fs.readFileSync(path.join(root, "v2-brand-cards.js"), "utf8");
if (!brandCardSource.includes("function blessingOnly(brand)"))
  throw Error("Brand cards must normalize every card to blessing-only");

function sequence(values) {
  let index = 0;
  return () => values[index++] ?? 0;
}

for (let index = 0; index < 30; index += 1) {
  const card = V2BrandCards.create(sequence([index / 30, .34, .2, .1, .7]));
  if (!card.brand.bless.length || card.brand.curse.length !== 0 || !V2Rules.validateBrand(card.brand))
    throw Error("Every generated brand card must contain blessings only");
  if (V2BrandCards.label(card).includes("저주"))
    throw Error("Brand card label must never display a curse");
}

// Legacy cards that still contain a curse are migrated on load.
store = {};
store[V2BrandCards.STORAGE_KEY] = JSON.stringify([
  { id: "legacy-card", brand: { type: "critical", bless: [3], curse: [6] } }
]);
const migrated = V2BrandCards.load();
if (migrated.length !== 1 ||
    JSON.stringify(migrated[0].brand) !== JSON.stringify({ type: "critical", bless: [3], curse: [] }))
  throw Error("Legacy brand-card curses must be removed on load");

// Adding a legacy-shaped card must also persist only blessings.
store = {};
const added = V2BrandCards.add({ id: "legacy-add", brand: { type: "freeze", bless: [4], curse: [1] } });
if (!added || added.brand.curse.length || V2BrandCards.load()[0].brand.curse.length)
  throw Error("Brand-card inventory must never persist a curse");
if (!V2BrandCards.remove(V2BrandCards.load()[0].id) || V2BrandCards.load().length !== 0)
  throw Error("Applying a brand card must consume exactly one stored card");

const image = path.join(root, "art/v2-style/ui/brand-card.png");
if (!fs.existsSync(image)) throw Error("Brand card art is missing");
const signature = fs.readFileSync(image).subarray(0, 8).toString("hex");
if (signature !== "89504e470d0a1a0a") throw Error("Brand card art must be a real PNG");
console.log("PASS: brand cards are blessing-only, migrate old curses, persist inventory, and keep PNG art");
