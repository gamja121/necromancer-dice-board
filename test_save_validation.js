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
  addEventListener: () => {}
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

const mapGeneratorCode = fs.readFileSync(path.join(projectDir, 'map-generator.js'), 'utf8');
const eventDataCode = fs.readFileSync(path.join(projectDir, 'event-data.js'), 'utf8');

vm.createContext(sandbox);

vm.runInContext(unitDataCode, sandbox);
vm.runInContext(generatorCode, sandbox);
vm.runInContext(mapGeneratorCode, sandbox);
vm.runInContext(eventDataCode, sandbox);
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
assert.strictEqual(loadedV1.unitProgress.spear.maxHp, sandbox.UNIT_TYPES.spear.hp, '구버전 진행도에 최대 체력 기본값이 보강되어야 함');
assert.strictEqual(loadedV1.unitProgress.spear.respawns, 0, '구버전 진행도에 재소환 횟수 기본값이 보강되어야 함');
console.log('Pass: V1 레거시 세이브 로드 성공.');

console.log('\n=== 2. V2 생성형 세이브 저장 및 복원 검증 ===');
sandbox.resetCampaign();
sandbox.autoSaveCampaign();
const loadedV2 = sandbox.loadCampaignSave();
assert.ok(loadedV2 !== null, 'V2 세이브가 무사히 로드되어야 함');
assert.strictEqual(loadedV2.version, 2, '버전 2이어야 함');
assert.strictEqual(loadedV2.generatorVersion, 3, '새 원정은 히드라 포함 생성기 버전 3을 사용해야 함');
assert.strictEqual(loadedV2.encounters.length, 30, '30전투 포함되어야 함');
assert.deepStrictEqual(Array.from(loadedV2.resolvedInterludes), [], '기존 V2 세이브는 해결한 탐험 노드 빈 목록으로 보완되어야 함');
assert.strictEqual(elements.continueCampaignBtn.disabled, false, '계속하기 버튼이 활성화되어야 함');
console.log('Pass: V2 30전투 생성 세이브 정상 로드 및 복원 확인.');

const oldGeneratorSave = JSON.parse(JSON.stringify(loadedV2));
oldGeneratorSave.generatorVersion = 1;
oldGeneratorSave.encounters[0].enemies = ['archer', 'archer', 'worm'];
oldGeneratorSave.encounters[0].enemyCount = 3;
oldGeneratorSave.encounters[0].actualPower = 6.5;
oldGeneratorSave.encounters[0].theme = 'undead';
oldGeneratorSave.encounters[0].compKey = 'archer,archer,worm';
storage['necromancer-campaign-save-v1'] = JSON.stringify(oldGeneratorSave);
const loadedOldGenerator = sandbox.loadCampaignSave();
assert.ok(loadedOldGenerator !== null, '기존 생성기 버전 1의 중복 조합 세이브도 이어서 플레이할 수 있어야 함');
assert.strictEqual(loadedOldGenerator.generatorVersion, 1, '기존 원정의 생성기 버전은 유지되어야 함');
console.log('Pass: 기존 생성기 버전 1 중복 조합 세이브 호환성 유지.');

const oldGeneratorV2Save = JSON.parse(JSON.stringify(loadedV2));
oldGeneratorV2Save.generatorVersion = 2;
storage['necromancer-campaign-save-v1'] = JSON.stringify(oldGeneratorV2Save);
const loadedOldGeneratorV2 = sandbox.loadCampaignSave();
assert.ok(loadedOldGeneratorV2 !== null, '기존 생성기 버전 2 세이브도 이어서 플레이할 수 있어야 함');
assert.strictEqual(loadedOldGeneratorV2.generatorVersion, 2, '기존 생성기 버전 2 표시는 유지되어야 함');
console.log('Pass: 기존 생성기 버전 2 세이브 호환성 유지.');

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
assert.strictEqual(
  elements.continueCampaignBtn.disabled,
  false,
  '시작 화면에서는 무거운 정밀 검증을 미루고 저장 키가 있으면 계속하기를 표시'
);
const corruptionCases = [
  { name: '스테이지/전투 불일치', patch: { stageIndex: 2, battleIndex: 0 } },
  { name: '비정수 시드', patch: { runSeed: 1.5 } },
  { name: 'boolean이 아닌 완료 상태', patch: { finished: 'false' } },
  { name: '알 수 없는 로스터 유닛', patch: { roster: [...loadedV2.roster, 'notAUnit'] } },
  { name: '중복 로스터', patch: { roster: [...loadedV2.roster, loadedV2.roster[0]] } },
  { name: '알 수 없는 토템', patch: { availableTotems: ['unknownTotem'] } },
  { name: '알 수 없는 탐험 노드', patch: { resolvedInterludes: ['unknownInterlude'] } },
  { name: '손상된 보상 상태', patch: { rewardState: { chosenKey: 'dice', applied: false } } },
  { name: '체크포인트 인덱스 불일치', patch: { checkpoint: { battleIndex: 2, stageIndex: 0, roster: loadedV2.roster, unitProgress: loadedV2.unitProgress, availableTotems: [] } } },
];
for (const testCase of corruptionCases) {
  storage['necromancer-campaign-save-v1'] = JSON.stringify({ ...loadedV2, ...testCase.patch });
  assert.strictEqual(sandbox.loadCampaignSave(), null, `${testCase.name} 세이브는 거부되어야 함`);
}
console.log(`Pass: 세부 손상 세이브 ${corruptionCases.length}종 차단 및 계속하기 비활성화 성공.`);

