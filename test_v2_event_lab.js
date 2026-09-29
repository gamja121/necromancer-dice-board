const fs = require("fs");
const assert = require("assert");

const html = fs.readFileSync("v2-event-lab.html", "utf8");
const css = fs.readFileSync("v2-event-lab.css", "utf8");
const js = fs.readFileSync("v2-event-lab.js", "utf8");
const data = fs.readFileSync("v2-event-data.js", "utf8");
const v2 = fs.readFileSync("v2.html", "utf8");
const worker = fs.readFileSync("service-worker.js", "utf8");

for (const id of ["eventList","contaminationInput","loopInput","flagList","choiceList","rollPanel","historyList"]) {
  assert(html.includes(`id="${id}"`), `Event Lab is missing #${id}`);
}
for (const eventId of [
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
  "v2-event-lab.css?v=1",
  "v2-event-lab.js?v=1",
  "v2-event-data.js?v=1"
]) {
  assert(fs.existsSync(file.split("?")[0]), `Event Lab resource is missing: ${file}`);
}
assert(worker.includes("function networkFirst") && worker.includes("function cacheFirst"),
  "Service worker must retain on-demand caching for non-core Event Lab resources.");

console.log("v2 event lab tests passed");
