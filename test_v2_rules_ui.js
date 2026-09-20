'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const nodes=new Map();
function node(){const children=new Map();const n={style:{setProperty(){}},dataset:{},attrs:{},listeners:{},children:[],hidden:false,textContent:'',innerHTML:'',classList:{values:new Set(),add(...s){s.forEach(x=>this.values.add(x));},remove(...s){s.forEach(x=>this.values.delete(x));},toggle(s,v){if(v)this.values.add(s);else this.values.delete(s);},contains(s){return this.values.has(s);}},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},addEventListener(k,v){this.listeners[k]=v;},append(...a){this.children.push(...a);},replaceChildren(...a){this.children=a;},replaceWith(){},remove(){},focus(){},querySelector(k){if(!children.has(k))children.set(k,node());return children.get(k);},querySelectorAll(){return [];}};return n;}
const savedValues=new Map();
const context={console,URLSearchParams,location:{search:''},navigator:{},localStorage:{getItem:k=>savedValues.get(k)||null,setItem:(k,v)=>savedValues.set(k,v)},Image:class{},requestAnimationFrame(){},setTimeout(fn){fn();},clearTimeout(){},document:{getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},createElement:node},window:{addEventListener(){}}};
context.UNIT_TYPES=require('./unit-data').UNIT_TYPES;context.V2DesignData=require('./v2-design-data');context.V2Rules=require('./v2-rules');context.V2Legions=require('./v2-legions');context.V2SummonRules=require('./v2-summon-rules');
context.V2SummonEffect={prepare:async()=>null};
let source=fs.readFileSync('v2-auto-battle-practice.js','utf8');
assert(source.includes('if (outcome.miss) V2DamageDigits.showLabel(target, "miss")'));
assert(source.includes('event.type === "heal" && event.source === "skeleton"'));
assert(source.includes('undeadHealing.forEach(event => showHealing(event.unit, event.amount))'));
assert(source.includes('const hitAmounts = outcome.hits.length ? outcome.hits'));
assert(source.includes('for (let hitIndex = 0; hitIndex < hitAmounts.length; hitIndex += 1)'));
assert(source.includes('showDamage(target, hitAmount)'));
assert(source.includes('V2Rules.pickTarget(rulesState, actor.team === "ally" ? "enemy" : "ally")'));
assert(source.includes('V2Sfx.play("diceTick"'));assert(source.includes('V2Sfx.play("diceLand"'));assert(source.includes('V2Sfx.play("attack"'));assert(source.includes('V2Sfx.play("hit"'));
// Test-only access to the actual controller; no debug hook is shipped.
source=source.replace('  resetBattle(true);','  globalThis.testUI={resetBattle,openUnitInfo,startTurn,performAttack,finishBattle,makeState,toggleRosterUnit,renderRosterSelection,roster:ROSTER,get selectedDeck(){return [...selectedAllySlugs];},get units(){return units;},get state(){return rulesState;},get token(){return battleToken;},ready(){running=true; awaitingRoll=true;},setRoll(n){lastDiceRoll=n;},get queue(){return turnQueue;}};\n  resetBattle(true);');
vm.createContext(context);vm.runInContext(source,context);
const ui=context.testUI;
assert.equal(ui.roster.length,45);
assert.equal(nodes.get('unitRoster').children.length,10);
for(const slug of ['death-knight','skeleton-spear','ghoul','ancient-treant'])ui.toggleRosterUnit(slug);
assert.equal(JSON.stringify(ui.selectedDeck),JSON.stringify(['death-knight','skeleton-spear','ghoul','ancient-treant']));
assert.equal(nodes.get('selectedLineup').children.length,4);assert(nodes.get('selectedLineup').children.every(slot=>slot.children[0]?.src?.includes('unit-card-')));
assert.equal(nodes.get('startButton').disabled,false);
for(const data of ui.roster){
 const u=ui.makeState(data,'ally',0);assert.equal(u.name,context.V2DesignData.units[u.slug].name);assert(u.brands.every(context.V2Rules.validateBrand));
 ui.ready();ui.openUnitInfo(u);assert.equal(nodes.get('unitInfoHp').textContent,`${u.hp} / ${u.maxHp}`);
 assert(!nodes.get('unitInfoBrands').innerHTML.includes('축복 ['));assert(nodes.get('legionInfoContent').innerHTML.includes('패시브 효과'));
 for(const kind of ['attack','hit','death'])for(let i=1;i<=data.frames[kind];i++){
  const special=['goblin-soldier','ice-princess','bone-golem','abyss-harpy','hydra','bone-hound','scorpion-knight','hell-mantis'];if(special.includes(data.slug))continue;
  const number=data.frameNumbers?.[kind]?.[i-1]||i;
  assert(fs.existsSync(`art/v2-style/animation-test-frames/${data.slug}/${kind}-${String(number).padStart(2,'0')}.png`));
 }
}
const a=ui.units[0];a.brands=[{type:'critical',bless:[4],curse:[1]},{type:'critical',bless:[4],curse:[6]},{type:'counter',bless:[2],curse:[3]}];
ui.openUnitInfo(a);assert.equal((nodes.get('unitInfoBrands').innerHTML.match(/class="brand-heading"/g)||[]).length,3);assert(nodes.get('legionInfoContent').innerHTML.includes('저주 [6]'));
assert(nodes.get('unitInfoBrands').innerHTML.includes('brand-icons-extra-sheet.jpg'));
(async()=>{
 a.brands=[{type:'combo',bless:[4],curse:[1]}];
 ui.ready();ui.setRoll(4);await ui.startTurn();assert.equal(ui.state.round,1);assert(ui.queue.length>=8);
 await ui.performAttack(a,ui.token);
 const comboDigits=ui.units.filter(unitState=>unitState.team==='enemy').flatMap(unitState=>unitState.element.querySelector('.sprite-wrap').children).filter(child=>child.className==='damage-number');
 assert.equal(comboDigits.length,2,'Combo blessing must render one damage number for each strike');
 a.brands=[{type:'critical',bless:[4],curse:[1]},{type:'critical',bless:[4],curse:[6]},{type:'counter',bless:[2],curse:[3]}];
 for(const actor of [...ui.queue]){if(actor!==a&&actor.alive)await ui.performAttack(actor,ui.token);}
 assert(ui.units.every(u=>u.hp>=0&&u.alive===(u.hp>0)));
 const saved=JSON.parse(savedValues.get('necromancer-v2-battle-v1'));assert.equal(saved.state.round,1);assert(saved.state.units.every(u=>u.alive===(u.hp>0)));assert(saved.state.units[0].brands.length===3);
 const html=fs.readFileSync('v2-auto-battle-practice.html','utf8');assert(html.includes('>효과 정보</h2>'));assert(!html.includes('>기본 정보</h3>'));
 assert(html.includes('battle-deck-selection-board.png'));assert(html.includes('선택 가능한 마물 카드 10장'));
 assert(source.includes('const TEST_DECK_SLUGS = Object.freeze(['));assert(source.includes('selectedAllySlugs.length === 4'));
 assert(source.includes('unit-card-${entry.slug}.png?v=19'));assert.equal((source.match(/"death-knight", "skeleton-spear", "ghoul", "ancient-treant", "goblin-rider"/g)||[]).length,1);
 assert(html.indexOf('v2-rules.js')<html.indexOf('v2-auto-battle-practice.js'));
 console.log('PASS: actual UI controller, 45 roster entries, 3-slot info, new icons, real round/attack handlers');
})().catch(e=>{console.error(e);process.exitCode=1;});