console.log('\n=== 5. 생성형 전투 초기화 및 ID 무결성 검증 ===');
sandbox.resetCampaign();
sandbox.vmResult = null;
vm.runInContext(`
  state.visualEffects = [{ id: 'stale-effect' }];
  state.log = ['stale-log'];
  state.nextId = 99;
`, sandbox);
sandbox.enterGeneratedCampaignBattle(0);
const setupSnapshot = vm.runInContext(`({
  summonerCount: state.units.filter((unit) => unit.type === 'summoner').length,
  unitIds: state.units.map((unit) => unit.id),
  nextId: state.nextId,
  visualEffectCount: state.visualEffects.length,
  hasStaleLog: state.log.includes('stale-log'),
  playbackRate: battleMusic.playbackRate
})`, sandbox);
assert.strictEqual(setupSnapshot.summonerCount, 1, '소환사는 정확히 한 번만 등록되어야 함');
assert.strictEqual(new Set(setupSnapshot.unitIds).size, setupSnapshot.unitIds.length, '전투 시작 유닛 ID는 고유해야 함');
assert.ok(setupSnapshot.nextId >= 2 && setupSnapshot.nextId <= 3, '소환사 생성 후 다음 ID는 2 이상이어야 함');
assert.strictEqual(setupSnapshot.visualEffectCount, 0, '이전 전투 시각 효과는 제거되어야 함');
assert.strictEqual(setupSnapshot.hasStaleLog, false, '이전 전투 로그는 제거되어야 함');
assert.strictEqual(setupSnapshot.playbackRate, 1, '일반 전투 음악 재생 속도는 기본값이어야 함');
console.log('Pass: 소환사 단일 등록, ID 고유성, 효과·로그·음악 초기화 검증 성공.');

console.log('\n=== 6. 중복 적 유닛 배치 수량 보존 검증 (Issue 3) ===');
vm.runInContext(`
  state.turn = 'enemy';
  state.phase = 'setup';
  state.reserves.enemy = ['spear', 'spear'];
  state.setupLimits.enemy = 2;
`, sandbox);
sandbox.autoEnemySetup();
const duplicateSnapshot = vm.runInContext(`({
  enemySpears: state.units.filter((unit) => unit.owner === 'enemy' && unit.type === 'spear').length,
  reservesLeft: state.reserves.enemy.length,
  ids: state.units.map((unit) => unit.id)
})`, sandbox);
assert.strictEqual(duplicateSnapshot.enemySpears, 2, '중복 적 유닛 2마리가 모두 배치되어야 함');
assert.strictEqual(duplicateSnapshot.reservesLeft, 0, '배치된 중복 유닛만큼 예비군에서 제거되어야 함');
assert.strictEqual(new Set(duplicateSnapshot.ids).size, duplicateSnapshot.ids.length, '전체 유닛 ID가 서로 달라야 함');
console.log('Pass: 중복 적 유닛 2마리 배치 및 ID 고유성 검증 성공.');

console.log('\n=== 7. 안전 템플릿 전체 규격 검증 ===');
const fallbackEncounters = sandbox.EncounterGenerator.getFallbackTemplateEncounters(12345);
assert.strictEqual(sandbox.EncounterGenerator.validateEncountersArray(fallbackEncounters), true, '안전 템플릿 30전투가 실제 전투별 규격을 모두 만족해야 함');
console.log('Pass: 안전 템플릿 30전투의 예산, 등급, 보스, 메타데이터 검증 성공.');

console.log('\n=== 8. 신규 군단 효과 및 유닛 범위 검증 ===');
const legionSnapshot = vm.runInContext(`(() => {
  state.battleFate = null;
  state.board = makeBoard();
  state.units = [];
  state.nextId = 1;
  const mantisA = createUnit('hellMantis', 'player', 3, 0);
  createUnit('hellMantis', 'player', 3, 1);
  const insectDice = effectiveAttackDice(mantisA);

  state.board = makeBoard();
  state.units = [];
  state.nextId = 1;
  const treantA = createUnit('ancientTreant', 'player', 3, 0);
  const treantB = createUnit('ancientTreant', 'player', 3, 1);
  const plantMaxHp = [treantA.maxHp, treantB.maxHp];
  state.units = state.units.filter((unit) => unit.id !== treantB.id);
  state.board[treantB.row][treantB.col] = null;
  reconcileUnitHealthBonuses();
  const plantMaxHpAfterDisable = treantA.maxHp;

  state.board = makeBoard();
  state.units = [];
  state.nextId = 1;
  const treant = createUnit('ancientTreant', 'player', 3, 0);
  createUnit('stoneGolem', 'player', 3, 1);
  const originalRandom = Math.random;
  Math.random = () => 0.49;
  const resisted = resistsStatusEffect(treant, '빙결');
  Math.random = () => 0.5;
  const notResisted = resistsStatusEffect(treant, '빙결');
  Math.random = originalRandom;

  const kraken = createUnit('kraken', 'player', 4, 0);
  return {
    insectDice,
    plantMaxHp,
    plantMaxHpAfterDisable,
    resisted,
    notResisted,
    mantisMoves: movementDeltas({ ...mantisA, row: 4, col: 2 }).length,
    mantisAttacks: attackDeltas(mantisA).length,
    krakenMoves: movementDeltas(kraken).length,
    krakenAttacks: attackDeltas(kraken).length,
  };
})()`, sandbox);
assert.deepStrictEqual(Array.from(legionSnapshot.insectDice), [0, 0, 1, 1, 3, 2], '벌레 군단은 2 한 면만 3으로 변경해야 함');
assert.deepStrictEqual(Array.from(legionSnapshot.plantMaxHp), [6, 6], '식물 군단은 식물 유닛 최대 체력을 1 높여야 함');
assert.strictEqual(legionSnapshot.plantMaxHpAfterDisable, 5, '식물 군단 해제 시 최대 체력이 원래대로 돌아와야 함');
assert.strictEqual(legionSnapshot.resisted, true, '원소 면역은 50% 미만 난수에서 발동해야 함');
assert.strictEqual(legionSnapshot.notResisted, false, '원소 면역은 50% 이상 난수에서 발동하지 않아야 함');
assert.strictEqual(legionSnapshot.mantisMoves, 4, '지옥 사마귀 이동 범위 검증');
assert.strictEqual(legionSnapshot.mantisAttacks, 5, '모든 공격 가능 유닛은 기존 공격 범위에 좌우 1칸이 추가되어야 함');
assert.strictEqual(legionSnapshot.krakenMoves, 8, '크라켄 이동 범위 검증');
assert.strictEqual(legionSnapshot.krakenAttacks, 16, '크라켄 공격 범위 검증');
const attackDirectionSnapshot = vm.runInContext(`Object.entries(UNIT_TYPES)
  .filter(([, def]) => !def.cannotAttack)
  .map(([type]) => ({
    type,
    deltas: attackDeltas({ type, owner: 'player' })
  }))`, sandbox);
