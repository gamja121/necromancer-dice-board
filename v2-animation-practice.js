(() => {
  "use strict";

  const SHEETS = {
    goblin: "art/v2-style/animation-practice/goblin-motion-sheet.jpg",
    minotaur: "art/v2-style/animation-practice/minotaur-motion-sheet.jpg"
  };

  const CROPS = {
    goblin: {
      idle: [1002, 58, 220, 182],
      attack: [
        [52, 43, 185, 190], [270, 44, 190, 190], [492, 48, 210, 188],
        [742, 54, 210, 180], [1001, 53, 210, 184]
      ],
      hit: [
        [55, 245, 185, 174], [287, 244, 190, 174], [526, 250, 190, 169], [769, 250, 190, 169]
      ],
      death: [
        [46, 438, 190, 193], [274, 444, 188, 185], [487, 443, 198, 187],
        [690, 448, 210, 180], [870, 467, 220, 160], [1041, 486, 226, 145]
      ]
    },
    minotaur: {
      idle: [1037, 42, 226, 184],
      attack: [
        [45, 28, 198, 199], [277, 27, 197, 199], [500, 31, 220, 196],
        [742, 41, 220, 188], [1009, 39, 235, 188]
      ],
      hit: [
        [46, 255, 207, 174], [281, 254, 210, 175], [526, 256, 205, 173], [779, 258, 210, 170]
      ],
      death: [
        [45, 459, 205, 194], [273, 454, 205, 196], [485, 469, 211, 184],
        [671, 484, 220, 169], [839, 505, 218, 145]
      ]
    }
  };

  const state = {
    ready: false,
    busy: false,
    auto: false,
    fighters: {
      goblin: { hp: 3, maxHp: 3, damage: 1 },
      minotaur: { hp: 5, maxHp: 5, damage: 2 }
    },
    frames: { goblin: {}, minotaur: {} }
  };

  const el = {
    status: document.querySelector("#battleStatus"),
    impact: document.querySelector("#impactFx"),
    reset: document.querySelector("#resetBtn"),
    auto: document.querySelector("#autoDemoBtn"),
    goblinAttack: document.querySelector("#goblinAttackBtn"),
    minotaurAttack: document.querySelector("#minotaurAttackBtn"),
    goblin: {
      root: document.querySelector("#goblinFighter"), sprite: document.querySelector("#goblinSprite"),
      hpText: document.querySelector("#goblinHpText"), hpBar: document.querySelector("#goblinHpBar")
    },
    minotaur: {
      root: document.querySelector("#minotaurFighter"), sprite: document.querySelector("#minotaurSprite"),
      hpText: document.querySelector("#minotaurHpText"), hpBar: document.querySelector("#minotaurHpBar")
    }
  };

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function cropFrame(sheet, rect) {
    const [sx, sy, sw, sh] = rect;
    const sample = document.createElement("canvas");
    sample.width = sw;
    sample.height = sh;
    const sctx = sample.getContext("2d", { willReadFrequently: true });
    sctx.drawImage(sheet, sx, sy, sw, sh, 0, 0, sw, sh);
    const pixels = sctx.getImageData(0, 0, sw, sh);
    let minX = sw, minY = sh, maxX = 0, maxY = 0;

    for (let y = 0; y < sh; y += 1) {
      for (let x = 0; x < sw; x += 1) {
        const i = (y * sw + x) * 4;
        const r = pixels.data[i];
        const g = pixels.data[i + 1];
        const b = pixels.data[i + 2];
        const whiteness = Math.min(r, g, b);
        const spread = Math.max(r, g, b) - whiteness;
        if (whiteness > 245 && spread < 8) pixels.data[i + 3] = 0;
        else if (whiteness > 224 && spread < 16) pixels.data[i + 3] = Math.max(0, 255 - (whiteness - 224) * 8);
        if (pixels.data[i + 3] > 24) {
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        }
      }
    }
    sctx.putImageData(pixels, 0, 0);

    const output = document.createElement("canvas");
    output.width = 384;
    output.height = 384;
    if (minX > maxX || minY > maxY) return output.toDataURL("image/png");
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    const scale = Math.min(332 / bw, 332 / bh);
    const dw = bw * scale;
    const dh = bh * scale;
    const dx = (384 - dw) / 2;
    const dy = 374 - dh;
    output.getContext("2d").drawImage(sample, minX, minY, bw, bh, dx, dy, dw, dh);
    return output.toDataURL("image/png");
  }

  async function prepareFrames() {
    for (const type of ["goblin", "minotaur"]) {
      const sheet = await loadImage(SHEETS[type]);
      state.frames[type].idle = cropFrame(sheet, CROPS[type].idle);
      for (const motion of ["attack", "hit", "death"]) {
        state.frames[type][motion] = CROPS[type][motion].map(rect => cropFrame(sheet, rect));
      }
    }
  }

  async function playFrames(type, motion, frameMs) {
    const frames = state.frames[type][motion];
    for (const frame of frames) {
      el[type].sprite.src = frame;
      await wait(frameMs);
    }
  }

  function setIdle(type) {
    el[type].sprite.src = state.frames[type].idle;
  }

  function updateHud() {
    for (const type of ["goblin", "minotaur"]) {
      const fighter = state.fighters[type];
      el[type].hpText.textContent = `${fighter.hp} / ${fighter.maxHp}`;
      el[type].hpBar.style.width = `${Math.max(0, fighter.hp / fighter.maxHp) * 100}%`;
      el[type].root.classList.toggle("is-dead", fighter.hp <= 0);
    }
    const alive = state.fighters.goblin.hp > 0 && state.fighters.minotaur.hp > 0;
    el.goblinAttack.disabled = !state.ready || state.busy || !alive;
    el.minotaurAttack.disabled = !state.ready || state.busy || !alive;
    el.auto.disabled = !state.ready || state.busy || !alive;
  }

  function burst() {
    el.impact.classList.remove("burst");
    void el.impact.offsetWidth;
    el.impact.classList.add("burst");
  }

  async function attack(attacker, target) {
    if (!state.ready || state.busy || state.fighters[attacker].hp <= 0 || state.fighters[target].hp <= 0) return;
    state.busy = true;
    updateHud();
    el.status.textContent = `${attacker === "goblin" ? "고블린 병사" : "미노타우르스"}가 공격합니다.`;
    el[attacker].root.classList.add("is-attacking");

    const attackFrames = state.frames[attacker].attack;
    const impactIndex = Math.min(3, attackFrames.length - 1);
    for (let i = 0; i < attackFrames.length; i += 1) {
      el[attacker].sprite.src = attackFrames[i];
      if (i === impactIndex) {
        burst();
        el[target].root.classList.add("is-hit");
        state.fighters[target].hp = Math.max(0, state.fighters[target].hp - state.fighters[attacker].damage);
        updateHud();
        if (state.fighters[target].hp > 0) playFrames(target, "hit", 92).then(() => setIdle(target));
      }
      await wait(attacker === "minotaur" ? 132 : 112);
    }

    el[attacker].root.classList.remove("is-attacking");
    el[target].root.classList.remove("is-hit");
    setIdle(attacker);
    if (state.fighters[target].hp <= 0) {
      el.status.textContent = `${target === "goblin" ? "고블린 병사" : "미노타우르스"}가 쓰러졌습니다.`;
      await playFrames(target, "death", target === "minotaur" ? 145 : 125);
    } else {
      el.status.textContent = `${state.fighters[attacker].damage} 피해. 다음 공격을 선택하세요.`;
    }
    state.busy = false;
    updateHud();
  }

  function resetBattle() {
    state.auto = false;
    state.busy = false;
    state.fighters.goblin.hp = state.fighters.goblin.maxHp;
    state.fighters.minotaur.hp = state.fighters.minotaur.maxHp;
    for (const type of ["goblin", "minotaur"]) {
      el[type].root.className = `fighter ${type === "goblin" ? "fighter-player" : "fighter-enemy"}`;
      if (state.ready) setIdle(type);
    }
    el.status.textContent = state.ready ? "공격 버튼으로 세 가지 모션을 확인하세요." : "모션 시트를 준비하고 있습니다.";
    updateHud();
  }

  async function autoDemo() {
    if (state.busy) return;
    resetBattle();
    state.auto = true;
    while (state.auto && state.fighters.goblin.hp > 0 && state.fighters.minotaur.hp > 0) {
      await attack("goblin", "minotaur");
      await wait(380);
      if (state.fighters.minotaur.hp <= 0 || !state.auto) break;
      await attack("minotaur", "goblin");
      await wait(420);
    }
    state.auto = false;
  }

  el.goblinAttack.addEventListener("click", () => attack("goblin", "minotaur"));
  el.minotaurAttack.addEventListener("click", () => attack("minotaur", "goblin"));
  el.auto.addEventListener("click", autoDemo);
  el.reset.addEventListener("click", resetBattle);

  prepareFrames().then(() => {
    state.ready = true;
    resetBattle();
  }).catch(error => {
    console.error(error);
    el.status.textContent = "모션 시트를 불러오지 못했습니다.";
  });
})();
