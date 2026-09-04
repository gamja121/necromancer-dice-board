const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = __dirname;
const html = fs.readFileSync(path.join(root, "v2.html"), "utf8");
const css = fs.readFileSync(path.join(root, "v2-battle.css"), "utf8");
const battle = fs.readFileSync(path.join(root, "v2-battle.js"), "utf8");
const serviceWorker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

const battlefields = [
  "wasteland-chasm-battlefield.jpg",
  "haunted-forest-ruins-battlefield.jpg",
  "necropolis-pyramids-battlefield.jpg"
];

assert(html.includes('id="battlefieldName"'), "Battlefield plaque is missing from V2.");
assert(html.includes("v2-battle.css?v=7"), "V2 must load the illustrated UI stylesheet version.");
assert(html.includes("v2-battle.js?v=12"), "V2 must load the battlefield controller version.");
assert(css.includes("V2 illustrated wood-and-parchment interface"), "Wood-and-parchment UI theme is missing.");
assert(css.includes(".battlefield-plaque"), "Battlefield plaque styles are missing.");
assert(battle.includes("function selectBattlefield()"), "Random battlefield selector is missing.");
assert(battle.includes("selectBattlefield();"), "Battle start does not select a battlefield.");

battlefields.forEach((file) => {
  assert(battle.includes(file), `Battlefield registry is missing ${file}.`);
  assert(serviceWorker.includes(file), `Offline cache is missing ${file}.`);
  assert(fs.existsSync(path.join(root, "art", "v2-style", "battle-backgrounds", "uploaded-raw", file)), `Battlefield file is missing: ${file}.`);
});

console.log("SUCCESS: V2 illustrated UI and random battlefield checks passed.");
