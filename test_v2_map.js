const fs = require("fs");
const path = require("path");
const vm = require("vm");

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
assert(source.includes('tile?.id !== "monster"') && source.includes('v2-auto-battle-practice.html?${params}'), "Monster tiles must open the battlefield test.");
assert(source.includes('currentTiles[heroIndex]?.id === "monster"') && source.includes("enterMonsterBattle(currentTiles[heroIndex], heroIndex + 1)"), "Landing on a monster tile must open battle after dice movement.");
assert(source.includes('from: "map", map: activeMapId, tile: String(step)'), "Monster battles must receive the selected map and tile context.");
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
assert(html.includes("v2-map-practice.js?v=4"), "The map page must load the monster-battle connection version.");
assert(worker.includes("v2-map-practice.html"), "Map test page is not cached.");
assert(worker.includes("v2-landscape.js?v=1"), "Landscape helper is not cached.");
assert(worker.includes("v2-map-practice.js?v=4"), "The connected monster-tile map logic is not cached.");
const navigation = [];
const battleLinkContext = {
  activeMapId: "winter", enteringBattle: false, URLSearchParams,
  el: { diceButton: {}, regenerate: {}, tileName: {} },
  window: { location: { assign: url => navigation.push(url) } }
};
const battleLinkSource = source.slice(source.indexOf("  function enterMonsterBattle("), source.indexOf("  function placeHero("));
vm.createContext(battleLinkContext);
vm.runInContext(battleLinkSource, battleLinkContext);
assert(vm.runInContext('enterMonsterBattle({ id: "monster" }, 7)', battleLinkContext) === true, "A monster tile must start navigation.");
assert(navigation[0] === "v2-auto-battle-practice.html?from=map&map=winter&tile=7", "Monster navigation must preserve map and tile context.");
assert(vm.runInContext('enterMonsterBattle({ id: "rest" }, 8)', battleLinkContext) === false && navigation.length === 1, "Non-monster tiles must stay on the map.");
const hero = "art/v2-style/map-test/hero/necromancer-hero.png";
assert(fs.existsSync(path.join(root, hero)), "Processed hero token is missing.");
assert(worker.includes(hero), "Hero token is not cached.");
console.log("SUCCESS: landscape map, dice roll, hero token, and step movement checks passed.");