attackDirectionSnapshot.forEach(({ type, deltas }) => {
  assert.ok(deltas.some(([dr, dc]) => dr === 0 && dc === -1), `${type} 공격에 왼쪽 1칸이 포함되어야 함`);
  assert.ok(deltas.some(([dr, dc]) => dr === 0 && dc === 1), `${type} 공격에 오른쪽 1칸이 포함되어야 함`);
});
assert.strictEqual(sandbox.attackTarget.toString().includes('attacker.type === "knight"'), false, '죽음의 기사 공격은 별도 스플래시 분기를 사용하지 않아야 함');
console.log('Pass: 벌레 주사위 강화, 식물 HP, 원소 면역, 신규 이동·공격 범위 검증 성공.');

console.log('\n=== 9. 생존 승계, 자동 회복, 재소환 영구 성장 검증 ===');
const progressionSnapshot = vm.runInContext(`(() => {
  campaign.roster = ['spear', 'archer'];
  campaign.unitProgress = {
    spear: defaultCampaignProgress('spear'),
    archer: defaultCampaignProgress('archer')
  };
  state.board = makeBoard();
  state.units = [];
  state.nextId = 1;
  state.deployedTypes = ['spear', 'archer'];
  const survivor = createCampaignUnit('spear', 'player', 3, 2);
  survivor.hp = 1;
  saveBattleProgress([]);
  const survivorResult = {
    roster: [...campaign.roster],
    hp: campaign.unitProgress.spear.hp,
    maxHp: campaign.unitProgress.spear.maxHp,
    archerProgressExists: Boolean(campaign.unitProgress.archer)
  };

  state.board = makeBoard();
  state.units = [];
  state.nextId = 1;
  const growingUnit = createCampaignUnit('spear', 'player', 2, 2);
  const originalRandom = Math.random;
  Math.random = () => 0;
  const growthText = applyRespawnGrowth(growingUnit);
  Math.random = originalRandom;
  const backwardMoveExists = legalMoves(growingUnit).some((cell) => cell.row === 3 && cell.col === 2);

  return {
    survivorResult,
    growthText,
    maxHp: growingUnit.baseMaxHp,
    respawns: growingUnit.respawns,
    retreat: growingUnit.retreat,
    backwardMoveExists,
    savedRespawns: campaign.unitProgress.spear.respawns,
    savedMaxHp: campaign.unitProgress.spear.maxHp
  };
})()`, sandbox);
assert.deepStrictEqual(Array.from(progressionSnapshot.survivorResult.roster), ['spear'], '전투에서 죽은 배치 유닛은 원정대에서 제거되어야 함');
assert.strictEqual(progressionSnapshot.survivorResult.hp, progressionSnapshot.survivorResult.maxHp, '생존 유닛은 전투 종료 후 완전히 회복되어야 함');
assert.strictEqual(progressionSnapshot.survivorResult.archerProgressExists, false, '전사 유닛 진행도는 삭제되어야 함');
assert.strictEqual(progressionSnapshot.growthText, '최대 체력 +1', '재소환 성장은 고정 난수에서 최대 체력을 올려야 함');
assert.strictEqual(progressionSnapshot.respawns, 1, '재소환 횟수가 영구 진행도에 기록되어야 함');
assert.strictEqual(progressionSnapshot.retreat, 1, '첫 재소환 후 후퇴 범위가 1칸이어야 함');
assert.strictEqual(progressionSnapshot.backwardMoveExists, true, '후퇴 이동 칸이 실제 이동 범위에 포함되어야 함');
assert.strictEqual(progressionSnapshot.savedRespawns, 1, '재소환 횟수가 캠페인 세이브 진행도에 저장되어야 함');
assert.strictEqual(progressionSnapshot.savedMaxHp, sandbox.UNIT_TYPES.spear.hp + 1, '영구 최대 체력 상승이 저장되어야 함');
console.log('Pass: 전사자 제거, 생존자 자동 회복, 영구 성장 및 후퇴 범위 검증 성공.');

