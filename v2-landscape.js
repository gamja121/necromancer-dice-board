(function () {
  async function requestFullscreen() {
    if (document.fullscreenElement) return true;
    try {
      const root = document.documentElement;
      if (root.requestFullscreen) {
        await root.requestFullscreen({ navigationUI: "hide" });
        return true;
      }
      if (root.webkitRequestFullscreen) {
        root.webkitRequestFullscreen();
        return true;
      }
    } catch (_) {
      // Browsers may reject fullscreen unless this is called from a user gesture.
    }
    return false;
  }

  window.V2Landscape = { request: requestFullscreen, requestFullscreen };

  window.addEventListener("pointerdown", requestFullscreen, { once: true, capture: true });
  window.addEventListener("touchstart", requestFullscreen, { once: true, capture: true, passive: true });
})();