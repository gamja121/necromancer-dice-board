"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("v2-map-practice.js", "utf8");
const battleSource = fs.readFileSync("v2-auto-battle-practice.js", "utf8");
function part(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert(a >= 0 && b > a, "Required production section missing: " + start);
  return source.slice(a, b);
}
const storySetupCode = part("  function storyBattleDefinitionValid(", "  function enterMonsterBattle(");
const storyConfirmCode = part("  async function confirmStoryBattleDeck()", "  async function confirmMonsterBattle()");
const scenarioTypes = [
  { eventId: "graveyard_child_ambush_01", eventReturn: "map-graveyard", encounterType: "event-graveyard-child", choiceId: "protect_child", enemies: ["ghoul"] },
  { eventId: "cultist_altar_encounter_01", eventReturn: "map-cultist-altar", encounterType: "event-cultist-altar", choiceId: "fight", enemies: ["ghoul","death-knight","plague-doctor","hydra"] },
  { eventId: "ritual_portal_trace_01", eventReturn: "map-ritual-portal", encounterType: "event-ritual-portal", choiceId: "intervene", enemies: ["ghoul","death-knight","plague-doctor","hydra"] }
];
const unitSlugs = ["ghoul", "death-knight", "plague-doctor", "hydra", "skeleton-spear"];
const classes = { add() {}, remove() {} };

function scenario(opts = {}) {
  let snapshot = { runId: opts.runId || "story-run-01", eventFlags: {
    "event:graveyard_child_ambush_01:seen": true,
    "event:cultist_altar_encounter_01:seen": true,
    "event:ritual_portal_trace_01:seen": true
  } };
  let savedParty = null;
  let assignments = [];
  let altarCommits = 0;
  const session = new Map();
  const runtime = {
    available: true,
    snapshot: () => snapshot,
    setMapProgress: async () => true,
    commitExact: async (_name, apply) => {
      if (opts.rejectSave) return { ok: false };
      const draft = { party: [] };
      apply(draft);
      savedParty = draft.party;
      return { ok: true };
    },
    flush: async () => true
  };
  const context = {
    URLSearchParams, V2RunStateRuntime: runtime,
    TEST_DECK: unitSlugs.map(slug => ({ slug })),
    ownedUnits: new Map(unitSlugs.map((slug,index) => [`monster-${index}`, { instanceId: `monster-${index}`, slug }])),
    pendingStoryBattle: null, selectedDeck: [],
    STORY_BATTLE_DECK_PENDING_KEY: "necromancer-story-battle-deck-pending-v1",
    GRAVEYARD_CHILD_EVENT_SEEN_FLAG: "event:graveyard_child_ambush_01:seen",
    GRAVEYARD_CHILD_EVENT_SEEN_FALLBACK_KEY: "event-graveyard-seen",
    CULTIST_ALTAR_EVENT_SEEN_FLAG: "event:cultist_altar_encounter_01:seen",
    CULTIST_ALTAR_EVENT_SEEN_FALLBACK_KEY: "event-altar-seen",
    RITUAL_PORTAL_EVENT_SEEN_FLAG: "event:ritual_portal_trace_01:seen",
    RITUAL_PORTAL_EVENT_SEEN_FALLBACK_KEY: "event-portal-seen",
    el: {
      deckConfirm: { disabled: false }, deckStatus: { textContent: "" },
      deckOverlay: { classList: classes, hidden: true, offsetWidth: 100 },
      deckClose: { hidden: false },
      diceButton: { disabled: false }, regenerate: { disabled: false },
      tileName: { textContent: "" }, diceResult: { textContent: "" },
      board: { classList: classes }
    },
    V2Music: { handoff() {} },
    window: { location: { assign(url) { assignments.push(url); } } },
    sessionStorage: {
      getItem(key) { return session.get(key) || null; },
      setItem(key,val) { session.set(key,String(val)); },
      removeItem(key) { session.delete(key); }
    },
    eventOpen: true, enteringBattle: false, heroIndex: 7, battleStep: 0,
    battleTileType: "monster", activeMapId: "default", currentTiles: [], lapReadyForRefresh: false,
    worldTreePrayed: false, previousDiceRoll: null, previousDiceControlId: null,
    forceCloseBookRoster() {}, renderDeckSelection() {}, closeGraveyardStoryEvent() { context.eventOpen = false; },
    saveMapLayout: async () => true,
    markCultistAltarEncounterComplete: async () => { altarCommits++; return true; },
    console
  };
  vm.createContext(context);
  vm.runInContext(storySetupCode + "\n" + storyConfirmCode, context, { filename: "production-story-deck-functions.js" });
  return { context, session, runtime, assignments, setSnapshot(value) { snapshot = value; }, savedParty: () => savedParty, altarCommits: () => altarCommits };
}