console.log('\n=== 10. 상대 소환 및 재소환 규칙 검증 ===');
assert.strictEqual(sandbox.runEnemyTurn.toString().includes('tryCorpseSummon'), false, '상대 AI는 시체 소환을 시도하지 않아야 함');
[
  sandbox.maybeBeginSpiderSummon,
  sandbox.maybeBeginGoblinSummon,
  sandbox.maybeBeginUndeadSummon,
  sandbox.maybeBeginSeedSummon
].forEach((summonHandler) => {
  assert.strictEqual(summonHandler.toString().includes('attacker.owner !== "player"'), false, '고유 소환 능력은 적 유닛도 사용할 수 있어야 함');
});
assert.ok(sandbox.finishUnitAction.toString().includes('isNormalUnit(unit) && unit.respawns < 3'), '적 일반 유닛도 끝 칸에서 재소환할 수 있어야 함');
console.log('Pass: 상대 시체 소환 금지, 고유 소환 허용, 일반 유닛 재소환 검증 성공.');

console.log('\n=== 11. 배치 완료 및 대기 유닛 교체 검증 ===');
const placementSnapshot = vm.runInContext(`(() => {
  resetCampaign();
  campaign.roster = [];
  campaign.unitProgress = {};
  setupBattleBoardState(campaign.encounters[6]);
  const zeroLimit = state.setupLimits.player;
  confirmPlayerSetup();
  const zeroRosterPhase = state.phase;

  resetCampaign();
  campaign.roster = ['spear', 'archer'];
  campaign.unitProgress = {
    spear: defaultCampaignProgress('spear'),
    archer: defaultCampaignProgress('archer')
  };
  setupBattleBoardState(campaign.encounters[0]);
  state.selectedReserve = 'spear';
  handleSetupCell(3, 0);
  state.selectedReserve = 'archer';
  handleSetupCell(3, 0);
  const deployed = unitAt(3, 0)?.type;
  const reserves = [...state.reserves.player];
  state.inspectedReserveType = reserves[0] || null;
  renderUnitInfo();
  return {
    zeroLimit,
    zeroRosterPhase,
    deployed,
    reserves,
    infoVisible: unitInfoEl.innerHTML.includes(UNIT_TYPES[reserves[0]]?.label || '')
  };
})()`, sandbox);
assert.strictEqual(placementSnapshot.zeroLimit, 0, '전투 유닛이 없으면 배치 제한이 0이어야 함');
assert.strictEqual(placementSnapshot.zeroRosterPhase, 'battle', '전투 유닛이 없어도 배치 완료 후 전투가 시작되어야 함');
assert.strictEqual(placementSnapshot.deployed, 'archer', '기존 배치 칸에 다른 대기 유닛을 놓으면 교체되어야 함');
assert.ok(Array.from(placementSnapshot.reserves).includes('spear'), '교체된 기존 유닛은 대기 목록으로 돌아가야 함');
assert.strictEqual(placementSnapshot.infoVisible, true, '대기 유닛도 정보창을 표시해야 함');
console.log('Pass: 0명 배치 진행, 교체 배치, 대기 유닛 정보 검증 성공.');

console.log('\n=== 12. 분기 원정 선택지 및 고급 전장 검증 ===');
const expeditionSnapshot = vm.runInContext(`(() => {
  resetCampaign();
  const entries = expeditionRouteEntries();
  const firstChoices = entries
    .filter((entry) => entry.index === 0)
    .map((entry) => entry.type);
  const bossChoices = entries
    .filter((entry) => entry.index === 9)
    .map((entry) => entry.type);
  const eliteEncounter = buildRouteEncounter(0, 'elite');
  const hasEliteEnemy = eliteEncounter.enemies.some((type) => ['advanced', 'hero'].includes(UNIT_TYPES[type].grade));
  const uniqueEliteEnemies = new Set(eliteEncounter.enemies).size === eliteEncounter.enemies.length;
  const eventSpec = routeEventSpec(0);

  campaign.routeHistory[0] = 'event';
  campaign.battleIndex = 1;
  autoSaveCampaign();
  const saved = loadCampaignSave();

  campaign.battleIndex = 0;
  campaign.routeHistory[0] = 'elite';
  const eliteConfig = getRewardConfig();
  return {
    firstChoices,
    bossChoices,
    hasEliteEnemy,
    uniqueEliteEnemies,
    eventIsRouteChoice: eventSpec.routeEvent === true && eventSpec.id === 'route-event-0',
    savedRoute: [...saved.routeHistory],
    elite: eliteConfig.isElite,
    eliteOptions: eliteConfig.optionsList.map((option) => option.key)
  };
})()`, sandbox);
assert.deepStrictEqual(Array.from(expeditionSnapshot.firstChoices), ['normal', 'elite', 'event'], '일반·고급·사건 3개 선택지가 열려야 함');
assert.deepStrictEqual(Array.from(expeditionSnapshot.bossChoices), ['boss'], '각 스테이지 10번째 층은 보스 단일 경로여야 함');
assert.strictEqual(expeditionSnapshot.hasEliteEnemy, true, '고급 전장에는 고급 또는 영웅 적이 반드시 포함되어야 함');
assert.strictEqual(expeditionSnapshot.uniqueEliteEnemies, true, '고급 전장에도 같은 적이 중복 등장하면 안 됨');
assert.strictEqual(expeditionSnapshot.eventIsRouteChoice, true, '사건은 해당 층을 소비하는 선택형 경로여야 함');
assert.deepStrictEqual(Array.from(expeditionSnapshot.savedRoute), ['event'], '선택한 경로가 세이브에 저장되어야 함');
assert.strictEqual(expeditionSnapshot.elite, true, '고급 경로 선택 시 고급 보상으로 판정되어야 함');
assert.deepStrictEqual(Array.from(expeditionSnapshot.eliteOptions), ['vitality', 'dice'], '고급 전장은 생명력과 주사위 강화 보상을 제공해야 함');
console.log('Pass: 3갈래 선택, 고급 편성, 사건 진행, 경로 저장 및 고급 보상 검증 성공.');

