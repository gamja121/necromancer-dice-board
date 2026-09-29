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
global.crypto = { randomUUID: () => "test-uuid" };
delete require.cache[require.resolve("./v2-brand-cards.js")];
const V2BrandCards = require("./v2-brand-cards.js");

function sequence(values) {
  let index = 0;
  return () => values[index++] ?? 0;
}

const blessingOnly = V2BrandCards.create(sequence([0, 0.34, 0.2, 0.1]));
if (blessingOnly.brand.type !== "critical" || blessingOnly.brand.bless.length !== 1 ||
    blessingOnly.brand.curse.length !== 0 || !V2Rules.validateBrand(blessingOnly.brand))
  throw Error("Treasure brand card must support valid blessing-only output from the base brand rule");

const blessingAndCurse = V2BrandCards.create(sequence([0, 0.34, 0.2, 0.9]));
if (blessingAndCurse.brand.type !== "critical" || blessingAndCurse.brand.bless.length !== 1 ||
    blessingAndCurse.brand.curse.length !== 1 || !V2Rules.validateBrand(blessingAndCurse.brand))
  throw Error("Treasure brand card must support valid blessing+curse output from the base brand rule");

if (!V2BrandCards.label(blessingOnly).includes("치명타") ||
    !V2BrandCards.label(blessingOnly).includes("축복") ||
    V2BrandCards.label(blessingOnly).includes("저주"))
  throw Error("Blessing-only card description must show type and blessing faces only");
if (!V2BrandCards.label(blessingAndCurse).includes("저주"))
  throw Error("Blessing+curse card description must show its curse face");

store = {};
if (!V2BrandCards.add(blessingOnly) || V2BrandCards.load().length !== 1)
  throw Error("Brand card inventory must persist acquired treasure cards");
if (!V2BrandCards.remove(V2BrandCards.load()[0].id) || V2BrandCards.load().length !== 0)
  throw Error("Applying a brand card must consume exactly one stored card");

const image = path.join(root, "art/v2-style/ui/brand-card.png");
if (!fs.existsSync(image)) throw Error("Brand card art is missing");
const signature = fs.readFileSync(image).subarray(0, 8).toString("hex");
if (signature !== "89504e470d0a1a0a") throw Error("Brand card art must be a real PNG");
console.log("PASS: random brand-card type/faces, 50:50 mode branch, inventory persistence, and PNG art");
