(() => {
  "use strict";
  const BATTLEFIELDS = [
    { name: "황무지 협곡", image: "art/v2-style/battle-backgrounds/uploaded-raw/wasteland-chasm-battlefield.jpg" },
    { name: "유령 숲 유적", image: "art/v2-style/battle-backgrounds/uploaded-raw/haunted-forest-ruins-battlefield.jpg" },
    { name: "사령 피라미드", image: "art/v2-style/battle-backgrounds/uploaded-raw/necropolis-pyramids-battlefield.jpg" }
  ];
  const UNITS = Object.freeze({
    "goblin-soldier": { name: "고블린 병사", runtimeSheet: true, counts: { attack: 6, hit: 4, death: 5 } },
    "ice-princess": { name: "얼음 공주", runtimeSheet: true, counts: { attack: 6, hit: 4, death: 5 } },
    "bone-golem": { name: "핏빛 해골", runtimeSheet: true, counts: { attack: 5, hit: 4, death: 5 } },
    "guardian-seed": { name: "수호 씨앗", runtimeSheet: true, isSummon: true, canAttack: false, attackLabel: "개화", counts: { attack: 5, hit: 3, death: 4 } },
    "abyss-harpy": { name: "심연 하피", runtimeSheet: true, counts: { attack: 4, hit: 4, death: 5 } },
    "hydra": { name: "히드라", runtimeSheet: true, counts: { attack: 5, hit: 4, death: 6 } },
    "bone-hound": { name: "뼈 사냥개", runtimeSheet: true, counts: { attack: 5, hit: 4, death: 6 } },
    "scorpion-knight": { name: "전갈 기사", runtimeSheet: true, counts: { attack: 5, hit: 3, death: 5 } },
    "hell-mantis": { name: "지옥 사마귀", runtimeSheet: true, counts: { attack: 5, hit: 4, death: 6 } },
    "death-knight": { name: "데스나이트", root: "art/v2-style/animation-test-frames/death-knight/", counts: { attack: 5, hit: 4, death: 6 } },
    "skeleton-spear": { name: "해골 창병", root: "art/v2-style/animation-test-frames/skeleton-spear/", counts: { attack: 5, hit: 4, death: 5 } },
    "ancient-treant": { name: "고대 트렌트", root: "art/v2-style/animation-test-frames/ancient-treant/", counts: { attack: 5, hit: 4, death: 6 } },
    "stone-golem": { name: "암석 골렘", root: "art/v2-style/animation-test-frames/stone-golem/", counts: { attack: 5, hit: 4, death: 5 } },
    "goblin-rider": { name: "고블린 라이더", root: "art/v2-style/animation-test-frames/goblin-rider/", counts: { attack: 5, hit: 4, death: 5 } },
    "orc-warrior": { name: "오크 전사", root: "art/v2-style/animation-test-frames/orc-warrior/", counts: { attack: 5, hit: 4, death: 5 } },
    "boulder-ogre": { name: "오우거", root: "art/v2-style/animation-test-frames/boulder-ogre/", counts: { attack: 5, hit: 4, death: 5 } },
    "goblin-commoner": { name: "평민고블린", root: "art/v2-style/animation-test-frames/goblin-commoner/", counts: { attack: 5, hit: 4, death: 6 } },
    "ice-lord": { name: "얼음 군주", root: "art/v2-style/animation-test-frames/ice-lord/", counts: { attack: 5, hit: 4, death: 6 } },
    "yeti": { name: "설인", root: "art/v2-style/animation-test-frames/yeti/", counts: { attack: 6, hit: 4, death: 7 } },
    "ghoul": { name: "구울", root: "art/v2-style/animation-test-frames/ghoul/", counts: { attack: 5, hit: 4, death: 6 } },
    "minotaur": { name: "미노타우로스", root: "art/v2-style/animation-test-frames/minotaur/", counts: { attack: 6, hit: 4, death: 6 } },
    "skeleton-cavalry": { name: "해골 기사", root: "art/v2-style/animation-test-frames/skeleton-cavalry/", counts: { attack: 5, hit: 4, death: 6 } },
    "soul-reaper": { name: "영혼 수확자", root: "art/v2-style/animation-test-frames/soul-reaper/", counts: { attack: 6, hit: 4, death: 6 } },
    "mummy-guardian": { name: "미라 수호병", root: "art/v2-style/animation-test-frames/mummy-guardian/", counts: { attack: 5, hit: 4, death: 5 } },
    "doom-executor": { name: "석상 가고일", root: "art/v2-style/animation-test-frames/doom-executor/", counts: { attack: 5, hit: 4, death: 5 } },
    "plague-frog": { name: "역병 개구리", root: "art/v2-style/animation-test-frames/plague-frog/", counts: { attack: 5, hit: 4, death: 5 } },
    "plague-doctor": { name: "역병술사", root: "art/v2-style/animation-test-frames/plague-doctor/", counts: { attack: 5, hit: 4, death: 5 } },
    "goblin-chief": { name: "고블린족장", root: "art/v2-style/animation-test-frames/goblin-chief/", counts: { attack: 5, hit: 4, death: 5 } },
    "grave-priest": { name: "묘지 사제", root: "art/v2-style/animation-test-frames/grave-priest/", counts: { attack: 5, hit: 4, death: 6 } },
    "forest-fairy": { name: "숲 요정", root: "art/v2-style/animation-test-frames/forest-fairy/", counts: { attack: 5, hit: 4, death: 7 } },
    "mushroom-soldier": { name: "버섯 병사", root: "art/v2-style/animation-test-frames/mushroom-soldier/", counts: { attack: 5, hit: 4, death: 6 } },
    "spider-knight": { name: "거미여왕", root: "art/v2-style/animation-test-frames/spider-knight/", counts: { attack: 5, hit: 4, death: 5 } },
    "skeleton-archer": { name: "해골 궁수", root: "art/v2-style/animation-test-frames/skeleton-archer/", counts: { attack: 5, hit: 4, death: 6 } },
    "sea-wolf": { name: "바다 늑대", root: "art/v2-style/animation-test-frames/sea-wolf/", counts: { attack: 5, hit: 4, death: 6 } },
    "abyss-eye": { name: "외눈 괴물", root: "art/v2-style/animation-test-frames/abyss-eye/", counts: { attack: 5, hit: 4, death: 6 } },
    "kraken": { name: "크라켄", root: "art/v2-style/animation-test-frames/kraken/", counts: { attack: 5, hit: 4, death: 6 } },
    "raging-treant": { name: "분노한 고목", root: "art/v2-style/animation-test-frames/raging-treant/", counts: { attack: 5, hit: 4, death: 6 } },
    "crystal-devourer": { name: "결정 포식화", root: "art/v2-style/animation-test-frames/crystal-devourer/", counts: { attack: 5, hit: 4, death: 7 } },
    "grave-worm": { name: "역병 벌레", root: "art/v2-style/animation-test-frames/grave-worm/", counts: { attack: 5, hit: 4, death: 6 } },
    "siren": { name: "세이렌", root: "art/v2-style/animation-test-frames/siren/", counts: { attack: 5, hit: 4, death: 7 } },
    "mimic": { name: "미믹", root: "art/v2-style/animation-test-frames/mimic/", counts: { attack: 5, hit: 4, death: 6 } },
    "cerberus": { name: "케르베로스", root: "art/v2-style/animation-test-frames/cerberus/", counts: { attack: 5, hit: 4, death: 6 } },
    "spiderling": { name: "새끼거미", root: "art/v2-style/animation-test-frames/spiderling/", counts: { attack: 5, hit: 4, death: 6 } },
    "flesh-golem": { name: "누더기 포식자", root: "art/v2-style/animation-test-frames/flesh-golem/", counts: { attack: 5, hit: 5, death: 5 }, deathFrames: [1, 2, 3, 5, 6] }
  });
  const FRAME_MS = Object.freeze({ attack: 145, hit: 135, death: 175 });
  const MOTION_LABELS = Object.freeze({ attack: "공격", hit: "피격", death: "사망" });
  const frameSets = {};
  const state = { busy: false, token: 0, battlefield: -1, unit: "death-knight" };
  const el = {
    stage: document.querySelector("#motionStage"), sprite: document.querySelector("#unitSprite"),
    counter: document.querySelector("#frameCounter"), status: document.querySelector("#motionStatus"),
    attack: document.querySelector("#attackBtn"), hit: document.querySelector("#hitBtn"), death: document.querySelector("#deathBtn"),
    reset: document.querySelector("#resetBtn"), battlefield: document.querySelector("#battlefieldBtn"),
    effect: document.querySelector("#hitEffectBtn"), effectSprite: document.querySelector("#hitEffectSprite"),
    claw: document.querySelector("#clawEffectBtn"),
    unitName: document.querySelector("#unitName"), unitButtons: [...document.querySelectorAll(".unit-button")]
  };
  function pathFor(motion, index) {
    const unit = UNITS[state.unit];
    const frameNumber = motion === "death" && unit.deathFrames ? unit.deathFrames[index] : index + 1;
    return `${unit.root}${motion}-${String(frameNumber).padStart(2, "0")}.png`;
  }
  function buildFrames() {
    Object.entries(UNITS[state.unit].counts).forEach(([motion, count]) => {
      frameSets[motion] = Array.from({ length: count }, (_, index) => pathFor(motion, index));
    });
    frameSets.idle = frameSets.attack[0];
  }
  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = () => reject(new Error(`이미지 불러오기 실패: ${url}`));
      image.src = url;
    });
  }
  function setButtons(disabled) { [el.attack, el.hit, el.death, el.reset, el.effect, el.claw].forEach((button) => { button.disabled = disabled; }); }
  function setIdle() {
    el.sprite.src = frameSets.idle;
    el.sprite.className = "";
    el.sprite.style.transform = "";
    el.sprite.style.transformOrigin = "";
    el.counter.textContent = "대기 자세";
  }
  function selectBattlefield(forceNext = false) {
    let index = Math.floor(Math.random() * BATTLEFIELDS.length);
    if (forceNext && index === state.battlefield) index = (index + 1) % BATTLEFIELDS.length;
    state.battlefield = index;
    const field = BATTLEFIELDS[index];
    el.stage.style.backgroundImage = `url("${field.image}")`;
    el.stage.dataset.battlefield = field.name;
  }
  async function prepare() {
    const unit = state.unit, token = state.token;
    if (UNITS[unit].runtimeSheet) {
      const prepared = unit === "goblin-soldier" ? await V2GoblinFrames.prepare() : unit === "ice-princess" ? await V2PrincessFrames.prepare() : unit === "bone-golem" ? await V2BloodFrames.prepare() : unit === "guardian-seed" ? await V2SeedFrames.prepare() : unit === "abyss-harpy" ? await V2HarpyFrames.prepare() : unit === "hydra" ? await V2HydraFrames.prepare() : unit === "bone-hound" ? await V2HoundFrames.prepare()
        : unit === "scorpion-knight" ? await V2ScorpionFrames.prepare() : await V2MantisFrames.prepare();
      if (token !== state.token || unit !== state.unit) return;
      Object.assign(frameSets, prepared);
    } else buildFrames();
    const urls = [...frameSets.attack, ...frameSets.hit, ...frameSets.death];
    await Promise.all(urls.map(loadImage));
    if (token !== state.token || unit !== state.unit) return;
    setIdle();
    setButtons(false);
    el.attack.textContent = UNITS[unit].attackLabel ? "공격 모션 · 개화 테스트" : "⚔ 공격 모션";
    el.status.textContent = UNITS[unit].isSummon ? "공격하지 않는 소환물 · 공격 버튼은 개화 연출 테스트입니다." : `버튼을 누르면 ${UNITS[state.unit].name} 모션이 재생됩니다.`;
  }
  async function selectUnit(unit) {
    if (!UNITS[unit] || state.busy || unit === state.unit) return;
    state.token += 1;
    state.unit = unit;
    setButtons(true);
    el.unitName.textContent = UNITS[unit].name;
    el.unitButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.unit === unit));
    el.status.textContent = `${UNITS[unit].name} 프레임을 불러오고 있습니다.`;
    try { await prepare(); }
    catch (error) {
      console.error(error);
      el.status.textContent = `${UNITS[unit].name} 프레임을 불러오지 못했습니다.`;
    }
  }
  async function playMotion(motion) {
    if (state.busy || el.attack.disabled) return;
    const token = ++state.token;
    const label = motion === "attack" && UNITS[state.unit].attackLabel ? UNITS[state.unit].attackLabel : MOTION_LABELS[motion];
    const frames = frameSets[motion];
    state.busy = true;
    setButtons(true);
    el.sprite.className = `motion-${motion}`;
    el.status.textContent = `${label} 모션 재생 중`;
    for (let index = 0; index < frames.length; index += 1) {
      if (token !== state.token) return;
      el.sprite.src = frames[index];
      const deathKnightScale = state.unit === "death-knight" && motion === "attack"
        && (index === 1 || index === 2) ? 1.1 : 1;
      const boulderOgreScale = state.unit === "boulder-ogre" && motion === "attack"
        && index === 1 ? 1.3 : 1;
      const frameScale = Math.max(deathKnightScale, boulderOgreScale);
      el.sprite.style.transform = frameScale > 1 ? `scale(${frameScale})` : "";
      el.sprite.style.transformOrigin = frameScale > 1 ? "center bottom" : "";
      el.counter.textContent = `${label} ${index + 1} / ${frames.length}`;
      await new Promise((resolve) => setTimeout(resolve, FRAME_MS[motion]));
    }
    if (token !== state.token) return;
    state.busy = false;
    setButtons(false);
    if (motion !== "death") setIdle();
    el.status.textContent = `${label} 모션 완료`;
  }
  async function playHitEffect(id = "physical") {
    if (state.busy || el.effect.disabled) return;
    const token = ++state.token;
    const label = V2HitEffects.EFFECTS[id].name;
    state.busy = true;
    setButtons(true);
    el.status.textContent = `${label} 효과를 불러오는 중`;
    try {
      const effects = await V2HitEffects.prepare(id);
      await Promise.all(effects.map(loadImage));
      if (token !== state.token) return;
      const duration = Math.max(frameSets.hit.length * FRAME_MS.hit, effects.length * 65);
      const timeline = [...new Set([0, duration,
        ...frameSets.hit.map((_, i) => i * FRAME_MS.hit),
        ...Array.from({ length: effects.length + 1 }, (_, i) => i * 65)
      ])].sort((a, b) => a - b);
      el.sprite.className = "motion-hit";
      el.sprite.style.transform = "";
      el.status.textContent = `${label} · 피격 효과 테스트`;
      for (let step = 0; step < timeline.length - 1; step++) {
        const elapsed = timeline[step];
        if (token !== state.token) return;
        if (elapsed % FRAME_MS.hit === 0) {
          const index = Math.floor(elapsed / FRAME_MS.hit);
          if (index < frameSets.hit.length) el.sprite.src = frameSets.hit[index];
        }
        if (elapsed % 65 === 0) {
          const index = Math.floor(elapsed / 65);
          el.effectSprite.hidden = index >= effects.length;
          if (index < effects.length) {
            el.effectSprite.src = effects[index];
            el.counter.textContent = `${label} ${index + 1} / ${effects.length}`;
          }
        }
        await new Promise(resolve => setTimeout(resolve, timeline[step + 1] - elapsed));
      }
      if (token === state.token) el.status.textContent = `${label} 테스트 완료`;
    } catch (error) {
      console.error(error);
      if (token === state.token) el.status.textContent = "타격 효과를 불러오지 못했습니다. 다시 눌러주세요.";
    } finally {
      if (token === state.token) {
        el.effectSprite.hidden = true;
        state.busy = false;
        setIdle();
        setButtons(false);
      }
    }
  }
  function reset() {
    state.token += 1;
    state.busy = false;
    el.effectSprite.hidden = true;
    setIdle();
    setButtons(false);
    el.status.textContent = "대기 자세로 돌아왔습니다.";
  }
  el.attack.addEventListener("click", () => playMotion("attack"));
  el.hit.addEventListener("click", () => playMotion("hit"));
  el.effect.addEventListener("click", () => playHitEffect("physical"));
  el.claw.addEventListener("click", () => playHitEffect("claw"));
  el.death.addEventListener("click", () => playMotion("death"));
  el.reset.addEventListener("click", reset);
  el.battlefield.addEventListener("click", () => selectBattlefield(true));
  el.unitButtons.forEach((button) => button.addEventListener("click", () => selectUnit(button.dataset.unit)));
  selectBattlefield();
  const requestedUnit = new URLSearchParams(window.location.search).get("unit");
  if (UNITS[requestedUnit]) {
    state.unit = requestedUnit;
    el.unitName.textContent = UNITS[requestedUnit].name;
    el.unitButtons.forEach(button => button.classList.toggle("is-active", button.dataset.unit === requestedUnit));
  }
  prepare().catch((error) => {
    console.error(error);
    el.status.textContent = "유닛 프레임을 불러오지 못했습니다.";
  });
})();
