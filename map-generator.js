/**
 * map-generator.js
 * Necromancer Expedition Map Generator v4
 * Browser & Node.js ESM/CommonJS dynamic module
 */

(function (exports) {
  "use strict";

  const MAP_VERSION = 4;

  const PATH_REQUIREMENTS = Object.freeze({
    floors: 15,
    combatCount: 10,       // 7 normal, 2 elite, 1 boss
    normalCount: 7,
    eliteCount: 2,
    bossCount: 1,
    nonCombatCount: 5,     // 2 event, 2 rest, 1 treasure
    eventCount: 2,
    restCount: 2,
    treasureCount: 1,
  });

  const middleTypes = [
    "battle", "battle", "battle", "battle", "battle", "battle",
    "elite", "elite",
    "event", "event",
    "rest", "rest",
    "treasure"
  ];

  function createPrng(seed) {
    let s = (seed ^ 0xDEADBEEF) >>> 0;
    return function random() {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function isValidFloorSequence(sequence) {
    if (!Array.isArray(sequence) || sequence.length !== 15) return false;
    if (sequence[0] !== "battle") return false;
    if (sequence[14] !== "boss") return false;

    let normal = 0, elite = 0, boss = 0;
    let event = 0, rest = 0, treasure = 0;

    for (let i = 0; i < 15; i++) {
      const type = sequence[i];
      if (type === "battle") normal++;
      else if (type === "elite") elite++;
      else if (type === "boss") boss++;
      else if (type === "event") event++;
      else if (type === "rest") rest++;
      else if (type === "treasure") treasure++;
      else return false;
    }

    if (normal !== 7 || elite !== 2 || boss !== 1) return false;
    if (event !== 2 || rest !== 2 || treasure !== 1) return false;

    // Constraint 1: Floors 2..5 (index 1..4) must NOT be elite or boss
    for (let i = 1; i <= 4; i++) {
      if (sequence[i] === "elite" || sequence[i] === "boss") return false;
    }

    // Constraint 2: Floor 14 (index 13) MUST be battle or rest
    if (sequence[13] !== "battle" && sequence[13] !== "rest") return false;

    // Constraint 3: No 3 consecutive battles
    for (let i = 0; i <= 12; i++) {
      if (sequence[i] === "battle" && sequence[i + 1] === "battle" && sequence[i + 2] === "battle") {
        return false;
      }
    }

    // Constraint 4: No 2 consecutive identical non-combat nodes
    for (let i = 0; i <= 13; i++) {
      const t = sequence[i];
      if (t === "event" || t === "rest" || t === "treasure") {
        if (sequence[i + 1] === t) return false;
      }
    }

    return true;
  }

  function permutations(arr) {
    if (arr.length <= 1) return [arr];
    const result = [];
    const used = new Set();
    for (let i = 0; i < arr.length; i++) {
      if (used.has(arr[i])) continue;
      used.add(arr[i]);
      const rest = arr.slice(0, i).concat(arr.slice(i + 1));
      for (const p of permutations(rest)) {
        result.push([arr[i], ...p]);
      }
    }
    return result;
  }

  const ALL_VALID_SEQS = Object.freeze(
    permutations(middleTypes)
      .map(m => ["battle", ...m, "boss"])
      .filter(seq => isValidFloorSequence(seq))
  );

  const PERFECT_TEMPLATES = Object.freeze((function buildTemplates() {
    const templates = [];
    const choiceFloors = [2, 5, 8, 11];
    for (const seq of ALL_VALID_SEQS) {
      const pools = choiceFloors.map(cF => {
        const mainType = seq[cF - 1];
        const alts = [mainType];
        const available = ["battle", "elite", "event", "rest", "treasure"].filter(t => t !== mainType);
        for (const t of available) {
          if (cF <= 5 && t === "elite") continue;
          if (cF === 14 && (t !== "battle" && t !== "rest")) continue;
          alts.push(t);
        }
        return alts;
      });

      for (const alt1 of pools[0].slice(1)) {
        for (const alt2 of pools[1].slice(1)) {
          for (const alt3 of pools[2].slice(1)) {
            for (const alt4 of pools[3].slice(1)) {
              const options = [
                [seq[1], alt1],
                [seq[4], alt2],
                [seq[7], alt3],
                [seq[10], alt4]
              ];

              let ok = true;
              for (const o1 of options[0]) {
                for (const o2 of options[1]) {
                  for (const o3 of options[2]) {
                    for (const o4 of options[3]) {
                      const ts = [...seq]; ts[1] = o1; ts[4] = o2; ts[7] = o3; ts[10] = o4;
                      if (!isValidFloorSequence(ts)) { ok = false; break; }
                    }
                    if (!ok) break;
                  }
                  if (!ok) break;
                }
                if (!ok) break;
              }
              if (ok) {
                templates.push({
                  mainSeq: seq,
                  choices: { 2: [seq[1], alt1], 5: [seq[4], alt2], 8: [seq[7], alt3], 11: [seq[10], alt4] }
                });
                if (templates.length >= 100) return templates;
              }
            }
          }
        }
      }
    }
    return templates;
  })());

  function minMax(min, max, val) {
    return Math.min(max, Math.max(min, val));
  }

  function generateStageMap(options = {}) {
    const {
      runSeed = 0,
      stageIndex = 0,
      floors = 15
    } = options;

    const combinedSeed = (Math.abs(runSeed) * 1000003 + (stageIndex + 1) * 7919) >>> 0;
    const rng = createPrng(combinedSeed);

    const tIdx = Math.floor(rng() * PERFECT_TEMPLATES.length);
    const tmpl = PERFECT_TEMPLATES[tIdx];

    const mainSeq = tmpl.mainSeq;
    const choices = tmpl.choices;

    const stageIdPrefix = `s${stageIndex + 1}`;
    const floorNodes = {};
    const choiceFloors = [2, 5, 8, 11];

    for (let f = 1; f <= floors; f++) {
      floorNodes[f] = [];
      const y = parseFloat((0.94 - ((f - 1) / (floors - 1)) * 0.88).toFixed(3));

      let fTypes = [mainSeq[f - 1]];

      if (choiceFloors.includes(f)) {
        fTypes = [...choices[f]];
      } else if (f > 1 && f < floors) {
        const pool = ["battle", "elite", "event", "rest", "treasure"];
        for (const t of pool) {
          if (!fTypes.includes(t)) {
            if (f >= 2 && f <= 5 && t === "elite") continue;
            if (f === 14 && (t !== "battle" && t !== "rest")) continue;
            fTypes.push(t);
            if (fTypes.length === 3) break;
          }
        }
      }

      const laneCount = (f === 1 || f === floors) ? 1 : fTypes.length;

      for (let l = 0; l < laneCount; l++) {
        const type = fTypes[l];
        const nodeId = f === floors
          ? `${stageIdPrefix}-f${f}-boss`
          : `${stageIdPrefix}-f${f}-n${l}`;

        floorNodes[f].push({
          id: nodeId,
          floor: f,
          lane: l,
          type: type,
          encounterKind: type === "elite" ? "elite" : (type === "boss" ? "boss" : "normal"),
          x: laneCount === 1 ? 0.5 : parseFloat(minMax(0.08, 0.92, (l + 0.5) / laneCount + (rng() - 0.5) * 0.04).toFixed(3)),
          y: y,
          next: []
        });
      }
    }

    // Floor 1 -> Floor 2 (both choice nodes)
    floorNodes[1][0].next.push(floorNodes[2][0].id);
    floorNodes[1][0].next.push(floorNodes[2][1].id);

    // Floor 2 (choice nodes) -> Floor 3 (node 0) -> Floor 4 (node 0) -> Floor 5 (choice nodes)
    floorNodes[2][0].next.push(floorNodes[3][0].id);
    floorNodes[2][1].next.push(floorNodes[3][0].id);

    floorNodes[3][0].next.push(floorNodes[4][0].id);

    floorNodes[4][0].next.push(floorNodes[5][0].id);
    floorNodes[4][0].next.push(floorNodes[5][1].id);

    // Floor 5 (choice nodes) -> Floor 6 (node 0) -> Floor 7 (node 0) -> Floor 8 (choice nodes)
    floorNodes[5][0].next.push(floorNodes[6][0].id);
    floorNodes[5][1].next.push(floorNodes[6][0].id);

    floorNodes[6][0].next.push(floorNodes[7][0].id);

    floorNodes[7][0].next.push(floorNodes[8][0].id);
    floorNodes[7][0].next.push(floorNodes[8][1].id);

    // Floor 8 (choice nodes) -> Floor 9 (node 0) -> Floor 10 (node 0) -> Floor 11 (choice nodes)
    floorNodes[8][0].next.push(floorNodes[9][0].id);
    floorNodes[8][1].next.push(floorNodes[9][0].id);

    floorNodes[9][0].next.push(floorNodes[10][0].id);

    floorNodes[10][0].next.push(floorNodes[11][0].id);
    floorNodes[10][0].next.push(floorNodes[11][1].id);

    // Floor 11 (choice nodes) -> Floor 12 -> Floor 13 -> Floor 14 -> Floor 15 (boss)
    floorNodes[11][0].next.push(floorNodes[12][0].id);
    floorNodes[11][1].next.push(floorNodes[12][0].id);

    floorNodes[12][0].next.push(floorNodes[13][0].id);
    floorNodes[13][0].next.push(floorNodes[14][0].id);
    floorNodes[14][0].next.push(floorNodes[15][0].id);

    const allNodesList = [];
    Object.values(floorNodes).forEach(fnList => {
      fnList.forEach(n => allNodesList.push({ ...n }));
    });

    return {
      version: MAP_VERSION,
      stageIndex,
      floors,
      decisionFloors: [2, 5, 8, 11],
      nodes: allNodesList,
      startNodeIds: floorNodes[1].map(n => n.id),
      bossNodeId: floorNodes[floors][0].id
    };
  }

  function validateStageMap(map) {
    if (!map || map.version !== MAP_VERSION || !Array.isArray(map.nodes)) return false;
    if (!validateNoDuplicateNodeTypesPerFloor(map)) return false;
    if (!validateMajorChoiceFloors(map)) return false;
    if (!validateMeaningfulBranches(map, 1)) return false;
    if (!validatePathComposition(map)) return false;
    return true;
  }

  function validateNoDuplicateNodeTypesPerFloor(map) {
    if (!map || !Array.isArray(map.nodes)) return false;
    const floorTypesMap = {};
    map.nodes.forEach(n => {
      if (!floorTypesMap[n.floor]) floorTypesMap[n.floor] = [];
      floorTypesMap[n.floor].push(n.type);
    });
    for (const f in floorTypesMap) {
      const types = floorTypesMap[f];
      if (new Set(types).size !== types.length) return false;
    }
    return true;
  }

  function validateMajorChoiceFloors(map) {
    if (!map || !Array.isArray(map.nodes)) return false;
    const choiceFloors = [2, 5, 8, 11];
    for (const cF of choiceFloors) {
      const fNodes = map.nodes.filter(n => n.floor === cF);
      if (fNodes.length < 2) return false;
    }
    return true;
  }

  function validateMeaningfulBranches(map, minCount = 1) {
    if (!map || !Array.isArray(map.nodes)) return false;
    const nodeMap = new Map(map.nodes.map(n => [n.id, n]));
    let branchCount = 0;
    map.nodes.forEach(n => {
      if (n.next && n.next.length >= 2) {
        const childTypes = new Set(n.next.map(id => nodeMap.get(id)?.type));
        if (childTypes.size >= 2) branchCount++;
      }
    });
    return branchCount >= minCount;
  }

  function validatePathComposition(map) {
    if (!map || !Array.isArray(map.nodes)) return false;
    const nodeMap = new Map(map.nodes.map(n => [n.id, n]));

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

    const startNodeId = map.startNodeIds ? map.startNodeIds[0] : map.nodes.find(n => n.floor === 1)?.id;
    if (!startNodeId) return false;

    const allPaths = getPaths(startNodeId);
    if (allPaths.length === 0) return false;

    for (const path of allPaths) {
      const seq = path.map(id => nodeMap.get(id).type);
      if (!isValidFloorSequence(seq)) return false;
    }

    return true;
  }

  exports.MAP_VERSION = MAP_VERSION;
  exports.PATH_REQUIREMENTS = PATH_REQUIREMENTS;
  exports.ALL_VALID_SEQS = ALL_VALID_SEQS;
  exports.PERFECT_TEMPLATES = PERFECT_TEMPLATES;
  exports.isValidFloorSequence = isValidFloorSequence;
  exports.generateStageMap = generateStageMap;
  exports.validateStageMap = validateStageMap;
  exports.validateNoDuplicateNodeTypesPerFloor = validateNoDuplicateNodeTypesPerFloor;
  exports.validateMajorChoiceFloors = validateMajorChoiceFloors;
  exports.validateMeaningfulBranches = validateMeaningfulBranches;
  exports.validatePathComposition = validatePathComposition;

})(typeof exports !== "undefined" ? exports : (window.MapGenerator = {}));
