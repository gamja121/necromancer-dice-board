(function(root) {
  "use strict";
  const shared = typeof module !== "undefined" && module.exports ? require("./v2-mantis-frames.js") : root.V2MantisFrames;
  const SHEET = "art/v2-style/animation-sheets/green-raw/hydra-1.jpg";
  const SECOND_SHEET = "art/v2-style/animation-sheets/green-raw/hydra-2.jpg";
  const ROWS = {
    attack: { edges: [140,350,562,828,1100,1280], top: 0, bottom: 200 },
    hit: { edges: [140,350,556,770,970], top: 210, bottom: 404 },
    death: { edges: [140,330,530,730,930], top: 414, bottom: 576 }
  };
  const SECOND_ROWS = { death: { edges: [730,942,1116], top: 490, bottom: 576 } };
  function buildFrames(image, document, second) {
    const options = { sourceHeight:576, canvasWidth:280, mirrored:()=>false, allowSourceEdge:true };
    const first = shared.buildFrames(image,document,{...options,rows:ROWS});
    const last = shared.buildFrames(second,document,{...options,rows:SECOND_ROWS});
    first.death.push(...last.death);
    return first;
  }
  let cached;
  function prepare() {
    function load(src) { return new Promise((resolve,reject)=> {
      const img = new root.Image(); img.onload=()=>resolve(img); img.onerror=()=>reject(new Error("Hydra sheet failed: " + src)); img.src=src;
    }); }
    if (!cached) cached=Promise.all([load(SHEET),load(SECOND_SHEET)]).then(([a,b])=>buildFrames(a,root.document,b)).catch(error=>{cached=null;throw error;});
    return cached;
  }
  const api={SHEET,SECOND_SHEET,ROWS,SECOND_ROWS,buildFrames,prepare,keyMagenta:shared.keyMagenta};
  if(typeof module!=="undefined"&&module.exports) module.exports=api; else root.V2HydraFrames=api;
})(globalThis);
