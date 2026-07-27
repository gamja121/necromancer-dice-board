/* test_ultimate_vfx.js */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

console.log("=== 2.5D Ultimate VFX Unit Test Suite ===");

const projectDir = __dirname;

// Setup minimal browser mock environment for Node
const domListeners = [];
const documentMock = {
  body: {
    appendChild(el) {
      el.parentNode = this;
      return el;
    },
    removeChild(el) {
      if (el.parentNode === this) {
        el.parentNode = null;
      }
      return el;
    }
  },
  createElement(tag) {
    const el = {
      tagName: tag.toUpperCase(),
      className: "",
      removeAttribute(attr) {},
      remove() {
        if (this.parentNode) {
          this.parentNode.removeChild(this);
        }
      },
      style: {
        setProperty(name, val) {
          this[name] = val;
        }
      },
      parentNode: null,
      classList: {
        classes: new Set(),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
        contains(c) { return this.classes.has(c); }
      },
      appendChild(child) {
        child.parentNode = this;
        return child;
      },
      removeChild(child) {
        if (child.parentNode === this) {
          child.parentNode = null;
        }
        return child;
      },
      cloneNode() {
        return documentMock.createElement(tag);
      },
      querySelector(selector) {
        if (selector.includes("[data-row")) {
          // target cell query mock
          const match = selector.match(/data-row=\"(\d+)\"\]\[data-col=\"(\d+)\"/);
          if (match && match[1] !== "99") {
            return {
              offsetWidth: 80,
              offsetHeight: 80,
              offsetLeft: 160,
              offsetTop: 160,
              parentNode: this
            };
          }
        }
        return null;
      },
      getBoundingClientRect() {
        return { left: 100, top: 100, width: 400, height: 400 };
      }
    };
    if (tag === "canvas") {
      el.getContext = () => ({
        clearRect() {},
        save() {},
        restore() {},
        scale() {},
        beginPath() {},
        closePath() {},
        moveTo() {},
        lineTo() {},
        stroke() {},
        translate() {},
        rotate() {},
        fill() {}
      });
    }
    return el;
  },
  addEventListener(event, callback) {
    domListeners.push({ event, callback });
  }
};

const windowMock = {
  matchMedia(query) {
    return {
      matches: false, // default no prefers-reduced-motion
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {}
    };
  },
  requestAnimationFrame(cb) {
    return setTimeout(() => cb(performance.now()), 16);
  },
  cancelAnimationFrame(id) {
    clearTimeout(id);
  },
  AudioContext: function() {
    return {
      state: "suspended",
      resume() { return Promise.resolve(); },
      currentTime: 1.0,
      sampleRate: 44100,
      createOscillator() {
        return {
          frequency: {
            setValueAtTime() {},
            exponentialRampToValueAtTime() {}
          },
          connect() {},
          start() {},
          stop() {}
        };
      },
      createGain() {
        return {
          gain: {
            setValueAtTime() {},
            linearRampToValueAtTime() {},
            exponentialRampToValueAtTime() {}
          },
          connect() {}
        };
      },
      createBuffer(channels, size, rate) {
        return {
          getChannelData() { return new Float32Array(size); }
        };
      },
      createBufferSource() {
        return {
          buffer: null,
          connect() {},
          start() {},
          stop() {}
        };
      },
      createBiquadFilter() {
        return {
          type: "",
          frequency: { setValueAtTime() {} },
          Q: { setValueAtTime() {} },
          connect() {}
        };
      },
      destination: {}
    };
  },
  Image: function() {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 10);
    return this;
  }
};

const sandbox = {
  document: documentMock,
  window: windowMock,
  navigator: {
    vibrate() {}
  },
  Image: windowMock.Image,
  requestAnimationFrame: windowMock.requestAnimationFrame,
  cancelAnimationFrame: windowMock.cancelAnimationFrame,
  performance: {
    now() { return Date.now(); }
  },
  console: {
    log: console.log,
    warn: console.warn,
    error: console.error
  },
  state: {
    musicMuted: false,
    sfxVolume: 0.8,
    isRolling: false,
    vibrationEnabled: true
  },
  setTimeout,
  clearTimeout
};

