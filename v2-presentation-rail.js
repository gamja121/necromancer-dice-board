(function (root) {
  "use strict";

  const MAX_BRANDS = 3;
  const HIDE_DELAY = 1450;
  let hideTimer = null;

  function createNode(className, text) {
    const node = document.createElement("span");
    node.className = className;
    node.textContent = text;
    return node;
  }

  function ensureRail() {
    const battlefield = document.getElementById("battlefield");
    if (!battlefield) return null;
    let rail = document.getElementById("presentationRail");
    if (rail) return rail;

    rail = document.createElement("div");
    rail.id = "presentationRail";
    rail.className = "presentation-rail";
    rail.setAttribute("aria-live", "polite");
    rail.hidden = true;
    battlefield.append(rail);
    return rail;
  }

  function wake(rail) {
    if (!rail) return;
    clearTimeout(hideTimer);
    rail.hidden = false;
    rail.classList.remove("is-hiding");
  }

  function scheduleHide(rail, delay = HIDE_DELAY) {
    clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      rail.classList.add("is-hiding");
      window.setTimeout(() => {
        if (!rail.classList.contains("is-hiding")) return;
        rail.hidden = true;
        rail.replaceChildren();
        rail.classList.remove("is-hiding");
      }, 180);
    }, delay);
  }

  function resetForDice(rail, roll) {
    rail.replaceChildren();
    rail.append(createNode("presentation-step is-dice", `🎲 ${roll}`));
  }

  function appendArrow(rail) {
    if (!rail.childElementCount) return;
    rail.append(createNode("presentation-arrow", "→"));
  }

  function appendBrands(rail, triggers) {
    const list = Array.isArray(triggers) ? triggers : [];
    if (!list.length) return;
    appendArrow(rail);

    const group = document.createElement("span");
    group.className = "presentation-brand-group";
    list.slice(0, MAX_BRANDS).forEach((trigger) => {
      const icon = trigger.mode === "curse" ? "☠" : "✦";
      const label = String(trigger.brandName || trigger.brand || "낙인").replace("의 낙인", "");
      group.append(createNode(`presentation-step is-brand is-${trigger.mode || "blessing"}`, `${icon} ${label}`));
    });
    if (list.length > MAX_BRANDS) group.append(createNode("presentation-more", `+${list.length - MAX_BRANDS}`));
    rail.append(group);
  }

  function appendAttack(rail, event) {
    appendArrow(rail);
    const source = event.sourceName || "공격";
    rail.append(createNode("presentation-step is-attack", `⚔ ${source}`));
  }

  function appendHit(rail, event) {
    appendArrow(rail);
    const amount = Number(event.value) || 0;
    rail.append(createNode("presentation-step is-hit", amount > 0 ? `−${amount}` : "막음"));
  }

  function onPresentation(event) {
    const detail = event?.detail;
    if (!detail || detail.phase !== "start") return;
    const rail = ensureRail();
    if (!rail) return;
    wake(rail);

    switch (detail.type) {
      case "dice-result":
        resetForDice(rail, detail.roll ?? detail.value ?? "?");
        scheduleHide(rail, 2200);
        break;
      case "brand-trigger": {
        const triggers = detail.event?.triggers || [];
        appendBrands(rail, triggers);
        scheduleHide(rail, 2200);
        break;
      }
      case "attack":
        appendAttack(rail, detail.event || detail);
        scheduleHide(rail, 1800);
        break;
      case "hit":
        appendHit(rail, detail.event || detail);
        scheduleHide(rail, HIDE_DELAY);
        break;
      default:
        break;
    }
  }

  root.addEventListener("v2-presentation-event", onPresentation);
})(globalThis);
