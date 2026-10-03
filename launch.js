(() => {
  "use strict";
  const video=document.getElementById("titleVideo");
  const bgm=document.getElementById("titleBgm");
  const unlock=document.getElementById("titleUnlock");
  const newGame=document.getElementById("newGameButton");
  const cont=document.getElementById("continueButton");
  const options=document.getElementById("optionsButton");
  const exit=document.getElementById("exitButton");
  const panel=document.getElementById("optionsPanel");
  const closeOptions=document.getElementById("closeOptionsButton");
  const soundToggle=document.getElementById("titleSoundToggle");
  const installButton=document.getElementById("installAppButton");
  const testLinks=[...document.querySelectorAll(".test-menu-grid a")];
  const toast=document.getElementById("titleToast");
  const DB_NAME="necromancer-dice-runs";
  let unlocked=false,soundOn=true,leaving=false,installPrompt=null,toastTimer,selectedMenu=null;

  async function requestGameFullscreen(){
    if(document.fullscreenElement)return true;
    try{
      const root=document.documentElement;
      if(root.requestFullscreen){await root.requestFullscreen({navigationUI:"hide"});return true}
      if(root.webkitRequestFullscreen){root.webkitRequestFullscreen();return true}
    }catch(_){}
    return false;
  }

  video.volume=.72;
  bgm.volume=.34;
  video.muted=true;
  video.play().catch(()=>{});

  function showToast(message){
    toast.textContent=message;toast.classList.add("is-visible");clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>toast.classList.remove("is-visible"),2200);
  }
  async function startAudio(restart=false){
    if(restart){try{video.currentTime=0}catch(_){ } try{bgm.currentTime=0}catch(_){ }}
    video.muted=!soundOn;bgm.muted=!soundOn;
    await Promise.allSettled([video.play(),bgm.play()]);
  }
  async function unlockTitle(){
    await requestGameFullscreen();
    if(unlocked)return;
    unlocked=true;
    document.body.classList.remove("is-locked");
    document.body.classList.add("is-unlocked");
    await startAudio(true);
  }
  unlock.addEventListener("click",unlockTitle);

  soundToggle.addEventListener("click",async()=>{
    soundOn=!soundOn;video.muted=!soundOn;bgm.muted=!soundOn;
    soundToggle.textContent=soundOn?"ON":"OFF";
    soundToggle.setAttribute("aria-pressed",String(soundOn));
    if(soundOn&&unlocked)await startAudio(false);
  });

  function clearLegacy(storage){
    try{const keys=[];for(let i=0;i<storage.length;i++){const k=storage.key(i);if(k?.startsWith("necromancer-"))keys.push(k)}keys.forEach(k=>storage.removeItem(k))}catch(_){}
  }
  function deleteDb(){return new Promise(resolve=>{if(!indexedDB)return resolve();const r=indexedDB.deleteDatabase(DB_NAME);r.onsuccess=r.onerror=r.onblocked=()=>resolve()})}
  async function hasSavedRun(){
    if(!indexedDB)return false;
    return new Promise(resolve=>{
      const r=indexedDB.open(DB_NAME,1);
      r.onerror=()=>resolve(false);
      r.onupgradeneeded=()=>{try{r.transaction.abort()}catch(_){} resolve(false)};
      r.onsuccess=()=>{
        const db=r.result;if(!db.objectStoreNames.contains("metadata")){db.close();resolve(false);return}
        const tx=db.transaction("metadata","readonly"),g=tx.objectStore("metadata").get("activeRun");
        g.onsuccess=()=>{const ok=Boolean(g.result?.runId);db.close();resolve(ok)};
        g.onerror=()=>{db.close();resolve(false)};
      };
    });
  }
  function openGameFrame(href){
    let frame=document.getElementById("gameFrame");
    if(!frame){
      frame=document.createElement("iframe");
      frame.id="gameFrame";
      frame.className="game-frame";
      frame.setAttribute("title","Necromancer and Dice");
      frame.setAttribute("allow","fullscreen; autoplay");
      document.body.appendChild(frame);
    }
    frame.src=href;
    frame.hidden=false;
  }

  async function fadeTo(href){
    if(leaving)return;leaving=true;document.body.classList.add("is-leaving");
    const start=performance.now(),vv=video.volume,bv=bgm.volume;
    await new Promise(resolve=>{
      const step=now=>{const p=Math.min(1,(now-start)/550),q=1-p;video.volume=vv*q;bgm.volume=bv*q;p<1?requestAnimationFrame(step):resolve()};requestAnimationFrame(step);
    });
    try{sessionStorage.setItem("necromancer-v2-music-handoff","map")}catch(_){}
    video.pause();bgm.pause();
    openGameFrame(href);
  }
  const menuButtons=[newGame,cont,options,exit];
  function selectMenu(target){
    menuButtons.forEach(item=>{
      const selected=item===target;
      item.classList.toggle("is-selected",selected);
      item.setAttribute("aria-current",selected?"true":"false");
    });
    selectedMenu=target;
  }
  function isSecondPress(target){
    if(selectedMenu!==target){selectMenu(target);return false;}
    return true;
  }

  newGame.addEventListener("click",async()=>{
    if(!isSecondPress(newGame))return;
    await requestGameFullscreen();
    if(!unlocked)await unlockTitle();
    const saved=await hasSavedRun();
    if(saved&&!confirm("기존 원정 기록을 지우고 새 게임을 시작할까요?"))return;
    await deleteDb();clearLegacy(localStorage);clearLegacy(sessionStorage);
    await fadeTo("v2-intro.html");
  });
  cont.addEventListener("click",async e=>{
    e.preventDefault();if(cont.hidden)return;
    if(!isSecondPress(cont))return;
    await requestGameFullscreen();
    if(!unlocked)await unlockTitle();
    await fadeTo(cont.href);
  });
  options.addEventListener("click",()=>{
    if(!isSecondPress(options))return;
    panel.hidden=false;
  });
  closeOptions.addEventListener("click",()=>{panel.hidden=true;selectMenu(options)});
  testLinks.forEach(link=>link.addEventListener("click",async e=>{
    e.preventDefault();
    await requestGameFullscreen();
    if(!unlocked)await unlockTitle();
    await fadeTo(link.href);
  }));
  exit.addEventListener("click",()=>{
    if(!isSecondPress(exit))return;
    window.close();setTimeout(()=>showToast("브라우저에서는 창을 직접 닫아주세요."),80);
  });

  document.addEventListener("visibilitychange",()=>{if(document.hidden){video.pause();bgm.pause()}else if(unlocked&&!leaving)startAudio(false);else if(!leaving)video.play().catch(()=>{})});
  window.addEventListener("pagehide",()=>{video.pause();bgm.pause()});
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;installButton.hidden=false});
  installButton.addEventListener("click",async()=>{if(!installPrompt)return;const p=installPrompt;installPrompt=null;installButton.hidden=true;await p.prompt()});

  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./service-worker.js",{updateViaCache:"none"}).then(async registration=>{
      // The service worker activation step owns old-cache cleanup.
      // Do not delete the current cache from the title page.
      await registration.update();
    }).catch(()=>{});
  }
  hasSavedRun().then(saved=>{cont.hidden=!saved;cont.setAttribute("aria-disabled",saved?"false":"true")});
})();