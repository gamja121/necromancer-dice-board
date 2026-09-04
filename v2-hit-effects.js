/* Original artwork is kept intact; chroma keying happens only at runtime. */
(function (root) {
  "use strict";
  const SHEET = "art/v2-style/ui/basic-physical-hit-sheet.jpg";
  const NAME = "기본 물리 타격";
  const CENTERS = Object.freeze([66, 226, 395, 561, 718, 879, 1047, 1211]);
  function keyGreen(data) {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const excess = g - Math.max(r, b);
      if (excess > 20) {
        data[i + 3] = Math.round(data[i + 3] * (1 - Math.min(1, (excess - 20) / 90)));
        data[i + 1] = Math.min(g, Math.max(r, b) + 20);
      }
    }
  }
  function buildFrames(image, doc) {
    if (image.naturalWidth !== 1280 || image.naturalHeight < 400) throw new Error("잘못된 타격 효과 시트");
    // The second row repeats the first. Keep a fixed 128px canvas/center so
    // tiny sparks grow naturally, rather than enlarging every cropped spark.
    return CENTERS.map(x => {
      const canvas = doc.createElement("canvas");
      canvas.width = canvas.height = 128;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, x - 64, 1, 128, 128, 0, 0, 128, 128);
      const pixels = ctx.getImageData(0, 0, 128, 128);
      keyGreen(pixels.data);
      ctx.putImageData(pixels, 0, 0);
      return canvas.toDataURL("image/png");
    });
  }
  let pending;
  function prepare() {
    if (!pending) pending = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => { try { resolve(buildFrames(image, document)); } catch (error) { reject(error); } };
      image.onerror = () => reject(new Error("기본 물리 타격 이미지를 불러오지 못했습니다."));
      image.src = SHEET;
    }).catch(error => { pending = null; throw error; });
    return pending;
  }
  const api = { SHEET, NAME, CENTERS, keyGreen, buildFrames, prepare };
  root.V2HitEffects = api;
  if (typeof module !== "undefined") module.exports = api;
})(globalThis);
