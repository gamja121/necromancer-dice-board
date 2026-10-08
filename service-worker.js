const CACHE_NAME = "necromancer-and-dice-v2-20261009-monster-king-hunt-1";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest?v=20261004-fullscreen-pwa-1",
  "./v2-intro.html",
  "./v2-intro.css?v=15",
  "./v2-intro.js?v=9",
  "./art/v2-style/event-portraits/necromancer.png?v=2",
  "./art/v2-style/event-portraits/necromancer-upperbody-hd.webp?v=1",
  "./assets/intro-data/hero/part-000.txt",
  "./assets/intro-data/hero/part-001.txt",
  "./assets/intro-data/hero/part-002.txt",
  "./assets/intro-data/frame/part-000.txt",
  "./assets/intro-data/frame/part-001.txt",
  "./assets/intro-data/frame-v2/part-000.txt",
  "./assets/intro-data/frame-v2/part-001.txt",
  "./assets/intro-data/frame-v2/part-002.txt",
  "./assets/intro-data/frame-v2/part-003.txt",
  "./assets/intro-data/frame-v2/part-004.txt",
  "./assets/intro-data/frame-v2/part-005.txt",
  "./assets/intro-data/frame-v2/part-006.txt",
  "./assets/intro-data/frame-v2/part-007.txt",
  "./art/v2-style/event-portraits/knight-commander.png?v=2",
  "./art/v2-style/event-portraits/knight-commander-upperbody-hd.webp?v=1",
  "./assets/intro-data/commander/part-000.txt",
  "./assets/intro-data/commander/part-001.txt",
  "./assets/intro-data/commander/part-002.txt",
  "./assets/intro-data/commander/part-003.txt",
  "./assets/intro-data/commander/part-004.txt",
  "./assets/intro-data/commander/part-005.txt",
  "./assets/intro-data/commander/part-006.txt",
  "./assets/intro-data/commander/part-007.txt",
  "./assets/intro-data/commander/part-008.rev.txt",
  "./assets/intro-data/commander/part-009.rev.txt",
  "./assets/intro-data/commander/part-010.rev.txt",
  "./assets/intro-data/commander/part-011.rev.txt",
  "./assets/intro-data/commander/part-012.b64txt.txt",
  "./assets/intro-data/commander/part-013.rev.txt",
  "./assets/intro-data/commander/part-014.rev.txt",
  "./art/v2-style/ui/intro-dialogue-box.webp?v=6",
  "./assets/title/exit.webp",
  "./assets/title/options.webp",
  "./assets/title/continue.webp",
  "./assets/title/new-game.webp",
  "./assets/title/title-logo.webp",
  "./assets/title/title-theme.mp3",
  "./assets/title/title-loop.mp4",
  "./launch.js?v=20261004-fullscreen-shell-1",
  "./launch.css?v=20261004-fullscreen-shell-1",
  "./launch.css?v=20260930-title-1",
  "./launch.js?v=20260930-title-1",
  "./v2-map-practice.html",
  "./v2-auto-battle-practice.html",
  "./v2-animation-practice.html",
  "./v2-animation-practice.css?v=7",
  "./v2-animation-practice.js?v=82",
  "./v2-event-lab.html",
  "./v2-event-lab.css?v=20261008-choice-visual-fix1",
  "./v2-event-lab.js?v=20261005-event-lab-map-link-stage7",
  "./v2-event-lab-data.js?v=20261005-event-lab-map-link-stage7",
  "./assets/event-lab/graveyard-child/base/part-000.txt",
  "./assets/event-lab/graveyard-child/base/part-001.txt",
  "./assets/event-lab/graveyard-child/ghoul/part-000.txt",
  "./assets/event-lab/graveyard-child/ghoul/part-001.txt",
  "./art/v2-style/map-test/events/graveyard.jpg?v=20260927-2",
  "./art/v2-style/map-test/events/graveyard-child-base-v3.webp?v=1",
  "./art/v2-style/map-test/events/graveyard-child-ghoul-event-v3.webp?v=2",
  "./art/v2-style/map-test/events/rumor-village-base.webp?v=2",
  "./art/v2-style/map-test/events/rumor-villagers-whisper.webp?v=2",
  "./art/v2-style/map-test/events/rumor-villagers-turn.webp?v=2",
  "./art/v2-style/map-test/events/rumor-necromancer.webp?v=2",
  "./art/v2-style/map-test/events/cultist-rumor-procession.webp?v=1",
  "./art/v2-style/map-test/events/cultist-altar-night-base.webp?v=1",
  "./art/v2-style/map-test/events/cultist-altar-ritual-layer.webp?v=1",
  "./art/v2-style/map-test/events/cultist-altar-summon-layer.webp?v=1",
  "./art/v2-style/map-test/events/ritual-portal-ruins-base.webp?v=1",
  "./art/v2-style/map-test/events/ritual-portal-energy-layer.webp?v=1",
  "./art/v2-style/map-test/events/ritual-portal-cultists-layer.webp?v=1",
  "./art/v2-style/map-test/events/ritual-portal-omen-layer.webp?v=1",
  "./art/v2-style/map-test/events/knight-commander-village-day.webp?v=1",
  "./art/v2-style/event-portraits/monster-hunter-pen-clean.webp?v=1",
  "./art/v2-style/map-test/events/monster-hunter-corrupted-beast-scene.webp?v=1",
  "./art/v2-style/map-test/events/monster-hunter-worldtree-base.webp?v=1",









  "./v2-tile-practice.html",
  "./v2-tile-practice.css?v=1",
  "./v2-tile-practice.js?v=2",
  "./v2-map-practice.css?v=20261009-ritual-portal-event-v1",
  "./art/v2-style/ui/parchment-button-variant-01.png",
  "./art/v2-style/ui/parchment-button-variant-02.png",
  "./art/v2-style/ui/parchment-button-variant-03.png",
  "./art/v2-style/ui/parchment-button-variant-04.png",
  "./art/v2-style/ui/graveyard-choice-parchment.webp?v=1",
  "./art/v2-style/ui/legion-info-window-hd-clean.webp?v=2",
  "./v2-home-inheritance.css?v=10",
  "./v2-altar-ritual.css?v=5",
  "./v2-auto-battle-practice.css?v=88",
  "./v2-asset-loader.js?v=1",
  "./v2-map-practice.js?v=20261009-monster-king-hunt-v1",
  "./art/v2-style/map-test/diorama/forest-tree-atlas.webp?v=20261004-forest-stage26-atlas-edge-mask-1",
  "./art/v2-style/map-test/diorama/village-building-01.webp?v=20261005-graveyard-poster-stage17-1",
  "./art/v2-style/map-test/diorama/village-building-02.webp?v=20261005-graveyard-poster-stage17-1",
  "./art/v2-style/map-test/diorama/village-building-03.webp?v=20261005-graveyard-poster-stage17-1",
  "./art/v2-style/map-test/diorama/village-building-04.webp?v=20261005-graveyard-poster-stage17-1",
  "./art/v2-style/map-test/diorama/village-building-05.webp?v=20261005-graveyard-poster-stage17-1",
  "./art/v2-style/map-test/diorama/village-building-06.webp?v=20261005-graveyard-poster-stage17-1",
  "./art/v2-style/map-test/diorama/stone-tile-wall.svg?v=20261004-forest-user-wall-1",
  "./art/v2-style/map-test/events/fortune-prophecy-ui.png?v=1",
  "./art/v2-style/map-test/diorama/graveyard/graveyard-atlas.webp?v=20261005-graveyard-poster-stage17-1",
  "./v2-auto-battle-practice.js?v=140",
  "./v2-heal-effect.js?v=1",
  "./v2-landscape.js?v=3",
  "./v2-music.js?v=3",
  "./v2-sfx.js?v=4",
  "./v2-design-data.js?v=1",
  "./v2-rules.js?v=9",
  "./v2-battle-rng.js?v=1",
  "./v2-summon-effect.js?v=3",
  "./assets/music/map-board.mp3",
  "./assets/music/battle.mp3",
  "./art/v2-style/ui/summon-effect-sheet.jpg",
  "./art/v2-style/ui/freeze-status-label.png?v=2",
  "./art/v2-style/ui/brand-card.png?v=4",
  "./art/v2-style/map-test/events/inheritance-board.png",
  "./art/v2-style/map-test/events/altar-ritual-slots.png",
  "./art/v2-style/map-test/events/altar-ritual-info.png",
  "./art/v2-style/battle-backgrounds/uploaded-raw/wasteland-chasm-battlefield.jpg",
  "./art/v2-style/battle-backgrounds/uploaded-raw/haunted-forest-ruins-battlefield.jpg",
  "./art/v2-style/battle-backgrounds/uploaded-raw/necropolis-pyramids-battlefield.jpg",
  "./v2-run-state.js?v=4",
  "./v2-run-state-runtime.js?v=8",
  "./v2-presentation.js?v=1",
  "./v2-presentation-rail.js?v=2",
  "./v2-brand-cards.js?v=6",
  "./v2-home-inheritance.js?v=17",
  "./v2-altar-ritual.js?v=6",
  "./v2-dice-control.js?v=1",
  "./v2-world-tree-prayer-digits.js?v=2",
  "./art/v2-style/map-test/maps/default-map.jpg?v=20261004-board-bg-final-1",
  "./art/v2-style/map-test/maps/winter-map.jpg",
  "./art/v2-style/map-test/maps/hell-map.jpg",
  "./art/v2-style/map-test/hero/necromancer-hero.png",
  "./art/v2-style/ui/contamination/contamination-hud.png",
  "./art/v2-style/ui/map-book-closed.png",
  "./art/v2-style/ui/map-book-open.png",
  "./art/v2-style/ui/map-card-deck.png",
  "./art/v2-style/ui/map-options-button.webp?v=1",
  "./art/v2-style/ui/swamp-damage-minus1.svg?v=1",
  "./art/v2-style/ui/monster-shop-counter.png?v=3",
  "./art/v2-style/ui/patrol-route-frame.webp?v=2",
  "./art/v2-style/ui/patrol-route-current-frame.webp?v=2",
  "./art/v2-style/ui/heal-cross.png?v=1",
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

const APP_SHELL = CORE_ASSETS;

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
