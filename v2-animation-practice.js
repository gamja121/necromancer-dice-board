(() => {
  "use strict";
  const BATTLEFIELDS = [
    { name: "황무지 협곡", image: "art/v2-style/battle-backgrounds/uploaded-raw/wasteland-chasm-battlefield.jpg" },
    { name: "유령 숲 유적", image: "art/v2-style/battle-backgrounds/uploaded-raw/haunted-forest-ruins-battlefield.jpg" },
    { name: "사령 피라미드", image: "art/v2-style/battle-backgrounds/uploaded-raw/necropolis-pyramids-battlefield.jpg" }
  ];
  const UNITS = Object.freeze({
    "death-knight": { name: "데스나이트", root: "art/v2-style/animation-test-frames/death-knight/", counts: { attack: 5, hit: 4, death: 6 } },
    "skeleton-spear": { name: "해골 창병", root: "art/v2-style/animation-test-frames/skeleton-spear/", counts: { attack: 5, hit: 4, death: 5 } },
    "ancient-treant": { name: "고대 트렌트", root: "art/v2-style/animation-test-frames/ancient-treant/", counts: { attack: 5, hit: 4, death: 6 } },
    "stone-golem": { name: "암석 골렘", root: "art/v2-style/animation-test-frames/stone-golem/", counts: { attack: 5, hit: 4, death: 5 } },
    "goblin-rider": { name: "고블린 라이더", root: "art/v2-style/animation-test-frames/goblin-rider/", counts: { attack: 5, hit: 4, death: 5 } },
    "orc-warrior": { name: "오크 전사", root: "art/v2-style/animation-test-frames/orc-warrior/", counts: { attack: 5, hit: 4, death: 6 } }
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
    unitName: document.querySelector("#unitName"), unitButtons: [...document.querySelectorAll(".unit-button")]
  };
  function pathFor(motion, index) { return `${UNITS[state.unit].root}${motion}-${String(index + 1).padStart(2, "0")}.png`; }
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
  function setButtons(disabled) { [el.attack, el.hit, el.death, el.reset].forEach((button) => { button.disabled = disabled; }); }
  function setIdle() {
    el.sprite.src = frameSets.idle;
    el.sprite.className = "";
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
    buildFrames();
    const urls = [...frameSets.attack, ...frameSets.hit, ...frameSets.death];
    await Promise.all(urls.map(loadImage));
    setIdle();
    setButtons(false);
    el.status.textContent = `버튼을 누르면 ${UNITS[state.unit].name} 모션이 재생됩니다.`;
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
    if (state.busy) return;
    const token = ++state.token;
    const label = MOTION_LABELS[motion];
    const frames = frameSets[motion];
    state.busy = true;
    setButtons(true);
    el.sprite.className = `motion-${motion}`;
    el.status.textContent = `${label} 모션 재생 중`;
    for (let index = 0; index < frames.length; index += 1) {
      if (token !== state.token) return;
      el.sprite.src = frames[index];
      el.counter.textContent = `${label} ${index + 1} / ${frames.length}`;
      await new Promise((resolve) => setTimeout(resolve, FRAME_MS[motion]));
    }
    if (token !== state.token) return;
    state.busy = false;
    setButtons(false);
    if (motion !== "death") setIdle();
    el.status.textContent = `${label} 모션 완료`;
  }
  function reset() {
    state.token += 1;
    state.busy = false;
    setIdle();
    setButtons(false);
    el.status.textContent = "대기 자세로 돌아왔습니다.";
  }
  el.attack.addEventListener("click", () => playMotion("attack"));
  el.hit.addEventListener("click", () => playMotion("hit"));
  el.death.addEventListener("click", () => playMotion("death"));
  el.reset.addEventListener("click", reset);
  el.battlefield.addEventListener("click", () => selectBattlefield(true));
  el.unitButtons.forEach((button) => button.addEventListener("click", () => selectUnit(button.dataset.unit)));
  selectBattlefield();
  prepare().catch((error) => {
    console.error(error);
    el.status.textContent = "유닛 프레임을 불러오지 못했습니다.";
  });
})();
