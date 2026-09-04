(function (root) {
  "use strict";
  const SHEET = "art/v2-style/animation-sheets/green-raw/hell-mantis-animation-sheet.jpg";
  const ROWS = {
    attack: { edges: [120, 340, 568, 806, 1036, 1268], top: 8, bottom: 240 },
    hit: { edges: [120, 350, 580, 810, 1036], top: 250, bottom: 480 },
    death: { edges: [120, 310, 498, 686, 886, 1076, 1268], top: 482, bottom: 690 }
  };
  function mirrored(motion, index) { return motion === "attack" && index === 4; }
  function keyMagenta(data) {
    for (let i = 0; i < data.length; i += 4) {
      const excess = Math.min(data[i], data[i + 2]) - data[i + 1];
      if (excess <= 8) continue;
      if (excess >= 220) { data[i + 3] = 0; continue; }
      const alpha = 1 - excess / 255;
      data[i] = Math.max(0, Math.round((data[i] - excess) / alpha));
      data[i + 1] = Math.round(data[i + 1] / alpha);
      data[i + 2] = Math.max(0, Math.round((data[i + 2] - excess) / alpha));
      data[i + 3] = Math.round(data[i + 3] * alpha);
    }
  }
  function buildFrames(image, document, options = {}) {
    if (image.naturalWidth !== 1280 || image.naturalHeight !== (options.sourceHeight || 698)) throw new Error("Unexpected sheet dimensions");
    const result = {};
    const canvasWidth = options.canvasWidth || 280;
    for (const [motion, row] of Object.entries(options.rows || ROWS)) {
      result[motion] = row.edges.slice(0, -1).map((x, index) => {
        const width = row.edges[index + 1] - x, height = row.bottom - row.top;
        const cut = document.createElement("canvas");
        cut.width = width; cut.height = height;
        const ctx = cut.getContext("2d");
        ctx.drawImage(image, x, row.top, width, height, 0, 0, width, height);
        const pixels = ctx.getImageData(0, 0, width, height);
        (options.key || keyMagenta)(pixels.data);
        if (options.mask) for (let y = 0; y < height; y++) for (let px = 0; px < width; px++) {
          if (options.mask(motion, index, x + px, row.top + y)) pixels.data[(y * width + px) * 4 + 3] = 0;
        }
        ctx.putImageData(pixels, 0, 0);
        let left = width, top = height, right = -1, bottom = -1;
        for (let y = 0; y < height; y++) for (let px = 0; px < width; px++) {
          if (pixels.data[(y * width + px) * 4 + 3] <= 8) continue;
          left = Math.min(left, px); right = Math.max(right, px);
          top = Math.min(top, y); bottom = Math.max(bottom, y);
        }
        if (right < left) throw new Error("Empty mantis frame");
        const sourceEdge = options.allowSourceEdge;
        if ((left === 0 && !(sourceEdge && x === 0)) || (right === width - 1 && !(sourceEdge && x + width === image.naturalWidth)) || (top === 0 && !(sourceEdge && row.top === 0)) || (bottom === height - 1 && !(sourceEdge && row.bottom === image.naturalHeight))) throw new Error("Frame touches crop edge: " + motion + (index + 1) + " " + JSON.stringify({left, top, right, bottom, width, height}));
        const fw = right - left + 1, fh = bottom - top + 1;
        const frame = document.createElement("canvas");
        frame.width = canvasWidth; frame.height = 260;
        const fc = frame.getContext("2d");
        if ((options.mirrored || mirrored)(motion, index)) { fc.translate(canvasWidth, 0); fc.scale(-1, 1); }
        fc.drawImage(cut, left, top, fw, fh, Math.floor((canvasWidth - fw) / 2), 250 - fh, fw, fh);
        return frame.toDataURL("image/png");
      });
    }
    result.idle = result.attack?.[0];
    return result;
  }
  let cached;
  function prepare() {
    if (!cached) cached = new Promise((resolve, reject) => {
      const image = new root.Image();
      image.onload = () => { try { resolve(buildFrames(image, root.document)); } catch (error) { reject(error); } };
      image.onerror = () => reject(new Error("Mantis sheet failed to load"));
      image.src = SHEET;
    }).catch(error => { cached = null; throw error; });
    return cached;
  }
  const api = { SHEET, ROWS, mirrored, keyMagenta, buildFrames, prepare };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.V2MantisFrames = api;
})(globalThis);
