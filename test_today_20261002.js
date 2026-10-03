"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const read = (file) => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

const index = read("index.html");
const launch = read("launch.js");
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
assert(!introHtml.includes('art/v2-style/event-portraits/necromancer.png'), "Prologue must not use the 96x72 portrait");
assert(!introHtml.includes('art/v2-style/event-portraits/knight-commander.png'), "Prologue must not use the 64x48 commander portrait");
assert(introHtml.includes('art/v2-style/event-portraits/necromancer.png?v=2'));
assert(introHtml.includes('art/v2-style/event-portraits/knight-commander-hd.webp?v=1'));
assert(introHtml.includes('art/v2-style/ui/intro-dialogue-box.webp?v=4'));
assert(introHtml.includes('쿵쾅쾅.'));
assert(introJs.includes('{ speaker: "주인공", text: "..." }'));
assert(!introJs.match(/speaker: "주인공", text: "(?!\.\.\.)/), "Every protagonist dialogue line must stay silent");
assert(introJs.includes('오늘부터 네게 외곽 순찰 임무를 맡기겠다.'));
assert(introJs.includes('location.href = "v2-map-practice.html"'));
assert(introCss.includes(".dialogue-box"), "Dialogue UI must render over the parchment frame");
assert(introHtml.includes('v2-landscape.js?v=1'), "Prologue must use landscape helper");
assert(introHtml.includes('knight-commander-hd.webp?v=1'), "Prologue must use the HD commander asset");
assert(introCss.includes("@media (orientation:portrait)"), "Prologue needs portrait-to-landscape CSS fallback");
assert(introHtml.includes('class="intro-canvas"'), "Prologue must render inside a fixed landscape canvas");
assert(introHtml.includes('id="introLandscapeHint"'), "Portrait phones need an explicit rotate-device hint");
assert(introCss.includes("aspect-ratio:16/9"), "Prologue canvas must stay 16:9");
assert(introCss.includes(".portrait-right{right:2%;width:48%;height:78%}"), "HD commander must render large on the right");
assert(introJs.includes("ensureLandscape()"), "Prologue must request real landscape orientation on interaction");
assert(!introCss.includes("rotate(90deg)"), "Prologue must not sideways-rotate the whole UI");
assert(introHtml.includes('intro-dialogue-box.webp?v=4'), "Prologue must show the parchment dialogue frame");

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
assert(mapHtml.includes("v2-map-practice.js?v=114"));
assert(battleHtml.includes("v2-auto-battle-practice.js?v=129"));
for (const required of [
  "./v2-intro.html",
  "./v2-intro.css?v=6",
  "./v2-intro.js?v=4",
  "./art/v2-style/event-portraits/necromancer.png?v=2",
  "./art/v2-style/event-portraits/knight-commander-hd.webp?v=1",
  "./art/v2-style/ui/intro-dialogue-box.webp?v=4",
  "./v2-map-practice.js?v=114",
  "./v2-auto-battle-practice.js?v=129",
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
assert(mapHtml.includes("v2-map-practice.css?v=20261002-options-visible-2"));
assert(worker.includes("./v2-map-practice.css?v=20261002-options-visible-2"));

assert(battle.includes('makeState(data, "enemy", 3 - index)'));
assert(!battle.includes('makeState(data, "enemy", index)'));
assert(battleHtml.includes("v2-auto-battle-practice.js?v=129"));
assert(worker.includes("./v2-auto-battle-practice.js?v=129"));

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
