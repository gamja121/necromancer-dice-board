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
for (const id of ["attackBtn", "hitBtn", "deathBtn", "resetBtn", "battlefieldBtn"]) {
  assert(practiceHtml.includes(`id="${id}"`), `Motion test control is missing: ${id}`);
}

assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/death-knight/"'), "Death Knight frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/skeleton-spear/"'), "Skeleton Spearman frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/ancient-treant/"'), "Ancient Treant frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/stone-golem/"'), "Stone Golem frame root is missing.");
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
for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/stone-golem/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Stone Golem frame is missing: ${relative}`);
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

assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/death-knight-animation-sheet.jpg")), "New raw Death Knight sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/skeleton-spear-animation-sheet.jpg")), "New raw Skeleton Spearman sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/ancient-treant-animation-sheet.jpg")), "New raw Ancient Treant sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/stone-golem-animation-sheet.jpg")), "New raw Stone Golem sheet is missing.");
assert(serviceWorker.includes("necromancer-expedition-v71"), "Service worker cache version was not bumped.");
assert(!serviceWorker.includes("animation-sheets/uploaded-raw"), "Deleted legacy animation sheets remain in offline cache.");
assert(!serviceWorker.includes("animation-test-crops"), "Deleted comparison crops remain in offline cache.");
for (const match of serviceWorker.matchAll(/^\s*"(\.\/[^"?]+)(?:\?[^\"]*)?"[,]?$/gm)) {
  assert(fs.existsSync(path.join(root, match[1].slice(2))), `Offline static asset is missing: ${match[1]}`);
}

console.log("SUCCESS: Death Knight, Skeleton Spearman, Ancient Treant, and Stone Golem motion test integration checks passed.");
