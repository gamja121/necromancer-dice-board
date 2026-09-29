"use strict";
const fs = require("node:fs");
const assert = require("node:assert/strict");

const source = fs.readFileSync("v2-auto-battle-practice.js", "utf8");

for (const phase of ["capture-select", "capture-locked", "capture-success", "capture-failed", "capture-complete"]) {
  assert(source.includes(`saveBattle("${phase}")`), `Missing soul-harvest checkpoint phase: ${phase}`);
}
assert(source.includes("capture: phase.startsWith(\"capture-\") ? captureCheckpointState() : null"),
  "Capture checkpoint must persist selected corpse, attempts, lock state and target thresholds.");
assert(source.includes("setupCorpseCapture(true, saved.capture)"),
  "Resume must rebuild the capture UI from saved capture state.");
assert(source.includes("savedCapture?.targets?.[key]"),
  "Saved corpse target thresholds must be reused instead of rerolled.");
assert(source.includes("savedCapture?.selectedKey"),
  "Saved corpse selection must be restored.");
assert(source.includes("Number.isInteger(savedCapture.attemptsLeft)") && source.includes("captureAttemptsLeft = Math.max(0, savedCapture.attemptsLeft)"),
  "Remaining soul-harvest attempts must be restored.");
assert(source.includes("savedCapture?.targetLocked"),
  "Locked corpse selection must stay locked after restore.");
assert(source.includes("Math.floor(battleRandom() * 5)") && source.includes("Math.floor(battleRandom() * 6)"),
  "Capture difficulty and result roll must consume serialized gameplay RNG.");
assert(source.includes('phase !== "capture-complete"'),
  "Completed capture must stay local-only so it cannot reopen RunState battle phase after reward commit.");
assert(source.includes('saved.phase === "capture-complete"') && source.includes("await returnToMap()"),
  "Reload after reward persistence must return to map without granting the reward twice.");
assert(source.includes("V2Rules.individual(slug, battleRandom)"),
  "Recovered monster traits must be reproducible from the restored battle RNG when reward persistence was interrupted.");

console.log("PASS: soul harvest checkpoint selection, roll, success/failure and completion restore contracts");
