"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = __dirname;
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file.split(/[?#]/)[0]));

const retired = ["game.js", "styles.css", "unit-data.js", "map-generator.js", "encounter-generator.js", "event-data.js", "dice-overlay.js", "dice-overlay.css", "ultimate-vfx.js", "ultimate-vfx.css"];
for (const file of retired) assert(!exists(file), `V1 file remains: ${file}`);

const files = fs.readdirSync(root).filter(file => /^(?:v2.*|launch.*|index.html|service-worker.js|manifest.webmanifest)$/.test(file));
const worker = read("service-worker.js");
const cacheContext = { self: { addEventListener() {} }, URL, Request: class { constructor(url){ this.url=String(url); this.destination=""; } } };
vm.runInNewContext(worker + ";globalThis.shell = CORE_ASSETS;", cacheContext);
const shell = new Set(cacheContext.shell.map(file => file.replace(/^\.\//, "")));
assert.equal(shell.size, cacheContext.shell.length, "Duplicate core precache entries");
for (const file of shell) assert(exists(file), `Missing core precache resource: ${file}`);

assert(worker.includes("function cacheFirst") && worker.includes("function networkFirst"),
  "Service worker must expose cache-first assets and network-first documents/scripts.");
assert(worker.includes('["image", "audio", "video", "font"]') && worker.includes("cacheFirst(event.request)"),
  "Runtime media must use on-demand cache-first loading.");
assert(worker.includes("Promise.allSettled(CORE_ASSETS.map"),
  "Core precache must tolerate independent optional asset failures.");

for (const file of files) {
  const source = read(file);
  for (const old of retired) {
    const escaped = old.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert(!new RegExp(`["'\\x60/](?:\\./)?${escaped}(?:[?"'\\x60])`).test(source), `${file} depends on ${old}`);
  }
  assert(!source.includes("art/processed/"), `${file} uses V1 artwork`);
  if (file.endsWith(".html")) {
    assert(source.includes("<title>네크로멘서 앤드 다이스"), `${file} has obsolete branding`);
    for (const [, ref] of source.matchAll(/(?:src|href)="([^"#]+)"/g)) {
      if (/^(https?:|data:)/.test(ref) || ref.includes("${")) continue;
      assert(exists(ref), `${file}: broken reference ${ref}`);
    }
  }
  if (file.endsWith(".css")) {
    for (const [, ref] of source.matchAll(/url\(["']?([^\s)"']+)["']?\)/g)) {
      if (/^(data:|https?:|#)/.test(ref)) continue;
      assert(exists(ref), `${file}: broken CSS asset ${ref}`);
    }
  }
}

const units = require("./v2-unit-data").UNIT_TYPES;
assert.equal(Object.keys(units).length, 47);
for (const [id, unit] of Object.entries(units)) {
  assert(unit.image.startsWith("art/v2-style/"), `${id}: non-V2 image`);
  assert(exists(unit.image), `${id}: missing portrait`);
}

const manifest = JSON.parse(read("manifest.webmanifest"));
assert.equal(manifest.name, "네크로멘서 앤드 다이스");
assert(exists(manifest.start_url));
for (const icon of manifest.icons) assert(exists(icon.src));
assert(read("index.html").includes('href="v2-map-practice.html"'));

let activation;
const deleted = [];
const context = {
  URL,
  Request: class {},
  self: { addEventListener(type, handler) { if (type === "activate") activation = handler; }, clients: { claim() {} } },
  caches: { keys: async () => ["necromancer-expedition-v285", "unrelated-app"], delete: async key => deleted.push(key) }
};
vm.runInNewContext(worker, context);
let complete;
activation({ waitUntil(promise) { complete = promise; } });
complete.then(() => {
  assert.deepEqual(deleted, ["necromancer-expedition-v285"]);
  console.log(`PASS: V2 distribution, ${files.length} entry/runtime files, ${shell.size} resilient core assets, lazy media cache, 47 portraits and scoped cache migration.`);
}).catch(error => { console.error(error); process.exitCode = 1; });
