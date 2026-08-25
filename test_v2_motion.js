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
const unitData = require("./unit-data.js");

const windowMock = {
  setTimeout,
  document: { createElement() { throw new Error("Canvas should not be created during registry checks."); } }
};
vm.runInNewContext(motionSource, { window: windowMock });
const motion = windowMock.V2Motion;

assert(motion, "V2Motion global must be installed.");
const enemyTypes = Object.keys(unitData.UNIT_TYPES).filter((type) => type !== "summoner");
assert(enemyTypes.length === 44, "The V2 enemy registry must contain 44 animated units.");
assert(motion.registeredTypes().length === 44, "All 44 enemy animation sheets must be registered.");
enemyTypes.forEach((type) => {
  assert(motion.supports(type), `Motion registry is missing: ${type}`);
  const relativeSheet = motion.sheetPath(type);
  assert(relativeSheet.includes("animation-sheets/uploaded-raw/"), `Uploaded sheet path is missing: ${type}`);
  assert(fs.existsSync(path.join(root, relativeSheet)), `Animation sheet file is missing: ${relativeSheet}`);
  assert(motion.frameCount(type, "attack") >= 4, `Attack frames are incomplete: ${type}`);
  assert(motion.frameCount(type, "hit") >= 3, `Hit frames are incomplete: ${type}`);
  assert(motion.frameCount(type, "death") >= 4, `Death frames are incomplete: ${type}`);
  assert(serviceWorker.includes(`./${relativeSheet}`), `Offline cache is missing: ${relativeSheet}`);
});
assert(!motion.supports("summoner"), "The separate protagonist art must not consume an enemy sheet.");
assert(motion.frameCount("goblinSoldier", "attack") === 5, "Goblin attack must have five frames.");
assert(motion.frameCount("goblinSoldier", "hit") === 4, "Goblin hit must have four frames.");
assert(motion.frameCount("goblinSoldier", "death") === 6, "Goblin death must have six frames.");
assert(motion.frameCount("minotaur", "attack") === 5, "Minotaur attack must have five frames.");
assert(motion.frameCount("minotaur", "hit") === 4, "Minotaur hit must have four frames.");
assert(motion.frameCount("minotaur", "death") === 6, "Minotaur death must have six frames.");
assert(motion.impactFrame("goblinSoldier") === 3, "Goblin impact frame must be synchronized.");
assert(motion.impactFrame("minotaur") === 3, "Minotaur impact frame must be synchronized.");

assert(
  battleHtml.indexOf("v2-motion.js?v=3") < battleHtml.indexOf("v2-battle.js?v=11"),
  "V2 motion runtime must load before the battle controller."
);
assert(battleSource.includes('playUnitMotion(attacker, "attack"'), "Battle attack hook is missing.");
assert(battleSource.includes('playUnitMotion(target, "hit"'), "Battle hit hook is missing.");
assert(battleSource.includes('playUnitMotion(unit, "death"'), "Battle death hook is missing.");
assert(battleSource.includes("if (!animated)"), "Static animation fallback is missing.");
assert(!motionSource.includes("removeConnectedBackdrop"), "Animation frames must not remove the sheet background.");
assert(!motionSource.includes("isBackdrop"), "Animation frames must preserve original dark pixels.");
assert(
  motionSource.includes("left + 2, y0 + 2") && motionSource.includes("left - 4") && motionSource.includes("y0 - 4"),
  "Animation frames must crop only two pixels inside each sheet cell."
);
assert(indexHtml.includes('href="v2-animation-practice.html"'), "Start screen motion lab link is missing.");
assert(serviceWorker.includes("necromancer-expedition-v60"), "Service worker cache version was not bumped.");

console.log("SUCCESS: shared V2 attack, hit, and death motion integration checks passed.");
