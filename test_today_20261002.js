"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const read = (file) => fs.readFileSync(file, "utf8");

const index = read("index.html");
const launch = read("launch.js");
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

// Battle unit card alignment on rotated mobile layout.
assert(cards.includes("offsetLeft") && cards.includes("offsetParent"));
assert(!cards.includes("anchor.getBoundingClientRect()"));
assert(battleCss.includes("translate: -50% 16px"));
assert(!battleCss.includes("29cqw"));
assert(battleHtml.includes("v2-unit-cards.js?v=27"));

// Shared battle heal effect + dedicated undead heal test.
assert(heal.includes("heal-cross.png?v=1"));
assert(battle.includes("V2HealEffect.playUnit(spriteWrap, amount)"));
assert(battleHtml.includes("v2-heal-effect.js?v=1"));
assert(battle.includes('battleQuery.get("test") === "undead-heal"'));
assert(battle.includes('"skeleton-spear", "skeleton-archer", "skeleton-cavalry", "grave-priest"'));
assert(battle.includes("unitState.maxHp - 3"));

// Map full heal flash.
assert(mapCss.includes("animation:fullHealGreenFlash 420ms ease-out both"));
assert(mapCss.includes("opacity:.95"));

// Tile event art standardized to world-tree 16:9 frame.
assert(map.includes("const WORLD_TREE_EVENT_RATIO = 16 / 9"));
assert(!map.includes("1280 / 956"));
assert(!map.includes("1280 / 575"));
assert(mapCss.includes("object-fit: cover"));

// Map options button and persistent audio controls.
assert(mapHtml.includes('id="mapOptionsButton"'));
assert(mapCss.includes("right: 1.5%") && mapCss.includes("top: 77.5%"));
assert(mapHtml.includes("map-options-button.webp?v=1"));
assert(mapHtml.includes('id="mapAudioOptions"'));
assert(mapHtml.includes('id="mapBgmToggle"') && mapHtml.includes('id="mapSfxToggle"'));
assert(music.includes("bgmEnabled") && music.includes("setEnabled") && music.includes("isEnabled"));
assert(sfx.includes("sfxEnabled") && sfx.includes("if (!current.enabled) return false"));
assert(mapHtml.includes("v2-music.js?v=3") && mapHtml.includes("v2-sfx.js?v=4"));
assert(battleHtml.includes("v2-music.js?v=3") && battleHtml.includes("v2-sfx.js?v=4"));

// Map BGM handoff/resume.
assert(music.includes("necromancer-v2-music-map-position"));
assert(music.includes('trackName === "map" && nextTrack === "battle"'));
assert(music.includes("applyPendingResume"));
assert(map.includes('V2Music.handoff("battle")'));
assert(battle.includes('V2Music.handoff("map")'));

// Swamp: no death at 1 HP, persistent damage above 1 HP, visual feedback.
const swampStart = map.indexOf("async function applyPollutedSwamp");
const swampEnd = map.indexOf("function addOwnedUnit", swampStart);
const swamp = map.slice(swampStart, swampEnd);
assert(swamp.includes("if (hp <= 1)"));
assert(swamp.includes("unit.currentHp = 1"));
assert(swamp.includes("unit.currentHp = hp - 1"));
assert(!swamp.includes("ownedUnits.delete"));
assert(swamp.includes('await saveOwnedRoster("polluted-swamp")'));
assert(map.includes("await applyPollutedSwamp(heroIndex + 1)"));
assert(swamp.includes("playSwampDamageEffect()"));
assert(mapHtml.includes("swamp-damage-minus1.svg?v=1"));
assert(mapCss.includes("@keyframes hero-swamp-hit"));
assert(mapCss.includes("@keyframes swamp-minus-one-pop"));

// Current map cache/version wiring.
assert(mapHtml.includes("v2-map-practice.js?v=106"));
assert(mapHtml.includes("v2-map-practice.css?v=20261002-swamp-hit-1"));
for (const required of [
  "./v2-map-practice.js?v=106",
  "./v2-auto-battle-practice.js?v=124",
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

// Deployment must cancel superseded jobs; mandatory today's checks must gate deployment.
assert(workflow.includes("cancel-in-progress: true"));

console.log("PASS: 2026-10-02 regression checks for title, battle, healing, map UI, audio, tile art and swamp behavior.");
