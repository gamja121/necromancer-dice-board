(function () {
  async function lockLandscape() {
    try {
      if (screen.orientation?.lock) {
        await screen.orientation.lock("landscape");
        return true;
      }
    } catch (_) {
      // Some browsers require fullscreen or do not support orientation locking.
    }
    return false;
  }

  async function requestFullscreen() {
    try {
      const root = document.documentElement;
      if (!document.fullscreenElement) {
        if (root.requestFullscreen) {
          await root.requestFullscreen({ navigationUI: "hide" });
        } else if (root.webkitRequestFullscreen) {
          root.webkitRequestFullscreen();
        }
      }
    } catch (_) {
      // Browsers may reject fullscreen unless called from a user gesture.
    }

    await lockLandscape();
    return Boolean(document.fullscreenElement);
  }

  async function enforceLandscape() {
    if (document.fullscreenElement) await lockLandscape();
  }

  window.V2Landscape = {
    request: requestFullscreen,
    requestFullscreen,
    lockLandscape,
    enforceLandscape
  };

  window.addEventListener("pointerdown", requestFullscreen, { once: true, capture: true });
  window.addEventListener("touchstart", requestFullscreen, { once: true, capture: true, passive: true });
  document.addEventListener("fullscreenchange", enforceLandscape);
  window.addEventListener("orientationchange", enforceLandscape);
})();