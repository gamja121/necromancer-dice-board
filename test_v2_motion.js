const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = __dirname;
const practiceHtml = fs.readFileSync(path.join(root, "v2-animation-practice.html"), "utf8");
const practiceSource = fs.readFileSync(path.join(root, "v2-animation-practice.js"), "utf8");
const serviceWorker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const battleHtml = fs.readFileSync(path.join(root, "v2.html"), "utf8");

assert(indexHtml.includes('href="v2-animation-practice.html">모션 테스트</a>'), "Start screen motion test link is missing.");
assert(battleHtml.includes('href="v2-animation-practice.html" class="secondary-action">모션 테스트</a>'), "V2 motion test link is missing.");
assert(practiceHtml.includes('id="unitSprite"'), "Motion test sprite is missing.");
assert(!practiceHtml.includes('id="jpgSprite"') && !practiceHtml.includes('id="pngSprite"'), "Old JPG/PNG comparison sprites remain.");
assert(practiceHtml.includes("유닛 모션 테스트"), "Unit motion test title is missing.");
assert(practiceHtml.includes('data-unit="death-knight"'), "Death Knight picker is missing.");
assert(practiceHtml.includes('data-unit="skeleton-spear"'), "Skeleton Spearman picker is missing.");
assert(practiceHtml.includes('data-unit="ancient-treant"'), "Ancient Treant picker is missing.");
assert(practiceHtml.includes('data-unit="stone-golem"'), "Stone Golem picker is missing.");
assert(practiceHtml.includes('data-unit="goblin-rider"'), "Goblin Rider picker is missing.");
assert(practiceHtml.includes('data-unit="orc-warrior"'), "Orc Warrior picker is missing.");
assert(practiceHtml.includes('data-unit="boulder-ogre"'), "Boulder Ogre picker is missing.");
assert(practiceHtml.includes('data-unit="goblin-commoner"'), "Goblin Commoner picker is missing.");
assert(practiceHtml.includes('data-unit="ice-lord"'), "Ice Lord picker is missing.");
assert(practiceHtml.includes('data-unit="yeti"'), "Yeti picker is missing.");
assert(practiceHtml.includes('data-unit="ghoul"'), "Ghoul picker is missing.");
assert(practiceHtml.includes('data-unit="minotaur"'), "Minotaur picker is missing.");
assert(practiceHtml.includes('data-unit="skeleton-cavalry"'), "Skeleton Cavalry picker is missing.");
for (const id of ["attackBtn", "hitBtn", "deathBtn", "resetBtn", "battlefieldBtn"]) {
  assert(practiceHtml.includes(`id="${id}"`), `Motion test control is missing: ${id}`);
}

assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/death-knight/"'), "Death Knight frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/skeleton-spear/"'), "Skeleton Spearman frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/ancient-treant/"'), "Ancient Treant frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/stone-golem/"'), "Stone Golem frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/goblin-rider/"'), "Goblin Rider frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/orc-warrior/"'), "Orc Warrior frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/boulder-ogre/"'), "Boulder Ogre frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/goblin-commoner/"'), "Goblin Commoner frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/ice-lord/"'), "Ice Lord frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/yeti/"'), "Yeti frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/ghoul/"'), "Ghoul frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/minotaur/"'), "Minotaur frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/skeleton-cavalry/"'), "Skeleton Cavalry frame root is missing.");
assert(practiceSource.includes('"minotaur": { name: "미노타우로스", root: "art/v2-style/animation-test-frames/minotaur/", counts: { attack: 6, hit: 4, death: 6 } }'), "Minotaur frame counts are incorrect.");
assert(practiceSource.includes("counts: { attack: 6, hit: 4, death: 7 }"), "Yeti frame counts are incorrect.");
assert(practiceSource.includes("counts: { attack: 5, hit: 4, death: 6 }"), "Death Knight frame counts are incorrect.");
assert(practiceSource.includes("counts: { attack: 5, hit: 4, death: 5 }"), "Skeleton Spearman frame counts are incorrect.");
assert(practiceSource.includes("el.sprite.src = frames[index]"), "Single sprite animation advancement is missing.");
assert((practiceSource.match(/battlefield\.jpg/g) || []).length === 3, "All three random battlefields must remain available.");

