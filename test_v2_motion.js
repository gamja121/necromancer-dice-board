const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = __dirname;
const motionSource = fs.readFileSync(path.join(root, "v2-motion.js"), "utf8");
const battleSource = fs.readFileSync(path.join(root, "v2-battle.js"), "utf8");
const battleHtml = fs.readFileSync(path.join(root, "v2.html"), "utf8");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const serviceWorker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

const windowMock = {
  setTimeout,
  document: { createElement() { throw new Error("Canvas should not be created during registry checks."); } }
};
vm.runInNewContext(motionSource, { window: windowMock });
const motion = windowMock.V2Motion;

assert(motion, "V2Motion global must be installed.");
assert(motion.supports("goblinSoldier"), "Goblin motion registry is missing.");
assert(motion.supports("minotaur"), "Minotaur motion registry is missing.");
assert(!motion.supports("spear"), "Units without a sheet must use the static fallback.");
assert(motion.frameCount("goblinSoldier", "attack") === 5, "Goblin attack must have five frames.");
assert(motion.frameCount("goblinSoldier", "hit") === 4, "Goblin hit must have four frames.");
assert(motion.frameCount("goblinSoldier", "death") === 6, "Goblin death must have six frames.");
assert(motion.frameCount("minotaur", "attack") === 5, "Minotaur attack must have five frames.");
assert(motion.frameCount("minotaur", "hit") === 4, "Minotaur hit must have four frames.");
assert(motion.frameCount("minotaur", "death") === 5, "Minotaur death must have five frames.");
assert(motion.impactFrame("goblinSoldier") === 3, "Goblin impact frame must be synchronized.");
assert(motion.impactFrame("minotaur") === 3, "Minotaur impact frame must be synchronized.");

assert(
  battleHtml.indexOf("v2-motion.js?v=1") < battleHtml.indexOf("v2-battle.js?v=10"),
  "V2 motion runtime must load before the battle controller."
);
assert(battleSource.includes('playUnitMotion(attacker, "attack"'), "Battle attack hook is missing.");
assert(battleSource.includes('playUnitMotion(target, "hit"'), "Battle hit hook is missing.");
assert(battleSource.includes('playUnitMotion(unit, "death"'), "Battle death hook is missing.");
assert(battleSource.includes("if (!animated)"), "Static animation fallback is missing.");
assert(indexHtml.includes('href="v2-animation-practice.html"'), "Start screen motion lab link is missing.");
assert(serviceWorker.includes("necromancer-expedition-v57"), "Service worker cache version was not bumped.");
assert(serviceWorker.includes("goblin-motion-sheet.jpg"), "Goblin motion sheet is not cached.");
assert(serviceWorker.includes("minotaur-motion-sheet.jpg"), "Minotaur motion sheet is not cached.");

console.log("SUCCESS: shared V2 attack, hit, and death motion integration checks passed.");
