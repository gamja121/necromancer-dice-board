/**
 * test_encounter_generator.js
 * WFC 3스테이지 30전투 자동 생성기 종합 단위/회귀/10,000회 대량 시뮬레이션 테스트
 */

const assert = require("assert");
const unitData = require("./unit-data.js");
const generator = require("./encounter-generator.js");

console.log("=== 1. 유닛 레지스트리 무결성 검증 ===");
unitData.validateUnitRegistry();
console.log("Pass: 유닛 레지스트리(UNIT_TYPES <-> ENCOUNTER_UNIT_META) 100% 동기화 검증 성공.");

console.log("\n=== 2. 결정성(Determinism) 검증 ===");
const seedA = 987654321;
const resultA1 = generator.generate30Encounters(seedA);
const resultA2 = generator.generate30Encounters(seedA);

assert.strictEqual(resultA1.encounters.length, 30, "30전투가 생성되어야 함");
assert.deepStrictEqual(
  resultA1.encounters,
  resultA2.encounters,
  "동일한 시드는 100% 완전 동일한 30개 적 조합을 산출해야 함"
);
console.log("Pass: 동일 시드 투입 시 100% 동일한 30개 조합 재현 확인.");

console.log("\n=== 3. 단일 원정 제약 규칙 검증 ===");
const singleRun = generator.generate30Encounters(12345);
assert.strictEqual(generator.validateEncountersArray(singleRun.encounters), true, "validateEncountersArray 검증 통과해야 함");

// 전열 보유, 특수소환물 직출 금지, 소환사 제외 검증
for (const enc of singleRun.encounters) {
  assert.ok(generator.hasFrontline(enc.enemies), `전투 ${enc.id}에 전열 유닛이 포함되어야 함`);
  assert.ok(!enc.enemies.includes("spiderling"), `전투 ${enc.id}에 spiderling 직출 금지`);
  assert.ok(!enc.enemies.includes("goblinCommoner"), `전투 ${enc.id}에 goblinCommoner 직출 금지`);
  assert.ok(!enc.enemies.includes("summoner"), `전투 ${enc.id}에 summoner 포함 금지`);
}
console.log("Pass: 전열 역할 보유, 특수 소환물 직출 금지, 소환사 제외 규칙 검증 완료.");

console.log("\n=== 4. 10,000회 대량 생성 시뮬레이션 스트레스 및 제약 Assertion 테스트 ===");
const SIMULATION_COUNT = 10000;
let fallbackCount = 0;
let totalRestarts = 0;
let totalBacktracks = 0;
const unitFrequencies = {};
const heroFrequencies = {};

const startTime = Date.now();

for (let i = 1; i <= SIMULATION_COUNT; i++) {
  const seed = i * 7919; // 소수 곱 시드
  const res = generator.generate30Encounters(seed);

  // 시드당 30전투 제약 무결성 검증
  assert.strictEqual(generator.validateEncountersArray(res.encounters), true, `시드 ${seed}의 30전투 전체가 모든 제약 조건을 통과해야 함`);

  if (res.usedFallback) {
    fallbackCount++;
  }
  totalRestarts += res.restartCount;
  totalBacktracks += res.backtrackCount;

  // 통계 수집
  for (const enc of res.encounters) {
    for (const u of enc.enemies) {
      unitFrequencies[u] = (unitFrequencies[u] || 0) + 1;
      if (unitData.UNIT_TYPES[u] && unitData.UNIT_TYPES[u].grade === "hero") {
        heroFrequencies[u] = (heroFrequencies[u] || 0) + 1;
      }
    }
  }

  if (i % 2000 === 0) {
    console.log(`진행률: ${i}/${SIMULATION_COUNT} (${((i / SIMULATION_COUNT) * 100).toFixed(0)}%)...`);
  }
}

const elapsedMs = Date.now() - startTime;
const avgMsPerRun = (elapsedMs / SIMULATION_COUNT).toFixed(3);

console.log("\n--- 시뮬레이션 결과 리포트 ---");
console.log(`총 시뮬레이션 횟수: ${SIMULATION_COUNT} 회`);
console.log(`전체 소요 시간: ${elapsedMs} ms (평균 시드당 ${avgMsPerRun} ms)`);
console.log(`안전 템플릿 강하 횟수 (fallbackCount): ${fallbackCount} 회`);
console.log(`평균 재시작 횟수: ${(totalRestarts / SIMULATION_COUNT).toFixed(2)} 회`);
console.log(`평균 백트래킹 횟수: ${(totalBacktracks / SIMULATION_COUNT).toFixed(2)} 회`);

console.log("\n[유닛 등장 빈도 통계]");
console.table(unitFrequencies);

console.log("\n[영웅 등장 빈도 통계]");
console.table(heroFrequencies);

// 합격 기준 검증
assert.ok(
  fallbackCount < 10,
  `안전 템플릿 강하 비율이 0.1% 미만이어야 함 (실제 강하: ${fallbackCount}/${SIMULATION_COUNT})`
);

console.log("\n=== 5. Fallback 템플릿 제약 검증 ===");
const fallbackEncounters = generator.getFallbackTemplateEncounters(9999);
assert.strictEqual(generator.validateEncountersArray(fallbackEncounters), true, "Fallback 템플릿도 모든 제약 조건을 100% 통과해야 함");
console.log("Pass: Fallback 템플릿의 전열, 직출 금지, 비용, 등급, 테마 다양성, 보스 앵커 검증 성공.");

console.log("\n✅ 모든 단위, 규칙, 10,000회 대량 시뮬레이션 테스트가 통과하였습니다!");
