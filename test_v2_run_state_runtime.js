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

for (const file of ["v2-run-state.js?v=4", "v2-run-state-runtime.js?v=8"]) {
  assert(mapHtml.includes(file), `Map HTML missing ${file}`);
  assert(battleHtml.includes(file), `Battle HTML missing ${file}`);
  assert(worker.includes(file), `Service worker missing ${file}`);
}
assert(mapHtml.indexOf("v2-run-state-runtime.js?v=8") < mapHtml.indexOf("v2-brand-cards.js?v=6"),
  "RunState runtime must load before brand/home/map consumers.");
assert(battleHtml.indexOf("v2-run-state-runtime.js?v=8") < battleHtml.indexOf("v2-auto-battle-practice.js?"),
  "RunState runtime must load before the battle controller.");

for (const token of ["ensureFreshDefaults", "projectLegacy", "commitExact", "applyBattleOutcome", "setMapLayout", "setMapProgress", "setBattleCheckpoint", "clearBattleCheckpoint", "atomicRosterAndBrands", "normalizePolicyState", "normalizePolicyBrandCard"]) {
  assert(runtime.includes(token), `Runtime API missing ${token}`);
}
assert(map.includes("await V2RunStateRuntime.bootstrap()"), "Map must bootstrap RunState before reading expedition state.");
assert(map.includes("V2RunStateRuntime.setMapLayout") && map.includes("V2RunStateRuntime.setMapProgress"),
  "Map layout and hero/dice context must persist through RunState.");
assert(map.includes("V2BrandCards.addAsync"), "Treasure brand rewards must await RunState persistence.");
assert(home.includes("V2RunStateRuntime.atomicRosterAndBrands"), "Brand-card inheritance must commit roster + card consumption atomically.");
assert(home.includes('saveOwnedUnits("monster-inheritance")'), "Monster inheritance must persist through the RunState roster writer.");
assert(altar.includes("V2RunStateRuntime.replaceOwnedMonsters"), "Altar sacrifice/enhancement must persist through RunState.");
assert(map.includes('const TILE_VISIT_USAGE_KEY = "necromancer-map-tile-visit-usage-v1"') &&
  map.includes("function beginTileVisit(step") && map.includes('markTileActionUsed("purify")') &&
  map.includes('markTileActionUsed("prophecy")') && map.includes('markTileActionUsed("ritual")') &&
  map.includes('markTileActionUsed("inheritance")'),
  "Tile actions must be visit-scoped and lock after successful use.");
assert(map.includes('el.eventMonsterShop.hidden = tile.id !== "village";') &&
  !map.includes('tileActionUsed("shop")'),
  "Monster shop must remain reusable during the same tile visit.");
assert(home.includes("if (completed) return;") && altar.includes("if (!roster.has(instanceId) || completed) return;"),
  "Inheritance and altar overlays must not allow a second successful action before leaving.");
assert(battle.includes("V2RunStateRuntime.applyBattleOutcome"), "Battle finish must atomically persist HP/death/contamination/cleared tile.");
assert(battleHtml.includes("v2-battle-rng.js?v=1") && worker.includes("v2-battle-rng.js?v=1") &&
  battleHtml.indexOf("v2-battle-rng.js?v=1") < battleHtml.indexOf("v2-auto-battle-practice.js?"),
  "Serializable battle RNG must load and cache before the battle controller.");
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
assert(worker.includes("./art/v2-style/ui/freeze-status-label.png?v=2"),
  "Offline cache must include the current versioned freeze status label.");
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

const mapSource = fs.readFileSync('v2-map-practice.js','utf8');
assert(mapSource.includes('async function applyPollutedSwamp(step)'));
assert(mapSource.includes('await saveOwnedRoster("polluted-swamp")'));
assert(mapSource.includes('await applyPollutedSwamp(heroIndex + 1)'));

const swampMapSource = fs.readFileSync('v2-map-practice.js','utf8');
const swampMapHtml = fs.readFileSync('v2-map-practice.html','utf8');
assert(swampMapSource.includes('if (hp <= 1)'));
assert(swampMapSource.includes('unit.currentHp = 1'));
assert(swampMapSource.includes('unit.currentHp = hp - 1'));
assert(!swampMapSource.includes('ownedUnits.delete(instanceId)') || !swampMapSource.slice(swampMapSource.indexOf('async function applyPollutedSwamp'), swampMapSource.indexOf('function addOwnedUnit')).includes('ownedUnits.delete'));
assert(swampMapSource.includes('playSwampDamageEffect()'));
assert(swampMapHtml.includes('swamp-damage-minus1.svg?v=1'));

assert(runtime.includes("state.battle.state.units = state.battle.state.units.map(normalizePolicyUnit)"),
  "RunState must normalize old battle checkpoint brands at the storage boundary.");
assert(runtime.includes('"brand-policy-migration-v1"'),
  "RunState bootstrap must persist the one-time brand policy migration.");
assert(runtime.includes("curse: []"),
  "RunState brand-card normalization must force blessing-only storage.");
