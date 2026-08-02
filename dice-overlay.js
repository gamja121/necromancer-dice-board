/**
 * dice-overlay.js
 * Single-instance screen-center 3D dice overlay module
 * DOM & Browser / Node.js standard structure
 */

(function (exports) {
  "use strict";

  let overlayContainer = null;
  let cubeEl = null;
  let headerEl = null;
  let instructionEl = null;
  let resultBadgeEl = null;
  let faceElements = [];

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

  /**
   * requestRoll
   * @param {Object} options
   * @param {string} options.context - Roll context description (e.g. '이동 주사위', '전투 운명 판정')
   * @param {Array<number|string>} options.faceValues - Array of 6 face values
   * @param {number} options.resultIndex - Target face index (0..5)
   * @param {number|string} options.resultValue - Expected result value
   * @param {boolean} options.tapToRoll - If true, wait for user tap before spinning
   * @param {string} options.battleToken - Optional battle token for transaction
   * @param {string} options.mapToken - Optional map token for transaction
   * @returns {Promise<Object>} Resolves to { resultIndex, resultValue, battleToken, mapToken }
   */
  function requestRoll(options = {}) {
    return new Promise((resolve) => {
      const {
        context = "주사위 굴리기",
        faceValues = [1, 2, 3, 4, 5, 6],
        resultIndex = 0,
        resultValue = faceValues[0] || 1,
        tapToRoll = true,
        battleToken = null,
        mapToken = null
      } = options;

      if (typeof document === "undefined") {
        // Node environment fallback
        return resolve({ resultIndex, resultValue, battleToken, mapToken });
      }

      ensureDOM();

      headerEl.textContent = context;
      resultBadgeEl.classList.remove("visible");
      resultBadgeEl.textContent = `결과: ${resultValue}`;

      // Set face values
      faceElements.forEach((faceEl, idx) => {
        faceEl.textContent = faceValues[idx] !== undefined ? faceValues[idx] : idx + 1;
      });

      // Reset orientation
      cubeEl.style.transition = "none";
      cubeEl.style.transform = "rotateX(-20deg) rotateY(-20deg)";
      overlayContainer.classList.add("active");

      const executeRollAnimation = () => {
        instructionEl.textContent = "운명을 판정하는 중...";

        const targetRot = FACE_ORIENTATIONS[resultIndex % 6];
        // Add full 3D rotations for roll effect
        const extraRotX = 360 * 4;
        const extraRotY = 360 * 4;

        const finalRotX = targetRot.x + extraRotX;
        const finalRotY = targetRot.y + extraRotY;

        cubeEl.style.transition = "transform 1.8s cubic-bezier(0.15, 0.85, 0.35, 1.2)";
        cubeEl.style.transform = `rotateX(${finalRotX}deg) rotateY(${finalRotY}deg)`;

        setTimeout(() => {
          resultBadgeEl.classList.add("visible");
          instructionEl.textContent = "결과 확정!";

          setTimeout(() => {
            overlayContainer.classList.remove("active");
            resolve({ resultIndex, resultValue, battleToken, mapToken });
          }, 800);
        }, 1850);
      };

      if (tapToRoll) {
        instructionEl.textContent = "화면을 터치하여 주사위를 굴리세요";
        const handleTap = (e) => {
          e.preventDefault();
          overlayContainer.removeEventListener("click", handleTap);
          overlayContainer.removeEventListener("touchstart", handleTap);
          executeRollAnimation();
        };
        overlayContainer.addEventListener("click", handleTap);
        overlayContainer.addEventListener("touchstart", handleTap);
      } else {
        setTimeout(executeRollAnimation, 100);
      }
    });
  }

  exports.requestRoll = requestRoll;
  exports.ensureDOM = ensureDOM;

})(typeof exports !== "undefined" ? exports : (window.DiceOverlay = {}));
