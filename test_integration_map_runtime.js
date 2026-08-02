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

function meaningfulChoiceCountOnPath(stageMap, path) {
  const byId = new Map(stageMap.nodes.map(node => [node.id, node]));
  return path.slice(0, -1).filter(nodeId => {
    const node = byId.get(nodeId);
    return new Set(node.next.map(id => byId.get(id).type)).size >= 2;
  }).length;
}

function enumeratePaths(stageMap) {
  const byId = new Map(stageMap.nodes.map(node => [node.id, node]));
  const paths = [];
  const walk = (nodeId, path) => {
    const nextPath = [...path, nodeId];
    if (nodeId === stageMap.bossNodeId) {
      paths.push(nextPath);
      return;
    }
    byId.get(nodeId).next.forEach(nextId => walk(nextId, nextPath));
  };
  stageMap.startNodeIds.forEach(nodeId => walk(nodeId, []));
  return paths;
}

console.log("=== [START] Runtime Integration Test: 15-Floor Branching Expedition Map ===");

// 1. Reset campaign and verify mapGenerator stageMaps created
sandbox.resetCampaign();
const c = vm.runInContext('campaign', sandbox);

assert.ok(c.stageMaps !== null && Array.isArray(c.stageMaps), "stageMaps array created");
assert.strictEqual(c.stageMaps.length, 3, "3 stage maps created");
assert.strictEqual(c.stageMaps[0].floors, 15, "Stage 1 map has 15 floors");
assert.strictEqual(c.stageMaps[1].floors, 15, "Stage 2 map has 15 floors");
assert.strictEqual(c.stageMaps[2].floors, 15, "Stage 3 map has 15 floors");
for (const stageMap of c.stageMaps) {
  assert.strictEqual(sandbox.window.MapGenerator.validateStageMap(stageMap), true, "Generated map passes structural validation");
  assert.ok(stageMap.decisionFloors.length >= 4, "Generated map exposes at least four decision floors");
  const paths = enumeratePaths(stageMap);
  assert.ok(paths.length >= 16, "Generated map contains multiple complete routes");
  paths.forEach(path => {
    assert.ok(meaningfulChoiceCountOnPath(stageMap, path) >= 4, "Every route presents at least four meaningful choices");
  });
}
console.log("Pass: Three valid maps expose at least four meaningful decisions on every complete route.");

// 2. Test autoSave & loadCampaignSave with stageMaps
sandbox.autoSaveCampaign();
const loaded = sandbox.loadCampaignSave();
assert.ok(loaded !== null, "Campaign save loaded successfully");
assert.ok(Array.isArray(loaded.stageMaps), "Loaded save contains stageMaps");
assert.strictEqual(loaded.stageMaps.length, 3, "Loaded stageMaps has 3 stages");
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(loaded.stageMaps)),
  JSON.parse(JSON.stringify(c.stageMaps)),
  "Saved map graph is restored without regeneration or route drift"
);
console.log("Pass: Save and restore preserves the exact generated graph.");

// 3. Event node entry must create an autosaved, resumable pending state.
const evt = sandbox.window.EventData.getRandomEvent(0);
assert.ok(evt && evt.title && evt.choices.length >= 2, "EventData returns valid event scenario");
const eventNode = c.stageMaps[0].nodes.find(node => node.type === "event");
assert.ok(eventNode, "Generated map contains an event node");
sandbox.openEventDialog(eventNode);
assert.strictEqual(c.pendingNodeState.nodeId, eventNode.id, "Event entry records the pending node");
assert.strictEqual(c.pendingNodeState.nodeType, "event", "Event pending state records its node type");
assert.ok(c.pendingNodeState.eventId, "Event selection is fixed before rendering choices");
const SAVE_KEY = "necromancer-campaign-save-v1";
const savedDuringEvent = JSON.parse(storage[SAVE_KEY]);
assert.strictEqual(savedDuringEvent.pendingNodeState.nodeId, eventNode.id, "Pending event is autosaved");
console.log(`Pass: Event '${evt.title}' creates a resumable autosaved state.`);

// 4. Completing a non-battle node advances once, clears pending state, and saves.
const beforeStageFloor = c.stageFloorIndex;
const beforeGlobalFloor = c.globalFloorIndex;
sandbox.completeNonBattleNode(eventNode.id);
assert.ok(c.completedNodeIds.includes(eventNode.id), "Completed event node is recorded");
assert.strictEqual(c.currentNodeId, eventNode.id, "Current node advances to the completed event");
assert.strictEqual(c.stageFloorIndex, beforeStageFloor + 1, "Stage floor advances exactly once");
assert.strictEqual(c.globalFloorIndex, beforeGlobalFloor + 1, "Global floor advances exactly once");
assert.strictEqual(c.pendingNodeState, null, "Pending state is cleared after completion");
const savedAfterEvent = JSON.parse(storage[SAVE_KEY]);
assert.ok(savedAfterEvent.completedNodeIds.includes(eventNode.id), "Completed event is persisted");
console.log("Pass: Non-battle completion advances and persists atomically.");

// 5. Corrupted progressed maps must not be silently regenerated under the player.
const corrupted = JSON.parse(storage[SAVE_KEY]);
corrupted.stageMaps[0].nodes[0].next = ["missing-node"];
localStorageMock.setItem(SAVE_KEY, JSON.stringify(corrupted));
assert.strictEqual(sandbox.loadCampaignSave(), null, "Corrupted progressed map is rejected");
console.log("Pass: Corrupted progressed map is rejected instead of silently changing routes.");

console.log("SUCCESS: Branching expedition map runtime integration test passed.");
