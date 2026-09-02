(function () {
  const BATTLEFIELDS = [
    "art/v2-style/battle-backgrounds/uploaded-raw/wasteland-chasm-battlefield.jpg",
    "art/v2-style/battle-backgrounds/uploaded-raw/haunted-forest-ruins-battlefield.jpg",
    "art/v2-style/battle-backgrounds/uploaded-raw/necropolis-pyramids-battlefield.jpg"
  ];
  const FRAME_ROOT = "art/v2-style/animation-test-frames/";
  const UNIT_TYPE_KEYS = {
    "death-knight": "demonDeathKnight", "skeleton-spear": "spear", "ghoul": "ghoul",
    "ancient-treant": "ancientTreant", "goblin-rider": "goblinRider",
    "orc-warrior": "troll", "boulder-ogre": "ogre", "minotaur": "minotaur"
  };
  const GRADE_LABELS = { normal: "일반", advanced: "희귀", hero: "영웅", special: "소환물" };
  const LEGION_LABELS = { skeleton: "언데드", corpse: "시체", beast: "야수", plague: "역병", ice: "얼음", summon: "소환", demon: "악마", insect: "곤충", plant: "식물", element: "원소" };
  // Visible alpha bounds in the existing 192px cutouts; bitmap files stay untouched.
  const PORTRAIT_BOUNDS = {
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
      unit("skeleton-spear", "해골 창병", 8, 2, 5, 5, 4, 5),
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

  const battlefield = document.getElementById("battlefield");
  const allyTeam = document.getElementById("allyTeam");
  const enemyTeam = document.getElementById("enemyTeam");
  const message = document.getElementById("battleMessage");
  const roundState = document.getElementById("roundState");
  const startOverlay = document.getElementById("startOverlay");
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

  [...DICE_ROLL_FRAMES, ...DICE_RESULT_FRAMES].forEach((src) => { const image = new Image(); image.src = src; });

  function unit(slug, name, maxHp, attack, speed, attackFrames, hitFrames, deathFrames, portraitSlug = slug) {
    const definition = typeof UNIT_TYPES !== "undefined" ? UNIT_TYPES[UNIT_TYPE_KEYS[slug]] : null;
    const grade = definition?.grade;
    const legions = definition?.legion == null ? [] : [].concat(definition.legion);
    return { slug, name, maxHp, attack, speed, grade, legions, portrait: `art/v2-style/processed/192/${portraitSlug}.png`, portraitBounds: PORTRAIT_BOUNDS[portraitSlug] || [0, 0, 192, 192], frames: { attack: attackFrames, hit: hitFrames, death: deathFrames } };
  }

  function frame(unitState, motion, index) {
    return `${FRAME_ROOT}${unitState.slug}/${motion}-${String(index).padStart(2, "0")}.png`;
  }

  function resetBattle(showStart) {
    battleToken += 1;
    running = false;
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
    turnDice.hidden = true;
    turnDiceButton.disabled = false;
    turnDiceButton.classList.remove("is-rolling");
    turnDiceImage.src = DICE_ROLL_FRAMES[0];
    unitInfoOverlay.hidden = true;
    battlefield.classList.remove("is-between-turns");
    battlefield.style.backgroundImage = `url("${BATTLEFIELDS[Math.floor(Math.random() * BATTLEFIELDS.length)]}")`;
    units = [
      ...TEAM_DATA.ally.map((data, slot) => makeState(data, "ally", slot)),
      ...TEAM_DATA.enemy.map((data, slot) => makeState(data, "enemy", slot))
    ];
    renderTeams();
    message.textContent = "전투 시작을 눌러주세요";
    updateHud();
  }

  function makeState(data, team, slot) {
    return { ...data, team, slot, hp: data.maxHp, gauge: 0, alive: true, brand: V2BattleBrands.samples[data.slug], brandMode: "normal", brandDisplayMode: "normal", poison: 0, element: null, image: null };
  }

  function renderTeams() {
    allyTeam.replaceChildren();
    enemyTeam.replaceChildren();
    enemyTeam.append(makeSummonSlot("적군"));
    for (const unitState of units) {
      const element = document.createElement("article");
      element.className = "unit";
      element.dataset.unit = unitState.slug;
      element.tabIndex = 0;
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
      (unitState.team === "ally" ? allyTeam : enemyTeam).append(element);
      updateUnit(unitState);
    }
    allyTeam.append(makeSummonSlot("아군"));
  }

  function makeSummonSlot(teamName) {
    const slot = document.createElement("article");
    slot.className = "summon-slot";
    slot.setAttribute("aria-label", `${teamName} 소환물 생성 자리`);
    return slot;
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
    roundState.textContent = `${allyAlive}+1 VS ${enemyAlive}+1`;
  }

  function aliveUnits(team) {
    return units.filter((unitState) => unitState.team === team && unitState.alive);
  }

  function beginBattle() {
    if (window.V2Landscape) window.V2Landscape.request();
    startOverlay.hidden = true;
    resultOverlay.hidden = true;
    running = true;
    paused = false;
    pauseButton.disabled = true;
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
    const fallen = V2BattleBrands.startRound(units, lastDiceRoll);
    units.forEach(updateUnit);
    await Promise.all(fallen.map(unitState => playMotion(unitState, "death", unitState.frames.death, token, true)));
    if (token !== battleToken || !running) return;
    updateHud();
    if (!aliveUnits("ally").length || !aliveUnits("enemy").length) return finishBattle();
    turnQueue = units.filter((unitState) => unitState.alive)
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
      unitInfoBrands.innerHTML = `<h4>${brand.name}</h4>
        <p class="brand-example">예시 배정 · 축복 + 저주 1세트</p>
        <p class="brand-blessing">축복 [${brand.bless.join(", ")}]<br>${brand.blessing}</p>
        <p class="brand-curse">저주 [${brand.curse.join(", ")}]<br>${brand.penalty}</p>
        <p>일반 [${brand.normal}]: 통상 진행</p>
        <p class="brand-note">공통 주사위로 시작하는 턴에 적용 · 다음 굴림 때 갱신</p>
        <p class="brand-note">${stateText}${unitState.poison ? " · 중독: 다음 행동 시 피해 1" : ""}</p>
        ${unitState.brand === "summon" ? '<p class="brand-note">소환물이 없으면 효과 없음 · 소환 생성 기능은 아직 없음</p>' : ""}`;
    } else unitInfoBrands.textContent = "낙인 미지정";
    unitInfoOverlay.hidden = false;
    document.getElementById("unitInfoClose").focus();
  }

  function closeUnitInfo() {
    unitInfoOverlay.hidden = true;
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
    const targets = aliveUnits(actor.team === "ally" ? "enemy" : "ally");
    const target = targets[Math.floor(Math.random() * targets.length)];
    if (!target) return finishBattle();

    message.textContent = `${turnNumber}턴 · ${actor.name}(속도 ${actor.speed}) → ${target.name}`;
    actor.element.classList.add("is-attacking");
    target.element.classList.add("is-targeted");
    await playMotion(actor, "attack", actor.frames.attack, token);
    if (token !== battleToken || !running) return;

    const outcome = V2BattleBrands.attack(actor, target);
    updateUnit(actor);
    updateUnit(target);
    message.textContent = outcome.miss ? `${actor.name} 공격 빗나감`
      : outcome.immune ? `${target.name} 수호 · 피해 무시`
      : `${actor.name} → ${target.name} · 피해 ${outcome.damage}${outcome.recovered ? ` · 흡혈 +${outcome.recovered}` : ""}`;
    if (outcome.damage > 0) {
      target.element.classList.add("is-hit");
      await playMotion(target, "hit", target.frames.hit, token);
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

    actor.element.classList.remove("is-attacking");
    target.element.classList.remove("is-targeted");
    actor.image.src = frame(actor, "attack", 1);
    actionCount += 1;
    updateHud();
    if (!aliveUnits("ally").length || !aliveUnits("enemy").length) return finishBattle();
    actionBusy = false;
    message.textContent = `${turnNumber}턴 · 남은 행동 ${turnQueue.filter((unitState) => unitState.alive).length}명`;
  }

  async function playMotion(unitState, motion, count, token, holdLast) {
    const delay = () => Math.max(45, 135 / speedMultiplier);
    for (let index = 1; index <= count; index += 1) {
      if (token !== battleToken || !running) return;
      unitState.image.src = frame(unitState, motion, index);
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

  document.getElementById("startButton").addEventListener("click", beginBattle);
  turnDiceButton.addEventListener("click", rollTurnDice);
  document.getElementById("unitInfoClose").addEventListener("click", closeUnitInfo);
  document.getElementById("unitInfoBackdrop").addEventListener("click", closeUnitInfo);
  restartButton.addEventListener("click", () => { resetBattle(false); beginBattle(); });
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
