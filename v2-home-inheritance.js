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
  const inheritButton = document.getElementById("homeInheritanceConfirm");
  const backdrop = overlay?.querySelector(".home-inheritance-backdrop");
  let ownedUnits;
  let materialSlug = null;
  let resultSlug = null;
  let completed = false;
  let inheritedBrand = null;
  let inheritedPart = null;
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

  function selectCard(slug) {
    if (completed) { materialSlug = null; resultSlug = null; completed = false; }
    notice = "";
    if (slug === materialSlug) { materialSlug = null; resultSlug = null; }
    else if (slug === resultSlug) resultSlug = null;
    else if (!materialSlug) materialSlug = slug;
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
    inheritedBrand = null;
    inheritedPart = null;
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
    inheritedBrand = null;
    inheritedPart = null;
    notice = "";
    renderSelection();
  }

  function inherit() {
    const owned = loadOwnedUnits();
    const material = owned.get(materialSlug);
    const result = owned.get(resultSlug);
    if (!material || !result || !material.brands.length || result.brands.length >= 3) return;
    const randomIndex = Math.floor(Math.random() * material.brands.length);
    const part = V2Rules.inheritancePart(material.brands[randomIndex], Math.random);
    V2Rules.inherit(result, material, randomIndex, part);
    inheritedBrand = result.brands[result.brands.length - 1];
    inheritedPart = part;
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

  inheritButton?.addEventListener("click", inherit);
  closeButton?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay?.hidden) { event.stopImmediatePropagation(); close(); }
  });
  window.V2HomeInheritance = Object.freeze({ open, close });
})();
