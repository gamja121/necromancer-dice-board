(function(root){
  "use strict";

  const SHEET = "art/v2-style/animation-sheets/uploaded-raw/dracula-attack.webp?v=1";
  let cached = null;

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Dracula attack sheet load failed: " + src));
      image.src = src;
    });
  }

  function removeWhiteBackground(ctx, width, height) {
    const pixels = ctx.getImageData(0, 0, width, height);
    const data = pixels.data;
    for (let index = 0; index < data.length; index += 4) {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const min = Math.min(r, g, b);
      const max = Math.max(r, g, b);
      if (min >= 248 && max - min <= 8) {
        data[index + 3] = 0;
      } else if (min >= 232 && max - min <= 14) {
        data[index + 3] = Math.round((248 - min) / 16 * data[index + 3]);
      }
    }
    ctx.putImageData(pixels, 0, 0);
  }

  async function prepare() {
    if (cached) return cached;

    const sheet = await loadImage(SHEET);
    const columns = 5;
    const rows = 2;
    const outputSize = 320;
    const attack = [];

    for (let index = 0; index < 10; index += 1) {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const sx = Math.round(column * sheet.width / columns);
      const sy = Math.round(row * sheet.height / rows);
      const ex = Math.round((column + 1) * sheet.width / columns);
      const ey = Math.round((row + 1) * sheet.height / rows);
      const sw = ex - sx;
      const sh = ey - sy;

      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const scale = Math.min((outputSize - 4) / sw, (outputSize - 4) / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      ctx.drawImage(sheet, sx, sy, sw, sh, (outputSize - dw) / 2, (outputSize - dh) / 2, dw, dh);
      removeWhiteBackground(ctx, outputSize, outputSize);
      attack.push(canvas.toDataURL("image/png"));
    }

    // Only attack art exists for now. Keep battle logic stable with still-frame fallbacks
    // until dedicated hit/death sheets are supplied.
    cached = {
      attack,
      hit: [attack[0]],
      death: [attack[9]]
    };
    return cached;
  }

  root.V2DraculaFrames = Object.freeze({ prepare });
})(globalThis);
