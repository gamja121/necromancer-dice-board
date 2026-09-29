(function (root) {
  "use strict";

  function create(options = {}) {
    let queue = Promise.resolve();
    let generation = 0;
    let sequence = 0;
    const history = [];
    const maxHistory = Math.max(8, Number(options.maxHistory) || 48);

    function guard(event, localGeneration) {
      if (localGeneration !== generation) return false;
      if (typeof options.guard === "function" && !options.guard(event)) return false;
      return true;
    }

    function remember(event, phase) {
      const item = {
        id: event.id,
        type: event.type,
        phase,
        at: Date.now(),
        source: event.source || null,
        target: event.target || null,
        value: event.value ?? null,
        roll: event.roll ?? null,
        brand: event.brand || null,
        mode: event.mode || null
      };
      history.push(item);
      if (history.length > maxHistory) history.splice(0, history.length - maxHistory);
      try {
        root.dispatchEvent(new CustomEvent("v2-presentation-event", { detail: { ...item, event } }));
      } catch (_) {}
    }

    function play(event = {}, presenter) {
      const localGeneration = generation;
      const normalized = Object.freeze({
        ...event,
        id: event.id || `presentation-${++sequence}`,
        type: event.type || "unknown"
      });

      const task = queue.then(async () => {
        if (!guard(normalized, localGeneration)) return { skipped: true, event: normalized };
        remember(normalized, "start");
        try {
          if (typeof presenter === "function") await presenter(normalized);
          remember(normalized, "complete");
          return { skipped: false, event: normalized };
        } catch (error) {
          remember(normalized, "error");
          throw error;
        }
      });

      queue = task.catch(() => {});
      return task;
    }

    function sequenceOf(items = []) {
      return items.reduce(
        (promise, item) => promise.then(() => play(item.event || item, item.presenter)),
        Promise.resolve()
      );
    }

    function flush() {
      return queue;
    }

    function clear() {
      generation += 1;
      queue = Promise.resolve();
    }

    function snapshot() {
      return history.map((item) => ({ ...item }));
    }

    return Object.freeze({ play, sequence: sequenceOf, flush, clear, snapshot });
  }

  root.V2Presentation = Object.freeze({ create });
})(globalThis);
