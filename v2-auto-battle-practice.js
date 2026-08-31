(function () {
  const BATTLEFIELDS = [
    "art/v2-style/battle-backgrounds/uploaded-raw/wasteland-chasm-battlefield.jpg",
    "art/v2-style/battle-backgrounds/uploaded-raw/haunted-forest-ruins-battlefield.jpg",
    "art/v2-style/battle-backgrounds/uploaded-raw/necropolis-pyramids-battlefield.jpg"
  ];
  const FRAME_ROOT = "art/v2-style/animation-test-frames/";
  const TEAM_DATA = {
    ally: [
      unit("death-knight", "데스나이트", 12, 3, 72, 5, 4, 6),
      unit("skeleton-spear", "해골 창병", 8, 2, 88, 5, 4, 5),
      unit("ghoul", "구울", 9, 2, 100, 5, 4, 6),
      unit("ancient-treant", "고대 트렌트", 14, 3, 55, 5, 4, 6)
    ],
    enemy: [
      unit("goblin-rider", "고블린 라이더", 8, 2, 105, 5, 4, 5),
      unit("orc-warrior", "오크 전사", 12, 3, 62, 5, 4, 5),
      unit("boulder-ogre", "오우거", 14, 3, 48, 5, 4, 5),
      unit("minotaur", "미노타우로스", 11, 3, 76, 6, 4, 6)
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

  let units = [];
  let running = false;
  let paused = false;
  let actionBusy = false;
  let speedMultiplier = 1;
  let lastTick = performance.now();
  let battleToken = 0;
  let actionCount = 0;

  function unit(slug, name, maxHp, attack, speed, attackFrames, hitFrames, deathFrames) {
    return { slug, name, maxHp, attack, speed, frames: { attack: attackFrames, hit: hitFrames, death: deathFrames } };
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
    speedMultiplier = 1;
    speedButton.textContent = "속도 ×1";
    pauseButton.textContent = "일시정지";
    pauseButton.disabled = true;
    speedButton.disabled = true;
    resultOverlay.hidden = true;
    startOverlay.hidden = !showStart;
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
    for (const unitState of units) {
      const element = document.createElement("article");
      element.className = "unit";
      element.dataset.unit = unitState.slug;
      element.innerHTML = `
        <div class="unit-card"><strong>${unitState.name}</strong><span class="unit-speed">속도 ${unitState.speed}</span><span class="hp-text"></span></div>
        <div class="bar hp-bar"><i></i></div>
        <div class="bar gauge-bar"><i></i></div>
        <div class="sprite-wrap"><img src="${frame(unitState, "attack", 1)}" alt="${unitState.name}"></div>`;
      unitState.element = element;
      unitState.image = element.querySelector("img");
      (unitState.team === "ally" ? allyTeam : enemyTeam).append(element);
      updateUnit(unitState);
    }
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
    roundState.textContent = `${allyAlive} VS ${enemyAlive}`;
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
    lastTick = performance.now();
    pauseButton.disabled = false;
    speedButton.disabled = false;
    message.textContent = "속도 게이지가 차오릅니다";
  }

  function battleLoop(now) {
    const delta = Math.min(120, now - lastTick);
    lastTick = now;
    if (running && !paused) {
      for (const unitState of units) {
        if (!unitState.alive || unitState.gauge >= 100) continue;
        unitState.gauge = Math.min(100, unitState.gauge + unitState.speed * delta * speedMultiplier / 1200);
        updateUnit(unitState);
      }
      if (!actionBusy) {
        const ready = units.filter((unitState) => unitState.alive && unitState.gauge >= 100)
          .sort((left, right) => right.gauge - left.gauge || right.speed - left.speed);
        if (ready[0]) performAttack(ready[0], battleToken);
      }
    }
    requestAnimationFrame(battleLoop);
  }

  async function performAttack(actor, token) {
    actionBusy = true;
    actor.gauge = 0;
    updateUnit(actor);
    const targets = aliveUnits(actor.team === "ally" ? "enemy" : "ally");
    const target = targets[Math.floor(Math.random() * targets.length)];
    if (!target) return finishBattle();

    message.textContent = `${actor.name} → ${target.name} 공격`;
    actor.element.classList.add("is-attacking");
    await playMotion(actor, "attack", actor.frames.attack, token);
    if (token !== battleToken || !running) return;

    target.hp -= actor.attack;
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
    actor.image.src = frame(actor, "attack", 1);
    actionCount += 1;
    updateHud();
    if (!aliveUnits("ally").length || !aliveUnits("enemy").length) return finishBattle();
    actionBusy = false;
    message.textContent = "다음 행동을 기다리는 중";
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
    pauseButton.disabled = true;
    speedButton.disabled = true;
    const won = aliveUnits("ally").length > 0;
    resultTitle.textContent = won ? "아군 승리" : "적군 승리";
    resultBody.textContent = `${actionCount}번의 공격 후 전투가 끝났습니다. 속도 수치가 높을수록 행동 기회가 더 자주 왔습니다.`;
    resultOverlay.hidden = false;
    message.textContent = "전투 종료";
  }

  function wait(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  document.getElementById("startButton").addEventListener("click", beginBattle);
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
