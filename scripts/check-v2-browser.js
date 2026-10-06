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
    await page.waitForSelector("#dialogueStage", { state: "visible", timeout: 15000 });
    await page.waitForSelector(".dialogue-frame", { state: "visible", timeout: 15000 });
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
    await page.goto(new URL("v2-event-lab.html", base).href);
    await page.waitForSelector("#eventCard", { state: "visible", timeout: 15000 });
    await page.waitForFunction(() => {
      const baseImg=document.getElementById("eventBaseImage");
      const ghoul=document.getElementById("eventGhoulLayer");
      return baseImg?.dataset.assetReady === "base-ready"
        && ghoul?.dataset.assetReady === "ghoul-ready";
    }, null, { timeout: 15000 });

    const eventInitial = await page.evaluate(() => ({
      phase: document.getElementById("eventCard")?.dataset.phase,
      description: document.getElementById("eventDescription")?.textContent?.trim(),
      ghoulHidden: document.getElementById("eventGhoulLayer")?.hidden,
      baseWidth: document.getElementById("eventBaseImage")?.naturalWidth || 0,
      tags: [...document.querySelectorAll("#eventTags span")].map(el=>el.textContent)
    }));
    assert.equal(eventInitial.phase, "description");
    assert(eventInitial.description.includes("길을 잃은 아이를 발견했다."));
    assert.equal(eventInitial.ghoulHidden, true);
    assert(eventInitial.baseWidth > 0);
    assert.deepEqual(eventInitial.tags, ["#사건","#공동묘지","#습격받는아이"]);

    const initialFocus = await page.evaluate(() => ({
      animation:getComputedStyle(document.getElementById("eventBaseImage")).animationName,
      origin:getComputedStyle(document.getElementById("eventBaseImage")).transformOrigin
    }));
    assert(initialFocus.animation.includes("event-camera-child-focus"));

    await page.locator("#eventAdvance").click();
    await page.waitForFunction(() => {
      const card=document.getElementById("eventCard");
      const ghoul=document.getElementById("eventGhoulLayer");
      return card?.dataset.phase === "threat" && ghoul && !ghoul.hidden;
    });
    assert.equal(await page.locator("#eventGhoulLayer").isVisible(), true);

    await page.locator("#eventAdvance").click();
    await page.waitForSelector("#eventDialogue", { state: "visible", timeout: 5000 });
    assert.equal((await page.locator("#eventDialogueName").textContent()).trim(), "아이");
    assert.equal((await page.locator("#eventDialogueText").textContent()).trim(), "…도와주세요!");
    await page.locator("#eventDialogueAdvance").click();
    await page.waitForSelector("#eventChoices", { state: "visible", timeout: 5000 });
    const eventChoices=await page.locator("#eventChoices button").allTextContents();
    assert.deepEqual(eventChoices.map(x=>x.trim()), ["아이를 구한다","지나친다"]);
    await page.locator("#eventReset").evaluate((button) => button.click());
    await page.locator("#eventAdvance").click();
    await page.waitForFunction(() => document.getElementById("eventCard")?.classList.contains("is-ghoul-revealed"));
    const threatFocus = await page.evaluate(() => ({
      animation:getComputedStyle(document.getElementById("eventBaseImage")).animationName,
      sceneAnimation:getComputedStyle(document.querySelector(".event-scene")).animationName
    }));
    assert(threatFocus.animation.includes("event-camera-threat-focus"));
    assert(threatFocus.sceneAnimation.includes("event-camera-impact"));

    await page.locator("#eventAdvance").click();
    await page.waitForSelector("#eventDialogue", { state:"visible" });
    const dialogueFocus = await page.evaluate(() => getComputedStyle(document.getElementById("eventBaseImage")).animationName);
    assert(dialogueFocus.includes("event-camera-dialogue-focus"));

    await page.locator("#eventDialogueAdvance").click();
    await page.waitForSelector("#eventChoices", { state:"visible" });
    await page.waitForTimeout(520);
    const choiceVisual = await page.evaluate(() => ({
      isChoice: document.getElementById("eventCard")?.classList.contains("is-choice"),
      filter: getComputedStyle(document.getElementById("eventBaseImage")).filter
    }));
    assert.equal(choiceVisual.isChoice, true);
    assert(choiceVisual.filter.includes("brightness(0.58)"));
    console.log("PASS: Event Lab gaze-directed beats");

    const unifiedInfo = await page.evaluate(() => {
      const shell=document.querySelector(".event-info-shell");
      const frame=document.querySelector(".event-info-frame");
      return {
        shellVisible:!!shell && getComputedStyle(shell).display !== "none",
        frameSrc:frame?.getAttribute("src") || "",
        copyBg:getComputedStyle(document.querySelector(".event-copy")).backgroundColor,
        actionsBg:getComputedStyle(document.querySelector(".event-actions")).backgroundColor
      };
    });
    assert(unifiedInfo.shellVisible);
    assert(unifiedInfo.frameSrc.includes("intro-dialogue-box.webp?v=6"));
    assert(unifiedInfo.copyBg === "rgba(0, 0, 0, 0)" || unifiedInfo.copyBg === "transparent");
    assert(unifiedInfo.actionsBg === "rgba(0, 0, 0, 0)" || unifiedInfo.actionsBg === "transparent");
    console.log("PASS: Event Lab unified info box");

    console.log("PASS: Event Lab layered cemetery -> ghoul -> dialogue -> choice");

    await page.setViewportSize({ width: 689, height: 1536 });
    await page.goto(new URL("v2-event-lab.html", base).href);
    await page.waitForSelector("#eventCard", { state: "visible", timeout: 15000 });
    await page.waitForFunction(() => {
      const ghoul=document.getElementById("eventGhoulLayer");
      return ghoul?.dataset.assetReady === "ghoul-ready"
        && ghoul?.dataset.alphaReady === "true";
    }, null, { timeout: 15000 });
    const portraitLandscape = await page.evaluate(() => {
      const lab=document.querySelector(".event-lab");
      const card=document.getElementById("eventCard");
      const scene=document.querySelector(".event-scene");
      const ghoul=document.getElementById("eventGhoulLayer");
      const lr=lab.getBoundingClientRect(), cr=card.getBoundingClientRect(), sr=scene.getBoundingClientRect();
      const gs=getComputedStyle(ghoul);
      return {
        lab:{w:lr.width,h:lr.height,layoutW:lab.offsetWidth,layoutH:lab.offsetHeight},
        card:{w:cr.width,h:cr.height},
        scene:{w:sr.width,h:sr.height},
        transform:getComputedStyle(lab).transform,
        ghoulBlend:gs.mixBlendMode,
        ghoulBottom:gs.bottom,
        ghoulAlpha:ghoul.dataset.alphaReady
      };
    });
    assert(portraitLandscape.lab.layoutW > portraitLandscape.lab.layoutH, "Portrait phone must author Event Lab on a landscape layout canvas");
    assert.notEqual(portraitLandscape.transform, "none", "Portrait phone must rotate the Event Lab shell");
    assert.equal(portraitLandscape.ghoulBlend, "normal", "Ghoul must use a normal opaque layer, not screen blending");
    assert.equal(portraitLandscape.ghoulAlpha, "true", "Ghoul black background must be converted to alpha");
    console.log("PASS: Event Lab forces landscape and uses alpha-cut ghoul");

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

    // Reproduce the mobile-only village asset path before going offline. Each of the
    // six buildings must resolve to its own file and finish in the ready state.
    await page.goto(new URL("v2-map-practice.html", base).href);
    await page.waitForSelector(".village-building-image", { state: "attached" });
    await page.waitForFunction(() => document.querySelector(".village-scene-building")?.dataset.dragReady === "1", null, { timeout: 30000 });
    await page.evaluate(() => document.getElementById("villageDioramaTestButton")?.click());
    await page.waitForSelector("#villageDioramaTest:not([hidden])", { state: "visible", timeout: 30000 });
    await page.waitForFunction(() => document.getElementById("villageDioramaTest")?.classList.contains("is-playing"), null, { timeout: 30000 });
    await page.waitForTimeout(500);
    const villageAssets = await page.locator(".village-building-image").evaluateAll(images => images.map((img, index) => ({
      index: index + 1,
      src: img.getAttribute("src"),
      complete: img.complete,
      width: img.naturalWidth,
      height: img.naturalHeight,
      state: img.dataset.assetState,
      error: img.closest(".village-scene-building")?.classList.contains("is-asset-error") || false
    })));
    console.log("VILLAGE_ASSET_METRICS " + JSON.stringify(villageAssets));
    assert(villageAssets.every((asset, index) => {
      const expected = `village-building-${String(index + 1).padStart(2, "0")}.webp`;
      return asset.complete
        && asset.width > 0
        && asset.height > 0
        && asset.state === "ready"
        && asset.src?.includes(expected)
        && !asset.error;
    }), "Every village building must be a distinct decoded ready asset");
    assert.equal(villageAssets.length, 6);
    assert.equal(new Set(villageAssets.map(asset => asset.src)).size, 6, "Village buildings must use six distinct image URLs");
    assert(villageAssets.every(asset => asset.state === "ready" && !asset.error), "Village buildings must load without ASSET ERROR");
    const dragResult = await page.locator(".village-building-4").evaluate((building) => {
      const before = building.getBoundingClientRect();
      const pointerId = 77;
      const startX = before.left + before.width / 2;
      const startY = before.top + before.height / 2;
      building.dispatchEvent(new PointerEvent("pointerdown", {
        pointerId, pointerType: "mouse", button: 0, buttons: 1,
        clientX: startX, clientY: startY, bubbles: true
      }));
      building.dispatchEvent(new PointerEvent("pointermove", {
        pointerId, pointerType: "mouse", button: 0, buttons: 1,
        clientX: startX + 45, clientY: startY - 25, bubbles: true
      }));
      building.dispatchEvent(new PointerEvent("pointerup", {
        pointerId, pointerType: "mouse", button: 0, buttons: 0,
        clientX: startX + 45, clientY: startY - 25, bubbles: true
      }));
      const after = building.getBoundingClientRect();
      return {
        beforeX: before.left, beforeY: before.top,
        afterX: after.left, afterY: after.top,
        leftStyle: building.style.left,
        topStyle: building.style.top,
        bottomStyle: building.style.bottom
      };
    });
    assert(Math.abs(dragResult.afterX - dragResult.beforeX) > 10, "Village building must move horizontally by drag");
    assert(Math.abs(dragResult.afterY - dragResult.beforeY) > 10, "Village building must move vertically by drag");
    assert(dragResult.leftStyle && dragResult.topStyle && dragResult.bottomStyle === "auto", "Village drag must write editable inline position");
    console.log("PASS: village building pointer drag moves layout " + JSON.stringify(dragResult));
    const sizeResult = await page.locator(".village-building-4").evaluate((building) => {
      const stage = building.closest(".village-building-stage");
      return {
        beforePercent: (Number.parseFloat(getComputedStyle(building).width) / stage.clientWidth) * 100
      };
    });
    await page.locator("[data-village-size=\"1\"]").evaluate((button) => button.click());
    const sizeAfter = await page.locator(".village-building-4").evaluate((building) => ({
      widthStyle: building.style.width,
      widthPercent: Number.parseFloat(building.style.width),
      selected: building.classList.contains("is-layout-selected")
    }));
    assert(sizeAfter.widthPercent > sizeResult.beforePercent + 1, "Selected village building must grow with size control");
    assert(sizeAfter.selected, "Resized village building must remain selected");
    console.log("PASS: selected village building size control " + JSON.stringify({ sizeResult, sizeAfter }));
    const layerBefore = await page.locator(".village-building-4").evaluate((building) => Number.parseInt(getComputedStyle(building).zIndex, 10) || 0);
    await page.locator("[data-village-layer=\"1\"]").evaluate((button) => button.click());
    const layerAfter = await page.locator(".village-building-4").evaluate((building) => ({
      z: Number.parseInt(getComputedStyle(building).zIndex, 10) || 0,
      inline: building.style.zIndex,
      selected: building.classList.contains("is-layout-selected")
    }));
    assert(layerAfter.z === layerBefore + 1, "Selected village building must move one layer forward");
    assert(layerAfter.inline, "Layer control must write inline z-index");
    assert(layerAfter.selected, "Layered village building must remain selected");
    console.log("PASS: selected village building layer control " + JSON.stringify({ layerBefore, layerAfter }));
    const savedBefore = await page.locator(".village-building-4").evaluate((building) => ({
      left: building.style.left,
      top: building.style.top,
      width: building.style.width,
      zIndex: building.style.zIndex
    }));
    await page.locator("[data-village-layout-save]").evaluate((button) => button.click());
    await page.reload();
    await page.waitForSelector(".village-building-image", { state: "attached" });
    await page.waitForFunction(() => document.querySelector(".village-building-4")?.style.left, null, { timeout: 30000 });
    const savedAfter = await page.locator(".village-building-4").evaluate((building) => ({
      left: building.style.left,
      top: building.style.top,
      width: building.style.width,
      zIndex: building.style.zIndex
    }));
    assert.deepEqual(savedAfter, savedBefore, "Saved village position, size and z-index must survive reload");
    await page.locator("[data-village-layout-reset]").evaluate((button) => button.click());
    const resetState = await page.locator(".village-building-4").evaluate((building) => ({
      left: building.style.left,
      top: building.style.top,
      bottom: building.style.bottom,
      width: building.style.width,
      zIndex: building.style.zIndex
    }));
    assert.deepEqual(resetState, { left: "", top: "", bottom: "", width: "", zIndex: "" }, "Village reset must restore CSS defaults");
    console.log("PASS: village layout save reload and reset");
    await page.evaluate(() => {
      const target = document.querySelector(".village-building-4");
      if (target) {
        target.style.left = "31.25%";
        target.style.top = "24.5%";
        target.style.bottom = "auto";
        target.style.width = "26.5%";
        target.style.zIndex = "7";
      }
    });
    await page.locator("[data-village-layout-copy]").evaluate((button) => button.click());
    const exportState = await page.locator("#villageLayoutExport").evaluate((field) => ({
      hidden: field.hidden,
      value: field.value
    }));
    assert.equal(exportState.hidden, false, "Village layout export must be shown after copy");
    const exportedLayout = JSON.parse(exportState.value);
    assert(exportedLayout.B4, "Village layout export must contain labeled B4 data");
    assert.equal(exportedLayout.B4.left, "31.25%");
    assert.equal(exportedLayout.B4.top, "24.5%");
    assert.equal(exportedLayout.B4.width, "26.5%");
    assert.equal(exportedLayout.B4.zIndex, "7");
    console.log("PASS: village layout JSON export");
    await page.locator('[data-village-item-toggle=".village-tree-4"]').evaluate((button) => button.click());
    const treeBefore = await page.locator(".village-tree-4").evaluate((tree) => ({
      hidden: tree.classList.contains("is-debug-hidden"),
      selected: tree.classList.contains("is-layout-selected")
    }));
    assert.equal(treeBefore.hidden, false, "T4 must become visible from editor toggle");
    assert.equal(treeBefore.selected, true, "Newly shown T4 must become selected");

    await page.locator("[data-village-flip]").evaluate((button) => button.click());
    const flipped = await page.locator(".village-tree-4").evaluate((tree) => tree.classList.contains("is-layout-flipped"));
    assert.equal(flipped, true, "Selected village tree must support horizontal flip");

    await page.locator("[data-village-layout-save]").evaluate((button) => button.click());
    await page.reload();
    await page.waitForSelector(".village-tree-4", { state: "attached" });
    await page.waitForFunction(() => {
      const tree = document.querySelector(".village-tree-4");
      return tree
        && !tree.classList.contains("is-debug-hidden")
        && tree.classList.contains("is-layout-flipped");
    }, null, { timeout: 30000 });
    const restoredTree = await page.locator(".village-tree-4").evaluate((tree) => ({
      hidden: tree.classList.contains("is-debug-hidden"),
      flipped: tree.classList.contains("is-layout-flipped")
    }));
    assert.equal(restoredTree.hidden, false, "Visible tree must survive village layout reload");
    assert.equal(restoredTree.flipped, true, "Tree horizontal flip must survive village layout reload");

    await page.evaluate(() => document.getElementById("villageDioramaTestButton")?.click());
    await page.waitForSelector("#villageDioramaTest:not([hidden])", { state: "visible", timeout: 30000 });
    await page.locator("[data-village-layout-copy]").evaluate((button) => button.click());
    const treeExport = JSON.parse(await page.locator("#villageLayoutExport").inputValue());
    assert(treeExport.T1 && treeExport.T4, "Village layout JSON must export T1-T4");
    assert.equal(treeExport.T4.flipX, true);
    assert.equal(treeExport.T4.hidden, false);
    console.log("PASS: village tree editor add flip save restore export");

    await page.evaluate(() => document.getElementById("graveyardDioramaTestButton")?.click());
    await page.waitForSelector("#graveyardDioramaTest:not([hidden])", { state: "visible", timeout: 30000 });
    await page.waitForFunction(() => {
      const probe = document.getElementById("graveyardAtlasProbe");
      return probe && probe.complete && probe.naturalWidth === 1536 && probe.naturalHeight === 1260;
    }, null, { timeout: 30000 });
    const graveyardState = await page.evaluate(() => ({
      count: document.querySelectorAll("[data-graveyard-id]").length,
      ids: [...document.querySelectorAll("[data-graveyard-id]")].map((item) => item.dataset.graveyardId),
      width: document.getElementById("graveyardAtlasProbe")?.naturalWidth || 0,
      height: document.getElementById("graveyardAtlasProbe")?.naturalHeight || 0,
      status: document.getElementById("graveyardAssetStatus")?.textContent || ""
    }));
    assert.equal(graveyardState.count, 14, "Graveyard inspector must show 14 logical assets");
    assert.deepEqual(graveyardState.ids, ["M1","M2","M3","T1","T2","G1","L1","F1","F2","H1","H2","H3","H4","C1"]);
    assert.equal(graveyardState.width, 1536);
    assert.equal(graveyardState.height, 1260);
    assert(graveyardState.status.includes("아틀라스 정상"), "Graveyard atlas status must report ready");
    await page.locator("#graveyardDioramaClose").evaluate((button) => button.click());
    assert.equal(await page.locator("#graveyardDioramaTest").evaluate((el) => el.hidden), true);
    console.log("PASS: graveyard stage 3 atlas inspector");


    await page.evaluate(() => document.getElementById("graveyardDioramaTestButton")?.click());
    await page.waitForSelector("#graveyardDioramaTest:not([hidden])",{state:"visible",timeout:30000});
    const graveItem=page.locator('.graveyard-item-h1');
    await graveItem.evaluate((item)=>{
      const r=item.getBoundingClientRect(); const id=91;
      item.dispatchEvent(new PointerEvent("pointerdown",{pointerId:id,pointerType:"mouse",button:0,buttons:1,clientX:r.left+r.width/2,clientY:r.top+r.height/2,bubbles:true}));
      item.dispatchEvent(new PointerEvent("pointermove",{pointerId:id,pointerType:"mouse",button:0,buttons:1,clientX:r.left+r.width/2+35,clientY:r.top+r.height/2+20,bubbles:true}));
      item.dispatchEvent(new PointerEvent("pointerup",{pointerId:id,pointerType:"mouse",button:0,buttons:0,clientX:r.left+r.width/2+35,clientY:r.top+r.height/2+20,bubbles:true}));
    });
    const beforeSize=await graveItem.evaluate((item)=>item.getBoundingClientRect().width);
    await page.locator('[data-graveyard-size="1"]').evaluate((b)=>b.click());
    await page.locator('[data-graveyard-layer="1"]').evaluate((b)=>b.click());
    await page.locator('[data-graveyard-flip]').evaluate((b)=>b.click());
    const edited=await graveItem.evaluate((item)=>({left:item.style.left,top:item.style.top,width:item.getBoundingClientRect().width,z:item.style.zIndex,flip:item.classList.contains("is-layout-flipped")}));
    assert(edited.left&&edited.top,"Graveyard drag must write position");
    assert(edited.width>beforeSize,"Graveyard size control must grow selected item");
    assert(edited.z,"Graveyard layer control must write z-index");
    assert.equal(edited.flip,true,"Graveyard flip control must flip selected item");
    await page.locator("[data-graveyard-layout-save]").evaluate((b)=>b.click());
    await page.reload();
    await page.waitForSelector(".graveyard-item-h1",{state:"attached"});
    await page.waitForFunction(()=>document.querySelector(".graveyard-item-h1")?.classList.contains("is-layout-flipped"),null,{timeout:30000});
    await page.evaluate(()=>document.getElementById("graveyardDioramaTestButton")?.click());
    await page.locator("[data-graveyard-layout-copy]").evaluate((b)=>b.click());
    const exported=JSON.parse(await page.locator("#graveyardLayoutExport").inputValue());
    assert(exported.H1&&exported.M1&&exported.C1,"Graveyard export must contain all stable IDs");
    assert.equal(exported.H1.flipX,true);
    console.log("PASS: graveyard stage 4 drag size layer flip save export");
    await page.evaluate(() => {
      localStorage.removeItem("necromancer-dice-graveyard-layout-v3");
      document.getElementById("graveyardDioramaTestButton")?.click();
    });
    await page.waitForSelector("#graveyardDioramaTest:not([hidden])",{state:"visible",timeout:30000});
    await page.locator("[data-graveyard-layout-reset]").evaluate((b)=>b.click());
    const stage5Defaults=await page.evaluate(()=>({
      gate:document.querySelector(".graveyard-item-g1")?.getAttribute("style")||"",
      tree2:document.querySelector(".graveyard-item-t2")?.classList.contains("is-layout-flipped"),
      widths:[...document.querySelectorAll(".graveyard-layout-item")].map(x=>x.style.width)
    }));
    assert(stage5Defaults.gate.includes("left: 39.5278%")||stage5Defaults.gate.includes("left:39.5278%"),"Stage 5 gate must use approved cemetery composition");
    assert.equal(stage5Defaults.tree2,true,"Right cemetery tree must default flipped");
    assert(stage5Defaults.widths.some(w=>w==="25%")&&stage5Defaults.widths.some(w=>w==="7%"),"Stage 5 must use approved varied object scales");
    console.log("PASS: graveyard stage 5 initial cemetery composition");
    const approvedDefaults=await page.evaluate(()=>({
      m1:{left:document.querySelector(".graveyard-item-m1")?.style.left,z:document.querySelector(".graveyard-item-m1")?.style.zIndex},
      m2:{left:document.querySelector(".graveyard-item-m2")?.style.left,z:document.querySelector(".graveyard-item-m2")?.style.zIndex},
      t1:{bottom:document.querySelector(".graveyard-item-t1")?.style.bottom,z:document.querySelector(".graveyard-item-t1")?.style.zIndex},
      h2:{width:document.querySelector(".graveyard-item-h2")?.style.width,z:document.querySelector(".graveyard-item-h2")?.style.zIndex,flip:document.querySelector(".graveyard-item-h2")?.classList.contains("is-layout-flipped")}
    }));
    assert.equal(approvedDefaults.m1.left,"30.729%");
    assert.equal(approvedDefaults.m1.z,"2");
    assert.equal(approvedDefaults.m2.left,"37.4085%");
    assert.equal(approvedDefaults.m2.z,"0");
    assert.equal(approvedDefaults.t1.bottom,"");
    assert.equal(approvedDefaults.t1.z,"5");
    assert.equal(approvedDefaults.h2.width,"12%");
    assert.equal(approvedDefaults.h2.z,"9");
    assert.equal(approvedDefaults.h2.flip,true);
    console.log("PASS: graveyard approved layout defaults");
    await page.evaluate(()=>{
      document.getElementById("graveyardDioramaClose")?.click();
      document.getElementById("graveyardDioramaTestButton")?.click();
    });
    await page.waitForFunction(()=>document.getElementById("mapBoard")?.classList.contains("is-graveyard-zooming"),null,{timeout:10000});
    const graveZoom=await page.locator("#mapBoard").evaluate(el=>getComputedStyle(el).transform);
    assert(graveZoom&&graveZoom!=="none","Graveyard camera must zoom map board");
    await page.waitForFunction(()=>document.getElementById("mapBoard")?.classList.contains("is-graveyard-tilted"),null,{timeout:10000});
    await page.waitForFunction(()=>document.getElementById("graveyardDioramaTest")?.classList.contains("is-playing"),null,{timeout:10000});
    await page.waitForFunction(()=>{
      const stage=document.querySelector(".graveyard-layout-stage");
      return stage && Number.parseFloat(getComputedStyle(stage).opacity) >= .99;
    },null,{timeout:10000});
    const cameraState=await page.evaluate(()=>({
      tilted:document.getElementById("mapBoard")?.classList.contains("is-graveyard-tilted"),
      props:document.getElementById("mapBoard")?.classList.contains("is-graveyard-props"),
      playing:document.getElementById("graveyardDioramaTest")?.classList.contains("is-playing"),
      opacity:getComputedStyle(document.querySelector(".graveyard-layout-stage")).opacity
    }));
    assert.equal(cameraState.tilted,true);
    assert.equal(cameraState.props,true);
    assert.equal(cameraState.playing,true);
    assert(Number.parseFloat(cameraState.opacity) >= .99,"Graveyard props must finish visible after camera settle");
    console.log("PASS: graveyard zoom tilt camera sequence");
    await page.locator("[data-graveyard-editor-collapse]").evaluate((b)=>b.click());
    const collapsedState=await page.evaluate(()=>({
      collapsed:document.getElementById("graveyardLayerDebug")?.classList.contains("is-collapsed"),
      reopenHidden:document.getElementById("graveyardEditorReopen")?.hidden,
      panelPointer:getComputedStyle(document.getElementById("graveyardLayerDebug")).pointerEvents
    }));
    assert.equal(collapsedState.collapsed,true);
    assert.equal(collapsedState.reopenHidden,false);
    assert.equal(collapsedState.panelPointer,"none");
    await page.locator("#graveyardEditorReopen").evaluate((b)=>b.click());
    const reopenedState=await page.evaluate(()=>({
      collapsed:document.getElementById("graveyardLayerDebug")?.classList.contains("is-collapsed"),
      reopenHidden:document.getElementById("graveyardEditorReopen")?.hidden
    }));
    assert.equal(reopenedState.collapsed,false);
    assert.equal(reopenedState.reopenHidden,true);
    console.log("PASS: graveyard editor collapse and reopen");
    console.log("PASS: mobile village six distinct building assets " + JSON.stringify(villageAssets));

    await page.goto(base);
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
