(function(root){
  "use strict";

  const SHEET = "art/v2-style/animation-test-frames/vampire/vampire-motion-sprite.webp?v=2";
  const COLS = 5;
  const ROWS = 5;
  const MAP = Object.freeze({
    attack: [0,1,2,3,4,5,6,7,8,9],
    hit: [10,11,12,13,14,15,16],
    death: [17,18,19,20,21,22,23,24]
  });
  let cached;

  function loadImage(src){
    return new Promise((resolve,reject)=>{
      const image=new Image();
      image.decoding="async";
      image.onload=()=>resolve(image);
      image.onerror=()=>reject(new Error("Vampire motion sprite failed to load: "+src));
      image.src=src;
    });
  }

  function frameFrom(image, document, index, cellWidth, cellHeight){
    const col=index%COLS;
    const row=Math.floor(index/COLS);
    const canvas=document.createElement("canvas");
    canvas.width=cellWidth;
    canvas.height=cellHeight;
    const ctx=canvas.getContext("2d");
    ctx.clearRect(0,0,cellWidth,cellHeight);
    ctx.drawImage(
      image,
      col*cellWidth,row*cellHeight,cellWidth,cellHeight,
      0,0,cellWidth,cellHeight
    );
    return canvas.toDataURL("image/png");
  }

  function prepare(){
    if(!cached){
      cached=loadImage(SHEET).then((image)=>{
        if(!image.naturalWidth || !image.naturalHeight){
          throw new Error("Vampire sprite has no dimensions");
        }
        if(image.naturalWidth % COLS !== 0 || image.naturalHeight % ROWS !== 0){
          throw new Error("Unexpected vampire sprite grid: "+image.naturalWidth+"x"+image.naturalHeight);
        }

        const cellWidth=image.naturalWidth/COLS;
        const cellHeight=image.naturalHeight/ROWS;

        const attack=MAP.attack.map(i=>frameFrom(image,root.document,i,cellWidth,cellHeight));
        const hit=MAP.hit.map(i=>frameFrom(image,root.document,i,cellWidth,cellHeight));
        const death=MAP.death.map(i=>frameFrom(image,root.document,i,cellWidth,cellHeight));

        return {attack,hit,death,idle:attack[0]};
      }).catch((error)=>{
        cached=null;
        throw error;
      });
    }
    return cached;
  }

  root.V2VampireFrames=Object.freeze({SHEET,COLS,ROWS,MAP,prepare});
})(globalThis);
