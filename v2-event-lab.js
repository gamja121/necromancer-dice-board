(() => {
  "use strict";

  const events = Array.isArray(window.V2EventLabData?.events)
    ? window.V2EventLabData.events
    : [];
  const event = events[0] || null;
  const launchQuery = new URLSearchParams(location.search);
  const fromMapEvent = launchQuery.get("fromMapEvent") === "1";
  const resumeEventBattle = launchQuery.get("resumeEventBattle") === "1";
  const returnMapId = launchQuery.get("map") || "default";
  const returnTile = Math.max(1, Math.min(24, Number(launchQuery.get("tile")) || 1));
  const returnAllies = launchQuery.get("allies") || "";
  const returnAllyIds = launchQuery.get("allyIds") || "";
  const EVENT_BATTLE_RESULT_KEY = "necromancer-event-battle-result-v1";

  const BASE_IMAGE_CHUNKS = [
    "assets/event-lab/graveyard-child/base/part-000.txt",
    "assets/event-lab/graveyard-child/base/part-001.txt"
  ];
  const GHOUL_IMAGE_CHUNKS = [
    "assets/event-lab/graveyard-child/ghoul/part-000.txt",
    "assets/event-lab/graveyard-child/ghoul/part-001.txt"
  ];

  const el = {
    card: document.getElementById("eventCard"),
    tags: document.getElementById("eventTags"),
    baseImage: document.getElementById("eventBaseImage"),
    ghoulLayer: document.getElementById("eventGhoulLayer"),
    location: document.getElementById("eventLocation"),
    title: document.getElementById("eventTitle"),
    description: document.getElementById("eventDescription"),
    advance: document.getElementById("eventAdvance"),
    dialogue: document.getElementById("eventDialogue"),
    dialogueAdvance: document.getElementById("eventDialogueAdvance"),
    dialogueName: document.getElementById("eventDialogueName"),
    dialogueText: document.getElementById("eventDialogueText"),
    choices: document.getElementById("eventChoices"),
    outcome: document.getElementById("eventOutcome"),
    count: document.getElementById("eventCount"),
    reset: document.getElementById("eventReset")
  };

  let phase = "description";

  async function requestLandscapeOrientation() {
    try {
      if (screen.orientation?.lock) await screen.orientation.lock("landscape");
    } catch (_) {
      // CSS rotation below is the guaranteed fallback for normal mobile browsers.
    }
  }
  requestLandscapeOrientation();

  async function loadChunkImage(img, chunks, readyName) {
    if (!img) return false;
    const texts = await Promise.all(chunks.map(async (path) => {
      const response = await fetch(path, { cache: "force-cache" });
      if (!response.ok) throw new Error(`event asset ${response.status}: ${path}`);
      return (await response.text()).trim();
    }));
    img.src = `data:image/webp;base64,${texts.join("")}`;
    try { await img.decode(); } catch (_) {}
    img.dataset.assetReady = readyName;
    return img.complete && img.naturalWidth > 0;
  }

  function removeBlackBackground(img) {
    if (!img || !img.naturalWidth || !img.naturalHeight) return false;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0);
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = frame.data;

    // The supplied ghoul uses a near-black background. Make only that black field
    // transparent while keeping the brown/gray painted body opaque.
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const peak = Math.max(r, g, b);
      if (peak <= 10) {
        pixels[i + 3] = 0;
      } else if (peak < 30) {
        pixels[i + 3] = Math.round(((peak - 10) / 20) * 255);
      } else {
        pixels[i + 3] = 255;
      }
    }
    ctx.putImageData(frame, 0, 0);
    img.src = canvas.toDataURL("image/png");
    img.dataset.alphaReady = "true";
    return true;
  }

  async function loadGhoulLayer() {
    const ready = await loadChunkImage(el.ghoulLayer, GHOUL_IMAGE_CHUNKS, "ghoul-source-ready");
    if (!ready) return false;
    removeBlackBackground(el.ghoulLayer);
    try { await el.ghoulLayer.decode(); } catch (_) {}
    el.ghoulLayer.dataset.assetReady = "ghoul-ready";
    return el.ghoulLayer.complete && el.ghoulLayer.naturalWidth > 0;
  }

  const assetsReady = Promise.all([
    loadChunkImage(el.baseImage, BASE_IMAGE_CHUNKS, "base-ready"),
    loadGhoulLayer()
  ]).catch((error) => {
    console.error("Event Lab artwork failed to load", error);
    return [false, false];
  });

  function renderTags() {
    if (!el.tags || !event) return;
    el.tags.replaceChildren();
    for (const tag of event.tags || []) {
      const span = document.createElement("span");
      span.textContent = `#${tag}`;
      el.tags.append(span);
    }
  }

  function hideDecisionLayers() {
    if (el.dialogue) el.dialogue.hidden = true;
    if (el.choices) el.choices.hidden = true;
    if (el.outcome) {
      el.outcome.hidden = true;
      el.outcome.textContent = "";
    }
  }

  function resetEvent() {
    phase = "description";
    if (el.card) {
      el.card.dataset.phase = phase;
      el.card.classList.remove("is-ghoul-revealed", "is-dialogue", "is-choice", "is-resolved");
    }
    if (el.ghoulLayer) el.ghoulLayer.hidden = true;
    hideDecisionLayers();
    if (el.advance) {
      el.advance.hidden = false;
      el.advance.disabled = false;
      el.advance.textContent = "계속";
    }
    if (el.description && event) el.description.textContent = "공동묘지 안쪽에서 길을 잃은 아이를 발견했다. 아이는 묘비 사이를 서성이며 자꾸 뒤를 돌아본다. " + event.description;
  }

  async function revealGhoul() {
    await assetsReady;
    phase = "threat";
    el.card.dataset.phase = phase;
    el.card.classList.add("is-ghoul-revealed");
    el.ghoulLayer.hidden = false;
    if (el.description) el.description.textContent = event.description;
    el.advance.textContent = "아이의 목소리를 듣는다";
  }

  function showDialogue() {
    phase = "dialogue";
    el.card.dataset.phase = phase;
    el.card.classList.add("is-dialogue");
    el.advance.hidden = true;
    el.dialogue.hidden = false;
    el.dialogueName.textContent = event.dialogue.speaker;
    el.dialogueText.textContent = event.dialogue.text;
  }

  function showChoices() {
    phase = "choice";
    el.card.dataset.phase = phase;
    el.card.classList.remove("is-dialogue");
    el.card.classList.add("is-choice");
    el.dialogue.hidden = true;
    el.choices.hidden = false;
  }

  function returnToMapAndComplete() {
    const params = new URLSearchParams({
      map: returnMapId,
      resume: String(returnTile),
      completeGraveyardChildEvent: "1"
    });
    location.assign("v2-map-practice.html?" + params.toString());
  }

  function startMapEventBattle() {
    const params = new URLSearchParams({
      from: "event",
      event: "graveyard_child_ambush_01",
      encounterType: "event-graveyard-child",
      enemies: "ghoul",
      eventReturn: "event-lab-map",
      map: returnMapId,
      tile: String(returnTile),
      allies: returnAllies,
      allyIds: returnAllyIds
    });
    location.assign("v2-auto-battle-practice.html?" + params.toString());
  }

  function showPostBattleEscape() {
    phase = "resolved";
    el.card.dataset.phase = "escape";
    el.card.classList.remove("is-dialogue", "is-choice");
    el.card.classList.add("is-resolved", "is-child-escaping");
    if (el.ghoulLayer) el.ghoulLayer.hidden = true;
    if (el.dialogue) el.dialogue.hidden = true;
    if (el.choices) el.choices.hidden = true;
    if (el.advance) el.advance.hidden = true;
    if (el.outcome) {
      el.outcome.hidden = false;
      el.outcome.textContent = "구울이 쓰러지자 아이는 당신을 바라본다. 그러나 안도하기보다 겁에 질린 표정으로 뒷걸음치더니, 묘비 사이로 달아나 버린다.";
    }
    if (el.reset) {
      el.reset.textContent = "맵으로 돌아가기";
      el.reset.onclick = returnToMapAndComplete;
    }
  }

  function resolveChoice(choiceId) {
    const choice = event.choices.find((item) => item.id === choiceId);
    if (!choice) return;
    if (fromMapEvent && choiceId === "protect") {
      startMapEventBattle();
      return;
    }
    phase = "resolved";
    el.card.dataset.phase = phase;
    el.card.classList.add("is-resolved");
    el.choices.hidden = true;
    el.outcome.hidden = false;
    el.outcome.textContent = choice.outcome;
    if (fromMapEvent && el.reset) {
      el.reset.textContent = "맵으로 돌아가기";
      el.reset.onclick = returnToMapAndComplete;
    }
  }

  if (event) {
    if (el.count) el.count.textContent = String(events.length);
    if (el.location) el.location.textContent = event.location;
    if (el.title) el.title.textContent = event.title;
    if (el.description) el.description.textContent = event.description;
    renderTags();
    resetEvent();

    el.advance?.addEventListener("click", () => {
      if (phase === "description") revealGhoul();
      else if (phase === "threat") showDialogue();
    });
    el.dialogueAdvance?.addEventListener("click", showChoices);
    el.choices?.querySelectorAll("[data-event-choice]").forEach((button) => {
      button.addEventListener("click", () => resolveChoice(button.dataset.eventChoice));
    });
    if (!fromMapEvent) el.reset?.addEventListener("click", resetEvent);
    else if (el.reset) {
      el.reset.textContent = "처음부터";
      el.reset.onclick = resetEvent;
    }

    if (fromMapEvent && resumeEventBattle) {
      let result = null;
      try {
        const raw = sessionStorage.getItem(EVENT_BATTLE_RESULT_KEY);
        if (raw) result = JSON.parse(raw);
        sessionStorage.removeItem(EVENT_BATTLE_RESULT_KEY);
      } catch (_) {}
      if (result?.eventId === "graveyard_child_ambush_01" && result.won === true) {
        showPostBattleEscape();
      }
    }
  }
})();
