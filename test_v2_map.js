const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = __dirname;
const html = fs.readFileSync(path.join(root, "v2-map-practice.html"), "utf8");
const css = fs.readFileSync(path.join(root, "v2-map-practice.css"), "utf8");
const source = fs.readFileSync(path.join(root, "v2-map-practice.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

assert(html.includes('id="tileRing"'), "Map tile ring is missing.");
assert(html.includes('id="regenerateButton"'), "Tile regeneration button is missing.");
assert(css.includes("@media (orientation: portrait)"), "Portrait rotation guidance is missing.");
assert(source.includes("for (let index = 0; index < 8"), "Top and bottom perimeter positions are missing.");
assert(source.includes("for (let index = 0; index < 4"), "Side perimeter positions are missing.");
assert(tileCount(source) === 24, "Tile distribution must total 24.");

function tileCount(text) {
  return [...text.matchAll(/count:\s*(\d+)/g)].reduce((sum, match) => sum + Number(match[1]), 0);
}

for (const map of ["default", "winter", "hell"]) {
  const relative = `art/v2-style/map-test/maps/${map}-map.jpg`;
  assert(fs.existsSync(path.join(root, relative)), `Map is missing: ${relative}`);
}
for (const tile of ["basic", "graveyard", "altar", "unknown", "forest", "rest", "monster", "gem", "event", "warp"]) {
  const relative = `art/v2-style/map-test/tiles/${tile}.png`;
  assert(fs.existsSync(path.join(root, relative)), `Tile is missing: ${relative}`);
  assert(worker.includes(relative), `Tile is not cached: ${relative}`);
}
assert(worker.includes("v2-map-practice.html"), "Map test page is not cached.");
console.log("SUCCESS: landscape map and 24-tile perimeter integration checks passed.");
