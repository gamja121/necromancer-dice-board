"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
let count = 0;
for (const dir of [root, __dirname]) {
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith(".js"))) {
    const result = spawnSync(process.execPath, ["--check", path.join(dir, file)], { encoding: "utf8", timeout: 10000 });
    if (result.status !== 0) {
      console.error(result.error || result.stderr);
      process.exit(1);
    }
    count++;
  }
}
console.log(`PASS: syntax of ${count} JavaScript files`);
