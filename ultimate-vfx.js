/* ultimate-vfx.js */
(function (root) {
  let activeSession = null;
  let preloadPromise = null;
  let swordImage = null;
  let audioCtx = null;

  // Sound context and synth functions
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

  function trackAudioNode(node) {
    if (activeSession && activeSession.audioNodes) {
      activeSession.audioNodes.push(node);
    }
  }

  function playFocusRiseSound() {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const vol = getVolume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    trackAudioNode(osc);
    trackAudioNode(gain);

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

    trackAudioNode(osc);
    trackAudioNode(gain);

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
    trackAudioNode(thud);
    trackAudioNode(thudGain);

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
      trackAudioNode(osc);
      trackAudioNode(gain);

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
      trackAudioNode(noise);
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      trackAudioNode(filter);
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(340, now);
      filter.Q.setValueAtTime(2.2, now);

      const gain = ctx.createGain();
      trackAudioNode(gain);
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
    trackAudioNode(osc);
    trackAudioNode(gain);

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
      const ImageClass = typeof Image !== "undefined" ? Image : (typeof window !== "undefined" ? window.Image : null);
      if (!ImageClass) {
        resolve(false);
        return;
      }
      swordImage = new ImageClass();
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
    return !activeSession;
  }

  function prefersReducedMotion() {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // Session common cleanup and resolve
  function finishSession(reason = "complete") {
    const session = activeSession;
    if (!session || session.completed) return;

    session.completed = true;

    if (session.animationFrameId) {
      cancelAnimationFrame(session.animationFrameId);
    }
    if (session.safetyTimeoutId) {
      clearTimeout(session.safetyTimeoutId);
    }
    session.timerIds.forEach((id) => clearTimeout(id));

    // Cleanup and stop audio nodes safely
    session.audioNodes.forEach((node) => {
      try {
        node.stop();
      } catch (e) {}
      try {
        node.disconnect();
      } catch (e) {}
    });

    // Remove DOM overlays
    if (session.overlay && session.overlay.parentNode) {
      session.overlay.parentNode.removeChild(session.overlay);
    }
    if (session.clone && session.clone.parentNode) {
      session.clone.parentNode.removeChild(session.clone);
    }

    if (session.boardElement) {
      session.boardElement.style.opacity = "";
    }

    if (typeof state !== "undefined") {
      state.isRolling = false;
    }

    activeSession = null;
    session.resolve({ reason, impactTriggered: session.impactTriggered === true });
  }

  // Main animation play
  function playGreatswordImpact(options = {}) {
    return new Promise((resolve) => {
      // If there's an active session, supersede it cleanly
      if (activeSession) {
        finishSession("superseded");
      }

      const {
        boardElement,
        targetCell,
        attackerOwner = "player",
        damage = 3,
        isKill = false,
        onImpact = () => {},
        reducedMotion = prefersReducedMotion()
      } = options;

      if (!boardElement) {
        onImpact();
        resolve({ reason: "missing_board" });
        return;
      }

      // Find target cell element
      const targetCellEl = boardElement.querySelector(
        `[data-row="${targetCell.row}"][data-col="${targetCell.col}"]`
      );

      if (!targetCellEl) {
        onImpact();
        resolve({ reason: "missing_target_cell" });
        return;
      }

      // Initialise activeSession
      activeSession = {
        resolve,
        boardElement,
        animationFrameId: null,
        safetyTimeoutId: null,
        timerIds: [],
        audioNodes: [],
        overlay: null,
        clone: null,
        isHitStop: false,
        impactTriggered: false,
        completed: false
      };

      if (typeof state !== "undefined") {
        state.isRolling = true; // Lock inputs
      }

      const boardRect = boardElement.getBoundingClientRect();
      const wrapRect = boardElement.parentNode.getBoundingClientRect();

      // Audio trigger: Focus phase
      playFocusRiseSound();

      // Dim overlay
      const overlay = document.createElement("div");
      overlay.className = "ultimate-vfx-dim-overlay";
      document.body.appendChild(overlay);
      activeSession.overlay = overlay;
      overlay.offsetHeight; // trigger reflow
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
      activeSession.clone = clone;

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
      
      // Fallback check if greatsword image is not loaded
      const isImgReady = swordImage && swordImage.complete && swordImage.naturalWidth > 0;
      if (!isImgReady) {
        sword.classList.add("ultimate-vfx-greatsword-fallback");
      }
      
      sword.style.left = `${centerX - 70}px`; // 140px / 2
      sword.style.top = `${centerY - 280}px`; // origin bottom center, so bottom matches centerY
      clone.appendChild(sword);

      const shadow = document.createElement("div");
      shadow.className = "ultimate-vfx-shadow";
      shadow.style.left = `${centerX}px`;
      shadow.style.top = `${centerY}px`;
      clone.appendChild(shadow);

      // Duration configs based on reducedMotion
      const focusDuration = reducedMotion ? 100 : 180;
      const dropDuration = reducedMotion ? 150 : 340;
      const tImpact = focusDuration + dropDuration;
      const totalDuration = reducedMotion ? 600 : 1450;
      const recoveryStartTime = reducedMotion ? 400 : 1100;

      let particles = [];
      let cracks = [];
      let crackProgress = 0;
      let hasImpacted = false;
      let whooshPlayed = false;

      // Generate layered, branching fracture paths once so every frame is stable.
      const craterPoints = [];
      const craterPointCount = reducedMotion ? 7 : 11;
      for (let i = 0; i < craterPointCount; i++) {
        const angle = (i / craterPointCount) * Math.PI * 2;
        const radius = cellWidth * (0.12 + Math.random() * 0.1);
        craterPoints.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius * 0.62
        });
      }

      const crackCount = reducedMotion ? 4 : (8 + Math.floor(Math.random() * 3));
      for (let i = 0; i < crackCount; i++) {
        const angle = (i / crackCount) * Math.PI * 2 + (Math.random() * 0.34 - 0.17);
        const segments = reducedMotion ? 3 : (5 + Math.floor(Math.random() * 3));
        const path = [{ x: centerX, y: centerY }];
        const branches = [];
        let curX = centerX;
        let curY = centerY;
        const maxRadius = cellWidth * (reducedMotion ? 0.9 : (1.35 + Math.random() * 0.4));
        const segLen = maxRadius / segments;
        for (let j = 1; j <= segments; j++) {
          const segAngle = angle + (Math.random() * 0.62 - 0.31);
          const lengthJitter = 0.72 + Math.random() * 0.5;
          curX += Math.cos(segAngle) * segLen * lengthJitter;
          curY += Math.sin(segAngle) * segLen * lengthJitter;
          path.push({ x: curX, y: curY });

          if (!reducedMotion && j > 1 && j < segments && Math.random() < 0.58) {
            const branchAngle = segAngle + (Math.random() < 0.5 ? -1 : 1) * (0.48 + Math.random() * 0.45);
            const branchLength = segLen * (0.75 + Math.random() * 0.9);
            const branchMid = {
              x: curX + Math.cos(branchAngle) * branchLength * 0.48,
              y: curY + Math.sin(branchAngle) * branchLength * 0.48
            };
            branches.push({
              startProgress: j / segments,
              points: [
                { x: curX, y: curY },
                {
                  x: branchMid.x + (Math.random() * 8 - 4),
                  y: branchMid.y + (Math.random() * 8 - 4)
                },
                {
                  x: curX + Math.cos(branchAngle) * branchLength,
                  y: curY + Math.sin(branchAngle) * branchLength
                }
              ]
            });
          }
        }
        cracks.push({
          points: path,
          branches,
          weight: 0.78 + Math.random() * 0.5
        });
      }

      // Generate particles
      function spawnParticles() {
        const pCount = reducedMotion ? 1 : (9 + Math.floor(Math.random() * 5));
        for (let i = 0; i < pCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2.5 + Math.random() * 4.5;
          const vZ = 4.0 + Math.random() * 6.5;
          particles.push({
            x: centerX,
            y: centerY,
            z: 0,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2.5,
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

      function spawnShockwaves() {
        const shockwave = document.createElement("div");
        shockwave.className = "ultimate-vfx-shockwave";
        shockwave.style.left = `${centerX}px`;
        shockwave.style.top = `${centerY}px`;
        clone.appendChild(shockwave);

        if (!reducedMotion) {
          const shockwave2 = document.createElement("div");
          shockwave2.className = "ultimate-vfx-shockwave-double";
          shockwave2.style.left = `${centerX}px`;
          shockwave2.style.top = `${centerY}px`;
          clone.appendChild(shockwave2);
        }
      }

      // Safety timeout
      activeSession.safetyTimeoutId = setTimeout(() => {
        console.warn("Ultimate VFX safety timeout triggered.");
        finishSession("safety_timeout");
      }, 3500);

      let lastTime = performance.now();
      let simTime = 0;

      function tick(now) {
        if (!activeSession || activeSession.completed) return;

        const currentNow = (typeof now === "number" && now > 0) ? now : performance.now();
        const dt = Math.max(0, currentNow - lastTime);
        lastTime = currentNow;

        if (!activeSession.isHitStop) {
          simTime += dt;
        }

        if (simTime >= totalDuration) {
          finishSession("complete");
          return;
        }

        // A. Focus Phase
        if (simTime < focusDuration) {
          const p = simTime / focusDuration;
          if (!reducedMotion) {
            clone.style.transform = `perspective(600px) rotateX(${p * 6}deg)`;
          }
        }

        // B. Sword Drop Phase
        if (simTime >= focusDuration && simTime < tImpact) {
          if (!whooshPlayed) {
            playWhooshSound();
            whooshPlayed = true;
          }
          reticle.style.opacity = Math.max(0, 1 - (simTime - focusDuration) / 100);

          const dropProgress = (simTime - focusDuration) / dropDuration;
          const easedP = Math.pow(dropProgress, 3.5);

          if (reducedMotion) {
            const tx = 50 * (1 - easedP);
            const ty = -100 * (1 - easedP);
            const scale = 1.0 + 0.4 * (1 - easedP);
            const rotZ = -20 * (1 - easedP);
            sword.style.opacity = Math.min(1, dropProgress * 3.0);
            sword.style.transform = `translate(${tx}px, ${ty}px) rotateZ(${rotZ}deg) scale(${scale})`;
          } else {
            const tx = 160 * (1 - easedP);
            const ty = -320 * (1 - easedP);
            const scale = 1.0 + 1.2 * (1 - easedP);
            const rotZ = -45 * (1 - easedP);
            const rotY = -12 * (1 - easedP);
            sword.style.opacity = Math.min(1, dropProgress * 2.5);
            sword.style.transform = `translate(${tx}px, ${ty}px) rotateZ(${rotZ}deg) rotateY(${rotY}deg) scale(${scale})`;
          }

          const shadowScale = easedP;
          shadow.style.opacity = easedP * 0.7;
          shadow.style.transform = `translate(-50%, -50%) scale(${shadowScale})`;
        }

        // C. Impact Moment
        if (simTime >= tImpact && !hasImpacted) {
          hasImpacted = true;
          if (activeSession) {
            activeSession.impactTriggered = true;
          }
          sword.style.transform = "translate(0, 0) rotateZ(0deg) scale(1)";
          shadow.style.transform = "translate(-50%, -50%) scale(1)";

          // Trigger game impact callback
          onImpact();

          // Synth sound and vibration
          playImpactSound();
          if (typeof state !== "undefined" && state.vibrationEnabled && !state.musicMuted && navigator.vibrate) {
            navigator.vibrate(reducedMotion ? 12 : 24);
          }

          // Trigger hit stop freeze
          activeSession.isHitStop = true;
          clone.classList.add("ultimate-vfx-is-hit-stop");

          // Flash
          const flash = document.createElement("div");
          flash.className = "ultimate-vfx-flash";
          clone.appendChild(flash);
          flash.offsetHeight;
          flash.classList.add("is-active");

          if (isKill) {
            const glow = document.createElement("div");
            glow.className = "ultimate-vfx-killed-glow";
            glow.style.left = `${centerX - cellWidth * 1.5}px`;
            glow.style.top = `${centerY - cellHeight * 1.5}px`;
            glow.style.width = `${cellWidth * 3}px`;
            glow.style.height = `${cellHeight * 3}px`;
            clone.appendChild(glow);
          }

          const hitStopDuration = reducedMotion ? 35 : (isKill ? 80 : 60);

          const hitStopTimeoutId = setTimeout(() => {
            if (!activeSession || activeSession.completed) return;
            activeSession.isHitStop = false;
            if (activeSession.clone) {
              activeSession.clone.classList.remove("ultimate-vfx-is-hit-stop");
              if (!reducedMotion) {
                activeSession.clone.classList.add("ultimate-vfx-shake");
                const shakeTimeoutId = setTimeout(() => {
                  if (activeSession && activeSession.clone) {
                    activeSession.clone.classList.remove("ultimate-vfx-shake");
                  }
                }, 140);
                activeSession.timerIds.push(shakeTimeoutId);
              }
            }
            // Spawn shockwave and particles now
            spawnShockwaves();
            spawnParticles();
          }, hitStopDuration);
          activeSession.timerIds.push(hitStopTimeoutId);
        }

        // D. Crack & Particles rendering
        if (simTime >= tImpact) {
          if (!activeSession.isHitStop) {
            // Update crack growth
            crackProgress = Math.min(1.0, crackProgress + (reducedMotion ? 0.08 : 0.045));

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

          // Clear and scale canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          ctx.scale(2, 2);

          // Draw a layered crater and branching floor fractures.
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          if (crackProgress > 0.03 && craterPoints.length > 2) {
            const craterScale = Math.min(1, crackProgress * 2.8);
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.scale(craterScale, craterScale);
            ctx.translate(-centerX, -centerY);
            ctx.beginPath();
            ctx.moveTo(craterPoints[0].x, craterPoints[0].y);
            for (let i = 1; i < craterPoints.length; i++) {
              ctx.lineTo(craterPoints[i].x, craterPoints[i].y);
            }
            ctx.closePath();
            ctx.fillStyle = "rgba(7, 5, 5, 0.94)";
            ctx.fill();
            ctx.lineWidth = 5.5;
            ctx.strokeStyle = "rgba(20, 12, 10, 0.95)";
            ctx.stroke();
            ctx.lineWidth = 1.6;
            ctx.strokeStyle = isKill ? "rgba(255, 63, 48, 0.95)" : "rgba(230, 166, 92, 0.82)";
            ctx.stroke();
            ctx.restore();
          }

          function traceFracture(points, pointsToDraw, offsetX = 0, offsetY = 0) {
            if (pointsToDraw < 2) return;
            ctx.beginPath();
            ctx.moveTo(points[0].x + offsetX, points[0].y + offsetY);
            for (let j = 1; j < pointsToDraw; j++) {
              ctx.lineTo(points[j].x + offsetX, points[j].y + offsetY);
            }
          }

          function drawFracture(points, pointsToDraw, weight, branch = false) {
            if (pointsToDraw < 2) return;
            const width = (branch ? 3.4 : 7.2) * weight;

            traceFracture(points, pointsToDraw, 1.5, 1.8);
            ctx.lineWidth = width + 2.4;
            ctx.strokeStyle = "rgba(0, 0, 0, 0.46)";
            ctx.stroke();

            traceFracture(points, pointsToDraw);
            ctx.lineWidth = width;
            ctx.strokeStyle = "rgba(10, 7, 7, 0.96)";
            ctx.stroke();

            traceFracture(points, pointsToDraw);
            ctx.lineWidth = Math.max(1.2, width * 0.38);
            ctx.strokeStyle = isKill ? "rgba(124, 18, 16, 0.94)" : "rgba(74, 43, 26, 0.9)";
            ctx.stroke();

            traceFracture(points, pointsToDraw, -0.9, -1.05);
            ctx.lineWidth = branch ? 0.75 : 1.15;
            ctx.strokeStyle = isKill ? "rgba(255, 82, 60, 0.78)" : "rgba(255, 218, 170, 0.58)";
            ctx.stroke();
          }

          cracks.forEach((crack) => {
            const path = crack.points;
            if (path.length < 2) return;
            const pointsToDraw = Math.ceil(path.length * crackProgress);
            if (pointsToDraw < 2) return;

            drawFracture(path, pointsToDraw, crack.weight);

            crack.branches.forEach((branch) => {
              if (crackProgress < branch.startProgress) return;
              const branchProgress = Math.min(1, (crackProgress - branch.startProgress) / 0.34);
              const branchPointsToDraw = Math.ceil(branch.points.length * branchProgress);
              drawFracture(branch.points, branchPointsToDraw, crack.weight * 0.72, true);
            });
          });

          // Draw particles
          particles.forEach((p) => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);

            const size = Math.max(1, p.size * (1.0 + p.z * 0.05));

            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.opacity;

            ctx.beginPath();
            ctx.moveTo(-size / 2, -size / 2);
            ctx.lineTo(size / 2, -size / 3);
            ctx.lineTo(size / 3, size / 2);
            ctx.lineTo(-size / 2, size / 2);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
            ctx.lineWidth = 0.5;
            ctx.stroke();

            ctx.restore();
          });

          ctx.restore();
        }

        // E. Fade out and Recovery
        if (simTime >= recoveryStartTime) {
          const fadeProgress = (simTime - recoveryStartTime) / (totalDuration - recoveryStartTime);
          sword.style.opacity = Math.max(0, 1 - fadeProgress);
          canvas.style.opacity = Math.max(0, 1 - fadeProgress * 1.5);
          overlay.style.opacity = Math.max(0, 1 - fadeProgress);

          if (!reducedMotion) {
            clone.style.transform = `perspective(600px) rotateX(${Math.max(0, 6 * (1 - fadeProgress))}deg)`;
          }
        }

        activeSession.animationFrameId = requestAnimationFrame(tick);
      }

      // Start tick loop
      activeSession.animationFrameId = requestAnimationFrame(tick);
    });
  }

  // Cancel immediately
  function cancel() {
    if (activeSession) {
      finishSession("cancelled");
    }
  }

  function destroy() {
    cancel();
  }

  // Export window namespace
  const UltimateVfx = {
    preload,
    canPlay,
    prefersReducedMotion,
    playGreatswordImpact,
    cancel,
    destroy
  };

  if (root) {
    root.UltimateVfx = UltimateVfx;
  }
})(typeof window !== "undefined" ? window : globalThis);
