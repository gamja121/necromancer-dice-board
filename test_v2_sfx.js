'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const played=[];
class MockAudio{
 constructor(src){this.src=src;this.preload='';}
 cloneNode(){const sound={src:this.src,volume:1,playbackRate:1,play(){played.push({src:this.src,volume:this.volume,rate:this.playbackRate});return Promise.resolve();}};return sound;}
}
const context={Audio:MockAudio,localStorage:{getItem(){return JSON.stringify({musicMuted:false,sfxVolume:.8});}},window:{setTimeout(fn){fn();}}};
vm.createContext(context);vm.runInContext(fs.readFileSync('v2-sfx.js','utf8'),context);
context.V2Sfx.preload();
assert.equal(Object.keys(context.V2Sfx.sources).length,5);
assert(context.V2Sfx.play('diceTick',{rate:1.2}));assert(context.V2Sfx.play('move',{rate:.9}));assert(context.V2Sfx.play('attack'));assert(context.V2Sfx.play('hit',{volume:1.2}));
assert.equal(played.length,4);assert(played[0].src.endsWith('dice-tick.ogg'));assert.equal(played[0].rate,1.2);assert(played.every(event=>event.volume>0&&event.volume<=1));
console.log('PASS: V2 map and battle sound effects preload, settings volume, pitch, and playback');
