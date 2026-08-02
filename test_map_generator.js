/**
 * test_map_generator.js
 * map-generator.js v4 10,000개 시드 자동 검증 테스트
 * (MAP_VERSION = 4, 15층, 10전투, 5비전투, 층별 타입 중복 0건, 주요 선택층 검증)
 */

const {
  generateStageMap,
  isValidFloorSequence,
  validateNoDuplicateNodeTypesPerFloor,
  validateMajorChoiceFloors,
  validateMeaningfulBranches,
  validatePathComposition
} = require('./map-generator.js');

console.log("=== [START] map-generator.js v4 10,000 Seeds Automated Verification Test ===");

const TEST_SEEDS = 10000;
let totalPassed = 0;
let errors = [];

const startTime = Date.now();

for (let s = 1; s <= TEST_SEEDS; s++) {
  try {
    for (let stageIndex = 0; stageIndex < 3; stageIndex++) {
      const map = generateStageMap({ runSeed: s, stageIndex: stageIndex, floors: 15 });

      if (!map || map.version !== 4) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: MAP_VERSION is not 4`);
      }

      if (map.floors !== 15) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Floors count is ${map.floors}`);
      }

      // 1. 층별 노드 타입 중복 0건 검증
      if (!validateNoDuplicateNodeTypesPerFloor(map)) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Found duplicate node type on a floor`);
      }

      // 2. 주요 선택층 검증
      if (!validateMajorChoiceFloors(map)) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Major choice floor count < 4`);
      }

      // 3. 의미 있는 분기 검증
      if (!validateMeaningfulBranches(map, 1)) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Meaningful branch count < 1`);
      }

      // 4. 경로별 10전투/5비전투 완주 경로 검증
      if (!validatePathComposition(map)) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Invalid path composition or sequence constraint violated`);
      }

      // 5. 상점 노드 0건 검증
      const shopCount = map.nodes.filter(n => n.type === 'shop').length;
      if (shopCount > 0) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Found ${shopCount} shop nodes`);
      }

      // 6. 동일 시드 결정성 검증
      const map2 = generateStageMap({ runSeed: s, stageIndex: stageIndex, floors: 15 });
      if (JSON.stringify(map.nodes) !== JSON.stringify(map2.nodes)) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Determinism check failed`);
      }
    }

    totalPassed++;
  } catch (err) {
    errors.push(err.message);
    if (errors.length >= 5) break;
  }
}

const elapsed = Date.now() - startTime;

console.log(`\n=== Verification Complete in ${elapsed}ms ===`);
console.log(`Passed: ${totalPassed} / ${TEST_SEEDS} seeds (30,000 stage maps tested)`);

if (errors.length > 0) {
  console.error("Errors found:", errors);
  process.exit(1);
} else {
  console.log("SUCCESS: All 10,000 seeds passed MAP_VERSION=4 zero floor duplicate, major choice, and 10-battle/5-non-battle constraints!");
  process.exit(0);
}
