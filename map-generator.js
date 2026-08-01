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

  const SAFE_TEMPLATES = [
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

  // 15층 기본 타입 순열 사전 생성 (20,958개 고유 유효 시퀀스)
  const middleTypes = ["battle", "battle", "battle", "battle", "battle", "battle", "elite", "elite", "event", "event", "rest", "rest", "treasure"];
  function permutations(arr) {
    if (arr.length === 0) return [[]];
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
  const ALL_VALID_SEQS = permutations(middleTypes).map(m => ["battle", ...m, "boss"]).filter(seq => isValidFloorSequence(seq));

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

    const poolLen = ALL_VALID_SEQS.length;
    const baseIdx = Math.floor(rng() * poolLen);
    const laneSeqs = [];

    for (let l = 0; l < 4; l++) {
      const idx = (baseIdx + l * 1307) % poolLen;
      laneSeqs.push(ALL_VALID_SEQS[idx]);
    }

    const stageIdPrefix = `s${stageIndex + 1}`;
    const floorNodes = {};

    for (let f = 1; f <= floors; f++) {
      floorNodes[f] = [];
      const laneCount = f === 1 ? randomInt(rng, 2, 3) : (f === floors ? 1 : 4);
      const y = parseFloat((0.94 - ((f - 1) / (floors - 1)) * 0.88).toFixed(3));

      for (let l = 0; l < laneCount; l++) {
        const laneRatio = laneCount === 1 ? 0.5 : (l + 0.5) / laneCount;
        const xOffset = laneCount === 1 ? 0 : (rng() - 0.5) * 0.04;
        const x = parseFloat(Math.min(0.92, Math.max(0.08, laneRatio + xOffset)).toFixed(3));

        const seq = laneSeqs[l % laneSeqs.length];
        const type = seq[f - 1];

        const nodeId = f === floors
          ? `${stageIdPrefix}-f${f}-boss`
          : `${stageIdPrefix}-f${f}-n${l}`;

        floorNodes[f].push({
          id: nodeId,
          floor: f,
          lane: l,
          type: type,
          encounterKind: type === "elite" ? "elite" : (type === "boss" ? "boss" : "normal"),
          x: x,
          y: y,
          next: [],
          laneSeq: seq
        });
      }
    }

    // 간선 연결 및 제약 조건 기반 분기 다양성 검증
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
        const cRatio = (node.lane + 0.5) / currentFloor.length;
        const sortedNext = [...nextFloor].map(n => ({
          node: n,
          diff: Math.abs(cRatio - (n.lane + 0.5) / nextFloor.length)
        })).sort((a, b) => a.diff - b.diff);

        const primary = sortedNext[0].node;
        node.next.push(primary.id);

        let branched = false;
        for (let i = 1; i < sortedNext.length; i++) {
          const candidate = sortedNext[i].node;
          if (candidate.type !== primary.type) {
            const hybridSeq = [...node.laneSeq.slice(0, f), ...candidate.laneSeq.slice(f)];
            if (isValidFloorSequence(hybridSeq)) {
              node.next.push(candidate.id);
              branched = true;
              break;
            }
          }
        }

        if (!branched && sortedNext.length > 1) {
          node.forcedReason = "combat-budget";
        }
      });

      // 진입 간선이 없는 고립 노드 연결 보장
      nextFloor.forEach(nNext => {
        const hasIncoming = currentFloor.some(cNode => cNode.next.includes(nNext.id));
        if (!hasIncoming) {
          const nRatio = (nNext.lane + 0.5) / nextFloor.length;
          const closestPrev = [...currentFloor].sort((a, b) => {
            const aRatio = (a.lane + 0.5) / currentFloor.length;
            const bRatio = (b.lane + 0.5) / currentFloor.length;
            return Math.abs(aRatio - nRatio) - Math.abs(bRatio - nRatio);
          })[0];
          closestPrev.next.push(nNext.id);
        }
      });
    }

    const allNodesList = [];
    Object.values(floorNodes).forEach(fnList => {
      fnList.forEach(n => {
        // 불필요한 내부 참조 속성 제거 후 저장
        const cleanNode = { ...n };
        delete cleanNode.laneSeq;
        allNodesList.push(cleanNode);
      });
    });

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
  exports.ALL_VALID_SEQS = ALL_VALID_SEQS;

})(typeof exports !== "undefined" ? exports : (window.MapGenerator = {}));
