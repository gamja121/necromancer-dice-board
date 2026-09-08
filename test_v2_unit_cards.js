const assert = require('assert');
function node() { return { children:[],dataset:{},style:{},classList:{add(){},toggle(){}},setAttribute(){},append(...v){this.children.push(...v)},replaceChildren(){this.children=[]},addEventListener(t,f){this[t]=f},querySelector(){return this.children[0]} }; }
global.document = {createElement:node};
const api = require('./v2-unit-cards');
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
assert.equal(field.children.length,1);
assert.equal(field.children[0].children[0].children.length,39);
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
units[0]={...units[0],slug:'guardian-seed'};
api.sync(field,units,u=>selected=u);
assert.equal(field.children.length,1);
assert.equal(units[0].infoCard.children[0].children[0].src,'fallback.png');
units[0].infoCard.click(); assert.equal(selected,units[0]);
console.log('PASS: five card mappings, exact unit clicks, fallback and replacement');
