/**
 * test_map_generator.js
 * map-generator.js 10,000개 시드 자동 검증 테스트 (15층, 10전투, 5비전투)
 */

const { generateStageMap, isValidFloorSequence } = require('./map-generator.js');

console.log("=== [START] map-generator.js 10,000 Seeds Automated Verification Test (15 Floors) ===");

const TEST_SEEDS = 10000;
let totalPassed = 0;
let errors = [];

const startTime = Date.now();

for (let s = 1; s <= TEST_SEEDS; s++) {
  try {
    for (let stageIndex = 0; stageIndex < 3; stageIndex++) {
      const map = generateStageMap({ runSeed: s, stageIndex: stageIndex, floors: 15 });

      if (!map || !Array.isArray(map.nodes) || map.nodes.length < 30) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Invalid node count (${map?.nodes?.length})`);
      }

      const nodeMap = new Map();
      map.nodes.forEach(n => nodeMap.set(n.id, n));

      // 1. 1층 노드가 모두 battle(normal)인지 검증
      const floor1 = map.nodes.filter(n => n.floor === 1);
      if (floor1.length === 0 || !floor1.every(n => n.type === 'battle' && n.encounterKind === 'normal')) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Floor 1 is not 100% normal battle`);
      }

      // 2. 15층 노드가 1개이고 boss인지 검증
      const floor15 = map.nodes.filter(n => n.floor === 15);
      if (floor15.length !== 1 || floor15[0].type !== 'boss' || floor15[0].encounterKind !== 'boss') {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Floor 15 is not single boss node`);
      }

      // 3. 상점(shop) 노드 0건 검증
      const shopCount = map.nodes.filter(n => n.type === 'shop').length;
      if (shopCount > 0) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Found ${shopCount} shop nodes (must be 0)`);
      }

      // 4. DFS 경로 탐색: 모든 경로가 정확히 15층이고 10전투 (일반 7, 정예 2, 보스 1) + 5비전투 (사건 2, 휴식 2, 보물 1) 인지 검증
      function getPaths(nodeId, visited = new Set()) {
        const node = nodeMap.get(nodeId);
        if (!node) return [];
        if (node.floor === 15) return [[nodeId]];
        if (visited.has(nodeId)) return [];

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

        for (const path of paths) {
          if (path.length !== 15) {
            throw new Error(`Seed ${s} Stage ${stageIndex}: Path length is ${path.length} (expected 15)`);
          }

          const pathNodes = path.map(id => nodeMap.get(id));
          const seq = pathNodes.map(n => n.type);

          if (!isValidFloorSequence(seq)) {
            throw new Error(`Seed ${s} Stage ${stageIndex}: Invalid floor sequence [${seq.join(',')}]`);
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
  console.log("SUCCESS: All 10,000 seeds passed all structural, reachability, and 10-battle / 5-non-battle constraints!");
  process.exit(0);
}
