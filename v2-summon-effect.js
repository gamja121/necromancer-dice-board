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
  // Measure opaque artwork, not the padded PNG rectangle.
  function footAnchor(data, width, height) {
    let bottom = -1;
    for (let y = height - 1; y >= 0 && bottom < 0; y--) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] >= 128) { bottom = y; break; }
      }
    }
    if (bottom < 0) return { x: .5, y: 1 };
    let left = width, right = -1;
    for (let y = Math.max(0, bottom - Math.ceil(height * .06)); y <= bottom; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] >= 128) {
          left = Math.min(left, x); right = Math.max(right, x);
        }
      }
    }
    return { x: (left + right + 1) / (2 * width), y: (bottom + 1) / height };
  }
  function placeAtFeet(canvas, image) {
    if (!image?.naturalWidth || !image.naturalHeight) return;
    const probe = root.document.createElement("canvas");
    probe.width = image.naturalWidth; probe.height = image.naturalHeight;
    const context = probe.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const anchor = footAnchor(context.getImageData(0, 0, probe.width, probe.height).data, probe.width, probe.height);
    const scale = Math.min(image.clientWidth / probe.width, image.clientHeight / probe.height);
    const width = probe.width * scale, height = probe.height * scale;
    // object-fit: contain centers artwork inside the image element.
    canvas.style.left = `${image.offsetLeft + (image.clientWidth - width) / 2 + anchor.x * width}px`;
    canvas.style.top = `${image.offsetTop + (image.clientHeight - height) / 2 + anchor.y * height}px`;
    canvas.style.bottom = "auto";
  }
  async function play(unit, frames, options) {
    if (!options.isCurrent()) return;
    if (unit.image?.decode) { try { await unit.image.decode(); } catch (_) {} }
    if (!options.isCurrent()) return;
    unit.element.classList.add("is-summoning");
    const canvas = root.document.createElement("canvas");
    canvas.width = 320; canvas.height = 288;
    canvas.className = "summon-effect";
    canvas.setAttribute("aria-hidden", "true");
    unit.element.querySelector(".sprite-wrap").append(canvas);
    try { placeAtFeet(canvas, unit.image); } catch (_) { /* Keep fallback for unavailable pixels. */ }
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
    } finally {
      canvas.remove();
      unit.element.classList.remove("is-summoning");
    }
  }
  const api = { SHEET, CELLS, removeGreen, buildFrames, prepare, play, footAnchor, placeAtFeet };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.V2SummonEffect = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
