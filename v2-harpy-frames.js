(function(root) {
  "use strict";
  const shared = typeof module !== "undefined" && module.exports ? require("./v2-mantis-frames.js") : root.V2MantisFrames;
  const SHEET = "art/v2-style/animation-sheets/green-raw/abyss-harpy-animation-sheet.jpg";
  const ROWS = {
    attack: { edges:[146,378,608,868,1092], top:22, bottom:242 },
    hit: { edges:[146,380,608,836,1064], top:250, bottom:470 },
    death: { edges:[144,368,590,812,1034,1256], top:480, bottom:690 }
  };
  function keyMagenta(data) {
    // Both saturated gutters and lighter pink cell backgrounds are chroma key.
    for (let i=0;i<data.length;i+=4) {
      if (data[i]>220 && data[i+2]>220 && data[i+1]<110) data[i+3]=0;
    }
    shared.keyMagenta(data);
  }
  function mask(motion,index,x,y) { return motion==="death" && index===4 && x>=1145 && x<1194 && y<594; }
  function buildFrames(image,document) { return shared.buildFrames(image,document,{rows:ROWS,mirrored:()=>false,key:keyMagenta,mask}); }
  let cached;
  function prepare() {
    if (!cached) cached=new Promise((resolve,reject)=>{
      const image=new root.Image();
      image.onload=()=>{try{resolve(buildFrames(image,root.document));}catch(error){reject(error);}};
      image.onerror=()=>reject(new Error("Harpy sheet failed to load")); image.src=SHEET;
    }).catch(error=>{cached=null;throw error;});
    return cached;
  }
  const api={SHEET,ROWS,keyMagenta,mask,buildFrames,prepare};
  if(typeof module!=="undefined"&&module.exports) module.exports=api; else root.V2HarpyFrames=api;
})(globalThis);
