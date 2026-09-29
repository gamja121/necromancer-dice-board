(() => {
  "use strict";

  const video = document.getElementById("titleVideo");
  const bgm = document.getElementById("titleBgm");
  const unlockButton = document.getElementById("titleUnlock");
  const newGameButton = document.getElementById("newGameButton");
  const continueButton = document.getElementById("continueButton");
  const optionsButton = document.getElementById("optionsButton");
  const exitButton = document.getElementById("exitButton");
  const optionsPanel = document.getElementById("optionsPanel");
  const closeOptionsButton = document.getElementById("closeOptionsButton");
  const soundToggle = document.getElementById("titleSoundToggle");
  const installButton = document.getElementById("installAppButton");
  const toast = document.getElementById("titleToast");

  const VIDEO_VOLUME = .92;
  const BGM_VOLUME = .42;
  const FADE_MS = 650;
  const DB_NAME = "necromancer-dice-runs";

  let unlocked = false;
  let soundEnabled = true;
  let leaving = false;
  let installPrompt;
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

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

  function updateSoundButton() {
    soundToggle.textContent = soundEnabled ? "ON" : "OFF";
    soundToggle.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
  }

  async function fadeAndNavigate(href) {
    if (leaving) return;
    if (!unlocked) await unlockTitle();
    leaving = true;
    document.body.classList.add("is-leaving");
    const start = performance.now();
    const initialVideoVolume = video.volume;
    const initialBgmVolume = bgm.volume;
    await new Promise((resolve) => {
      function step(now) {
        const progress = Math.min(1, (now - start) / FADE_MS);
        const remaining = 1 - progress;
        video.volume = initialVideoVolume * remaining;
        bgm.volume = initialBgmVolume * remaining;
        if (progress < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
    try { sessionStorage.setItem("necromancer-v2-music-handoff", "map"); } catch (_) {}
    video.pause();
    bgm.pause();
    location.href = href;
  }

  function deleteRunDatabase() {
    return new Promise((resolve) => {
      if (!globalThis.indexedDB) return resolve();
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  }

  function clearLegacyState(storage) {
    try {
      const keys = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key && key.startsWith("necromancer-")) keys.push(key);
      }
      keys.forEach((key) => storage.removeItem(key));
    } catch (_) {}
  }

  async function hasSavedRun() {
    if (!globalThis.indexedDB) return false;
    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onerror = () => resolve(false);
      request.onupgradeneeded = () => {
        try { request.transaction.abort(); } catch (_) {}
        resolve(false);
      };
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("metadata")) {
          db.close();
          resolve(false);
          return;
        }
        const tx = db.transaction("metadata", "readonly");
        const get = tx.objectStore("metadata").get("activeRun");
        get.onsuccess = () => {
          const found = Boolean(get.result?.runId);
          db.close();
          resolve(found);
        };
        get.onerror = () => {
          db.close();
          resolve(false);
        };
      };
    });
  }

  async function refreshContinueState() {
    const saved = await hasSavedRun();
    continueButton.hidden = !saved;
    continueButton.setAttribute("aria-disabled", saved ? "false" : "true");
    return saved;
  }

  unlockButton.addEventListener("click", unlockTitle);

  soundToggle.addEventListener("click", async () => {
    soundEnabled = !soundEnabled;
    video.muted = !soundEnabled;
    bgm.muted = !soundEnabled;
    updateSoundButton();
    if (soundEnabled && unlocked) await startTitleAudio();
  });

  newGameButton.addEventListener("click", async () => {
    const saved = await hasSavedRun();
    if (saved && !confirm("기존 원정 기록을 지우고 새 게임을 시작할까요?")) return;
    await deleteRunDatabase();
    clearLegacyState(localStorage);
    clearLegacyState(sessionStorage);
    await fadeAndNavigate("v2-map-practice.html");
  });

  continueButton.addEventListener("click", async (event) => {
    event.preventDefault();
    if (continueButton.hidden) return;
    await fadeAndNavigate(continueButton.href);
  });

  optionsButton.addEventListener("click", () => { optionsPanel.hidden = false; });
  closeOptionsButton.addEventListener("click", () => { optionsPanel.hidden = true; });
  exitButton.addEventListener("click", () => {
    window.close();
    setTimeout(() => showToast("웹 버전은 브라우저 창을 직접 닫아주세요."), 80);
  });

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

  updateSoundButton();
  refreshContinueState();
  video.muted = true;
  video.volume = VIDEO_VOLUME;
  bgm.volume = BGM_VOLUME;
  video.play().catch(() => {});
})();
