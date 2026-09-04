(function (root) {
  "use strict";
  const shared = typeof module !== "undefined" && module.exports ? require("./v2-mantis-frames.js") : root.V2MantisFrames;
  const SHEET = "art/v2-style/animation-sheets/green-raw/bone-hound-animation-sheet.jpg";
  const ROWS = {
    attack: { edges: [108, 344, 572, 802, 1032, 1268], top: 40, bottom: 240 },
    hit: { edges: [108, 344, 574, 804, 1034], top: 250, bottom: 484 },
    death: { edges: [108, 308, 502, 702, 894, 1084, 1268], top: 510, bottom: 690 }
  };
  function mirrored() { return false; }
  function mask(motion, index, x, y) { return motion === "death" && index === 5 && x >= 1140 && x < 1208 && y < 608; }
  function buildFrames(image, document) { return shared.buildFrames(image, document, { rows: ROWS, mirrored, mask }); }
  let cached;
  function prepare() {
    if (!cached) cached = new Promise((resolve, reject) => {
      const image = new root.Image();
      image.onload = () => { try { resolve(buildFrames(image, root.document)); } catch (error) { reject(error); } };
      image.onerror = () => reject(new Error("Bone hound sheet failed to load"));
      image.src = SHEET;
    }).catch(error => { cached = null; throw error; });
    return cached;
  }
  const api = { SHEET, ROWS, mirrored, mask, keyMagenta: shared.keyMagenta, buildFrames, prepare };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.V2HoundFrames = api;
})(globalThis);
