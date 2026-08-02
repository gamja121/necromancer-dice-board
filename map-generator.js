/**
 * map-generator.js
 * Seeded 15-floor expedition map generator shared by browser and Node.js.
 */

(function (exports) {
  "use strict";

  const MAP_VERSION = 3;
  const TARGET_DECISIONS = 4;
  const MIDDLE_TYPES = [
    "battle", "battle", "battle", "battle", "battle", "battle",
    "elite", "elite", "event", "event", "rest", "rest", "treasure"
  ];

  // A deterministic fallback with four independent, mutually compatible swaps.
  const FALLBACK_SEQUENCE = [
    "battle", "event", "battle", "battle", "treasure", "battle", "rest",
    "elite", "battle", "event", "battle", "elite", "rest", "battle", "boss"
  ];
  const FALLBACK_SWAPS = [3, 7, 10, 12];

  const SAFE_TEMPLATES = [FALLBACK_SEQUENCE];

  function createPrng(seed) {
    let s = (seed ^ 0xDEADBEEF) >>> 0;
    return function random() {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomInt(rng, min, max) {
    return min + Math.floor(rng() * (max - min + 1));
  }

  function shuffle(array, rng) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function isNonBattle(type) {
    return type === "event" || type === "rest" || type === "treasure";
  }

  function isValidFloorSequence(seq) {
    if (!Array.isArray(seq) || seq.length !== 15) return false;
    if (seq[0] !== "battle" || seq[14] !== "boss") return false;

    // Floors 2-5 cannot contain elites or bosses.
    for (let i = 1; i <= 4; i++) {
      if (seq[i] === "elite" || seq[i] === "boss") return false;
    }

    // Floor 14 is a final rest-or-battle decision before the boss.
    if (seq[13] !== "rest" && seq[13] !== "battle") return false;

    let normalCount = 0;
    let eliteCount = 0;
    let bossCount = 0;
    let eventCount = 0;
    let restCount = 0;
    let treasureCount = 0;

    for (let i = 0; i < seq.length; i++) {
      const type = seq[i];
      if (type === "battle") normalCount++;
      else if (type === "elite") eliteCount++;
      else if (type === "boss") bossCount++;
      else if (type === "event") eventCount++;
      else if (type === "rest") restCount++;
      else if (type === "treasure") treasureCount++;
      else return false;

      if (i > 0 && type === "elite" && seq[i - 1] === "elite") return false;
      if (i > 0 && isNonBattle(type) && isNonBattle(seq[i - 1])) return false;
    }

    return normalCount === 7 && eliteCount === 2 && bossCount === 1
      && eventCount === 2 && restCount === 2 && treasureCount === 1;
  }

  function swapPair(sequence, index) {
    const result = [...sequence];
    [result[index], result[index + 1]] = [result[index + 1], result[index]];
    return result;
  }

  function applySwapMask(sequence, swapIndexes, mask) {
    let result = [...sequence];
    for (let i = 0; i < swapIndexes.length; i++) {
      if ((mask & (1 << i)) !== 0) result = swapPair(result, swapIndexes[i]);
    }
    return result;
  }

  function allSwapCombinationsAreValid(sequence, swapIndexes) {
    const combinationCount = 1 << swapIndexes.length;
    for (let mask = 1; mask < combinationCount; mask++) {
      if (!isValidFloorSequence(applySwapMask(sequence, swapIndexes, mask))) return false;
    }
    return true;
  }

  function findCompatibleSwapSet(sequence, targetCount, rng) {
    const candidates = [];
    // Index equals the parent floor where the meaningful choice is presented.
    for (let index = 2; index <= 12; index++) {
      if (sequence[index] === sequence[index + 1]) continue;
      if (isValidFloorSequence(swapPair(sequence, index))) candidates.push(index);
    }

    const ordered = rng ? shuffle(candidates, rng) : candidates;
    let result = null;

    function search(start, selected) {
      if (result) return;
      if (selected.length === targetCount) {
        if (allSwapCombinationsAreValid(sequence, selected)) result = [...selected].sort((a, b) => a - b);
        return;
      }

      for (let i = start; i < ordered.length; i++) {
        const index = ordered[i];
        if (selected.some(existing => Math.abs(existing - index) <= 1)) continue;
        search(i + 1, [...selected, index]);
        if (result) return;
      }
    }

    search(0, []);
    return result;
  }

  function pickRouteBlueprint(rng) {
    // Sampling valid sequences on demand keeps startup memory effectively flat.
    for (let attempt = 1; attempt <= 2400; attempt++) {
      const sequence = ["battle", ...shuffle(MIDDLE_TYPES, rng), "boss"];
      if (!isValidFloorSequence(sequence)) continue;
      const swapIndexes = findCompatibleSwapSet(sequence, TARGET_DECISIONS, rng);
      if (swapIndexes) return { sequence, swapIndexes, attempts: attempt, fallback: false };
    }

    return {
      sequence: [...FALLBACK_SEQUENCE],
      swapIndexes: [...FALLBACK_SWAPS],
      attempts: 2400,
      fallback: true
    };
  }

  function choiceLanesFor(lane, laneCount) {
    if (laneCount === 3) {
      if (lane === 0) return [0, 1];
      if (lane === 1) return [0, 1];
      return [1, 2];
    }

    return lane < 2 ? [0, 1] : [2, 3];
  }

  function connectFirstFloor(currentFloor, nextFloor) {
    nextFloor.forEach((nextNode, index) => {
      const parentIndex = Math.min(
        currentFloor.length - 1,
        Math.floor(index * currentFloor.length / nextFloor.length)
      );
      currentFloor[parentIndex].next.push(nextNode.id);
    });
  }

  function generateStageMap(options = {}) {
    const {
      runSeed = 0,
      stageIndex = 0,
      floors = 15,
      minLanes = 3,
      maxLanes = 4
    } = options;

    if (floors !== 15) throw new Error("The expedition map currently requires exactly 15 floors.");

    const combinedSeed = (Math.abs(runSeed) * 1000003 + (stageIndex + 1) * 7919) >>> 0;
    const rng = createPrng(combinedSeed);
    const blueprint = pickRouteBlueprint(rng);
    const swappedSequence = applySwapMask(
      blueprint.sequence,
      blueprint.swapIndexes,
      (1 << blueprint.swapIndexes.length) - 1
    );
    const decisionFloors = new Set(blueprint.swapIndexes);
    const routeLaneCount = Math.max(3, Math.min(4, Math.max(minLanes, maxLanes)));
    const stageIdPrefix = `s${stageIndex + 1}`;
    const floorNodes = {};

    for (let floor = 1; floor <= floors; floor++) {
      const laneCount = floor === 1
        ? randomInt(rng, 2, 3)
        : (floor === floors ? 1 : routeLaneCount);
      const y = parseFloat((0.94 - ((floor - 1) / (floors - 1)) * 0.88).toFixed(3));
      floorNodes[floor] = [];

      for (let lane = 0; lane < laneCount; lane++) {
        const laneRatio = laneCount === 1 ? 0.5 : (lane + 0.5) / laneCount;
        const xOffset = laneCount === 1 ? 0 : (rng() - 0.5) * 0.035;
        const x = parseFloat(Math.min(0.92, Math.max(0.08, laneRatio + xOffset)).toFixed(3));
        const routeSequence = lane % 2 === 0 ? blueprint.sequence : swappedSequence;
        const type = routeSequence[floor - 1];
        const id = floor === floors
          ? `${stageIdPrefix}-f${floor}-boss`
          : `${stageIdPrefix}-f${floor}-n${lane}`;

        floorNodes[floor].push({
          id,
          floor,
          lane,
          type,
          encounterKind: type === "elite" ? "elite" : (type === "boss" ? "boss" : "normal"),
          x,
          y,
          next: []
        });
      }
    }

    for (let floor = 1; floor < floors; floor++) {
      const currentFloor = floorNodes[floor];
      const nextFloor = floorNodes[floor + 1];

      if (floor + 1 === floors) {
        currentFloor.forEach(node => node.next.push(nextFloor[0].id));
        continue;
      }

      if (floor === 1) {
        connectFirstFloor(currentFloor, nextFloor);
        continue;
      }

      if (decisionFloors.has(floor)) {
        currentFloor.forEach(node => {
          const laneChoices = choiceLanesFor(node.lane, nextFloor.length);
          laneChoices.forEach(lane => node.next.push(nextFloor[lane].id));
        });
        continue;
      }

      // The second half of a choice pair is intentionally forced so both
      // alternatives consume the same final type budget before the next fork.
      currentFloor.forEach(node => {
        const nextLane = Math.min(node.lane, nextFloor.length - 1);
        node.next.push(nextFloor[nextLane].id);
      });
    }

    const nodes = [];
    for (let floor = 1; floor <= floors; floor++) nodes.push(...floorNodes[floor]);

    return {
      version: MAP_VERSION,
      stageIndex,
      floors,
      nodes,
      startNodeIds: floorNodes[1].map(node => node.id),
      bossNodeId: floorNodes[floors][0].id,
      decisionFloors: [...blueprint.swapIndexes],
      generationAttempts: blueprint.attempts,
      usedFallback: blueprint.fallback
    };
  }

  function validateStageMap(map, options = {}) {
    const requireDecisionDiversity = options.requireDecisionDiversity !== false
      && Number(map && map.version) >= MAP_VERSION;
    if (!map || typeof map !== "object" || map.floors !== 15) return false;
    if (!Number.isInteger(map.stageIndex) || map.stageIndex < 0 || map.stageIndex > 2) return false;
    if (!Array.isArray(map.nodes) || !Array.isArray(map.startNodeIds)) return false;
    if (typeof map.bossNodeId !== "string" || map.startNodeIds.length < 1) return false;

    const allowedTypes = new Set(["battle", "elite", "event", "rest", "treasure", "boss"]);
    const byId = new Map();
    const byFloor = new Map();

    for (const node of map.nodes) {
      if (!node || typeof node.id !== "string" || byId.has(node.id)) return false;
      if (!Number.isInteger(node.floor) || node.floor < 1 || node.floor > map.floors) return false;
      if (!allowedTypes.has(node.type) || !Array.isArray(node.next)) return false;
      if (!Number.isFinite(node.x) || node.x < 0 || node.x > 1) return false;
      if (!Number.isFinite(node.y) || node.y < 0 || node.y > 1) return false;
      if (new Set(node.next).size !== node.next.length || node.next.length > 3) return false;
      byId.set(node.id, node);
      if (!byFloor.has(node.floor)) byFloor.set(node.floor, []);
      byFloor.get(node.floor).push(node);
    }

    for (let floor = 1; floor <= map.floors; floor++) {
      if (!byFloor.has(floor) || byFloor.get(floor).length === 0) return false;
    }

    const boss = byId.get(map.bossNodeId);
    if (!boss || boss.floor !== map.floors || boss.type !== "boss" || boss.next.length !== 0) return false;
    if (byFloor.get(map.floors).length !== 1) return false;
    if (!map.startNodeIds.every(id => byId.has(id) && byId.get(id).floor === 1)) return false;
    if (new Set(map.startNodeIds).size !== map.startNodeIds.length) return false;

    const incoming = new Map(map.nodes.map(node => [node.id, 0]));
    for (const node of map.nodes) {
      if (node.floor === map.floors && node.next.length !== 0) return false;
      if (node.floor < map.floors && (node.next.length < 1 || node.next.length > 2)) return false;
      for (const nextId of node.next) {
        const nextNode = byId.get(nextId);
        if (!nextNode || nextNode.floor !== node.floor + 1) return false;
        incoming.set(nextId, incoming.get(nextId) + 1);
      }
    }
    for (const node of map.nodes) {
      if (node.floor > 1 && incoming.get(node.id) === 0) return false;
    }

    const reached = new Set();
    const stack = [...map.startNodeIds];
    while (stack.length) {
      const id = stack.pop();
      if (reached.has(id)) continue;
      reached.add(id);
      byId.get(id).next.forEach(nextId => stack.push(nextId));
    }
    if (reached.size !== map.nodes.length || !reached.has(map.bossNodeId)) return false;

    let pathCount = 0;
    const walk = (node, sequence, meaningfulChoices) => {
      const nextSequence = [...sequence, node.type];
      if (node.id === map.bossNodeId) {
        pathCount++;
        return isValidFloorSequence(nextSequence)
          && (!requireDecisionDiversity || meaningfulChoices >= TARGET_DECISIONS);
      }
      const childTypes = new Set(node.next.map(id => byId.get(id).type));
      const nextMeaningfulChoices = meaningfulChoices + (childTypes.size >= 2 ? 1 : 0);
      return node.next.every(id => walk(byId.get(id), nextSequence, nextMeaningfulChoices));
    };

    if (!map.startNodeIds.every(id => walk(byId.get(id), [], 0))) return false;
    return pathCount > 0;
  }

  exports.MAP_VERSION = MAP_VERSION;
  exports.generateStageMap = generateStageMap;
  exports.SAFE_TEMPLATES = SAFE_TEMPLATES;
  exports.isValidFloorSequence = isValidFloorSequence;
  exports.findCompatibleSwapSet = findCompatibleSwapSet;
  exports.validateStageMap = validateStageMap;

})(typeof exports !== "undefined" ? exports : (window.MapGenerator = {}));
