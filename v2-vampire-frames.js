(function(root){
  "use strict";

  const SHEET = "art/v2-style/animation-test-frames/vampire/vampire-motion-sprite.webp?v=1";
  const CELL = 128;
  const COLS = 5;
  const MAP = Object.freeze({
    attack: [0,1,2,3,4,5,6,7,8,9],
    hit: [10,11,12,13,14,15,16],
    death: [17,18,19,20,21,22,23,24]
  });
  let cached;

  function loadImage(src){
    return new Promise((resolve,reject)=>{
      const image=new Image();
      image.onload=()=>resolve(image);
      image.onerror=()=>reject(new Error("Vampire motion sprite failed to load: "+src));
      image.src=src;
    });
  }

  function frameFrom(image, document, index){
    const col=index%COLS;
    const row=Math.floor(index/COLS);
    const canvas=document.createElement("canvas");
    canvas.width=CELL;
    canvas.height=CELL;
    const ctx=canvas.getContext("2d");
    ctx.clearRect(0,0,CELL,CELL);
    ctx.drawImage(image,col*CELL,row*CELL,CELL,CELL,0,0,CELL,CELL);
    return canvas.toDataURL("image/png");
  }

  function prepare(){
    if(!cached){
      cached=loadImage(SHEET).then((image)=>{
        if(image.naturalWidth!==640||image.naturalHeight!==640){
          throw new Error("Unexpected vampire sprite size: "+image.naturalWidth+"x"+image.naturalHeight);
        }
        const attack=MAP.attack.map(i=>frameFrom(image,root.document,i));
        const hit=MAP.hit.map(i=>frameFrom(image,root.document,i));
        const death=MAP.death.map(i=>frameFrom(image,root.document,i));
        return {attack,hit,death,idle:attack[0]};
      }).catch((error)=>{cached=null;throw error;});
    }
    return cached;
  }

  root.V2VampireFrames=Object.freeze({SHEET,MAP,prepare});
})(globalThis);