console.log('\n=== 13. Captured unit carryover, enhancement badge, and totem reselection ===');
const carryoverSnapshot = vm.runInContext(`(() => {
  resetCampaign();
  setupBattleBoardState(campaign.encounters[0]);
  createUnit('forestFairy', 'player', 3, 0, null, {
    summonedNoCorpse: true,
    capturedForCampaign: true
  });
  const captured = survivingCapturedTypes();
  saveBattleProgress(captured);
  const rosterAfterCapture = [...campaign.roster];

  campaign.unitProgress.spear.maxHp += 1;
  campaign.unitProgress.spear.hp = campaign.unitProgress.spear.maxHp;
  campaign.unitProgress.spear.dice[2] += 1;
  const enhancementLevel = enhancementLevelFor('spear');

  campaign.availableTotems = ['beast', 'ice', 'undead'];
  setupBattleBoardState(campaign.encounters[1]);
  const reserveHasFairy = state.reserves.player.includes('forestFairy');
  const beastSelected = selectSetupTotem('beast') && state.selectedTotem === 'beast';
  const iceSelected = selectSetupTotem('ice') && state.selectedTotem === 'ice';
  const cleared = selectSetupTotem(null) && state.selectedTotem === null;
  return { captured, rosterAfterCapture, reserveHasFairy, enhancementLevel, beastSelected, iceSelected, cleared };
})()`, sandbox);
assert.ok(Array.from(carryoverSnapshot.captured).includes('forestFairy'), 'corpse-captured forest fairy should be captured');
assert.ok(Array.from(carryoverSnapshot.rosterAfterCapture).includes('forestFairy'), 'captured forest fairy should persist in roster');
assert.strictEqual(carryoverSnapshot.reserveHasFairy, true, 'captured forest fairy should be deployable next battle');
assert.strictEqual(carryoverSnapshot.enhancementLevel, 2, 'one HP and one die upgrade should display as +2');
assert.strictEqual(carryoverSnapshot.beastSelected, true, 'beast totem should be selectable during setup');
assert.strictEqual(carryoverSnapshot.iceSelected, true, 'selected totem should be changeable during setup');
assert.strictEqual(carryoverSnapshot.cleared, true, 'totem selection should be removable during setup');
console.log('Pass: captured carryover, enhancement level, and setup totem reselection.');

console.log('\n=== 14. 승리 정산, 전사, 자동 회복 표시 검증 ===');
const settlementSnapshot = vm.runInContext(`(() => {
  resetCampaign();
  setupBattleBoardState(campaign.encounters[0]);
  state.deployedTypes = ['spear', 'archer'];
  const spear = createCampaignUnit('spear', 'player', 3, 0);
  spear.hp = 1;
  showVictoryRewardScreen([]);
  const saved = loadCampaignSave();
  return {
    fallenTypes: [...campaign.rewardState.fallenTypes],
    healed: campaign.rewardState.survivors.find((unit) => unit.type === 'spear')?.healed,
    enhancementLevel: campaign.rewardState.survivors.find((unit) => unit.type === 'spear')?.enhancementLevel,
    expectedHealed: UNIT_TYPES.spear.hp - 1,
    archerLabel: UNIT_TYPES.archer.label,
    archerRemoved: !campaign.roster.includes('archer'),
    settlementHtml: rewardSettlement.innerHTML,
    savedFallenTypes: [...saved.rewardState.fallenTypes],
    recoverIsDisplayOnly: !applyCampaignReward.toString().split('if (key === "heal")')[0].includes('healCampaignRoster()')
  };
})()`, sandbox);
assert.deepStrictEqual(Array.from(settlementSnapshot.fallenTypes), ['archer'], '전사한 배치 유닛이 정산에 기록되어야 함');
assert.strictEqual(settlementSnapshot.healed, settlementSnapshot.expectedHealed, '생존 유닛의 자동 회복량이 기록되어야 함');
assert.strictEqual(settlementSnapshot.enhancementLevel, 0, '미강화 유닛은 0강으로 기록되어야 함');
assert.strictEqual(settlementSnapshot.archerRemoved, true, '전사 유닛은 다음 원정대에서 제거되어야 함');
assert.ok(settlementSnapshot.settlementHtml.includes(settlementSnapshot.archerLabel), '정산 화면에 전사 유닛 이름이 보여야 함');
assert.deepStrictEqual(Array.from(settlementSnapshot.savedFallenTypes), ['archer'], '새로고침 복원을 위해 전사 정보가 저장되어야 함');
assert.strictEqual(settlementSnapshot.recoverIsDisplayOnly, true, '자동 회복 뒤 일반 보상에서 회복을 중복 실행하지 않아야 함');
console.log('Pass: 전사·회복·강화 정산 저장과 중복 회복 방지 검증 성공.');