for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/death-knight/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Death Knight frame is missing: ${relative}`);
  }
}
for (const [motion, count] of Object.entries({ attack: 6, hit: 4, death: 7 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/yeti/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Yeti frame is missing: ${relative}`);
  }
}
const yetiHitStart = fs.readFileSync(path.join(root, "art/v2-style/animation-test-frames/yeti/hit-01.png"));
assert(yetiHitStart.equals(fs.readFileSync(path.join(root, "art/v2-style/animation-test-frames/yeti/attack-01.png"))), "Yeti attack must start with hit frame 1.");
assert(yetiHitStart.equals(fs.readFileSync(path.join(root, "art/v2-style/animation-test-frames/yeti/death-01.png"))), "Yeti death must start with hit frame 1.");
for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/ghoul/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Ghoul frame is missing: ${relative}`);
  }
}
for (const [motion, count] of Object.entries({ attack: 6, hit: 4, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/minotaur/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Minotaur frame is missing: ${relative}`);
  }
}
const minotaurAttackStart = fs.readFileSync(path.join(root, "art/v2-style/animation-test-frames/minotaur/attack-01.png"));
assert(minotaurAttackStart.equals(fs.readFileSync(path.join(root, "art/v2-style/animation-test-frames/minotaur/attack-06.png"))), "Minotaur attack frame 1 must duplicate the original final pose.");
for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/skeleton-cavalry/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Skeleton Cavalry frame is missing: ${relative}`);
  }
}
const skeletonCavalryAttackStart = fs.readFileSync(path.join(root, "art/v2-style/animation-test-frames/skeleton-cavalry/attack-01.png"));
assert(skeletonCavalryAttackStart.equals(fs.readFileSync(path.join(root, "art/v2-style/animation-test-frames/skeleton-cavalry/attack-05.png"))), "Skeleton Cavalry attack frame 5 must duplicate source frame 1.");
assert(!fs.existsSync(path.join(root, "art/v2-style/animation-test-frames/boulder-ogre/death-06.png")), "Boulder Ogre death frame 6 must not be used.");
assert(practiceSource.includes('(index === 1 || index === 2) ? 1.1'), "Death Knight attack frames 2 and 3 must be enlarged to 1.1x.");
assert(practiceSource.includes('index === 1 ? 1.3'), "Boulder Ogre attack frame 2 must remain enlarged to 1.3x.");
for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 5 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/stone-golem/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Stone Golem frame is missing: ${relative}`);
  }
}
for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/goblin-commoner/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Goblin Commoner frame is missing: ${relative}`);
  }
}
for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/ice-lord/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Ice Lord frame is missing: ${relative}`);
  }
}
assert(!fs.existsSync(path.join(root, "art/v2-style/animation-test-frames/stone-golem/death-06.png")), "Stone Golem death frame 6 must not be used.");
for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 5 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/goblin-rider/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Goblin Rider frame is missing: ${relative}`);
  }
}
for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 5 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/orc-warrior/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Orc Warrior frame is missing: ${relative}`);
  }
}
assert(!fs.existsSync(path.join(root, "art/v2-style/animation-test-frames/orc-warrior/death-06.png")), "Orc Warrior death frame 6 must not be used.");
for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 5 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/boulder-ogre/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Boulder Ogre frame is missing: ${relative}`);
  }
}
for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 5 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/skeleton-spear/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Skeleton Spearman frame is missing: ${relative}`);
  }
}
for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/ancient-treant/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Ancient Treant frame is missing: ${relative}`);
  }
}

assert(serviceWorker.includes("animation-test-frames/death-knight/${motion}-"), "Death Knight frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/skeleton-spear/${motion}-"), "Skeleton Spearman frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/ancient-treant/${motion}-"), "Ancient Treant frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/stone-golem/${motion}-"), "Stone Golem frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/goblin-rider/${motion}-"), "Goblin Rider frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/orc-warrior/${motion}-"), "Orc Warrior frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/boulder-ogre/${motion}-"), "Boulder Ogre frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/goblin-commoner/${motion}-"), "Goblin Commoner frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/ice-lord/${motion}-"), "Ice Lord frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/yeti/${motion}-"), "Yeti frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/ghoul/${motion}-"), "Ghoul frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/minotaur/${motion}-"), "Minotaur frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/skeleton-cavalry/${motion}-"), "Skeleton Cavalry frame cache generator is missing.");

assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/death-knight-animation-sheet.jpg")), "New raw Death Knight sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/skeleton-spear-animation-sheet.jpg")), "New raw Skeleton Spearman sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/ancient-treant-animation-sheet.jpg")), "New raw Ancient Treant sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/stone-golem-animation-sheet.jpg")), "New raw Stone Golem sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/goblin-rider-animation-sheet.jpg")), "New raw Goblin Rider sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/orc-warrior-animation-sheet.jpg")), "New raw Orc Warrior sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/boulder-ogre-animation-sheet.jpg")), "New raw Boulder Ogre sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/goblin-commoner-animation-sheet.png")), "New raw Goblin Commoner sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/ice-lord-animation-sheet.jpg")), "New raw Ice Lord sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/yeti-animation-sheet.jpg")), "New raw Yeti sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/ghoul-animation-sheet.jpg")), "New raw Ghoul sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/minotaur-animation-sheet.jpg")), "New raw Minotaur sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/skeleton-cavalry-animation-sheet.jpg")), "New raw Skeleton Cavalry sheet is missing.");
assert(serviceWorker.includes("necromancer-expedition-v90"), "Service worker cache version was not bumped.");
assert(!serviceWorker.includes("animation-sheets/uploaded-raw"), "Deleted legacy animation sheets remain in offline cache.");
assert(!serviceWorker.includes("animation-test-crops"), "Deleted comparison crops remain in offline cache.");
for (const match of serviceWorker.matchAll(/^\s*"(\.\/[^"?]+)(?:\?[^\"]*)?"[,]?$/gm)) {
  assert(fs.existsSync(path.join(root, match[1].slice(2))), `Offline static asset is missing: ${match[1]}`);
}

console.log("SUCCESS: Death Knight, Skeleton Spearman, Ancient Treant, Stone Golem, Goblin Rider, Orc Warrior, Boulder Ogre, Goblin Commoner, Ice Lord, Yeti, Ghoul, Minotaur, and Skeleton Cavalry motion test integration checks passed.");
