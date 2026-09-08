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
  const LABEL_SHEET='art/v2-style/ui/combat-labels-sheet.jpg';
  const LABEL_CELLS={miss:[290,0,740,290],critical:[300,300,730,265]};
  const STATUS_SHEET='art/v2-style/ui/status-labels-sheet.jpg';
  const STATUS_CELLS={poison:[405,10,495,275],immune:[405,292,485,270]};
  const LABEL_TEXT={miss:'빗나감',critical:'치명타',poison:'중독',immune:'무적'};
  let labels={};
  function prepareStatusLabels() {
    return new Promise((resolve,reject)=>{
      const image=new root.Image();image.onerror=()=>reject(Error('Status labels failed to load'));
      image.onload=()=>{try {
        for(const [name,[x,y,w,h]] of Object.entries(STATUS_CELLS)) {
          const c=root.document.createElement('canvas');c.width=w;c.height=h;
          const ctx=c.getContext('2d');ctx.drawImage(image,x,y,w,h,0,0,w,h);
          const pixels=ctx.getImageData(0,0,w,h);key(pixels.data);ctx.putImageData(pixels,0,0);labels[name]=c;
        }
        resolve(labels);
      }catch(error){reject(error);}};image.src=STATUS_SHEET;
    });
  }
  function prepareLabels() {
    return new Promise((resolve,reject)=>{
      const image=new root.Image();image.onerror=()=>reject(Error('Combat labels failed to load'));
      image.onload=()=>{try {
        for(const [name,[x,y,w,h]] of Object.entries(LABEL_CELLS)) {
          const c=root.document.createElement('canvas');c.width=w;c.height=h;
          const ctx=c.getContext('2d');ctx.drawImage(image,x,y,w,h,0,0,w,h);
          const pixels=ctx.getImageData(0,0,w,h);key(pixels.data);ctx.putImageData(pixels,0,0);labels[name]=c;
        }
        resolve(labels);
      }catch(error){reject(error);}};image.src=LABEL_SHEET;
    });
  }
  function showLabel(unit,type) {
    if(!LABEL_TEXT[type] || !unit.element)return;
    const host=root.document.createElement('span');host.className='combat-label combat-label-'+type;
    host.setAttribute('aria-label',LABEL_TEXT[type]);
    if(labels?.[type]) {
      const source=labels[type],c=root.document.createElement('canvas');c.width=source.width;c.height=source.height;
      c.setAttribute('aria-hidden','true');c.getContext('2d').drawImage(source,0,0);host.append(c);
    } else host.textContent=LABEL_TEXT[type];
    unit.element.querySelector('.sprite-wrap').append(host);
    host.addEventListener('animationend',()=>host.remove(),{once:true});
    root.setTimeout(()=>host.remove(),1300);
  }
  const api={SHEET,CELLS,key,prepare,render,LABEL_SHEET,LABEL_CELLS,prepareLabels,showLabel,STATUS_CELLS,prepareStatusLabels};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.V2DamageDigits=api;
})(globalThis);
