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
  const tileEventRatios = Object.freeze({
    graveyard: 1280 / 714, home: 1280 / 714, "fortune-teller-camp": 1280 / 575,
    village: 1280 / 956, rest: 1280 / 714, altar: 1280 / 575,
    forest: 1280 / 714, gem: 1280 / 714
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
  const OWNED_ROSTER_KEY = "necromancer-map-test-roster-v1";
  const GRADE_LABELS = Object.freeze({ normal: "일반", advanced: "고급", hero: "영웅", special: "소환물" });
  const LEGION_LABELS = Object.freeze({ skeleton: "언데드", corpse: "시체", beast: "야수", plague: "역병", ice: "얼음", summon: "소환", demon: "악마", insect: "벌레", plant: "식물", element: "원소" });
  const BRAND_ICON_VIEWS = Object.freeze({
    critical: [216, 48, 228, 228], vampire: [526, 48, 234, 228], guard: [841, 48, 228, 228],
    poison: [216, 310, 228, 228], summon: [526, 310, 234, 228], healing: [843, 310, 228, 228],
    combo: [222, 50, 220, 220], freeze: [850, 50, 220, 220],
    lightspeed: [222, 316, 220, 220], counter: [852, 316, 220, 220]
  });
  const TARGET_RATES = Object.freeze({ 1: [100], 2: [35, 65], 3: [20, 33, 47], 4: [15, 20, 27, 38] });
  const CARD_DECK_IMAGES = Object.freeze({
    closed: "art/v2-style/ui/map-card-deck.png",
    open: "art/v2-style/ui/map-card-deck-open.png",
  });
  const HOME_INDEX = 15; // 16번 타일: 하단 일곱 칸의 정중앙.
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
    eventScene: document.querySelector(".tile-event-scene"),
    eventImage: document.getElementById("tileEventImage"),
    eventTreasure: document.getElementById("treasureChestSprite"),
    eventTreasureRewards: document.getElementById("treasureRewardCards"),
    eventEnter: document.getElementById("tileEventEnter"),
    eventInheritance: document.getElementById("tileEventInheritance"),
    eventClose: document.getElementById("tileEventClose"),
    bookButton: document.getElementById("mapBookButton"),
    cardDeckButton: document.getElementById("mapCardDeckButton"),
    cardDeckImage: document.getElementById("mapCardDeckImage"),
    diceControlOverlay: document.getElementById("diceControlOverlay"),
    diceControlBackdrop: document.getElementById("diceControlBackdrop"),
    diceControlHand: document.getElementById("diceControlHand"),
    bookImage: document.getElementById("mapBookImage"),
    bookRoster: document.getElementById("mapBookRoster"),
    infoOverlay: document.getElementById("mapUnitInfoOverlay"),
    infoBackdrop: document.getElementById("mapUnitInfoBackdrop"),
    infoClose: document.getElementById("mapUnitInfoClose"),
    infoName: document.getElementById("mapUnitInfoName"),
    infoPortrait: document.getElementById("mapUnitInfoPortrait"),
    infoGrade: document.getElementById("mapUnitInfoGrade"),
    infoLegion: document.getElementById("mapUnitInfoLegion"),
    infoHp: document.getElementById("mapUnitInfoHp"),
    infoAttack: document.getElementById("mapUnitInfoAttack"),
    infoSpeed: document.getElementById("mapUnitInfoSpeed"),
    infoBrands: document.getElementById("mapUnitInfoBrands"),
    deckOverlay: document.getElementById("mapDeckOverlay"),
    deckClose: document.getElementById("mapDeckClose"),
    deckSelected: document.getElementById("mapSelectedLineup"),
    deckRoster: document.getElementById("mapDeckRoster"),
    deckStatus: document.getElementById("mapDeckStatus"),
    deckConfirm: document.getElementById("mapDeckConfirm"),
    cloudTransition: document.getElementById("mapCloudTransition")
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
  let activeEventTileId = null;
  let activeEventRatio = 1280 / 714;
  let battleStep = 0;
  let selectedDeck = [];
  let bookOpen = false;
  let bookAnimating = false;
  let bookMotions = [];
  let lapReadyForRefresh = false;
  let cloudTransitioning = false;
  let diceControlHand = [];
  let pendingDiceControlId = null;
  let previousDiceRoll = null;
  let previousDiceControlId = null;
  const ownedUnits = loadOwnedRoster();

  [...rollingFrames, ...resultFrames, ...Object.values(tileEventScenes).map((scene) => scene.image).filter(Boolean), `${ROOT}events/home-interior.jpg`].forEach((src) => { const image = new Image(); image.src = src; });

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function loadOwnedRoster() {
    let saved;
    try { if (typeof sessionStorage !== "undefined") saved = JSON.parse(sessionStorage.getItem(OWNED_ROSTER_KEY)); } catch (_) { /* Private browsing can block storage. */ }
    const valid = Array.isArray(saved) && saved.length <= TEST_DECK.length &&
      new Set(saved.map((unit) => unit?.slug)).size === saved.length && saved.every((unit) =>
        TEST_DECK.some((entry) => entry.slug === unit?.slug) && Number.isFinite(unit.maxHp) &&
        Number.isFinite(unit.attack) && Number.isFinite(unit.speed) && Array.isArray(unit.brands) &&
        unit.brands.length <= 3 && unit.brands.every(V2Rules.validateBrand));
    const roster = valid ? saved : TEST_DECK.map((entry) => V2Rules.individual(entry.slug));
    if (!valid) try { if (typeof sessionStorage !== "undefined") sessionStorage.setItem(OWNED_ROSTER_KEY, JSON.stringify(roster)); } catch (_) { /* The current map still works without storage. */ }
    return new Map(roster.map((unit) => [unit.slug, unit]));
  }

  function perimeterPositions() {
    const positions = [];
    for (let index = 0; index < 8; index += 1) positions.push({ x: 20 + index * (70 / 7), y: 12 });
    for (let index = 0; index < 4; index += 1) positions.push({ x: 94, y: 29 + index * (42 / 3) });
    for (let index = 0; index < 7; index += 1) positions.push({ x: 79 - index * (58 / 6), y: 85 });
    for (let index = 0; index < 5; index += 1) positions.push({ x: 6, y: 69 - index * (54 / 4) });
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
    const pool = Array(24);
    pool[0] = fixedTiles.fortune;
    pool[8] = fixedTiles.village;
    pool[HOME_INDEX] = fixedTiles.home;
    pool[23] = fixedTiles.boss;
    for (let index = 0, randomIndex = 0; index < pool.length; index += 1) {
      if (!pool[index]) pool[index] = randomTiles[randomIndex++];
    }
    return pool;
  }

  function selectTile(button, tile, step) {
    el.ring.querySelectorAll(".map-tile.is-selected").forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
    el.tileName.textContent = `${step}번 · ${tile.name}`;
  }

  function enterMonsterBattle(tile, step) {
    if (tile?.id !== "monster" || enteringBattle) return false;
    forceCloseBookRoster();
    enteringBattle = true;
    battleStep = step;
    selectedDeck = [];
    el.diceButton.disabled = true;
    el.regenerate.disabled = true;
    el.tileName.textContent = `${step}번 · 마물 출현 · 출전 마물 선택`;
    el.board.classList.add("is-deck-selecting");
    el.deckOverlay.classList.remove("is-preview");
    el.deckClose.hidden = true;
    renderDeckSelection();
    el.deckOverlay.hidden = false;
    el.deckOverlay.classList.remove("is-open");
    void el.deckOverlay.offsetWidth;
    el.deckOverlay.classList.add("is-open");
    return true;
  }

  function openDiceControlCard() {
    if (rolling || eventOpen || enteringBattle || !el.infoOverlay.hidden) return;
    forceCloseBookRoster();
    el.diceButton.disabled = true;
    el.regenerate.disabled = true;
    el.cardDeckImage.src = CARD_DECK_IMAGES.open;
    el.cardDeckButton.setAttribute("aria-expanded", "true");
    el.diceControlOverlay.hidden = false;
    el.diceControlOverlay.classList.remove("is-closing");
    void el.diceControlOverlay.offsetWidth;
    el.diceControlOverlay.classList.add("is-open");
    el.diceControlBackdrop.focus();
  }

  function diceControlState() {
    return { previousRoll: previousDiceRoll, previousCardId: previousDiceControlId };
  }

  function renderDiceControlHand() {
    el.diceControlHand.replaceChildren();
    for (const [index, card] of diceControlHand.entries()) {
      const availability = V2DiceControl.canUse(card.id, diceControlState());
      const button = document.createElement("button");
      const image = document.createElement("img");
      button.type = "button";
      button.className = "dice-control-card";
      button.style.setProperty("--i", index + 1);
      button.style.setProperty("--drag-y", "0px");
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", "false");
      button.disabled = !availability.ok;
      button.title = availability.ok
        ? `${card.label}: 위로 살짝 끌어 사용 · ${card.description}`
        : availability.reason;
      image.src = V2DiceControl.imagePath(card, "ko");
      image.alt = `${card.label}: ${card.description}`;
      button.append(image);

      if (availability.ok) {
        let pointerId = null;
        let startY = 0;
        let dragY = 0;
        let moved = false;
        const USE_THRESHOLD = -46;

        const resetDrag = () => {
          button.classList.remove("is-dragging", "is-use-ready");
          button.style.setProperty("--drag-y", "0px");
          button.setAttribute("aria-selected", "false");
          pointerId = null;
          dragY = 0;
          moved = false;
        };

        button.addEventListener("pointerdown", (event) => {
          if (pendingDiceControlId || pointerId !== null) return;
          event.preventDefault();
          pointerId = event.pointerId;
          startY = event.clientY;
          dragY = 0;
          moved = false;
          button.setPointerCapture(pointerId);
          button.classList.add("is-dragging");
          button.setAttribute("aria-selected", "true");
        });

        button.addEventListener("pointermove", (event) => {
          if (event.pointerId !== pointerId) return;
          event.preventDefault();
          dragY = Math.max(-96, Math.min(0, event.clientY - startY));
          moved ||= Math.abs(dragY) > 4;
          button.style.setProperty("--drag-y", `${dragY}px`);
          button.classList.toggle("is-use-ready", dragY <= USE_THRESHOLD);
        });

        button.addEventListener("pointerup", async (event) => {
          if (event.pointerId !== pointerId) return;
          event.preventDefault();
          const shouldUse = dragY <= USE_THRESHOLD;
          if (button.hasPointerCapture(pointerId)) button.releasePointerCapture(pointerId);
          if (!shouldUse) {
            resetDrag();
            return;
          }
          button.classList.remove("is-dragging", "is-use-ready");
          button.classList.add("is-consuming");
          button.style.setProperty("--drag-y", "-120px");
          await wait(140);
          useDiceControlCard(card.id);
        });

        button.addEventListener("pointercancel", resetDrag);
        button.addEventListener("lostpointercapture", () => {
          if (!button.classList.contains("is-consuming") && pointerId !== null) resetDrag();
        });

        button.addEventListener("click", (event) => {
          event.preventDefault();
          if (!moved) {
            el.diceResult.textContent = `${card.label} · 위로 살짝 끌어 사용`;
          }
        });

        button.addEventListener("keydown", (event) => {
          if ((event.key === "Enter" || event.key === " ") && !pendingDiceControlId) {
            event.preventDefault();
            useDiceControlCard(card.id);
          }
        });
      }

      el.diceControlHand.append(button);
    }
  }

  function dealDiceControlHand() {
    diceControlHand = shuffle([...V2DiceControl.cards]).slice(0, 5);
    renderDiceControlHand();
  }

  function useDiceControlCard(cardId) {
    if (pendingDiceControlId) {
      el.diceResult.textContent = "이미 다음 굴림에 사용할 카드가 선택되어 있습니다.";
      renderDiceControlHand();
      return;
    }
    const availability = V2DiceControl.canUse(cardId, diceControlState());
    if (!availability.ok) {
      el.diceResult.textContent = availability.reason;
      renderDiceControlHand();
      return;
    }
    const card = V2DiceControl.cards.find((entry) => entry.id === cardId);
    pendingDiceControlId = cardId;
    diceControlHand = diceControlHand.filter((entry) => entry.id !== cardId);
    el.diceResult.textContent = `${card.label} · 사용 예약 · 다음 굴림에 적용`;
    renderDiceControlHand();
    closeDiceControlCard();
  }

  async function closeDiceControlCard() {
    if (el.diceControlOverlay.hidden) return;
    el.diceControlOverlay.classList.remove("is-open");
    el.diceControlOverlay.classList.add("is-closing");
    await wait(360);
    el.diceControlOverlay.hidden = true;
    el.diceControlOverlay.classList.remove("is-closing");
    el.cardDeckImage.src = CARD_DECK_IMAGES.closed;
    el.cardDeckButton.setAttribute("aria-expanded", "false");
    el.diceButton.disabled = false;
    el.regenerate.disabled = false;
    el.cardDeckButton.focus();
  }

  function toggleDiceControlCard() {
    if (el.diceControlOverlay.hidden) openDiceControlCard();
    else closeDiceControlCard();
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
        const rate = document.createElement("span");
        image.src = `art/v2-style/ui/unit-card-${entry.slug}.png?v=19`;
        image.alt = `${index + 1}번째 ${entry.name}`;
        rate.className = "map-target-rate";
        rate.textContent = `피격 ${TARGET_RATES[selectedDeck.length][index]}%`;
        slot.title = `${entry.name} 선택 해제`;
        slot.addEventListener("click", () => toggleDeckUnit(entry.slug));
        slot.append(image, rate);
      } else slot.disabled = true;
      el.deckSelected.append(slot);
    }
    el.deckRoster.replaceChildren();
    for (const entry of TEST_DECK) {
      if (!ownedUnits.has(entry.slug)) continue;
      const selectedIndex = selectedDeck.indexOf(entry.slug);
      const button = document.createElement("button");
      button.type = "button";
      button.classList.toggle("is-selected", selectedIndex >= 0);
      button.setAttribute("aria-pressed", selectedIndex >= 0 ? "true" : "false");
      const image = document.createElement("img");
      image.src = `art/v2-style/ui/unit-card-${entry.slug}.png?v=19`;
      image.alt = "";
      const name = document.createElement("span");
      name.textContent = entry.name;
      button.append(image, name);
      button.addEventListener("click", () => toggleDeckUnit(entry.slug));
      el.deckRoster.append(button);
    }
    const rates = TARGET_RATES[selectedDeck.length] || [];
    el.deckStatus.textContent = rates.length ? `마물 카드 ${selectedDeck.length} / 4 · 왼쪽부터 피격 ${rates.join(" · ")}%` : "마물 카드 0 / 4";
    el.deckConfirm.disabled = selectedDeck.length !== 4;
  }

  function renderBookRoster() {
    el.bookRoster.replaceChildren();
    for (const entry of TEST_DECK) {
      if (!ownedUnits.has(entry.slug)) continue;
      const button = document.createElement("button");
      const image = document.createElement("img");
      const name = document.createElement("span");
      button.type = "button";
      button.setAttribute("aria-label", `${entry.name} 카드 확인`);
      button.setAttribute("aria-pressed", "false");
      image.src = `art/v2-style/ui/unit-card-${entry.slug}.png?v=19`;
      image.alt = "";
      name.textContent = entry.name;
      button.append(image, name);
      button.addEventListener("click", () => {
        if (bookAnimating) return;
        const inspecting = button.classList.contains("is-inspecting");
        clearBookSelection();
        if (!inspecting) {
          button.classList.add("is-inspecting");
          button.setAttribute("aria-pressed", "true");
          openBookUnitInfo(ownedUnits.get(entry.slug));
        }
      });
      el.bookRoster.append(button);
    }
  }

  function clearBookSelection() {
    el.bookRoster.querySelectorAll("button.is-inspecting").forEach((card) => {
      card.classList.remove("is-inspecting");
      card.setAttribute("aria-pressed", "false");
    });
  }

  function escapeInfo(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function bookBrandIcon(key) {
    const view = BRAND_ICON_VIEWS[key];
    if (!view) return '<span class="map-passive-symbol" aria-hidden="true">◇</span>';
    const sheet = ["combo", "freeze", "lightspeed", "counter"].includes(key) ? "brand-icons-extra-sheet.jpg" : "brand-icons-sheet.jpg";
    return `<svg class="map-brand-icon" viewBox="${view.join(" ")}" aria-hidden="true"><image href="art/v2-style/ui/${sheet}" width="1280" height="575" /></svg>`;
  }

  function openBookUnitInfo(unit) {
    if (!unit) return;
    el.infoName.textContent = unit.name;
    const portraitVersion = unit.slug === "siren" ? 3 : unit.slug === "minotaur" ? 2 : 1;
    el.infoPortrait.src = `art/v2-style/ui/info-portraits/${unit.slug}.png?v=${portraitVersion}`;
    el.infoPortrait.alt = unit.name;
    el.infoGrade.textContent = GRADE_LABELS[unit.grade] || "미지정";
    el.infoLegion.textContent = unit.legions.map((key) => LEGION_LABELS[key] || key).join(" · ") || "미지정";
    el.infoHp.textContent = `${unit.maxHp} / ${unit.maxHp}`;
    el.infoAttack.textContent = String(unit.attack);
    el.infoSpeed.textContent = String(unit.speed);
    const passiveName = unit.passive?.name || "패시브 없음";
    el.infoBrands.innerHTML = `<div class="map-passive-heading"><span class="map-passive-symbol" aria-hidden="true">◇</span><span>${escapeInfo(passiveName)}</span></div>` +
      (unit.brands.map((brand) => `<div class="map-brand-heading">${bookBrandIcon(brand.type)}<h4>${escapeInfo(V2Rules.definitions[brand.type]?.name || brand.type)}</h4></div>`).join("") || '<p class="map-unit-info-empty">낙인 없음</p>');
    el.infoOverlay.hidden = false;
    el.infoClose.focus();
  }

  function closeBookUnitInfo() {
    el.infoOverlay.hidden = true;
  }

  function setBookVisual(isOpen) {
    el.bookButton.classList.toggle("is-open", isOpen);
    el.bookImage.src = `art/v2-style/ui/map-book-${isOpen ? "open" : "closed"}.png`;
    el.bookButton.setAttribute("aria-label", isOpen ? "보유 마물 카드 닫기" : "보유 마물 카드 열기");
    el.bookButton.setAttribute("aria-pressed", String(isOpen));
  }

  async function animateBookCards(outward) {
    const cards = [...el.bookRoster.querySelectorAll("button")];
    if (!cards.length || typeof cards[0].animate !== "function" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Use board-local coordinates: the whole board rotates on portrait phones,
    // so viewport rectangles would turn a sideways slide into an up/down flight.
    const bookExitX = el.bookButton.offsetLeft + el.bookButton.offsetWidth * .9;
    const animations = cards.map((card, index) => {
      const cardX = el.bookRoster.offsetLeft + card.offsetLeft + card.offsetWidth / 2;
      const tucked = `translateX(${bookExitX - cardX}px) translateY(10%) rotate(var(--card-tilt, 0deg)) scale(.35)`;
      const settled = window.getComputedStyle(card).transform;
      return card.animate(outward
        ? [{ transform: tucked, opacity: 0 }, { transform: settled, opacity: 1 }]
        : [{ transform: settled, opacity: 1 }, { transform: tucked, opacity: 0 }],
      { duration: 320, delay: (outward ? index : cards.length - 1 - index) * 55,
        easing: outward ? "cubic-bezier(.16,.82,.24,1)" : "cubic-bezier(.5,0,.8,.3)", fill: outward ? "backwards" : "forwards" });
    });
    bookMotions = animations;
    await Promise.all(animations.map((animation) => animation.finished.catch(() => {})));
    animations.forEach((animation) => animation.cancel());
    bookMotions = [];
  }

  function forceCloseBookRoster() {
    bookMotions.forEach((animation) => animation.cancel());
    bookMotions = [];
    closeBookUnitInfo();
    clearBookSelection();
    bookOpen = false;
    bookAnimating = false;
    el.bookRoster.hidden = true;
    setBookVisual(false);
  }

  async function toggleBookRoster() {
    if (bookAnimating || enteringBattle || !el.infoOverlay.hidden) return;
    bookAnimating = true;
    if (!bookOpen) {
      bookOpen = true;
      setBookVisual(true);
      el.bookRoster.hidden = false;
      if (typeof V2Sfx !== "undefined") V2Sfx.play("bookCardsOpen");
      await animateBookCards(true);
    } else {
      clearBookSelection();
      await animateBookCards(false);
      el.bookRoster.hidden = true;
      bookOpen = false;
      setBookVisual(false);
    }
    bookAnimating = false;
  }

  function confirmMonsterBattle() {
    if (selectedDeck.length !== 4) return;
    el.deckConfirm.disabled = true;
    el.deckStatus.textContent = "전장으로 이동 중…";
    const params = new URLSearchParams({ from: "map", map: activeMapId, tile: String(battleStep), allies: selectedDeck.join(",") });
    if (typeof V2Music !== "undefined") V2Music.handoff("battle");
    window.location.assign(`v2-auto-battle-practice.html?${params}`);
  }

  function fitTileEventScene() {
    const width = Math.min(el.board.clientWidth * .62, el.board.clientHeight * .65 * activeEventRatio);
    el.eventScene.style.width = `${width}px`;
    el.eventScene.style.height = `${width / activeEventRatio}px`;
  }

  function createTreasureRewards() {
    const unitRewards = TEST_DECK.map((unit) => ({
      type: "unit",
      id: unit.slug,
      label: unit.name,
      image: `art/v2-style/ui/unit-card-${unit.slug}.png?v=19`
    }));
    const diceRewards = V2DiceControl.cards.map((card) => ({
      type: "dice",
      id: card.id,
      label: card.label,
      image: V2DiceControl.imagePath(card, "ko")
    }));
    const mixed = shuffle([...unitRewards, ...diceRewards]).slice(0, 3);
    return mixed;
  }

  function showTreasureRewards() {
    const rewards = createTreasureRewards();
    el.eventTreasureRewards.replaceChildren();
    for (const reward of rewards) {
      const card = document.createElement("div");
      const image = document.createElement("img");
      const badge = document.createElement("span");
      card.className = "treasure-reward-card";
      image.src = reward.image;
      image.alt = reward.label;
      badge.className = "treasure-reward-badge";
      badge.textContent = reward.type === "unit" ? `마물 · ${reward.label}` : `주사위 · ${reward.label}`;
      card.append(image, badge);
      el.eventTreasureRewards.append(card);
    }
    el.eventTreasureRewards.hidden = false;
  }

  function clearTreasureRewards() {
    el.eventTreasureRewards.hidden = true;
    el.eventTreasureRewards.replaceChildren();
  }

  function openTileEvent(tile, step) {
    const scene = tileEventScenes[tile?.id];
    if (!scene || enteringBattle) return false;
    eventOpen = true;
    activeEventTileId = tile.id;
    activeEventRatio = tileEventRatios[tile.id] || 1280 / 714;
    fitTileEventScene();
    el.board.classList.add("is-tile-event-open");
    el.diceButton.disabled = true;
    el.regenerate.disabled = true;
    const treasure = scene.animation === "treasure";
    el.eventImage.hidden = treasure;
    el.eventTreasure.hidden = !treasure;
    el.eventEnter.hidden = tile.id !== "home";
    el.eventInheritance.hidden = true;
    if (treasure) {
      el.eventImage.removeAttribute("src");
      clearTreasureRewards();
      el.eventTreasure.classList.remove("is-playing");
    clearTreasureRewards();
      void el.eventTreasure.offsetWidth;
      el.eventTreasure.classList.add("is-playing");
      if (typeof V2Sfx !== "undefined") V2Sfx.play("treasureChestOpen");
      window.setTimeout(() => {
        if (eventOpen && activeEventTileId === "gem") showTreasureRewards();
      }, 1050);
    } else {
      el.eventImage.src = scene.image;
      el.eventImage.alt = `${scene.title} 풍경`;
    }
    el.eventOverlay.hidden = false;
    el.eventClose.focus();
    return true;
  }

  function enterHome() {
    if (!eventOpen || activeEventTileId !== "home") return;
    el.eventImage.src = `${ROOT}events/home-interior.jpg`;
    el.eventImage.alt = "우리집 실내 풍경";
    el.eventEnter.hidden = true;
    el.eventInheritance.hidden = false;
    el.eventInheritance.focus();
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

  async function playCloudTileRefresh() {
    if (cloudTransitioning || !el.cloudTransition) return;
    cloudTransitioning = true;
    rolling = true;
    el.diceButton.disabled = true;
    el.regenerate.disabled = true;
    el.cloudTransition.hidden = false;
    el.cloudTransition.classList.remove("is-covered", "is-opening");
    void el.cloudTransition.offsetWidth;
    el.cloudTransition.classList.add("is-covered");
    // Let the fastest and slowest cloud layers meet at different times.
    // The mist layer removes any dark gaps before the tile swap happens.
    await wait(1200);
    generateTiles();
    await wait(260);
    el.cloudTransition.classList.add("is-opening");
    await wait(1080);
    el.cloudTransition.hidden = true;
    el.cloudTransition.classList.remove("is-covered", "is-opening");
    rolling = false;
    cloudTransitioning = false;
    el.diceButton.disabled = false;
    el.regenerate.disabled = false;
    el.diceButton.focus();
  }

  async function handleTileEventExit() {
    // The home scene's Exit button is the authoritative trigger for the lap transition.
    // Do not depend on a transient lap flag here; if the player is leaving the home scene,
    // always cover the map, rebuild the tiles, then reveal the new board.
    const refreshAfterHome = eventOpen && activeEventTileId === "home";
    closeTileEvent();
    if (refreshAfterHome) await playCloudTileRefresh();
  }

  function closeTileEvent() {
    if (!eventOpen) return;
    eventOpen = false;
    activeEventTileId = null;
    rolling = false;
    el.board.classList.remove("is-tile-event-open");
    el.eventOverlay.hidden = true;
    el.eventImage.removeAttribute("src");
    el.eventEnter.hidden = true;
    el.eventInheritance.hidden = true;
    V2HomeInheritance.close();
    el.eventTreasure.classList.remove("is-playing");
    el.diceButton.disabled = false;
    el.regenerate.disabled = false;
    el.diceButton.focus();
  }

  function placeHero(animate = false) {
    const position = positions[heroIndex];
    el.hero.style.left = `${position.x}%`;
    el.hero.style.top = `${position.y}%`;
    // On the lower and left edges the route heads left, then upward; keep the
    // figure facing the direction of travel until it turns right at the top.
    el.hero.style.setProperty("--hero-facing", heroIndex >= 12 ? -1 : 1);
    el.hero.setAttribute("aria-label", `주인공 말, 현재 ${heroIndex + 1}번 타일`);
    el.moveState.textContent = `현재 ${heroIndex + 1}번 타일`;
    if (animate) {
      el.hero.classList.remove("is-moving");
      void el.hero.offsetWidth;
      el.hero.classList.add("is-moving");
    }
  }

  function generateTiles() {
    lapReadyForRefresh = false;
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
    heroIndex = HOME_INDEX;
    placeHero();
    selectTile(currentButtons[HOME_INDEX], currentTiles[HOME_INDEX], HOME_INDEX + 1);
    el.diceResult.textContent = "주사위 굴리기";
    resetMapDicePosition();
  }

  function resetMapDicePosition() {
    el.diceButton.style.left = "50%";
    el.diceButton.style.top = "48%";
    el.diceButton.style.transform = "translate(-50%, -50%) rotate(0deg)";
  }

  function getDiceWallRects(boardRect) {
    return currentButtons.map((button) => {
      const rect = button.getBoundingClientRect();
      return {
        left: rect.left - boardRect.left,
        right: rect.right - boardRect.left,
        top: rect.top - boardRect.top,
        bottom: rect.bottom - boardRect.top
      };
    });
  }

  function getDiceInnerBounds(walls, radius, boardRect) {
    // The route is 8 top + 4 right + 7 bottom + 5 left tiles.
    // Individual tile rectangles have tiny gaps, so a fast die can slip through them.
    // Build one continuous invisible inner wall from the route itself.
    const topWalls = walls.slice(0, 8);
    const rightWalls = walls.slice(8, 12);
    const bottomWalls = walls.slice(12, 19);
    const leftWalls = walls.slice(19, 24);

    const fallback = {
      minX: radius + 4,
      maxX: boardRect.width - radius - 4,
      minY: radius + 4,
      maxY: boardRect.height - radius - 4
    };
    if (!topWalls.length || !rightWalls.length || !bottomWalls.length || !leftWalls.length) return fallback;

    const bounds = {
      minX: Math.max(...leftWalls.map((wall) => wall.right)) + radius,
      maxX: Math.min(...rightWalls.map((wall) => wall.left)) - radius,
      minY: Math.max(...topWalls.map((wall) => wall.bottom)) + radius,
      maxY: Math.min(...bottomWalls.map((wall) => wall.top)) - radius
    };

    if (bounds.minX >= bounds.maxX || bounds.minY >= bounds.maxY) return fallback;
    return bounds;
  }

  function animateMapDiceRoll(result) {
    return new Promise((resolve) => {
      const boardRect = el.board.getBoundingClientRect();
      const diceRect = el.diceButton.getBoundingClientRect();
      const radius = Math.max(diceRect.width, diceRect.height) * .40;
      const walls = getDiceWallRects(boardRect);
      const duration = 1750 + Math.random() * 450;
      const { minX, maxX, minY, maxY } = getDiceInnerBounds(walls, radius, boardRect);

      let x = diceRect.left - boardRect.left + diceRect.width / 2;
      let y = diceRect.top - boardRect.top + diceRect.height / 2;
      let direction = Math.random() * Math.PI * 2;
      if (Math.abs(Math.cos(direction)) < .28) direction += .45;
      const baseSpeed = boardRect.width * (.62 + Math.random() * .16);
      let vx = Math.cos(direction) * baseSpeed;
      let vy = Math.sin(direction) * baseSpeed * .72;
      let rotation = Math.random() * 80 - 40;
      let lastTime = performance.now();
      let elapsed = 0;
      let frameClock = 0;
      let soundClock = 0;
      let settled = false;

      const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

      function bounceAgainstRect(wall) {
        const nearestX = clamp(x, wall.left, wall.right);
        const nearestY = clamp(y, wall.top, wall.bottom);
        let dx = x - nearestX;
        let dy = y - nearestY;
        let distanceSq = dx * dx + dy * dy;
        if (distanceSq >= radius * radius) return false;

        let nx;
        let ny;
        let distance = Math.sqrt(distanceSq);
        if (distance > .001) {
          nx = dx / distance;
          ny = dy / distance;
        } else {
          const distances = [
            { d: Math.abs(x - wall.left), nx: -1, ny: 0 },
            { d: Math.abs(wall.right - x), nx: 1, ny: 0 },
            { d: Math.abs(y - wall.top), nx: 0, ny: -1 },
            { d: Math.abs(wall.bottom - y), nx: 0, ny: 1 }
          ].sort((a, b) => a.d - b.d);
          nx = distances[0].nx;
          ny = distances[0].ny;
          distance = 0;
        }

        const dot = vx * nx + vy * ny;
        if (dot < 0) {
          vx -= 2 * dot * nx;
          vy -= 2 * dot * ny;
          vx *= .82;
          vy *= .82;
        }
        const push = radius - distance + 1.5;
        x += nx * push;
        y += ny * push;
        return true;
      }

      function finish() {
        if (settled) return;
        settled = true;
        el.diceImage.src = resultFrames[result - 1];
        el.diceImage.alt = `주사위 결과 ${result}`;
        el.diceButton.style.left = `${x}px`;
        el.diceButton.style.top = `${y}px`;
        el.diceButton.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(1.04)`;
        if (typeof V2Sfx !== "undefined") V2Sfx.play("diceLand", { rate: .94 + result * .015 });
        window.setTimeout(() => {
          el.diceButton.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(1)`;
          resolve();
        }, 120);
      }

      function tick(now) {
        const dt = Math.min((now - lastTime) / 1000, .035);
        lastTime = now;
        elapsed += dt * 1000;
        frameClock += dt * 1000;
        soundClock += dt * 1000;

        const lateDrag = elapsed > duration * .62 ? 3.4 : 1.15;
        const drag = Math.exp(-lateDrag * dt);
        vx *= drag;
        vy *= drag;
        x += vx * dt;
        y += vy * dt;

        let bounced = false;
        if (x < minX) { x = minX; vx = Math.abs(vx) * .78; bounced = true; }
        else if (x > maxX) { x = maxX; vx = -Math.abs(vx) * .78; bounced = true; }
        if (y < minY) { y = minY; vy = Math.abs(vy) * .78; bounced = true; }
        else if (y > maxY) { y = maxY; vy = -Math.abs(vy) * .78; bounced = true; }

        for (const wall of walls) {
          if (bounceAgainstRect(wall)) bounced = true;
        }

        if (bounced && soundClock > 85 && typeof V2Sfx !== "undefined") {
          V2Sfx.play("diceTick", { rate: .9 + Math.random() * .24 });
          soundClock = 0;
        }

        const speed = Math.hypot(vx, vy);
        rotation += (vx >= 0 ? 1 : -1) * speed * dt * .62;
        el.diceButton.style.left = `${x}px`;
        el.diceButton.style.top = `${y}px`;
        el.diceButton.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${1 + Math.min(speed / Math.max(baseSpeed, 1), 1) * .09})`;

        if (frameClock > 62) {
          diceFrameIndex = (diceFrameIndex + 1) % rollingFrames.length;
          el.diceImage.src = rollingFrames[diceFrameIndex];
          frameClock = 0;
        }

        if (elapsed >= duration || (elapsed > 1250 && speed < boardRect.width * .045)) {
          finish();
          return;
        }
        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    });
  }

  async function rollAndMove() {
    if (rolling) return;
    rolling = true;
    el.diceButton.disabled = true;
    el.regenerate.disabled = true;
    el.diceButton.classList.add("is-rolling");
    el.diceResult.textContent = "굴리는 중…";
    let result = Math.floor(Math.random() * 6) + 1;
    let controlLabel = "";
    if (pendingDiceControlId) {
      const controlled = V2DiceControl.resolve(pendingDiceControlId, diceControlState());
      if (controlled.ok) {
        result = controlled.value;
        controlLabel = controlled.label;
        previousDiceControlId = controlled.effectiveCardId;
      }
      pendingDiceControlId = null;
    }
    previousDiceRoll = result;
    renderDiceControlHand();
    await animateMapDiceRoll(result);
    el.diceResult.textContent = `${result}${controlLabel ? ` · ${controlLabel}` : ""} · 이동 시작`;
    el.diceButton.classList.remove("is-rolling");
    await wait(220);
    let stepsMoved = 0;
    let reachedHome = false;
    for (let step = 0; step < result; step += 1) {
      if (typeof V2Sfx !== "undefined") V2Sfx.play("move", { rate: step % 2 ? 1.08 : .92 });
      heroIndex = (heroIndex + 1) % positions.length;
      stepsMoved += 1;
      placeHero(true);
      selectTile(currentButtons[heroIndex], currentTiles[heroIndex], heroIndex + 1);
      await wait(230);
      if (heroIndex === HOME_INDEX) { reachedHome = true; lapReadyForRefresh = true; break; }
    }
    const controlText = controlLabel ? ` · ${controlLabel}` : "";
    el.diceResult.textContent = reachedHome
      ? `${result}${controlText} · 집 도착 (${stepsMoved}칸 이동)`
      : `${result}${controlText} · 이동 완료`;
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
  el.eventClose.addEventListener("click", handleTileEventExit);
  el.eventEnter.addEventListener("click", enterHome);
  el.eventInheritance.addEventListener("click", () => {
    if (eventOpen && activeEventTileId === "home") V2HomeInheritance.open();
  });
  window.addEventListener("v2-roster-changed", (event) => {
    ownedUnits.delete(event.detail.donorSlug);
    ownedUnits.set(event.detail.recipient.slug, event.detail.recipient);
    selectedDeck = selectedDeck.filter((slug) => ownedUnits.has(slug));
    renderBookRoster();
    if (!el.deckOverlay.hidden) renderDeckSelection();
  });
  el.bookButton.addEventListener("click", toggleBookRoster);
  el.cardDeckButton.addEventListener("click", toggleDiceControlCard);
  el.diceControlBackdrop.addEventListener("click", closeDiceControlCard);
  el.infoClose.addEventListener("click", closeBookUnitInfo);
  el.infoBackdrop.addEventListener("click", closeBookUnitInfo);
  window.addEventListener("resize", () => { if (eventOpen) fitTileEventScene(); });
  el.deckConfirm.addEventListener("click", confirmMonsterBattle);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el.diceControlOverlay.hidden) closeDiceControlCard();
    else if (event.key === "Escape" && !el.infoOverlay.hidden) closeBookUnitInfo();
    else if (event.key === "Escape" && !el.bookRoster.hidden) toggleBookRoster();
    else if (event.key === "Escape" && eventOpen) closeTileEvent();
  });
  renderBookRoster();
  dealDiceControlHand();
  generateTiles();
  if (typeof V2Sfx !== "undefined") V2Sfx.preload();
})();
