"use strict";
// Mandatory CI smoke test. Every wait and the complete run are bounded.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const base = process.env.GAME_TEST_URL || "http://localhost:8788/";
const watchdog = setTimeout(() => { console.error("Browser smoke exceeded 180 seconds"); process.exit(1); }, 180000);
async function unlock(page) {
  await page.locator("#titleUnlock").click();
  await page.waitForFunction(() => document.body.classList.contains("is-unlocked"));
}
async function activate(page, selector) {
  await page.locator(selector).click();
  await page.locator(selector).click();
}
(async () => {
  const browser = await chromium.launch({ ...(process.env.CI ? {} : { channel: "msedge" }), headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    if (process.env.CI) {
      await context.addInitScript(() => {
        const noopFullscreen = async () => {};
        try { Object.defineProperty(Element.prototype, "requestFullscreen", { configurable: true, writable: true, value: noopFullscreen }); } catch (_) {}
        try { Object.defineProperty(HTMLElement.prototype, "webkitRequestFullscreen", { configurable: true, writable: true, value: noopFullscreen }); } catch (_) {}
      });
    }
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(30000);
    const errors = [], failed = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("response", response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
    await page.goto(base);
    await page.evaluate(() => {
      sessionStorage.setItem("v2-migration-preserve", "kept");
      localStorage.setItem("v2-migration-preserve", "kept");
    });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30000 });
    await page.screenshot({ path: path.join(os.tmpdir(), "necromancer-launch-desktop.png") });
    await unlock(page);
    await activate(page, "#newGameButton");
    // The launcher now opens gameplay inside #gameFrame. Verify that handoff, then
    // continue the smoke test on the intro page directly so later URL/viewport checks
    // are not coupled to iframe shell behavior.
    await page.waitForSelector("#gameFrame");
    await page.waitForFunction(() => document.getElementById("gameFrame")?.getAttribute("src")?.includes("v2-intro.html"));
    await page.goto(new URL("v2-intro.html", base).href);
    await page.waitForSelector("#introAdvance");
    await page.locator("#introAdvance").click();
    await page.waitForFunction(() => {
      const hero = document.querySelector(".portrait-left img");
      const commander = document.querySelector(".portrait-right img");
      const frame = document.querySelector(".dialogue-frame");
      return hero?.complete && hero.naturalWidth > 0
        && commander?.complete && commander.naturalWidth >= 500
        && frame?.complete && frame.naturalWidth > 0;
    }, null, { timeout: 15000 });
    assert.equal(await page.locator("#dialogueStage").isVisible(), true);
    assert((await page.locator(".portrait-left img").evaluate(img => img.naturalWidth)) > 0);
    assert((await page.locator(".portrait-right img").evaluate(img => img.naturalWidth)) >= 500);
    assert.equal(await page.locator(".dialogue-frame").isVisible(), true);
    for (let step = 0; step < 11; step += 1) {
      await page.locator("#introAdvance").click();
      await page.waitForTimeout(60);
    }
    await Promise.all([
      page.waitForURL("**/v2-map-practice.html"),
      page.locator("#introAdvance").click()
    ]);
    await page.waitForSelector(".map-tile");
    assert.equal(await page.locator(".map-tile").count(), 24);
    await page.locator("#mapDiceButton").click();
    await page.waitForFunction(() => !document.getElementById("mapDiceButton").classList.contains("is-rolling"), null, { timeout: 15000 });
    assert(await page.locator("#mapDiceImage").getAttribute("src"));
    console.log("PASS: launch -> 24-tile map -> dice roll");
    const screens = ["v2.html", "v2-auto-battle-practice.html", "v2-event-lab.html", "v2-animation-practice.html", "v2-image-test.html", "v2-tile-practice.html", "v2-sfx-sampler.html"];
    for (const screen of screens) {
      await page.goto(new URL(screen, base).href);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1200);
      assert((await page.title()).startsWith("네크로멘서 앤드 다이스"));
      console.log("PASS: " + screen);
    }
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto(new URL("v2-intro.html", base).href);
    await page.waitForSelector("#introAdvance");
    await page.locator("#introAdvance").click();
    await page.waitForFunction(() => {
      const hero = document.querySelector(".portrait-left img");
      const commander = document.querySelector(".portrait-right img");
      const frame = document.querySelector(".dialogue-frame");
      return hero?.dataset.assetReady === "hero-hd"
        && commander?.dataset.assetReady === "commander-hd"
        && frame?.dataset.assetReady === "frame-visible";
    });
    await page.waitForFunction(() => {
      const commander = document.querySelector(".portrait-right img");
      const frame = document.querySelector(".dialogue-frame");
      return commander?.complete && commander.naturalWidth >= 500
        && frame?.complete && frame.naturalWidth > 0;
    });
    const landscapeIntro = await page.evaluate(() => {
      const box = (selector) => {
        const rect = document.querySelector(selector)?.getBoundingClientRect();
        return rect ? { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height } : null;
      };
      return {
        canvas: box(".intro-canvas"),
        frame: box(".dialogue-box"),
        commander: box(".portrait-right"),
        heroVisible: getComputedStyle(document.querySelector(".portrait-left")).visibility !== "hidden",
        commanderVisible: getComputedStyle(document.querySelector(".portrait-right")).visibility !== "hidden",
        viewport: { width: innerWidth, height: innerHeight }
      };
    });
    assert(landscapeIntro.frame.width >= landscapeIntro.canvas.width * 0.8, "Landscape dialogue frame should span most of the 16:9 canvas");
    assert(landscapeIntro.frame.left >= landscapeIntro.canvas.left - 1 && landscapeIntro.frame.right <= landscapeIntro.canvas.right + 1, "Landscape dialogue frame must stay inside the 16:9 canvas horizontally");
    assert(landscapeIntro.frame.bottom <= landscapeIntro.canvas.bottom + 1, "Landscape dialogue frame must stay inside the 16:9 canvas");
    assert(landscapeIntro.frame.top >= landscapeIntro.canvas.top + landscapeIntro.canvas.height * 0.6, "Landscape dialogue frame should stay in the lower area");
    assert.equal(landscapeIntro.commanderVisible, true, "Commander must be visible on the first line");
    assert.equal(landscapeIntro.heroVisible, false, "Protagonist must be hidden on the commander line");
    assert(landscapeIntro.commander.width >= landscapeIntro.canvas.width * 0.4, "Commander portrait should remain large in landscape");
    await page.locator("#introAdvance").click();
    await page.waitForTimeout(80);
    assert.equal(await page.locator(".portrait-left").isVisible(), true, "Protagonist must appear on protagonist line");
    assert.equal(await page.locator(".portrait-right").isVisible(), false, "Commander must hide on protagonist line");
    await page.screenshot({ path: path.join(os.tmpdir(), "necromancer-intro-mobile-landscape.png") });
    console.log("PASS: mobile landscape intro frame and speaker portraits");
    const introAssetMetrics = await page.evaluate(() => {
      function metrics(selector) {
        const img = document.querySelector(selector);
        const c = document.createElement("canvas");
        c.width = Math.max(1, img.naturalWidth);
        c.height = Math.max(1, img.naturalHeight);
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, c.width, c.height).data;
        let visible = 0, alphaSum = 0, rgbSpread = 0;
        let minR=255,minG=255,minB=255,maxR=0,maxG=0,maxB=0;
        for (let i=0;i<data.length;i+=4) {
          const a=data[i+3];
          alphaSum += a;
          if (a > 8) {
            visible++;
            const r=data[i], g=data[i+1], b=data[i+2];
            if(r<minR)minR=r;if(g<minG)minG=g;if(b<minB)minB=b;
            if(r>maxR)maxR=r;if(g>maxG)maxG=g;if(b>maxB)maxB=b;
          }
        }
        rgbSpread=(maxR-minR)+(maxG-minG)+(maxB-minB);
        return {
          src: img.getAttribute("src"),
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          visiblePixels: visible,
          totalPixels: c.width*c.height,
          visibleRatio: visible/(c.width*c.height),
          meanAlpha: alphaSum/(c.width*c.height*255),
          rgbSpread
        };
      }
      return {
        hero: metrics(".portrait-left img"),
        commander: metrics(".portrait-right img"),
        frame: metrics(".dialogue-frame")
      };
    });
    console.log("INTRO_ASSET_METRICS " + JSON.stringify(introAssetMetrics));
    assert(introAssetMetrics.frame.visiblePixels > 1000, "Intro parchment artwork must contain visible pixels");
    assert(introAssetMetrics.hero.visiblePixels > 1000, "Protagonist portrait artwork must contain visible pixels");
    assert(introAssetMetrics.commander.visiblePixels > 1000, "Commander portrait artwork must contain visible pixels");

    await page.goto(new URL("v2-auto-battle-practice.html", base).href);
    await page.waitForSelector("#unitRoster button");
    const choices = page.locator("#unitRoster button");
    for (let i = 0; i < 4; i++) await choices.nth(i).click();
    await page.locator("#startButton").click();
    await page.waitForFunction(() => document.getElementById("startOverlay").hidden);
    console.log("PASS: V2 battle roster and start");

    await page.locator("#turnDiceButton").click();
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem("necromancer-v2-battle-v1") || "null");
      return saved?.state?.round >= 1 && saved?.actions >= 1;
    }, null, { timeout: 60000 });
    assert(!await page.locator("#battleMessage").textContent().then(text => text.includes("오류")));
    const checkpointBeforeReload = await page.evaluate(() => JSON.parse(localStorage.getItem("necromancer-v2-battle-v1")));
    assert.equal(checkpointBeforeReload.version, 3);
    assert.equal(checkpointBeforeReload.rng?.algorithm, "xorshift32");
    assert(Number.isInteger(checkpointBeforeReload.rng?.state));
    assert.equal(checkpointBeforeReload.context.fromMap, false);
    const savedActions = checkpointBeforeReload.actions;
    const savedRound = checkpointBeforeReload.state.round;
    await page.reload();
    await page.waitForSelector("#resumeBattleButton");
    assert.equal(await page.locator("#resumeBattleButton").isVisible(), true);
    await page.locator("#resumeBattleButton").click();
    await page.waitForFunction(() => document.getElementById("startOverlay").hidden);
    const resumed = await page.evaluate(() => JSON.parse(localStorage.getItem("necromancer-v2-battle-v1")));
    assert.equal(resumed.actions, savedActions);
    assert.equal(resumed.state.round, savedRound);
    assert.deepEqual(resumed.rng, checkpointBeforeReload.rng);
    assert(!await page.locator("#battleMessage").textContent().then(text => text.includes("불러오지 못했습니다")));
    console.log("PASS: real browser dice -> attack -> reload -> mid-battle resume");
    await page.evaluate(async () => {
      if (document.fullscreenElement && document.exitFullscreen) {
        try { await document.exitFullscreen(); } catch (_) {}
      }
    });
    await page.waitForTimeout(100);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base);
    assert(await page.locator("#titleUnlock").isVisible());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(os.tmpdir(), "necromancer-launch-mobile.png") });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30000 });
    await context.setOffline(true);
    await page.reload();
    await unlock(page);
    await activate(page, "#continueButton");
    await page.waitForSelector("#gameFrame");
    await page.waitForFunction(() => document.getElementById("gameFrame")?.getAttribute("src")?.includes("v2-map-practice.html"));
    const offlineGame = page.frameLocator("#gameFrame");
    await offlineGame.locator(".map-tile").first().waitFor();
    assert.equal(await offlineGame.locator(".map-tile").count(), 24);
    const saved = await page.evaluate(() => [sessionStorage.getItem("v2-migration-preserve"), localStorage.getItem("v2-migration-preserve")]);
    assert.deepEqual(saved, ["kept", "kept"]);
    console.log("PASS: mobile layout, offline launch/map, storage preserved");
    assert.deepEqual(errors, [], "Browser runtime errors");
    assert.deepEqual([...new Set(failed)], [], "Broken resource requests");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => clearTimeout(watchdog));
