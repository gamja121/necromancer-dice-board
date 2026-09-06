(function () {
  const BATTLEFIELDS = [
    "art/v2-style/battle-backgrounds/uploaded-raw/wasteland-chasm-battlefield.jpg",
    "art/v2-style/battle-backgrounds/uploaded-raw/haunted-forest-ruins-battlefield.jpg",
    "art/v2-style/battle-backgrounds/uploaded-raw/necropolis-pyramids-battlefield.jpg"
  ];
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
    "scorpion-knight": "scorpionKnight", "ancient-treant": "ancientTreant", "stone-golem": "stoneGolem",
    kraken: "kraken", "crystal-devourer": "crystalDevourer", "raging-treant": "ragingTreant",
    cerberus: "cerberus", "mushroom-soldier": "poisonMushroom", "goblin-rider": "goblinRider",
    "abyss-harpy": "abyssHarpy", "orc-warrior": "troll", "bone-golem": "boneGolem",
    "forest-fairy": "forestFairy", "mummy-guardian": "mummyGuardian", "soul-reaper": "soulReaper",
    "bone-hound": "boneHound", mimic: "mimic", "ice-princess": "icePrincess", siren: "siren"
  };
  const GRADE_LABELS = { normal: "일반", advanced: "희귀", hero: "영웅", special: "소환물" };
  const LEGION_LABELS = { skeleton: "언데드", corpse: "시체", beast: "야수", plague: "역병", ice: "얼음", summon: "소환", demon: "악마", insect: "곤충", plant: "식물", element: "원소" };
  // Viewports into the unmodified uploaded icon sheet: top row, then bottom row.
  const BRAND_ICON_VIEWS = Object.freeze({
    critical: [216, 48, 228, 228], vampire: [526, 48, 234, 228], guard: [841, 48, 228, 228],
    poison: [216, 310, 228, 228], summon: [526, 310, 234, 228], healing: [843, 310, 228, 228]
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
    ["hell-mantis", "hellMantis", 5, 4, 6], ["scorpion-knight", "scorpionKnight", 5, 3, 5],
    ["ancient-treant", "ancientTreant", 5, 4, 6], ["stone-golem", "stoneGolem", 5, 4, 5],
    ["kraken", "kraken", 5, 4, 6], ["crystal-devourer", "crystalDevourer", 5, 4, 7],
    ["raging-treant", "ragingTreant", 5, 4, 6], ["cerberus", "cerberus", 5, 4, 6, "cerberus", "케르베로스"],
    ["mushroom-soldier", "poisonMushroom", 5, 4, 6, "poison-mushroom", "버섯 병사"],
    ["goblin-rider", "goblinRider", 5, 4, 5], ["abyss-harpy", "abyssHarpy", 4, 4, 5],
    ["orc-warrior", "troll", 5, 4, 5, "troll"], ["bone-golem", "boneGolem", 5, 4, 5],
    ["forest-fairy", "forestFairy", 5, 4, 7], ["mummy-guardian", "mummyGuardian", 5, 4, 5],
    ["soul-reaper", "soulReaper", 6, 4, 6], ["bone-hound", "boneHound", 5, 4, 6],
    ["mimic", "mimic", 5, 4, 6], ["ice-princess", "icePrincess", 6, 4, 5], ["siren", "siren", 5, 4, 7]
  ]);
  const RUNTIME_PREPARERS = Object.freeze({
    "guardian-seed": () => V2SeedFrames.prepare(),
    "goblin-soldier": () => V2GoblinFrames.prepare(), "ice-princess": () => V2PrincessFrames.prepare(),
    "bone-golem": () => V2BloodFrames.prepare(), "abyss-harpy": () => V2HarpyFrames.prepare(),
    hydra: () => V2HydraFrames.prepare(), "bone-hound": () => V2HoundFrames.prepare(),
    "scorpion-knight": () => V2ScorpionFrames.prepare(), "hell-mantis": () => V2MantisFrames.prepare()
  });
  const DEFAULT_ALLY_BY_SLUG = new Map([...TEAM_DATA.ally, ...TEAM_DATA.enemy].map(entry => [entry.slug, entry]));
  const ROSTER = ROSTER_SPECS.map(([slug, type, attackFrames, hitFrames, deathFrames, portraitSlug = slug, name]) => {
    if (DEFAULT_ALLY_BY_SLUG.has(slug)) return { ...DEFAULT_ALLY_BY_SLUG.get(slug) };
    const definition = UNIT_TYPES[type];
    const gradePower = definition.grade === "hero" ? 3 : definition.grade === "advanced" ? 3 : definition.grade === "special" ? 1 : 2;
    const speed = Math.max(1, 6 - Math.min(5, definition.hp));
    const result = unit(slug, name || definition.label, definition.hp * 2 + 4, gradePower, speed, attackFrames, hitFrames, deathFrames, portraitSlug);
    if (slug === "flesh-golem") result.frameNumbers = { death: [1, 2, 3, 5, 6] };
    return result;
  });
  const ROSTER_BY_SLUG = new Map(ROSTER.map(entry => [entry.slug, entry]));

  const battlefield = document.getElementById("battlefield");
  // Optional demonstration lineup; the normal 4v4 lineup stays unchanged.
  if (typeof location !== "undefined" && new URLSearchParams(location.search).get("effects") === "pixie-siren") {
    TEAM_DATA.ally.splice(0, 2,
      unit("forest-fairy", "픽시", 8, 2, 5, 5, 4, 7),
      unit("siren", "세이렌", 9, 2, 4, 5, 4, 7));
  }
  const allyTeam = document.getElementById("allyTeam");
  const enemyTeam = document.getElementById("enemyTeam");
  const message = document.getElementById("battleMessage");
  const roundState = document.getElementById("roundState");
  const startOverlay = document.getElementById("startOverlay");
  const startButton = document.getElementById("startButton");
  const lineupStatus = document.getElementById("lineupStatus");
  const selectedLineup = document.getElementById("selectedLineup");
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

  let units = [];
  let running = false;
  let paused = false;
  let actionBusy = false;
  let speedMultiplier = 1;
  let battleToken = 0;
  let actionCount = 0;
  let turnNumber = 0;
  let turnQueue = [];
  let awaitingRoll = false;
  let diceRolling = false;
  let lastDiceRoll = null;
  let diceFrameIndex = 0;
  let introRunning = false;
  let loadingLineup = false;
  let lineupRequest = 0;
  let selectedAllySlugs = TEAM_DATA.ally.map(entry => entry.slug);
  let selectedAllyTeam = TEAM_DATA.ally.map(entry => ({ ...entry }));

  [...DICE_ROLL_FRAMES, ...DICE_RESULT_FRAMES].forEach((src) => { const image = new Image(); image.src = src; });

  function unit(slug, name, maxHp, attack, speed, attackFrames, hitFrames, deathFrames, portraitSlug = slug) {
    const definition = typeof UNIT_TYPES !== "undefined" ? UNIT_TYPES[UNIT_TYPE_KEYS[slug]] : null;
    const grade = definition?.grade;
    const legions = definition?.legion == null ? [] : [].concat(definition.legion);
    return { slug, name, maxHp, attack, speed, grade, legions, portrait: `art/v2-style/processed/192/${portraitSlug}.png`, portraitBounds: PORTRAIT_BOUNDS[portraitSlug] || [0, 0, 192, 192], frames: { attack: attackFrames, hit: hitFrames, death: deathFrames } };
  }

  function frame(unitState, motion, index) {
    const prepared = unitState.motionFrames?.[motion];
    if (prepared) return prepared[Math.min(index - 1, prepared.length - 1)];
    const frameNumber = unitState.frameNumbers?.[motion]?.[index - 1] || index;
    return `${FRAME_ROOT}${unitState.slug}/${motion}-${String(frameNumber).padStart(2, "0")}.png`;
  }

  async function prepareSelectedMotion(entry) {
    const prepare = RUNTIME_PREPARERS[entry.slug];
    if (!prepare || entry.motionFrames) return entry;
    const motionFrames = await prepare();
    entry.motionFrames = motionFrames;
    entry.frames = { attack: motionFrames.attack.length, hit: motionFrames.hit.length, death: motionFrames.death.length };
    return entry;
  }

  function resetBattle(showStart) {
    if (showStart) {
      lineupRequest += 1;
      loadingLineup = false;
      startButton.textContent = "이 편성으로 전투 시작";
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
    speedMultiplier = 1;
    speedButton.textContent = "속도 ×1";
    pauseButton.textContent = "일시정지";
    pauseButton.disabled = true;
    speedButton.disabled = true;
    resultOverlay.hidden = true;
    startOverlay.hidden = !showStart;
    if (showStart) renderRosterSelection();
    turnDice.hidden = true;
    turnDiceButton.disabled = false;
    turnDiceButton.classList.remove("is-rolling");
    turnDiceImage.src = DICE_ROLL_FRAMES[0];
    unitInfoOverlay.hidden = true;
    battlefield.classList.remove("is-between-turns");
    battlefield.style.backgroundImage = `url("${BATTLEFIELDS[Math.floor(Math.random() * BATTLEFIELDS.length)]}")`;
    units = [
      ...selectedAllyTeam.map((data, slot) => makeState(data, "ally", slot)),
      ...TEAM_DATA.enemy.map((data, slot) => makeState(data, "enemy", slot))
    ];
    renderTeams();
    message.textContent = "전투 시작을 눌러주세요";
    updateHud();
  }

  function makeState(data, team, slot) {
    const brandIds = Object.keys(V2BattleBrands.definitions);
    const fallbackBrand = brandIds[(slot + (team === "enemy" ? 4 : 0)) % brandIds.length];
    const isSummon = UNIT_TYPES[UNIT_TYPE_KEYS[data.slug]]?.grade === "special";
    return { ...data, isSummon, team, slot, hp: data.maxHp, gauge: 0, alive: true, brand: V2BattleBrands.samples[data.slug] || fallbackBrand, brandMode: "normal", brandDisplayMode: "normal", poison: 0, element: null, image: null };
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
  }

  function createUnitElement(unitState) {
      const element = document.createElement("article");
      element.className = unitState.team === "ally" ? "unit is-pending" : "unit";
      element.dataset.unit = unitState.slug;
      element.tabIndex = unitState.team === "ally" ? -1 : 0;
      if (unitState.team === "ally") element.setAttribute("aria-hidden", "true");
      element.setAttribute("role", "button");
      element.setAttribute("aria-label", `${unitState.name} 정보 보기`);
      element.innerHTML = `
        <span class="brand-indicator" aria-live="polite" hidden></span>
        <div class="bar hp-bar" role="progressbar" aria-label="${unitState.name} 체력" aria-valuemin="0"><i></i></div>
        <div class="sprite-wrap"><img src="${frame(unitState, "attack", 1)}" alt="${unitState.name}"></div>`;
      unitState.element = element;
      unitState.image = element.querySelector("img");
      element.addEventListener("click", () => openUnitInfo(unitState));
      element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openUnitInfo(unitState);
        }
      });
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
    updateBrandIndicator(unitState);
  }

  function updateBrandIndicator(unitState) {
    if (!unitState.element) return;
    const label = unitState.element.querySelector(".brand-indicator");
    const brand = V2BattleBrands.definitions[unitState.brand];
    const mode = unitState.brandDisplayMode;
    const visible = unitState.alive && brand && (mode === "blessing" || mode === "curse");
    label.hidden = !visible;
    label.className = visible ? `brand-indicator is-${mode}` : "brand-indicator";
    label.textContent = visible ? `${brand.name.replace("의 낙인", "")} ${mode === "blessing" ? "축복" : "저주"}` : "";
  }

  function showRolledBrands(roll) {
    for (const unitState of units) {
      unitState.brandDisplayMode = V2BattleBrands.mode(unitState.brand, roll);
      updateBrandIndicator(unitState);
    }
  }

  function updateHud() {
    const allyAlive = aliveUnits("ally").length;
    const enemyAlive = aliveUnits("enemy").length;
    roundState.textContent = `${allyAlive} VS ${enemyAlive}`;
  }

  function aliveUnits(team) {
    return units.filter((unitState) => unitState.team === team && unitState.alive);
  }

  function revealUnit(unitState) {
    unitState.element.classList.remove("is-pending");
    unitState.element.classList.add("is-arriving");
    unitState.element.removeAttribute("aria-hidden");
    unitState.element.tabIndex = 0;
  }

  function renderRosterSelection(notice = "") {
    const scrollTop = unitRoster.scrollTop;
    selectedLineup.replaceChildren();
    for (let index = 0; index < 4; index += 1) {
      const slot = document.createElement("div");
      const selected = ROSTER_BY_SLUG.get(selectedAllySlugs[index]);
      slot.className = selected ? "selected-slot" : "selected-slot is-empty";
      slot.textContent = selected ? `${index + 1}. ${selected.name}` : `${index + 1}. 빈 자리`;
      selectedLineup.append(slot);
    }
    unitRoster.replaceChildren();
    for (const entry of ROSTER) {
      const selectedIndex = selectedAllySlugs.indexOf(entry.slug);
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
      image.src = entry.portrait;
      image.alt = "";
      const name = document.createElement("span");
      name.textContent = entry.name;
      button.append(order, image, name);
      button.addEventListener("click", () => toggleRosterUnit(entry.slug));
      unitRoster.append(button);
    }
    const count = selectedAllySlugs.length;
    unitRoster.scrollTop = scrollTop;
    lineupStatus.textContent = notice || `선택한 순서대로 왼쪽부터 소환됩니다. ${count} / 4`;
    startButton.disabled = loadingLineup || count !== 4;
  }

  function toggleRosterUnit(slug) {
    if (loadingLineup || !ROSTER_BY_SLUG.has(slug)) return;
    const selectedIndex = selectedAllySlugs.indexOf(slug);
    if (selectedIndex >= 0) selectedAllySlugs.splice(selectedIndex, 1);
    else if (selectedAllySlugs.length < 4) selectedAllySlugs.push(slug);
    else return renderRosterSelection("4명까지 선택할 수 있습니다. 먼저 한 명을 해제하세요.");
    renderRosterSelection();
  }

  async function startSelectedBattle() {
    if (selectedAllySlugs.length !== 4 || introRunning || running || loadingLineup) return;
    const request = ++lineupRequest;
    loadingLineup = true;
    renderRosterSelection();
    startButton.disabled = true;
    startButton.textContent = "유닛 모션 불러오는 중…";
    lineupStatus.textContent = "선택한 유닛을 전장에 준비하고 있습니다.";
    try {
      const preparedTeam = selectedAllySlugs.map(slug => ({ ...ROSTER_BY_SLUG.get(slug) }));
      await Promise.all(preparedTeam.map(prepareSelectedMotion));
      if (request !== lineupRequest) return;
      selectedAllyTeam = preparedTeam;
      resetBattle(false);
      await beginBattle();
    } catch (error) {
      if (request !== lineupRequest) return;
      loadingLineup = false;
      console.error(error);
      startOverlay.hidden = false;
      renderRosterSelection("유닛 모션을 불러오지 못했습니다. 다시 시도해 주세요.");
    } finally {
      if (request !== lineupRequest) return;
      loadingLineup = false;
      startButton.textContent = "이 편성으로 전투 시작";
      startButton.disabled = selectedAllySlugs.length !== 4;
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

  function battleLoop() {
    if (running && !paused && !actionBusy && !awaitingRoll) {
      let actor = turnQueue.shift();
      while (actor && !actor.alive) actor = turnQueue.shift();
      if (actor) performAttack(actor, battleToken);
      else beginTurnIntermission(false);
    }
    requestAnimationFrame(battleLoop);
  }

  async function startTurn() {
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
    for (const seed of units.filter(u => V2SummonRules.canBloom(u, turnNumber))) {
      await playMotion(seed, "attack", seed.frames.attack, token, true);
      if (token !== battleToken || !running) return;
      const plant = makeState({ ...ROSTER_BY_SLUG.get("crystal-devourer") }, seed.team, seed.slot);
      plant.isSummon = false;
      replaceFighter(seed, plant);
    }
    const fallen = V2BattleBrands.startRound(units, lastDiceRoll);
    units.forEach(updateUnit);
    await Promise.all(fallen.map(unitState => playMotion(unitState, "death", unitState.frames.death, token, true)));
    if (token !== battleToken || !running) return;
    updateHud();
    if (!aliveUnits("ally").length || !aliveUnits("enemy").length) return finishBattle();
    turnQueue = units.filter((unitState) => unitState.alive && unitState.slug !== "guardian-seed")
      .map((unitState) => ({ unitState, tie: Math.random() }))
      .sort((left, right) => right.unitState.speed - left.unitState.speed || left.tie - right.tie)
      .map((entry) => entry.unitState);
    for (const unitState of units) {
      unitState.gauge = unitState.alive ? 100 : 0;
      updateUnit(unitState);
    }
    message.textContent = `${turnNumber}턴 · 주사위 ${lastDiceRoll} · 속도 높은 순서로 전원 1회 행동`;
    actionBusy = false;
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
    turnDiceButton.disabled = false;
    turnDiceButton.classList.remove("is-rolling");
    turnDiceImage.src = DICE_ROLL_FRAMES[0];
    turnDiceImage.alt = "굴리기 전 주사위";
    turnDiceButton.setAttribute("aria-label", `${turnNumber + 1}턴 주사위 굴리기`);
    battlefield.classList.add("is-between-turns");
    message.textContent = initial ? "주사위를 굴리면 1턴이 시작됩니다" : `${turnNumber}턴 종료 · 유닛 정보 확인 또는 주사위 굴리기`;
  }

  async function rollTurnDice() {
    if (!running || !awaitingRoll || diceRolling) return;
    closeUnitInfo();
    diceRolling = true;
    showRolledBrands(null);
    turnDiceButton.disabled = true;
    turnDiceButton.classList.add("is-rolling");
    turnDiceButton.setAttribute("aria-label", "주사위 굴리는 중");
    const token = battleToken;
    const steps = 18 + Math.floor(Math.random() * 5);
    for (let step = 0; step < steps; step += 1) {
      if (token !== battleToken || !running || !awaitingRoll) return;
      diceFrameIndex = (diceFrameIndex + 1) % DICE_ROLL_FRAMES.length;
      turnDiceImage.src = DICE_ROLL_FRAMES[diceFrameIndex];
      const progress = step / Math.max(1, steps - 1);
      await wait(42 + Math.round(progress * progress * 62));
    }
    if (token !== battleToken || !running || !awaitingRoll) return;
    lastDiceRoll = Math.floor(Math.random() * 6) + 1;
    showRolledBrands(lastDiceRoll);
    turnDiceImage.src = DICE_RESULT_FRAMES[lastDiceRoll - 1];
    turnDiceImage.alt = `주사위 결과 ${lastDiceRoll}`;
    turnDiceButton.classList.remove("is-rolling");
    turnDiceButton.setAttribute("aria-label", `주사위 결과 ${lastDiceRoll}`);
    message.textContent = `${turnNumber + 1}턴 공통 주사위 결과 ${lastDiceRoll}`;
    await wait(Math.max(320, 620 / speedMultiplier));
    if (token !== battleToken || !running || !awaitingRoll) return;
    turnDiceButton.disabled = false;
    diceRolling = false;
    startTurn();
  }

  function openUnitInfo(unitState) {
    if (!awaitingRoll || diceRolling) return;
    unitInfoName.textContent = unitState.name;
    unitInfoImage.setAttribute("href", unitState.portrait);
    const [x, y, width, height] = unitState.portraitBounds;
    const padding = Math.max(width, height) * 0.06;
    unitInfoPortrait.setAttribute("viewBox", `${x - padding} ${y - padding} ${width + padding * 2} ${height + padding * 2}`);
    unitInfoPortrait.setAttribute("aria-label", unitState.name);
    unitInfoGrade.textContent = GRADE_LABELS[unitState.grade] || "미지정";
    unitInfoLegion.textContent = unitState.legions.map((key) => LEGION_LABELS[key] || key).join(" · ") || "미지정";
    unitInfoHp.textContent = `${Math.max(0, unitState.hp)} / ${unitState.maxHp}`;
    unitInfoAttack.textContent = String(unitState.attack);
    unitInfoSpeed.textContent = String(unitState.speed);
    const brand = V2BattleBrands.definitions[unitState.brand];
    if (brand) {
      const stateText = lastDiceRoll == null ? "주사위를 굴리면 효과가 결정됩니다."
        : `지난 턴 눈금 ${lastDiceRoll} · ${{ blessing: "축복", curse: "저주", normal: "일반" }[unitState.brandMode] || "일반"}`;
      unitInfoBrands.innerHTML = `<div class="brand-heading">
        <svg class="brand-icon" viewBox="${BRAND_ICON_VIEWS[unitState.brand].join(" ")}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
          <image href="art/v2-style/ui/brand-icons-sheet.jpg" width="1280" height="575" />
        </svg><h4>${brand.name}</h4></div>
        <p class="brand-example">예시 배정 · 축복 + 저주 1세트</p>
        <p class="brand-blessing">축복 [${brand.bless.join(", ")}]<br>${brand.blessing}</p>
        <p class="brand-curse">저주 [${brand.curse.join(", ")}]<br>${brand.penalty}</p>
        <p>일반 [${brand.normal}]: 통상 진행</p>
        <p class="brand-note">공통 주사위로 시작하는 턴에 적용 · 다음 굴림 때 갱신</p>
        <p class="brand-note">${stateText}${unitState.poison ? " · 중독: 다음 행동 시 피해 1" : ""}</p>
        ${unitState.brand === "summon" ? '<p class="brand-note">아군 소환물에게 적용 · 개화한 식인식물은 제외</p>' : ""}`;
    } else unitInfoBrands.textContent = "낙인 미지정";
    if (V2SummonRules.choices[unitState.slug]) unitInfoBrands.innerHTML += `<p>주사위 6: 자기 차례에 소환 후 공격 · 전투당 소환 성공 1회 (${unitState.summonUsed ? "사용 완료" : "미사용"})</p><p>${unitState.slug === "crystal-devourer" ? "중앙이 차면 사망한 아군 자리에도 씨앗 소환" : "중앙이 차면 소환을 건너뜀"}</p>`;
    if (unitState.slug === "guardian-seed") unitInfoBrands.innerHTML += `<p>공격 불가 · 피격 ${unitState.receivedHits || 0}/2 · 2회 피격 후 다음 턴에 식인식물로 개화 (생존 시)</p>`;
    unitInfoOverlay.hidden = false;
    document.getElementById("unitInfoClose").focus();
  }

  function closeUnitInfo() {
    unitInfoOverlay.hidden = true;
  }

  function replaceFighter(old, next) {
    const host = next.team === "ally" ? allyTeam : enemyTeam;
    const node = old?.element || host.querySelector(".summon-slot");
    const element = createUnitElement(next);
    node.replaceWith(element);
    if (old) units.splice(units.indexOf(old), 1, next);
    else units.push(next);
    revealUnit(next);
    return next;
  }

  async function summonBeforeAttack(actor, token) {
    const plan = V2SummonRules.plan(actor, units, lastDiceRoll);
    if (!plan) return;
    const data = plan.slug === "guardian-seed"
      ? unit("guardian-seed", "수호 씨앗", 6, 0, 1, 5, 3, 4)
      : { ...ROSTER_BY_SLUG.get(plan.slug) };
    try { await prepareSelectedMotion(data); }
    catch (error) { console.warn("Summon preparation failed", error); return; }
    if (token !== battleToken || !running) return;
    const summoned = makeState(data, actor.team, plan.slot);
    summoned.isSummon = true;
    summoned.bornTurn = turnNumber;
    const old = units.find(u => u.team === actor.team && u.slot === plan.slot);
    replaceFighter(old, summoned);
    actor.summonUsed = true;
    summoned.element.classList.add("is-pending");
    message.textContent = `${actor.name} → ${summoned.name} 소환`;
    try {
      const frames = await V2SummonEffect.prepare();
      if (token !== battleToken || !running) return;
      await V2SummonEffect.play(summoned, frames, { isCurrent: () => token === battleToken && running, reveal: revealUnit, wait });
    } catch (error) { console.warn("Summon effect unavailable", error); }
    if (token !== battleToken || !running) return;
    revealUnit(summoned);
    updateHud();
  }

  async function performAttack(actor, token) {
    actionBusy = true;
    actor.gauge = 0;
    updateUnit(actor);
    if (V2BattleBrands.beforeAction(actor)) {
      updateUnit(actor);
      if (!actor.alive) {
        await playMotion(actor, "death", actor.frames.death, token, true);
        if (token !== battleToken || !running) return;
        updateHud();
        if (!aliveUnits("ally").length || !aliveUnits("enemy").length) return finishBattle();
        actionBusy = false;
        return;
      }
    }
    await summonBeforeAttack(actor, token);
    if (token !== battleToken || !running) return;
    const targets = aliveUnits(actor.team === "ally" ? "enemy" : "ally");
    const target = targets[Math.floor(Math.random() * targets.length)];
    if (!target) return finishBattle();

    message.textContent = `${turnNumber}턴 · ${actor.name}(속도 ${actor.speed}) → ${target.name}`;
    actor.element.classList.add("is-attacking");
    target.element.classList.add("is-targeted");
    const hitFrames = typeof V2CombatEffects !== "undefined" ? await V2CombatEffects.prepare(actor.slug) : null;
    if (token !== battleToken || !running) return;
    let signalImpact;
    const impactReady = new Promise(resolve => { signalImpact = resolve; });
    const attackPlayback = playMotion(actor, "attack", actor.frames.attack, token, false, signalImpact);
    attackPlayback.then(signalImpact, signalImpact);
    await impactReady;
    if (token !== battleToken || !running) return;

    const outcome = V2BattleBrands.attack(actor, target);
    V2SummonRules.registerHit(target, outcome, turnNumber);
    updateUnit(actor);
    updateUnit(target);
    message.textContent = outcome.miss ? `${actor.name} 공격 빗나감`
      : outcome.immune ? `${target.name} 수호 · 피해 무시`
      : `${actor.name} → ${target.name} · 피해 ${outcome.damage}${outcome.recovered ? ` · 흡혈 +${outcome.recovered}` : ""}`;
    if (outcome.damage > 0) {
      showDamage(target, outcome.damage);
      target.element.classList.add("is-hit");
      await Promise.all([
        playMotion(target, "hit", target.frames.hit, token),
        typeof V2CombatEffects !== "undefined" ? V2CombatEffects.play(target.element.querySelector(".sprite-wrap"), hitFrames,
          {guard: () => token === battleToken && running, wait, speed: speedMultiplier}) : Promise.resolve()
      ]);
    } else await wait(250 / speedMultiplier);
    if (token !== battleToken || !running) return;
    target.element.classList.remove("is-hit");
    updateUnit(target);

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
    actor.image.src = frame(actor, "attack", 1);
    actionCount += 1;
    updateHud();
    if (!aliveUnits("ally").length || !aliveUnits("enemy").length) return finishBattle();
    actionBusy = false;
    message.textContent = `${turnNumber}턴 · 남은 행동 ${turnQueue.filter((unitState) => unitState.alive).length}명`;
  }

  async function playMotion(unitState, motion, count, token, holdLast, onImpact) {
    const delay = () => Math.max(45, 135 / speedMultiplier);
    for (let index = 1; index <= count; index += 1) {
      if (token !== battleToken || !running) return;
      while (paused && token === battleToken && running) await wait(50);
      if (token !== battleToken || !running) return;
      unitState.image.src = frame(unitState, motion, index);
      if (onImpact && index === Math.max(1, Math.ceil(count / 2))) onImpact();
      await wait(delay());
    }
    if (!holdLast) await wait(delay() * .35);
  }

  function finishBattle() {
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
    resultTitle.textContent = won ? "아군 승리" : aliveUnits("enemy").length ? "적군 승리" : "무승부";
    resultBody.textContent = `${actionCount}번의 공격 후 전투가 끝났습니다. 매 턴 속도가 높은 순서로 생존 유닛 모두가 한 번씩 행동했습니다.`;
    resultOverlay.hidden = false;
    message.textContent = "전투 종료";
  }

  function wait(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  startButton.addEventListener("click", startSelectedBattle);
  turnDiceButton.addEventListener("click", rollTurnDice);
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
    speedMultiplier = speedMultiplier === 1 ? 2 : speedMultiplier === 2 ? 3 : 1;
    speedButton.textContent = `속도 ×${speedMultiplier}`;
  });

  resetBattle(true);
  requestAnimationFrame(battleLoop);
})();
