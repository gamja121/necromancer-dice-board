(function (root) {
  "use strict";

  const TRACKS = Object.freeze({
    map: Object.freeze({ source: "assets/music/map-board.mp3", volume: .3 }),
    battle: Object.freeze({ source: "assets/music/battle.mp3", volume: .34 })
  });
  const trackName = typeof document !== "undefined" ? document.body?.dataset.v2Music : null;
  const track = TRACKS[trackName];
  if (!track || typeof Audio === "undefined") return;

  const music = new Audio(track.source);
  music.loop = true;
  music.preload = "auto";
  music.volume = track.volume;
  let wanted = true;
  let started = false;
  const MAP_POSITION_KEY = "necromancer-v2-music-map-position";
  let pendingResumeTime = null;

  const unlockEvents = ["pointerdown", "touchstart", "click", "keydown"];
  function unbindUnlock() {
    unlockEvents.forEach(type => document.removeEventListener(type, requestStart, true));
  }

  function bindUnlock() {
    unlockEvents.forEach(type => document.addEventListener(type, requestStart, { capture: true, passive: type === "touchstart" }));
  }

  function applyPendingResume() {
    if (!Number.isFinite(pendingResumeTime) || pendingResumeTime < 0) return false;
    let target = pendingResumeTime;
    if (Number.isFinite(music.duration) && music.duration > 0) target %= music.duration;
    try {
      music.currentTime = target;
      pendingResumeTime = null;
      return true;
    } catch (_) {
      return false;
    }
  }

  function requestStart() {
    if (!wanted || document.hidden) return Promise.resolve(false);
    applyPendingResume();
    music.volume = track.volume;
    const attempt = music.play();
    if (!attempt?.then) { started = true; unbindUnlock(); return Promise.resolve(true); }
    return attempt.then(() => {
      started = true;
      unbindUnlock();
      return true;
    }).catch(() => {
      bindUnlock();
      return false;
    });
  }

  function pause() {
    music.pause();
  }

  function stop() {
    wanted = false;
    music.pause();
    music.currentTime = 0;
    unbindUnlock();
  }

  function handoff(nextTrack) {
    try {
      if (trackName === "map" && nextTrack === "battle") {
        sessionStorage.setItem(MAP_POSITION_KEY, String(Math.max(0, music.currentTime || 0)));
      }
      sessionStorage.setItem("necromancer-v2-music-handoff", nextTrack || "");
    } catch (_) {}
    stop();
  }

  function onVisibilityChange() {
    if (document.hidden) pause();
    else if (wanted && started) requestStart();
  }

  try {
    const incomingHandoff = sessionStorage.getItem("necromancer-v2-music-handoff");
    if (incomingHandoff === trackName) {
      sessionStorage.removeItem("necromancer-v2-music-handoff");
      if (trackName === "map") {
        const savedTime = Number(sessionStorage.getItem(MAP_POSITION_KEY));
        if (Number.isFinite(savedTime) && savedTime >= 0) pendingResumeTime = savedTime;
        sessionStorage.removeItem(MAP_POSITION_KEY);
      }
    }
  } catch (_) {}

  music.addEventListener("loadedmetadata", applyPendingResume, { once: true });
  bindUnlock();
  requestStart();
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", pause);
  root.V2Music = Object.freeze({ requestStart, pause, stop, handoff, track: trackName, audio: music });
})(globalThis);
