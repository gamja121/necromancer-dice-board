(function (root) {
  "use strict";
  const SHEET = "art/v2-style/ui/summon-effect-sheet.jpg";
  const CELLS = Array.from({ length: 8 }, (_, i) => [(i % 4) * 320, i < 4 ? 0 : 288, 320, i < 4 ? 288 : 287]);
  // Render-time chroma key: source artwork stays unmodified on disk.
  function removeGreen(pixels) {
    for (let i = 0; i < pixels.length; i += 4) {
      const excess = pixels[i + 1] - Math.max(pixels[i], pixels[i + 2]);
      if (excess <= 8) continue;
      if (excess >= 215) { pixels[i + 3] = 0; continue; }
      const alpha = 1 - excess / 255;
      pixels[i] = Math.min(255, Math.round(pixels[i] / alpha));
      pixels[i + 1] = Math.min(255, Math.round((pixels[i + 1] - excess) / alpha));
      pixels[i + 2] = Math.min(255, Math.round(pixels[i + 2] / alpha));
      pixels[i + 3] = Math.round(pixels[i + 3] * alpha);
    }
    return pixels;
  }
  function buildFrames(image, document) {
    if (image.naturalWidth !== 1280 || image.naturalHeight !== 575) throw new Error("Unexpected summon sheet dimensions");
    return CELLS.map(([x, y, width, height]) => {
      const canvas = document.createElement("canvas");
      canvas.width = 320; canvas.height = 288;
      const context = canvas.getContext("2d");
      context.drawImage(image, x, y, width, height, 0, 0, width, height);
      const data = context.getImageData(0, 0, 320, 288);
      removeGreen(data.data);
      context.putImageData(data, 0, 0);
      return canvas;
    });
  }
  let prepared;
  function prepare() {
    if (prepared) return prepared;
    prepared = new Promise((resolve, reject) => {
      const image = new root.Image();
      const timeout = root.setTimeout(() => reject(new Error("Summon sheet load timeout")), 6000);
      image.onload = () => {
        root.clearTimeout(timeout);
        try { resolve(buildFrames(image, root.document)); } catch (error) { reject(error); }
      };
      image.onerror = () => { root.clearTimeout(timeout); reject(new Error("Summon sheet failed to load")); };
      image.src = SHEET;
    }).catch(error => { prepared = null; throw error; });
    return prepared;
  }
  async function play(unit, frames, options) {
    if (!options.isCurrent()) return;
    const canvas = root.document.createElement("canvas");
    canvas.width = 320; canvas.height = 288;
    canvas.className = "summon-effect";
    canvas.setAttribute("aria-hidden", "true");
    unit.element.querySelector(".sprite-wrap").append(canvas);
    const context = canvas.getContext("2d");
    try {
      for (let i = 0; i < frames.length; i++) {
        if (!options.isCurrent()) return;
        context.clearRect(0, 0, 320, 288);
        context.drawImage(frames[i], 0, 0);
        if (i === 3) options.reveal(unit);
        await options.wait(90);
      }
      if (!options.isCurrent()) return;
      canvas.classList.add("is-fading");
      await options.wait(180);
    } finally { canvas.remove(); }
  }
  const api = { SHEET, CELLS, removeGreen, buildFrames, prepare, play };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.V2SummonEffect = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
