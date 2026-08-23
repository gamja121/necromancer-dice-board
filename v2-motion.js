(function (root) {
  "use strict";

  const DEFINITIONS = {
    goblinSoldier: {
      sheet: "art/v2-style/animation-practice/goblin-motion-sheet.jpg",
      idle: [1002, 58, 220, 182],
      attack: [
        [52, 43, 185, 190], [270, 44, 190, 190], [492, 48, 210, 188],
        [742, 54, 210, 180], [1001, 53, 210, 184]
      ],
      hit: [
        [55, 245, 185, 174], [287, 244, 190, 174],
        [526, 250, 190, 169], [769, 250, 190, 169]
      ],
      death: [
        [46, 438, 190, 193], [274, 444, 188, 185], [487, 443, 198, 187],
        [690, 448, 210, 180], [870, 467, 220, 160], [1041, 486, 226, 145]
      ],
      frameMs: { attack: 112, hit: 92, death: 125 },
      impactFrame: 3
    },
    minotaur: {
      sheet: "art/v2-style/animation-practice/minotaur-motion-sheet.jpg",
      idle: [1037, 42, 226, 184],
      attack: [
        [45, 28, 198, 199], [277, 27, 197, 199], [500, 31, 220, 196],
        [742, 41, 220, 188], [1009, 39, 235, 188]
      ],
      hit: [
        [46, 255, 207, 174], [281, 254, 210, 175],
        [526, 256, 205, 173], [779, 258, 210, 170]
      ],
      death: [
        [45, 459, 205, 194], [273, 454, 205, 196], [485, 469, 211, 184],
        [671, 484, 220, 169], [839, 505, 218, 145]
      ],
      frameMs: { attack: 132, hit: 105, death: 145 },
      impactFrame: 3
    }
  };

  const prepared = new Map();
  let playSequence = 0;

  function wait(ms) {
    return new Promise((resolve) => root.setTimeout(() => resolve(true), ms));
  }

  function supports(type) {
    return Object.prototype.hasOwnProperty.call(DEFINITIONS, type);
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new root.Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Motion sheet failed to load: " + src));
      image.src = src;
    });
  }

  function cropFrame(sheet, rect) {
    const [sx, sy, sw, sh] = rect;
    const sample = root.document.createElement("canvas");
    sample.width = sw;
    sample.height = sh;
    const sampleContext = sample.getContext("2d", { willReadFrequently: true });
    sampleContext.drawImage(sheet, sx, sy, sw, sh, 0, 0, sw, sh);
    const pixels = sampleContext.getImageData(0, 0, sw, sh);
    let minX = sw;
    let minY = sh;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < sh; y += 1) {
      for (let x = 0; x < sw; x += 1) {
        const index = (y * sw + x) * 4;
        const red = pixels.data[index];
        const green = pixels.data[index + 1];
        const blue = pixels.data[index + 2];
        const whiteness = Math.min(red, green, blue);
        const spread = Math.max(red, green, blue) - whiteness;
        if (whiteness > 245 && spread < 8) pixels.data[index + 3] = 0;
        else if (whiteness > 224 && spread < 16) {
          pixels.data[index + 3] = Math.max(0, 255 - (whiteness - 224) * 8);
        }
        if (pixels.data[index + 3] > 24) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    sampleContext.putImageData(pixels, 0, 0);

    const output = root.document.createElement("canvas");
    output.width = 384;
    output.height = 384;
    if (maxX < minX || maxY < minY) return output.toDataURL("image/png");
    const boundsWidth = maxX - minX + 1;
    const boundsHeight = maxY - minY + 1;
    const scale = Math.min(332 / boundsWidth, 332 / boundsHeight);
    const drawWidth = boundsWidth * scale;
    const drawHeight = boundsHeight * scale;
    output.getContext("2d").drawImage(
      sample, minX, minY, boundsWidth, boundsHeight,
      (384 - drawWidth) / 2, 374 - drawHeight, drawWidth, drawHeight
    );
    return output.toDataURL("image/png");
  }

  function prepare(type) {
    if (!supports(type)) return Promise.resolve(null);
    if (prepared.has(type)) return prepared.get(type);
    const definition = DEFINITIONS[type];
    const promise = loadImage(definition.sheet).then((sheet) => ({
      idle: cropFrame(sheet, definition.idle),
      attack: definition.attack.map((rect) => cropFrame(sheet, rect)),
      hit: definition.hit.map((rect) => cropFrame(sheet, rect)),
      death: definition.death.map((rect) => cropFrame(sheet, rect))
    })).catch((error) => {
      prepared.delete(type);
      throw error;
    });
    prepared.set(type, promise);
    return promise;
  }

  async function applyIdle(type, sprite, options = {}) {
    if (!supports(type) || !sprite) return false;
    const frames = await prepare(type);
    const guard = options.guard || (() => true);
    if (!frames || !guard() || sprite.dataset.motionPlayId) return false;
    sprite.classList.add("is-motion-sprite");
    sprite.src = frames.idle;
    return true;
  }

  async function play(type, sprite, motion, options = {}) {
    if (!supports(type) || !sprite || !["attack", "hit", "death"].includes(motion)) return false;
    const frames = await prepare(type);
    const definition = DEFINITIONS[type];
    const guard = options.guard || (() => true);
    const waitFor = options.wait || wait;
    if (!frames || !guard()) return false;

    const playId = String(++playSequence);
    sprite.dataset.motionPlayId = playId;
    sprite.classList.add("is-motion-sprite");
    const sequence = frames[motion];
    const reducedMotion = root.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const indices = reducedMotion
      ? [Math.min(definition.impactFrame, sequence.length - 1), sequence.length - 1]
      : sequence.map((_, index) => index);

    for (const index of [...new Set(indices)]) {
      if (!guard() || sprite.dataset.motionPlayId !== playId) return false;
      sprite.src = sequence[index];
      options.onFrame?.(index, sequence.length);
      const continued = await waitFor(reducedMotion ? 1 : definition.frameMs[motion]);
      if (continued === false) return false;
    }

    if (guard() && sprite.dataset.motionPlayId === playId && motion !== "death") {
      sprite.src = frames.idle;
    }
    if (sprite.dataset.motionPlayId === playId) delete sprite.dataset.motionPlayId;
    return true;
  }

  function preload(types = Object.keys(DEFINITIONS)) {
    return Promise.all(types.filter(supports).map((type) => prepare(type).catch(() => null)));
  }

  root.V2Motion = Object.freeze({
    supports,
    prepare,
    preload,
    applyIdle,
    play,
    impactFrame: (type) => DEFINITIONS[type]?.impactFrame ?? 0,
    frameCount: (type, motion) => DEFINITIONS[type]?.[motion]?.length ?? 0
  });
})(window);
