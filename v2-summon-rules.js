(function (root) {
  "use strict";
  const choices = {
    "spider-knight": ["spiderling"], "goblin-chief": ["goblin-commoner"],
    "grave-priest": ["skeleton-spear", "skeleton-archer", "skeleton-cavalry"],
    "crystal-devourer": ["guardian-seed"]
  };
  function plan(actor, units, roll, random = Math.random) {
    if (!actor.alive || actor.summonUsed || roll !== 6 || !choices[actor.slug]) return null;
    const occupied = slot => units.some(u => u.team === actor.team && u.slot === slot && u.alive);
    let slot = occupied(4) ? -1 : 4;
    if (slot < 0 && actor.slug === "crystal-devourer") {
      slot = [0, 1, 2, 3].find(s => !occupied(s)) ?? -1;
    }
    if (slot < 0) return null;
    const list = choices[actor.slug];
    return { slot, slug: list[Math.floor(random() * list.length)] };
  }
  function registerHit(unit, outcome, turn) {
    if (unit.slug !== "guardian-seed" || !unit.alive || outcome.miss || outcome.immune || outcome.damage <= 0) return;
    unit.receivedHits = (unit.receivedHits || 0) + 1;
    if (unit.receivedHits >= 2 && unit.bloomTurn == null) unit.bloomTurn = turn + 1;
  }
  function canBloom(unit, turn) { return unit.alive && unit.hp > 0 && unit.slug === "guardian-seed" && unit.bloomTurn != null && unit.bloomTurn <= turn; }
  const api = { choices, plan, registerHit, canBloom };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.V2SummonRules = api;
})(globalThis);
