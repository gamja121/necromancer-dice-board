(function(root) {
  'use strict';
  const RULES = Object.freeze({
    skeleton:{name:'언데드',need:3,effect:'행동 후 체력 1 회복'},
    beast:{name:'야수',need:3,effect:'공격 시 25% 확률 치명타'},
    corpse:{name:'시체',need:2,effect:'적 시체 영입 실패 시 1회 재시도'},
    plague:{name:'역병',need:3,effect:'피해를 준 대상에게 1턴 중독'},
    ice:{name:'얼음',need:3,effect:'공격 시 30% 확률로 이번 턴 빙결'},
    summon:{name:'소환',need:2,effect:'소환물 최대 체력 +3 · 공격력 +1'},
    demon:{name:'악마',need:3,effect:'상대 전체 속도 -2'},
    plant:{name:'식물',need:2,effect:'아군 전체 최대 체력 +1'},
    insect:{name:'벌레',need:2,effect:'아군 전체 공격력 +1'},
    element:{name:'원소',need:4,effect:'매 턴 무작위 아군 1명 무적 · 원소 생존 1명 이하면 해제'}
  });
  const legionsOf = unit => Array.isArray(unit.legions) ? unit.legions : unit.legions ? [unit.legions] : [];
  function create(initialUnits, random = Math.random) {
    const teams = {};
    for (const team of ['ally','enemy']) {
      const members = initialUnits.filter(u=>u.team===team && !u.isSummon);
      const counts = {};
      for (const unit of members) for (const key of legionsOf(unit)) counts[key]=(counts[key]||0)+1;
      teams[team]={counts,active:new Set(Object.keys(RULES).filter(key=>(counts[key]||0)>=RULES[key].need))};
    }
    return {teams,random};
  }
  const opposing = team => team==='ally'?'enemy':'ally';
  const active = (state,team,key) => Boolean(state?.teams?.[team]?.active.has(key));
  function applyUnit(state,unit) {
    if (unit.legionStatsApplied) return;
    unit.legionStatsApplied=true;
    if (active(state,unit.team,'plant')) { unit.maxHp+=1; unit.hp+=1; }
    if (active(state,unit.team,'insect')) unit.attack+=1;
    if (unit.isSummon && active(state,unit.team,'summon')) { unit.maxHp+=3; unit.hp+=3; unit.attack+=1; }
    if (active(state,opposing(unit.team),'demon')) unit.speed-=2;
  }
  function applyOpening(state,units) { units.forEach(unit=>applyUnit(state,unit)); }
  function startTurn(state,units) {
    units.forEach(unit=>{unit.elementImmune=false;unit.frozen=false;});
    for (const team of ['ally','enemy']) {
      if (!active(state,team,'element')) continue;
      const livingElements=units.filter(u=>u.team===team&&u.alive&&legionsOf(u).includes('element'));
      if (livingElements.length<=1) continue;
      const candidates=units.filter(u=>u.team===team&&u.alive);
      if (candidates.length) candidates[Math.floor(state.random()*candidates.length)].elementImmune=true;
    }
  }
  function beforeAttack(state,actor,target) {
    const legionCritical=active(state,actor.team,'beast')&&legionsOf(actor).includes('beast')&&state.random()<.25;
    return {legionCritical,powerMultiplier:legionCritical?2:1,immune:Boolean(target.elementImmune)};
  }
  function afterAttack(state,actor,target,outcome) {
    const applied={poison:false,frozen:false};
    if (outcome.damage<=0||target.hp<=0) return applied;
    if (active(state,actor.team,'plague')&&legionsOf(actor).includes('plague')) {
      target.poison=1; applied.poison=true;
    }
    if (active(state,actor.team,'ice')&&legionsOf(actor).includes('ice')&&state.random()<.3) {
      target.frozen=true; applied.frozen=true;
    }
    return applied;
  }
  function afterAction(state,unit) {
    if (!unit.alive||!active(state,unit.team,'skeleton')||!legionsOf(unit).includes('skeleton')) return 0;
    const healed=Math.min(1,Math.max(0,unit.maxHp-unit.hp));unit.hp+=healed;return healed;
  }
  function consumeFreeze(unit) { if (!unit.frozen) return false; unit.frozen=false; return true; }
  function captureAttempts(state,team) { return active(state,team,'corpse')?2:1; }
  function activeSummary(state,team) {
    return [...state.teams[team].active].map(key=>RULES[key].name).join(' · ')||'활성 군단 없음';
  }
  const api={RULES,create,active,applyUnit,applyOpening,startTurn,beforeAttack,afterAttack,afterAction,consumeFreeze,captureAttempts,activeSummary};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.V2Legions=api;
})(typeof globalThis!=='undefined'?globalThis:this);
