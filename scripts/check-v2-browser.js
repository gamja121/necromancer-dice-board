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
    await page.waitForSelector("#introAdvance");
    await page.locator("#introAdvance").click();
    await page.waitForFunction(() => {
      const art = document.getElementById("introSceneArt");
      return art?.complete && art.naturalWidth === 1280 && art.naturalHeight === 720;
    }, null, { timeout: 15000 });
    assert.equal(await page.locator("#dialogueStage").isVisible(), true);
    assert.equal(await page.locator("#introSceneArt").evaluate(img => [img.naturalWidth, img.naturalHeight].join("x")), "1280x720");
    for (let step = 0; step < 20 && !page.url().includes("v2-map-practice.html"); step += 1) {
      await page.locator("#introAdvance").click();
      await page.waitForTimeout(60);
    }
    await page.waitForURL("**/v2-map-practice.html");
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
    await page.waitForSelector(".map-tile");
    assert.equal(await page.locator(".map-tile").count(), 24);
    const saved = await page.evaluate(() => [sessionStorage.getItem("v2-migration-preserve"), localStorage.getItem("v2-migration-preserve")]);
    assert.deepEqual(saved, ["kept", "kept"]);
    console.log("PASS: mobile layout, offline launch/map, storage preserved");
    assert.deepEqual(errors, [], "Browser runtime errors");
    assert.deepEqual([...new Set(failed)], [], "Broken resource requests");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => clearTimeout(watchdog));
