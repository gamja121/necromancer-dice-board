(() => {
  "use strict";

  const video = document.getElementById("titleVideo");
  const bgm = document.getElementById("titleBgm");
  const unlockButton = document.getElementById("titleUnlock");
  const playLink = document.getElementById("titlePlay");
  const continueLink = document.getElementById("titleContinue");
  const optionsButton = document.getElementById("titleOptions");
  const exitButton = document.getElementById("titleExit");
  const soundToggle = document.getElementById("titleSoundToggle");
  const optionsPanel = document.getElementById("titleOptionsPanel");
  const optionsSound = document.getElementById("titleOptionsSound");
  const optionsClose = document.getElementById("titleOptionsClose");
  const installButton = document.getElementById("installAppButton");
  const logo = document.querySelector(".title-logo-art");

  const VIDEO_VOLUME = 0.9;
  const BGM_VOLUME = 0.42;
  const FADE_MS = 650;

  let unlocked = false;
  let soundEnabled = true;
  let leaving = false;
  let installPrompt;

  async function startTitleAudio({ restart = false } = {}) {
    if (restart) {
      try { video.currentTime = 0; } catch (_) {}
      try { bgm.currentTime = 0; } catch (_) {}
    }
    video.muted = !soundEnabled;
    bgm.muted = !soundEnabled;
    video.volume = VIDEO_VOLUME;
    bgm.volume = BGM_VOLUME;
    const results = await Promise.allSettled([video.play(), bgm.play()]);
    return results.every((result) => result.status === "fulfilled");
  }

  async function unlockTitle() {
    if (unlocked) return;
    unlocked = true;
    document.body.classList.remove("is-locked");
    document.body.classList.add("is-unlocked");
    await startTitleAudio({ restart: true });
  }

  function updateSoundButtons() {
    const label = soundEnabled ? "소리 ON" : "소리 OFF";
    soundToggle.textContent = label;
    optionsSound.textContent = soundEnabled ? "사운드 ON" : "사운드 OFF";
    soundToggle.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
  }

  async function toggleSound() {
    soundEnabled = !soundEnabled;
    video.muted = !soundEnabled;
    bgm.muted = !soundEnabled;
    updateSoundButtons();
    if (soundEnabled && unlocked) await startTitleAudio();
  }

  soundToggle.addEventListener("click", toggleSound);
  optionsSound.addEventListener("click", toggleSound);
  unlockButton.addEventListener("click", unlockTitle);

  optionsButton.addEventListener("click", () => {
    optionsPanel.hidden = false;
  });
  optionsClose.addEventListener("click", () => {
    optionsPanel.hidden = true;
  });

  exitButton.addEventListener("click", () => {
    if (history.length > 1) history.back();
  });

  async function fadeOutAndNavigate(event) {
    if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (leaving) return;
    if (!unlocked) await unlockTitle();

    leaving = true;
    document.body.classList.add("is-leaving");
    const href = event.currentTarget.href;
    const start = performance.now();
    const initialVideoVolume = video.volume;
    const initialBgmVolume = bgm.volume;

    function step(now) {
      const progress = Math.min(1, (now - start) / FADE_MS);
      const remaining = 1 - progress;
      video.volume = initialVideoVolume * remaining;
      bgm.volume = initialBgmVolume * remaining;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        try { sessionStorage.setItem("necromancer-v2-music-handoff", "map"); } catch (_) {}
        video.pause();
        bgm.pause();
        location.href = href;
      }
    }
    requestAnimationFrame(step);
  }

  playLink.addEventListener("click", fadeOutAndNavigate);
  continueLink.addEventListener("click", fadeOutAndNavigate);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      video.pause();
      bgm.pause();
    } else if (unlocked && !leaving) {
      startTitleAudio();
    } else if (!unlocked) {
      video.muted = true;
      video.play().catch(() => {});
    }
  });

  window.addEventListener("pagehide", () => {
    video.pause();
    bgm.pause();
  });

  video.addEventListener("error", () => video.classList.add("is-unavailable"));
  logo.addEventListener("error", () => logo.classList.add("is-unavailable"));
  bgm.addEventListener("error", () => console.warn("Dedicated title BGM unavailable; browser may use the fallback source."));

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener("click", async () => {
    if (!installPrompt) return;
    const prompt = installPrompt;
    installPrompt = null;
    installButton.hidden = true;
    await prompt.prompt();
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    installButton.hidden = true;
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch((error) => console.warn("Offline registration unavailable:", error));
  }

  updateSoundButtons();
  video.muted = true;
  video.volume = VIDEO_VOLUME;
  bgm.volume = BGM_VOLUME;
  video.play().catch(() => {});
})();
