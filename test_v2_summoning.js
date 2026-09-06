const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const rules = require('./v2-summon-rules');
const source = fs.readFileSync(__dirname + '/v2-auto-battle-practice.js', 'utf8');
const types = require('./unit-data').UNIT_TYPES;
const brands = require('./v2-battle-brands');
for (const slug of Object.keys(rules.choices)) assert.equal(brands.samples[slug], 'summon');
assert.equal(types.spear.label, '해골 병사');
assert.equal(types.skeletonSummoner.label, '해골 소환사');
assert.equal(types.crystalDevourer.label, '식인식물');
const fighter = (slug, slot = 0) => ({ slug, slot, team: 'ally', alive: true, hp: 6 });
for (const [slug, expected] of [['spider-knight','spiderling'], ['goblin-chief','goblin-commoner'], ['crystal-devourer','guardian-seed']]) {
  const actor = fighter(slug);
  assert.deepEqual(rules.plan(actor, [actor], 6), {slot:4, slug:expected});
  for (let roll=1; roll<6; roll++) assert.equal(rules.plan(actor, [actor], roll), null);
  actor.summonUsed = true;
  assert.equal(rules.plan(actor, [actor], 6), null);
}
for (const [r, slug] of [[0,'skeleton-spear'], [.4,'skeleton-archer'], [.99,'skeleton-cavalry']]) {
  const actor = fighter('grave-priest');
  assert.equal(rules.plan(actor, [actor], 6, ()=>r).slug, slug);
}
const full = [0,1,2,3,4].map(slot=>fighter('ghoul',slot));
for (const slug of Object.keys(rules.choices)) assert.equal(rules.plan(fighter(slug), full, 6), null);
full[2].alive = false;
assert.equal(rules.plan(fighter('grave-priest'), full, 6), null);
assert.equal(rules.plan(fighter('crystal-devourer'), full, 6).slot, 2);
full[4].alive = false;
assert.equal(rules.plan(fighter('crystal-devourer'), full, 6).slot, 4);
const seed = fighter('guardian-seed');
rules.registerHit(seed, {damage:0,miss:true},1);
assert.equal(seed.receivedHits, undefined);
rules.registerHit(seed, {damage:1},1);
assert.equal(rules.canBloom(seed,2), false);
rules.registerHit(seed, {damage:1},2);
assert.equal(rules.canBloom(seed,2), false);
assert.equal(rules.canBloom(seed,3), true);
seed.hp=0;
assert.equal(rules.canBloom(seed,3), false);

async function main() {
  const actor = fighter('grave-priest');
  const events=[];
  const context = { V2SummonRules:rules, actor, units:[actor], lastDiceRoll:6, turnNumber:3, battleToken:1, running:true,
    ROSTER_BY_SLUG:new Map(['skeleton-spear','skeleton-archer','skeleton-cavalry'].map(slug=>[slug,{slug}])),
    prepareSelectedMotion:async()=>{}, makeState:(data,team,slot)=>({...fighter(data.slug,slot),team}),
    replaceFighter:(old,next)=>{context.units.push(next);next.element={classList:{add(){}}};events.push('spawn');},
    revealUnit:()=>events.push('reveal'), updateHud(){},message:{},console,wait:async()=>{},
    V2SummonEffect:{prepare:async()=>[],play:async(u,f,o)=>{events.push('effect');o.reveal(u);}},
    turnQueue:[actor]
  };
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('  async function summonBeforeAttack('),source.indexOf('  async function performAttack(')),context);
  await vm.runInContext('summonBeforeAttack(actor,1)',context);
  assert.equal(context.units.length,2);
  assert.equal(context.units[1].isSummon,true);
  assert.equal(context.units[1].bornTurn,3);
  assert.equal(context.turnQueue.length,1,'New summon must not act this turn');
  assert.equal(actor.summonUsed,true);
  await vm.runInContext('summonBeforeAttack(actor,1)',context);
  assert.equal(context.units.length,2,'Only one successful summon per battle');
  actor.summonUsed=false;
  context.units=[actor];
  context.prepareSelectedMotion=async()=>{context.battleToken++;};
  await vm.runInContext('summonBeforeAttack(actor,1)',context);
  assert.equal(context.units.length,1,'Reset during loading cancels summon');
  assert.equal(actor.summonUsed,false);
  assert(source.indexOf('await summonBeforeAttack(actor, token)') < source.indexOf('const outcome = V2BattleBrands.attack(actor, target)'));
  assert(source.includes('unitState.alive && unitState.slug !== "guardian-seed"'));
  assert(source.includes('plant.isSummon = false'));
  const waitingSeed={...fighter('guardian-seed',4), frames:{attack:5}, bloomTurn:5};
  const turnContext={
    running:true, turnNumber:3, battleToken:1, units:[fighter('ghoul'),waitingSeed,{...fighter('ghoul'),team:'enemy'}],
    V2SummonRules:rules,V2BattleBrands:{startRound:()=>[]}, lastDiceRoll:3, Math,
    turnDice:{},battlefield:{classList:{remove(){}}},closeUnitInfo(){},pauseButton:{},message:{},
    updateUnit(){},updateHud(){},playMotion:async()=>{},
    ROSTER_BY_SLUG:new Map([['crystal-devourer',{slug:'crystal-devourer',speed:2}]]),
    makeState:(data,team,slot)=>({...fighter(data.slug,slot),...data,team}),
    replaceFighter:(old,next)=>{turnContext.units.splice(turnContext.units.indexOf(old),1,next);},
    aliveUnits:team=>turnContext.units.filter(u=>u.team===team&&u.alive),
    finishBattle(){throw Error('Unexpected finish');}
  };
  vm.createContext(turnContext);
  vm.runInContext(source.slice(source.indexOf('  async function startTurn('),source.indexOf('  function beginTurnIntermission(')),turnContext);
  await vm.runInContext('startTurn()',turnContext);
  assert.equal(turnContext.turnQueue.includes(waitingSeed),false,'Seed cannot attack before bloom');
  await vm.runInContext('startTurn()',turnContext);
  const plant=turnContext.units.find(u=>u.slug==='crystal-devourer');
  assert(plant && !plant.isSummon && !plant.summonUsed);
  assert(turnContext.turnQueue.includes(plant),'Bloomed plant acts on the next turn');
  assert(rules.plan(plant,turnContext.units,6),'Bloomed plant can summon into a vacant allied slot');
  console.log('PASS: summon mappings, random skeletons, occupancy, once-per-battle, seed hits/bloom, next-turn actions and cancellation');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
