const CACHE_NAME = "necromancer-expedition-v61";
const APP_SHELL = [
  "./",
  "./index.html",
  "./v2.html",
  "./v2-animation-practice.html",
  "./v2-animation-practice.css",
  "./v2-animation-practice.js",
  "./v2-battle.css?v=7",
  "./v2-motion.js?v=4",
  "./v2-battle.js?v=11",
  "./styles.css?v=43",
  "./ultimate-vfx.css?v=43",
  "./dice-overlay.css?v=46",
  "./unit-data.js?v=45",
  "./encounter-generator.js?v=43",
  "./ultimate-vfx.js?v=43",
  "./map-generator.js?v=43",
  "./event-data.js?v=43",
  "./dice-overlay.js?v=46",
  "./game.js?v=46",
  "./manifest.webmanifest?v=20260726-10",
  "./assets/app-icon-192.png",
  "./assets/app-icon-512.png",
  "./art/v2-style/animation-sheets/uploaded-raw/blood-skeleton-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/boulder-ogre-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/carnivorous-flower-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/cerberus-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/cyclops-monster-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/death-knight-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/forest-fairy-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/gargoyle-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/ghoul-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/giant-spider-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/goblin-commoner-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/goblin-rider-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/goblin-shaman-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/goblin-soldier-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/grave-worm-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/guardian-seed-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/harpy-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/hooded-necromancer-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/hydra-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/ice-lord-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/ice-princess-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/mantis-monster-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/mimic-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/minotaur-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/mummy-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/mushroom-monster-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/obese-zombie-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/octopus-monster-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/orc-warrior-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/plague-doctor-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/poison-toad-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/raging-treant-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/reaper-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/scorpion-warrior-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/sea-wolf-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/siren-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/skeleton-archer-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/skeleton-cavalry-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/skeleton-spear-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/spider-queen-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/stone-golem-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/treant-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/undead-hound-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/uploaded-raw/yeti-animation-sheet.jpg",
  "./assets/v2-battle-castle.png",
  "./art/v2-style/battle-backgrounds/uploaded-raw/wasteland-chasm-battlefield.jpg",
  "./art/v2-style/battle-backgrounds/uploaded-raw/haunted-forest-ruins-battlefield.jpg",
  "./art/v2-style/battle-backgrounds/uploaded-raw/necropolis-pyramids-battlefield.jpg",
  "./art/v2-style/processed/192/ancient-treant.png",
  "./art/v2-style/processed/192/bone-golem.png",
  "./art/v2-style/processed/192/crystal-devourer.png",
  "./art/v2-style/processed/192/death-knight.png",
  "./art/v2-style/processed/192/demon-death-knight.png",
  "./art/v2-style/processed/192/forest-fairy.png",
  "./art/v2-style/processed/192/goblin-soldier.png",
  "./art/v2-style/processed/192/hell-mantis.png",
  "./art/v2-style/processed/192/kraken.png",
  "./art/v2-style/processed/192/scorpion-knight.png",
  "./art/v2-style/processed/192/sea-wolf.png",
  "./art/v2-style/processed/192/skeleton-archer.png",
  "./art/v2-style/processed/192/skeleton-spear.png",
  "./art/v2-style/processed/192/spider-queen.png",
  "./art/v2-style/processed/192/stone-golem.png",
  "./art/v2-style/processed/192/totem-ice.png",
  "./art/v2-style/processed/192/totem-plague.png",
  "./art/v2-style/processed/192/totem-plant.png"
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
