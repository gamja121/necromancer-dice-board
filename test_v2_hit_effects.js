const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const api = require('./v2-hit-effects');
assert(fs.existsSync(api.SHEET));
const pixels = new Uint8ClampedArray([0,210,0,255,255,240,80,255,255,255,240,255]);
api.keyGreen(pixels);
assert.equal(pixels[3],0);
assert.deepEqual([...pixels.slice(4)],[255,240,80,255,255,255,240,255]);
const crops = [];
const effects = api.buildFrames({naturalWidth:1280,naturalHeight:575}, {createElement() {
  return {getContext() { return {
    drawImage(image,...args) { crops.push(args); },
    getImageData() { return {data:new Uint8ClampedArray(128*128*4)}; }, putImageData() {}
  }; }, toDataURL() { assert.equal(this.width,128); assert.equal(this.height,128); return 'effect-'+crops.length; }};
}});
assert.equal(effects.length,8);
crops.forEach((crop,i)=>assert.deepEqual(crop,[api.CENTERS[i]-64,1,128,128,0,0,128,128]));
async function main() {
  const elements = new Map(), shown = [], unitFrames = [];
  const get = id => {
    if (!elements.has(id)) {
      const el = {disabled:true,hidden:true,style:{},dataset:{},handlers:{},addEventListener(k,f){this.handlers[k]=f;}};
      if (id === '#hitEffectSprite' || id === '#unitSprite') Object.defineProperty(el,'src',{set(v){(id === '#hitEffectSprite' ? shown : unitFrames).push(v);}});
      elements.set(id,el);
    }
    return elements.get(id);
  };
  let fail = false, calls = 0;
  vm.runInNewContext(fs.readFileSync('v2-animation-practice.js','utf8'),{
    console:{error(){}},URLSearchParams,window:{location:{search:''}},
    document:{querySelector:get,querySelectorAll:()=>[]},
    Image:class {set src(v){queueMicrotask(()=>this.onload());}},
    setTimeout:fn=>queueMicrotask(fn),
    V2HitEffects:{async prepare(){calls++; if(fail) throw Error('test'); return effects;}}
  });
  await new Promise(setImmediate);
  const click=()=>get('#hitEffectBtn').handlers.click();
  unitFrames.length=0;
  const playing=click(); await click(); await playing;
  assert.equal(calls,1,'Double click is ignored');
  assert.deepEqual(shown,effects);
  assert.equal(unitFrames.filter(x=>x.includes('/hit-')).length,4);
  assert(get('#hitEffectSprite').hidden);
  assert.equal(get('#attackBtn').disabled,false);
  fail=true; await click();
  assert(get('#motionStatus').textContent.includes('다시'));
  assert.equal(get('#hitEffectBtn').disabled,false);
  fail=false;
  const cancelled=click(); get('#resetBtn').handlers.click(); await cancelled;
  assert(get('#hitEffectSprite').hidden);
  assert(get('#motionStatus').textContent.includes('돌아왔습니다'));
  shown.length=0; await click(); assert.deepEqual(shown,effects);
  console.log('PASS: impact crop centers, transparency, hit synchronization, double-click guard, failure/retry and reset.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
