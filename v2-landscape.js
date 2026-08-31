(function () {
  async function requestLandscape() {
    if (!window.matchMedia("(orientation: portrait)").matches) return true;

    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      }
    } catch (_) {
      // Fullscreen is optional. CSS keeps the view landscape when permission is denied.
    }

    try {
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock("landscape");
        return true;
      }
    } catch (_) {
      // Mobile browsers can reject orientation lock outside an installed app.
    }
    return false;
  }

  window.V2Landscape = { request: requestLandscape };
  requestLandscape();
  window.addEventListener("pointerdown", requestLandscape, { once: true, capture: true });
})();
