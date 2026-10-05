const fs = require("fs");
const assert = require("assert");

const html = fs.readFileSync("v2-event-lab.html", "utf8");
const css = fs.readFileSync("v2-event-lab.css", "utf8");
const js = fs.readFileSync("v2-event-lab.js", "utf8");
const data = fs.readFileSync("v2-event-lab-data.js", "utf8");
const v2 = fs.readFileSync("v2.html", "utf8");
const worker = fs.readFileSync("service-worker.js", "utf8");

assert(html.includes("등록된 테스트 이벤트가 없습니다."), "Event Lab must be reset to an empty workspace");
assert(html.includes('id="eventCount"'), "Empty Event Lab status is missing");
assert(!html.includes("eventScenePreview"), "Old Event Lab cemetery scene must be removed");
assert(!html.includes("eventList"), "Old Event Lab event list must be removed");
assert(!html.includes("historyList"), "Old Event Lab history UI must be removed");
assert(!html.includes("contaminationInput"), "Old Event Lab state controls must be removed");
assert(!html.includes("flagList"), "Old Event Lab flag editor must be removed");
assert(!html.includes("choiceList"), "Old Event Lab choices must be removed");

assert(data.includes("window.V2EventLabData"), "Event Lab must use isolated test data");
assert(data.includes("events: Object.freeze([])"), "Event Lab test data must start empty");
assert(!data.includes("graveyard_child_ambush_01"), "Old cemetery sample event must be removed from Event Lab data");
assert(!data.includes("forest_child_01"), "Old forest sample event must be removed from Event Lab data");

assert(js.includes("window.V2EventLabData?.events"), "Event Lab runtime must read isolated lab data");
assert(!js.includes("conditionChecks"), "Old condition tester runtime must be removed");
assert(!js.includes("startEventBattle"), "Old Event Lab battle handoff must be removed");

assert(css.includes(".empty-lab"), "Empty Event Lab styling is missing");
assert(v2.includes('href="v2-event-lab.html"'), "V2 screen must keep the Event Lab link");

for (const file of [
  "v2-event-lab.html",
  "v2-event-lab.css?v=20261005-event-lab-reset-1",
  "v2-event-lab.js?v=20261005-event-lab-reset-1",
  "v2-event-lab-data.js?v=20261005-event-lab-reset-1"
]) {
  assert(worker.includes(file), `Event Lab reset asset is not cached: ${file}`);
}

console.log("v2 event lab reset tests passed");
