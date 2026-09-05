(function(root) {
  "use strict";
  const ATTACK_EFFECTS = Object.freeze({
    forestFairy: "wind", "forest-fairy": "wind", siren: "music",
    ghoul: "claw",
    ragingTreant: "claw", "raging-treant": "claw",
    abyssHarpy: "claw", "abyss-harpy": "claw",
    boneGolem: "claw", "bone-golem": "claw",
    seaWolf: "claw", "sea-wolf": "claw",
    plagueFrog: "poison", "plague-frog": "poison", "poison-toad": "poison",
    poisonMushroom: "poison", "mushroom-soldier": "poison", "mushroom-monster": "poison",
    plague: "poison", "plague-doctor": "poison",
    worm: "toxicLiquid", "grave-worm": "toxicLiquid"
  });
  async function prepare(type) {
    const id = ATTACK_EFFECTS[type];
    if (!id) return null;
    try {
      const frames = await root.V2HitEffects.prepare(id);
      await Promise.all(frames.map(src => new Promise((resolve,reject) => {
        const image = new Image(); image.onload=resolve; image.onerror=reject; image.src=src;
      })));
      return frames;
    } catch(error) { console.warn("피격 효과 로드 실패",error); return null; }
  }
  async function play(host, frames, {guard = () => true, wait = ms => new Promise(r=>setTimeout(r,ms)), speed = 1} = {}) {
    if (!host || !frames || !guard()) return;
    const image = document.createElement("img");
    image.alt=""; image.setAttribute("aria-hidden","true");
    image.className="combat-hit-effect";
    image.style.cssText="position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);width:85%;height:auto;max-width:180px;z-index:20;pointer-events:none;filter:none;object-fit:contain;";
    host.appendChild(image);
    try {
      for (const frame of frames) {
        if (!guard() || !host.isConnected) return;
        image.src=frame;
        await wait(65 / speed);
      }
    } finally { image.remove(); }
  }
  root.V2CombatEffects={ATTACK_EFFECTS,prepare,play};
  if(typeof module!=="undefined") module.exports=root.V2CombatEffects;
})(globalThis);
