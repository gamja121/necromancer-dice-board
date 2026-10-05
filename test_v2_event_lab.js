const fs = require("fs");
const assert = require("assert");

const html = fs.readFileSync("v2-event-lab.html", "utf8");
const css = fs.readFileSync("v2-event-lab.css", "utf8");
const js = fs.readFileSync("v2-event-lab.js", "utf8");
const data = fs.readFileSync("v2-event-lab-data.js", "utf8");
const worker = fs.readFileSync("service-worker.js", "utf8");

assert(data.includes('id: "graveyard_child_ambush_lab_01"'));
assert(data.includes('tags: Object.freeze(["사건", "공동묘지", "습격받는아이"])'));
assert(data.includes('description: "묘비 사이에서 아이가 뒷걸음친다. 바로 뒤, 구울이 몸을 일으킨다."'));
assert(data.includes('speaker: "아이"'));
assert(data.includes('text: "…도와주세요!"'));
assert(data.includes('text: "아이를 구한다"'));
assert(data.includes('text: "지나친다"'));

for (const id of ["eventCard","eventBaseImage","eventGhoulLayer","eventDescription","eventAdvance","eventDialogue","eventDialogueAdvance","eventChoices","eventOutcome"]) {
  assert(html.includes(`id="${id}"`), `Layered Event Lab is missing #${id}`);
}
assert(html.includes("intro-dialogue-box.webp?v=6"));
assert(js.includes("BASE_IMAGE_CHUNKS"));
assert(js.includes("GHOUL_IMAGE_CHUNKS"));
assert(js.includes("loadChunkImage"));
assert(js.includes("removeBlackBackground"));
assert(js.includes("loadGhoulLayer"));
assert(js.includes('screen.orientation.lock("landscape")'));
assert(js.includes('phase = "threat"'));
assert(js.includes('phase = "dialogue"'));
assert(js.includes('phase = "choice"'));
assert(js.includes("revealGhoul"));
assert(js.includes("showDialogue"));
assert(js.includes("showChoices"));
assert(css.includes(".event-ghoul-layer"));
assert(css.includes("mix-blend-mode:normal!important"));
assert(css.includes("@keyframes ghoul-layer-lunge-landscape"));
assert(css.includes(".event-dialogue-box"));
assert(css.includes(".event-tags"));
assert(css.includes("Landscape-only Event Lab · stage 3"));
assert(css.includes("@media (orientation:portrait)"));
assert(css.includes("transform:rotate(90deg) translateY(-100%)"));
assert(css.includes("bottom:7%!important"));
assert(css.includes("width:58%!important"));
assert(css.includes("Event Lab cinematic gaze direction · stage 4"));
assert(css.includes("@keyframes event-camera-child-focus"));
assert(css.includes("@keyframes event-camera-threat-focus"));
assert(css.includes("@keyframes event-camera-dialogue-focus"));
assert(css.includes("@keyframes event-camera-impact"));
assert(css.includes("@keyframes event-threat-flash"));

for (const file of [
  "v2-event-lab.html",
  "v2-event-lab.css?v=20261005-event-lab-gaze-stage4",
  "v2-event-lab.js?v=20261005-event-lab-gaze-stage4",
  "v2-event-lab-data.js?v=20261005-event-lab-gaze-stage4",
  "assets/event-lab/graveyard-child/base/part-000.txt",
  "assets/event-lab/graveyard-child/base/part-001.txt",
  "assets/event-lab/graveyard-child/ghoul/part-000.txt",
  "assets/event-lab/graveyard-child/ghoul/part-001.txt"
]) assert(worker.includes(file), `Event Lab layered asset is not cached: ${file}`);

console.log("v2 event lab layered cemetery tests passed");
