(() => {
  "use strict";

  const ROOT = "art/v2-style/map-test/";
  const TILE_ASSET_VERSION = "20260927-2";
  const EVENT_ASSET_VERSION = "20260927-2";
  const DICE_ROOT = "art/v2-style/dice-test/frames/";
  const rollingFrames = Array.from({ length: 12 }, (_, index) => `${DICE_ROOT}roll-${String(index + 1).padStart(2, "0")}.png`);
  const resultFrames = Array.from({ length: 6 }, (_, index) => `${DICE_ROOT}result-${String(index + 1).padStart(2, "0")}.png`);
  const treasureChestFrames = Array.from({ length: 4 }, (_, index) => `${ROOT}events/treasure-chest-frame-${index + 1}.png`);
  const maps = {
    default: { name: "기본 지역", image: `${ROOT}maps/default-map.jpg` },
    winter: { name: "겨울 지역", image: `${ROOT}maps/winter-map.jpg` },
    hell: { name: "지옥 지역", image: `${ROOT}maps/hell-map.jpg` }
  };
  const tileEventScenes = Object.freeze({
    graveyard: Object.freeze({ title: "묘지", image: `${ROOT}events/graveyard.jpg?v=${EVENT_ASSET_VERSION}` }),
    home: Object.freeze({ title: "집", image: `${ROOT}events/home.jpg?v=${EVENT_ASSET_VERSION}` }),
    "fortune-teller-camp": Object.freeze({ title: "예언자", image: `${ROOT}events/fortune-teller.jpg?v=${EVENT_ASSET_VERSION}` }),
    village: Object.freeze({ title: "마을", image: `${ROOT}events/village.jpg?v=${EVENT_ASSET_VERSION}` }),
    rest: Object.freeze({ title: "숙영", image: `${ROOT}events/camp.jpg?v=${EVENT_ASSET_VERSION}` }),
    altar: Object.freeze({ title: "제단", image: `${ROOT}events/altar.jpg?v=20260928-2` }),
    unknown: Object.freeze({ title: "세계수", image: `${ROOT}events/world-tree.jpg?v=20260928-2` }),
    forest: Object.freeze({ title: "언덕", image: `${ROOT}events/forest.jpg?v=${EVENT_ASSET_VERSION}` }),
    gem: Object.freeze({ title: "보물상자", animation: "treasure" })
  });
  const tileEventRatios = Object.freeze({
    graveyard: 1280 / 714, home: 1280 / 714, "fortune-teller-camp": 1280 / 575,
    village: 1280 / 956, rest: 1280 / 714, altar: 1280 / 575, unknown: 16 / 9,
    forest: 1280 / 714, gem: 1280 / 714
  });
  const tileTypes = [
    { id: "basic", name: "기본 타일", count: 2 },
    { id: "graveyard", name: "공동묘지 타일", count: 2 },
    { id: "altar", name: "제단 타일", count: 1 },
    { id: "unknown", name: "세계수 타일", count: 1 },
    { id: "forest", name: "언덕 타일", count: 2 },
    { id: "rest", name: "휴식 타일", count: 2 },
    { id: "monster", name: "일반 마물 타일", count: 2 },
    { id: "rare-monster", name: "희귀 마물 타일", count: 1 },
    { id: "gem", name: "보석 타일", count: 2 },
    { id: "event", name: "이벤트 타일", count: 3 },
    { id: "warp", name: "워프 타일", count: 2 }
  ];
  const fixedTiles = Object.freeze({
    home: Object.freeze({ id: "home", name: "우리집 타일", count: 1 }),
    village: Object.freeze({ id: "village", name: "마을 타일", count: 1 }),
    fortune: Object.freeze({ id: "fortune-teller-camp", name: "점술가의 막사 타일", count: 1 }),
    boss: Object.freeze({ id: "boss", name: "보스 타일", count: 1 })
  });
  const TEST_DECK = Object.freeze([
    ["death-knight", "데스 나이트"], ["skeleton-spear", "해골 병사"], ["skeleton-archer", "해골 궁수"], ["ghoul", "구울"],
    ["ancient-treant", "숲의 장로"], ["goblin-rider", "고블린 라이더"], ["minotaur", "미노타우로스"],
    ["plague-doctor", "역병술사"], ["spider-knight", "거미여왕"], ["hydra", "히드라"], ["siren", "세이렌"]
  ].map(([slug, name]) => Object.freeze({ slug, name })));
  const OWNED_ROSTER_KEY = "necromancer-map-roster-v2";
  const STARTING_UNIT_SLUGS = Object.freeze(["skeleton-spear", "skeleton-archer"]);
  const DICE_CONTROL_INVENTORY_KEY = "necromancer-map-dice-control-v1";
  const MONSTER_CAPACITY = 10;
  const DICE_CONTROL_CAPACITY = 5;
  const STARTING_DICE_EXCLUDED_IDS = Object.freeze(new Set(["repeat", "echo"]));
  const CONTAMINATION_KEY = "necromancer-map-contamination-v1";
  const CONTAMINATION_MAX = 100;
  const CONTAMINATION_STAGES = Object.freeze([
    Object.freeze({ id: "stable", label: "안정", min: 0, monsterTiles: 3 }),
    Object.freeze({ id: "spread", label: "확산", min: 20, monsterTiles: 3 }),
    Object.freeze({ id: "erosion", label: "침식", min: 40, monsterTiles: 4 }),
    Object.freeze({ id: "catastrophe", label: "재앙", min: 60, monsterTiles: 4 }),
    Object.freeze({ id: "threshold", label: "임계", min: 80, monsterTiles: 5 })
  ]);
  const BOSS_CONTAMINATION_MIN = 80;
  const MAP_LAYOUT_KEY = "necromancer-map-layout-v2";
  const LEGACY_MAP_LAYOUT_KEY = "necromancer-map-layout-v1";
  const MAP_CLEARED_MONSTER_KEY = "necromancer-map-cleared-monsters-v1";
  const WORLD_TREE_PRAYER_KEY = "necromancer-map-world-tree-prayed-v1";
  const MONSTER_BATTLE_TILE_IDS = Object.freeze(new Set(["monster", "rare-monster", "boss"]));
  const GRADE_LABELS = Object.freeze({ normal: "일반", advanced: "고급", hero: "영웅", special: "소환물" });
  const LEGION_LABELS = Object.freeze({ skeleton: "언데드", corpse: "시체", beast: "야수", plague: "역병", ice: "얼음", summon: "소환", demon: "악마", insect: "벌레", plant: "식물", element: "원소" });
  const BRAND_ICON_VIEWS = Object.freeze({
    critical: [216, 48, 228, 228], vampire: [526, 48, 234, 228], guard: [841, 48, 228, 228],
    poison: [216, 310, 228, 228], summon: [526, 310, 234, 228], healing: [843, 310, 228, 228],
    combo: [222, 50, 220, 220], freeze: [850, 50, 220, 220],
    lightspeed: [222, 316, 220, 220], counter: [852, 316, 220, 220]
  });
  const TARGET_RATES = Object.freeze({ 1: [100], 2: [35, 65], 3: [20, 33, 47], 4: [15, 20, 27, 38] });
  const CARD_DECK_IMAGES = Object.freeze({
    closed: "art/v2-style/ui/map-card-deck.png",
    open: "art/v2-style/ui/map-card-deck-open.png",
  });
  const HOME_INDEX = 15; // 16번 타일: 하단 일곱 칸의 정중앙.
  const el = {
    mapLab: document.querySelector(".map-lab"),
    board: document.getElementById("mapBoard"),
    ring: document.getElementById("tileRing"),
    mapName: document.getElementById("mapName"),
    tileName: document.getElementById("tileName"),
    regenerate: document.getElementById("regenerateButton"),
    hero: document.getElementById("heroToken"),
    diceButton: document.getElementById("mapDiceButton"),
    diceImage: document.getElementById("mapDiceImage"),
    diceResult: document.getElementById("diceResult"),
    moveState: document.getElementById("moveState"),
    contaminationHud: document.getElementById("contaminationHud"),
    contaminationFill: document.getElementById("contaminationFill"),
    contaminationStage: document.getElementById("contaminationStage"),
    contaminationValue: document.getElementById("contaminationValue"),
    eventOverlay: document.getElementById("tileEventOverlay"),
    eventScene: document.querySelector(".tile-event-scene"),
    eventImage: document.getElementById("tileEventImage"),
    eventTreasure: document.getElementById("treasureChestFrame"),
    eventTreasureRewards: document.getElementById("treasureRewardCards"),
    eventEnter: document.getElementById("tileEventEnter"),
    eventInheritance: document.getElementById("tileEventInheritance"),
    eventHeal: document.getElementById("tileEventHeal"),
    eventPray: document.getElementById("tileEventPray"),
    eventPrayerResult: document.getElementById("tileEventPrayerResult"),
    eventContaminationChange: document.getElementById("tileEventContaminationChange"),
    eventClose: document.getElementById("tileEventClose"),
    bookButton: document.getElementById("mapBookButton"),
    cardDeckButton: document.getElementById("mapCardDeckButton"),
    cardDeckImage: document.getElementById("mapCardDeckImage"),
    diceControlOverlay: document.getElementById("diceControlOverlay"),
    diceControlBackdrop: document.getElementById("diceControlBackdrop"),
    diceControlHand: document.getElementById("diceControlHand"),
    bookImage: document.getElementById("mapBookImage"),
    bookRoster: document.getElementById("mapBookRoster"),
    infoOverlay: document.getElementById("mapUnitInfoOverlay"),
    infoBackdrop: document.getElementById("mapUnitInfoBackdrop"),
    infoClose: document.getElementById("mapUnitInfoClose"),
    infoName: document.getElementById("mapUnitInfoName"),
    infoPortrait: document.getElementById("mapUnitInfoPortrait"),
    infoGrade: document.getElementById("mapUnitInfoGrade"),
    infoLegion: document.getElementById("mapUnitInfoLegion"),
    infoHp: document.getElementById("mapUnitInfoHp"),
    infoAttack: document.getElementById("mapUnitInfoAttack"),
    infoSpeed: document.getElementById("mapUnitInfoSpeed"),
    infoBrands: document.getElementById("mapUnitInfoBrands"),
    deckOverlay: document.getElementById("mapDeckOverlay"),
    deckClose: document.getElementById("mapDeckClose"),
    deckSelected: document.getElementById("mapSelectedLineup"),
    deckRoster: document.getElementById("mapDeckRoster"),
    deckStatus: document.getElementById("mapDeckStatus"),
    deckConfirm: document.getElementById("mapDeckConfirm"),
    cloudTransition: document.getElementById("mapCloudTransition"),
    monsterCount: document.getElementById("mapMonsterCount"),
    diceCardCount: document.getElementById("mapDiceCardCount"),
    rewardOverflowOverlay: document.getElementById("rewardOverflowOverlay"),
    rewardOverflowTitle: document.getElementById("rewardOverflowTitle"),
    rewardOverflowStatus: document.getElementById("rewardOverflowStatus"),
    rewardOverflowCards: document.getElementById("rewardOverflowCards"),
    rewardOverflowConfirm: document.getElementById("rewardOverflowConfirm")
  };
  let positions = [];
  let currentTiles = [];
  let currentButtons = [];
  let heroIndex = 0;
  let rolling = false;
  let diceFrameIndex = 0;
  const mapQuery = new URLSearchParams(window.location.search);
  const requestedMapId = mapQuery.get("map");
  const requestedResumeStep = Number(mapQuery.get("resume"));
  let resumeHeroIndex = Number.isInteger(requestedResumeStep) && requestedResumeStep >= 1 && requestedResumeStep <= 24 ? requestedResumeStep - 1 : null;
  let activeMapId = maps[requestedMapId] ? requestedMapId : "default";
  let enteringBattle = false;
  let eventOpen = false;
  let activeEventTileId = null;
  let activeEventRatio = 1280 / 714;
  let battleStep = 0;
  let battleTileType = "monster";
  let clearedMonsterSteps = new Set();
  let worldTreePrayed = false;
  let worldTreePrayerRolling = false;
  let selectedDeck = [];
  let bookOpen = false;
  let bookAnimating = false;
  let bookMotions = [];
  let lapReadyForRefresh = false;
  let cloudTransitioning = false;
  let diceControlHand = [];
  let pendingDiceControlId = null;
  let previousDiceRoll = null;
  let previousDiceControlId = null;
  let treasureRewardChosen = false;
  let selectedTreasureRewardId = null;
  let contamination = loadContamination();
  const ownedUnits = loadOwnedRoster();

  [...rollingFrames, ...resultFrames, ...treasureChestFrames, ...Object.values(tileEventScenes).map((scene) => scene.image).filter(Boolean), `${ROOT}events/home-interior.jpg?v=${EVENT_ASSET_VERSION}`].forEach((src) => { const image = new Image(); image.src = src; });

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function showWorldTreeContaminationChange(delta) {
    if (!el.eventContaminationChange || !Number.isFinite(delta) || delta === 0) return;
    const amount = Math.abs(Math.round(delta));
    const host = el.eventContaminationChange;
    host.className = "tile-event-contamination-change";
    host.dataset.direction = delta < 0 ? "down" : "up";
    host.textContent = delta < 0 ? `-${amount}` : `+${amount}`;
    host.setAttribute("aria-label", `오염도 ${delta < 0 ? "감소" : "증가"} ${amount}`);

    if (typeof V2DamageDigits !== "undefined") {
      if (delta < 0) V2DamageDigits.render(host, amount);
      else V2DamageDigits.renderHealing(host, amount);
    }

    host.hidden = false;
    host.classList.remove("is-showing");
    void host.offsetWidth;
    host.classList.add("is-showing");
  }

  function createUnitInstanceId(slug = "unit") {
    if (globalThis.crypto?.randomUUID) return `${slug}-${globalThis.crypto.randomUUID()}`;
    return `${slug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function normalizeOwnedUnit(unit) {
    const normalized = { ...unit };
    normalized.instanceId = typeof unit?.instanceId === "string" && unit.instanceId ? unit.instanceId : createUnitInstanceId(unit?.slug || "unit");
    normalized.currentHp = Math.max(0, Math.min(normalized.maxHp, Number.isFinite(normalized.currentHp) ? normalized.currentHp : normalized.maxHp));
    return normalized;
  }

  function saveOwnedRoster() {
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(OWNED_ROSTER_KEY, JSON.stringify([...ownedUnits.values()]));
    } catch (_) { /* Keep the current run usable without storage. */ }
    renderInventoryCounts();
  }

  function renderInventoryCounts() {
    if (el.monsterCount) el.monsterCount.textContent = `${ownedUnits.size}/${MONSTER_CAPACITY}`;
    if (el.diceCardCount) el.diceCardCount.textContent = `${diceControlHand.length}/${DICE_CONTROL_CAPACITY}`;
  }

  function addOwnedUnit(slug) {
    if (!TEST_DECK.some((entry) => entry.slug === slug) || ownedUnits.size >= MONSTER_CAPACITY) return null;
    const unit = normalizeOwnedUnit(V2Rules.individual(slug));
    ownedUnits.set(unit.instanceId, unit);
    saveOwnedRoster();
    renderBookRoster();
    renderInventoryCounts();
    if (!el.deckOverlay.hidden) renderDeckSelection();
    return unit;
  }

  function loadContamination() {
    try {
      if (typeof sessionStorage !== "undefined") {
        const saved = Number(sessionStorage.getItem(CONTAMINATION_KEY));
        if (Number.isFinite(saved)) return Math.max(0, Math.min(CONTAMINATION_MAX, saved));
      }
    } catch (_) { /* The map still works if storage is blocked. */ }
    return 0;
  }

  function contaminationStage(value = contamination) {
    for (let index = CONTAMINATION_STAGES.length - 1; index >= 0; index -= 1) {
      if (value >= CONTAMINATION_STAGES[index].min) return CONTAMINATION_STAGES[index];
    }
    return CONTAMINATION_STAGES[0];
  }

  function renderContamination() {
    const stage = contaminationStage();
    const percent = (contamination / CONTAMINATION_MAX) * 100;
    if (el.contaminationFill) el.contaminationFill.style.width = `${percent}%`;
    if (el.contaminationStage) el.contaminationStage.textContent = stage.label;
    if (el.contaminationValue) el.contaminationValue.textContent = `${contamination} / ${CONTAMINATION_MAX}`;
    if (el.contaminationHud) el.contaminationHud.dataset.stage = stage.id;
  }

  function setContamination(value) {
    contamination = Math.max(0, Math.min(CONTAMINATION_MAX, Math.round(Number(value) || 0)));
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(CONTAMINATION_KEY, String(contamination));
    } catch (_) { /* Keep the live run usable without storage. */ }
    if (typeof V2DamageDigits !== "undefined") {
    V2DamageDigits.prepare().catch(error => console.warn(error));
    V2DamageDigits.prepareHealing().catch(error => console.warn(error));
  }
  renderContamination();
    return contamination;
  }

  function addContamination(amount) {
    return setContamination(contamination + Number(amount || 0));
  }

  function hasInjuredOwnedUnits() {
    return [...ownedUnits.values()].some((unit) => Number.isFinite(unit.currentHp) && unit.currentHp < unit.maxHp);
  }

  function healOwnedRosterFull() {
    for (const unit of ownedUnits.values()) unit.currentHp = unit.maxHp;
    saveOwnedRoster();
    renderBookRoster();
    if (!el.deckOverlay.hidden) renderDeckSelection();
  }

  function loadOwnedRoster() {
    let saved;
    try { if (typeof sessionStorage !== "undefined") saved = JSON.parse(sessionStorage.getItem(OWNED_ROSTER_KEY)); } catch (_) { /* Private browsing can block storage. */ }
    const valid = Array.isArray(saved) && saved.length <= 100 && saved.every((unit) =>
      TEST_DECK.some((entry) => entry.slug === unit?.slug) && Number.isFinite(unit.maxHp) &&
      Number.isFinite(unit.attack) && Number.isFinite(unit.speed) && Array.isArray(unit.brands) &&
      unit.brands.length <= 3 && unit.brands.every(V2Rules.validateBrand));
    const source = valid ? saved : STARTING_UNIT_SLUGS.map((slug) => V2Rules.individual(slug));
    const usedIds = new Set();
    const roster = source.map((unit) => {
      const normalized = normalizeOwnedUnit(unit);
      while (usedIds.has(normalized.instanceId)) normalized.instanceId = createUnitInstanceId(normalized.slug);
      usedIds.add(normalized.instanceId);
      return normalized;
    });
    try { if (typeof sessionStorage !== "undefined") sessionStorage.setItem(OWNED_ROSTER_KEY, JSON.stringify(roster)); } catch (_) { /* The current map still works without storage. */ }
    return new Map(roster.map((unit) => [unit.instanceId, unit]));
  }

  function syncInventoryStateFromStorage() {
    try {
      if (typeof sessionStorage === "undefined") return;

      const savedRoster = JSON.parse(sessionStorage.getItem(OWNED_ROSTER_KEY));
      if (Array.isArray(savedRoster)) {
        const refreshed = savedRoster
          .filter((unit) => TEST_DECK.some((entry) => entry.slug === unit?.slug))
          .map(normalizeOwnedUnit);
        const refreshedIds = new Set(refreshed.map((unit) => unit.instanceId));
        ownedUnits.clear();
        for (const unit of refreshed) ownedUnits.set(unit.instanceId, unit);
        selectedDeck = selectedDeck.filter((instanceId) => refreshedIds.has(instanceId));
      }

      const savedDice = JSON.parse(sessionStorage.getItem(DICE_CONTROL_INVENTORY_KEY));
      if (Array.isArray(savedDice) && savedDice.every((id) => V2DiceControl.cards.some((card) => card.id === id))) {
        diceControlHand = savedDice.slice(0, DICE_CONTROL_CAPACITY)
          .map((id) => V2DiceControl.cards.find((card) => card.id === id))
          .filter(Boolean);
      }

      renderBookRoster();
      renderDiceControlHand();
      if (!el.deckOverlay.hidden) renderDeckSelection();
      renderInventoryCounts();
    } catch (_) { /* Keep current in-memory inventory if storage cannot be read. */ }
  }

  function perimeterPositions() {
    const positions = [];
    for (let index = 0; index < 8; index += 1) positions.push({ x: 20 + index * (70 / 7), y: 12 });
    for (let index = 0; index < 4; index += 1) positions.push({ x: 94, y: 29 + index * (42 / 3) });
    for (let index = 0; index < 7; index += 1) positions.push({ x: 79 - index * (58 / 6), y: 85 });
    for (let index = 0; index < 5; index += 1) positions.push({ x: 6, y: 69 - index * (54 / 4) });
    return positions;
  }

  function shuffle(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [items[index], items[target]] = [items[target], items[index]];
    }
    return items;
  }

  function tileDefinitionById(id) {
    return tileTypes.find((tile) => tile.id === id) || Object.values(fixedTiles).find((tile) => tile.id === id) || null;
  }

  function isValidMapPool(pool) {
    return Array.isArray(pool) &&
      pool.length === 24 &&
      pool.every((tile) => tile && typeof tile.id === "string" && tileDefinitionById(tile.id));
  }

  function hasValidMapDistribution(pool) {
    if (!isValidMapPool(pool)) return false;
    if (pool[0]?.id !== "fortune-teller-camp" || pool[8]?.id !== "village" || pool[HOME_INDEX]?.id !== "home") return false;

    const counts = pool.reduce((result, tile) => {
      result[tile.id] = (result[tile.id] || 0) + 1;
      return result;
    }, {});

    const fixedCountsValid =
      counts["fortune-teller-camp"] === 1 &&
      counts.village === 1 &&
      counts.home === 1 &&
      counts.graveyard === 2 &&
      counts.altar === 1 &&
      counts.unknown === 1 &&
      counts.forest === 2 &&
      counts.rest === 2 &&
      counts["rare-monster"] === 1 &&
      counts.gem === 2 &&
      counts.event === 3 &&
      counts.warp === 2;

    if (!fixedCountsValid) return false;

    const bossCount = counts.boss || 0;
    const basicCount = counts.basic || 0;
    const monsterCount = counts.monster || 0;

    if (bossCount === 0) {
      return pool[23]?.id !== "boss" &&
        ((basicCount === 3 && monsterCount === 2) || (basicCount === 2 && monsterCount === 3));
    }

    return bossCount === 1 &&
      pool[23]?.id === "boss" &&
      basicCount === 0 &&
      monsterCount === 4;
  }

  function loadSavedMapLayout() {
    if (resumeHeroIndex === null) return null;
    try {
      sessionStorage.removeItem(LEGACY_MAP_LAYOUT_KEY);
      const ids = JSON.parse(sessionStorage.getItem(MAP_LAYOUT_KEY));
      if (!Array.isArray(ids) || ids.length !== 24) {
        sessionStorage.removeItem(MAP_LAYOUT_KEY);
        return null;
      }
      const restored = ids.map(tileDefinitionById);
      if (!hasValidMapDistribution(restored)) {
        sessionStorage.removeItem(MAP_LAYOUT_KEY);
        return null;
      }
      return restored;
    } catch (_) {
      try {
        sessionStorage.removeItem(MAP_LAYOUT_KEY);
        sessionStorage.removeItem(LEGACY_MAP_LAYOUT_KEY);
      } catch (_) { /* Ignore storage cleanup failure. */ }
      return null;
    }
  }

  function saveMapLayout(tiles = currentTiles) {
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(MAP_LAYOUT_KEY, JSON.stringify(tiles.map((tile) => tile.id)));
    } catch (_) { /* Keep the live map usable without storage. */ }
  }

  function loadClearedMonsterSteps() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(MAP_CLEARED_MONSTER_KEY));
      clearedMonsterSteps = new Set(
        Array.isArray(saved)
          ? saved.filter((step) => Number.isInteger(step) && step >= 1 && step <= 24)
          : []
      );
    } catch (_) {
      clearedMonsterSteps = new Set();
    }
  }

  function resetClearedMonsterSteps() {
    clearedMonsterSteps = new Set();
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(MAP_CLEARED_MONSTER_KEY);
    } catch (_) { /* A fresh map still works without storage. */ }
  }

  function loadWorldTreePrayer() {
    try {
      worldTreePrayed = typeof sessionStorage !== "undefined" && sessionStorage.getItem(WORLD_TREE_PRAYER_KEY) === "1";
    } catch (_) {
      worldTreePrayed = false;
    }
  }

  function resetWorldTreePrayer() {
    worldTreePrayed = false;
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(WORLD_TREE_PRAYER_KEY);
    } catch (_) { /* A fresh lap still works without storage. */ }
  }

  function markWorldTreePrayed() {
    worldTreePrayed = true;
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(WORLD_TREE_PRAYER_KEY, "1");
    } catch (_) { /* Prayer still works without storage persistence. */ }
  }

  function isMonsterBattleTile(tile) {
    return MONSTER_BATTLE_TILE_IDS.has(tile?.id);
  }

  function isMonsterTileCleared(step) {
    return clearedMonsterSteps.has(step);
  }

  function getTileImage(tile, step) {
    // The four state-specific monster PNGs added on 2026-09-27 are currently
    // malformed and fail to decode on browsers. Keep the files in the repo for
    // replacement, but render known-good base artwork so monster tiles never vanish.
    if (tile.id === "rare-monster") return `${ROOT}tiles/monster.png?v=${TILE_ASSET_VERSION}`;
    if (tile.id === "boss") return `${ROOT}tiles/boss.png?v=${TILE_ASSET_VERSION}`;
    if (tile.id === "monster") return `${ROOT}tiles/monster.png?v=${TILE_ASSET_VERSION}`;
    return `${ROOT}tiles/${tile.id}.png?v=${TILE_ASSET_VERSION}`;
  }

  function createPool() {
    const stage = contaminationStage();
    const bossActive = contamination >= BOSS_CONTAMINATION_MIN;
    const monsterDelta = Math.max(0, stage.monsterTiles - 3);
    const stagedTypes = tileTypes.map((tile) => {
      if (tile.id === "monster") return { ...tile, count: Math.max(1, stage.monsterTiles - 1) };
      if (tile.id === "rare-monster") return { ...tile, count: 1 };
      if (tile.id === "basic") return { ...tile, count: Math.max(0, tile.count - monsterDelta) + (bossActive ? 0 : 1) };
      return tile;
    });

    const pool = Array(24);
    pool[0] = fixedTiles.fortune;
    pool[8] = fixedTiles.village;
    pool[HOME_INDEX] = fixedTiles.home;
    if (bossActive) pool[23] = fixedTiles.boss;

    // Array(24) is sparse: reduce() skips holes, so count empties from length minus real entries.
    const emptySlots = pool.length - pool.filter(Boolean).length;
    let randomTiles = stagedTypes.flatMap((tile) => Array.from({ length: Math.max(0, tile.count) }, () => tile));

    // The board must always contain exactly 24 real tiles. If future balance
    // changes make the random pool count drift, repair the count before shuffle.
    const basicTile = tileDefinitionById("basic");
    if (randomTiles.length < emptySlots && basicTile) {
      randomTiles.push(...Array.from({ length: emptySlots - randomTiles.length }, () => basicTile));
    } else if (randomTiles.length > emptySlots) {
      // Trim only generic basic tiles first so encounter/event counts stay intact.
      let excess = randomTiles.length - emptySlots;
      randomTiles = randomTiles.filter((tile) => {
        if (excess > 0 && tile.id === "basic") {
          excess -= 1;
          return false;
        }
        return true;
      });
      if (randomTiles.length > emptySlots) randomTiles.length = emptySlots;
    }

    shuffle(randomTiles);
    for (let index = 0, randomIndex = 0; index < pool.length; index += 1) {
      if (!pool[index]) pool[index] = randomTiles[randomIndex++] || basicTile;
    }

    if (!hasValidMapDistribution(pool)) {
      throw new Error(`Invalid 24-tile map distribution: ${pool.filter(Boolean).length}/24`);
    }
    return pool;
  }

  function selectTile(button, tile, step) {
    el.ring.querySelectorAll(".map-tile.is-selected").forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
    el.tileName.textContent = `${step}번 · ${tile.name}`;
  }

  function enterMonsterBattle(tile, step) {
    if (!isMonsterBattleTile(tile) || enteringBattle) return false;
    if (isMonsterTileCleared(step)) {
      el.tileName.textContent = `${step}번 · ${tile.name} · 처치 완료`;
      el.diceResult.textContent = "이미 처치한 마물 타일 · 전투 없음";
      return false;
    }
    forceCloseBookRoster();
    enteringBattle = true;
    battleStep = step;
    battleTileType = tile.id;
    selectedDeck = [];
    el.diceButton.disabled = true;
    el.regenerate.disabled = true;
    el.tileName.textContent = `${step}번 · ${tile.name} 출현 · 출전 마물 선택`;
    el.board.classList.add("is-deck-selecting");
    el.deckOverlay.classList.remove("is-preview");
    el.deckClose.hidden = true;
    renderDeckSelection();
    el.deckOverlay.hidden = false;
    el.deckOverlay.classList.remove("is-open");
    void el.deckOverlay.offsetWidth;
    el.deckOverlay.classList.add("is-open");
    return true;
  }

  function openDiceControlCard() {
    if (rolling || eventOpen || enteringBattle || !el.infoOverlay.hidden) return;
    forceCloseBookRoster();
    el.diceButton.disabled = true;
    el.regenerate.disabled = true;
    el.cardDeckImage.src = CARD_DECK_IMAGES.open;
    el.cardDeckButton.setAttribute("aria-expanded", "true");
    el.diceControlOverlay.hidden = false;
    el.diceControlOverlay.classList.remove("is-closing");
    void el.diceControlOverlay.offsetWidth;
    el.diceControlOverlay.classList.add("is-open");
    el.diceControlBackdrop.focus();
  }

  function diceControlState() {
    return { previousRoll: previousDiceRoll, previousCardId: previousDiceControlId };
  }

  function saveDiceControlInventory() {
    try {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(DICE_CONTROL_INVENTORY_KEY, JSON.stringify(diceControlHand.map((card) => card.id)));
      }
    } catch (_) { /* Keep the current run usable without storage. */ }
    renderInventoryCounts();
  }

  function addDiceControlCard(cardId) {
    const card = V2DiceControl.cards.find((entry) => entry.id === cardId);
    if (!card || diceControlHand.length >= DICE_CONTROL_CAPACITY) return null;
    diceControlHand.push(card);
    saveDiceControlInventory();
    renderDiceControlHand();
    renderInventoryCounts();
    return card;
  }

  function loadDiceControlInventory() {
    let saved;
    try {
      if (typeof sessionStorage !== "undefined") saved = JSON.parse(sessionStorage.getItem(DICE_CONTROL_INVENTORY_KEY));
    } catch (_) { /* Storage can be unavailable. */ }
    if (Array.isArray(saved) && saved.every((id) => V2DiceControl.cards.some((card) => card.id === id))) {
      return saved.map((id) => V2DiceControl.cards.find((card) => card.id === id)).filter(Boolean);
    }
    const startingPool = V2DiceControl.cards.filter((card) => !STARTING_DICE_EXCLUDED_IDS.has(card.id));
    const startingCard = startingPool[Math.floor(Math.random() * startingPool.length)];
    const inventory = startingCard ? [startingCard] : [];
    try {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(DICE_CONTROL_INVENTORY_KEY, JSON.stringify(inventory.map((card) => card.id)));
      }
    } catch (_) { /* Keep the current run usable without storage. */ }
    return inventory;
  }

  const DICE_CONTROL_CARD_SLOTS = Object.freeze([
    Object.freeze({ x: "4%", y: "-1%", rot: "10deg" }),
    Object.freeze({ x: "-78%", y: "-6%", rot: "5deg" }),
    Object.freeze({ x: "-160%", y: "-9%", rot: "0deg" }),
    Object.freeze({ x: "-242%", y: "-7%", rot: "-5deg" }),
    Object.freeze({ x: "-324%", y: "-3%", rot: "-10deg" })
  ]);

  function screenDeltaToMapY(deltaX, deltaY) {
    const transform = el.mapLab ? getComputedStyle(el.mapLab).transform : "none";
    if (!transform || transform === "none" || typeof DOMMatrixReadOnly === "undefined") return deltaY;
    try {
      const matrix = new DOMMatrixReadOnly(transform);
      const det = matrix.a * matrix.d - matrix.b * matrix.c;
      if (Math.abs(det) < .0001) return deltaY;
      return (-matrix.b * deltaX + matrix.a * deltaY) / det;
    } catch (_) {
      return deltaY;
    }
  }

  function renderDiceControlHand() {
    el.diceControlHand.replaceChildren();
    for (const [index, card] of diceControlHand.entries()) {
      const availability = V2DiceControl.canUse(card.id, diceControlState());
      const button = document.createElement("button");
      const image = document.createElement("img");
      const slot = DICE_CONTROL_CARD_SLOTS[Math.min(index, DICE_CONTROL_CARD_SLOTS.length - 1)];
      button.type = "button";
      button.className = "dice-control-card";
      button.style.setProperty("--i", index + 1);
      button.style.setProperty("--card-x", slot.x);
      button.style.setProperty("--card-y", slot.y);
      button.style.setProperty("--card-rot", slot.rot);
      button.style.setProperty("--card-delay", `${index * 55}ms`);
      button.style.zIndex = String(DICE_CONTROL_CAPACITY - index);
      button.style.setProperty("--drag-y", "0px");
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", "false");
      button.disabled = !availability.ok;
      button.title = availability.ok
        ? `${card.label}: 위로 살짝 끌어 사용 · ${card.description}`
        : availability.reason;
      image.src = V2DiceControl.imagePath(card, "ko");
      image.alt = `${card.label}: ${card.description}`;
      button.append(image);

      if (availability.ok) {
        let pointerId = null;
        let startX = 0;
        let startY = 0;
        let dragY = 0;
        let moved = false;
        const USE_THRESHOLD = -34;

        const resetDrag = () => {
          button.classList.remove("is-dragging", "is-use-ready");
          button.style.setProperty("--drag-y", "0px");
          button.setAttribute("aria-selected", "false");
          pointerId = null;
          dragY = 0;
          moved = false;
        };

        button.addEventListener("pointerdown", (event) => {
          if (pendingDiceControlId || pointerId !== null) return;
          event.preventDefault();
          pointerId = event.pointerId;
          startX = event.clientX;
          startY = event.clientY;
          dragY = 0;
          moved = false;
          button.setPointerCapture(pointerId);
          button.classList.add("is-dragging");
          button.setAttribute("aria-selected", "true");
        });

        button.addEventListener("pointermove", (event) => {
          if (event.pointerId !== pointerId) return;
          event.preventDefault();
          const localDeltaY = screenDeltaToMapY(event.clientX - startX, event.clientY - startY);
          dragY = Math.max(-110, Math.min(0, localDeltaY));
          moved ||= Math.abs(dragY) > 3;
          button.style.setProperty("--drag-y", `${dragY}px`);
          button.classList.toggle("is-use-ready", dragY <= USE_THRESHOLD);
        });

        button.addEventListener("pointerup", async (event) => {
          if (event.pointerId !== pointerId) return;
          event.preventDefault();
          const shouldUse = dragY <= USE_THRESHOLD;
          if (button.hasPointerCapture(pointerId)) button.releasePointerCapture(pointerId);
          if (!shouldUse) {
            resetDrag();
            return;
          }
          button.classList.remove("is-dragging", "is-use-ready");
          button.classList.add("is-consuming");
          button.style.setProperty("--drag-y", "-120px");
          await wait(140);
          useDiceControlCard(card.id);
        });

        button.addEventListener("pointercancel", resetDrag);
        button.addEventListener("lostpointercapture", () => {
          if (!button.classList.contains("is-consuming") && pointerId !== null) resetDrag();
        });

        button.addEventListener("click", (event) => {
          event.preventDefault();
          if (!moved) {
            el.diceResult.textContent = `${card.label} · 위로 살짝 끌어 사용`;
          }
        });

        button.addEventListener("keydown", (event) => {
          if ((event.key === "Enter" || event.key === " ") && !pendingDiceControlId) {
            event.preventDefault();
            useDiceControlCard(card.id);
          }
        });
      }

      el.diceControlHand.append(button);
    }
  }

  function dealDiceControlHand() {
    diceControlHand = loadDiceControlInventory().slice(0, DICE_CONTROL_CAPACITY);
    saveDiceControlInventory();
    renderDiceControlHand();
    renderInventoryCounts();
  }

  async function useDiceControlCard(cardId) {
    if (pendingDiceControlId || rolling) {
      el.diceResult.textContent = pendingDiceControlId
        ? "이미 다음 굴림에 사용할 카드가 선택되어 있습니다."
        : "주사위가 이미 굴러가고 있습니다.";
      renderDiceControlHand();
      return;
    }
    const availability = V2DiceControl.canUse(cardId, diceControlState());
    if (!availability.ok) {
      el.diceResult.textContent = availability.reason;
      renderDiceControlHand();
      return;
    }
    const card = V2DiceControl.cards.find((entry) => entry.id === cardId);
    pendingDiceControlId = cardId;
    const ownedIndex = diceControlHand.findIndex((entry) => entry.id === cardId);
    if (ownedIndex >= 0) diceControlHand.splice(ownedIndex, 1);
    saveDiceControlInventory();
    renderInventoryCounts();
    el.diceResult.textContent = `${card.label} · 사용 · 자동으로 굴립니다`;
    renderDiceControlHand();

    await closeDiceControlCard();
    if (!eventOpen && !enteringBattle && !rolling && pendingDiceControlId === cardId) {
      await rollAndMove();
    }
  }

  async function closeDiceControlCard() {
    if (el.diceControlOverlay.hidden) return;
    el.diceControlOverlay.classList.remove("is-open");
    el.diceControlOverlay.classList.add("is-closing");
    await wait(360);
    el.diceControlOverlay.hidden = true;
    el.diceControlOverlay.classList.remove("is-closing");
    el.cardDeckImage.src = CARD_DECK_IMAGES.closed;
    el.cardDeckButton.setAttribute("aria-expanded", "false");
    el.diceButton.disabled = false;
    el.regenerate.disabled = false;
    el.cardDeckButton.focus();
  }

  function toggleDiceControlCard() {
    if (el.diceControlOverlay.hidden) openDiceControlCard();
    else closeDiceControlCard();
  }

  function toggleDeckUnit(instanceId) {
    const selectedIndex = selectedDeck.indexOf(instanceId);
    if (selectedIndex >= 0) selectedDeck.splice(selectedIndex, 1);
    else if (selectedDeck.length < 4 && ownedUnits.has(instanceId)) selectedDeck.push(instanceId);
    renderDeckSelection();
  }

  function renderDeckSelection() {
    el.deckSelected.replaceChildren();
    for (let index = 0; index < 4; index += 1) {
      const instanceId = selectedDeck[index];
      const owned = instanceId ? ownedUnits.get(instanceId) : null;
      const entry = owned ? TEST_DECK.find((unit) => unit.slug === owned.slug) : null;
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = entry ? "selected-slot" : "selected-slot is-empty";
      if (entry) {
        const image = document.createElement("img");
        const rate = document.createElement("span");
        image.src = `art/v2-style/ui/unit-card-${entry.slug}.png?v=19`;
        image.alt = `${index + 1}번째 ${entry.name}`;
        rate.className = "map-target-rate";
        rate.textContent = `피격 ${TARGET_RATES[selectedDeck.length][index]}%`;
        slot.title = `${entry.name} 선택 해제`;
        slot.addEventListener("click", () => toggleDeckUnit(instanceId));
        slot.append(image, rate);
      } else slot.disabled = true;
      el.deckSelected.append(slot);
    }
    el.deckRoster.replaceChildren();
    for (const owned of ownedUnits.values()) {
      const entry = TEST_DECK.find((unit) => unit.slug === owned.slug);
      if (!entry) continue;
      const selectedIndex = selectedDeck.indexOf(owned.instanceId);
      const button = document.createElement("button");
      button.type = "button";
      button.classList.toggle("is-selected", selectedIndex >= 0);
      button.setAttribute("aria-pressed", selectedIndex >= 0 ? "true" : "false");
      button.dataset.instanceId = owned.instanceId;
      const image = document.createElement("img");
      image.src = `art/v2-style/ui/unit-card-${entry.slug}.png?v=19`;
      image.alt = "";
      const name = document.createElement("span");
      name.textContent = entry.name;
      button.append(image, name);
      button.addEventListener("click", () => toggleDeckUnit(owned.instanceId));
      el.deckRoster.append(button);
    }
    const rates = TARGET_RATES[selectedDeck.length] || [];
    el.deckStatus.textContent = rates.length ? `마물 카드 ${selectedDeck.length} / 4 · 왼쪽부터 피격 ${rates.join(" · ")}%` : "마물 카드 0 / 4";
    el.deckConfirm.disabled = selectedDeck.length < 1;
  }

  function renderBookRoster() {
    el.bookRoster.replaceChildren();
    for (const owned of ownedUnits.values()) {
      const entry = TEST_DECK.find((unit) => unit.slug === owned.slug);
      if (!entry) continue;
      const button = document.createElement("button");
      const image = document.createElement("img");
      const name = document.createElement("span");
      button.type = "button";
      button.dataset.instanceId = owned.instanceId;
      button.setAttribute("aria-label", `${entry.name} 카드 확인`);
      button.setAttribute("aria-pressed", "false");
      image.src = `art/v2-style/ui/unit-card-${entry.slug}.png?v=19`;
      image.alt = "";
      name.textContent = entry.name;
      button.append(image, name);
      button.addEventListener("click", () => {
        if (bookAnimating) return;
        const inspecting = button.classList.contains("is-inspecting");
        clearBookSelection();
        if (!inspecting) {
          button.classList.add("is-inspecting");
          button.setAttribute("aria-pressed", "true");
          openBookUnitInfo(ownedUnits.get(owned.instanceId));
        }
      });
      el.bookRoster.append(button);
    }
  }

  function clearBookSelection() {
    el.bookRoster.querySelectorAll("button.is-inspecting").forEach((card) => {
      card.classList.remove("is-inspecting");
      card.setAttribute("aria-pressed", "false");
    });
  }

  function escapeInfo(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function bookBrandIcon(key) {
    const view = BRAND_ICON_VIEWS[key];
    if (!view) return '<span class="map-passive-symbol" aria-hidden="true">◇</span>';
    const sheet = ["combo", "freeze", "lightspeed", "counter"].includes(key) ? "brand-icons-extra-sheet.jpg" : "brand-icons-sheet.jpg";
    return `<svg class="map-brand-icon" viewBox="${view.join(" ")}" aria-hidden="true"><image href="art/v2-style/ui/${sheet}" width="1280" height="575" /></svg>`;
  }

  function openBookUnitInfo(unit) {
    if (!unit) return;
    el.infoName.textContent = unit.name;
    const portraitVersion = unit.slug === "siren" ? 3 : unit.slug === "minotaur" ? 2 : 1;
    el.infoPortrait.src = `art/v2-style/ui/info-portraits/${unit.slug}.png?v=${portraitVersion}`;
    el.infoPortrait.alt = unit.name;
    el.infoGrade.textContent = GRADE_LABELS[unit.grade] || "미지정";
    el.infoLegion.textContent = unit.legions.map((key) => LEGION_LABELS[key] || key).join(" · ") || "미지정";
    el.infoHp.textContent = `${unit.maxHp} / ${unit.maxHp}`;
    el.infoAttack.textContent = String(unit.attack);
    el.infoSpeed.textContent = String(unit.speed);
    const passiveName = unit.passive?.name || "패시브 없음";
    el.infoBrands.innerHTML = `<div class="map-passive-heading"><span class="map-passive-symbol" aria-hidden="true">◇</span><span>${escapeInfo(passiveName)}</span></div>` +
      (unit.brands.map((brand) => `<div class="map-brand-heading">${bookBrandIcon(brand.type)}<h4>${escapeInfo(V2Rules.definitions[brand.type]?.name || brand.type)}</h4></div>`).join("") || '<p class="map-unit-info-empty">낙인 없음</p>');
    el.infoOverlay.hidden = false;
    el.infoClose.focus();
  }

  function closeBookUnitInfo() {
    el.infoOverlay.hidden = true;
  }

  function setBookVisual(isOpen) {
    el.bookButton.classList.toggle("is-open", isOpen);
    el.bookImage.src = `art/v2-style/ui/map-book-${isOpen ? "open" : "closed"}.png`;
    el.bookButton.setAttribute("aria-label", isOpen ? "보유 마물 카드 닫기" : "보유 마물 카드 열기");
    el.bookButton.setAttribute("aria-pressed", String(isOpen));
  }

  async function animateBookCards(outward) {
    const cards = [...el.bookRoster.querySelectorAll("button")];
    if (!cards.length || typeof cards[0].animate !== "function" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Use board-local coordinates: the whole board rotates on portrait phones,
    // so viewport rectangles would turn a sideways slide into an up/down flight.
    const bookExitX = el.bookButton.offsetLeft + el.bookButton.offsetWidth * .9;
    const animations = cards.map((card, index) => {
      const cardX = el.bookRoster.offsetLeft + card.offsetLeft + card.offsetWidth / 2;
      const tucked = `translateX(${bookExitX - cardX}px) translateY(10%) rotate(var(--card-tilt, 0deg)) scale(.35)`;
      const settled = window.getComputedStyle(card).transform;
      return card.animate(outward
        ? [{ transform: tucked, opacity: 0 }, { transform: settled, opacity: 1 }]
        : [{ transform: settled, opacity: 1 }, { transform: tucked, opacity: 0 }],
      { duration: 320, delay: (outward ? index : cards.length - 1 - index) * 55,
        easing: outward ? "cubic-bezier(.16,.82,.24,1)" : "cubic-bezier(.5,0,.8,.3)", fill: outward ? "backwards" : "forwards" });
    });
    bookMotions = animations;
    await Promise.all(animations.map((animation) => animation.finished.catch(() => {})));
    animations.forEach((animation) => animation.cancel());
    bookMotions = [];
  }

  function forceCloseBookRoster() {
    bookMotions.forEach((animation) => animation.cancel());
    bookMotions = [];
    closeBookUnitInfo();
    clearBookSelection();
    bookOpen = false;
    bookAnimating = false;
    el.bookRoster.hidden = true;
    setBookVisual(false);
  }

  async function toggleBookRoster() {
    if (bookAnimating || enteringBattle || !el.infoOverlay.hidden) return;
    bookAnimating = true;
    if (!bookOpen) {
      bookOpen = true;
      setBookVisual(true);
      el.bookRoster.hidden = false;
      if (typeof V2Sfx !== "undefined") V2Sfx.play("bookCardsOpen");
      await animateBookCards(true);
    } else {
      clearBookSelection();
      await animateBookCards(false);
      el.bookRoster.hidden = true;
      bookOpen = false;
      setBookVisual(false);
    }
    bookAnimating = false;
  }

  function confirmMonsterBattle() {
    if (selectedDeck.length < 1 || selectedDeck.length > 4) return;
    el.deckConfirm.disabled = true;
    el.deckStatus.textContent = "전장으로 이동 중…";
    const encounterId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    saveMapLayout();
    const selectedUnits = selectedDeck.map((instanceId) => ownedUnits.get(instanceId)).filter(Boolean);
    const params = new URLSearchParams({
      from: "map",
      map: activeMapId,
      tile: String(battleStep),
      allies: selectedUnits.map((unit) => unit.slug).join(","),
      allyIds: selectedUnits.map((unit) => unit.instanceId).join(","),
      encounter: encounterId,
      encounterType: battleTileType,
      contamination: String(contamination)
    });
    if (typeof V2Music !== "undefined") V2Music.handoff("battle");
    window.location.assign(`v2-auto-battle-practice.html?${params}`);
  }

  function fitTileEventScene() {
    const width = Math.min(el.board.clientWidth * .62, el.board.clientHeight * .65 * activeEventRatio);
    el.eventScene.style.width = `${width}px`;
    el.eventScene.style.height = `${width / activeEventRatio}px`;
  }

  function createTreasureRewards() {
    const unitRewards = TEST_DECK.map((unit) => ({
      type: "unit",
      id: unit.slug,
      label: unit.name,
      image: `art/v2-style/ui/unit-card-${unit.slug}.png?v=19`
    }));
    const diceRewards = V2DiceControl.cards.map((card) => ({
      type: "dice",
      id: card.id,
      label: card.label,
      image: V2DiceControl.imagePath(card, "ko")
    }));
    const mixed = shuffle([...unitRewards, ...diceRewards]).slice(0, 3);
    return mixed;
  }

  async function animateTreasureRewardToTarget(reward, selectedCard) {
    const targetButton = reward.type === "unit" ? el.bookButton : el.cardDeckButton;
    const targetImage = reward.type === "unit" ? el.bookImage : el.cardDeckImage;
    const sourceImage = selectedCard.querySelector("img");
    if (!targetButton || !targetImage || !sourceImage) return;

    const sourceRect = sourceImage.getBoundingClientRect();
    const targetRect = targetImage.getBoundingClientRect();
    const flyer = document.createElement("div");
    const flyerImage = sourceImage.cloneNode(true);
    const boardAngle = window.matchMedia?.("(orientation: portrait)").matches ? 90 : 0;

    flyer.className = "treasure-reward-flyer";
    flyer.style.left = `${sourceRect.left}px`;
    flyer.style.top = `${sourceRect.top}px`;
    flyer.style.width = `${sourceRect.width}px`;
    flyer.style.height = `${sourceRect.height}px`;
    flyerImage.alt = "";
    flyerImage.style.transform = `rotate(${boardAngle}deg)`;
    flyer.append(flyerImage);
    document.body.append(flyer);

    selectedCard.style.visibility = "hidden";

    const sourceCenterX = sourceRect.left + sourceRect.width / 2;
    const sourceCenterY = sourceRect.top + sourceRect.height / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    const dx = targetCenterX - sourceCenterX;
    const dy = targetCenterY - sourceCenterY;
    const arc = Math.max(34, Math.min(92, Math.hypot(dx, dy) * .12));

    if (typeof flyer.animate === "function" && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      const motion = flyer.animate([
        { transform: "translate(0, 0) scale(1)", opacity: 1, offset: 0 },
        { transform: `translate(${dx * .38}px, ${dy * .28 - arc}px) scale(.94)`, opacity: 1, offset: .42 },
        { transform: `translate(${dx * .82}px, ${dy * .78 - arc * .18}px) scale(.48)`, opacity: 1, offset: .82 },
        { transform: `translate(${dx}px, ${dy}px) scale(.10)`, opacity: 0, offset: 1 }
      ], {
        duration: 880,
        easing: "cubic-bezier(.18,.78,.2,1)",
        fill: "forwards"
      });
      await motion.finished.catch(() => {});
    } else {
      flyer.style.transform = `translate(${dx}px, ${dy}px) scale(.1)`;
      flyer.style.opacity = "0";
      await wait(40);
    }

    flyer.remove();
    targetButton.classList.remove("is-reward-receiving");
    void targetButton.offsetWidth;
    targetButton.classList.add("is-reward-receiving");
    await wait(260);
    targetButton.classList.remove("is-reward-receiving");
  }

  function rewardCardImage(type, item) {
    return type === "unit"
      ? `art/v2-style/ui/unit-card-${item.slug}.png?v=19`
      : V2DiceControl.imagePath(item, "ko");
  }

  function forceDiscardForReward(reward) {
    return new Promise((resolve) => {
      const type = reward.type;
      const isUnit = type === "unit";
      const full = isUnit ? ownedUnits.size >= MONSTER_CAPACITY : diceControlHand.length >= DICE_CONTROL_CAPACITY;
      if (!full) {
        const acquired = isUnit ? addOwnedUnit(reward.id) : addDiceControlCard(reward.id);
        resolve({ acquired: Boolean(acquired), keptReward: Boolean(acquired) });
        return;
      }

      const pending = isUnit
        ? normalizeOwnedUnit(V2Rules.individual(reward.id))
        : V2DiceControl.cards.find((entry) => entry.id === reward.id);
      if (!pending) { resolve({ acquired: false, keptReward: false }); return; }

      const existing = isUnit
        ? [...ownedUnits.values()].map((unit) => ({ key: unit.instanceId, item: unit, isNew: false }))
        : diceControlHand.map((card, index) => ({ key: `${index}:${card.id}`, item: card, index, isNew: false }));
      const pendingEntry = { key: "__new__", item: pending, isNew: true };
      const candidates = [...existing, pendingEntry];
      let selectedKey = null;

      el.rewardOverflowTitle.textContent = isUnit ? "마물 보관함 10/10" : "주사위 카드더미 5/5";
      el.rewardOverflowStatus.textContent = "새 보상을 받으려면 버릴 카드 1장을 선택하세요.";
      el.rewardOverflowCards.replaceChildren();
      el.rewardOverflowConfirm.disabled = true;

      for (const candidate of candidates) {
        const button = document.createElement("button");
        const image = document.createElement("img");
        const label = document.createElement("span");
        button.type = "button";
        button.className = "reward-overflow-card";
        button.dataset.key = candidate.key;
        image.src = rewardCardImage(type, candidate.item);
        image.alt = "";
        label.textContent = candidate.item.name || candidate.item.label || reward.label;
        button.append(image, label);
        if (candidate.isNew) {
          const badge = document.createElement("b");
          badge.textContent = "신규";
          button.append(badge);
        }
        button.addEventListener("click", () => {
          selectedKey = candidate.key;
          el.rewardOverflowCards.querySelectorAll(".reward-overflow-card").forEach((card) =>
            card.classList.toggle("is-selected", card.dataset.key === selectedKey));
          el.rewardOverflowConfirm.disabled = false;
          el.rewardOverflowStatus.textContent = `${label.textContent} 버리기 선택됨`;
        });
        el.rewardOverflowCards.append(button);
      }

      el.rewardOverflowOverlay.hidden = false;
      el.rewardOverflowConfirm.focus();

      el.rewardOverflowConfirm.onclick = () => {
        if (!selectedKey) return;
        let keptReward = selectedKey !== "__new__";
        if (isUnit) {
          if (selectedKey !== "__new__") {
            ownedUnits.delete(selectedKey);
            ownedUnits.set(pending.instanceId, pending);
            saveOwnedRoster();
            renderBookRoster();
            if (!el.deckOverlay.hidden) renderDeckSelection();
          }
        } else {
          if (selectedKey !== "__new__") {
            const selected = candidates.find((candidate) => candidate.key === selectedKey);
            if (selected && Number.isInteger(selected.index)) diceControlHand.splice(selected.index, 1);
            diceControlHand.push(pending);
            saveDiceControlInventory();
            renderDiceControlHand();
          }
        }
        renderInventoryCounts();
        el.rewardOverflowOverlay.hidden = true;
        el.rewardOverflowCards.replaceChildren();
        el.rewardOverflowConfirm.onclick = null;
        resolve({ acquired: true, keptReward });
      };
    });
  }

  async function chooseTreasureReward(reward, selectedCard) {
    if (treasureRewardChosen || !eventOpen || activeEventTileId !== "gem") return;

    const rewardKey = `${reward.type}:${reward.id}`;
    const cards = [...el.eventTreasureRewards.querySelectorAll(".treasure-reward-card")];

    if (selectedTreasureRewardId !== rewardKey) {
      selectedTreasureRewardId = rewardKey;
      cards.forEach((card) => {
        const selected = card === selectedCard;
        card.classList.toggle("is-selected", selected);
        card.classList.toggle("is-dimmed", !selected);
        card.setAttribute("aria-pressed", selected ? "true" : "false");
      });
      el.diceResult.textContent = `${reward.label} 선택 · 한 번 더 누르면 획득`;
      return;
    }

    treasureRewardChosen = true;
    cards.forEach((card) => {
      card.disabled = true;
      card.classList.toggle("is-confirming", card === selectedCard);
      card.classList.toggle("is-rejected", card !== selectedCard);
    });

    const outcome = await forceDiscardForReward(reward);
    if (!outcome.acquired) {
      treasureRewardChosen = false;
      cards.forEach((card) => { card.disabled = false; });
      el.diceResult.textContent = `${reward.label} 획득 저장 실패 · 다시 선택하세요`;
      return;
    }
    if (!outcome.keptReward) {
      el.diceResult.textContent = `${reward.label} 대신 신규 보상을 버렸습니다`;
      await wait(220);
      closeTileEvent();
      return;
    }
    el.diceResult.textContent = reward.type === "unit"
      ? `${reward.label} 획득 · 내 마물 카드에 추가`
      : `${reward.label} 획득 · 주사위 카드더미에 추가`;

    await wait(120);
    await animateTreasureRewardToTarget(reward, selectedCard);
    closeTileEvent();
  }

  function showTreasureRewards() {
    treasureRewardChosen = false;
    selectedTreasureRewardId = null;
    const rewards = createTreasureRewards();
    el.eventTreasureRewards.replaceChildren();
    for (const reward of rewards) {
      const card = document.createElement("button");
      const image = document.createElement("img");
      const badge = document.createElement("span");
      card.type = "button";
      card.className = "treasure-reward-card";
      card.setAttribute("aria-label", `${reward.label} 선택`);
      card.setAttribute("aria-pressed", "false");
      image.src = reward.image;
      image.alt = reward.label;
      badge.className = "treasure-reward-badge";
      badge.textContent = reward.type === "unit" ? `마물 · ${reward.label}` : `주사위 · ${reward.label}`;
      card.append(image, badge);
      card.addEventListener("click", () => chooseTreasureReward(reward, card));
      el.eventTreasureRewards.append(card);
    }
    el.eventTreasureRewards.hidden = false;
  }

  function clearTreasureRewards() {
    treasureRewardChosen = false;
    selectedTreasureRewardId = null;
    el.eventTreasureRewards.hidden = true;
    el.eventTreasureRewards.replaceChildren();
  }

  async function playTreasureChestAnimation() {
    if (!el.eventTreasure) return;
    el.eventTreasure.hidden = false;
    el.eventTreasure.classList.remove("is-burst");
    el.eventTreasure.src = treasureChestFrames[0];
    await wait(180);
    if (!eventOpen || activeEventTileId !== "gem") return;
    el.eventTreasure.src = treasureChestFrames[1];
    await wait(220);
    if (!eventOpen || activeEventTileId !== "gem") return;
    el.eventTreasure.src = treasureChestFrames[2];
    await wait(250);
    if (!eventOpen || activeEventTileId !== "gem") return;
    el.eventTreasure.classList.add("is-burst");
    el.eventTreasure.src = treasureChestFrames[3];
    await wait(340);
  }

  function openTileEvent(tile, step) {
    const scene = tileEventScenes[tile?.id];
    if (!scene || enteringBattle) return false;
    eventOpen = true;
    activeEventTileId = tile.id;
    activeEventRatio = tileEventRatios[tile.id] || 1280 / 714;
    fitTileEventScene();
    el.board.classList.add("is-tile-event-open");
    el.diceButton.disabled = true;
    el.regenerate.disabled = true;
    const treasure = scene.animation === "treasure";
    el.eventImage.hidden = treasure;
    el.eventTreasure.hidden = !treasure;
    el.eventEnter.hidden = tile.id !== "home";
    el.eventInheritance.hidden = true;
    el.eventHeal.hidden = tile.id !== "rest" || !hasInjuredOwnedUnits();
    el.eventPray.hidden = tile.id !== "unknown" || worldTreePrayed;
    el.eventPrayerResult.hidden = true;
    el.eventPrayerResult.textContent = "";
    el.eventContaminationChange.hidden = true;
    el.eventContaminationChange.className = "tile-event-contamination-change";
    el.eventContaminationChange.textContent = "";
    el.eventClose.hidden = treasure;
    if (treasure) {
      el.eventImage.removeAttribute("src");
      clearTreasureRewards();
      el.eventTreasure.classList.remove("is-burst");
      el.eventTreasure.src = treasureChestFrames[0];
      if (typeof V2Sfx !== "undefined") V2Sfx.play("treasureChestOpen");
      void playTreasureChestAnimation().then(() => {
        if (eventOpen && activeEventTileId === "gem") showTreasureRewards();
      });
    } else {
      el.eventImage.src = scene.image;
      el.eventImage.alt = `${scene.title} 풍경`;
    }
    el.eventOverlay.hidden = false;
    if (!treasure) el.eventClose.focus();
    return true;
  }

  function healAtRestTile() {
    if (!eventOpen || activeEventTileId !== "rest" || !hasInjuredOwnedUnits()) {
      el.eventHeal.hidden = true;
      return;
    }
    healOwnedRosterFull();
    el.eventHeal.hidden = true;
    el.diceResult.textContent = "숙영 · 모든 마물 체력 완전 회복";
    el.eventClose.focus();
  }

  async function prayAtWorldTree() {
    if (!eventOpen || activeEventTileId !== "unknown" || worldTreePrayed || worldTreePrayerRolling) {
      el.eventPray.hidden = true;
      return;
    }

    worldTreePrayerRolling = true;
    markWorldTreePrayed();
    el.eventPray.hidden = true;
    el.eventPrayerResult.hidden = true;
    el.eventClose.disabled = true;
    el.board.classList.add("is-world-tree-praying");
    resetMapDicePosition();
    el.diceButton.classList.add("is-rolling");

    const result = Math.floor(Math.random() * 6) + 1;
    await animateMapDiceRoll(result);

    let label;
    let contaminationDelta;
    if (result === 6) {
      label = "대축복";
      contaminationDelta = -5;
    } else if (result >= 4) {
      label = "축복";
      contaminationDelta = -3;
    } else {
      label = "실패";
      contaminationDelta = 1;
    }

    addContamination(contaminationDelta);
    showWorldTreeContaminationChange(contaminationDelta);
    el.eventPrayerResult.textContent = label;
    el.eventPrayerResult.dataset.result = label === "실패" ? "failure" : label === "대축복" ? "great-blessing" : "blessing";
    el.eventPrayerResult.hidden = false;
    el.diceResult.textContent = `세계수 기도 · 주사위 ${result} · ${label} · 오염도 ${contaminationDelta > 0 ? "+" : ""}${contaminationDelta}`;
    el.diceButton.classList.remove("is-rolling");
    worldTreePrayerRolling = false;
    el.eventClose.disabled = false;
    el.eventClose.focus();
  }

  function enterHome() {
    if (!eventOpen || activeEventTileId !== "home") return;
    el.eventImage.src = `${ROOT}events/home-interior.jpg?v=${EVENT_ASSET_VERSION}`;
    el.eventImage.alt = "우리집 실내 풍경";
    el.eventEnter.hidden = true;
    el.eventInheritance.hidden = false;
    el.eventInheritance.focus();
  }

  async function warpToOtherWarp() {
    const destinations = currentTiles.map((tile, index) => ({ tile, index }))
      .filter(({ tile, index }) => tile.id === "warp" && index !== heroIndex);
    if (!destinations.length) return false;
    const origin = heroIndex;
    const destination = destinations[Math.floor(Math.random() * destinations.length)].index;
    el.diceButton.disabled = true;
    el.regenerate.disabled = true;
    el.diceResult.textContent = "워프 발동";
    el.tileName.textContent = `${origin + 1}번 워프 → ${destination + 1}번 워프`;
    await wait(360);
    heroIndex = destination;
    placeHero(true);
    selectTile(currentButtons[heroIndex], currentTiles[heroIndex], heroIndex + 1);
    el.diceResult.textContent = `${heroIndex + 1}번 워프로 이동 완료`;
    await wait(420);
    return true;
  }

  async function playCloudTileRefresh() {
    if (cloudTransitioning || !el.cloudTransition) return;
    cloudTransitioning = true;
    rolling = true;
    el.diceButton.disabled = true;
    el.regenerate.disabled = true;
    el.cloudTransition.hidden = false;
    el.cloudTransition.classList.remove("is-covered", "is-opening");
    void el.cloudTransition.offsetWidth;
    el.cloudTransition.classList.add("is-covered");
    // Let the fastest and slowest cloud layers meet at different times.
    // The mist layer removes any dark gaps before the tile swap happens.
    await wait(1200);
    generateTiles();
    await wait(260);
    el.cloudTransition.classList.add("is-opening");
    await wait(1080);
    el.cloudTransition.hidden = true;
    el.cloudTransition.classList.remove("is-covered", "is-opening");
    rolling = false;
    cloudTransitioning = false;
    el.diceButton.disabled = false;
    el.regenerate.disabled = false;
    el.diceButton.focus();
  }

  async function handleTileEventExit() {
    // Leaving home still drives the tile refresh, but contamination only rises
    // when the hero actually completed a lap and reached home through movement.
    const refreshAfterHome = eventOpen && activeEventTileId === "home";
    const completedLap = refreshAfterHome && lapReadyForRefresh;
    if (completedLap) {
      addContamination(2);
      healOwnedRosterFull();
    }
    closeTileEvent();
    if (refreshAfterHome) await playCloudTileRefresh();
  }

  function closeTileEvent() {
    if (!eventOpen) return;
    eventOpen = false;
    activeEventTileId = null;
    rolling = false;
    el.board.classList.remove("is-tile-event-open");
    el.eventOverlay.hidden = true;
    el.eventImage.removeAttribute("src");
    el.eventEnter.hidden = true;
    el.eventInheritance.hidden = true;
    el.eventHeal.hidden = true;
    el.eventPray.hidden = true;
    el.eventPrayerResult.hidden = true;
    el.eventPrayerResult.textContent = "";
    el.eventContaminationChange.hidden = true;
    el.eventContaminationChange.className = "tile-event-contamination-change";
    el.eventContaminationChange.textContent = "";
    el.eventClose.disabled = false;
    worldTreePrayerRolling = false;
    el.board.classList.remove("is-world-tree-praying");
    V2HomeInheritance.close();
    el.eventTreasure.hidden = true;
    el.eventTreasure.classList.remove("is-burst");
    el.eventTreasure.src = treasureChestFrames[0];
    clearTreasureRewards();
    el.diceButton.disabled = false;
    el.regenerate.disabled = false;
    el.diceButton.focus();
  }

  function placeHero(animate = false) {
    const position = positions[heroIndex];
    el.hero.style.left = `${position.x}%`;
    el.hero.style.top = `${position.y}%`;
    // On the lower and left edges the route heads left, then upward; keep the
    // figure facing the direction of travel until it turns right at the top.
    el.hero.style.setProperty("--hero-facing", heroIndex >= 12 ? -1 : 1);
    el.hero.setAttribute("aria-label", `주인공 말, 현재 ${heroIndex + 1}번 타일`);
    el.moveState.textContent = `현재 ${heroIndex + 1}번 타일`;
    if (animate) {
      el.hero.classList.remove("is-moving");
      void el.hero.offsetWidth;
      el.hero.classList.add("is-moving");
    }
  }

  function generateTiles() {
    lapReadyForRefresh = false;
    let restoredPool = loadSavedMapLayout();
    if (restoredPool && !isValidMapPool(restoredPool)) restoredPool = null;
    if (restoredPool) {
      loadClearedMonsterSteps();
      loadWorldTreePrayer();
    } else {
      resetClearedMonsterSteps();
      resetWorldTreePrayer();
    }
    const pool = restoredPool || createPool();
    positions = perimeterPositions();
    if (positions.length !== 24 || !hasValidMapDistribution(pool)) {
      throw new Error(`Map invariant failed: positions=${positions.length}, tiles=${pool.filter(Boolean).length}`);
    }
    currentTiles = pool;
    currentButtons = positions.map((position, index) => {
      const tile = pool[index];
      const button = document.createElement("button");
      const image = document.createElement("img");
      const step = document.createElement("span");
      button.type = "button";
      button.className = "map-tile";
      button.style.setProperty("--x", `${position.x}%`);
      button.style.setProperty("--y", `${position.y}%`);
      const tileStep = index + 1;
      const cleared = isMonsterTileCleared(tileStep);
      button.setAttribute("aria-label", `${tileStep}번 ${tile.name}${cleared ? " · 처치 완료" : ""}`);
      button.classList.toggle("is-cleared-monster", cleared);
      image.src = getTileImage(tile, tileStep);
      image.alt = "";
      image.addEventListener("error", () => {
        if (image.dataset.fallbackTried === "1") return;
        image.dataset.fallbackTried = "1";
        image.src = image.src.split("?")[0];
      }, { once: true });
      step.className = "step";
      step.textContent = String(index + 1);
      button.append(image, step);
      button.addEventListener("click", async () => {
        if (rolling || eventOpen) return;
        selectTile(button, tile, index + 1);
        if (tile.id === "warp") {
          rolling = true;
          heroIndex = index;
          placeHero(true);
          await warpToOtherWarp();
          rolling = false;
          el.diceButton.disabled = false;
          el.regenerate.disabled = false;
          return;
        }
        if (openTileEvent(tile, index + 1)) return;
        enterMonsterBattle(tile, index + 1);
      });
      return button;
    });
    el.ring.replaceChildren(...currentButtons);
    const startingIndex = resumeHeroIndex === null ? HOME_INDEX : resumeHeroIndex;
    resumeHeroIndex = null;
    heroIndex = startingIndex;
    placeHero();
    selectTile(currentButtons[heroIndex], currentTiles[heroIndex], heroIndex + 1);
    el.diceResult.textContent = "주사위 굴리기";
    resetMapDicePosition();
  }

  function resetMapDicePosition() {
    el.diceButton.style.left = "50%";
    el.diceButton.style.top = "48%";
    el.diceButton.style.transform = "translate(-50%, -50%) rotate(0deg)";
  }

  function getDiceWallRects() {
    // Use map-local layout coordinates, not viewport coordinates.
    // In portrait mode the whole map is rotated 90deg with CSS, so
    // getBoundingClientRect() returns rotated screen coordinates that cannot
    // be written back into left/top without making the die jump.
    return currentButtons.map((button) => {
      const centerX = button.offsetLeft;
      const centerY = button.offsetTop;
      const halfWidth = button.offsetWidth / 2;
      const halfHeight = button.offsetHeight / 2;
      return {
        left: centerX - halfWidth,
        right: centerX + halfWidth,
        top: centerY - halfHeight,
        bottom: centerY + halfHeight
      };
    });
  }

  function getContaminationWallRect() {
    if (!el.contaminationHud || el.contaminationHud.offsetWidth <= 0 || el.contaminationHud.offsetHeight <= 0) return null;
    const centerX = el.contaminationHud.offsetLeft;
    const centerY = el.contaminationHud.offsetTop;
    const insetX = el.contaminationHud.offsetWidth * .025;
    const insetY = el.contaminationHud.offsetHeight * .13;
    return {
      left: centerX - el.contaminationHud.offsetWidth / 2 + insetX,
      right: centerX + el.contaminationHud.offsetWidth / 2 - insetX,
      top: centerY - el.contaminationHud.offsetHeight / 2 + insetY,
      bottom: centerY + el.contaminationHud.offsetHeight / 2 - insetY
    };
  }

  function getDiceInnerBounds(walls, radius, boardSize) {
    // The route is 8 top + 4 right + 7 bottom + 5 left tiles.
    // Individual tile rectangles have tiny gaps, so a fast die can slip through them.
    // Build one continuous invisible inner wall from the route itself.
    const topWalls = walls.slice(0, 8);
    const rightWalls = walls.slice(8, 12);
    const bottomWalls = walls.slice(12, 19);
    const leftWalls = walls.slice(19, 24);

    const fallback = {
      minX: radius + 4,
      maxX: boardSize.width - radius - 4,
      minY: radius + 4,
      maxY: boardSize.height - radius - 4
    };
    if (!topWalls.length || !rightWalls.length || !bottomWalls.length || !leftWalls.length) return fallback;

    const bounds = {
      minX: Math.max(...leftWalls.map((wall) => wall.right)) + radius,
      maxX: Math.min(...rightWalls.map((wall) => wall.left)) - radius,
      minY: Math.max(...topWalls.map((wall) => wall.bottom)) + radius,
      maxY: Math.min(...bottomWalls.map((wall) => wall.top)) - radius
    };

    if (bounds.minX >= bounds.maxX || bounds.minY >= bounds.maxY) return fallback;
    return bounds;
  }

  function animateMapDiceRoll(result) {
    return new Promise((resolve) => {
      const boardSize = { width: el.board.clientWidth, height: el.board.clientHeight };
      const radius = Math.max(el.diceButton.offsetWidth, el.diceButton.offsetHeight) * .40;
      const walls = getDiceWallRects();
      const contaminationWall = getContaminationWallRect();
      const duration = 1750 + Math.random() * 450;
      const { minX, maxX, minY, maxY } = getDiceInnerBounds(walls, radius, boardSize);

      // offsetLeft/offsetTop are the die's logical center coordinates because
      // its CSS left/top mark the center and translate(-50%, -50%) only affects
      // painting. These stay correct even when the whole map is rotated.
      let x = el.diceButton.offsetLeft;
      let y = el.diceButton.offsetTop;
      let direction = Math.random() * Math.PI * 2;
      if (Math.abs(Math.cos(direction)) < .28) direction += .45;
      const baseSpeed = boardSize.width * (.62 + Math.random() * .16);
      let vx = Math.cos(direction) * baseSpeed;
      let vy = Math.sin(direction) * baseSpeed * .72;
      let rotation = Math.random() * 80 - 40;
      let lastTime = performance.now();
      let elapsed = 0;
      let frameClock = 0;
      let soundClock = 0;
      let settled = false;

      const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

      function bounceAgainstRect(wall) {
        const nearestX = clamp(x, wall.left, wall.right);
        const nearestY = clamp(y, wall.top, wall.bottom);
        let dx = x - nearestX;
        let dy = y - nearestY;
        let distanceSq = dx * dx + dy * dy;
        if (distanceSq >= radius * radius) return false;

        let nx;
        let ny;
        let distance = Math.sqrt(distanceSq);
        if (distance > .001) {
          nx = dx / distance;
          ny = dy / distance;
        } else {
          const distances = [
            { d: Math.abs(x - wall.left), nx: -1, ny: 0 },
            { d: Math.abs(wall.right - x), nx: 1, ny: 0 },
            { d: Math.abs(y - wall.top), nx: 0, ny: -1 },
            { d: Math.abs(wall.bottom - y), nx: 0, ny: 1 }
          ].sort((a, b) => a.d - b.d);
          nx = distances[0].nx;
          ny = distances[0].ny;
          distance = 0;
        }

        const dot = vx * nx + vy * ny;
        if (dot < 0) {
          vx -= 2 * dot * nx;
          vy -= 2 * dot * ny;
          vx *= .82;
          vy *= .82;
        }
        const push = radius - distance + 1.5;
        x += nx * push;
        y += ny * push;
        return true;
      }

      function finish() {
        if (settled) return;
        settled = true;
        el.diceImage.src = resultFrames[result - 1];
        el.diceImage.alt = `주사위 결과 ${result}`;
        el.diceButton.style.left = `${x}px`;
        el.diceButton.style.top = `${y}px`;
        el.diceButton.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(1.04)`;
        if (typeof V2Sfx !== "undefined") V2Sfx.play("diceLand", { rate: .94 + result * .015 });
        window.setTimeout(() => {
          el.diceButton.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(1)`;
          resolve();
        }, 120);
      }

      function tick(now) {
        const dt = Math.min((now - lastTime) / 1000, .035);
        lastTime = now;
        elapsed += dt * 1000;
        frameClock += dt * 1000;
        soundClock += dt * 1000;

        const lateDrag = elapsed > duration * .62 ? 3.4 : 1.15;
        const drag = Math.exp(-lateDrag * dt);
        vx *= drag;
        vy *= drag;
        x += vx * dt;
        y += vy * dt;

        let bounced = false;

        // The continuous inner bounds are the authoritative tile-ring wall.
        // Do not run the old per-tile push-out after this clamp: when the die
        // enters a bottom tile rectangle, that resolver can choose the outer
        // face and push the die through the lower row on the first roll.
        if (x < minX) { x = minX; vx = Math.abs(vx) * .78; bounced = true; }
        else if (x > maxX) { x = maxX; vx = -Math.abs(vx) * .78; bounced = true; }
        if (y < minY) { y = minY; vy = Math.abs(vy) * .78; bounced = true; }
        else if (y > maxY) { y = maxY; vy = -Math.abs(vy) * .78; bounced = true; }

        // The contamination HUD is a real interior map wall: the die may roll
        // around its sides, but it cannot pass through the stone panel.
        if (contaminationWall && bounceAgainstRect(contaminationWall)) bounced = true;

        if (bounced && soundClock > 85 && typeof V2Sfx !== "undefined") {
          V2Sfx.play("diceTick", { rate: .9 + Math.random() * .24 });
          soundClock = 0;
        }

        const speed = Math.hypot(vx, vy);
        rotation += (vx >= 0 ? 1 : -1) * speed * dt * .62;
        el.diceButton.style.left = `${x}px`;
        el.diceButton.style.top = `${y}px`;
        el.diceButton.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${1 + Math.min(speed / Math.max(baseSpeed, 1), 1) * .09})`;

        if (frameClock > 62) {
          diceFrameIndex = (diceFrameIndex + 1) % rollingFrames.length;
          el.diceImage.src = rollingFrames[diceFrameIndex];
          frameClock = 0;
        }

        if (elapsed >= duration || (elapsed > 1250 && speed < boardSize.width * .045)) {
          finish();
          return;
        }
        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    });
  }

  async function rollAndMove() {
    if (rolling) return;
    rolling = true;
    el.diceButton.disabled = true;
    el.regenerate.disabled = true;
    el.diceButton.classList.add("is-rolling");
    el.diceResult.textContent = "굴리는 중…";
    let result = Math.floor(Math.random() * 6) + 1;
    let controlLabel = "";
    if (pendingDiceControlId) {
      const controlled = V2DiceControl.resolve(pendingDiceControlId, diceControlState());
      if (controlled.ok) {
        result = controlled.value;
        controlLabel = controlled.label;
        previousDiceControlId = controlled.effectiveCardId;
      }
      pendingDiceControlId = null;
    }
    previousDiceRoll = result;
    renderDiceControlHand();
    await animateMapDiceRoll(result);
    el.diceResult.textContent = `${result}${controlLabel ? ` · ${controlLabel}` : ""} · 이동 시작`;
    el.diceButton.classList.remove("is-rolling");
    await wait(220);
    let stepsMoved = 0;
    let reachedHome = false;
    for (let step = 0; step < result; step += 1) {
      if (typeof V2Sfx !== "undefined") V2Sfx.play("move", { rate: step % 2 ? 1.08 : .92 });
      heroIndex = (heroIndex + 1) % positions.length;
      stepsMoved += 1;
      placeHero(true);
      selectTile(currentButtons[heroIndex], currentTiles[heroIndex], heroIndex + 1);
      await wait(230);
      if (heroIndex === HOME_INDEX) { reachedHome = true; lapReadyForRefresh = true; break; }
    }
    const controlText = controlLabel ? ` · ${controlLabel}` : "";
    el.diceResult.textContent = reachedHome
      ? `${result}${controlText} · 집 도착 (${stepsMoved}칸 이동)`
      : `${result}${controlText} · 이동 완료`;
    if (isMonsterBattleTile(currentTiles[heroIndex])) {
      const landedStep = heroIndex + 1;
      if (isMonsterTileCleared(landedStep)) {
        el.diceResult.textContent = `${result} · 처치 완료 타일 · 전투 없음`;
      } else {
        el.diceResult.textContent = `${result} · ${currentTiles[heroIndex].name} 조우`;
        await wait(320);
        if (enterMonsterBattle(currentTiles[heroIndex], landedStep)) return;
      }
    }
    if (currentTiles[heroIndex]?.id === "warp") {
      await warpToOtherWarp();
      rolling = false;
      el.diceButton.disabled = false;
      el.regenerate.disabled = false;
      return;
    }
    if (openTileEvent(currentTiles[heroIndex], heroIndex + 1)) {
      rolling = false;
      return;
    }
    el.diceButton.disabled = false;
    el.regenerate.disabled = false;
    rolling = false;
  }

  document.querySelectorAll("[data-map]").forEach((button) => {
    button.addEventListener("click", () => {
      const map = maps[button.dataset.map];
      activeMapId = button.dataset.map;
      document.querySelectorAll("[data-map]").forEach((item) => item.classList.toggle("is-active", item === button));
      el.board.style.backgroundImage = `url("${map.image}")`;
      el.mapName.textContent = map.name;
    });
  });
  const initialMapButton = document.querySelector(`[data-map="${activeMapId}"]`);
  if (initialMapButton && activeMapId !== "default") initialMapButton.click();
  el.regenerate.addEventListener("click", generateTiles);
  window.V2Contamination = Object.freeze({
    get: () => contamination,
    stage: () => contaminationStage().id,
    set: setContamination,
    add: addContamination
  });

  renderContamination();

  el.diceButton.addEventListener("click", rollAndMove);
  el.eventClose.addEventListener("click", handleTileEventExit);
  el.eventEnter.addEventListener("click", enterHome);
  el.eventHeal.addEventListener("click", healAtRestTile);
  el.eventPray.addEventListener("click", prayAtWorldTree);
  el.eventInheritance.addEventListener("click", () => {
    if (eventOpen && activeEventTileId === "home") V2HomeInheritance.open();
  });
  window.addEventListener("v2-roster-changed", (event) => {
    ownedUnits.delete(event.detail.donorInstanceId);
    ownedUnits.set(event.detail.recipient.instanceId, event.detail.recipient);
    selectedDeck = selectedDeck.filter((instanceId) => ownedUnits.has(instanceId));
    renderBookRoster();
    if (!el.deckOverlay.hidden) renderDeckSelection();
    renderInventoryCounts();
  });
  el.bookButton.addEventListener("click", toggleBookRoster);
  el.cardDeckButton.addEventListener("click", toggleDiceControlCard);
  el.diceControlBackdrop.addEventListener("click", closeDiceControlCard);
  el.infoClose.addEventListener("click", closeBookUnitInfo);
  el.infoBackdrop.addEventListener("click", closeBookUnitInfo);
  window.addEventListener("resize", () => { if (eventOpen) fitTileEventScene(); });
  window.addEventListener("pageshow", () => syncInventoryStateFromStorage());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !rolling && !enteringBattle) syncInventoryStateFromStorage();
  });
  el.deckConfirm.addEventListener("click", confirmMonsterBattle);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el.rewardOverflowOverlay.hidden) return;
    if (event.key === "Escape" && !el.diceControlOverlay.hidden) closeDiceControlCard();
    else if (event.key === "Escape" && !el.infoOverlay.hidden) closeBookUnitInfo();
    else if (event.key === "Escape" && !el.bookRoster.hidden) toggleBookRoster();
    else if (event.key === "Escape" && eventOpen) closeTileEvent();
  });
  renderBookRoster();
  dealDiceControlHand();
  renderInventoryCounts();
  generateTiles();
  if (typeof V2Sfx !== "undefined") V2Sfx.preload();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("./service-worker.js", { updateViaCache: "none" });
        await registration.update();
      } catch (error) {
        console.warn("맵 화면 업데이트 확인 실패", error);
      }
    });
  }
})();
