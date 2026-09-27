"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const files = fs.readdirSync(root).filter(file => /^test.*\.js$/.test(file)).sort();
let failures = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, [file], { cwd: root, encoding: "utf8", timeout: 60000 });
  const passed = result.status === 0;
  console.log(`${passed ? "PASS" : "FAIL"}: ${file}`);
  if (!passed) {
    failures++;
    console.error(result.error || result.stderr || result.stdout);
  }
}
console.log(`${files.length - failures}/${files.length} passed; ${failures} failed`);
process.exitCode = failures ? 1 : 0;
