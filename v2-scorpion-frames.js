(function (root) {
  "use strict";
  const shared = typeof module !== "undefined" && module.exports ? require("./v2-mantis-frames.js") : root.V2MantisFrames;
  const SHEET = "art/v2-style/animation-sheets/green-raw/scorpion-knight-animation-sheet.jpg";
  const ROWS = {
    attack: { edges: [120, 344, 570, 806, 1034, 1268], top: 20, bottom: 244 },
    hit: { edges: [120, 344, 570, 806], top: 248, bottom: 478 },
    death: { edges: [120, 300, 506, 724, 1054, 1268], top: 482, bottom: 690 }
  };
  function mirrored() { return false; }
  // The isolated pink sparkle is a sheet decoration, not part of the remains.
  function mask(motion, index, x, y) { return motion === "death" && index === 4 && x >= 1140 && x < 1208 && y < 610; }
  function buildFrames(image, document) { return shared.buildFrames(image, document, { rows: ROWS, canvasWidth: 340, mirrored, mask }); }
  let cached;
  function prepare() {
    if (!cached) cached = new Promise((resolve, reject) => {
      const image = new root.Image();
      image.onload = () => { try { resolve(buildFrames(image, root.document)); } catch (error) { reject(error); } };
      image.onerror = () => reject(new Error("Scorpion sheet failed to load"));
      image.src = SHEET;
    }).catch(error => { cached = null; throw error; });
    return cached;
  }
  const api = { SHEET, ROWS, mirrored, mask, keyMagenta: shared.keyMagenta, buildFrames, prepare };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.V2ScorpionFrames = api;
})(globalThis);
