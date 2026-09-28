(() => {
  "use strict";

  const OWNED_ROSTER_KEY = "necromancer-map-roster-v2";
  const MAX_ENHANCEMENTS = 3;
  const ATTACK_BONUS = 1;
  const MAX_HP_BONUS = 2;

  const trigger = document.getElementById("tileEventRitual");
  if (!trigger) return;

  const overlay = document.createElement("section");
  overlay.id = "altarRitualOverlay";
  overlay.className = "altar-ritual-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "제단 의식 · 재물과 강화");
  overlay.hidden = true;
  overlay.innerHTML = `
    <button class="altar-ritual-backdrop" type="button" aria-label="제단 의식 창 닫기"></button>
    <div class="altar-ritual-shell">
      <header class="altar-ritual-header">
        <strong>제단 의식</strong>
        <button id="altarRitualClose" type="button">닫기</button>
      </header>
      <div class="altar-ritual-slots" aria-label="재물과 강화 대상">
        <div class="altar-ritual-slot altar-ritual-material">
          <b>재물</b>
          <img id="altarRitualMaterialCard" alt="" hidden>
          <span id="altarRitualMaterialHint">아래에서 재물로 바칠 마물 선택</span>
        </div>
        <div class="altar-ritual-slot altar-ritual-target">
          <b>강화</b>
          <img id="altarRitualTargetCard" alt="" hidden>
          <span id="altarRitualTargetHint">다음으로 강화할 마물 선택</span>
        </div>
      </div>
      <div class="altar-ritual-info">
        <strong>피의 의식</strong>
        <p id="altarRitualMessage">재물은 영구 소멸합니다. 강화 대상은 공격력 +1 · 최대 체력 +2를 얻습니다.</p>
        <small id="altarRitualLevel">강화 대상 선택 전</small>
        <button id="altarRitualConfirm" type="button" disabled>의식 실행</button>
      </div>
      <div id="altarRitualCards" class="altar-ritual-cards" aria-label="보유 마물"></div>
    </div>`;
  document.getElementById("mapBoard")?.append(overlay);

  const el = {
    backdrop: overlay.querySelector(".altar-ritual-backdrop"),
    close: overlay.querySelector("#altarRitualClose"),
    cards: overlay.querySelector("#altarRitualCards"),
    materialCard: overlay.querySelector("#altarRitualMaterialCard"),
    materialHint: overlay.querySelector("#altarRitualMaterialHint"),
    targetCard: overlay.querySelector("#altarRitualTargetCard"),
    targetHint: overlay.querySelector("#altarRitualTargetHint"),
    message: overlay.querySelector("#altarRitualMessage"),
    level: overlay.querySelector("#altarRitualLevel"),
    confirm: overlay.querySelector("#altarRitualConfirm")
  };

  let roster = new Map();
  let materialId = null;
  let targetId = null;
  let completed = false;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function unitName(unit) {
    return globalThis.V2DesignData?.units?.[unit.slug]?.name || unit.name || unit.slug;
  }

  function enhancementLevel(unit) {
    return Math.max(0, Math.min(MAX_ENHANCEMENTS, Number(unit?.altarEnhancements) || 0));
  }

  function loadRoster() {
    let saved = [];
    try {
      const parsed = JSON.parse(sessionStorage.getItem(OWNED_ROSTER_KEY));
      if (Array.isArray(parsed)) saved = parsed;
    } catch (_) {}
    roster = new Map(saved.filter(unit => unit && typeof unit.instanceId === "string" && unit.instanceId)
      .map(unit => [unit.instanceId, unit]));
    return roster;
  }

  function saveRoster() {
    sessionStorage.setItem(OWNED_ROSTER_KEY, JSON.stringify([...roster.values()]));
  }

  function setPreview(image, hint, unit, emptyText) {
    image.hidden = !unit;
    if (!unit) {
      image.removeAttribute("src");
      image.alt = "";
      hint.textContent = emptyText;
      return;
    }
    image.src = `art/v2-style/ui/unit-card-${unit.slug}.png?v=19`;
    image.alt = `${unitName(unit)} 카드`;
    hint.textContent = unitName(unit);
  }

  function renderCards() {
    el.cards.replaceChildren();
    for (const unit of roster.values()) {
      const button = document.createElement("button");
      const image = document.createElement("img");
      const label = document.createElement("span");
      const level = document.createElement("small");
      button.type = "button";
      button.dataset.instanceId = unit.instanceId;
      button.classList.toggle("is-selected", unit.instanceId === materialId || unit.instanceId === targetId);
      button.setAttribute("aria-pressed", String(button.classList.contains("is-selected")));
      image.src = `art/v2-style/ui/unit-card-${unit.slug}.png?v=19`;
      image.alt = "";
      label.textContent = unitName(unit);
      level.textContent = `강화 ${enhancementLevel(unit)}/${MAX_ENHANCEMENTS}`;
      button.append(image, label, level);
      button.addEventListener("click", () => selectUnit(unit.instanceId));
      el.cards.append(button);
    }
  }

  function render() {
    const material = roster.get(materialId);
    const target = roster.get(targetId);
    setPreview(el.materialCard, el.materialHint, material, "아래에서 재물로 바칠 마물 선택");
    setPreview(el.targetCard, el.targetHint, target, "다음으로 강화할 마물 선택");

    if (target) el.level.textContent = `강화 단계 ${enhancementLevel(target)}/${MAX_ENHANCEMENTS}`;
    else el.level.textContent = "강화 대상 선택 전";

    if (completed && target) {
      el.message.textContent = `${unitName(target)} 강화 완료 · 공격력 +${ATTACK_BONUS} · 최대 체력 +${MAX_HP_BONUS}`;
    } else if (!material) {
      el.message.textContent = "재물로 바칠 마물을 먼저 선택하세요. 재물은 의식 후 영구 소멸합니다.";
    } else if (!target) {
      el.message.textContent = "강화할 마물을 선택하세요. 같은 마물을 재물과 강화 대상으로 동시에 선택할 수 없습니다.";
    } else if (enhancementLevel(target) >= MAX_ENHANCEMENTS) {
      el.message.textContent = "이 마물은 제단 강화 한도에 도달했습니다.";
    } else {
      el.message.textContent = `${unitName(material)}을 재물로 바쳐 ${unitName(target)}의 공격력 +${ATTACK_BONUS} · 최대 체력 +${MAX_HP_BONUS}`;
    }

    el.confirm.disabled = completed || !material || !target || material.instanceId === target.instanceId ||
      enhancementLevel(target) >= MAX_ENHANCEMENTS;
    renderCards();
  }

  function selectUnit(instanceId) {
    if (!roster.has(instanceId)) return;
    if (completed) {
      materialId = null;
      targetId = null;
      completed = false;
    }
    if (instanceId === materialId) {
      materialId = null;
      targetId = null;
    } else if (instanceId === targetId) {
      targetId = null;
    } else if (!materialId) {
      materialId = instanceId;
    } else if (instanceId !== materialId) {
      targetId = instanceId;
    }
    render();
  }

  function performRitual() {
    const material = roster.get(materialId);
    const target = roster.get(targetId);
    if (!material || !target || material.instanceId === target.instanceId || enhancementLevel(target) >= MAX_ENHANCEMENTS) return;

    const oldMaxHp = target.maxHp;
    target.attack = Math.max(1, Number(target.attack) || 1) + ATTACK_BONUS;
    target.maxHp = Math.max(1, Number(target.maxHp) || 1) + MAX_HP_BONUS;
    const currentHp = Number.isFinite(target.currentHp) ? target.currentHp : oldMaxHp;
    target.currentHp = Math.min(target.maxHp, Math.max(0, currentHp) + MAX_HP_BONUS);
    target.altarEnhancements = enhancementLevel(target) + 1;

    const donorInstanceId = material.instanceId;
    roster.delete(donorInstanceId);
    saveRoster();
    materialId = null;
    completed = true;
    render();

    window.dispatchEvent?.(new CustomEvent("v2-roster-changed", {
      detail: { donorInstanceId, recipient: clone(target), source: "altar-ritual" }
    }));
  }

  function open() {
    loadRoster();
    materialId = null;
    targetId = null;
    completed = false;
    render();
    overlay.hidden = false;
    overlay.classList.remove("is-open");
    void overlay.offsetWidth;
    overlay.classList.add("is-open");
    el.close.focus();
  }

  function close() {
    if (overlay.hidden) return;
    overlay.classList.remove("is-open");
    overlay.hidden = true;
    materialId = null;
    targetId = null;
    completed = false;
  }

  trigger.addEventListener("click", open);
  el.confirm.addEventListener("click", performRitual);
  el.close.addEventListener("click", close);
  el.backdrop.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) {
      event.stopImmediatePropagation();
      close();
    }
  });

  globalThis.V2AltarRitual = Object.freeze({ open, close });
})();