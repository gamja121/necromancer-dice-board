/* ultimate-vfx.js */
(function (root) {
  let activeAnimationId = null;
  let activeOverlay = null;
  let activeClone = null;
  let isCancelled = false;
  let preloadPromise = null;
  let swordImage = null;

  // Sound context and synth functions
  let audioCtx = null;
  function ensureAudioContext() {
    if (typeof state !== "undefined" && (state.musicMuted || (state.sfxVolume ?? 1) <= 0)) {
      return null;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function getVolume() {
    if (typeof state !== "undefined") {
      return state.sfxVolume ?? 0.6;
    }
    return 0.6;
  }

  function playFocusRiseSound() {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const vol = getVolume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.exponentialRampToValueAtTime(210, now + 0.18);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.035 * vol, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  function playWhooshSound() {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const vol = getVolume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.34);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.045 * vol, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  function playImpactSound() {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const vol = getVolume();
    const now = ctx.currentTime;

    // Heavy thud
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = "triangle";
    thud.frequency.setValueAtTime(135, now);
    thud.frequency.exponentialRampToValueAtTime(35, now + 0.24);
    thudGain.gain.setValueAtTime(0.18 * vol, now);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.start(now);
    thud.stop(now + 0.26);

    // Metallic ring (3 frequencies)
    const ringFreqs = [880, 1340, 2200];
    ringFreqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(0.025 * vol * (1 - idx * 0.25), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38 - idx * 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.42);
    });

    // Crack noise
    playCrackSound(ctx, now, vol);
  }

  function playCrackSound(ctx, now, vol) {
    try {
      const bufferSize = ctx.sampleRate * 0.3; // 300ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(340, now);
      filter.Q.setValueAtTime(2.2, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.07 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.3);

      // Debris click schedule
      for (let i = 0; i < 7; i++) {
        const delay = 0.08 + Math.random() * 0.32;
        playDebrisClick(ctx, now + delay, vol);
      }
    } catch (e) {
      console.warn("Crack sound synthesis failed:", e);
    }
  }

  function playDebrisClick(ctx, time, vol) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1400 + Math.random() * 1200, time);
    gain.gain.setValueAtTime(0.004 * vol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.028);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.035);
  }

  // Preload assets
  function preload() {
    if (preloadPromise) return preloadPromise;
    preloadPromise = new Promise((resolve) => {
      swordImage = new Image();
      swordImage.src = "assets/vfx/greatsword.png";
      swordImage.onload = () => resolve(true);
      swordImage.onerror = () => {
        console.warn("Failed to preload ultimate vfx greatsword image.");
        resolve(false);
      };
    });
    return preloadPromise;
  }

  // Check if animation is permitted
  function canPlay() {
    if (typeof state !== "undefined" && state.reducedMotion) return false;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return false;
    return true;
  }

  // Main animation play
  function playGreatswordImpact(options = {}) {
    return new Promise((resolve) => {
      const {
        boardElement,
        targetCell,
        attackerOwner = "player",
        damage = 3,
        isKill = false,
        onImpact = () => {}
      } = options;

      if (!boardElement) {
        onImpact();
        resolve();
        return;
      }

      isCancelled = false;

      // Lock standard user input flag in state if possible
      if (typeof state !== "undefined") {
        state.isRolling = true; // locks inputs
      }

      // Check prefers-reduced-motion option
      const reducedMotion = !canPlay();

      // Find target cell element
      const targetCellEl = boardElement.querySelector(
        `[data-row="${targetCell.row}"][data-col="${targetCell.col}"]`
      );

      if (!targetCellEl) {
        onImpact();
        if (typeof state !== "undefined") {
          state.isRolling = false;
        }
        resolve();
        return;
      }

      const boardRect = boardElement.getBoundingClientRect();
      const wrapRect = boardElement.parentNode.getBoundingClientRect();

      // Sound trigger: Focus phase
      playFocusRiseSound();

      // Dim overlay
      const overlay = document.createElement("div");
      overlay.className = "ultimate-vfx-dim-overlay";
      document.body.appendChild(overlay);
      activeOverlay = overlay;
      // Trigger reflow
      overlay.offsetHeight;
      overlay.classList.add("is-active");

      // Clone board
      const clone = boardElement.cloneNode(true);
      clone.removeAttribute("id");
      clone.classList.add("ultimate-vfx-board-clone");
      clone.style.position = "absolute";
      clone.style.left = `${boardRect.left - wrapRect.left}px`;
      clone.style.top = `${boardRect.top - wrapRect.top}px`;
      clone.style.width = `${boardRect.width}px`;
      clone.style.height = `${boardRect.height}px`;
      clone.style.margin = "0";
      boardElement.parentNode.appendChild(clone);
      activeClone = clone;

      // Hide original board
      boardElement.style.opacity = "0";

      // Canvas for drawing cracks and particles
      const canvas = document.createElement("canvas");
      canvas.className = "ultimate-vfx-canvas";
      canvas.width = boardRect.width * 2;
      canvas.height = boardRect.height * 2;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      clone.appendChild(canvas);
      const ctx = canvas.getContext("2d");

      // Get target cell center relative to clone board
      const cloneCell = clone.querySelector(
        `[data-row="${targetCell.row}"][data-col="${targetCell.col}"]`
      );
      const cellWidth = cloneCell.offsetWidth;
      const cellHeight = cloneCell.offsetHeight;
      const centerX = cloneCell.offsetLeft + cellWidth / 2;
      const centerY = cloneCell.offsetTop + cellHeight / 2;

      // Reticle
      const reticle = document.createElement("div");
      reticle.className = "ultimate-vfx-reticle";
      reticle.style.left = `${centerX}px`;
      reticle.style.top = `${centerY}px`;
      clone.appendChild(reticle);
      requestAnimationFrame(() => {
        reticle.classList.add("is-active");
      });

      // Sword & Shadow setup
      const sword = document.createElement("div");
      sword.className = "ultimate-vfx-greatsword";
      sword.style.left = `${centerX - 70}px`; // 140px / 2
      sword.style.top = `${centerY - 280}px`; // origin bottom center, so bottom matches centerY
      clone.appendChild(sword);

      const shadow = document.createElement("div");
      shadow.className = "ultimate-vfx-shadow";
      shadow.style.left = `${centerX}px`;
      shadow.style.top = `${centerY}px`;
      clone.appendChild(shadow);

      // Animation parameters
      const startTime = performance.now();
      const focusDuration = 180;
      const dropDuration = 340;
      const totalDuration = 1450;
      const tImpact = focusDuration + dropDuration; // 520ms

      let particles = [];
      let cracks = [];
      let crackProgress = 0;
      let hasImpacted = false;
      let whooshPlayed = false;

      // Generate crack paths
      const crackCount = 7 + Math.floor(Math.random() * 4);
      for (let i = 0; i < crackCount; i++) {
        const angle = (i / crackCount) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
        const segments = 3 + Math.floor(Math.random() * 3);
        const path = [{ x: centerX, y: centerY }];
        let curX = centerX;
        let curY = centerY;
        const maxRadius = cellWidth * 1.15;
        const segLen = maxRadius / segments;
        for (let j = 1; j <= segments; j++) {
          const segAngle = angle + (Math.random() * 0.3 - 0.15);
          curX += Math.cos(segAngle) * segLen;
          curY += Math.sin(segAngle) * segLen;
          path.push({ x: curX, y: curY });
        }
        cracks.push(path);
      }

      // Generate particles
      function spawnParticles() {
        const pCount = reducedMotion ? 2 : (9 + Math.floor(Math.random() * 5));
        for (let i = 0; i < pCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2.5 + Math.random() * 4.5;
          const vZ = 4.0 + Math.random() * 6.5; // moves towards camera
          particles.push({
            x: centerX,
            y: centerY,
            z: 0,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2.5, // initial upward arc
            vz: vZ,
            gravity: 0.22,
            size: 3.5 + Math.random() * 7,
            color: Math.random() < 0.3 ? "#777" : Math.random() < 0.6 ? "#555" : "#424242",
            rotation: Math.random() * Math.PI * 2,
            vRot: Math.random() * 0.2 - 0.1,
            opacity: 1
          });
        }
      }

      // 2초 안전 타임아웃
      const safetyTimeout = setTimeout(() => {
        console.warn("Ultimate VFX safety timeout triggered.");
        cleanup();
      }, 2000);

      function tick(now) {
        if (isCancelled) return;
        const elapsed = now - startTime;

        if (elapsed >= totalDuration) {
          cleanup();
          return;
        }

        // A. Focus Phase (0 ~ 180ms)
        if (elapsed < focusDuration) {
          const p = elapsed / focusDuration;
          if (!reducedMotion) {
            clone.style.transform = `perspective(600px) rotateX(${p * 6}deg)`;
          }
        }

        // B. Sword Drop Phase (180 ~ 520ms)
        if (elapsed >= focusDuration && elapsed < tImpact) {
          if (!whooshPlayed) {
            playWhooshSound();
            whooshPlayed = true;
          }
          reticle.style.opacity = Math.max(0, 1 - (elapsed - focusDuration) / 100);

          const dropProgress = (elapsed - focusDuration) / dropDuration;
          
          // Eased drop using easeInCubic for speed acceleration in last 60ms
          const easedP = Math.pow(dropProgress, 3.5);

          // Sword transform coordinates
          const tx = 160 * (1 - easedP);
          const ty = -320 * (1 - easedP);
          const scale = 1.0 + 1.2 * (1 - easedP);
          const rotZ = -45 * (1 - easedP);
          const rotY = -12 * (1 - easedP);

          sword.style.opacity = Math.min(1, dropProgress * 2.5);
          sword.style.transform = `translate(${tx}px, ${ty}px) rotateZ(${rotZ}deg) rotateY(${rotY}deg) scale(${scale})`;

          // Shadow transform
          const shadowScale = easedP;
          shadow.style.opacity = easedP * 0.7;
          shadow.style.transform = `translate(-50%, -50%) scale(${shadowScale})`;
        }

        // C. Impact Moment (520ms)
        if (elapsed >= tImpact && !hasImpacted) {
          hasImpacted = true;
          sword.style.transform = "translate(0, 0) rotateZ(0deg) scale(1)";
          shadow.style.transform = "translate(-50%, -50%) scale(1)";

          // Trigger game impact callback (shows damage, etc.)
          onImpact();

          // Synth sound and vibration
          playImpactSound();
          if (typeof state !== "undefined" && state.vibrationEnabled && !state.musicMuted && navigator.vibrate) {
            navigator.vibrate(24);
          }

          // Visual shockwave
          const shockwave = document.createElement("div");
          shockwave.className = "ultimate-vfx-shockwave";
          shockwave.style.left = `${centerX}px`;
          shockwave.style.top = `${centerY}px`;
          clone.appendChild(shockwave);

          const shockwave2 = document.createElement("div");
          shockwave2.className = "ultimate-vfx-shockwave-double";
          shockwave2.style.left = `${centerX}px`;
          shockwave2.style.top = `${centerY}px`;
          clone.appendChild(shockwave2);

          // Flash
          const flash = document.createElement("div");
          flash.className = "ultimate-vfx-flash";
          clone.appendChild(flash);
          flash.offsetHeight; // force reflow
          flash.classList.add("is-active");

          // Shake board
          if (!reducedMotion) {
            clone.classList.add("ultimate-vfx-shake");
            setTimeout(() => {
              clone.classList.remove("ultimate-vfx-shake");
            }, 140);
          }

          // 처치 시 붉은 잔광 추가
          if (isKill) {
            const glow = document.createElement("div");
            glow.className = "ultimate-vfx-killed-glow";
            glow.style.left = `${centerX - cellWidth * 1.5}px`;
            glow.style.top = `${centerY - cellHeight * 1.5}px`;
            glow.style.width = `${cellWidth * 3}px`;
            glow.style.height = `${cellHeight * 3}px`;
            clone.appendChild(glow);
          }

          // Spawn particles
          spawnParticles();
        }

        // D. Crack & Particles rendering (520 ~ 1100ms)
        if (elapsed >= tImpact) {
          // Freeze frame simulation for the first 60ms
          const isFreezing = (elapsed < tImpact + 60);

          if (!isFreezing) {
            // Update crack growth
            crackProgress = Math.min(1.0, crackProgress + 0.045);

            // Update particles
            particles.forEach((p) => {
              p.x += p.vx;
              p.y += p.vy;
              p.vy += p.gravity;
              p.z += p.vz;
              p.rotation += p.vRot;
              p.opacity = Math.max(0, p.opacity - 0.016);
            });
            particles = particles.filter((p) => p.opacity > 0);
          }

          // Clear canvas (scale 2x for retina)
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          ctx.scale(2, 2);

          // Draw cracks
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          cracks.forEach((path) => {
            if (path.length < 2) return;
            const pointsToDraw = Math.ceil(path.length * crackProgress);
            if (pointsToDraw < 2) return;

            // Outer dark crack contour
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let j = 1; j < pointsToDraw; j++) {
              ctx.lineTo(path[j].x, path[j].y);
            }
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = "rgba(17, 17, 17, 0.85)";
            ctx.stroke();

            // Inner colored crack contour
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let j = 1; j < pointsToDraw; j++) {
              ctx.lineTo(path[j].x, path[j].y);
            }
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = isKill ? "#ff332f" : "#fff";
            ctx.stroke();
          });

          // Draw debris particles
          particles.forEach((p) => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);

            // Adjust scale factor based on simulated depth
            const dFactor = 100 / (100 + p.z); // goes smaller as it moves away, larger if vz is negative
            // We want debris to fly out towards the camera, so vz makes it look closer initially
            const size = Math.max(1, p.size * (1.0 + p.z * 0.05));

            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.opacity;

            // Draw a jagged stone shape (polygon)
            ctx.beginPath();
            ctx.moveTo(-size / 2, -size / 2);
            ctx.lineTo(size / 2, -size / 3);
            ctx.lineTo(size / 3, size / 2);
            ctx.lineTo(-size / 2, size / 2);
            ctx.closePath();
            ctx.fill();

            // Tiny highlight on stone
            ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
            ctx.lineWidth = 0.5;
            ctx.stroke();

            ctx.restore();
          });

          ctx.restore();
        }

        // E. Fade out and Recovery (1100 ~ 1450ms)
        if (elapsed >= 1100) {
          const fadeProgress = (elapsed - 1100) / (totalDuration - 1100);
          sword.style.opacity = Math.max(0, 1 - fadeProgress);
          canvas.style.opacity = Math.max(0, 1 - fadeProgress * 1.5);
          overlay.style.opacity = Math.max(0, 1 - fadeProgress);

          if (!reducedMotion) {
            clone.style.transform = `perspective(600px) rotateX(${Math.max(0, 6 * (1 - fadeProgress))}deg)`;
          }
        }

        activeAnimationId = requestAnimationFrame(tick);
      }

      function cleanup() {
        if (isCancelled) return;
        isCancelled = true;
        clearTimeout(safetyTimeout);
        if (activeAnimationId) {
          cancelAnimationFrame(activeAnimationId);
          activeAnimationId = null;
        }

        // Remove overlay
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        activeOverlay = null;

        // Remove clone and restore board opacity
        if (clone && clone.parentNode) {
          clone.parentNode.removeChild(clone);
        }
        activeClone = null;

        boardElement.style.opacity = "1";

        // Unlock inputs
        if (typeof state !== "undefined") {
          state.isRolling = false;
        }

        resolve();
      }

      // Start the animation loop
      activeAnimationId = requestAnimationFrame(tick);
    });
  }

  // Cancel immediately on reset
  function cancel() {
    isCancelled = true;
    if (activeAnimationId) {
      cancelAnimationFrame(activeAnimationId);
      activeAnimationId = null;
    }
    if (activeOverlay && activeOverlay.parentNode) {
      activeOverlay.parentNode.removeChild(activeOverlay);
    }
    activeOverlay = null;

    if (activeClone && activeClone.parentNode) {
      activeClone.parentNode.removeChild(activeClone);
    }
    activeClone = null;

    const board = document.getElementById("board");
    if (board) {
      board.style.opacity = "1";
    }

    if (typeof state !== "undefined") {
      state.isRolling = false;
    }
  }

  function destroy() {
    cancel();
  }

  // Export
  const UltimateVfx = {
    preload,
    canPlay,
    playGreatswordImpact,
    cancel,
    destroy
  };

  if (root) {
    root.UltimateVfx = UltimateVfx;
  }
})(typeof window !== "undefined" ? window : globalThis);