async function check() {
  for (const event of scenarioTypes) {
    const t = scenario();
    assert.equal(t.context.prepareStoryBattleDeckSelection(event), true, "deck picker should open for " + event.eventId);
    assert.equal(t.context.enteringBattle, true);
    assert.equal(t.context.el.deckOverlay.hidden, false);
    assert.equal(t.context.selectedDeck.length, 0, "no automatic starting party");
    assert.equal(t.assignments.length, 0, "event cannot launch before deck confirm");
    assert.equal(t.altarCommits(), 0, "fight choice is not saved before selection");

    await t.context.confirmStoryBattleDeck();
    assert.equal(t.assignments.length, 0, "empty deck cannot begin combat");
    t.context.selectedDeck = ["monster-3","monster-0","monster-2","monster-1"];
    await t.context.confirmStoryBattleDeck();
    assert.equal(t.assignments.length, 1, "confirmed deck should launch exactly once");
    const url = new URL(t.assignments[0], "https://example.test/");
    assert.equal(url.searchParams.get("from"), "event");
    assert.equal(url.searchParams.get("event"), event.eventId);
    assert.equal(url.searchParams.get("eventReturn"), event.eventReturn);
    assert.equal(url.searchParams.get("encounterType"), event.encounterType);
    assert.equal(url.searchParams.get("enemies"), event.enemies.join(","));
    assert.equal(url.searchParams.get("allyIds"), "monster-3,monster-0,monster-2,monster-1");
    assert.equal(url.searchParams.get("allies"), "hydra,ghoul,plague-doctor,death-knight");
    assert.deepEqual(t.savedParty(), ["monster-3","monster-0","monster-2","monster-1"]);
    assert.equal(t.session.has(t.context.STORY_BATTLE_DECK_PENDING_KEY), false);
    assert.equal(t.altarCommits(), 0, "entering any fight must not mark its story complete before a real outcome");
    console.log("PASS selected four actual monsters for " + event.eventId);
  }
  const single = scenario();
  single.context.prepareStoryBattleDeckSelection(scenarioTypes[0]);
  single.context.selectedDeck = ["monster-1"];
  await single.context.confirmStoryBattleDeck();
  assert.equal(new URL(single.assignments[0], "https://example.test/").searchParams.get("allyIds"), "monster-1", "one-unit fight supported");

  const retry = scenario({ rejectSave: true });
  retry.context.prepareStoryBattleDeckSelection(scenarioTypes[2]);
  retry.context.selectedDeck = ["monster-0"];
  await retry.context.confirmStoryBattleDeck();
  assert.equal(retry.assignments.length, 0, "failed save cannot open combat with wrong party");
  assert.equal(retry.context.el.deckConfirm.disabled, false);
  assert.equal(retry.session.has(retry.context.STORY_BATTLE_DECK_PENDING_KEY), true);

  const reload = scenario();
  reload.context.prepareStoryBattleDeckSelection(scenarioTypes[1]);
  reload.context.pendingStoryBattle = null;
  reload.context.enteringBattle = false;
  reload.context.eventOpen = false;
  reload.context.el.deckOverlay.hidden = true;
  assert.equal(reload.context.restorePendingStoryBattleDeck(), true, "refresh retains event deck stage");
  assert.equal(reload.context.selectedDeck.length, 0, "refresh requires a deliberate lineup");
  reload.context.pendingStoryBattle = null;
  reload.context.enteringBattle = false;
  reload.context.eventOpen = false;
  reload.setSnapshot({ runId: "different-run", eventFlags: {} });
  assert.equal(reload.context.restorePendingStoryBattleDeck(), false, "old session must not cross runs");

  for (const entry of ["startGraveyardEventBattle", "startCultistAltarEventBattle", "startRitualPortalEventBattle"]) {
    assert(source.includes("function " + entry) && source.includes("prepareStoryBattleDeckSelection("));
  }
  assert(!source.includes("currentPartyUnits()"), "all event auto-party selection removed");
  assert(source.includes('if (pendingStoryBattle) return confirmStoryBattleDeck()'), "normal deck confirm dispatches pending story battle");
  assert(battleSource.includes('mapOwnedRoster.get(instanceId)?.slug === selectedAllySlugs[index])'), "battle validates actual saved monster instances");
  console.log("PASS story battle deck confirmation, 1-4 units, refresh, save failure, and no default party");
}
check().catch(err => { console.error(err); process.exitCode = 1; });
