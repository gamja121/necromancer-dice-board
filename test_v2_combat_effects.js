const assert=require('node:assert/strict');
const fs=require('node:fs');
const api=require('./v2-combat-effects');
async function main(){
  assert.equal(api.ATTACK_EFFECTS.forestFairy,'wind');
  assert.equal(api.ATTACK_EFFECTS['forest-fairy'],'wind');
  assert.equal(api.ATTACK_EFFECTS.siren,'music');
  for(const type of ['ghoul','ragingTreant','raging-treant','abyssHarpy','abyss-harpy','boneGolem','bone-golem','seaWolf','sea-wolf'])
    assert.equal(api.ATTACK_EFFECTS[type],'claw',type+' must use claw impact');
  assert.equal(await api.prepare('mimic'),null);
  let loaded;
  global.V2HitEffects={prepare:async id=>{loaded=id;return ['a','b','c'];}};
  global.Image=class{set src(v){queueMicrotask(()=>this.onload());}};
  assert.deepEqual(await api.prepare('forestFairy'),['a','b','c']);assert.equal(loaded,'wind');
  await api.prepare('siren');assert.equal(loaded,'music');
  let removed=0, appended=0;const shown=[];
  global.document={createElement(){return {style:{},setAttribute(){},set src(v){shown.push(v);},remove(){removed++;}};}};
  const target={isConnected:true,appendChild(){appended++;}};
  await api.play(target,['a','b','c'],{wait:async()=>{}});
  assert.deepEqual(shown,['a','b','c']);assert.equal(removed,1);assert.equal(appended,1);
  shown.length=0;let current=true;
  await api.play(target,['a','b'],{guard:()=>current,wait:async()=>{current=false;}});
  assert.deepEqual(shown,['a']);assert.equal(removed,2);
  await api.play(target,['a'],{guard:()=>false});assert.equal(appended,2);
  await assert.rejects(api.play(target,['a'],{wait:async()=>{throw Error('cancel');}}));assert.equal(removed,3);
  const battle=fs.readFileSync('v2-battle.js','utf8'),auto=fs.readFileSync('v2-auto-battle-practice.js','utf8');
  assert(battle.includes('if (damage > 0 && hitFrames)'));
  assert(battle.includes('document.getElementById("fighter-" + target.id), hitFrames'));
  assert(auto.includes('target.element.querySelector(".sprite-wrap"), hitFrames'));
  assert(auto.indexOf('if (outcome.damage > 0)')<auto.indexOf('V2CombatEffects.play('));
  assert(fs.readFileSync('unit-data.js','utf8').includes('forestFairy: {\n    label: "픽시"') || /forestFairy: \{\s+label: "픽시"/.test(fs.readFileSync('unit-data.js','utf8')));
  for(const slug of ['forest-fairy','siren']) for(const [motion,count] of [['attack',5],['hit',4],['death',7]]) for(let i=1;i<=count;i++) assert(fs.existsSync(`art/v2-style/animation-test-frames/${slug}/${motion}-${String(i).padStart(2,'0')}.png`));
  console.log('PASS: attacker mappings, target playback, cancellation/cleanup, damage gates and demo frame assets.');
  const vm=require('node:vm');
  for(const [slug,effect] of [['forest-fairy','wind'],['siren','music'],['ghoul','claw'],['raging-treant','claw'],['abyss-harpy','claw'],['bone-golem','claw'],['sea-wolf','claw']]) for(const damage of [0,2]) {
    const host={},events=[];
    const unit=slug=>({slug,name:slug,team:'ally',alive:true,hp:10,frames:{attack:5,hit:4,death:7},image:{},element:{classList:{add(){},remove(){}},querySelector(){return host;}}});
    const actor=unit(slug),target=unit('ghoul');target.team='enemy';
    const ctx={actor,Math,battleToken:1,running:true,turnNumber:1,actionCount:0,turnQueue:[],speedMultiplier:1,message:{},
      V2BattleBrands:{beforeAction:()=>false,attack:()=>({damage,miss:damage===0})},
      V2CombatEffects:{prepare:async type=>{assert.equal(type,slug);assert.equal(api.ATTACK_EFFECTS[type],effect);return ['a'];},play:async (node,frames)=>{assert.equal(node,host);events.push('effect');}},
      updateUnit(){},updateHud(){},showDamage(){events.push('damage');},aliveUnits:team=>[team==='enemy'?target:actor],
      playMotion:async (unit,motion)=>events.push(motion),wait:async()=>{},frame:()=>'',finishBattle(){throw Error('unexpected finish');}};
    vm.createContext(ctx);
    vm.runInContext(auto.slice(auto.indexOf('  async function performAttack('),auto.indexOf('  async function playMotion(')),ctx);
    await vm.runInContext('performAttack(actor,1)',ctx);
    assert.deepEqual(events,damage ? ['attack','damage','hit','effect'] : ['attack']);
  }
  console.log('PASS: actual automatic attack routes mapped wind/music/claw effects to defender and skips misses.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
