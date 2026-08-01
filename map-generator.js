/**
 * map-generator.js
 * Slay the Spire 스타일의 시드 기반 3스테이지 분기 원정 지도 생성 모듈 (스테이지당 15층)
 * DOM 의존성 없음 (Node.js & 브라우저 공용)
 */

(function (exports) {
  "use strict";

  /**
   * Mulberry32 결정론적 의수 난수 생성기 (PRNG)
   */
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
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const SAFE_TEMPLATES = [
    // 15층: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    // 7 normal battle, 2 elite, 1 boss, 2 event, 2 rest, 1 treasure
    [
      "battle", "event", "battle", "treasure", "battle", "rest", "battle",
      "elite", "event", "battle", "elite", "battle", "rest", "battle", "boss"
    ],
    [
      "battle", "battle", "event", "battle", "treasure", "battle", "rest",
      "elite", "battle", "event", "battle", "elite", "battle", "rest", "boss"
    ],
    [
      "battle", "treasure", "battle", "event", "battle", "rest", "battle",
      "elite", "battle", "event", "elite", "battle", "rest", "battle", "boss"
    ]
  ];

  function isNonBattle(type) {
    return type === "event" || type === "rest" || type === "treasure";
  }

  function isValidFloorSequence(seq) {
    if (!Array.isArray(seq) || seq.length !== 15) return false;
    if (seq[0] !== "battle") return false;
    if (seq[14] !== "boss") return false;

    // 2~5층 (인덱스 1~4) 정예 및 보스 금지
    for (let i = 1; i <= 4; i++) {
      if (seq[i] === "elite" || seq[i] === "boss") return false;
    }

    // 14층 (인덱스 13) 휴식 또는 일반 전투만 허용
    if (seq[13] !== "rest" && seq[13] !== "battle") return false;

    let normalCount = 0, eliteCount = 0, bossCount = 0;
    let eventCount = 0, restCount = 0, treasureCount = 0;

    for (let i = 0; i < 15; i++) {
      const t = seq[i];
      if (t === "battle") normalCount++;
      else if (t === "elite") eliteCount++;
      else if (t === "boss") bossCount++;
      else if (t === "event") eventCount++;
      else if (t === "rest") restCount++;
      else if (t === "treasure") treasureCount++;

      // 연속 정예 금지
      if (i > 0 && t === "elite" && seq[i - 1] === "elite") return false;

      // 연속 비전투 금지
      if (i > 0 && isNonBattle(t) && isNonBattle(seq[i - 1])) return false;
    }

    return normalCount === 7 && eliteCount === 2 && bossCount === 1
      && eventCount === 2 && restCount === 2 && treasureCount === 1;
  }

  function pickFloorSequence(rng, stageIndex) {
    const middleTypes = [
      "battle", "battle", "battle", "battle", "battle", "battle",
      "elite", "elite", "event", "event", "rest", "rest", "treasure"
    ];

    for (let attempt = 0; attempt < 100; attempt++) {
      const shuffled = shuffle(middleTypes, rng);
      const seq = ["battle", ...shuffled, "boss"];
      if (isValidFloorSequence(seq)) {
        return seq;
      }
    }

    return [...SAFE_TEMPLATES[stageIndex % SAFE_TEMPLATES.length]];
  }

  function generateStageMap(options = {}) {
    const {
      runSeed = 0,
      stageIndex = 0,
      floors = 15,
      minLanes = 3,
      maxLanes = 4
    } = options;

    const combinedSeed = (Math.abs(runSeed) * 1000003 + (stageIndex + 1) * 7919) >>> 0;
    const rng = createPrng(combinedSeed);

    const floorTypes = pickFloorSequence(rng, stageIndex);
    const stageIdPrefix = `s${stageIndex + 1}`;
    const floorNodes = {};

    for (let f = 1; f <= floors; f++) {
      floorNodes[f] = [];
      let laneCount = 3;
      if (f === 1) {
        laneCount = randomInt(rng, 2, 3);
      } else if (f === floors) {
        laneCount = 1;
      } else {
        laneCount = randomInt(rng, minLanes, maxLanes);
      }

      const y = parseFloat((0.94 - ((f - 1) / (floors - 1)) * 0.88).toFixed(3));
      const fType = floorTypes[f - 1];

      for (let l = 0; l < laneCount; l++) {
        const laneRatio = laneCount === 1 ? 0.5 : (l + 0.5) / laneCount;
        const xOffset = laneCount === 1 ? 0 : (rng() - 0.5) * 0.06;
        const x = parseFloat(Math.min(0.92, Math.max(0.08, laneRatio + xOffset)).toFixed(3));

        const nodeId = f === floors
          ? `${stageIdPrefix}-f${f}-boss`
          : `${stageIdPrefix}-f${f}-n${l}`;

        floorNodes[f].push({
          id: nodeId,
          floor: f,
          lane: l,
          type: fType,
          encounterKind: fType === "elite" ? "elite" : (fType === "boss" ? "boss" : "normal"),
          x: x,
          y: y,
          next: []
        });
      }
    }

    // 간선 연결
    for (let f = 1; f < floors; f++) {
      const currentFloor = floorNodes[f];
      const nextFloor = floorNodes[f + 1];

      if (f + 1 === floors) {
        currentFloor.forEach(node => {
          node.next.push(nextFloor[0].id);
        });
        continue;
      }

      currentFloor.forEach(node => {
        const cLaneRatio = (node.lane + 0.5) / currentFloor.length;
        const candidates = nextFloor.map((nNext) => {
          const nLaneRatio = (nNext.lane + 0.5) / nextFloor.length;
          return { node: nNext, diff: Math.abs(cLaneRatio - nLaneRatio) };
        }).sort((a, b) => a.diff - b.diff);

        node.next.push(candidates[0].node.id);

        if (candidates.length > 1 && rng() < 0.35) {
          if (!node.next.includes(candidates[1].node.id)) {
            node.next.push(candidates[1].node.id);
          }
        }
      });

      // 진입 간선 없는 고립 노드 연결 보장
      nextFloor.forEach(nNext => {
        const hasIncoming = currentFloor.some(cNode => cNode.next.includes(nNext.id));
        if (!hasIncoming) {
          const nLaneRatio = (nNext.lane + 0.5) / nextFloor.length;
          const closestPrev = [...currentFloor].sort((a, b) => {
            const aRatio = (a.lane + 0.5) / currentFloor.length;
            const bRatio = (b.lane + 0.5) / currentFloor.length;
            return Math.abs(aRatio - nLaneRatio) - Math.abs(bRatio - nLaneRatio);
          })[0];
          closestPrev.next.push(nNext.id);
        }
      });

      // 진입 간선 최대 3개 제한
      nextFloor.forEach(nNext => {
        const inNodes = currentFloor.filter(cNode => cNode.next.includes(nNext.id));
        if (inNodes.length > 3) {
          for (let i = 3; i < inNodes.length; i++) {
            const extraNode = inNodes[i];
            if (extraNode.next.length > 1) {
              extraNode.next = extraNode.next.filter(id => id !== nNext.id);
            }
          }
        }
      });
    }

    const allNodesList = [];
    Object.values(floorNodes).forEach(fnList => allNodesList.push(...fnList));

    return {
      version: 2,
      stageIndex: stageIndex,
      floors: floors,
      nodes: allNodesList,
      startNodeIds: floorNodes[1].map(n => n.id),
      bossNodeId: floorNodes[floors][0].id
    };
  }

  exports.generateStageMap = generateStageMap;
  exports.SAFE_TEMPLATES = SAFE_TEMPLATES;
  exports.isValidFloorSequence = isValidFloorSequence;

})(typeof exports !== "undefined" ? exports : (window.MapGenerator = {}));
