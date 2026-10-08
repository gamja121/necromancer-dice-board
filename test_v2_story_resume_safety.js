"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const map = fs.readFileSync("v2-map-practice.js", "utf8");

function chunk(start, end) {
  const i = map.indexOf(start), j = map.indexOf(end, i + start.length);
  assert(i >= 0 && j > i, "Production function markers missing: " + start);
  return map.slice(i, j);
}

const consumed = [
  ["graveyardChildEventConsumed","GRAVEYARD_CHILD_EVENT_FLAG","GRAVEYARD_CHILD_EVENT_FALLBACK_KEY"],
  ["rumorSavedChildEventConsumed","RUMOR_SAVED_CHILD_EVENT_FLAG","RUMOR_SAVED_CHILD_EVENT_FALLBACK_KEY"],
  ["rumorAbandonedChildEventConsumed","RUMOR_ABANDONED_CHILD_EVENT_FLAG","RUMOR_ABANDONED_CHILD_EVENT_FALLBACK_KEY"],
  ["knightCommanderContaminationEventConsumed","KNIGHT_COMMANDER_CONTAMINATION_EVENT_FLAG","KNIGHT_COMMANDER_CONTAMINATION_EVENT_FALLBACK_KEY"],
  ["monsterHunterEncounterConsumed","MONSTER_HUNTER_ENCOUNTER_FLAG","MONSTER_HUNTER_ENCOUNTER_FALLBACK_KEY"],
  ["cultistRumorEventConsumed","CULTIST_RUMOR_EVENT_FLAG","CULTIST_RUMOR_EVENT_FALLBACK_KEY"],
  ["cultistAltarEncounterConsumed","CULTIST_ALTAR_EVENT_FLAG","CULTIST_ALTAR_EVENT_FALLBACK_KEY"],
  ["ritualPortalEventConsumed","RITUAL_PORTAL_EVENT_FLAG","RITUAL_PORTAL_EVENT_FALLBACK_KEY"]
];

for(const [name, flagVar, fallbackVar] of consumed) {
  const code = chunk("  function " + name + "() {", "\n  }\n") + "\n  }\n";
  const flag = "event:example:" + name + ":complete";
  const fallback = "session:" + name + ":complete";
  const seen = new Map([[fallback.replace(":complete",":seen"), "1"]]);
  let flags = {[flag.replace(":complete",":seen")]: true, [flag]: false};
  const ctx = {
    [flagVar]: flag, [fallbackVar]: fallback,
    V2RunStateRuntime: { available: true, snapshot: () => ({ eventFlags: flags }) },
    sessionStorage: { getItem: key => seen.get(key) || null }
  };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  assert.equal(vm.runInContext(name + "()",ctx),false,name+": seen-only must replay, not block");
  flags[flag] = true;
  assert.equal(vm.runInContext(name + "()",ctx),true,name+": completed quest must not replay");
  flags[flag] = false;
  seen.set(fallback,"1");
  assert.equal(vm.runInContext(name + "()",ctx),false,name+": old session completed flag cannot override active RunState");
  ctx.V2RunStateRuntime.available = false;
  assert.equal(vm.runInContext(name + "()",ctx),true,name+": session-only saves still respected");
  seen.delete(fallback);
  assert.equal(vm.runInContext(name + "()",ctx),false,name+": session seen-only must replay");
  console.log("PASS reload progression: " + name);
}

const touchCode = chunk("  function installGraveyardStoryTapAdvance() {", "  installGraveyardStoryTapAdvance();");
const tapped = { king:0, grave:0, ritual:0 };
let onTap = null;
const scene = {
  hidden: false, dataset: {},
  classList: { contains(name) { return this.choice && name === "is-choice-phase"; },choice:false },
  addEventListener(_name, fn) { onTap=fn; }
};
const tapCtx = {
  el: { graveyardStoryEvent: scene },
  activeStoryEventId: "monster_king_hunt_trace_01",
  advanceMonsterKingHuntBeat() { tapped.king++; },
  advanceGraveyardStoryBeat() { tapped.grave++; },
  advanceRitualPortalBeat() { tapped.ritual++; }
};
vm.createContext(tapCtx);
vm.runInContext(touchCode, tapCtx);
vm.runInContext("installGraveyardStoryTapAdvance()",tapCtx);
assert.equal(typeof onTap,"function");
const event = { target:{ closest:()=>null } };
onTap(event);
assert.deepEqual(tapped,{ king:1, grave:0, ritual:0 },"Hunt tapping must not open the graveyard choice phase");
scene.classList.choice=true;
onTap(event);
assert.equal(tapped.king,1,"choice phase must ignore backdrop taps");
scene.classList.choice=false;
tapCtx.activeStoryEventId="ritual_portal_trace_01";
onTap(event);
assert.equal(tapped.ritual,1,"Ritual backdrop still advances ritual");
tapCtx.activeStoryEventId="unrecognized";
onTap(event);
assert.equal(tapped.grave,0,"Unknown story must not route to graveyard");
tapCtx.activeStoryEventId="graveyard_child_ambush_01";
onTap(event);
assert.equal(tapped.grave,1,"Graveyard story tap still works");
console.log("PASS story overlay tap dispatch");

async function checkCultistReturn() {
  const code = chunk("  async function resumeCultistAltarEventAfterBattle() {", "  function ritualPortalEnemySlugs() {");
  const outcome={eventId:"cultist_altar_encounter_01",won:true};
  const store=new Map([["battle-result",JSON.stringify(outcome)]]);
  let accepted=false, calls=[], scenes=0;
  const ctx={
    GRAVEYARD_EVENT_BATTLE_RESULT_KEY:"battle-result",
    sessionStorage:{
      getItem:key=>store.get(key)||null,
      removeItem:key=>store.delete(key)
    },
    markCultistAltarEncounterComplete:async(choice,win)=>{calls.push([choice,win]);return accepted;},
    openCultistAltarEncounterEvent:async()=>{scenes++;}
  };
  vm.createContext(ctx);vm.runInContext(code,ctx);
  assert.equal(await vm.runInContext("resumeCultistAltarEventAfterBattle()",ctx),false);
  assert(store.has("battle-result"),"Failed save must not delete actual battle result");
  assert.equal(scenes,0,"Failed save must not open post-battle scene");
  accepted=true;
  assert.equal(await vm.runInContext("resumeCultistAltarEventAfterBattle()",ctx),true);
  assert.equal(store.has("battle-result"),false,"Successful result is consumed");
  assert.equal(scenes,1,"Post-battle scene opens once");
  assert.deepEqual(calls,[["fight",true],["fight",true]]);
  assert(!chunk("  async function confirmStoryBattleDeck() {", "  async function confirmMonsterBattle() {").includes("markCultistAltarEncounterComplete"),"Entry must never complete altar story");
  console.log("PASS cultist story completion delayed until battle outcome with failed-save retry");
}
checkCultistReturn().catch(error=>{console.error(error);process.exitCode=1;});
