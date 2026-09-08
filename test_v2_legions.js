const assert=require('assert');
const L=require('./v2-legions');
const unit=(team,legions,extra={})=>({team,legions:[].concat(legions),isSummon:false,alive:true,maxHp:5,hp:4,attack:2,speed:5,...extra});

let units=[unit('ally','skeleton'),unit('ally','skeleton'),unit('ally',['skeleton','plant']),unit('ally','plant'),unit('enemy','demon'),unit('enemy','demon'),unit('enemy','demon')];
let state=L.create(units,()=>0);
L.applyOpening(state,units);
assert(L.active(state,'ally','skeleton'));assert(L.active(state,'ally','plant'));
assert.equal(units[0].maxHp,6);assert.equal(units[0].speed,3);
assert.equal(L.afterAction(state,units[0]),1);assert.equal(units[0].hp,6);

units=[unit('ally','beast'),unit('ally','beast'),unit('ally','beast'),unit('enemy','corpse')];
state=L.create(units,()=>.24);
assert.equal(L.beforeAttack(state,units[0],units[3]).powerMultiplier,2);
state.random=()=>.25;assert.equal(L.beforeAttack(state,units[0],units[3]).powerMultiplier,1);

units=[unit('ally','plague'),unit('ally','plague'),unit('ally',['plague','ice']),unit('ally','ice'),unit('ally','ice'),unit('enemy','corpse')];
state=L.create(units,()=>.29);
let applied=L.afterAttack(state,units[2],units[5],{damage:1});
assert(applied.poison&&applied.frozen);assert.equal(units[5].poison,1);assert(L.consumeFreeze(units[5]));

units=[unit('ally','summon'),unit('ally','summon'),unit('ally','insect'),unit('ally','insect'),unit('enemy','corpse')];
state=L.create(units);L.applyOpening(state,units);
assert.equal(units[0].attack,3);
const summoned=unit('ally','summon',{isSummon:true,hp:2,maxHp:2,attack:1});L.applyUnit(state,summoned);
assert.deepEqual([summoned.hp,summoned.maxHp,summoned.attack],[5,5,3]);

units=[unit('ally','element'),unit('ally','element'),unit('ally','element'),unit('ally','element'),unit('enemy','corpse')];
state=L.create(units,()=>0);L.startTurn(state,units);
assert.equal(units.filter(u=>u.elementImmune).length,1);
units.slice(1,3).forEach(u=>u.alive=false);L.startTurn(state,units);assert.equal(units.filter(u=>u.elementImmune).length,1);
units[3].alive=false;L.startTurn(state,units);assert.equal(units.filter(u=>u.elementImmune).length,0);

units=[unit('ally','corpse'),unit('ally','corpse'),unit('enemy','beast')];state=L.create(units);
assert.equal(L.captureAttempts(state,'ally'),2);assert.equal(L.captureAttempts(state,'enemy'),1);
assert.equal(Object.keys(L.RULES).length,10);
console.log('PASS: all ten legion thresholds and battle effects');
