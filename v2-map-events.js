(() => {
  "use strict";

  const FLAG_KEY = "necromancer-v2-story-flags-v1";
  const LOOP_KEY = "necromancer-v2-story-loop-v1";
  const TILE_LOCATION = Object.freeze({
    forest: "forest",
    village: "village",
    graveyard: "graveyard",
    unknown: "altar"
  });

  function safeRead(key, fallback) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function safeWrite(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function create(options = {}) {
    const events = Array.isArray(globalThis.V2EventData?.events) ? globalThis.V2EventData.events : [];
    const eventById = new Map(events.map((event) => [event.id, event]));
    const flags = safeRead(FLAG_KEY, {});
    let loop = Math.max(1, Number(safeRead(LOOP_KEY, 1)) || 1);

    function refreshSharedState() {
      const latestFlags = safeRead(FLAG_KEY, {});
      for (const key of Object.keys(flags)) delete flags[key];
      Object.assign(flags, latestFlags && typeof latestFlags === "object" ? latestFlags : {});
      loop = Math.max(1, Number(safeRead(LOOP_KEY, loop)) || loop || 1);
    }
    let currentEvent = null;
    let pendingChoice = null;
    let resolved = false;

    const {
      panel,
      title,
      text,
      choices,
      outcome,
      rollBox,
      rollLabel,
      rollButton,
      rollResult,
      image,
      getContamination,
      addContamination,
      getMonsterTags,
      onStateChanged
    } = options;

    function flag(name) {
      return flags[name] === true;
    }

    function saveFlags() {
      safeWrite(FLAG_KEY, flags);
      safeWrite(LOOP_KEY, loop);
      if (typeof onStateChanged === "function") onStateChanged({ flags: { ...flags }, loop });
    }

    function eventAvailable(event) {
      const conditions = event?.conditions || {};
      const contamination = Number(getContamination?.() || 0);
      if (Number.isFinite(conditions.minContamination) && contamination < conditions.minContamination) return false;
      if (Number.isFinite(conditions.maxContamination) && contamination > conditions.maxContamination) return false;
      if (Number.isFinite(conditions.minLoop) && loop < conditions.minLoop) return false;
      for (const name of conditions.flagsTrue || []) if (!flag(name)) return false;
      for (const name of conditions.flagsFalse || []) if (flag(name)) return false;
      return true;
    }

    function choiceAvailable(choice) {
      const req = choice?.requires || {};
      const tags = new Set(getMonsterTags?.() || []);
      for (const tag of req.monsterTags || []) if (!tags.has(tag)) return false;
      for (const name of req.flagsTrue || []) if (!flag(name)) return false;
      return true;
    }

    function applyFlags(values = {}) {
      for (const [name, value] of Object.entries(values)) flags[name] = Boolean(value);
      saveFlags();
    }

    function applyContamination(amount = 0) {
      const delta = Number(amount) || 0;
      if (delta) addContamination?.(delta);
    }

    function showOutcome(message) {
      outcome.hidden = false;
      outcome.textContent = message || "결과가 적용되었습니다.";
      choices.hidden = true;
      rollBox.hidden = true;
    }

    function finishDirectChoice(choice) {
      applyFlags(choice.setFlags);
      applyContamination(choice.addContamination);
      resolved = true;
      showOutcome(choice.outcome || "선택 결과가 적용되었습니다.");
    }

    function resolveRoll() {
      if (!currentEvent || !pendingChoice?.roll || resolved) return;
      const value = 1 + Math.floor(Math.random() * 6);
      const success = value >= pendingChoice.roll.dc;
      rollResult.textContent = `${value} / DC ${pendingChoice.roll.dc} · ${success ? "성공" : "실패"}`;
      if (success) {
        applyFlags(pendingChoice.successFlags);
        applyContamination(pendingChoice.successContamination);
      } else {
        applyFlags(pendingChoice.failFlags);
        applyContamination(pendingChoice.failContamination);
      }
      resolved = true;
      showOutcome(success ? pendingChoice.roll.successText : pendingChoice.roll.failText);
      pendingChoice = null;
    }

    function queueRoll(choice) {
      pendingChoice = choice;
      choices.hidden = true;
      outcome.hidden = true;
      rollBox.hidden = false;
      rollLabel.textContent = `${choice.roll.stat} 판정 · DC ${choice.roll.dc}`;
      rollResult.textContent = "d6";
      rollButton.disabled = false;
      rollButton.focus();
    }

    function renderChoices(event) {
      choices.replaceChildren();
      choices.hidden = false;
      for (const choice of event.choices || []) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tile-story-choice";
        const available = choiceAvailable(choice);
        button.disabled = !available;
        button.textContent = choice.text;
        if (!available) {
          const hint = document.createElement("small");
          hint.textContent = "조건 미충족";
          button.append(hint);
        } else if (choice.roll) {
          const hint = document.createElement("small");
          hint.textContent = `${choice.roll.stat} DC ${choice.roll.dc}`;
          button.append(hint);
        }
        button.addEventListener("click", () => {
          if (!available || resolved) return;
          if (choice.roll) queueRoll(choice);
          else finishDirectChoice(choice);
        });
        choices.append(button);
      }
    }

    function renderEvent(event) {
      currentEvent = event;
      pendingChoice = null;
      resolved = false;
      panel.hidden = false;
      title.textContent = event.title;
      text.textContent = event.text;
      outcome.hidden = true;
      outcome.textContent = "";
      rollBox.hidden = true;
      rollResult.textContent = "";
      if (image && event.art) {
        image.src = event.art;
        image.alt = `${event.locationLabel || "사건"} · ${event.title}`;
      }
      renderChoices(event);
    }

    function openForTile(tileId) {
      refreshSharedState();
      const location = TILE_LOCATION[tileId];
      if (!location || !events.length) return false;
      const event = events.find((item) => item.location === location && eventAvailable(item));
      if (!event) return false;
      renderEvent(event);
      return true;
    }

    function close() {
      currentEvent = null;
      pendingChoice = null;
      resolved = false;
      if (panel) panel.hidden = true;
      if (choices) choices.replaceChildren();
      if (outcome) {
        outcome.hidden = true;
        outcome.textContent = "";
      }
      if (rollBox) rollBox.hidden = true;
    }

    function advanceLoop() {
      loop += 1;
      saveFlags();
      return loop;
    }

    function snapshot() {
      return { flags: { ...flags }, loop, currentEventId: currentEvent?.id || null };
    }

    rollButton?.addEventListener("click", resolveRoll);

    return Object.freeze({
      openForTile,
      close,
      advanceLoop,
      snapshot,
      eventAvailable: (id) => eventAvailable(eventById.get(id))
    });
  }

  globalThis.V2MapEvents = Object.freeze({ create });
})();