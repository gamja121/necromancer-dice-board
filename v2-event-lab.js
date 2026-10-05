(() => {
  "use strict";

  const events = V2EventData.events;
  const eventById = new Map(events.map((event) => [event.id, event]));

  const EVENT_BATTLE_RESULT_KEY = "necromancer-event-battle-result-v1";

  const state = {
    contamination: 20,
    loop: 1,
    flags: {},
    monsterTags: new Set(),
    currentEventId: events[0]?.id || null,
    pendingRoll: null,
    history: []
  };

  const el = {
    eventList: document.getElementById("eventList"),
    eventArt: document.getElementById("eventArt"),
    eventScenePreview: document.getElementById("eventScenePreview"),
    eventDialogueAdvance: document.getElementById("eventDialogueAdvance"),
    eventDialogueName: document.querySelector(".event-dialogue-name"),
    eventDialogueText: document.querySelector(".event-dialogue-text"),
    eventLocation: document.getElementById("eventLocation"),
    eventId: document.getElementById("eventId"),
    eventTitle: document.getElementById("eventTitle"),
    eventText: document.getElementById("eventText"),
    conditionSummary: document.getElementById("conditionSummary"),
    choiceList: document.getElementById("choiceList"),
    outcomeBox: document.getElementById("outcomeBox"),
    rollPanel: document.getElementById("rollPanel"),
    rollTitle: document.getElementById("rollTitle"),
    rollHint: document.getElementById("rollHint"),
    diceBox: document.getElementById("diceBox"),
    historyList: document.getElementById("historyList"),
    contaminationInput: document.getElementById("contaminationInput"),
    contaminationValue: document.getElementById("contaminationValue"),
    loopInput: document.getElementById("loopInput"),
    flagList: document.getElementById("flagList"),
    availableEvents: document.getElementById("availableEvents"),
    flagDialog: document.getElementById("flagDialog"),
    newFlagName: document.getElementById("newFlagName")
  };

  function consumeEventBattleResult() {
    let result = null;
    try {
      const raw = sessionStorage.getItem(EVENT_BATTLE_RESULT_KEY);
      if (raw) result = JSON.parse(raw);
      sessionStorage.removeItem(EVENT_BATTLE_RESULT_KEY);
    } catch (_) {}
    if (!result || !eventById.has(result.eventId)) return null;

    state.currentEventId = result.eventId;
    if (result.eventId === "graveyard_child_ambush_01") {
      state.flags.graveyard_child_ambush_seen = true;
      state.flags.graveyard_child_ambush_resolved = true;
      if (result.won) {
        state.flags.graveyard_child_saved = true;
        state.flags.graveyard_child_abandoned = false;
      } else {
        state.flags.graveyard_child_rescue_failed = true;
      }
    }
    return result;
  }

  function flag(name) {
    return state.flags[name] === true;
  }

  function conditionChecks(event) {
    const conditions = event.conditions || {};
    const checks = [];
    if (Number.isFinite(conditions.minContamination)) checks.push({
      label: `오염도 ≥ ${conditions.minContamination}`,
      ok: state.contamination >= conditions.minContamination
    });
    if (Number.isFinite(conditions.maxContamination)) checks.push({
      label: `오염도 ≤ ${conditions.maxContamination}`,
      ok: state.contamination <= conditions.maxContamination
    });
    if (Number.isFinite(conditions.minLoop)) checks.push({
      label: `루프 ≥ ${conditions.minLoop}`,
      ok: state.loop >= conditions.minLoop
    });
    for (const name of conditions.flagsTrue || []) checks.push({ label: `${name} = true`, ok: flag(name) });
    for (const name of conditions.flagsFalse || []) checks.push({ label: `${name} = false`, ok: !flag(name) });
    return checks;
  }

  function eventAvailable(event) {
    return conditionChecks(event).every((check) => check.ok);
  }

  function choiceAvailable(choice) {
    const req = choice.requires || {};
    for (const tag of req.monsterTags || []) {
      if (!state.monsterTags.has(tag)) return false;
    }
    for (const name of req.flagsTrue || []) {
      if (!flag(name)) return false;
    }
    return true;
  }

  function choiceRequirementText(choice) {
    const req = choice.requires || {};
    const parts = [];
    for (const tag of req.monsterTags || []) parts.push(`마물 태그: ${tag}`);
    for (const name of req.flagsTrue || []) parts.push(`${name} = true`);
    return parts.join(" · ");
  }

  function setFlags(values = {}) {
    for (const [name, value] of Object.entries(values)) state.flags[name] = Boolean(value);
  }

  function addContamination(amount = 0) {
    state.contamination = Math.max(0, Math.min(100, state.contamination + amount));
    el.contaminationInput.value = String(state.contamination);
    el.contaminationValue.textContent = String(state.contamination);
  }

  function addHistory(event, text, extra = "") {
    state.history.unshift({
      eventId: event.id,
      title: event.title,
      text,
      extra,
      contamination: state.contamination,
      loop: state.loop
    });
    renderHistory();
  }

  function renderHistory() {
    el.historyList.innerHTML = "";
    if (!state.history.length) {
      el.historyList.innerHTML = '<div class="history-item">아직 실행한 선택이 없습니다.</div>';
      return;
    }
    for (const item of state.history) {
      const row = document.createElement("div");
      row.className = "history-item";
      row.innerHTML = `<b>${item.title}</b> · ${item.text}${item.extra ? `<br>${item.extra}` : ""}<br><small>오염도 ${item.contamination} · 루프 ${item.loop}</small>`;
      el.historyList.append(row);
    }
  }

  function renderFlags() {
    el.flagList.innerHTML = "";
    const names = Object.keys(state.flags).sort();
    if (!names.length) {
      el.flagList.innerHTML = '<div class="available-event none">플래그 없음</div>';
      return;
    }
    for (const name of names) {
      const row = document.createElement("div");
      row.className = "flag-row";
      const code = document.createElement("code");
      code.textContent = name;
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = state.flags[name] ? "true" : "false";
      toggle.textContent = state.flags[name] ? "TRUE" : "FALSE";
      toggle.addEventListener("click", () => {
        state.flags[name] = !state.flags[name];
        refreshAll();
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        delete state.flags[name];
        refreshAll();
      });
      row.append(code, toggle, remove);
      el.flagList.append(row);
    }
  }

  function renderAvailableEvents() {
    el.availableEvents.innerHTML = "";
    const available = events.filter(eventAvailable);
    if (!available.length) {
      el.availableEvents.innerHTML = '<div class="available-event none">현재 조건에서 등장 가능한 사건 없음</div>';
      return;
    }
    for (const event of available) {
      const div = document.createElement("div");
      div.className = "available-event";
      div.textContent = `${event.locationLabel} · ${event.title}`;
      el.availableEvents.append(div);
    }
  }

  function renderEventList() {
    el.eventList.innerHTML = "";
    for (const event of events) {
      const button = document.createElement("button");
      button.type = "button";
      button.classList.toggle("is-selected", event.id === state.currentEventId);
      button.classList.toggle("is-unavailable", !eventAvailable(event));
      button.innerHTML = `<strong>${event.locationLabel} · ${event.title}</strong><small>${event.id}</small>`;
      button.addEventListener("click", () => {
        state.currentEventId = event.id;
        state.pendingRoll = null;
        el.outcomeBox.hidden = true;
        const card = el.eventArt?.closest(".event-card");
        if (card) {
          delete card.dataset.cinematicInitialized;
          card.classList.remove("is-cinematic-choice-ready");
        }
        renderAll();
      });
      el.eventList.append(button);
    }
  }

  function renderConditions(event) {
    el.conditionSummary.innerHTML = "";
    const checks = conditionChecks(event);
    if (!checks.length) {
      el.conditionSummary.innerHTML = '<span class="ok">조건 없음</span>';
      return;
    }
    for (const check of checks) {
      const span = document.createElement("span");
      span.className = check.ok ? "ok" : "no";
      span.textContent = `${check.ok ? "✓" : "✕"} ${check.label}`;
      el.conditionSummary.append(span);
    }
  }

  function showOutcome(text) {
    el.outcomeBox.hidden = false;
    el.outcomeBox.textContent = text;
  }

  function applyDirectChoice(event, choice) {
    setFlags(choice.setFlags);
    addContamination(choice.addContamination || 0);
    showOutcome(choice.outcome || "결과 적용");
    addHistory(event, choice.text, choice.outcome || "");
    state.pendingRoll = null;
    renderStateOnly();

    if (choice.nextEvents?.length) {
      const nextId = choice.nextEvents.find((id) => eventById.has(id));
      if (nextId) {
        const next = document.createElement("button");
        next.type = "button";
        next.textContent = `후속 이벤트로 이동 → ${eventById.get(nextId).title}`;
        next.addEventListener("click", () => {
          state.currentEventId = nextId;
          el.outcomeBox.hidden = true;
          renderAll();
        });
        el.outcomeBox.append(document.createElement("br"), next);
      }
    }
  }

  function queueRoll(event, choice) {
    state.pendingRoll = { eventId: event.id, choiceId: choice.id };
    el.rollPanel.hidden = false;
    el.rollTitle.textContent = `${choice.roll.stat} 판정 · DC ${choice.roll.dc}`;
    el.rollHint.textContent = "시범판은 d6 사용. 정상/강제 성공/강제 실패를 바로 비교할 수 있습니다.";
    el.diceBox.textContent = "?";
  }

  function startEventBattle(event, choice) {
    const enemies = Array.isArray(choice.battle?.enemies)
      ? choice.battle.enemies.filter(Boolean)
      : [];
    if (!enemies.length) {
      showOutcome("전투 상대 정보가 없습니다.");
      return;
    }

    const context = {
      eventId: event.id,
      choiceId: choice.id,
      enemies,
      encounterType: choice.battle?.encounterType || "event",
      startedAt: Date.now()
    };
    try {
      sessionStorage.setItem("necromancer-event-battle-context-v1", JSON.stringify(context));
    } catch (_) {}

    const params = new URLSearchParams({
      from: "event",
      event: event.id,
      encounterType: context.encounterType,
      enemies: enemies.join(",")
    });
    window.location.assign(`v2-auto-battle-practice.html?${params}`);
  }

  function executeChoice(event, choice) {
    if (!choiceAvailable(choice)) return;
    if (choice.action === "eventBattle") {
      startEventBattle(event, choice);
      return;
    }
    if (choice.roll) queueRoll(event, choice);
    else applyDirectChoice(event, choice);
  }

  function resolveRoll(mode) {
    if (!state.pendingRoll) return;
    const event = eventById.get(state.pendingRoll.eventId);
    const choice = event?.choices.find((item) => item.id === state.pendingRoll.choiceId);
    if (!event || !choice?.roll) return;

    let value;
    if (mode === "success") value = Math.max(choice.roll.dc, 6);
    else if (mode === "fail") value = Math.max(1, choice.roll.dc - 1);
    else value = 1 + Math.floor(Math.random() * 6);

    const success = value >= choice.roll.dc;
    el.diceBox.textContent = String(value);
    if (success) {
      setFlags(choice.successFlags);
      addContamination(choice.successContamination || 0);
    } else {
      setFlags(choice.failFlags);
      addContamination(choice.failContamination || 0);
    }
    const outcome = success ? choice.roll.successText : choice.roll.failText;
    showOutcome(`${value} / DC ${choice.roll.dc} · ${success ? "성공" : "실패"}\n${outcome}`);
    addHistory(event, `${choice.text} → ${success ? "성공" : "실패"}`, outcome);
    state.pendingRoll = null;
    renderStateOnly();
    renderCurrentEvent();
  }

  function setCinematicChoiceReady(ready) {
    const card = el.eventArt?.closest(".event-card");
    card?.classList.toggle("is-cinematic-choice-ready", ready === true);
    if (el.eventDialogueAdvance) {
      el.eventDialogueAdvance.disabled = ready === true;
      el.eventDialogueAdvance.setAttribute("aria-expanded", String(ready === true));
    }
  }

  function renderCurrentEvent() {
    const event = eventById.get(state.currentEventId);
    if (!event) return;
    const useScenePreview = event.scene === "graveyard_child_ambush_intro";
    const isRescuedScene = useScenePreview
      && event.id === "graveyard_child_ambush_01"
      && flag("graveyard_child_ambush_resolved")
      && flag("graveyard_child_saved");
    if (el.eventScenePreview) el.eventScenePreview.hidden = !useScenePreview;
    el.eventArt.hidden = useScenePreview;
    const eventCard = el.eventArt.closest(".event-card");
    eventCard?.classList.toggle("is-cinematic-scene", useScenePreview);
    eventCard?.classList.toggle("is-cinematic-rescued", isRescuedScene);
    if (el.eventDialogueName) el.eventDialogueName.textContent = "아이";
    if (el.eventDialogueText) el.eventDialogueText.textContent = isRescuedScene ? "…고마워요." : "…!";
    if (!useScenePreview) {
      eventCard?.classList.remove("is-cinematic-choice-ready","is-cinematic-rescued");
    } else if (isRescuedScene) {
      eventCard.dataset.cinematicInitialized = "1";
      setCinematicChoiceReady(false);
      if (el.eventDialogueAdvance) {
        el.eventDialogueAdvance.disabled = true;
        el.eventDialogueAdvance.setAttribute("aria-expanded","true");
      }
    } else if (!eventCard?.dataset.cinematicInitialized) {
      eventCard.dataset.cinematicInitialized = "1";
      setCinematicChoiceReady(false);
    }
    if (!useScenePreview) {
      el.eventArt.src = event.art;
      el.eventArt.alt = `${event.locationLabel} · ${event.title}`;
    }
    el.eventLocation.textContent = event.locationLabel;
    el.eventId.textContent = event.id;
    el.eventTitle.textContent = event.title;
    el.eventText.textContent = event.text;
    renderConditions(event);

    el.choiceList.innerHTML = "";
    for (const choice of event.choices) {
      const button = document.createElement("button");
      button.type = "button";
      const available = choiceAvailable(choice);
      const eventReady = eventAvailable(event);
      button.disabled = !eventReady || !available;
      button.textContent = choice.text;
      const reqText = choiceRequirementText(choice);
      if (reqText) {
        const small = document.createElement("small");
        small.textContent = `${available ? "✓" : "✕"} 조건: ${reqText}`;
        button.append(small);
      }
      if (choice.roll) {
        const small = document.createElement("small");
        small.textContent = `주사위 판정: ${choice.roll.stat} DC ${choice.roll.dc}`;
        button.append(small);
      }
      button.addEventListener("click", () => executeChoice(event, choice));
      el.choiceList.append(button);
    }

    if (!state.pendingRoll) el.rollPanel.hidden = true;
  }

  function renderStateOnly() {
    el.contaminationValue.textContent = String(state.contamination);
    el.contaminationInput.value = String(state.contamination);
    el.loopInput.value = String(state.loop);
    renderFlags();
    renderAvailableEvents();
    renderEventList();
  }

  function renderAll() {
    renderStateOnly();
    renderCurrentEvent();
    renderHistory();
  }

  function refreshAll() {
    state.pendingRoll = null;
    el.rollPanel.hidden = true;
    renderAll();
  }

  el.contaminationInput.addEventListener("input", () => {
    state.contamination = Number(el.contaminationInput.value);
    refreshAll();
  });
  el.loopInput.addEventListener("input", () => {
    state.loop = Math.max(1, Number(el.loopInput.value) || 1);
    refreshAll();
  });

  document.querySelectorAll("[data-monster-tag]").forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) state.monsterTags.add(input.dataset.monsterTag);
      else state.monsterTags.delete(input.dataset.monsterTag);
      refreshAll();
    });
  });

  document.querySelectorAll("[data-roll]").forEach((button) => {
    button.addEventListener("click", () => resolveRoll(button.dataset.roll));
  });

  el.eventDialogueAdvance?.addEventListener("click", () => {
    const event = eventById.get(state.currentEventId);
    if (event?.scene !== "graveyard_child_ambush_intro") return;
    if (flag("graveyard_child_ambush_resolved") && flag("graveyard_child_saved")) return;
    setCinematicChoiceReady(true);
  });

  document.getElementById("clearHistory").addEventListener("click", () => {
    state.history = [];
    renderHistory();
  });

  document.getElementById("resetSession").addEventListener("click", () => {
    state.contamination = 20;
    state.loop = 1;
    state.flags = {};
    state.monsterTags.clear();
    state.pendingRoll = null;
    state.history = [];
    state.currentEventId = events[0]?.id || null;
    const card = el.eventArt?.closest(".event-card");
    if (card) {
      delete card.dataset.cinematicInitialized;
      card.classList.remove("is-cinematic-choice-ready");
    }
    document.querySelectorAll("[data-monster-tag]").forEach((input) => { input.checked = false; });
    el.outcomeBox.hidden = true;
    renderAll();
  });

  document.getElementById("addFlag").addEventListener("click", () => {
    el.newFlagName.value = "";
    el.flagDialog.showModal();
    setTimeout(() => el.newFlagName.focus(), 0);
  });

  document.getElementById("confirmFlag").addEventListener("click", (event) => {
    const name = el.newFlagName.value.trim().replace(/\s+/g, "_");
    if (!name) {
      event.preventDefault();
      return;
    }
    state.flags[name] = true;
    setTimeout(refreshAll, 0);
  });

  const resumedBattleResult = consumeEventBattleResult();
  renderAll();
  if (resumedBattleResult) {
    if (resumedBattleResult.eventId === "graveyard_child_ambush_01") {
      showOutcome(resumedBattleResult.won
        ? "구울을 쓰러뜨렸다. 아이를 구하는 데 성공했다."
        : "구울을 막지 못했다. 아이 구조에 실패했다.");
      addHistory(
        eventById.get(resumedBattleResult.eventId),
        resumedBattleResult.won ? "구울 전투 승리" : "구울 전투 패배",
        resumedBattleResult.won ? "아이 구조 성공" : "아이 구조 실패"
      );
    }
  }
})();