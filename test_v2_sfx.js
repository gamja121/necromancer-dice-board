'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const played=[];
class MockAudio{
 constructor(src){this.src=src;this.preload='';}
 cloneNode(){const sound={src:this.src,volume:1,playbackRate:1,play(){played.push({src:this.src,volume:this.volume,rate:this.playbackRate});return Promise.resolve();}};return sound;}
}
const context={Audio:MockAudio,Blob,URL,localStorage:{getItem(){return JSON.stringify({musicMuted:false,sfxVolume:.8});}},window:{setTimeout(fn){fn();}}};
vm.createContext(context);vm.runInContext(fs.readFileSync('v2-sfx.js','utf8'),context);
context.V2Sfx.preload();
assert.equal(Object.keys(context.V2Sfx.sources).length,5);
assert(context.V2Sfx.play('diceTick',{rate:1.2}));assert(context.V2Sfx.play('move',{rate:.9}));assert(context.V2Sfx.play('attack'));assert(context.V2Sfx.play('hit',{volume:1.2}));
assert.equal(played.length,4);assert(played[0].src.endsWith('dice-tick.ogg'));assert.equal(played[0].rate,1.2);assert(played.every(event=>event.volume>0&&event.volume<=1));
assert(context.V2Sfx.play('attack',{variant:'B'}));assert(context.V2Sfx.play('attack',{variant:'G'}));assert(context.V2Sfx.play('hit',{variant:'E'}));assert(context.V2Sfx.play('hit',{variant:'K'}));
assert(played[4].src.endsWith('claw.ogg'));assert(played[5].src.startsWith('blob:'));assert(played[6].src.endsWith('death.ogg'));assert(played[7].src.startsWith('blob:'));
const source=fs.readFileSync('v2-sfx.js','utf8');assert(source.includes('document.addEventListener("pointerdown", unlock'));assert(!source.includes('current.muted'));
const battle=fs.readFileSync('v2-auto-battle-practice.js','utf8');
for(const contract of ['physical: Object.freeze({ attack: "G", hit: "G" })','poison: Object.freeze({ attack: "B", hit: "E" })','music: Object.freeze({ attack: "B", hit: "E" })','slash: Object.freeze({ attack: "D", hit: "K" })','bite: Object.freeze({ attack: "E", hit: "K" })','claw: Object.freeze({ attack: "E", hit: "K" })','wind: Object.freeze({ attack: "G", hit: "K" })','arrow: Object.freeze({ attack: "K", hit: "J" })'])assert(battle.includes(contract),contract);
assert(battle.includes('actor.slug === "skeleton-archer"')&&battle.includes('variant: soundProfile.attack')&&battle.includes('variant: soundProfile.hit'));
console.log('PASS: V2 map and battle sound effects preload, settings volume, pitch, and playback');
