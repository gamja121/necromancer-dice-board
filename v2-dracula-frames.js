(function(root){
  "use strict";

  const SHEET = "art/v2-style/animation-sheets/uploaded-raw/dracula-attack.webp?v=1";
  let cached = null;
  let objectUrls = [];

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Dracula attack sheet load failed: " + src));
      image.src = src;
    });
  }

  function cutWhiteBackground(ctx, width, height) {
    const pixels = ctx.getImageData(0, 0, width, height);
    const data = pixels.data;
    for (let index = 0; index < data.length; index += 4) {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const min = Math.min(r, g, b);
      const max = Math.max(r, g, b);
      const neutral = max - min <= 18;

      // Pure/near white becomes fully transparent.
      if (neutral && min >= 246) {
        data[index + 3] = 0;
      // Feather only the narrow anti-aliased white fringe.
      } else if (neutral && min >= 226) {
        const alpha = Math.max(0, Math.min(255, Math.round((246 - min) / 20 * 255)));
        data[index + 3] = Math.min(data[index + 3], alpha);
      }
    }
    ctx.putImageData(pixels, 0, 0);
  }

  function canvasToObjectUrl(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Dracula frame export failed"));
        const url = URL.createObjectURL(blob);
        objectUrls.push(url);
        resolve(url);
      }, "image/png");
    });
  }

  async function prepare() {
    if (cached) return cached;

    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    objectUrls = [];

    const sheet = await loadImage(SHEET);
    const columns = 5;
    const rows = 2;
    const outputSize = 320;
    const attack = [];

    for (let index = 0; index < 10; index += 1) {
      const column = index % columns;
      const row = Math.floor(index / columns);

      // Split the supplied 5x2 sheet into ten independent cells.
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
      ctx.clearRect(0, 0, outputSize, outputSize);

      // Keep every frame on the same 320x320 transparent stage so the feet/body
      // do not jump when the attack is played.
      const scale = Math.min((outputSize - 4) / sw, (outputSize - 4) / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      ctx.drawImage(
        sheet, sx, sy, sw, sh,
        Math.round((outputSize - dw) / 2),
        Math.round((outputSize - dh) / 2),
        Math.round(dw), Math.round(dh)
      );

      cutWhiteBackground(ctx, outputSize, outputSize);
      attack.push(await canvasToObjectUrl(canvas));
    }

    cached = {
      attack,
      idle: attack[0],
      // No dedicated hit/death art exists yet.
      hit: [attack[0]],
      death: [attack[9]]
    };
    return cached;
  }

  root.V2DraculaFrames = Object.freeze({ prepare });
})(globalThis);
