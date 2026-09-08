(function (root) {
  const RATIOS = Object.freeze({
    "bone-golem": 1.5, "death-knight": 1, "plague-frog": .5, "grave-worm": .5,
    "spider-knight": 2, "stone-golem": 2, "flesh-golem": 1.5,
    "skeleton-cavalry": 1.5, spiderling: .5, "guardian-seed": .5,
    "goblin-chief": 1.5, kraken: 2, minotaur: 1.5,
    "goblin-rider": 1, yeti: 1.5, "orc-warrior": 1.5, hydra: 2
  });
  function measure(image) {
    const canvas = root.document.createElement("canvas");
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let top = canvas.height, bottom = -1;
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      if (pixels[(y * canvas.width + x) * 4 + 3] >= 128) {
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
    return { width: canvas.width, height: canvas.height, top, bottom };
  }
  function layout(m, width, height, ratio) {
    const fit = Math.min(width / m.width, height / m.height);
    const bodyHeight = (m.bottom - m.top + 1) * fit;
    // Death Knight's standing body occupies 210px of its 320px-wide frame.
    return { scale: width * (210 / 320) * ratio / bodyHeight,
      foot: (height - m.height * fit) / 2 + (m.bottom + 1) * fit };
  }
  function attach(unit) {
    const image = unit.image;
    let metrics;
    function update() {
      if (!metrics || !image.clientWidth || !image.clientHeight) return;
      const result = layout(metrics, image.clientWidth, image.clientHeight, RATIOS[unit.slug] || 1);
      image.style.scale = String(result.scale);
      image.style.transformOrigin = `50% ${result.foot}px`;
    }
    function initialize() {
      if (metrics || !image.naturalWidth) return;
      try { metrics = measure(image); if (metrics.bottom < 0) { metrics = null; return; } update(); }
      catch (error) { console.warn("Unit size measurement failed", unit.slug, error); }
    }
    image.addEventListener("load", initialize);
    if (image.complete) initialize();
    // Same multiplier for every motion; no per-frame size pumping.
    if (root.ResizeObserver) {
      const observer = new root.ResizeObserver(() => {
        if (!image.isConnected) { observer.disconnect(); return; }
        update();
      });
      observer.observe(image);
    }
  }
  const api = { RATIOS, layout, attach };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.V2UnitSize = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
