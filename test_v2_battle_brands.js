const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const brands = require("./v2-battle-brands.js");
const legions = require("./v2-legions.js");
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
assert.equal(Object.keys(brands.samples).length, 12);
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
b.poison = 1; b.poisonAppliedTurn = 2; b.hp = 6;
assert.equal(brands.beforeAction(b, 2), 0, "Poison must remain visible during the turn it was applied");
assert.equal(b.hp, 6);
assert.equal(brands.beforeAction(b, 3), 1, "Poison must damage immediately before the next turn attack");
assert.equal(b.hp, 5);assert.equal(b.poison, 0);
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
const appendedNumbers = [];
const popupContext = {
  document: { createElement(tag) {
    assert.equal(tag, "span");
    return { attrs: {}, events: {},
      setAttribute(key, value) { this.attrs[key] = value; },
      addEventListener(event, callback, options) { this.events[event] = callback; assert.equal(options.once, true); },
      remove() { this.removed = true; }
    };
  } },
  victim: { element: { querySelector(selector) {
    assert.equal(selector, ".sprite-wrap", "Number must follow the forward-moving victim");
    return { append: number => appendedNumbers.push(number) };
  } } }
};
vm.createContext(popupContext);
vm.runInContext(source.slice(source.indexOf("  function showDamage("), source.indexOf("  function updateUnit(")), popupContext);
vm.runInContext("showDamage(victim, 6)", popupContext);
assert.equal(appendedNumbers[0].className, "damage-number");
assert.equal(appendedNumbers[0].textContent, "-6");
assert.equal(appendedNumbers[0].attrs["aria-label"], "6 피해");
appendedNumbers[0].events.animationend();
assert.equal(appendedNumbers[0].removed, true);
vm.runInContext("showDamage(victim, 0); showDamage(victim, -1); showDamage(victim, NaN)", popupContext);
assert.equal(appendedNumbers.length, 1, "Only positive actual damage should spawn a number");
const page = fs.readFileSync(__dirname + "/v2-auto-battle-practice.html", "utf8");
assert(page.indexOf('src="v2-battle-brands.js') < page.indexOf('src="v2-auto-battle-practice.js'), "Brand engine must load before battle initialization");
// The active ten-brand UI and combat contract is covered by the shared rules tests.
require('./test_v2_rules');
require('./test_v2_rules_ui');
