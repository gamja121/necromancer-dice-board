(() => {
  "use strict";

  const events = Array.isArray(window.V2EventLabData?.events)
    ? window.V2EventLabData.events
    : [];
  const event = events[0] || null;

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

  const assetsReady = Promise.all([
    loadChunkImage(el.baseImage, BASE_IMAGE_CHUNKS, "base-ready"),
    loadChunkImage(el.ghoulLayer, GHOUL_IMAGE_CHUNKS, "ghoul-ready")
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
    if (el.description && event) el.description.textContent = event.description;
  }

  async function revealGhoul() {
    await assetsReady;
    phase = "threat";
    el.card.dataset.phase = phase;
    el.card.classList.add("is-ghoul-revealed");
    el.ghoulLayer.hidden = false;
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

  function resolveChoice(choiceId) {
    const choice = event.choices.find((item) => item.id === choiceId);
    if (!choice) return;
    phase = "resolved";
    el.card.dataset.phase = phase;
    el.card.classList.add("is-resolved");
    el.choices.hidden = true;
    el.outcome.hidden = false;
    el.outcome.textContent = choice.outcome;
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
    el.reset?.addEventListener("click", resetEvent);
  }
})();
