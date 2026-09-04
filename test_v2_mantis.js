const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const scorpion = process.argv.includes("--scorpion");
const hound = process.argv.includes("--hound");
const slug = hound ? "bone-hound" : scorpion ? "scorpion-knight" : "hell-mantis";
const label = hound ? "뼈 사냥개" : scorpion ? "전갈 기사" : "지옥 사마귀";
const canvasWidth = scorpion ? 340 : 280;
const api = require(hound ? "./v2-hound-frames.js" : scorpion ? "./v2-scorpion-frames.js" : "./v2-mantis-frames.js");
const sheet = path.join(__dirname, api.SHEET);
// Decode the actual JPEG read-only, then run the browser crop/key/flip code.
const command = `Add-Type -AssemblyName System.Drawing; $b = [System.Drawing.Bitmap]::new('${sheet.replace(/'/g, "''")}'); try { if ($b.Width -ne 1280 -or $b.Height -ne 698) { throw 'Wrong sheet dimensions' }; $r = [System.Drawing.Rectangle]::new(0,0,1280,698); $d = $b.LockBits($r,[System.Drawing.Imaging.ImageLockMode]::ReadOnly,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb); try { $p = [byte[]]::new(1280*698*4); [System.Runtime.InteropServices.Marshal]::Copy($d.Scan0,$p,0,$p.Length); [Convert]::ToBase64String($p) } finally { $b.UnlockBits($d) } } finally { $b.Dispose() }`;
const bgra = Buffer.from(execFileSync("powershell.exe", ["-NoProfile", "-Command", command], { maxBuffer: 8 * 1024 * 1024 }).toString().trim(), "base64");
assert.equal(bgra.length, 1280 * 698 * 4);
const frames = [];
const document = { createElement() {
  let region, flip = false, drawn;
  const canvas = { width: 0, height: 0, getContext() { return {
    drawImage(source, ...args) { if (source.naturalWidth) region = args.slice(0, 4); else drawn = args; },
    getImageData() {
      const [sx, sy, w, h] = region;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const p = ((sy + y) * 1280 + sx + x) * 4, q = (y * w + x) * 4;
        data[q] = bgra[p + 2]; data[q + 1] = bgra[p + 1]; data[q + 2] = bgra[p]; data[q + 3] = 255;
      }
      return { data };
    },
    putImageData() {},
    translate(x,y) { assert.deepEqual([x,y], [280,0]); },
    scale(x,y) { assert.deepEqual([x,y], [-1,1]); flip = true; }
  }; }, toDataURL() {
    assert.equal(canvas.width, canvasWidth); assert.equal(canvas.height, 260);
    const [sx, sy, sw, sh, dx, dy, dw, dh] = drawn;
    assert(sw > 40 && sh > 40);
    assert(dx >= 8 && dy >= 8 && dx + dw <= canvasWidth - 8 && dy + dh === 250, "Safe edges and a shared foot baseline");
    frames.push({ flip, width: sw, height: sh });
    return "frame-" + frames.length;
  } };
  return canvas;
} };
const result = api.buildFrames({ naturalWidth: 1280, naturalHeight: 698 }, document);
assert.equal(result.attack.length, 5); assert.equal(result.hit.length, scorpion ? 3 : 4); assert.equal(result.death.length, scorpion ? 5 : 6);
assert.equal(result.idle, result.attack[0]);
assert.deepEqual(frames.flatMap((f,i) => f.flip ? [i] : []), scorpion || hound ? [] : [4], "Only mantis attack frame 5 is mirrored");
const pixels = new Uint8ClampedArray([255,0,255,255, 50,70,45,255]);
api.keyMagenta(pixels);
assert.equal(pixels[3], 0); assert.deepEqual(Array.from(pixels.slice(4)), [50,70,45,255]);
const html = fs.readFileSync(path.join(__dirname,"v2-animation-practice.html"),"utf8");
const js = fs.readFileSync(path.join(__dirname,"v2-animation-practice.js"),"utf8");
assert(html.includes('data-unit="' + slug + '"'));
assert(html.indexOf('src="v2-mantis-frames.js') < html.indexOf('src="v2-animation-practice.js'));
assert(js.includes('await V2MantisFrames.prepare()'));
if (scorpion) {
  assert(api.mask("death",4,1170,588));
  assert(!api.mask("death",4,1170,630));
  assert(!api.mask("attack",4,1170,100));
  assert(html.indexOf('src="v2-mantis-frames.js') < html.indexOf('src="v2-scorpion-frames.js'));
}
if (hound) {
  assert(api.mask("death",5,1170,588));
  assert(!api.mask("death",5,1170,625));
  assert(!api.mask("attack",4,1170,100));
  assert(html.indexOf('src="v2-mantis-frames.js') < html.indexOf('src="v2-hound-frames.js'));
}
console.log("PASS: " + slug + " actual JPEG crop margins, mirroring, transparency, baseline and integration.");
console.log(frames);
async function testPlayer() {
  const vm = require("node:vm");
  const shown = [], elements = new Map();
  function element() { return { disabled: true, style: {}, dataset: {}, classList: { toggle() {} }, handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; } }; }
  const sprite = element();
  Object.defineProperty(sprite, "src", { set(value) { shown.push(value); } });
  elements.set("#unitSprite", sprite);
  const context = {
    console, URLSearchParams, window: { location: { search: "?unit=" + slug } },
    document: { querySelector(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); }, querySelectorAll() { return []; } },
    V2MantisFrames: { prepare: async () => result },
    V2ScorpionFrames: { prepare: async () => result },
    V2HoundFrames: { prepare: async () => result },
    Image: class { set src(value) { queueMicrotask(() => this.onload()); } },
    setTimeout: fn => queueMicrotask(fn)
  };
  vm.runInNewContext(js, context);
  await new Promise(setImmediate);
  assert.equal(elements.get("#unitName").textContent, label);
  assert.equal(elements.get("#attackBtn").disabled, false);
  for (const motion of ["attack", "hit", "death"]) {
    shown.length = 0;
    await elements.get("#" + motion + "Btn").handlers.click();
    const expected = motion === "death" ? result[motion] : [...result[motion], result.idle];
    assert.deepEqual(shown, expected, "Actual player frame order: " + motion);
    assert.equal(elements.get("#attackBtn").disabled, false);
  }
  elements.get("#resetBtn").handlers.click();
  assert.equal(shown.at(-1), result.idle);
  console.log("PASS: actual motion player attack/hit/death sequences and reset.");
}
testPlayer().catch(error => { console.error(error); process.exitCode = 1; });
