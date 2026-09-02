const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const brands = require("./v2-battle-brands.js");
function unit(brand, team = "ally", hp = 10) {
  return { brand, team, hp, maxHp: 10, attack: 3, alive: true, poison: 0, brandMode: "normal",
    slug: "ghoul", name: "test", speed: 3, gauge: 100, frames: { attack: 5, hit: 4, death: 6 },
    image: {}, element: { classList: { add() {}, remove() {} } } };
}
const matrix = {
  critical: ["curse", "normal", "normal", "normal", "blessing", "blessing"],
  vampire: ["normal", "blessing", "curse", "blessing", "normal", "blessing"],
  guard: ["blessing", "blessing", "normal", "normal", "normal", "curse"],
  poison: ["blessing", "curse", "blessing", "curse", "blessing", "curse"],
  summon: ["normal", "blessing", "normal", "blessing", "normal", "curse"],
  healing: ["curse", "normal", "normal", "normal", "normal", "blessing"]
};
for (const [id, modes] of Object.entries(matrix)) {
  modes.forEach((mode, i) => assert.equal(brands.mode(id, i + 1), mode, id + (i + 1)));
}
assert.equal(Object.keys(brands.samples).length, 8);
assert.equal(new Set(Object.values(brands.samples)).size, 6);
let a = unit("critical"), b = unit("vampire", "enemy");
brands.startRound([a, b], 5);
assert.equal(brands.attack(a, b).damage, 6);
brands.startRound([a, b], 1);
assert.equal(brands.attack(a, b).damage, 0);
assert.equal(brands.attack(a, b).miss, true);
a = unit("vampire", "ally", 1); b = unit("critical", "enemy", 2);
brands.startRound([a, b], 2);
assert.deepEqual(brands.attack(a, b), { damage: 2, recovered: 2, miss: false, immune: false });
assert.equal(a.hp, 3, "Overkill must not inflate lifesteal");
a = unit("vampire", "ally", 9); b = unit("critical", "enemy");
brands.startRound([a, b], 4);
assert.equal(brands.attack(a, b).recovered, 1, "Healing must cap at maximum HP");
a = unit("critical"); b = unit("vampire", "enemy");
brands.startRound([a, b], 3);
assert.equal(brands.attack(a, b).damage, 6, "Vulnerability doubles received damage");
a = unit("vampire", "ally", 1); b = unit("guard", "enemy");
brands.startRound([a, b], 2);
assert.equal(brands.attack(a, b).damage, 0);
assert.equal(a.hp, 1, "Invulnerability must prevent lifesteal");
brands.startRound([a, b], 6);
assert.equal(brands.attack(b, a).miss, true);
a = unit("poison"); b = unit("critical", "enemy");
brands.startRound([a, b], 1);
brands.attack(a, b);
assert.equal(b.poison, 1);
assert.equal(brands.beforeAction(b), 1);
assert.equal(b.hp, 6);
assert.equal(brands.beforeAction(b), 0, "Poison ticks only once");
b.hp = 1; b.poison = 1;
brands.beforeAction(b);
assert.equal(b.alive, false);
a = unit("poison", "ally", 1); b = unit("guard", "enemy");
assert.deepEqual(brands.startRound([a, b], 2), [a], "Self damage can kill at turn start");
a = unit("summon"); b = unit("critical", "ally", 4); b.isSummon = true;
const ordinary = unit("guard", "ally", 4), foe = unit("critical", "enemy", 4);
brands.startRound([a, b, ordinary, foe], 2);
assert.equal(b.hp, 6); assert.equal(ordinary.hp, 4); assert.equal(foe.hp, 4);
brands.startRound([a, b, ordinary, foe], 6);
assert.equal(b.hp, 5);
assert.doesNotThrow(() => brands.startRound([a, ordinary, foe], 4));
a = unit("healing", "ally", 5); b = unit("critical", "ally", 3);
brands.startRound([a, b, foe], 6);
assert.equal(a.hp, 6); assert.equal(b.hp, 4); assert.equal(foe.hp, 4);
brands.startRound([a, b, foe], 1, () => 0);
assert.equal(foe.hp, 5);
assert.equal(b.hp, 4);
brands.startRound([a, b, foe], 3);
assert.equal(b.brandMode, "normal", "Prior-turn blessing must reset");

