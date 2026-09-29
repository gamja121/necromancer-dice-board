(async function () {
  const BATTLEFIELDS = [
    "art/v2-style/battle-backgrounds/uploaded-raw/lava-forest.jpg",
    "art/v2-style/battle-backgrounds/uploaded-raw/snow-forest.jpg",
    "art/v2-style/battle-backgrounds/uploaded-raw/dark-forest.jpg"
  ];
  const MAP_BATTLEFIELDS = Object.freeze({
    default: BATTLEFIELDS[2],
    winter: BATTLEFIELDS[1],
    hell: BATTLEFIELDS[0]
  });
  const battleQuery = typeof location === "undefined" ? new URLSearchParams() : new URLSearchParams(location.search);
  const fromMap = battleQuery.get("from") === "map";
  const mapEncounterId = battleQuery.get("encounter") || "";
  const mapEncounterType = battleQuery.get("encounterType") || "monster";
  const MAP_CONTAMINATION_KEY = "necromancer-map-contamination-v1";
  const MAP_CONTAMINATION_WIN_PREFIX = "necromancer-map-contamination-win-v1:";
  const MAP_CLEARED_MONSTER_KEY = "necromancer-map-cleared-monsters-v1";
  const MAP_ROSTER_KEY = "necromancer-map-roster-v2";
  const MONSTER_CAPACITY = 10;
  const mapContamination = Math.max(0, Math.min(100, Number(battleQuery.get("contamination")) || 0));
  const MAP_ENCOUNTER_STAGES = Object.freeze([
    Object.freeze({ min: 0, counts: Object.freeze([1, 2]), countWeights: Object.freeze([.65, .35]), grades: Object.freeze({ normal: .90, advanced: .10, hero: 0 }) }),
    Object.freeze({ min: 20, counts: Object.freeze([2]), countWeights: Object.freeze([1]), grades: Object.freeze({ normal: .75, advanced: .25, hero: 0 }) }),
    Object.freeze({ min: 40, counts: Object.freeze([2, 3]), countWeights: Object.freeze([.65, .35]), grades: Object.freeze({ normal: .55, advanced: .40, hero: .05 }) }),
    Object.freeze({ min: 60, counts: Object.freeze([3]), countWeights: Object.freeze([1]), grades: Object.freeze({ normal: .35, advanced: .50, hero: .15 }) }),
    Object.freeze({ min: 80, counts: Object.freeze([3, 4]), countWeights: Object.freeze([.55, .45]), grades: Object.freeze({ normal: .20, advanced: .55, hero: .25 }) })
  ]);
  const mapBattlefield = fromMap ? MAP_BATTLEFIELDS[battleQuery.get("map")] : null;
  const FRAME_ROOT = "art/v2-style/animation-test-frames/";
  const UNIT_TYPE_KEYS = {
    "guardian-seed": "guardianSeed",
    "skeleton-spear": "spear", "skeleton-archer": "archer", "skeleton-cavalry": "knight",
    "grave-worm": "worm", "flesh-golem": "golem", ghoul: "ghoul", "boulder-ogre": "ogre",
    "plague-doctor": "plague", "plague-frog": "plagueFrog", hydra: "hydra", minotaur: "minotaur",
    yeti: "yeti", "ice-lord": "iceLord", "sea-wolf": "seaWolf", "spider-knight": "spiderQueen",
    spiderling: "spiderling", "goblin-chief": "goblinChief", "goblin-commoner": "goblinCommoner",
    "goblin-soldier": "goblinSoldier", "grave-priest": "skeletonSummoner", "doom-executor": "doomExecutor",
    "abyss-eye": "abyssEye", "death-knight": "demonDeathKnight", "hell-mantis": "hellMantis",
    "abyss-claw-hunter": "abyssClawHunter", "corpse-slime": "corpseSlime",
    "scorpion-knight": "scorpionKnight", "ancient-treant": "ancientTreant", "stone-golem": "stoneGolem",
    kraken: "kraken", "crystal-devourer": "crystalDevourer", "raging-treant": "ragingTreant",
    cerberus: "cerberus", "mushroom-soldier": "poisonMushroom", "goblin-rider": "goblinRider",
    "abyss-harpy": "abyssHarpy", "orc-warrior": "troll", "bone-golem": "boneGolem",
    "forest-fairy": "forestFairy", "mummy-guardian": "mummyGuardian", "soul-reaper": "soulReaper",
    "bone-hound": "boneHound", mimic: "mimic", "ice-princess": "icePrincess", siren: "siren"
  };

  // Battlefield-test-only unit. This intentionally does not touch the map roster.
  if (globalThis.V2DesignData?.units && !V2DesignData.units.dracula) {
    V2DesignData.units.dracula = Object.freeze({
      slug: "dracula", name: "드라큘라", hp: 14, attack: 3, speed: 4,
      grade: "hero", legions: ["demon"], brands: ["vampire", "critical"],
      passives: [], chance: 0, bonus: "hp", amount: 0
    });
  }
  const GRADE_LABELS = { normal: "일반", advanced: "고급", hero: "영웅", special: "소환물" };
  const LEGION_LABELS = { skeleton: "언데드", corpse: "시체", beast: "야수", plague: "역병", ice: "얼음", summon: "소환", demon: "악마", insect: "벌래", plant: "식물", element: "원소" };
  const INFO_PORTRAIT_ROOT = "art/v2-style/ui/info-portraits/";
  const INFO_PORTRAIT_ART = Object.freeze({
    "abyss-claw-hunter": `${INFO_PORTRAIT_ROOT}abyss-claw-hunter.png?v=1`,
    "corpse-slime": `${INFO_PORTRAIT_ROOT}corpse-slime.png?v=1`,
    medusa: `${INFO_PORTRAIT_ROOT}medusa.png?v=1`,
    siren: `${INFO_PORTRAIT_ROOT}siren.png?v=3`,
    "abyss-harpy": `${INFO_PORTRAIT_ROOT}abyss-harpy.png?v=1`,
    "grave-worm": `${INFO_PORTRAIT_ROOT}grave-worm.png?v=1`,
    "goblin-commoner": `${INFO_PORTRAIT_ROOT}goblin-commoner.png?v=1`,
    spiderling: `${INFO_PORTRAIT_ROOT}spiderling.png?v=1`,
    "skeleton-cavalry": `${INFO_PORTRAIT_ROOT}skeleton-cavalry.png?v=1`,
    "mummy-guardian": `${INFO_PORTRAIT_ROOT}mummy-guardian.png?v=1`,
    "soul-reaper": `${INFO_PORTRAIT_ROOT}soul-reaper.png?v=1`,
    "bone-hound": `${INFO_PORTRAIT_ROOT}bone-hound.png?v=1`,
    mimic: `${INFO_PORTRAIT_ROOT}mimic.png?v=1`,
    "ice-princess": `${INFO_PORTRAIT_ROOT}ice-princess.png?v=1`,
    hydra: `${INFO_PORTRAIT_ROOT}hydra.png?v=1`,
    "flesh-golem": `${INFO_PORTRAIT_ROOT}flesh-golem.png?v=1`,
    "forest-fairy": `${INFO_PORTRAIT_ROOT}forest-fairy.png?v=1`,
    "bone-golem": `${INFO_PORTRAIT_ROOT}bone-golem.png?v=1`,
    "boulder-ogre": `${INFO_PORTRAIT_ROOT}boulder-ogre.png?v=1`,
    "orc-warrior": `${INFO_PORTRAIT_ROOT}orc-warrior.png?v=1`,
    "goblin-rider": `${INFO_PORTRAIT_ROOT}goblin-rider.png?v=1`,
    "mushroom-soldier": `${INFO_PORTRAIT_ROOT}mushroom-soldier.png?v=1`,
    cerberus: `${INFO_PORTRAIT_ROOT}cerberus.png?v=1`,
    "raging-treant": `${INFO_PORTRAIT_ROOT}raging-treant.png?v=1`,
    "spider-knight": `${INFO_PORTRAIT_ROOT}spider-knight.png?v=1`,
    "skeleton-archer": `${INFO_PORTRAIT_ROOT}skeleton-archer.png?v=1`,
    "skeleton-spear": `${INFO_PORTRAIT_ROOT}skeleton-spear.png?v=1`,
    "crystal-devourer": `${INFO_PORTRAIT_ROOT}crystal-devourer.png?v=1`,
    kraken: `${INFO_PORTRAIT_ROOT}kraken.png?v=1`,
    "stone-golem": `${INFO_PORTRAIT_ROOT}stone-golem.png?v=1`,
    "ancient-treant": `${INFO_PORTRAIT_ROOT}ancient-treant.png?v=1`,
    "scorpion-knight": `${INFO_PORTRAIT_ROOT}scorpion-knight.png?v=1`,
    "hell-mantis": `${INFO_PORTRAIT_ROOT}hell-mantis.png?v=1`,
    "death-knight": `${INFO_PORTRAIT_ROOT}death-knight.png?v=1`,
    "doom-executor": `${INFO_PORTRAIT_ROOT}doom-executor.png?v=1`,
    "abyss-eye": `${INFO_PORTRAIT_ROOT}abyss-eye.png?v=1`,
    "grave-priest": `${INFO_PORTRAIT_ROOT}grave-priest.png?v=1`,
    "sea-wolf": `${INFO_PORTRAIT_ROOT}sea-wolf.png?v=1`,
    "goblin-soldier": `${INFO_PORTRAIT_ROOT}goblin-soldier.png?v=1`,
    "goblin-chief": `${INFO_PORTRAIT_ROOT}goblin-chief.png?v=1`,
    ghoul: `${INFO_PORTRAIT_ROOT}ghoul.png?v=1`,
    "plague-doctor": `${INFO_PORTRAIT_ROOT}plague-doctor.png?v=1`,
    yeti: `${INFO_PORTRAIT_ROOT}yeti.png?v=1`,
    "ice-lord": `${INFO_PORTRAIT_ROOT}ice-lord.png?v=1`,
    "plague-frog": `${INFO_PORTRAIT_ROOT}plague-frog.png?v=1`,
    minotaur: `${INFO_PORTRAIT_ROOT}minotaur.png?v=2`,
    "guardian-seed": `${INFO_PORTRAIT_ROOT}guardian-seed.png?v=2`
  });
  // Viewports into the unmodified uploaded icon sheet: top row, then bottom row.
  const BRAND_ICON_VIEWS = Object.freeze({
    critical: [216, 48, 228, 228], vampire: [526, 48, 234, 228], guard: [841, 48, 228, 228],
    poison: [216, 310, 228, 228], summon: [526, 310, 234, 228], healing: [843, 310, 228, 228],
    combo: [222, 50, 220, 220], freeze: [850, 50, 220, 220],
    lightspeed: [222, 316, 220, 220], counter: [852, 316, 220, 220]
  });
  // Visible alpha bounds in the existing 192px cutouts; bitmap files stay untouched.
  const PORTRAIT_BOUNDS = {
    "cerberus": [68, 87, 117, 96],
    "hydra": [7, 68, 113, 111],
    "death-knight": [57, 90, 82, 90],
    "poison-mushroom": [70, 108, 54, 73],
    "goblin-commoner": [72, 114, 50, 65],
    "flesh-golem": [67, 101, 79, 85],
    "demon-death-knight": [36, 18, 135, 164],
    "skeleton-spear": [20, 12, 152, 171],
    "ghoul": [31, 12, 129, 172],
    "ancient-treant": [14, 12, 163, 170],
    "goblin-rider": [6, 105, 180, 79],
    "troll": [36, 30, 136, 154],
    "ogre": [27, 27, 138, 155],
    "minotaur": [7, 75, 178, 108]
  };
  const DICE_FRAME_ROOT = "art/v2-style/dice-test/frames/";
  const DICE_ROLL_FRAMES = Array.from({ length: 12 }, (_, index) => `${DICE_FRAME_ROOT}roll-${String(index + 1).padStart(2, "0")}.png`);
  const DICE_RESULT_FRAMES = Array.from({ length: 6 }, (_, index) => `${DICE_FRAME_ROOT}result-${String(index + 1).padStart(2, "0")}.png`);
  const TEAM_DATA = {
    ally: [
      unit("death-knight", "데스 나이트", 12, 3, 4, 5, 4, 6, "demon-death-knight"),
      unit("skeleton-spear", "해골 병사", 8, 2, 5, 5, 4, 5),
      unit("ghoul", "구울", 9, 2, 3, 5, 4, 6),
      unit("ancient-treant", "고대 트렌트", 14, 3, 1, 5, 4, 6)
    ],
    enemy: [
      unit("goblin-rider", "고블린 라이더", 8, 2, 5, 5, 4, 5),
      unit("orc-warrior", "오크 전사", 12, 3, 3, 5, 4, 5, "troll"),
      unit("boulder-ogre", "오우거", 14, 3, 2, 5, 4, 5, "ogre"),
      unit("minotaur", "미노타우로스", 11, 3, 4, 6, 4, 6)
    ]
  };

  const ROSTER_SPECS = Object.freeze([
    ["death-knight", "demonDeathKnight", 5, 4, 6, "demon-death-knight"],
    ["skeleton-spear", "spear", 5, 4, 5], ["skeleton-archer", "archer", 5, 4, 6],
    ["skeleton-cavalry", "knight", 5, 4, 6, "death-knight", "해골 기사"],
    ["grave-worm", "worm", 5, 4, 6], ["flesh-golem", "golem", 5, 5, 5], ["ghoul", "ghoul", 5, 4, 6],
    ["boulder-ogre", "ogre", 5, 4, 5, "ogre"], ["plague-doctor", "plague", 5, 4, 5],
    ["plague-frog", "plagueFrog", 5, 4, 5], ["hydra", "hydra", 5, 4, 6],
    ["minotaur", "minotaur", 6, 4, 6], ["yeti", "yeti", 6, 4, 7], ["ice-lord", "iceLord", 5, 4, 6],
    ["sea-wolf", "seaWolf", 5, 4, 6], ["spider-knight", "spiderQueen", 5, 4, 5, "spider-queen"],
    ["spiderling", "spiderling", 5, 4, 6], ["goblin-chief", "goblinChief", 5, 4, 5],
    ["goblin-commoner", "goblinCommoner", 5, 4, 6], ["goblin-soldier", "goblinSoldier", 6, 4, 5],
    ["grave-priest", "skeletonSummoner", 5, 4, 6, "skeleton-summoner", "해골 소환사"],
    ["doom-executor", "doomExecutor", 5, 4, 5], ["abyss-eye", "abyssEye", 5, 4, 6],
    ["hell-mantis", "hellMantis", 5, 4, 6], ["abyss-claw-hunter", "abyssClawHunter", 5, 4, 5],
    ["corpse-slime", "corpseSlime", 7, 4, 5],
    ["scorpion-knight", "scorpionKnight", 5, 3, 5],
    ["ancient-treant", "ancientTreant", 5, 4, 6], ["stone-golem", "stoneGolem", 5, 4, 5],
    ["kraken", "kraken", 5, 4, 6], ["crystal-devourer", "crystalDevourer", 5, 4, 7],
    ["raging-treant", "ragingTreant", 5, 4, 6], ["cerberus", "cerberus", 5, 4, 6, "cerberus", "케르베로스"],
    ["mushroom-soldier", "poisonMushroom", 5, 4, 6, "poison-mushroom", "버섯 병사"],
    ["goblin-rider", "goblinRider", 5, 4, 5], ["abyss-harpy", "abyssHarpy", 4, 4, 5],
    ["orc-warrior", "troll", 5, 4, 5, "troll"], ["bone-golem", "boneGolem", 5, 4, 5],
    ["forest-fairy", "forestFairy", 5, 4, 7], ["mummy-guardian", "mummyGuardian", 5, 4, 5],
    ["soul-reaper", "soulReaper", 6, 4, 6], ["bone-hound", "boneHound", 5, 4, 6],
    ["mimic", "mimic", 5, 4, 6], ["ice-princess", "icePrincess", 6, 4, 5], ["siren", "siren", 5, 4, 7],
    ["dracula", "dracula", 10, 1, 1, "dracula", "드라큘라"]
  ]);
  const RUNTIME_PREPARERS = Object.freeze({
    "guardian-seed": () => V2SeedFrames.prepare(),
    "goblin-soldier": () => V2GoblinFrames.prepare(), "ice-princess": () => V2PrincessFrames.prepare(),
    "bone-golem": () => V2BloodFrames.prepare(), "abyss-harpy": () => V2HarpyFrames.prepare(),
    hydra: () => V2HydraFrames.prepare(), "bone-hound": () => V2HoundFrames.prepare(),
    "scorpion-knight": () => V2ScorpionFrames.prepare(), "hell-mantis": () => V2MantisFrames.prepare(),
    dracula: () => V2DraculaFrames.prepare()
  });
  const DEFAULT_ALLY_BY_SLUG = new Map([...TEAM_DATA.ally, ...TEAM_DATA.enemy].map(entry => [entry.slug, entry]));
  const ROSTER = ROSTER_SPECS.map(([slug, type, attackFrames, hitFrames, deathFrames, portraitSlug = slug, name]) => {
    if (DEFAULT_ALLY_BY_SLUG.has(slug)) return { ...DEFAULT_ALLY_BY_SLUG.get(slug) };
    const definition = UNIT_TYPES[type];
    const design = V2DesignData.units[slug];
    if (!definition && design) {
      return unit(slug, name || design.name, design.hp, design.attack, design.speed, attackFrames, hitFrames, deathFrames, portraitSlug);
    }
    const gradePower = definition.grade === "hero" ? 3 : definition.grade === "advanced" ? 3 : definition.grade === "special" ? 1 : 2;
    const speed = Math.max(1, 6 - Math.min(5, definition.hp));
    const result = unit(slug, name || definition.label, definition.hp * 2 + 4, gradePower, speed, attackFrames, hitFrames, deathFrames, portraitSlug);
    if (slug === "flesh-golem") result.frameNumbers = { death: [1, 2, 3, 5, 6] };
    return result;
  });
  const ROSTER_BY_SLUG = new Map(ROSTER.map(entry => [entry.slug, entry]));
  const TEST_DECK_SLUGS = Object.freeze([
    "death-knight", "skeleton-spear", "skeleton-archer", "ghoul", "ancient-treant", "goblin-rider",
    "minotaur", "plague-doctor", "spider-knight", "hydra", "siren"
  ]);
  const BATTLE_TEST_ROSTER_SLUGS = Object.freeze([...TEST_DECK_SLUGS, "dracula"]);

  function weightedChoice(values, weights) {
    let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
    for (let index = 0; index < values.length; index += 1) {
      roll -= weights[index];
      if (roll <= 0) return values[index];
    }
    return values[values.length - 1];
  }

  function mapEncounterStage(value = mapContamination) {
    for (let index = MAP_ENCOUNTER_STAGES.length - 1; index >= 0; index -= 1) {
      if (value >= MAP_ENCOUNTER_STAGES[index].min) return MAP_ENCOUNTER_STAGES[index];
    }
    return MAP_ENCOUNTER_STAGES[0];
  }

  function createMapEnemySlugs() {
    const stage = mapEncounterStage();
    const count = weightedChoice(stage.counts, stage.countWeights);
    const gradeNames = ["normal", "advanced", "hero"];
    const gradeWeights = gradeNames.map((grade) => stage.grades[grade]);
    const available = ROSTER.filter((entry) => TEST_DECK_SLUGS.includes(entry.slug) && gradeNames.includes(entry.grade));
    const selected = [];
    while (selected.length < count && available.length) {
      const desiredGrade = weightedChoice(gradeNames, gradeWeights);
      let candidates = available.filter((entry) => entry.grade === desiredGrade);
      if (!candidates.length) candidates = available;
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      selected.push(pick.slug);
      available.splice(available.findIndex((entry) => entry.slug === pick.slug), 1);
    }
    return selected;
  }
  const COMBAT_SOUND_PROFILES = Object.freeze({
    physical: Object.freeze({ attack: "G", hit: "G" }),
    poison: Object.freeze({ attack: "B", hit: "E" }),
    toxicLiquid: Object.freeze({ attack: "B", hit: "E" }),
    magic: Object.freeze({ attack: "B", hit: "E" }),
    music: Object.freeze({ attack: "B", hit: "E" }),
    slash: Object.freeze({ attack: "D", hit: "K" }),
    bite: Object.freeze({ attack: "E", hit: "K" }),
    claw: Object.freeze({ attack: "E", hit: "K" }),
    wind: Object.freeze({ attack: "G", hit: "K" }),
    arrow: Object.freeze({ attack: "K", hit: "J" })
  });
  function combatSoundProfile(actor) {
    if (actor.slug === "skeleton-archer") return COMBAT_SOUND_PROFILES.arrow;
    const effect = typeof V2CombatEffects !== "undefined" ? V2CombatEffects.ATTACK_EFFECTS[actor.slug] : null;
    return COMBAT_SOUND_PROFILES[effect] || COMBAT_SOUND_PROFILES.physical;
  }
  const requestedAllySlugs = (battleQuery.get("allies") || "").split(",").filter((slug) => TEST_DECK_SLUGS.includes(slug));
  const requestedAllyInstanceIds = (battleQuery.get("allyIds") || "").split(",").filter(Boolean);
  let mapVictoryContaminationApplied = false;

  if (fromMap && globalThis.V2RunStateRuntime?.available) {
    await V2RunStateRuntime.bootstrap();
    await V2RunStateRuntime.flush();
  }

  function applyMapVictoryContamination() {
    if (!fromMap || mapVictoryContaminationApplied) return;
    mapVictoryContaminationApplied = true;
    try {
      if (typeof sessionStorage === "undefined") return;
      const markerKey = mapEncounterId ? `${MAP_CONTAMINATION_WIN_PREFIX}${mapEncounterId}` : "";
      if (markerKey && sessionStorage.getItem(markerKey) === "1") return;
      const current = Number(sessionStorage.getItem(MAP_CONTAMINATION_KEY));
      const next = Math.max(0, (Number.isFinite(current) ? current : 0) - 1);
      sessionStorage.setItem(MAP_CONTAMINATION_KEY, String(next));
      if (markerKey) sessionStorage.setItem(markerKey, "1");
    } catch (_) { /* Battle result must still complete if storage is blocked. */ }
  }

  const mapOwnedRoster = (() => {
    if (!fromMap) return new Map();
    try {
      const runRoster = globalThis.V2RunStateRuntime?.snapshot?.()?.ownedMonsters;
      const saved = Array.isArray(runRoster)
        ? runRoster
        : JSON.parse(sessionStorage.getItem(MAP_ROSTER_KEY));
      if (!Array.isArray(saved)) return new Map();
      return new Map(saved.filter((unit) => TEST_DECK_SLUGS.includes(unit?.slug) &&
        Number.isFinite(unit.maxHp) && Number.isFinite(unit.attack) && Number.isFinite(unit.speed) &&
        Array.isArray(unit.brands) && unit.brands.every(V2Rules.validateBrand))
        .map((unit) => [unit.instanceId || unit.slug, unit]));
    } catch (_) { return new Map(); }
  })();

  const battlefield = document.getElementById("battlefield");
  const initialBattlefield = fromMap
    ? (mapBattlefield || MAP_BATTLEFIELDS.default)
    : BATTLEFIELDS[Math.floor(Math.random() * BATTLEFIELDS.length)];

  function prepareBattlefieldBackground(src) {
    battlefield.classList.add("is-background-loading");
    battlefield.style.backgroundImage = "none";
    return new Promise((resolve) => {
      const image = new Image();
      let finished = false;
      const apply = () => {
        if (finished) return;
        finished = true;
        battlefield.style.backgroundImage = `url("${src}")`;
        battlefield.classList.remove("is-background-loading");
        resolve(src);
      };
      image.onload = () => {
        if (typeof image.decode === "function") image.decode().then(apply).catch(apply);
        else apply();
      };
      image.onerror = apply;
      image.src = src;
    });
  }

  const battlefieldBackgroundReady = prepareBattlefieldBackground(initialBattlefield);
  // Optional demonstration lineup; the normal 4v4 lineup stays unchanged.
  if (typeof location !== "undefined" && new URLSearchParams(location.search).get("effects") === "pixie-siren") {
    TEAM_DATA.ally.splice(0, 2,
      unit("forest-fairy", "픽시", 8, 2, 5, 5, 4, 7),
      unit("siren", "세이렌", 9, 2, 4, 5, 4, 7));
  }
  const allyTeam = document.getElementById("allyTeam");
  const enemyTeam = document.getElementById("enemyTeam");
  const allyActiveLegions = document.getElementById("allyActiveLegions");
  const enemyActiveLegions = document.getElementById("enemyActiveLegions");
  const message = document.getElementById("battleMessage");
  const roundState = document.getElementById("roundState");
  const startOverlay = document.getElementById("startOverlay");
  const startButton = document.getElementById("startButton");
  const allyLineupTab = document.getElementById("allyLineupTab");
  const enemyLineupTab = document.getElementById("enemyLineupTab");
  const lineupStatus = document.getElementById("lineupStatus");
  const selectedLineup = document.getElementById("selectedLineup");
  const selectedEnemyLineup = document.getElementById("selectedEnemyLineup");
  const allyLineupSummary = document.getElementById("allyLineupSummary");
  const enemyLineupSummary = document.getElementById("enemyLineupSummary");
  const unitRoster = document.getElementById("unitRoster");
  const resultOverlay = document.getElementById("resultOverlay");
  const resultTitle = document.getElementById("resultTitle");
  const resultBody = document.getElementById("resultBody");
  const pauseButton = document.getElementById("pauseButton");
  const speedButton = document.getElementById("speedButton");
  const restartButton = document.getElementById("restartButton");
  const turnDice = document.getElementById("turnDice");
  const turnDiceButton = document.getElementById("turnDiceButton");
  const turnDiceImage = document.getElementById("turnDiceImage");
  const unitInfoOverlay = document.getElementById("unitInfoOverlay");
  const unitInfoName = document.getElementById("unitInfoName");
  const unitInfoImage = document.getElementById("unitInfoImage");
  const unitInfoPortrait = document.getElementById("unitInfoPortrait");
  const unitInfoGrade = document.getElementById("unitInfoGrade");
  const unitInfoLegion = document.getElementById("unitInfoLegion");
  const unitInfoHp = document.getElementById("unitInfoHp");
  const unitInfoAttack = document.getElementById("unitInfoAttack");
  const unitInfoSpeed = document.getElementById("unitInfoSpeed");
  const unitInfoBrands = document.getElementById("unitInfoBrands");
  const legionInfoContent = document.getElementById("legionInfoContent");
  const capturePanel = document.getElementById("capturePanel");
  const captureStatus = document.getElementById("captureStatus");
  const captureOverflowOverlay = document.getElementById("captureOverflowOverlay");
  const captureOverflowStatus = document.getElementById("captureOverflowStatus");
  const captureOverflowCards = document.getElementById("captureOverflowCards");
  const captureOverflowConfirm = document.getElementById("captureOverflowConfirm");

  let units = [];
  let running = false;
  let paused = false;
  let actionBusy = false;
  const SPEED_PRESETS = Object.freeze({
    1: 1.5,
    2: 2.25,
    3: 3
  });
  const PRESENTATION_SPEED_CAP = 1.2;
  function battleDuration(milliseconds, minimum = 0) {
    return Math.max(minimum, milliseconds / speedMultiplier);
  }
  function presentationDuration(milliseconds, minimum = 0) {
    return Math.max(minimum, milliseconds / Math.min(speedMultiplier, PRESENTATION_SPEED_CAP));
  }
  function battleWait(milliseconds, minimum = 0) {
    return wait(battleDuration(milliseconds, minimum));
  }
  function presentationWait(milliseconds, minimum = 0) {
    return wait(presentationDuration(milliseconds, minimum));
  }
  let speedLevel = 1;
  let speedMultiplier = SPEED_PRESETS[speedLevel];
  let battleToken = 0;
  const presentation = typeof V2Presentation !== "undefined"
    ? V2Presentation.create({
        guard: (event) => event.token == null || (event.token === battleToken && running)
      })
    : Object.freeze({
        play: async (_event, presenter) => typeof presenter === "function" ? presenter() : undefined,
        sequence: async () => undefined,
        flush: async () => undefined,
        clear: () => {},
        snapshot: () => []
      });
  let actionCount = 0;
  let turnNumber = 0;
  let turnQueue = [];
  let awaitingRoll = false;
  let diceRolling = false;
  let lastDiceRoll = null;
  let diceFrameIndex = 0;
  let introRunning = false;
  let loadingLineup = false;
  let legionState = null;
  let rulesState = null;
  let battleRng = V2BattleRng.create();
  const battleRandom = () => battleRng.next();
  const BATTLE_SAVE_KEY = 'necromancer-v2-battle-v1';
  const BATTLE_CHECKPOINT_VERSION = 3;

  function battleCheckpointContext() {
    return {
      fromMap,
      encounterId: mapEncounterId,
      mapId: battleQuery.get("map") || "",
      tile: Number(battleQuery.get("tile")) || null,
      encounterType: mapEncounterType,
      allyIds: [...requestedAllyInstanceIds],
      allies: [...requestedAllySlugs]
    };
  }

  function checkpointMatchesCurrentBattle(saved) {
    if (!saved || saved.phase === "complete" || !saved.state) return false;
    const context = saved.context;
    if (!fromMap) return !context || context.fromMap === false;
    if (!context || context.fromMap !== true) return false;
    return context.encounterId === mapEncounterId &&
      context.mapId === (battleQuery.get("map") || "") &&
      Number(context.tile) === (Number(battleQuery.get("tile")) || null) &&
      context.encounterType === mapEncounterType;
  }

  function readLocalBattleCheckpoint() {
    if (typeof localStorage === "undefined") return null;
    try {
      const saved = JSON.parse(localStorage.getItem(BATTLE_SAVE_KEY));
      return checkpointMatchesCurrentBattle(saved) ? saved : null;
    } catch (_) {
      return null;
    }
  }

  function readRunStateBattleCheckpoint() {
    const saved = globalThis.V2RunStateRuntime?.snapshot?.()?.battle;
    return checkpointMatchesCurrentBattle(saved) ? saved : null;
  }

  function battleCheckpointTimestamp(saved) {
    const value = Date.parse(saved?.savedAt || "");
    return Number.isFinite(value) ? value : 0;
  }

  function loadBattleCheckpoint() {
    const runSaved = readRunStateBattleCheckpoint();
    const localSaved = readLocalBattleCheckpoint();
    if (!runSaved) return localSaved;
    if (!localSaved) return runSaved;
    return battleCheckpointTimestamp(localSaved) > battleCheckpointTimestamp(runSaved) ? localSaved : runSaved;
  }

  function captureUnitKey(unitState) {
    return unitState ? `${unitState.team}:${unitState.slot}:${unitState.slug}` : null;
  }

  function captureCheckpointState() {
    const targets = {};
    for (const unitState of units.filter((unit) => unit.team === "enemy" && !unit.alive && !unit.isSummon)) {
      if (Number.isInteger(unitState.captureTarget)) targets[captureUnitKey(unitState)] = unitState.captureTarget;
    }
    return {
      selectedKey: captureUnitKey(selectedCorpse),
      attemptsLeft: captureAttemptsLeft,
      targetLocked: captureTargetLocked,
      targets
    };
  }

  function createBattleCheckpoint(phase) {
    return {
      version: BATTLE_CHECKPOINT_VERSION,
      savedAt: new Date().toISOString(),
      context: battleCheckpointContext(),
      state: V2Rules.snapshot(rulesState),
      rng: battleRng.snapshot(),
      capture: phase.startsWith("capture-") ? captureCheckpointState() : null,
      phase,
      roll: lastDiceRoll,
      actions: actionCount,
      queue: turnQueue.map((unitState) => units.indexOf(unitState))
    };
  }

  function saveBattle(phase) {
    if (!rulesState) return null;
    const checkpoint = createBattleCheckpoint(phase);
    if (typeof localStorage !== "undefined") {
      try { localStorage.setItem(BATTLE_SAVE_KEY, JSON.stringify(checkpoint)); }
      catch(error) { console.warn('전투 저장 실패',error); message.textContent += ' · 저장 실패'; }
    }
    if (phase !== "complete" && phase !== "capture-complete" && fromMap && globalThis.V2RunStateRuntime?.available) {
      V2RunStateRuntime.setBattleCheckpoint(checkpoint, `battle-${phase}`);
    }
    return checkpoint;
  }

  async function resumeBattle() {
    try {
      if (globalThis.V2RunStateRuntime?.available) await V2RunStateRuntime.flush();
      const saved = loadBattleCheckpoint();
      if (!saved) return false;
      battleRng = saved.rng ? V2BattleRng.restore(saved.rng) : V2BattleRng.create();
      const restored=V2Rules.restore(saved.state, battleRandom);
      for (const u of restored.units) {
        const data=u.slug==='guardian-seed'?unit('guardian-seed','씨앗',6,0,1,5,3,4):{...ROSTER_BY_SLUG.get(u.slug)};
        await prepareSelectedMotion(data);
        for(const k of ['portrait','infoPortrait','portraitBounds','frames','frameNumbers','motionFrames'])u[k]=data[k];
        u.gauge=u.alive?100:0;u.brandDisplayMode=V2Rules.mode(u.brands[0],saved.roll);
      }
      battleToken++;rulesState=restored;units=restored.units;legionState=restored.legions;turnNumber=restored.round;
      lastDiceRoll=saved.roll;actionCount=saved.actions||0;turnQueue=(saved.queue||[]).map(i=>units[i]).filter(Boolean);
      running=true;paused=false;actionBusy=false;awaitingRoll=false;diceRolling=false;introRunning=false;
      startOverlay.hidden=true;resultOverlay.hidden=true;renderTeams();
      for(const u of units){revealUnit(u);if(!u.alive)u.image.src=frame(u,'death',u.frames.death);}
      updateHud();speedButton.disabled=false;
      document.getElementById('resumeBattleButton').hidden = true;
      if (saved.phase === "capture-complete") {
        running = false;
        await returnToMap();
      } else if (saved.phase?.startsWith("capture-")) {
        running = false;
        pauseButton.disabled = true;
        speedButton.disabled = true;
        const restoredCapture = setupCorpseCapture(true, saved.capture);
        if (!restoredCapture) return false;
        if (saved.phase === "capture-success") {
          await completeCaptureSuccess();
        } else if (saved.phase === "capture-failed") {
          await returnToMap();
        } else {
          message.textContent = saved.phase === "capture-locked"
            ? "영혼 수확 재개 · 선택한 시체로 계속 굴리세요"
            : "영혼 수확 재개 · 시체를 선택하세요";
        }
      } else if(saved.phase==='ready')beginTurnIntermission(false);
      else {turnDice.hidden=true;pauseButton.disabled=false;message.textContent=`${turnNumber}턴 전투 재개`;}
      return true;
    } catch(error) {
      console.error(error);
      lineupStatus.textContent='저장된 전투를 불러오지 못했습니다. 원본 저장은 유지됩니다.';
      return false;
    }
  }
  let selectedCorpse = null;
  let captureAttemptsLeft = 0;
  let captureTargetLocked = false;
  let lineupRequest = 0;
  let lineupSide = "ally";
  let selectedAllySlugs = requestedAllySlugs.length >= 1 && requestedAllySlugs.length <= 4 ? requestedAllySlugs : [];
  let selectedAllyInstanceIds = fromMap && requestedAllyInstanceIds.length === selectedAllySlugs.length &&
    requestedAllyInstanceIds.every((instanceId, index) => mapOwnedRoster.get(instanceId)?.slug === selectedAllySlugs[index])
      ? requestedAllyInstanceIds : [];
  if (fromMap && selectedAllyInstanceIds.length !== selectedAllySlugs.length) selectedAllySlugs = [];
  let selectedEnemySlugs = fromMap ? createMapEnemySlugs() : TEAM_DATA.enemy.map(entry => entry.slug);
  let rosterTouchScroll = null;
  let selectedAllyTeam = TEAM_DATA.ally.map(entry => ({ ...entry }));
  let selectedEnemyTeam = TEAM_DATA.enemy.map(entry => ({ ...entry }));

  [...DICE_ROLL_FRAMES, ...DICE_RESULT_FRAMES].forEach((src) => { const image = new Image(); image.src = src; });

  function unit(slug, name, maxHp, attack, speed, attackFrames, hitFrames, deathFrames, portraitSlug = slug) {
    const definition = typeof UNIT_TYPES !== "undefined" ? UNIT_TYPES[UNIT_TYPE_KEYS[slug]] : null;
    const grade = definition?.grade;
    const legions = definition?.legion == null ? [] : [].concat(definition.legion);
    const design = V2DesignData.units[slug];
    const customPortrait = slug === "dracula" ? "art/v2-style/ui/info-portraits/dracula.png?v=1" : null;
    return { slug, name: design?.name || name, maxHp: design?.hp ?? maxHp, attack: design?.attack ?? attack, speed: design?.speed ?? speed, grade: design?.grade || grade, legions: design?.legions || legions, portrait: customPortrait || `art/v2-style/processed/192/${portraitSlug}.png`, infoPortrait: customPortrait || INFO_PORTRAIT_ART[slug] || null, cardArt: customPortrait, portraitBounds: PORTRAIT_BOUNDS[portraitSlug] || [0, 0, 192, 192], frames: { attack: attackFrames, hit: hitFrames, death: deathFrames } };
  }

  function frame(unitState, motion, index) {
    const prepared = unitState.motionFrames?.[motion];
    if (prepared) return prepared[Math.min(index - 1, prepared.length - 1)];
    const frameNumber = unitState.frameNumbers?.[motion]?.[index - 1] || index;
    const revision = ["death-knight", "ancient-treant", "skeleton-spear", "stone-golem", "goblin-rider"].includes(unitState.slug) ? "?v=20260907-size2" : ["goblin-commoner", "ice-lord"].includes(unitState.slug) ? "?v=20260907" : "";
    return `${FRAME_ROOT}${unitState.slug}/${motion}-${String(frameNumber).padStart(2, "0")}.png${revision}`;
  }

  async function prepareSelectedMotion(entry) {
    const prepare = RUNTIME_PREPARERS[entry.slug];
    if (!prepare || entry.motionFrames) return entry;
    try {
      const motionFrames = await prepare();
      entry.motionFrames = motionFrames;
      entry.frames = { attack: motionFrames.attack.length, hit: motionFrames.hit.length, death: motionFrames.death.length };
    } catch (error) {
      // Map battles must not be blocked by an optional runtime motion asset.
      // Keep the unit's normal frame paths/counts and continue into combat.
      console.warn(`유닛 모션 준비 실패 · 기본 프레임으로 진행: ${entry.slug}`, error);
      delete entry.motionFrames;
    }
    return entry;
  }


  function preloadImageForBattle(src) {
    return new Promise((resolve) => {
      const image = new Image();
      let settled = false;
      const finish = (loaded) => {
        if (settled) return;
        settled = true;
        resolve(loaded);
      };
      image.decoding = "async";
      image.onload = () => {
        if (typeof image.decode === "function") image.decode().then(() => finish(true)).catch(() => finish(true));
        else finish(true);
      };
      image.onerror = () => finish(false);
      image.src = src;
    });
  }

  async function preloadBattleImages(urls, concurrency = 6) {
    const queue = [...urls];
    if (!queue.length) return;
    const workerCount = Math.min(concurrency, queue.length);
    await Promise.all(Array.from({ length: workerCount }, async () => {
      while (queue.length) {
        const src = queue.shift();
        await preloadImageForBattle(src);
      }
    }));
  }

  async function preloadBattleVisuals(entries) {
    const frameUrls = new Set();
    for (const entry of entries) {
      for (const motion of ["attack", "hit", "death"]) {
        const count = entry.frames?.[motion] || 0;
        for (let index = 1; index <= count; index += 1) frameUrls.add(frame(entry, motion, index));
      }
    }
    await preloadBattleImages(frameUrls, 6);

    if (typeof V2CombatEffects !== "undefined") {
      const effectRepresentatives = new Map();
      for (const entry of entries) {
        const effectId = V2CombatEffects.ATTACK_EFFECTS?.[entry.slug];
        if (effectId && !effectRepresentatives.has(effectId)) effectRepresentatives.set(effectId, entry.slug);
      }
      for (const slug of effectRepresentatives.values()) {
        try { await V2CombatEffects.prepare(slug); }
        catch (error) { console.warn(`타격 효과 준비 실패 · 효과 없이 진행: ${slug}`, error); }
      }
    }

    if (typeof V2Sfx !== "undefined") V2Sfx.preload();
  }

  function resetBattle(showStart) {
    presentation.clear();
    battlefield.classList.remove("is-cinematic");
    if (showStart) {
      lineupRequest += 1;
      loadingLineup = false;
      lineupSide = "ally";
      startButton.textContent = "확인";
    }
    battleToken += 1;
    running = false;
    introRunning = false;
    paused = false;
    actionBusy = false;
    actionCount = 0;
    turnNumber = 0;
    turnQueue = [];
    awaitingRoll = false;
    diceRolling = false;
    lastDiceRoll = null;
    diceFrameIndex = 0;
    selectedCorpse = null;
    captureAttemptsLeft = 0;
    captureTargetLocked = false;
    speedLevel = 1;
    speedMultiplier = SPEED_PRESETS[speedLevel];
    speedButton.textContent = "속도 ×1";
    pauseButton.textContent = "일시정지";
    pauseButton.disabled = true;
    speedButton.disabled = true;
    resultOverlay.hidden = true;
    capturePanel.hidden = true;
    battlefield.classList.remove("is-corpse-capture");
    captureStatus.textContent = "시체를 선택하세요.";
    startOverlay.hidden = !showStart;
    if (showStart) renderRosterSelection();
    turnDice.hidden = true;
    turnDiceButton.disabled = false;
    turnDiceButton.classList.remove("is-rolling");
    turnDiceImage.src = DICE_ROLL_FRAMES[0];
    unitInfoOverlay.hidden = true;
    battlefield.classList.remove("is-between-turns");
    if (!battlefield.classList.contains("is-background-loading")) {
      battlefield.style.backgroundImage = `url("${initialBattlefield}")`;
    }
    units = [
      ...selectedAllyTeam.map((data, slot) => makeState(data, "ally", slot)),
      ...selectedEnemyTeam.map((data, slot) => makeState(data, "enemy", slot))
    ];
    battleRng = V2BattleRng.create();
    rulesState = V2Rules.create(units, battleRandom);
    legionState = rulesState.legions;
    if (fromMap) {
      for (const unitState of units.filter((unit) => unit.team === "ally" && !unit.isSummon)) {
        const owned = unitState.instanceId ? mapOwnedRoster.get(unitState.instanceId) : null;
        if (!owned || !Number.isFinite(owned.currentHp)) continue;
        const temporaryMaxBonus = Math.max(0, unitState.maxHp - unitState.baseMaxHp);
        unitState.hp = Math.max(1, Math.min(unitState.maxHp, owned.currentHp + temporaryMaxBonus));
        unitState.alive = unitState.hp > 0;
      }
    }
    renderTeams();
    if (typeof V2UnitCards !== "undefined") V2UnitCards.setPhase("locked");
    message.textContent = "전투 시작을 눌러주세요";
    updateHud();
  }

  function makeState(data, team, slot) {
    const owned = team === "ally" && slot < 4 && data.instanceId ? mapOwnedRoster.get(data.instanceId) : null;
    const generated = owned ? JSON.parse(JSON.stringify(owned)) : V2Rules.individual(data.slug);
    return V2Rules.init({ ...data, ...generated, instanceId: data.instanceId || generated.instanceId || null, team, slot, gauge: 0, brand: generated.brands[0]?.type, brandMode: "normal", brandDisplayMode: "normal", element: null, image: null });
  }

  function renderTeams() {
    allyTeam.replaceChildren();
    enemyTeam.replaceChildren();
    enemyTeam.append(makeSummonSlot("적군"));
    for (const unitState of units) {
      const element = createUnitElement(unitState);
      (unitState.team === "ally" ? allyTeam : enemyTeam).append(element);
    }
    allyTeam.append(makeSummonSlot("아군"));
    renderActiveLegions();
    if (typeof V2UnitCards !== "undefined") V2UnitCards.sync(battlefield, units, openUnitInfo);
  }

  function renderActiveLegions() {
    for (const [team, host] of [["ally", allyActiveLegions], ["enemy", enemyActiveLegions]]) {
      host.replaceChildren();
      const keys = Object.keys(V2Rules.RULES).filter(key => {
        return V2Rules.active(legionState, team, key);
      });
      if (!keys.length) {
        const empty = document.createElement("em");
        empty.className = "team-legion-empty";
        empty.textContent = V2Rules.suppressed(legionState, team) ? "상대 원소로 억제" : "없음";
        host.append(empty);
        continue;
      }
      for (const key of keys) {
        const rule = V2Rules.RULES[key];
        const count = legionState.teams[team].counts[key] || 0;
        const slot = document.createElement("div");
        slot.className = "active-legion-slot";
        slot.title = `${rule.name} ${count}/${rule.need} · ${rule.effect}`;
        slot.setAttribute("aria-label", slot.title);
        const name = document.createElement("strong");
        name.textContent = rule.name;
        const threshold = document.createElement("small");
        threshold.textContent = `${count}/${rule.need}`;
        slot.append(name, threshold);
        host.append(slot);
      }
    }
  }

  function createUnitElement(unitState) {
      const element = document.createElement("article");
      element.className = unitState.team === "ally" ? "unit is-pending" : "unit";
      element.dataset.unit = unitState.slug;
      element.tabIndex = -1;
      if (unitState.team === "ally") element.setAttribute("aria-hidden", "true");
      element.setAttribute("role", "img");
      element.setAttribute("aria-label", unitState.name);
      element.innerHTML = `
        <div class="persistent-statuses" aria-live="polite">
          <span class="unit-status unit-status-freeze" data-status="freeze" hidden><img src="art/v2-style/ui/freeze-status-label.png?v=2" alt="빙결"></span>
          <span class="unit-status unit-status-poison" data-status="poison" hidden>중독</span>
        </div>
        <span class="brand-indicator" aria-live="polite" hidden></span>
        <div class="bar hp-bar" role="progressbar" aria-label="${unitState.name} 체력" aria-valuemin="0"><i></i></div>
        <div class="sprite-wrap"><img src="${frame(unitState, "attack", 1)}" alt="${unitState.name}"></div>`;
      unitState.element = element;
      unitState.image = element.querySelector(".sprite-wrap > img");
      if (typeof V2UnitSize !== "undefined") V2UnitSize.attach(unitState);
      updateUnit(unitState);
      return element;
  }

  function makeSummonSlot(teamName) {
    const slot = document.createElement("article");
    slot.className = "summon-slot";
    slot.setAttribute("aria-label", `${teamName} 소환물 생성 자리`);
    return slot;
  }

  function showDamage(unitState, amount) {
    if (!Number.isFinite(amount) || amount <= 0 || !unitState.element) return;
    const number = document.createElement("span");
    number.className = "damage-number";
    number.textContent = `-${amount}`;
    number.setAttribute("aria-label", `${amount} 피해`);
    if (typeof V2DamageDigits !== "undefined") V2DamageDigits.render(number, amount);
    unitState.element.querySelector(".sprite-wrap").append(number);
    number.addEventListener("animationend", () => number.remove(), { once: true });
  }

  function showHealing(unitState, amount) {
    if (!Number.isFinite(amount) || amount <= 0 || !unitState.element) return;
    const number = document.createElement("span");
    number.className = "healing-number";
    number.textContent = `+${amount} 회복`;
    number.setAttribute("aria-label", `체력 ${amount} 회복`);
    if (typeof V2DamageDigits !== "undefined") V2DamageDigits.renderHealing(number, amount);
    unitState.element.querySelector(".sprite-wrap").append(number);
    number.addEventListener("animationend", () => number.remove(), { once: true });
  }

  function updateUnit(unitState) {
    if (!unitState.element) return;
    const bar = unitState.element.querySelector(".hp-bar");
    bar.setAttribute("aria-valuenow", String(Math.max(0, unitState.hp)));
    bar.setAttribute("aria-valuemax", String(unitState.maxHp));
    unitState.element.querySelector(".hp-bar i").style.width = `${Math.max(0, unitState.hp / unitState.maxHp * 100)}%`;
    unitState.element.classList.toggle("is-ready", unitState.alive && unitState.gauge >= 100);
    unitState.element.classList.toggle("is-dead", !unitState.alive);
    unitState.element.classList.toggle("is-frozen", unitState.alive && Boolean(unitState.frozen));
    unitState.element.classList.toggle("is-poisoned", unitState.alive && Boolean(unitState.poison));
    unitState.element.querySelector('[data-status="freeze"]').hidden = !unitState.alive || !unitState.frozen;
    unitState.element.querySelector('[data-status="poison"]').hidden = !unitState.alive || !unitState.poison;
    updateBrandIndicator(unitState);
    if (typeof V2UnitCards !== "undefined") V2UnitCards.update(unitState);
  }

  function updateBrandIndicator(unitState, pulse = false) {
    if (!unitState.element) return;
    const label = unitState.element.querySelector(".brand-indicator");
    const previewRoll = 'brandPreviewRoll' in unitState ? unitState.brandPreviewRoll : lastDiceRoll;
    const effects = (unitState.brands || [])
      .map((brandState) => ({
        definition: V2Rules.definitions[brandState.type],
        mode: V2Rules.mode(brandState, previewRoll)
      }))
      .filter((effect) => effect.definition && effect.mode !== "normal");
    const visible = unitState.alive && Number.isInteger(previewRoll) && effects.length;
    label.hidden = !visible;
    label.replaceChildren();
    if (!visible) {
      label.className = "brand-indicator";
      return;
    }

    label.className = "brand-indicator";
    for (const effect of effects) {
      const chip = document.createElement("span");
      chip.className = `brand-cause-chip is-${effect.mode}`;
      const trigger = document.createElement("b");
      const arrow = document.createElement("i");
      const effectName = document.createElement("strong");
      trigger.textContent = `${effect.mode === "blessing" ? "✦" : "☠"} ${previewRoll}`;
      arrow.textContent = "→";
      effectName.textContent = effect.definition.name.replace("의 낙인", "");
      chip.append(trigger, arrow, effectName);
      label.append(chip);
    }

    if (pulse) {
      label.classList.remove("is-triggered");
      void label.offsetWidth;
      label.classList.add("is-triggered");
      unitState.element.classList.remove("has-brand-trigger");
      void unitState.element.offsetWidth;
      unitState.element.classList.add("has-brand-trigger");
      window.setTimeout(() => {
        label.classList.remove("is-triggered");
        unitState.element?.classList.remove("has-brand-trigger");
      }, presentationDuration(1100, 700));
    }
  }

  function showRolledBrands(roll) {
    for (const unitState of units) {
      unitState.brandPreviewRoll = roll;
      unitState.brandDisplayMode = V2Rules.mode(unitState.brands[0], roll);
      updateBrandIndicator(unitState, Number.isInteger(roll));
    }
  }

  function updateHud() {
    const allyAlive = aliveUnits("ally").length;
    const enemyAlive = aliveUnits("enemy").length;
    roundState.textContent = `${allyAlive} VS ${enemyAlive}`;
    renderActiveLegions();
  }

  function aliveUnits(team) {
    return units.filter((unitState) => unitState.team === team && unitState.alive);
  }

  function revealUnit(unitState) {
    unitState.element.classList.remove("is-pending");
    unitState.element.classList.add("is-arriving");
    unitState.element.removeAttribute("aria-hidden");
    unitState.element.tabIndex = -1;
  }

  function isLineupReady() {
    if (fromMap) return selectedAllySlugs.length >= 1 && selectedAllySlugs.length <= 4 &&
      selectedEnemySlugs.length >= 1 && selectedEnemySlugs.length <= 4;
    return selectedAllySlugs.length === 4 && selectedEnemySlugs.length === 4;
  }

  function renderRosterSelection(notice = "") {
    const scrollTop = unitRoster.scrollTop;
    const renderSelectedTeam = (host, slugs) => {
      host.replaceChildren();
      for (let index = 0; index < 4; index += 1) {
        const slot = document.createElement("div");
        const selected = ROSTER_BY_SLUG.get(slugs[index]);
        slot.className = selected ? "selected-slot" : "selected-slot is-empty";
        if (selected) {
          const card = document.createElement("img");
          card.src = selected.cardArt || `art/v2-style/ui/unit-card-${selected.slug}.png?v=19`;
          card.alt = `${index + 1}번째 ${selected.name}`;
          slot.title = `${selected.name} 선택 해제`;
          slot.addEventListener("click", () => toggleRosterUnit(selected.slug));
          slot.append(card);
        } else slot.setAttribute("aria-label", `${index + 1}번째 빈 자리`);
        host.append(slot);
      }
    };
    renderSelectedTeam(selectedLineup, selectedAllySlugs);
    renderSelectedTeam(selectedEnemyLineup, selectedEnemySlugs);
    allyLineupTab.classList.toggle("is-active", lineupSide === "ally");
    enemyLineupTab.classList.toggle("is-active", lineupSide === "enemy");
    allyLineupTab.setAttribute("aria-pressed", String(lineupSide === "ally"));
    enemyLineupTab.setAttribute("aria-pressed", String(lineupSide === "enemy"));
    allyLineupSummary.classList.toggle("is-active", lineupSide === "ally");
    enemyLineupSummary.classList.toggle("is-active", lineupSide === "enemy");
    const activeSlugs = lineupSide === "ally" ? selectedAllySlugs : selectedEnemySlugs;
    unitRoster.replaceChildren();
    for (const slug of (fromMap ? TEST_DECK_SLUGS : BATTLE_TEST_ROSTER_SLUGS)) {
      const entry = ROSTER_BY_SLUG.get(slug);
      const selectedIndex = activeSlugs.indexOf(entry.slug);
      const button = document.createElement("button");
      button.type = "button";
      button.disabled = loadingLineup;
      button.dataset.unit = entry.slug;
      button.classList.toggle("is-selected", selectedIndex >= 0);
      button.setAttribute("aria-pressed", String(selectedIndex >= 0));
      button.setAttribute("aria-label", `${entry.name}${selectedIndex >= 0 ? `, ${selectedIndex + 1}번째 선택됨` : " 선택"}`);
      const order = document.createElement("b");
      order.textContent = selectedIndex >= 0 ? String(selectedIndex + 1) : "";
      const image = document.createElement("img");
      image.src = entry.cardArt || `art/v2-style/ui/unit-card-${entry.slug}.png?v=19`;
      image.alt = "";
      const name = document.createElement("span");
      name.textContent = entry.name;
      button.append(order, image, name);
      button.addEventListener("click", () => toggleRosterUnit(entry.slug));
      unitRoster.append(button);
    }
    unitRoster.scrollTop = scrollTop;
    lineupStatus.textContent = notice || `마물 카드 ${selectedAllySlugs.length} / 4`;
    startButton.disabled = loadingLineup || !isLineupReady();
  }

  function toggleRosterUnit(slug) {
    if (loadingLineup || !ROSTER_BY_SLUG.has(slug)) return;
    const activeSlugs = lineupSide === "ally" ? selectedAllySlugs : selectedEnemySlugs;
    const selectedIndex = activeSlugs.indexOf(slug);
    if (selectedIndex >= 0) activeSlugs.splice(selectedIndex, 1);
    else if (activeSlugs.length < 4) activeSlugs.push(slug);
    else return renderRosterSelection("4명까지 선택할 수 있습니다. 먼저 한 명을 해제하세요.");
    renderRosterSelection();
  }

  function beginRosterTouchScroll(event) {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    rosterTouchScroll = { x: touch.clientX, y: touch.clientY, top: unitRoster.scrollTop };
  }

  function moveRosterTouchScroll(event) {
    if (!rosterTouchScroll || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - rosterTouchScroll.x;
    const deltaY = touch.clientY - rosterTouchScroll.y;
    const physicalDelta = Math.abs(deltaY) >= Math.abs(deltaX) ? deltaY : deltaX;
    if (Math.abs(physicalDelta) < 2) return;
    unitRoster.scrollTop = rosterTouchScroll.top - physicalDelta;
    event.preventDefault();
  }

  function endRosterTouchScroll() {
    rosterTouchScroll = null;
  }

  function selectLineupSide(team) {
    if (loadingLineup || !["ally", "enemy"].includes(team)) return;
    lineupSide = team;
    renderRosterSelection();
  }

  async function startSelectedBattle() {
    if (!isLineupReady() || introRunning || running || loadingLineup) return;
    const request = ++lineupRequest;
    loadingLineup = true;
    renderRosterSelection();
    startButton.disabled = true;
    startButton.textContent = "준비 중…";
    lineupStatus.textContent = "선택한 마물을 전장에 준비하고 있습니다.";
    try {
      const preparedAllyTeam = fromMap && selectedAllyInstanceIds.length === selectedAllySlugs.length
        ? selectedAllyInstanceIds.map((instanceId, index) => ({ ...ROSTER_BY_SLUG.get(selectedAllySlugs[index]), instanceId }))
        : selectedAllySlugs.map((slug) => ({ ...ROSTER_BY_SLUG.get(slug) }));
      const preparedEnemyTeam = selectedEnemySlugs.map(slug => ({ ...ROSTER_BY_SLUG.get(slug) }));
      await Promise.all([...preparedAllyTeam, ...preparedEnemyTeam].map(prepareSelectedMotion));
      if (request !== lineupRequest) return;
      lineupStatus.textContent = "전투 애니메이션과 타격 효과를 준비하고 있습니다.";
      await Promise.all([
        preloadBattleVisuals([...preparedAllyTeam, ...preparedEnemyTeam]),
        battlefieldBackgroundReady
      ]);
      if (request !== lineupRequest) return;
      selectedAllyTeam = preparedAllyTeam;
      selectedEnemyTeam = preparedEnemyTeam;
      resetBattle(false);
      await beginBattle();
    } catch (error) {
      if (request !== lineupRequest) return;
      loadingLineup = false;
      console.error(error);
      if (fromMap) {
        // The deck was already selected on the map. Never reopen the battle
        // deck-selection overlay as an error screen.
        startOverlay.hidden = true;
        message.textContent = "전투 준비 중 일부 자산을 불러오지 못했습니다.";
      } else {
        startOverlay.hidden = false;
        renderRosterSelection("전투 자산을 불러오지 못했습니다. 다시 시도해 주세요.");
      }
    } finally {
      if (request !== lineupRequest) return;
      loadingLineup = false;
      startButton.textContent = "확인";
      startButton.disabled = !isLineupReady();
    }
  }

  async function beginBattle() {
    if (running || introRunning) return;
    introRunning = true;
    actionBusy = true;
    const token = battleToken;
    const isCurrent = () => token === battleToken && introRunning;
    if (window.V2Landscape) window.V2Landscape.request();
    startOverlay.hidden = true;
    resultOverlay.hidden = true;
    paused = false;
    pauseButton.disabled = true;
    speedButton.disabled = true;
    turnDice.hidden = true;
    message.textContent = "아군을 소환합니다";
    let summonFrames = null;
    try { summonFrames = await V2SummonEffect.prepare(); }
    catch (error) { console.warn("소환 효과 로딩 실패 · 등장 연출만 진행합니다.", error); }
    if (!isCurrent()) return;
    const allies = units.filter(unitState => unitState.team === "ally").sort((a, b) => a.slot - b.slot);
    for (const unitState of allies) {
      if (!isCurrent()) return;
      message.textContent = `${unitState.name} 소환`;
      if (summonFrames) {
        try { await V2SummonEffect.play(unitState, summonFrames, { isCurrent, reveal: revealUnit, wait }); }
        catch (error) {
          if (!isCurrent()) return;
          console.warn("소환 효과 재생 실패", error);
          revealUnit(unitState);
          await wait(360);
        }
      } else { revealUnit(unitState); await wait(360); }
      if (!isCurrent()) return;
      unitState.element.classList.remove("is-arriving");
      await wait(80);
    }
    if (!isCurrent()) return;
    introRunning = false;
    actionBusy = false;
    running = true;
    speedButton.disabled = false;
    beginTurnIntermission(true);
  }

  function recoverBattleFlow(error, phase = "전투 처리") {
    presentation.clear();
    console.error(`${phase} 오류`, error);
    if (!running) return;
    actionBusy = false;
    introRunning = false;
    battlefield.classList.remove("is-cinematic");
    for (const unitState of units) {
      unitState.element?.classList.remove("is-attacking", "is-targeted", "is-hit");
      const liveImage = unitState.element?.querySelector(".sprite-wrap > img") || unitState.image;
      if (liveImage) {
        unitState.image = liveImage;
        if (unitState.alive) liveImage.src = frame(unitState, "attack", 1);
      }
      updateUnit(unitState);
    }
    updateHud();
    if (!aliveUnits("ally").length || !aliveUnits("enemy").length) {
      finishBattle();
      return;
    }
    message.textContent = `${phase} 연출 오류 복구 · 전투 계속`;
  }

  function battleLoop() {
    if (running && !paused && !actionBusy && !awaitingRoll) {
      let actor = turnQueue.shift();
      while (actor && !actor.alive) actor = turnQueue.shift();
      if (actor) {
        performAttack(actor, battleToken).catch((error) => recoverBattleFlow(error, "공격"));
      } else beginTurnIntermission(false);
    }
    requestAnimationFrame(battleLoop);
  }

  async function startTurn() {
    if (typeof V2UnitCards !== "undefined") V2UnitCards.setPhase("acting");
    if (!running) return;
    if (!aliveUnits("ally").length || !aliveUnits("enemy").length) return finishBattle();
    awaitingRoll = false;
    diceRolling = false;
    turnDice.hidden = true;
    battlefield.classList.remove("is-between-turns");
    closeUnitInfo();
    pauseButton.disabled = false;
    turnNumber += 1;
    actionBusy = true;
    const token = battleToken;
    const plans = V2Rules.begin(rulesState);
    const undeadHealing = rulesState.events.filter(event => event.type === "heal" && event.source === "skeleton");
    if (undeadHealing.length) {
      units.forEach(updateUnit);
      undeadHealing.forEach(event => showHealing(event.unit, event.amount));
      message.textContent = `언데드 군단 · 체력 ${undeadHealing.reduce((sum, event) => sum + event.amount, 0)} 회복`;
      await battleWait(380, 220);
      if (token !== battleToken || !running) return;
    }
    for (const plan of plans) await summonFromPlan(plan, token);
    if (token !== battleToken || !running) return;
    for (const bloom of V2Rules.bloomPlans(rulesState)) {
      const seed = bloom.seed;
      await playMotion(seed, "attack", seed.frames.attack, token, true);
      if (token !== battleToken || !running) return;
      const plant = makeState({ ...ROSTER_BY_SLUG.get("crystal-devourer") }, seed.team, seed.slot);
      const plantDesign = V2DesignData.units['crystal-devourer'];
      Object.assign(plant, {maxHp:plantDesign.hp, attack:plantDesign.attack, speed:plantDesign.speed});
      if (!V2Rules.bloomSeed(rulesState, seed, plant)) continue;
      const node = seed.element || (plant.team === "ally" ? allyTeam : enemyTeam).querySelector(".summon-slot");
      node.replaceWith(createUnitElement(plant));
      revealUnit(plant);
      if (typeof V2UnitCards !== "undefined") V2UnitCards.sync(battlefield, units, openUnitInfo);
    }
    turnQueue = V2Rules.roll(rulesState, lastDiceRoll);
    saveBattle('acting');
    const supportEvents = rulesState.events.filter(event => typeof event.source === "string" && event.source.startsWith("brand-"));
    const fallen = rulesState.events.filter(e => e.type === "death").map(e => e.unit);
    units.forEach(updateUnit);
    for (const event of supportEvents) {
      if (event.type === "heal") showHealing(event.unit, event.amount);
      else if (event.type === "damage") showDamage(event.unit, event.amount);
    }
    if (supportEvents.length) {
      await battleWait(380, 220);
      if (token !== battleToken || !running) return;
    }
    await Promise.all(fallen.map(unitState => playMotion(unitState, "death", unitState.frames.death, token, true)));
    if (token !== battleToken || !running) return;
    updateHud();
    if (!aliveUnits("ally").length || !aliveUnits("enemy").length) return finishBattle();
    for (const unitState of units) {
      unitState.gauge = unitState.alive ? 100 : 0;
      updateUnit(unitState);
    }
    message.textContent = `${turnNumber}턴 · 주사위 ${lastDiceRoll}${turnNumber >= 15 ? ` · 광폭화 공격력 +${turnNumber - 14}` : ""}`;
    actionBusy = false;
    saveBattle('acting');
  }

  function beginTurnIntermission(initial) {
    if (!running || awaitingRoll) return;
    if (!aliveUnits("ally").length || !aliveUnits("enemy").length) return finishBattle();
    awaitingRoll = true;
    paused = false;
    actionBusy = false;
    pauseButton.disabled = true;
    pauseButton.textContent = "일시정지";
    turnDice.hidden = false;
    if (typeof V2UnitCards !== "undefined") V2UnitCards.setPhase("ready");
    turnDiceButton.disabled = false;
    turnDiceButton.classList.remove("is-rolling");
    turnDiceImage.src = DICE_ROLL_FRAMES[0];
    turnDiceImage.alt = "굴리기 전 주사위";
    turnDiceButton.setAttribute("aria-label", `${turnNumber + 1}턴 주사위 굴리기`);
    battlefield.classList.add("is-between-turns");
    message.textContent = initial ? "주사위를 굴리면 1턴이 시작됩니다" : `${turnNumber}턴 종료 · 유닛 정보 확인 또는 주사위 굴리기`;
    saveBattle('ready');
  }

  async function rollTurnDice() {
    if (!running || !awaitingRoll || diceRolling) return;
    closeUnitInfo();
    diceRolling = true;
    if (typeof V2UnitCards !== "undefined") V2UnitCards.setPhase("acting");
    showRolledBrands(null);
    turnDiceButton.disabled = true;
    turnDiceButton.classList.add("is-rolling");
    turnDiceButton.setAttribute("aria-label", "주사위 굴리는 중");
    const token = battleToken;
    const steps = 18 + Math.floor(Math.random() * 5);
    for (let step = 0; step < steps; step += 1) {
      if (token !== battleToken || !running || !awaitingRoll) return;
      if (step % 2 === 0 && typeof V2Sfx !== "undefined") V2Sfx.play("diceTick", { rate: .92 + Math.random() * .2 });
      diceFrameIndex = (diceFrameIndex + 1) % DICE_ROLL_FRAMES.length;
      turnDiceImage.src = DICE_ROLL_FRAMES[diceFrameIndex];
      const progress = step / Math.max(1, steps - 1);
      await wait(42 + Math.round(progress * progress * 62));
    }
    if (token !== battleToken || !running || !awaitingRoll) return;
    lastDiceRoll = Math.floor(battleRandom() * 6) + 1;
    if (typeof V2Sfx !== "undefined") V2Sfx.play("diceLand", { rate: .94 + lastDiceRoll * .015 });

    await presentation.play({
      type: "dice-result",
      token,
      roll: lastDiceRoll,
      value: lastDiceRoll
    }, () => {
      turnDiceImage.src = DICE_RESULT_FRAMES[lastDiceRoll - 1];
      turnDiceImage.alt = `주사위 결과 ${lastDiceRoll}`;
      turnDiceButton.classList.remove("is-rolling");
      turnDiceButton.setAttribute("aria-label", `주사위 결과 ${lastDiceRoll}`);
      message.textContent = `${turnNumber + 1}턴 공통 주사위 결과 ${lastDiceRoll}`;
    });

    const triggeredBrands = units.flatMap((unitState) =>
      (unitState.brands || []).map((brandState) => ({
        unitState,
        brandState,
        definition: V2Rules.definitions[brandState.type],
        mode: V2Rules.mode(brandState, lastDiceRoll)
      })).filter((entry) => entry.definition && entry.mode !== "normal")
    );
    await presentation.play({
      type: "brand-trigger",
      token,
      roll: lastDiceRoll,
      brand: triggeredBrands.length === 1 ? triggeredBrands[0].brandState.type : null,
      mode: triggeredBrands.length === 1 ? triggeredBrands[0].mode : null,
      triggers: triggeredBrands.map((entry) => ({
        source: entry.unitState.instanceId || entry.unitState.slug,
        sourceName: entry.unitState.name,
        brand: entry.brandState.type,
        brandName: entry.definition.name,
        mode: entry.mode
      }))
    }, () => {
      showRolledBrands(lastDiceRoll);
    });

    await presentationWait(620, 320);
    if (token !== battleToken || !running || !awaitingRoll) return;
    turnDiceButton.disabled = false;
    diceRolling = false;
    startTurn().catch((error) => recoverBattleFlow(error, "턴 시작"));
  }

  function legionDetails(unitState) {
    const keys = Object.keys(V2Rules.RULES).filter(key => V2Rules.active(legionState, unitState.team, key));
    return `<ul class="legion-team-effects">${keys.map(key => `<li><b>${V2Rules.RULES[key].name} ${legionState.teams[unitState.team].counts[key]}/${V2Rules.RULES[key].need}</b><span>${V2Rules.RULES[key].effect}</span></li>`).join("") || "<li>활성 군단 없음</li>"}</ul>${V2Rules.suppressed(legionState,unitState.team) ? "<p>상대 원소: 군단 효과 억제</p>" : ""}<p>군단 활성은 전투 시작 시 고정</p>`;
  }


  function openUnitInfo(unitState) {
    if (!awaitingRoll || diceRolling) return;
    unitInfoName.textContent = unitState.name;
    unitInfoImage.setAttribute("href", unitState.infoPortrait || unitState.portrait);
    if (unitState.infoPortrait) {
      // Dedicated portrait cards sit over the frame artwork's blank upper-left
      // parchment area, so their own wooden border remains fully visible.
      unitInfoImage.setAttribute("x", "0");
      unitInfoImage.setAttribute("y", "0");
      unitInfoImage.setAttribute("width", "192");
      unitInfoImage.setAttribute("height", "288");
      unitInfoPortrait.setAttribute("viewBox", "0 0 192 288");
    } else {
      unitInfoImage.setAttribute("x", "0");
      unitInfoImage.setAttribute("y", "0");
      unitInfoImage.setAttribute("width", "192");
      unitInfoImage.setAttribute("height", "192");
      const [x, y, width, height] = unitState.portraitBounds;
      const padding = Math.max(width, height) * 0.06;
      unitInfoPortrait.setAttribute("viewBox", `${x - padding} ${y - padding} ${width + padding * 2} ${height + padding * 2}`);
    }
    unitInfoPortrait.setAttribute("aria-label", unitState.name);
    unitInfoGrade.textContent = GRADE_LABELS[unitState.grade] || "미지정";
    unitInfoLegion.textContent = unitState.legions.map((key) => LEGION_LABELS[key] || key).join(" · ") || "미지정";
    const baseMaxHp = unitState.baseMaxHp ?? unitState.maxHp;
    const baseAttack = unitState.baseAttack ?? unitState.attack;
    const baseSpeed = unitState.baseSpeed ?? unitState.speed;
    unitInfoHp.textContent = `${Math.max(0, unitState.hp)} / ${unitState.maxHp}`;
    unitInfoAttack.textContent = String(unitState.attack);
    unitInfoSpeed.textContent = String(unitState.speed);
    const escapeInfo = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[c]));
    const slots = Array.isArray(unitState.brands) ? unitState.brands : (unitState.brand ? [unitState.brand] : []);
    const brands = slots.map(slot => {
      const key = typeof slot === "string" ? slot : slot.type || slot.id;
      const definition = V2Rules.definitions[key];
      return definition ? { ...definition, ...(typeof slot === "object" ? slot : {}), key } : null;
    }).filter(Boolean);
    const passive = unitState.passive;
    const passiveName = typeof passive === "object" && passive ? passive.name : passive;
    const passiveEffect = typeof passive === "object" && passive ? passive.description || passive.effect : "";
    const icon = key => {
      const view = BRAND_ICON_VIEWS[key];
      if (!view) return '<span class="brand-icon brand-icon-empty" aria-hidden="true">◇</span>';
      const sheet = ["combo", "freeze", "lightspeed", "counter"].includes(key) ? "brand-icons-extra-sheet.jpg" : "brand-icons-sheet.jpg";
      return `<svg class="brand-icon" viewBox="${view.join(" ")}" aria-hidden="true"><image href="art/v2-style/ui/${sheet}" width="1280" height="575" /></svg>`;
    };
    unitInfoBrands.innerHTML = `<div class="passive-heading"><span class="passive-symbol" aria-hidden="true">◇</span><span>${escapeInfo(passiveName || "패시브 없음")}</span></div>` +
      (brands.map(brand => `<div class="brand-heading">${icon(brand.key)}<h4>${escapeInfo(brand.name)}</h4></div>`).join("") || '<p class="unit-info-empty">낙인 없음</p>');
    const brandEffects = brands.map(brand => `<section class="effect-entry"><h4>${escapeInfo(brand.name)}</h4><p class="effect-blessing">축복 [${escapeInfo((brand.bless || []).join(", "))}] · ${escapeInfo(brand.blessing)}</p><p class="effect-curse">저주 [${escapeInfo((brand.curse || []).join(", "))}] · ${escapeInfo(brand.penalty)}</p></section>`).join("");
    legionInfoContent.innerHTML = `<h3>군단 효과</h3>${legionDetails(unitState)}<h3>패시브 효과</h3><p>${escapeInfo(passiveName || "패시브 없음")}${passiveEffect ? ` · ${escapeInfo(passiveEffect)}` : ""}</p><h3>낙인 눈금과 효과</h3>${brandEffects || '<p>낙인 없음</p>'}`;
    if (baseMaxHp !== unitState.maxHp || baseAttack !== unitState.attack || baseSpeed !== unitState.speed) legionInfoContent.innerHTML += `<section class="effect-entry"><h4>능력치 변화</h4><p>최대 체력 ${baseMaxHp} → ${unitState.maxHp} · 공격력 ${baseAttack} → ${unitState.attack} · 속도 ${baseSpeed} → ${unitState.speed}</p></section>`;
    if (unitState.slug === "guardian-seed") legionInfoContent.innerHTML += `<section class="effect-entry"><h4>개화</h4><p>공격 불가 · 생성 다음 라운드를 마치면 자동 개화</p></section>`;
    unitInfoOverlay.hidden = false;
    document.getElementById("unitInfoClose").focus();
  }

  function closeUnitInfo() {
    unitInfoOverlay.hidden = true;
    if (typeof V2UnitCards !== "undefined") V2UnitCards.clearSelection();
  }

  async function summonFromPlan(plan, token) {
    const data = plan.slug === "guardian-seed" ? unit("guardian-seed", "씨앗", 6, 0, 1, 5, 3, 4) : {...ROSTER_BY_SLUG.get(plan.slug)};
    await prepareSelectedMotion(data);
    if (token !== battleToken || !running) return;
    const summoned = makeState(data, plan.team, 4);
    // Summons use species base stats, without an individual no-passive bonus.
    const design = V2DesignData.units[plan.slug];
    summoned.maxHp = design.hp; summoned.attack = design.attack; summoned.speed = design.speed;
    const old = units.find(u => u.team === plan.team && u.slot === 4);
    if (!V2Rules.addSummon(rulesState, plan, summoned)) return;
    const host = summoned.team === "ally" ? allyTeam : enemyTeam;
    const node = old?.element || host.querySelector(".summon-slot");
    node.replaceWith(createUnitElement(summoned));
    revealUnit(summoned);
    if (typeof V2UnitCards !== "undefined") V2UnitCards.sync(battlefield, units, openUnitInfo);
  }


  async function performAttack(actor, token) {
    actionBusy = true;
    actor.gauge = 0;
    updateUnit(actor);
    const poisonEventStart = rulesState.events.length;
    const poisonDamage = V2Rules.before(rulesState, actor);
    const poisonEvents = rulesState.events.slice(poisonEventStart);
    if (poisonDamage) {
      if (!actor.alive) saveBattle('acting');
      updateUnit(actor);
      showDamage(actor, poisonDamage);
      for (const event of poisonEvents) {
        if (event.type === "heal" && event.source === "passive-feast") {
          updateUnit(event.unit);
          showHealing(event.unit, event.amount);
        }
      }
      message.textContent = `${actor.name} 중독 피해 ${poisonDamage}`;
      await battleWait(460, 260);
      if (token !== battleToken || !running) return;
      if (!actor.alive) {
        await playMotion(actor, "death", actor.frames.death, token, true);
        if (token !== battleToken || !running) return;
        updateHud();
        if (!aliveUnits("ally").length || !aliveUnits("enemy").length) return finishBattle();
        actionBusy = false;
        return;
      }
    }
    if (actor.frozen) {
      actor.frozen = false;
      message.textContent = `${actor.name} 빙결 · 이번 턴 공격 불가`;
      actor.element.classList.remove("is-frozen");
      const healed = 0;
      updateUnit(actor);
      showHealing(actor, healed);
      await battleWait(420, 250);
      if (token !== battleToken || !running) return;
      actionCount += 1;
      actionBusy = false;
      saveBattle('acting');
      message.textContent = `${turnNumber}턴 · ${actor.name} 빙결${healed ? ` · 회복 +${healed}` : ""}`;
      return;
    }
    if (actor.slug === "guardian-seed") { actionBusy = false; saveBattle('acting'); return; }
    if (token !== battleToken || !running) return;
    const target = V2Rules.pickTarget(rulesState, actor.team === "ally" ? "enemy" : "ally");
    if (!target) return finishBattle();

    message.textContent = `${turnNumber}턴 · ${actor.name}(속도 ${actor.speed}) → ${target.name}`;
    const cinematic = true;
    await presentation.play({
      type: "attack",
      token,
      source: actor.instanceId || actor.slug,
      sourceName: actor.name,
      target: target.instanceId || target.slug,
      targetName: target.name
    }, async () => {
      actor.element.classList.add("is-attacking");
      target.element.classList.add("is-targeted");
      if (cinematic) {
        battlefield.classList.add("is-cinematic");
        await presentationWait(320, 180);
      }
    });
    if (token !== battleToken || !running) return;
    const hitFrames = typeof V2CombatEffects !== "undefined" ? await V2CombatEffects.prepare(actor.slug) : null;
    const soundProfile = combatSoundProfile(actor);
    if (token !== battleToken || !running) return;
    let signalImpact;
    const impactReady = new Promise(resolve => { signalImpact = resolve; });
    if (typeof V2Sfx !== "undefined") V2Sfx.play("attack", { variant: soundProfile.attack, rate: .92 + Math.min(6, actor.speed) * .025 });
    let attackPlayback = playMotion(actor, "attack", actor.frames.attack, token, false, signalImpact);
    attackPlayback.then(signalImpact, signalImpact);
    await Promise.race([impactReady, battleWait(1600, 900)]);
    if (token !== battleToken || !running) return;

    const poisonStacksBefore = Array.isArray(target.poisonStacks) ? target.poisonStacks.length : Number(target.poison || 0);
    const targetHpBeforeAttack = target.hp;
    const legionAttack = { legionCritical: false };
    const eventStart = rulesState.events.length;
    const outcome = V2Rules.attack(rulesState, actor, target);
    const hitAmounts = outcome.hits.length ? outcome.hits : outcome.damage > 0 ? [outcome.damage] : [];
    const targetFinalHp = target.hp;
    const targetFinalAlive = target.alive;
    const attackEvents = rulesState.events.slice(eventStart);
    saveBattle('acting');
    const poisonStacksAfter = Array.isArray(target.poisonStacks) ? target.poisonStacks.length : Number(target.poison || 0);
    const poisonAppliedNow = poisonStacksAfter > poisonStacksBefore;
    const legionApplied = { poison: Boolean(target.poison), frozen: Boolean(target.frozen) };
    if (poisonStacksBefore === 0 && poisonAppliedNow) target.poisonAppliedTurn = turnNumber;
    if (typeof V2DamageDigits !== "undefined") {
      if (outcome.miss) V2DamageDigits.showLabel(target, "miss");
      else if (outcome.immune) V2DamageDigits.showLabel(target, "immune");
      else if (outcome.damage > 0 && (legionAttack.legionCritical || actor.brand === "critical" && actor.brandMode === "blessing")) V2DamageDigits.showLabel(target, "critical");
      if (outcome.damage > 0 && target.hp > 0 && poisonAppliedNow) V2DamageDigits.showLabel(target, "poison");
    }
    updateUnit(actor);
    if (hitAmounts.length) {
      target.hp = targetHpBeforeAttack;
      target.alive = target.hp > 0;
    }
    updateUnit(target);
    if (outcome.recovered) showHealing(actor, outcome.recovered);
    if (outcome.selfDamage) showDamage(actor, outcome.selfDamage);
    for (const event of attackEvents) {
      if (event.type === "heal" && event.source === "passive-feast") showHealing(event.unit, event.amount);
    }
    if (legionApplied.frozen) target.element.classList.add("is-frozen");
    message.textContent = outcome.miss ? `${actor.name} 공격 빗나감` : outcome.cancelled ? `${actor.name} 공격 취소`
      : outcome.immune ? `${target.name} 수호 · 피해 무시`
      : `${actor.name} → ${target.name} · 피해 ${outcome.damage}${outcome.recovered ? ` · 흡혈 +${outcome.recovered}` : ""}`;
    if (hitAmounts.length) {
      for (let hitIndex = 0; hitIndex < hitAmounts.length; hitIndex += 1) {
        if (hitIndex > 0) {
          await attackPlayback;
          if (token !== battleToken || !running) return;
          let signalNextImpact;
          const nextImpactReady = new Promise(resolve => { signalNextImpact = resolve; });
          if (typeof V2Sfx !== "undefined") V2Sfx.play("attack", { variant: soundProfile.attack, rate: .96 + Math.min(6, actor.speed) * .02 });
          attackPlayback = playMotion(actor, "attack", actor.frames.attack, token, false, signalNextImpact);
          attackPlayback.then(signalNextImpact, signalNextImpact);
          await Promise.race([nextImpactReady, battleWait(1600, 900)]);
          if (token !== battleToken || !running) return;
        }
        const hitAmount = hitAmounts[hitIndex];
        if (hitAmount > 0) {
          target.hp = Math.max(targetFinalHp, target.hp - hitAmount);
          target.alive = target.hp > 0;
          updateUnit(target);
        }
        if (hitAmount > 0 && typeof V2Sfx !== "undefined") V2Sfx.play("hit", { variant: soundProfile.hit, rate: Math.max(.72, 1.08 - hitAmount * .045), volume: Math.min(1.25, .82 + hitAmount * .07) });
        if (hitAmount > 0) showDamage(target, hitAmount);
        else if (typeof V2DamageDigits !== "undefined") V2DamageDigits.showLabel(target, "immune");
        await presentation.play({
          type: "hit",
          token,
          source: actor.instanceId || actor.slug,
          sourceName: actor.name,
          target: target.instanceId || target.slug,
          targetName: target.name,
          value: hitAmount,
          hitIndex
        }, async () => {
          target.element.classList.add("is-hit");
          await Promise.all([
            playMotion(target, "hit", target.frames.hit, token),
            hitAmount > 0 && typeof V2CombatEffects !== "undefined" ? V2CombatEffects.play(target.element.querySelector(".sprite-wrap"), hitFrames,
              {guard: () => token === battleToken && running, wait, speed: speedMultiplier}) : Promise.resolve()
          ]);
          target.element.classList.remove("is-hit");
        });
        if (token !== battleToken || !running) return;
      }
    } else await battleWait(250);
    if (token !== battleToken || !running) return;
    target.hp = targetFinalHp;
    target.alive = targetFinalAlive;
    updateUnit(target);

    if (outcome.counterDamage > 0 && target.alive) {
      await attackPlayback;
      if (token !== battleToken || !running) return;

      message.textContent = `${target.name} 반격! · ${actor.name}에게 피해 ${outcome.counterDamage}`;
      target.element.classList.add("is-attacking");
      actor.element.classList.add("is-targeted");

      const counterSoundProfile = combatSoundProfile(target);
      let signalCounterImpact;
      const counterImpactReady = new Promise(resolve => { signalCounterImpact = resolve; });
      if (typeof V2Sfx !== "undefined") V2Sfx.play("attack", { variant: counterSoundProfile.attack, rate: .95 + Math.min(6, target.speed) * .02 });
      const counterPlayback = playMotion(target, "attack", target.frames.attack, token, false, signalCounterImpact);
      counterPlayback.then(signalCounterImpact, signalCounterImpact);
      await Promise.race([counterImpactReady, battleWait(1600, 900)]);
      if (token !== battleToken || !running) return;

      if (typeof V2Sfx !== "undefined") V2Sfx.play("hit", { variant: counterSoundProfile.hit, rate: Math.max(.72, 1.08 - outcome.counterDamage * .045), volume: Math.min(1.25, .82 + outcome.counterDamage * .07) });
      showDamage(actor, outcome.counterDamage);
      actor.element.classList.add("is-hit");
      await playMotion(actor, "hit", actor.frames.hit, token);
      if (token !== battleToken || !running) return;
      actor.element.classList.remove("is-hit");

      await counterPlayback;
      if (token !== battleToken || !running) return;
      target.element.classList.remove("is-attacking");
      actor.element.classList.remove("is-targeted");
      updateUnit(actor);
      updateUnit(target);
    }

    if (target.hp <= 0) {
      target.hp = 0;
      target.alive = false;
      message.textContent = `${target.name} 쓰러짐`;
      await playMotion(target, "death", target.frames.death, token, true);
      if (token !== battleToken || !running) return;
      updateUnit(target);
    } else {
      target.image.src = frame(target, "attack", 1);
    }

    await attackPlayback;
    if (token !== battleToken || !running) return;
    actor.element.classList.remove("is-attacking");
    target.element.classList.remove("is-targeted");
    if (!actor.alive) await playMotion(actor, "death", actor.frames.death, token, true);
    else actor.image.src = frame(actor, "attack", 1);
    if (cinematic) {
      await presentationWait(240, 160);
      if (token !== battleToken || !running) return;
      battlefield.classList.remove("is-cinematic");
    }
    actionCount += 1;
    const legionHealing = 0;
    updateUnit(actor);
    showHealing(actor, legionHealing);
    updateHud();
    saveBattle('acting');
    if (!aliveUnits("ally").length || !aliveUnits("enemy").length) return finishBattle();
    actionBusy = false;
    message.textContent = `${turnNumber}턴 · 남은 행동 ${turnQueue.filter((unitState) => unitState.alive).length}명${legionHealing ? ` · ${actor.name} 회복 +${legionHealing}` : ""}`;
  }

  async function playMotion(unitState, motion, count, token, holdLast, onImpact) {
    if (!unitState || !Number.isFinite(count) || count <= 0) {
      if (onImpact) onImpact();
      return;
    }

    // The battlefield can refresh supporting UI while combat is running.
    // Never treat a stale <img> reference as "no animation": reacquire the live sprite.
    let image = unitState.image;
    if (!image || image.isConnected === false) {
      image = unitState.element?.querySelector(".sprite-wrap > img") || null;
      if (image) unitState.image = image;
    }
    if (!image) {
      if (onImpact) onImpact();
      return;
    }

    const delay = () => Math.max(45, 135 / speedMultiplier);
    const impactFrame = Math.max(1, Math.ceil(count / 2));
    for (let index = 1; index <= count; index += 1) {
      if (token !== battleToken || !running) return;
      while (paused && token === battleToken && running) await wait(50);
      if (token !== battleToken || !running) return;

      // Reacquire once more if another render detached the sprite mid-motion.
      if (image.isConnected === false) {
        const liveImage = unitState.element?.querySelector(".sprite-wrap > img");
        if (liveImage) {
          image = liveImage;
          unitState.image = liveImage;
        }
      }

      image.src = frame(unitState, motion, index);
      if (onImpact && index === impactFrame) onImpact();
      await wait(motion === "attack" && onImpact
        ? Math.max(index === impactFrame ? 130 : 45, (index === impactFrame ? 190 : index === 1 ? 160 : 90) / speedMultiplier)
        : delay());
    }
    if (!holdLast) await wait(delay() * .35);
  }

  function persistMapAllyOutcome() {
    if (!fromMap) return [];
    try {
      const runRoster = globalThis.V2RunStateRuntime?.snapshot?.()?.ownedMonsters;
      const saved = Array.isArray(runRoster)
        ? JSON.parse(JSON.stringify(runRoster))
        : JSON.parse(sessionStorage.getItem(MAP_ROSTER_KEY));
      if (!Array.isArray(saved)) return [];
      const byInstance = new Map(saved.map((unit) => [unit.instanceId || unit.slug, unit]));
      for (const unitState of units.filter((unit) => unit.team === "ally" && !unit.isSummon && unit.slot < 4)) {
        const key = unitState.instanceId || unitState.slug;
        const owned = byInstance.get(key);
        if (!owned) continue;
        if (!unitState.alive || unitState.hp <= 0) {
          byInstance.delete(key);
          continue;
        }
        const temporaryMaxBonus = Math.max(0, unitState.maxHp - owned.maxHp);
        owned.currentHp = Math.max(1, Math.min(owned.maxHp, unitState.hp - temporaryMaxBonus));
      }
      const next = saved.filter((unit) => byInstance.has(unit.instanceId || unit.slug)).map((unit) => byInstance.get(unit.instanceId || unit.slug));
      if (!globalThis.V2RunStateRuntime?.available && typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(MAP_ROSTER_KEY, JSON.stringify(next));
      }
      return next;
    } catch (_) {
      return [];
    }
  }

  function markMapBattleTileCleared() {
    if (!fromMap || !["monster", "rare-monster", "boss"].includes(mapEncounterType)) return;
    const step = Number(battleQuery.get("tile"));
    if (!Number.isInteger(step) || step < 1 || step > 24) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(MAP_CLEARED_MONSTER_KEY));
      const steps = new Set(Array.isArray(saved) ? saved : []);
      steps.add(step);
      sessionStorage.setItem(MAP_CLEARED_MONSTER_KEY, JSON.stringify([...steps].sort((a, b) => a - b)));
    } catch (_) { /* Victory still completes if storage is unavailable. */ }
  }

  async function finishBattle() {
    if (typeof V2UnitCards !== "undefined") V2UnitCards.setPhase("locked");
    battlefield.classList.remove("is-cinematic");
    running = false;
    actionBusy = false;
    awaitingRoll = false;
    diceRolling = false;
    turnDice.hidden = true;
    battlefield.classList.remove("is-between-turns");
    closeUnitInfo();
    pauseButton.disabled = true;
    speedButton.disabled = true;
    const won = aliveUnits("ally").length > 0;
    const rosterOutcome = persistMapAllyOutcome();
    if (fromMap && globalThis.V2RunStateRuntime?.available) {
      const clearedStep = Number(battleQuery.get("tile"));
      const stored = await V2RunStateRuntime.applyBattleOutcome({
        encounterId: mapEncounterId || `tile-${clearedStep}`,
        ownedMonsters: rosterOutcome,
        won,
        clearedStep
      });
      if (!stored?.ok) {
        resultTitle.textContent = "저장 오류";
        resultBody.textContent = "전투 결과를 원정 세이브에 반영하지 못했습니다. 다시 시도하세요.";
        resultOverlay.hidden = false;
        message.textContent = "전투 결과 저장 실패";
        return;
      }
    } else if (won) {
      applyMapVictoryContamination();
      markMapBattleTileCleared();
    }
    saveBattle('complete');
    resultTitle.textContent = won ? "아군 승리" : aliveUnits("enemy").length ? "적군 승리" : "무승부";
    resultBody.textContent = `${actionCount}번의 공격 후 전투가 끝났습니다. 매 턴 속도가 높은 순서로 생존 유닛 모두가 한 번씩 행동했습니다.`;
    const captureReady = setupCorpseCapture(won);
    resultOverlay.hidden = captureReady;
    message.textContent = captureReady ? "아군 승리 · 죽은 적을 직접 선택하세요" : "전투 종료";
    if (captureReady) saveBattle("capture-select");
  }

  function setupCorpseCapture(won, savedCapture = null) {
    capturePanel.hidden = true;
    battlefield.classList.remove("is-corpse-capture");
    selectedCorpse = null;
    captureTargetLocked = false;
    captureAttemptsLeft = 0;
    if (!won) return false;
    const corpses = units.filter(unit => unit.team === "enemy" && !unit.alive && !unit.isSummon);
    if (!corpses.length) return false;
    capturePanel.hidden = false;
    battlefield.classList.add("is-corpse-capture");
    turnDice.hidden = false;
    turnDiceButton.disabled = false;
    turnDiceButton.classList.remove("is-rolling");
    turnDiceImage.src = DICE_ROLL_FRAMES[0];
    turnDiceImage.alt = "영혼 수확 주사위 굴리기";
    captureStatus.textContent = "시체를 선택하세요.";
    for (const corpse of corpses) {
      const key = captureUnitKey(corpse);
      const savedTarget = savedCapture?.targets?.[key];
      corpse.captureTarget = Number.isInteger(savedTarget) ? savedTarget : 2 + Math.floor(battleRandom() * 5);
      corpse.element.classList.add("is-capture-candidate");
      corpse.element.tabIndex = 0;
      corpse.element.setAttribute("aria-label", `${corpse.name} 시체 선택 · 주사위 ${corpse.captureTarget} 이상`);
      corpse.element.addEventListener("click", () => selectCorpse(corpse));
      corpse.element.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectCorpse(corpse); }
      });
      if (corpse.infoCard) {
        corpse.infoCard.disabled = false;
        corpse.infoCard.classList.add("is-capture-candidate");
        corpse.infoCard.addEventListener("click", () => selectCorpse(corpse));
      }
    }
    const restoredCorpse = savedCapture?.selectedKey
      ? corpses.find((corpse) => captureUnitKey(corpse) === savedCapture.selectedKey)
      : null;
    selectCorpse(restoredCorpse || corpses[0], true);
    if (savedCapture && Number.isInteger(savedCapture.attemptsLeft)) {
      captureAttemptsLeft = Math.max(0, savedCapture.attemptsLeft);
    }
    if (savedCapture?.targetLocked) lockCorpseSelection(false);
    return true;
  }

  function selectCorpse(corpse, restoring = false) {
    if (captureTargetLocked || !corpse || corpse.team !== "enemy" || corpse.alive || corpse.isSummon) return;
    selectedCorpse = corpse;
    captureAttemptsLeft = V2Rules.active(legionState, "ally", "corpse") ? 2 : 1;
    for (const unitState of units) {
      unitState.element?.classList.toggle("is-capture-selected", unitState === corpse);
      unitState.infoCard?.classList.toggle("is-capture-selected", unitState === corpse);
    }
    turnDiceButton.disabled = false;
    captureStatus.textContent = captureSummary(corpse);
    if (!restoring) saveBattle("capture-select");
  }

  function captureSummary(corpse, result = "") {
    return `${corpse.name} · 필요 주사위 ${corpse.captureTarget}${result ? ` · ${result}` : ""}`;
  }

  function lockCorpseSelection(persist = true) {
    captureTargetLocked = true;
    for (const unitState of units.filter(unit => unit.team === "enemy" && !unit.alive)) {
      unitState.element?.classList.remove("is-capture-candidate");
      if (unitState.infoCard) {
        unitState.infoCard.disabled = true;
        unitState.infoCard.classList.remove("is-capture-candidate");
      }
    }
    if (persist) saveBattle("capture-locked");
  }

  function createCapturedMonster(slug) {
    if (!TEST_DECK_SLUGS.includes(slug)) return null;
    const captured = V2Rules.individual(slug, battleRandom);
    captured.instanceId = globalThis.crypto?.randomUUID
      ? `${slug}-${globalThis.crypto.randomUUID()}`
      : `${slug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    captured.currentHp = captured.maxHp;
    return captured;
  }

  async function resolveCapturedMonsterReward(slug) {
    if (!fromMap) return { acquired: false, keptReward: false };
    let roster;
    try {
      const runRoster = globalThis.V2RunStateRuntime?.snapshot?.()?.ownedMonsters;
      const saved = Array.isArray(runRoster)
        ? runRoster
        : JSON.parse(sessionStorage.getItem(MAP_ROSTER_KEY));
      roster = Array.isArray(saved) ? JSON.parse(JSON.stringify(saved)) : [];
    } catch (_) {
      return { acquired: false, keptReward: false };
    }

    const captured = createCapturedMonster(slug);
    if (!captured) return { acquired: false, keptReward: false };
    const usedIds = new Set(roster.map((unit) => unit?.instanceId).filter(Boolean));
    while (usedIds.has(captured.instanceId)) {
      captured.instanceId = `${slug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }

    async function persistCapture(nextRoster) {
      if (globalThis.V2RunStateRuntime?.available) {
        const operationId = `capture-reward:${mapEncounterId || battleQuery.get("tile") || "map"}`;
        const result = await V2RunStateRuntime.commitExact(operationId, (draft) => {
          draft.ownedMonsters = JSON.parse(JSON.stringify(nextRoster));
          draft.battle = null;
          draft.phase = "returning";
        });
        return Boolean(result?.ok);
      }
      try {
        sessionStorage.setItem(MAP_ROSTER_KEY, JSON.stringify(nextRoster));
        return true;
      } catch (_) {
        return false;
      }
    }

    if (roster.length < MONSTER_CAPACITY) {
      roster.push(captured);
      const saved = await persistCapture(roster);
      return { acquired: saved, keptReward: saved };
    }

    return new Promise((resolve) => {
      let selectedKey = null;
      const candidates = [
        ...roster.map((unit) => ({ key: unit.instanceId, unit, isNew: false })),
        { key: "__new__", unit: captured, isNew: true }
      ];
      captureOverflowCards.replaceChildren();
      captureOverflowCards.scrollLeft = 0;
      captureOverflowStatus.textContent = "새 마물을 받으려면 버릴 마물 카드 1장을 선택하세요.";
      captureOverflowConfirm.disabled = true;

      for (const candidate of candidates) {
        const button = document.createElement("button");
        const image = document.createElement("img");
        const label = document.createElement("span");
        button.type = "button";
        button.className = "capture-overflow-card";
        button.dataset.key = candidate.key;
        image.src = `art/v2-style/ui/unit-card-${candidate.unit.slug}.png?v=19`;
        image.alt = candidate.unit.name || V2DesignData.units[candidate.unit.slug]?.name || candidate.unit.slug;
        image.addEventListener("error", () => {
          image.src = candidate.unit.portrait || `art/v2-style/processed/192/${candidate.unit.slug}.png`;
          image.classList.add("is-fallback-portrait");
        }, { once: true });
        label.textContent = candidate.unit.name || V2DesignData.units[candidate.unit.slug]?.name || candidate.unit.slug;
        button.append(image, label);
        if (candidate.isNew) {
          const badge = document.createElement("b");
          badge.textContent = "신규";
          button.append(badge);
        }
        button.addEventListener("click", () => {
          selectedKey = candidate.key;
          captureOverflowCards.querySelectorAll(".capture-overflow-card").forEach((card) =>
            card.classList.toggle("is-selected", card.dataset.key === selectedKey));
          captureOverflowConfirm.disabled = false;
          captureOverflowStatus.textContent = `${label.textContent} 버리기 선택됨`;
        });
        captureOverflowCards.append(button);
      }

      captureOverflowOverlay.hidden = false;
      captureOverflowConfirm.focus();
      captureOverflowConfirm.onclick = async () => {
        if (!selectedKey) return;
        const keptReward = selectedKey !== "__new__";
        let nextRoster = roster;
        if (keptReward) {
          nextRoster = roster.filter((unit) => unit.instanceId !== selectedKey);
          nextRoster.push(captured);
        }
        if (!(await persistCapture(nextRoster))) {
          captureOverflowStatus.textContent = "저장 실패 · 다시 시도하세요.";
          return;
        }
        roster = nextRoster;
        captureOverflowOverlay.hidden = true;
        captureOverflowCards.replaceChildren();
        captureOverflowConfirm.onclick = null;
        resolve({ acquired: true, keptReward });
      };
    });
  }

  async function returnToMap() {
    const map = battleQuery.get("map");
    const tile = Math.max(1, Math.min(24, Number(battleQuery.get("tile")) || 1));
    const params = new URLSearchParams();
    if (MAP_BATTLEFIELDS[map]) params.set("map", map);
    params.set("resume", String(tile));
    if (globalThis.V2RunStateRuntime?.available) await V2RunStateRuntime.flush();
    if (typeof V2Music !== "undefined") V2Music.handoff("map");
    window.location.assign(`v2-map-practice.html?${params.toString()}`);
  }

  async function animateSoulHarvest(corpse) {
    const card = corpse?.infoCard;
    if (!card || !card.isConnected) return;
    let left = card.offsetLeft;
    let top = card.offsetTop;
    let parent = card.offsetParent;
    while (parent && parent !== battlefield) {
      left += parent.offsetLeft;
      top += parent.offsetTop;
      parent = parent.offsetParent;
    }
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const targetLeft = battlefield.clientWidth / 2 - width / 2;
    const targetTop = battlefield.clientHeight / 2 - height / 2;
    const intakeTop = battlefield.clientHeight * .9 - height / 2;
    const spiritCard = card.cloneNode(true);
    spiritCard.className = "unit-info-card soul-harvest-card";
    spiritCard.disabled = true;
    spiritCard.removeAttribute("id");
    spiritCard.style.left = `${left}px`;
    spiritCard.style.top = `${top - 8}px`;
    spiritCard.style.width = `${width}px`;
    spiritCard.style.height = `${height}px`;
    battlefield.append(spiritCard);
    card.classList.add("is-soul-harvested");
    const animation = spiritCard.animate([
      { left: `${left}px`, top: `${top - 8}px`, transform: card.style.transform || "rotate(0deg)", opacity: 1 },
      { left: `${targetLeft}px`, top: `${targetTop}px`, transform: "rotate(0deg) scale(1.2)", filter: "drop-shadow(0 0 14px #b8f8ff) brightness(1.18)", opacity: 1, offset: .58 },
      { left: `${targetLeft}px`, top: `${intakeTop}px`, transform: "rotate(0deg) scale(1.55)", filter: "drop-shadow(0 0 22px #d9ffff) brightness(1.45)", opacity: 1, offset: .82 },
      { left: `${targetLeft}px`, top: `${intakeTop + height * .28}px`, transform: "rotate(0deg) scale(2.35)", filter: "blur(3px) drop-shadow(0 0 28px #efffff) brightness(2)", opacity: 0 }
    ], { duration: 1500, easing: "cubic-bezier(.2,.72,.18,1)", fill: "forwards" });
    await animation.finished.catch(() => {});
    spiritCard.remove();
  }

  async function completeCaptureSuccess() {
    if (!selectedCorpse) return false;
    captureStatus.textContent = captureSummary(selectedCorpse, "성공");
    await animateSoulHarvest(selectedCorpse);
    const captureOutcome = await resolveCapturedMonsterReward(selectedCorpse.slug);
    if (!captureOutcome.acquired) {
      captureStatus.textContent = captureSummary(selectedCorpse, "획득 저장 실패");
      battlefield.classList.remove("is-capture-rolling");
      diceRolling = false;
      turnDiceButton.disabled = false;
      return false;
    }
    captureStatus.textContent = captureSummary(selectedCorpse, captureOutcome.keptReward ? "획득 완료" : "신규 카드 버림");
    saveBattle("capture-complete");
    selectedCorpse.element?.classList.remove("is-capture-selected");
    battlefield.classList.remove("is-capture-rolling");
    diceRolling = false;
    await wait(650);
    await returnToMap();
    return true;
  }

  async function rollCorpseCapture() {
    if (!selectedCorpse || captureAttemptsLeft <= 0 || diceRolling) return;
    diceRolling = true;
    if (!captureTargetLocked) lockCorpseSelection();
    battlefield.classList.add("is-capture-rolling");
    turnDice.hidden = false;
    turnDiceButton.disabled = true;
    turnDiceButton.classList.add("is-rolling");
    turnDiceImage.alt = "영혼 수확 주사위 굴리는 중";
    captureStatus.textContent = captureSummary(selectedCorpse);
    const steps = 18 + Math.floor(Math.random() * 5);
    for (let step = 0; step < steps; step += 1) {
      diceFrameIndex = (diceFrameIndex + 1) % DICE_ROLL_FRAMES.length;
      turnDiceImage.src = DICE_ROLL_FRAMES[diceFrameIndex];
      const progress = step / Math.max(1, steps - 1);
      await wait(42 + Math.round(progress * progress * 62));
    }
    const roll = 1 + Math.floor(battleRandom() * 6);
    turnDiceImage.src = DICE_RESULT_FRAMES[roll - 1];
    turnDiceImage.alt = `영혼 수확 주사위 결과 ${roll}`;
    turnDiceButton.classList.remove("is-rolling");
    captureAttemptsLeft -= 1;
    if (roll >= selectedCorpse.captureTarget) {
      saveBattle("capture-success");
      await wait(420);
      await completeCaptureSuccess();
      return;
    }
    await wait(620);
    battlefield.classList.remove("is-capture-rolling");
    diceRolling = false;
    if (captureAttemptsLeft > 0) {
      captureStatus.textContent = captureSummary(selectedCorpse, "실패");
      turnDiceImage.src = DICE_ROLL_FRAMES[0];
      turnDiceImage.alt = "영혼 수확 주사위 다시 굴리기";
      turnDiceButton.disabled = false;
      saveBattle("capture-locked");
    } else {
      captureStatus.textContent = captureSummary(selectedCorpse, "실패");
      saveBattle("capture-failed");
      await wait(900);
      await returnToMap();
    }
  }

  function wait(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  startButton.addEventListener("click", startSelectedBattle);
  const resumeBattleButton = document.getElementById('resumeBattleButton');
  resumeBattleButton.addEventListener('click', resumeBattle);
  resumeBattleButton.hidden = !loadBattleCheckpoint();
  unitRoster.addEventListener("touchstart", beginRosterTouchScroll, { passive: true });
  unitRoster.addEventListener("touchmove", moveRosterTouchScroll, { passive: false });
  unitRoster.addEventListener("touchend", endRosterTouchScroll, { passive: true });
  unitRoster.addEventListener("touchcancel", endRosterTouchScroll, { passive: true });
  allyLineupTab.addEventListener("click", () => selectLineupSide("ally"));
  enemyLineupTab.addEventListener("click", () => selectLineupSide("enemy"));
  allyLineupSummary.addEventListener("click", () => selectLineupSide("ally"));
  enemyLineupSummary.addEventListener("click", () => selectLineupSide("enemy"));
  turnDiceButton.addEventListener("click", () => {
    if (battlefield.classList.contains("is-corpse-capture")) rollCorpseCapture();
    else rollTurnDice();
  });
  document.getElementById("unitInfoClose").addEventListener("click", closeUnitInfo);
  document.getElementById("unitInfoBackdrop").addEventListener("click", closeUnitInfo);
  restartButton.addEventListener("click", () => resetBattle(true));
  document.getElementById("resultRestartButton").addEventListener("click", () => { resetBattle(false); beginBattle(); });
  pauseButton.addEventListener("click", () => {
    paused = !paused;
    pauseButton.textContent = paused ? "계속" : "일시정지";
    message.textContent = paused ? "전투 일시정지" : "전투 재개";
  });
  speedButton.addEventListener("click", () => {
    speedLevel = speedLevel === 1 ? 2 : speedLevel === 2 ? 3 : 1;
    speedMultiplier = SPEED_PRESETS[speedLevel];
    speedButton.textContent = `속도 ×${speedLevel}`;
  });

  const mapLineupReady = fromMap && selectedAllySlugs.length >= 1 && selectedAllySlugs.length <= 4;
  const matchingCheckpoint = loadBattleCheckpoint();
  if (mapLineupReady && matchingCheckpoint) {
    startOverlay.hidden = true;
    const resumed = await resumeBattle();
    if (!resumed) await startSelectedBattle();
  } else if (mapLineupReady) {
    // Do not render the default/demo teams first. startSelectedBattle() prepares
    // the real map lineup and only then calls resetBattle(false).
    startOverlay.hidden = true;
    await startSelectedBattle();
  } else {
    resetBattle(true);
  }
  if (typeof V2DamageDigits !== "undefined") V2DamageDigits.prepare().catch(error => console.warn(error));
  if (typeof V2DamageDigits !== "undefined") V2DamageDigits.prepareLabels().catch(error => console.warn(error));
  if (typeof V2DamageDigits !== "undefined") V2DamageDigits.prepareStatusLabels().catch(error => console.warn(error));
  if (typeof V2DamageDigits !== "undefined") V2DamageDigits.prepareHealing().catch(error => console.warn(error));
  requestAnimationFrame(battleLoop);
})();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./service-worker.js", { updateViaCache: "none" });
      await registration.update();
    } catch (error) {
      console.warn("전투 화면 업데이트 확인 실패", error);
    }
  });
}
