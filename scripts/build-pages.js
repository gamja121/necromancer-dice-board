"use strict";
// Assemble deployable files only. Never copy Git metadata, tests or source documents.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const output = path.join(root, "_site");
fs.mkdirSync(output); // Refuse to silently overwrite an existing build.
for (const name of fs.readdirSync(root)) {
  if (["art", "assets"].includes(name) ||
      /^(?:v2-.*\.(?:js|css|html)|v2\.html|index\.html|launch\.(?:js|css)|service-worker\.js|manifest\.webmanifest|\.nojekyll)$/.test(name)) {
    fs.cpSync(path.join(root, name), path.join(output, name), { recursive: true });
  }
}
console.log("Pages artifact prepared in _site");
