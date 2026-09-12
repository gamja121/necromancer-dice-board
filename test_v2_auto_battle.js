const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = __dirname;
for (const scene of ['lava-forest','snow-forest','dark-forest']) {
  const file = 'art/v2-style/battle-backgrounds/uploaded-raw/' + scene + '.jpg';
  assert(fs.existsSync(path.join(root,file)), 'Missing battlefield: ' + scene);
  assert(fs.readFileSync(path.join(root,'v2-auto-battle-practice.js'),'utf8').includes(file), 'Unconnected battlefield: ' + scene);
}
const html = fs.readFileSync(path.join(root, "v2-auto-battle-practice.html"), "utf8");
const css = fs.readFileSync(path.join(root, "v2-auto-battle-practice.css"), "utf8");
const source = fs.readFileSync(path.join(root, "v2-auto-battle-practice.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

assert(css.includes("overflow-y: scroll") && css.includes("touch-action: none") && css.includes("height: auto; max-height: 100%"), "The lineup roster must remain vertically scrollable on touch screens.");

assert(html.includes('id="allyTeam"'), "Ally team container is missing.");
assert(html.includes('id="enemyTeam"'), "Enemy team container is missing.");
assert(html.includes('id="allyActiveLegions"') && html.includes('id="enemyActiveLegions"'), "Both active-legion panels are missing.");
assert(css.includes(".active-legion-slot {") && css.includes('url("art/v2-style/ui/legion-slot-frame.png")'), "Active legions must use the cropped square frame.");
assert(css.includes(".ally-legion-panel { left: 2%") && css.includes(".enemy-legion-panel { right: 2%"), "Legion panels must sit above both formations.");
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
assert(html.indexOf('src="unit-data.js?v=50"') < html.indexOf('src="v2-auto-battle-practice.js'), "Shared unit metadata must load before the battle page.");
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
assert(source.includes("MAP_BATTLEFIELDS") && source.includes('battleQuery.get("from") === "map"') && source.includes("mapBattlefield || BATTLEFIELDS"), "Map monster battles must select the matching battlefield background.");
for (const [map, expected] of [["default", "dark-forest.jpg"], ["winter", "snow-forest.jpg"], ["hell", "lava-forest.jpg"]]) {
  const arenaContext = { location: { search: `?from=map&map=${map}` }, URLSearchParams };
  vm.createContext(arenaContext);
  const arenaSource = source.slice(source.indexOf("  const BATTLEFIELDS"), source.indexOf("  const FRAME_ROOT")) + "\nthis.selectedArena = mapBattlefield;";
  vm.runInContext(arenaSource, arenaContext);
  assert(arenaContext.selectedArena.endsWith(expected), `${map} map must select ${expected}.`);
}
assert(source.includes('enemyTeam.append(makeSummonSlot("적군"))'), "Enemy summon cell must be closest to the center.");
assert(source.includes('allyTeam.append(makeSummonSlot("아군"))'), "Ally summon cell must be closest to the center.");
assert(!source.includes("summon-mark"), "Reserved summon cells must remain visually empty.");
assert(css.includes(".summon-slot { position: relative; z-index: 10; visibility: hidden"), "Reserved summon cells must be hidden.");
assert(!source.includes('class="unit-card"') && !source.includes('class="bar gauge-bar"'), "Name/speed cards and gauges must stay hidden.");
assert(source.includes("showDamage(target, outcome.damage)"), "Damage popup must use the actual damage after brands.");
assert(css.includes("@keyframes damage-float") && css.includes(".brand-indicator.is-blessing"), "Damage animation and brand badges must both remain.");
assert(source.includes("V2BattleBrands.attack(actor, target, legionAttack)"), "Assigned brands and legions must affect attacks.");
assert(source.includes("V2BattleBrands.startRound(units, lastDiceRoll)"), "Brands must use the shared turn roll.");
assert(source.includes('roundState.textContent = `${allyAlive} VS ${enemyAlive}`'), "Counter must include actual living summons without a phantom extra unit.");
assert((source.match(/unit\("/g) || []).length >= 8, "Default battle must define eight initial units.");
assert(html.includes('id="unitRoster"') && html.includes('id="selectedLineup"') && html.includes('id="selectedEnemyLineup"') && html.includes('id="lineupStatus"'), "Pre-battle ally and enemy selection UI is missing.");
assert(source.includes("selectedAllySlugs.length >= 1") && source.includes("selectedEnemySlugs.length >= 1") && source.includes("!isLineupReady()"), "Both rosters must allow battle with one to four selections.");
assert(source.includes("selectedAllyTeam.map") && source.includes("selectedEnemyTeam.map") && source.includes("startSelectedBattle"), "Both selected lineups must create the battle.");
assert(source.includes('lineupSide === "ally" ? selectedAllySlugs : selectedEnemySlugs') && source.includes("activeSlugs.push(slug)") && source.includes("activeSlugs.splice(selectedIndex, 1)"), "Either roster must support selecting and removing units.");
assert(css.includes(".unit-roster") && css.includes("overflow-y: scroll") && css.includes("touch-action: none") && css.includes("grid-template-columns: repeat(9"), "The rotated roster must reserve touch movement for manual scrolling on both physical axes.");
assert(source.includes('unitRoster.addEventListener("touchstart"') && source.includes('unitRoster.addEventListener("touchmove"') && source.includes("Math.abs(deltaY) >= Math.abs(deltaX)"), "The rotated roster must translate either physical swipe axis into list scrolling.");
assert(html.indexOf('id="startButton"') < html.indexOf('id="unitRoster"'), "The start button must stay above the scrollable roster on mobile.");
assert(css.includes(".lineup-panel > #startButton") && css.includes("grid-template-columns: repeat(8"), "Portrait-phone lineup controls must stay visible and compact.");
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
assert(source.includes('unit("orc-warrior", "오크 전사", 12, 3, 3, 5, 4, 5, "troll")'), "Orc must use its own original artwork.");
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

assert(worker.includes('necromancer-expedition-v212'), "Service worker cache version was not advanced.");
assert(worker.includes("v2-auto-battle-practice.html"), "Auto battle page is not cached.");
assert(worker.includes("v2-auto-battle-practice.css?v=46"), "Turn dice, lineup picker and illustrated unit info styling is not cached.");
assert(worker.includes("v2-auto-battle-practice.js?v=55") && worker.includes("v2-legions.js?v=3") && worker.includes("v2-battle-brands.js?v=3"), "Turn-based status battle logic is not cached.");
assert(source.includes('serviceWorker.register("./service-worker.js", { updateViaCache: "none" })'), "The standalone battle page must request service-worker updates directly.");
assert(worker.includes('new Request(event.request, { cache: "reload" })'), "Navigation must bypass stale browser HTTP cache before updating the offline copy.");
assert(worker.includes("art/v2-style/ui/freeze-status-label.png"), "Persistent freeze label is not cached.");
assert(worker.includes("v2-damage-digits.js?v=4") && worker.includes("art/v2-style/ui/healing-digits-sheet.jpg"), "Healing digit art is not cached.");
assert(worker.includes("v2-unit-cards.js?v=12"), "Summoned-unit card mapping is not cached.");
for (const slug of ["goblin-commoner","guardian-seed","spiderling"]) assert(worker.includes(`art/v2-style/ui/unit-card-${slug}.jpg`), `Summoned ${slug} card art is not cached.`);
assert(worker.includes("art/v2-style/ui/legion-slot-frame.png"), "The cropped one-cell legion frame is not cached.");
assert(fs.existsSync(path.join(root, "art/v2-style/ui/corpse-selection-arrow.png")) && worker.includes("art/v2-style/ui/corpse-selection-arrow.png"), "The corpse-selection arrow asset must be stored and cached.");
assert(html.includes('class="legion-info-panel"') && html.includes('id="legionInfoContent"'), "Legion effects need a separate one-cell window beside unit information.");
assert(css.includes('.legion-info-panel') && css.includes('background: url("art/v2-style/ui/corpse-selection-arrow.png")'), "Separate legion window and corpse-selection arrow styling are missing.");
assert(html.includes('id="capturePanel"') && !html.includes('id="captureRollButton"'), "Soul harvest must use the central dice without a separate button.");
assert(html.match(/id="capturePanel"[\s\S]*?legion-info-window-hd\.png[\s\S]*?class="legion-info-inner"/), "Soul-harvest guidance must reuse the legion-effect information window.");
assert(css.includes("mix-blend-mode: screen") && css.includes("saturate(2.2) brightness(1.28)"), "The corpse selection arrow must screen out black pixels and remain vivid red.");
assert(source.includes("function returnToMap()") && (source.match(/returnToMap\(\);/g) || []).length >= 2, "Both successful and failed soul harvests must return to the map.");
assert(source.includes('classList.contains("is-corpse-capture")') && source.includes("rollCorpseCapture()"), "The central dice must perform soul harvest during corpse selection.");
assert(css.includes("width: min(22%, 250px)") && !css.includes(".battlefield-capture button"), "The soul-harvest guidance window must be compact and button-free.");
assert(!html.includes('id="captureChoices"') && source.includes('resultOverlay.hidden = captureReady'), "Victory must keep corpse selection on the battlefield instead of opening a separate choice list.");
assert(source.includes('corpse.element.classList.add("is-capture-candidate")') && source.includes('corpse.element.addEventListener("click", () => selectCorpse(corpse))') && source.includes('corpse.infoCard.addEventListener("click", () => selectCorpse(corpse))'), "Dead enemy bodies and cards must both select the capture target.");
assert(source.includes("captureTargetLocked") && source.includes("lockCorpseSelection()"), "The selected corpse must lock after the first capture roll.");
assert(source.includes("V2Legions.create(units)") && source.includes("V2Legions.applyOpening(legionState, units)"), "Initial-lineup legion state is not applied.");
assert(source.includes("V2Legions.captureAttempts(legionState, \"ally\")"), "Corpse legion retry is not connected to capture dice.");
assert(source.includes("function renderActiveLegions()") && source.includes('slot.className = "active-legion-slot"'), "Active legions must render as individual square slots.");
function interactiveNode() {
  const names = new Set(), listeners = {};
  return {
    names, listeners, disabled: true, tabIndex: -1, attrs: {},
    classList: {
      add: name => names.add(name), remove: name => names.delete(name),
      toggle(name, force) { if (force) names.add(name); else names.delete(name); }
    },
    setAttribute(key, value) { this.attrs[key] = value; },
    addEventListener(type, handler) { listeners[type] = handler; }
  };
}
const corpseBody = interactiveNode(), corpseCard = interactiveNode(), corpseBody2 = interactiveNode(), corpseCard2 = interactiveNode(), allyBody = interactiveNode();
const captureContext = {
  capturePanel: { hidden: true }, captureStatus: { textContent: "" }, turnDice: { hidden: true }, turnDiceButton: { disabled: true }, turnDiceImage: {}, DICE_ROLL_FRAMES: ["roll.png"],
  battlefield: { classList: interactiveNode().classList }, selectedCorpse: null, captureTargetLocked: false, captureAttemptsLeft: 0,
  legionState: {}, Math: { floor: Math.floor, random: () => .99 },
  V2Legions: { active: () => false, captureAttempts: () => 1 },
  units: [
    { name: "적 시체", team: "enemy", alive: false, isSummon: false, element: corpseBody, infoCard: corpseCard },
    { name: "다른 적 시체", team: "enemy", alive: false, isSummon: false, element: corpseBody2, infoCard: corpseCard2 },
    { name: "아군", team: "ally", alive: true, isSummon: false, element: allyBody }
  ]
};
vm.createContext(captureContext);
vm.runInContext(source.slice(source.indexOf("  function setupCorpseCapture("), source.indexOf("  function wait(")), captureContext);
assert(vm.runInContext("setupCorpseCapture(true)", captureContext) === true, "Victory must enter direct battlefield corpse selection.");
assert(corpseBody.names.has("is-capture-candidate") && corpseCard.names.has("is-capture-candidate") && !corpseCard.disabled, "Both corpse body and card must become selectable.");
assert(!captureContext.turnDice.hidden && !captureContext.turnDiceButton.disabled && corpseBody.names.has("is-capture-selected") && corpseCard.names.has("is-capture-selected"), "The first corpse and central soul-harvest dice must be ready by default.");
corpseCard2.listeners.click();
assert(!corpseBody.names.has("is-capture-selected") && !corpseCard.names.has("is-capture-selected") && corpseBody2.names.has("is-capture-selected") && corpseCard2.names.has("is-capture-selected"), "Clicking another corpse card must move the selection and arrow to that card.");
vm.runInContext("lockCorpseSelection()", captureContext);
assert(captureContext.captureTargetLocked && corpseCard.disabled && corpseCard2.disabled, "Starting soul harvest must lock every corpse target.");
assert(source.includes("async function rollCorpseCapture()") && source.includes("DICE_ROLL_FRAMES[diceFrameIndex]") && source.includes("DICE_RESULT_FRAMES[roll - 1]"), "Soul harvest must visibly roll the real dice before resolving.");
assert(source.includes("async function animateSoulHarvest(corpse)") && source.includes("intakeTop") && source.includes("scale(2.35)") && !source.slice(source.indexOf("  async function animateSoulHarvest("), source.indexOf("  async function rollCorpseCapture(")).includes("scale(.04)"), "A successful soul harvest must expand through the lower center into the player.");
assert(source.includes('classList.toggle("is-frozen", unitState.alive &&') && source.includes('classList.toggle("is-poisoned", unitState.alive &&'), "Dead bodies must lose freeze and poison tint classes.");
assert(source.includes("function showHealing(unitState, amount)") && source.includes("showHealing(actor, legionHealing)"), "Undead healing must have a visible combat indicator.");
assert(source.includes("V2DamageDigits.renderHealing(number, amount)"), "Healing popup must use the uploaded green digits.");
assert(source.includes('data-status="freeze"') && source.includes('data-status="poison"'), "Persistent freeze and poison labels are missing.");
assert(source.includes('classList.toggle("is-poisoned", unitState.alive && Boolean(unitState.poison))'), "Living poisoned units must keep a visual state until poison resolves.");
assert(css.includes(".unit.is-poisoned .sprite-wrap > img") && css.includes("#67e548"), "Poisoned units must be visibly tinted green.");
assert(source.includes('unitState.image = element.querySelector(".sprite-wrap > img")'), "Unit sizing and summon circles must anchor to the fighter sprite, not a status-label image.");
assert(source.includes("V2BattleBrands.beforeAction(actor, turnNumber)"), "Poison must resolve immediately before the next-turn attack.");
assert(source.includes("function legionDetails(unitState)") && source.includes("현재 이 유닛에 적용") && source.includes("활성 군단"), "Unit info must summarize direct and team legion effects.");
assert(source.includes("baseMaxHp: data.maxHp") && source.includes("baseAttack: data.attack") && source.includes("baseSpeed: data.speed"), "Pre-legion stats must be retained for comparisons.");
assert(css.includes(".healing-number {") && css.includes("#7cff83"), "Healing feedback must be visibly distinct from damage.");
assert(source.includes('insect: "벌래"'), "The unit info legion label must use 벌래 instead of 곤충.");
assert(source.includes('V2Legions.suppressed(legionState, team)') && source.includes("상대 군단 효과 억제 중"), "Element suppression must be visible in the battle UI and unit info.");
assert(worker.includes("art/v2-style/ui/unit-info-window.png"), "Cropped unit info frame is not cached.");
// Exercise the real information-window functions without a rendering engine.
const infoContext = { awaitingRoll: true, diceRolling: false, lastDiceRoll: null, legionState:{}, V2Legions:{active:()=>false,suppressed:()=>false,RULES:{}}, V2BattleBrands: require("./v2-battle-brands.js"), document: { getElementById: () => ({ focus() {} }) } };
for (const name of ["unitInfoName", "unitInfoImage", "unitInfoPortrait", "unitInfoGrade", "unitInfoLegion", "unitInfoHp", "unitInfoAttack", "unitInfoSpeed", "unitInfoBrands", "legionInfoContent", "unitInfoOverlay"]) infoContext[name] = { textContent: "", hidden: true, attrs: {}, setAttribute(key, value) { this.attrs[key] = value; } };
vm.createContext(infoContext);
infoContext.V2SummonRules = require("./v2-summon-rules.js");
infoContext.UNIT_TYPES = require("./unit-data.js").UNIT_TYPES;
vm.runInContext(source.slice(source.indexOf("  const UNIT_TYPE_KEYS"), source.indexOf("  const TEAM_DATA")), infoContext);
vm.runInContext(source.slice(source.indexOf("  function unit("), source.indexOf("  function frame(")), infoContext);
for (const [slug, grade, legions] of [["death-knight", "hero", ["demon"]], ["skeleton-spear", "normal", ["skeleton"]], ["ghoul", "normal", ["corpse"]], ["ancient-treant", "advanced", ["plant", "element"]], ["goblin-rider", "normal", ["beast"]], ["orc-warrior", "advanced", ["beast"]], ["boulder-ogre", "advanced", ["beast"]], ["minotaur", "advanced", ["beast"]], ["abyss-claw-hunter", "advanced", ["insect", "plague"]]]) {
  const data = vm.runInContext(`unit(${JSON.stringify(slug)}, "test", 12, 3, 2, 5, 4, 6)`, infoContext);
  assert(data.grade === grade && JSON.stringify(data.legions) === JSON.stringify(legions), `Incorrect registry mapping for ${slug}`);
  assert(data.maxHp === 12 && data.attack === 3 && data.speed === 2, "Importing metadata must not change battle stats.");
}
vm.runInContext(source.slice(source.indexOf("  function legionDetails("), source.indexOf("  async function performAttack(")), infoContext);
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
infoContext.V2Legions = {
  RULES: require("./v2-legions.js").RULES,
  active: (state, team, key) => team === "ally" ? ["plant", "insect"].includes(key) : key === "demon",
  suppressed: () => false
};
infoContext.legionState = { teams: { ally: { counts: { plant: 2, insect: 2 } }, enemy: { counts: { demon: 3 } } } };
infoContext.units = [];
infoContext.selected = { team: "ally", alive: true, hp: 7, maxHp: 9, baseMaxHp: 8, attack: 3, baseAttack: 2, speed: 3, baseSpeed: 5, grade: "normal", legions: ["plant"], portrait: "art/v2-style/processed/192/ancient-treant.png", portraitBounds: [0, 0, 192, 192], brand: "guard" };
vm.runInContext("openUnitInfo(selected)", infoContext);
assert(infoContext.unitInfoHp.textContent === "7 / 9 · 최대 8 → 9", "Maximum HP comparison is incorrect.");
assert(infoContext.unitInfoAttack.textContent === "2 → 3", "Attack comparison is incorrect.");
assert(infoContext.unitInfoSpeed.textContent === "5 → 3", "Speed comparison is incorrect.");
assert(infoContext.legionInfoContent.innerHTML.includes("식물 · 최대 체력 8 → 9") && infoContext.legionInfoContent.innerHTML.includes("벌래 · 공격력 2 → 3") && infoContext.legionInfoContent.innerHTML.includes("상대 악마 · 속도 5 → 3"), "Applied stat changes must be immediately visible in the separate legion window.");
assert(infoContext.legionInfoContent.innerHTML.includes("식물 2/2") && infoContext.legionInfoContent.innerHTML.includes("벌래 2/2"), "Team legion thresholds must be visible in the separate legion window.");
assert(infoContext.legionInfoContent.innerHTML.includes("활성 군단 · 간략 효과") && infoContext.legionInfoContent.innerHTML.includes("아군 전체 최대 체력 +1") && infoContext.legionInfoContent.innerHTML.includes("아군 전체 공격력 +1"), "Active legion buffs need concise explanations.");
assert(!infoContext.unitInfoBrands.innerHTML.includes("활성 군단 · 간략 효과"), "Legion effects must no longer be mixed into the brand information window.");
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
assert(vm.runInContext("ROSTER.length", infoContext) === 44, "Every attack-capable unit must appear in the ally picker.");
assert(vm.runInContext("new Set(ROSTER.map(unit => unit.slug)).size", infoContext) === 44, "The ally picker must not contain duplicate units.");
assert(vm.runInContext("ROSTER_BY_SLUG.get('abyss-claw-hunter').name", infoContext) === "심연 집게사냥꾼", "The new monster must be selectable by its assigned name.");
assert(!vm.runInContext("ROSTER.some(unit => unit.slug === 'guardian-seed')", infoContext), "The non-attacking Guardian Seed must stay out of the battle picker.");
const selectableRoster = vm.runInContext("ROSTER.map(unit => ({ slug: unit.slug, portrait: unit.portrait, frames: unit.frames, frameNumbers: unit.frameNumbers }))", infoContext);
const runtimeRoster = new Set(["goblin-soldier", "ice-princess", "bone-golem", "abyss-harpy", "hydra", "bone-hound", "scorpion-knight", "hell-mantis"]);
for (const entry of selectableRoster) {
  assert(fs.existsSync(path.join(root, entry.portrait)), `Picker portrait is missing: ${entry.slug}`);
  if (runtimeRoster.has(entry.slug)) continue;
  for (const motion of ["attack", "hit", "death"]) for (let index = 0; index < entry.frames[motion]; index += 1) {
    const frameNumber = entry.frameNumbers?.[motion]?.[index] || index + 1;
    assert(fs.existsSync(path.join(root, `art/v2-style/animation-test-frames/${entry.slug}/${motion}-${String(frameNumber).padStart(2, "0")}.png`)), `Picker motion is missing: ${entry.slug}/${motion}/${frameNumber}`);
  }
}
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
