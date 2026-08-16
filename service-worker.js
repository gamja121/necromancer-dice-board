const CACHE_NAME = "necromancer-expedition-v49";
const APP_SHELL = [
  "./",
  "./index.html",
  "./v2.html",
  "./v2-battle.css?v=3",
  "./v2-battle.js?v=3",
  "./styles.css?v=43",
  "./ultimate-vfx.css?v=43",
  "./dice-overlay.css?v=46",
  "./unit-data.js?v=43",
  "./encounter-generator.js?v=43",
  "./ultimate-vfx.js?v=43",
  "./map-generator.js?v=43",
  "./event-data.js?v=43",
  "./dice-overlay.js?v=46",
  "./game.js?v=46",
  "./manifest.webmanifest?v=20260726-10",
  "./assets/app-icon-192.png",
  "./assets/app-icon-512.png",
  "./assets/v2-battle-castle.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => (
        await caches.match(event.request)
        || (event.request.mode === "navigate" ? caches.match("./index.html") : undefined)
      ))
  );
});
