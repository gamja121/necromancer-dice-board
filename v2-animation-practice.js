(() => {
  "use strict";

  const BATTLEFIELDS = [
    { name: "황무지 협곡", image: "art/v2-style/battle-backgrounds/uploaded-raw/wasteland-chasm-battlefield.jpg" },
    { name: "유령 숲 유적", image: "art/v2-style/battle-backgrounds/uploaded-raw/haunted-forest-ruins-battlefield.jpg" },
    { name: "사령 피라미드", image: "art/v2-style/battle-backgrounds/uploaded-raw/necropolis-pyramids-battlefield.jpg" }
  ];
  const GRADE_LABELS = { normal: "일반", advanced: "고급", hero: "영웅", special: "특수" };
  const MOTION_LABELS = { attack: "공격", hit: "피격", death: "사망" };
  const units = window.V2Motion.registeredTypes().filter((type) => window.UNIT_TYPES[type]);
  const state = { type: "ghoul", token: 0, busy: false, battlefield: -1 };
  const el = {
    select: document.querySelector("#unitSelect"), previous: document.querySelector("#prevUnitBtn"),
    next: document.querySelector("#nextUnitBtn"), sprite: document.querySelector("#unitSprite"),
    name: document.querySelector("#unitName"), grade: document.querySelector("#unitGrade"),
    counter: document.querySelector("#frameCounter"), status: document.querySelector("#motionStatus"),
    count: document.querySelector("#unitCount"), stage: document.querySelector("#motionStage"),
    attack: document.querySelector("#attackBtn"), hit: document.querySelector("#hitBtn"),
    death: document.querySelector("#deathBtn"), reset: document.querySelector("#resetBtn"),
    battlefield: document.querySelector("#battlefieldBtn")
  };

  function definition(type) { return window.UNIT_TYPES[type] || {}; }
  function artCandidates(type) {
    const file = String(definition(type).image || "assets/skeleton-spear.jpg").split("/").pop().replace(/\.jpg$/i, ".png");
    return [`art/v2-style/processed/192/${file}?v=20260825-originals1`, `art/processed/192/${file}`, definition(type).image];
  }
  function showStaticArt(type) {
    const candidates = artCandidates(type).filter(Boolean); let index = 0;
    el.sprite.onerror = () => {
      index += 1;
      if (index >= candidates.length) { el.sprite.onerror = null; return; }
      el.sprite.src = candidates[index];
    };
    el.sprite.src = candidates[0];
  }
  function setButtons(disabled) {
    [el.attack, el.hit, el.death, el.reset, el.previous, el.next, el.select].forEach((control) => { control.disabled = disabled; });
  }
  function selectBattlefield(forceNext = false) {
    let index = Math.floor(Math.random() * BATTLEFIELDS.length);
    if (forceNext && index === state.battlefield) index = (index + 1) % BATTLEFIELDS.length;
    state.battlefield = index;
    const field = BATTLEFIELDS[index];
    el.stage.style.backgroundImage = `linear-gradient(#100b0b55, #100b0b77), url("${field.image}")`;
    el.stage.dataset.battlefield = field.name;
  }
  function populateUnits() {
    units.forEach((type) => {
      const option = document.createElement("option");
      option.value = type; option.textContent = definition(type).label || type;
      el.select.append(option);
    });
    if (!units.includes(state.type)) state.type = units[0];
    el.select.value = state.type;
  }
  async function selectUnit(type) {
    if (!window.V2Motion.supports(type)) return;
    const token = ++state.token; state.type = type; state.busy = true;
    delete el.sprite.dataset.motionPlayId;
    el.select.value = type; setButtons(true); showStaticArt(type);
    const data = definition(type); const index = units.indexOf(type);
    el.name.textContent = data.label || type;
    el.grade.textContent = GRADE_LABELS[data.grade] || "특수";
    el.grade.dataset.grade = data.grade || "special";
    el.count.textContent = `${index + 1} / ${units.length}`;
    el.counter.textContent = "준비 중";
    el.status.textContent = `${data.label || type} 모션을 불러오고 있습니다.`;
    try {
      const frames = await window.V2Motion.prepare(type);
      if (token !== state.token) return;
      el.sprite.onerror = null; el.sprite.src = frames.idle;
      el.sprite.classList.add("is-motion-sprite");
      el.counter.textContent = "대기 자세";
      el.status.textContent = "아래 버튼을 눌러 모션을 확인하세요.";
    } catch (error) {
      console.error(error);
      if (token !== state.token) return;
      el.counter.textContent = "불러오기 실패";
      el.status.textContent = "이 유닛의 모션 파일을 불러오지 못했습니다.";
    } finally {
      if (token === state.token) { state.busy = false; setButtons(false); }
    }
  }
  async function playMotion(motion) {
    if (state.busy) return;
    const token = ++state.token; const type = state.type; const label = MOTION_LABELS[motion];
    state.busy = true; setButtons(true); delete el.sprite.dataset.motionPlayId;
    el.sprite.className = `is-motion-sprite motion-${motion}`;
    el.status.textContent = `${definition(type).label} ${label} 모션 재생 중`;
    el.counter.textContent = `${label} 준비`;
    const played = await window.V2Motion.play(type, el.sprite, motion, {
      guard: () => token === state.token,
      onFrame: (index, total) => { el.counter.textContent = `${label} ${index + 1} / ${total}`; }
    }).catch((error) => { console.error(error); return false; });
    if (token !== state.token) return;
    state.busy = false; setButtons(false);
    el.sprite.className = "is-motion-sprite";
    el.status.textContent = played ? `${label} 모션 재생 완료` : `${label} 모션을 재생하지 못했습니다.`;
    if (motion !== "death") el.counter.textContent = "대기 자세";
  }
  function moveSelection(direction) {
    const current = Math.max(0, units.indexOf(state.type));
    selectUnit(units[(current + direction + units.length) % units.length]);
  }

  el.select.addEventListener("change", () => selectUnit(el.select.value));
  el.previous.addEventListener("click", () => moveSelection(-1));
  el.next.addEventListener("click", () => moveSelection(1));
  el.attack.addEventListener("click", () => playMotion("attack"));
  el.hit.addEventListener("click", () => playMotion("hit"));
  el.death.addEventListener("click", () => playMotion("death"));
  el.reset.addEventListener("click", () => selectUnit(state.type));
  el.battlefield.addEventListener("click", () => selectBattlefield(true));

  populateUnits(); selectBattlefield(); selectUnit(state.type);
})();
