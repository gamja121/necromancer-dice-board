(function(root) {
  'use strict';
  const SHEET='art/v2-style/ui/damage-digits-sheet.jpg';
  const edges=[0,140,250,385,515,645,777,904,1026,1156,1280];
  const CELLS=edges.slice(0,-1).map((x,i)=>[x,0,edges[i+1]-x,190]).concat([[28,267,100,48]]);
  function key(data) {
    for(let i=0;i<data.length;i+=4) {
      const excess=data[i+1]-Math.max(data[i],data[i+2]);
      if(excess>45) data[i+3]=0;
      else if(excess>0) data[i+1]=Math.max(data[i],data[i+2]);
    }
  }
  let glyphs, pending;
  function prepare() {
    if(pending)return pending;
    pending=new Promise((resolve,reject)=>{
      const image=new root.Image();
      image.onerror=()=>reject(Error('Damage digits failed to load'));
      image.onload=()=>{try {
        glyphs=CELLS.map(([x,y,w,h])=>{
          const canvas=root.document.createElement('canvas');canvas.width=w;canvas.height=h;
          const ctx=canvas.getContext('2d');ctx.drawImage(image,x,y,w,h,0,0,w,h);
          const pixels=ctx.getImageData(0,0,w,h);key(pixels.data);ctx.putImageData(pixels,0,0);
          return canvas;
        });resolve(glyphs);
      }catch(error){reject(error);}};
      image.src=SHEET;
    }).catch(error=>{pending=null;throw error;});
    return pending;
  }
  function render(host,amount) {
    if(!glyphs || !Number.isFinite(amount) || amount<=0)return false;
    host.textContent='';host.classList.add('has-digit-art');
    for(const character of '-'+String(Math.round(amount))) {
      const index=character==='-'?10:Number(character);
      const source=glyphs[index], canvas=root.document.createElement('canvas');
      canvas.width=source.width;canvas.height=source.height;
      canvas.className=character==='-'?'damage-minus':'damage-digit';
      canvas.setAttribute('aria-hidden','true');canvas.getContext('2d').drawImage(source,0,0);host.append(canvas);
    }
    return true;
  }
  const api={SHEET,CELLS,key,prepare,render};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.V2DamageDigits=api;
})(globalThis);
