/**
 * dice-overlay.js
 * Single-instance screen-center 3D dice overlay module
 * Browser & Node.js CommonJS/ESM dynamic export
 */

(function (exports) {
  "use strict";

  let overlayContainer = null;
  let cubeEl = null;
  let headerEl = null;
  let instructionEl = null;
  let resultBadgeEl = null;
  let faceElements = [];
  let activeSession = null;

  const FACE_ORIENTATIONS = [
    { x: 0, y: 0 },        // Front (Index 0)
    { x: 0, y: -180 },     // Back (Index 1)
    { x: 0, y: -90 },      // Right (Index 2)
    { x: 0, y: 90 },       // Left (Index 3)
    { x: -90, y: 0 },      // Top (Index 4)
    { x: 90, y: 0 }        // Bottom (Index 5)
  ];

  function ensureDOM() {
    if (typeof document === "undefined") return;
    if (overlayContainer) return;

    overlayContainer = document.getElementById("diceOverlay");
    if (!overlayContainer) {
      overlayContainer = document.createElement("div");
      overlayContainer.id = "diceOverlay";
      overlayContainer.innerHTML = `
        <div class="dice-overlay-header" id="diceOverlayHeader">운명의 주사위</div>
        <div class="dice-3d-scene" id="dice3DScene">
          <div class="dice-3d-cube" id="dice3DCube">
            <div class="dice-3d-face dice-face-front">1</div>
            <div class="dice-3d-face dice-face-back">2</div>
            <div class="dice-3d-face dice-face-right">3</div>
            <div class="dice-3d-face dice-face-left">4</div>
            <div class="dice-3d-face dice-face-top">5</div>
            <div class="dice-3d-face dice-face-bottom">6</div>
          </div>
        </div>
        <div class="dice-overlay-instruction" id="diceOverlayInstruction">터치하여 주사위를 굴리세요</div>
        <div class="dice-result-badge" id="diceResultBadge">결과: 6</div>
      `;
      document.body.appendChild(overlayContainer);
    }

    cubeEl = overlayContainer.querySelector("#dice3DCube");
    headerEl = overlayContainer.querySelector("#diceOverlayHeader");
    instructionEl = overlayContainer.querySelector("#diceOverlayInstruction");
    resultBadgeEl = overlayContainer.querySelector("#diceResultBadge");
    faceElements = Array.from(overlayContainer.querySelectorAll(".dice-3d-face"));
  }

  function isActive() {
    return activeSession !== null;
  }

  function normalizedFaces(faceValues) {
    const source = Array.isArray(faceValues) && faceValues.length
      ? faceValues.map((faceValue) => Number(faceValue) || 0)
      : [1, 2, 3, 4, 5, 6];
    return Array.from({ length: 6 }, (_, index) => source[index % source.length]);
  }

  function cancel(reason = "cancelled") {
    if (!activeSession) return false;
    const session = activeSession;
    activeSession = null;

    if (session.cleanup) session.cleanup();
    if (overlayContainer) overlayContainer.classList.remove("active");

    session.resolve({
      resultIndex: session.resultIndex,
      resultValue: session.resultValue,
      battleToken: session.battleToken,
      mapToken: session.mapToken,
      cancelled: true,
      reason: reason
    });
    return true;
  }

  function requestRoll(options = {}) {
    if (activeSession) {
      cancel("superseded");
    }

    return new Promise((resolve) => {
      const {
        context = "주사위 굴리기",
        label = null,
        faceValues = [1, 2, 3, 4, 5, 6],
        resultIndex = 0,
        resultValue = null,
        value = null,
        tapToRoll = true,
        autoRoll = false,
        battleToken = null,
        mapToken = null
      } = options;

      const displayedFaces = normalizedFaces(faceValues);
      let landedIndex = Number.isInteger(resultIndex)
        ? ((resultIndex % 6) + 6) % 6
        : 0;
      const requestedValue = resultValue !== null ? resultValue : value;
      const finalValue = requestedValue !== null
        ? Number(requestedValue) || 0
        : displayedFaces[landedIndex];
      if (displayedFaces[landedIndex] !== finalValue) {
        const matchingIndex = displayedFaces.findIndex((faceValue) => faceValue === finalValue);
        if (matchingIndex >= 0) {
          landedIndex = matchingIndex;
        } else {
          displayedFaces[landedIndex] = finalValue;
        }
      }
      const sessionContext = label || context;

      if (typeof document === "undefined") {
        return resolve({
          resultIndex: landedIndex,
          resultValue: finalValue,
          battleToken,
          mapToken,
          cancelled: false
        });
      }

      ensureDOM();

      const session = {
        id: Math.random().toString(36).substring(2, 9),
        resolve,
        resultIndex: landedIndex,
        resultValue: finalValue,
        battleToken,
        mapToken,
        cleanup: null
      };
      activeSession = session;

      headerEl.textContent = sessionContext;
      resultBadgeEl.classList.remove("visible");
      resultBadgeEl.textContent = `결과: ${finalValue}`;

      faceElements.forEach((faceEl, idx) => {
        faceEl.textContent = displayedFaces[idx];
      });

      cubeEl.style.transition = "none";
      cubeEl.style.transform = "rotateX(-20deg) rotateY(-20deg)";
      overlayContainer.classList.add("active");

      let timers = [];
      let isExecuted = false;

      const cleanupListeners = () => {
        timers.forEach(t => clearTimeout(t));
        timers = [];
        if (overlayContainer) {
          overlayContainer.removeEventListener("pointerdown", handleInput);
          window.removeEventListener("keydown", handleKey);
        }
      };
      session.cleanup = cleanupListeners;

      const finishRoll = (cancelled = false, reason = null) => {
        if (activeSession !== session) return;
        cleanupListeners();
        if (overlayContainer) overlayContainer.classList.remove("active");
        activeSession = null;
        resolve({
          resultIndex: landedIndex,
          resultValue: finalValue,
          battleToken,
          mapToken,
          cancelled: cancelled,
          reason: reason
        });
      };

      const executeRollAnimation = () => {
        if (isExecuted || activeSession !== session) return;
        isExecuted = true;

        instructionEl.textContent = "운명을 판정하는 중...";

        const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const targetRot = FACE_ORIENTATIONS[landedIndex];
        const extraRotX = prefersReducedMotion ? 360 : 360 * 4;
        const extraRotY = prefersReducedMotion ? 360 : 360 * 4;
        const animDuration = prefersReducedMotion ? 0.4 : 0.9;

        const finalRotX = targetRot.x + extraRotX;
        const finalRotY = targetRot.y + extraRotY;

        cubeEl.style.transition = `transform ${animDuration}s cubic-bezier(0.15, 0.85, 0.35, 1.2)`;
        cubeEl.style.transform = `rotateX(${finalRotX}deg) rotateY(${finalRotY}deg)`;

        const badgeTimer = setTimeout(() => {
          if (activeSession !== session) return;
          resultBadgeEl.classList.add("visible");
          instructionEl.textContent = "결과 확정!";

          const finishTimer = setTimeout(() => finishRoll(false, null), 400);
          timers.push(finishTimer);
        }, Math.floor(animDuration * 1000 + 50));

        timers.push(badgeTimer);

        // Safety fallback timeout: releases UI lock with cancelled: true to prevent stuck states
        const safetyTimer = setTimeout(() => {
          if (activeSession === session) finishRoll(true, "timeout");
        }, 3000);
        timers.push(safetyTimer);
      };

      const handleInput = (e) => {
        e.preventDefault();
        executeRollAnimation();
      };

      const handleKey = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          executeRollAnimation();
        }
      };

      if (tapToRoll && !autoRoll) {
        instructionEl.textContent = "화면을 터치하거나 Enter/Space를 누르세요";
        overlayContainer.addEventListener("pointerdown", handleInput, { once: true });
        window.addEventListener("keydown", handleKey, { once: true });
      } else {
        const autoTimer = setTimeout(executeRollAnimation, 80);
        timers.push(autoTimer);
      }
    });
  }

  exports.requestRoll = requestRoll;
  exports.cancel = cancel;
  exports.isActive = isActive;
  exports.ensureDOM = ensureDOM;

})(typeof exports !== "undefined" ? exports : (window.DiceOverlay = {}));