console.log('\n=== 15. 전투 브리핑 정보 및 무상태 닫기 검증 ===');
const briefingSnapshot = vm.runInContext(`(() => {
  resetCampaign();
  campaign.availableTotems = ['beast'];
  const encounter = {
    enemies: ['ogre', 'minotaur', 'spear'],
    boss: false,
    isPacing: false,
    stage: 1,
    battle: 1,
    attempts: 0
  };
  const briefing = buildEncounterBriefing(encounter, 0);
  const before = JSON.stringify({
    attempts: encounter.attempts,
    currentNodeId: campaign.currentNodeId,
    checkpoint: campaign.checkpoint
  });
  openBattleBriefing(encounter, 0, () => {});
  closeBattleBriefing();
  const after = JSON.stringify({
    attempts: encounter.attempts,
    currentNodeId: campaign.currentNodeId,
    checkpoint: campaign.checkpoint
  });
  return {
    enemyCount: briefing.enemies.reduce((sum, enemy) => sum + enemy.count, 0),
    beastActive: briefing.activeLegions.some((legion) => legion.key === 'beast' && legion.count === 2),
    ownsBeastTotem: briefing.totems.some((totem) => totem.key === 'beast'),
    threatScore: briefing.threat.score,
    hasThreatIntel: briefing.threat.intel.length > 10,
    gradesVisible: briefing.enemies.every((enemy) => ['normal', 'advanced', 'hero', 'special'].includes(enemy.grade)),
    reward: briefing.reward,
    stateUnchanged: before === after,
    pendingCleared: pendingBriefingStart === null
  };
})()`, sandbox);
assert.strictEqual(briefingSnapshot.enemyCount, 3, '브리핑에 적 전체 수가 정확히 표시되어야 함');
assert.strictEqual(briefingSnapshot.beastActive, true, '적 야수 2마리는 활성 야수 군단으로 표시되어야 함');
assert.strictEqual(briefingSnapshot.ownsBeastTotem, true, '보유 토템이 브리핑에 표시되어야 함');
assert.ok(briefingSnapshot.threatScore >= 1 && briefingSnapshot.threatScore <= 5, '위험도는 1~5 범위로 계산되어야 함');
assert.strictEqual(briefingSnapshot.hasThreatIntel, true, '위험도에 맞는 정찰 문구가 제공되어야 함');
assert.strictEqual(briefingSnapshot.gradesVisible, true, '모든 적 카드에 등급 정보가 제공되어야 함');
assert.strictEqual(briefingSnapshot.reward, '전투 정산 · 생존 유닛 자동 회복', '일반 전투 보상 안내가 정확해야 함');
assert.strictEqual(briefingSnapshot.stateUnchanged, true, '브리핑 열기와 닫기는 전투 상태를 변경하지 않아야 함');
assert.strictEqual(briefingSnapshot.pendingCleared, true, '브리핑을 닫으면 대기 중인 전투 콜백이 제거되어야 함');
console.log('Pass: 적 구성, 활성 군단, 보상, 토템 표시와 무상태 닫기 검증 성공.');

console.log('\n=== 16. 임시 체력 보너스 및 시체 확인 회귀 검증 ===');
const healthBonusSnapshot = vm.runInContext(`(() => {
  state.phase = 'setup';
  state.board = makeBoard();
  state.units = [];
  state.corpses = [];
  state.nextId = 1;
  campaign.unitProgress.ancientTreant = defaultCampaignProgress('ancientTreant');
  campaign.unitProgress.ancientTreant.maxHp += 1;
  campaign.unitProgress.ancientTreant.hp = campaign.unitProgress.ancientTreant.maxHp;
  const first = createCampaignUnit('ancientTreant', 'player', 3, 0);
  const second = createCampaignUnit('ancientTreant', 'player', 3, 1);
  return {
    firstHp: first.hp,
    firstMaxHp: first.maxHp,
    secondHp: second.hp,
    secondMaxHp: second.maxHp
  };
})()`, sandbox);
assert.strictEqual(healthBonusSnapshot.firstHp, healthBonusSnapshot.firstMaxHp, '먼저 배치된 유닛도 활성화된 식물 체력 보너스만큼 현재 체력이 올라야 함');
assert.strictEqual(healthBonusSnapshot.secondHp, healthBonusSnapshot.secondMaxHp, '새로 배치한 유닛은 영구 강화와 군단 체력 보너스가 현재 체력에도 함께 적용되어야 함');

const corpseConfirmationSnapshot = vm.runInContext(`(() => {
  state.phase = 'battle';
  state.turn = 'player';
  state.winner = null;
  state.isRolling = false;
  const corpse = {
    id: 'corpse-confirm-test',
    row: 2,
    col: 2,
    sourceType: 'ogre',
    sourceOwner: 'enemy',
    target: 4,
    attemptsRemaining: 2
  };
  confirmCorpseSummon(corpse);
  return {
    attemptsRemaining: corpse.attemptsRemaining,
    text: dialogText.textContent,
    title: dialogTitle.textContent,
    clickUsesConfirmation: handleCellClick.toString().includes('confirmCorpseSummon(corpse)')
  };
})()`, sandbox);
assert.strictEqual(corpseConfirmationSnapshot.attemptsRemaining, 2, '시체 확인창을 여는 것만으로 소환 기회가 줄면 안 됨');
assert.ok(corpseConfirmationSnapshot.text.includes('4+'), '시체 확인창에 소환 목표가 표시되어야 함');
assert.ok(corpseConfirmationSnapshot.text.includes('2'), '시체 확인창에 남은 기회가 표시되어야 함');
assert.ok(corpseConfirmationSnapshot.title.includes(sandbox.UNIT_TYPES.ogre.label), '시체 확인창에 죽은 유닛 이름이 표시되어야 함');
assert.strictEqual(corpseConfirmationSnapshot.clickUsesConfirmation, true, '시체 클릭은 즉시 굴리지 않고 확인창을 열어야 함');
console.log('Pass: 임시 최대 체력이 현재 체력에 반영되고 시체 소환 전 확인 단계를 거칩니다.');

