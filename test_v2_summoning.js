const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const R = require('./v2-rules');
const D = require('./v2-design-data');
const source = fs.readFileSync(__dirname + '/v2-auto-battle-practice.js', 'utf8');
const fighter = (slug, slot=0) => ({...R.individual(slug,()=>.2), team:'ally', slot, brands:[], passive:null});

async function main() {
  // Exercise the shipped round-start summon controller with the real rules.
  for (const [slug, expected] of [['spider-knight','spiderling'],['goblin-chief','goblin-commoner'],['grave-priest','skeleton-spear'],['crystal-devourer','guardian-seed']]) {
    const units=[fighter(slug),fighter(slug,1)];
    const state=R.create(units,()=>0);
    const plans=R.begin(state);
    assert.equal(plans.length,1);
    assert.equal(plans[0].slug,expected);
    const hp=units[0].hp;
    const events=[];
    const host={querySelector:()=>({replaceWith:()=>events.push('spawn')})};
    const ctx={V2Rules:R,V2DesignData:D,rulesState:state,units,battleToken:1,running:true,
      ROSTER_BY_SLUG:new Map([[expected,{slug:expected}]]),
      unit:slug=>({slug}),prepareSelectedMotion:async()=>{},
      makeState:(data,team,slot)=>({...fighter(data.slug,slot),team}),
      allyTeam:host,enemyTeam:host,createUnitElement:()=>({}),
      revealUnit:()=>events.push('reveal')};
    vm.createContext(ctx);
    vm.runInContext(source.slice(source.indexOf('  async function summonFromPlan('),source.indexOf('  async function performAttack(')),ctx);
    await ctx.summonFromPlan(plans[0],1);
    const pet=units.find(u=>u.slot===4);
    assert(pet?.isSummon);
    assert.equal(pet.bornTurn,1);
    assert.equal(pet.attack,D.units[expected].attack);
    assert.equal(units[0].hp,hp,'Legion summon costs no health');
    assert.deepEqual(events,['spawn','reveal']);
    assert.equal(R.begin(state).length,0,'Occupied slot blocks another summon');
    if(expected==='guardian-seed'){
      R.roll(state,3);
      const victim={...fighter('ghoul'),team:'enemy'};
      const victimHp=victim.hp;
      assert.equal(R.attack(state,pet,victim).damage,0,'Seed never attacks');
      assert.equal(victim.hp,victimHp);
      assert.equal(R.bloomPlans(state).length,0,'No bloom after only one round');
      R.begin(state);
      assert.equal(R.bloomPlans(state)[0].seed,pet);
      const plant=fighter('crystal-devourer',4);
      assert(R.bloomSeed(state,pet,plant));
      assert(plant.isSummon && plant.slot===4);
      assert.equal(plant.brands.length,0);
      assert.equal(R.begin(state).length,0,'Bloomed plant still occupies summon slot');
      plant.alive=false;plant.hp=0;
    }else{pet.alive=false;pet.hp=0;}
    const replacement=R.begin(state)[0];
    assert(replacement,'A dead summon allows another round-start summon');
    ctx.prepareSelectedMotion=async()=>{ctx.battleToken++;};
    const before=units.slice();
    await ctx.summonFromPlan(replacement,1);
    assert.deepEqual(units,before,'Reset while loading must cancel insertion');
    assert.equal(events.length,2);
  }
  console.log('PASS: current legion summons, species stats, free cost, slot occupancy, replacement, seed bloom and UI cancellation');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
