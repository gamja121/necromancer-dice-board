const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = __dirname;
const html = fs.readFileSync(path.join(root, "v2-auto-battle-practice.html"), "utf8");
const css = fs.readFileSync(path.join(root, "v2-auto-battle-practice.css"), "utf8");
const source = fs.readFileSync(path.join(root, "v2-auto-battle-practice.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

assert(html.includes('id="allyTeam"'), "Ally team container is missing.");
assert(html.includes('id="enemyTeam"'), "Enemy team container is missing.");
assert(html.includes("v2-landscape.js?v=1"), "Battle landscape helper is missing.");
assert(css.includes("rotate(90deg)"), "Battle must rotate itself in portrait mode.");
assert(css.includes("grid-template-columns: repeat(4, 1fr)"), "Each team must stand in one horizontal row.");
assert(css.includes(".enemy-team .unit img { transform: scaleX(-1)"), "Enemy units must face the allied units.");
assert(css.includes(".unit.is-targeted"), "The hit unit must step forward and enlarge.");
assert(css.includes("scale(1.43)"), "The attacking unit must enlarge during its action.");
assert(css.includes("--depth-scale: 1.14"), "Outer units must appear closer to the viewer.");
assert(css.includes("--depth-scale: .90"), "Inner units must appear farther from the viewer.");
assert(css.includes("--unit-layer: 18"), "Outer units must overlap above inner units.");
assert(css.includes(".team { position: absolute; z-index: auto"), "Teams must not trap active units in separate stacking layers.");
assert(css.includes(".unit.is-attacking { z-index: 42"), "Attacker must render above every resting unit.");
assert(css.includes(".unit.is-targeted { z-index: 41"), "Hit target must render above every resting unit.");
assert(css.includes("--action-shift-x: 128%"), "Far allied slots must move to the fixed action position.");
assert(css.includes("--action-shift-x: -128%"), "Far enemy slots must move to the fixed action position.");
assert(css.includes("translate(var(--action-shift-x), 14%) scale(1.43)"), "Attackers must use the fixed action position.");
assert(css.includes("translate(var(--action-shift-x), 11%) scale(1.32)"), "Hit targets must use the fixed action position.");
assert(css.includes("hit-red-flash"), "Hit feedback must use a red flash.");
assert(!css.includes("#ffdfae"), "White hit outline must be removed.");
assert(source.includes("TEAM_DATA.ally.map"), "Four ally states are not created.");
assert(source.includes("TEAM_DATA.enemy.map"), "Four enemy states are not created.");
assert((source.match(/unit\("/g) || []).length === 8, "Battle must define exactly eight units.");
assert(source.includes("turnQueue = units.filter"), "Per-turn action queue is missing.");
assert(source.includes("right.unitState.speed - left.unitState.speed"), "Units must act in descending speed order.");
assert(source.includes("let actor = turnQueue.shift()"), "Each queued unit must receive one action per turn.");
assert(source.includes("unitState.gauge = unitState.alive ? 100 : 0"), "Turn-ready indicator is missing.");
assert(source.includes("Math.random() * targets.length"), "Automatic target selection is missing.");
assert(source.includes('playMotion(actor, "attack"'), "Attack motion is missing.");
assert(source.includes('playMotion(target, "hit"'), "Hit motion is missing.");
assert(source.includes('playMotion(target, "death"'), "Death motion is missing.");

for (const slug of ["death-knight", "skeleton-spear", "ghoul", "ancient-treant", "goblin-rider", "orc-warrior", "boulder-ogre", "minotaur"]) {
  assert(source.includes(`unit("${slug}"`), `Unit is missing: ${slug}`);
  for (const motion of ["attack", "hit", "death"]) {
    assert(fs.existsSync(path.join(root, `art/v2-style/animation-test-frames/${slug}/${motion}-01.png`)), `Motion frame is missing: ${slug}/${motion}`);
  }
}

assert(worker.includes('necromancer-expedition-v107'), "Service worker cache version was not advanced.");
assert(worker.includes("v2-auto-battle-practice.html"), "Auto battle page is not cached.");
assert(worker.includes("v2-auto-battle-practice.js?v=5"), "Auto battle logic is not cached.");
console.log("SUCCESS: landscape 4v4 speed auto-battle checks passed.");