console.log('\n=== 17. 확률 합산, 변환 충돌, 토템 부활·회복, 히드라 검증 ===');
const batchPatchSnapshot = vm.runInContext(`(() => {
  state.phase = 'setup';
  state.board = makeBoard();
  state.units = [];
  state.corpses = [];
  state.nextId = 1;
  state.selectedTotem = 'insect';
  const worm = createUnit('worm', 'player', 3, 0);
  createUnit('hellMantis', 'player', 3, 1);
  createUnit('spear', 'player', 4, 0);
  createUnit('archer', 'player', 4, 1);
  createUnit('knight', 'player', 4, 2);
  const conflictDice = effectiveAttackDice(worm);

  state.board = makeBoard();
  state.units = [];
  state.nextId = 1;
  state.selectedTotem = 'demon';
  const hydra = createUnit('hydra', 'player', 3, 0);
  createUnit('doomExecutor', 'player', 3, 1);
  const frenzyChance = demonFrenzyChance(hydra);

  state.selectedTotem = 'plague';
  createUnit('plagueFrog', 'player', 3, 2);
  const poisonChanceValue = poisonChance(hydra);

  state.board = makeBoard();
  state.units = [];
  state.nextId = 1;
  state.selectedTotem = 'ice';
  const yeti = createUnit('yeti', 'player', 3, 0);
  createUnit('iceLord', 'player', 3, 1);
  const freezeChanceValue = freezeChance(yeti);

  state.board = makeBoard();
  state.units = [];
  state.nextId = 1;
  state.selectedTotem = 'element';
  const treant = createUnit('ancientTreant', 'player', 3, 0);
  createUnit('stoneGolem', 'player', 3, 1);
  const resistanceChance = statusResistanceChance(treant);

  state.board = makeBoard();
  state.units = [];
  state.corpses = [];
  state.nextId = 1;
  state.selectedTotem = 'corpse';
  const reviver = createUnit('ghoul', 'player', 3, 0);
  const originalRandom = Math.random;
  Math.random = () => 0.09;
  reviver.hp = 0;
  const firstDeathResult = killUnit(reviver);
  const survivedFirstDeath = state.units.includes(reviver) && reviver.hp === 1 && reviver.corpseTotemRevived;
  reviver.hp = 0;
  const secondDeathResult = killUnit(reviver);
  const removedSecondDeath = !state.units.includes(reviver);

  state.board = makeBoard();
  state.units = [];
  state.nextId = 1;
  state.selectedTotem = 'plant';
  const healed = createUnit('spear', 'player', 3, 0);
  healed.hp -= 1;
  const healTriggered = maybeApplyPlantTotemHeal(healed);
  Math.random = originalRandom;

  return {
    conflictDice,
    frenzyChance,
    poisonChanceValue,
    freezeChanceValue,
    resistanceChance,
    firstDeathResult,
    survivedFirstDeath,
    secondDeathResult,
    removedSecondDeath,
    corpseCount: state.corpses.length,
    healTriggered,
    healedHp: healed.hp,
    healedMaxHp: healed.maxHp,
    hydraLegions: legionsOf({ type: 'hydra' }),
    hydraMoves: movementDeltas({ type: 'hydra', owner: 'player' }).length,
    hydraAttacks: attackDeltas({ type: 'hydra', owner: 'player' }).length,
    wormLegions: legionsOf({ type: 'worm' }),
    spiderLegions: legionsOf({ type: 'spiderQueen' })
  };
})()`, sandbox);
assert.deepStrictEqual(Array.from(batchPatchSnapshot.conflictDice), [1, 0, 1, 1, 3, 2], '한 주사위 면은 군단·토템에 중복 변환되면 안 됨');
assert.strictEqual(batchPatchSnapshot.frenzyChance, 0.4, '악마 군단과 악마 토템은 폭주 40%로 합산되어야 함');
assert.strictEqual(batchPatchSnapshot.poisonChanceValue, 0.4, '역병 군단과 역병 토템은 중독 40%로 합산되어야 함');
assert.strictEqual(batchPatchSnapshot.freezeChanceValue, 0.3, '얼음 군단 빙결 확률은 30%여야 함');
assert.strictEqual(batchPatchSnapshot.resistanceChance, 0.6, '원소 군단과 원소 토템은 면역 60%로 합산되어야 함');
assert.strictEqual(batchPatchSnapshot.survivedFirstDeath, true, '시체 토템은 성공 시 HP 1로 1회 부활시켜야 함');
assert.strictEqual(batchPatchSnapshot.removedSecondDeath, true, '시체 토템으로 부활한 유닛은 두 번째로 부활하면 안 됨');
assert.strictEqual(batchPatchSnapshot.healTriggered, true, '식물 토템은 10% 판정 성공 시 회복해야 함');
assert.strictEqual(batchPatchSnapshot.healedHp, batchPatchSnapshot.healedMaxHp, '식물 토템 회복은 최대 체력을 넘지 않아야 함');
assert.deepStrictEqual(Array.from(batchPatchSnapshot.hydraLegions), ['plague', 'demon'], '히드라는 역병·악마 이중 군단이어야 함');
assert.strictEqual(batchPatchSnapshot.hydraMoves, 4, '히드라는 상하좌우 1칸 이동해야 함');
assert.strictEqual(batchPatchSnapshot.hydraAttacks, 5, '히드라는 전방 3칸과 좌우를 공격해야 함');
assert.deepStrictEqual(Array.from(batchPatchSnapshot.wormLegions), ['plague', 'insect'], '역병 벌레는 역병·벌래 군단이어야 함');
assert.deepStrictEqual(Array.from(batchPatchSnapshot.spiderLegions), ['summon', 'insect'], '거미여왕은 소환·벌래 군단이어야 함');
console.log('Pass: 확률 합산, 주사위 변환 순서, 토템 회복·1회 부활, 히드라와 벌래 분류 검증 성공.');

