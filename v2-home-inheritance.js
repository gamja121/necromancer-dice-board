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
  let selectedBrandCardId = null;
  let completed = false;
  let inheritedBrand = null;
  let inheritedPart = null;
  let notice = "";
  let previousDiceDeckHidden = false;

  function createInstanceId(slug = "unit") {
    if (globalThis.crypto?.randomUUID) return `${slug}-${globalThis.crypto.randomUUID()}`;
    return `${slug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function loadOwnedUnits() {
    if (ownedUnits) return ownedUnits;
    let saved;
    try { if (typeof sessionStorage !== "undefined") saved = JSON.parse(sessionStorage.getItem(OWNED_ROSTER_KEY)); } catch (_) {}
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
    try { if (typeof sessionStorage !== "undefined") sessionStorage.setItem(OWNED_ROSTER_KEY, JSON.stringify(roster)); } catch (_) {}
    ownedUnits = new Map(roster.map((unit) => [unit.instanceId, unit]));
    return ownedUnits;
  }

  function saveOwnedUnits() {
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(OWNED_ROSTER_KEY, JSON.stringify([...loadOwnedUnits().values()]));
      return true;
    } catch (_) { return false; }
  }

  function selectedBrandCard() {
    return selectedBrandCardId ? V2BrandCards.load().find((card) => card.id === selectedBrandCardId) : null;
  }

  function displayUnitCard(image, hint, instanceId, role) {
    const unit = instanceId && loadOwnedUnits().get(instanceId);
    image.hidden = !unit;
    if (unit) {
      image.src = `art/v2-style/ui/unit-card-${unit.slug}.png?v=19`;
      image.alt = `${unit.name} ${role} 카드`;
    } else image.removeAttribute("src");
    hint.textContent = unit?.name || (role === "재료" ? "아래에서 마물을 선택" : "계승 결과 대기");
  }

  function displayMaterial() {
    const sourceCard = selectedBrandCard();
    if (sourceCard) {
      materialCard.hidden = false;
      materialCard.src = V2BrandCards.imagePath();
      materialCard.alt = V2BrandCards.label(sourceCard);
      materialHint.textContent = V2BrandCards.label(sourceCard);
      return;
    }
    displayUnitCard(materialCard, materialHint, materialInstanceId, "재료");
  }

  function appendBrand(brand, origin) {
    const row = document.createElement("li");
    const name = document.createElement("strong");
    const marks = document.createElement("small");
    name.textContent = `${origin} · ${V2Rules.definitions[brand.type]?.name || brand.type}`;
    marks.textContent = `축 ${brand.bless.join(",") || "-"}${brand.curse.length ? `  저 ${brand.curse.join(",")}` : ""}`;
    row.append(name, marks);
    brandList.append(row);
  }

  function appendBrands(unit, origin) {
    unit.brands.forEach((brand, index) => {
      appendBrand(brand, completed && origin === "결과" && index === unit.brands.length - 1 ? "계승" : origin);
    });
  }

  function renderSelection() {
    const owned = loadOwnedUnits();
    const material = owned.get(materialInstanceId);
    const result = owned.get(resultInstanceId);
    const sourceCard = selectedBrandCard();
    displayMaterial();
    displayUnitCard(resultCard, resultHint, resultInstanceId, "결과");

    cards.querySelectorAll("button").forEach((card) => {
      const selected = card.dataset.instanceId === materialInstanceId || card.dataset.instanceId === resultInstanceId;
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-pressed", String(selected));
    });
    brandCards?.querySelectorAll("button").forEach((card) => {
      const selected = card.dataset.brandCardId === selectedBrandCardId;
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-pressed", String(selected));
    });

    brandList.replaceChildren();
    if (result) appendBrands(result, completed ? "결과" : "기존");
    if (material) appendBrands(material, "재료");
    if (sourceCard) appendBrand(sourceCard.brand, "낙인 카드");
    brandList.hidden = !brandList.childElementCount;
    brandHint.hidden = false;

    if (notice) brandHint.textContent = notice;
    else if (completed) brandHint.textContent = `적용 완료 · ${V2Rules.definitions[inheritedBrand?.type]?.name || "낙인"} ${inheritedPart === "bless" ? "축복" : inheritedPart === "both" ? "축복+저주" : "저주"}`;
    else if (sourceCard && !result) brandHint.textContent = `${V2BrandCards.label(sourceCard)} · 적용할 마물을 선택하세요`;
    else if (sourceCard && result) brandHint.textContent = `${V2BrandCards.label(sourceCard)} · 적용 준비`;
    else if (!material) brandHint.textContent = "재료 마물 또는 왼쪽 낙인 카드를 선택하세요";
    else if (!result) brandHint.textContent = "다음으로 결과 카드를 선택하세요";
    else brandHint.textContent = "마물 계승: 축복 50% · 둘 다 30% · 저주 20%";

    inheritButton.disabled = sourceCard
      ? !result || result.brands.length >= 3
      : !material || !result || !material.brands.length || result.brands.length >= 3;
  }

  function selectMonster(instanceId) {
    if (completed) {
      materialInstanceId = null; resultInstanceId = null; selectedBrandCardId = null; completed = false;
    }
    notice = "";
    if (selectedBrandCardId) {
      if (instanceId === resultInstanceId) resultInstanceId = null;
      else if (loadOwnedUnits().get(instanceId)?.brands.length >= 3) notice = "낙인 3칸이 찬 마물에는 낙인 카드를 적용할 수 없습니다";
      else resultInstanceId = instanceId;
      renderSelection();
      return;
    }
    if (instanceId === materialInstanceId) { materialInstanceId = null; resultInstanceId = null; }
    else if (instanceId === resultInstanceId) resultInstanceId = null;
    else if (!materialInstanceId) materialInstanceId = instanceId;
    else if (loadOwnedUnits().get(instanceId)?.brands.length >= 3) notice = "낙인 3칸이 찬 마물은 결과 카드가 될 수 없습니다";
    else resultInstanceId = instanceId;
    renderSelection();
  }

  function selectBrandCard(cardId) {
    if (completed) completed = false;
    notice = "";
    if (selectedBrandCardId === cardId) {
      selectedBrandCardId = null;
      resultInstanceId = null;
    } else {
      selectedBrandCardId = cardId;
      materialInstanceId = null;
      resultInstanceId = null;
    }
    renderSelection();
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
      card.addEventListener("click", () => selectMonster(unit.instanceId));
      cards.append(card);
    }
  }

  function renderBrandCards() {
    if (!brandCards) return;
    brandCards.replaceChildren();
    const inventory = V2BrandCards.load();
    inventory.forEach((item, index) => {
      const card = document.createElement("button");
      const image = document.createElement("img");
      const description = document.createElement("span");
      const spread = Math.min(52, 310 / Math.max(1, inventory.length - 1));
      card.type = "button";
      card.className = "home-inheritance-brand-card";
      card.dataset.brandCardId = item.id;
      card.setAttribute("aria-label", V2BrandCards.label(item));
      card.setAttribute("aria-pressed", "false");
      card.style.setProperty("--brand-i", index);
      card.style.setProperty("--brand-x", `${index * spread}%`);
      card.style.setProperty("--brand-y", `${-Math.abs((inventory.length - 1) / 2 - index) * 1.6}%`);
      card.style.setProperty("--brand-rot", `${(index - (inventory.length - 1) / 2) * 2.4}deg`);
      image.src = V2BrandCards.imagePath();
      image.alt = "";
      description.className = "home-inheritance-brand-card-text";
      description.textContent = V2BrandCards.label(item).replaceAll(" · ", " ");
      card.append(image, description);
      card.addEventListener("click", () => selectBrandCard(item.id));
      brandCards.append(card);
    });
    brandCards.classList.toggle("is-empty", inventory.length === 0);
    brandCards.setAttribute("aria-label", inventory.length ? `보유 낙인 카드 ${inventory.length}장` : "보유 낙인 카드 없음");
  }

  function open() {
    if (!overlay) return;
    materialInstanceId = null;
    resultInstanceId = null;
    selectedBrandCardId = null;
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
    selectedBrandCardId = null;
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
    const result = owned.get(resultInstanceId);
    const sourceCard = selectedBrandCard();

    if (sourceCard) {
      if (!result || result.brands.length >= 3 || !V2Rules.validateBrand(sourceCard.brand)) return;
      const applied = JSON.parse(JSON.stringify(sourceCard.brand));
      result.brands.push(applied);
      if (!saveOwnedUnits()) {
        result.brands.pop();
        notice = "낙인 카드 적용 저장에 실패했습니다";
        renderSelection();
        return;
      }
      if (!V2BrandCards.remove(sourceCard.id)) {
        result.brands.pop();
        saveOwnedUnits();
        notice = "낙인 카드 소비 저장에 실패했습니다";
        renderSelection();
        return;
      }
      inheritedBrand = applied;
      inheritedPart = applied.curse.length ? "both" : "bless";
      selectedBrandCardId = null;
      completed = true;
      renderBrandCards();
      renderSelection();
      window.dispatchEvent?.(new CustomEvent("v2-roster-changed", {
        detail: { donorInstanceId: null, recipient: JSON.parse(JSON.stringify(result)), source: "brand-card" }
      }));
      return;
    }

    const material = owned.get(materialInstanceId);
    if (!material || !result || !material.brands.length || result.brands.length >= 3) return;
    const randomIndex = Math.floor(Math.random() * material.brands.length);
    const part = V2Rules.inheritancePart(material.brands[randomIndex], Math.random);
    V2Rules.inherit(result, material, randomIndex, part);
    inheritedBrand = result.brands[result.brands.length - 1];
    inheritedPart = part;
    owned.delete(materialInstanceId);
    if (!saveOwnedUnits()) return;
    const donorInstanceId = materialInstanceId;
    materialInstanceId = null;
    completed = true;
    renderCards();
    renderBrandCards();
    renderSelection();
    window.dispatchEvent?.(new CustomEvent("v2-roster-changed", {
      detail: { donorInstanceId, recipient: JSON.parse(JSON.stringify(result)), source: "monster-inheritance" }
    }));
  }

  inheritButton?.addEventListener("click", inherit);
  closeButton?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay?.hidden) { event.stopImmediatePropagation(); close(); }
  });
  window.V2HomeInheritance = Object.freeze({ open, close });
})();
