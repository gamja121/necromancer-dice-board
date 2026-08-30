(() => {
  "use strict";

  const FRAME_ROOT = "art/v2-style/dice-test/frames/";
  const rollingFrames = Array.from({ length: 12 }, (_, index) => `${FRAME_ROOT}roll-${String(index + 1).padStart(2, "0")}.png`);
  const resultFrames = Array.from({ length: 6 }, (_, index) => `${FRAME_ROOT}result-${String(index + 1).padStart(2, "0")}.png`);
  const el = {
    stage: document.getElementById("rollButton"),
    action: document.getElementById("rollAction"),
    image: document.getElementById("diceImage"),
    state: document.getElementById("stateLabel"),
    result: document.getElementById("resultLabel"),
    history: document.getElementById("historyList")
  };
  let rolling = false;
  let frameIndex = 0;
  const history = [];

  [...rollingFrames, ...resultFrames].forEach((src) => { const image = new Image(); image.src = src; });

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function randomResult() {
    return Math.floor(Math.random() * 6) + 1;
  }

  function renderHistory() {
    el.history.replaceChildren(...history.map((value) => {
      const item = document.createElement("li");
      item.textContent = String(value);
      return item;
    }));
  }

  async function rollDice() {
    if (rolling) return;
    rolling = true;
    el.action.disabled = true;
    el.stage.disabled = true;
    el.stage.classList.add("is-rolling");
    el.state.textContent = "주사위 회전 중";
    el.result.textContent = "결과를 정하는 중…";
    el.image.alt = "회전 중인 주사위";

    const steps = 22 + Math.floor(Math.random() * 7);
    for (let step = 0; step < steps; step += 1) {
      frameIndex = (frameIndex + 1) % rollingFrames.length;
      el.image.src = rollingFrames[frameIndex];
      const progress = step / Math.max(1, steps - 1);
      await wait(48 + Math.round(progress * progress * 88));
    }

    const value = randomResult();
    el.image.src = resultFrames[value - 1];
    el.image.alt = `주사위 결과 ${value}`;
    el.state.textContent = "주사위 결과";
    el.result.textContent = `${value}이(가) 나왔습니다`;
    history.unshift(value);
    if (history.length > 8) history.length = 8;
    renderHistory();
    el.stage.classList.remove("is-rolling");
    el.action.disabled = false;
    el.stage.disabled = false;
    rolling = false;
  }

  el.stage.addEventListener("click", rollDice);
  el.action.addEventListener("click", rollDice);
})();
