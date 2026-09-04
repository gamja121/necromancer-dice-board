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
  const biteCrops=[];
  assert(fs.existsSync(api.EFFECTS.bite.sheet));
  api.buildFrames({naturalWidth:1280,naturalHeight:575},{createElement(){return {
    getContext(){return {drawImage(image,...args){biteCrops.push(args);},getImageData(){return {data:new Uint8ClampedArray(220*220*4)};},putImageData(){}};},
    toDataURL(){assert.equal(this.width,220);assert.equal(this.height,220);return 'bite';}
  };}},'bite');
  assert.equal(biteCrops.length,6);
  biteCrops.forEach((crop,i)=>{const start=[10,190,390,590,790,970][i],w=[180,200,200,200,180,160][i],center=[110,290,490,690,870,1050][i];assert.deepEqual(crop,[start,0,w,200,110+start-center,0,w,200]);});
  const musicCrops=[];
  assert(fs.existsSync(api.EFFECTS.music.sheet));
  api.buildFrames({naturalWidth:1280,naturalHeight:575},{createElement(){return {
    getContext(){return {drawImage(image,...args){musicCrops.push(args);},getImageData(){return {data:new Uint8ClampedArray(200*200*4)};},putImageData(){}};},
    toDataURL(){assert.equal(this.width,200);assert.equal(this.height,200);return 'music';}
  };}},'music');
  assert.equal(musicCrops.length,8);
  musicCrops.forEach((crop,i)=>{const start=[0,160,320,480,656,800,960,1120][i],w=[160,160,160,176,144,160,160,160][i];assert.deepEqual(crop,[start,150,w,200,20+start-i*160,0,w,200]);});
  const notes=new Uint8ClampedArray([24,203,13,255,245,220,70,255,65,203,60,255]);
  api.keyGreen(notes,true,api.EFFECTS.music.background);
  assert.equal(notes[3],0);assert.equal(notes[7],255);assert(notes[11]>0);
  const windCrops=[];
  assert(fs.existsSync(api.EFFECTS.wind.sheet));
  api.buildFrames({naturalWidth:1280,naturalHeight:575},{createElement(){return {
    getContext(){return {drawImage(image,...args){windCrops.push(args);},getImageData(){return {data:new Uint8ClampedArray(180*180*4)};},putImageData(){}};},
    toDataURL(){assert.equal(this.width,180);assert.equal(this.height,180);return 'wind';}
  };}},'wind');
  assert.equal(windCrops.length,8);
  windCrops.forEach((crop,i)=>assert.deepEqual(crop,[i*160,0,160,180,10,0,160,180],'Wind uses first row only'));
  const windPixels=new Uint8ClampedArray([43,210,6,255,230,240,245,255,80,210,65,255]);
  api.keyGreen(windPixels,true,api.EFFECTS.wind.background);
  assert.equal(windPixels[3],0);
  assert.deepEqual([...windPixels.slice(4,8)],[230,240,245,255]);
  assert(windPixels[11]>0,'Fading wind remains visible');
  const poisonCrops=[];
  assert(fs.existsSync(api.EFFECTS.poison.sheet));
  api.buildFrames({naturalWidth:1280,naturalHeight:575},{createElement(){return {
    getContext(){return {drawImage(image,...args){poisonCrops.push(args);},getImageData(){return {data:new Uint8ClampedArray(180*180*4)};},putImageData(){}};},
    toDataURL(){assert.equal(this.width,180);assert.equal(this.height,180);return 'poison';}
  };}},'poison');
  assert.equal(poisonCrops.length,8);
  poisonCrops.forEach((crop,i)=>assert.deepEqual(crop,[i*160,200,160,180,10,0,160,180],'Poison uses middle row only'));
  const gas=new Uint8ClampedArray([33,217,7,255,32,216,6,255,40,110,45,255,180,225,70,255]);
  api.keyPoison(gas);
  assert.equal(gas[3],0);assert.equal(gas[7],0);
  assert.deepEqual([...gas.slice(8)],[40,110,45,255,180,225,70,255]);
  const magicCrops=[];
  assert(fs.existsSync(api.EFFECTS.magic.sheet));
  api.buildFrames({naturalWidth:1280,naturalHeight:575},{createElement(){return {
    getContext(){return {drawImage(image,...args){magicCrops.push(args);},getImageData(){return {data:new Uint8ClampedArray(160*160*4)};},putImageData(){}};},
    toDataURL(){assert.equal(this.width,160);assert.equal(this.height,160);return 'magic';}
  };}},'magic');
  assert.equal(magicCrops.length,8);
  magicCrops.forEach((crop,i)=>assert.deepEqual(crop,[i*160,0,160,160,0,0,160,160],'Magic uses first row only'));
  const purple=new Uint8ClampedArray([40,12,70,255,10,5,20,255,0,210,0,255]);
  api.keyGreen(purple);
  assert.deepEqual([...purple.slice(0,8)],[40,12,70,255,10,5,20,255]);
  assert.equal(purple[11],0);
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
  let fail = false, calls = 0, scrolls = 0;
  get('#motionStage').scrollIntoView = options => { assert.equal(options.behavior,'instant'); assert.equal(options.block,'start'); scrolls++; };
  const html=fs.readFileSync('v2-animation-practice.html','utf8');
  assert(html.includes('id="effectSelect"'));
  assert(!html.includes('id="clawEffectBtn"'),'Old long button list is removed');
  for(const id of Object.keys(api.EFFECTS)) assert(html.includes(`value="${id}"`));
  vm.runInNewContext(fs.readFileSync('v2-animation-practice.js','utf8'),{
    console:{error(){}},URLSearchParams,window:{location:{search:''}},
    document:{querySelector:get,querySelectorAll:()=>[]},
    Image:class {set src(v){queueMicrotask(()=>this.onload());}},
    setTimeout:fn=>queueMicrotask(fn),
    V2HitEffects:{EFFECTS:api.EFFECTS,async prepare(id){calls++; if(fail) throw Error('test'); return id === 'bite' ? effects.slice(0,6).map(x=>'bite-'+x) : id !== 'physical' ? effects.map(x=>id+'-'+x) : effects;}}
  });
  await new Promise(setImmediate);
  const click=()=>get('#hitEffectBtn').handlers.click();
  unitFrames.length=0;
  const playing=click(); await click(); await playing;
  assert.equal(calls,1,'Double click is ignored');
  assert.equal(scrolls,1,'Scroll to stage before effect playback, once per accepted click');
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
  get('#effectSelect').value='claw';
  await click();
  assert.deepEqual(shown,effects.map(x=>'claw-'+x));
  assert.equal(get('#motionStatus').textContent,'손톱공격 테스트 완료');
  shown.length=0;
  get('#effectSelect').value='slash';
  await click();
  assert.deepEqual(shown,effects.map(x=>'slash-'+x));
  assert.equal(get('#motionStatus').textContent,'베기 테스트 완료');
  shown.length=0;
  get('#effectSelect').value='magic';
  await click();
  assert.deepEqual(shown,effects.map(x=>'magic-'+x));
  assert.equal(get('#motionStatus').textContent,'마법 공격 테스트 완료');
  assert.equal(get('#effectSelect').disabled,false);
  shown.length=0;
  get('#effectSelect').value='poison';
  await click();
  assert.deepEqual(shown,effects.map(x=>'poison-'+x));
  assert.equal(get('#motionStatus').textContent,'독가스 공격 테스트 완료');
  assert.equal(get('#effectSelect').disabled,false);
  shown.length=0;
  get('#effectSelect').value='wind';
  await click();
  assert.deepEqual(shown,effects.map(x=>'wind-'+x));
  assert.equal(get('#motionStatus').textContent,'바람공격 테스트 완료');
  assert.equal(get('#effectSelect').disabled,false);
  shown.length=0;
  get('#effectSelect').value='music';
  await click();
  assert.deepEqual(shown,effects.map(x=>'music-'+x));
  assert.equal(get('#motionStatus').textContent,'음표공격 테스트 완료');
  assert.equal(get('#effectSelect').disabled,false);
  shown.length=0;
  get('#effectSelect').value='bite';
  await click();
  assert.deepEqual(shown,effects.slice(0,6).map(x=>'bite-'+x));
  assert.equal(get('#motionStatus').textContent,'깨무는 공격 테스트 완료');
  assert.equal(get('#effectSelect').disabled,false);
  assert(get('#hitEffectSprite').hidden);
  console.log('PASS: impact crop centers, transparency, hit synchronization, double-click guard, failure/retry and reset.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
