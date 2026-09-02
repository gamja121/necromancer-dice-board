const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the real event handlers with a small DOM/image test double.
const displayed = [];
const elements = new Map();
function element(key) {
  if (!elements.has(key)) elements.set(key, {
    style: {}, dataset: {}, handlers: {}, disabled: false,
    classList: { toggle() {} },
    addEventListener(type, handler) { this.handlers[type] = handler; },
    set src(value) { this.currentSrc = value; displayed.push(value); },
    get src() { return this.currentSrc; }
  });
  return elements.get(key);
}
const unit = process.argv[2] || 'cerberus';
const labels = { cerberus: '케르베로스', spiderling: '새끼거미', 'flesh-golem': '누더기 포식자' };
assert(labels[unit], 'Unknown test unit');
const picker = element(unit);
picker.dataset.unit = unit;
const errors = [];
const context = {
  document: { querySelector: element, querySelectorAll: () => [picker] },
  Image: class {
    set src(url) {
      if (fs.existsSync(path.join(__dirname, url))) this.onload();
      else this.onerror();
    }
  },
  console: { error: (error) => errors.push(error) },
  setTimeout: (callback) => { callback(); }
};
async function run() {
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'v2-animation-practice.js'), 'utf8'), context);
  await new Promise(setImmediate);
  await picker.handlers.click();
  assert.equal(element('#unitName').textContent, labels[unit]);
  const root = `art/v2-style/animation-test-frames/${unit}/`;
  const counts = { attack: 5, hit: unit === 'flesh-golem' ? 5 : 4, death: unit === 'flesh-golem' ? 5 : 6 };
  for (const [motion, count] of Object.entries(counts)) {
    displayed.length = 0;
    const playing = element(`#${motion}Btn`).handlers.click();
    assert.equal(element('#attackBtn').disabled, true, 'Controls should lock while playing');
    await playing;
    const numbers = unit === 'flesh-golem' && motion === 'death'
      ? [1, 2, 3, 5, 6] : Array.from({ length: count }, (_, i) => i + 1);
    const expected = numbers.map((number) => `${root}${motion}-${String(number).padStart(2, '0')}.png`);
    if (motion !== 'death') expected.push(`${root}attack-01.png`);
    assert.deepEqual(displayed, expected, `${motion}: wrong playback sequence`);
    assert.equal(element('#attackBtn').disabled, false);
  }
  assert.equal(element('#unitSprite').src, `${root}death-06.png`, 'Death should hold its last frame');
  element('#resetBtn').handlers.click();
  assert.equal(element('#unitSprite').src, `${root}attack-01.png`);
  assert.deepEqual(errors, []);
  console.log(`SUCCESS: ${unit} selection, frame loading, ${Object.values(counts).join('/')} playback, control locking, death hold, and reset passed.`);
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
