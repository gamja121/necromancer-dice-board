'use strict';
const assert=require('node:assert/strict');
const R=require('./v2-rules'),D=require('./v2-design-data');
let seed=92741;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function unit(slug,team='ally',slot=0,p=null,brands=[]){const u={...R.individual(slug,rng),team,slot,brands};u.passive=p?{id:p}:null;return u;}
function b(type,bless=[4],curse=[1]){return {type,bless,curse};}
assert.equal(Object.keys(D.units).length,46);
for(const slug of Object.keys(D.units))for(let i=0;i<100;i++){
 const u=R.individual(slug,rng);assert(u.brands.every(R.validateBrand));assert(u.speed>=1&&u.attack>=0);if(D.units[slug].chance===1)assert(u.passive);
}
for(const type of Object.keys(R.definitions))for(let i=0;i<1000;i++)assert(R.validateBrand(R.brand(type,rng)));
{
 const a=unit('hydra'),d=unit('siren');d.brands=[b('freeze')];R.inherit(a,d,0);assert.deepEqual(a.brands,[b('freeze')]);assert.equal(d.brands.length,0);assert.deepEqual(JSON.parse(JSON.stringify(a)).brands,a.brands);
 a.brands=[b('freeze'),b('freeze'),b('freeze')];d.brands=[b('freeze')];assert.throws(()=>R.inherit(a,d,0));
}
{
 const a=unit('hydra','ally',0,null,[b('critical'),b('critical'),b('combo')]),t=unit('hydra','enemy');t.maxHp=100;
 const s=R.create([a,t]);R.begin(s);R.roll(s,4);assert.equal(R.attack(s,a,t).damage,18);
 a.brands=[b('critical',[4],[1]),b('critical',[1],[4]),b('healing',[4],[2])];a.hp=5;R.begin(s);R.roll(s,4);assert.equal(a.hp,7);assert(R.attack(s,a,t).miss);
}
{
 const a=unit('hydra','ally',0,null,[b('combo')]),t=unit('skeleton-spear','enemy',0,'undying');const s=R.create([a,t]);R.begin(s);R.roll(s,4);t.hp=1;R.attack(s,a,t);assert(!t.alive);assert(t.undyingUsed);
}
{
 const a=unit('hydra','ally',0,null,[b('combo',[4],[1])]),t=unit('hydra','enemy');t.maxHp=100;const s=R.create([a,t]);R.begin(s);R.roll(s,4);const out=R.attack(s,a,t);assert.equal(out.hits.length,2);assert.deepEqual(out.hits,[3,3]);assert.equal(out.damage,6);
}
{
 const a=unit('hydra','ally',0,null,[b('combo',[4],[1])]),t=unit('skeleton-spear','enemy');const s=R.create([a,t]);R.begin(s);R.roll(s,1);const hp=t.hp;const out=R.attack(s,a,t);assert(out.cancelled);assert(out.miss);assert.equal(out.damage,0);assert.equal(t.hp,hp);
}
{
 const a=unit('hydra','ally',0,'grudge',[b('counter')]),t=unit('hydra','enemy',0,'grudge',[b('counter')]);const s=R.create([a,t]);R.begin(s);R.roll(s,4);const hit=R.attack(s,a,t);assert.equal(hit.counterDamage,2);assert.equal(a.grudge,1);assert.equal(t.grudge,1);
}
{
 const a=unit('hydra','ally',0,null,[b('poison')]),t=unit('skeleton-spear','enemy');const s=R.create([a,t]);R.begin(s);R.roll(s,4);R.attack(s,a,t);assert.equal(t.poison,1);assert.equal(R.before(s,t),1);assert.equal(R.before(s,t),1);assert.equal(R.before(s,t),0);
}
{
 const a=unit('hydra','ally',0,null,[b('poison'),b('poison')]),t=unit('hydra','enemy');const s=R.create([a,t]);R.begin(s);R.roll(s,4);R.attack(s,a,t);assert.equal(t.poison,2);const hp=t.hp;assert.equal(R.before(s,t),2);assert.equal(t.hp,hp-2);assert.equal(R.before(s,t),2);assert.equal(R.before(s,t),0);
}
{
 const a=unit('skeleton-spear','ally',0,'initiative',[b('lightspeed',[2,3],[1])]),t=unit('siren','enemy');const s=R.create([a,t]);R.begin(s);assert.equal(R.roll(s,1)[0],a);R.begin(s);assert.equal(R.roll(s,1).at(-1),a);
}
{
 const a=unit('hydra','ally',0,'pack'),b1=unit('plague-doctor','ally',1),c=unit('doom-executor','ally',2);const s=R.create([a,b1,c]);R.begin(s);assert.equal(a.attack,a.baseAttack+1);c.alive=false;R.refresh(s);assert.equal(a.attack,a.baseAttack);
}
{
 const a=unit('skeleton-spear','ally',0),b1=unit('skeleton-archer','ally',1),c=unit('skeleton-cavalry','ally',2),e=unit('hydra','enemy');const s=R.create([a,b1,c,e]);a.hp-=2;const before=a.hp;R.begin(s);assert.equal(a.hp,before+1);assert(s.events.some(event=>event.type==='heal'&&event.source==='skeleton'&&event.unit===a&&event.amount===1));
 const inactive=R.create([unit('skeleton-spear','ally',0),unit('skeleton-archer','ally',1),unit('hydra','enemy')]);inactive.units[0].hp-=2;const inactiveHp=inactive.units[0].hp;R.begin(inactive);assert.equal(inactive.units[0].hp,inactiveHp);assert(!inactive.events.some(event=>event.source==='skeleton'));
}
{
 const spider=unit('spider-knight','ally',0),chief=unit('goblin-chief','ally',1),enemy=unit('hydra','enemy');let s=R.create([spider,chief,enemy],()=>0);let plan=R.begin(s)[0];assert.equal(plan.summonerSlug,'spider-knight');assert.equal(plan.slug,'spiderling');
 const chiefFirst=unit('goblin-chief','ally',0),spiderSecond=unit('spider-knight','ally',1);s=R.create([chiefFirst,spiderSecond,unit('hydra','enemy')],()=>0);plan=R.begin(s)[0];assert.equal(plan.summonerSlug,'goblin-chief');assert.equal(plan.slug,'goblin-commoner');
}
{
 const a=unit('stone-golem','enemy',0),c=unit('forest-fairy','enemy',1),u=unit('spider-knight','ally',0,'soul'),v=unit('goblin-chief','ally',1);const s=R.create([a,c,u,v]);assert(R.suppressed(s.legions,'ally'));a.alive=false;c.alive=false;assert(R.suppressed(s.legions,'ally'));const plans=R.begin(s);assert.equal(plans[0].owner,u);
}
{
 const a=unit('spider-knight','ally',0,'soul'),c=unit('goblin-chief','ally',1);const s=R.create([a,c]);const plans=R.begin(s);assert(!plans[0].owner);const hp=a.hp;R.addSummon(s,plans[0],R.individual(plans[0].slug,rng));assert.equal(a.hp,hp);
 s.round=14;R.begin(s);assert.equal(a.attack,a.baseAttack+1);s.round=17;R.refresh(s);const plan={slug:'spiderling',team:'ally',slot:4};R.addSummon(s,plan,R.individual('spiderling',rng));assert.equal(s.units.find(u=>u.slot===4).attack,4);
}
{
 const a=unit('hydra','ally',0,'undying',[b('poison')]),t=unit('skeleton-spear','enemy');const s=R.create([a,t],rng);R.begin(s);R.roll(s,4);R.attack(s,a,t);a.undyingUsed=true;t.hp=0;t.alive=false;
 const restored=R.restore(R.snapshot(s),rng);assert.deepEqual(R.snapshot(restored),R.snapshot(s));assert.equal(restored.units[1].alive,false);assert.equal(restored.units[0].undyingUsed,true);assert.equal(restored.units[1].poisonStacks[0].source,restored.units[0]);
 const invalid=R.snapshot(s);invalid.units[1].alive=true;assert.throws(()=>R.restore(invalid));
}
// 2,000 seeded full battles. Three random, independently inherited brands each.
const slugs=Object.keys(D.units).filter(k=>D.units[k].grade!=='special'),types=Object.keys(R.definitions);
let maxRound=0,timeouts=0;
for(let trial=0;trial<2000;trial++){
 const units=[];for(const team of ['ally','enemy'])for(let slot=0;slot<4;slot++){const u={...R.individual(slugs[Math.floor(rng()*slugs.length)],rng),team,slot};u.brands=Array.from({length:3},()=>R.brand(types[Math.floor(rng()*types.length)],rng));units.push(u);}
 const s=R.create(units,rng);
 const live=team=>s.units.some(u=>u.alive&&u.team===team);
 while(live('ally')&&live('enemy')&&s.round<250){
   for(const p of R.begin(s))R.addSummon(s,p,R.individual(p.slug,rng));
   for(const a of R.roll(s,1+Math.floor(rng()*6))){if(!a.alive)continue;R.before(s,a);const targets=s.units.filter(t=>t.alive&&t.team!==a.team);if(!targets.length)break;R.attack(s,a,targets[Math.floor(rng()*targets.length)]);}
   for(const u of s.units){assert(Number.isFinite(u.hp)&&u.hp>=0&&u.hp<=u.maxHp);assert.equal(u.alive,u.hp>0);assert(u.poisonStacks.length<=3);}
 }
 maxRound=Math.max(maxRound,s.round);if(s.round===250)timeouts++;
}
assert.equal(timeouts,0,'Simulation did not terminate within 250 rounds');
console.log(JSON.stringify({passed:true,battles:2000,maxRound,timeouts,units:46}));
