(function () {
  const BATTLEFIELDS = [
    "art/v2-style/battle-backgrounds/uploaded-raw/wasteland-chasm-battlefield.jpg",
    "art/v2-style/battle-backgrounds/uploaded-raw/haunted-forest-ruins-battlefield.jpg",
    "art/v2-style/battle-backgrounds/uploaded-raw/necropolis-pyramids-battlefield.jpg"
  ];
  const FRAME_ROOT = "art/v2-style/animation-test-frames/";
  const DICE_FRAME_ROOT = "art/v2-style/dice-test/frames/";
  const DICE_ROLL_FRAMES = Array.from({ length: 12 }, (_, index) => `${DICE_FRAME_ROOT}roll-${String(index + 1).padStart(2, "0")}.png`);
  const DICE_RESULT_FRAMES = Array.from({ length: 6 }, (_, index) => `${DICE_FRAME_ROOT}result-${String(index + 1).padStart(2, "0")}.png`);
  const TEAM_DATA = {
    ally: [
      unit("death-knight", "데스나이트", 12, 3, 4, 5, 4, 6),
      unit("skeleton-spear", "해골 창병", 8, 2, 5, 5, 4, 5),
      unit("ghoul", "구울", 9, 2, 3, 5, 4, 6),
      unit("ancient-treant", "고대 트렌트", 14, 3, 1, 5, 4, 6)
    ],
    enemy: [
      unit("goblin-rider", "고블린 라이더", 8, 2, 5, 5, 4, 5),
      unit("orc-warrior", "오크 전사", 12, 3, 3, 5, 4, 5, "goblin-soldier"),
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
  const diceTurnLabel = document.getElementById("diceTurnLabel");
  const diceResultLabel = document.getElementById("diceResultLabel");
  const unitInfoOverlay = document.getElementById("unitInfoOverlay");
  const unitInfoName = document.getElementById("unitInfoName");
  const unitInfoImage = document.getElementById("unitInfoImage");
  const unitInfoTeam = document.getElementById("unitInfoTeam");
  const unitInfoState = document.getElementById("unitInfoState");
  const unitInfoHp = document.getElementById("unitInfoHp");
  const unitInfoAttack = document.getElementById("unitInfoAttack");
  const unitInfoSpeed = document.getElementById("unitInfoSpeed");

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
    return { slug, name, maxHp, attack, speed, portrait: `assets/${portraitSlug}.jpg`, frames: { attack: attackFrames, hit: hitFrames, death: deathFrames } };
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
    return { ...data, team, slot, hp: data.maxHp, gauge: 0, alive: true, element: null, image: null };
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
        <div class="unit-card"><strong>${unitState.name}</strong><span class="unit-speed">속도 ${unitState.speed}</span><span class="hp-text"></span></div>
        <div class="bar hp-bar"><i></i></div>
        <div class="bar gauge-bar"><i></i></div>
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

  function showDamage(unitState, amount) {
    const number = document.createElement("span");
    number.className = "damage-number";
    number.textContent = `-${amount}`;
    number.setAttribute("aria-label", `${amount} 피해`);
    unitState.element.querySelector(".sprite-wrap").append(number);
    number.addEventListener("animationend", () => number.remove(), { once: true });
  }

  function updateUnit(unitState) {
    if (!unitState.element) return;
    unitState.element.querySelector(".hp-text").textContent = `${Math.max(0, unitState.hp)}/${unitState.maxHp}`;
    unitState.element.querySelector(".hp-bar i").style.width = `${Math.max(0, unitState.hp / unitState.maxHp * 100)}%`;
    unitState.element.querySelector(".gauge-bar i").style.width = `${Math.min(100, unitState.gauge)}%`;
    unitState.element.classList.toggle("is-ready", unitState.alive && unitState.gauge >= 100);
    unitState.element.classList.toggle("is-dead", !unitState.alive);
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

  function startTurn() {
    if (!running) return;
    if (!aliveUnits("ally").length || !aliveUnits("enemy").length) return finishBattle();
    awaitingRoll = false;
    diceRolling = false;
    turnDice.hidden = true;
    battlefield.classList.remove("is-between-turns");
    closeUnitInfo();
    pauseButton.disabled = false;
    turnNumber += 1;
    turnQueue = units.filter((unitState) => unitState.alive)
      .map((unitState) => ({ unitState, tie: Math.random() }))
      .sort((left, right) => right.unitState.speed - left.unitState.speed || left.tie - right.tie)
      .map((entry) => entry.unitState);
    for (const unitState of units) {
      unitState.gauge = unitState.alive ? 100 : 0;
      updateUnit(unitState);
    }
    message.textContent = `${turnNumber}턴 · 주사위 ${lastDiceRoll} · 속도 높은 순서로 전원 1회 행동`;
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
    diceTurnLabel.textContent = `${turnNumber + 1}턴 준비`;
    diceResultLabel.textContent = initial ? "주사위를 굴려 전투 시작" : `${turnNumber}턴 종료 · 다음 눈금을 굴려주세요`;
    battlefield.classList.add("is-between-turns");
    message.textContent = initial ? "주사위를 굴리면 1턴이 시작됩니다" : `${turnNumber}턴 종료 · 유닛 정보 확인 또는 주사위 굴리기`;
  }

  async function rollTurnDice() {
    if (!running || !awaitingRoll || diceRolling) return;
    closeUnitInfo();
    diceRolling = true;
    turnDiceButton.disabled = true;
    turnDiceButton.classList.add("is-rolling");
    diceResultLabel.textContent = "주사위 회전 중…";
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
    turnDiceImage.src = DICE_RESULT_FRAMES[lastDiceRoll - 1];
    turnDiceImage.alt = `주사위 결과 ${lastDiceRoll}`;
    turnDiceButton.classList.remove("is-rolling");
    diceResultLabel.textContent = `${lastDiceRoll} · 모든 유닛 공통 낙인 눈금`;
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
    unitInfoImage.src = unitState.portrait;
    unitInfoImage.alt = unitState.name;
    unitInfoTeam.textContent = unitState.team === "ally" ? "아군" : "적군";
    unitInfoState.textContent = unitState.alive ? "생존" : "사망";
    unitInfoHp.textContent = `${Math.max(0, unitState.hp)} / ${unitState.maxHp}`;
    unitInfoAttack.textContent = String(unitState.attack);
    unitInfoSpeed.textContent = String(unitState.speed);
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
    const targets = aliveUnits(actor.team === "ally" ? "enemy" : "ally");
    const target = targets[Math.floor(Math.random() * targets.length)];
    if (!target) return finishBattle();

    message.textContent = `${turnNumber}턴 · ${actor.name}(속도 ${actor.speed}) → ${target.name}`;
    actor.element.classList.add("is-attacking");
    target.element.classList.add("is-targeted");
    await playMotion(actor, "attack", actor.frames.attack, token);
    if (token !== battleToken || !running) return;

    const damage = Math.min(actor.attack, target.hp);
    target.hp -= damage;
    showDamage(target, damage);
    target.element.classList.add("is-hit");
    await playMotion(target, "hit", target.frames.hit, token);
    target.element.classList.remove("is-hit");
    updateUnit(target);

    if (target.hp <= 0) {
      target.hp = 0;
      target.alive = false;
      message.textContent = `${target.name} 쓰러짐`;
      await playMotion(target, "death", target.frames.death, token, true);
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
    resultTitle.textContent = won ? "아군 승리" : "적군 승리";
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
