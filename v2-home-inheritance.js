(() => {
  "use strict";
  const SLUGS = ["death-knight", "skeleton-spear", "ghoul", "ancient-treant", "goblin-rider",
    "minotaur", "plague-doctor", "spider-knight", "hydra", "siren"];
  const overlay = document.getElementById("homeInheritanceOverlay");
  const cards = document.getElementById("homeInheritanceCards");
  const closeButton = document.getElementById("homeInheritanceClose");
  const backdrop = overlay?.querySelector(".home-inheritance-backdrop");

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
  }

  closeButton?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay?.hidden) { event.stopImmediatePropagation(); close(); }
  });
  window.V2HomeInheritance = Object.freeze({ open, close });
})();
