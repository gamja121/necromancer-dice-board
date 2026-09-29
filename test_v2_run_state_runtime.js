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
const battleControllerRef = battleHtml.match(/v2-auto-battle-practice\.js\?v=\d+/)?.[0];
assert(battleControllerRef && battleHtml.indexOf("v2-run-state-runtime.js?v=1") < battleHtml.indexOf(battleControllerRef),
  "RunState runtime must load before the current battle controller.");

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
assert(battleHtml.includes("v2-battle-rng.js?v=1") &&
  battleControllerRef && battleHtml.indexOf("v2-battle-rng.js?v=1") < battleHtml.indexOf(battleControllerRef),
  "Serializable battle RNG must load before the current battle controller.");
assert(battle.includes("rng: battleRng.snapshot()") && battle.includes("V2BattleRng.restore(saved.rng)") &&
  battle.includes("V2Rules.restore(saved.state, battleRandom)") && battle.includes("V2Rules.create(units, battleRandom)"),
  "Battle checkpoint must save/restore the gameplay RNG and inject it into battle rules.");
assert(battle.includes("V2RunStateRuntime.setBattleCheckpoint") && battle.includes("loadBattleCheckpoint()") &&
  battle.includes("checkpointMatchesCurrentBattle") && battle.includes("await resumeBattle()"),
  "Map battle must checkpoint to RunState, reject stale encounters, and auto-resume a matching checkpoint.");
assert(battle.includes('commitExact(operationId') && battle.includes("capture-reward:"),
  "Capture reward must use an idempotent RunState operation receipt.");
assert(battle.includes("draft.battle = null") && battle.includes('draft.phase = "returning"'),
  "Completed capture reward must clear the stale RunState battle checkpoint before returning to the map.");
assert(fs.existsSync(path.join(root, "art/v2-style/ui/freeze-status-label.png")),
  "Current freeze status label asset must exist for lazy media caching.");
assert(worker.includes("function cacheFirst"),
  "Service worker must lazily cache runtime media such as the freeze label.");
assert(battle.includes('saveBattle("capture-select")') && battle.includes('saveBattle("capture-locked")') &&
  battle.includes('saveBattle("capture-success")') && battle.includes('saveBattle("capture-failed")') &&
  battle.includes('saveBattle("capture-complete")'),
  "Soul harvest selection, locked roll, success/failure and completed reward phases must be checkpointed.");
assert(battle.includes("setupCorpseCapture(true, saved.capture)") &&
  battle.includes('saved.phase === "capture-success"') && battle.includes("completeCaptureSuccess()"),
  "Soul harvest resume must rebuild corpse targets/selection and continue a successful interrupted reward.");
assert(battle.includes("Math.floor(battleRandom() * 5)") && battle.includes("Math.floor(battleRandom() * 6)"),
  "Soul harvest target thresholds and actual capture rolls must use the serialized gameplay RNG.");
assert(runtime.includes("legacyBrandCards") && runtime.includes("clearedSteps") && runtime.includes("projectLegacy(current)"),
  "Legacy compatibility output must be projected from authoritative RunState.");

console.log("PASS: RunState runtime wiring across map, home, altar, battle, cache and idempotent rewards");