console.log('\n=== 18. 취소 및 세션 무효화 시 피해 미적용 검증 ===');
console.log('\n=== 18A. Ultimate maximum-face trigger verification ===');
const ultimateRollSnapshot = vm.runInContext(`(() => ({
  deathKnightMax: isMaximumAttackRoll(3, [0, 1, 1, 2, 2, 3]),
  deathKnightTwo: isMaximumAttackRoll(2, [0, 1, 1, 2, 2, 3]),
  weakUnitMaxTwo: isMaximumAttackRoll(2, [0, 0, 1, 1, 2, 2]),
  zeroOnly: isMaximumAttackRoll(0, [0, 0, 0, 0, 0, 0]),
  invalidDice: isMaximumAttackRoll(3, null),
  normalBlocked: isUltimateEligibleUnit({ type: 'spear' }),
  advancedAllowed: isUltimateEligibleUnit({ type: 'knight' }),
  heroAllowed: isUltimateEligibleUnit({ type: 'hydra' }),
  specialBlocked: isUltimateEligibleUnit({ type: 'spiderling' }),
  killShortcutRemoved: !playAttackEffect.toString().includes('rolledDamage === 3 || isKill')
}))()`, sandbox);
assert.strictEqual(ultimateRollSnapshot.deathKnightMax, true, 'Death Knight must trigger the ultimate on its actual maximum face.');
assert.strictEqual(ultimateRollSnapshot.deathKnightTwo, false, 'Death Knight face 2 must not trigger the ultimate, including on a killing blow.');
assert.strictEqual(ultimateRollSnapshot.weakUnitMaxTwo, true, 'A unit whose actual maximum is 2 must trigger on face 2.');
assert.strictEqual(ultimateRollSnapshot.zeroOnly, false, 'A zero-only non-attacker must not trigger the ultimate.');
assert.strictEqual(ultimateRollSnapshot.invalidDice, false, 'Missing attack dice must not trigger the ultimate.');
assert.strictEqual(ultimateRollSnapshot.normalBlocked, false, 'Normal units must never trigger an ultimate.');
assert.strictEqual(ultimateRollSnapshot.advancedAllowed, true, 'Advanced units must be eligible for maximum-face ultimates.');
assert.strictEqual(ultimateRollSnapshot.heroAllowed, true, 'Hero units must be eligible for maximum-face ultimates.');
assert.strictEqual(ultimateRollSnapshot.specialBlocked, false, 'Special summons must never trigger an ultimate.');
assert.strictEqual(ultimateRollSnapshot.killShortcutRemoved, true, 'Kill status must not bypass the maximum-face rule.');
console.log('Pass: Ultimate VFX is restricted to the positive maximum face of the effective attack die.');

async function verifyCancelledAndInvalidatedAttacks() {
  const result = await vm.runInContext(`(async () => {
    resetCampaign();
    setupBattleBoardState(campaign.encounters[0]);
    state.phase = "battle";
    const originalRandom = Math.random;
    Math.random = () => 0.999999;
    const attacker = createUnit('knight', 'player', 3, 2);
    const target = createUnit('ghoul', 'enemy', 2, 2);
    const initialHp = target.hp;

    window.UltimateVfx = {
      canPlay: () => true,
      prefersReducedMotion: () => false,
      cancel: () => {},
      playUltimateImpact: async () => ({ reason: "cancelled", impactTriggered: false }),
      playGreatswordImpact: async () => ({ reason: "cancelled", impactTriggered: false })
    };

    await attackTarget(attacker, target);
    const cancelledHp = target.hp;

    resetCampaign();
    setupBattleBoardState(campaign.encounters[0]);
    state.phase = "battle";
    const attacker2 = createUnit('knight', 'player', 3, 2);
    const target2 = createUnit('ghoul', 'enemy', 2, 2);
    const initialHp2 = target2.hp;

    window.UltimateVfx = {
      canPlay: () => true,
      prefersReducedMotion: () => false,
      cancel: () => {},
      playUltimateImpact: async () => {
        state.battleToken = (state.battleToken || 0) + 1;
        state.effects = { phase: "new-battle-sentinel" };
        return { reason: "complete", impactTriggered: true };
      },
      playGreatswordImpact: async () => {
        state.battleToken = (state.battleToken || 0) + 1;
        state.effects = { phase: "new-battle-sentinel" };
        return { reason: "complete", impactTriggered: true };
      }
    };

    await attackTarget(attacker2, target2);
    Math.random = originalRandom;
    return {
      initialHp,
      cancelledHp,
      initialHp2,
      invalidatedHp: target2.hp,
      invalidatedEffectPhase: state.effects.phase
    };
  })()`, sandbox);

  assert.strictEqual(result.cancelledHp, result.initialHp, '취소된 필살기는 실제 비동기 완료 후에도 피해를 주면 안 됨');
  assert.strictEqual(result.invalidatedHp, result.initialHp2, '세션이 변경된 공격은 실제 비동기 완료 후에도 피해를 주면 안 됨');
  assert.strictEqual(result.invalidatedEffectPhase, 'new-battle-sentinel', '이전 공격의 finally가 새 전투 이펙트 상태를 덮어쓰면 안 됨');
  console.log('Pass: 실제 비동기 완료 후 취소된 필살기 및 세션 변경 피해 0회 검증 성공.');
  console.log('\n✅ 모든 세이브 무결성 및 복원 회귀 테스트 통과!');
}

verifyCancelledAndInvalidatedAttacks().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
