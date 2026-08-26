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
const practiceHtml = fs.readFileSync(path.join(root, "v2-animation-practice.html"), "utf8");
const practiceSource = fs.readFileSync(path.join(root, "v2-animation-practice.js"), "utf8");
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
  const processedRoot = motion.frameRoot(type);
  if (processedRoot) {
    for (const animation of ["attack", "hit", "death"]) {
      for (let index = 1; index <= motion.frameCount(type, animation); index += 1) {
        const frame = path.join(root, "art", "v2-style", "animation-frames", processedRoot, `${animation}-${String(index).padStart(2, "0")}.png`);
        assert(fs.existsSync(frame), `Processed animation frame is missing: ${frame}`);
      }
    }
  }
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
  battleHtml.indexOf("v2-motion.js?v=5") < battleHtml.indexOf("v2-battle.js?v=11"),
  "V2 motion runtime must load before the battle controller."
);
assert(battleSource.includes('playUnitMotion(attacker, "attack"'), "Battle attack hook is missing.");
assert(battleSource.includes('playUnitMotion(target, "hit"'), "Battle hit hook is missing.");
assert(battleSource.includes('playUnitMotion(unit, "death"'), "Battle death hook is missing.");
assert(battleSource.includes("if (!animated)"), "Static animation fallback is missing.");
assert(!motionSource.includes("removeConnectedBackdrop"), "Dark animation frames must not remove the sheet background.");
assert(!motionSource.includes("isBackdrop"), "Animation frames must preserve original dark pixels.");
for (const [type, folder] of Object.entries({ ghoul: "ghoul", minotaur: "minotaur", yeti: "yeti", iceLord: "ice-lord", goblinCommoner: "goblin-commoner" })) {
  assert(motion.backdrop(type) === "processed", `${type} must use preprocessed transparent frames.`);
  assert(motion.frameRoot(type) === folder, `${type} processed frame folder is incorrect.`);
}
assert(
  motionSource.includes("left + 2, y0 + 2") && motionSource.includes("left - 4") && motionSource.includes("y0 - 4"),
  "Animation frames must crop only two pixels inside each sheet cell."
);
assert(indexHtml.includes('href="v2-animation-practice.html">모션 테스트</a>'), "Start screen motion test link is missing.");
assert(practiceHtml.includes('id="unitSelect"'), "Motion test unit selector is missing.");
for (const id of ["attackBtn", "hitBtn", "deathBtn"]) {
  assert(practiceHtml.includes(`id="${id}"`), `Motion test control is missing: ${id}`);
}
assert(!practiceHtml.includes("goblinFighter") && !practiceHtml.includes("minotaurFighter"), "Motion test must show only one unit at a time.");
assert(practiceSource.includes("window.V2Motion.registeredTypes()"), "Motion test must expose every registered unit.");
assert(practiceSource.includes("window.V2Motion.play"), "Motion test must retain the shared battle motion fallback.");
assert(practiceSource.includes('type === "ghoul" ? frames.attack[0]'), "Ghoul idle must not retain the red final attack effect.");
const testOnlyFrames = {
  ghoul: "ghoul",
  goblinSoldier: "goblin-soldier",
  demonDeathKnight: "death-knight",
  spear: "skeleton-spear",
  ragingTreant: "raging-treant",
  stoneGolem: "stone-golem"
};
for (const [type, folder] of Object.entries(testOnlyFrames)) {
  assert(practiceSource.includes(`${type}: "${folder}"`), `Motion test frame mapping is missing: ${type}`);
  for (const [motionName, count] of Object.entries({ attack: 5, hit: 4, death: 6 })) {
    for (let index = 1; index <= count; index += 1) {
      const relative = `art/v2-style/animation-test-frames/${folder}/${motionName}-${String(index).padStart(2, "0")}.png`;
      assert(fs.existsSync(path.join(root, relative)), `Motion test frame is missing: ${relative}`);
    }
  }
}
assert(!motionSource.includes("animation-test-frames"), "Test-approved frames must not leak into the main battle runtime.");
assert(serviceWorker.includes("necromancer-expedition-v66"), "Service worker cache version was not bumped.");
assert(serviceWorker.includes("PROCESSED_ANIMATION_FRAMES"), "Processed animation frames must be added to the offline cache.");
assert(serviceWorker.includes("MOTION_TEST_FRAMES"), "Motion-test frames must be added to the offline cache.");

console.log("SUCCESS: shared V2 attack, hit, and death motion integration checks passed.");
