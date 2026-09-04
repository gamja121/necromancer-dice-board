const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = __dirname;
const html = fs.readFileSync(path.join(root, "v2-auto-battle-practice.html"), "utf8");
const css = fs.readFileSync(path.join(root, "v2-auto-battle-practice.css"), "utf8");
const source = fs.readFileSync(path.join(root, "v2-auto-battle-practice.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

assert(html.includes('id="allyTeam"'), "Ally team container is missing.");
assert(html.includes('id="enemyTeam"'), "Enemy team container is missing.");
assert(html.includes('id="roundState">4+1 VS 4+1'), "Initial five-slot formation counter is missing.");
assert(html.includes('id="turnDice"'), "Between-turn dice panel is missing.");
assert(html.includes('id="turnDiceButton"'), "Between-turn dice control is missing.");
assert(html.includes('id="unitInfoOverlay"'), "Unit information window is missing.");
assert(html.includes('id="unitInfoImage"'), "Unit information portrait is missing.");
assert(html.includes('class="unit-info-frame-art"') && html.includes("art/v2-style/ui/unit-info-window.png"), "Cropped unit information window art is missing.");
assert(html.includes('id="unitInfoHp"') && html.includes('id="unitInfoAttack"') && html.includes('id="unitInfoSpeed"'), "Basic unit stats are missing.");
const basicPanel = html.match(/<section class="unit-info-basic"[\s\S]*?<\/section>/)?.[0] || "";
const statsPanel = html.match(/<section class="unit-info-stats"[\s\S]*?<\/section>/)?.[0] || "";
assert(basicPanel.includes('id="unitInfoGrade"') && basicPanel.includes('id="unitInfoLegion"'), "Top-right panel must contain grade and legion only.");
assert(!html.includes('id="unitInfoTeam"') && !html.includes('id="unitInfoState"'), "Team and life-state rows must be removed.");
const dicePanel = html.match(/<section id="turnDice"[\s\S]*?<\/section>/)?.[0] || "";
assert(!dicePanel.includes("turn-dice-panel") && !dicePanel.includes("<span") && !dicePanel.includes("<strong") && !dicePanel.includes("<small"), "Only the dice button should remain in the center.");
assert(!html.includes('class="versus"') && !source.includes("diceResultLabel") && !source.includes("diceTurnLabel"), "Center labels and obsolete references must be removed.");
assert(html.indexOf('src="unit-data.js?v=45"') < html.indexOf('src="v2-auto-battle-practice.js'), "Shared unit metadata must load before the battle page.");
assert(!basicPanel.includes('id="unitInfoHp"'), "Stats must not be placed in the basic panel.");
for (const id of ["unitInfoHp", "unitInfoAttack", "unitInfoSpeed"]) assert(statsPanel.includes(`id="${id}"`), `${id} must be in the lower-right stats panel.`);
assert(!html.includes('id="unitInfoRoll"') && !source.includes("unitInfoRoll"), "Common roll must not be in the unit info window.");
assert(html.includes('id="unitInfoBrands"') && html.includes("예시 낙인"), "Brand area must show the assigned example.");
assert(!html.includes("기본 전투 정보") && !source.includes("unitInfoDescription"), "Old combat description must be removed.");
assert(css.includes(".unit-info-fields") && css.includes("grid-template-rows: 42% minmax(0, 1fr)"), "Right-hand fields must respect the two frame panels.");
assert(html.includes("v2-landscape.js?v=1"), "Battle landscape helper is missing.");
assert(css.includes("rotate(90deg)"), "Battle must rotate itself in portrait mode.");
assert(css.includes("grid-template-columns: repeat(5, 1fr)"), "Each team must have four unit cells and one summon cell.");
assert(css.includes(".enemy-team .unit img { transform: scaleX(-1)"), "Enemy units must face the allied units.");
assert(css.includes(".unit.is-targeted"), "The hit unit must step forward and enlarge.");
assert(css.includes("scale(1.43)"), "The attacking unit must enlarge during its action.");
assert(css.includes("--depth-scale: 1.14"), "Outer units must appear closer to the viewer.");
assert(css.includes("--depth-scale: .94"), "Inner units must appear farther from the viewer.");
assert(css.includes("--unit-layer: 18"), "Outer units must overlap above inner units.");
assert(css.includes(".team { position: absolute; z-index: auto"), "Teams must not trap active units in separate stacking layers.");
assert(css.includes(".unit.is-attacking { z-index: 42"), "Attacker must render above every resting unit.");
assert(css.includes(".unit.is-targeted { z-index: 41"), "Hit target must render above every resting unit.");
assert(css.includes(".turn-dice { position: absolute; z-index: 55"), "Turn dice must appear in the center above the battlefield.");
assert(css.includes(".turn-dice { position: absolute; z-index: 55; inset: 0; display: grid; place-items: center; pointer-events: none"), "Turn dice layer must allow unit inspection around its panel.");
assert(css.includes(".battlefield.is-between-turns .unit { cursor: pointer"), "Units must be visibly inspectable between turns.");
assert(css.includes(".unit-info-panel"), "Unit information panel styling is missing.");
assert(css.includes(".unit-info-frame-art") && css.includes("inset: 0; width: 100%; height: 100%"), "Unit information window must fill its panel without green overflow.");
assert(css.includes("--action-shift-x: 192%"), "Far allied slots must move to the fixed action position.");
assert(css.includes("--action-shift-x: -192%"), "Far enemy slots must move to the fixed action position.");
assert(css.includes("translate(var(--action-shift-x), 14%) scale(1.43)"), "Attackers must use the fixed action position.");
assert(css.includes("translate(var(--action-shift-x), 11%) scale(1.32)"), "Hit targets must use the fixed action position.");
assert(css.includes("hit-red-flash"), "Hit feedback must use a red flash.");
assert(!css.includes("#ffdfae"), "White hit outline must be removed.");
assert(source.includes("TEAM_DATA.ally.map"), "Four ally states are not created.");
assert(source.includes("TEAM_DATA.enemy.map"), "Four enemy states are not created.");
assert(source.includes('enemyTeam.append(makeSummonSlot("적군"))'), "Enemy summon cell must be closest to the center.");
assert(source.includes('allyTeam.append(makeSummonSlot("아군"))'), "Ally summon cell must be closest to the center.");
assert(!source.includes("summon-mark"), "Reserved summon cells must remain visually empty.");
assert(css.includes(".summon-slot { position: relative; z-index: 10; visibility: hidden"), "Reserved summon cells must be hidden.");
assert(!source.includes('class="unit-card"') && !source.includes('class="bar gauge-bar"'), "Name/speed cards and gauges must stay hidden.");
assert(source.includes("showDamage(target, outcome.damage)"), "Damage popup must use the actual damage after brands.");
assert(css.includes("@keyframes damage-float") && css.includes(".brand-indicator.is-blessing"), "Damage animation and brand badges must both remain.");
assert(source.includes("V2BattleBrands.attack(actor, target)"), "Assigned brands must affect attacks.");
assert(source.includes("V2BattleBrands.startRound(units, lastDiceRoll)"), "Brands must use the shared turn roll.");
assert(source.includes('roundState.textContent = `${allyAlive}+1 VS ${enemyAlive}+1`'), "Five-slot formation counter is missing.");
assert((source.match(/unit\("/g) || []).length === 8, "Battle must define exactly eight units.");
assert(source.includes("turnQueue = units.filter"), "Per-turn action queue is missing.");
assert(source.includes("right.unitState.speed - left.unitState.speed"), "Units must act in descending speed order.");
assert(source.includes("let actor = turnQueue.shift()"), "Each queued unit must receive one action per turn.");
assert(source.includes("unitState.gauge = unitState.alive ? 100 : 0"), "Turn-ready indicator is missing.");
assert(source.includes("beginTurnIntermission(true)"), "The first turn must wait for a dice roll.");
assert(source.includes("else beginTurnIntermission(false)"), "Completed turns must stop at the dice intermission.");
assert(source.includes("if (running && !paused && !actionBusy && !awaitingRoll)"), "Battle actions must pause while waiting for the turn roll.");
assert(source.includes("lastDiceRoll = Math.floor(Math.random() * 6) + 1"), "Turn dice must produce a random value from 1 to 6.");
assert(source.includes("DICE_RESULT_FRAMES[lastDiceRoll - 1]"), "Turn dice result art is missing.");
assert(source.includes("startTurn();") && source.includes("async function rollTurnDice()"), "The next turn must begin only after the roll finishes.");
assert(source.includes("if (!awaitingRoll || diceRolling) return"), "Unit information must only open during the between-turn pause.");
assert(source.includes("function openUnitInfo(unitState)"), "Unit information interaction is missing.");
assert(source.includes("unitInfoHp.textContent") && source.includes("unitInfoAttack.textContent") && source.includes("unitInfoSpeed.textContent"), "Unit information values are not populated.");
assert(source.includes("portrait: `art/v2-style/processed/192/${portraitSlug}.png`"), "Existing transparent cutouts must be used.");
assert(source.includes('unitInfoImage.setAttribute("href", unitState.portrait)'), "Unit information must use original cutouts instead of animation frames.");
assert(html.includes('preserveAspectRatio="xMidYMid meet"'), "Portraits must be centered, undistorted, and fully contained.");
for (const slug of ["demon-death-knight", "skeleton-spear", "ghoul", "ancient-treant", "goblin-rider", "troll", "ogre", "minotaur"]) {
  assert(fs.existsSync(path.join(root, `art/v2-style/processed/192/${slug}.png`)), `Missing cutout ${slug}`);
  assert(worker.includes(`art/v2-style/processed/192/${slug}.png`), `Missing cached cutout ${slug}`);
}
assert(source.includes('"troll"') && source.includes('"ogre"') && !source.includes('"goblin-soldier"'), "Orc must use its own original artwork.");
assert(source.includes("Math.random() * targets.length"), "Automatic target selection is missing.");
assert(source.includes('playMotion(actor, "attack"'), "Attack motion is missing.");
assert(source.includes('playMotion(target, "hit"'), "Hit motion is missing.");
assert(source.includes('playMotion(target, "death"'), "Death motion is missing.");

for (const slug of ["death-knight", "skeleton-spear", "ghoul", "ancient-treant", "goblin-rider", "orc-warrior", "boulder-ogre", "minotaur"]) {
  assert(source.includes(`unit("${slug}"`), `Unit is missing: ${slug}`);
  for (const motion of ["attack", "hit", "death"]) {
    assert(fs.existsSync(path.join(root, `art/v2-style/animation-test-frames/${slug}/${motion}-01.png`)), `Motion frame is missing: ${slug}/${motion}`);
  }
}

assert(worker.includes('necromancer-expedition-v144'), "Service worker cache version was not advanced.");
assert(worker.includes("v2-auto-battle-practice.html"), "Auto battle page is not cached.");
assert(worker.includes("v2-auto-battle-practice.css?v=18"), "Turn dice and illustrated unit info styling is not cached.");
assert(worker.includes("v2-auto-battle-practice.js?v=19") && worker.includes("v2-battle-brands.js?v=1"), "Turn-based auto battle and brands are not cached.");
assert(worker.includes("art/v2-style/ui/unit-info-window.png"), "Cropped unit info frame is not cached.");
// Exercise the real information-window functions without a rendering engine.
const infoContext = { awaitingRoll: true, diceRolling: false, lastDiceRoll: null, V2BattleBrands: require("./v2-battle-brands.js"), document: { getElementById: () => ({ focus() {} }) } };
for (const name of ["unitInfoName", "unitInfoImage", "unitInfoPortrait", "unitInfoGrade", "unitInfoLegion", "unitInfoHp", "unitInfoAttack", "unitInfoSpeed", "unitInfoBrands", "unitInfoOverlay"]) infoContext[name] = { textContent: "", hidden: true, attrs: {}, setAttribute(key, value) { this.attrs[key] = value; } };
vm.createContext(infoContext);
infoContext.UNIT_TYPES = require("./unit-data.js").UNIT_TYPES;
vm.runInContext(source.slice(source.indexOf("  const UNIT_TYPE_KEYS"), source.indexOf("  const TEAM_DATA")), infoContext);
vm.runInContext(source.slice(source.indexOf("  function unit("), source.indexOf("  function frame(")), infoContext);
for (const [slug, grade, legions] of [["death-knight", "hero", ["demon"]], ["skeleton-spear", "normal", ["skeleton"]], ["ghoul", "normal", ["corpse"]], ["ancient-treant", "advanced", ["plant", "element"]], ["goblin-rider", "normal", ["beast"]], ["orc-warrior", "advanced", ["beast"]], ["boulder-ogre", "advanced", ["beast"]], ["minotaur", "advanced", ["beast"]]]) {
  const data = vm.runInContext(`unit(${JSON.stringify(slug)}, "test", 12, 3, 2, 5, 4, 6)`, infoContext);
  assert(data.grade === grade && JSON.stringify(data.legions) === JSON.stringify(legions), `Incorrect registry mapping for ${slug}`);
  assert(data.maxHp === 12 && data.attack === 3 && data.speed === 2, "Importing metadata must not change battle stats.");
}
vm.runInContext(source.slice(source.indexOf("  function openUnitInfo("), source.indexOf("  async function performAttack(")), infoContext);
for (const [team, alive, hp, name, attack, speed] of [["ally", true, 7, "구울", 2, 3], ["enemy", false, -1, "오우거", 3, 2], ["ally", true, 9, "구울", 2, 3]]) {
  infoContext.selected = { team, alive, hp, name, attack, speed, grade: alive ? "normal" : "advanced", legions: alive ? ["corpse"] : ["plant", "element"], maxHp: 14, portrait: "art/v2-style/processed/192/ghoul.png", portraitBounds: [31, 12, 129, 172] };
  vm.runInContext("openUnitInfo(selected)", infoContext);
  assert(infoContext.unitInfoName.textContent === name, "Switching units must refresh the title.");
  assert(infoContext.unitInfoGrade.textContent === (alive ? "일반" : "희귀"), "Grade label must refresh and advanced must display as rare.");
  assert(infoContext.unitInfoLegion.textContent === (alive ? "시체" : "식물 · 원소"), "Single and dual legions must refresh.");
  assert(infoContext.unitInfoHp.textContent === `${Math.max(0, hp)} / 14`, "Current and max HP must refresh.");
  assert(infoContext.unitInfoAttack.textContent === String(attack) && infoContext.unitInfoSpeed.textContent === String(speed), "Combat stats must refresh.");
  assert(infoContext.unitInfoImage.attrs.href === infoContext.selected.portrait, "Dead units must retain original cutouts.");
  const [left, top, width, height] = infoContext.unitInfoPortrait.attrs.viewBox.split(" ").map(Number);
  assert(left < 31 && top < 12 && left + width > 160 && top + height > 184, "Visible artwork must fit with margin on all sides.");
  assert(infoContext.unitInfoPortrait.attrs["aria-label"] === name, "Portrait accessibility label must follow the selected unit.");
  vm.runInContext("closeUnitInfo()", infoContext);
  assert(infoContext.unitInfoOverlay.hidden, "Close must hide the panel.");
}
// Verify the actual team entry: animation slug and portrait slug intentionally differ.
const expectedBrandViews = {
  critical: "216 48 228 228", vampire: "526 48 234 228", guard: "841 48 228 228",
  poison: "216 310 228 228", summon: "526 310 234 228", healing: "843 310 228 228"
};
assert(fs.existsSync(path.join(root, "art/v2-style/ui/brand-icons-sheet.jpg")), "Uploaded brand icon sheet must be stored in the project.");
assert(worker.includes("./art/v2-style/ui/brand-icons-sheet.jpg"), "Brand icons must work offline.");
for (const brand of Object.keys(infoContext.V2BattleBrands.definitions)) {
  Object.assign(infoContext.selected, { brand, brandMode: "blessing" });
  vm.runInContext("openUnitInfo(selected)", infoContext);
  const definition = infoContext.V2BattleBrands.definitions[brand];
  assert(infoContext.unitInfoBrands.innerHTML.includes(definition.name) && infoContext.unitInfoBrands.innerHTML.includes(definition.blessing) && infoContext.unitInfoBrands.innerHTML.includes(definition.penalty), "Brand description must refresh for every selection.");
  assert(infoContext.unitInfoBrands.innerHTML.includes(`viewBox="${expectedBrandViews[brand]}"`), `Incorrect icon mapping: ${brand}`);
  assert(infoContext.unitInfoBrands.innerHTML.includes('href="art/v2-style/ui/brand-icons-sheet.jpg"'), "Use uploaded artwork, not placeholders.");
  assert(infoContext.unitInfoBrands.innerHTML.indexOf('class="brand-icon"') < infoContext.unitInfoBrands.innerHTML.indexOf("<h4>"), "Icon must precede its description heading.");
}
vm.runInContext(source.slice(source.indexOf("  const TEAM_DATA"), source.indexOf("  const battlefield")), infoContext);
const deathKnight = vm.runInContext("TEAM_DATA.ally[0]", infoContext);
assert(deathKnight.slug === "death-knight" && deathKnight.name === "데스 나이트", "Death Knight identity must remain tied to its actual animation.");
assert(deathKnight.portrait === "art/v2-style/processed/192/demon-death-knight.png", "Death Knight must not use skeleton cavalry artwork.");
assert(JSON.stringify(deathKnight.portraitBounds) === "[36,18,135,164]", "Portrait fit must use the demon artwork bounds.");
assert(deathKnight.maxHp === 12 && deathKnight.attack === 3 && deathKnight.speed === 4, "Identity correction must preserve battle stats.");
assert(JSON.stringify(deathKnight.frames) === '{"attack":5,"hit":4,"death":6}', "Identity correction must preserve battle motions.");
infoContext.selected = { ...deathKnight, hp: 12, alive: true, team: "ally" };
vm.runInContext("openUnitInfo(selected)", infoContext);
assert(infoContext.unitInfoGrade.textContent === "영웅", "Hero grade label must remain supported.");
assert(infoContext.unitInfoLegion.textContent === "악마", "Death Knight must display demon legion.");
assert(infoContext.unitInfoImage.attrs.href === deathKnight.portrait, "Info window must use the actual Death Knight portrait.");
assert(infoContext.UNIT_TYPES.knight.grade === "advanced" && infoContext.UNIT_TYPES.knight.legion === "skeleton", "Skeleton cavalry registry entry must remain untouched.");
vm.runInContext("closeUnitInfo()", infoContext);
const orc = vm.runInContext("TEAM_DATA.enemy[1]", infoContext);
assert(orc.portrait === "art/v2-style/processed/192/troll.png", "Orc info must not use the goblin soldier.");
assert(JSON.stringify(orc.portraitBounds) === "[36,30,136,154]", "Orc portrait must fit its own artwork.");
assert(orc.maxHp === 12 && orc.attack === 3 && orc.speed === 3, "Portrait fix must not change combat stats.");
assert(orc.slug === "orc-warrior" && JSON.stringify(orc.frames) === '{"attack":5,"hit":4,"death":5}', "Portrait fix must preserve Orc animations.");
infoContext.selected = { ...orc, hp: 12, alive: true, team: "enemy", brand: "healing" };
vm.runInContext("openUnitInfo(selected)", infoContext);
assert(infoContext.unitInfoImage.attrs.href === orc.portrait && infoContext.unitInfoName.textContent === "오크 전사", "Actual Orc info window must display the corrected portrait.");
assert(infoContext.unitInfoGrade.textContent === "희귀" && infoContext.unitInfoLegion.textContent === "야수", "Orc registry metadata must remain unchanged.");
vm.runInContext("closeUnitInfo()", infoContext);
for (const [awaitingRoll, diceRolling] of [[false, false], [true, true]]) {
  Object.assign(infoContext, { awaitingRoll, diceRolling });
  vm.runInContext("openUnitInfo(selected)", infoContext);
  assert(infoContext.unitInfoOverlay.hidden, "Info must not open while fighting or rolling.");
}
// Execute the actual intermission/roller without any of the deleted label nodes.
let turnStarts = 0;
const brandRolls = [];
for (const name of ["turnDice", "turnDiceButton", "turnDiceImage", "pauseButton", "battlefield", "message"]) {
  infoContext[name] = { hidden: true, disabled: false, attrs: {}, classList: { add() {}, remove() {} }, setAttribute(key, value) { this.attrs[key] = value; } };
}
Object.assign(infoContext, {
  running: true, awaitingRoll: false, diceRolling: false, paused: false, actionBusy: false,
  turnNumber: 1, battleToken: 1, diceFrameIndex: 0, speedMultiplier: 1, lastDiceRoll: null,
  aliveUnits: () => [{}], wait: async () => {}, finishBattle: () => { throw new Error("Unexpected finish"); },
  showRolledBrands: roll => { assert(turnStarts === 0, "Brand display must update before the next turn begins."); brandRolls.push(roll); },
  startTurn: () => { turnStarts += 1; infoContext.awaitingRoll = false; infoContext.turnDice.hidden = true; }
});
vm.runInContext(source.slice(source.indexOf("  function beginTurnIntermission("), source.indexOf("  function openUnitInfo(")), infoContext);
vm.runInContext("beginTurnIntermission(false)", infoContext);
assert(infoContext.awaitingRoll && !infoContext.turnDice.hidden && turnStarts === 0, "End of turn must wait for a dice click.");
vm.runInContext("rollTurnDice()", infoContext).then(() => {
  assert(turnStarts === 1 && infoContext.turnDice.hidden, "Rolling must start the next turn once and hide the dice.");
  assert(infoContext.lastDiceRoll >= 1 && infoContext.lastDiceRoll <= 6, "Roll must still yield 1–6 without label nodes.");
  assert(brandRolls.length === 2 && brandRolls[0] === null && brandRolls[1] === infoContext.lastDiceRoll, "Rolling must clear old badges then show the actual result.");
  console.log("SUCCESS: dice-only turn flow, registry metadata, transparent portraits, and unit info passed.");
}).catch((error) => { console.error(error); process.exitCode = 1; });
