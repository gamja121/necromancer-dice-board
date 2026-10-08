"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const js = fs.readFileSync("v2-map-practice.js", "utf8");
const html = fs.readFileSync("v2-map-practice.html", "utf8");
const sw = fs.readFileSync("service-worker.js", "utf8");

const start = js.indexOf("  function openTileEvent(tile, step) {");
const end = js.indexOf("  async function healAtRestTile()", start);
assert(start >= 0 && end > start, "The standard tile event renderer must exist");
const production = js.slice(start, end);

assert(!js.includes("function openForestTileEvent("), "Hill tiles must not use a diorama override");
assert(!js.includes("forestDioramaFromTile"), "Hill tile entry must not set a diorama-return flag");
assert(!js.includes("openForestDioramaTest({ fromTile: true })"), "No automatic hill diorama entry");
assert(production.includes("const scene = tileEventScenes[tile?.id]"), "Hill must share the standard event scene lookup");
assert(js.includes('forest: Object.freeze({ title: "언덕", image: `${ROOT}events/forest.jpg?v=${EVENT_ASSET_VERSION}` })'), "Original hill illustration is still registered");
assert(js.includes('el.eventHillScout.addEventListener("click", openHillScout)'), "The existing scouting button must stay connected");
assert(js.includes('const shouldOpenForest = tile?.id === "forest"'), "Story handoff must still recognize a hill tile");
assert(js.includes("if (!eventOpen) openTileEvent(tile, heroIndex + 1)"), "Finishing the ritual story returns to the ordinary hill scene");
assert(html.includes('id="tileEventHillScout"'), "The original scout UI must be present");

function element() {
  return {
    hidden: true, disabled: false, textContent: "", src: "", alt: "",
    className: "", dataset: {}, style: {},
    classList: { add() {}, remove() {} },
    removeAttribute() {}, replaceChildren() {}, focus() {},
    setAttribute() {}
  };
}

function makeContext({ scoutUsed = false, hasIntel = false } = {}) {
  const nodes = new Proxy({}, {
    get(target, key) {
      if (!Object.prototype.hasOwnProperty.call(target, key)) target[key] = element();
      return target[key];
    }
  });
  const visits = [];
  const ctx = {
    el: nodes,
    eventOpen: false,
    activeEventTileId: null,
    activeEventRatio: 0,
    enteringBattle: false,
    WORLD_TREE_EVENT_RATIO: 16/9,
    tileEventRatios: { forest: 16/9, unknown: 16/9 },
    tileEventScenes: {
      forest: { title: "언덕", image: "art/v2-style/map-test/events/forest.jpg?v=20260927-2" },
      unknown: { title: "세계수", image: "art/v2-style/map-test/events/world-tree.jpg?v=20260927-2" }
    },
    hillScout: { scouted: hasIntel },
    tileActionUsed: name => name === "scout" && scoutUsed,
    hasInjuredOwnedUnits: () => false,
    hasGraveyardCorpses: () => false,
    beginTileVisit: step => visits.push(step),
    fitTileEventScene() {},
    console
  };
  vm.createContext(ctx);
  vm.runInContext(production, ctx);
  return { ctx, nodes, visits };
}

const one = makeContext();
assert.equal(one.ctx.openTileEvent({ id: "forest" }, 12), true);
assert.equal(one.ctx.eventOpen, true);
assert.equal(one.ctx.activeEventTileId, "forest");
assert.equal(one.nodes.eventOverlay.hidden, false, "Normal scene is visible, not diorama");
assert.equal(one.nodes.eventImage.src, "art/v2-style/map-test/events/forest.jpg?v=20260927-2");
assert.equal(one.nodes.eventImage.alt, "언덕 풍경");
assert.equal(one.nodes.eventHillScout.hidden, false, "Scouting action is shown on first visit");
assert.equal(one.nodes.eventHillScout.textContent, "정찰");
assert.equal(one.nodes.eventClose.hidden, false, "Normal close button is available");
assert.equal(one.nodes.diceButton.disabled, true, "Map dice should not roll while the hill scene is open");
assert.deepEqual(one.visits, [12]);
assert.equal(one.ctx.openTileEvent({ id: "forest" }, 12), true);

const revisited = makeContext({ scoutUsed: true, hasIntel: true });
revisited.ctx.openTileEvent({ id: "forest" }, 8);
assert.equal(revisited.nodes.eventImage.hidden, false);
assert.equal(revisited.nodes.eventHillScout.hidden, true, "The same tile's used scout action remains guarded");
assert.equal(revisited.nodes.eventHillScout.textContent, "정찰 정보");

const worldTree = makeContext();
worldTree.ctx.openTileEvent({ id: "unknown" }, 7);
assert.equal(worldTree.nodes.eventImage.alt, "세계수 풍경");
assert.equal(worldTree.nodes.eventPray.hidden, false, "World-tree action must remain intact");
assert.equal(worldTree.nodes.eventHillScout.hidden, true, "Scouting is exclusive to hills");

assert(html.includes("v2-map-practice.js?v=20261009-story-resume-safe-v1"));
assert(sw.includes("./v2-map-practice.js?v=20261009-story-resume-safe-v1"));
console.log("PASS: forest original illustration, scouting, revisit guard, story handoff, and other tiles");
