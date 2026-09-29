"use strict";
const fs = require("node:fs");
const path = require("node:path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = __dirname;
const runtime = fs.readFileSync(path.join(root, "v2-run-state-runtime.js"), "utf8");
const map = fs.readFileSync(path.join(root, "v2-map-practice.js"), "utf8");
const home = fs.readFileSync(path.join(root, "v2-home-inheritance.js"), "utf8");
const altar = fs.readFileSync(path.join(root, "v2-altar-ritual.js"), "utf8");
const battle = fs.readFileSync(path.join(root, "v2-auto-battle-practice.js"), "utf8");
const mapHtml = fs.readFileSync(path.join(root, "v2-map-practice.html"), "utf8");
const battleHtml = fs.readFileSync(path.join(root, "v2-auto-battle-practice.html"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

for (const file of ["v2-run-state.js?v=1", "v2-run-state-runtime.js?v=1"]) {
  assert(mapHtml.includes(file), `Map HTML missing ${file}`);
  assert(battleHtml.includes(file), `Battle HTML missing ${file}`);
  assert(worker.includes(file), `Service worker missing ${file}`);
}
assert(mapHtml.indexOf("v2-run-state-runtime.js?v=1") < mapHtml.indexOf("v2-brand-cards.js?v=4"),
  "RunState runtime must load before brand/home/map consumers.");
assert(battleHtml.indexOf("v2-run-state-runtime.js?v=1") < battleHtml.indexOf("v2-auto-battle-practice.js?v=102"),
  "RunState runtime must load before the battle controller.");

for (const token of ["ensureFreshDefaults", "projectLegacy", "commitExact", "applyBattleOutcome", "setMapLayout", "setMapProgress", "setBattleCheckpoint", "clearBattleCheckpoint", "atomicRosterAndBrands"]) {
  assert(runtime.includes(token), `Runtime API missing ${token}`);
}
assert(map.includes("await V2RunStateRuntime.bootstrap()"), "Map must bootstrap RunState before reading expedition state.");
assert(map.includes("V2RunStateRuntime.setMapLayout") && map.includes("V2RunStateRuntime.setMapProgress"),
  "Map layout and hero/dice context must persist through RunState.");
assert(map.includes("V2BrandCards.addAsync"), "Treasure brand rewards must await RunState persistence.");
assert(home.includes("V2RunStateRuntime.atomicRosterAndBrands"), "Brand-card inheritance must commit roster + card consumption atomically.");
assert(home.includes('saveOwnedUnits("monster-inheritance")'), "Monster inheritance must persist through the RunState roster writer.");
assert(altar.includes("V2RunStateRuntime.replaceOwnedMonsters"), "Altar sacrifice/enhancement must persist through RunState.");
assert(battle.includes("V2RunStateRuntime.applyBattleOutcome"), "Battle finish must atomically persist HP/death/contamination/cleared tile.");
assert(battle.includes("V2RunStateRuntime.setBattleCheckpoint") && battle.includes("loadBattleCheckpoint()") &&
  battle.includes("checkpointMatchesCurrentBattle") && battle.includes("await resumeBattle()"),
  "Map battle must checkpoint to RunState, reject stale encounters, and auto-resume a matching checkpoint.");
assert(battle.includes('commitExact(operationId') && battle.includes("capture-reward:"),
  "Capture reward must use an idempotent RunState operation receipt.");
assert(runtime.includes("legacyBrandCards") && runtime.includes("clearedSteps") && runtime.includes("projectLegacy(current)"),
  "Legacy compatibility output must be projected from authoritative RunState.");

console.log("PASS: RunState runtime wiring across map, home, altar, battle, cache and idempotent rewards");
