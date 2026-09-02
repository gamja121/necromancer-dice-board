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
const greenProcessor = fs.readFileSync(path.join(root, "scripts/process-green-animation-sheet.ps1"), "utf8");
const gravePriestProcessor = fs.readFileSync(path.join(root, "scripts/process-grave-priest-sheet.ps1"), "utf8");
const forestFairyProcessor = fs.readFileSync(path.join(root, "scripts/process-forest-fairy-sheet.ps1"), "utf8");
const mushroomSoldierProcessor = fs.readFileSync(path.join(root, "scripts/process-mushroom-soldier-sheet.ps1"), "utf8");
const spiderKnightProcessor = fs.readFileSync(path.join(root, "scripts/process-spider-knight-sheet.ps1"), "utf8");
const skeletonArcherProcessor = fs.readFileSync(path.join(root, "scripts/process-skeleton-archer-sheet.ps1"), "utf8");
const seaWolfProcessor = fs.readFileSync(path.join(root, "scripts/process-sea-wolf-sheet.ps1"), "utf8");
const abyssEyeProcessor = fs.readFileSync(path.join(root, "scripts/process-abyss-eye-sheet.ps1"), "utf8");
const krakenProcessor = fs.readFileSync(path.join(root, "scripts/process-kraken-sheet.ps1"), "utf8");
const crystalDevourerProcessor = fs.readFileSync(path.join(root, "scripts/process-crystal-devourer-sheet.ps1"), "utf8");
const graveWormProcessor = fs.readFileSync(path.join(root, "scripts/process-grave-worm-sheet.ps1"), "utf8");
const sirenProcessor = fs.readFileSync(path.join(root, "scripts/process-siren-sheet.ps1"), "utf8");
const mimicProcessor = fs.readFileSync(path.join(root, "scripts/process-mimic-sheet.ps1"), "utf8");

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
assert(practiceHtml.includes('data-unit="soul-reaper"'), "Soul Reaper picker is missing.");
assert(practiceHtml.includes('data-unit="mummy-guardian"'), "Mummy Guardian picker is missing.");
assert(practiceHtml.includes('data-unit="doom-executor"'), "Doom Executor picker is missing.");
assert(practiceHtml.includes('data-unit="plague-frog"'), "Plague Frog picker is missing.");
assert(practiceHtml.includes('data-unit="plague-doctor"'), "Plague Doctor picker is missing.");
assert(practiceHtml.includes('data-unit="goblin-chief"'), "Goblin Chief picker is missing.");
assert(practiceHtml.includes('data-unit="grave-priest"'), "Grave Priest picker is missing.");
assert(practiceHtml.includes('data-unit="forest-fairy"'), "Forest Fairy picker is missing.");
assert(practiceHtml.includes('data-unit="mushroom-soldier"'), "Mushroom Soldier picker is missing.");
assert(practiceHtml.includes('data-unit="spider-knight"'), "Spider Knight picker is missing.");
assert(practiceHtml.includes('data-unit="skeleton-archer"'), "Skeleton Archer picker is missing.");
assert(practiceHtml.includes('data-unit="sea-wolf"'), "Sea Wolf picker is missing.");
assert(practiceHtml.includes('data-unit="abyss-eye"'), "Abyss Eye picker is missing.");
assert(practiceHtml.includes('data-unit="kraken"'), "Kraken picker is missing.");
assert(practiceHtml.includes('data-unit="raging-treant"'), "Raging Treant picker is missing.");
assert(practiceHtml.includes('data-unit="crystal-devourer"'), "Crystal Devourer picker is missing.");
assert(practiceHtml.includes('data-unit="grave-worm"'), "Grave Worm picker is missing.");
assert(practiceHtml.includes('data-unit="siren"'), "Siren picker is missing.");
assert(practiceHtml.includes('data-unit="mimic"'), "Mimic picker is missing.");
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
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/soul-reaper/"'), "Soul Reaper frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/mummy-guardian/"'), "Mummy Guardian frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/doom-executor/"'), "Doom Executor frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/plague-frog/"'), "Plague Frog frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/plague-doctor/"'), "Plague Doctor frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/goblin-chief/"'), "Goblin Chief frame root is missing.");
assert(practiceSource.includes('root: "art/v2-style/animation-test-frames/grave-priest/"'), "Grave Priest frame root is missing.");
assert(practiceSource.includes('"grave-priest": { name: "묘지 사제", root: "art/v2-style/animation-test-frames/grave-priest/", counts: { attack: 5, hit: 4, death: 6 } }'), "Grave Priest frame counts are incorrect.");
assert(practiceSource.includes('"forest-fairy": { name: "숲 요정", root: "art/v2-style/animation-test-frames/forest-fairy/", counts: { attack: 5, hit: 4, death: 7 } }'), "Forest Fairy frame counts are incorrect.");
assert(practiceSource.includes('"mushroom-soldier": { name: "버섯 병사", root: "art/v2-style/animation-test-frames/mushroom-soldier/", counts: { attack: 5, hit: 4, death: 6 } }'), "Mushroom Soldier frame counts are incorrect.");
assert(practiceSource.includes('"spider-knight": { name: "거미여왕", root: "art/v2-style/animation-test-frames/spider-knight/", counts: { attack: 5, hit: 4, death: 5 } }'), "Spider Queen frame counts are incorrect.");
assert(practiceSource.includes('"skeleton-archer": { name: "해골 궁수", root: "art/v2-style/animation-test-frames/skeleton-archer/", counts: { attack: 5, hit: 4, death: 6 } }'), "Skeleton Archer frame counts are incorrect.");
assert(practiceSource.includes('"sea-wolf": { name: "바다 늑대", root: "art/v2-style/animation-test-frames/sea-wolf/", counts: { attack: 5, hit: 4, death: 6 } }'), "Sea Wolf frame counts are incorrect.");
assert(practiceSource.includes('"abyss-eye": { name: "외눈 괴물", root: "art/v2-style/animation-test-frames/abyss-eye/", counts: { attack: 5, hit: 4, death: 6 } }'), "Abyss Eye frame counts are incorrect.");
assert(practiceSource.includes('"kraken": { name: "크라켄", root: "art/v2-style/animation-test-frames/kraken/", counts: { attack: 5, hit: 4, death: 6 } }'), "Kraken frame counts are incorrect.");
assert(practiceSource.includes('"raging-treant": { name: "분노한 고목", root: "art/v2-style/animation-test-frames/raging-treant/", counts: { attack: 5, hit: 4, death: 6 } }'), "Raging Treant frame counts are incorrect.");
assert(practiceSource.includes('"crystal-devourer": { name: "결정 포식화", root: "art/v2-style/animation-test-frames/crystal-devourer/", counts: { attack: 5, hit: 4, death: 7 } }'), "Crystal Devourer frame counts are incorrect.");
assert(practiceSource.includes('"grave-worm": { name: "역병 벌레", root: "art/v2-style/animation-test-frames/grave-worm/", counts: { attack: 5, hit: 4, death: 6 } }'), "Grave Worm frame counts are incorrect.");
assert(practiceSource.includes('"siren": { name: "세이렌", root: "art/v2-style/animation-test-frames/siren/", counts: { attack: 5, hit: 4, death: 7 } }'), "Siren frame counts are incorrect.");
assert(practiceSource.includes('"mimic": { name: "미믹", root: "art/v2-style/animation-test-frames/mimic/", counts: { attack: 5, hit: 4, death: 6 } }'), "Mimic frame counts are incorrect.");
assert(practiceSource.includes('"goblin-chief": { name: "고블린족장", root: "art/v2-style/animation-test-frames/goblin-chief/", counts: { attack: 5, hit: 4, death: 5 } }'), "Goblin Chief frame counts are incorrect.");
assert(practiceSource.includes('"plague-doctor": { name: "역병술사", root: "art/v2-style/animation-test-frames/plague-doctor/", counts: { attack: 5, hit: 4, death: 5 } }'), "Plague Doctor frame counts are incorrect.");
assert(practiceSource.includes('"plague-frog": { name: "역병 개구리", root: "art/v2-style/animation-test-frames/plague-frog/", counts: { attack: 5, hit: 4, death: 5 } }'), "Plague Frog frame counts are incorrect.");
assert(practiceSource.includes('"doom-executor": { name: "석상 가고일", root: "art/v2-style/animation-test-frames/doom-executor/", counts: { attack: 5, hit: 4, death: 5 } }'), "Doom Executor frame counts are incorrect.");
assert(practiceSource.includes('"mummy-guardian": { name: "미라 수호병", root: "art/v2-style/animation-test-frames/mummy-guardian/", counts: { attack: 5, hit: 4, death: 5 } }'), "Mummy Guardian frame counts are incorrect.");
assert(practiceSource.includes('"soul-reaper": { name: "영혼 수확자", root: "art/v2-style/animation-test-frames/soul-reaper/", counts: { attack: 6, hit: 4, death: 6 } }'), "Soul Reaper frame counts are incorrect.");
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
for (const [motion, count] of Object.entries({ attack: 6, hit: 4, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/soul-reaper/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Soul Reaper frame is missing: ${relative}`);
  }
}
const soulReaperAttackStart = fs.readFileSync(path.join(root, "art/v2-style/animation-test-frames/soul-reaper/attack-01.png"));
assert(soulReaperAttackStart.equals(fs.readFileSync(path.join(root, "art/v2-style/animation-test-frames/soul-reaper/attack-06.png"))), "Soul Reaper attack frames 1 and 6 must both use source frame 5.");
for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 5 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/mummy-guardian/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Mummy Guardian frame is missing: ${relative}`);
  }
}
assert(!fs.existsSync(path.join(root, "art/v2-style/animation-test-frames/mummy-guardian/death-06.png")), "Mummy Guardian final source death frame must not be used.");
assert(greenProcessor.includes('|| String.Equals(unitName, "mummy-guardian", StringComparison.OrdinalIgnoreCase)'), "Mummy Guardian must use conservative magenta removal to preserve its legs and staff.");
for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 5 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/doom-executor/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Doom Executor frame is missing: ${relative}`);
  }
}
assert(!fs.existsSync(path.join(root, "art/v2-style/animation-test-frames/doom-executor/death-06.png")), "Doom Executor final source death frame must not be used.");
assert(greenProcessor.includes("Requested attack order: source 5, 1, 2, 3, 4."), "Doom Executor attack order is not preserved by the frame processor.");
for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 5 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/plague-frog/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Plague Frog frame is missing: ${relative}`);
  }
}
assert(!fs.existsSync(path.join(root, "art/v2-style/animation-test-frames/plague-frog/death-06.png")), "Plague Frog final source death frame must not be used.");
for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 5 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/plague-doctor/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Plague Doctor frame is missing: ${relative}`);
  }
}
assert(!fs.existsSync(path.join(root, "art/v2-style/animation-test-frames/plague-doctor/death-06.png")), "Plague Doctor final source death frame must not be used.");
for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 5 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/goblin-chief/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Goblin Chief frame is missing: ${relative}`);
  }
}
const goblinChiefAttackStart = fs.readFileSync(path.join(root, "art/v2-style/animation-test-frames/goblin-chief/attack-01.png"));
assert(goblinChiefAttackStart.equals(fs.readFileSync(path.join(root, "art/v2-style/animation-test-frames/goblin-chief/death-01.png"))), "Goblin Chief death frame 1 must use attack source frame 5.");
assert(!fs.existsSync(path.join(root, "art/v2-style/animation-test-frames/goblin-chief/death-06.png")), "Goblin Chief final source death frame must not be used.");
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
assert(serviceWorker.includes("animation-test-frames/soul-reaper/${motion}-"), "Soul Reaper frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/mummy-guardian/${motion}-"), "Mummy Guardian frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/doom-executor/${motion}-"), "Doom Executor frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/plague-frog/${motion}-"), "Plague Frog frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/plague-doctor/${motion}-"), "Plague Doctor frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/goblin-chief/${motion}-"), "Goblin Chief frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/grave-priest/${motion}-"), "Grave Priest frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/forest-fairy/${motion}-"), "Forest Fairy frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/mushroom-soldier/${motion}-"), "Mushroom Soldier frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/spider-knight/${motion}-"), "Spider Knight frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/skeleton-archer/${motion}-"), "Skeleton Archer frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/sea-wolf/${motion}-"), "Sea Wolf frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/abyss-eye/${motion}-"), "Abyss Eye frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/kraken/${motion}-"), "Kraken frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/raging-treant/${motion}-"), "Raging Treant frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/crystal-devourer/${motion}-"), "Crystal Devourer frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/grave-worm/${motion}-"), "Grave Worm frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/siren/${motion}-"), "Siren frame cache generator is missing.");
assert(serviceWorker.includes("animation-test-frames/mimic/${motion}-"), "Mimic frame cache generator is missing.");

