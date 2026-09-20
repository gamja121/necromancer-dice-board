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
  const tileEventScenes = Object.freeze({
    graveyard: Object.freeze({ title: "묘지", image: `${ROOT}events/graveyard.jpg` }),
    home: Object.freeze({ title: "집", image: `${ROOT}events/home.jpg` }),
    "fortune-teller-camp": Object.freeze({ title: "예언자", image: `${ROOT}events/fortune-teller.jpg` }),
    village: Object.freeze({ title: "마을", image: `${ROOT}events/village.jpg` }),
    rest: Object.freeze({ title: "숙영", image: `${ROOT}events/camp.jpg` }),
    altar: Object.freeze({ title: "제단", image: `${ROOT}events/altar.jpg` }),
    forest: Object.freeze({ title: "숲", image: `${ROOT}events/forest.jpg` }),
    gem: Object.freeze({ title: "보물상자", animation: "treasure" })
  });
  const tileTypes = [
    { id: "basic", name: "기본 타일", count: 2 },
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
  const fixedTiles = Object.freeze({
    home: Object.freeze({ id: "home", name: "우리집 타일", count: 1 }),
    village: Object.freeze({ id: "village", name: "마을 타일", count: 1 }),
    fortune: Object.freeze({ id: "fortune-teller-camp", name: "점술가의 막사 타일", count: 1 }),
    boss: Object.freeze({ id: "boss", name: "보스 타일", count: 1 })
  });
  const TEST_DECK = Object.freeze([
    ["death-knight", "데스 나이트"], ["skeleton-spear", "해골 병사"], ["ghoul", "구울"],
    ["ancient-treant", "숲의 장로"], ["goblin-rider", "고블린 라이더"], ["minotaur", "미노타우로스"],
    ["plague-doctor", "역병술사"], ["spider-knight", "거미여왕"], ["hydra", "히드라"], ["siren", "세이렌"]
  ].map(([slug, name]) => Object.freeze({ slug, name })));
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
    moveState: document.getElementById("moveState"),
    eventOverlay: document.getElementById("tileEventOverlay"),
    eventImage: document.getElementById("tileEventImage"),
    eventTreasure: document.getElementById("treasureChestSprite"),
    eventTitle: document.getElementById("tileEventTitle"),
    eventClose: document.getElementById("tileEventClose"),
    deckOverlay: document.getElementById("mapDeckOverlay"),
    deckSelected: document.getElementById("mapSelectedLineup"),
    deckRoster: document.getElementById("mapDeckRoster"),
    deckStatus: document.getElementById("mapDeckStatus"),
    deckConfirm: document.getElementById("mapDeckConfirm")
  };
  let positions = [];
  let currentTiles = [];
  let currentButtons = [];
  let heroIndex = 0;
  let rolling = false;
  let diceFrameIndex = 0;
  const requestedMapId = new URLSearchParams(window.location.search).get("map");
  let activeMapId = maps[requestedMapId] ? requestedMapId : "default";
  let enteringBattle = false;
  let eventOpen = false;
  let battleStep = 0;
  let selectedDeck = [];

  [...rollingFrames, ...resultFrames, ...Object.values(tileEventScenes).map((scene) => scene.image).filter(Boolean)].forEach((src) => { const image = new Image(); image.src = src; });

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
    const randomTiles = shuffle(tileTypes.flatMap((tile) => Array.from({ length: tile.count }, () => tile)));
    return [fixedTiles.home, ...randomTiles.slice(0, 7), fixedTiles.village,
      ...randomTiles.slice(7, 14), fixedTiles.fortune, ...randomTiles.slice(14), fixedTiles.boss];
  }

  function selectTile(button, tile, step) {
    el.ring.querySelectorAll(".map-tile.is-selected").forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
    el.tileName.textContent = `${step}번 · ${tile.name}`;
  }

  function enterMonsterBattle(tile, step) {
    if (tile?.id !== "monster" || enteringBattle) return false;
    enteringBattle = true;
    battleStep = step;
    selectedDeck = [];
    el.diceButton.disabled = true;
    el.regenerate.disabled = true;
    el.tileName.textContent = `${step}번 · 마물 출현 · 출전 마물 선택`;
    renderDeckSelection();
    el.deckOverlay.hidden = false;
    el.deckOverlay.classList.remove("is-open");
    void el.deckOverlay.offsetWidth;
    el.deckOverlay.classList.add("is-open");
    return true;
  }

  function toggleDeckUnit(slug) {
    const selectedIndex = selectedDeck.indexOf(slug);
    if (selectedIndex >= 0) selectedDeck.splice(selectedIndex, 1);
    else if (selectedDeck.length < 4) selectedDeck.push(slug);
    renderDeckSelection();
  }

  function renderDeckSelection() {
    el.deckSelected.replaceChildren();
    for (let index = 0; index < 4; index += 1) {
      const slug = selectedDeck[index];
      const entry = TEST_DECK.find((unit) => unit.slug === slug);
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = entry ? "selected-slot" : "selected-slot is-empty";
      if (entry) {
        const image = document.createElement("img");
        image.src = `art/v2-style/ui/unit-card-${entry.slug}.png?v=19`;
        image.alt = `${index + 1}번째 ${entry.name}`;
        slot.title = `${entry.name} 선택 해제`;
        slot.addEventListener("click", () => toggleDeckUnit(entry.slug));
        slot.append(image);
      } else slot.disabled = true;
      el.deckSelected.append(slot);
    }
    el.deckRoster.replaceChildren();
    for (const entry of TEST_DECK) {
      const selectedIndex = selectedDeck.indexOf(entry.slug);
      const button = document.createElement("button");
      button.type = "button";
      button.classList.toggle("is-selected", selectedIndex >= 0);
      button.setAttribute("aria-pressed", selectedIndex >= 0 ? "true" : "false");
      const order = document.createElement("b");
      order.textContent = selectedIndex >= 0 ? String(selectedIndex + 1) : "";
      const image = document.createElement("img");
      image.src = `art/v2-style/ui/unit-card-${entry.slug}.png?v=19`;
      image.alt = "";
      const name = document.createElement("span");
      name.textContent = entry.name;
      button.append(image, name, order);
      button.addEventListener("click", () => toggleDeckUnit(entry.slug));
      el.deckRoster.append(button);
    }
    el.deckStatus.textContent = `마물 카드 ${selectedDeck.length} / 4`;
    el.deckConfirm.disabled = selectedDeck.length !== 4;
  }

  function confirmMonsterBattle() {
    if (selectedDeck.length !== 4) return;
    el.deckConfirm.disabled = true;
    el.deckStatus.textContent = "전장으로 이동 중…";
    const params = new URLSearchParams({ from: "map", map: activeMapId, tile: String(battleStep), allies: selectedDeck.join(",") });
    window.location.assign(`v2-auto-battle-practice.html?${params}`);
  }

  function openTileEvent(tile, step) {
    const scene = tileEventScenes[tile?.id];
    if (!scene || enteringBattle) return false;
    eventOpen = true;
    el.diceButton.disabled = true;
    el.regenerate.disabled = true;
    const treasure = scene.animation === "treasure";
    el.eventImage.hidden = treasure;
    el.eventTreasure.hidden = !treasure;
    if (treasure) {
      el.eventImage.removeAttribute("src");
      el.eventTreasure.classList.remove("is-playing");
      void el.eventTreasure.offsetWidth;
      el.eventTreasure.classList.add("is-playing");
    } else {
      el.eventImage.src = scene.image;
      el.eventImage.alt = `${scene.title} 풍경`;
    }
    el.eventTitle.textContent = `${step}번 · ${scene.title}`;
    el.eventOverlay.hidden = false;
    el.eventClose.focus();
    return true;
  }

  async function warpToOtherWarp() {
    const destinations = currentTiles.map((tile, index) => ({ tile, index }))
      .filter(({ tile, index }) => tile.id === "warp" && index !== heroIndex);
    if (!destinations.length) return false;
    const origin = heroIndex;
    const destination = destinations[Math.floor(Math.random() * destinations.length)].index;
    el.diceButton.disabled = true;
    el.regenerate.disabled = true;
    el.diceResult.textContent = "워프 발동";
    el.tileName.textContent = `${origin + 1}번 워프 → ${destination + 1}번 워프`;
    await wait(360);
    heroIndex = destination;
    placeHero(true);
    selectTile(currentButtons[heroIndex], currentTiles[heroIndex], heroIndex + 1);
    el.diceResult.textContent = `${heroIndex + 1}번 워프로 이동 완료`;
    await wait(420);
    return true;
  }

  function closeTileEvent() {
    if (!eventOpen) return;
    eventOpen = false;
    rolling = false;
    el.eventOverlay.hidden = true;
    el.eventImage.removeAttribute("src");
    el.eventTreasure.classList.remove("is-playing");
    el.diceButton.disabled = false;
    el.regenerate.disabled = false;
    el.diceButton.focus();
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
      button.addEventListener("click", async () => {
        if (rolling || eventOpen) return;
        selectTile(button, tile, index + 1);
        if (tile.id === "warp") {
          rolling = true;
          heroIndex = index;
          placeHero(true);
          await warpToOtherWarp();
          rolling = false;
          el.diceButton.disabled = false;
          el.regenerate.disabled = false;
          return;
        }
        if (openTileEvent(tile, index + 1)) return;
        enterMonsterBattle(tile, index + 1);
      });
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
    if (currentTiles[heroIndex]?.id === "monster") {
      el.diceResult.textContent = `${result} · 마물 조우`;
      await wait(320);
      if (enterMonsterBattle(currentTiles[heroIndex], heroIndex + 1)) return;
    }
    if (currentTiles[heroIndex]?.id === "warp") {
      await warpToOtherWarp();
      rolling = false;
      el.diceButton.disabled = false;
      el.regenerate.disabled = false;
      return;
    }
    if (openTileEvent(currentTiles[heroIndex], heroIndex + 1)) {
      rolling = false;
      return;
    }
    el.diceButton.disabled = false;
    el.regenerate.disabled = false;
    rolling = false;
  }

  document.querySelectorAll("[data-map]").forEach((button) => {
    button.addEventListener("click", () => {
      const map = maps[button.dataset.map];
      activeMapId = button.dataset.map;
      document.querySelectorAll("[data-map]").forEach((item) => item.classList.toggle("is-active", item === button));
      el.board.style.backgroundImage = `url("${map.image}")`;
      el.mapName.textContent = map.name;
    });
  });
  const initialMapButton = document.querySelector(`[data-map="${activeMapId}"]`);
  if (initialMapButton && activeMapId !== "default") initialMapButton.click();
  el.regenerate.addEventListener("click", generateTiles);
  el.diceButton.addEventListener("click", rollAndMove);
  el.eventClose.addEventListener("click", closeTileEvent);
  el.deckConfirm.addEventListener("click", confirmMonsterBattle);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && eventOpen) closeTileEvent();
  });
  generateTiles();
})();
