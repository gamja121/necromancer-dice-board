const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = __dirname;
const html = fs.readFileSync(path.join(root, "v2-map-practice.html"), "utf8");
const css = fs.readFileSync(path.join(root, "v2-map-practice.css"), "utf8");
const source = fs.readFileSync(path.join(root, "v2-map-practice.js"), "utf8");
const landscape = fs.readFileSync(path.join(root, "v2-landscape.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

assert(html.includes('id="tileRing"'), "Map tile ring is missing.");
assert(html.includes('id="regenerateButton"'), "Tile regeneration button is missing.");
assert(html.includes('id="heroToken"'), "Hero token is missing.");
assert(html.includes('id="mapDiceButton"'), "Map dice control is missing.");
assert(css.includes("@media (orientation: portrait)"), "Portrait landscape fallback is missing.");
assert(css.includes("rotate(90deg)"), "Map must rotate itself in portrait mode.");
assert(html.includes("v2-landscape.js?v=1"), "Landscape orientation helper is missing.");
assert(landscape.includes('screen.orientation.lock("landscape")'), "Landscape orientation lock is missing.");
assert(source.includes("for (let index = 0; index < 8"), "Top and bottom perimeter positions are missing.");
assert(source.includes("for (let index = 0; index < 4"), "Side perimeter positions are missing.");
assert(source.includes("Math.floor(Math.random() * 6) + 1"), "Random dice result is missing.");
assert(source.includes("heroIndex = (heroIndex + 1) % positions.length"), "Clockwise wraparound movement is missing.");
assert(source.includes("await wait(230)"), "Step-by-step movement timing is missing.");
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
for (const tile of ["home", "village", "fortune-teller-camp", "boss"]) {
  const relative = `art/v2-style/map-test/tiles/${tile}.png`;
  assert(fs.existsSync(path.join(root, relative)), `New tile is missing: ${relative}`);
  assert(worker.includes(relative), `New tile is not cached: ${relative}`);
}
assert(source.includes("[fixedTiles.home") && source.includes("fixedTiles.boss]"), "Home and boss tiles must bookend the route.");
assert(source.includes("fixedTiles.village") && source.includes("fixedTiles.fortune"), "Village and fortune-teller tiles must be connected to the route.");
assert(html.includes("v2-map-practice.js?v=3"), "The map page must load the connected tile version.");
assert(worker.includes("v2-map-practice.html"), "Map test page is not cached.");
assert(worker.includes("v2-landscape.js?v=1"), "Landscape helper is not cached.");
const hero = "art/v2-style/map-test/hero/necromancer-hero.png";
assert(fs.existsSync(path.join(root, hero)), "Processed hero token is missing.");
assert(worker.includes(hero), "Hero token is not cached.");
console.log("SUCCESS: landscape map, dice roll, hero token, and step movement checks passed.");
