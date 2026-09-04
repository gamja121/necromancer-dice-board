/* Original artwork is kept intact; chroma keying happens only at runtime. */
(function (root) {
  "use strict";
  const SHEET = "art/v2-style/ui/basic-physical-hit-sheet.jpg";
  const NAME = "기본 물리 타격";
  const CENTERS = Object.freeze([66, 226, 395, 561, 718, 879, 1047, 1211]);
  const EFFECTS = Object.freeze({
    physical: Object.freeze({ name: NAME, sheet: SHEET, centers: CENTERS, width: 128, height: 128, top: 1, size: 128 }),
    claw: Object.freeze({ name: "손톱공격", sheet: "art/v2-style/ui/claw-hit-sheet.jpg",
      centers: Object.freeze([80, 240, 400, 560, 720, 880, 1040, 1200]), width: 160, height: 256, top: 0, size: 256 }),
    slash: Object.freeze({ name: "베기", sheet: "art/v2-style/ui/slash-hit-sheet.jpg",
      centers: Object.freeze([80, 240, 400, 560, 720, 880, 1040, 1200]), width: 160, height: 287, size: 288,
      tops: Object.freeze([288, 288, 288, 288, 288, 288, 288, 0]), background: Object.freeze([43, 213, 8]) })
  });
  function keyGreen(data, preserveFades = false, background = [0, 210, 0]) {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const excess = g - Math.max(r, b);
      if (excess > 20) {
        if (preserveFades) {
          // Unmix faint claw trails from the roughly (0,210,0) backdrop.
          // A hard green threshold would erase the first animation frame.
          const strength = Math.max(0, (r - background[0]) / (255 - background[0]), (b - background[2]) / (255 - background[2]));
          const alpha = strength < 12 / 255 ? 0 : strength;
          data[i + 3] = Math.round(data[i + 3] * alpha);
          if (alpha > 0) {
            data[i] = (r - background[0] * (1 - alpha)) / alpha;
            data[i + 1] = Math.max(0, Math.min(255, (g - background[1] * (1 - alpha)) / alpha));
            data[i + 2] = (b - background[2] * (1 - alpha)) / alpha;
          }
          continue;
        }
        data[i + 3] = Math.round(data[i + 3] * (1 - Math.min(1, (excess - 20) / 90)));
        data[i + 1] = Math.min(g, Math.max(r, b) + 20);
      }
    }
  }
  function buildFrames(image, doc, id = "physical") {
    const effect = EFFECTS[id];
    if (!effect) throw new Error("알 수 없는 타격 효과");
    if (image.naturalWidth !== 1280 || image.naturalHeight < 400) throw new Error("잘못된 타격 효과 시트");
    // Fixed canvas/center preserves size changes; explicit tops allow mixed rows.
    return effect.centers.map((x, index) => {
      const canvas = doc.createElement("canvas");
      canvas.width = canvas.height = effect.size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, x - effect.width / 2, effect.tops ? effect.tops[index] : effect.top, effect.width, effect.height,
        (effect.size - effect.width) / 2, 0, effect.width, effect.height);
      const pixels = ctx.getImageData(0, 0, effect.size, effect.size);
      keyGreen(pixels.data, id === "claw" || id === "slash", effect.background);
      ctx.putImageData(pixels, 0, 0);
      return canvas.toDataURL("image/png");
    });
  }
  const pending = new Map();
  function prepare(id = "physical") {
    const effect = EFFECTS[id];
    if (!effect) return Promise.reject(new Error("알 수 없는 타격 효과"));
    if (!pending.has(id)) pending.set(id, new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => { try { resolve(buildFrames(image, document, id)); } catch (error) { reject(error); } };
      image.onerror = () => reject(new Error(`${effect.name} 이미지를 불러오지 못했습니다.`));
      image.src = effect.sheet;
    }).catch(error => { pending.delete(id); throw error; }));
    return pending.get(id);
  }
  const api = { SHEET, NAME, CENTERS, EFFECTS, keyGreen, buildFrames, prepare };
  root.V2HitEffects = api;
  if (typeof module !== "undefined") module.exports = api;
})(globalThis);
