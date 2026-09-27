(() => {
  "use strict";
  const installButton = document.getElementById("installAppButton");
  let installPrompt;
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
})();
