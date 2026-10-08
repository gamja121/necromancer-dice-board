"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname);
const source = fs.readFileSync(path.join(root, "v2-map-practice.js"), "utf8");
const html = fs.readFileSync(path.join(root, "v2-map-practice.html"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

function between(from, to) {
  const start = source.indexOf(from);
  const end = source.indexOf(to, start);
  assert(start >= 0 && end > start, `Missing hunt source section: ${from}`);
  return source.slice(start, end);
}

// Execute production eligibility/save functions in isolation, not a test copy.
const constLines = source.split("\n").filter((line) =>
  /^  const (MONSTER_KING_[A-Z_]+|RITUAL_PORTAL_EVENT_FLAG|RITUAL_PORTAL_EVENT_FALLBACK_KEY) = "/.test(line)
).join("\n");
const production = constLines + "\n" +
  between("  function monsterKingHuntStoryFlag(", "  async function markKnightCommanderContaminationEventStarted(") +
  between("  async function markMonsterKingHuntEventStarted(", "  async function markRumorSavedChildEventStarted(") +
  between("  function createMonsterKingHuntBeats(", "  const CULTIST_RUMOR_BEATS = Object.freeze([");

function setup(flags, { failCommit = false, useFallback = false } = {}) {
  let state = { ...flags };
  const session = new Map();
  const runtime = {
    available: !useFallback,
    snapshot: () => ({ eventFlags: useFallback ? {} : state }),
    commitExact: async (_reason, edit) => {
      if (failCommit) return { ok: false };
      const draft = { eventFlags: { ...state } };
      edit(draft);
      state = draft.eventFlags;
      return { ok: true };
    },
    flush: async () => {}
  };
  const sandbox = {
    V2RunStateRuntime: runtime,
    sessionStorage: {
      getItem: (key) => session.get(key) || null,
      setItem: (key, value) => session.set(key, String(value)),
      removeItem: (key) => session.delete(key)
    },
    console
  };
  vm.createContext(sandbox);
  vm.runInContext(production, sandbox);
  const expr = (str) => vm.runInContext(str, sandbox);
  return { expr, session, flags: () => state };
}

const base = {
  "event:ritual_portal_trace_01:complete": true,
  "story:monster_king:revived": true,
  "quest:monster_king_hunt:active": true,
  "event:monster_king_hunt_trace_01:complete": false
};

async function main() {
  for (const mode of ["weakened", "full"]) {
    const flags = {
      ...base,
      "story:monster_king:revival_weakened": mode === "weakened",
      "story:monster_king:revival_complete": mode === "full"
    };
    const t = setup(flags);
    assert.equal(t.expr("monsterKingHuntEligible()"), true, mode + " should start");
    assert.equal(t.expr("monsterKingRevivalState()"), mode);
    const beats = t.expr("createMonsterKingHuntBeats(monsterKingRevivalState())");
    assert.equal(beats.length, 5);
    assert.equal(beats[0].dialogue, "");
    assert.equal(beats[1].dialogue, "");
    assert.equal(beats[2].speaker, "마물 사냥꾼");
    assert.equal(beats[4].locationKnown, true);
    assert.equal(await t.expr("markMonsterKingHuntEventStarted()"), true);
    assert.equal(t.flags()["event:monster_king_hunt_trace_01:seen"], true);
    assert.equal(t.expr("monsterKingHuntEligible()"), true, "seen must not block recovery");
    assert.equal(await t.expr("markMonsterKingHuntEventComplete()"), true);
    const done = t.flags();
    assert.equal(done["event:monster_king_hunt_trace_01:complete"], true);
    assert.equal(done["quest:monster_king_hunt:active"], false);
    assert.equal(done["quest:monster_king_hunt:complete"], true);
    assert.equal(done["story:monster_king:sealed_ruins_location_known"], true);
    assert.equal(done["quest:monster_king_final_battle:active"], true);
    assert.equal(done["story:monster_king:revival_weakened"], flags["story:monster_king:revival_weakened"]);
    assert.equal(done["story:monster_king:revival_complete"], flags["story:monster_king:revival_complete"]);
    assert.equal(t.expr("monsterKingHuntEligible()"), false);
    assert.equal(await t.expr("markMonsterKingHuntEventComplete()"), false, "no duplicate completion");
  }

  for (const state of [
    { ...base, "story:monster_king:revival_weakened": true, "story:monster_king:revival_complete": true },
    { ...base, "story:monster_king:revival_weakened": false, "story:monster_king:revival_complete": false },
    { ...base, "event:ritual_portal_trace_01:complete": false, "story:monster_king:revival_weakened": true, "story:monster_king:revival_complete": false },
    { ...base, "quest:monster_king_hunt:active": false, "story:monster_king:revival_weakened": true, "story:monster_king:revival_complete": false }
  ]) {
    const t = setup(state);
    assert.equal(t.expr("monsterKingHuntEligible()"), false, "invalid state cannot launch");
    assert.equal(await t.expr("markMonsterKingHuntEventComplete()"), false);
  }

  const failed = setup({ ...base, "story:monster_king:revival_weakened": true, "story:monster_king:revival_complete": false }, { failCommit: true });
  assert.equal(await failed.expr("markMonsterKingHuntEventComplete()"), false);
  assert.equal(failed.flags()["quest:monster_king_hunt:active"], true);
  assert.equal(failed.session.size, 0, "failed durable commit must not write fallback");
  const stale = setup({ ...base, "story:monster_king:revival_weakened": false, "story:monster_king:revival_complete": false });
  stale.session.set("necromancer-story-monster-king-revival-weakened-v1", "1");
  assert.equal(stale.expr("monsterKingHuntEligible()"), false, "RunState false overrides old session");

  const fallback = setup({}, { useFallback: true });
  for (const key of [
    "necromancer-event-ritual-portal-complete-v1",
    "necromancer-story-monster-king-revived-v1",
    "necromancer-quest-monster-king-hunt-active-v1",
    "necromancer-story-monster-king-revival-weakened-v1"
  ]) fallback.session.set(key, "1");
  assert.equal(fallback.expr("monsterKingHuntEligible()"), true, "standalone session fallback");
  assert.equal(await fallback.expr("markMonsterKingHuntEventComplete()"), true);
  assert.equal(fallback.expr("monsterKingHuntEligible()"), false);
  assert.equal(fallback.session.get("necromancer-quest-monster-king-final-battle-active-v1"), "1");

  const dispatch = between("  async function launchStoryEventForTile(", "  if (el.board && el.graveyardStoryEvent");
  assert(dispatch.indexOf("launchRitualPortalEventFromMap()") < dispatch.indexOf("launchMonsterKingHuntEventFromMap()"));
  assert(dispatch.includes('storyEventTriggerMatches(tileId, "unknown")'));
  assert(!dispatch.includes('storyEventTriggerMatches(tileId, "boss")'));
  assert(source.includes('tile.id === "unknown" || tile.id === "event"'));
  assert(source.includes('const shouldOpenWorldTree = tile?.id === "unknown"'));
  assert(source.includes('if (!eventOpen) openTileEvent(tile, heroIndex + 1)'));
  assert(source.includes('mapLaunchParams.get("storyEvent") === "monster_king_hunt_trace_01"'));
  assert(!source.includes('eventReturn: "map-monster-king-hunt"'), "hunt must never trigger boss battle");
  assert(html.includes("v2-map-practice.js?v=20261009-story-resume-safe-v1"));
  assert(worker.includes("./v2-map-practice.js?v=20261009-story-resume-safe-v1"));
  console.log("PASS: monster king hunt eligibility, both branches, atomic save, recovery, fallback, scene and boss isolation");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
