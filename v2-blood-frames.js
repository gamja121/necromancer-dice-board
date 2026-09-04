(function(root) {
  "use strict";
  const shared = typeof module !== "undefined" && module.exports ? require("./v2-mantis-frames.js") : root.V2MantisFrames;
  const SHEET = "art/v2-style/animation-sheets/green-raw/bone-golem-animation-sheet.jpg";
  const ROWS = {
    attack: { edges:[8,268,520,800,1030,1276], starts:[8,268,520,770,1030], top:220, bottom:482 },
    // Original hit 5 is deliberately omitted; other rows remain unchanged.
    hit: { edges:[8,268,548,784,1028], top:488, bottom:758 },
    death: { edges:[8,266,514,756,1036,1276], top:762, bottom:1020 }
  };
  function keyGreen(data) {
    for(let i=0;i<data.length;i+=4) {
      const excess=data[i+1]-Math.max(data[i],data[i+2]);
      if(excess<=8) continue;
      if(excess>=210) {data[i+3]=0;continue;}
      const a=1-excess/255;
      data[i]=Math.round(data[i]/a); data[i+1]=Math.round((data[i+1]-excess)/a); data[i+2]=Math.round(data[i+2]/a); data[i+3]=Math.round(data[i+3]*a);
    }
  }
  // Attack 3's fist and attack 4's foot overlap in X, but occupy separate Y bands.
  function mask(motion,index,x,y) { return motion==="attack" && ((index===2 && x>=776 && y>=400) || (index===3 && x<800 && y<400)); }
  function buildFrames(image,document) { return shared.buildFrames(image,document,{rows:ROWS,sourceHeight:1280,canvasWidth:320,canvasHeight:300,mirrored:()=>false,key:keyGreen,mask}); }
  let cached;
  function prepare() {
    if (!cached) cached=new Promise((resolve,reject)=>{
      const image=new root.Image();
      image.onload=()=>{try{resolve(buildFrames(image,root.document));}catch(error){reject(error);}};
      image.onerror=()=>reject(new Error("Blood skeleton sheet failed to load")); image.src=SHEET;
    }).catch(error=>{cached=null;throw error;});
    return cached;
  }
  const api={SHEET,ROWS,keyGreen,buildFrames,prepare};
  if(typeof module!=="undefined"&&module.exports) module.exports=api; else root.V2BloodFrames=api;
})(globalThis);
