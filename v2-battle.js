(function () {
  "use strict";

  const MAX_SQUAD = 4;
  const DEFAULT_SQUAD = ["spear", "knight", "ghoul"];
  const ENEMY_SQUAD = ["goblinSoldier", "ogre", "plagueFrog", "archer"];
  const ROSTER = [
    "spear", "archer", "knight", "ghoul", "worm", "golem", "plagueFrog", "yeti",
    "minotaur", "iceLord", "spiderQueen", "goblinChief", "doomExecutor", "ancientTreant",
    "scorpionKnight", "hydra"
  ];
  const LEGIONS = {
    skeleton: { name: "언데드", need: 3, color: "#a66cff" },
    corpse: { name: "시체", need: 2, color: "#c8946d" },
    beast: { name: "야수", need: 2, color: "#ef9f4d" },
    plague: { name: "역병", need: 2, color: "#79d85f" },
    ice: { name: "얼음", need: 2, color: "#62d9ff" },
    summon: { name: "소환", need: 2, color: "#df8cff" },
    demon: { name: "악마", need: 2, color: "#ff5968" },
    insect: { name: "벌래", need: 2, color: "#d9cd4a" },
    plant: { name: "식물", need: 2, color: "#59c871" },
    element: { name: "원소", need: 2, color: "#ffaa4f" }
  };

  const el = (id) => document.getElementById(id);
  const scene = el("battleScene");
  const state = {
    chosen: DEFAULT_SQUAD.slice(), player: [], enemy: [], round: 1, soul: 0,
    paused: false, speed: 1, muted: false, ended: false, battleId: 0,
    actions: 0, damage: 0, kills: 0, feed: [], targetRequest: null, rollRequest: null
  };
  let audioContext = null;
  const DIE_LANDING = [
    { x: 0, y: 0 }, { x: 0, y: -180 }, { x: 0, y: -90 },
    { x: 0, y: 90 }, { x: -90, y: 0 }, { x: 90, y: 0 }
  ];

  function def(type) { return window.UNIT_TYPES[type]; }
  function legionsOf(type) {
    const value = def(type)?.legion;
    return Array.isArray(value) ? value : value ? [value] : [];
  }
  function artPath(type) {
    const file = String(def(type)?.image || "assets/skeleton-spear.jpg").split("/").pop().replace(/\.jpg$/i, ".png");
    return `art/processed/192/${file}`;
  }
  function fallbackArt(img, type) {
    img.onerror = () => { img.onerror = null; img.src = def(type)?.image || "assets/skeleton-spear.jpg"; };
  }
  function delay(ms, token = state.battleId) {
    return new Promise((resolve) => {
      const tick = () => {
        if (token !== state.battleId || state.ended) return resolve(false);
        if (state.paused) return setTimeout(tick, 80);
        setTimeout(() => resolve(true), Math.max(30, ms / state.speed));
      };
      tick();
    });
  }
  function tone(kind) {
    if (state.muted) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const table = { roll: [180, 90, .08], hit: [84, 42, .14], kill: [120, 38, .35], heal: [360, 620, .22], status: [260, 150, .2], start: [110, 220, .3] };
      const [from, to, duration] = table[kind] || table.hit;
      oscillator.type = kind === "heal" ? "sine" : "sawtooth";
      oscillator.frequency.setValueAtTime(from, now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + duration);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(.09, now + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now); oscillator.stop(now + duration + .02);
    } catch (_) { /* Audio is decorative. */ }
  }

  function countLegions(team) {
    const counts = {};
    team.forEach((unit) => legionsOf(unit.type).forEach((key) => { counts[key] = (counts[key] || 0) + 1; }));
    return counts;
  }
  function activeLegions(team) {
    const counts = countLegions(team);
    return Object.keys(LEGIONS).filter((key) => (counts[key] || 0) >= LEGIONS[key].need);
  }
  function legionSummary(team) {
    const active = activeLegions(team);
    return active.length ? active.map((key) => LEGIONS[key].name).join(" · ") : "군단 효과 없음";
  }
  function hasActiveLegion(unit, key) {
    const team = unit.owner === "player" ? state.player : state.enemy;
    return legionsOf(unit.type).includes(key) && activeLegions(team).includes(key);
  }
  function createUnit(type, owner, index) {
    const data = def(type);
    return {
      id: `${owner}-${type}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      type, owner, index, hp: data.hp, maxHp: data.hp, poison: 0, frozen: 0,
      alive: true, element: null
    };
  }
  function applyOpeningLegions(team) {
    const active = activeLegions(team);
    team.forEach((unit) => {
      if (active.includes("plant") && legionsOf(unit.type).includes("plant")) {
        unit.maxHp += 1; unit.hp += 1;
      }
    });
  }
  function effectiveDice(unit) {
    const dice = def(unit.type).dice.slice();
    const active = activeLegions(unit.owner === "player" ? state.player : state.enemy);
    if (active.includes("skeleton") && def(unit.type).grade !== "hero") {
      const i = dice.indexOf(0); if (i >= 0) dice[i] = 1;
    }
    if (active.includes("insect") && legionsOf(unit.type).includes("insect")) {
      const i = dice.indexOf(2); if (i >= 0) dice[i] = 3;
    }
    return dice;
  }

  function renderSetup() {
    const grid = el("rosterGrid");
    grid.innerHTML = "";
    ROSTER.forEach((type) => {
      const data = def(type);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `roster-unit${state.chosen.includes(type) ? " is-selected" : ""}`;
      button.innerHTML = `<img alt="" src="${artPath(type)}"><strong>${data.label}</strong><small>${gradeLabel(data.grade)} · HP ${data.hp}</small>`;
      fallbackArt(button.querySelector("img"), type);
      button.addEventListener("click", () => toggleChosen(type));
      grid.appendChild(button);
    });
    const row = el("chosenRow");
    row.innerHTML = "";
    for (let i = 0; i < MAX_SQUAD; i += 1) {
      const type = state.chosen[i];
      const slot = document.createElement("div");
      slot.className = `chosen-slot${type ? " has-unit" : ""}`;
      if (type) {
        slot.innerHTML = `<img alt="" src="${artPath(type)}"><span>${def(type).label}</span>`;
        fallbackArt(slot.querySelector("img"), type);
      } else slot.textContent = "빈 자리";
      row.appendChild(slot);
    }
    el("startBattleButton").disabled = state.chosen.length < 1;
  }
  function gradeLabel(grade) {
    return ({ normal: "일반", advanced: "고급", hero: "영웅", special: "소환물" })[grade] || "지휘관";
  }
  function toggleChosen(type) {
    const index = state.chosen.indexOf(type);
    if (index >= 0) state.chosen.splice(index, 1);
    else if (state.chosen.length < MAX_SQUAD) state.chosen.push(type);
    else announce("출전은 4명까지");
    renderSetup(); tone("roll");
  }

  function fighterMarkup(unit) {
    return `<article class="fighter" id="fighter-${unit.id}" data-owner="${unit.owner}">
      <div class="status-stack"></div>
      <img class="fighter-art" src="${artPath(unit.type)}" alt="${def(unit.type).label}">
      <div class="fighter-name">${def(unit.type).label}</div>
      <div class="health-wrap"><i class="health-fill"></i></div>
    </article>`;
  }
  function renderArmies() {
    el("playerArmy").innerHTML = state.player.map(fighterMarkup).join("");
    el("enemyArmy").innerHTML = state.enemy.map(fighterMarkup).join("");
    [...state.player, ...state.enemy].forEach((unit) => {
      const node = document.getElementById(`fighter-${unit.id}`);
      fallbackArt(node.querySelector("img"), unit.type);
      node.addEventListener("click", () => selectRequestedTarget(unit.id));
    });
    renderStatus();
  }
  function renderStatus() {
    [...state.player, ...state.enemy].forEach((unit) => {
      const node = document.getElementById(`fighter-${unit.id}`);
      if (!node) return;
      node.querySelector(".health-fill").style.width = `${Math.max(0, unit.hp / unit.maxHp) * 100}%`;
      const statuses = [];
      if (unit.poison) statuses.push(`<span class="status-chip poison">독</span>`);
      if (unit.frozen) statuses.push(`<span class="status-chip freeze">빙결</span>`);
      node.querySelector(".status-stack").innerHTML = statuses.join("");
    });
    updateTeamHud("player", state.player);
    updateTeamHud("enemy", state.enemy);
    el("playerLegion").textContent = legionSummary(state.player);
    el("enemyLegion").textContent = legionSummary(state.enemy);
    el("roundText").textContent = String(state.round);
    el("soulMeter").style.width = `${state.soul}%`;
    el("soulText").textContent = `${state.soul} / 100`;
  }
  function updateTeamHud(owner, team) {
    const living = team.filter((u) => u.alive);
    const hp = team.reduce((sum, u) => sum + Math.max(0, u.hp), 0);
    const max = team.reduce((sum, u) => sum + u.maxHp, 0) || 1;
    el(`${owner}Count`).textContent = `${living.length} / ${team.length}`;
    el(`${owner}TeamHp`).style.width = `${hp / max * 100}%`;
  }
  function log(message) {
    state.feed.unshift(message); state.feed = state.feed.slice(0, 4);
    el("combatFeed").innerHTML = state.feed.map((line) => `<div class="feed-line">${line}</div>`).join("");
  }
  function announce(message) {
    const node = el("battleAnnouncer");
    node.textContent = message; node.classList.remove("show");
    void node.offsetWidth; node.classList.add("show");
  }

  function clearTargetRequest(result = null) {
    const request = state.targetRequest;
    if (!request) return;
    request.targetIds.forEach((id) => document.getElementById(`fighter-${id}`)?.classList.remove("is-targetable"));
    state.targetRequest = null;
    request.resolve(result);
  }
  function selectRequestedTarget(unitId) {
    const request = state.targetRequest;
    if (!request || !request.targetIds.includes(unitId)) return;
    const target = state.enemy.concat(state.player).find((unit) => unit.id === unitId && unit.alive) || null;
    clearTargetRequest(target);
  }
  function requestPlayerTarget(attacker, token) {
    const targets = state.enemy.filter((unit) => unit.alive);
    if (!targets.length || token !== state.battleId) return Promise.resolve(null);
    if (state.targetRequest) clearTargetRequest(null);
    announce("공격할 적을 선택하세요");
    el("turnState").textContent = `${def(attacker.type).label} · 대상 선택`;
    targets.forEach((target) => document.getElementById(`fighter-${target.id}`)?.classList.add("is-targetable"));
    return new Promise((resolve) => {
      state.targetRequest = { resolve, targetIds: targets.map((target) => target.id), token };
    });
  }
  function setDuelPose(attacker, target, active) {
    document.getElementById(`fighter-${attacker.id}`)?.classList.toggle("is-duel-attacker", active);
    document.getElementById(`fighter-${target.id}`)?.classList.toggle("is-duel-target", active);
  }
  function cancelPendingInteractions() {
    if (state.targetRequest) clearTargetRequest(null);
    const request = state.rollRequest;
    if (request) {
      request.cancelled = true; state.rollRequest = null; request.resolve(null);
    }
    el("centerDie").classList.remove("is-awaiting", "is-rolling");
    el("centerDie").hidden = true;
    document.querySelectorAll(".is-duel-attacker,.is-duel-target,.is-targetable").forEach((node) => {
      node.classList.remove("is-duel-attacker", "is-duel-target", "is-targetable");
    });
  }
  function showRoll(unit, manual) {
    const overlay = el("centerDie");
    const dieValue = el("dieValue");
    const dice = effectiveDice(unit);
    document.querySelectorAll("[data-die-face]").forEach((face, index) => { face.textContent = String(dice[index]); });
    dieValue.hidden = true; overlay.hidden = false;
    overlay.classList.toggle("is-awaiting", manual); overlay.classList.remove("is-rolling");
    el("dieCaption").textContent = manual ? `${def(unit.type).label} · 주사위를 터치하세요` : `${def(unit.type).label} 공격 주사위`;

    return new Promise((resolve) => {
      const request = { resolve, cancelled: false, rolling: false, token: state.battleId, roll: null };
      request.roll = () => {
        if (request.rolling || request.cancelled || request.token !== state.battleId || state.ended) return;
        request.rolling = true; overlay.classList.remove("is-awaiting"); overlay.classList.add("is-rolling"); tone("roll");
        const resultIndex = Math.floor(Math.random() * dice.length);
        const resultValue = dice[resultIndex];
        const landing = DIE_LANDING[resultIndex];
        el("dieCube").style.setProperty("--die-x", `${landing.x}deg`);
        el("dieCube").style.setProperty("--die-y", `${landing.y}deg`);
        setTimeout(() => {
          if (request.cancelled || request.token !== state.battleId || state.ended) return;
          overlay.classList.remove("is-rolling"); dieValue.textContent = String(resultValue); dieValue.hidden = false;
          el("dieCaption").textContent = `${def(unit.type).label} · ${resultValue}`;
          setTimeout(() => {
            if (request.cancelled) return;
            overlay.hidden = true; dieValue.hidden = true;
            if (state.rollRequest === request) state.rollRequest = null;
            resolve(resultValue);
          }, 380);
        }, 1080);
      };
      state.rollRequest = request;
      if (!manual) setTimeout(request.roll, 360 / state.speed);
    });
  }
  function positionOf(unit) {
    const node = document.getElementById(`fighter-${unit.id}`);
    const rect = node?.getBoundingClientRect();
    const parent = scene.getBoundingClientRect();
    return rect ? { x: rect.left - parent.left + rect.width / 2, y: rect.top - parent.top + rect.height * .55 } : { x: parent.width / 2, y: parent.height / 2 };
  }
  function floatingText(unit, text, className = "") {
    const p = positionOf(unit);
    const node = document.createElement("span");
    node.className = `damage-number ${className}`;
    node.textContent = text; node.style.left = `${p.x}px`; node.style.top = `${p.y}px`;
    el("impactLayer").appendChild(node); setTimeout(() => node.remove(), 900);
  }
  function slashAt(unit, color) {
    const p = positionOf(unit);
    const node = document.createElement("i");
    node.className = "slash-effect"; node.style.left = `${p.x}px`; node.style.top = `${p.y}px`; node.style.setProperty("--effect-color", color);
    el("impactLayer").appendChild(node); setTimeout(() => node.remove(), 500);
  }
  function activeNode(unit, className, duration = 430) {
    const node = document.getElementById(`fighter-${unit.id}`);
    if (!node) return;
    node.classList.add(className); setTimeout(() => node.classList.remove(className), duration / state.speed);
  }
  function statusImmune(unit) {
    return hasActiveLegion(unit, "element") && Math.random() < .5;
  }
  async function applyStartTurnStatus(unit) {
    if (unit.poison > 0 && unit.alive) {
      unit.poison = 0; unit.hp -= 1; activeNode(unit, "is-hit", 260); floatingText(unit, "-1 독"); tone("status");
      log(`${def(unit.type).label}이 중독 피해 1을 받았습니다.`); renderStatus(); await delay(350);
      if (unit.hp <= 0) await killUnit(unit);
    }
    if (!unit.alive) return false;
    if (unit.frozen > 0) {
      unit.frozen = 0; floatingText(unit, "빙결", "is-zero"); log(`${def(unit.type).label}은 빙결되어 행동하지 못했습니다.`); renderStatus(); await delay(360); return false;
    }
    return true;
  }
  async function killUnit(unit) {
    if (!unit.alive) return;
    unit.alive = false; unit.hp = 0; activeNode(unit, "is-dead", 700); tone("kill");
    if (unit.owner === "enemy") { state.kills += 1; state.soul = Math.min(100, state.soul + 25); }
    const p = positionOf(unit);
    setTimeout(() => {
      const corpse = document.createElement("i"); corpse.className = "corpse-mark"; corpse.textContent = "☠";
      corpse.style.left = `${p.x}px`; corpse.style.top = `${Math.min(scene.clientHeight - 25, p.y + 75)}px`; el("corpseLayer").appendChild(corpse);
    }, 380 / state.speed);
    log(`${def(unit.type).label}이 쓰러져 시체를 남겼습니다.`); renderStatus();
  }
  function chooseTarget(team) { return team.find((unit) => unit.alive) || null; }

  async function attack(attacker, target, isCounter = false) {
    if (!attacker.alive || !target?.alive || state.ended) return;
    el("turnState").textContent = `${def(attacker.type).label} ${isCounter ? "반격" : "공격"}`;
    const dice = effectiveDice(attacker);
    setDuelPose(attacker, target, true);
    await delay(220);
    if (!attacker.alive || !target.alive || state.ended) {
      setDuelPose(attacker, target, false);
      return;
    }
    const rolled = isCounter
      ? dice[Math.floor(Math.random() * dice.length)]
      : await showRoll(attacker, attacker.owner === "player");
    if (rolled == null || state.ended || !attacker.alive || !target.alive) {
      setDuelPose(attacker, target, false);
      return;
    }
    setDuelPose(attacker, target, false);
    activeNode(attacker, "is-active", 900); activeNode(attacker, "is-attacking", 430);
    const legionColor = LEGIONS[legionsOf(attacker.type)[0]]?.color || "#a66cff";
    const maximum = Math.max(...dice);
    const ultimate = ["advanced", "hero"].includes(def(attacker.type).grade) && rolled === maximum;
    if (ultimate) { scene.classList.add("is-ultimate"); announce(`${def(attacker.type).label} · 최대 일격`); await delay(240); }
    await delay(190);
    slashAt(target, legionColor); activeNode(target, "is-hit", 260); scene.classList.add("is-shaking"); setTimeout(() => scene.classList.remove("is-shaking"), 230);

    let damage = rolled;
    const frenzy = hasActiveLegion(attacker, "demon") && Math.random() < .3;
    if (frenzy) damage *= 2;
    target.hp -= damage; state.damage += attacker.owner === "player" ? damage : 0; state.actions += 1;
    floatingText(target, damage > 0 ? `-${damage}${frenzy ? " 폭주" : ""}` : "MISS", damage ? "" : "is-zero");
    tone(damage >= 3 ? "kill" : "hit");
    log(`${def(attacker.type).label} → ${def(target.type).label}: ${damage} 피해${frenzy ? " (폭주)" : ""}`);
    renderStatus(); await delay(310);
    if (ultimate) scene.classList.remove("is-ultimate");

    if (target.hp <= 0) { await killUnit(target); return; }
    if (damage >= 0 && hasActiveLegion(attacker, "plague") && Math.random() < .3) {
      if (statusImmune(target)) floatingText(target, "면역", "is-zero");
      else { target.poison = 1; floatingText(target, "중독", "is-zero"); log(`${def(target.type).label}에게 중독이 걸렸습니다.`); }
    }
    if (damage >= 0 && hasActiveLegion(attacker, "ice") && Math.random() < .3) {
      if (statusImmune(target)) floatingText(target, "면역", "is-zero");
      else { target.frozen = 1; floatingText(target, "빙결", "is-zero"); log(`${def(target.type).label}이 빙결됐습니다.`); }
    }
    renderStatus();
    if (!isCounter && target.alive && hasActiveLegion(target, "beast") && Math.random() < .3) {
      announce("야수 반격"); await delay(220); await attack(target, attacker, true);
    }
  }

  async function runBattle(token) {
    announce("전투 개시"); tone("start"); log("양 군단이 전장에 진입했습니다."); await delay(900, token);
    while (!state.ended && token === state.battleId) {
      el("roundText").textContent = String(state.round);
      const order = [];
      const length = Math.max(state.player.length, state.enemy.length);
      for (let i = 0; i < length; i += 1) {
        if (state.player[i]) order.push(state.player[i]);
        if (state.enemy[i]) order.push(state.enemy[i]);
      }
      for (const unit of order) {
        if (state.ended || token !== state.battleId) return;
        if (!unit.alive) continue;
        const canAct = await applyStartTurnStatus(unit);
        if (!canAct) { if (checkEnd()) return; continue; }
        const opponents = unit.owner === "player" ? state.enemy : state.player;
        const target = unit.owner === "player"
          ? await requestPlayerTarget(unit, token)
          : chooseTarget(opponents);
        if (token !== state.battleId || state.ended) return;
        if (!target) { checkEnd(); return; }
        await attack(unit, target);
        if (checkEnd()) return;
        await delay(180, token);
      }
      state.round += 1; renderStatus(); await delay(420, token);
      if (state.round > 40) { finishBattle("draw"); return; }
    }
  }
  function checkEnd() {
    const playerAlive = state.player.some((u) => u.alive);
    const enemyAlive = state.enemy.some((u) => u.alive);
    if (!playerAlive || !enemyAlive) { finishBattle(playerAlive ? "victory" : "defeat"); return true; }
    return false;
  }
  function finishBattle(result) {
    if (state.ended) return;
    state.ended = true; state.paused = false; cancelPendingInteractions(); el("pauseButton").textContent = "Ⅱ";
    const victory = result === "victory";
    announce(victory ? "승리" : result === "defeat" ? "패배" : "교착");
    setTimeout(() => {
      el("resultTitle").textContent = victory ? "전장을 지배했습니다" : result === "defeat" ? "군단이 무너졌습니다" : "전투가 끝나지 않았습니다";
      const survivors = state.player.filter((u) => u.alive);
      el("resultBody").textContent = victory ? `생존 유닛 ${survivors.length}명이 다음 원정으로 이동할 수 있습니다.` : "부대를 다시 구성해 전투를 재개하세요.";
      el("resultStats").innerHTML = `<article><span>경과 라운드</span><strong>${state.round}</strong></article><article><span>가한 피해</span><strong>${state.damage}</strong></article><article><span>획득 사령력</span><strong>${state.soul}</strong></article>`;
      el("resultOverlay").hidden = false;
    }, 850);
  }

  function startBattle() {
    cancelPendingInteractions();
    state.battleId += 1; const token = state.battleId;
    state.player = state.chosen.map((type, index) => createUnit(type, "player", index));
    state.enemy = ENEMY_SQUAD.slice(0, Math.max(3, state.chosen.length)).map((type, index) => createUnit(type, "enemy", index));
    state.round = 1; state.soul = 0; state.paused = false; state.ended = false; state.actions = 0; state.damage = 0; state.kills = 0; state.feed = [];
    applyOpeningLegions(state.player); applyOpeningLegions(state.enemy);
    el("corpseLayer").innerHTML = ""; el("impactLayer").innerHTML = ""; el("setupOverlay").hidden = true; el("resultOverlay").hidden = true;
    renderArmies(); runBattle(token);
  }
  function resetToSetup() {
    cancelPendingInteractions(); state.battleId += 1; state.ended = true; state.paused = false;
    el("centerDie").hidden = true; el("resultOverlay").hidden = true; el("setupOverlay").hidden = false;
    renderSetup();
  }

  el("startBattleButton").addEventListener("click", startBattle);
  el("restartButton").addEventListener("click", resetToSetup);
  el("dieStage").addEventListener("click", () => state.rollRequest?.roll());
  el("pauseButton").addEventListener("click", () => {
    if (state.ended) return;
    state.paused = !state.paused; el("pauseButton").textContent = state.paused ? "▶" : "Ⅱ"; el("pauseButton").classList.toggle("is-active", state.paused);
    el("turnState").textContent = state.paused ? "일시정지" : "전투 진행";
  });
  el("speedButton").addEventListener("click", () => {
    state.speed = state.speed === 1 ? 1.5 : state.speed === 1.5 ? 2 : 1;
    el("speedButton").textContent = `×${state.speed}`; el("speedButton").classList.toggle("is-active", state.speed > 1);
  });
  el("soundButton").addEventListener("click", () => {
    state.muted = !state.muted; el("soundButton").textContent = state.muted ? "×" : "♪"; el("soundButton").classList.toggle("is-active", state.muted);
  });

  renderSetup();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
  }
})();
