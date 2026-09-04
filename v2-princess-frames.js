(function(root) {
  "use strict";
  const node = typeof module !== "undefined" && module.exports;
  const shared = node ? require("./v2-mantis-frames.js") : root.V2MantisFrames;
  const green = node ? require("./v2-blood-frames.js") : root.V2BloodFrames;
  const SHEET = "art/v2-style/animation-sheets/green-raw/ice-princess-animation-sheet.jpg";
  const ROWS = {
    attack: { edges:[150,328,524,724,908,1100,1268], top:2, bottom:202 },
    hit: { edges:[156,350,558,768,930], top:202, bottom:390 },
    death: { edges:[144,320,508,704,894,1092,1280], top:398, bottom:576 }
  };
  const DEATH_ORDER = [1,2,3,6,5];
  function mask(motion,index,x,y) { return motion==="death" && index===5 && x>=1156 && x<1208 && y<487; }
  function buildFrames(image,document) {
    const result=shared.buildFrames(image,document,{rows:ROWS,sourceHeight:576,mirrored:()=>false,key:green.keyGreen,mask,allowSourceEdge:true});
    result.death=DEATH_ORDER.map(number=>result.death[number-1]);
    return result;
  }
  let cached;
  function prepare() {
    if (!cached) cached=new Promise((resolve,reject)=>{
      const image=new root.Image();
      image.onload=()=>{try{resolve(buildFrames(image,root.document));}catch(error){reject(error);}};
      image.onerror=()=>reject(new Error("Ice princess sheet failed to load")); image.src=SHEET;
    }).catch(error=>{cached=null;throw error;});
    return cached;
  }
  const api={SHEET,ROWS,DEATH_ORDER,keyGreen:green.keyGreen,buildFrames,prepare};
  if(node) module.exports=api; else root.V2PrincessFrames=api;
})(globalThis);
