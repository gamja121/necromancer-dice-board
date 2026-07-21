/**
 * encounter-generator.js
 * 네크로멘서 십이장기 - WFC 원리를 응용한 3스테이지 30전투 제약 생성기
 */

(function (root, factory) {
  let unitTypes = typeof UNIT_TYPES !== "undefined" ? UNIT_TYPES : (root && root.UNIT_TYPES);
  let meta = typeof ENCOUNTER_UNIT_META !== "undefined" ? ENCOUNTER_UNIT_META : (root && root.ENCOUNTER_UNIT_META);

  if ((!unitTypes || !meta) && typeof require === "function") {
    try {
      const unitData = require("./unit-data.js");
      unitTypes = unitTypes || unitData.UNIT_TYPES;
      meta = meta || unitData.ENCOUNTER_UNIT_META;
    } catch (e) {}
  }

  const instance = factory(unitTypes, meta);

  if (root) root.EncounterGenerator = instance;
  if (typeof globalThis !== "undefined") globalThis.EncounterGenerator = instance;
  if (typeof window !== "undefined") window.EncounterGenerator = instance;
  if (typeof module === "object" && module.exports) {
    module.exports = instance;
  }
})(typeof self !== "undefined" ? self : (typeof window !== "undefined" ? window : globalThis), function (UNIT_TYPES, ENCOUNTER_UNIT_META) {
  const MAX_BACKTRACKS = 200;
  const MAX_RESTARTS = 20;

  function createPRNG(seed) {
    let s = seed >>> 0;
    return function () {
      let t = (s += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const STAGE_SPECS = [
    // Stage 1 (B01 - B10)
    [
      { battle: 1, minCost: 5.5, maxCost: 6.5, minEnemies: 3, maxEnemies: 3, maxAdvanced: 0, maxHero: 0, theme: "undead" },
      { battle: 2, minCost: 6.0, maxCost: 7.0, minEnemies: 3, maxEnemies: 3, maxAdvanced: 0, maxHero: 0 },
      { battle: 3, minCost: 6.0, maxCost: 7.5, minEnemies: 3, maxEnemies: 3, maxAdvanced: 0, maxHero: 0 },
      { battle: 4, minCost: 6.5, maxCost: 8.0, minEnemies: 3, maxEnemies: 3, maxAdvanced: 0, maxHero: 0 },
      { battle: 5, minCost: 7.0, maxCost: 8.5, minEnemies: 3, maxEnemies: 4, maxAdvanced: 0, maxHero: 0 },
      { battle: 6, minCost: 7.5, maxCost: 9.0, minEnemies: 3, maxEnemies: 3, maxAdvanced: 1, maxHero: 0 },
      { battle: 7, minCost: 7.0, maxCost: 8.5, minEnemies: 3, maxEnemies: 3, maxAdvanced: 1, maxHero: 0, isPacing: true },
      { battle: 8, minCost: 8.0, maxCost: 9.5, minEnemies: 3, maxEnemies: 4, maxAdvanced: 1, maxHero: 0 },
      { battle: 9, minCost: 8.5, maxCost: 10.0, minEnemies: 4, maxEnemies: 4, maxAdvanced: 1, maxHero: 0 },
      { battle: 10, minCost: 10.0, maxCost: 12.0, minEnemies: 3, maxEnemies: 4, maxAdvanced: 1, maxHero: 0, boss: true, bossAnchor: ["knight", "ogre"] },
    ],
    // Stage 2 (B11 - B20)
    [
      { battle: 1, minCost: 8.5, maxCost: 10.0, minEnemies: 3, maxEnemies: 4, maxAdvanced: 1, maxHero: 0 },
      { battle: 2, minCost: 9.0, maxCost: 10.5, minEnemies: 3, maxEnemies: 4, maxAdvanced: 1, maxHero: 0 },
      { battle: 3, minCost: 9.5, maxCost: 11.0, minEnemies: 4, maxEnemies: 4, maxAdvanced: 2, maxHero: 0 },
      { battle: 4, minCost: 10.0, maxCost: 11.5, minEnemies: 4, maxEnemies: 4, maxAdvanced: 2, maxHero: 0 },
      { battle: 5, minCost: 10.5, maxCost: 12.0, minEnemies: 4, maxEnemies: 4, maxAdvanced: 2, maxHero: 0 },
      { battle: 6, minCost: 11.0, maxCost: 12.5, minEnemies: 3, maxEnemies: 4, maxAdvanced: 2, maxHero: 1 },
      { battle: 7, minCost: 10.5, maxCost: 12.0, minEnemies: 4, maxEnemies: 4, maxAdvanced: 2, maxHero: 1, isPacing: true },
      { battle: 8, minCost: 11.5, maxCost: 13.5, minEnemies: 4, maxEnemies: 4, maxAdvanced: 2, maxHero: 1 },
      { battle: 9, minCost: 12.0, maxCost: 14.0, minEnemies: 4, maxEnemies: 4, maxAdvanced: 2, maxHero: 1 },
      { battle: 10, minCost: 14.0, maxCost: 16.5, minEnemies: 4, maxEnemies: 4, maxAdvanced: 2, maxHero: 1, boss: true, bossAnchor: ["spiderQueen", "goblinChief", "iceLord"] },
    ],
    // Stage 3 (B21 - B30)
    [
      { battle: 1, minCost: 12.5, maxCost: 14.0, minEnemies: 4, maxEnemies: 4, maxAdvanced: 2, maxHero: 1 },
      { battle: 2, minCost: 13.0, maxCost: 14.5, minEnemies: 4, maxEnemies: 4, maxAdvanced: 2, maxHero: 1 },
      { battle: 3, minCost: 13.5, maxCost: 15.0, minEnemies: 4, maxEnemies: 4, maxAdvanced: 2, maxHero: 1 },
      { battle: 4, minCost: 14.0, maxCost: 15.5, minEnemies: 4, maxEnemies: 4, maxAdvanced: 2, maxHero: 1 },
      { battle: 5, minCost: 14.5, maxCost: 16.0, minEnemies: 4, maxEnemies: 5, maxAdvanced: 2, maxHero: 1 },
      { battle: 6, minCost: 15.0, maxCost: 16.5, minEnemies: 4, maxEnemies: 4, maxAdvanced: 2, maxHero: 1 },
      { battle: 7, minCost: 14.5, maxCost: 16.0, minEnemies: 4, maxEnemies: 4, maxAdvanced: 2, maxHero: 1, isPacing: true },
      { battle: 8, minCost: 16.0, maxCost: 18.0, minEnemies: 4, maxEnemies: 5, maxAdvanced: 2, maxHero: 1 },
      { battle: 9, minCost: 17.0, maxCost: 19.0, minEnemies: 5, maxEnemies: 5, maxAdvanced: 2, maxHero: 1 },
      { battle: 10, minCost: 20.0, maxCost: 23.0, minEnemies: 5, maxEnemies: 5, maxAdvanced: 2, maxHero: 1, boss: true, bossAnchor: ["demonDeathKnight"] },
    ],
  ];

  const THEMES = ["undead", "corpse", "beast", "plague", "ice", "summon", "demon"];

  function getAvailableUnitsForStage(stageNum) {
    const available = [];
    for (const key of Object.keys(ENCOUNTER_UNIT_META)) {
      const meta = ENCOUNTER_UNIT_META[key];
      if (meta.directSpawn && meta.minStage <= stageNum) {
        available.push(key);
      }
    }
    return available;
  }

  function calculateEncounterCost(enemies) {
    let cost = 0;
    for (const unit of enemies) {
      if (ENCOUNTER_UNIT_META[unit]) {
        cost += ENCOUNTER_UNIT_META[unit].cost;
      }
    }
    return cost;
  }

  function hasFrontline(enemies) {
    for (const unit of enemies) {
      const meta = ENCOUNTER_UNIT_META[unit];
      if (meta && meta.roles && meta.roles.includes("frontline")) {
        return true;
      }
    }
    return false;
  }

  function countGrades(enemies) {
    let advanced = 0;
    let hero = 0;
    for (const u of enemies) {
      const g = UNIT_TYPES[u] ? UNIT_TYPES[u].grade : "normal";
      if (g === "advanced") advanced++;
      if (g === "hero") hero++;
    }
    return { advanced, hero };
  }

  function getPrimaryTheme(enemies) {
    const themeCounts = {};
    for (const u of enemies) {
      const meta = ENCOUNTER_UNIT_META[u];
      if (meta && meta.themes) {
        for (const t of meta.themes) {
          themeCounts[t] = (themeCounts[t] || 0) + 1;
        }
      }
    }
    let bestTheme = "undead";
    let maxCount = -1;
    for (const t of Object.keys(themeCounts)) {
      if (themeCounts[t] > maxCount) {
        maxCount = themeCounts[t];
        bestTheme = t;
      }
    }
    return bestTheme;
  }

  function isValidEncounterCandidate(enemies, spec, stageNum) {
    if (!hasFrontline(enemies)) return false;

    // Direct spawn check
    for (const u of enemies) {
      const meta = ENCOUNTER_UNIT_META[u];
      if (!meta || !meta.directSpawn || meta.minStage > stageNum) return false;
    }

    // Max copies per unit
    const counts = {};
    for (const u of enemies) {
      counts[u] = (counts[u] || 0) + 1;
      const meta = ENCOUNTER_UNIT_META[u];
      if (counts[u] > meta.maxCopies) return false;
    }

    // Grade limits
    const { advanced, hero } = countGrades(enemies);
    if (advanced > spec.maxAdvanced) return false;
    if (hero > spec.maxHero) return false;

    // Cost budget check
    const cost = calculateEncounterCost(enemies);
    if (cost < spec.minCost || cost > spec.maxCost) return false;

    // Boss anchor check
    if (spec.bossAnchor && spec.bossAnchor.length > 0) {
      let hasAnchor = false;
      for (const anchor of spec.bossAnchor) {
        if (enemies.includes(anchor)) {
          hasAnchor = true;
          break;
        }
      }
      if (!hasAnchor) return false;
    }

    // Spec theme constraint if explicit
    if (spec.theme && getPrimaryTheme(enemies) !== spec.theme) return false;

    // High HP / Tank restriction: if 2+ tanks (ogre/golem), no hero
    let tanks = 0;
    for (const u of enemies) {
      if (u === "ogre" || u === "golem") tanks++;
    }
    if (tanks >= 2 && hero > 0) return false;

    return true;
  }

  const specCandidateCache = new Map();

  function generateCandidatesForSpec(spec, stageNum) {
    const specKey = `${stageNum}_${spec.battle}_${spec.minCost}_${spec.maxCost}_${spec.minEnemies}_${spec.maxEnemies}_${spec.maxAdvanced}_${spec.maxHero}_${(spec.bossAnchor||[]).join(",")}`;
    if (specCandidateCache.has(specKey)) {
      return specCandidateCache.get(specKey);
    }

    const available = getAvailableUnitsForStage(stageNum);
    const candidates = [];
    const seenCompKeys = new Set();

    function buildCombo(current, startIndex, targetSize) {
      if (current.length === targetSize) {
        if (isValidEncounterCandidate(current, spec, stageNum)) {
          const sortedKey = [...current].sort().join(",");
          if (!seenCompKeys.has(sortedKey)) {
            seenCompKeys.add(sortedKey);
            candidates.push({
              enemies: [...current],
              cost: calculateEncounterCost([...current]),
              theme: getPrimaryTheme([...current]),
              compKey: sortedKey,
            });
          }
        }
        return;
      }

      for (let i = startIndex; i < available.length; i++) {
        current.push(available[i]);
        buildCombo(current, i, targetSize);
        current.pop();
      }
    }

    for (let size = spec.minEnemies; size <= spec.maxEnemies; size++) {
      buildCombo([], 0, size);
    }

    specCandidateCache.set(specKey, candidates);
    return candidates;
  }

  function generate30Encounters(seed) {
    let rng = createPRNG(seed);
    let usedFallback = false;
    let restartCount = 0;

    for (restartCount = 0; restartCount < MAX_RESTARTS; restartCount++) {
      let backtrackCount = 0;
      const encounters = [];
      const usedCompKeys = new Set();
      const heroCountsPerStage = [{}, {}, {}];
      const stageThemes = [[], [], []];

      let failed = false;
      let cellIndex = 0;

      while (cellIndex < 30) {
        const stageIndex = Math.floor(cellIndex / 10);
        const battleInStage = cellIndex % 10;
        const spec = STAGE_SPECS[stageIndex][battleInStage];

        let candidates = generateCandidatesForSpec(spec, stageIndex + 1);

        // Filter candidates against global constraints
        candidates = candidates.filter((cand) => {
          if (usedCompKeys.has(cand.compKey)) return false;

          // Theme 3 consecutive constraint
          if (encounters.length >= 2) {
            const t1 = encounters[encounters.length - 1].theme;
            const t2 = encounters[encounters.length - 2].theme;
            if (t1 === cand.theme && t2 === cand.theme) return false;
          }

          // Same hero max 2 per stage (boss battles exempt so boss anchor can always spawn)
          const { hero } = countGrades(cand.enemies);
          if (hero > 0 && !spec.boss) {
            for (const u of cand.enemies) {
              if (UNIT_TYPES[u] && UNIT_TYPES[u].grade === "hero") {
                const count = heroCountsPerStage[stageIndex][u] || 0;
                if (count >= 2) return false;
              }
            }
          }

          return true;
        });

        if (candidates.length === 0) {
          backtrackCount++;
          if (backtrackCount > MAX_BACKTRACKS) {
            failed = true;
            break;
          }
          if (cellIndex > 0) {
            cellIndex--;
            const popped = encounters.pop();
            usedCompKeys.delete(popped.compKey);
            for (const u of popped.enemies) {
              if (UNIT_TYPES[u] && UNIT_TYPES[u].grade === "hero") {
                if (heroCountsPerStage[popped.stage - 1][u]) {
                  heroCountsPerStage[popped.stage - 1][u]--;
                }
              }
            }
            continue;
          } else {
            failed = true;
            break;
          }
        }

        // Weighted selection
        const weightedCandidates = candidates.map((cand) => {
          let weight = 100;
          if (encounters.length > 0) {
            const prev = encounters[encounters.length - 1];
            for (const u of cand.enemies) {
              if (prev.enemies.includes(u)) weight *= 0.7;
            }
          }
          return { candidate: cand, weight };
        });

        const totalWeight = weightedCandidates.reduce((sum, item) => sum + item.weight, 0);
        let randVal = rng() * totalWeight;
        let chosenCandidate = weightedCandidates[0].candidate;
        for (const item of weightedCandidates) {
          randVal -= item.weight;
          if (randVal <= 0) {
            chosenCandidate = item.candidate;
            break;
          }
        }

        // Lock in encounter
        const cellId = `S${stageIndex + 1}-B${String(battleInStage + 1).padStart(2, "0")}`;
        const encounterObj = {
          id: cellId,
          stage: stageIndex + 1,
          battle: battleInStage + 1,
          seed: Math.floor(rng() * 1000000),
          theme: chosenCandidate.theme,
          targetPower: (spec.minCost + spec.maxCost) / 2,
          actualPower: chosenCandidate.cost,
          enemies: [...chosenCandidate.enemies],
          enemyCount: chosenCandidate.enemies.length,
          boss: Boolean(spec.boss),
          isPacing: Boolean(spec.isPacing),
          cleared: false,
          attempts: 0,
          compKey: chosenCandidate.compKey,
        };

        encounters.push(encounterObj);
        usedCompKeys.add(chosenCandidate.compKey);
        stageThemes[stageIndex].push(chosenCandidate.theme);

        for (const u of chosenCandidate.enemies) {
          if (UNIT_TYPES[u] && UNIT_TYPES[u].grade === "hero") {
            heroCountsPerStage[stageIndex][u] = (heroCountsPerStage[stageIndex][u] || 0) + 1;
          }
        }

        cellIndex++;
      }

      if (!failed && encounters.length === 30) {
        // Verify stage theme diversity (at least 3 themes per stage)
        let diverse = true;
        for (let s = 0; s < 3; s++) {
          const uniqueThemes = new Set(stageThemes[s]);
          if (uniqueThemes.size < 3) {
            diverse = false;
            break;
          }
        }

        if (diverse) {
          return {
            generatorVersion: 1,
            runSeed: seed,
            encounters,
            usedFallback: false,
            restartCount,
            backtrackCount,
          };
        }
      }

      // Re-seed PRNG for next restart attempt
      rng = createPRNG(seed + restartCount + 1);
    }

    // Fallback safe template generator
    usedFallback = true;
    const fallbackEncounters = getFallbackTemplateEncounters(seed);
    return {
      generatorVersion: 1,
      runSeed: seed,
      encounters: fallbackEncounters,
      usedFallback: true,
      restartCount: MAX_RESTARTS,
      backtrackCount: MAX_BACKTRACKS,
    };
  }

  function getFallbackTemplateEncounters(seed) {
    const templates = [];
    const baseList = [
      ["archer", "archer", "worm"],
      ["archer", "seaWolf", "goblinSoldier"],
      ["yeti", "seaWolf", "goblinSoldier"],
      ["worm", "ghoul", "ghoul"],
      ["spear", "archer", "seaWolf", "goblinSoldier"],
      ["worm", "plagueFrog", "knight"],
      ["spear", "ghoul", "knight"],
      ["spear", "worm", "worm", "seaWolf"],
      ["archer", "ghoul", "plagueFrog", "plagueFrog"],
      ["archer", "worm", "ghoul", "knight"],
      ["plagueFrog", "seaWolf", "ogre"],
      ["spear", "abyssEye", "doomExecutor"],
      ["worm", "ghoul", "seaWolf", "plague"],
      ["spear", "yeti", "abyssEye", "iceLord"],
      ["worm", "goblinSoldier", "goblinSoldier", "minotaur"],
      ["ghoul", "plagueFrog", "seaWolf", "golem"],
      ["worm", "goblinSoldier", "goblinSoldier", "golem"],
      ["plagueFrog", "seaWolf", "plague", "golem"],
      ["spear", "abyssEye", "abyssEye", "spiderQueen"],
      ["archer", "worm", "iceLord", "goblinChief"],
      ["worm", "ghoul", "seaWolf", "skeletonSummoner"],
      ["spear", "yeti", "iceLord", "golem"],
      ["ghoul", "yeti", "plague", "doomExecutor"],
      ["archer", "ghoul", "doomExecutor", "golem"],
      ["archer", "seaWolf", "seaWolf", "plague", "iceLord"],
      ["worm", "worm", "minotaur", "goblinChief"],
      ["plagueFrog", "plague", "minotaur", "skeletonSummoner"],
      ["spear", "yeti", "goblinSoldier", "iceLord", "ogre"],
      ["seaWolf", "abyssEye", "abyssEye", "knight", "demonDeathKnight"],
      ["ghoul", "goblinSoldier", "doomExecutor", "golem", "demonDeathKnight"],
    ];

    for (let i = 0; i < 30; i++) {
      const stageIndex = Math.floor(i / 10);
      const battleInStage = i % 10;
      const spec = STAGE_SPECS[stageIndex][battleInStage];
      const cellId = `S${stageIndex + 1}-B${String(battleInStage + 1).padStart(2, "0")}`;
      const enemies = baseList[i];
      templates.push({
        id: cellId,
        stage: stageIndex + 1,
        battle: battleInStage + 1,
        seed: seed + i,
        theme: getPrimaryTheme(enemies),
        targetPower: (spec.minCost + spec.maxCost) / 2,
        actualPower: calculateEncounterCost(enemies),
        enemies: [...enemies],
        enemyCount: enemies.length,
        boss: (battleInStage + 1) === 10,
        isPacing: (battleInStage + 1) === 7,
        cleared: false,
        attempts: 0,
        compKey: [...enemies].sort().join(","),
      });
    }

    return templates;
  }

  function validateEncountersArray(encounters) {
    if (!Array.isArray(encounters) || encounters.length !== 30) return false;
    const usedCompKeys = new Set();
    const stageThemes = [new Set(), new Set(), new Set()];

    for (let i = 0; i < 30; i++) {
      const enc = encounters[i];
      if (!enc || typeof enc !== "object") return false;

      const stageIndex = Math.floor(i / 10);
      const battleInStage = i % 10;
      const spec = STAGE_SPECS[stageIndex][battleInStage];

      const expectedStage = stageIndex + 1;
      const expectedBattle = battleInStage + 1;
      const expectedId = `S${expectedStage}-B${String(expectedBattle).padStart(2, "0")}`;

      if (enc.id !== expectedId || enc.stage !== expectedStage || enc.battle !== expectedBattle) return false;
      if (!Array.isArray(enc.enemies) || enc.enemies.length < spec.minEnemies || enc.enemies.length > spec.maxEnemies) return false;
      if (typeof enc.boss !== "boolean" || enc.boss !== Boolean(spec.boss)) return false;
      if (typeof enc.isPacing !== "boolean" || enc.isPacing !== Boolean(spec.isPacing)) return false;
      if (!Number.isInteger(enc.seed) || enc.seed < 0) return false;
      if (!Number.isInteger(enc.attempts) || enc.attempts < 0 || typeof enc.cleared !== "boolean") return false;
      if (enc.enemyCount !== enc.enemies.length) return false;

      const cost = calculateEncounterCost(enc.enemies);
      const compKey = [...enc.enemies].sort().join(",");
      const theme = getPrimaryTheme(enc.enemies);
      if (!isValidEncounterCandidate(enc.enemies, spec, expectedStage)) return false;
      if (enc.actualPower !== cost || enc.targetPower !== (spec.minCost + spec.maxCost) / 2) return false;
      if (enc.compKey !== compKey || enc.theme !== theme) return false;

      // Theme consecutive check
      if (i >= 2) {
        const t1 = encounters[i - 1].theme;
        const t2 = encounters[i - 2].theme;
        if (t1 === enc.theme && t2 === enc.theme) return false;
      }

      // Combination duplicate check
      if (usedCompKeys.has(compKey)) return false;
      usedCompKeys.add(compKey);

      stageThemes[stageIndex].add(enc.theme);
    }

    // Stage theme variety check (at least 3 themes per stage)
    for (let s = 0; s < 3; s++) {
      if (stageThemes[s].size < 3) return false;
    }

    return true;
  }

  return {
    createPRNG,
    calculateEncounterCost,
    hasFrontline,
    generate30Encounters,
    validateEncountersArray,
    getFallbackTemplateEncounters,
    STAGE_SPECS,
  };
});
