const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const effect = require("./v2-summon-effect.js");
const source = fs.readFileSync(__dirname + "/v2-auto-battle-practice.js", "utf8");
const effectSource = fs.readFileSync(__dirname + "/v2-summon-effect.js", "utf8");
const html = fs.readFileSync(__dirname + "/v2-auto-battle-practice.html", "utf8");
const css = fs.readFileSync(__dirname + "/v2-auto-battle-practice.css", "utf8");
const worker = fs.readFileSync(__dirname + "/service-worker.js", "utf8");
assert(fs.existsSync(__dirname + "/" + effect.SHEET));
assert(worker.includes(effect.SHEET) && worker.includes("v2-summon-effect.js?v=2"));
assert(html.indexOf('src="v2-summon-effect.js') < html.indexOf('src="v2-auto-battle-practice.js'));
assert(css.includes("rotateX(55deg)") && css.includes("rotateZ(-8deg)"));
assert(css.includes("bottom: 16%") && css.includes("translate(-50%, 50%) perspective(500px)"), "Circle center is raised to the unit's feet");
assert(css.includes(".sprite-wrap > img { position: relative; z-index: 2; }"));
assert(css.includes(".summon-effect { position: absolute; z-index: 1;"));
assert(css.includes(".unit.is-pending.is-summoning .sprite-wrap > img") && css.includes("filter: brightness(0)"), "A black silhouette must precede materialization");
assert(css.includes("@keyframes summon-unit-materialize") && css.includes("filter: brightness(1)"), "Silhouette must resolve into full color");
assert(effectSource.includes('classList.add("is-summoning")') && effectSource.includes('classList.remove("is-summoning")'));
assert(css.includes(".unit.is-pending .sprite-wrap > img") && css.includes(".unit.is-pending > .bar"));
assert(source.includes('unitState.team === "ally" ? "unit is-pending" : "unit"'));
assert(source.slice(source.indexOf("  function resetBattle("), source.indexOf("  function makeState(")).includes("introRunning = false;"));
const pixels = new Uint8ClampedArray([0, 255, 0, 255, 140, 40, 190, 255, 50, 150, 60, 255]);
effect.removeGreen(pixels);
assert.equal(pixels[3], 0);
assert.deepEqual(Array.from(pixels.slice(4, 8)), [140, 40, 190, 255]);
assert(pixels[11] > 0 && pixels[11] < 255);
assert(pixels[9] <= Math.max(pixels[8], pixels[10]), "No green spill on blended pixels");
const crops = [];
const frames = effect.buildFrames({ naturalWidth: 1280, naturalHeight: 575 }, {
  createElement: () => ({ getContext: () => ({
    drawImage: (...args) => crops.push(args.slice(1, 5)),
    getImageData: () => ({ data: new Uint8ClampedArray([0, 255, 0, 255]) }),
    putImageData: data => assert.equal(data.data[3], 0)
  }) })
});
assert.equal(frames.length, 8);
assert.deepEqual(crops, effect.CELLS);
assert(frames.every(frame => frame.width === 320 && frame.height === 288));
function element(pending = false) {
  const classes = new Set(pending ? ["is-pending"] : []);
  return { classes, attrs: pending ? { "aria-hidden": "true" } : {}, tabIndex: pending ? -1 : 0,
    classList: { add: name => classes.add(name), remove: name => classes.delete(name) },
    removeAttribute(key) { delete this.attrs[key]; }
  };
}
function setup() {
  const revealed = [], played = [];
  let diceStarts = 0;
  const context = {
    running: false, introRunning: false, actionBusy: false, battleToken: 1, paused: false,
    window: {}, startOverlay: {}, resultOverlay: {}, pauseButton: {}, speedButton: {}, turnDice: {}, message: {},
    console: { warn() {} }, wait: async () => {},
    units: [0, 1, 2, 3].map(slot => ({ team: "ally", slot, name: "ally" + slot, element: element(true) }))
      .concat([0, 1, 2, 3].map(slot => ({ team: "enemy", slot, name: "enemy" + slot, element: element() }))),
    V2SummonEffect: {
      prepare: async () => frames,
      play: async (unit, loaded, options) => {
        assert.equal(context.running, false, "Combat must not run during entrance");
        assert.equal(context.actionBusy, true);
        assert.equal(context.turnDice.hidden, true);
        assert.equal(context.speedButton.disabled, true);
        assert(context.units.filter(u => u.team === "enemy").every(u => !u.element.classes.has("is-pending")));
        played.push(unit.slot);
        options.reveal(unit);
        revealed.push(unit.slot);
      }
    },
    beginTurnIntermission(initial) {
      assert.equal(initial, true);
      assert(context.units.filter(u => u.team === "ally").every(u => !u.element.classes.has("is-pending")));
      diceStarts++;
    }
  };
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf("  function revealUnit("), source.indexOf("  function battleLoop(")), context);
  return { context, revealed, played, diceStarts: () => diceStarts };
}
async function run() {
  const test = setup();
  const first = vm.runInContext("beginBattle()", test.context);
  await vm.runInContext("beginBattle()", test.context); // Ignore double-start.
  await first;
  assert.deepEqual(test.played, [0, 1, 2, 3]);
  assert.deepEqual(test.revealed, [0, 1, 2, 3]);
  assert.equal(test.diceStarts(), 1);
  assert.equal(test.context.running, true);
  assert.equal(test.context.introRunning, false);
  assert.equal(test.context.actionBusy, false);
  assert(test.context.units.every(u => u.element.tabIndex === 0));
  const cancelled = setup();
  cancelled.context.V2SummonEffect.play = async () => {
    cancelled.context.battleToken++;
    cancelled.context.introRunning = false;
  };
  await vm.runInContext("beginBattle()", cancelled.context);
  assert.equal(cancelled.diceStarts(), 0, "Stale intro must not start a turn after reset");
  assert.equal(cancelled.context.running, false);
  const failed = setup();
  failed.context.V2SummonEffect.prepare = async () => { throw new Error("missing sheet"); };
  await vm.runInContext("beginBattle()", failed.context);
  assert.equal(failed.diceStarts(), 1, "Asset failure must not lock the battle");
  assert(failed.context.units.every(u => !u.element.classes.has("is-pending")));

  // Run the actual effect player: frame order, reveal timing, and cleanup.
  const drawn = [], timeline = [];
  let removed = 0;
  const effectContext = { document: { createElement() {
    return { setAttribute() {}, classList: { add() {} },
      getContext: () => ({ clearRect() {}, drawImage: image => drawn.push(image) }),
      remove() { removed++; }
    };
  } } };
  vm.createContext(effectContext);
  vm.runInContext(effectSource, effectContext);
  const summoningClasses = new Set();
  const victim = { element: { classList: { add:name=>summoningClasses.add(name), remove:name=>summoningClasses.delete(name) }, querySelector: selector => {
    assert.equal(selector, ".sprite-wrap");
    return { append() {} };
  } } };
  await effectContext.V2SummonEffect.play(victim, frames, {
    isCurrent: () => true, reveal: () => timeline.push(drawn.length), wait: async () => {}
  });
  assert.deepEqual(drawn, frames);
  assert.deepEqual(timeline, [4], "Unit appears as the fourth effect frame begins");
  assert.equal(removed, 1);
  assert(!summoningClasses.has("is-summoning"), "Summoning state is cleaned after playback");
  let current = true;
  await effectContext.V2SummonEffect.play(victim, frames, {
    isCurrent: () => current, reveal: () => { throw new Error("Stale reveal"); },
    wait: async () => { current = false; }
  });
  assert.equal(removed, 2, "Cancelled effect must remove its canvas");
  console.log("SUCCESS: eight keyed frames, left-to-right allied entrance, preplaced enemies, dice gating, duplicate-start guard, cancellation, and fallback passed.");
}
run().catch(error => { console.error(error); process.exitCode = 1; });
