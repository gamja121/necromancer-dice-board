(() => {
  "use strict";
  const SLUGS = ["death-knight", "skeleton-spear", "skeleton-archer", "ghoul", "ancient-treant", "goblin-rider",
    "minotaur", "plague-doctor", "spider-knight", "hydra", "siren"];
  const STARTING_SLUGS = ["skeleton-spear", "skeleton-archer"];
  const OWNED_ROSTER_KEY = "necromancer-map-roster-v2";
  const overlay = document.getElementById("homeInheritanceOverlay");
  const cards = document.getElementById("homeInheritanceCards");
  const brandCards = document.getElementById("homeInheritanceBrandCards");
  const mapBookButton = document.getElementById("mapBookButton");
  const mapCardDeckButton = document.getElementById("mapCardDeckButton");
  const diceControlOverlay = document.getElementById("diceControlOverlay");
  const closeButton = document.getElementById("homeInheritanceClose");
  const materialCard = document.getElementById("homeInheritanceMaterialCard");
  const materialHint = document.getElementById("homeInheritanceMaterialHint");
  const resultCard = document.getElementById("homeInheritanceResultCard");
  const resultHint = document.getElementById("homeInheritanceResultHint");
  const brandHint = document.getElementById("homeInheritanceBrandHint");
  const brandList = document.getElementById("homeInheritanceBrandList");
  const inheritButton = document.getElementById("homeInheritanceConfirm");
  const backdrop = overlay?.querySelector(".home-inheritance-backdrop");
  let ownedUnits;
  let materialInstanceId = null;
  let resultInstanceId = null;
  let completed = false;
  let inheritedBrand = null;
  let inheritedPart = null;
  let notice = "";
  let previousDiceDeckHidden = false;

  const BRAND_ICON_VIEWS = Object.freeze({
    critical: [216, 48, 228, 228], vampire: [526, 48, 234, 228], guard: [841, 48, 228, 228],
    poison: [216, 310, 228, 228], summon: [526, 310, 234, 228], healing: [843, 310, 228, 228],
    combo: [222, 50, 220, 220], freeze: [850, 50, 220, 220],
    lightspeed: [222, 316, 220, 220], counter: [852, 316, 220, 220]
  });

  function createInstanceId(slug = "unit") {
    if (globalThis.crypto?.randomUUID) return `${slug}-${globalThis.crypto.randomUUID()}`;
    return `${slug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function loadOwnedUnits() {
    if (ownedUnits) return ownedUnits;
    let saved;
    try { if (typeof sessionStorage !== "undefined") saved = JSON.parse(sessionStorage.getItem(OWNED_ROSTER_KEY)); } catch (_) { /* Storage can be unavailable. */ }
    const valid = Array.isArray(saved) && saved.length <= 100 && saved.every((unit) =>
      SLUGS.includes(unit?.slug) && Number.isFinite(unit.maxHp) && Number.isFinite(unit.attack) &&
      Number.isFinite(unit.speed) && Array.isArray(unit.brands) && unit.brands.length <= 3 &&
      unit.brands.every(V2Rules.validateBrand));
    const source = valid ? saved : STARTING_SLUGS.map((slug) => V2Rules.individual(slug));
    const usedIds = new Set();
    const roster = source.map((unit) => {
      const copy = { ...unit };
      copy.instanceId = typeof copy.instanceId === "string" && copy.instanceId ? copy.instanceId : createInstanceId(copy.slug);
      while (usedIds.has(copy.instanceId)) copy.instanceId = createInstanceId(copy.slug);
      usedIds.add(copy.instanceId);
      copy.currentHp = Math.max(0, Math.min(copy.maxHp, Number.isFinite(copy.currentHp) ? copy.currentHp : copy.maxHp));
      return copy;
    });
    try { if (typeof sessionStorage !== "undefined") sessionStorage.setItem(OWNED_ROSTER_KEY, JSON.stringify(roster)); } catch (_) { /* Keep this session's units in memory. */ }
    ownedUnits = new Map(roster.map((unit) => [unit.instanceId, unit]));
    return ownedUnits;
  }

  function displayCard(image, hint, instanceId, role) {
    const unit = instanceId && loadOwnedUnits().get(instanceId);
    image.hidden = !unit;
    if (unit) {
      image.src = `art/v2-style/ui/unit-card-${unit.slug}.png?v=19`;
      image.alt = `${unit.name} ${role} 카드`;
    } else image.removeAttribute("src");
    hint.textContent = unit?.name || (role === "재료" ? "아래에서 마물을 선택" : "계승 결과 대기");
  }

  function appendBrands(unit, origin) {
    unit.brands.forEach((brand, index) => {
      const row = document.createElement("li");
      const name = document.createElement("strong");
      const marks = document.createElement("small");
      name.textContent = `${completed && origin === "결과" && index === unit.brands.length - 1 ? "계승" : origin} · ${V2Rules.definitions[brand.type]?.name || brand.type}`;
      marks.textContent = `축 ${brand.bless.join(",") || "-"}  저 ${brand.curse.join(",") || "-"}`;
      row.append(name, marks);
      brandList.append(row);
    });
  }

  function renderSelection() {
    const owned = loadOwnedUnits();
    const material = owned.get(materialInstanceId);
    const result = owned.get(resultInstanceId);
    displayCard(materialCard, materialHint, materialInstanceId, "재료");
    displayCard(resultCard, resultHint, resultInstanceId, "결과");
    cards.querySelectorAll("button").forEach((card) => {
      const selected = card.dataset.instanceId === materialInstanceId || card.dataset.instanceId === resultInstanceId;
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-pressed", String(selected));
    });
    brandList.replaceChildren();
    if (result) appendBrands(result, completed ? "결과" : "기존");
    if (material) appendBrands(material, "재료");
    brandList.hidden = !brandList.childElementCount;
    brandHint.hidden = false;
    if (notice) brandHint.textContent = notice;
    else if (completed) brandHint.textContent = `계승 완료 · ${V2Rules.definitions[inheritedBrand?.type]?.name || "낙인"} ${ {bless:"축복",both:"둘 다",curse:"저주"}[inheritedPart] }`;
    else if (!material) brandHint.textContent = "재료 카드를 선택하세요";
    else if (!result) brandHint.textContent = "다음으로 결과 카드를 선택하세요";
    else brandHint.textContent = "계승: 축복 50% · 둘 다 30% · 저주 20%";
    inheritButton.disabled = !material || !result || !material.brands.length || result.brands.length >= 3;
  }

  function selectCard(instanceId) {
    if (completed) { materialInstanceId = null; resultInstanceId = null; completed = false; }
    notice = "";
    if (instanceId === materialInstanceId) { materialInstanceId = null; resultInstanceId = null; }
    else if (instanceId === resultInstanceId) resultInstanceId = null;
    else if (!materialInstanceId) materialInstanceId = instanceId;
    else if (loadOwnedUnits().get(instanceId)?.brands.length >= 3) notice = "낙인 3칸이 찬 마물은 결과 카드가 될 수 없습니다";
    else resultInstanceId = instanceId;
    renderSelection();
  }


  function brandIconMarkup(type) {
    const view = BRAND_ICON_VIEWS[type];
    if (!view) return '<span class="home-inheritance-brand-symbol" aria-hidden="true">◇</span>';
    const sheet = ["combo", "freeze", "lightspeed", "counter"].includes(type)
      ? "brand-icons-extra-sheet.jpg" : "brand-icons-sheet.jpg";
    return `<svg viewBox="${view.join(" ")}" aria-hidden="true"><image href="art/v2-style/ui/${sheet}" width="1280" height="575"></image></svg>`;
  }

  function renderBrandCards() {
    if (!brandCards) return;
    brandCards.replaceChildren();
    const ownedBrands = [];
    for (const unit of loadOwnedUnits().values()) {
      const ownerName = V2DesignData.units[unit.slug]?.name || unit.name || unit.slug;
      for (const brand of unit.brands) ownedBrands.push({ brand, ownerName });
    }
    ownedBrands.slice(0, 8).forEach(({ brand, ownerName }, index) => {
      const card = document.createElement("div");
      const name = V2Rules.definitions[brand.type]?.name || brand.type;
      card.className = "home-inheritance-brand-card";
      card.style.setProperty("--brand-i", index);
      card.style.setProperty("--brand-x", `${index * 48}%`);
      card.style.setProperty("--brand-y", `${Math.abs(3 - index) * -2}%`);
      card.style.setProperty("--brand-rot", `${-10 + index * 3}deg`);
      card.innerHTML = `${brandIconMarkup(brand.type)}<strong>${name}</strong><small>${ownerName}</small>`;
      brandCards.append(card);
    });
    brandCards.classList.toggle("is-empty", ownedBrands.length === 0);
    brandCards.setAttribute("aria-label", ownedBrands.length
      ? `보유 낙인 카드 ${ownedBrands.length}개`
      : "보유 낙인 카드 없음");
  }

  function renderCards() {
    if (!cards) return;
    cards.replaceChildren();
    for (const unit of loadOwnedUnits().values()) {
      const name = V2DesignData.units[unit.slug]?.name || unit.slug;
      const card = document.createElement("button");
      const image = document.createElement("img");
      const label = document.createElement("span");
      card.type = "button";
      card.dataset.instanceId = unit.instanceId;
      card.setAttribute("aria-label", name);
      card.setAttribute("aria-pressed", "false");
      image.src = `art/v2-style/ui/unit-card-${unit.slug}.png?v=19`;
      image.alt = "";
      label.textContent = name;
      card.append(image, label);
      card.addEventListener("click", () => selectCard(unit.instanceId));
      cards.append(card);
    }
  }

  function open() {
    if (!overlay) return;
    materialInstanceId = null;
    resultInstanceId = null;
    completed = false;
    inheritedBrand = null;
    inheritedPart = null;
    notice = "";
    renderCards();
    renderBrandCards();
    renderSelection();
    previousDiceDeckHidden = Boolean(mapCardDeckButton?.hidden);
    if (diceControlOverlay) {
      diceControlOverlay.hidden = true;
      diceControlOverlay.classList.remove("is-open", "is-closing");
    }
    if (mapCardDeckButton) {
      mapCardDeckButton.hidden = true;
      mapCardDeckButton.setAttribute("aria-expanded", "false");
    }
    mapBookButton?.classList.add("is-inheritance-source");
    overlay.hidden = false;
    overlay.classList.remove("is-open");
    void overlay.offsetWidth;
    overlay.classList.add("is-open");
    closeButton.focus();
  }

  function close() {
    if (!overlay || overlay.hidden) return;
    overlay.classList.remove("is-open");
    overlay.hidden = true;
    materialInstanceId = null;
    resultInstanceId = null;
    completed = false;
    inheritedBrand = null;
    inheritedPart = null;
    notice = "";
    if (brandCards) brandCards.replaceChildren();
    mapBookButton?.classList.remove("is-inheritance-source");
    if (mapCardDeckButton) mapCardDeckButton.hidden = previousDiceDeckHidden;
    renderSelection();
  }

  function inherit() {
    const owned = loadOwnedUnits();
    const material = owned.get(materialInstanceId);
    const result = owned.get(resultInstanceId);
    if (!material || !result || !material.brands.length || result.brands.length >= 3) return;
    const randomIndex = Math.floor(Math.random() * material.brands.length);
    const part = V2Rules.inheritancePart(material.brands[randomIndex], Math.random);
    V2Rules.inherit(result, material, randomIndex, part);
    inheritedBrand = result.brands[result.brands.length - 1];
    inheritedPart = part;
    owned.delete(materialInstanceId);
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(OWNED_ROSTER_KEY,
        JSON.stringify([...owned.values()]));
    } catch (_) { /* Keep the current session in memory. */ }
    const donorInstanceId = materialInstanceId;
    materialInstanceId = null;
    completed = true;
    renderCards();
    renderSelection();
    window.dispatchEvent?.(new CustomEvent("v2-roster-changed", { detail: { donorInstanceId, recipient: JSON.parse(JSON.stringify(result)) } }));
  }

  inheritButton?.addEventListener("click", inherit);
  closeButton?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay?.hidden) { event.stopImmediatePropagation(); close(); }
  });
  window.V2HomeInheritance = Object.freeze({ open, close });
})();
