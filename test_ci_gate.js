"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const workflow = fs.readFileSync(".github/workflows/verify-and-deploy.yml", "utf8");
const verify = workflow.split("  verify:")[1].split("  deploy:")[0];
assert(verify.includes("run: npm test"));
assert(verify.includes("npm run test:browser"));
assert(!/continue-on-error:\s*true|if:\s*false/.test(verify), "Mandatory checks must not be bypassed");
assert(/needs:\s*verify/.test(workflow.split("  deploy:")[1]), "Deployment requires successful verification");
assert(verify.includes("timeout-minutes:"), "Browser step must be bounded");

// Run the actual suite runner with deterministic child results, including crashes/timeouts.
const runner = fs.readFileSync("scripts/test-v2-all.js", "utf8");
for (const statuses of [[0, 0, 0], [0, 1, 0], [0, null, 0], [1]]) {
  let call = 0, exited = false;
  const fakeProcess = {
    execPath: process.execPath, exitCode: 0,
    exit(code) { this.exitCode = code; exited = true; throw new Error("test-exit"); }
  };
  try {
    vm.runInNewContext(runner, {
      __dirname: path.resolve("scripts"), process: fakeProcess,
      console: { log() {}, error() {} },
      require(name) {
        if (name === "node:fs") return { readdirSync: () => ["test_a.js", "test_b.js"] };
        if (name === "node:path") return path;
        if (name === "node:child_process") return { spawnSync: () => ({status: statuses[call++]}) };
        throw new Error("Unexpected dependency: " + name);
      }
    });
  } catch (error) { if (!exited) throw error; }
  assert.equal(fakeProcess.exitCode, statuses.every(status => status === 0) ? 0 : 1);
}
console.log("PASS: mandatory CI gates and suite nonzero exit on failure, timeout and syntax error");
