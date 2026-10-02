"use strict";
const fs = require("node:fs");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const source = fs.readFileSync("v2-map-practice.js", "utf8").replace(/\r\n/g, "\n");
const ctx = { Math: Object.assign(Object.create(Math), { random: () => 0.37 }) };
vm.createContext(ctx);
vm.runInContext(source.slice(source.indexOf("  const ROOT ="), source.indexOf("  const el =")), ctx);
for (const name of ["contaminationStage", "shuffle", "tileDefinitionById", "isValidMapPool", "patrolRouteDeltasForState", "buildMapTileCounts", "expectedMapDistribution", "hasValidMapDistribution", "createPool"]) {
  const start = source.indexOf("  function " + name + "(");
  assert(start >= 0, name);
  const end = source.indexOf("\n  }", start) + 4;
  vm.runInContext(source.slice(start, end), ctx);
}
vm.runInContext("globalThis.patrolRouteState = { current: [...PATROL_ROUTE_DEFAULT_CURRENT], reserve: [...PATROL_ROUTE_DEFAULT_RESERVE] };", ctx);
for (const [value, basic, monster, boss] of [[0,2,4,0],[20,2,4,0],[40,1,5,0],[60,1,5,0],[80,0,5,1],[100,0,5,1]]) {
  ctx.contamination = value;
  const pool = vm.runInContext("createPool()", ctx);
  const counts = id => pool.filter(tile => tile.id === id).length;
  assert.equal(pool.length, 24);
  assert.equal(pool.filter(Boolean).length, 24, "no sparse holes");
  assert.equal(counts("basic"), basic);
  assert.equal(counts("monster"), monster);
  assert.equal(counts("boss"), boss);
  assert.equal(counts("swamp"), 1);
  assert.equal(pool[0].id, "fortune-teller-camp");
  assert.equal(pool[8].id, "village");
  assert.equal(pool[15].id, "home");
  if(boss) assert.equal(pool[23].id, "boss");
  ctx.pool = pool;
  assert.equal(vm.runInContext("hasValidMapDistribution(pool)", ctx), true);
  ctx.badPool = pool.slice(1);
  assert.equal(vm.runInContext("hasValidMapDistribution(badPool)", ctx), false);
  ctx.badPool = pool.slice(); ctx.badPool[8] = {id:"basic"};
  assert.equal(vm.runInContext("hasValidMapDistribution(badPool)", ctx), false);
}
// Replacing both editable basic tiles with monsters must never recreate basic tiles.
vm.runInContext('patrolRouteState.current[0] = "monster"; patrolRouteState.current[1] = "monster";',ctx);
for (const value of [0,40,80]) {
  ctx.contamination=value;
  const pool=vm.runInContext("createPool()",ctx);
  assert.equal(pool.length,24);
  assert.equal(pool.filter(tile=>tile.id==="basic").length,0);
}
require("./scripts/assert-linked-cache")(fs.readFileSync("v2-map-practice.html","utf8"), fs.readFileSync("service-worker.js","utf8"), ["v2-map-practice.js"]);
console.log("PASS: real map generator, stage counts, patrol swaps, fixed positions and invalid pools");
