(function(root) {
  "use strict";

  const SHEET = "art/v2-style/animation-sheets/uploaded-raw/dracula-attack.webp?v=1";
  const COLUMNS = 5;
  const ROWS = 2;
  const FRAME_COUNT = 10;
  const CANVAS_SIZE = 320;
  const BOTTOM_PAD = 10;
  let cached;

  function keyWhite(data) {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const min = Math.min(r, g, b);
      const max = Math.max(r, g, b);
      const neutral = max - min <= 20;

      if (neutral && min >= 248) {
        data[i + 3] = 0;
      } else if (neutral && min >= 232) {
        const alpha = Math.max(0, Math.min(255, Math.round((248 - min) / 16 * 255)));
        data[i + 3] = Math.min(data[i + 3], alpha);
      }
    }
  }

  function alphaBounds(pixels, width, height) {
    let left = width, top = height, right = -1, bottom = -1;
    const data = pixels.data;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (data[(y * width + x) * 4 + 3] <= 8) continue;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
    return right < left ? null : { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1 };
  }

  function buildFrames(image, document) {
    if (!image.naturalWidth || !image.naturalHeight) throw new Error("Dracula sheet has no dimensions");

    const prepared = [];
    let maxWidth = 1;
    let maxHeight = 1;

    for (let index = 0; index < FRAME_COUNT; index += 1) {
      const column = index % COLUMNS;
      const row = Math.floor(index / COLUMNS);
      const sx = Math.round(column * image.naturalWidth / COLUMNS);
      const sy = Math.round(row * image.naturalHeight / ROWS);
      const ex = Math.round((column + 1) * image.naturalWidth / COLUMNS);
      const ey = Math.round((row + 1) * image.naturalHeight / ROWS);
      const sw = ex - sx;
      const sh = ey - sy;

      const cut = document.createElement("canvas");
      cut.width = sw;
      cut.height = sh;
      const ctx = cut.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);

      const pixels = ctx.getImageData(0, 0, sw, sh);
      keyWhite(pixels.data);
      ctx.putImageData(pixels, 0, 0);

      const bounds = alphaBounds(pixels, sw, sh);
      if (!bounds) throw new Error("Empty Dracula attack frame " + (index + 1));

      maxWidth = Math.max(maxWidth, bounds.width);
      maxHeight = Math.max(maxHeight, bounds.height);
      prepared.push({ cut, bounds });
    }

    // One shared scale for all ten frames prevents the character changing size mid-swing.
    const scale = Math.min(
      1,
      (CANVAS_SIZE - 8) / maxWidth,
      (CANVAS_SIZE - BOTTOM_PAD - 4) / maxHeight
    );

    const attack = prepared.map(({ cut, bounds }) => {
      const frame = document.createElement("canvas");
      frame.width = CANVAS_SIZE;
      frame.height = CANVAS_SIZE;
      const ctx = frame.getContext("2d");

      const dw = Math.round(bounds.width * scale);
      const dh = Math.round(bounds.height * scale);
      const dx = Math.round((CANVAS_SIZE - dw) / 2);
      const dy = CANVAS_SIZE - BOTTOM_PAD - dh;

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.drawImage(
        cut,
        bounds.left, bounds.top, bounds.width, bounds.height,
        dx, dy, dw, dh
      );
      return frame.toDataURL("image/png");
    });

    return {
      attack,
      idle: attack[0],
      hit: [attack[0]],
      death: [attack[9]]
    };
  }

  function prepare() {
    if (!cached) {
      cached = new Promise((resolve, reject) => {
        const image = new root.Image();
        image.onload = () => {
          try {
            resolve(buildFrames(image, root.document));
          } catch (error) {
            reject(error);
          }
        };
        image.onerror = () => reject(new Error("Dracula sheet failed to load"));
        image.src = SHEET;
      }).catch((error) => {
        cached = null;
        throw error;
      });
    }
    return cached;
  }

  const api = { SHEET, COLUMNS, ROWS, FRAME_COUNT, keyWhite, buildFrames, prepare };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.V2DraculaFrames = api;
})(globalThis);
