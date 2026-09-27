const fs = require("fs");
const assert = require("assert");

const source = fs.readFileSync("v2-map-practice.js", "utf8");
const html = fs.readFileSync("v2-map-practice.html", "utf8");
const worker = fs.readFileSync("service-worker.js", "utf8");

assert(source.includes('const MAP_LAYOUT_KEY = "necromancer-map-layout-v2"'), "Map layout storage must migrate away from malformed v1 layouts.");
assert(source.includes('const LEGACY_MAP_LAYOUT_KEY = "necromancer-map-layout-v1"'), "Legacy map key cleanup is missing.");
assert(source.includes('pool.length - pool.filter(Boolean).length'), "Sparse Array(24) empty-slot calculation regression is not fixed.");
assert(!source.includes('pool.reduce((count, tile) => count + (tile ? 0 : 1), 0)'), "Sparse-array reduce bug is still present.");
assert(source.includes("function hasValidMapDistribution(pool)"), "Map distribution validator is missing.");
assert(source.includes("basicCount === 3 && monsterCount === 2"), "Stable/spread distribution invariant is missing.");
assert(source.includes("basicCount === 2 && monsterCount === 3"), "Erosion/catastrophe distribution invariant is missing.");
assert(source.includes("basicCount === 0") && source.includes("monsterCount === 4"), "Threshold/boss distribution invariant is missing.");
assert(html.includes('v2-map-practice.js?v=54'), "Map page cache version was not bumped.");
assert(worker.includes('necromancer-expedition-v285'), "Service worker cache version was not bumped.");
assert(worker.includes('v2-map-practice.js?v=54'), "Service worker is not caching the fixed map script.");

console.log("map pool sparse-array regression test passed");