for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/grave-priest/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Grave Priest frame is missing: ${relative}`);
  }
}
assert(gravePriestProcessor.includes("removeFinalSparkle"), "Grave Priest final Gemini cleanup is missing.");
assert(gravePriestProcessor.includes("DrawImageUnscaled"), "Grave Priest frames must preserve source resolution.");

for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 7 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/forest-fairy/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Forest Fairy frame is missing: ${relative}`);
  }
}
assert(forestFairyProcessor.includes("RemoveFinalSparkle"), "Forest Fairy final Gemini cleanup is missing.");
assert(forestFairyProcessor.includes("DrawImageUnscaled"), "Forest Fairy frames must preserve source resolution.");

for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/mushroom-soldier/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Mushroom Soldier frame is missing: ${relative}`);
  }
}
assert(mushroomSoldierProcessor.includes("RemoveFinalSparkle"), "Mushroom Soldier final Gemini cleanup is missing.");
assert(mushroomSoldierProcessor.includes("RemoveEdgeWhiteGutters"), "Mushroom Soldier white cell gutter cleanup is missing.");
assert(mushroomSoldierProcessor.includes("DrawImageUnscaled"), "Mushroom Soldier frames must preserve source resolution.");

for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 5 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/spider-knight/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Spider Knight frame is missing: ${relative}`);
  }
}
assert(spiderKnightProcessor.includes("RemoveFinalSparkle"), "Spider Knight final Gemini cleanup is missing.");
assert(spiderKnightProcessor.includes("DrawImageUnscaled"), "Spider Knight frames must preserve source resolution.");
assert(!fs.existsSync(path.join(root, "art/v2-style/animation-test-frames/spider-knight/death-06.png")), "Spider Queen removed death frame remains.");

