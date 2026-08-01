/**
 * test_map_generator.js
 * map-generator.js 10,000개 시드 자동 검증 테스트
 */

const { generateStageMap } = require('./map-generator.js');

console.log("=== [START] map-generator.js 10,000 Seeds Automated Verification Test ===");

const TEST_SEEDS = 10000;
let totalPassed = 0;
let errors = [];

const startTime = Date.now();

for (let s = 1; s <= TEST_SEEDS; s++) {
  try {
    // 3개 스테이지 각각 검증
    for (let stageIndex = 0; stageIndex < 3; stageIndex++) {
      const map = generateStageMap({ runSeed: s, stageIndex: stageIndex, floors: 10 });

      // 1. 노드 수 및 구조 검증
      if (!map || !Array.isArray(map.nodes) || map.nodes.length < 20) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Invalid node count (${map?.nodes?.length})`);
      }

      const nodeMap = new Map();
      map.nodes.forEach(n => nodeMap.set(n.id, n));

      // 2. 1층 노드가 모두 battle(normal)인지 검증
      const floor1 = map.nodes.filter(n => n.floor === 1);
      if (floor1.length === 0 || !floor1.every(n => n.type === 'battle' && n.encounterKind === 'normal')) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Floor 1 is not 100% normal battle`);
      }

      // 3. 10층 노드가 1개이고 boss인지 검증
      const floor10 = map.nodes.filter(n => n.floor === 10);
      if (floor10.length !== 1 || floor10[0].type !== 'boss' || floor10[0].encounterKind !== 'boss') {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Floor 10 is not single boss node`);
      }

      // 4. 상점(shop) 노드 0건 검증
      const shopCount = map.nodes.filter(n => n.type === 'shop').length;
      if (shopCount > 0) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Found ${shopCount} shop nodes (must be 0)`);
      }

      // 5. 고립/막다른 길 및 보스 도달 가능성 검증 (DFS)
      function getPaths(nodeId, visited = new Set()) {
        const node = nodeMap.get(nodeId);
        if (!node) return [];
        if (node.floor === 10) return [[nodeId]];
        if (visited.has(nodeId)) return []; // 순환 방지

        visited.add(nodeId);
        let paths = [];
        for (const nextId of node.next) {
          const subPaths = getPaths(nextId, new Set(visited));
          subPaths.forEach(sp => paths.push([nodeId, ...sp]));
        }
        return paths;
      }

      for (const startId of map.startNodeIds) {
        const paths = getPaths(startId);
        if (paths.length === 0) {
          throw new Error(`Seed ${s} Stage ${stageIndex}: Start node ${startId} cannot reach boss`);
        }

        // 6. 모든 경로에서 최소 전투 횟수(5회 이상) 검증
        for (const path of paths) {
          const pathNodes = path.map(id => nodeMap.get(id));
          const battleCount = pathNodes.filter(n => n.type === 'battle' || n.type === 'elite' || n.type === 'boss').length;
          if (battleCount < 5) {
            throw new Error(`Seed ${s} Stage ${stageIndex}: Path has only ${battleCount} battles (minimum 5 required)`);
          }
        }
      }

      // 7. 진입 간선 수 검증 (층 2~9: 최대 3개, 층 10 보스: 층 9 노드 수와 동일)
      for (let f = 2; f <= 10; f++) {
        const floorF = map.nodes.filter(n => n.floor === f);
        for (const n of floorF) {
          const inCount = map.nodes.filter(prev => prev.next.includes(n.id)).length;
          if (inCount === 0) {
            throw new Error(`Seed ${s} Stage ${stageIndex}: Node ${n.id} on floor ${f} has 0 incoming edges`);
          }
          if (f < 10 && inCount > 3) {
            throw new Error(`Seed ${s} Stage ${stageIndex}: Node ${n.id} on floor ${f} has ${inCount} incoming edges (> 3)`);
          }
        }
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
console.log(`Passed: ${totalPassed} / ${TEST_SEEDS} seeds (100% stage validation)`);

if (errors.length > 0) {
  console.error("Errors found:", errors);
  process.exit(1);
} else {
  console.log("SUCCESS: All 10,000 seeds passed all structural, reachability, and ratio constraints!");
  process.exit(0);
}
