(() => {
  "use strict";
  const SLUGS = ["death-knight", "skeleton-spear", "ghoul", "ancient-treant", "goblin-rider",
    "minotaur", "plague-doctor", "spider-knight", "hydra", "siren"];
  const overlay = document.getElementById("homeInheritanceOverlay");
  const cards = document.getElementById("homeInheritanceCards");
  const closeButton = document.getElementById("homeInheritanceClose");
  const materialCard = document.getElementById("homeInheritanceMaterialCard");
  const materialHint = document.getElementById("homeInheritanceMaterialHint");
  const brandHint = document.getElementById("homeInheritanceBrandHint");
  const brandList = document.getElementById("homeInheritanceBrandList");
  const backdrop = overlay?.querySelector(".home-inheritance-backdrop");
  let ownedUnits;

  function loadOwnedUnits() {
    if (ownedUnits) return ownedUnits;
    let saved;
    try { if (typeof sessionStorage !== "undefined") saved = JSON.parse(sessionStorage.getItem("necromancer-map-test-roster-v1")); } catch (_) { /* Storage can be unavailable. */ }
    const valid = Array.isArray(saved) && saved.length === SLUGS.length && saved.every((unit, index) =>
      unit?.slug === SLUGS[index] && Array.isArray(unit.brands) && unit.brands.every(V2Rules.validateBrand));
    const roster = valid ? saved : SLUGS.map((slug) => V2Rules.individual(slug));
    if (!valid) try { if (typeof sessionStorage !== "undefined") sessionStorage.setItem("necromancer-map-test-roster-v1", JSON.stringify(roster)); } catch (_) { /* Keep this session's units in memory. */ }
    ownedUnits = new Map(roster.map((unit) => [unit.slug, unit]));
    return ownedUnits;
  }

  function clearMaterial() {
    materialCard.hidden = true;
    materialCard.removeAttribute("src");
    materialHint.textContent = "아래에서 마물을 선택";
    brandHint.textContent = "재료 카드를 선택하세요";
    brandHint.hidden = false;
    brandList.hidden = true;
    brandList.replaceChildren();
  }

  function showMaterial(slug) {
    const unit = loadOwnedUnits().get(slug);
    if (!unit) return;
    materialCard.src = `art/v2-style/ui/unit-card-${slug}.png?v=19`;
    materialCard.alt = `${unit.name} 재료 카드`;
    materialCard.hidden = false;
    materialHint.textContent = unit.name;
    brandHint.hidden = true;
    brandList.hidden = false;
    brandList.replaceChildren();
    for (const brand of unit.brands) {
      const row = document.createElement("li");
      const name = document.createElement("strong");
      const marks = document.createElement("small");
      name.textContent = V2Rules.definitions[brand.type]?.name || brand.type;
      marks.textContent = `축복 ${brand.bless.join(", ")} · 저주 ${brand.curse.join(", ")}`;
      row.append(name, marks);
      brandList.append(row);
    }
    if (!unit.brands.length) brandHint.textContent = "낙인 없음";
    brandHint.hidden = unit.brands.length > 0;
  }

  function renderCards() {
    if (!cards || cards.childElementCount) return;
    for (const slug of SLUGS) {
      const name = V2DesignData.units[slug]?.name || slug;
      const card = document.createElement("button");
      const image = document.createElement("img");
      const label = document.createElement("span");
      card.type = "button";
      card.setAttribute("aria-label", name);
      card.setAttribute("aria-pressed", "false");
      image.src = `art/v2-style/ui/unit-card-${slug}.png?v=19`;
      image.alt = "";
      label.textContent = name;
      card.append(image, label);
      card.addEventListener("click", () => {
        const selected = card.classList.contains("is-selected");
        cards.querySelectorAll("button.is-selected").forEach((item) => {
          item.classList.remove("is-selected");
          item.setAttribute("aria-pressed", "false");
        });
        if (!selected) {
          card.classList.add("is-selected");
          card.setAttribute("aria-pressed", "true");
          showMaterial(slug);
        } else {
          clearMaterial();
        }
      });
      cards.append(card);
    }
  }

  function open() {
    if (!overlay) return;
    renderCards();
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
    cards.querySelectorAll("button.is-selected").forEach((item) => {
      item.classList.remove("is-selected");
      item.setAttribute("aria-pressed", "false");
    });
    clearMaterial();
  }

  closeButton?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay?.hidden) { event.stopImmediatePropagation(); close(); }
  });
  window.V2HomeInheritance = Object.freeze({ open, close });
})();
