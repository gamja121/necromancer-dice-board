(async () => {
  "use strict";

  const ROOT = "art/v2-style/map-test/";
  const TILE_ASSET_VERSION = "20260930-swamp-2";
  const EVENT_ASSET_VERSION = "20260927-2";
  const DICE_ROOT = "art/v2-style/dice-test/frames/";
  const rollingFrames = Array.from({ length: 12 }, (_, index) => `${DICE_ROOT}roll-${String(index + 1).padStart(2, "0")}.png`);
  const resultFrames = Array.from({ length: 6 }, (_, index) => `${DICE_ROOT}result-${String(index + 1).padStart(2, "0")}.png`);
  const treasureChestFrames = Array.from({ length: 4 }, (_, index) => `${ROOT}events/treasure-chest-frame-${index + 1}.png`);
  const maps = {
    default: { name: "기본 지역", image: `${ROOT}maps/default-map.jpg?v=20261004-board-bg-final-1` },
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
  const WORLD_TREE_EVENT_RATIO = 16 / 9;
  const tileEventRatios = Object.freeze({
    graveyard: WORLD_TREE_EVENT_RATIO, home: WORLD_TREE_EVENT_RATIO, "fortune-teller-camp": WORLD_TREE_EVENT_RATIO,
    village: WORLD_TREE_EVENT_RATIO, rest: WORLD_TREE_EVENT_RATIO, altar: WORLD_TREE_EVENT_RATIO, unknown: WORLD_TREE_EVENT_RATIO,
    forest: WORLD_TREE_EVENT_RATIO, gem: WORLD_TREE_EVENT_RATIO
  });
  const tileTypes = [
    { id: "basic", name: "기본 타일", count: 2 },
    { id: "graveyard", name: "공동묘지 타일", count: 1 },
    { id: "altar", name: "제단 타일", count: 1 },
    { id: "unknown", name: "세계수 타일", count: 1 },
    { id: "forest", name: "언덕 타일", count: 1 },
    { id: "rest", name: "휴식 타일", count: 2 },
    { id: "monster", name: "일반 마물 타일", count: 3 },
    { id: "rare-monster", name: "희귀 마물 타일", count: 1 },
    { id: "gem", name: "보석 타일", count: 1 },
    { id: "event", name: "이벤트 타일", count: 2 },
    { id: "swamp", name: "오염된 늪지대", count: 2 },
    { id: "warp", name: "워프 타일", count: 2 }
  ];
  const fixedTiles = Object.freeze({
    home: Object.freeze({ id: "home", name: "우리집 타일", count: 1 }),
    village: Object.freeze({ id: "village", name: "마을 타일", count: 1 }),
    fortune: Object.freeze({ id: "fortune-teller-camp", name: "점술가의 막사 타일", count: 1 }),
    boss: Object.freeze({ id: "boss", name: "보스 타일", count: 1 })
  });
  const TEST_DECK = Object.freeze(
    Object.values(globalThis.V2DesignData?.units || {})
      .filter((unit) => unit && unit.grade !== "special")
      .map((unit) => Object.freeze({ slug: unit.slug, name: unit.name }))
  );
  const OWNED_ROSTER_KEY = "necromancer-map-roster-v2";
  const FORTUNE_PROPHECY_KEY = "necromancer-fortune-prophecy-v1";
  const STARTING_UNIT_SLUGS = Object.freeze(["skeleton-spear", "skeleton-archer"]);
  const DICE_CONTROL_INVENTORY_KEY = "necromancer-map-dice-control-v1";
  const GRAVEYARD_CORPSES_KEY = "necromancer-map-graveyard-corpses-v1";
  const GRAVEYARD_CHILD_EVENT_FLAG = "event:graveyard_child_ambush_01:complete";
  const GRAVEYARD_CHILD_EVENT_FALLBACK_KEY = "necromancer-event-graveyard-child-complete-v1";
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
  const SCOUT_ENCOUNTER_STAGES = Object.freeze([
    Object.freeze({ min: 0, counts: Object.freeze([1, 2]), countWeights: Object.freeze([.65, .35]), grades: Object.freeze({ normal: .90, advanced: .10, hero: 0 }) }),
    Object.freeze({ min: 20, counts: Object.freeze([2]), countWeights: Object.freeze([1]), grades: Object.freeze({ normal: .75, advanced: .25, hero: 0 }) }),
    Object.freeze({ min: 40, counts: Object.freeze([2, 3]), countWeights: Object.freeze([.65, .35]), grades: Object.freeze({ normal: .55, advanced: .40, hero: .05 }) }),
    Object.freeze({ min: 60, counts: Object.freeze([3]), countWeights: Object.freeze([1]), grades: Object.freeze({ normal: .35, advanced: .50, hero: .15 }) }),
    Object.freeze({ min: 80, counts: Object.freeze([3, 4]), countWeights: Object.freeze([.55, .45]), grades: Object.freeze({ normal: .20, advanced: .55, hero: .25 }) })
  ]);
  const SCOUT_ENEMY_SLUGS = Object.freeze(TEST_DECK.map((unit) => unit.slug));
  const BOSS_CONTAMINATION_MIN = 80;
  const MAP_LAYOUT_KEY = "necromancer-map-layout-v2";
  const LEGACY_MAP_LAYOUT_KEY = "necromancer-map-layout-v1";
  const MAP_CLEARED_MONSTER_KEY = "necromancer-map-cleared-monsters-v1";
  const WORLD_TREE_PRAYER_KEY = "necromancer-map-world-tree-prayed-v1";
  const PATROL_ROUTE_KEY = "necromancer-patrol-route-v2";
  const PATROL_ROUTE_PERSIST_KEY = "necromancer-patrol-route-persistent-v1";
  const PATROL_ROUTE_DEFAULT_CURRENT = Object.freeze(["basic", "basic", "graveyard", "forest", "rest", "event"]);
  const PATROL_ROUTE_DEFAULT_RESERVE = Object.freeze(["monster", "monster", "monster", "monster", "monster"]);
  const PATROL_ROUTE_ALLOWED_IDS = Object.freeze(new Set(["basic", "graveyard", "forest", "rest", "event", "monster"]));
  const PATROL_ROUTE_LABELS = Object.freeze({
    basic: "기본 타일",
    graveyard: "공동묘지",
    forest: "언덕",
    rest: "숙영",
    event: "사건",
    monster: "일반 마물"
  });
  // The current tile catalog became one tile short when treasure/event counts were reduced
  // and swamp was added. Keep that structural slot explicit instead of silently padding
  // with a basic tile. Before the boss unlocks, its future slot is also a normal monster.
  const MAP_STRUCTURAL_MONSTER_SLOTS = 1;
  const MAP_PRE_BOSS_MONSTER_SLOTS = 1;
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
    lab: document.querySelector(".map-lab"),
    ring: document.getElementById("tileRing"),
    optionsButton: document.getElementById("mapOptionsButton"),
    audioOptions: document.getElementById("mapAudioOptions"),
    audioOptionsClose: document.getElementById("mapAudioOptionsClose"),
    bgmToggle: document.getElementById("mapBgmToggle"),
    sfxToggle: document.getElementById("mapSfxToggle"),
    forestDioramaTestButton: document.getElementById("forestDioramaTestButton"),
    forestDioramaTest: document.getElementById("forestDioramaTest"),
    forestDioramaClose: document.getElementById("forestDioramaClose"),
    forestLayerDebug: document.getElementById("forestLayerDebug"),
    villageDioramaTestButton: document.getElementById("villageDioramaTestButton"),
    villageDioramaTest: document.getElementById("villageDioramaTest"),
    villageDioramaClose: document.getElementById("villageDioramaClose"),
    villageSelectedBuildingLabel: document.getElementById("villageSelectedBuildingLabel"),
    villageLayoutSaveStatus: document.getElementById("villageLayoutSaveStatus"),
    villageLayoutExport: document.getElementById("villageLayoutExport"),
    villageLayerDebug: document.getElementById("villageLayerDebug"),
    graveyardDioramaTestButton: document.getElementById("graveyardDioramaTestButton"),
    graveyardDioramaTest: document.getElementById("graveyardDioramaTest"),
    graveyardDioramaClose: document.getElementById("graveyardDioramaClose"),
    graveyardAtlasProbe: document.getElementById("graveyardAtlasProbe"),
    graveyardAssetStatus: document.getElementById("graveyardAssetStatus"),
    graveyardLayerDebug: document.getElementById("graveyardLayerDebug"),
    graveyardSelectedLabel: document.getElementById("graveyardSelectedLabel"),
    graveyardLayoutSaveStatus: document.getElementById("graveyardLayoutSaveStatus"),
    graveyardLayoutExport: document.getElementById("graveyardLayoutExport"),
    graveyardEditorReopen: document.getElementById("graveyardEditorReopen"),
    graveyardStoryEvent: document.getElementById("graveyardStoryEvent"),
    graveyardStoryAdvance: document.getElementById("graveyardStoryAdvance"),
    graveyardStoryText: document.getElementById("graveyardStoryText"),
    graveyardStoryEffectText: document.getElementById("graveyardStoryEffectText"),
    graveyardStoryArtwork: document.getElementById("graveyardStoryArtwork"),
    graveyardStoryGhoulLayer: document.getElementById("graveyardStoryGhoulLayer"),
    graveyardStoryChoices: document.getElementById("graveyardStoryChoices"),
    graveyardStoryFrameImg: document.querySelector(".graveyard-story-frame"),
    mapName: document.getElementById("mapName"),
    tileName: document.getElementById("tileName"),
    regenerate: document.getElementById("regenerateButton"),
    hero: document.getElementById("heroToken"),
    swampDamageOverlay: document.getElementById("swampDamageOverlay"),
    diceButton: document.getElementById("mapDiceButton"),
    diceImage: document.getElementById("mapDiceImage"),
    diceResult: document.getElementById("diceResult"),
    moveState: document.getElementById("moveState"),
    contaminationHud: document.getElementById("contaminationHud"),
    contaminationFill: document.getElementById("contaminationFill"),
    contaminationStage: document.getElementById("contaminationStage"),
    contaminationValue: document.getElementById("contaminationValue"),
    contaminationTest: document.getElementById("contaminationTestControl"),
    contaminationTestToggle: document.getElementById("contaminationTestToggle"),
    contaminationTestSlider: document.getElementById("contaminationTestSlider"),
    contaminationTestValue: document.getElementById("contaminationTestValue"),
    eventOverlay: document.getElementById("tileEventOverlay"),
    eventScene: document.querySelector(".tile-event-scene"),
    eventImage: document.getElementById("tileEventImage"),
    eventTreasure: document.getElementById("treasureChestFrame"),
    eventTreasureRewards: document.getElementById("treasureRewardCards"),
    eventEnter: document.getElementById("tileEventEnter"),
    eventInheritance: document.getElementById("tileEventInheritance"),
    eventPatrolRoute: document.getElementById("tileEventPatrolRoute"),
    patrolRoutePanel: document.getElementById("patrolRoutePanel"),
    patrolRouteClose: document.getElementById("patrolRouteClose"),
    patrolRouteCurrent: document.getElementById("patrolRouteCurrent"),
    patrolRouteReserve: document.getElementById("patrolRouteReserve"),
    patrolRouteStatus: document.getElementById("patrolRouteStatus"),
    patrolRouteReset: document.getElementById("patrolRouteReset"),
    patrolRouteConfirm: document.getElementById("patrolRouteConfirm"),
    eventHeal: document.getElementById("tileEventHeal"),
    fullHealEffect: document.getElementById("fullHealEffect"),
    fullHealParticles: document.getElementById("fullHealParticles"),
    eventPray: document.getElementById("tileEventPray"),
    eventRitual: document.getElementById("tileEventRitual"),
    eventProphecy: document.getElementById("tileEventProphecy"),
    eventMonsterShop: document.getElementById("tileEventMonsterShop"),
    monsterShopPanel: document.getElementById("monsterShopPanel"),
    monsterShopClose: document.getElementById("monsterShopClose"),
    monsterShopTradeSlot: document.getElementById("monsterShopTradeSlot"),
    monsterShopCancelTrade: document.getElementById("monsterShopCancelTrade"),
    monsterShopOffers: document.getElementById("monsterShopOffers"),
    monsterShopStatus: document.getElementById("monsterShopStatus"),
    eventGraveyard: document.getElementById("tileEventGraveyard"),
    graveyardExtractPanel: document.getElementById("graveyardExtractPanel"),
    graveyardExtractClose: document.getElementById("graveyardExtractClose"),
    graveyardCorpseList: document.getElementById("graveyardCorpseList"),
    graveyardBrandList: document.getElementById("graveyardBrandList"),
    graveyardExtractStatus: document.getElementById("graveyardExtractStatus"),
    eventHillScout: document.getElementById("tileEventHillScout"),
    hillScoutPanel: document.getElementById("hillScoutPanel"),
    hillScoutClose: document.getElementById("hillScoutClose"),
    hillScoutList: document.getElementById("hillScoutList"),
    hillScoutStatus: document.getElementById("hillScoutStatus"),
    fortuneProphecyUi: document.getElementById("fortuneProphecyUi"),
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
  let patrolRouteState = loadPatrolRouteState();
  let patrolRouteDraft = clonePatrolRouteState(patrolRouteState);
  let patrolRouteSelectedCurrent = null;
  let patrolRouteSelectedReserve = null;
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
  if (globalThis.V2RunStateRuntime?.available) {
    await V2RunStateRuntime.bootstrap();
    const starterUnits = STARTING_UNIT_SLUGS.map((slug) => normalizeOwnedUnit(V2Rules.individual(slug)));
    const starterPool = V2DiceControl.cards.filter((card) => !STARTING_DICE_EXCLUDED_IDS.has(card.id));
    const starterCard = starterPool[Math.floor(Math.random() * Math.max(1, starterPool.length))];
    await V2RunStateRuntime.ensureFreshDefaults({
      ownedMonsters: starterUnits,
      diceCardIds: starterCard ? [starterCard.id] : [],
      regionId: activeMapId,
      heroIndex: HOME_INDEX
    });
    const restoredRun = V2RunStateRuntime.snapshot();
    if (restoredRun?.currentMap?.regionId && maps[restoredRun.currentMap.regionId]) activeMapId = restoredRun.currentMap.regionId;
    if (resumeHeroIndex === null && Number.isInteger(restoredRun?.currentMap?.heroIndex)) resumeHeroIndex = restoredRun.currentMap.heroIndex;
  }
  let enteringBattle = false;
  let eventOpen = false;
  let activeEventTileId = null;
  let activeEventRatio = WORLD_TREE_EVENT_RATIO;
  let battleStep = 0;
  let battleTileType = "monster";
  let battleMimicCount = 0;
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
  let monsterShopSelectedId = null;
  let monsterShopOffers = [];
  let monsterShopChosenOfferId = null;
  let monsterShopTrading = false;
  let graveyardSelectedCorpseId = null;
  let graveyardExtracting = false;
  let hillScout = loadHillScoutState();
  let contamination = loadContamination();
  const ownedUnits = loadOwnedRoster();

  function graveyardChildEventCompleted() {
    const runFlag = globalThis.V2RunStateRuntime?.snapshot?.()?.eventFlags?.[GRAVEYARD_CHILD_EVENT_FLAG];
    if (runFlag === true) return true;
    try { return sessionStorage.getItem(GRAVEYARD_CHILD_EVENT_FALLBACK_KEY) === "1"; }
    catch (_) { return false; }
  }

  async function markGraveyardChildEventComplete() {
    try { sessionStorage.setItem(GRAVEYARD_CHILD_EVENT_FALLBACK_KEY, "1"); } catch (_) {}
    if (globalThis.V2RunStateRuntime?.available && typeof V2RunStateRuntime.commitExact === "function") {
      const result = await V2RunStateRuntime.commitExact("event-complete:graveyard-child", (draft) => {
        if (!draft.eventFlags || typeof draft.eventFlags !== "object") draft.eventFlags = {};
        draft.eventFlags[GRAVEYARD_CHILD_EVENT_FLAG] = true;
      });
      return Boolean(result?.ok);
    }
    return true;
  }

  function currentPartyUnits() {
    const runParty = globalThis.V2RunStateRuntime?.snapshot?.()?.party;
    const candidateIds = Array.isArray(runParty) && runParty.length
      ? runParty
      : (selectedDeck.length ? selectedDeck : [...ownedUnits.keys()].slice(0, 4));
    return candidateIds.map((instanceId) => ownedUnits.get(instanceId)).filter(Boolean).slice(0, 4);
  }

  async function launchGraveyardChildEventFromMap(step) {
    if (graveyardChildEventCompleted()) return false;
    const partyUnits = currentPartyUnits();
    if (!partyUnits.length) return false;
    if (globalThis.V2RunStateRuntime?.available && typeof V2RunStateRuntime.commitExact === "function") {
      await V2RunStateRuntime.commitExact("party:event-graveyard-child", (draft) => {
        draft.party = partyUnits.map((unit) => unit.instanceId);
      });
      await V2RunStateRuntime.flush();
    }
    await saveMapLayout(currentTiles, "event-entry-map");
    if (globalThis.V2RunStateRuntime?.available) {
      await V2RunStateRuntime.setMapProgress({
        heroIndex,
        lapReadyForRefresh,
        worldTreePrayed,
        previousRoll: previousDiceRoll,
        previousEffectiveCardId: previousDiceControlId,
        pendingCardInstanceId: null,
        prefix: "event-entry-progress"
      });
      await V2RunStateRuntime.flush();
    }
    await openGraveyardStoryEvent();
    return true;
  }

  if (el.board && el.graveyardStoryEvent && el.graveyardStoryEvent.parentElement !== el.board) {
    el.board.appendChild(el.graveyardStoryEvent);
  }

  const tilePreloadIds = [
    ...tileTypes.map((tile) => tile.id),
    ...Object.values(fixedTiles).map((tile) => tile.id),
    "monster-cleared", "rare-monster-cleared", "boss-cleared"
  ];
  const mapRuntimeAssets = [
    ...rollingFrames,
    ...resultFrames,
    ...treasureChestFrames,
    ...Object.values(maps).map((map) => map.image),
    ...Object.values(tileEventScenes).map((scene) => scene.image).filter(Boolean),
    `${ROOT}events/home-interior.jpg?v=${EVENT_ASSET_VERSION}`,
    ...[...new Set(tilePreloadIds)].map((id) => `${ROOT}tiles/${id}.png?v=${TILE_ASSET_VERSION}`)
  ];

  if (globalThis.V2Assets?.documentReady) await V2Assets.documentReady;
  if (globalThis.V2Assets?.preload) {
    const preloadReport = await V2Assets.preload(mapRuntimeAssets, { retries: 2, timeout: 9000 });
    if (!preloadReport.ok) console.warn("[map] unavailable runtime assets", preloadReport.failed);
  } else {
    mapRuntimeAssets.forEach((src) => { const image = new Image(); image.src = src; });
  }


  function renderAudioOptions() {
    const bgmOn = typeof V2Music === "undefined" ? true : V2Music.isEnabled();
    const sfxOn = typeof V2Sfx === "undefined" ? true : V2Sfx.isEnabled();
    if (el.bgmToggle) {
      el.bgmToggle.textContent = bgmOn ? "ON" : "OFF";
      el.bgmToggle.setAttribute("aria-pressed", String(bgmOn));
    }
    if (el.sfxToggle) {
      el.sfxToggle.textContent = sfxOn ? "ON" : "OFF";
      el.sfxToggle.setAttribute("aria-pressed", String(sfxOn));
    }
  }

  function closeAudioOptions() {
    if (!el.audioOptions || el.audioOptions.hidden) return;
    el.audioOptions.hidden = true;
    el.optionsButton?.setAttribute("aria-expanded", "false");
  }

  function toggleAudioOptions() {
    if (!el.audioOptions) return;
    const willOpen = el.audioOptions.hidden;
    el.audioOptions.hidden = !willOpen;
    el.optionsButton?.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) renderAudioOptions();
  }

  let forestDioramaTimers = [];
  let forestDioramaFromTile = false;

  function clearForestDioramaTimers() {
    forestDioramaTimers.forEach((timer) => window.clearTimeout(timer));
    forestDioramaTimers = [];
  }

  function ensureForestTreeAssets(){
    const atlasSrc = "art/v2-style/map-test/diorama/forest-tree-atlas.webp?v=20261004-forest-stage26-atlas-edge-mask-1";
    document.querySelectorAll(".forest-tree-atlas-image").forEach((img)=>{
      if(!(img instanceof HTMLImageElement)) return;
      img.onerror=()=>{
        if(img.dataset.retry==="1") return;
        img.dataset.retry="1";
        img.src=atlasSrc + "&retry=1";
      };
      if(!img.src.includes("forest-tree-atlas.webp")) img.src=atlasSrc;
    });
  }

  function setForestTreeDebugVisibility(selector, visible) {
    const tree = document.querySelector(selector);
    if (!tree) return;
    tree.classList.toggle("is-debug-hidden", !visible);
    const button = el.forestLayerDebug?.querySelector(`[data-forest-tree-toggle="${selector}"]`);
    if (button) button.setAttribute("aria-pressed", String(visible));
  }

  function resetForestTreeDebug() {
    document.querySelectorAll(".forest-scene-tree.is-debug-hidden").forEach((tree) => tree.classList.remove("is-debug-hidden"));
    el.forestLayerDebug?.querySelectorAll("[data-forest-tree-toggle]").forEach((button) => button.setAttribute("aria-pressed", "true"));
  }

  let villageDioramaTimers = [];
  let selectedVillageBuilding = null;
  const VILLAGE_LAYOUT_STORAGE_KEY = "necromancer-dice-village-layout-v1";

  function clearVillageDioramaTimers() {
    villageDioramaTimers.forEach((timer) => window.clearTimeout(timer));
    villageDioramaTimers = [];
  }

  function ensureVillageBuildingAssets() {
    const version = "20261005-graveyard-stage5-approved-layout-1";
    document.querySelectorAll(".village-building-image").forEach((img, index) => {
      if (!(img instanceof HTMLImageElement)) return;
      const assetNumber = String(index + 1).padStart(2, "0");
      const directSrc = `art/v2-style/map-test/diorama/village-building-${assetNumber}.webp?v=${version}`;
      const host = img.closest(".village-scene-building");

      const markLoaded = () => {
        const valid = img.naturalWidth > 0 && img.naturalHeight > 0;
        img.dataset.assetState = valid ? "ready" : "invalid";
        host?.classList.toggle("is-asset-error", !valid);
      };
      const markErrorAndRetry = () => {
        img.dataset.assetState = "error";
        host?.classList.add("is-asset-error");
        if (img.dataset.retry === "1") return;
        img.dataset.retry = "1";
        img.src = directSrc + "&retry=1";
      };

      img.dataset.assetState = "loading";
      img.onload = markLoaded;
      img.onerror = markErrorAndRetry;

      if (!img.src.includes(`village-building-${assetNumber}.webp`) || !img.src.includes(version)) {
        img.dataset.retry = "0";
        img.src = directSrc;
      } else if (img.complete) {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) markLoaded();
        else markErrorAndRetry();
      }
    });
  }

  function ensureVillageTreeAssets() {
    const atlasSrc = "art/v2-style/map-test/diorama/forest-tree-atlas.webp?v=20261004-forest-stage26-atlas-edge-mask-1";
    document.querySelectorAll(".village-building-stage .forest-tree-atlas-image").forEach((img) => {
      if (!(img instanceof HTMLImageElement)) return;
      img.onerror = () => {
        if (img.dataset.retry === "1") return;
        img.dataset.retry = "1";
        img.src = atlasSrc + "&retry=1";
      };
      if (!img.src.includes("forest-tree-atlas.webp")) img.src = atlasSrc;
    });
  }

  function setVillageBuildingDebugVisibility(selector, visible) {
    const item = document.querySelector(selector);
    if (!item) return;
    item.classList.toggle("is-debug-hidden", !visible);
    const button = el.villageLayerDebug?.querySelector(
      `[data-village-building-toggle="${selector}"], [data-village-item-toggle="${selector}"]`
    );
    if (button) button.setAttribute("aria-pressed", String(visible));
    if (!visible && selectedVillageBuilding === item) selectVillageBuilding(null);
  }

  function resetVillageBuildingDebug() {
    document.querySelectorAll(".village-building-stage .village-layout-item").forEach((item) => {
      item.classList.toggle("is-debug-hidden", item.dataset.defaultHidden === "true");
    });
    el.villageLayerDebug?.querySelectorAll("[data-village-building-toggle]").forEach((button) => button.setAttribute("aria-pressed", "true"));
    el.villageLayerDebug?.querySelectorAll("[data-village-item-toggle]").forEach((button) => {
      const selector = button.dataset.villageItemToggle;
      const item = selector ? document.querySelector(selector) : null;
      button.setAttribute("aria-pressed", String(item ? !item.classList.contains("is-debug-hidden") : false));
    });
    selectVillageBuilding(null);
  }

  function getVillageLayoutSnapshot() {
    return Object.fromEntries(
      [...document.querySelectorAll(".village-building-stage .village-layout-item")].map((item) => [
        item.dataset.villageId,
        {
          left: item.style.left || "",
          top: item.style.top || "",
          bottom: item.style.bottom || "",
          width: item.style.width || "",
          zIndex: item.style.zIndex || "",
          flipX: item.classList.contains("is-layout-flipped"),
          hidden: item.classList.contains("is-debug-hidden")
        }
      ])
    );
  }

  function getVillageLayoutExportData() {
    return getVillageLayoutSnapshot();
  }

  async function copyVillageLayoutExport() {
    const text = JSON.stringify(getVillageLayoutExportData(), null, 2);
    if (el.villageLayoutExport) {
      el.villageLayoutExport.hidden = false;
      el.villageLayoutExport.value = text;
      el.villageLayoutExport.focus();
      el.villageLayoutExport.select();
    }

    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        copied = true;
      } else if (document.execCommand) {
        copied = document.execCommand("copy");
      }
    } catch {}

    showVillageLayoutSaveStatus(copied ? "배치값 복사됨" : "배치값 표시됨 · 길게 눌러 복사");
    return text;
  }

  function applyVillageLayoutSnapshot(layout) {
    const items = [...document.querySelectorAll(".village-building-stage .village-layout-item")];
    if (!layout) return false;

    // Backward compatibility with the old six-building array save format.
    if (Array.isArray(layout)) {
      if (layout.length !== 6) return false;
      items.filter((item) => item.dataset.villageType === "building").forEach((item, index) => {
        const saved = layout[index] || {};
        item.style.left = typeof saved.left === "string" ? saved.left : "";
        item.style.top = typeof saved.top === "string" ? saved.top : "";
        item.style.bottom = typeof saved.bottom === "string" ? saved.bottom : "";
        item.style.width = typeof saved.width === "string" ? saved.width : "";
        item.style.zIndex = typeof saved.zIndex === "string" ? saved.zIndex : "";
      });
      return true;
    }

    if (typeof layout !== "object") return false;
    let applied = false;
    items.forEach((item) => {
      const saved = layout[item.dataset.villageId];
      if (!saved || typeof saved !== "object") return;
      item.style.left = typeof saved.left === "string" ? saved.left : "";
      item.style.top = typeof saved.top === "string" ? saved.top : "";
      item.style.bottom = typeof saved.bottom === "string" ? saved.bottom : "";
      item.style.width = typeof saved.width === "string" ? saved.width : "";
      item.style.zIndex = typeof saved.zIndex === "string" ? saved.zIndex : "";
      item.classList.toggle("is-layout-flipped", saved.flipX === true);
      item.classList.toggle("is-debug-hidden", saved.hidden === true);
      const selector = item.dataset.villageType === "tree"
        ? `[data-village-item-toggle=".${[...item.classList].find((name) => name.startsWith("village-tree-"))}"]`
        : `[data-village-building-toggle=".${[...item.classList].find((name) => name.startsWith("village-building-"))}"]`;
      el.villageLayerDebug?.querySelector(selector)?.setAttribute("aria-pressed", String(saved.hidden !== true));
      applied = true;
    });
    return applied;
  }

  function showVillageLayoutSaveStatus(message) {
    if (!el.villageLayoutSaveStatus) return;
    el.villageLayoutSaveStatus.textContent = message;
  }

  function saveVillageLayout() {
    try {
      localStorage.setItem(VILLAGE_LAYOUT_STORAGE_KEY, JSON.stringify(getVillageLayoutSnapshot()));
      showVillageLayoutSaveStatus("저장됨");
    } catch {
      showVillageLayoutSaveStatus("저장 실패");
    }
  }

  function loadVillageLayout() {
    try {
      const raw = localStorage.getItem(VILLAGE_LAYOUT_STORAGE_KEY);
      if (!raw) return false;
      const applied = applyVillageLayoutSnapshot(JSON.parse(raw));
      if (applied) showVillageLayoutSaveStatus("저장된 배치 적용");
      return applied;
    } catch {
      localStorage.removeItem(VILLAGE_LAYOUT_STORAGE_KEY);
      return false;
    }
  }

  function resetVillageLayout() {
    localStorage.removeItem(VILLAGE_LAYOUT_STORAGE_KEY);
    document.querySelectorAll(".village-building-stage .village-layout-item").forEach((item) => {
      item.style.left = "";
      item.style.top = "";
      item.style.bottom = "";
      item.style.width = "";
      item.style.zIndex = "";
      item.classList.toggle("is-layout-flipped", item.dataset.defaultFlip === "true");
      item.classList.toggle("is-debug-hidden", item.dataset.defaultHidden === "true");
    });
    el.villageLayerDebug?.querySelectorAll("[data-village-building-toggle]").forEach((button) => button.setAttribute("aria-pressed", "true"));
    el.villageLayerDebug?.querySelectorAll("[data-village-item-toggle]").forEach((button) => {
      const selector = button.dataset.villageItemToggle;
      const item = selector ? document.querySelector(selector) : null;
      button.setAttribute("aria-pressed", String(item ? !item.classList.contains("is-debug-hidden") : false));
    });
    selectVillageBuilding(null);
    if (el.villageLayoutExport) {
      el.villageLayoutExport.value = "";
      el.villageLayoutExport.hidden = true;
    }
    showVillageLayoutSaveStatus("기본 배치로 복원");
  }

  function selectVillageBuilding(building) {
    document.querySelectorAll(".village-building-stage .village-layout-item.is-layout-selected").forEach((item) => {
      if (item !== building) item.classList.remove("is-layout-selected");
    });
    selectedVillageBuilding = building instanceof HTMLElement ? building : null;
    selectedVillageBuilding?.classList.add("is-layout-selected");

    const selectedId = selectedVillageBuilding?.dataset.villageId || "";
    if (el.villageSelectedBuildingLabel) {
      el.villageSelectedBuildingLabel.textContent = selectedId ? `선택: ${selectedId}` : "선택: 없음";
    }
    el.villageLayerDebug?.querySelectorAll("[data-village-size], [data-village-layer], [data-village-flip]").forEach((button) => {
      button.disabled = !selectedVillageBuilding;
    });
  }

  function resizeSelectedVillageBuilding(direction) {
    if (!selectedVillageBuilding) return;
    const stage = selectedVillageBuilding.closest(".village-building-stage");
    if (!stage) return;
    const stageWidth = stage.clientWidth;
    if (!stageWidth) return;

    const inlinePercent = selectedVillageBuilding.style.width.endsWith("%")
      ? Number.parseFloat(selectedVillageBuilding.style.width)
      : NaN;
    const layoutWidth = Number.parseFloat(getComputedStyle(selectedVillageBuilding).width);
    const currentPercent = Number.isFinite(inlinePercent)
      ? inlinePercent
      : (layoutWidth / stageWidth) * 100;
    const nextPercent = Math.min(40, Math.max(8, currentPercent + direction * 1.5));
    selectedVillageBuilding.style.width = `${nextPercent.toFixed(2)}%`;
  }

  function changeSelectedVillageBuildingLayer(direction) {
    if (!selectedVillageBuilding) return;
    const current = Number.parseInt(getComputedStyle(selectedVillageBuilding).zIndex, 10);
    const safeCurrent = Number.isFinite(current) ? current : 1;
    const next = Math.min(20, Math.max(0, safeCurrent + direction));
    selectedVillageBuilding.style.zIndex = String(next);
  }

  function flipSelectedVillageItem() {
    if (!selectedVillageBuilding) return;
    selectedVillageBuilding.classList.toggle("is-layout-flipped");
  }

  function moveVillageBuilding(building, clientX, clientY, grabOffsetX, grabOffsetY) {
    const stage = building.closest(".village-building-stage");
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    const buildingRect = building.getBoundingClientRect();
    const maxLeft = Math.max(0, stageRect.width - buildingRect.width);
    const maxTop = Math.max(0, stageRect.height - buildingRect.height);
    const leftPx = Math.min(maxLeft, Math.max(0, clientX - stageRect.left - grabOffsetX));
    const topPx = Math.min(maxTop, Math.max(0, clientY - stageRect.top - grabOffsetY));

    building.style.left = `${(leftPx / stageRect.width) * 100}%`;
    building.style.top = `${(topPx / stageRect.height) * 100}%`;
    building.style.bottom = "auto";
  }

  function enableVillageBuildingDragging() {
    document.querySelectorAll(".village-building-stage .village-layout-item").forEach((building) => {
      if (building.dataset.dragReady === "1") return;
      building.dataset.dragReady = "1";

      building.addEventListener("pointerdown", (event) => {
        if (event.button !== undefined && event.button !== 0) return;
        selectVillageBuilding(building);
        const rect = building.getBoundingClientRect();
        building.dataset.dragPointerId = String(event.pointerId);
        building.dataset.dragOffsetX = String(event.clientX - rect.left);
        building.dataset.dragOffsetY = String(event.clientY - rect.top);
        building.classList.add("is-layout-dragging");
        try { building.setPointerCapture?.(event.pointerId); } catch {}
        event.preventDefault();
      });

      building.addEventListener("pointermove", (event) => {
        if (building.dataset.dragPointerId !== String(event.pointerId)) return;
        moveVillageBuilding(
          building,
          event.clientX,
          event.clientY,
          Number(building.dataset.dragOffsetX || 0),
          Number(building.dataset.dragOffsetY || 0)
        );
        event.preventDefault();
      });

      const finishDrag = (event) => {
        if (building.dataset.dragPointerId !== String(event.pointerId)) return;
        try {
          if (!building.hasPointerCapture || building.hasPointerCapture(event.pointerId)) {
            building.releasePointerCapture?.(event.pointerId);
          }
        } catch {}
        delete building.dataset.dragPointerId;
        delete building.dataset.dragOffsetX;
        delete building.dataset.dragOffsetY;
        building.classList.remove("is-layout-dragging");
      };
      building.addEventListener("pointerup", finishDrag);
      building.addEventListener("pointercancel", finishDrag);
    });
  }

  let graveyardDioramaTimers = [];
  let selectedGraveyardItem = null;
  const GRAVEYARD_LAYOUT_STORAGE_KEY = "necromancer-dice-graveyard-layout-v3";

  function clearGraveyardDioramaTimers() {
    graveyardDioramaTimers.forEach((timer)=>window.clearTimeout(timer));
    graveyardDioramaTimers=[];
  }

  function getGraveyardItems() {
    return [...document.querySelectorAll(".graveyard-layout-stage .graveyard-layout-item")];
  }

  function selectGraveyardItem(item) {
    getGraveyardItems().forEach((other) => other.classList.toggle("is-layout-selected", other === item));
    selectedGraveyardItem = item instanceof HTMLElement ? item : null;
    if (el.graveyardSelectedLabel) el.graveyardSelectedLabel.textContent = selectedGraveyardItem ? `선택: ${selectedGraveyardItem.dataset.graveyardId}` : "선택: 없음";
    el.graveyardLayerDebug?.querySelectorAll("[data-graveyard-size],[data-graveyard-layer],[data-graveyard-flip]").forEach((button)=>button.disabled=!selectedGraveyardItem);
  }

  function moveGraveyardItem(item, clientX, clientY, offsetX, offsetY) {
    const stage = item.closest(".graveyard-layout-stage");
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const left = Math.min(Math.max(0, clientX-stageRect.left-offsetX), Math.max(0, stageRect.width-itemRect.width));
    const top = Math.min(Math.max(0, clientY-stageRect.top-offsetY), Math.max(0, stageRect.height-itemRect.height));
    item.style.left = `${(left/stageRect.width)*100}%`;
    item.style.top = `${(top/stageRect.height)*100}%`;
    item.style.bottom = "auto";
  }

  function enableGraveyardDragging() {
    getGraveyardItems().forEach((item)=>{
      if(item.dataset.dragReady==="1") return;
      item.dataset.dragReady="1";
      item.addEventListener("pointerdown",(event)=>{
        if(event.button!==undefined && event.button!==0) return;
        selectGraveyardItem(item);
        const rect=item.getBoundingClientRect();
        item.dataset.dragPointerId=String(event.pointerId);
        item.dataset.dragOffsetX=String(event.clientX-rect.left);
        item.dataset.dragOffsetY=String(event.clientY-rect.top);
        item.classList.add("is-layout-dragging");
        try{item.setPointerCapture?.(event.pointerId)}catch{}
        event.preventDefault();
      });
      item.addEventListener("pointermove",(event)=>{
        if(item.dataset.dragPointerId!==String(event.pointerId)) return;
        moveGraveyardItem(item,event.clientX,event.clientY,Number(item.dataset.dragOffsetX||0),Number(item.dataset.dragOffsetY||0));
        event.preventDefault();
      });
      const finish=(event)=>{
        if(item.dataset.dragPointerId!==String(event.pointerId)) return;
        try{item.releasePointerCapture?.(event.pointerId)}catch{}
        delete item.dataset.dragPointerId;delete item.dataset.dragOffsetX;delete item.dataset.dragOffsetY;
        item.classList.remove("is-layout-dragging");
      };
      item.addEventListener("pointerup",finish);item.addEventListener("pointercancel",finish);
    });
  }

  function resizeSelectedGraveyardItem(direction) {
    if(!selectedGraveyardItem) return;
    const stage=selectedGraveyardItem.closest(".graveyard-layout-stage");
    if(!stage?.clientWidth) return;
    const inline=selectedGraveyardItem.style.width.endsWith("%")?Number.parseFloat(selectedGraveyardItem.style.width):NaN;
    const layoutWidth=Number.parseFloat(getComputedStyle(selectedGraveyardItem).width);
    const current=Number.isFinite(inline)?inline:(layoutWidth/stage.clientWidth)*100;
    selectedGraveyardItem.style.width=`${Math.min(45,Math.max(4,current+direction*1.5)).toFixed(2)}%`;
  }

  function changeSelectedGraveyardLayer(direction) {
    if(!selectedGraveyardItem) return;
    const current=Number.parseInt(getComputedStyle(selectedGraveyardItem).zIndex,10);
    const next=Math.min(30,Math.max(0,(Number.isFinite(current)?current:1)+direction));
    selectedGraveyardItem.style.zIndex=String(next);
  }

  function flipSelectedGraveyardItem() {
    if(selectedGraveyardItem) selectedGraveyardItem.classList.toggle("is-layout-flipped");
  }

  function getGraveyardLayoutSnapshot() {
    return Object.fromEntries(getGraveyardItems().map((item)=>[item.dataset.graveyardId,{
      left:item.style.left||"",top:item.style.top||"",bottom:item.style.bottom||"",width:item.style.width||"",zIndex:item.style.zIndex||"",
      flipX:item.classList.contains("is-layout-flipped"),hidden:item.classList.contains("is-debug-hidden")
    }]));
  }

  function applyGraveyardLayoutSnapshot(layout) {
    if(!layout || typeof layout!=="object") return false;
    let applied=false;
    getGraveyardItems().forEach((item)=>{
      const saved=layout[item.dataset.graveyardId]; if(!saved) return;
      item.style.left=typeof saved.left==="string"?saved.left:"";
      item.style.top=typeof saved.top==="string"?saved.top:"";
      item.style.bottom=typeof saved.bottom==="string"?saved.bottom:"";
      item.style.width=typeof saved.width==="string"?saved.width:"";
      item.style.zIndex=typeof saved.zIndex==="string"?saved.zIndex:"";
      item.classList.toggle("is-layout-flipped",saved.flipX===true);
      item.classList.toggle("is-debug-hidden",saved.hidden===true);
      const selector=`.graveyard-item-${item.dataset.graveyardId.toLowerCase()}`;
      el.graveyardLayerDebug?.querySelector(`[data-graveyard-toggle="${selector}"]`)?.setAttribute("aria-pressed",String(saved.hidden!==true));
      applied=true;
    });
    return applied;
  }

  function saveGraveyardLayout() {
    try{localStorage.setItem(GRAVEYARD_LAYOUT_STORAGE_KEY,JSON.stringify(getGraveyardLayoutSnapshot()));if(el.graveyardLayoutSaveStatus)el.graveyardLayoutSaveStatus.textContent="저장됨";}catch{if(el.graveyardLayoutSaveStatus)el.graveyardLayoutSaveStatus.textContent="저장 실패";}
  }
  function loadGraveyardLayout() {
    try{const raw=localStorage.getItem(GRAVEYARD_LAYOUT_STORAGE_KEY);return raw?applyGraveyardLayoutSnapshot(JSON.parse(raw)):false;}catch{return false;}
  }
  function resetGraveyardLayout() {
    localStorage.removeItem(GRAVEYARD_LAYOUT_STORAGE_KEY);
    getGraveyardItems().forEach((item)=>{
      item.style.left=item.dataset.defaultLeft||"";
      item.style.top=item.dataset.defaultTop||"";
      item.style.bottom=item.dataset.defaultBottom||"";
      item.style.width=item.dataset.defaultWidth||"";
      item.style.zIndex=item.dataset.defaultZ||"";
      item.classList.toggle("is-layout-flipped",item.dataset.defaultFlip==="true");
      item.classList.toggle("is-debug-hidden",item.dataset.defaultHidden==="true");
    });
    el.graveyardLayerDebug?.querySelectorAll("[data-graveyard-toggle]").forEach((b)=>{
      const selector=b.dataset.graveyardToggle;
      const item=selector?document.querySelector(selector):null;
      b.setAttribute("aria-pressed",String(item?!item.classList.contains("is-debug-hidden"):false));
    });
    selectGraveyardItem(null);
    if(el.graveyardLayoutSaveStatus)el.graveyardLayoutSaveStatus.textContent="기본 배치로 복원";
  }
  async function copyGraveyardLayoutExport() {
    const text=JSON.stringify(getGraveyardLayoutSnapshot(),null,2);
    if(el.graveyardLayoutExport){el.graveyardLayoutExport.hidden=false;el.graveyardLayoutExport.value=text;el.graveyardLayoutExport.focus();el.graveyardLayoutExport.select();}
    try{await navigator.clipboard?.writeText?.(text);if(el.graveyardLayoutSaveStatus)el.graveyardLayoutSaveStatus.textContent="배치값 복사됨";}catch{if(el.graveyardLayoutSaveStatus)el.graveyardLayoutSaveStatus.textContent="배치값 표시됨";}
  }

  function setGraveyardEditorCollapsed(collapsed) {
    const shouldCollapse = collapsed === true;
    el.graveyardLayerDebug?.classList.toggle("is-collapsed", shouldCollapse);
    const collapseButton = el.graveyardLayerDebug?.querySelector("[data-graveyard-editor-collapse]");
    if (collapseButton) {
      collapseButton.setAttribute("aria-expanded", String(!shouldCollapse));
      collapseButton.textContent = shouldCollapse ? "펼치기" : "접기";
    }
    if (el.graveyardEditorReopen) el.graveyardEditorReopen.hidden = !shouldCollapse;
  }

  function updateGraveyardAssetStatus() {
    if (!el.graveyardAtlasProbe || !el.graveyardAssetStatus) return false;
    const width = el.graveyardAtlasProbe.naturalWidth;
    const height = el.graveyardAtlasProbe.naturalHeight;
    const ready = width === 1536 && height === 1260;
    el.graveyardAssetStatus.classList.toggle("is-ready", ready);
    el.graveyardAssetStatus.classList.toggle("is-error", !ready);
    el.graveyardAssetStatus.textContent = ready
      ? "아틀라스 정상 · 1536×1260 · 14개 셀 표시"
      : (el.graveyardAtlasProbe.complete ? `아틀라스 오류 · ${width}×${height}` : "아틀라스 불러오는 중…");
    return ready;
  }

  function ensureGraveyardAtlas() {
    if (!(el.graveyardAtlasProbe instanceof HTMLImageElement)) return;
    const src = "art/v2-style/map-test/diorama/graveyard/graveyard-atlas.webp?v=20261005-graveyard-stage5-approved-layout-1";
    el.graveyardAtlasProbe.onload = updateGraveyardAssetStatus;
    el.graveyardAtlasProbe.onerror = () => {
      if (el.graveyardAssetStatus) {
        el.graveyardAssetStatus.classList.remove("is-ready");
        el.graveyardAssetStatus.classList.add("is-error");
        el.graveyardAssetStatus.textContent = "아틀라스 로드 실패";
      }
    };
    if (!el.graveyardAtlasProbe.src.includes("graveyard-atlas.webp")) el.graveyardAtlasProbe.src = src;
    if (el.graveyardAtlasProbe.complete) updateGraveyardAssetStatus();
  }

  function openGraveyardDioramaTest() {
    if (!el.graveyardDioramaTest || !el.board) return;
    closeAudioOptions();
    if (el.graveyardDioramaTest && !el.graveyardDioramaTest.hidden) closeGraveyardDioramaTest();
    if (el.villageDioramaTest && !el.villageDioramaTest.hidden) closeVillageDioramaTest();
    if (el.forestDioramaTest && !el.forestDioramaTest.hidden) closeForestDioramaTest();
    clearGraveyardDioramaTimers();

    document.querySelector(".map-lab")?.classList.add("is-graveyard-inspector-open");
    el.board.classList.remove("is-graveyard-zooming","is-graveyard-tilted","is-graveyard-props");
    el.graveyardDioramaTest.classList.remove("is-zooming","is-tilted","is-playing");

    ensureGraveyardAtlas();
    enableGraveyardDragging();
    loadGraveyardLayout();
    if (el.graveyardLayerDebug) el.graveyardLayerDebug.hidden=false;
    setGraveyardEditorCollapsed(false);
    el.graveyardDioramaTest.hidden=false;
    void el.board.offsetWidth;

    // 1) Camera rushes into the board.
    el.board.classList.add("is-graveyard-zooming");
    el.graveyardDioramaTest.classList.add("is-zooming");

    // 2) Board plane tilts into the cemetery ground.
    graveyardDioramaTimers.push(window.setTimeout(()=>{
      el.board.classList.add("is-graveyard-tilted");
      el.graveyardDioramaTest.classList.add("is-tilted");
    },560));

    // 3) Cemetery props settle into view.
    graveyardDioramaTimers.push(window.setTimeout(()=>{
      el.board.classList.add("is-graveyard-props");
      el.graveyardDioramaTest.classList.add("is-playing");
    },1560));
  }

  function closeGraveyardDioramaTest() {
    if (!el.graveyardDioramaTest || el.graveyardDioramaTest.hidden) return;
    clearGraveyardDioramaTimers();
    el.graveyardDioramaTest.classList.remove("is-playing","is-tilted","is-zooming");
    el.board?.classList.remove("is-graveyard-props","is-graveyard-tilted","is-graveyard-zooming");
    el.graveyardDioramaTest.hidden=true;
    if (el.graveyardLayerDebug) el.graveyardLayerDebug.hidden=true;
    setGraveyardEditorCollapsed(false);
    selectGraveyardItem(null);
    document.querySelector(".map-lab")?.classList.remove("is-graveyard-inspector-open");
  }

  function openVillageDioramaTest() {
    if (!el.villageDioramaTest || !el.board) return;
    closeAudioOptions();
    if (el.graveyardDioramaTest && !el.graveyardDioramaTest.hidden) closeGraveyardDioramaTest();
    if (el.forestDioramaTest && !el.forestDioramaTest.hidden) closeForestDioramaTest();
    clearVillageDioramaTimers();
    resetVillageBuildingDebug();
    selectVillageBuilding(null);

    document.querySelector(".map-lab")?.classList.add("is-village-diorama-open");
    el.board.classList.remove("is-village-zooming", "is-village-tilted", "is-village-buildings");
    el.villageDioramaTest.classList.remove("is-zooming", "is-tilted", "is-playing");
    if (el.villageLayerDebug) el.villageLayerDebug.hidden = false;
    ensureVillageBuildingAssets();
    ensureVillageTreeAssets();
    enableVillageBuildingDragging();
    loadVillageLayout();
    el.villageDioramaTest.hidden = false;
    void el.board.offsetWidth;

    el.board.classList.add("is-village-zooming");
    el.villageDioramaTest.classList.add("is-zooming");

    villageDioramaTimers.push(window.setTimeout(() => {
      el.board.classList.add("is-village-tilted");
      el.villageDioramaTest.classList.add("is-tilted");
    }, 560));

    villageDioramaTimers.push(window.setTimeout(() => {
      el.board.classList.add("is-village-buildings");
      el.villageDioramaTest.classList.add("is-playing");
    }, 1560));
  }

  function closeVillageDioramaTest() {
    if (!el.villageDioramaTest || el.villageDioramaTest.hidden) return;
    clearVillageDioramaTimers();
    el.villageDioramaTest.classList.remove("is-playing", "is-tilted", "is-zooming");
    el.board?.classList.remove("is-village-buildings", "is-village-tilted", "is-village-zooming");
    el.villageDioramaTest.hidden = true;
    if (el.villageLayerDebug) el.villageLayerDebug.hidden = true;
    resetVillageBuildingDebug();
    selectVillageBuilding(null);
    document.querySelector(".map-lab")?.classList.remove("is-village-diorama-open");
  }

  function openForestDioramaTest(options = {}){
    if (!el.forestDioramaTest || !el.board) return;
    closeAudioOptions();
    if (el.villageDioramaTest && !el.villageDioramaTest.hidden) closeVillageDioramaTest();
    clearForestDioramaTimers();

    forestDioramaFromTile = options.fromTile === true;
    if (el.forestLayerDebug) el.forestLayerDebug.hidden = forestDioramaFromTile;
    document.querySelector(".map-lab")?.classList.add("is-forest-diorama-open");
    el.board.classList.remove("is-forest-zooming", "is-forest-tilted", "is-forest-trees");
    el.forestDioramaTest.classList.remove("is-zooming", "is-tilted", "is-playing");
    ensureForestTreeAssets();
    el.forestDioramaTest.hidden = false;
    void el.board.offsetWidth;

    // 1) Camera moves into the center of the board.
    el.board.classList.add("is-forest-zooming");
    el.forestDioramaTest.classList.add("is-zooming");

    // 2) The board settles into the forest floor.
    forestDioramaTimers.push(window.setTimeout(() => {
      el.board.classList.add("is-forest-tilted");
      el.forestDioramaTest.classList.add("is-tilted");
    }, 560));

    // 3) Final scope: forest background only.
    forestDioramaTimers.push(window.setTimeout(() => {
      el.board.classList.add("is-forest-trees");
      el.forestDioramaTest.classList.add("is-playing");
    }, 1560));
  }

  function closeForestDioramaTest() {
    if (!el.forestDioramaTest || el.forestDioramaTest.hidden) return;
    clearForestDioramaTimers();
    el.forestDioramaTest.classList.remove("is-playing", "is-tilted", "is-zooming");
    el.board?.classList.remove("is-forest-trees", "is-forest-tilted", "is-forest-zooming");
    el.forestDioramaTest.hidden = true;
    if (el.forestLayerDebug) el.forestLayerDebug.hidden = true;
    resetForestTreeDebug();
    document.querySelector(".map-lab")?.classList.remove("is-forest-diorama-open");

    if (forestDioramaFromTile) {
      eventOpen = false;
      activeEventTileId = null;
      rolling = false;
      el.diceButton.disabled = false;
      el.regenerate.disabled = false;
      el.diceButton.focus();
    }
    forestDioramaFromTile = false;
  }

  function openForestTileEvent(tile, step) {
    if (!tile || tile.id !== "forest" || enteringBattle || eventOpen) return false;
    eventOpen = true;
    activeEventTileId = "forest";
    activeEventRatio = tileEventRatios.forest || WORLD_TREE_EVENT_RATIO;
    el.diceButton.disabled = true;
    el.regenerate.disabled = true;
    el.eventOverlay.hidden = true;
    el.board.classList.remove("is-tile-event-open");
    openForestDioramaTest({ fromTile: true });
    return true;
  }

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function showWorldTreeContaminationChange(delta) {
    if (!el.eventContaminationChange || !Number.isFinite(delta) || delta === 0) return;
    const amount = Math.abs(Math.round(delta));
    const host = el.eventContaminationChange;
    host.className = "tile-event-contamination-change";
    host.dataset.result = delta === -5 ? "great-blessing" : delta === -3 ? "blessing" : "failure";
    host.textContent = delta < 0 ? `+${amount}` : `-${amount}`;
    host.setAttribute("aria-label", `오염도 ${delta < 0 ? "감소" : "증가"} ${amount}`);
    if (globalThis.V2WorldTreePrayerDigits?.src) {
      host.style.backgroundImage = `url("${globalThis.V2WorldTreePrayerDigits.src}")`;
    } else {
      host.style.removeProperty("background-image");
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
    normalized.brands = V2Rules.normalizeUnitBrands(normalized);
    return normalized;
  }

  async function saveOwnedRoster(prefix = "map-roster") {
    const roster = [...ownedUnits.values()].map((unit) => JSON.parse(JSON.stringify(unit)));
    if (globalThis.V2RunStateRuntime?.available) {
      const result = await V2RunStateRuntime.replaceOwnedMonsters(roster, prefix);
      renderInventoryCounts();
      refreshOpenBookUnitInfo();
      return Boolean(result?.ok);
    }
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(OWNED_ROSTER_KEY, JSON.stringify(roster));
      renderInventoryCounts();
      refreshOpenBookUnitInfo();
      return true;
    } catch (_) {
      renderInventoryCounts();
      refreshOpenBookUnitInfo();
      return false;
    }
  }

  function renderInventoryCounts() {
    if (el.monsterCount) el.monsterCount.textContent = `${ownedUnits.size}/${MONSTER_CAPACITY}`;
    if (el.diceCardCount) el.diceCardCount.textContent = `${diceControlHand.length}/${DICE_CONTROL_CAPACITY}`;
  }
  function playSwampDamageEffect() {
    if (el.hero) {
      el.hero.classList.remove("is-swamp-hit");
      void el.hero.offsetWidth;
      el.hero.classList.add("is-swamp-hit");
      window.setTimeout(() => el.hero?.classList.remove("is-swamp-hit"), 680);
    }
    if (el.swampDamageOverlay) {
      el.swampDamageOverlay.hidden = false;
      el.swampDamageOverlay.classList.remove("is-showing");
      void el.swampDamageOverlay.offsetWidth;
      el.swampDamageOverlay.classList.add("is-showing");
      window.setTimeout(() => {
        el.swampDamageOverlay?.classList.remove("is-showing");
        if (el.swampDamageOverlay) el.swampDamageOverlay.hidden = true;
      }, 820);
    }
  }

  async function applyPollutedSwamp(step) {
    let damaged = 0;
    let protectedAtOne = 0;
    for (const unit of ownedUnits.values()) {
      const hp = Number.isFinite(unit.currentHp) ? unit.currentHp : unit.maxHp;
      if (!Number.isFinite(hp) || hp <= 0) continue;
      if (hp <= 1) {
        unit.currentHp = 1;
        protectedAtOne += 1;
        continue;
      }
      unit.currentHp = hp - 1;
      damaged += 1;
    }
    const saved = await saveOwnedRoster("polluted-swamp");
    renderBookRoster();
    if (!el.deckOverlay.hidden) renderDeckSelection();
    renderInventoryCounts();
    playSwampDamageEffect();

    const protectedText = protectedAtOne ? ` · HP 1 유지 ${protectedAtOne}마리` : "";
    el.tileName.textContent = `${step}번 · 오염된 늪지대`;
    el.diceResult.textContent = damaged
      ? `오염된 늪지대 · HP -1 (${damaged}마리)${protectedText}${saved ? "" : " · 저장 확인 필요"}`
      : `오염된 늪지대 · HP 1 보호${protectedText}`;
    return { damaged, protectedAtOne, saved };
  }

  function addOwnedUnit(slug) {
    if (!TEST_DECK.some((entry) => entry.slug === slug) || ownedUnits.size >= MONSTER_CAPACITY) return null;
    const unit = normalizeOwnedUnit(V2Rules.individual(slug));
    ownedUnits.set(unit.instanceId, unit);
    void saveOwnedRoster();
    renderBookRoster();
    renderInventoryCounts();
    if (!el.deckOverlay.hidden) renderDeckSelection();
    return unit;
  }

  function loadContamination() {
    const runValue = globalThis.V2RunStateRuntime?.snapshot?.()?.contamination;
    if (Number.isFinite(runValue)) return Math.max(0, Math.min(CONTAMINATION_MAX, runValue));
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

  function renderContaminationVisual(value, preview = false) {
    const visualValue = Math.max(0, Math.min(CONTAMINATION_MAX, Math.round(Number(value) || 0)));
    const stage = contaminationStage(visualValue);
    const percent = (visualValue / CONTAMINATION_MAX) * 100;
    if (el.contaminationFill) el.contaminationFill.style.width = `${percent}%`;
    if (el.contaminationStage) el.contaminationStage.textContent = stage.label;
    if (el.contaminationValue) el.contaminationValue.textContent = `${visualValue} / ${CONTAMINATION_MAX}${preview ? " · 테스트" : ""}`;
    if (el.contaminationHud) el.contaminationHud.dataset.stage = stage.id;
    if (el.board) {
      const normalized = visualValue / CONTAMINATION_MAX;
      const crackOpacity = Math.min(.62, Math.max(0, (visualValue - 25) / 75 * .62));
      const fogOpacity = Math.min(.72, Math.max(0, (visualValue - 45) / 55 * .72));
      el.board.style.setProperty("--corruption-tint-opacity", String(normalized * .72));
      el.board.style.setProperty("--corruption-crack-opacity", String(crackOpacity));
      el.board.style.setProperty("--corruption-fog-opacity", String(fogOpacity));
      el.board.dataset.corruptionStage = stage.id;
    }
    if (el.contaminationTestSlider && !preview) el.contaminationTestSlider.value = String(visualValue);
    if (el.contaminationTestValue) el.contaminationTestValue.textContent = preview ? `미리보기 ${visualValue}` : `실제 ${visualValue}`;
    document.querySelectorAll("[data-contamination-preview]").forEach((button) => {
      const requested = button.dataset.contaminationPreview;
      button.classList.toggle("is-active", preview ? requested === String(visualValue) : requested === "actual");
    });
  }

  function renderContamination() {
    renderContaminationVisual(contamination, false);
  }

  function setContamination(value) {
    contamination = Math.max(0, Math.min(CONTAMINATION_MAX, Math.round(Number(value) || 0)));
    if (globalThis.V2RunStateRuntime?.available) {
      V2RunStateRuntime.setContamination(contamination, "map-contamination");
    } else {
      try {
        if (typeof sessionStorage !== "undefined") sessionStorage.setItem(CONTAMINATION_KEY, String(contamination));
      } catch (_) { /* Keep the live run usable without storage. */ }
    }
    renderContamination();
    return contamination;
  }

  function addContamination(amount) {
    return setContamination(contamination + Number(amount || 0));
  }

  function loadGraveyardCorpses() {
    const runCorpses = globalThis.V2RunStateRuntime?.snapshot?.()?.graveyardCorpses;
    let saved = Array.isArray(runCorpses) ? runCorpses : null;
    if (!saved) {
      try {
        if (typeof sessionStorage !== "undefined") saved = JSON.parse(sessionStorage.getItem(GRAVEYARD_CORPSES_KEY) || "[]");
      } catch (_) {
        saved = [];
      }
    }
    return (Array.isArray(saved) ? saved : [])
      .filter((corpse) => corpse?.diedInBattle === true && typeof corpse.instanceId === "string" && corpse.instanceId &&
        typeof corpse.slug === "string" && corpse.slug && Array.isArray(corpse.brands))
      .map((corpse) => JSON.parse(JSON.stringify(corpse)));
  }

  function hasGraveyardCorpses() {
    return loadGraveyardCorpses().length > 0;
  }

  function hasInjuredOwnedUnits() {
    return [...ownedUnits.values()].some((unit) => Number.isFinite(unit.currentHp) && unit.currentHp < unit.maxHp);
  }

  function healOwnedRosterFull() {
    for (const unit of ownedUnits.values()) unit.currentHp = unit.maxHp;
    void saveOwnedRoster();
    renderBookRoster();
    if (!el.deckOverlay.hidden) renderDeckSelection();
  }

  async function healOwnedRosterFullWithImpact() {
    healOwnedRosterFull();
    await playFullHealEffect();
  }

  const FULL_HEAL_CROSS_SRC = "art/v2-style/ui/heal-cross.png?v=1";
  const FULL_HEAL_CROSS_SPECS = Object.freeze([
    [8, 18, 22, 0, 1080, -4], [18, 30, 26, 70, 1020, 4], [29, 22, 21, 140, 1120, -3],
    [40, 43, 29, 40, 1060, 4], [52, 27, 24, 180, 1160, -4], [64, 38, 28, 100, 1040, 3],
    [75, 20, 21, 230, 1100, -3], [87, 34, 25, 150, 1060, 4], [93, 51, 20, 290, 1080, -3],
    [12, 57, 24, 330, 1040, 3], [25, 69, 22, 220, 1140, -4], [37, 60, 27, 390, 1020, 4],
    [49, 74, 20, 450, 1100, -3], [61, 64, 25, 300, 1060, 3], [73, 78, 22, 500, 1120, -4],
    [84, 69, 28, 410, 1040, 4], [94, 82, 21, 540, 1080, -3], [56, 50, 20, 580, 1000, 3]
  ]);
  let fullHealCrossReady = null;

  function prepareFullHealCross() {
    if (fullHealCrossReady) return fullHealCrossReady;
    fullHealCrossReady = new Promise((resolve) => {
      const image = new Image();
      let settled = false;
      const done = (ok) => {
        if (settled) return;
        settled = true;
        resolve(ok);
      };
      const timeout = setTimeout(() => done(false), 3500);
      image.onload = async () => {
        clearTimeout(timeout);
        try { if (image.decode) await image.decode(); } catch (_) {}
        done(true);
      };
      image.onerror = () => { clearTimeout(timeout); done(false); };
      image.src = FULL_HEAL_CROSS_SRC;
    });
    return fullHealCrossReady;
  }

  async function playFullHealEffect() {
    if (!el.fullHealEffect || !el.fullHealParticles) return;

    // The heal artwork is an external image. On mobile, starting the short
    // animation before it has decoded can make every particle finish while
    // the image is still blank. Wait for the preload/decode before rendering.
    const artworkReady = await prepareFullHealCross();
    el.fullHealParticles.replaceChildren();

    const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const specs = reducedMotion ? FULL_HEAL_CROSS_SPECS.slice(0, 9) : FULL_HEAL_CROSS_SPECS;

    for (const [left, top, size, delay, duration, drift] of specs) {
      const cross = document.createElement("span");
      cross.className = artworkReady ? "full-heal-cross" : "full-heal-cross is-fallback";
      cross.setAttribute("aria-hidden", "true");
      cross.style.setProperty("--heal-left", `${left}%`);
      cross.style.setProperty("--heal-top", `${top}%`);
      cross.style.setProperty("--heal-size", `${size}px`);
      cross.style.setProperty("--heal-delay", `${reducedMotion ? Math.min(delay, 180) : delay}ms`);
      cross.style.setProperty("--heal-duration", `${reducedMotion ? Math.min(duration, 1150) : duration}ms`);
      cross.style.setProperty("--heal-drift", `${drift}px`);

      const art = document.createElement("img");
      art.className = "full-heal-cross-art";
      art.src = FULL_HEAL_CROSS_SRC;
      art.alt = "";
      art.draggable = false;
      art.decoding = "sync";
      art.loading = "eager";
      cross.append(art);

      el.fullHealParticles.append(cross);
    }

    el.fullHealEffect.hidden = false;
    el.fullHealEffect.classList.remove("is-playing");
    void el.fullHealEffect.offsetWidth;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    el.fullHealEffect.classList.add("is-playing");

    await wait(reducedMotion ? 1050 : 2200);
    el.fullHealEffect.classList.remove("is-playing");
    el.fullHealEffect.hidden = true;
    el.fullHealParticles.replaceChildren();
  }

  prepareFullHealCross();

  function emptyProphecyStack() {
    return { allyAttack: 0, allyHp: 0, allySpeed: 0, enemyAttack: 0, rolls: [] };
  }

  function pendingProphecy() {
    try {
      if (typeof sessionStorage === "undefined") return emptyProphecyStack();
      const raw = sessionStorage.getItem(FORTUNE_PROPHECY_KEY);
      if (!raw) return emptyProphecyStack();
      const parsed = JSON.parse(raw);
      return {
        allyAttack: Math.max(0, Math.floor(Number(parsed?.allyAttack) || 0)),
        allyHp: Math.max(0, Math.floor(Number(parsed?.allyHp) || 0)),
        allySpeed: Math.max(0, Math.floor(Number(parsed?.allySpeed) || 0)),
        enemyAttack: Math.max(0, Math.floor(Number(parsed?.enemyAttack) || 0)),
        rolls: Array.isArray(parsed?.rolls) ? parsed.rolls.filter((value) => Number.isInteger(value) && value >= 1 && value <= 6).slice(-24) : []
      };
    } catch (_) {
      return emptyProphecyStack();
    }
  }

  function addPendingProphecy(result) {
    if (!Number.isInteger(result) || result < 1 || result > 6 || result === 2) return pendingProphecy();
    const stack = pendingProphecy();
    if (result === 1) stack.enemyAttack += 1;
    if (result === 3) stack.allySpeed += 1;
    if (result === 4) stack.allyHp += 2;
    if (result === 5) stack.allyAttack += 1;
    if (result === 6) {
      stack.allyAttack += 1;
      stack.allyHp += 2;
    }
    stack.rolls.push(result);
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(FORTUNE_PROPHECY_KEY, JSON.stringify(stack));
    } catch (_) { /* Keep prophecy usable when storage is blocked. */ }
    if (globalThis.V2RunStateRuntime?.available) {
      V2RunStateRuntime.setMapProgress({ fortuneProphecy: stack, prefix: "fortune-prophecy-stack" });
    }
    refreshOpenBookUnitInfo();
    return stack;
  }

  function prophecyStackLabel(stack = pendingProphecy()) {
    const parts = [];
    if (stack.allyAttack) parts.push(`아군 공격 +${stack.allyAttack}`);
    if (stack.allyHp) parts.push(`아군 체력 +${stack.allyHp}`);
    if (stack.allySpeed) parts.push(`아군 속도 +${stack.allySpeed}`);
    if (stack.enemyAttack) parts.push(`적 공격 +${stack.enemyAttack}`);
    return parts.length ? parts.join(" · ") : "누적 없음";
  }

  function loadOwnedRoster() {
    let saved = globalThis.V2RunStateRuntime?.snapshot?.()?.ownedMonsters;
    if (!Array.isArray(saved)) {
      try { if (typeof sessionStorage !== "undefined") saved = JSON.parse(sessionStorage.getItem(OWNED_ROSTER_KEY)); } catch (_) { /* Private browsing can block storage. */ }
    }
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
    if (globalThis.V2RunStateRuntime?.available) V2RunStateRuntime.replaceOwnedMonsters(roster, "map-roster-normalize");
    else {
      try { if (typeof sessionStorage !== "undefined") sessionStorage.setItem(OWNED_ROSTER_KEY, JSON.stringify(roster)); } catch (_) { /* The current map still works without storage. */ }
    }
    return new Map(roster.map((unit) => [unit.instanceId, unit]));
  }

  async function syncInventoryStateFromStorage() {
    try {
      if (globalThis.V2RunStateRuntime?.available) await V2RunStateRuntime.flush();
      const run = globalThis.V2RunStateRuntime?.snapshot?.();
      const savedRoster = Array.isArray(run?.ownedMonsters)
        ? run.ownedMonsters
        : (typeof sessionStorage !== "undefined" ? JSON.parse(sessionStorage.getItem(OWNED_ROSTER_KEY)) : null);
      if (Array.isArray(savedRoster)) {
        const refreshed = savedRoster
          .filter((unit) => TEST_DECK.some((entry) => entry.slug === unit?.slug))
          .map(normalizeOwnedUnit);
        const refreshedIds = new Set(refreshed.map((unit) => unit.instanceId));
        ownedUnits.clear();
        for (const unit of refreshed) ownedUnits.set(unit.instanceId, unit);
        selectedDeck = selectedDeck.filter((instanceId) => refreshedIds.has(instanceId));
      }

      const savedDice = Array.isArray(run?.diceCards)
        ? run.diceCards.map((card) => card.cardId)
        : (typeof sessionStorage !== "undefined" ? JSON.parse(sessionStorage.getItem(DICE_CONTROL_INVENTORY_KEY)) : null);
      if (Array.isArray(savedDice) && savedDice.every((id) => V2DiceControl.cards.some((card) => card.id === id))) {
        diceControlHand = savedDice.slice(0, DICE_CONTROL_CAPACITY)
          .map((id) => V2DiceControl.cards.find((card) => card.id === id))
          .filter(Boolean);
      }

      renderBookRoster();
      renderDiceControlHand();
      if (!el.deckOverlay.hidden) renderDeckSelection();
      renderInventoryCounts();
      refreshOpenBookUnitInfo();
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

  function loadHillScoutState() {
    const saved = globalThis.V2RunStateRuntime?.snapshot?.()?.currentMap?.hillScout;
    if (!saved || typeof saved !== "object" || !Array.isArray(saved.intel)) return { scouted: false, intel: [] };
    return {
      scouted: Boolean(saved.scouted),
      intel: saved.intel.filter((entry) =>
        Number.isInteger(entry?.step) && entry.step >= 1 && entry.step <= 24 &&
        MONSTER_BATTLE_TILE_IDS.has(entry.tileType) &&
        Number.isInteger(entry.count) && entry.count >= 1 && entry.count <= 4 &&
        ["normal","advanced","hero"].includes(entry.grade) &&
        typeof entry.legion === "string" && entry.legion
      ).map((entry) => ({ ...entry }))
    };
  }

  function scoutEncounterStage(value = contamination) {
    for (let index = SCOUT_ENCOUNTER_STAGES.length - 1; index >= 0; index -= 1) {
      if (value >= SCOUT_ENCOUNTER_STAGES[index].min) return SCOUT_ENCOUNTER_STAGES[index];
    }
    return SCOUT_ENCOUNTER_STAGES[0];
  }

  const MAP_LOOP_FALLBACK_KEY = "necromancer-map-loop-v1";
  let mapLoop = (() => {
    const runLap = globalThis.V2RunStateRuntime?.snapshot?.()?.currentMap?.lap;
    if (Number.isInteger(runLap) && runLap >= 0) return runLap + 1;
    try {
      return Math.max(1, Math.floor(Number(sessionStorage.getItem(MAP_LOOP_FALLBACK_KEY)) || 1));
    } catch (_) {
      return 1;
    }
  })();

  function currentEncounterLoop() {
    return mapLoop;
  }

  async function advanceMapLoop() {
    mapLoop += 1;
    try { sessionStorage.setItem(MAP_LOOP_FALLBACK_KEY, String(mapLoop)); } catch (_) {}
    if (globalThis.V2RunStateRuntime?.available && typeof V2RunStateRuntime.commitExact === "function") {
      await V2RunStateRuntime.commitExact("map-lap-advance", (draft) => {
        if (!draft.currentMap || typeof draft.currentMap !== "object") draft.currentMap = {};
        draft.currentMap.lap = mapLoop - 1;
      });
    }
    return mapLoop;
  }

  function constrainedEncounterCount(requestedCount, value = contamination, loop = currentEncounterLoop()) {
    if (loop <= 2) return 1;
    const minimum = 2;
    return Math.max(minimum, Math.max(1, Math.min(4, Math.floor(Number(requestedCount) || 1))));
  }

  function scoutWeightedChoice(values, weights) {
    let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
    for (let index = 0; index < values.length; index += 1) {
      roll -= weights[index];
      if (roll <= 0) return values[index];
    }
    return values[values.length - 1];
  }

  function createScoutIntelForStep(tile, step) {
    const stage = scoutEncounterStage();
    const rolledCount = scoutWeightedChoice(stage.counts, stage.countWeights);
    const count = constrainedEncounterCount(rolledCount);
    const gradeNames = ["normal", "advanced", "hero"];
    const gradeWeights = gradeNames.map((grade) => stage.grades[grade]);
    let grade = scoutWeightedChoice(gradeNames, gradeWeights);
    let candidates = SCOUT_ENEMY_SLUGS
      .map((slug) => globalThis.V2DesignData?.units?.[slug])
      .filter(Boolean)
      .filter((unit) => unit.grade === grade && Array.isArray(unit.legions) && unit.legions.length);
    if (!candidates.length) {
      candidates = SCOUT_ENEMY_SLUGS
        .map((slug) => globalThis.V2DesignData?.units?.[slug])
        .filter((unit) => unit && Array.isArray(unit.legions) && unit.legions.length);
      grade = candidates[Math.floor(Math.random() * candidates.length)]?.grade || "normal";
      candidates = candidates.filter((unit) => unit.grade === grade);
    }
    const anchor = candidates[Math.floor(Math.random() * Math.max(1, candidates.length))];
    const legion = anchor?.legions?.[Math.floor(Math.random() * anchor.legions.length)] || "skeleton";
    return { step, tileType: tile.id, count, grade, legion };
  }

  async function ensureHillScoutIntel() {
    if (!hillScout.scouted) {
      const intel = currentTiles
        .map((tile, index) => ({ tile, step: index + 1 }))
        .filter(({ tile, step }) => isMonsterBattleTile(tile) && !isMonsterTileCleared(step))
        .map(({ tile, step }) => createScoutIntelForStep(tile, step));
      hillScout = { scouted: true, intel };
      if (globalThis.V2RunStateRuntime?.available) {
        await V2RunStateRuntime.setMapProgress({ hillScout, prefix: "hill-scout" });
        await V2RunStateRuntime.flush();
      }
    }
    renderHillScoutBadges();
    return hillScout;
  }

  function activeHillScoutIntel() {
    return hillScout.intel.filter((entry) => !isMonsterTileCleared(entry.step));
  }

  function renderHillScoutBadges() {
    currentButtons.forEach((button) => button?.querySelector(".hill-scout-badge")?.remove());
    if (!hillScout.scouted) return;
    for (const intel of activeHillScoutIntel()) {
      const button = currentButtons[intel.step - 1];
      if (!button) continue;
      const badge = document.createElement("span");
      badge.className = "hill-scout-badge";
      badge.textContent = "정찰";
      badge.setAttribute("aria-hidden", "true");
      button.append(badge);
    }
  }

  function scoutTileTypeLabel(type) {
    return type === "rare-monster" ? "희귀 마물" : type === "boss" ? "보스" : "일반 마물";
  }

  function renderHillScoutPanel() {
    el.hillScoutList.replaceChildren();
    const intel = activeHillScoutIntel().sort((a, b) => a.step - b.step);
    if (!intel.length) {
      const empty = document.createElement("div");
      empty.className = "hill-scout-empty";
      empty.textContent = "현재 맵에 남아 있는 마물 타일이 없습니다.";
      el.hillScoutList.append(empty);
      el.hillScoutStatus.textContent = "정찰할 대상이 없습니다.";
      return;
    }
    for (const entry of intel) {
      const card = document.createElement("article");
      const header = document.createElement("header");
      const title = document.createElement("strong");
      const type = document.createElement("em");
      const list = document.createElement("dl");
      card.className = `hill-scout-card is-${entry.tileType === "rare-monster" ? "rare" : entry.tileType === "boss" ? "boss" : "normal"}`;
      title.textContent = `${entry.step}번 타일`;
      type.textContent = scoutTileTypeLabel(entry.tileType);
      header.append(title, type);
      const rows = [
        ["적 수", `${entry.count}마리`],
        ["등급", `${GRADE_LABELS[entry.grade] || entry.grade} 포함`],
        ["군단", `${LEGION_LABELS[entry.legion] || entry.legion} 확인`]
      ];
      for (const [key, value] of rows) {
        const dt = document.createElement("dt");
        const dd = document.createElement("dd");
        dt.textContent = key;
        dd.textContent = value;
        list.append(dt, dd);
      }
      card.append(header, list);
      el.hillScoutList.append(card);
    }
    el.hillScoutStatus.textContent = `남은 마물 타일 ${intel.length}곳 정찰 완료 · 정확한 마물 종류는 전투 진입 시 결정됩니다.`;
  }

  async function openHillScout() {
    if (!eventOpen || activeEventTileId !== "forest") return;
    el.eventHillScout.disabled = true;
    el.diceResult.textContent = "언덕 · 전역 정찰 중…";
    await ensureHillScoutIntel();
    renderHillScoutPanel();
    el.hillScoutPanel.hidden = false;
    el.eventHillScout.hidden = true;
    el.eventHillScout.disabled = false;
    el.diceResult.textContent = "언덕 · 전역 정찰";
    el.hillScoutClose.focus();
  }

  function closeHillScout() {
    if (!eventOpen || activeEventTileId !== "forest") return;
    el.hillScoutPanel.hidden = true;
    el.eventHillScout.hidden = false;
    el.eventHillScout.textContent = hillScout.scouted ? "정찰 정보" : "정찰";
    el.eventHillScout.focus();
  }

  function defaultPatrolRouteState() {
    return {
      current: [...PATROL_ROUTE_DEFAULT_CURRENT],
      reserve: [...PATROL_ROUTE_DEFAULT_RESERVE]
    };
  }

  function clonePatrolRouteState(state) {
    return {
      current: [...state.current],
      reserve: [...state.reserve]
    };
  }

  function patrolRouteInventoryIsValid(state) {
    if (!state || !Array.isArray(state.current) || !Array.isArray(state.reserve)) return false;
    if (state.current.length !== PATROL_ROUTE_DEFAULT_CURRENT.length || state.reserve.length !== PATROL_ROUTE_DEFAULT_RESERVE.length) return false;
    const all = [...state.current, ...state.reserve];
    if (all.some((id) => !PATROL_ROUTE_ALLOWED_IDS.has(id))) return false;
    const counts = all.reduce((result, id) => {
      result[id] = (result[id] || 0) + 1;
      return result;
    }, {});
    const expected = [...PATROL_ROUTE_DEFAULT_CURRENT, ...PATROL_ROUTE_DEFAULT_RESERVE].reduce((result, id) => {
      result[id] = (result[id] || 0) + 1;
      return result;
    }, {});
    return Object.keys(expected).every((id) => counts[id] === expected[id]) &&
      Object.keys(counts).every((id) => counts[id] === expected[id]);
  }

  function readPatrolRouteStorage(storage, key) {
    try {
      if (!storage) return null;
      const raw = storage.getItem(key);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      return patrolRouteInventoryIsValid(saved) ? clonePatrolRouteState(saved) : null;
    } catch (_) {
      return null;
    }
  }

  function loadPatrolRouteState() {
    const fromSession = readPatrolRouteStorage(
      typeof sessionStorage !== "undefined" ? sessionStorage : null,
      PATROL_ROUTE_KEY
    );
    if (fromSession) return fromSession;

    const fromPersistent = readPatrolRouteStorage(
      typeof localStorage !== "undefined" ? localStorage : null,
      PATROL_ROUTE_PERSIST_KEY
    );
    if (fromPersistent) {
      try {
        sessionStorage.setItem(PATROL_ROUTE_KEY, JSON.stringify(fromPersistent));
      } catch (_) { /* Session mirror is optional. */ }
      return fromPersistent;
    }

    return defaultPatrolRouteState();
  }

  function savePatrolRouteState() {
    const payload = JSON.stringify(patrolRouteState);
    let saved = false;
    try {
      sessionStorage.setItem(PATROL_ROUTE_KEY, payload);
      saved = true;
    } catch (_) { /* Keep trying the persistent store below. */ }
    try {
      localStorage.setItem(PATROL_ROUTE_PERSIST_KEY, payload);
      saved = true;
    } catch (_) { /* The live run remains playable even when storage is blocked. */ }
    return saved;
  }


  function makePatrolTileButton(id, area, index) {
    const button = document.createElement("button");
    const image = document.createElement("img");
    const label = document.createElement("span");
    button.type = "button";
    button.className = "patrol-route-tile";
    button.dataset.area = area;
    button.dataset.index = String(index);
    button.dataset.type = id;
    image.src = `${ROOT}tiles/${id}.png?v=${TILE_ASSET_VERSION}`;
    image.alt = "";
    label.textContent = PATROL_ROUTE_LABELS[id] || id;
    button.append(image, label);

    const selected = area === "current"
      ? patrolRouteSelectedCurrent === index
      : patrolRouteSelectedReserve === index;
    button.classList.toggle("is-selected", selected);

    button.addEventListener("click", () => {
      if (area === "current") {
        if (patrolRouteSelectedReserve !== null) {
          swapPatrolRouteTiles(index, patrolRouteSelectedReserve);
          return;
        }
        patrolRouteSelectedCurrent = patrolRouteSelectedCurrent === index ? null : index;
        patrolRouteSelectedReserve = null;
      } else {
        if (patrolRouteSelectedCurrent !== null) {
          swapPatrolRouteTiles(patrolRouteSelectedCurrent, index);
          return;
        }
        patrolRouteSelectedReserve = patrolRouteSelectedReserve === index ? null : index;
        patrolRouteSelectedCurrent = null;
      }
      renderPatrolRoutePanel();
    });
    return button;
  }

  function swapPatrolRouteTiles(currentIndex, reserveIndex) {
    const currentTile = patrolRouteDraft.current[currentIndex];
    patrolRouteDraft.current[currentIndex] = patrolRouteDraft.reserve[reserveIndex];
    patrolRouteDraft.reserve[reserveIndex] = currentTile;
    patrolRouteSelectedCurrent = null;
    patrolRouteSelectedReserve = null;
    renderPatrolRoutePanel();
  }

  function renderPatrolRoutePanel() {
    el.patrolRouteCurrent.replaceChildren();
    el.patrolRouteReserve.replaceChildren();

    patrolRouteDraft.current.forEach((id, index) => {
      el.patrolRouteCurrent.append(makePatrolTileButton(id, "current", index));
    });
    patrolRouteDraft.reserve.forEach((id, index) => {
      el.patrolRouteReserve.append(makePatrolTileButton(id, "reserve", index));
    });

    if (patrolRouteSelectedCurrent !== null) {
      const id = patrolRouteDraft.current[patrolRouteSelectedCurrent];
      el.patrolRouteStatus.textContent = `${PATROL_ROUTE_LABELS[id]} 선택 · 교체판에서 바꿀 타일을 누르세요.`;
    } else if (patrolRouteSelectedReserve !== null) {
      const id = patrolRouteDraft.reserve[patrolRouteSelectedReserve];
      el.patrolRouteStatus.textContent = `${PATROL_ROUTE_LABELS[id]} 선택 · 현재 경로에서 바꿀 타일을 누르세요.`;
    } else {
      const monsterCount = patrolRouteDraft.current.filter((id) => id === "monster").length;
      el.patrolRouteStatus.textContent = monsterCount
        ? `현재 일반 마물 타일 ${monsterCount}칸 추가 · 타일을 눌러 서로 교체하세요.`
        : "현재 경로 타일을 고른 뒤 교체판 타일을 누르면 서로 바뀝니다.";
    }
    el.patrolRouteConfirm.disabled = false;
  }

  function openPatrolRoute() {
    if (!eventOpen || activeEventTileId !== "home") return;
    // Re-read storage whenever the editor opens so returning to home never
    // reconstructs the default route from a stale in-memory draft.
    patrolRouteState = loadPatrolRouteState();
    patrolRouteDraft = clonePatrolRouteState(patrolRouteState);
    patrolRouteSelectedCurrent = null;
    patrolRouteSelectedReserve = null;
    renderPatrolRoutePanel();
    el.patrolRoutePanel.hidden = false;
    el.board.classList.add("is-patrol-route-open");
    el.eventPatrolRoute.hidden = true;
    el.eventInheritance.hidden = true;
    el.eventClose.hidden = true;
    el.patrolRouteClose.focus();
  }

  function closePatrolRoute() {
    if (el.patrolRoutePanel.hidden) return;
    el.patrolRoutePanel.hidden = true;
    el.board.classList.remove("is-patrol-route-open");
    patrolRouteSelectedCurrent = null;
    patrolRouteSelectedReserve = null;
    if (eventOpen && activeEventTileId === "home") {
      el.eventPatrolRoute.hidden = false;
      el.eventInheritance.hidden = false;
      el.eventClose.hidden = false;
      el.eventPatrolRoute.focus();
    }
  }

  function resetPatrolRouteDraft() {
    patrolRouteDraft = defaultPatrolRouteState();
    patrolRouteSelectedCurrent = null;
    patrolRouteSelectedReserve = null;
    renderPatrolRoutePanel();
  }

  function confirmPatrolRoute() {
    if (!patrolRouteInventoryIsValid(patrolRouteDraft)) return;
    patrolRouteState = clonePatrolRouteState(patrolRouteDraft);
    const saved = savePatrolRouteState();
    if (!saved) {
      el.patrolRouteStatus.textContent = "저장에 실패했습니다. 브라우저 저장소를 확인하세요.";
      return;
    }
    // Verify the serialized state immediately. Do not close on a failed write.
    const verified = loadPatrolRouteState();
    if (!patrolRouteInventoryIsValid(verified) ||
        JSON.stringify(verified) !== JSON.stringify(patrolRouteState)) {
      el.patrolRouteStatus.textContent = "순찰경로 저장 확인에 실패했습니다.";
      return;
    }
    patrolRouteState = verified;
    el.diceResult.textContent = "순찰경로 저장 완료 · 다음 타일 배치에 적용";
    closePatrolRoute();
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

  function patrolRouteDeltasForState(state = patrolRouteState) {
    const ids = [...PATROL_ROUTE_ALLOWED_IDS];
    const baseline = Object.fromEntries(ids.map((id) => [id, 0]));
    const current = Object.fromEntries(ids.map((id) => [id, 0]));
    PATROL_ROUTE_DEFAULT_CURRENT.forEach((id) => { baseline[id] += 1; });
    state.current.forEach((id) => { current[id] += 1; });
    return Object.fromEntries(ids.map((id) => [id, current[id] - baseline[id]]));
  }

  function buildMapTileCounts(state = patrolRouteState, contaminationValue = contamination) {
    const counts = Object.fromEntries(tileTypes.map((tile) => [tile.id, tile.count]));
    const routeDeltas = patrolRouteDeltasForState(state);

    for (const [id, delta] of Object.entries(routeDeltas)) {
      counts[id] = (counts[id] || 0) + delta;
    }

    // One explicit structural slot replaces the old invisible basic-tile fallback.
    counts.monster += MAP_STRUCTURAL_MONSTER_SLOTS;

    const stage = contaminationStage(contaminationValue);
    const bossActive = contaminationValue >= BOSS_CONTAMINATION_MIN;

    // Until the boss unlocks, the future boss slot is occupied by a normal monster.
    if (!bossActive) counts.monster += MAP_PRE_BOSS_MONSTER_SLOTS;

    // Corruption may turn remaining neutral/basic route tiles into monsters, but it
    // must never recreate a basic tile or invalidate a patrol choice that removed it.
    const requestedConversions = Math.max(0, stage.monsterTiles - 3);
    const actualConversions = Math.min(requestedConversions, Math.max(0, counts.basic || 0));
    counts.basic -= actualConversions;
    counts.monster += actualConversions;

    return counts;
  }

  function expectedMapDistribution(state = patrolRouteState, contaminationValue = contamination) {
    const counts = buildMapTileCounts(state, contaminationValue);
    counts["fortune-teller-camp"] = 1;
    counts.village = 1;
    counts.home = 1;
    counts.boss = contaminationValue >= BOSS_CONTAMINATION_MIN ? 1 : 0;
    return counts;
  }

  function hasValidMapDistribution(pool) {
    if (!isValidMapPool(pool)) return false;
    if (pool[0]?.id !== "fortune-teller-camp" || pool[8]?.id !== "village" || pool[HOME_INDEX]?.id !== "home") return false;

    const actual = pool.reduce((result, tile) => {
      result[tile.id] = (result[tile.id] || 0) + 1;
      return result;
    }, {});
    const expected = expectedMapDistribution();

    const ids = new Set([...Object.keys(actual), ...Object.keys(expected)]);
    for (const id of ids) {
      if ((actual[id] || 0) !== (expected[id] || 0)) return false;
    }

    const bossActive = contamination >= BOSS_CONTAMINATION_MIN;
    if (bossActive && pool[23]?.id !== "boss") return false;
    if (!bossActive && pool[23]?.id === "boss") return false;
    return true;
  }

  function loadSavedMapLayout() {
    if (resumeHeroIndex === null) return null;
    try {
      const runTiles = globalThis.V2RunStateRuntime?.snapshot?.()?.currentMap?.tiles;
      const ids = Array.isArray(runTiles) && runTiles.length === 24
        ? runTiles.map((tile) => tile.typeId)
        : JSON.parse(sessionStorage.getItem(MAP_LAYOUT_KEY));
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

  function saveMapLayout(tiles = currentTiles, prefix = "map-layout") {
    const ids = tiles.map((tile) => tile.id);
    if (globalThis.V2RunStateRuntime?.available) {
      return V2RunStateRuntime.setMapLayout(ids, {
        prefix,
        regionId: activeMapId,
        heroIndex,
        lapReadyForRefresh,
        worldTreePrayed
      });
    }
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(MAP_LAYOUT_KEY, JSON.stringify(ids));
    } catch (_) { /* Keep the live map usable without storage. */ }
    return Promise.resolve({ ok: true });
  }

  function loadClearedMonsterSteps() {
    try {
      const run = globalThis.V2RunStateRuntime?.snapshot?.();
      const runTiles = run?.currentMap?.tiles || [];
      const cleared = new Set(run?.clearedTiles || []);
      const saved = runTiles.length === 24
        ? runTiles.map((tile, index) => cleared.has(tile.tileInstanceId) ? index + 1 : null).filter(Boolean)
        : JSON.parse(sessionStorage.getItem(MAP_CLEARED_MONSTER_KEY));
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
    if (globalThis.V2RunStateRuntime?.available) V2RunStateRuntime.setClearedSteps([], "map-clear-reset");
    else {
      try {
        if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(MAP_CLEARED_MONSTER_KEY);
      } catch (_) { /* A fresh map still works without storage. */ }
    }
  }

  function loadWorldTreePrayer() {
    const runValue = globalThis.V2RunStateRuntime?.snapshot?.()?.currentMap?.worldTreePrayed;
    if (typeof runValue === "boolean") {
      worldTreePrayed = runValue;
      return;
    }
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
    if (globalThis.V2RunStateRuntime?.available) V2RunStateRuntime.setMapProgress({ worldTreePrayed: true, prefix: "world-tree-prayed" });
    else {
      try {
        if (typeof sessionStorage !== "undefined") sessionStorage.setItem(WORLD_TREE_PRAYER_KEY, "1");
      } catch (_) { /* Prayer still works without storage persistence. */ }
    }
  }

  function isMonsterBattleTile(tile) {
    return MONSTER_BATTLE_TILE_IDS.has(tile?.id);
  }

  function isMonsterTileCleared(step) {
    return clearedMonsterSteps.has(step);
  }

  function getTileImage(tile, step) {
    const cleared = isMonsterTileCleared(step);
    if (tile.id === "monster") {
      return `${ROOT}tiles/${cleared ? "monster-cleared" : "monster"}.png?v=${TILE_ASSET_VERSION}`;
    }
    if (tile.id === "rare-monster") {
      return `${ROOT}tiles/${cleared ? "rare-monster-cleared" : "rare-monster"}.png?v=${TILE_ASSET_VERSION}`;
    }
    if (tile.id === "boss") {
      return `${ROOT}tiles/${cleared ? "boss-cleared" : "boss"}.png?v=${TILE_ASSET_VERSION}`;
    }
    return `${ROOT}tiles/${tile.id}.png?v=${TILE_ASSET_VERSION}`;
  }

  function createPool() {
    const bossActive = contamination >= BOSS_CONTAMINATION_MIN;
    const counts = buildMapTileCounts();

    for (const [id, count] of Object.entries(counts)) {
      if (!Number.isInteger(count) || count < 0) {
        throw new Error(`Invalid map count for ${id}: ${count}`);
      }
    }

    const pool = Array(24);
    pool[0] = fixedTiles.fortune;
    pool[8] = fixedTiles.village;
    pool[HOME_INDEX] = fixedTiles.home;
    if (bossActive) pool[23] = fixedTiles.boss;

    const emptySlots = pool.length - pool.filter(Boolean).length;
    const randomTiles = tileTypes.flatMap((tile) =>
      Array.from({ length: counts[tile.id] || 0 }, () => tile)
    );

    // Never silently repair a count mismatch with basic tiles. A mismatch here means
    // a balance/configuration bug and must be visible during testing instead of
    // changing the player's patrol route behind their back.
    if (randomTiles.length !== emptySlots) {
      const summary = Object.entries(counts)
        .filter(([, count]) => count > 0)
        .map(([id, count]) => `${id}:${count}`)
        .join(",");
      throw new Error(`Map count mismatch: random=${randomTiles.length}, slots=${emptySlots}, boss=${bossActive}, counts=${summary}`);
    }

    shuffle(randomTiles);
    for (let index = 0, randomIndex = 0; index < pool.length; index += 1) {
      if (!pool[index]) pool[index] = randomTiles[randomIndex++];
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

  function mimicCountForContamination(value = contamination) {
    if (value >= 80) return 4;
    if (value >= 60) return 3;
    if (value >= 20) return 2;
    return 1;
  }

  function enterMimicBattle(step) {
    if (enteringBattle) return false;
    closeTileEvent();
    forceCloseBookRoster();
    enteringBattle = true;
    battleStep = step;
    battleTileType = "mimic";
    battleMimicCount = mimicCountForContamination();
    selectedDeck = [];
    el.diceButton.disabled = true;
    el.regenerate.disabled = true;
    el.tileName.textContent = `${step}번 · 보물상자에서 미믹 ${battleMimicCount}마리 출현`;
    el.diceResult.textContent = `미믹 습격 · 오염도 ${contamination} · ${battleMimicCount}마리`;
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

  function saveDiceControlInventory(prefix = "dice-inventory") {
    const ids = diceControlHand.map((card) => card.id);
    if (globalThis.V2RunStateRuntime?.available) V2RunStateRuntime.replaceDiceCards(ids, prefix);
    else {
      try {
        if (typeof sessionStorage !== "undefined") sessionStorage.setItem(DICE_CONTROL_INVENTORY_KEY, JSON.stringify(ids));
      } catch (_) { /* Keep the current run usable without storage. */ }
    }
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
    const runCards = globalThis.V2RunStateRuntime?.snapshot?.()?.diceCards;
    if (Array.isArray(runCards)) saved = runCards.map((card) => card.cardId);
    else {
      try {
        if (typeof sessionStorage !== "undefined") saved = JSON.parse(sessionStorage.getItem(DICE_CONTROL_INVENTORY_KEY));
      } catch (_) { /* Storage can be unavailable. */ }
    }
    if (Array.isArray(saved) && saved.every((id) => V2DiceControl.cards.some((card) => card.id === id))) {
      return saved.map((id) => V2DiceControl.cards.find((card) => card.id === id)).filter(Boolean);
    }
    const startingPool = V2DiceControl.cards.filter((card) => !STARTING_DICE_EXCLUDED_IDS.has(card.id));
    const startingCard = startingPool[Math.floor(Math.random() * startingPool.length)];
    const inventory = startingCard ? [startingCard] : [];
    if (globalThis.V2RunStateRuntime?.available) V2RunStateRuntime.replaceDiceCards(inventory.map((card) => card.id), "dice-inventory-default");
    else {
      try {
        if (typeof sessionStorage !== "undefined") sessionStorage.setItem(DICE_CONTROL_INVENTORY_KEY, JSON.stringify(inventory.map((card) => card.id)));
      } catch (_) { /* Keep the current run usable without storage. */ }
    }
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
        if (el.board?.classList.contains("is-monster-shop-open")) {
          if (monsterShopTrading || ownedUnits.size <= 1) {
            el.monsterShopStatus.textContent = "마지막 마물 1장은 거래할 수 없습니다.";
            return;
          }
          monsterShopSelectedId = owned.instanceId;
          monsterShopOffers = createMonsterShopOffers(owned);
          monsterShopChosenOfferId = null;
          el.monsterShopStatus.textContent = `${entry.name}을 거래대에 올렸습니다. 상품을 한 번 눌러 선택하고, 한 번 더 눌러 거래하세요.`;
          renderMonsterShopTradeSlot();
          renderMonsterShopOffers();
          forceCloseBookRoster();
          return;
        }
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

  function mapEffectiveUnitStats(unit) {
    const prophecy = pendingProphecy();
    const hpBonus = Math.max(0, prophecy.allyHp || 0);
    const attackBonus = Math.max(0, prophecy.allyAttack || 0);
    const speedBonus = Math.max(0, prophecy.allySpeed || 0);
    const baseCurrentHp = Number.isFinite(unit.currentHp) ? unit.currentHp : unit.maxHp;
    return {
      currentHp: Math.max(1, baseCurrentHp + hpBonus),
      maxHp: Math.max(1, unit.maxHp + hpBonus),
      attack: Math.max(0, unit.attack + attackBonus),
      speed: Math.max(0, unit.speed + speedBonus),
      prophecy: { hpBonus, attackBonus, speedBonus }
    };
  }

  function openBookUnitInfo(unit, { focus = true } = {}) {
    if (!unit) return;
    el.infoOverlay.dataset.instanceId = unit.instanceId || "";
    el.infoName.textContent = unit.name;
    const portraitVersion = unit.slug === "siren" ? 3 : unit.slug === "minotaur" ? 2 : 1;
    el.infoPortrait.src = `art/v2-style/ui/info-portraits/${unit.slug}.png?v=${portraitVersion}`;
    el.infoPortrait.alt = unit.name;
    el.infoGrade.textContent = GRADE_LABELS[unit.grade] || "미지정";
    el.infoLegion.textContent = unit.legions.map((key) => LEGION_LABELS[key] || key).join(" · ") || "미지정";
    const effective = mapEffectiveUnitStats(unit);
    el.infoHp.textContent = `${effective.currentHp} / ${effective.maxHp}`;
    el.infoAttack.textContent = String(effective.attack);
    el.infoSpeed.textContent = String(effective.speed);
    el.infoHp.dataset.prophecyBonus = String(effective.prophecy.hpBonus);
    el.infoAttack.dataset.prophecyBonus = String(effective.prophecy.attackBonus);
    el.infoSpeed.dataset.prophecyBonus = String(effective.prophecy.speedBonus);
    el.infoHp.title = effective.prophecy.hpBonus ? `예언 체력 +${effective.prophecy.hpBonus} 적용 중` : "";
    el.infoAttack.title = effective.prophecy.attackBonus ? `예언 공격력 +${effective.prophecy.attackBonus} 적용 중` : "";
    el.infoSpeed.title = effective.prophecy.speedBonus ? `예언 속도 +${effective.prophecy.speedBonus} 적용 중` : "";
    const passiveName = unit.passive?.name || "패시브 없음";
    el.infoBrands.innerHTML = `<div class="map-passive-heading"><span class="map-passive-symbol" aria-hidden="true">◇</span><span>${escapeInfo(passiveName)}</span></div>` +
      (unit.brands.map((brand) => `<div class="map-brand-heading">${bookBrandIcon(brand.type)}<h4>${escapeInfo(V2Rules.definitions[brand.type]?.name || brand.type)}</h4></div>`).join("") || '<p class="map-unit-info-empty">낙인 없음</p>');
    el.infoOverlay.hidden = false;
    if (focus) el.infoClose.focus();
  }

  function refreshOpenBookUnitInfo() {
    if (!el.infoOverlay || el.infoOverlay.hidden) return;
    const instanceId = el.infoOverlay.dataset.instanceId;
    if (!instanceId) return;
    const latest = ownedUnits.get(instanceId);
    if (!latest) {
      closeBookUnitInfo();
      return;
    }
    openBookUnitInfo(latest, { focus: false });
  }

  function closeBookUnitInfo() {
    el.infoOverlay.hidden = true;
    delete el.infoOverlay.dataset.instanceId;
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

  async function confirmMonsterBattle() {
    if (selectedDeck.length < 1 || selectedDeck.length > 4) return;
    el.deckConfirm.disabled = true;
    el.deckStatus.textContent = "전장으로 이동 중…";
    const encounterId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    await saveMapLayout(currentTiles, "battle-entry-map");
    if (globalThis.V2RunStateRuntime?.available) {
      await V2RunStateRuntime.setMapProgress({
        heroIndex,
        lapReadyForRefresh,
        worldTreePrayed,
        previousRoll: previousDiceRoll,
        previousEffectiveCardId: previousDiceControlId,
        pendingCardInstanceId: null,
        prefix: "battle-entry-progress"
      });
      await V2RunStateRuntime.flush();
    }
    const selectedUnits = selectedDeck.map((instanceId) => ownedUnits.get(instanceId)).filter(Boolean);
    if (globalThis.V2RunStateRuntime?.available && typeof V2RunStateRuntime.commitExact === "function") {
      await V2RunStateRuntime.commitExact("party:battle-entry", (draft) => {
        draft.party = selectedUnits.map((unit) => unit.instanceId);
      });
      await V2RunStateRuntime.flush();
    }
    const params = new URLSearchParams({
      from: "map",
      map: activeMapId,
      tile: String(battleStep),
      allies: selectedUnits.map((unit) => unit.slug).join(","),
      allyIds: selectedUnits.map((unit) => unit.instanceId).join(","),
      encounter: encounterId,
      encounterType: battleTileType,
      contamination: String(contamination),
      loop: String(currentEncounterLoop())
    });
    if (battleTileType === "mimic" && battleMimicCount > 0) {
      params.set("mimicCount", String(battleMimicCount));
    }
    const prophecy = pendingProphecy();
    if (prophecy.allyAttack) params.set("prophecyAllyAttack", String(prophecy.allyAttack));
    if (prophecy.allyHp) params.set("prophecyAllyHp", String(prophecy.allyHp));
    if (prophecy.allySpeed) params.set("prophecyAllySpeed", String(prophecy.allySpeed));
    if (prophecy.enemyAttack) params.set("prophecyEnemyAttack", String(prophecy.enemyAttack));
    const scoutIntel = hillScout.scouted ? hillScout.intel.find((entry) => entry.step === battleStep) : null;
    if (scoutIntel) {
      params.set("scoutCount", String(scoutIntel.count));
      params.set("scoutGrade", scoutIntel.grade);
      params.set("scoutLegion", scoutIntel.legion);
    }
    if (prophecy.allyAttack || prophecy.allyHp || prophecy.allySpeed || prophecy.enemyAttack) {
      const clearedProphecy = emptyProphecyStack();
      try { if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(FORTUNE_PROPHECY_KEY); } catch (_) {}
      if (globalThis.V2RunStateRuntime?.available) {
        await V2RunStateRuntime.setMapProgress({ fortuneProphecy: clearedProphecy, prefix: "fortune-prophecy-consume" });
        await V2RunStateRuntime.flush();
      }
    }
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
    const brandRewards = Array.from({ length: 3 }, () => {
      const brandCard = V2BrandCards.create();
      return {
        type: "brand",
        id: brandCard.id,
        label: V2BrandCards.label(brandCard),
        image: V2BrandCards.imagePath(),
        brandCard
      };
    });
    return shuffle([...unitRewards, ...diceRewards, ...brandRewards]).slice(0, 3);
  }

  async function animateTreasureRewardToTarget(reward, selectedCard) {
    const targetButton = reward.type === "dice" ? el.cardDeckButton : el.bookButton;
    const targetImage = reward.type === "dice" ? el.cardDeckImage : el.bookImage;
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
    if (type === "unit") return `art/v2-style/ui/unit-card-${item.slug}.png?v=19`;
    if (type === "brand") return V2BrandCards.imagePath();
    return V2DiceControl.imagePath(item, "ko");
  }

  function forceDiscardForReward(reward) {
    return new Promise((resolve) => {
      const type = reward.type;
      if (type === "brand") {
        V2BrandCards.addAsync(reward.brandCard).then((acquired) => {
          resolve({ acquired: Boolean(acquired), keptReward: Boolean(acquired) });
        });
        return;
      }
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
            void saveOwnedRoster();
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
      : reward.type === "brand"
        ? `${reward.label} 획득 · 집의 낙인 카드 더미에 추가`
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
      if (reward.type === "brand") card.classList.add("is-brand");
      card.setAttribute("aria-label", `${reward.label} 선택`);
      card.setAttribute("aria-pressed", "false");
      image.src = reward.image;
      image.alt = reward.label;
      badge.className = "treasure-reward-badge";
      badge.textContent = reward.type === "unit" ? `마물 · ${reward.label}`
        : reward.type === "brand" ? "낙인 카드" : `주사위 · ${reward.label}`;
      card.append(image);
      if (reward.type === "brand") {
        const description = document.createElement("span");
        description.className = "treasure-brand-description";
        description.textContent = reward.label.replaceAll(" · ", " ");
        card.append(description);
      }
      card.append(badge);
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
    if (tile?.id === "forest") return openForestTileEvent(tile, step);
    const scene = tileEventScenes[tile?.id];
    if (!scene || enteringBattle) return false;
    eventOpen = true;
    activeEventTileId = tile.id;
    activeEventRatio = tileEventRatios[tile.id] || WORLD_TREE_EVENT_RATIO;
    fitTileEventScene();
    el.board.classList.add("is-tile-event-open");
    el.diceButton.disabled = true;
    el.regenerate.disabled = true;
    const treasure = scene.animation === "treasure";
    el.eventImage.hidden = treasure;
    el.eventTreasure.hidden = !treasure;
    el.eventEnter.hidden = tile.id !== "home";
    el.eventInheritance.hidden = true;
    el.eventPatrolRoute.hidden = true;
    el.patrolRoutePanel.hidden = true;
    el.eventHeal.hidden = tile.id !== "rest" || !hasInjuredOwnedUnits();
    el.eventPray.hidden = tile.id !== "unknown" || worldTreePrayed;
    el.eventRitual.hidden = tile.id !== "altar";
    el.eventProphecy.hidden = tile.id !== "fortune-teller-camp";
    el.eventMonsterShop.hidden = tile.id !== "village";
    el.eventGraveyard.hidden = tile.id !== "graveyard" || !hasGraveyardCorpses();
    el.eventHillScout.hidden = tile.id !== "forest";
    el.eventHillScout.textContent = hillScout.scouted ? "정찰 정보" : "정찰";
    el.monsterShopPanel.hidden = true;
    el.graveyardExtractPanel.hidden = true;
    el.hillScoutPanel.hidden = true;
    el.fortuneProphecyUi.hidden = true;
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
      const mimicEncounter = Math.random() < 0.10;
      void playTreasureChestAnimation().then(async () => {
        if (!eventOpen || activeEventTileId !== "gem") return;
        if (mimicEncounter) {
          el.eventTreasure.classList.add("is-burst");
          el.diceResult.textContent = "보물상자가 꿈틀거린다… 미믹!";
          await wait(360);
          enterMimicBattle(step);
          return;
        }
        showTreasureRewards();
      });
    } else {
      el.eventImage.src = scene.image;
      el.eventImage.alt = `${scene.title} 풍경`;
    }
    el.eventOverlay.hidden = false;
    if (!treasure) el.eventClose.focus();
    return true;
  }

  async function healAtRestTile() {
    if (!eventOpen || activeEventTileId !== "rest" || !hasInjuredOwnedUnits()) {
      el.eventHeal.hidden = true;
      return;
    }
    el.eventHeal.hidden = true;
    el.eventClose.disabled = true;
    el.diceResult.textContent = "숙영 · 모든 마물 체력 완전 회복";
    await healOwnedRosterFullWithImpact();
    el.eventClose.disabled = false;
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
    el.eventRitual.hidden = true;
    el.eventProphecy.hidden = true;
    el.eventMonsterShop.hidden = true;
    el.eventGraveyard.hidden = true;
    el.eventHillScout.hidden = true;
    el.monsterShopPanel.hidden = true;
    el.graveyardExtractPanel.hidden = true;
    el.hillScoutPanel.hidden = true;
    el.fortuneProphecyUi.hidden = true;
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

  function renderGraveyardCorpseList() {
    const corpses = loadGraveyardCorpses();
    el.graveyardCorpseList.replaceChildren();
    if (!corpses.length) {
      const empty = document.createElement("div");
      empty.className = "graveyard-extract-placeholder";
      empty.textContent = "전투에서 죽은 마물의 시체가 없습니다.";
      el.graveyardCorpseList.append(empty);
      return;
    }
    for (const corpse of corpses) {
      const button = document.createElement("button");
      const image = document.createElement("img");
      const name = document.createElement("strong");
      const grade = document.createElement("small");
      button.type = "button";
      button.className = "graveyard-corpse";
      button.classList.toggle("is-selected", corpse.instanceId === graveyardSelectedCorpseId);
      button.disabled = graveyardExtracting;
      image.src = `art/v2-style/ui/unit-card-${corpse.slug}.png?v=19`;
      image.alt = "";
      name.textContent = corpse.name || globalThis.V2DesignData?.units?.[corpse.slug]?.name || corpse.slug;
      grade.textContent = GRADE_LABELS[corpse.grade] || corpse.grade || "마물";
      button.append(image, name, grade);
      button.addEventListener("click", () => {
        if (graveyardExtracting) return;
        graveyardSelectedCorpseId = corpse.instanceId;
        el.graveyardExtractStatus.textContent = `${name.textContent}의 시체를 파헤쳤습니다. 추출할 낙인을 선택하세요.`;
        renderGraveyardCorpseList();
        renderGraveyardBrandChoices();
      });
      el.graveyardCorpseList.append(button);
    }
  }

  function renderGraveyardBrandChoices() {
    el.graveyardBrandList.replaceChildren();
    const corpse = loadGraveyardCorpses().find((entry) => entry.instanceId === graveyardSelectedCorpseId);
    if (!corpse) {
      const empty = document.createElement("div");
      empty.className = "graveyard-extract-placeholder";
      empty.textContent = "시체를 선택하세요.";
      el.graveyardBrandList.append(empty);
      return;
    }
    const brands = corpse.brands.filter((brand) => V2Rules.validateBrand(brand));
    if (!brands.length) {
      const empty = document.createElement("div");
      empty.className = "graveyard-extract-placeholder";
      empty.textContent = "이 시체에는 추출할 수 있는 낙인이 없습니다.";
      el.graveyardBrandList.append(empty);
      return;
    }
    brands.forEach((brand, index) => {
      const card = {
        id: `grave-extract-${corpse.instanceId}-${index}`,
        brand: JSON.parse(JSON.stringify(brand))
      };
      const button = document.createElement("button");
      const image = document.createElement("img");
      const title = document.createElement("strong");
      const detail = document.createElement("small");
      const label = V2BrandCards.label(card);
      button.type = "button";
      button.className = "graveyard-brand-choice";
      button.disabled = graveyardExtracting;
      image.src = V2BrandCards.imagePath();
      image.alt = label;
      title.textContent = label.split(" · ")[0];
      detail.textContent = label.split(" · ").slice(1).join(" · ");
      button.append(image, title, detail);
      button.addEventListener("click", () => extractGraveyardBrand(corpse, brand));
      el.graveyardBrandList.append(button);
    });
  }

  async function extractGraveyardBrand(corpse, brand) {
    if (graveyardExtracting || !corpse || !V2Rules.validateBrand(brand)) return;
    const currentCorpses = loadGraveyardCorpses();
    if (!currentCorpses.some((entry) => entry.instanceId === corpse.instanceId && entry.diedInBattle === true)) return;

    graveyardExtracting = true;
    renderGraveyardCorpseList();
    renderGraveyardBrandChoices();
    el.graveyardExtractStatus.textContent = "낙인 추출 중…";

    const nextCorpses = currentCorpses.filter((entry) => entry.instanceId !== corpse.instanceId);
    const nextBrands = V2BrandCards.load();
    const id = globalThis.crypto?.randomUUID
      ? `brand-card-${globalThis.crypto.randomUUID()}`
      : `brand-card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    const extracted = { id, brand: JSON.parse(JSON.stringify(brand)) };
    nextBrands.push(extracted);

    let saved = true;
    if (globalThis.V2RunStateRuntime?.available && typeof V2RunStateRuntime.atomicGraveyardExtraction === "function") {
      const result = await V2RunStateRuntime.atomicGraveyardExtraction(nextCorpses, nextBrands, "graveyard-brand-extract");
      saved = Boolean(result?.ok);
    } else {
      try {
        sessionStorage.setItem(GRAVEYARD_CORPSES_KEY, JSON.stringify(nextCorpses));
        saved = V2BrandCards.save(nextBrands);
      } catch (_) {
        saved = false;
      }
    }

    if (!saved) {
      graveyardExtracting = false;
      el.graveyardExtractStatus.textContent = "낙인 추출 저장에 실패했습니다. 다시 시도하세요.";
      renderGraveyardCorpseList();
      renderGraveyardBrandChoices();
      return;
    }

    const corpseName = corpse.name || globalThis.V2DesignData?.units?.[corpse.slug]?.name || corpse.slug;
    const brandName = V2BrandCards.label(extracted).split(" · ")[0];
    graveyardSelectedCorpseId = null;
    graveyardExtracting = false;
    el.graveyardExtractStatus.textContent = `${corpseName}의 시체에서 ${brandName} 낙인을 추출했습니다.`;
    renderGraveyardCorpseList();
    renderGraveyardBrandChoices();
    el.eventGraveyard.hidden = !hasGraveyardCorpses();
  }

  function resetGraveyardExtraction() {
    graveyardSelectedCorpseId = null;
    graveyardExtracting = false;
    if (el.graveyardExtractStatus) el.graveyardExtractStatus.textContent = "";
    renderGraveyardCorpseList();
    renderGraveyardBrandChoices();
  }

  function openGraveyardExtraction() {
    if (!eventOpen || activeEventTileId !== "graveyard" || !hasGraveyardCorpses()) return;
    el.graveyardExtractPanel.hidden = false;
    el.eventGraveyard.hidden = true;
    resetGraveyardExtraction();
    el.diceResult.textContent = "공동묘지 · 낙인 추출";
    el.graveyardExtractClose.focus();
  }

  function closeGraveyardExtraction() {
    if (!eventOpen || activeEventTileId !== "graveyard" || graveyardExtracting) return;
    graveyardSelectedCorpseId = null;
    el.graveyardExtractPanel.hidden = true;
    el.eventGraveyard.hidden = !hasGraveyardCorpses();
    if (!el.eventGraveyard.hidden) el.eventGraveyard.focus();
  }

  function monsterShopGrade(unit) {
    return unit?.grade || globalThis.V2DesignData?.units?.[unit?.slug]?.grade || "normal";
  }

  function monsterShopOfferCount(grade) {
    return grade === "hero" ? 5 : grade === "advanced" ? 4 : 3;
  }

  function monsterShopDicePool(grade) {
    return V2DiceControl.cards.filter((card) => {
      if (grade === "hero") return true;
      if (grade === "advanced") return card.id !== "echo";
      return !["repeat", "echo"].includes(card.id);
    });
  }

  function createMonsterShopBrand() {
    return V2BrandCards.create();
  }

  function createMonsterShopOffers(unit) {
    const grade = monsterShopGrade(unit);
    const count = monsterShopOfferCount(grade);
    const dicePool = monsterShopDicePool(grade).slice();
    const offers = [];
    const usedDice = new Set();
    for (let index = 0; index < count; index += 1) {
      const wantBrand = index % 2 === (grade === "hero" ? 0 : 1);
      if (wantBrand || !dicePool.length) {
        offers.push({ id: `offer-${index}-brand`, kind: "brand", card: createMonsterShopBrand(grade) });
        continue;
      }
      const available = dicePool.filter((card) => !usedDice.has(card.id));
      const source = available.length ? available : dicePool;
      const card = source[Math.floor(Math.random() * source.length)];
      usedDice.add(card.id);
      offers.push({ id: `offer-${index}-dice-${card.id}`, kind: "dice", card });
    }
    if (!offers.some((offer) => offer.kind === "brand")) {
      offers[offers.length - 1] = { id: `offer-${offers.length - 1}-brand`, kind: "brand", card: createMonsterShopBrand(grade) };
    }
    return offers;
  }

  function renderMonsterShopTradeSlot() {
    el.monsterShopTradeSlot.replaceChildren();
    const unit = monsterShopSelectedId ? ownedUnits.get(monsterShopSelectedId) : null;
    if (!unit) {
      const hint = document.createElement("span");
      hint.textContent = "왼쪽 책에서 마물을 고르세요";
      el.monsterShopTradeSlot.append(hint);
      el.monsterShopCancelTrade.hidden = true;
      return;
    }
    const image = document.createElement("img");
    const name = document.createElement("strong");
    const grade = document.createElement("small");
    image.src = `art/v2-style/ui/unit-card-${unit.slug}.png?v=19`;
    image.alt = unit.name || globalThis.V2DesignData?.units?.[unit.slug]?.name || unit.slug;
    name.textContent = image.alt;
    grade.textContent = GRADE_LABELS[monsterShopGrade(unit)] || monsterShopGrade(unit);
    el.monsterShopTradeSlot.append(image, name, grade);
    el.monsterShopCancelTrade.hidden = false;
  }

  function renderMonsterShopOffers() {
    el.monsterShopOffers.replaceChildren();
    if (!monsterShopSelectedId || !monsterShopOffers.length) {
      const empty = document.createElement("div");
      empty.className = "monster-shop-placeholder";
      empty.textContent = "마물을 올리면 교환품이 나타납니다.";
      el.monsterShopOffers.append(empty);
      return;
    }
    for (const offer of monsterShopOffers) {
      const button = document.createElement("button");
      const image = document.createElement("img");
      const title = document.createElement("strong");
      const detail = document.createElement("small");
      button.type = "button";
      button.className = "monster-shop-offer";
      button.disabled = monsterShopTrading || (offer.kind === "dice" && diceControlHand.length >= DICE_CONTROL_CAPACITY);
      if (offer.kind === "dice") {
        image.src = V2DiceControl.imagePath(offer.card, "ko");
        image.alt = offer.card.label;
        title.textContent = offer.card.label;
        detail.textContent = diceControlHand.length >= DICE_CONTROL_CAPACITY ? "주사위 카드 보관함 가득" : offer.card.description;
      } else {
        image.src = V2BrandCards.imagePath();
        image.alt = V2BrandCards.label(offer.card);
        title.textContent = V2BrandCards.label(offer.card).split(" · ")[0];
        detail.textContent = V2BrandCards.label(offer.card).split(" · ").slice(1).join(" · ");
      }
      const selected = monsterShopChosenOfferId === offer.id;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
      button.append(image, title, detail);
      button.addEventListener("click", () => {
        if (monsterShopTrading || button.disabled) return;
        if (monsterShopChosenOfferId === offer.id) {
          confirmMonsterShopTrade(offer);
          return;
        }
        monsterShopChosenOfferId = offer.id;
        el.monsterShopStatus.textContent = "선택한 상품을 한 번 더 누르면 거래가 확정됩니다.";
        renderMonsterShopOffers();
      });
      el.monsterShopOffers.append(button);
    }
  }

  function resetMonsterShopTrade() {
    monsterShopSelectedId = null;
    monsterShopOffers = [];
    monsterShopChosenOfferId = null;
    monsterShopTrading = false;
    if (el.monsterShopStatus) el.monsterShopStatus.textContent = "왼쪽 책을 열어 교환할 마물을 고르세요.";
    renderMonsterShopTradeSlot();
    renderMonsterShopOffers();
  }

  async function confirmMonsterShopTrade(offer) {
    const unit = monsterShopSelectedId ? ownedUnits.get(monsterShopSelectedId) : null;
    if (!unit || monsterShopTrading || ownedUnits.size <= 1 || !offer) return;
    if (offer.kind === "dice" && diceControlHand.length >= DICE_CONTROL_CAPACITY) {
      el.monsterShopStatus.textContent = "주사위 컨트롤 카드 보관함이 가득 찼습니다.";
      return;
    }

    monsterShopTrading = true;
    renderMonsterShopOffers();
    el.monsterShopStatus.textContent = "거래 중…";

    const nextRoster = [...ownedUnits.values()]
      .filter((entry) => entry.instanceId !== unit.instanceId)
      .map((entry) => JSON.parse(JSON.stringify(entry)));
    const nextDiceIds = diceControlHand.map((card) => card.id);
    const nextBrands = V2BrandCards.load();
    if (offer.kind === "dice") nextDiceIds.push(offer.card.id);
    else nextBrands.push(JSON.parse(JSON.stringify(offer.card)));

    let saved = true;
    if (globalThis.V2RunStateRuntime?.available && typeof V2RunStateRuntime.atomicMonsterShopTrade === "function") {
      const result = await V2RunStateRuntime.atomicMonsterShopTrade(nextRoster, nextDiceIds, nextBrands, "monster-shop-trade");
      saved = Boolean(result?.ok);
    } else {
      try {
        sessionStorage.setItem(OWNED_ROSTER_KEY, JSON.stringify(nextRoster));
        sessionStorage.setItem(DICE_CONTROL_INVENTORY_KEY, JSON.stringify(nextDiceIds));
        saved = V2BrandCards.save(nextBrands);
      } catch (_) {
        saved = false;
      }
    }

    if (!saved) {
      monsterShopTrading = false;
      el.monsterShopStatus.textContent = "거래 저장에 실패했습니다. 다시 시도하세요.";
      renderMonsterShopOffers();
      return;
    }

    ownedUnits.delete(unit.instanceId);
    selectedDeck = selectedDeck.filter((instanceId) => instanceId !== unit.instanceId);
    if (offer.kind === "dice") {
      const acquired = V2DiceControl.cards.find((card) => card.id === offer.card.id);
      if (acquired) diceControlHand.push(acquired);
    }
    renderBookRoster();
    renderDiceControlHand();
    renderInventoryCounts();
    if (!el.deckOverlay.hidden) renderDeckSelection();

    const rewardName = offer.kind === "dice" ? offer.card.label : V2BrandCards.label(offer.card).split(" · ")[0];
    el.monsterShopStatus.textContent = `${unit.name || unit.slug} ↔ ${rewardName} 거래 완료`;
    monsterShopSelectedId = null;
    monsterShopOffers = [];
    monsterShopChosenOfferId = null;
    monsterShopTrading = false;
    renderMonsterShopTradeSlot();
    renderMonsterShopOffers();
  }

  function openMonsterShop() {
    if (!eventOpen || activeEventTileId !== "village") return;
    forceCloseBookRoster();
    el.monsterShopPanel.hidden = false;
    el.eventMonsterShop.hidden = true;
    if (el.eventClose) el.eventClose.hidden = true;
    el.board?.classList.add("is-monster-shop-open");
    resetMonsterShopTrade();
    el.diceResult.textContent = "마을 · 마물 상점";
    el.monsterShopClose.focus();
  }

  function closeMonsterShop() {
    if (!eventOpen || activeEventTileId !== "village" || monsterShopTrading) return;
    forceCloseBookRoster();
    resetMonsterShopTrade();
    el.monsterShopPanel.hidden = true;
    el.eventMonsterShop.hidden = false;
    if (el.eventClose) el.eventClose.hidden = false;
    el.board?.classList.remove("is-monster-shop-open");
    el.eventMonsterShop.focus();
  }

  async function showFortuneProphecy() {
    if (!eventOpen || activeEventTileId !== "fortune-teller-camp" || worldTreePrayerRolling) return;
    worldTreePrayerRolling = true;
    el.eventProphecy.hidden = true;
    el.fortuneProphecyUi.hidden = false;
    el.eventPrayerResult.hidden = true;
    el.eventPrayerResult.textContent = "";
    el.eventClose.disabled = true;
    el.board.classList.add("is-fortune-prophesying");
    resetMapDicePosition();
    el.diceButton.classList.add("is-rolling");

    const result = Math.floor(Math.random() * 6) + 1;
    await animateMapDiceRoll(result);

    let label = "";
    let detail = "";
    if (result === 1) {
      label = "저주";
      detail = "다음 전투 적 전체 공격력 +1";
      addPendingProphecy(result);
    } else if (result === 2) {
      label = "축복";
      detail = "아군 전체 완전 회복";
      await healOwnedRosterFullWithImpact();
      // 즉시 회복은 기존 누적 예언을 지우지 않는다.
    } else if (result === 3) {
      label = "축복";
      detail = "다음 전투 아군 전체 속도 +1";
      addPendingProphecy(result);
    } else if (result === 4) {
      label = "축복";
      detail = "다음 전투 아군 전체 체력 +2";
      addPendingProphecy(result);
    } else if (result === 5) {
      label = "축복";
      detail = "다음 전투 아군 전체 공격력 +1";
      addPendingProphecy(result);
    } else {
      label = "대축복";
      detail = "다음 전투 아군 전체 공격력 +1 · 체력 +2";
      addPendingProphecy(result);
    }

    const stackText = result === 2 ? prophecyStackLabel() : prophecyStackLabel(pendingProphecy());
    el.eventPrayerResult.textContent = `${label} · ${detail} · 누적: ${stackText}`;
    el.eventPrayerResult.dataset.result = result === 1 ? "failure" : result === 6 ? "great-blessing" : "blessing";
    el.eventPrayerResult.hidden = false;
    el.diceResult.textContent = `점술가 예언 · 주사위 ${result} · ${label} · ${detail} · 누적 ${stackText}`;
    el.diceButton.classList.remove("is-rolling");
    el.board.classList.remove("is-fortune-prophesying");
    worldTreePrayerRolling = false;
    el.eventClose.disabled = false;
    el.eventClose.focus();
  }

  async function enterHome() {
    if (!eventOpen || activeEventTileId !== "home") return;

    el.eventEnter.disabled = true;
    el.eventImage.src = `${ROOT}events/home-interior.jpg?v=${EVENT_ASSET_VERSION}`;
    el.eventImage.alt = "우리집 실내 풍경";
    el.eventEnter.hidden = true;

    const needsHealing = hasInjuredOwnedUnits();
    if (needsHealing) {
      el.diceResult.textContent = "귀환 · 모든 마물 체력 완전 회복";
      await healOwnedRosterFullWithImpact();
    }

    if (!eventOpen || activeEventTileId !== "home") return;
    el.eventInheritance.hidden = false;
    el.eventPatrolRoute.hidden = false;
    el.eventEnter.disabled = false;
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
    if (globalThis.V2RunStateRuntime?.available) {
      await V2RunStateRuntime.setMapProgress({
        heroIndex,
        lapReadyForRefresh,
        worldTreePrayed,
        previousRoll: previousDiceRoll,
        previousEffectiveCardId: previousDiceControlId,
        pendingCardInstanceId: null,
        prefix: "map-warp"
      });
    }
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
    // Phase 1: staggered cloud banks sweep inward. Swap the board only after
    // the central mist has fully hidden the old route.
    await wait(1320);
    generateTiles();
    // Phase 2: hold the fully covered frame briefly so the new route never
    // flashes through while DOM/image layout settles.
    await wait(220);
    // Phase 3: clouds keep their momentum and pass through the center instead
    // of simply reversing, making the reveal feel like one continuous gust.
    el.cloudTransition.classList.add("is-opening");
    await wait(1120);
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
      addContamination(4);
      await advanceMapLoop();
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
    el.eventPatrolRoute.hidden = true;
    el.patrolRoutePanel.hidden = true;
    el.board.classList.remove("is-patrol-route-open");
    el.eventHeal.hidden = true;
    el.eventPray.hidden = true;
    el.eventRitual.hidden = true;
    el.eventProphecy.hidden = true;
    el.eventMonsterShop.hidden = true;
    el.eventGraveyard.hidden = true;
    el.eventHillScout.hidden = true;
    el.monsterShopPanel.hidden = true;
    el.graveyardExtractPanel.hidden = true;
    el.hillScoutPanel.hidden = true;
    el.fortuneProphecyUi.hidden = true;
    el.eventPrayerResult.hidden = true;
    el.eventPrayerResult.textContent = "";
    el.eventContaminationChange.hidden = true;
    el.eventContaminationChange.className = "tile-event-contamination-change";
    el.eventContaminationChange.textContent = "";
    el.eventClose.disabled = false;
    worldTreePrayerRolling = false;
    el.board.classList.remove("is-world-tree-praying", "is-fortune-prophesying");
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
      hillScout = loadHillScoutState();
    } else {
      resetClearedMonsterSteps();
      resetWorldTreePrayer();
      hillScout = { scouted: false, intel: [] };
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
      image.alt = "";
      const tileImageSrc = getTileImage(tile, tileStep);
      const tileFallbackSrc = `${ROOT}tiles/basic.png?v=${TILE_ASSET_VERSION}`;
      if (globalThis.V2Assets?.setImage) {
        V2Assets.setImage(image, tileImageSrc, {
          fallback: tileFallbackSrc,
          retries: 2,
          timeout: 9000,
          hideOnFail: false
        });
      } else {
        image.src = tileImageSrc;
      }
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
        if (tile.id === "graveyard") {
          heroIndex = index;
          placeHero(true);
          const launchedStory = await launchGraveyardChildEventFromMap(index + 1);
          if (launchedStory) return;
        }
        if (openTileEvent(tile, index + 1)) return;
        enterMonsterBattle(tile, index + 1);
      });
      return button;
    });
    renderHillScoutBadges();
    el.ring.replaceChildren(...currentButtons);
    saveMapLayout(pool, restoredPool ? "map-layout-restore" : "map-layout-generate");
    const startingIndex = resumeHeroIndex === null ? HOME_INDEX : resumeHeroIndex;
    resumeHeroIndex = null;
    heroIndex = startingIndex;
    placeHero();
    selectTile(currentButtons[heroIndex], currentTiles[heroIndex], heroIndex + 1);
    if (globalThis.V2RunStateRuntime?.available) {
      V2RunStateRuntime.setMapProgress({
        heroIndex,
        lapReadyForRefresh,
        worldTreePrayed,
        previousRoll: previousDiceRoll,
        previousEffectiveCardId: previousDiceControlId,
        pendingCardInstanceId: null,
        prefix: restoredPool ? "map-resume" : "map-start"
      });
    }
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
    if (globalThis.V2RunStateRuntime?.available) {
      await V2RunStateRuntime.setMapProgress({
        heroIndex,
        lapReadyForRefresh,
        worldTreePrayed,
        previousRoll: previousDiceRoll,
        previousEffectiveCardId: previousDiceControlId,
        pendingCardInstanceId: null,
        prefix: "map-move"
      });
    }
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
    if (currentTiles[heroIndex]?.id === "swamp") {
      await applyPollutedSwamp(heroIndex + 1);
      await wait(420);
      rolling = false;
      el.diceButton.disabled = false;
      el.regenerate.disabled = false;
      return;
    }
    if (currentTiles[heroIndex]?.id === "graveyard") {
      const launchedStory = await launchGraveyardChildEventFromMap(heroIndex + 1);
      if (launchedStory) {
        rolling = false;
        return;
      }
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

  if (el.contaminationTestToggle && el.contaminationTest) {
    el.contaminationTestToggle.addEventListener("click", () => {
      const willOpen = el.contaminationTest.hidden;
      el.contaminationTest.hidden = !willOpen;
      el.contaminationTestToggle.classList.toggle("is-open", willOpen);
      el.contaminationTestToggle.setAttribute("aria-expanded", String(willOpen));
      if (!willOpen) renderContamination();
    });
  }
  if (el.contaminationTestSlider) {
    el.contaminationTestSlider.addEventListener("input", () => {
      renderContaminationVisual(el.contaminationTestSlider.value, true);
    });
  }
  document.querySelectorAll("[data-contamination-preview]").forEach((button) => {
    button.addEventListener("click", () => {
      const requested = button.dataset.contaminationPreview;
      if (requested === "actual") {
        renderContamination();
        return;
      }
      const previewValue = Number(requested);
      if (el.contaminationTestSlider) el.contaminationTestSlider.value = String(previewValue);
      renderContaminationVisual(previewValue, true);
    });
  });

  el.diceButton.addEventListener("click", rollAndMove);
  el.eventClose.addEventListener("click", handleTileEventExit);
  el.eventEnter.addEventListener("click", enterHome);
  el.eventPatrolRoute.addEventListener("click", openPatrolRoute);
  el.patrolRouteClose.addEventListener("click", closePatrolRoute);
  el.patrolRouteReset.addEventListener("click", resetPatrolRouteDraft);
  el.patrolRouteConfirm.addEventListener("click", confirmPatrolRoute);
  el.eventHeal.addEventListener("click", healAtRestTile);
  el.eventPray.addEventListener("click", prayAtWorldTree);
  el.eventProphecy.addEventListener("click", showFortuneProphecy);
  el.eventMonsterShop.addEventListener("click", openMonsterShop);
  el.monsterShopClose.addEventListener("click", closeMonsterShop);
  el.eventGraveyard.addEventListener("click", openGraveyardExtraction);
  el.graveyardExtractClose.addEventListener("click", closeGraveyardExtraction);
  el.eventHillScout.addEventListener("click", openHillScout);
  el.hillScoutClose.addEventListener("click", closeHillScout);
  el.monsterShopCancelTrade.addEventListener("click", resetMonsterShopTrade);
  el.eventInheritance.addEventListener("click", async () => {
    if (eventOpen && activeEventTileId === "home") {
      if (globalThis.V2RunStateRuntime?.available) await V2RunStateRuntime.flush();
      await V2HomeInheritance.open();
    }
  });
  window.addEventListener("v2-roster-changed", (event) => {
    if (event.detail.donorInstanceId) ownedUnits.delete(event.detail.donorInstanceId);
    ownedUnits.set(event.detail.recipient.instanceId, event.detail.recipient);
    selectedDeck = selectedDeck.filter((instanceId) => ownedUnits.has(instanceId));
    renderBookRoster();
    if (!el.deckOverlay.hidden) renderDeckSelection();
    renderInventoryCounts();
    refreshOpenBookUnitInfo();
  });
  el.optionsButton?.addEventListener("click", toggleAudioOptions);
  el.audioOptionsClose?.addEventListener("click", closeAudioOptions);
  el.bgmToggle?.addEventListener("click", () => {
    if (typeof V2Music === "undefined") return;
    V2Music.setEnabled(!V2Music.isEnabled());
    renderAudioOptions();
  });
  el.sfxToggle?.addEventListener("click", () => {
    if (typeof V2Sfx === "undefined") return;
    V2Sfx.setEnabled(!V2Sfx.isEnabled());
    renderAudioOptions();
  });
  el.forestDioramaTestButton?.addEventListener("click", () => openForestDioramaTest({ fromTile: false }));
  el.villageDioramaTestButton?.addEventListener("click", openVillageDioramaTest);
  el.graveyardDioramaTestButton?.addEventListener("click", openGraveyardDioramaTest);
  el.graveyardLayerDebug?.addEventListener("click",(event)=>{
    if(event.target.closest("[data-graveyard-editor-collapse]")){setGraveyardEditorCollapsed(true);return;}
    if(event.target.closest("[data-graveyard-flip]")){flipSelectedGraveyardItem();return;}
    if(event.target.closest("[data-graveyard-layout-save]")){saveGraveyardLayout();return;}
    if(event.target.closest("[data-graveyard-layout-copy]")){copyGraveyardLayoutExport();return;}
    if(event.target.closest("[data-graveyard-layout-reset]")){resetGraveyardLayout();return;}
    const size=event.target.closest("[data-graveyard-size]"); if(size){resizeSelectedGraveyardItem(Number(size.dataset.graveyardSize||0));return;}
    const layer=event.target.closest("[data-graveyard-layer]"); if(layer){changeSelectedGraveyardLayer(Number(layer.dataset.graveyardLayer||0));return;}
    const toggle=event.target.closest("[data-graveyard-toggle]"); if(toggle){const selector=toggle.dataset.graveyardToggle;const item=document.querySelector(selector);const visible=toggle.getAttribute("aria-pressed")!=="true";item?.classList.toggle("is-debug-hidden",!visible);toggle.setAttribute("aria-pressed",String(visible));if(visible&&item)selectGraveyardItem(item);return;}
    if(event.target.closest("[data-graveyard-reset-visibility]")){getGraveyardItems().forEach((i)=>i.classList.remove("is-debug-hidden"));el.graveyardLayerDebug.querySelectorAll("[data-graveyard-toggle]").forEach((b)=>b.setAttribute("aria-pressed","true"));return;}
  });
  el.graveyardEditorReopen?.addEventListener("click",()=>setGraveyardEditorCollapsed(false));
  el.graveyardDioramaClose?.addEventListener("click", closeGraveyardDioramaTest);
  el.graveyardDioramaTest?.addEventListener("click", (event) => {
    if (event.target === el.graveyardDioramaTest) closeGraveyardDioramaTest();
  });
  el.villageLayerDebug?.addEventListener("click", (event) => {
    if (event.target.closest("[data-village-flip]")) {
      flipSelectedVillageItem();
      return;
    }
    const itemToggle = event.target.closest("[data-village-item-toggle]");
    if (itemToggle) {
      const selector = itemToggle.dataset.villageItemToggle;
      const visible = itemToggle.getAttribute("aria-pressed") !== "true";
      setVillageBuildingDebugVisibility(selector, visible);
      if (visible) selectVillageBuilding(document.querySelector(selector));
      return;
    }
    if (event.target.closest("[data-village-layout-save]")) {
      saveVillageLayout();
      return;
    }
    if (event.target.closest("[data-village-layout-copy]")) {
      copyVillageLayoutExport();
      return;
    }
    if (event.target.closest("[data-village-layout-reset]")) {
      resetVillageLayout();
      return;
    }
    const layerButton = event.target.closest("[data-village-layer]");
    if (layerButton) {
      changeSelectedVillageBuildingLayer(Number(layerButton.dataset.villageLayer || 0));
      return;
    }
    const sizeButton = event.target.closest("[data-village-size]");
    if (sizeButton) {
      resizeSelectedVillageBuilding(Number(sizeButton.dataset.villageSize || 0));
      return;
    }
    const toggle = event.target.closest("[data-village-building-toggle]");
    if (toggle) {
      const selector = toggle.dataset.villageBuildingToggle;
      const visible = toggle.getAttribute("aria-pressed") !== "true";
      setVillageBuildingDebugVisibility(selector, visible);
      return;
    }
    if (event.target.closest("[data-village-building-reset]")) resetVillageBuildingDebug();
  });
  el.villageDioramaClose?.addEventListener("click", closeVillageDioramaTest);
  el.villageDioramaTest?.addEventListener("click", (event) => {
    if (event.target === el.villageDioramaTest) closeVillageDioramaTest();
  });
  el.forestLayerDebug?.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-forest-tree-toggle]");
    if (toggle) {
      const selector = toggle.dataset.forestTreeToggle;
      const visible = toggle.getAttribute("aria-pressed") !== "true";
      setForestTreeDebugVisibility(selector, visible);
      return;
    }
    if (event.target.closest("[data-forest-tree-reset]")) resetForestTreeDebug();
  });
  el.forestDioramaClose?.addEventListener("click", closeForestDioramaTest);
  el.forestDioramaTest?.addEventListener("click", (event) => {
    if (event.target === el.forestDioramaTest || event.target?.classList?.contains("forest-diorama-vignette")) closeForestDioramaTest();
  });
  el.bookButton.addEventListener("click", toggleBookRoster);
  el.cardDeckButton.addEventListener("click", toggleDiceControlCard);
  el.diceControlBackdrop.addEventListener("click", closeDiceControlCard);
  el.infoClose.addEventListener("click", closeBookUnitInfo);
  el.infoBackdrop.addEventListener("click", closeBookUnitInfo);
  window.addEventListener("resize", () => { if (eventOpen) fitTileEventScene(); });
  window.addEventListener("pageshow", () => { syncInventoryStateFromStorage(); });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !rolling && !enteringBattle) syncInventoryStateFromStorage();
  });
  el.deckConfirm.addEventListener("click", confirmMonsterBattle);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && el.graveyardDioramaTest && !el.graveyardDioramaTest.hidden) { closeGraveyardDioramaTest(); return; }
    if (event.key === "Escape" && el.villageDioramaTest && !el.villageDioramaTest.hidden) { closeVillageDioramaTest(); return; }
    if (event.key === "Escape" && el.forestDioramaTest && !el.forestDioramaTest.hidden) { closeForestDioramaTest(); return; }
    if (event.key === "Escape" && !el.audioOptions.hidden) { closeAudioOptions(); return; }
    if (event.key === "Escape" && !el.rewardOverflowOverlay.hidden) return;
    if (event.key === "Escape" && !el.diceControlOverlay.hidden) closeDiceControlCard();
    else if (event.key === "Escape" && !el.infoOverlay.hidden) closeBookUnitInfo();
    else if (event.key === "Escape" && !el.bookRoster.hidden) toggleBookRoster();
    else if (event.key === "Escape" && eventOpen) closeTileEvent();
  });
  ensureVillageBuildingAssets();
  ensureVillageTreeAssets();
  ensureGraveyardAtlas();
  enableVillageBuildingDragging();
  enableGraveyardDragging();
  loadVillageLayout();
  loadGraveyardLayout();
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
  const GRAVEYARD_DIALOGUE_FRAME_CHUNKS = Array.from({ length: 8 }, (_, i) =>
    `assets/intro-data/frame-v2/part-${String(i).padStart(3, "0")}.txt`
  );
  let graveyardDialogueFrameReady = null;

  async function loadGraveyardDialogueFrame() {
    const img = el.graveyardStoryFrameImg;
    if (!img) return false;
    try {
      const parts = await Promise.all(GRAVEYARD_DIALOGUE_FRAME_CHUNKS.map(async (path) => {
        const response = await fetch(path, { cache: "force-cache" });
        if (!response.ok) throw new Error(`dialogue frame chunk failed: ${path}`);
        return (await response.text()).trim();
      }));
      img.src = `data:image/webp;base64,${parts.join("")}`;
      await img.decode();
      img.hidden = false;
      img.dataset.assetReady = "frame-visible";
      return true;
    } catch (error) {
      console.error("[graveyard-event] dialogue frame restore failed", error);
      img.hidden = false;
      img.src = "art/v2-style/ui/intro-dialogue-box.webp?v=6";
      return false;
    }
  }

  function ensureGraveyardDialogueFrame() {
    if (!graveyardDialogueFrameReady) graveyardDialogueFrameReady = loadGraveyardDialogueFrame();
    return graveyardDialogueFrameReady;
  }

  const GRAVEYARD_EVENT_BATTLE_RESULT_KEY = "necromancer-event-battle-result-v1";

  const GRAVEYARD_EVENT_BASE_CHUNKS = [
    "assets/event-lab/graveyard-child/base/part-000.txt",
    "assets/event-lab/graveyard-child/base/part-001.txt"
  ];
  const GRAVEYARD_EVENT_GHOUL_CHUNKS = [
    "assets/event-lab/graveyard-child/ghoul/part-000.txt",
    "assets/event-lab/graveyard-child/ghoul/part-001.txt"
  ];
  let graveyardStoryArtReady = null;

  async function loadChunkedEventImage(img, chunks, { removeBlack = false } = {}) {
    if (!img) return false;
    try {
      const parts = await Promise.all(chunks.map(async (src) => {
        const response = await fetch(src, { cache: "force-cache" });
        if (!response.ok) throw new Error("event art fetch failed: " + response.status);
        return (await response.text()).trim();
      }));
      img.src = "data:image/webp;base64," + parts.join("");
      await img.decode();
      if (removeBlack) {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(img, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
          const peak = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
          if (peak <= 10) pixels[i + 3] = 0;
          else if (peak < 30) pixels[i + 3] = Math.round(((peak - 10) / 20) * pixels[i + 3]);
        }
        context.putImageData(imageData, 0, 0);
        img.src = canvas.toDataURL("image/png");
        await img.decode();
      }
      return true;
    } catch (error) {
      console.error("[graveyard-event] event art load failed", error);
      return false;
    }
  }

  function ensureGraveyardStoryArt() {
    if (!graveyardStoryArtReady) {
      graveyardStoryArtReady = Promise.all([
        loadChunkedEventImage(el.graveyardStoryArtwork, GRAVEYARD_EVENT_BASE_CHUNKS),
        loadChunkedEventImage(el.graveyardStoryGhoulLayer, GRAVEYARD_EVENT_GHOUL_CHUNKS, { removeBlack: true })
      ]);
    }
    return graveyardStoryArtReady;
  }

  // Moving-diorama event data: each beat is only a change of stage state.
  const GRAVEYARD_EVENT_BEATS = Object.freeze([
    Object.freeze({
      id: "discovery",
      effect: "공동묘지 안쪽에서 길을 잃은 듯한 아이를 발견했다.",
      dialogue: "",
      stageClass: "beat-child-alone"
    }),
    Object.freeze({
      id: "threat",
      effect: "아이는 자꾸 뒤를 돌아본다. 묘비 사이에서 마른 돌 긁는 소리가 들린다.",
      dialogue: "",
      stageClass: "beat-ghoul-appears",
      ghoul: true
    }),
    Object.freeze({
      id: "dialogue",
      effect: "묘비 사이에서 구울이 몸을 일으킨다.",
      dialogue: "…도와주세요!",
      stageClass: "beat-child-frightened",
      ghoul: true
    }),
    Object.freeze({
      id: "choice",
      effect: "아이를 구하시겠습니까?",
      dialogue: "…도와주세요!",
      stageClass: "beat-choice",
      ghoul: true,
      choice: true
    })
  ]);
  let graveyardStoryBeatIndex = 0;

  function setGraveyardStoryChoicePhase(enabled) {
    if (!el.graveyardStoryEvent || !el.graveyardStoryChoices) return;
    el.graveyardStoryEvent.classList.toggle("is-choice-phase", enabled === true);
    el.graveyardStoryChoices.hidden = enabled !== true;
    if (el.graveyardStoryAdvance) el.graveyardStoryAdvance.disabled = enabled === true;
  }

  function renderGraveyardStoryBeat(index) {
    if (!el.graveyardStoryEvent) return;
    const beat = GRAVEYARD_EVENT_BEATS[Math.max(0, Math.min(index, GRAVEYARD_EVENT_BEATS.length - 1))];
    graveyardStoryBeatIndex = GRAVEYARD_EVENT_BEATS.indexOf(beat);
    el.graveyardStoryEvent.dataset.beat = beat.id;
    el.graveyardStoryEvent.classList.remove(
      "beat-child-alone",
      "beat-ghoul-appears",
      "beat-child-frightened",
      "beat-choice"
    );
    el.graveyardStoryEvent.classList.add(beat.stageClass);
    if (el.graveyardStoryEffectText) el.graveyardStoryEffectText.textContent = beat.effect || "";
    if (el.graveyardStoryText) el.graveyardStoryText.textContent = beat.dialogue || "";
    if (el.graveyardStoryGhoulLayer) el.graveyardStoryGhoulLayer.hidden = beat.ghoul !== true;
    el.graveyardStoryEvent.classList.toggle("has-dialogue", Boolean(beat.dialogue));
    setGraveyardStoryChoicePhase(beat.choice === true);
  }

  function closeGraveyardStoryEvent() {
    if (!el.graveyardStoryEvent) return;
    el.graveyardStoryEvent.hidden = true;
    el.graveyardStoryEvent.classList.remove("is-rescued", "is-child-fleeing", "has-dialogue", "is-choice-phase");
    el.board?.classList.remove("is-story-event-open");
    eventOpen = false;
    if (activeEventTileId === "graveyard") activeEventTileId = null;
    rolling = false;
    el.diceButton.disabled = false;
    el.regenerate.disabled = false;
    el.diceButton.focus();
  }

  function advanceGraveyardStoryBeat() {
    if (!el.graveyardStoryEvent) return;
    if (el.graveyardStoryEvent.classList.contains("is-rescued")) {
      closeGraveyardStoryEvent();
      return;
    }
    if (graveyardStoryBeatIndex >= GRAVEYARD_EVENT_BEATS.length - 1) {
      setGraveyardStoryChoicePhase(true);
      return;
    }
    renderGraveyardStoryBeat(graveyardStoryBeatIndex + 1);
  }

  async function openGraveyardStoryEvent({ rescued = false } = {}) {
    if (!el.graveyardStoryEvent) return;
    eventOpen = true;
    activeEventTileId = "graveyard";
    rolling = false;
    el.diceButton.disabled = true;
    el.regenerate.disabled = true;
    ensureGraveyardDialogueFrame();
    await ensureGraveyardStoryArt();
    el.board?.classList.add("is-story-event-open");
    el.graveyardStoryEvent.hidden = false;
    el.graveyardStoryEvent.classList.toggle("is-rescued", rescued === true);

    if (rescued) {
      el.graveyardStoryEvent.dataset.beat = "rescued";
      el.graveyardStoryEvent.classList.remove(
        "beat-child-alone",
        "beat-ghoul-appears",
        "beat-child-frightened",
        "beat-choice"
      );
      setGraveyardStoryChoicePhase(false);
      if (el.graveyardStoryEffectText) {
        el.graveyardStoryEffectText.textContent =
          "구울이 쓰러지자 아이는 당신을 바라본다. 그러나 안도하기보다 겁에 질린 표정으로 뒷걸음치더니, 묘비 사이로 달아나 버린다.";
      }
      if (el.graveyardStoryText) el.graveyardStoryText.textContent = "……!";
      el.graveyardStoryEvent.classList.add("has-dialogue", "is-child-fleeing");
      if (el.graveyardStoryGhoulLayer) el.graveyardStoryGhoulLayer.hidden = true;
      if (el.graveyardStoryAdvance) {
        el.graveyardStoryAdvance.disabled = false;
        el.graveyardStoryAdvance.onclick = closeGraveyardStoryEvent;
      }
      return;
    }

    graveyardStoryBeatIndex = 0;
    renderGraveyardStoryBeat(0);
    if (el.graveyardStoryAdvance) {
      el.graveyardStoryAdvance.disabled = false;
      el.graveyardStoryAdvance.onclick = advanceGraveyardStoryBeat;
    }
  }

  function installGraveyardStoryTapAdvance() {
    if (!el.graveyardStoryEvent || el.graveyardStoryEvent.dataset.tapAdvanceReady === "1") return;
    el.graveyardStoryEvent.dataset.tapAdvanceReady = "1";
    el.graveyardStoryEvent.addEventListener("click", (event) => {
      if (el.graveyardStoryEvent.hidden) return;
      if (el.graveyardStoryEvent.classList.contains("is-choice-phase")) return;
      if (event.target.closest(".graveyard-story-choices")) return;
      if (event.target.closest("#graveyardStoryAdvance")) return;
      advanceGraveyardStoryBeat();
    });
  }

  installGraveyardStoryTapAdvance();

  function startGraveyardEventBattle() {
    const partyUnits = currentPartyUnits();
    const context = {
      eventId: "graveyard_child_ambush_01",
      choiceId: "protect_child",
      enemies: ["ghoul"],
      encounterType: "event-graveyard-child",
      startedAt: Date.now()
    };
    try {
      sessionStorage.setItem("necromancer-event-battle-context-v1", JSON.stringify(context));
    } catch (_) {}
    const params = new URLSearchParams({
      from: "event",
      event: "graveyard_child_ambush_01",
      encounterType: "event-graveyard-child",
      enemies: "ghoul",
      eventReturn: "map-graveyard",
      map: activeMapId,
      tile: String(heroIndex + 1),
      allies: partyUnits.map((unit) => unit.slug).join(","),
      allyIds: partyUnits.map((unit) => unit.instanceId).join(",")
    });
    window.location.assign("v2-auto-battle-practice.html?" + params.toString());
  }

  function resumeGraveyardEventAfterBattle() {
    let result = null;
    try {
      const raw = sessionStorage.getItem(GRAVEYARD_EVENT_BATTLE_RESULT_KEY);
      if (raw) result = JSON.parse(raw);
      sessionStorage.removeItem(GRAVEYARD_EVENT_BATTLE_RESULT_KEY);
    } catch (_) {}
    if (!result || result.eventId !== "graveyard_child_ambush_01") return false;

    if (result.won === true) {
      void markGraveyardChildEventComplete();
      void openGraveyardStoryEvent({ rescued: true });
    }
    return true;
  }

  function installEventOptionShortcut() {
    const panel = el.audioOptions || document.getElementById("mapAudioOptions");
    if (!panel || panel.querySelector("[data-map-event-shortcut]")) return;
    const row = document.createElement("div");
    row.className = "map-audio-option-row map-event-option-row";
    row.dataset.mapEventShortcut = "true";
    const label = document.createElement("span");
    label.textContent = "사건";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-event-shortcut-button";
    button.textContent = "공동묘지";
    button.setAttribute("aria-label", "공동묘지 습격받는 아이 사건을 인게임 연출로 열기");
    button.addEventListener("click", () => {
      closeAudioOptions();
      void openGraveyardStoryEvent();
    });
    row.append(label, button);
    panel.append(row);
  }

  installEventOptionShortcut();

  el.graveyardStoryChoices?.querySelector('[data-graveyard-story-choice="protect"]')?.addEventListener("click", startGraveyardEventBattle);
  el.graveyardStoryChoices?.querySelector('[data-graveyard-story-choice="leave"]')?.addEventListener("click", async () => {
    await markGraveyardChildEventComplete();
    setGraveyardStoryChoicePhase(false);
    if (el.graveyardStoryEffectText) el.graveyardStoryEffectText.textContent = "당신은 아이를 외면하고 공동묘지를 지나친다.";
    if (el.graveyardStoryText) el.graveyardStoryText.textContent = "";
    el.graveyardStoryEvent?.classList.remove("has-dialogue");
    window.setTimeout(closeGraveyardStoryEvent, 900);
  });

  const mapLaunchParams = new URLSearchParams(location.search);
  if (mapLaunchParams.get("completeGraveyardChildEvent") === "1") {
    void markGraveyardChildEventComplete();
  }
  if (mapLaunchParams.get("resumeGraveyardEvent") === "1") {
    resumeGraveyardEventAfterBattle();
  }
  if (mapLaunchParams.get("storyEvent") === "graveyard_child_ambush_01") {
    window.setTimeout(() => {
      void openGraveyardStoryEvent();
    }, 0);
  }

})();