vm.createContext(sandbox);

// Load ultimate-vfx.js in the sandbox
const vfxCode = fs.readFileSync(path.join(projectDir, "ultimate-vfx.js"), "utf8");
vm.runInContext(vfxCode, sandbox);

const UltimateVfx = sandbox.window.UltimateVfx || sandbox.UltimateVfx;

// Helper to wait
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function runTests() {
  // Test 1: preload method
  console.log("Test 1: preload starts...");
  const preloaded = await UltimateVfx.preload();
  assert.strictEqual(preloaded, true, "Preloading should complete successfully");
  console.log("Pass: Preloading completed successfully.");

  // Test 2: normal animation flow and resolution
  console.log("Test 2: normal impact animation starts...");
  const boardEl = documentMock.createElement("div");
  const wrapEl = documentMock.createElement("div");
  wrapEl.appendChild(boardEl);

  let impactFired = false;
  const pImpact = UltimateVfx.playGreatswordImpact({
    boardElement: boardEl,
    targetCell: { row: 1, col: 1 },
    attackerOwner: "player",
    damage: 3,
    isKill: false,
    onImpact: () => {
      impactFired = true;
    }
  });

  // Since requestAnimationFrame is mocked via setTimeout, it will proceed automatically.
  // Wait a bit to verify intermediate states.
  await wait(100);
  assert.strictEqual(sandbox.state.isRolling, true, "State should be locked to isRolling");

  const result = await pImpact;
  assert.strictEqual(result.reason, "complete", "Resolution reason should be complete");
  assert.strictEqual(impactFired, true, "onImpact callback should have executed");
  assert.strictEqual(sandbox.state.isRolling, false, "State isRolling should be unlocked on complete");
  console.log("Pass: Normal animation completed and unlocked successfully.");

  // Test 3: cancel() resolves active animation Promise immediately
  console.log("Test 3: cancel() test starts...");
  let cancelImpactFired = false;
  const pCancel = UltimateVfx.playGreatswordImpact({
    boardElement: boardEl,
    targetCell: { row: 1, col: 1 },
    attackerOwner: "player",
    damage: 3,
    isKill: false,
    onImpact: () => {
      cancelImpactFired = true;
    }
  });

  await wait(50);
  UltimateVfx.cancel();

  const cancelResult = await pCancel;
  assert.strictEqual(cancelResult.reason, "cancelled", "Cancelled animation should resolve with cancelled");
  assert.strictEqual(sandbox.state.isRolling, false, "State isRolling should be unlocked on cancel");
  console.log("Pass: Cancel resolved Promise immediately and unlocked.");

  // Test 4: double cancel does not throw
  console.log("Test 4: double cancel test starts...");
  UltimateVfx.cancel();
  UltimateVfx.cancel();
  console.log("Pass: Double cancel succeeded without throwing.");

  // Test 5: missing elements fallback
  console.log("Test 5: missing elements checks...");
  const failResult1 = await UltimateVfx.playGreatswordImpact({
    boardElement: null,
    targetCell: { row: 1, col: 1 }
  });
  assert.strictEqual(failResult1.reason, "missing_board", "Should reject with missing_board");

  const failResult2 = await UltimateVfx.playGreatswordImpact({
    boardElement: boardEl,
    targetCell: { row: 99, col: 99 } // querySelector will return null
  });
  assert.strictEqual(failResult2.reason, "missing_target_cell", "Should reject with missing_target_cell");
  console.log("Pass: Missing parameters/elements fallback check passed.");

  // Test 6: prefersReducedMotion check
  console.log("Test 6: prefersReducedMotion test starts...");
  assert.strictEqual(typeof UltimateVfx.prefersReducedMotion, "function", "prefersReducedMotion should be exported");
  const isReduced = UltimateVfx.prefersReducedMotion();
  assert.strictEqual(isReduced, false, "Should return false for standard mock");
  console.log("Pass: prefersReducedMotion checks passed.");

  // Test 7: reducedMotion option in animation
  console.log("Test 7: reducedMotion impact starts...");
  let reducedImpactFired = false;
  const pReduced = UltimateVfx.playGreatswordImpact({
    boardElement: boardEl,
    targetCell: { row: 1, col: 1 },
    attackerOwner: "player",
    damage: 3,
    isKill: false,
    reducedMotion: true,
    onImpact: () => {
      reducedImpactFired = true;
    }
  });

  const reducedResult = await pReduced;
  assert.strictEqual(reducedResult.reason, "complete", "Reduced motion should complete");
  assert.strictEqual(reducedImpactFired, true, "Reduced motion onImpact should fire");
  console.log("Pass: Reduced motion animation completed successfully.");

  // Test 8: Check CSS file does not contain transition-duration: 0s
  console.log("Test 8: CSS transition-duration: 0s check starts...");
  const cssContent = fs.readFileSync(path.join(projectDir, "ultimate-vfx.css"), "utf8");
  assert.strictEqual(
    cssContent.includes("transition-duration: 0s"),
    false,
    "ultimate-vfx.css must not contain transition-duration: 0s !"
  );
  console.log("Pass: CSS hit-stop transition-duration: 0s check passed.");

  // Test 9: Cancel before vs after impact
  console.log("Test 9: Cancel before vs after impact checks...");
  let countBefore = 0;
  const pBefore = UltimateVfx.playGreatswordImpact({
    boardElement: boardEl,
    targetCell: { row: 1, col: 1 },
    onImpact: () => { countBefore++; }
  });
  await wait(50); // before impact (520ms)
  UltimateVfx.cancel();
  const resBefore = await pBefore;
  assert.strictEqual(resBefore.reason, "cancelled");
  assert.strictEqual(resBefore.impactTriggered, false);
  assert.strictEqual(countBefore, 0, "onImpact must be called 0 times when cancelled before impact");

  console.log("Pass: Cancel before impact verified.");

  let countAfter = 0;
  const pAfter = UltimateVfx.playGreatswordImpact({
    boardElement: boardEl,
    targetCell: { row: 1, col: 1 },
    onImpact: () => { countAfter++; }
  });
  await wait(700); // after the normal impact point
  UltimateVfx.cancel();
  const resAfter = await pAfter;
  assert.strictEqual(resAfter.reason, "cancelled");
  assert.strictEqual(resAfter.impactTriggered, true);
  assert.strictEqual(countAfter, 1, "onImpact must be called exactly once when cancelled after impact");
  console.log("Pass: Cancel after impact verified.");

  // Test 10: Superseded consecutive calls
  console.log("Test 10: Superseded consecutive calls check...");
  let count1 = 0;
  let count2 = 0;
  const p1 = UltimateVfx.playGreatswordImpact({
    boardElement: boardEl,
    targetCell: { row: 1, col: 1 },
    onImpact: () => { count1++; }
  });
  await wait(30);
  const p2 = UltimateVfx.playGreatswordImpact({
    boardElement: boardEl,
    targetCell: { row: 1, col: 1 },
    onImpact: () => { count2++; }
  });

  const res1 = await p1;
  assert.strictEqual(res1.reason, "superseded", "First call should be superseded by second call");
  assert.strictEqual(res1.impactTriggered, false, "Superseded call must not reach impact");
  assert.strictEqual(count1, 0, "Superseded call must not invoke onImpact");

  // Finish p2
  UltimateVfx.cancel();
  const res2 = await p2;
  assert.strictEqual(res2.reason, "cancelled", "Second call should be cancelled cleanly");
  assert.strictEqual(count2, 0, "Second call cancelled before impact must not invoke onImpact");
  console.log("Pass: Superseded consecutive calls verified.");

  console.log("\n✅ All Ultimate VFX unit tests passed successfully!");
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
