(function(root) {
  'use strict';
  const D=typeof module!=='undefined'&&module.exports?require('./v2-design-data.js'):root.V2DesignData;
  const brandRows={
    critical:['치명타',1,'축복당 공격 피해 +100%p','공격 빗나감'], vampire:['흡혈',0,'입힌 피해만큼 회복','공격 후 자신에게 피해 1'],
    combo:['연격',1,'추가 타격 +1','공격 취소'], freeze:['빙결',1,'대상의 다음 행동 1회 봉쇄','자신의 다음 행동 1회 봉쇄'],
    poison:['독',0,'2회 지속 중독 +1스택, 최대 3','자신에게 중독 +1스택'], guard:['수호',0,'이번 라운드 피격 1회 방어','이번 라운드 받는 피해 +1'],
    summon:['소환',2,'소환물 체력 1 회복, 전투 중 공격력 +1 누적','강화 실패, 자신의 체력 1 소모'],
    counter:['반격',1,'피격 시 공격력 50% 반격 (올림)','이번 라운드 공격력 -1'], healing:['회복',0,'최저 체력 비율 아군 체력 2 회복','최고 현재 체력 아군 피해 1'],
    lightspeed:['광속',2,'이번 라운드 속도 +2','이번 라운드 후턴 강제']
  };
  const definitions=Object.fromEntries(Object.entries(brandRows).map(([key,[name,count,blessing,penalty]])=>[key,{name:name+'의 낙인',count,blessing,penalty}]));
  const legionRows={skeleton:['언데드',3,'라운드 시작 체력 1 회복'],beast:['야수',3,'공격력 +1'],corpse:['시체',2,'영입 실패 시 재도전 1회'],plague:['역병',3,'중독 면역'],ice:['얼음',3,'빙결 대상 타격 피해 +1'],summon:['소환',2,'빈 5번 슬롯에 무작위 자동 소환'],demon:['악마',3,'속도 +2'],plant:['식물',2,'최대·현재 체력 +3'],insect:['벌레',2,'공격 피해 -1, 최소 1'],element:['원소',2,'상대 군단 효과 억제']};
  const RULES=Object.fromEntries(Object.entries(legionRows).map(([key,[name,need,effect]])=>[key,{name,need,effect}]));
  const TARGET_RATES=Object.freeze({1:Object.freeze([100]),2:Object.freeze([35,65]),3:Object.freeze([20,33,47]),4:Object.freeze([15,20,27,38])});
  const choose=(items,rng)=>items[Math.floor(rng()*items.length)];
  function brand(type,rng=Math.random){
    if(!definitions[type])throw Error('Unknown brand');
    const curse=[1+Math.floor(rng()*6)], available=[1,2,3,4,5,6].filter(n=>n!==curse[0]);
    const count=definitions[type].count||(rng()<.5?1:2),bless=[];
    while(bless.length<count)bless.push(available.splice(Math.floor(rng()*available.length),1)[0]);
    return {type,bless:bless.sort(),curse};
  }
  function validateBrand(b){return b&&definitions[b.type]&&Array.isArray(b.bless)&&Array.isArray(b.curse)&&b.curse.length===1&&b.bless.length>=1&&b.bless.length<=2&&(!definitions[b.type].count||b.bless.length===definitions[b.type].count)&&new Set([...b.bless,...b.curse]).size===b.bless.length+1&&[...b.bless,...b.curse].every(n=>Number.isInteger(n)&&n>=1&&n<=6);}
  function inherit(receiver,donor,index){
    if(receiver.brands.length>=3||!validateBrand(donor.brands[index]))throw Error('Invalid inheritance');
    receiver.brands.push(JSON.parse(JSON.stringify(donor.brands.splice(index,1)[0])));
  }
  function individual(slug,rng=Math.random){
    const d=D.units[slug];if(!d)throw Error('Unknown unit '+slug);
    const passive=d.passives.length&&rng()<d.chance?choose(d.passives,rng):null;
    const out={slug,name:d.name,grade:d.grade,legions:[...d.legions],maxHp:d.hp,attack:d.attack,speed:d.speed,passive:passive?{id:passive,name:D.passives[passive][0],description:D.passives[passive][1]}:null,brands:d.brands.length?[brand(choose(d.brands,rng),rng)]:[],isSummon:d.grade==='special'};
    if(!passive&&d.grade!=='special')out[d.bonus==='hp'?'maxHp':d.bonus]+=d.amount;
    return out;
  }
  const passive=(u,id)=>u.passive?.id===id;
  function legionState(units){
    const teams={};for(const team of ['ally','enemy']){const counts={};for(const u of units.filter(u=>u.team===team&&!u.isSummon&&u.slot<4))for(const key of u.legions)counts[key]=(counts[key]||0)+1;teams[team]={counts,active:new Set(Object.keys(RULES).filter(k=>(counts[k]||0)>=RULES[k].need))};}return {teams};
  }
  const opposite=t=>t==='ally'?'enemy':'ally';
  const suppressed=(s,t)=>s.teams[opposite(t)].active.has('element');
  const active=(s,t,k)=>s.teams[t].active.has(k)&&(k==='element'||!suppressed(s,t));
  const has=(s,u,k)=>u.legions.includes(k)&&active(s.legions,u.team,k);
  const heal=(u,n)=>{if(!u.alive)return 0;const h=Math.max(0,Math.min(n,u.maxHp-u.hp));u.hp+=h;return h;};
  function init(u){u.baseMaxHp=u.maxHp;u.baseAttack=u.attack;u.baseSpeed=u.speed;u.hp=u.maxHp;u.alive=true;u.grudge=0;u.summonPower=0;u.poisonStacks=[];u.poison=0;u.frozen=false;u.undyingUsed=false;u.shields=0;u.bless={};u.curse={};return u;}
  function applyUnit(legions,u){if(u.legionStatsApplied)return;u.legionStatsApplied=true;if(active(legions,u.team,'plant')&&u.legions.includes('plant')){u.maxHp+=3;u.hp+=3;}}
  function create(units,rng=Math.random){units.forEach(init);const s={units,rng,round:0,legions:legionState(units),last:null,events:[]};units.forEach(u=>applyUnit(s.legions,u));return s;}
  function power(s,u){const pack=passive(u,'pack')&&s.units.filter(a=>a.alive&&a.team===u.team&&a.slot<4&&a.legions.some(k=>u.legions.includes(k))).length>=3;return Math.max(0,u.baseAttack+(u.grudge||0)+(u.summonPower||0)+Math.max(0,s.round-14)+(has(s,u,'beast')?1:0)+(pack?1:0)-(u.curse.counter||0));}
  function refresh(s){for(const u of s.units){u.attack=power(s,u);u.speed=u.curse.lightspeed?0:u.baseSpeed+(has(s,u,'demon')?2:0)+2*(u.bless.lightspeed||0);}}
  function damage(s,target,n,source,kind='attack'){
    if(!target.alive||n<=0)return 0;
    if(kind==='attack'){n=Math.max(1,n-(has(s,target,'insect')?1:0)-(passive(target,'bone')?1:0));}
    else if(kind==='counter'&&passive(target,'bone'))n=Math.max(1,n-1);
    n+=target.curse.guard||0;
    if(target.shields>0){target.shields--;return 0;}
    const dealt=Math.min(target.hp,n);target.hp-=dealt;
    if(target.hp<=0&&passive(target,'undying')&&!target.undyingUsed){target.undyingUsed=true;target.hp=1;}
    if(target.hp<=0){target.alive=false;s.events.push({type:'death',unit:target});if(source&&source.alive&&passive(source,'feast')&&['attack','poison'].includes(kind)){source.maxHp+=2;heal(source,2);}}
    if(dealt>0&&source&&source.team!==target.team&&['attack','counter'].includes(kind)&&passive(target,'grudge'))target.grudge++;
    refresh(s);return dealt;
  }
  function targetWeights(s,team){
    const formation=s.units.filter(u=>u.alive&&u.team===team&&!u.isSummon&&u.slot<4).map(u=>({unit:u,slot:u.slot})).sort((a,b)=>a.slot-b.slot);
    const summon=s.units.find(u=>u.alive&&u.team===team&&u.isSummon&&u.slot===4);
    if(summon){
      const ownerSlot=Number.isInteger(summon.ownerSlot)?summon.ownerSlot:(formation[0]?.slot??0);
      const ownerIndex=formation.findIndex(entry=>entry.slot===ownerSlot);
      const replacement={unit:summon,slot:ownerSlot};
      if(ownerIndex>=0)formation.splice(ownerIndex,1,replacement);else formation.push(replacement);
      formation.sort((a,b)=>a.slot-b.slot);
    }
    const baseRates=TARGET_RATES[formation.length]||[];
    const rates=team==='enemy'?[...baseRates].reverse():baseRates;
    return formation.map((entry,index)=>({unit:entry.unit,chance:rates[index]||0}));
  }
  function pickTarget(s,team,rng=s.rng){
    const weighted=targetWeights(s,team);if(!weighted.length)return null;
    let roll=rng()*100;
    for(const entry of weighted){roll-=entry.chance;if(roll<0)return entry.unit;}
    return weighted.at(-1).unit;
  }
  function poison(s,u,count,source){if(has(s,u,'plague')||!u.alive)return;for(let i=0;i<count&&u.poisonStacks.length<3;i++)u.poisonStacks.push({remaining:2,source});u.poison=u.poisonStacks.length;}
  const summonPools={'spider-knight':['spiderling'],'goblin-chief':['goblin-commoner'],'grave-priest':['skeleton-spear','skeleton-archer','skeleton-cavalry'],'crystal-devourer':['guardian-seed']};
  function summonPlans(s){const plans=[];for(const team of ['ally','enemy']){if(s.units.some(u=>u.alive&&u.team===team&&u.slot===4))continue;
    if(active(s.legions,team,'summon')){
      const summoners=s.units.filter(u=>u.alive&&u.team===team&&u.slot<4&&summonPools[u.slug]).sort((a,b)=>a.slot-b.slot);
      if(summoners.length){const summoner=choose(summoners,s.rng);plans.push({team,slot:4,slug:choose(summonPools[summoner.slug],s.rng),summonerSlug:summoner.slug,summonerSlot:summoner.slot});}
      continue;
    }
    const owner=s.units.filter(u=>u.alive&&u.team===team&&passive(u,'soul')&&u.hp>1).sort((a,b)=>a.slot-b.slot)[0];
    if(owner&&summonPools[owner.slug])plans.push({team,slot:4,slug:choose(summonPools[owner.slug],s.rng),owner});
    }return plans;}
  function addSummon(s,plan,u){if(plan.owner){if(!plan.owner.alive||plan.owner.hp<=1)return false;plan.owner.hp--;}
    const species=D.units[plan.slug];Object.assign(u,{maxHp:species.hp,attack:species.attack,speed:species.speed});
    init(u);u.team=plan.team;u.slot=4;u.isSummon=true;u.ownerSlot=plan.owner?.slot??plan.summonerSlot;u.bornTurn=s.round;u.brands=[];u.passive=null;applyUnit(s.legions,u);
    const old=s.units.findIndex(a=>a.team===u.team&&a.slot===4);if(old>=0)s.units.splice(old,1,u);else s.units.push(u);refresh(s);return true;}
  function bloomPlans(s){return s.units.filter(u=>u.alive&&u.slug==='guardian-seed'&&s.round>=u.bornTurn+2).map(seed=>({seed,team:seed.team,slot:seed.slot,ownerSlot:seed.ownerSlot,slug:'crystal-devourer'}));}
  function bloomSeed(s,seed,u){
    const index=s.units.indexOf(seed);if(index<0||!seed.alive||seed.slug!=='guardian-seed')return false;
    const species=D.units['crystal-devourer'];Object.assign(u,{slug:'crystal-devourer',name:species.name,grade:species.grade,legions:[...species.legions],maxHp:species.hp,attack:species.attack,speed:species.speed});
    init(u);u.team=seed.team;u.slot=seed.slot;u.isSummon=true;u.ownerSlot=seed.ownerSlot;u.bornTurn=s.round;u.brands=[];u.passive=null;applyUnit(s.legions,u);
    s.units.splice(index,1,u);refresh(s);return true;
  }
  function begin(s){s.round++;s.events=[];for(const u of s.units){u.bless={};u.curse={};u.shields=0;if(u.alive&&has(s,u,'skeleton')){const amount=heal(u,1);if(amount)s.events.push({type:'heal',unit:u,amount,source:'skeleton'});}}refresh(s);return summonPlans(s);}
  function roll(s,face){
    for(const u of s.units){u.bless={};u.curse={};if(!u.alive)continue;for(const b of u.brands||[]){if(b.bless.includes(face))u.bless[b.type]=(u.bless[b.type]||0)+1;if(b.curse.includes(face))u.curse[b.type]=(u.curse[b.type]||0)+1;}u.shields=u.curse.guard?0:u.bless.guard||0;u.brand=u.brands[0]?.type;u.brandMode=mode(u.brands[0],face);}
    refresh(s);
    // Stable team/slot order for simultaneous support effects: healing before damage.
    const actors=s.units.filter(u=>u.alive).slice().sort((a,b)=>a.team.localeCompare(b.team)||a.slot-b.slot);
    for(const u of actors){if(!u.alive)continue;
      const allies=()=>s.units.filter(a=>a.alive&&a.team===u.team).sort((a,b)=>a.slot-b.slot);
      for(let i=0;i<(u.bless.healing||0);i++){const a=allies().sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(a)heal(a,2);}
      for(let i=0;i<(u.curse.healing||0);i++){const a=allies().sort((a,b)=>b.hp-a.hp)[0];if(a)damage(s,a,1,u,'curse');}
      if(u.curse.freeze)u.frozen=true;poison(s,u,u.curse.poison||0,u);
      if(u.curse.summon)damage(s,u,u.curse.summon,u,'curse');else {const pet=allies().find(a=>a.slot===4);if(pet&&u.bless.summon){heal(pet,u.bless.summon);pet.summonPower+=u.bless.summon;}}
    }
    refresh(s);
    const rank=u=>s.round===1&&passive(u,'initiative')?2:u.curse.lightspeed?-1:0;
    const queue=s.units.filter(u=>u.alive).map(u=>({u,tie:s.rng()})).sort((a,b)=>rank(b.u)-rank(a.u)||b.u.speed-a.u.speed||a.u.slot-b.u.slot||a.tie-b.tie).map(a=>a.u);
    s.last=queue.filter(u=>u.slug!=='guardian-seed').at(-1);return queue;
  }
  function before(s,u){let n=0;for(const p of [...u.poisonStacks]){if(u.alive)n+=damage(s,u,1,p.source,'poison');p.remaining--;}u.poisonStacks=u.poisonStacks.filter(p=>p.remaining>0);u.poison=u.poisonStacks.length;return n;}
  function attack(s,a,t){const out={damage:0,recovered:0,miss:false,immune:false,hits:[],counterDamage:0};
    if(!a.alive||!t?.alive||a.slug==='guardian-seed')return out;
    if(a.frozen){a.frozen=false;out.cancelled=true;return out;}
    if(a.curse.combo){out.cancelled=true;out.miss=true;return out;}
    if(a.curse.critical){out.miss=true;return out;}
    const strikes=1+(a.bless.combo||0);
    for(let i=0;i<strikes&&a.alive&&t.alive;i++){
      refresh(s);let p=a.attack;if(passive(a,'late')&&s.last===a)p++;if(passive(a,'cold')&&a.speed>t.speed)p++;if(passive(a,'weak')&&(t.poison||t.frozen||t.curse.counter||t.curse.lightspeed))p++;
      const raw=p*(1+(a.bless.critical||0))+(has(s,a,'ice')&&t.frozen?1:0);
      const hit=damage(s,t,raw,a);out.damage+=hit;out.hits.push(hit);if(!hit)out.immune=true;
      if(hit>0){out.recovered+=heal(a,hit*(a.bless.vampire||0));if(t.alive){poison(s,t,a.bless.poison||0,a);if(a.bless.freeze&&!t.frozen)t.frozen=true;}}
      if(t.alive&&hit>0&&t.bless.counter){out.counterDamage+=damage(s,a,Math.max(1,Math.ceil(t.attack*.5))*t.bless.counter,t,'counter');}
    }
    if(a.alive&&a.curse.vampire)damage(s,a,a.curse.vampire,a,'curse');return out;
  }
  function mode(b,face){if(typeof b==='string')return 'normal';return !b?'normal':b.curse.includes(face)?'curse':b.bless.includes(face)?'blessing':'normal';}
  function snapshot(s){
    const fields=['slug','name','grade','legions','team','slot','ownerSlot','maxHp','baseMaxHp','baseAttack','baseSpeed','hp','alive','passive','brands','isSummon','bornTurn','grudge','summonPower','frozen','undyingUsed','shields','bless','curse','legionStatsApplied','brand','brandMode'];
    return JSON.parse(JSON.stringify({version:1,round:s.round,last:s.units.indexOf(s.last),legions:Object.fromEntries(Object.entries(s.legions.teams).map(([k,v])=>[k,{counts:v.counts,active:[...v.active]}])),units:s.units.map(u=>({...Object.fromEntries(fields.map(k=>[k,u[k]])),poisonStacks:u.poisonStacks.map(p=>({remaining:p.remaining,source:s.units.indexOf(p.source)}))}))}));
  }
  function restore(data,rng=Math.random){
    if(data?.version!==1||!Array.isArray(data.units)||data.units.length>10||!Number.isInteger(data.round)||data.round<0)throw Error('Unsupported battle save');
    const copy=JSON.parse(JSON.stringify(data)),seen=new Set();
    for(const u of copy.units){const id=u.team+':'+u.slot;if(!D.units[u.slug]||!['ally','enemy'].includes(u.team)||!Number.isInteger(u.slot)||u.slot<0||u.slot>4||seen.has(id)||!Number.isFinite(u.hp)||u.hp<0||u.hp>u.maxHp||u.alive!==(u.hp>0)||!Array.isArray(u.brands)||u.brands.length>3||!u.brands.every(validateBrand))throw Error('Invalid battle save');seen.add(id);}
    const s={units:copy.units,round:copy.round,rng,events:[],last:copy.units[copy.last]||null,legions:{teams:Object.fromEntries(Object.entries(copy.legions).map(([k,v])=>[k,{counts:v.counts,active:new Set(v.active)}]))}};
    for(const u of s.units){u.poisonStacks=(u.poisonStacks||[]).map(p=>({remaining:p.remaining,source:s.units[p.source]||null}));u.poison=u.poisonStacks.length;}
    refresh(s);return s;
  }
  const api={definitions,RULES,TARGET_RATES,individual,brand,validateBrand,inherit,create,init,applyUnit,active,suppressed,begin,roll,before,attack,addSummon,bloomPlans,bloomSeed,targetWeights,pickTarget,refresh,mode,heal,damage,snapshot,restore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.V2Rules=api;
})(globalThis);
