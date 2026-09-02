(function (root) {
  "use strict";
  const definitions = Object.freeze({
    critical: { name: "치명타의 낙인", bless: [5, 6], curse: [1], blessing: "공격 피해량 2배", penalty: "공격 빗나감", normal: "2, 3, 4" },
    vampire: { name: "흡혈의 낙인", bless: [2, 4, 6], curse: [3], blessing: "실제로 가한 피해만큼 체력 회복 (최대 체력까지)", penalty: "받는 공격 피해 2배", normal: "1, 5" },
    guard: { name: "수호의 낙인", bless: [1, 2], curse: [6], blessing: "이번 턴 받는 공격 피해 무시", penalty: "공격 빗나감", normal: "3, 4, 5" },
    poison: { name: "중독의 낙인", bless: [1, 3, 5], curse: [2, 4, 6], blessing: "공격으로 피해를 주면 중독 부여 · 대상의 다음 행동 시작에 고정 피해 1 (1회, 중첩 없음)", penalty: "턴 시작 시 자신의 체력 1 감소", normal: "없음" },
    summon: { name: "소환의 낙인", bless: [2, 4], curse: [6], blessing: "모든 아군 소환물 체력 2 회복 (최대 체력까지)", penalty: "모든 아군 소환물 체력 1 감소", normal: "1, 3, 5" },
    healing: { name: "회복의 낙인", bless: [6], curse: [1], blessing: "모든 아군 유닛 체력 1 회복", penalty: "무작위 적 1명 체력 1 회복", normal: "2, 3, 4, 5" }
  });
  const samples = Object.freeze({
    "death-knight": "critical", "skeleton-spear": "vampire", ghoul: "poison",
    "ancient-treant": "guard", "goblin-rider": "summon", "orc-warrior": "healing",
    "boulder-ogre": "critical", minotaur: "vampire"
  });
  function mode(id, roll) {
    const brand = definitions[id];
    if (!brand || !Number.isInteger(roll) || roll < 1 || roll > 6) return "normal";
    return brand.bless.includes(roll) ? "blessing" : brand.curse.includes(roll) ? "curse" : "normal";
  }
  function heal(unit, amount) {
    if (!unit.alive || unit.hp <= 0) return 0;
    const healed = Math.min(amount, Math.max(0, unit.maxHp - unit.hp));
    unit.hp += healed;
    return healed;
  }
  function startRound(units, roll, random = Math.random) {
    const alive = units.filter(unit => unit.alive);
    const deltas = new Map(alive.map(unit => [unit, 0]));
    for (const unit of units) unit.brandMode = mode(unit.brand, roll);
    // Resolve all start-of-turn changes together, independent of roster order.
    for (const unit of alive) {
      const active = unit.brandMode;
      const add = (target, amount) => deltas.set(target, deltas.get(target) + amount);
      if (unit.brand === "poison" && active === "curse") add(unit, -1);
      if (unit.brand === "summon" && active !== "normal")
        alive.filter(target => target.team === unit.team && target.isSummon)
          .forEach(target => add(target, active === "blessing" ? 2 : -1));
      if (unit.brand === "healing" && active === "blessing")
        alive.filter(target => target.team === unit.team).forEach(target => add(target, 1));
      if (unit.brand === "healing" && active === "curse") {
        const enemies = alive.filter(target => target.team !== unit.team);
        if (enemies.length) add(enemies[Math.floor(random() * enemies.length)], 1);
      }
    }
    for (const unit of alive) {
      unit.hp = Math.max(0, Math.min(unit.maxHp, unit.hp + deltas.get(unit)));
      if (unit.hp === 0) unit.alive = false;
    }
    return alive.filter(unit => !unit.alive);
  }
  function beforeAction(unit) {
    if (!unit.alive || !unit.poison) return 0;
    unit.poison = 0;
    unit.hp = Math.max(0, unit.hp - 1);
    if (unit.hp === 0) unit.alive = false;
    return 1;
  }
  function attack(actor, target) {
    const miss = actor.brandMode === "curse" && ["critical", "guard"].includes(actor.brand);
    const immune = target.brand === "guard" && target.brandMode === "blessing";
    let power = actor.attack;
    if (actor.brand === "critical" && actor.brandMode === "blessing") power *= 2;
    if (target.brand === "vampire" && target.brandMode === "curse") power *= 2;
    const damage = miss || immune ? 0 : Math.min(power, Math.max(0, target.hp));
    target.hp -= damage;
    const recovered = actor.brand === "vampire" && actor.brandMode === "blessing" ? heal(actor, damage) : 0;
    if (damage > 0 && target.hp > 0 && actor.brand === "poison" && actor.brandMode === "blessing") target.poison = 1;
    return { damage, recovered, miss, immune };
  }
  const api = { definitions, samples, mode, startRound, beforeAction, attack };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.V2BattleBrands = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
