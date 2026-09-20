(function (root) {
  "use strict";

  const SOURCES = Object.freeze({
    diceTick: "assets/sfx/dice-tick.ogg",
    diceLand: "assets/sfx/dice-land.ogg",
    move: "assets/sfx/move.ogg",
    attack: "assets/sfx/attack.ogg",
    hit: "assets/sfx/hit.ogg"
  });
  const BASE_VOLUME = Object.freeze({ diceTick: .55, diceLand: .95, move: .65, attack: .85, hit: .95 });
  const templates = new Map();
  let audioContext = null;

  function settings() {
    try {
      const saved = JSON.parse(localStorage.getItem("necromancer-audio-settings-v1") || "null");
      const savedVolume = Number.isFinite(saved?.sfxVolume) ? saved.sfxVolume : .85;
      return { volume: savedVolume > 0 ? Math.max(.7, Math.min(1, savedVolume)) : .85 };
    } catch (_) {
      return { volume: .85 };
    }
  }

  function ensureContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    return audioContext;
  }

  function tone(frequency, duration, volume, endFrequency, type = "triangle") {
    const context = ensureContext();
    if (!context) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency || frequency), now + duration);
    gain.gain.setValueAtTime(Math.max(.0001, volume), now);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + .02);
  }

  function synth(name, rate, volume) {
    const level = Math.min(.13, .045 * volume);
    if (name === "diceTick") tone(620 * rate, .045, level * .55, 310 * rate, "square");
    else if (name === "diceLand") { tone(125 * rate, .16, level, 58 * rate, "square"); tone(760 * rate, .07, level * .45, 280 * rate); }
    else if (name === "move") tone(190 * rate, .09, level * .7, 105 * rate, "triangle");
    else if (name === "attack") tone(900 * rate, .13, level * .8, 170 * rate, "sawtooth");
    else if (name === "hit") { tone(105 * rate, .15, level, 45 * rate, "square"); tone(340 * rate, .06, level * .5, 95 * rate, "sawtooth"); }
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
    if (!base) return false;
    const sound = base.cloneNode();
    sound.volume = Math.max(0, Math.min(1, (BASE_VOLUME[name] || .45) * current.volume * (options.volume ?? 1)));
    sound.playbackRate = Math.max(.55, Math.min(1.8, options.rate || 1));
    const rate = sound.playbackRate;
    const volume = current.volume * (options.volume ?? 1);
    if (Number.isFinite(options.delay) && options.delay > 0) {
      window.setTimeout(() => { synth(name, rate, volume); sound.play().catch(() => {}); }, options.delay);
    } else { synth(name, rate, volume); sound.play().catch(() => {}); }
    return true;
  }

  function preload() {
    Object.keys(SOURCES).forEach(template);
  }

  function unlock() {
    const context = ensureContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    gain.gain.value = .0001;
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + .01);
  }

  if (typeof document !== "undefined") {
    document.addEventListener("pointerdown", unlock, { capture: true, once: true });
    document.addEventListener("touchstart", unlock, { capture: true, once: true, passive: true });
    document.addEventListener("keydown", unlock, { capture: true, once: true });
  }

  root.V2Sfx = Object.freeze({ play, preload, unlock, sources: SOURCES });
})(globalThis);
