(function(root) {
  "use strict";

  const CROSS_SRC = "art/v2-style/ui/heal-cross.png?v=1";
  const PARTICLES = Object.freeze([
    Object.freeze([-34, 24, 34, 0, 760, -10]),
    Object.freeze([-18, 2, 28, 70, 720, -5]),
    Object.freeze([0, 18, 38, 35, 820, 2]),
    Object.freeze([20, -8, 30, 120, 760, 8]),
    Object.freeze([36, 22, 34, 160, 840, 12]),
    Object.freeze([-5, -24, 26, 210, 700, -3]),
    Object.freeze([27, -32, 29, 250, 780, 7])
  ]);

  let ready = null;

  function prepare() {
    if (ready) return ready;
    ready = new Promise((resolve) => {
      if (typeof Image === "undefined") { resolve(false); return; }
      const image = new Image();
      let settled = false;
      const done = (ok) => {
        if (settled) return;
        settled = true;
        resolve(ok);
      };
      const timer = typeof setTimeout === "function" ? setTimeout(() => done(false), 2500) : null;
      image.onload = async () => {
        if (timer) clearTimeout(timer);
        try { if (typeof image.decode === "function") await image.decode(); } catch (_) {}
        done(true);
      };
      image.onerror = () => { if (timer) clearTimeout(timer); done(false); };
      image.src = CROSS_SRC;
    });
    return ready;
  }

  function particleCount(amount) {
    if (amount <= 1) return 4;
    if (amount === 2) return 6;
    return 7;
  }

  async function playUnit(host, amount = 1) {
    if (!host || !Number.isFinite(amount) || amount <= 0 || typeof document === "undefined") return false;
    const artworkReady = await prepare();
    if (!host.isConnected && "isConnected" in host) return false;

    const burst = document.createElement("span");
    burst.className = "battle-heal-burst";
    burst.setAttribute("aria-hidden", "true");

    const reducedMotion = root.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const specs = PARTICLES.slice(0, reducedMotion ? 3 : particleCount(amount));
    for (const [x, y, size, delay, duration, drift] of specs) {
      const cross = document.createElement("span");
      cross.className = artworkReady ? "battle-heal-cross" : "battle-heal-cross is-fallback";
      cross.style.setProperty("--heal-x", x + "%");
      cross.style.setProperty("--heal-y", y + "%");
      cross.style.setProperty("--heal-size", size + "px");
      cross.style.setProperty("--heal-delay", delay + "ms");
      cross.style.setProperty("--heal-duration", duration + "ms");
      cross.style.setProperty("--heal-drift", drift + "px");
      burst.append(cross);
    }

    host.append(burst);
    const lifetime = reducedMotion ? 520 : 1250;
    root.setTimeout?.(() => burst.remove(), lifetime);
    return true;
  }

  const api = Object.freeze({ CROSS_SRC, prepare, playUnit });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.V2HealEffect = api;
})(globalThis);
