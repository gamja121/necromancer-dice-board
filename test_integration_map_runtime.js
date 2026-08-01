/**
 * test_integration_map_runtime.js
 * Slay the Spire 15층 원정 지도 런타임 통합 테스트
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const projectDir = __dirname;

const unitDataCode = fs.readFileSync(path.join(projectDir, 'unit-data.js'), 'utf8');
const generatorCode = fs.readFileSync(path.join(projectDir, 'encounter-generator.js'), 'utf8');
const mapGeneratorCode = fs.readFileSync(path.join(projectDir, 'map-generator.js'), 'utf8');
const eventDataCode = fs.readFileSync(path.join(projectDir, 'event-data.js'), 'utf8');
const gameJsCode = fs.readFileSync(path.join(projectDir, 'game.js'), 'utf8');

const storage = {};
const localStorageMock = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; }
};

const elements = {};
function getOrCreateElement(id) {
  if (!elements[id]) {
    elements[id] = {
      addEventListener: () => {},
      appendChild: () => {},
      classList: { add: () => {}, remove: () => {}, toggle: () => {} },
      querySelector: (selector) => getOrCreateElement(`${id}_${selector}`),
      querySelectorAll: () => [],
      style: { setProperty: () => {} },
      dataset: {},
      disabled: false,
      hidden: false,
      textContent: '',
      innerHTML: '',
      setAttribute: () => {},
      removeAttribute: () => {},
      pause: () => {},
      play: () => Promise.resolve(),
      showModal: () => {},
      close: () => {},
      open: false,
      title: '',
      id: id
    };
  }
  return elements[id];
}

const documentMock = {
  getElementById: (id) => getOrCreateElement(id),
  createElement: (tag) => ({ ...getOrCreateElement('dynamic_' + tag), tagName: tag }),
  createElementNS: (ns, tag) => ({ ...getOrCreateElement('svg_' + tag), tagName: tag }),
  addEventListener: () => {},
  body: getOrCreateElement('body')
};

const sandbox = {
  localStorage: localStorageMock,
  document: documentMock,
  setTimeout: (fn) => { if (typeof fn === "function") fn(); return 1; },
  clearTimeout: () => {},
  window: {
    setTimeout: (fn) => { if (typeof fn === "function") fn(); return 1; },
    clearTimeout: () => {},
    addEventListener: () => {}
  },
  navigator: {},
  confirm: () => true,
  console: console,
  Image: function() {
    this.onload = null;
    this.onerror = null;
  },
  Audio: function() {
    return { play: () => Promise.resolve(), pause: () => {}, cloneNode: () => ({ play: () => Promise.resolve(), pause: () => {} }) };
  },
  AudioContext: function() {
    return {
      createGain: () => ({ gain: { value: 1.0 }, connect: () => {} }),
      destination: {}
    };
  }
};

vm.createContext(sandbox);

vm.runInContext(unitDataCode, sandbox);
vm.runInContext(generatorCode, sandbox);
vm.runInContext(mapGeneratorCode, sandbox);
vm.runInContext(eventDataCode, sandbox);
vm.runInContext(gameJsCode, sandbox);

console.log("=== [START] Runtime Integration Test: Slay the Spire 15-Floor Expedition Map ===");

// 1. Reset campaign and verify mapGenerator stageMaps created
sandbox.resetCampaign();
const c = vm.runInContext('campaign', sandbox);

assert.ok(c.stageMaps !== null && Array.isArray(c.stageMaps), "stageMaps array created");
assert.strictEqual(c.stageMaps.length, 3, "3 stage maps created");
assert.strictEqual(c.stageMaps[0].floors, 15, "Stage 1 map has 15 floors");
assert.strictEqual(c.stageMaps[1].floors, 15, "Stage 2 map has 15 floors");
assert.strictEqual(c.stageMaps[2].floors, 15, "Stage 3 map has 15 floors");
console.log("Pass: 3 Stage 15-floor maps initialized cleanly.");

// 2. Test autoSave & loadCampaignSave with stageMaps
sandbox.autoSaveCampaign();
const loaded = sandbox.loadCampaignSave();
assert.ok(loaded !== null, "Campaign save loaded successfully");
assert.ok(Array.isArray(loaded.stageMaps), "Loaded save contains stageMaps");
assert.strictEqual(loaded.stageMaps.length, 3, "Loaded stageMaps has 3 stages");
console.log("Pass: Save and restore of 15-floor stageMaps verified.");

// 3. Test Event Data & Runtime Event Execution
const evt = sandbox.window.EventData.getRandomEvent(0);
assert.ok(evt && evt.title && evt.choices.length >= 2, "EventData returns valid event scenario");
console.log(`Pass: EventData scenario fetched: '${evt.title}' with ${evt.choices.length} choices.`);

console.log("SUCCESS: Slay the Spire 15-Floor Expedition Map Runtime Integration Test Passed!");
