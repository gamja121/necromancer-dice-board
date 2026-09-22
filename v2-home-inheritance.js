(() => {
  "use strict";
  const SLUGS = ["death-knight", "skeleton-spear", "ghoul", "ancient-treant", "goblin-rider",
    "minotaur", "plague-doctor", "spider-knight", "hydra", "siren"];
  const overlay = document.getElementById("homeInheritanceOverlay");
  const cards = document.getElementById("homeInheritanceCards");
  const closeButton = document.getElementById("homeInheritanceClose");
  const materialCard = document.getElementById("homeInheritanceMaterialCard");
  const materialHint = document.getElementById("homeInheritanceMaterialHint");
  const resultCard = document.getElementById("homeInheritanceResultCard");
  const resultHint = document.getElementById("homeInheritanceResultHint");
  const brandHint = document.getElementById("homeInheritanceBrandHint");
  const brandList = document.getElementById("homeInheritanceBrandList");
  const partChoices = document.getElementById("homeInheritanceParts");
  const inheritButton = document.getElementById("homeInheritanceConfirm");
  const backdrop = overlay?.querySelector(".home-inheritance-backdrop");
  let ownedUnits;
  let materialSlug = null;
  let resultSlug = null;
  let completed = false;
  let selectedBrandIndex = 0;
  let selectedPart = null;
  let notice = "";

  function loadOwnedUnits() {
    if (ownedUnits) return ownedUnits;
    let saved;
    try { if (typeof sessionStorage !== "undefined") saved = JSON.parse(sessionStorage.getItem("necromancer-map-test-roster-v1")); } catch (_) { /* Storage can be unavailable. */ }
    const valid = Array.isArray(saved) && saved.length <= SLUGS.length &&
      new Set(saved.map((unit) => unit?.slug)).size === saved.length && saved.every((unit) =>
        SLUGS.includes(unit?.slug) && Number.isFinite(unit.maxHp) && Number.isFinite(unit.attack) &&
        Number.isFinite(unit.speed) && Array.isArray(unit.brands) && unit.brands.length <= 3 &&
        unit.brands.every(V2Rules.validateBrand));
    const roster = valid ? saved : SLUGS.map((slug) => V2Rules.individual(slug));
    if (!valid) try { if (typeof sessionStorage !== "undefined") sessionStorage.setItem("necromancer-map-test-roster-v1", JSON.stringify(roster)); } catch (_) { /* Keep this session's units in memory. */ }
    ownedUnits = new Map(roster.map((unit) => [unit.slug, unit]));
    return ownedUnits;
  }

  function displayCard(image, hint, slug, role) {
    const unit = slug && loadOwnedUnits().get(slug);
    image.hidden = !unit;
    if (unit) {
      image.src = `art/v2-style/ui/unit-card-${slug}.png?v=19`;
      image.alt = `${unit.name} ${role} 카드`;
    } else image.removeAttribute("src");
    hint.textContent = unit?.name || (role === "재료" ? "아래에서 마물을 선택" : "계승 결과 대기");
  }

  function appendBrands(unit, origin, selectable = false) {
    unit.brands.forEach((brand, index) => {
      const row = document.createElement("li");
      const content = selectable ? document.createElement("button") : row;
      const name = document.createElement("strong");
      const marks = document.createElement("small");
      const preview = selectable && index === selectedBrandIndex && selectedPart;
      const bless = preview && selectedPart === "curse" ? [] : brand.bless;
      const curse = preview && selectedPart === "bless" ? [] : brand.curse;
      name.textContent = `${preview ? "계승 예정" : origin} · ${V2Rules.definitions[brand.type]?.name || brand.type}`;
      marks.textContent = `축복 ${bless.join(", ") || "없음"} · 저주 ${curse.join(", ") || "없음"}`;
      content.append(name, marks);
      if (selectable) {
        content.type = "button";
        content.classList.toggle("is-selected", index === selectedBrandIndex);
        content.setAttribute("aria-pressed", String(index === selectedBrandIndex));
        content.addEventListener("click", () => { selectedBrandIndex = index; selectedPart = null; notice = ""; renderSelection(); });
        row.append(content);
      }
      brandList.append(row);
    });
  }

  function renderSelection() {
    const owned = loadOwnedUnits();
    const material = owned.get(materialSlug);
    const result = owned.get(resultSlug);
    displayCard(materialCard, materialHint, materialSlug, "재료");
    displayCard(resultCard, resultHint, resultSlug, "결과");
    cards.querySelectorAll("button").forEach((card) => {
      const selected = card.dataset.slug === materialSlug || card.dataset.slug === resultSlug;
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-pressed", String(selected));
    });
    brandList.replaceChildren();
    if (result) appendBrands(result, completed ? "계승 결과" : "기존");
    if (material) appendBrands(material, "재료", true);
    brandList.hidden = !brandList.childElementCount;
    brandHint.hidden = false;
    const chosen = material?.brands[selectedBrandIndex];
    if (notice) brandHint.textContent = notice;
    else if (completed) brandHint.textContent = "계승 완료 · 기존 낙인과 함께 표시";
    else if (!material) brandHint.textContent = "재료 카드를 선택하세요";
    else if (!result) brandHint.textContent = "다음으로 결과 카드를 선택하세요";
    else brandHint.textContent = chosen ? (selectedPart ? "기존 + 계승 예정 낙인" : "재료 낙인과 옮길 효과를 선택하세요") : "계승할 낙인이 없습니다";
    partChoices.hidden = !chosen || completed;
    partChoices.querySelectorAll("button").forEach((button) => {
      const part = button.dataset.inheritPart;
      button.disabled = part === "bless" ? !chosen?.bless.length : part === "curse" ? !chosen?.curse.length : !chosen?.bless.length || !chosen?.curse.length;
      button.classList.toggle("is-selected", part === selectedPart);
      button.setAttribute("aria-pressed", String(part === selectedPart));
    });
    inheritButton.disabled = !material || !result || !chosen || !selectedPart || result.brands.length >= 3;
  }

  function selectCard(slug) {
    if (completed) { materialSlug = null; resultSlug = null; completed = false; }
    notice = "";
    if (slug === materialSlug) { materialSlug = null; resultSlug = null; selectedPart = null; }
    else if (slug === resultSlug) resultSlug = null;
    else if (!materialSlug) { materialSlug = slug; selectedBrandIndex = 0; selectedPart = null; }
    else if (loadOwnedUnits().get(slug)?.brands.length >= 3) notice = "낙인 3칸이 찬 마물은 결과 카드가 될 수 없습니다";
    else resultSlug = slug;
    renderSelection();
  }

  function renderCards() {
    if (!cards) return;
    cards.replaceChildren();
    for (const slug of SLUGS) {
      if (!loadOwnedUnits().has(slug)) continue;
      const name = V2DesignData.units[slug]?.name || slug;
      const card = document.createElement("button");
      const image = document.createElement("img");
      const label = document.createElement("span");
      card.type = "button";
      card.dataset.slug = slug;
      card.setAttribute("aria-label", name);
      card.setAttribute("aria-pressed", "false");
      image.src = `art/v2-style/ui/unit-card-${slug}.png?v=19`;
      image.alt = "";
      label.textContent = name;
      card.append(image, label);
      card.addEventListener("click", () => selectCard(slug));
      cards.append(card);
    }
  }

  function open() {
    if (!overlay) return;
    materialSlug = null;
    resultSlug = null;
    completed = false;
    selectedBrandIndex = 0;
    selectedPart = null;
    notice = "";
    renderCards();
    renderSelection();
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
    materialSlug = null;
    resultSlug = null;
    completed = false;
    selectedPart = null;
    notice = "";
    renderSelection();
  }

  function inherit() {
    const owned = loadOwnedUnits();
    const material = owned.get(materialSlug);
    const result = owned.get(resultSlug);
    if (!material || !result || !material.brands[selectedBrandIndex] || !selectedPart || result.brands.length >= 3) return;
    V2Rules.inherit(result, material, selectedBrandIndex, selectedPart);
    owned.delete(materialSlug);
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem("necromancer-map-test-roster-v1",
        JSON.stringify(SLUGS.filter((slug) => owned.has(slug)).map((slug) => owned.get(slug))));
    } catch (_) { /* Keep the current session in memory. */ }
    const donorSlug = materialSlug;
    materialSlug = null;
    completed = true;
    renderCards();
    renderSelection();
    window.dispatchEvent?.(new CustomEvent("v2-roster-changed", { detail: { donorSlug, recipient: JSON.parse(JSON.stringify(result)) } }));
  }

  partChoices?.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    if (button.disabled) return;
    selectedPart = button.dataset.inheritPart;
    notice = "";
    renderSelection();
  }));
  inheritButton?.addEventListener("click", inherit);
  closeButton?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay?.hidden) { event.stopImmediatePropagation(); close(); }
  });
  window.V2HomeInheritance = Object.freeze({ open, close });
})();