for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/skeleton-archer/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Skeleton Archer frame is missing: ${relative}`);
  }
}
assert(skeletonArcherProcessor.includes("RemoveFinalSparkle"), "Skeleton Archer final Gemini cleanup is missing.");
assert(skeletonArcherProcessor.includes("DrawImageUnscaled"), "Skeleton Archer frames must preserve source resolution.");

for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/sea-wolf/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Sea Wolf frame is missing: ${relative}`);
  }
}
assert(seaWolfProcessor.includes("RemoveFinalSparkle"), "Sea Wolf final Gemini cleanup is missing.");
assert(seaWolfProcessor.includes("DrawImageUnscaled"), "Sea Wolf frames must preserve source resolution.");

for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/abyss-eye/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Abyss Eye frame is missing: ${relative}`);
  }
}
assert(abyssEyeProcessor.includes("RemoveFinalSparkle"), "Abyss Eye final Gemini cleanup is missing.");
assert(abyssEyeProcessor.includes("DrawImageUnscaled"), "Abyss Eye frames must preserve source resolution.");

for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/kraken/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Kraken frame is missing: ${relative}`);
  }
}
assert(krakenProcessor.includes("RemoveFinalSparkle"), "Kraken final Gemini cleanup is missing.");
assert(krakenProcessor.includes("RemoveAttackNeighborArtifact"), "Kraken adjacent attack-frame cleanup is missing.");
assert(krakenProcessor.includes("DrawImageUnscaled"), "Kraken frames must preserve source resolution.");

