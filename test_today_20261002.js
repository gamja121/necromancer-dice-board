"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const read = (file) => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

const index = read("index.html");
const launch = read("launch.js");
assert(launch.includes('requestFullscreen({navigationUI:"hide"})'), "Title screen must request browser fullscreen from a user gesture");
const introHtml = read("v2-intro.html");
const introCss = read("v2-intro.css");
const introJs = read("v2-intro.js");
const battle = read("v2-auto-battle-practice.js");
const battleHtml = read("v2-auto-battle-practice.html");
const battleCss = read("v2-auto-battle-practice.css");
const cards = read("v2-unit-cards.js");
const heal = read("v2-heal-effect.js");
const map = read("v2-map-practice.js");
const mapHtml = read("v2-map-practice.html");
const mapCss = read("v2-map-practice.css");
const eventHtml = read("v2-event-lab.html");
const eventCss = read("v2-event-lab.css");
const eventJs = read("v2-event-lab.js");
const eventLabData = read("v2-event-lab-data.js");
const music = read("v2-music.js");
const sfx = read("v2-sfx.js");
const worker = read("service-worker.js");
const workflow = read(".github/workflows/verify-and-deploy.yml");

// Title test menu.
assert(index.includes("TEST MENU"));
for (const href of [
  "v2-map-practice.html",
  "v2-auto-battle-practice.html",
  "v2-auto-battle-practice.html?test=undead-heal",
  "v2-animation-practice.html",
  "v2-event-lab.html",
  "v2-tile-practice.html",
  "v2-image-test.html",
  "v2-sfx-sampler.html"
]) assert(index.includes(href), "Missing test menu link: " + href);
assert(launch.includes("testLinks.forEach"));
assert(launch.includes('fadeTo("v2-intro.html")'), "New Game must enter the prologue before the map");
assert(introHtml.includes('art/v2-style/event-portraits/necromancer.png?v=2'), "Prologue must keep a visible protagonist fallback while HD chunks load");
assert(introHtml.includes('art/v2-style/event-portraits/knight-commander.png?v=2'), "Prologue must keep a visible commander fallback while HD chunks load");
assert(introJs.includes('loadChunkImage(heroImg, heroChunks'), "Prologue must reconstruct the protagonist HD portrait from chunk data");
assert(introJs.includes('data:image/webp;base64,'), "Prologue must reconstruct the commander HD portrait from chunk data");
assert(introHtml.includes('art/v2-style/ui/intro-dialogue-box.webp?v=6'));
assert(introHtml.includes('쿵쾅쾅.'));
assert(introJs.includes('{ speaker: "주인공", text: "..." }'));
assert(!introJs.match(/speaker: "주인공", text: "(?!\.\.\.)/), "Every protagonist dialogue line must stay silent");
assert(introJs.includes('오늘부터 네게 외곽 순찰 임무를 맡기겠다.'));
assert(introJs.includes('location.href = "v2-map-practice.html"'));
assert(introCss.includes(".dialogue-box"), "Dialogue UI must render over the parchment frame");
assert(introHtml.includes('v2-landscape.js?v=3'), "Prologue should use the fullscreen gesture helper");
assert(introJs.includes('loadChunkImage(commanderImg, commanderChunks'), "Prologue must reconstruct the commander HD portrait from chunk data");
assert(introJs.includes('loadChunkImage(frameImg, frameChunks'), "Prologue must reconstruct the visible parchment frame from chunk data");
assert(introCss.includes("@media (orientation:portrait)"), "Prologue needs portrait-to-landscape CSS fallback");
assert(introHtml.includes('class="intro-canvas"'), "Prologue must render inside a fixed landscape canvas");
assert(!introHtml.includes('introLandscapeHint'), "Prologue must not show a rotate-device hint");
assert(introCss.includes("aspect-ratio:16/9"), "Prologue canvas must stay 16:9");
assert(introCss.includes(".portrait-right{right:1%;width:46%;height:78%;overflow:visible;z-index:4}"), "HD commander must render large on the right");
assert(!introJs.includes("ensureLandscape()"), "Prologue must not request device rotation");
assert(introJs.includes('portrait.classList.toggle("is-speaking", portrait.dataset.speaker === line.speaker)'), "Speaker line must activate only its matching portrait");
assert(introJs.includes('if (line.speaker === "시스템") portraits.forEach((portrait) => portrait.classList.remove("is-speaking"));'), "System line must hide all portraits");
assert(introCss.includes(".portrait-left:not(.is-speaking){opacity:0;visibility:hidden}"), "Inactive protagonist portrait must stay hidden");
assert(introCss.includes(".portrait-left.is-speaking{opacity:1;visibility:visible}"), "Active protagonist portrait must be visible");
assert(introCss.includes(".portrait-right:not(.is-speaking){opacity:0;visibility:hidden}"), "Inactive commander portrait must stay hidden");
assert(introCss.includes(".portrait-right.is-speaking{opacity:1;visibility:visible}"), "Active commander portrait must be visible");
assert(introCss.includes("rotate(90deg)"), "Portrait phones must render the intro as a CSS-rotated landscape canvas");
assert(introHtml.includes('intro-dialogue-box.webp?v=6'), "Prologue must show the parchment dialogue frame");

// Rotated-mobile card placement.
assert(cards.includes("offsetLeft") && cards.includes("offsetParent"));
assert(!cards.includes("anchor.getBoundingClientRect()"));
assert(battleCss.includes("translate: -50% 16px"));
assert(battleHtml.includes("v2-unit-cards.js?v=27"));

// Healing.
assert(heal.includes("heal-cross.png?v=1"));
assert(battle.includes("V2HealEffect.playUnit(spriteWrap, amount)"));
assert(battleHtml.includes("v2-heal-effect.js?v=1"));
assert(battle.includes('battleQuery.get("test") === "undead-heal"'));
assert(battle.includes('"skeleton-spear", "skeleton-archer", "skeleton-cavalry", "grave-priest"'));
assert(mapCss.includes("animation:fullHealGreenFlash 420ms ease-out both"));

// Tile event frame.
assert(map.includes("const WORLD_TREE_EVENT_RATIO = 16 / 9"));
assert(mapCss.includes("object-fit: cover"));

// Audio options.
assert(mapHtml.includes('id="mapOptionsButton"'));
assert(mapHtml.includes('id="mapAudioOptions"'));
assert(mapHtml.includes('id="mapBgmToggle"') && mapHtml.includes('id="mapSfxToggle"'));
assert(music.includes("bgmEnabled") && music.includes("setEnabled") && music.includes("isEnabled"));
assert(sfx.includes("sfxEnabled") && sfx.includes("if (!current.enabled) return false"));
assert(mapHtml.includes("v2-music.js?v=3") && mapHtml.includes("v2-sfx.js?v=4"));
assert(battleHtml.includes("v2-music.js?v=3") && battleHtml.includes("v2-sfx.js?v=4"));
assert(music.includes("necromancer-v2-music-map-position"));
assert(map.includes('V2Music.handoff("battle")'));
assert(battle.includes('V2Music.handoff("map")'));

// Swamp damage and live info.
const swampStart = map.indexOf("async function applyPollutedSwamp");
const swampEnd = map.indexOf("function addOwnedUnit", swampStart);
const swamp = map.slice(swampStart, swampEnd);
assert(swamp.includes("if (hp <= 1)"));
assert(swamp.includes("unit.currentHp = 1"));
assert(swamp.includes("unit.currentHp = hp - 1"));
assert(!swamp.includes("ownedUnits.delete"));
assert(swamp.includes('await saveOwnedRoster("polluted-swamp")'));
assert(map.includes("playSwampDamageEffect()"));
assert(mapHtml.includes("swamp-damage-minus1.svg?v=1"));
assert(mapCss.includes("@keyframes hero-swamp-hit"));
assert(mapCss.includes("@keyframes swamp-minus-one-pop"));
assert(map.includes("function refreshOpenBookUnitInfo()"));

// Effective map stats, including prophecy.
assert(map.includes("function mapEffectiveUnitStats(unit)"));
assert(map.includes("unit.maxHp + hpBonus"));
assert(map.includes("unit.attack + attackBonus"));
assert(map.includes("unit.speed + speedBonus"));
assert(map.includes("refreshOpenBookUnitInfo();\n    return stack;"));
assert(map.includes('window.addEventListener("v2-roster-changed"'));

// Completed lap contamination.
assert(map.includes("if (completedLap) {\n      addContamination(4);"));

// Enemy count rules.
assert(map.includes('{ id: "graveyard", name: "공동묘지 타일", count: 1 }'));
assert(map.includes('{ id: "forest", name: "언덕 타일", count: 1 }'));
assert(map.includes('{ id: "monster", name: "일반 마물 타일", count: 3 }'));
assert(map.includes('{ id: "swamp", name: "오염된 늪지대", count: 2 }'));
assert(map.includes("function currentEncounterLoop()"));
assert(map.includes("if (loop <= 2) return 1;"));
assert(map.includes("const minimum = 2;"));
assert(map.includes('loop: String(currentEncounterLoop())'));
assert(map.includes("const count = constrainedEncounterCount(rolledCount);"));
assert(battle.includes('const mapLoop = Math.max(1, Math.floor(Number(battleQuery.get("loop")) || 1));'));
assert(battle.includes("function constrainedMapEnemyCount(requestedCount)"));
assert(battle.includes("if (mapLoop <= 2) return 1;"));
assert(battle.includes("const minimum = 2;"));
assert(battle.includes("const count = constrainedMapEnemyCount(rolledCount);"));
assert(battle.includes("constrainedMapEnemyCount(mimicCount)"));

// Current cache/version wiring.
assert(mapHtml.includes("v2-map-practice.js?v=20261007-event-board-drop-v1"));
assert(mapCss.includes("z-index:120"), "Map options button must stay above map UI");
assert(battleHtml.includes("v2-auto-battle-practice.js?v=136"));
for (const required of [
  "./v2-intro.html",
  "./v2-intro.css?v=15",
  "./v2-intro.js?v=9",
  "./art/v2-style/event-portraits/necromancer.png?v=2",
  "./assets/intro-data/hero/part-000.txt",
  "./assets/intro-data/hero/part-002.txt",
  "./assets/intro-data/frame/part-000.txt",
  "./assets/intro-data/frame/part-001.txt",
  "./assets/intro-data/frame-v2/part-000.txt",
  "./assets/intro-data/frame-v2/part-007.txt",
  "./art/v2-style/event-portraits/knight-commander.png?v=2",
  "./assets/intro-data/commander/part-000.txt",
  "./assets/intro-data/commander/part-014.rev.txt",
  "./art/v2-style/ui/intro-dialogue-box.webp?v=6",
  "./v2-map-practice.js?v=20261007-event-board-drop-v1",
  "./v2-auto-battle-practice.js?v=136",
  "./v2-heal-effect.js?v=1",
  "./v2-music.js?v=3",
  "./v2-sfx.js?v=4",
  "./art/v2-style/ui/map-options-button.webp?v=1",
  "./art/v2-style/ui/swamp-damage-minus1.svg?v=1",
  "./v2-animation-practice.html",
  "./v2-event-lab.html",
  "./v2-tile-practice.html",
  "./assets/music/map-board.mp3",
  "./assets/music/battle.mp3"
]) assert(worker.includes(required), "Missing current cache entry: " + required);

assert(workflow.includes("cancel-in-progress: true"));
console.log("PASS: 2026-10-02 current regression checks.");

assert(!/(^|\\n)\\.map-options-button\\s*\\{\\s*visibility:\\s*hidden;\\s*\\}/.test(mapCss));
assert(mapCss.includes(".map-board.is-tile-event-open .map-options-button { visibility: hidden; }"));
assert(mapHtml.includes("v2-map-practice.css?v=20261007-event-board-drop-v1"));
assert(worker.includes("./v2-map-practice.css?v=20261007-event-board-drop-v1"));
assert(mapHtml.includes('id="villageDioramaTestButton"'));
assert(mapHtml.includes('id="villageDioramaTest"'));
assert(mapHtml.includes("village-building-01.webp?v=20261005-graveyard-poster-stage17-1"));
assert(worker.includes("./art/v2-style/map-test/diorama/village-building-01.webp?v=20261005-graveyard-poster-stage17-1"));
assert(mapHtml.includes("village-building-02.webp?v=20261005-graveyard-poster-stage17-1"));
assert(worker.includes("./art/v2-style/map-test/diorama/village-building-02.webp?v=20261005-graveyard-poster-stage17-1"));
assert(mapHtml.includes("village-building-03.webp?v=20261005-graveyard-poster-stage17-1"));
assert(worker.includes("./art/v2-style/map-test/diorama/village-building-03.webp?v=20261005-graveyard-poster-stage17-1"));
assert(mapHtml.includes("village-building-04.webp?v=20261005-graveyard-poster-stage17-1"));
assert(worker.includes("./art/v2-style/map-test/diorama/village-building-04.webp?v=20261005-graveyard-poster-stage17-1"));
assert(mapHtml.includes("village-building-05.webp?v=20261005-graveyard-poster-stage17-1"));
assert(worker.includes("./art/v2-style/map-test/diorama/village-building-05.webp?v=20261005-graveyard-poster-stage17-1"));
assert(mapHtml.includes("village-building-06.webp?v=20261005-graveyard-poster-stage17-1"));
assert(worker.includes("./art/v2-style/map-test/diorama/village-building-06.webp?v=20261005-graveyard-poster-stage17-1"));
assert(map.includes('img.naturalWidth > 0 && img.naturalHeight > 0'));
assert(mapHtml.includes("village-building-image"));
assert(mapHtml.includes("village-layout-hint"));
assert(map.includes("enableVillageBuildingDragging"));
assert(map.includes("selectVillageBuilding"));
assert(map.includes("resizeSelectedVillageBuilding"));
assert(map.includes("changeSelectedVillageBuildingLayer"));
assert(map.includes("saveVillageLayout"));
assert(map.includes("loadVillageLayout"));
assert(map.includes("resetVillageLayout"));
assert(map.includes("getVillageLayoutExportData"));
assert(map.includes("copyVillageLayoutExport"));
assert(mapHtml.includes("data-village-layout-copy"));
assert(mapHtml.includes("id=\"villageLayoutExport\""));
assert(map.includes("VILLAGE_LAYOUT_STORAGE_KEY"));
assert(mapHtml.includes("data-village-layout-save"));
assert(mapHtml.includes("data-village-layout-reset"));
assert(mapHtml.includes("data-village-layer=\"-1\""));
assert(mapHtml.includes("data-village-layer=\"1\""));
assert(mapHtml.includes("data-village-size=\"-1\""));
assert(mapHtml.includes("data-village-size=\"1\""));
assert(map.includes("pointerdown"));
assert(map.includes("pointermove"));
assert(map.includes('building.style.bottom = "auto"'));

assert(battle.includes('makeState(data, "enemy", 3 - index)'));
assert(!battle.includes('makeState(data, "enemy", index)'));
assert(battleHtml.includes("v2-auto-battle-practice.js?v=136"));
assert(worker.includes("./v2-auto-battle-practice.js?v=136"));

const rulesSource = read("v2-rules.js");
const brandCardsSource = read("v2-brand-cards.js");
const homeInheritanceSource = read("v2-home-inheritance.js");
assert(rulesSource.includes("function normalizeUnitBrands(unit)"));
assert(rulesSource.includes("function inheritedBlessing(receiver,source)"));
assert(rulesSource.includes("const cursedFace=brands.some"));
assert(brandCardsSource.includes("function blessingOnly(brand)"));
assert(homeInheritanceSource.includes('inheritedPart = "bless"'));
assert(mapHtml.includes("v2-rules.js?v=9"));
assert(mapHtml.includes("v2-brand-cards.js?v=6"));
assert(mapHtml.includes("v2-home-inheritance.js?v=16"));
assert(battleHtml.includes("v2-rules.js?v=9"));
assert(worker.includes("./v2-rules.js?v=9"));
assert(worker.includes("./v2-brand-cards.js?v=6"));
assert(worker.includes("./v2-home-inheritance.js?v=16"));

const runtimePolicySource = read("v2-run-state-runtime.js");
assert(runtimePolicySource.includes("function normalizePolicyState(state)"));
assert(runtimePolicySource.includes("function normalizePolicyBrandCard(card)"));
assert(runtimePolicySource.includes('"brand-policy-migration-v1"'));
assert(runtimePolicySource.includes("normalizePolicyState(draft)"));
assert(runtimePolicySource.includes("state.graveyardCorpses = state.graveyardCorpses.map(normalizePolicyUnit)"));
assert(runtimePolicySource.includes("curse: []"));
assert(mapHtml.includes("v2-run-state-runtime.js?v=8"));
assert(battleHtml.includes("v2-run-state-runtime.js?v=8"));
assert(mapHtml.includes("v2-altar-ritual.js?v=5"));
assert(worker.includes("./v2-run-state-runtime.js?v=8"));
assert(worker.includes("./v2-altar-ritual.js?v=5"));

assert(rulesSource.includes("u.brands=normalizeUnitBrands(u)"));

assert(runtimePolicySource.includes("state.battle.state.units = state.battle.state.units.map(normalizePolicyUnit)"));

assert(battle.includes('phase !== "capture-failed"'), "Final capture failure must not queue another resumable battle checkpoint");
assert(battle.includes('V2RunStateRuntime.clearBattleCheckpoint("returning", "capture-failed-clear")'), "Final capture failure must clear the resumable battle checkpoint");
assert(battle.includes("Promise.race([") && battle.includes("wait(1200)"), "Map return must not wait forever on runtime flush");

assert(read("manifest.webmanifest").includes('"orientation": "any"'), "Manifest must allow any device orientation");

assert(read("manifest.webmanifest").includes('"display": "fullscreen"'), "Installed app must launch without browser chrome");

assert(read("launch.js").includes("openGameFrame(href)"), "Game screens must load inside the fullscreen title shell");
assert(read("launch.css").includes(".game-frame"), "Fullscreen game shell iframe styles are missing");

assert(!mapHtml.includes("village-building-sheet"));
assert(!worker.includes("village-buildings-test.webp"));

assert(mapCss.includes(".village-building-2{left:36.7616%;top:4.68316%;bottom:auto;width:13%;z-index:1}"));
assert(mapCss.includes(".village-building-3{left:26.4165%;top:7.96152%;bottom:auto;width:18%;z-index:1}"));
assert(mapCss.includes(".village-building-4{left:32.0812%;top:15.3139%;bottom:auto;width:23%;z-index:4}"));
assert(mapCss.includes(".village-building-5{left:47.9677%;top:.462961%;bottom:auto;width:23%;z-index:2}"));
assert(mapCss.includes(".village-building-6{left:55.4649%;top:1.2037%;bottom:auto;width:27.5%;z-index:2}"));

assert(mapHtml.includes('data-village-id="T1"'));
assert(mapHtml.includes('data-village-id="T4"'));
assert(mapHtml.includes("data-village-flip"));
assert(mapHtml.includes("data-village-item-toggle"));
assert(map.includes("ensureVillageTreeAssets"));
assert(map.includes("flipSelectedVillageItem"));
assert(map.includes('flipX: item.classList.contains("is-layout-flipped")'));
assert(map.includes('hidden: item.classList.contains("is-debug-hidden")'));
assert(mapCss.includes(".village-layout-item.is-layout-flipped{--layout-flip:-1}"));

assert(mapHtml.includes('data-village-id="B3" data-village-type="building" data-default-hidden="false" data-default-flip="true"'));
assert(mapHtml.includes('data-village-id="T1" data-village-type="tree" data-default-hidden="false" data-default-flip="false"'));
assert(mapHtml.includes('data-village-id="T4" data-village-type="tree" data-default-hidden="true" data-default-flip="false"'));
assert(mapCss.includes(".village-building-4{left:32.0812%;top:15.3139%;bottom:auto;width:23%;z-index:4}"));
assert(mapCss.includes(".village-tree-1{left:71.9087%;top:31.1458%;bottom:auto;width:12%;z-index:4}"));
assert(mapCss.includes(".village-tree-2{left:44.6792%;top:14.7396%;bottom:auto;width:11%;z-index:2}"));
assert(mapCss.includes(".village-tree-3{left:23.1831%;top:17.6837%;bottom:auto;width:14%;z-index:3}"));
assert(map.includes('item.dataset.defaultFlip === "true"'));
assert(map.includes('item.dataset.defaultHidden === "true"'));

assert(mapHtml.includes('id="graveyardDioramaTestButton"'));
assert(mapHtml.includes('id="graveyardDioramaTest"'));
assert(mapHtml.includes('id="graveyardAtlasProbe"'));
assert((mapHtml.match(/data-graveyard-id="/g) || []).length === 14);
assert(mapCss.includes(".graveyard-layout-stage"));
assert(mapCss.includes(".graveyard-sprite-m1 .graveyard-item-visual{background-position:0% 0%}"));
assert(mapCss.includes(".graveyard-sprite-c1 .graveyard-item-visual{background-position:33.333333% 100%}"));
assert(map.includes("function openGraveyardDioramaTest"));
assert(map.includes("function closeGraveyardDioramaTest"));
assert(map.includes("width === 1536 && height === 1260"));

assert(mapHtml.includes('id="graveyardLayerDebug"'));
assert((mapHtml.match(/class="graveyard-layout-item/g)||[]).length===14);
assert(map.includes("enableGraveyardDragging"));
assert(map.includes("saveGraveyardLayout"));
assert(map.includes("copyGraveyardLayoutExport"));
assert(map.includes("GRAVEYARD_LAYOUT_STORAGE_KEY"));
assert(mapCss.includes(".graveyard-layout-item.is-layout-flipped"));

assert(mapHtml.includes('data-graveyard-id="G1"'));
assert(mapHtml.includes('style="left:39.5278%;top:11.2138%;bottom:auto;width:25%;z-index:8"'));
assert(mapHtml.includes('data-graveyard-id="T2"'));
assert(mapHtml.includes('data-default-flip="true"'));
assert(map.includes('necromancer-dice-graveyard-layout-v3'));
assert(map.includes('item.dataset.defaultWidth||""'));

assert(mapCss.includes(".map-board.is-graveyard-zooming"));
assert(mapCss.includes(".map-board.is-graveyard-tilted"));
assert(mapCss.includes("rotateX(67deg)"));
assert(map.includes("graveyardDioramaTimers"));
assert(map.includes('el.board.classList.add("is-graveyard-zooming")'));
assert(map.includes('el.board.classList.add("is-graveyard-tilted")'));
assert(map.includes('el.board.classList.add("is-graveyard-props")'));

assert(mapHtml.includes('data-graveyard-editor-collapse'));
assert(mapHtml.includes('id="graveyardEditorReopen"'));
assert(mapCss.includes(".graveyard-layer-debug.is-collapsed"));
assert(mapCss.includes(".graveyard-editor-reopen"));
assert(map.includes("function setGraveyardEditorCollapsed"));

assert(mapHtml.includes('data-graveyard-id="M1"') && mapHtml.includes('data-default-left="30.729%"'));
assert(mapHtml.includes('data-graveyard-id="M2"') && mapHtml.includes('data-default-z="0"'));
assert(mapHtml.includes('data-graveyard-id="T1"') && mapHtml.includes('data-default-bottom=""'));
assert(mapHtml.includes('data-graveyard-id="H2"') && mapHtml.includes('data-default-width="12%"'));
assert(map.includes('item.dataset.defaultBottom||""'));

// Event Lab is isolated from production data and now contains one layered cemetery test event.
assert(eventLabData.includes('id: "graveyard_child_ambush_lab_01"'));
assert(eventLabData.includes('tags: Object.freeze(["사건", "공동묘지", "습격받는아이"])'));
assert(eventLabData.includes('description: "공동묘지 안쪽에서 길을 잃은 듯한 아이를 발견했다."'));
assert(eventLabData.includes('text: "…도와주세요!"'));
assert(eventHtml.includes('id="eventBaseImage"'));
assert(eventHtml.includes('id="eventGhoulLayer"'));
assert(eventHtml.includes('id="eventDialogue"'));
assert(eventHtml.includes('id="eventChoices"'));
assert(eventHtml.includes("intro-dialogue-box.webp?v=6"));
assert(eventHtml.includes('class="event-info-shell"'));
assert(eventHtml.includes('class="event-info-frame" src="art/v2-style/ui/intro-dialogue-box.webp?v=6"'));
assert(eventCss.includes(".event-info-shell"));
assert(eventCss.includes(".event-info-frame"));
assert(eventJs.includes("BASE_IMAGE_CHUNKS"));
assert(eventJs.includes("GHOUL_IMAGE_CHUNKS"));
assert(eventJs.includes("loadChunkImage"));
assert(eventJs.includes("removeBlackBackground"));
assert(eventJs.includes("loadGhoulLayer"));
assert(eventJs.includes('screen.orientation.lock("landscape")'));
assert(eventJs.includes("revealGhoul"));
assert(eventJs.includes("showDialogue"));
assert(eventJs.includes("showChoices"));
assert(eventCss.includes(".event-ghoul-layer"));
assert(eventCss.includes("mix-blend-mode:normal!important"));
assert(eventCss.includes("@keyframes ghoul-layer-lunge-landscape"));
assert(eventCss.includes(".event-dialogue-box"));
assert(eventCss.includes(".event-tags"));
assert(eventCss.includes("Landscape-only Event Lab · stage 3"));
assert(eventCss.includes("@media (orientation:portrait)"));
assert(eventCss.includes("transform:rotate(90deg) translateY(-100%)"));
assert(eventCss.includes("bottom:7%!important"));
assert(eventCss.includes("width:58%!important"));
assert(eventCss.includes("Event Lab cinematic gaze direction · stage 4"));
assert(eventCss.includes("@keyframes event-camera-child-focus"));
assert(eventCss.includes("@keyframes event-camera-threat-focus"));
assert(eventCss.includes("@keyframes event-camera-dialogue-focus"));
assert(eventCss.includes("@keyframes event-camera-impact"));
assert(eventCss.includes("@keyframes event-threat-flash"));

// Production map/battle event flow remains available outside Event Lab.
assert(battle.includes('const fromEvent = battleQuery.get("from") === "event"'));
assert(battle.includes("requestedEventEnemySlugs"));
assert(battle.includes('fromEvent && team === "enemy"'));
assert(battle.includes('EVENT_BATTLE_RESULT_KEY'));
assert(battle.includes('function returnToEvent'));
assert(battle.includes('if (fromEvent) {'));
assert(battleHtml.includes('v2-auto-battle-practice.js?v=136'));

assert(map.includes("void openGraveyardStoryEvent();"));
assert(map.includes("function startGraveyardEventBattle"));
assert(map.includes('eventReturn: "map-graveyard"'));
assert(battle.includes('eventReturnTarget === "map-graveyard"'));
assert(battle.includes('resumeGraveyardEvent: "1"'));

// Empty Event Lab files must be available offline.
assert(worker.includes("./v2-event-lab.html"));
assert(worker.includes("./v2-event-lab.css?v=20261005-event-lab-map-link-stage7"));
assert(worker.includes("./v2-event-lab.js?v=20261005-event-lab-map-link-stage7"));
assert(worker.includes("./v2-event-lab-data.js?v=20261005-event-lab-map-link-stage7"));

assert(worker.includes("./assets/event-lab/graveyard-child/base/part-000.txt"));
assert(worker.includes("./assets/event-lab/graveyard-child/ghoul/part-000.txt"));

assert(map.includes("GRAVEYARD_CHILD_EVENT_FLAG"));
assert(map.includes("launchGraveyardChildEventFromMap"));
assert(map.includes("async function launchGraveyardChildEventFromMap()"), "graveyard launch should not keep an unused step argument");
assert(!map.includes("launchGraveyardChildEventFromMap(step)"));
assert(map.includes('eventOpen = true;\n    activeEventTileId = "graveyard";'), "graveyard story must own interaction state");
assert(map.includes('if (activeEventTileId === "graveyard") activeEventTileId = null;'), "graveyard story must release its event state");
assert(map.includes('if (currentTiles[heroIndex]?.id === "graveyard")'));
assert(map.includes('if (tile.id === "graveyard")'));
assert(map.includes('if (tile.id === "graveyard") {\n          heroIndex = index;\n          placeHero(true);'), "graveyard direct click must move the hero before story launch");
assert(map.includes("function advanceMapLoop"));
assert(!mapHtml.includes('id="graveyardPosterEvent"'));
assert(!mapHtml.includes('id="tileStoryEventPanel"'));
assert(!map.includes("mapStoryEvents"));
assert(!map.includes("openGraveyardPosterEvent"));
assert(!mapCss.includes("graveyard-poster-"));
assert(!mapCss.includes(".tile-story-"));
assert(!worker.includes("./v2-event-data.js?v=1"));
assert(!worker.includes("./v2-map-events.js?v=1"));
assert(!fs.existsSync("v2-event-data.js"));
assert(!fs.existsSync("v2-map-events.js"));
assert(map.includes("completeGraveyardChildEvent"));
assert(map.includes('draft.party = selectedUnits.map((unit) => unit.instanceId)'));
assert(eventJs.includes("fromMapEvent"));
assert(eventJs.includes("resumeEventBattle"));
assert(eventJs.includes("startMapEventBattle"));
assert(eventJs.includes('eventReturn: "event-lab-map"'));
assert(eventJs.includes('enemies: "ghoul"'));
assert(eventJs.includes("showPostBattleEscape"));
assert(battle.includes('eventReturnTarget === "event-lab-map"'));
assert(battle.includes('event-battle-outcome:'));
assert(battle.includes('(fromMap || fromEvent) && selectedAllySlugs.length'));


assert(mapHtml.includes('id="graveyardStoryArtwork"'));
assert(mapHtml.includes('id="graveyardStoryGhoulLayer"'), "graveyard event must keep the ghoul as a separate reveal layer");
assert(mapHtml.includes('src="art/v2-style/map-test/events/graveyard-child-ghoul-event-v3.webp?v=2"'), "graveyard ghoul layer must preload the new event artwork");
assert(mapHtml.includes('id="graveyardStoryEffectText"'));
assert(mapHtml.includes('class="tile-event-enter graveyard-story-choice-button"'));
assert(mapHtml.includes('class="graveyard-story-frame" src="art/v2-style/ui/intro-dialogue-box.webp?v=6"'));
assert(map.includes("ensureGraveyardStoryArt"));
assert(map.includes('graveyardStoryGhoulLayer: document.getElementById("graveyardStoryGhoulLayer")'));
assert(map.includes('const GRAVEYARD_EVENT_BASE_ART ='));
assert(map.includes('"art/v2-style/map-test/events/graveyard-child-base-v3.webp?v=1"'));
assert(map.includes('const GRAVEYARD_EVENT_GHOUL_ART ='));
assert(map.includes('"art/v2-style/map-test/events/graveyard-child-ghoul-event-v3.webp?v=2"'), "graveyard story must use the new lunging ghoul artwork");
assert(!map.includes("GRAVEYARD_EVENT_GHOUL_CHUNKS"), "production story must not reconstruct the ghoul from text chunks");
assert(!map.includes("loadGraveyardGhoulSource"), "obsolete ghoul chunk loader must stay removed");
assert(!map.includes("ghoul-hq/part-"), "obsolete HQ chunk paths must stay removed");
assert(!map.includes("graveyard-child-ghoul-v2.webp"), "old low-quality graveyard ghoul path must stay removed");
assert(map.includes("setGraveyardGhoulVisible"));
assert(map.includes('animate: beat.id === "threat"'), "ghoul reveal animation must start on the threat beat");
assert(!map.includes("composeGraveyardLandscapeArtwork"), "runtime landscape compositor must stay removed");
assert(!map.includes("loadChunkedEventSource"), "old production chunk loader must stay removed");
assert(mapCss.includes("width:94%!important"), "graveyard artwork should fit inside the board frame");
assert(mapCss.includes("aspect-ratio:16 / 9!important"), "graveyard artwork must preserve the full 16:9 frame");
assert(mapCss.includes("object-fit:contain!important"), "graveyard artwork frame must never be cropped");
assert(mapCss.includes("left:4%!important"), "effect window should stay inside the artwork");
assert(mapCss.includes("width:20%!important"), "effect window should remain compact");
assert(mapCss.includes(".graveyard-story-ghoul-layer"));
assert(mapCss.includes("@keyframes graveyard-ghoul-reveal"));
assert(mapCss.includes("@keyframes graveyard-ghoul-idle"));
assert(mapCss.includes("left:55%!important"), "lunging ghoul must enter from the right-middle graveyard space");
assert(mapCss.includes("top:18%!important"), "lunging ghoul must sit above the foreground and reach toward the child");
assert(mapCss.includes("width:30%!important"), "new ghoul must be large enough to read as the threat");
assert(mapCss.includes("height:64%!important"), "new ghoul must retain its full lunging silhouette");
assert(mapCss.includes("image-rendering:auto!important"), "browser must use normal high-quality image resampling");
assert(mapCss.includes("scale(.86)"), "ghoul reveal must begin slightly recessed before lunging into place");
assert(mapCss.includes("top:39%!important"), "choice buttons must stay above the dialogue window");
assert(worker.includes("./art/v2-style/map-test/events/graveyard-child-base-v3.webp?v=1"));
assert(worker.includes("./art/v2-style/map-test/events/graveyard-child-ghoul-event-v3.webp?v=2"), "new graveyard ghoul artwork must be cached");
assert(!worker.includes("ghoul-hq/part-"), "obsolete reconstructed ghoul chunks must not be cached");
assert(!worker.includes("graveyard-child-ghoul-v2.webp"), "old low-quality ghoul must not be cached");
assert(map.includes("el.board.appendChild(el.graveyardStoryEvent)"));
assert(map.includes("await openGraveyardStoryEvent()"));
assert(!map.includes('window.location.assign("v2-event-lab.html?" + params.toString())'));
assert(mapCss.includes("Graveyard child story — canonical production layout"), "canonical cemetery story CSS missing");
assert(mapCss.includes(".graveyard-story-effect-box"));
assert(mapCss.includes(".graveyard-story-choice-button"));
assert(mapCss.includes("@keyframes graveyard-story-board-drop"), "event artwork must drop onto the board before settling");
assert(mapCss.includes("rotate(-7deg)") && mapCss.includes("rotate(2.5deg)") && mapCss.includes("rotate(0)"), "event artwork entrance must wobble and finish aligned");
assert(map.includes("function playGraveyardStoryBoardDrop()"), "production event must trigger the board-drop entrance");
assert(map.includes('classList.contains("is-board-drop-entering")'), "event taps must be ignored while the artwork is landing");
assert(mapCss.includes('graveyard-choice-parchment.webp?v=1'), "graveyard choices must use the extracted parchment button");
assert(mapCss.includes("aspect-ratio:744 / 294!important"), "graveyard choice button must preserve the source parchment ratio");
assert(worker.includes("./art/v2-style/ui/graveyard-choice-parchment.webp?v=1"), "graveyard parchment choice art must be cached");
assert(mapCss.includes(".map-board.is-story-event-open"));

assert(mapHtml.includes('class="graveyard-story-stage"'), "cemetery event should use one centered stage");
assert(mapCss.includes("left:8%!important;\n  right:8%!important;\n  bottom:2%!important;"), "graveyard dialogue must match intro dimensions");
assert(mapCss.includes("height:30%!important"), "graveyard dialogue height must match intro");
assert(mapCss.includes(".graveyard-story-event.has-dialogue .graveyard-story-dialogue"), "dialogue window must only appear on dialogue beats");
assert(mapCss.includes("background:transparent!important"), "cemetery artwork letterbox must stay transparent");

assert(!map.includes("loadGraveyardChildPortrait"), "old cemetery portrait loader must be removed");
assert(!map.includes("graveyardStoryPortraitImg"), "old cemetery portrait handle must be removed");
assert(!mapCss.includes(".graveyard-story-portrait"), "old cemetery portrait CSS must be removed");
assert(!mapCss.includes(".graveyard-story-child{"), "old inline child actor CSS must be removed");
assert(!worker.includes("dark-eyed-boy.png"), "unused cemetery portrait must not be precached");
assert(!worker.includes("event-child-idle-01.png"), "unused inline child actor must not be precached");

assert(!map.includes("installEventOptionShortcut"), "development shortcut must not remain in production map code");
assert(!mapCss.includes("map-event-option-row"), "development shortcut CSS must not remain");

// production event deep-link regression
assert(map.includes('mapLaunchParams.get("storyEvent") === "graveyard_child_ambush_01"'));

assert(battleHtml.includes('id="brandReferenceOverlay"'), "Battle must include one integrated brand reference board");
assert(battleHtml.includes('id="brandReferenceButton"'), "Battle must expose a manual pre-roll brand table button");
assert(battle.includes("buildBrandReferenceTable()"), "Battle must build the brand reference table from live units");
assert(battle.includes("brandReferenceInitialPending = true"), "Brand reference board must open once before the first roll");
assert(battle.includes("syncBrandReferenceButton()"), "Brand reference button visibility must follow pre-roll state");
assert(battleCss.includes(".brand-reference-grid"), "Brand reference board grid styles are missing");

assert(battle.includes('unitState.team === "ally" && unitState.alive && !unitState.isSummon'), "Dead allies must be removed from the brand reference");
assert(battle.includes('unitState.team === "enemy" && unitState.alive && !unitState.isSummon'), "Dead enemies must be removed from the brand reference");
