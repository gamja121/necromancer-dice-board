const CACHE_NAME = "necromancer-expedition-v31";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=20260731-20",
  "./ultimate-vfx.css?v=20260731-20",
  "./unit-data.js?v=20260726-10",
  "./encounter-generator.js?v=20260726-10",
  "./ultimate-vfx.js?v=20260731-20",
  "./game.js?v=20260731-20",
  "./manifest.webmanifest?v=20260726-10",
  "./assets/app-icon-192.png",
  "./assets/campaign-map-expedition.jpg",
  "./assets/vfx/greatsword.png",
  "./assets/vfx/claw-rake.png",
  "./assets/vfx/brutal-spear.png",
  "./assets/vfx/forbidden-magic.png",
  "./assets/app-icon-512.png",
  "./assets/hydra.jpg",
  "./assets/totem-insect.jpg",
  "./assets/totem-demon.jpg",
  "./assets/totem-plague.jpg",
  "./assets/totem-corpse.jpg",
  "./assets/totem-element.jpg",
  "./assets/totem-plant.jpg",
  "./assets/mummy-guardian.jpg",
  "./assets/soul-reaper.jpg",
  "./assets/bone-hound.jpg",
  "./assets/mimic.jpg"
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
