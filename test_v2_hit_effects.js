const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const api = require('./v2-hit-effects');
assert(fs.existsSync(api.SHEET));
const pixels = new Uint8ClampedArray([0,210,0,255,255,240,80,255,255,255,240,255]);
api.keyGreen(pixels);
assert.equal(pixels[3],0);
assert.deepEqual([...pixels.slice(4)],[255,240,80,255,255,255,240,255]);
const faint = new Uint8ClampedArray([0,210,0,255,50,210,20,255]);
api.keyGreen(faint,true);
assert.equal(faint[3],0);
assert.equal(faint[7],50,'Faint claw trails survive green removal');
const crops = [];
const effects = api.buildFrames({naturalWidth:1280,naturalHeight:575}, {createElement() {
  return {getContext() { return {
    drawImage(image,...args) { crops.push(args); },
    getImageData() { return {data:new Uint8ClampedArray(128*128*4)}; }, putImageData() {}
  }; }, toDataURL() { assert.equal(this.width,128); assert.equal(this.height,128); return 'effect-'+crops.length; }};
}});
assert.equal(effects.length,8);
crops.forEach((crop,i)=>assert.deepEqual(crop,[api.CENTERS[i]-64,1,128,128,0,0,128,128]));
const clawCrops = [];
assert(fs.existsSync(api.EFFECTS.claw.sheet));
api.buildFrames({naturalWidth:1280,naturalHeight:575},{createElement(){return {
  getContext(){return {
    drawImage(image,...args){clawCrops.push(args);},
    getImageData(){return {data:new Uint8ClampedArray(256*256*4)};},putImageData(){}
  };},toDataURL(){assert.equal(this.width,256);assert.equal(this.height,256);return 'claw';}
};}},'claw');
assert.equal(clawCrops.length,8);
clawCrops.forEach((crop,i)=>assert.deepEqual(crop,[i*160,0,160,256,48,0,160,256],'Only top-row frames, at original scale'));
async function main() {
  const slashCrops=[];
  assert(fs.existsSync(api.EFFECTS.slash.sheet));
  api.buildFrames({naturalWidth:1280,naturalHeight:575},{createElement(){return {
    getContext(){return {drawImage(image,...args){slashCrops.push(args);},getImageData(){return {data:new Uint8ClampedArray(288*288*4)};},putImageData(){}};},
    toDataURL(){assert.equal(this.width,288);return 'slash';}
  };}},'slash');
  assert.equal(slashCrops.length,8);
  slashCrops.forEach((crop,i)=>assert.deepEqual(crop,[i*160,i===7?0:288,160,287,64,0,160,287]));
  const green=new Uint8ClampedArray([43,213,8,255,45,212,8,255,90,213,20,255]);
  api.keyGreen(green,true,api.EFFECTS.slash.background);
  assert.equal(green[3],0);assert.equal(green[7],0);assert(green[11]>0);
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
    V2HitEffects:{EFFECTS:api.EFFECTS,async prepare(id){calls++; if(fail) throw Error('test'); return id !== 'physical' ? effects.map(x=>id+'-'+x) : effects;}}
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
  shown.length=0;
  await get('#clawEffectBtn').handlers.click();
  assert.deepEqual(shown,effects.map(x=>'claw-'+x));
  assert.equal(get('#motionStatus').textContent,'손톱공격 테스트 완료');
  shown.length=0;
  await get('#slashEffectBtn').handlers.click();
  assert.deepEqual(shown,effects.map(x=>'slash-'+x));
  assert.equal(get('#motionStatus').textContent,'베기 테스트 완료');
  assert(get('#hitEffectSprite').hidden);
  console.log('PASS: impact crop centers, transparency, hit synchronization, double-click guard, failure/retry and reset.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
