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
assert(html.includes('id="tileEventOverlay"') && html.includes('id="tileEventImage"') && html.includes('id="tileEventClose"'), "Centered tile event overlay is missing.");
assert(html.includes('id="mapDeckOverlay"') && html.includes('id="mapSelectedLineup"') && html.includes('id="mapDeckRoster"'), "Map battle deck selection overlay is missing.");
assert(css.includes("@media (orientation: portrait)"), "Portrait landscape fallback is missing.");
assert(css.includes("rotate(90deg)"), "Map must rotate itself in portrait mode.");
assert(html.includes("v2-landscape.js?v=1"), "Landscape orientation helper is missing.");
assert(landscape.includes('screen.orientation.lock("landscape")'), "Landscape orientation lock is missing.");
assert(source.includes("for (let index = 0; index < 8"), "Top and bottom perimeter positions are missing.");
assert(source.includes("for (let index = 0; index < 4"), "Side perimeter positions are missing.");
assert(source.includes("Math.floor(Math.random() * 6) + 1"), "Random dice result is missing.");
assert(source.includes("heroIndex = (heroIndex + 1) % positions.length"), "Clockwise wraparound movement is missing.");
assert(source.includes("await wait(230)"), "Step-by-step movement timing is missing.");
assert(source.includes('tile?.id !== "monster"') && source.includes('el.deckOverlay.classList.add("is-open")'), "Monster tiles must open deck selection over the map.");
assert(source.includes('currentTiles[heroIndex]?.id === "monster"') && source.includes("enterMonsterBattle(currentTiles[heroIndex], heroIndex + 1)"), "Landing on a monster tile must open battle after dice movement.");
assert(source.includes('from: "map", map: activeMapId, tile: String(battleStep), allies: selectedDeck.join(",")'), "Monster battles must receive map, tile, and selected deck context.");
assert(css.includes("@keyframes map-deck-window-drop") && css.includes("@keyframes map-deck-roster-rise"), "Deck board and roster entrance animations are missing.");
assert(css.includes(".map-deck-overlay") && css.includes("background: transparent"), "The board map must remain visible behind deck selection.");
assert(source.includes("const tileEventScenes") && source.includes("openTileEvent(currentTiles[heroIndex], heroIndex + 1)"), "Landing on a supported tile must open its centered event scene.");
assert(css.includes(".tile-event-overlay") && css.includes("place-items: center"), "Tile event scene must be centered over the map.");
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
const eventScenes = {
  graveyard: "graveyard.jpg", home: "home.jpg", "fortune-teller-camp": "fortune-teller.jpg",
  village: "village.jpg", rest: "camp.jpg", altar: "altar.jpg", forest: "forest.jpg",
  gem: "treasure-chest-sprite.png"
};
for (const [tile, file] of Object.entries(eventScenes)) {
  const relative = `art/v2-style/map-test/events/${file}`;
  assert(fs.existsSync(path.join(root, relative)), `Event scene is missing for ${tile}: ${relative}`);
  assert(worker.includes(relative), `Event scene is not cached: ${relative}`);
  assert(source.includes(`${tile.includes("-") ? `"${tile}"` : tile}: Object.freeze`), `Event scene mapping is missing: ${tile}`);
}
assert(html.includes('id="treasureChestSprite"') && css.includes("@keyframes treasure-chest-open"), "Treasure tile must use the transparent four-frame opening animation.");
assert(source.includes('scene.animation === "treasure"') && source.includes('eventTreasure.classList.add("is-playing")'), "Treasure animation must restart when the tile is reached.");
assert(source.includes("async function warpToOtherWarp()") && source.includes('tile.id === "warp" && index !== heroIndex'), "Warp must move to the other warp tile.");
assert(source.includes('currentTiles[heroIndex]?.id === "warp"') && source.includes("await warpToOtherWarp()"), "Landing on a warp tile must trigger teleportation.");
assert(html.includes("v2-map-practice.js?v=15") && html.includes("v2-map-practice.css?v=11") && html.includes("v2-sfx.js?v=3"), "The map page must load targeting, music, and mobile sound effects.");
assert(worker.includes("v2-map-practice.html"), "Map test page is not cached.");
assert(worker.includes("v2-landscape.js?v=1"), "Landscape helper is not cached.");
assert(worker.includes("v2-map-practice.js?v=15") && worker.includes("v2-map-practice.css?v=11") && worker.includes("v2-sfx.js?v=3"), "The targeting, music, and mobile sound logic is not cached.");
assert(html.includes('class="tile-event-scene"') && html.includes('class="tile-event-exit"') && !html.includes('id="tileEventTitle"'), "Tile events must be image-only on the board with an exit button.");
assert(css.includes('.tile-event-overlay { position: absolute; z-index: 40; inset: 0; background: transparent; }') && css.includes('exit-parchment.png'), "Tile events must not dim the map and must use the cropped exit parchment.");
assert(source.includes('village: 1280 / 956') && source.includes('fitTileEventScene()') && css.includes('right: 1%; bottom: 7%'), "All tile scenes must fit their source aspect ratio and place exit over the bottom-right watermark.");
assert(worker.includes('art/v2-style/map-test/events/exit-parchment.png'), "The parchment exit button must be cached.");
assert(!source.includes('document.createElement("b")'), "Selected roster cards must not show numbered badges.");
assert(css.includes("translateY(-22%)") && css.includes("width: 68%"), "Selected cards must rise and the roster must cluster on the left.");
assert(source.includes('el.board.classList.add("is-deck-selecting")') && css.includes('.map-board.is-deck-selecting .map-tile .step { opacity: 0; }'), "Map tile step badges must be hidden behind deck cards.");
assert(source.includes('1: [100], 2: [35, 65], 3: [20, 33, 47], 4: [15, 20, 27, 38]'), "Placement targeting rates are missing.");
assert(source.includes('rate.textContent = `피격 ${TARGET_RATES[selectedDeck.length][index]}%`') && css.includes('.map-target-rate'), "Each selected card must show its targeting rate.");
assert(source.includes('V2Sfx.play("diceTick"') && source.includes('V2Sfx.play("diceLand"') && source.includes('V2Sfx.play("move"'), "Map dice and movement sounds are missing.");
for(const sound of ['dice-tick.ogg','dice-land.ogg','move.ogg'])assert(worker.includes(`assets/sfx/${sound}`),`Map sound is not cached: ${sound}`);
assert(source.includes("requestedMapId") && source.includes('document.querySelector(`[data-map="${activeMapId}"]`)'), "Returning from battle must restore the selected map region.");
const navigation = [];
const battleLinkContext = {
  activeMapId: "winter", battleStep: 7, selectedDeck: ["death-knight", "ghoul", "hydra", "siren"], URLSearchParams,
  el: { deckConfirm: {}, deckStatus: {} },
  window: { location: { assign: url => navigation.push(url) } }
};
const battleLinkSource = source.slice(source.indexOf("  function confirmMonsterBattle("), source.indexOf("  function openTileEvent("));
vm.createContext(battleLinkContext);
vm.runInContext(battleLinkSource, battleLinkContext);
vm.runInContext("confirmMonsterBattle()", battleLinkContext);
assert(navigation[0] === "v2-auto-battle-practice.html?from=map&map=winter&tile=7&allies=death-knight%2Cghoul%2Chydra%2Csiren", "Battle navigation must preserve the ordered four-card deck.");
const hero = "art/v2-style/map-test/hero/necromancer-hero.png";
assert(fs.existsSync(path.join(root, hero)), "Processed hero token is missing.");
assert(worker.includes(hero), "Hero token is not cached.");
console.log("SUCCESS: landscape map, dice roll, hero token, and step movement checks passed.");
