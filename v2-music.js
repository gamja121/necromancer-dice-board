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

  const unlockEvents = ["pointerdown", "touchstart", "click", "keydown"];
  function unbindUnlock() {
    unlockEvents.forEach(type => document.removeEventListener(type, requestStart, true));
  }

  function bindUnlock() {
    unlockEvents.forEach(type => document.addEventListener(type, requestStart, { capture: true, passive: type === "touchstart" }));
  }

  function requestStart() {
    if (!wanted || document.hidden) return Promise.resolve(false);
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
    try { sessionStorage.setItem("necromancer-v2-music-handoff", nextTrack || ""); } catch (_) {}
    stop();
  }

  function onVisibilityChange() {
    if (document.hidden) pause();
    else if (wanted && started) requestStart();
  }

  try {
    if (sessionStorage.getItem("necromancer-v2-music-handoff") === trackName) {
      sessionStorage.removeItem("necromancer-v2-music-handoff");
    }
  } catch (_) {}

  bindUnlock();
  requestStart();
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", pause);
  root.V2Music = Object.freeze({ requestStart, pause, stop, handoff, track: trackName, audio: music });
})(globalThis);
