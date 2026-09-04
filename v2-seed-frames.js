(function(root) {
  "use strict";
  const shared = typeof module !== "undefined" && module.exports ? require("./v2-mantis-frames.js") : root.V2MantisFrames;
  const SHEET = "art/v2-style/animation-sheets/green-raw/guardian-seed-animation-sheet.jpg";
  const ROWS = {
    attack: { edges:[146,338,540,806,1020,1260], top:22, bottom:252 },
    hit: { edges:[146,338,548,738], top:270, bottom:458 },
    death: { edges:[140,320,540,764,1012], top:498, bottom:686 }
  };
  function buildFrames(image,document) { return shared.buildFrames(image,document,{rows:ROWS,mirrored:()=>false}); }
  let cached;
  function prepare() {
    if (!cached) cached=new Promise((resolve,reject)=>{
      const image=new root.Image();
      image.onload=()=>{try{resolve(buildFrames(image,root.document));}catch(error){reject(error);}};
      image.onerror=()=>reject(new Error("Seed sheet failed to load")); image.src=SHEET;
    }).catch(error=>{cached=null;throw error;});
    return cached;
  }
  const api={SHEET,ROWS,keyMagenta:shared.keyMagenta,buildFrames,prepare};
  if(typeof module!=="undefined"&&module.exports) module.exports=api; else root.V2SeedFrames=api;
})(globalThis);
