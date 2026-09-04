(function(root) {
  "use strict";
  const shared = typeof module !== "undefined" && module.exports ? require("./v2-mantis-frames.js") : root.V2MantisFrames;
  const SHEET = "art/v2-style/animation-sheets/green-raw/goblin-soldier-1.jpg";
  const SECOND_SHEET = "art/v2-style/animation-sheets/green-raw/goblin-soldier-2.jpg";
  const THIRD_SHEET = "art/v2-style/animation-sheets/green-raw/goblin-soldier-3.jpg";
  const FIRST_ROWS = {
    attack: { edges:[140,318,526,774,988,1200], top:2, bottom:206 },
    death: { edges:[300,478,666], top:420, bottom:575 }
  };
  const SECOND_ROWS = {
    hit: { edges:[140,318,516,732,886], top:210, bottom:400 },
    death: { edges:[880,1070], top:462, bottom:575 }
  };
  const THIRD_ROWS = { death: { edges:[880,1070], top:462, bottom:575 } };
  const ATTACK_ORDER = [5,2,3,4,2,5];
  function buildFrames(image,document,second,third) {
    const options={sourceHeight:575,mirrored:()=>false,allowSourceEdge:true};
    const a=shared.buildFrames(image,document,{...options,rows:FIRST_ROWS});
    const b=shared.buildFrames(second,document,{...options,rows:SECOND_ROWS});
    const c=shared.buildFrames(third,document,{...options,rows:THIRD_ROWS});
    return { attack:ATTACK_ORDER.map(n=>a.attack[n-1]), hit:b.hit,
      death:[a.attack[4],a.death[0],a.death[1],b.death[0],c.death[0]], idle:a.attack[4] };
  }
  let cached;
  function prepare() {
    function load(src) { return new Promise((resolve,reject)=>{
      const image=new root.Image(); image.onload=()=>resolve(image); image.onerror=()=>reject(new Error("Goblin sheet failed: "+src)); image.src=src;
    }); }
    if (!cached) cached=Promise.all([load(SHEET),load(SECOND_SHEET),load(THIRD_SHEET)]).then(([a,b,c])=>buildFrames(a,root.document,b,c)).catch(error=>{cached=null;throw error;});
    return cached;
  }
  const api={SHEET,SECOND_SHEET,THIRD_SHEET,FIRST_ROWS,SECOND_ROWS,THIRD_ROWS,ATTACK_ORDER,keyMagenta:shared.keyMagenta,buildFrames,prepare};
  if(typeof module!=="undefined"&&module.exports) module.exports=api; else root.V2GoblinFrames=api;
})(globalThis);
