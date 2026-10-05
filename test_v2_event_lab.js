const fs = require("fs");
const assert = require("assert");

const html = fs.readFileSync("v2-event-lab.html", "utf8");
const css = fs.readFileSync("v2-event-lab.css", "utf8");
const js = fs.readFileSync("v2-event-lab.js", "utf8");
const data = fs.readFileSync("v2-event-data.js", "utf8");
const v2 = fs.readFileSync("v2.html", "utf8");
const worker = fs.readFileSync("service-worker.js", "utf8");
const battleJs = fs.readFileSync("v2-auto-battle-practice.js", "utf8");
const battleHtml = fs.readFileSync("v2-auto-battle-practice.html", "utf8");

for (const id of ["eventList","contaminationInput","loopInput","flagList","choiceList","rollPanel","historyList"]) {
  assert(html.includes(`id="${id}"`), `Event Lab is missing #${id}`);
}
for (const eventId of [
  "graveyard_child_ambush_01",
  "forest_child_01",
  "village_child_parent_01",
  "graveyard_child_spirit_01",
  "forest_child_changed_01",
  "altar_child_blessing_01"
]) {
  assert(data.includes(eventId), `Sample event missing: ${eventId}`);
}
assert(data.includes("child_saved") && data.includes("purification_clue"), "Persistent world flags are missing");
assert(js.includes("conditionChecks") && js.includes("eventAvailable"), "Condition tester is missing");
assert(js.includes("data-monster-tag") || html.includes("data-monster-tag"), "Monster-tag tester is missing");
assert(js.includes('data-roll') || html.includes('data-roll'), "Forced roll controls are missing");
assert(js.includes("nextEvents"), "Follow-up event navigation is missing");
assert(v2.includes('href="v2-event-lab.html"'), "V2 screen must link to Event Lab");

for (const file of [
  "v2-event-lab.html",
  "v2-event-lab.css?v=20261005-graveyard-poster-stage17-1",
  "v2-event-lab.js?v=20261005-graveyard-poster-stage17-1",
  "v2-event-data.js?v=20261005-graveyard-poster-stage17-1"
]) {
  assert(worker.includes(file), `Event Lab is not cached: ${file}`);
}

console.log("v2 event lab tests passed");

assert(html.includes('id="eventScenePreview"'), "Event Lab cemetery scene preview is missing");
assert(html.includes("event-child-idle"), "Child idle actor is missing from cemetery scene");
assert(css.includes("aspect-ratio:21/9"), "Cemetery event must use panoramic composition");
assert(!css.includes("@keyframes eventChildIdle"), "Stage 1 child must remain a static first-frame actor");
assert(css.includes("event-child-idle-01.png"), "Transparent child static sprite is not wired");
assert(css.includes(".event-graveyard-g1{left:39.5278%;top:11.2138%;width:25%;z-index:8}"), "Approved cemetery layout is not reused");
assert(data.includes('scene: "graveyard_child_ambush_intro"'), "Cemetery ambush scene marker is missing");
assert(js.includes('event.scene === "graveyard_child_ambush_intro"'), "Scene preview switching is missing");

assert(worker.includes("event-child-idle-01.png?v=20261005-graveyard-poster-stage17-1"), "Child static sprite is not cached");

{
  const start = data.indexOf('id: "graveyard_child_ambush_01"');
  const end = data.indexOf('id: "forest_child_01"', start);
  const ambush = data.slice(start, end);
  assert(ambush.includes('id: "protect_child"'), "Ambush event is missing protect choice");
  assert(ambush.includes('text: "아이를 구한다"'), "Ambush protect choice label is missing");
  assert(ambush.includes('id: "leave_child"'), "Ambush event is missing leave choice");
  assert(ambush.includes('text: "지나친다"'), "Ambush leave choice label is missing");
  assert(ambush.includes('action: "eventBattle"'), "Protect choice must start event battle");
  assert(ambush.includes('enemies: ["ghoul"]'), "Protect choice must lock the ghoul enemy");
  assert(ambush.includes("graveyard_child_abandoned: true"), "Leave choice must remember abandoning the child");
  assert(!ambush.includes("nextEvents:"), "Stage 7 must not connect post-battle follow-up events yet");
  assert(!ambush.includes("roll:"), "Stage 7 uses the real battle screen, not an event-lab roll");
}

assert(js.includes("function startEventBattle"), "Event battle handoff helper is missing");
assert(js.includes('from: "event"'), "Event battle handoff must mark its source");
assert(battleJs.includes('const fromEvent = battleQuery.get("from") === "event"'), "Battle screen does not recognize event battles");
assert(battleJs.includes("requestedEventEnemySlugs"), "Battle screen does not accept fixed event enemies");
assert(battleJs.includes('fromEvent && team === "enemy"'), "Event enemy lineup must stay locked");
assert(battleHtml.includes("v2-auto-battle-practice.js?v=132"), "Battle screen JS cache version was not bumped");

assert(js.includes('classList.toggle("is-cinematic-rescued", isRescuedScene)'), "Stage 9 rescue scene class is missing");
assert(js.includes('el.eventDialogueText.textContent = isRescuedScene ? "…고마워요." : "…!"'), "Stage 9 rescued child dialogue is missing");
assert(css.includes(".event-card.is-cinematic-rescued .event-ghoul"), "Stage 9 must hide the ghoul after victory");
assert(css.includes(".event-card.is-cinematic-rescued #choiceList"), "Stage 9 must hide the old choice list after victory");
assert(css.includes("event-child-idle-breathe 3.4s"), "Stage 9 must keep the child idle breathing after rescue");
assert(html.includes('id="eventSceneNarration"'), "Stage 10 must show story context inside the panorama");
assert(js.includes('document.body.classList.add("is-ingame-event")'), "Stage 10 must support in-game event mode");
assert(css.includes("body.is-ingame-event .event-stage"), "Stage 10 must hide lab chrome and present the event as gameplay");
assert(css.includes("right:1%!important;bottom:26%!important"), "Child portrait must match the first knight-commander composition");
assert(html.includes("art/v2-style/event-portraits/dark-eyed-boy.png?v=1"), "Event must use the dedicated child portrait instead of the field sprite");
assert(html.includes("art/v2-style/ui/intro-dialogue-box.webp?v=6"), "Event must reuse the established intro dialogue frame");
