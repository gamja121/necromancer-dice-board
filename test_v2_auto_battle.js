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
assert(basicPanel.includes('id="unitInfoTeam"') && basicPanel.includes('id="unitInfoState"'), "Top-right panel must contain team and state.");
assert(!basicPanel.includes('id="unitInfoHp"'), "Stats must not be placed in the basic panel.");
for (const id of ["unitInfoHp", "unitInfoAttack", "unitInfoSpeed"]) assert(statsPanel.includes(`id="${id}"`), `${id} must be in the lower-right stats panel.`);
assert(!html.includes('id="unitInfoRoll"') && !source.includes("unitInfoRoll"), "Common roll must not be in the unit info window.");
assert(html.includes('id="unitInfoBrands"') && html.includes("낙인 미지정"), "Brand area must remain explicitly unassigned.");
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
assert(source.includes("const damage = Math.min(actor.attack, target.hp)"), "Displayed damage must match actual HP loss.");
assert(source.includes("showDamage(target, damage)"), "Damage number trigger is missing.");
assert(source.includes('querySelector(".sprite-wrap").append(number)'), "Damage number must follow the active unit position.");
assert(css.includes("@keyframes damage-float"), "Floating damage animation is missing.");
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
for (const slug of ["death-knight", "skeleton-spear", "ghoul", "ancient-treant", "goblin-rider", "goblin-soldier", "ogre", "minotaur"]) {
  assert(fs.existsSync(path.join(root, `art/v2-style/processed/192/${slug}.png`)), `Missing cutout ${slug}`);
  assert(worker.includes(`art/v2-style/processed/192/${slug}.png`), `Missing cached cutout ${slug}`);
}
assert(source.includes('"goblin-soldier"') && source.includes('"ogre"'), "Fallback original artwork mappings are missing.");
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

assert(worker.includes('necromancer-expedition-v130'), "Service worker cache version was not advanced.");
assert(worker.includes("v2-auto-battle-practice.html"), "Auto battle page is not cached.");
assert(worker.includes("v2-auto-battle-practice.css?v=12"), "Turn dice and illustrated unit info styling is not cached.");
assert(worker.includes("v2-auto-battle-practice.js?v=12"), "Turn-based auto battle logic is not cached.");
assert(worker.includes("art/v2-style/ui/unit-info-window.png"), "Cropped unit info frame is not cached.");
// Exercise the real information-window functions without a rendering engine.
const infoContext = { awaitingRoll: true, diceRolling: false, document: { getElementById: () => ({ focus() {} }) } };
for (const name of ["unitInfoName", "unitInfoImage", "unitInfoPortrait", "unitInfoTeam", "unitInfoState", "unitInfoHp", "unitInfoAttack", "unitInfoSpeed", "unitInfoOverlay"]) infoContext[name] = { textContent: "", hidden: true, attrs: {}, setAttribute(key, value) { this.attrs[key] = value; } };
vm.createContext(infoContext);
vm.runInContext(source.slice(source.indexOf("  function openUnitInfo("), source.indexOf("  async function performAttack(")), infoContext);
for (const [team, alive, hp, name, attack, speed] of [["ally", true, 7, "구울", 2, 3], ["enemy", false, -1, "오우거", 3, 2], ["ally", true, 9, "구울", 2, 3]]) {
  infoContext.selected = { team, alive, hp, name, attack, speed, maxHp: 14, portrait: "art/v2-style/processed/192/ghoul.png", portraitBounds: [31, 12, 129, 172] };
  vm.runInContext("openUnitInfo(selected)", infoContext);
  assert(infoContext.unitInfoName.textContent === name, "Switching units must refresh the title.");
  assert(infoContext.unitInfoTeam.textContent === (team === "ally" ? "아군" : "적군"), "Team label must refresh.");
  assert(infoContext.unitInfoState.textContent === (alive ? "생존" : "사망"), "Life state must refresh.");
  assert(infoContext.unitInfoHp.textContent === `${Math.max(0, hp)} / 14`, "Current and max HP must refresh.");
  assert(infoContext.unitInfoAttack.textContent === String(attack) && infoContext.unitInfoSpeed.textContent === String(speed), "Combat stats must refresh.");
  assert(infoContext.unitInfoImage.attrs.href === infoContext.selected.portrait, "Dead units must retain original cutouts.");
  const [left, top, width, height] = infoContext.unitInfoPortrait.attrs.viewBox.split(" ").map(Number);
  assert(left < 31 && top < 12 && left + width > 160 && top + height > 184, "Visible artwork must fit with margin on all sides.");
  assert(infoContext.unitInfoPortrait.attrs["aria-label"] === name, "Portrait accessibility label must follow the selected unit.");
  vm.runInContext("closeUnitInfo()", infoContext);
  assert(infoContext.unitInfoOverlay.hidden, "Close must hide the panel.");
}
for (const [awaitingRoll, diceRolling] of [[false, false], [true, true]]) {
  Object.assign(infoContext, { awaitingRoll, diceRolling });
  vm.runInContext("openUnitInfo(selected)", infoContext);
  assert(infoContext.unitInfoOverlay.hidden, "Info must not open while fighting or rolling.");
}
console.log("SUCCESS: turn-roll battle, separated info panels, and unit-info runtime checks passed.");
