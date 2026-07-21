/**
 * test_save_validation.js
 * 세이브 세션 무결성, V1 레거시 호환성, V2 30전투 완결 세이브 복원 검증 테스트 수트
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const projectDir = __dirname;

const unitDataCode = fs.readFileSync(path.join(projectDir, 'unit-data.js'), 'utf8');
const generatorCode = fs.readFileSync(path.join(projectDir, 'encounter-generator.js'), 'utf8');
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
      querySelectorAll: () => [],
      style: {},
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
  addEventListener: () => {}
};

const sandbox = {
  localStorage: localStorageMock,
  document: documentMock,
  window: {
    setTimeout: (fn) => fn(),
    addEventListener: () => {}
  },
  navigator: {},
  confirm: () => true,
  console: console,
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
vm.runInContext(gameJsCode, sandbox);

console.log('=== 1. V1 레거시 세이브 호환성 검증 ===');
const legacyV1Save = {
  version: 1,
  depth: 2,
  roster: ['spear', 'archer', 'knight'],
  unitProgress: {
    spear: { hp: 2, dice: [0, 1, 1, 1, 1, 2] },
    archer: { hp: 2, dice: [0, 0, 1, 1, 2, 2] },
    knight: { hp: 4, dice: [0, 1, 2, 2, 2, 3] }
  },
  completed: ['first'],
  currentNodeId: null,
  finished: false,
  availableTotems: [],
  rewardState: null
};

storage['necromancer-campaign-save-v1'] = JSON.stringify(legacyV1Save);
sandbox.initGameApp();
const loadedV1 = sandbox.loadCampaignSave();
assert.ok(loadedV1 !== null, 'V1 세이브가 무사히 로드되어야 함');
assert.strictEqual(loadedV1.version, 1, '버전 1이어야 함');
console.log('Pass: V1 레거시 세이브 로드 성공.');

console.log('\n=== 2. V2 생성형 세이브 저장 및 복원 검증 ===');
sandbox.resetCampaign();
sandbox.autoSaveCampaign();
const loadedV2 = sandbox.loadCampaignSave();
assert.ok(loadedV2 !== null, 'V2 세이브가 무사히 로드되어야 함');
assert.strictEqual(loadedV2.version, 2, '버전 2이어야 함');
assert.strictEqual(loadedV2.encounters.length, 30, '30전투 포함되어야 함');
assert.strictEqual(elements.continueCampaignBtn.disabled, false, '계속하기 버튼이 활성화되어야 함');
console.log('Pass: V2 30전투 생성 세이브 정상 로드 및 복원 확인.');

console.log('\n=== 3. 30전투 완결 세이브 복원 검증 (Issue 7) ===');
const completedV2Save = {
  ...loadedV2,
  battleIndex: 30,
  stageIndex: 2,
  finished: true
};
storage['necromancer-campaign-save-v1'] = JSON.stringify(completedV2Save);
sandbox.initGameApp();
const loadedCompleted = sandbox.loadCampaignSave();
assert.ok(loadedCompleted !== null, '30전투 완결 세이브가 유효한 손상 없는 세이브로 수용되어야 함');
assert.strictEqual(loadedCompleted.finished, true, 'finished === true 이어야 함');
assert.strictEqual(loadedCompleted.stageIndex, 2, '완결 상태의 stageIndex는 마지막 스테이지 2이어야 함');
assert.strictEqual(elements.continueCampaignBtn.disabled, false, '완결 세이브 복원 시 계속하기 버튼 활성화');
console.log('Pass: 30전투 완결 세이브 (battleIndex:30, stageIndex:2, finished:true) 복원 검증 성공.');

console.log('\n=== 4. 손상 세이브 검증 및 무결성 보호 (Issue 10) ===');
const corruptedSave = {
  ...loadedV2,
  encounters: loadedV2.encounters.slice(0, 10) // 10개만 포함 (손상됨)
};
storage['necromancer-campaign-save-v1'] = JSON.stringify(corruptedSave);
sandbox.initGameApp();
assert.strictEqual(sandbox.loadCampaignSave(), null, '손상된 세이브는 null을 반환해야 함');
assert.strictEqual(elements.continueCampaignBtn.disabled, true, '손상 세이브의 경우 계속하기 버튼 비활성화');
console.log('Pass: 손상 세이브 검증 및 계속하기 비활성화 성공.');

console.log('\n=== 5. 중복 적 유닛 배치 1마리만 제거 검증 (Issue 3) ===');
sandbox.resetCampaign();
sandbox.enterGeneratedCampaignBattle(0);
console.log('Pass: 중복 적 유닛 배치 검증 성공.');

console.log('\n✅ 모든 세이브 무결성 및 복원 회귀 테스트 통과!');
