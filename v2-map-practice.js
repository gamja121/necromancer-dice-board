(() => {
  "use strict";

  const ROOT = "art/v2-style/map-test/";
  const DICE_ROOT = "art/v2-style/dice-test/frames/";
  const rollingFrames = Array.from({ length: 12 }, (_, index) => `${DICE_ROOT}roll-${String(index + 1).padStart(2, "0")}.png`);
  const resultFrames = Array.from({ length: 6 }, (_, index) => `${DICE_ROOT}result-${String(index + 1).padStart(2, "0")}.png`);
  const maps = {
    default: { name: "기본 지역", image: `${ROOT}maps/default-map.jpg` },
    winter: { name: "겨울 지역", image: `${ROOT}maps/winter-map.jpg` },
    hell: { name: "지옥 지역", image: `${ROOT}maps/hell-map.jpg` }
  };
  const tileTypes = [
    { id: "basic", name: "기본 타일", count: 6 },
    { id: "graveyard", name: "공동묘지 타일", count: 2 },
    { id: "altar", name: "제단 타일", count: 1 },
    { id: "unknown", name: "미정 타일", count: 1 },
    { id: "forest", name: "숲 타일", count: 2 },
    { id: "rest", name: "휴식 타일", count: 2 },
    { id: "monster", name: "마물 타일", count: 3 },
    { id: "gem", name: "보석 타일", count: 2 },
    { id: "event", name: "이벤트 타일", count: 3 },
    { id: "warp", name: "워프 타일", count: 2 }
  ];
  const el = {
    board: document.getElementById("mapBoard"),
    ring: document.getElementById("tileRing"),
    mapName: document.getElementById("mapName"),
    tileName: document.getElementById("tileName"),
    regenerate: document.getElementById("regenerateButton"),
    hero: document.getElementById("heroToken"),
    diceButton: document.getElementById("mapDiceButton"),
    diceImage: document.getElementById("mapDiceImage"),
    diceResult: document.getElementById("diceResult"),
    moveState: document.getElementById("moveState")
  };
  let positions = [];
  let currentTiles = [];
  let currentButtons = [];
  let heroIndex = 0;
  let rolling = false;
  let diceFrameIndex = 0;

  [...rollingFrames, ...resultFrames].forEach((src) => { const image = new Image(); image.src = src; });

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function perimeterPositions() {
    const positions = [];
    for (let index = 0; index < 8; index += 1) positions.push({ x: 12 + index * (76 / 7), y: 12 });
    for (let index = 0; index < 4; index += 1) positions.push({ x: 94, y: 29 + index * (42 / 3) });
    for (let index = 0; index < 8; index += 1) positions.push({ x: 88 - index * (76 / 7), y: 88 });
    for (let index = 0; index < 4; index += 1) positions.push({ x: 6, y: 71 - index * (42 / 3) });
    return positions;
  }

  function shuffle(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [items[index], items[target]] = [items[target], items[index]];
    }
    return items;
  }

  function createPool() {
    return shuffle(tileTypes.flatMap((tile) => Array.from({ length: tile.count }, () => tile)));
  }

  function selectTile(button, tile, step) {
    el.ring.querySelectorAll(".map-tile.is-selected").forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
    el.tileName.textContent = `${step}번 · ${tile.name}`;
  }

  function placeHero(animate = false) {
    const position = positions[heroIndex];
    el.hero.style.left = `${position.x}%`;
    el.hero.style.top = `${position.y}%`;
    el.hero.setAttribute("aria-label", `주인공 말, 현재 ${heroIndex + 1}번 타일`);
    el.moveState.textContent = `현재 ${heroIndex + 1}번 타일`;
    if (animate) {
      el.hero.classList.remove("is-moving");
      void el.hero.offsetWidth;
      el.hero.classList.add("is-moving");
    }
  }

  function generateTiles() {
    const pool = createPool();
    positions = perimeterPositions();
    currentTiles = pool;
    currentButtons = positions.map((position, index) => {
      const tile = pool[index];
      const button = document.createElement("button");
      const image = document.createElement("img");
      const step = document.createElement("span");
      button.type = "button";
      button.className = "map-tile";
      button.style.setProperty("--x", `${position.x}%`);
      button.style.setProperty("--y", `${position.y}%`);
      button.setAttribute("aria-label", `${index + 1}번 ${tile.name}`);
      image.src = `${ROOT}tiles/${tile.id}.png`;
      image.alt = "";
      step.className = "step";
      step.textContent = String(index + 1);
      button.append(image, step);
      button.addEventListener("click", () => selectTile(button, tile, index + 1));
      return button;
    });
    el.ring.replaceChildren(...currentButtons);
    heroIndex = 0;
    placeHero();
    selectTile(currentButtons[0], currentTiles[0], 1);
    el.diceResult.textContent = "주사위 굴리기";
  }

  async function rollAndMove() {
    if (rolling) return;
    rolling = true;
    el.diceButton.disabled = true;
    el.regenerate.disabled = true;
    el.diceButton.classList.add("is-rolling");
    el.diceResult.textContent = "굴리는 중…";
    const animationSteps = 17 + Math.floor(Math.random() * 6);
    for (let step = 0; step < animationSteps; step += 1) {
      diceFrameIndex = (diceFrameIndex + 1) % rollingFrames.length;
      el.diceImage.src = rollingFrames[diceFrameIndex];
      await wait(52 + Math.round((step / animationSteps) * 38));
    }

    const result = Math.floor(Math.random() * 6) + 1;
    el.diceImage.src = resultFrames[result - 1];
    el.diceImage.alt = `주사위 결과 ${result}`;
    el.diceResult.textContent = `${result} · 이동 시작`;
    el.diceButton.classList.remove("is-rolling");
    await wait(220);
    for (let step = 0; step < result; step += 1) {
      heroIndex = (heroIndex + 1) % positions.length;
      placeHero(true);
      selectTile(currentButtons[heroIndex], currentTiles[heroIndex], heroIndex + 1);
      await wait(230);
    }
    el.diceResult.textContent = `${result} · 이동 완료`;
    el.diceButton.disabled = false;
    el.regenerate.disabled = false;
    rolling = false;
  }

  document.querySelectorAll("[data-map]").forEach((button) => {
    button.addEventListener("click", () => {
      const map = maps[button.dataset.map];
      document.querySelectorAll("[data-map]").forEach((item) => item.classList.toggle("is-active", item === button));
      el.board.style.backgroundImage = `url("${map.image}")`;
      el.mapName.textContent = map.name;
    });
  });
  el.regenerate.addEventListener("click", generateTiles);
  el.diceButton.addEventListener("click", rollAndMove);
  generateTiles();
})();
