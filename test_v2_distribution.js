"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = __dirname;
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const exists = (f) => fs.existsSync(path.join(root, f.split(/[?#]/)[0]));
const retired = ["game.js", "styles.css", "unit-data.js", "map-generator.js", "encounter-generator.js", "event-data.js", "dice-overlay.js", "dice-overlay.css", "ultimate-vfx.js", "ultimate-vfx.css"];
for (const f of retired) assert(!exists(f), `V1 file remains: ${f}`);
const files = fs.readdirSync(root).filter(f => /^(?:v2.*|launch.*|index.html|service-worker.js|manifest.webmanifest)$/.test(f));
const cacheContext = { self: { addEventListener() {} } };
vm.runInNewContext(read("service-worker.js") + ";globalThis.shell = APP_SHELL;", cacheContext);
const shell = new Set(cacheContext.shell.map(f => f.replace(/^\.\//, "")));
assert.equal(shell.size, cacheContext.shell.length, "Duplicate precache entries");
for (const f of shell) assert(exists(f), `Missing precache resource: ${f}`);
for (const f of files) {
  const source = read(f);
  for (const old of retired) {
    const escaped = old.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert(!new RegExp(`["'\x60/](?:\\./)?${escaped}(?:[?"'\x60])`).test(source), `${f} depends on ${old}`);
  }
  assert(!source.includes("art/processed/"), `${f} uses V1 artwork`);
  if (f.endsWith(".html")) {
    assert(source.includes("<title>네크로멘서 앤드 다이스"), `${f} has obsolete branding`);
    for (const [, ref] of source.matchAll(/(?:src|href)="([^"#]+)"/g)) {
      if (/^(https?:|data:)/.test(ref) || ref.includes("${")) continue;
      assert(exists(ref), `${f}: broken reference ${ref}`);
      if (/\.(js|css)(\?|$)/.test(ref)) assert(shell.has(ref), `${f}: current script/style not cached: ${ref}`);
    }
  }
  if (f.endsWith(".css")) {
    for (const [, ref] of source.matchAll(/url\(["']?([^\s)"']+)["']?\)/g)) {
      if (/^(data:|https?:|#)/.test(ref)) continue;
      assert(exists(ref), `${f}: broken CSS asset ${ref}`);
    }
  }
}
const units = require("./v2-unit-data").UNIT_TYPES;
assert.equal(Object.keys(units).length, 47);
for (const [id, unit] of Object.entries(units)) {
  assert(unit.image.startsWith("art/v2-style/"), `${id}: non-V2 image`);
  assert(exists(unit.image), `${id}: missing portrait`);
  assert(shell.has(unit.image), `${id}: portrait not cached`);
}
const manifest = JSON.parse(read("manifest.webmanifest"));
assert.equal(manifest.name, "네크로멘서 앤드 다이스");
assert(exists(manifest.start_url));
for (const icon of manifest.icons) assert(exists(icon.src));
assert(read("index.html").includes('href="v2-map-practice.html"'));
// Model activation against a browser with an old game cache and an unrelated cache.
let activation;
const deleted = [];
const context = { self: { addEventListener(type, handler) { if (type === "activate") activation = handler; }, clients: { claim() {} } }, caches: { keys: async () => ["necromancer-expedition-v285", "unrelated-app"], delete: async key => deleted.push(key) } };
vm.runInNewContext(read("service-worker.js"), context);
let complete;
activation({ waitUntil(promise) { complete = promise; } });
complete.then(() => {
  assert.deepEqual(deleted, ["necromancer-expedition-v285"]);
  console.log(`PASS: V2-only distribution, ${files.length} entry/runtime files, ${shell.size} cached resources, 47 portraits and scoped cache migration.`);
}).catch(error => { console.error(error); process.exitCode = 1; });
