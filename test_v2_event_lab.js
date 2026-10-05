const fs = require("fs");
const assert = require("assert");

const html = fs.readFileSync("v2-event-lab.html", "utf8");
const css = fs.readFileSync("v2-event-lab.css", "utf8");
const js = fs.readFileSync("v2-event-lab.js", "utf8");
const data = fs.readFileSync("v2-event-lab-data.js", "utf8");
const v2 = fs.readFileSync("v2.html", "utf8");
const worker = fs.readFileSync("service-worker.js", "utf8");

assert(html.includes('class="event-poster is-empty"'), "Event Lab must open directly as a poster");
assert(html.includes('id="posterTitle"'), "Poster title slot is missing");
assert(html.includes("새 사건"), "Poster shell title is missing");
assert(html.includes("사건 내용이 여기에 표시됩니다."), "Poster shell body is missing");
assert(html.includes('id="eventCount"'), "Poster shell event counter is missing");
assert(html.includes("선택지 1") && html.includes("선택지 2"), "Poster choice placeholders are missing");
assert(!html.includes("eventScenePreview"), "Old Event Lab cemetery scene must remain removed");
assert(!html.includes("eventList"), "Old Event Lab event list must remain removed");
assert(!html.includes("historyList"), "Old Event Lab history UI must remain removed");

assert(data.includes("window.V2EventLabData"), "Event Lab must use isolated test data");
assert(data.includes("events: Object.freeze([])"), "Event Lab test data must start empty");
assert(!data.includes("graveyard_child_ambush_01"), "Old cemetery sample event must stay removed from Event Lab data");
assert(!data.includes("forest_child_01"), "Old forest sample event must stay removed from Event Lab data");

assert(js.includes("window.V2EventLabData?.events"), "Event Lab runtime must read isolated lab data");
assert(!js.includes("conditionChecks"), "Old condition tester runtime must remain removed");
assert(!js.includes("startEventBattle"), "Old Event Lab battle handoff must remain removed");

assert(css.includes(".event-poster"), "Poster shell styling is missing");
assert(css.includes("@keyframes poster-enter"), "Poster entrance effect is missing");
assert(css.includes("@keyframes poster-drift"), "Poster idle effect is missing");
assert(v2.includes('href="v2-event-lab.html"'), "V2 screen must keep the Event Lab link");

for (const file of [
  "v2-event-lab.html",
  "v2-event-lab.css?v=20261005-event-lab-poster-shell-1",
  "v2-event-lab.js?v=20261005-event-lab-poster-shell-1",
  "v2-event-lab-data.js?v=20261005-event-lab-poster-shell-1"
]) {
  assert(worker.includes(file), `Event Lab poster asset is not cached: ${file}`);
}

console.log("v2 event lab poster shell tests passed");
