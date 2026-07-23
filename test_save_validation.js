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
assert.strictEqual(loadedV2.encounters.length, 30, '30전투 포함되어야 함');
assert.deepStrictEqual(Array.from(loadedV2.resolvedInterludes), [], '기존 V2 세이브는 해결한 탐험 노드 빈 목록으로 보완되어야 함');
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
assert.strictEqual(setupSnapshot.nextId, 2, '소환사 생성 후 다음 ID는 2여야 함');
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

console.log('\n=== 12. 탐험 노드 및 정예 보상 검증 ===');
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

const expeditionSnapshot = vm.runInContext(`(() => {
  resetCampaign();
  campaign.battleIndex = 3;
  campaign.stageIndex = 0;
  const pendingBefore = pendingInterludeForBattleIndex()?.id;
  const baseMaxHp = campaign.unitProgress.spear.maxHp;
  const originalRandom = Math.random;
  Math.random = () => 0;
  resolveInterlude(INTERLUDE_SPECS.find((spec) => spec.id === 'rest-1'), 'vitality');
  Math.random = originalRandom;
  const pendingAfter = pendingInterludeForBattleIndex();
  const saved = loadCampaignSave();

  campaign.battleIndex = 8;
  const eliteConfig = getRewardConfig();
  return {
    pendingBefore,
    pendingAfter,
    resolved: [...campaign.resolvedInterludes],
    maxHpGain: campaign.unitProgress.spear.maxHp - baseMaxHp,
    savedResolved: [...saved.resolvedInterludes],
    elite: eliteConfig.isElite,
    eliteOptions: eliteConfig.optionsList.map((option) => option.key)
  };
})()`, sandbox);
assert.strictEqual(expeditionSnapshot.pendingBefore, 'rest-1', '3전투 뒤 휴식 노드가 활성화되어야 함');
assert.strictEqual(expeditionSnapshot.pendingAfter, null, '휴식 선택 후 다음 전투 잠금이 해제되어야 함');
assert.ok(Array.from(expeditionSnapshot.resolved).includes('rest-1'), '해결한 탐험 노드가 원정 상태에 기록되어야 함');
assert.strictEqual(expeditionSnapshot.maxHpGain, 1, '휴식의 체력 단련은 최대 체력을 1 올려야 함');
assert.ok(Array.from(expeditionSnapshot.savedResolved).includes('rest-1'), '탐험 노드 진행이 세이브에 저장되어야 함');
assert.strictEqual(expeditionSnapshot.elite, true, '9·19·29번째 전투는 정예전이어야 함');
assert.deepStrictEqual(Array.from(expeditionSnapshot.eliteOptions), ['vitality', 'dice'], '정예전은 생명력과 주사위 강화 보상을 제공해야 함');
console.log('Pass: 휴식 노드 저장, 다음 전투 해제, 정예 보상 검증 성공.');

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

console.log('\n✅ 모든 세이브 무결성 및 복원 회귀 테스트 통과!');
