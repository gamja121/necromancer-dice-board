(() => {
  "use strict";

  const events = Array.isArray(window.V2EventData?.events)
    ? window.V2EventData.events
    : [];

  // Remove state created by the retired Event Lab prototype.
  const retiredSessionKeys = [
    "necromancer-event-battle-context-v1",
    "necromancer-event-battle-result-v1"
  ];
  for (const key of retiredSessionKeys) {
    try { sessionStorage.removeItem(key); } catch (_) {}
  }

  const count = document.getElementById("eventCount");
  if (count) count.textContent = String(events.length);
})();