// Run the actual turn/action integration, including early deaths and cancellation.
const source = fs.readFileSync(__dirname + "/v2-auto-battle-practice.js", "utf8");
const page = fs.readFileSync(__dirname + "/v2-auto-battle-practice.html", "utf8");
assert(page.indexOf('src="v2-battle-brands.js') < page.indexOf('src="v2-auto-battle-practice.js'), "Brand engine must load before battle initialization");
const hp = { attrs: {}, setAttribute(key, value) { this.attrs[key] = value; } };
const fill = { style: {} };
const badge = { hidden: true, textContent: "", className: "" };
const domContext = {
  V2BattleBrands: brands,
  selected: { ...unit("critical"), maxHp: 12, hp: 6, element: {
    querySelector(selector) {
      assert([".hp-bar", ".hp-bar i", ".brand-indicator"].includes(selector), "Removed labels must not be accessed");
      return selector === ".hp-bar" ? hp : selector === ".brand-indicator" ? badge : fill;
    }, classList: { toggle() {} }
  } }
};
vm.createContext(domContext);
vm.runInContext(source.slice(source.indexOf("  function makeState("), source.indexOf("  function renderTeams(")), domContext);
vm.runInContext(source.slice(source.indexOf("  function updateUnit("), source.indexOf("  function updateHud(")), domContext);
vm.runInContext("updateUnit(selected)", domContext);
assert.equal(fill.style.width, "50%");
assert.equal(hp.attrs["aria-valuenow"], "6");
assert.equal(hp.attrs["aria-valuemax"], "12");
assert.equal(badge.hidden, true, "Initial badge must stay hidden");
domContext.units = [domContext.selected];
for (const [brand, expectedModes] of Object.entries(matrix)) {
  domContext.selected.brand = brand;
  for (let roll = 1; roll <= 6; roll++) {
    vm.runInContext(`showRolledBrands(${roll})`, domContext);
    const expected = expectedModes[roll - 1];
    assert.equal(badge.hidden, expected === "normal", `${brand}/${roll}: visibility`);
    if (expected !== "normal") {
      assert.equal(badge.className, `brand-indicator is-${expected}`);
      assert(badge.textContent.includes(expected === "blessing" ? "축복" : "저주"));
      assert(badge.textContent.includes(brands.definitions[brand].name.replace("의 낙인", "")));
    } else assert.equal(badge.textContent, "");
  }
}
assert.equal(domContext.selected.hp, 6, "Result preview must not apply combat effects twice");
vm.runInContext("showRolledBrands(null)", domContext);
assert.equal(badge.hidden, true, "New roll must clear old badge");
domContext.selected.brand = "critical";
vm.runInContext("showRolledBrands(5)", domContext);
assert.equal(badge.hidden, false);
domContext.selected.alive = false;
vm.runInContext("updateUnit(selected)", domContext);
assert.equal(badge.hidden, true, "Dead units must not display an active badge");
const badgeCss = fs.readFileSync(__dirname + "/v2-auto-battle-practice.css", "utf8");
assert(badgeCss.includes(".brand-indicator.is-blessing { color: #8ee69a; }"));
assert(badgeCss.includes(".brand-indicator.is-curse { color: #ff827a; }"));
assert(badgeCss.includes("bottom: calc(88% + 6px)"), "Badge must sit above the 12%-top HP bar");
for (const [slug, brand] of Object.entries(brands.samples)) {
  const state = vm.runInContext(`makeState({ slug: "${slug}", maxHp: 10 }, "ally", 0)`, domContext);
  assert.equal(state.brand, brand);
  assert.equal(state.poison, 0);
}
async function integration() {
  const animations = [];
  let finishes = 0;
  const context = {
    V2BattleBrands: brands, running: true, battleToken: 1, actionBusy: false,
    turnNumber: 0, lastDiceRoll: 2, actionCount: 0, speedMultiplier: 1,
    units: [unit("poison", "ally", 1), unit("critical", "enemy")],
    turnQueue: [], awaitingRoll: true, diceRolling: false,
    battlefield: { classList: { remove() {} } }, turnDice: {}, pauseButton: {}, message: {},
    closeUnitInfo() {}, updateUnit() {}, updateHud() {},
    frame: (u, motion, n) => motion + n, wait: async () => {},
    playMotion: async (u, motion) => { animations.push([u.team, motion]); },
    finishBattle: () => { finishes++; context.running = false; },
    aliveUnits: team => context.units.filter(u => u.team === team && u.alive)
  };
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf("  async function startTurn("), source.indexOf("  function beginTurnIntermission(")), context);
  vm.runInContext(source.slice(source.indexOf("  async function performAttack("), source.indexOf("  async function playMotion(")), context);
  await vm.runInContext("startTurn()", context);
  assert.equal(finishes, 1);
  assert.deepEqual(animations, [["ally", "death"]]);
  Object.assign(context, { running: true, actionBusy: false, units: [unit("critical"), unit("guard", "enemy")] });
  context.units[0].poison = 1; context.units[0].hp = 1;
  animations.length = 0;
  await vm.runInContext("performAttack(units[0], battleToken)", context);
  assert.equal(finishes, 2);
  assert.deepEqual(animations, [["ally", "death"]], "Poison-killed unit must never attack");
  Object.assign(context, { running: true, units: [unit("vampire", "ally", 1), unit("critical", "enemy", 2)], turnQueue: [] });
  brands.startRound(context.units, 2);
  await vm.runInContext("performAttack(units[0], battleToken)", context);
  assert.equal(context.units[0].hp, 3);
  assert.equal(context.units[1].alive, false);
  Object.assign(context, { running: true, actionBusy: false, units: [unit("critical"), unit("guard", "enemy")], lastDiceRoll: 3, turnQueue: [] });
  await vm.runInContext("startTurn()", context);
  assert.equal(context.actionBusy, false);
  assert.equal(context.turnQueue.length, 2);
  assert.equal(new Set(context.turnQueue).size, 2);
  console.log("SUCCESS: 36 brand conditions, six effects, actual-damage lifesteal, poison death, turn integration and UI-safe combat passed.");
}
integration().catch(error => { console.error(error); process.exitCode = 1; });
