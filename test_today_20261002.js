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
const eventData = read("v2-event-data.js");
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
assert(mapHtml.includes("v2-map-practice.js?v=20261005-graveyard-stage5-approved-layout-1"));
assert(mapCss.includes("z-index:120"), "Map options button must stay above map UI");
assert(battleHtml.includes("v2-auto-battle-practice.js?v=131"));
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
  "./v2-map-practice.js?v=20261005-graveyard-stage5-approved-layout-1",
  "./v2-auto-battle-practice.js?v=131",
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
assert(mapHtml.includes("v2-map-practice.css?v=20261005-graveyard-stage5-approved-layout-1"));
assert(worker.includes("./v2-map-practice.css?v=20261005-graveyard-stage5-approved-layout-1"));
assert(mapHtml.includes('id="villageDioramaTestButton"'));
assert(mapHtml.includes('id="villageDioramaTest"'));
assert(mapHtml.includes("village-building-01.webp?v=20261005-graveyard-stage5-approved-layout-1"));
assert(worker.includes("./art/v2-style/map-test/diorama/village-building-01.webp?v=20261005-graveyard-stage5-approved-layout-1"));
assert(mapHtml.includes("village-building-02.webp?v=20261005-graveyard-stage5-approved-layout-1"));
assert(worker.includes("./art/v2-style/map-test/diorama/village-building-02.webp?v=20261005-graveyard-stage5-approved-layout-1"));
assert(mapHtml.includes("village-building-03.webp?v=20261005-graveyard-stage5-approved-layout-1"));
assert(worker.includes("./art/v2-style/map-test/diorama/village-building-03.webp?v=20261005-graveyard-stage5-approved-layout-1"));
assert(mapHtml.includes("village-building-04.webp?v=20261005-graveyard-stage5-approved-layout-1"));
assert(worker.includes("./art/v2-style/map-test/diorama/village-building-04.webp?v=20261005-graveyard-stage5-approved-layout-1"));
assert(mapHtml.includes("village-building-05.webp?v=20261005-graveyard-stage5-approved-layout-1"));
assert(worker.includes("./art/v2-style/map-test/diorama/village-building-05.webp?v=20261005-graveyard-stage5-approved-layout-1"));
assert(mapHtml.includes("village-building-06.webp?v=20261005-graveyard-stage5-approved-layout-1"));
assert(worker.includes("./art/v2-style/map-test/diorama/village-building-06.webp?v=20261005-graveyard-stage5-approved-layout-1"));
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
assert(battleHtml.includes("v2-auto-battle-practice.js?v=131"));
assert(worker.includes("./v2-auto-battle-practice.js?v=131"));

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

assert((eventData.match(/title: "습격받는 아이"/g)||[]).length===1);
assert(eventData.includes('id: "graveyard_child_ambush_01"'));
assert(eventData.includes('scene: "graveyard_child_ambush_intro"'));
assert(eventHtml.includes('id="eventScenePreview"'));
assert((eventHtml.match(/class="event-graveyard-prop event-graveyard-/g)||[]).length===14);
assert(eventHtml.includes('class="event-child-idle"'));
assert(eventCss.includes(".event-scene-preview"));
assert(eventCss.includes(".event-child-idle"));
assert(eventCss.includes('event-child-idle-01.png?v=20261005-graveyard-ambush-stage8-battle-return-1'));
assert(eventJs.includes('event.scene === "graveyard_child_ambush_intro"'));
assert(!eventHtml.includes('id="eventScene"'));
assert(!eventData.includes("graveyard_child_ambush_test_01"));

assert(!eventCss.includes("@keyframes eventChildIdle"));
assert(eventCss.includes("aspect-ratio:263/643"));

assert(eventCss.includes("@keyframes event-child-idle-breathe"));
assert(eventCss.includes("animation:event-child-idle-breathe 3.4s ease-in-out infinite"));
assert(eventCss.includes("@keyframes event-child-idle-shadow"));
assert(eventCss.includes("@media (prefers-reduced-motion:reduce)"));
assert(eventData.includes("구울이 묘비를 넘어 튀어나온다"));

{
  const start = eventData.indexOf('id: "graveyard_child_ambush_01"');
  const end = eventData.indexOf('id: "forest_child_01"', start);
  const ambush = eventData.slice(start, end);
  assert(ambush.includes('text: "아이를 구한다"'));
  assert(ambush.includes('text: "지나친다"'));
}

assert(eventHtml.includes('data-event-ghoul'));
assert(eventCss.includes('.event-ghoul{'));
assert(eventCss.includes('processed/192/ghoul.png'));
assert(eventCss.includes('@keyframes event-ghoul-approach'));
assert(eventCss.includes('@keyframes event-child-startle'));
assert(eventData.includes('구울이 묘비를 넘어 튀어나온다'));

assert(eventHtml.includes('class="event-dialogue-layer"'));
assert(eventHtml.includes('class="event-dialogue-portrait"'));
assert(eventHtml.includes('class="event-dialogue-box" id="eventDialogueAdvance"'));
assert(eventHtml.includes('class="event-dialogue-name">아이</span>'));
assert(eventCss.includes("@keyframes event-dialogue-box-rise"));
assert(eventCss.includes("@keyframes event-dialogue-portrait-in"));
assert(eventCss.includes("event-dialogue-portrait-in .66s"));
assert(eventCss.includes('event-child-idle-01.png?v=20261005-graveyard-ambush-stage8-battle-return-1'));

assert(eventHtml.includes('data-cinematic-choices'));
assert(eventJs.includes('function setCinematicChoiceReady'));
assert(eventJs.includes('eventDialogueAdvance?.addEventListener("click"'));
assert(eventCss.includes('.is-cinematic-choice-ready #choiceList'));
assert(eventData.includes('아이를 구하기 위해 구울 앞을 막아선다'));

assert(battle.includes('const fromEvent = battleQuery.get("from") === "event"'));
assert(battle.includes("requestedEventEnemySlugs"));
assert(battle.includes('fromEvent && team === "enemy"'));

assert(eventData.includes('graveyard_child_ambush_resolved'));
assert(eventJs.includes('EVENT_BATTLE_RESULT_KEY'));
assert(eventJs.includes('function consumeEventBattleResult'));
assert(eventJs.includes('graveyard_child_saved'));
assert(eventJs.includes('graveyard_child_rescue_failed'));
assert(battle.includes('EVENT_BATTLE_RESULT_KEY'));
assert(battle.includes('function returnToEvent'));
assert(battle.includes('사건으로 돌아가기'));
assert(battle.includes('if (fromEvent) {'));
assert(battleHtml.includes('v2-auto-battle-practice.js?v=131'));
