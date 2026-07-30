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
              parentNode: this,
              getBoundingClientRect() {
                return { left: 200, top: 200, width: 80, height: 80, right: 280, bottom: 280 };
              }
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
        arc() {},
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
    this.cloneNode = function() { return new windowMock.Image(); };
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
  assert.ok(preloaded, "Preloading should complete successfully");
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
  assert.strictEqual(
    cssContent.includes(".ultimate-vfx-greatsword") && cssContent.includes("transform-origin"),
    true,
    "Greatsword CSS styling present"
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

  // Test 11: buildFractureModel deterministic seeding
  console.log("Test 11: buildFractureModel deterministic seeding test starts...");
  const model1 = UltimateVfx.buildFractureModel({ debugSeed: 999, quality: "high" });
  const model2 = UltimateVfx.buildFractureModel({ debugSeed: 999, quality: "high" });
  const model3 = UltimateVfx.buildFractureModel({ debugSeed: 888, quality: "high" });

  assert.strictEqual(model1.craterPieces.length, model2.craterPieces.length, "Same seed must produce same crater pieces count");
  assert.strictEqual(model1.mainFractures[0].points[1].x, model2.mainFractures[0].points[1].x, "Same seed must produce identical main crack coordinates");
  assert.notStrictEqual(model1.mainFractures[0].points[1].x, model3.mainFractures[0].points[1].x, "Different seed must produce different crack coordinates");
  console.log("Pass: Deterministic seeding verified.");

  // Test 12: Quality tier limits
  console.log("Test 12: Quality tier limits test starts...");
  const modelHigh = UltimateVfx.buildFractureModel({ quality: "high" });
  const modelLow = UltimateVfx.buildFractureModel({ quality: "low" });
  const modelReduced = UltimateVfx.buildFractureModel({ quality: "reduced" });

  assert.strictEqual(modelHigh.craterPieces.length, 5, "High quality should have 5 crater pieces");
  assert.strictEqual(modelLow.craterPieces.length, 3, "Low quality should have 3 crater pieces");
  assert.strictEqual(modelReduced.craterPieces.length, 1, "Reduced quality should have 1 crater piece");
  assert.strictEqual(modelReduced.branchFractures.length, 0, "Reduced quality should have 0 branch cracks");
  console.log("Pass: Quality tier limits verified.");

  // Test 13: Greatsword image rotation and impact anchor alignment
  console.log("Test 13: Greatsword orientation & anchor test starts...");
  const cssText = fs.readFileSync(path.join(projectDir, "ultimate-vfx.css"), "utf8");

  assert.strictEqual(
    cssText.includes(".ultimate-vfx-greatsword-img") && cssText.includes("rotate(180deg)"),
    true,
    "Greatsword image child element must be rotated 180deg so blade tip lands first"
  );
  assert.strictEqual(
    cssText.includes(".ultimate-vfx-greatsword-visual") &&
      cssText.includes("transform: translate(-50%, -97%)") &&
      cssText.includes("transform-origin: 50% 97%"),
    true,
    "Greatsword visual blade tip must be calibrated to the zero-size impact anchor"
  );
  assert.strictEqual(
    cssText.includes(".ultimate-vfx-greatsword-fallback") && cssText.includes("transform: none"),
    true,
    "Greatsword CSS fallback element must not be double-rotated"
  );
  console.log("Pass: Greatsword orientation & anchor verified.");

  // Test 14: Full canonical game legion theme mapping
  console.log("Test 14: Canonical game legion theme mapping test starts...");
  const canonicalMap = {
    skeleton: "undead",
    corpse: "corpse",
    beast: "beast",
    plague: "plague",
    ice: "ice",
    summon: "summon",
    demon: "demon",
    insect: "insect",
    plant: "plant",
    element: "elemental"
  };

  for (const [legionKey, expectedThemeName] of Object.entries(canonicalMap)) {
    const theme = UltimateVfx.getLegionTheme({ attackerLegions: [legionKey] });
    assert.strictEqual(theme.name, expectedThemeName, `Legion '${legionKey}' should map to theme '${expectedThemeName}'`);
    assert.notStrictEqual(theme.name, "default", `Legion '${legionKey}' should not fall back to default theme`);
  }

  const unknownTheme = UltimateVfx.getLegionTheme({ attackerLegions: ["unknown-legion"] });
  assert.strictEqual(unknownTheme.name, "default", "Unknown legion key should return default theme");
  console.log("Pass: Canonical game legion theme mapping verified.");

  // Test 15: Multi-legion priority rules
  console.log("Test 15: Multi-legion priority rules test starts...");
  assert.strictEqual(UltimateVfx.getLegionTheme({ attackerLegions: ["plant", "element"] }).name, "elemental");
  assert.strictEqual(UltimateVfx.getLegionTheme({ attackerLegions: ["ice", "beast"] }).name, "ice");
  assert.strictEqual(UltimateVfx.getLegionTheme({ attackerLegions: ["demon", "skeleton"] }).name, "demon");
  console.log("Pass: Multi-legion priority rules verified.");

  // Test 16: 4-Tier auto quality selection
  console.log("Test 16: 4-Tier auto quality selection test starts...");
  assert.strictEqual(UltimateVfx.chooseVfxQuality({ reducedMotion: true, deviceMemory: 8, hardwareConcurrency: 8 }), "reduced");
  assert.strictEqual(UltimateVfx.chooseVfxQuality({ reducedMotion: false, saveData: true, deviceMemory: 8, hardwareConcurrency: 8 }), "low");
  assert.strictEqual(UltimateVfx.chooseVfxQuality({ reducedMotion: false, deviceMemory: 3, hardwareConcurrency: 8 }), "low");
  assert.strictEqual(UltimateVfx.chooseVfxQuality({ reducedMotion: false, deviceMemory: 8, hardwareConcurrency: 4 }), "low");
  assert.strictEqual(UltimateVfx.chooseVfxQuality({ reducedMotion: false, deviceMemory: undefined, hardwareConcurrency: 8 }), "medium");
  assert.strictEqual(UltimateVfx.chooseVfxQuality({ reducedMotion: false, deviceMemory: 4, hardwareConcurrency: 8 }), "medium");
  assert.strictEqual(UltimateVfx.chooseVfxQuality({ reducedMotion: false, deviceMemory: 8, hardwareConcurrency: 8 }), "high");
  console.log("Pass: 4-Tier auto quality selection verified.");

  // Test 17: Service worker cache version & static asset query string
  console.log("Test 17: Cache version & asset query parameter test starts...");
  const swText = fs.readFileSync(path.join(projectDir, "service-worker.js"), "utf8");
  const htmlText = fs.readFileSync(path.join(projectDir, "index.html"), "utf8");

  assert.strictEqual(swText.includes("necromancer-expedition-v32"), true, "service-worker.js CACHE_NAME must be v32");
  assert.strictEqual(swText.includes("20260731-21"), true, "service-worker.js APP_SHELL must contain 20260731-21 VFX query parameters");
  assert.strictEqual(htmlText.includes("20260731-21"), true, "index.html must contain 20260731-21 VFX asset query parameters");
  console.log("Pass: Cache version & asset query parameter verified.");

  // Test 17b: shared choreography, direction mirroring, and mobile-safe overflow
  console.log("Test 17b: Shared ultimate choreography test starts...");
  assert.strictEqual(UltimateVfx.ownerDirection("player"), 1, "Player attacks must enter from the player side");
  assert.strictEqual(UltimateVfx.ownerDirection("enemy"), -1, "Enemy attacks must mirror the entry direction");
  const normalTiming = UltimateVfx.ultimateTiming(false, false);
  assert.strictEqual(normalTiming.anticipation, 420);
  assert.strictEqual(normalTiming.hitStop, 60);
  assert.strictEqual(normalTiming.total, 1200);
  assert.strictEqual(normalTiming.fade, 300);
  const killTiming = UltimateVfx.ultimateTiming(false, true);
  assert.strictEqual(killTiming.anticipation, 420);
  assert.strictEqual(killTiming.hitStop, 75);
  assert.strictEqual(killTiming.total, 1300);
  assert.strictEqual(killTiming.fade, 300);
  const reducedTiming = UltimateVfx.ultimateTiming(true, false);
  assert.strictEqual(reducedTiming.anticipation, 180);
  assert.strictEqual(reducedTiming.hitStop, 30);
  assert.strictEqual(reducedTiming.total, 720);
  assert.strictEqual(reducedTiming.fade, 190);
  assert.strictEqual(
    cssText.includes(".ultimate-vfx-overlay") && cssText.includes("overflow: visible"),
    true,
    "Ultimate art must not be clipped by the mobile board bounds"
  );
  assert.strictEqual(
    cssText.includes(".impact-from-player") &&
      cssText.includes(".impact-from-enemy") &&
      cssText.includes("ultimate-vfx-board-impact-player") &&
      cssText.includes("ultimate-vfx-board-impact-enemy"),
    true,
    "Board impact must use browser-compatible mirrored keyframes"
  );
  console.log("Pass: Shared timing, direction mirroring, and safe overflow verified.");

  // Test 18: Greatsword asset path and dark-background visibility fallback
  console.log("Test 18: Greatsword asset path & dark visibility test starts...");
  const jsText = fs.readFileSync(path.join(projectDir, "ultimate-vfx.js"), "utf8");
  const swordAssetPath = path.join(projectDir, "assets", "vfx", "greatsword.png");
  assert.strictEqual(fs.existsSync(swordAssetPath), true, "Greatsword PNG must exist at assets/vfx/greatsword.png");
  assert.strictEqual(
    jsText.includes('loadImage("./assets/vfx/greatsword.png")'),
    true,
    "VFX preloader must request the deployed greatsword asset path"
  );
  assert.strictEqual(
    swText.includes("./assets/vfx/greatsword.png"),
    false,
    "Large VFX images must not block service-worker app-shell installation"
  );
  assert.strictEqual(
    cssText.includes(".ultimate-vfx-greatsword-img") && cssText.includes("drop-shadow"),
    true,
    "Greatsword image styling present with drop-shadow"
  );
  assert.strictEqual(
    cssText.includes(".ultimate-vfx-greatsword-fallback"),
    true,
    "CSS fallback sword styling present"
  );
  console.log("Pass: Greatsword asset path & dark visibility verified.");

  // Test 18b: illustrated claw asset and rake sequence
  const clawAssetPath = path.join(projectDir, "assets", "vfx", "claw-rake.png");
  assert.strictEqual(fs.existsSync(clawAssetPath), true, "Illustrated claw PNG must exist");
  assert.strictEqual(jsText.includes('loadImage("./assets/vfx/claw-rake.png")'), true, "Claw preloader path must be deployable");
  assert.strictEqual(cssText.includes(".ultimate-vfx-claw-hand"), true, "Claw hand staging must exist");
  assert.strictEqual(cssText.includes("ultimate-claw-carve"), true, "Sequential claw carving animation must exist");
  assert.strictEqual(swText.includes("./assets/vfx/claw-rake.png"), false, "Claw asset must load on demand");

  // Test 18c: illustrated pierce and magic assets
  const spearAssetPath = path.join(projectDir, "assets", "vfx", "brutal-spear.png");
  const magicAssetPath = path.join(projectDir, "assets", "vfx", "forbidden-magic.png");
  assert.strictEqual(fs.existsSync(spearAssetPath), true, "Illustrated spear PNG must exist");
  assert.strictEqual(fs.existsSync(magicAssetPath), true, "Illustrated magic PNG must exist");
  assert.strictEqual(jsText.includes('loadImage("./assets/vfx/brutal-spear.png")'), true, "Spear preloader path must be deployable");
  assert.strictEqual(jsText.includes('loadImage("./assets/vfx/forbidden-magic.png")'), true, "Magic preloader path must be deployable");
  assert.strictEqual(cssText.includes(".ultimate-vfx-pierce-visual"), true, "Pierce art must use a calibrated impact anchor");
  assert.strictEqual(cssText.includes(".ultimate-vfx-magic-art"), true, "Magic renderer must stage the illustrated art");
  assert.strictEqual(swText.includes("./assets/vfx/brutal-spear.png"), false, "Spear asset must load on demand");
  assert.strictEqual(swText.includes("./assets/vfx/forbidden-magic.png"), false, "Magic asset must load on demand");

  console.log("\n✅ All Ultimate VFX unit tests passed successfully!");
  // Test 19: Target-pivot board perspective tilt restoration
  console.log("Test 19: Target-pivot board tilt restoration starts...");
  assert.strictEqual(
    jsText.includes("clone.style.transformOrigin = `${impactX}px ${impactY}px`"),
    true,
    "Board clone must pivot around the impacted target cell"
  );
  assert.strictEqual(
    cssText.includes("perspective(1000px)") || cssText.includes("perspective"),
    true,
    "Board clone must use perspective transform"
  );
  console.log("Pass: Target-pivot board perspective tilt verified.");

  // Test 20: 4 Ultimate Styles Routing & Completion
  console.log("Test 20: 4 Ultimate Styles routing & completion test starts...");
  const styles = ["greatsword", "pierce", "claw", "magic"];
  for (const style of styles) {
    let impactFired = false;
    const p = UltimateVfx.playUltimateImpact({
      style,
      boardElement: boardEl,
      targetCell: { row: 1, col: 1 },
      sourceCell: { row: 3, col: 1 },
      reducedMotion: true,
      onImpact: () => { impactFired = true; }
    });
    await wait(350);
    UltimateVfx.cancel();
    const res = await p;
    assert.strictEqual(impactFired, true, `Style '${style}' onImpact should fire`);
    assert.strictEqual(res.impactTriggered, true, `Style '${style}' impactTriggered should be true`);
  }
  console.log("Pass: 4 Ultimate Styles routing & completion verified.");

  // Test 21: Style Fallback
  console.log("Test 21: Style fallback test starts...");
  let fallbackImpactFired = false;
  const pFallback = UltimateVfx.playUltimateImpact({
    style: "non_existent_style",
    boardElement: boardEl,
    targetCell: { row: 1, col: 1 },
    reducedMotion: true,
    onImpact: () => { fallbackImpactFired = true; }
  });
  await wait(350);
  UltimateVfx.cancel();
  const resFallback = await pFallback;
  assert.strictEqual(fallbackImpactFired, true, "Invalid style onImpact should fire via greatsword fallback");
  assert.strictEqual(resFallback.impactTriggered, true, "Invalid style impactTriggered should be true via fallback");
  console.log("Pass: Style fallback verified.");

  // Test 22: ultimateStyleFor(unit) mapping
  console.log("Test 22: ultimateStyleFor(unit) mapping test starts...");
  const unitDataPath = path.join(projectDir, "unit-data.js");
  delete require.cache[require.resolve(unitDataPath)];
  const unitDataModule = require(unitDataPath);
  const getStyle = unitDataModule.ultimateStyleFor;

  assert.strictEqual(getStyle({ type: "spear" }), "pierce");
  assert.strictEqual(getStyle({ type: "archer" }), "pierce");
  assert.strictEqual(getStyle({ type: "worm" }), "claw");
  assert.strictEqual(getStyle({ type: "yeti" }), "claw");
  assert.strictEqual(getStyle({ type: "summoner" }), "magic");
  assert.strictEqual(getStyle({ type: "plague" }), "magic");
  assert.strictEqual(getStyle({ type: "knight" }), "greatsword");
  assert.strictEqual(getStyle(null), "greatsword");
  console.log("Pass: ultimateStyleFor(unit) mapping verified.");

  console.log("\n✅ All Ultimate VFX unit tests passed successfully!");
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
