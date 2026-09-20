(function (root) {
  "use strict";

  const SOURCES = Object.freeze({
    diceTick: "assets/sfx/dice-tick.ogg",
    diceLand: "assets/sfx/dice-land.ogg",
    move: "assets/sfx/move.ogg",
    attack: "assets/sfx/attack.ogg",
    hit: "assets/sfx/hit.ogg"
  });
  const BASE_VOLUME = Object.freeze({ diceTick: .3, diceLand: .62, move: .34, attack: .48, hit: .58 });
  const templates = new Map();

  function settings() {
    try {
      const saved = JSON.parse(localStorage.getItem("necromancer-audio-settings-v1") || "null");
      return { muted: Boolean(saved?.musicMuted), volume: Number.isFinite(saved?.sfxVolume) ? Math.max(0, Math.min(1, saved.sfxVolume)) : .75 };
    } catch (_) {
      return { muted: false, volume: .75 };
    }
  }

  function template(name) {
    if (!SOURCES[name] || typeof Audio === "undefined") return null;
    if (!templates.has(name)) {
      const audio = new Audio(SOURCES[name]);
      audio.preload = "auto";
      templates.set(name, audio);
    }
    return templates.get(name);
  }

  function play(name, options = {}) {
    const current = settings();
    const base = template(name);
    if (!base || current.muted || current.volume <= 0) return false;
    const sound = base.cloneNode();
    sound.volume = Math.max(0, Math.min(1, (BASE_VOLUME[name] || .45) * current.volume * (options.volume ?? 1)));
    sound.playbackRate = Math.max(.55, Math.min(1.8, options.rate || 1));
    if (Number.isFinite(options.delay) && options.delay > 0) {
      window.setTimeout(() => sound.play().catch(() => {}), options.delay);
    } else sound.play().catch(() => {});
    return true;
  }

  function preload() {
    Object.keys(SOURCES).forEach(template);
  }

  root.V2Sfx = Object.freeze({ play, preload, sources: SOURCES });
})(globalThis);
