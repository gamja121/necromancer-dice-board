/**
 * test_map_generator.js
 * map-generator.js 10,000개 시드 자동 검증 테스트 (15층, 10전투, 5비전투, 선택지 다양성 >=85%)
 */

const { generateStageMap, isValidFloorSequence, validateStageMap } = require('./map-generator.js');

console.log("=== [START] map-generator.js 10,000 Seeds Automated Verification Test (15 Floors & Node Diversity) ===");

const TEST_SEEDS = 10000;
let totalPassed = 0;
let totalBranchesChecked = 0;
let totalDiverseBranches = 0;
let totalPathsChecked = 0;
let fallbackCount = 0;
let errors = [];

const startTime = Date.now();

for (let s = 1; s <= TEST_SEEDS; s++) {
  try {
    for (let stageIndex = 0; stageIndex < 3; stageIndex++) {
      const map = generateStageMap({ runSeed: s, stageIndex: stageIndex, floors: 15 });
      if (map.usedFallback) fallbackCount++;

      if (!validateStageMap(map)) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Public map validator rejected generated map`);
      }

      if (!map || !Array.isArray(map.nodes) || map.nodes.length < 30) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Invalid node count (${map?.nodes?.length})`);
      }

      // 1. 정확히 15층인지 확인
      if (map.floors !== 15) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Floors count is ${map.floors} (expected 15)`);
      }

      const nodeMap = new Map();
      map.nodes.forEach(n => nodeMap.set(n.id, n));

      // 2. 1층 노드가 모두 battle(normal)인지 검증
      const floor1 = map.nodes.filter(n => n.floor === 1);
      if (floor1.length === 0 || !floor1.every(n => n.type === 'battle' && n.encounterKind === 'normal')) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Floor 1 is not 100% normal battle`);
      }

      // 3. 15층 노드가 1개이고 boss인지 검증
      const floor15 = map.nodes.filter(n => n.floor === 15);
      if (floor15.length !== 1 || floor15[0].type !== 'boss' || floor15[0].encounterKind !== 'boss') {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Floor 15 is not single boss node`);
      }

      // 4. 상점(shop) 노드 0건 검증
      const shopCount = map.nodes.filter(n => n.type === 'shop').length;
      if (shopCount > 0) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Found ${shopCount} shop nodes (must be 0)`);
      }

      // 5. 고립 노드 및 막다른 길 0개 검증
      for (const node of map.nodes) {
        if (node.floor < 15 && node.next.length === 0) {
          throw new Error(`Seed ${s} Stage ${stageIndex}: Node ${node.id} is a dead end`);
        }
        if (node.floor > 1) {
          const hasIncoming = map.nodes.some(p => p.next.includes(node.id));
          if (!hasIncoming) {
            throw new Error(`Seed ${s} Stage ${stageIndex}: Node ${node.id} is isolated (no incoming edge)`);
          }
        }
      }

      // 6. DFS 경로 탐색: 모든 경로가 정확히 15층이고 10전투 (일반 7, 정예 2, 보스 1) + 5비전투 (사건 2, 휴식 2, 보물 1) 인지 검증
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

          const meaningfulChoices = pathNodes.slice(0, -1).filter(node => {
            const childTypes = new Set(node.next.map(id => nodeMap.get(id)?.type));
            return childTypes.size >= 2;
          }).length;
          totalPathsChecked++;
          if (meaningfulChoices < 4) {
            throw new Error(`Seed ${s} Stage ${stageIndex}: Path has only ${meaningfulChoices} meaningful choices (expected >= 4)`);
          }
        }
      }

      // 7. 분기 선택 다양성 (2~12층) 85% 이상 검증 및 강제 이유 기록 검증
      let branchCount = 0;
      let diverseCount = 0;

      const meaningfulFloors = new Set();
      map.nodes.filter(n => n.floor >= 2 && n.floor <= 12 && n.next.length >= 2).forEach(n => {
        branchCount++;
        totalBranchesChecked++;
        const childTypes = new Set(n.next.map(id => nodeMap.get(id).type));
        if (childTypes.size >= 2) {
          diverseCount++;
          totalDiverseBranches++;
          meaningfulFloors.add(n.floor);
        } else {
          throw new Error(`Seed ${s} Stage ${stageIndex}: Branch node ${n.id} offers duplicate node types only`);
        }
      });

      if (branchCount < 12 || meaningfulFloors.size < 4) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Insufficient branch density (${branchCount} nodes across ${meaningfulFloors.size} floors)`);
      }

      if (!Array.isArray(map.decisionFloors) || map.decisionFloors.length < 4) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: decisionFloors metadata is incomplete`);
      }

      const divRatio = diverseCount / branchCount;
      if (divRatio < 0.85) {
        throw new Error(`Seed ${s} Stage ${stageIndex}: Diversity ratio is ${(divRatio * 100).toFixed(1)}% (expected >= 85%)`);
      }

      // 8. 동일 시드 결정성 검증
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
const overallDivPct = totalBranchesChecked > 0 ? ((totalDiverseBranches / totalBranchesChecked) * 100).toFixed(1) : "100.0";
const fallbackPct = ((fallbackCount / (TEST_SEEDS * 3)) * 100).toFixed(3);

console.log(`\n=== Verification Complete in ${elapsed}ms ===`);
console.log(`Passed: ${totalPassed} / ${TEST_SEEDS} seeds (30,000 stage maps tested)`);
console.log(`Overall Branch Diversity: ${overallDivPct}% (Target: >= 85.0%)`);
console.log(`Complete Paths Checked: ${totalPathsChecked}`);
console.log(`Fallback Maps: ${fallbackCount} (${fallbackPct}%)`);

if (errors.length > 0) {
  console.error("Errors found:", errors);
  process.exit(1);
} else {
  if (Number(fallbackPct) > 1) {
    console.error(`Fallback rate ${fallbackPct}% exceeds the 1% limit`);
    process.exit(1);
  }
  console.log("SUCCESS: All 10,000 seeds passed all 12 structural, reachability, 10-battle/5-non-battle, and choice diversity constraints!");
  process.exit(0);
}
