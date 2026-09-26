(function (root) {
  "use strict";

  const SOURCES = Object.freeze({
    diceTick: "assets/sfx/dice-tick.ogg",
    diceLand: "assets/sfx/dice-land.ogg",
    move: "assets/sfx/move.ogg",
    bookCardsOpen: "assets/sfx/book-cards-open.mp3",
    treasureChestOpen: "assets/sfx/treasure-chest-open.mp3",
    attack: "assets/sfx/attack.ogg",
    hit: "assets/sfx/hit.ogg"
  });
  const BASE_VOLUME = Object.freeze({ diceTick: .55, diceLand: .95, move: .65, bookCardsOpen: .8, treasureChestOpen: .9, attack: .85, hit: .95 });
  const VARIANTS = Object.freeze({
    attack: Object.freeze({
      B: Object.freeze({ file: "claw.ogg", rate: 1 }),
      D: Object.freeze({ file: "arrow.ogg", rate: .88 }),
      E: Object.freeze({ file: "magic.ogg", rate: 1.2 }),
      G: Object.freeze({ procedural: "blunt-swing", rate: 1 }),
      K: Object.freeze({ procedural: "tail-sweep", rate: 1 })
    }),
    hit: Object.freeze({
      E: Object.freeze({ file: "death.ogg", rate: 1.55 }),
      G: Object.freeze({ procedural: "flesh-hit", rate: 1 }),
      J: Object.freeze({ procedural: "deep-thud", rate: 1 }),
      K: Object.freeze({ procedural: "giant-body", rate: 1 })
    })
  });
  const PROCEDURAL_PROFILES = Object.freeze({
    "blunt-swing": Object.freeze([.24, .024, 132, .72, .34, 0]),
    "tail-sweep": Object.freeze([.38, .018, 102, .78, .33, 0]),
    "flesh-hit": Object.freeze([.17, .036, 96, .82, .52, 1]),
    "deep-thud": Object.freeze([.21, .026, 81, .68, .72, 1]),
    "giant-body": Object.freeze([.4, .008, 49, .62, .95, 1])
  });
  const templates = new Map();
  const proceduralUrls = new Map();
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

  function proceduralWav(kind) {
    if (proceduralUrls.has(kind)) return proceduralUrls.get(kind);
    const [duration, smooth, base, noiseMix, bassMix, crack] = PROCEDURAL_PROFILES[kind];
    const sampleRate = 22050;
    const count = Math.ceil(duration * sampleRate);
    const samples = new Float32Array(count);
    let seed = [...kind].reduce((value, char) => value + char.charCodeAt(0), 71);
    let low = 0;
    for (let i = 0; i < count; i += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const random = seed / 2147483648 - 1;
      low += (random - low) * smooth;
      const progress = i / count;
      const envelope = Math.pow(1 - progress, crack ? 3.6 : 2.1);
      const swing = kind.includes("swing") || kind.includes("sweep") ? Math.sin(Math.PI * progress) : envelope;
      const frequency = base * (1 - progress * .42);
      let value = low * noiseMix * (swing + envelope * .35);
      value += Math.sin(Math.PI * 2 * frequency * (i / sampleRate)) * bassMix * envelope;
      if (crack && i < sampleRate * .012) value += (random - low) * .58;
      samples[i] = Math.max(-1, Math.min(1, value * .78));
    }
    const buffer = new ArrayBuffer(44 + count * 2);
    const view = new DataView(buffer);
    const text = (offset, value) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
    text(0, "RIFF"); view.setUint32(4, 36 + count * 2, true); text(8, "WAVE"); text(12, "fmt ");
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, "data"); view.setUint32(40, count * 2, true);
    samples.forEach((sample, index) => view.setInt16(44 + index * 2, sample * 32767, true));
    const url = URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
    proceduralUrls.set(kind, url);
    return url;
  }

  function variant(name, key) {
    return key ? VARIANTS[name]?.[String(key).toUpperCase()] || null : null;
  }

  function template(name, variantKey) {
    if (!SOURCES[name] || typeof Audio === "undefined") return null;
    const config = variant(name, variantKey);
    const cacheKey = config ? `${name}:${String(variantKey).toUpperCase()}` : name;
    if (!templates.has(cacheKey)) {
      const source = config?.procedural ? proceduralWav(config.procedural) : config?.file ? `assets/sfx/${config.file}` : SOURCES[name];
      const audio = new Audio(source);
      audio.preload = "auto";
      templates.set(cacheKey, audio);
    }
    return templates.get(cacheKey);
  }

  function play(name, options = {}) {
    const current = settings();
    const config = variant(name, options.variant);
    const base = template(name, options.variant);
    if (!base) return false;
    const sound = base.cloneNode();
    sound.volume = Math.max(0, Math.min(1, (BASE_VOLUME[name] || .45) * current.volume * (options.volume ?? 1)));
    sound.playbackRate = Math.max(.55, Math.min(1.8, (options.rate || 1) * (config?.rate || 1)));
    const rate = sound.playbackRate;
    const volume = current.volume * (options.volume ?? 1);
    if (Number.isFinite(options.delay) && options.delay > 0) {
      window.setTimeout(() => { if (!config) synth(name, rate, volume); sound.play().catch(() => {}); }, options.delay);
    } else { if (!config) synth(name, rate, volume); sound.play().catch(() => {}); }
    return true;
  }

  function preload() {
    Object.keys(SOURCES).forEach(template);
    Object.entries(VARIANTS).forEach(([name, entries]) => Object.keys(entries).forEach(key => template(name, key)));
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

  root.V2Sfx = Object.freeze({ play, preload, unlock, sources: SOURCES, variants: VARIANTS });
})(globalThis);
