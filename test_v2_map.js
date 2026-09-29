(async () => {
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
const battleSource = fs.readFileSync(path.join(root, "v2-auto-battle-practice.js"), "utf8");
const sceneContext = {};
vm.runInNewContext(source.slice(source.indexOf('  const ROOT ='), source.indexOf('  const tileTypes =')) +
  ';globalThis.scenes=tileEventScenes;globalThis.ratios=tileEventRatios;', sceneContext);
assert(sceneContext.scenes.altar.title === "제단" && sceneContext.scenes.altar.image.includes("/altar.jpg?v=20260928-2"), "Altar must retain its original artwork.");
assert(sceneContext.scenes.unknown.title === "세계수" && sceneContext.scenes.unknown.image.includes("/world-tree.jpg?v=20260928-2"), "World tree tile must open world-tree artwork.");
assert(sceneContext.scenes.forest.title === "언덕", "The single-tree hill scene must be named 언덕.");
assert(sceneContext.ratios.altar === 1280 / 575 && sceneContext.ratios.unknown === 16 / 9, "Each scene must preserve its original aspect ratio.");
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
assert(source.includes("for (let index = 0; index < 8") && source.includes("for (let index = 0; index < 7"), "Top eight and bottom seven perimeter positions are missing.");
assert(source.includes("for (let index = 0; index < 4") && source.includes("for (let index = 0; index < 5"), "Right four and left five perimeter positions are missing.");
const perimeterSource = source.match(/  function perimeterPositions\(\) \{[\s\S]*?\n  \}/)?.[0];
assert(perimeterSource, "Perimeter position function is missing.");
const mapPositions = vm.runInNewContext(`(${perimeterSource.trim()})()`);
assert(mapPositions.length === 24 && mapPositions.slice(12, 19).every((point) => point.y === 85), "The route must keep 24 tiles, with seven on the bottom edge.");
assert(mapPositions[0].x === 20 && mapPositions[23].y === 15, "The top row must shift right to make room for the raised fifth left tile.");
assert(source.includes("Math.floor(Math.random() * 6) + 1"), "Random dice result is missing.");
assert(source.includes("heroIndex = (heroIndex + 1) % positions.length"), "Clockwise wraparound movement is missing.");
assert(source.includes("await wait(230)"), "Step-by-step movement timing is missing.");
assert(source.includes("isMonsterBattleTile(tile)") && source.includes('el.deckOverlay.classList.add("is-open")'), "Monster, rare-monster, and boss tiles must open deck selection over the map.");
assert(source.includes("isMonsterBattleTile(currentTiles[heroIndex])") && source.includes("enterMonsterBattle(currentTiles[heroIndex], landedStep)"), "Landing on an uncleared battle tile must open battle after dice movement.");
assert(source.includes('new Set(["monster", "rare-monster", "boss"])') && source.includes("isMonsterTileCleared(step)"), "Battle tile types and per-step cleared-state handling must remain connected.");
assert(source.includes('from: "map",') && source.includes('allies: selectedUnits.map((unit) => unit.slug).join(",")') && source.includes('allyIds: selectedUnits.map((unit) => unit.instanceId).join(",")'), "Monster battles must receive map context plus ordered slugs and instance ids.");
assert(css.includes("@keyframes map-deck-window-drop") && css.includes("@keyframes map-deck-roster-rise"), "Deck board and roster entrance animations are missing.");
assert(css.includes(".map-deck-overlay") && css.includes("background: transparent"), "The board map must remain visible behind deck selection.");
assert(source.includes("const tileEventScenes") && source.includes("openTileEvent(currentTiles[heroIndex], heroIndex + 1)"), "Landing on a supported tile must open its centered event scene.");
const tileContext = { ROOT: "art/v2-style/map-test/", TILE_ASSET_VERSION: "test", cleared: false };
tileContext.isMonsterTileCleared = () => tileContext.cleared;
vm.runInNewContext(source.slice(source.indexOf("  function getTileImage("),source.indexOf("  function createPool(")),tileContext);
for(const id of ["monster","rare-monster","boss"]){
  for(const cleared of [false,true]){
    tileContext.cleared=cleared;
    assert(tileContext.getTileImage({id},1) === `art/v2-style/map-test/tiles/${id}${cleared?"-cleared":""}.png?v=test`, "Monster tile must display its own uncleared/cleared artwork");
  }
}
assert(css.includes(".tile-event-overlay") && css.includes("place-items: center"), "Tile event scene must be centered over the map.");
assert(tileCount(source) === 24, "Tile distribution must total 24.");

function tileCount(text) {
  const definitions = text.slice(text.indexOf("const tileTypes"), text.indexOf("const TEST_DECK"));
  return [...definitions.matchAll(/count:\s*(\d+)/g)].reduce((sum, match) => sum + Number(match[1]), 0);
}

for (const map of ["default", "winter", "hell"]) {
  const relative = `art/v2-style/map-test/maps/${map}-map.jpg`;
  assert(fs.existsSync(path.join(root, relative)), `Map is missing: ${relative}`);
}
for (const tile of ["basic", "graveyard", "altar", "unknown", "forest", "rest", "monster", "monster-cleared", "rare-monster", "rare-monster-cleared", "gem", "event", "warp"]) {
  const relative = `art/v2-style/map-test/tiles/${tile}.png`;
  assert(fs.existsSync(path.join(root, relative)), `Tile is missing: ${relative}`);
  assert(worker.includes(relative), `Tile is not cached: ${relative}`);
}
for (const tile of ["home", "village", "fortune-teller-camp", "boss", "boss-cleared"]) {
  const relative = `art/v2-style/map-test/tiles/${tile}.png`;
  assert(fs.existsSync(path.join(root, relative)), `New tile is missing: ${relative}`);
  assert(worker.includes(relative), `New tile is not cached: ${relative}`);
}
assert(source.includes("const HOME_INDEX = 15") && source.includes("pool[HOME_INDEX] = fixedTiles.home") && source.includes("pool[23] = fixedTiles.boss"), "Home must sit on the central bottom tile and boss on the last tile.");
assert(source.includes("const startingIndex = resumeHeroIndex === null ? HOME_INDEX : resumeHeroIndex") && source.includes("heroIndex = startingIndex") && source.includes("selectTile(currentButtons[heroIndex]"), "A new expedition starts at home; a resumed expedition preserves its tile.");
assert(source.includes("if (heroIndex === HOME_INDEX) { reachedHome = true; lapReadyForRefresh = true; break; }") && source.includes("집 도착 (${stepsMoved}칸 이동)"), "Dice movement must stop at home even when pips remain.");
assert(source.includes('el.hero.style.setProperty("--hero-facing", heroIndex >= 12 ? -1 : 1)') && css.includes('scaleX(var(--hero-facing, 1))'), "The hero must face the direction of travel on the bottom and left sides.");
assert(source.includes("fixedTiles.village") && source.includes("fixedTiles.fortune"), "Village and fortune-teller tiles must be connected to the route.");
const eventScenes = {
  graveyard: "graveyard.jpg", home: "home.jpg", "fortune-teller-camp": "fortune-teller.jpg",
  village: "village.jpg", rest: "camp.jpg", altar: "altar.jpg", unknown: "world-tree.jpg", forest: "forest.jpg"
};
for (const [tile, file] of Object.entries(eventScenes)) {
  const relative = `art/v2-style/map-test/events/${file}`;
  assert(fs.existsSync(path.join(root, relative)), `Event scene is missing for ${tile}: ${relative}`);
  assert(worker.includes(relative), `Event scene is not cached: ${relative}`);
  assert(source.includes(`${tile.includes("-") ? `"${tile}"` : tile}: Object.freeze`), `Event scene mapping is missing: ${tile}`);
}
assert(html.includes('id="treasureChestFrame"') && css.includes(".treasure-chest-frame") && css.includes(".treasure-chest-frame.is-burst"), "Treasure tile must expose the current four-frame chest image.");
for (let index = 1; index <= 4; index += 1) {
  const relative = `art/v2-style/map-test/events/treasure-chest-frame-${index}.png`;
  assert(fs.existsSync(path.join(root, relative)), `Treasure frame is missing: ${relative}`);
  assert(worker.includes(relative), `Treasure frame is not cached: ${relative}`);
}
assert(source.includes('scene.animation === "treasure"') && source.includes("async function playTreasureChestAnimation()") && source.includes('eventTreasure.classList.add("is-burst")'), "Treasure animation must restart through the current four-frame sequence.");
assert(html.includes('v2-brand-cards.js?v=4') && worker.includes('v2-brand-cards.js?v=4'), "Brand card inventory module must load before map reward logic.");
assert(fs.existsSync(path.join(root, "art/v2-style/ui/brand-card.png")) && worker.includes("art/v2-style/ui/brand-card.png?v=4"), "Transparent brand card art must exist and be cached.");
assert(source.includes("V2BrandCards.create()") && source.includes('type: "brand"') && source.includes("V2BrandCards.addAsync(reward.brandCard)"), "Brand cards must join treasure rewards and persist as their own inventory.");
assert(source.includes("const otherRewards = shuffle([...unitRewards, ...diceRewards]).slice(0, 2)") &&
  source.includes("return shuffle([brandReward, ...otherRewards])"),
  "Every treasure choice set must contain exactly one guaranteed brand card plus two random non-brand rewards.");
assert(source.includes('reward.type === "brand" ? "낙인 카드"') && css.includes(".treasure-brand-description"), "Treasure brand cards must render their generated brand description in the card text panel.");

assert(source.includes("async function warpToOtherWarp()") && source.includes('tile.id === "warp" && index !== heroIndex'), "Warp must move to the other warp tile.");
assert(source.includes('currentTiles[heroIndex]?.id === "warp"') && source.includes("await warpToOtherWarp()"), "Landing on a warp tile must trigger teleportation.");
require("./scripts/assert-linked-cache")(html, worker, ["v2-map-practice.js","v2-map-practice.css","v2-sfx.js","v2-world-tree-prayer-digits.js","v2-brand-cards.js","v2-run-state.js","v2-run-state-runtime.js"]);
assert(html.includes('v2-run-state.js?v=1') && html.includes('v2-run-state-runtime.js?v=1') &&
  worker.includes('v2-run-state.js?v=1') && worker.includes('v2-run-state-runtime.js?v=1'),
  "RunState core/runtime must load and cache before map persistence.");
assert(worker.includes("v2-map-practice.html"), "Map test page is not cached.");
assert(worker.includes("v2-landscape.js?v=1"), "Landscape helper is not cached.");
assert(html.includes('id="diceControlHand"') && html.includes('v2-dice-control.js?v=1'), "The five-card dice control hand and ability engine must load on the map.");
assert(source.includes("V2DiceControl.canUse") && source.includes("V2DiceControl.resolve") && source.includes("pendingDiceControlId"), "Dice control cards must arm and resolve on the next roll.");
assert(source.includes("previousDiceRoll") && source.includes("previousDiceControlId"), "Repeat and effect reactivation history must be tracked.");
assert(css.includes(".dice-control-card.is-armed") && css.includes(".dice-control-card:disabled"), "Armed and unavailable dice control cards need visible states.");
const diceControlImages = ["1", "2", "3", "4", "5", "6", "low", "high", "odd", "even", "exclude-1", "exclude-2", "exclude-3", "exclude-4", "exclude-5", "exclude-6", "repeat", "echo"];
for (const suffix of diceControlImages) {
  for (const languagePrefix of ["ko-", ""]) {
    const relative = `art/v2-style/ui/dice-control-${languagePrefix}${suffix}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Dice control card is missing: ${relative}`);
    assert(worker.includes(relative), `Dice control card is not cached: ${relative}`);
  }
}
assert(html.includes('class="tile-event-scene"') && html.includes('class="tile-event-exit"') && !html.includes('id="tileEventTitle"'), "Tile events must be image-only on the board with an exit button.");
assert(html.includes('id="tileEventEnter"') && source.includes('el.eventEnter.addEventListener("click", enterHome)') && source.includes('el.eventEnter.hidden = tile.id !== "home"'), "Only the home tile must show an enter button above exit.");
assert(source.includes('events/home-interior.jpg') && worker.includes('art/v2-style/map-test/events/home-interior.jpg'), "Entering home must show the supplied interior art, including offline cache.");
assert(html.includes('id="tileEventInheritance"') && source.includes('el.eventInheritance.hidden = false') && source.includes('V2HomeInheritance.open()'), "The home interior must open the inheritance board.");
assert(html.includes('id="tileEventPray"') && html.includes('id="tileEventPrayerResult"') && html.includes('id="tileEventContaminationChange"') && source.includes('activeEventTileId !== "unknown"') && source.includes('result === 6') && source.includes('result >= 4') && source.includes('contaminationDelta = -5') && source.includes('contaminationDelta = -3') && source.includes('contaminationDelta = 1') && source.includes('host.dataset.result = delta === -5 ? "great-blessing"') && source.includes('globalThis.V2WorldTreePrayerDigits.src') && source.includes('WORLD_TREE_PRAYER_KEY'), "World tree prayer must roll a die and render +5/+3/-1 with the supplied custom digit sprite.");
assert(html.includes('id="homeInheritanceOverlay"') && html.includes('id="homeInheritanceCards"') && worker.includes('events/inheritance-board.png'), "The two-panel inheritance image and rising owned cards must be available on the map.");
assert(css.includes('enter-parchment.png') && css.includes('bottom: 29%') && css.includes('.tile-event-enter[hidden]'), "Home enter must use a different supplied parchment button above exit.");
assert(html.includes('href="v2-tile-practice.html"') && worker.includes('v2-tile-practice.html'), "The dedicated tile test must be reachable from the map.");
assert(css.includes('.tile-event-overlay { position: absolute; z-index: 40; inset: 0; background: transparent; }') && css.includes('exit-parchment.png'), "Tile events must not dim the map and must use the cropped exit parchment.");
assert(source.includes('village: 1280 / 956') && source.includes('fitTileEventScene()') && css.includes('right: 1%; bottom: 7%'), "All tile scenes must fit their source aspect ratio and place exit over the bottom-right watermark.");
assert(worker.includes('art/v2-style/map-test/events/exit-parchment.png'), "The parchment exit button must be cached.");
assert(html.includes('id="mapBookButton"') && html.includes('id="mapBookImage"'), "The lower-left book button must be present on the board.");
assert(html.includes('id="mapBookRoster"') && source.includes('setBookVisual(true)') && source.includes('map-book-${isOpen ? "open" : "closed"}.png'), "The book button must show owned cards and toggle between its two images.");
assert(css.includes('z-index: 50; left: 1%; bottom: 5%') && !css.includes('.map-board.is-tile-event-open .map-book-button'), "The book button must sit slightly raised in the lower-left above other tile scenes.");
assert(css.includes('width: 11.5%; aspect-ratio: 1') && css.includes('.map-board.is-deck-selecting .map-book-button'), "The book must be larger but inaccessible during monster deck selection.");
assert(source.includes('forceCloseBookRoster();') && source.includes('async function animateBookCards(outward)') && source.includes('delay: (outward ? index : cards.length - 1 - index) * 55'), "Cards must leave and return to the book one by one.");
assert(source.includes('el.bookButton.offsetLeft') && source.includes('translateX(${bookExitX - cardX}px)') && !source.includes('const book = el.bookButton.getBoundingClientRect()'), "Book cards must slide sideways from the book in board-local coordinates.");
assert(css.includes('.map-deck-roster.map-book-roster button.is-inspecting') && css.includes('translateY(-22%)') && source.includes('clearBookSelection()'), "Book cards must rise slightly on selection and lower on deselection.");
assert(html.includes('id="mapUnitInfoOverlay"') && html.includes('class="map-unit-info-panel"') && !html.includes('class="legion-info-panel"'), "Only the basic unit information window should appear in the map center.");
assert(css.includes('.map-unit-info-overlay { position: absolute; z-index: 60; inset: 0; display: grid; place-items: center; }') && source.includes('openBookUnitInfo(ownedUnits.get(owned.instanceId))'), "Selecting an owned card must open centered instance-based information.");
assert(html.includes('v2-design-data.js?v=1') && html.includes('v2-rules.js?v=7') && source.includes('normalizeOwnedUnit(V2Rules.individual(slug))'), "Owned-card stats and brands must use battle rules.");
assert(battleSource.includes('V2RunStateRuntime?.snapshot') && battleSource.includes('V2RunStateRuntime.applyBattleOutcome') &&
  battleSource.includes('mapOwnedRoster.get(data.instanceId)') && battleSource.includes('mapOwnedRoster.get(unitState.instanceId)'),
  "Battle must restore instanceId-based cards from RunState and atomically persist battle outcomes.");
assert(source.includes('x: 20 + index * (70 / 7), y: 12') && source.includes('x: 79 - index * (58 / 6), y: 85') && source.includes('x: 6, y: 69 - index * (54 / 4)'), "The top tiles must shift right and one bottom tile must move up the left edge.");
assert(!css.includes('.map-tile.is-bottom-row') && source.includes('button.className = "map-tile"'), "Bottom tiles must have the same size as every other map tile.");
for (const file of ['map-book-closed.png', 'map-book-open.png']) {
  const relative = `art/v2-style/ui/${file}`;
  assert(fs.existsSync(path.join(root, relative)), `Book button asset is missing: ${relative}`);
  assert(worker.includes(relative), `Book button asset is not cached: ${relative}`);
}
const rosterSource = source.slice(source.indexOf('  function renderDeckSelection('), source.indexOf('  function renderBookRoster('));
assert(rosterSource.length > 0 && !rosterSource.includes('document.createElement("b")'), "Selected roster cards must not show numbered badges; reward cards may show a new badge.");
assert(css.includes("translateY(-22%)") && css.includes("width: 68%"), "Selected cards must rise and the roster must cluster on the left.");
assert(source.includes('el.board.classList.add("is-deck-selecting")') && css.includes('.map-board.is-deck-selecting .map-tile .step { opacity: 0; }'), "Map tile step badges must be hidden behind deck cards.");
assert(source.includes('1: [100], 2: [35, 65], 3: [20, 33, 47], 4: [15, 20, 27, 38]'), "Placement targeting rates are missing.");
assert(source.includes('rate.textContent = `피격 ${TARGET_RATES[selectedDeck.length][index]}%`') && css.includes('.map-target-rate'), "Each selected card must show its targeting rate.");
assert(source.includes('V2Sfx.play("diceTick"') && source.includes('V2Sfx.play("diceLand"') && source.includes('V2Sfx.play("move"'), "Map dice and movement sounds are missing.");
for(const sound of ['dice-tick.ogg','dice-land.ogg','move.ogg'])assert(worker.includes(`assets/sfx/${sound}`),`Map sound is not cached: ${sound}`);
assert(source.includes("requestedMapId") && source.includes('document.querySelector(`[data-map="${activeMapId}"]`)'), "Returning from battle must restore the selected map region.");
const navigation = [];
const selectedIds = ["unit-a", "unit-b", "unit-c", "unit-d"];
const ownedUnits = new Map([
  ["unit-a", { instanceId: "unit-a", slug: "death-knight" }],
  ["unit-b", { instanceId: "unit-b", slug: "ghoul" }],
  ["unit-c", { instanceId: "unit-c", slug: "hydra" }],
  ["unit-d", { instanceId: "unit-d", slug: "siren" }]
]);
const battleLinkContext = {
  activeMapId: "winter", battleStep: 7, battleTileType: "rare-monster", contamination: 42,
  selectedDeck: selectedIds, ownedUnits, currentTiles: [], URLSearchParams, saveMapLayout() {},
  el: { deckConfirm: {}, deckStatus: {} },
  window: { location: { assign: url => navigation.push(url) } }
};
const battleLinkSource = source.slice(source.indexOf("  async function confirmMonsterBattle("), source.indexOf("  function openTileEvent("));
vm.createContext(battleLinkContext);
vm.runInContext(battleLinkSource, battleLinkContext);
await vm.runInContext("confirmMonsterBattle()", battleLinkContext);
assert(navigation.length === 1 && navigation[0].startsWith("v2-auto-battle-practice.html?"), "Battle navigation must open the V2 auto battle page.");
const battleParams = new URLSearchParams(navigation[0].split("?")[1]);
assert(battleParams.get("from") === "map" && battleParams.get("map") === "winter" && battleParams.get("tile") === "7", "Battle navigation must preserve map and tile context.");
assert(battleParams.get("allies") === "death-knight,ghoul,hydra,siren" && battleParams.get("allyIds") === selectedIds.join(","), "Battle navigation must preserve ordered slugs and instance ids.");
assert(battleParams.get("encounterType") === "rare-monster" && battleParams.get("contamination") === "42" && battleParams.get("encounter"), "Battle navigation must preserve encounter type, contamination, and unique encounter id.");
const hero = "art/v2-style/map-test/hero/necromancer-hero.png";
assert(fs.existsSync(path.join(root, hero)), "Processed hero token is missing.");
assert(worker.includes(hero), "Hero token is not cached.");
console.log("SUCCESS: landscape map, dice roll, hero token, and step movement checks passed.");

})().catch((error) => { console.error(error); process.exitCode = 1; });
