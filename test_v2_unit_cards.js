const assert = require('assert');
function node() { return { children:[],dataset:{},style:{},classList:{add(){},toggle(){}},setAttribute(){},append(...v){this.children.push(...v)},replaceChildren(){this.children=[]},addEventListener(t,f){this[t]=f},querySelector(){return this.children[0]} }; }
global.document = {createElement:node};
const api = require('./v2-unit-cards');
for (const slug of ['corpse-slime','minotaur','plague-frog','ice-lord','yeti','goblin-commoner','sea-wolf','grave-priest','abyss-eye','doom-executor','death-knight','hell-mantis','scorpion-knight','ancient-treant','stone-golem']) {
  assert(api.ART.includes(slug));
  assert(api.CUTOUT_ART.has(slug));
  const cutout = require('path').join(__dirname, 'art/v2-style/ui/unit-card-' + slug + '.png');
  assert(require('fs').existsSync(cutout));
  const png = require('fs').readFileSync(cutout);
  assert.equal(png.readUInt32BE(16), 740);
  assert.equal(png.readUInt32BE(20), 1080);
  assert.equal(png[25], 6);
}
for (const slug of ['guardian-seed','plague-doctor','ghoul','goblin-chief','goblin-soldier']) {
  assert(api.ART.includes(slug));
  assert(api.CUTOUT_ART.has(slug));
  const cutout = require('path').join(__dirname, 'art/v2-style/ui/unit-card-' + slug + '.png');
  assert(require('fs').existsSync(cutout));
  const png = require('fs').readFileSync(cutout);
  assert.equal(png.readUInt32BE(16), 740);
  assert.equal(png.readUInt32BE(20), 1080);
  assert.equal(png[25], 6);
}
assert(api.ART.includes('ghoul'));
assert(api.ART.includes('goblin-chief'));
for (const slug of ['bone-golem','forest-fairy','flesh-golem','hydra','ice-princess']) {
  assert(api.ART.includes(slug));
  assert(require('fs').existsSync(require('path').join(__dirname, 'art/v2-style/ui/unit-card-' + slug + '.jpg')));
}
for (const slug of ['ancient-treant','stone-golem','kraken','crystal-devourer','skeleton-spear']) assert(api.ART.includes(slug));
const field=node(); let selected;
const units=api.ART.map((slug,slot)=>({slug,slot,team:'ally',name:slug,alive:true,hp:8,maxHp:8,portrait:'fallback.png'}));
api.sync(field,units,u=>selected=u);
assert(units.every(u=>u.infoCard.disabled));
units[0].infoCard.click(); assert.equal(selected,undefined);
api.setPhase('ready');
assert.equal(field.children.length,1);
assert.equal(field.children[0].children[0].children.length,api.ART.length);
assert(api.ART.includes('yeti'));
assert(require('fs').existsSync(require('path').join(__dirname,'art/v2-style/ui/unit-card-yeti.jpg')));
for (const slug of ['mimic','bone-hound','soul-reaper','siren','grave-worm']) {
  assert(api.ART.includes(slug));
  assert(require('fs').existsSync(require('path').join(__dirname, 'art/v2-style/ui/unit-card-' + slug + '.jpg')));
}
assert.equal(new Set(api.ART).size, api.ART.length);
for (const slug of ['mushroom-soldier','goblin-rider','orc-warrior','abyss-harpy','boulder-ogre']) {
  assert(api.ART.includes(slug));
  assert(require('fs').existsSync(require('path').join(__dirname, 'art/v2-style/ui/unit-card-' + slug + '.jpg')));
}
for (const slug of ['skeleton-archer','skeleton-cavalry','spider-knight','raging-treant','cerberus']) {
  assert(api.ART.includes(slug));
  assert(require('fs').existsSync(require('path').join(__dirname, 'art/v2-style/ui/unit-card-' + slug + '.jpg')));
}
units.forEach(u=>assert.equal(u.infoCard.children.length,1));
units.forEach(u=>{u.infoCard.click();assert.equal(selected,u);assert(u.infoCard.children[0].style.backgroundImage.includes(u.slug));});
for (const slug of ['goblin-commoner','guardian-seed','spiderling']) {
  assert(api.ART.includes(slug));
  assert(require('fs').existsSync(require('path').join(__dirname,'art/v2-style/ui/unit-card-'+slug+'.jpg')));
}
units[0]={...units[0],slug:'guardian-seed'};
api.sync(field,units,u=>selected=u);
assert.equal(field.children.length,1);
assert(units[0].infoCard.children[0].style.backgroundImage.includes('unit-card-guardian-seed.png?v=13'));
assert.equal(units[0].infoCard.children[0].children.length,0);
units[0].infoCard.click(); assert.equal(selected,units[0]);
api.setPhase('acting'); assert(units.every(u=>u.infoCard.disabled));
api.setPhase('ready'); assert(units.every(u=>!u.infoCard.disabled));
const enemies=[3,1,4,0,2].map(slot=>({slug:'enemy'+slot,slot,team:'enemy',alive:true,hp:1,maxHp:1}));
api.sync(field,enemies,()=>{});
assert.deepEqual(field.children[0].children[1].children.map(b=>b.dataset.unit),['enemy4','enemy0','enemy1','enemy2','enemy3']);
console.log('PASS: regular and summoned card mappings, exact unit clicks and replacement');
