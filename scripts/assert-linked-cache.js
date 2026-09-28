"use strict";
const assert = require("node:assert/strict");
module.exports = function assertLinkedCache(html, worker, filenames) {
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
  for (const filename of filenames) {
    const matches = refs.filter(ref => ref.split("?")[0] === filename);
    assert.equal(matches.length, 1, `Expected one reference to ${filename}`);
    assert(worker.includes(JSON.stringify("./" + matches[0])), `Current reference not cached: ${matches[0]}`);
  }
};
