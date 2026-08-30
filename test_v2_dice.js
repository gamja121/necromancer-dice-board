const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = __dirname;
const html = fs.readFileSync(path.join(root, "v2-dice-practice.html"), "utf8");
const source = fs.readFileSync(path.join(root, "v2-dice-practice.js"), "utf8");
const processor = fs.readFileSync(path.join(root, "scripts/process-dice-test-sheet.ps1"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

assert(html.includes('id="rollButton"'), "Dice stage is missing.");
assert(html.includes('id="rollAction"'), "Dice roll action is missing.");
assert(source.includes("Math.floor(Math.random() * 6) + 1"), "Random 1-6 result selection is missing.");
assert(source.includes("length: 12"), "The twelve rolling frames are not configured.");
assert(source.includes("length: 6"), "The six result frames are not configured.");
assert(processor.includes("SaveCell(cleanOne, 2, 0"), "Clean result face 1 is not sourced from sheet 2.");
assert(processor.includes("SaveCell(cleanSix, 2, 0"), "Clean result face 6 is not sourced from sheet 1.");
for (let index = 1; index <= 12; index += 1) {
  const relative = `art/v2-style/dice-test/frames/roll-${String(index).padStart(2, "0")}.png`;
  assert(fs.existsSync(path.join(root, relative)), `Rolling frame is missing: ${relative}`);
}
for (let value = 1; value <= 6; value += 1) {
  const relative = `art/v2-style/dice-test/frames/result-${String(value).padStart(2, "0")}.png`;
  assert(fs.existsSync(path.join(root, relative)), `Result frame is missing: ${relative}`);
}
assert(worker.includes("v2-dice-practice.html"), "Dice test page is not cached.");
assert(worker.includes("dice-test/frames/roll-${String(index).padStart"), "Dice rolling frames are not cached.");
assert(worker.includes("dice-test/frames/result-${String(value).padStart"), "Dice result frames are not cached.");
console.log("SUCCESS: dice rolling test integration checks passed.");
