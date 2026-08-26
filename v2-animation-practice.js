(() => {
  "use strict";
  const BATTLEFIELDS = [
    { name: "황무지 협곡", image: "art/v2-style/battle-backgrounds/uploaded-raw/wasteland-chasm-battlefield.jpg" },
    { name: "유령 숲 유적", image: "art/v2-style/battle-backgrounds/uploaded-raw/haunted-forest-ruins-battlefield.jpg" },
    { name: "사령 피라미드", image: "art/v2-style/battle-backgrounds/uploaded-raw/necropolis-pyramids-battlefield.jpg" }
  ];
  const SOURCES = Object.freeze({
    jpg: "art/v2-style/animation-test-crops/ghoul-magenta-jpg-test-v3/",
    png: "art/v2-style/animation-test-crops/ghoul-magenta-png-test/"
  });
  const FRAME_COUNTS = Object.freeze({ attack: 5, hit: 4, death: 6 });
  const FRAME_MS = Object.freeze({ attack: 120, hit: 110, death: 145 });
  const MOTION_LABELS = Object.freeze({ attack: "공격", hit: "피격", death: "사망" });
  const frameSets = {};
  const state = { busy: false, token: 0, battlefield: -1 };
  const el = {
    stage: document.querySelector("#motionStage"), jpg: document.querySelector("#jpgSprite"), png: document.querySelector("#pngSprite"),
    counter: document.querySelector("#frameCounter"), status: document.querySelector("#motionStatus"),
    attack: document.querySelector("#attackBtn"), hit: document.querySelector("#hitBtn"), death: document.querySelector("#deathBtn"),
    reset: document.querySelector("#resetBtn"), battlefield: document.querySelector("#battlefieldBtn")
  };
  function pathFor(source, motion, index) { return `${SOURCES[source]}${motion}-${String(index + 1).padStart(2, "0")}.png`; }
  function buildFrames(source) {
    const frames = {};
    Object.entries(FRAME_COUNTS).forEach(([motion, count]) => {
      frames[motion] = Array.from({ length: count }, (_, index) => pathFor(source, motion, index));
    });
    frames.idle = frames.attack[0];
    return frames;
  }
  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image(); image.onload = resolve; image.onerror = () => reject(new Error(`이미지 불러오기 실패: ${url}`)); image.src = url;
    });
  }
  function setButtons(disabled) { [el.attack, el.hit, el.death, el.reset].forEach((button) => { button.disabled = disabled; }); }
  function setIdle() {
    el.jpg.src = frameSets.jpg.idle; el.png.src = frameSets.png.idle;
    el.jpg.className = ""; el.png.className = ""; el.counter.textContent = "대기 자세";
  }
  function selectBattlefield(forceNext = false) {
    let index = Math.floor(Math.random() * BATTLEFIELDS.length);
    if (forceNext && index === state.battlefield) index = (index + 1) % BATTLEFIELDS.length;
    state.battlefield = index;
    const field = BATTLEFIELDS[index]; el.stage.style.backgroundImage = `url("${field.image}")`; el.stage.dataset.battlefield = field.name;
  }
  async function prepare() {
    frameSets.jpg = buildFrames("jpg"); frameSets.png = buildFrames("png");
    const urls = ["jpg", "png"].flatMap((source) => [...frameSets[source].attack, ...frameSets[source].hit, ...frameSets[source].death]);
    await Promise.all(urls.map(loadImage));
    setIdle(); setButtons(false); el.status.textContent = "버튼을 누르면 JPG와 PNG가 동시에 재생됩니다.";
  }
  async function playMotion(motion) {
    if (state.busy) return;
    const token = ++state.token; const label = MOTION_LABELS[motion]; const total = FRAME_COUNTS[motion];
    state.busy = true; setButtons(true); el.jpg.className = `motion-${motion}`; el.png.className = `motion-${motion}`;
    el.status.textContent = `${label} 모션 동시 비교 중`;
    for (let index = 0; index < total; index += 1) {
      if (token !== state.token) return;
      el.jpg.src = frameSets.jpg[motion][index]; el.png.src = frameSets.png[motion][index];
      el.counter.textContent = `${label} ${index + 1} / ${total}`;
      await new Promise((resolve) => setTimeout(resolve, FRAME_MS[motion]));
    }
    if (token !== state.token) return;
    state.busy = false; setButtons(false);
    if (motion !== "death") setIdle();
    el.status.textContent = `${label} 비교 완료`;
  }
  function reset() {
    state.token += 1; state.busy = false; setIdle(); setButtons(false); el.status.textContent = "대기 자세로 돌아왔습니다.";
  }
  el.attack.addEventListener("click", () => playMotion("attack"));
  el.hit.addEventListener("click", () => playMotion("hit"));
  el.death.addEventListener("click", () => playMotion("death"));
  el.reset.addEventListener("click", reset);
  el.battlefield.addEventListener("click", () => selectBattlefield(true));
  selectBattlefield();
  prepare().catch((error) => { console.error(error); el.status.textContent = "비교 이미지를 불러오지 못했습니다."; });
})();