for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/raging-treant/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Raging Treant frame is missing: ${relative}`);
  }
}
assert(greenProcessor.includes('String.Equals(unitName, "raging-treant"'), "Raging Treant crop definition is missing.");
assert(greenProcessor.includes("DrawImageUnscaled"), "Raging Treant frames must preserve source resolution.");

for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 7 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/crystal-devourer/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Crystal Devourer frame is missing: ${relative}`);
  }
}
assert(crystalDevourerProcessor.includes("int[] attackOrder = { 0, 2, 1, 3, 4 };"), "Crystal Devourer attack order is incorrect.");
assert(crystalDevourerProcessor.includes('SaveFrame(source, hit[4], outputDirectory, "death", 2, false);'), "Crystal Devourer hit 5 is not used as death 2.");
assert(crystalDevourerProcessor.includes("RemoveFinalSparkle"), "Crystal Devourer final Gemini cleanup is missing.");
assert(crystalDevourerProcessor.includes("DrawImageUnscaled"), "Crystal Devourer frames must preserve source resolution.");

for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/grave-worm/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Grave Worm frame is missing: ${relative}`);
  }
}
assert(graveWormProcessor.includes("RemoveDetachedEffects"), "Grave Worm particle cleanup is missing.");
assert(graveWormProcessor.includes("row == 1 && frameIndex == 2"), "Grave Worm hit 3 particle cleanup is missing.");
assert(graveWormProcessor.includes("row == 1 && frameIndex == 3"), "Grave Worm hit 4 particle cleanup is missing.");
assert(graveWormProcessor.includes("DrawImageUnscaled"), "Grave Worm frames must preserve source resolution.");

for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 7 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/siren/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Siren frame is missing: ${relative}`);
  }
}
const sirenHitFour = fs.readFileSync(path.join(root, "art/v2-style/animation-test-frames/siren/hit-04.png"));
assert(sirenHitFour.equals(fs.readFileSync(path.join(root, "art/v2-style/animation-test-frames/siren/death-01.png"))), "Siren death must start with hit frame 4.");
assert(sirenProcessor.includes('SaveFrame(source, hit[3], outputDirectory, "death", 1, false);'), "Siren hit 4 is not used as death 1.");
assert(sirenProcessor.includes("RemoveFinalSparkle"), "Siren final Gemini cleanup is missing.");
assert(sirenProcessor.includes("DrawImageUnscaled"), "Siren frames must preserve source resolution.");

