const CACHE_NAME = "necromancer-expedition-v129";
const APP_SHELL = [
  "./",
  "./index.html",
  "./v2.html",
  "./v2-animation-practice.html",
  "./v2-animation-practice.css?v=5",
  "./v2-animation-practice.js?v=46",
  "./v2-dice-practice.html",
  "./v2-dice-practice.css?v=1",
  "./v2-dice-practice.js?v=1",
  "./v2-map-practice.html",
  "./v2-map-practice.css?v=3",
  "./v2-map-practice.js?v=2",
  "./v2-landscape.js?v=1",
  "./v2-auto-battle-practice.html",
  "./v2-auto-battle-practice.css?v=11",
  "./v2-auto-battle-practice.js?v=11",
  "./v2-battle.css?v=7",
  "./v2-motion.js?v=5",
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
  "./art/v2-style/map-test/maps/default-map.jpg",
  "./art/v2-style/map-test/maps/winter-map.jpg",
  "./art/v2-style/map-test/maps/hell-map.jpg",
  "./art/v2-style/map-test/tiles/basic.png",
  "./art/v2-style/map-test/tiles/graveyard.png",
  "./art/v2-style/map-test/tiles/altar.png",
  "./art/v2-style/map-test/tiles/unknown.png",
  "./art/v2-style/map-test/tiles/forest.png",
  "./art/v2-style/map-test/tiles/rest.png",
  "./art/v2-style/map-test/tiles/monster.png",
  "./art/v2-style/map-test/tiles/gem.png",
  "./art/v2-style/map-test/tiles/event.png",
  "./art/v2-style/map-test/tiles/warp.png",
  "./art/v2-style/map-test/hero/necromancer-hero.png",
  "./art/v2-style/animation-sheets/green-raw/death-knight-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/skeleton-spear-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/ancient-treant-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/stone-golem-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/goblin-rider-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/orc-warrior-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/boulder-ogre-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/goblin-commoner-animation-sheet.png",
  "./art/v2-style/animation-sheets/green-raw/ice-lord-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/yeti-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/ghoul-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/minotaur-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/skeleton-cavalry-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/soul-reaper-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/mummy-guardian-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/doom-executor-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/plague-frog-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/plague-doctor-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/goblin-chief-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/grave-priest-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/forest-fairy-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/mushroom-soldier-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/spider-knight-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/skeleton-archer-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/sea-wolf-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/abyss-eye-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/kraken-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/raging-treant-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/crystal-devourer-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/grave-worm-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/siren-animation-sheet.jpg",
  "./art/v2-style/animation-sheets/green-raw/mimic-animation-sheet.jpg",
  "./assets/v2-battle-castle.png",
  "./art/v2-style/battle-backgrounds/uploaded-raw/wasteland-chasm-battlefield.jpg",
  "./art/v2-style/battle-backgrounds/uploaded-raw/haunted-forest-ruins-battlefield.jpg",
  "./art/v2-style/battle-backgrounds/uploaded-raw/necropolis-pyramids-battlefield.jpg",
  "./art/v2-style/ui/unit-info-window.png",
  "./assets/death-knight.jpg",
  "./assets/skeleton-spear.jpg",
  "./assets/ghoul.jpg",
  "./assets/ancient-treant.jpg",
  "./assets/goblin-rider.jpg",
  "./assets/goblin-soldier.jpg",
  "./assets/ogre.jpg",
  "./assets/minotaur.jpg",
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

for (let index = 1; index <= 12; index += 1) {
  APP_SHELL.push(`./art/v2-style/dice-test/frames/roll-${String(index).padStart(2, "0")}.png`);
}
for (let value = 1; value <= 6; value += 1) {
  APP_SHELL.push(`./art/v2-style/dice-test/frames/result-${String(value).padStart(2, "0")}.png`);
}

Object.entries({ attack: 5, hit: 4, death: 6 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/death-knight/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 6, hit: 4, death: 7 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/yeti/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 6 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/ghoul/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 6, hit: 4, death: 6 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/minotaur/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 6 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/skeleton-cavalry/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 6, hit: 4, death: 6 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/soul-reaper/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 5 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/mummy-guardian/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 5 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/doom-executor/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 5 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/plague-frog/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 5 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/plague-doctor/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 5 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/goblin-chief/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 5 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/skeleton-spear/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 6 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/goblin-commoner/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 6 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/ice-lord/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 5 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/goblin-rider/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 5 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/orc-warrior/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 5 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/boulder-ogre/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 6 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/ancient-treant/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 5 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/stone-golem/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 6 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/grave-priest/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 7 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/forest-fairy/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 6 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/mushroom-soldier/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 5 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/spider-knight/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 6 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/skeleton-archer/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 6 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/sea-wolf/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 6 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/abyss-eye/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 6 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/kraken/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 6 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/raging-treant/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 7 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/crystal-devourer/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 6 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/grave-worm/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 7 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/siren/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});
Object.entries({ attack: 5, hit: 4, death: 6 }).forEach(([motion, count]) => {
  for (let index = 1; index <= count; index += 1) {
    APP_SHELL.push(`./art/v2-style/animation-test-frames/mimic/${motion}-${String(index).padStart(2, "0")}.png`);
  }
});

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
