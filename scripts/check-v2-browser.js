"use strict";
// Optional end-to-end distribution check: install Playwright or expose it via NODE_PATH.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const base = process.env.GAME_TEST_URL || "http://localhost:8788/";
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const errors = [], failed = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("response", response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
    await page.goto(base);
    await page.evaluate(async () => {
      sessionStorage.setItem("v2-migration-preserve", "kept");
      localStorage.setItem("v2-migration-preserve", "kept");
      await navigator.serviceWorker.ready;
    });
    await page.screenshot({ path: path.join(os.tmpdir(), "necromancer-launch-desktop.png") });
    await page.locator('a.play').click();
    await page.waitForSelector(".map-tile");
    assert.equal(await page.locator(".map-tile").count(), 24);
    await page.locator("#mapDiceButton").click();
    await page.waitForFunction(() => !document.getElementById("mapDiceButton").classList.contains("is-rolling"), { timeout: 15000 });
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
    await page.goto(new URL("v2-auto-battle-practice.html", base).href);
    await page.waitForSelector("#unitRoster button");
    const choices = page.locator("#unitRoster button");
    for (let i = 0; i < 4; i++) await choices.nth(i).click();
    await page.locator("#startButton").click();
    await page.waitForFunction(() => document.getElementById("startOverlay").hidden);
    console.log("PASS: V2 battle roster and start");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base);
    assert(await page.locator("a.play").isVisible());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(os.tmpdir(), "necromancer-launch-mobile.png") });
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
    });
    await context.setOffline(true);
    await page.reload();
    assert(await page.locator("a.play").isVisible());
    await page.locator("a.play").click();
    await page.waitForSelector(".map-tile");
    assert.equal(await page.locator(".map-tile").count(), 24);
    const saved = await page.evaluate(() => [sessionStorage.getItem("v2-migration-preserve"), localStorage.getItem("v2-migration-preserve")]);
    assert.deepEqual(saved, ["kept", "kept"]);
    console.log("PASS: mobile layout, offline launch/map, storage preserved");
    assert.deepEqual(errors, [], "Browser runtime errors");
    assert.deepEqual([...new Set(failed)], [], "Broken resource requests");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
