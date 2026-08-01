/**
 * map-generator.js
 * Slay the Spire 스타일의 시드 기반 3스테이지 분기 원정 지도 생성 모듈
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

  /**
   * 스테이지 지도 생성 메인 함수
   */
  function generateStageMap(options = {}) {
    const {
      runSeed = 0,
      stageIndex = 0,
      floors = 10,
      minLanes = 3,
      maxLanes = 4
    } = options;

    // 시드 조합: runSeed와 stageIndex 기반 독립 시드
    const combinedSeed = (Math.abs(runSeed) * 1000003 + (stageIndex + 1) * 7919) >>> 0;
    const rng = createPrng(combinedSeed);

    const stageIdPrefix = `s${stageIndex + 1}`;
    const floorNodes = {}; // floor -> array of nodes

    // 1. 층별 노드 갯수 및 좌표 할당
    for (let f = 1; f <= floors; f++) {
      floorNodes[f] = [];
      let laneCount = 3;
      if (f === 1) {
        laneCount = randomInt(rng, 2, 3);
      } else if (f === floors) {
        laneCount = 1; // 보스 층
      } else {
        laneCount = randomInt(rng, minLanes, maxLanes);
      }

      const y = parseFloat((0.92 - ((f - 1) / (floors - 1)) * 0.84).toFixed(3));

      for (let l = 0; l < laneCount; l++) {
        const laneRatio = laneCount === 1 ? 0.5 : (l + 0.5) / laneCount;
        const xOffset = laneCount === 1 ? 0 : (rng() - 0.5) * 0.08;
        const x = parseFloat(Math.min(0.9, Math.max(0.1, laneRatio + xOffset)).toFixed(3));

        const nodeId = f === floors
          ? `${stageIdPrefix}-f${f}-boss`
          : `${stageIdPrefix}-f${f}-n${l}`;

        floorNodes[f].push({
          id: nodeId,
          floor: f,
          lane: l,
          type: "battle", // 기본값
          encounterKind: "normal",
          x: x,
          y: y,
          next: []
        });
      }
    }

    // 2. 간선(Edge) 연결 생성 (층 f -> 층 f+1)
    for (let f = 1; f < floors; f++) {
      const currentFloor = floorNodes[f];
      const nextFloor = floorNodes[f + 1];

      // 보스 층인 경우 모두 보스로 연결
      if (f + 1 === floors) {
        currentFloor.forEach(node => {
          node.next.push(nextFloor[0].id);
        });
        continue;
      }

      // 레인 기반 근접 노드 연결
      currentFloor.forEach(node => {
        const cLaneRatio = (node.lane + 0.5) / currentFloor.length;

        // 다음 층 노드들을 레인 비율 차이 순으로 정렬
        const candidates = nextFloor.map((nNext, idx) => {
          const nLaneRatio = (nNext.lane + 0.5) / nextFloor.length;
          return { node: nNext, diff: Math.abs(cLaneRatio - nLaneRatio), idx };
        }).sort((a, b) => a.diff - b.diff);

        // 기본 1개 연결
        node.next.push(candidates[0].node.id);

        // 35% 확률로 2번째 가장 가까운 후보 추가 연결
        if (candidates.length > 1 && rng() < 0.35) {
          if (!node.next.includes(candidates[1].node.id)) {
            node.next.push(candidates[1].node.id);
          }
        }
      });

      // 검증: 다음 층 노드 중 진입 간선이 없는(고립된) 노드 연결 보장
      nextFloor.forEach(nNext => {
        const hasIncoming = currentFloor.some(cNode => cNode.next.includes(nNext.id));
        if (!hasIncoming) {
          // 가장 가까운 이전 층 노드에서 연결 추가
          const nLaneRatio = (nNext.lane + 0.5) / nextFloor.length;
          const closestPrev = [...currentFloor].sort((a, b) => {
            const aRatio = (a.lane + 0.5) / currentFloor.length;
            const bRatio = (b.lane + 0.5) / currentFloor.length;
            return Math.abs(aRatio - nLaneRatio) - Math.abs(bRatio - nLaneRatio);
          })[0];

          closestPrev.next.push(nNext.id);
        }
      });

      // 진입 간선 3개 초과 방지
      nextFloor.forEach(nNext => {
        const inNodes = currentFloor.filter(cNode => cNode.next.includes(nNext.id));
        if (inNodes.length > 3) {
          // 3개를 초과하는 추가 간선 중 2개 초과하는 것 제거 (단, 해당 이전 노드가 다른 출구를 가질 때만)
          for (let i = 3; i < inNodes.length; i++) {
            const extraNode = inNodes[i];
            if (extraNode.next.length > 1) {
              extraNode.next = extraNode.next.filter(id => id !== nNext.id);
            }
          }
        }
      });
    }

    // 3. 노드 종류 배정
    // 층 1: 일반 전투 (100%)
    // 층 10: 보스 (100%)
    const allNodesList = [];
    Object.values(floorNodes).forEach(fnList => allNodesList.push(...fnList));

    const middleNodes = allNodesList.filter(n => n.floor > 1 && n.floor < floors);

    // 8~9층 중 최소 1~2개 휴식(rest) 보장
    const floor8or9Nodes = middleNodes.filter(n => n.floor === 8 || n.floor === 9);
    const guaranteedRestCount = Math.min(floor8or9Nodes.length, randomInt(rng, 1, 2));
    const shuffledRestCandidates = shuffle(floor8or9Nodes, rng);
    for (let i = 0; i < guaranteedRestCount; i++) {
      shuffledRestCandidates[i].type = "rest";
    }

    // 정예 전투(elite) 2~3개 배정 (층 4~7 우선)
    const eliteCandidates = middleNodes.filter(n => n.type === "battle" && n.floor >= 3 && n.floor <= 7);
    const targetEliteCount = Math.min(eliteCandidates.length, randomInt(rng, 2, 3));
    const shuffledElites = shuffle(eliteCandidates, rng);
    for (let i = 0; i < targetEliteCount; i++) {
      shuffledElites[i].type = "elite";
      shuffledElites[i].encounterKind = "elite";
    }

    // 보물(treasure) 1~2개 배정 (층 5~6 우선)
    const treasureCandidates = middleNodes.filter(n => n.type === "battle" && n.floor >= 4 && n.floor <= 7);
    const targetTreasureCount = Math.min(treasureCandidates.length, randomInt(rng, 1, 2));
    const shuffledTreasures = shuffle(treasureCandidates, rng);
    for (let i = 0; i < targetTreasureCount; i++) {
      shuffledTreasures[i].type = "treasure";
    }

    // 사건(event) 20% 배정 (~2~4개)
    const eventCandidates = middleNodes.filter(n => n.type === "battle" && n.floor >= 2 && n.floor <= 8);
    const targetEventCount = Math.min(eventCandidates.length, Math.round(middleNodes.length * 0.20));
    const shuffledEvents = shuffle(eventCandidates, rng);
    for (let i = 0; i < targetEventCount; i++) {
      shuffledEvents[i].type = "event";
    }

    // 보스 노드 명시
    const bossNode = floorNodes[floors][0];
    bossNode.type = "boss";
    bossNode.encounterKind = "boss";

    // 4. 경로 무결성 & 제약 조건 후처리 검증
    // 제약 A: 한 층의 모든 후보가 elite인 경우 방지
    for (let f = 2; f < floors; f++) {
      const fnList = floorNodes[f];
      if (fnList.every(n => n.type === "elite")) {
        // 하나를 일반 전투로 변경
        fnList[0].type = "battle";
        fnList[0].encounterKind = "normal";
      }
    }

    // 제약 B: 모든 시작 노드에서 보스까지의 경로 탐색 & 최소 5회 전투 보장
    const nodeMap = new Map();
    allNodesList.forEach(n => nodeMap.set(n.id, n));

    function getPathsFrom(nodeId, currentPath = []) {
      const node = nodeMap.get(nodeId);
      if (!node) return [];
      const newPath = [...currentPath, node];
      if (node.next.length === 0) {
        return [newPath];
      }
      let paths = [];
      for (const nextId of node.next) {
        paths.push(...getPathsFrom(nextId, newPath));
      }
      return paths;
    }

    const startNodeIds = floorNodes[1].map(n => n.id);
    startNodeIds.forEach(startId => {
      const paths = getPathsFrom(startId);
      paths.forEach(path => {
        // 전투 수 카운트 (battle, elite, boss)
        let battleCount = path.filter(n => n.type === "battle" || n.type === "elite" || n.type === "boss").length;
        if (battleCount < 5) {
          // 전투 수가 5 미만이면 사건/휴식 노드를 전투로 변경
          for (const node of path) {
            if (battleCount >= 5) break;
            if (node.type === "event" || node.type === "rest" || node.type === "treasure") {
              node.type = "battle";
              node.encounterKind = "normal";
              battleCount++;
            }
          }
        }
      });
    });

    return {
      version: 1,
      stageIndex: stageIndex,
      nodes: allNodesList,
      startNodeIds: startNodeIds,
      bossNodeId: bossNode.id
    };
  }

  exports.generateStageMap = generateStageMap;

})(typeof exports !== "undefined" ? exports : (window.MapGenerator = {}));
