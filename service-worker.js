const CACHE_NAME = "necromancer-and-dice-v2-20260930-shop-counter-finish-1";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./assets/title/exit.webp",
  "./assets/title/options.webp",
  "./assets/title/continue.webp",
  "./assets/title/new-game.webp",
  "./assets/title/title-logo.webp",
  "./assets/title/title-theme.mp3",
  "./assets/title/title-loop.mp4",
  "./launch.js?v=20260930-fullscreen-landscape-2",
  "./launch.css?v=20260930-landscape-1",
  "./launch.css?v=20260930-title-1",
  "./launch.js?v=20260930-title-1",
  "./v2-map-practice.html",
  "./v2-auto-battle-practice.html",
  "./v2-map-practice.css?v=64",
  "./v2-home-inheritance.css?v=9",
  "./v2-altar-ritual.css?v=4",
  "./v2-auto-battle-practice.css?v=63",
  "./v2-asset-loader.js?v=1",
  "./v2-map-practice.js?v=87",
  "./art/v2-style/map-test/events/fortune-prophecy-ui.png?v=1",
  "./v2-event-data.js?v=1",
  "./v2-map-events.js?v=1",
  "./v2-auto-battle-practice.js?v=118",
  "./v2-landscape.js?v=1",
  "./v2-music.js?v=1",
  "./v2-sfx.js?v=3",
  "./v2-design-data.js?v=1",
  "./v2-rules.js?v=7",
  "./v2-run-state.js?v=4",
  "./v2-run-state-runtime.js?v=6",
  "./v2-presentation.js?v=1",
  "./v2-presentation-rail.js?v=2",
  "./v2-brand-cards.js?v=4",
  "./v2-home-inheritance.js?v=14",
  "./v2-altar-ritual.js?v=4",
  "./v2-dice-control.js?v=1",
  "./v2-world-tree-prayer-digits.js?v=2",
  "./art/v2-style/map-test/maps/default-map.jpg",
  "./art/v2-style/map-test/maps/winter-map.jpg",
  "./art/v2-style/map-test/maps/hell-map.jpg",
  "./art/v2-style/map-test/hero/necromancer-hero.png",
  "./art/v2-style/ui/contamination/contamination-hud.png",
  "./art/v2-style/ui/map-book-closed.png",
  "./art/v2-style/ui/map-book-open.png",
  "./art/v2-style/ui/map-card-deck.png",
  "./art/v2-style/ui/monster-shop-counter.png?v=2",
  "./art/v2-style/ui/patrol-route-atlas.webp?v=1",
  "./art/v2-style/ui/map-card-deck-open.png",
  "./art/v2-style/ui/battle-deck-selection-board.png",
  "./art/v2-style/ui/unit-info-window-no-portrait.png",
  "./art/v2-style/ui/map-cloud-transition.png",
  "./art/v2-style/ui/map-cloud-transition-2.png",
  "./art/v2-style/ui/map-cloud-transition-3.png",
  "./art/v2-style/ui/map-cloud-transition-4.png",
  "./art/v2-style/map-test/events/treasure-chest-frame-1.png",
  "./art/v2-style/map-test/events/treasure-chest-frame-2.png",
  "./art/v2-style/map-test/events/treasure-chest-frame-3.png",
  "./art/v2-style/map-test/events/treasure-chest-frame-4.png",
  "./art/v2-style/map-test/tiles/basic.png",
  "./art/v2-style/map-test/tiles/graveyard.png",
  "./art/v2-style/map-test/tiles/altar.png",
  "./art/v2-style/map-test/tiles/unknown.png",
  "./art/v2-style/map-test/tiles/forest.png",
  "./art/v2-style/map-test/tiles/rest.png",
  "./art/v2-style/map-test/tiles/monster.png",
  "./art/v2-style/map-test/tiles/monster-cleared.png",
  "./art/v2-style/map-test/tiles/rare-monster.png",
  "./art/v2-style/map-test/tiles/rare-monster-cleared.png",
  "./art/v2-style/map-test/tiles/gem.png",
  "./art/v2-style/map-test/tiles/event.png",
  "./art/v2-style/map-test/tiles/warp.png",
  "./art/v2-style/map-test/tiles/swamp.png",
  "./art/v2-style/map-test/tiles/home.png",
  "./art/v2-style/map-test/tiles/village.png",
  "./art/v2-style/map-test/tiles/fortune-teller-camp.png",
  "./art/v2-style/map-test/tiles/boss.png",
  "./art/v2-style/map-test/tiles/boss-cleared.png"
];

for (let i = 1; i <= 12; i += 1) {
  CORE_ASSETS.push(`./art/v2-style/dice-test/frames/roll-${String(i).padStart(2, "0")}.png`);
}
for (let i = 1; i <= 6; i += 1) {
  CORE_ASSETS.push(`./art/v2-style/dice-test/frames/result-${String(i).padStart(2, "0")}.png`);
}

function normalizedAssetRequest(request) {
  const url = new URL(request.url);
  if (["image", "audio", "video", "font"].includes(request.destination)) {
    url.search = "";
    url.hash = "";
    return new Request(url.href, { method: "GET", credentials: "same-origin" });
  }
  return request;
}

async function safeCachePut(cache, key, response) {
  if (!response || !response.ok) return response;
  try { await cache.put(key, response.clone()); }
  catch (error) { console.warn("[sw] cache put failed", key.url || key, error); }
  return response;
}

async function fetchAndCache(request, key = request) {
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await safeCachePut(cache, key, response);
  }
  return response;
}

async function cacheFirst(request) {
  const key = normalizedAssetRequest(request);
  const cached = await caches.match(key);
  if (cached) {
    // Refresh in the background without making rendering depend on the network.
    fetchAndCache(request, key).catch(() => {});
    return cached;
  }
  return fetchAndCache(request, key);
}

async function networkFirst(request) {
  try {
    return await fetchAndCache(request, request);
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const page = await caches.match("./index.html");
      if (page) return page;
    }
    throw error;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const results = await Promise.allSettled(CORE_ASSETS.map(async (path) => {
      const request = new Request(new URL(path, self.location.href).href, { cache: "reload" });
      const key = normalizedAssetRequest(request);
      const response = await fetch(request);
      if (!response.ok) throw new Error(`${response.status} ${path}`);
      await safeCachePut(cache, key, response);
    }));
    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length) console.warn("[sw] optional core assets failed to precache", failed.length);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key !== CACHE_NAME && (key.startsWith("necromancer-expedition-") || key.startsWith("necromancer-and-dice-")))
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(new Request(event.request, { cache: "reload" })));
    return;
  }

  if (["image", "audio", "video", "font"].includes(event.request.destination)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  event.respondWith(networkFirst(event.request));
});