for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/mimic/${motion}-${String(index).padStart(2, "0")}.png`;
    assert(fs.existsSync(path.join(root, relative)), `Mimic frame is missing: ${relative}`);
  }
}
assert(mimicProcessor.includes("RemoveFinalSparkle"), "Mimic final Gemini cleanup is missing.");
assert(mimicProcessor.includes("const int width = 320, height = 250;"), "Mimic canvas must preserve the long tongue attack.");
assert(mimicProcessor.includes("DrawImageUnscaled"), "Mimic frames must preserve source resolution.");

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
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/soul-reaper-animation-sheet.jpg")), "New raw Soul Reaper sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/mummy-guardian-animation-sheet.jpg")), "New raw Mummy Guardian sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/doom-executor-animation-sheet.jpg")), "New raw Doom Executor sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/plague-frog-animation-sheet.jpg")), "New raw Plague Frog sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/plague-doctor-animation-sheet.jpg")), "New raw Plague Doctor sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/goblin-chief-animation-sheet.jpg")), "New raw Goblin Chief sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/grave-priest-animation-sheet.jpg")), "New raw Grave Priest sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/forest-fairy-animation-sheet.jpg")), "New raw Forest Fairy sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/mushroom-soldier-animation-sheet.jpg")), "New raw Mushroom Soldier sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/spider-knight-animation-sheet.jpg")), "New raw Spider Knight sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/skeleton-archer-animation-sheet.jpg")), "New raw Skeleton Archer sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/sea-wolf-animation-sheet.jpg")), "New raw Sea Wolf sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/abyss-eye-animation-sheet.jpg")), "New raw Abyss Eye sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/kraken-animation-sheet.jpg")), "New raw Kraken sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/raging-treant-animation-sheet.jpg")), "New raw Raging Treant sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/crystal-devourer-animation-sheet.jpg")), "New raw Crystal Devourer sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/grave-worm-animation-sheet.jpg")), "New raw Grave Worm sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/siren-animation-sheet.jpg")), "New raw Siren sheet is missing.");
assert(fs.existsSync(path.join(root, "art/v2-style/animation-sheets/green-raw/mimic-animation-sheet.jpg")), "New raw Mimic sheet is missing.");
assert(serviceWorker.includes("necromancer-expedition-v138"), "Service worker cache version was not bumped.");
assert(!serviceWorker.includes("animation-sheets/uploaded-raw"), "Deleted legacy animation sheets remain in offline cache.");
assert(!serviceWorker.includes("animation-test-crops"), "Deleted comparison crops remain in offline cache.");
for (const match of serviceWorker.matchAll(/^\s*"(\.\/[^"?]+)(?:\?[^\"]*)?"[,]?$/gm)) {
  assert(fs.existsSync(path.join(root, match[1].slice(2))), `Offline static asset is missing: ${match[1]}`);
}

assert(practiceHtml.includes('data-unit="cerberus"'), "Cerberus picker is missing.");
assert(practiceSource.includes('"cerberus": { name: "케르베로스", root: "art/v2-style/animation-test-frames/cerberus/", counts: { attack: 5, hit: 4, death: 6 } }'), "Cerberus frame counts are incorrect.");
assert(serviceWorker.includes("animation-test-frames/cerberus/${motion}-"), "Cerberus cache generator is missing.");
for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/cerberus/${motion}-${String(index).padStart(2, "0")}.png`;
    const png = fs.readFileSync(path.join(root, relative));
    assert(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `Invalid PNG: ${relative}`);
    assert(png.readUInt32BE(16) === 260 && png.readUInt32BE(20) === 250, `Wrong canvas: ${relative}`);
    assert(png[25] === 6, `Expected RGBA transparency: ${relative}`);
  }
}
assert(practiceHtml.includes('data-unit="spiderling"'), "Spiderling picker is missing.");
assert(practiceSource.includes('"spiderling": { name: "새끼거미", root: "art/v2-style/animation-test-frames/spiderling/", counts: { attack: 5, hit: 4, death: 6 } }'), "Spiderling must exclude hit 5.");
assert(serviceWorker.includes("animation-test-frames/spiderling/${motion}-"), "Spiderling cache generator is missing.");
assert(!fs.existsSync(path.join(root, "art/v2-style/animation-test-frames/spiderling/hit-05.png")), "Excluded hit 5 must not be exported.");
for (const [motion, count] of Object.entries({ attack: 5, hit: 4, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/spiderling/${motion}-${String(index).padStart(2, "0")}.png`;
    const png = fs.readFileSync(path.join(root, relative));
    assert(png.readUInt32BE(16) === 260 && png.readUInt32BE(20) === 250, `Wrong canvas: ${relative}`);
    assert(png[25] === 6, `Expected RGBA transparency: ${relative}`);
  }
}
assert(practiceHtml.includes('data-unit="flesh-golem"'), "Flesh Golem picker is missing.");
assert(practiceSource.includes('"flesh-golem": { name: "누더기 포식자", root: "art/v2-style/animation-test-frames/flesh-golem/", counts: { attack: 5, hit: 5, death: 5 }, deathFrames: [1, 2, 3, 5, 6] }'), "Flesh Golem must skip original death frame 4 and preserve five hit frames.");
assert(serviceWorker.includes("animation-test-frames/flesh-golem/${motion}-"), "Flesh Golem cache generator is missing.");
for (const [motion, count] of Object.entries({ attack: 5, hit: 5, death: 6 })) {
  for (let index = 1; index <= count; index += 1) {
    const relative = `art/v2-style/animation-test-frames/flesh-golem/${motion}-${String(index).padStart(2, "0")}.png`;
    const png = fs.readFileSync(path.join(root, relative));
    assert(png.readUInt32BE(16) === 260 && png.readUInt32BE(20) === 250, `Wrong canvas: ${relative}`);
    assert(png[25] === 6, `Expected RGBA transparency: ${relative}`);
  }
}
console.log("SUCCESS: 35 unit motion test integrations, including Flesh Golem, passed.");
