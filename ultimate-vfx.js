/* ultimate-vfx.js v29 - unified mobile ultimate choreography */
(function (root) {
  let activeSession = null;
  let preloadPromise = null;
  let swordImage = null;
  let spearImage = null;
  let clawImage = null;
  let magicImage = null;
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

  function trackAudioNode(node) {
    if (activeSession && activeSession.audioNodes) {
      activeSession.audioNodes.push(node);
    }
  }

  // Common Sound Synthesizers
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

    playCrackSound(ctx, now, vol);
  }

  function playCrackSound(ctx, now, vol) {
    try {
      const bufferSize = ctx.sampleRate * 0.3;
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
    } catch (e) {}
  }

  function preload() {
    if (preloadPromise) return preloadPromise;
    preloadPromise = new Promise(async (resolve) => {
      if (typeof Image === "undefined") {
        resolve(null);
        return;
      }

      const loadImage = (src) => new Promise((done) => {
        const image = new Image();
        image.onload = () => done(image);
        image.onerror = () => done(null);
        image.src = src;
      });

      // Large transparent PNGs are decoded serially to avoid blocking
      // memory-constrained Android browsers.
      swordImage = await loadImage("./assets/vfx/greatsword.png");
      clawImage = await loadImage("./assets/vfx/claw-rake.png");
      spearImage = await loadImage("./assets/vfx/brutal-spear.png");
      magicImage = await loadImage("./assets/vfx/forbidden-magic.png");
      resolve(swordImage);
    });
    return preloadPromise;
  }

  function canPlay() {
    return !activeSession;
  }

  function prefersReducedMotion() {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  const VALID_VFX_QUALITIES = Object.freeze(new Set(["high", "medium", "low", "reduced"]));

  function normalizeQuality(q) {
    return VALID_VFX_QUALITIES.has(q) ? q : "medium";
  }

  function chooseVfxQuality(environment = {}) {
    const reducedMotion = environment.reducedMotion ?? prefersReducedMotion();
    if (reducedMotion) return "reduced";

    const nav = environment.navigator ?? (typeof navigator !== "undefined" ? navigator : {});
    const memory = Number.isFinite(environment.deviceMemory) ? environment.deviceMemory : nav.deviceMemory;
    const cores = Number.isFinite(environment.hardwareConcurrency) ? environment.hardwareConcurrency : nav.hardwareConcurrency;
    const saveData = environment.saveData ?? nav.connection?.saveData ?? false;

    if (saveData) return "low";
    if ((Number.isFinite(memory) && memory <= 3) || (Number.isFinite(cores) && cores <= 4)) {
      return "low";
    }
    if (!Number.isFinite(memory) || !Number.isFinite(cores)) {
      return "medium";
    }
    if (memory <= 6 || cores <= 6) {
      return "medium";
    }
    if (memory >= 8 && cores >= 8) {
      return "high";
    }
    return "medium";
  }

  function ownerDirection(attackerOwner) {
    return attackerOwner === "enemy" ? -1 : 1;
  }

  function ultimateTiming(reducedMotion, isKill) {
    if (reducedMotion) {
      return { anticipation: 180, hitStop: 30, total: 720, fade: 190 };
    }
    return {
      anticipation: 420,
      hitStop: isKill ? 75 : 60,
      total: isKill ? 1300 : 1200,
      fade: 300
    };
  }

  function prepareOverlay(overlay, attackerOwner, impactX, impactY) {
    const direction = ownerDirection(attackerOwner);
    overlay.classList.add(direction < 0 ? "owner-enemy" : "owner-player");
    overlay.style.setProperty("--owner-direction", String(direction));
    overlay.style.setProperty("--impact-x", `${impactX}px`);
    overlay.style.setProperty("--impact-y", `${impactY}px`);
    return direction;
  }

  function applyBoardWindup(clone, progress, direction, reducedMotion) {
    if (reducedMotion || !clone) return;
    const eased = 1 - Math.pow(1 - Math.max(0, Math.min(1, progress)), 3);
    clone.style.transform =
      `perspective(920px) rotateX(${2 + eased * 4.5}deg) ` +
      `rotateY(${-direction * eased * 2.2}deg) ` +
      `rotateZ(${direction * (1 - eased) * 0.8}deg) scale(${1 + eased * 0.012})`;
  }

  function releaseBoardImpact(clone, direction, reducedMotion) {
    if (reducedMotion || !clone) {
      if (clone) clone.style.transform = "";
      return;
    }
    clone.classList.add(direction < 0 ? "impact-from-enemy" : "impact-from-player");
    clone.classList.add("ultimate-vfx-board-impact");
  }

  function createSeededRandom(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const LEGION_ALIASES = Object.freeze({
    undead: "skeleton",
    elemental: "element"
  });

  function normalizeLegionKey(key) {
    return LEGION_ALIASES[key] || key;
  }

  const VFX_LEGION_PRIORITY = Object.freeze([
    "demon", "ice", "plague", "skeleton", "element",
    "plant", "insect", "corpse", "beast", "summon"
  ]);

  const VFX_LEGION_THEMES = Object.freeze({
    demon: { name: "demon", impactColor: "#d03030", innerColor: "#4a0808", edgeColor: "#ff7766", dustColor: "rgba(180, 50, 40, 0.7)" },
    ice: { name: "ice", impactColor: "#70d0ff", innerColor: "#08304a", edgeColor: "#e0f8ff", dustColor: "rgba(150, 220, 255, 0.7)" },
    plague: { name: "plague", impactColor: "#40aa55", innerColor: "#0a3a14", edgeColor: "#a5ffb8", dustColor: "rgba(80, 160, 90, 0.7)" },
    skeleton: { name: "undead", impactColor: "#a070e0", innerColor: "#28084a", edgeColor: "#e5c0ff", dustColor: "rgba(140, 100, 190, 0.7)" },
    element: { name: "elemental", impactColor: "#ffaa30", innerColor: "#4a2808", edgeColor: "#ffebaa", dustColor: "rgba(230, 170, 60, 0.7)" },
    plant: { name: "plant", impactColor: "#85cc45", innerColor: "#1a3808", edgeColor: "#dcff9e", dustColor: "rgba(130, 190, 70, 0.7)" },
    insect: { name: "insect", impactColor: "#d0a050", innerColor: "#3a280a", edgeColor: "#ffecb0", dustColor: "rgba(190, 150, 80, 0.7)" },
    corpse: { name: "corpse", impactColor: "#803020", innerColor: "#30100a", edgeColor: "#d08070", dustColor: "rgba(110, 60, 50, 0.7)" },
    beast: { name: "beast", impactColor: "#e07830", innerColor: "#3a1a08", edgeColor: "#ffd4aa", dustColor: "rgba(200, 130, 70, 0.7)" },
    summon: { name: "summon", impactColor: "#30d0c0", innerColor: "#083a38", edgeColor: "#b0ffff", dustColor: "rgba(70, 200, 190, 0.7)" },
    default: { name: "default", impactColor: "#d6b36a", innerColor: "#2a2010", edgeColor: "#fff0cd", dustColor: "rgba(188, 174, 148, 0.7)" }
  });

  function getLegionTheme(options = {}) {
    const rawLegions = Array.isArray(options.attackerLegions) ? options.attackerLegions : [];
    const legions = rawLegions.map(normalizeLegionKey);

    const matched = VFX_LEGION_PRIORITY.find((key) => legions.includes(key));
    return VFX_LEGION_THEMES[matched] || VFX_LEGION_THEMES.default;
  }

  function buildFractureModel(options = {}) {
    const quality = normalizeQuality(options.quality || "high");
    const seed = options.debugSeed ?? ((options.attackerId || 1) * 31 + (options.targetId || 1) * 17 + (options.battleToken || 1) * 13 + (options.timestamp || 0));
    const random = createSeededRandom(seed);

    const impactX = options.impactX || 0;
    const impactY = options.impactY || 0;
    const cellWidth = options.cellWidth || 80;
    const cellHeight = options.cellHeight || 80;
    const minCellDim = Math.min(cellWidth, cellHeight);
    const isKill = options.isKill === true;

    const limits = {
      high: { craterPieces: 5, mainCracks: 5, branchCracks: 10, debris: 14, dust: 18 },
      medium: { craterPieces: 4, mainCracks: 4, branchCracks: 7, debris: 10, dust: 14 },
      low: { craterPieces: 3, mainCracks: 3, branchCracks: 3, debris: 5, dust: 7 },
      reduced: { craterPieces: 1, mainCracks: 2, branchCracks: 0, debris: 1, dust: 2 }
    }[quality] || { craterPieces: 4, mainCracks: 4, branchCracks: 7, debris: 10, dust: 14 };

    const baseRadius = minCellDim * (quality === "reduced" ? 0.2 : 0.32) * (isKill ? 1.1 : 1.0);
    const pointCount = 10;
    const craterPolygon = [];
    for (let i = 0; i < pointCount; i++) {
      const angle = (i / pointCount) * Math.PI * 2;
      const r = baseRadius * (0.75 + random() * 0.45);
      craterPolygon.push({
        x: impactX + Math.cos(angle) * r,
        y: impactY + Math.sin(angle) * r,
        angle,
        r
      });
    }

    const craterPieces = [];
    const pieceCount = limits.craterPieces;
    for (let i = 0; i < pieceCount; i++) {
      const startIdx = Math.floor((i / pieceCount) * pointCount);
      const endIdx = Math.floor(((i + 1) / pieceCount) * pointCount);
      const pts = [{ x: impactX, y: impactY }];
      for (let j = startIdx; j <= endIdx; j++) {
        pts.push(craterPolygon[j % pointCount]);
      }

      const relPts = pts.map(p => ({
        x: p.x - (impactX - baseRadius * 1.5),
        y: p.y - (impactY - baseRadius * 1.5)
      }));
      const boxSize = baseRadius * 3;
      const clipPathStr = "polygon(" + relPts.map(p => `${((p.x / boxSize) * 100).toFixed(1)}% ${((p.y / boxSize) * 100).toFixed(1)}%`).join(", ") + ")";

      craterPieces.push({
        id: i,
        clipPath: clipPathStr,
        depth: 3 + Math.floor(random() * 7),
        tiltX: -8 + random() * 18,
        tiltY: -10 + random() * 20,
        rotZ: -5 + random() * 10,
        delay: Math.floor(random() * 35),
        isFront: i < 2
      });
    }

    const mainFractures = [];
    const mainCount = limits.mainCracks;
    const baseAngle = options.attackAngle || (Math.PI / 4);

    for (let i = 0; i < mainCount; i++) {
      const angleOffset = (i === 0) ? (random() * 0.2 - 0.1) : ((i / mainCount) * Math.PI * 2 + (random() * 0.4 - 0.2));
      const crackAngle = baseAngle + angleOffset;
      const length = minCellDim * (0.55 + random() * 0.4) * (isKill ? 1.25 : 1.0);
      const segmentCount = 5 + Math.floor(random() * 3);
      const points = [{ x: impactX, y: impactY }];

      let currX = impactX;
      let currY = impactY;
      let currAngle = crackAngle;

      for (let s = 1; s <= segmentCount; s++) {
        const segLen = (length / segmentCount) * (0.8 + random() * 0.4);
        currAngle += (random() * 0.6 - 0.3);
        currX += Math.cos(currAngle) * segLen;
        currY += Math.sin(currAngle) * segLen;
        points.push({ x: currX, y: currY });
      }

      mainFractures.push({
        id: i,
        startDelay: (i === 0) ? 20 : (35 + i * 20),
        points,
        branches: []
      });
    }

    const branchFractures = [];
    if (limits.branchCracks > 0) {
      mainFractures.forEach((mainCrk) => {
        if (mainCrk.points.length < 3) return;
        const branchCount = 1 + Math.floor(random() * 2);
        for (let b = 0; b < branchCount; b++) {
          if (branchFractures.length >= limits.branchCracks) break;
          const srcIdx = 2 + Math.floor(random() * (mainCrk.points.length - 2));
          const srcPt = mainCrk.points[srcIdx];
          const parentAngle = Math.atan2(srcPt.y - mainCrk.points[srcIdx - 1].y, srcPt.x - mainCrk.points[srcIdx - 1].x);
          const side = (random() > 0.5) ? 1 : -1;
          const branchAngle = parentAngle + side * (0.5 + random() * 0.5);
          const bLength = minCellDim * (0.2 + random() * 0.25);
          const bSegs = 3;
          const bPoints = [{ x: srcPt.x, y: srcPt.y }];

          let bx = srcPt.x;
          let by = srcPt.y;
          let ba = branchAngle;
          for (let s = 1; s <= bSegs; s++) {
            const segLen = bLength / bSegs;
            ba += (random() * 0.4 - 0.2);
            bx += Math.cos(ba) * segLen;
            by += Math.sin(ba) * segLen;
            bPoints.push({ x: bx, y: by });
          }

          branchFractures.push({
            mainId: mainCrk.id,
            startDelay: mainCrk.startDelay + 45 + b * 25,
            points: bPoints
          });
        }
      });
    }

    const debris = [];
    for (let i = 0; i < limits.debris; i++) {
      const angle = random() * Math.PI * 2;
      const speed = 80 + random() * 180;
      debris.push({
        id: i,
        x: impactX,
        y: impactY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (100 + random() * 120),
        vz: 120 + random() * 180,
        gravity: 420 + random() * 220,
        rotation: random() * 360,
        rotSpeed: -360 + random() * 720,
        size: 5 + random() * 9,
        scale: 0.6 + random() * 0.8,
        depth: 0.5 + random() * 1.0,
        vertices: [
          { x: -0.5, y: -0.5 },
          { x: 0.4 + random() * 0.2, y: -0.6 },
          { x: 0.6, y: 0.4 },
          { x: -0.3, y: 0.5 }
        ]
      });
    }

    const dust = [];
    for (let i = 0; i < limits.dust; i++) {
      const angle = random() * Math.PI * 2;
      const dist = baseRadius * (0.2 + random() * 1.1);
      dust.push({
        id: i,
        targetX: impactX + Math.cos(angle) * dist,
        targetY: impactY + Math.sin(angle) * dist,
        size: 14 + random() * 26,
        maxOpacity: 0.2 + random() * 0.45,
        expandRate: 1.2 + random() * 1.5
      });
    }

    return {
      seed,
      quality,
      impactX,
      impactY,
      baseRadius,
      craterPolygon,
      craterPieces,
      mainFractures,
      branchFractures,
      debris,
      dust
    };
  }

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

    session.audioNodes.forEach((node) => {
      try { node.stop(); } catch (e) {}
      try { node.disconnect(); } catch (e) {}
    });

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

  // TOP ROUTER: playUltimateImpact
  function playUltimateImpact(options = {}) {
    const style = options.style || "greatsword";
    switch (style) {
      case "pierce":
        return playPierceImpact(options);
      case "claw":
        return playClawImpact(options);
      case "magic":
        return playMagicImpact(options);
      default:
        return playGreatswordImpact(options);
    }
  }

  // 1. GREATSWORD IMPACK RENDERER
  function playGreatswordImpact(options = {}) {
    return new Promise((resolve) => {
      if (activeSession) finishSession("superseded");

      const {
        boardElement, targetCell, attackerOwner = "player", damage = 3, isKill = false,
        onImpact = () => {}, reducedMotion = prefersReducedMotion(), attackerId, targetId, battleToken, debugSeed, quality: explicitQuality
      } = options;

      if (!boardElement || !boardElement.parentNode) {
        onImpact();
        resolve({ reason: "missing_board", impactTriggered: true });
        return;
      }
      const targetCellEl = boardElement.querySelector(`[data-row="${targetCell.row}"][data-col="${targetCell.col}"]`);
      if (!targetCellEl) {
        onImpact();
        resolve({ reason: "missing_target_cell", impactTriggered: true });
        return;
      }

      activeSession = {
        style: "greatsword", resolve, boardElement, animationFrameId: null, safetyTimeoutId: null,
        timerIds: [], audioNodes: [], overlay: null, clone: null, isHitStop: false, impactTriggered: false, completed: false
      };

      if (typeof state !== "undefined") state.isRolling = true;

      const quality = reducedMotion ? "reduced" : normalizeQuality(explicitQuality || chooseVfxQuality());
      const theme = getLegionTheme(options);

      const wrapRect = boardElement.parentNode.getBoundingClientRect();
      const cellRect = targetCellEl.getBoundingClientRect();
      const impactX = cellRect.left - wrapRect.left + cellRect.width / 2;
      const impactY = cellRect.top - wrapRect.top + cellRect.height / 2;

      const fractureModel = buildFractureModel({
        quality, debugSeed, attackerId, targetId, battleToken, timestamp: Date.now(),
        impactX, impactY, cellWidth: cellRect.width, cellHeight: cellRect.height, isKill,
        attackAngle: attackerOwner === "player" ? (Math.PI / 4) : (-Math.PI / 4)
      });
      activeSession.fractureModel = fractureModel;

      const overlay = document.createElement("div");
      overlay.className = `ultimate-vfx-overlay ${reducedMotion ? "is-reduced-motion" : ""} quality-${quality} style-greatsword`;
      overlay.style.setProperty("--impact-color", theme.impactColor);
      overlay.style.setProperty("--fracture-inner", theme.innerColor);
      overlay.style.setProperty("--fracture-edge", theme.edgeColor);
      overlay.style.setProperty("--dust-color", theme.dustColor);
      const direction = prepareOverlay(overlay, attackerOwner, impactX, impactY);
      activeSession.overlay = overlay;

      const clone = boardElement.cloneNode(true);
      clone.removeAttribute("id");
      clone.className = (clone.className || "") + " ultimate-vfx-board-clone";
      clone.style.transformOrigin = `${impactX}px ${impactY}px`;
      overlay.appendChild(clone);
      activeSession.clone = clone;

      const craterBoxSize = fractureModel.baseRadius * 3;
      const craterLayer = document.createElement("div");
      craterLayer.className = "ultimate-vfx-crater-layer";
      craterLayer.style.left = `${impactX - craterBoxSize / 2}px`;
      craterLayer.style.top = `${impactY - craterBoxSize / 2}px`;
      craterLayer.style.width = `${craterBoxSize}px`;
      craterLayer.style.height = `${craterBoxSize}px`;

      const craterShadow = document.createElement("div");
      craterShadow.className = "ultimate-vfx-crater-shadow";
      craterLayer.appendChild(craterShadow);

      const pieceDOMs = [];
      fractureModel.craterPieces.forEach((piece) => {
        const pEl = document.createElement("div");
        pEl.className = `ultimate-vfx-crater-piece ${piece.isFront ? "is-front-piece" : "is-back-piece"}`;
        pEl.style.clipPath = piece.clipPath;
        pEl.style.webkitClipPath = piece.clipPath;
        pEl.style.setProperty("--piece-depth", `${piece.depth}px`);
        pEl.style.setProperty("--piece-tilt-x", `${piece.tiltX}deg`);
        pEl.style.setProperty("--piece-tilt-y", `${piece.tiltY}deg`);
        pEl.style.setProperty("--piece-rot-z", `${piece.rotZ}deg`);
        craterLayer.appendChild(pEl);
        pieceDOMs.push(pEl);
      });
      overlay.appendChild(craterLayer);

      const fractureCanvas = document.createElement("canvas");
      fractureCanvas.className = "ultimate-vfx-fracture-canvas";
      fractureCanvas.width = wrapRect.width;
      fractureCanvas.height = wrapRect.height;
      overlay.appendChild(fractureCanvas);
      const fCtx = fractureCanvas.getContext("2d");

      const dustCanvas = document.createElement("canvas");
      dustCanvas.className = "ultimate-vfx-dust-canvas";
      dustCanvas.width = wrapRect.width;
      dustCanvas.height = wrapRect.height;
      overlay.appendChild(dustCanvas);
      const dCtx = dustCanvas.getContext("2d");

      const debrisLayer = document.createElement("div");
      debrisLayer.className = "ultimate-vfx-debris-layer";
      overlay.appendChild(debrisLayer);

      const debrisDOMs = [];
      fractureModel.debris.forEach((deb) => {
        const dEl = document.createElement("div");
        dEl.className = "ultimate-vfx-debris-piece";
        dEl.style.width = `${deb.size}px`;
        dEl.style.height = `${deb.size}px`;
        const clipPts = deb.vertices.map(v => `${((v.x + 0.5) * 100).toFixed(0)}% ${((v.y + 0.5) * 100).toFixed(0)}%`).join(", ");
        dEl.style.clipPath = `polygon(${clipPts})`;
        dEl.style.webkitClipPath = `polygon(${clipPts})`;
        const sEl = document.createElement("div");
        sEl.className = "ultimate-vfx-debris-shadow";
        debrisLayer.appendChild(sEl);
        debrisLayer.appendChild(dEl);
        debrisDOMs.push({ el: dEl, shadowEl: sEl, data: deb });
      });

      const flash = document.createElement("div");
      flash.className = "ultimate-vfx-flash";
      overlay.appendChild(flash);

      const reticle = document.createElement("div");
      reticle.className = "ultimate-vfx-reticle";
      reticle.style.left = `${impactX}px`;
      reticle.style.top = `${impactY}px`;
      overlay.appendChild(reticle);

      const sword = document.createElement("div");
      sword.className = "ultimate-vfx-greatsword";
      sword.style.left = `${impactX}px`;
      sword.style.top = `${impactY}px`;

      const shadow = document.createElement("div");
      shadow.className = "ultimate-vfx-greatsword-shadow";
      sword.appendChild(shadow);

      const swordVisual = document.createElement("div");
      swordVisual.className = "ultimate-vfx-greatsword-visual";
      if (swordImage) {
        const imgEl = swordImage.cloneNode(true);
        imgEl.className = "ultimate-vfx-greatsword-img";
        swordVisual.appendChild(imgEl);
      } else {
        const fallbackEl = document.createElement("div");
        fallbackEl.className = "ultimate-vfx-greatsword-fallback";
        swordVisual.appendChild(fallbackEl);
      }
      sword.appendChild(swordVisual);
      overlay.appendChild(sword);

      boardElement.parentNode.appendChild(overlay);
      boardElement.style.opacity = "0";

      const timing = ultimateTiming(reducedMotion, isKill);
      const hitStopDuration = timing.hitStop;
      const totalDuration = timing.total;
      const tImpact = timing.anticipation;

      playFocusRiseSound();
      const whooshTimerId = setTimeout(() => playWhooshSound(), Math.max(0, tImpact - 220));
      activeSession.timerIds.push(whooshTimerId);

      requestAnimationFrame(() => reticle.classList.add("is-active"));

      activeSession.safetyTimeoutId = setTimeout(() => {
        finishSession("safety_timeout");
      }, 3500);

      let lastTime = performance.now();
      let simTime = 0;
      let hasImpacted = false;

      function tick(now) {
        if (!activeSession || activeSession.completed) return;
        const currentNow = (typeof now === "number" && now > 0) ? now : performance.now();
        const dt = Math.max(0, currentNow - lastTime);
        lastTime = currentNow;

        if (!activeSession.isHitStop) simTime += dt;
        if (simTime >= totalDuration) { finishSession("complete"); return; }

        if (simTime < tImpact) {
          const dropProgress = Math.max(0, simTime / tImpact);
          const easedP = Math.pow(dropProgress, 3.5);
          applyBoardWindup(clone, dropProgress, direction, reducedMotion);
          if (reducedMotion) {
            sword.style.opacity = Math.min(1, dropProgress * 3.0);
            sword.style.transform = `translate(${direction * 40 * (1 - easedP)}px, ${-100 * (1 - easedP)}px) scale(${1.0 + 0.3 * (1 - easedP)})`;
          } else {
            sword.style.opacity = Math.min(1, dropProgress * 2.5);
            sword.style.transform = `translate(${direction * 160 * (1 - easedP)}px, ${-320 * (1 - easedP)}px) rotateZ(${-direction * 45 * (1 - easedP)}deg) rotateY(${-direction * 12 * (1 - easedP)}deg) scale(${1.0 + 1.2 * (1 - easedP)})`;
          }
          shadow.style.opacity = easedP * 0.7;
          shadow.style.transform = `translate(-50%, -50%) scale(${easedP})`;
        }

        if (simTime >= tImpact && !hasImpacted) {
          hasImpacted = true;
          if (activeSession) activeSession.impactTriggered = true;
          sword.style.transform = "translate(0, 0) rotateZ(0deg) scale(1)";
          shadow.style.transform = "translate(-50%, -50%) scale(1)";

          activeSession.isHitStop = true;
          overlay.classList.add("ultimate-vfx-is-hit-stop");
          playImpactSound();

          pieceDOMs.forEach((pDOM) => pDOM.classList.add("is-sunk"));
          flash.classList.add("is-active");
          const flashTimerId = setTimeout(() => flash.classList.remove("is-active"), 120);
          activeSession.timerIds.push(flashTimerId);

          const hitStopTimeoutId = setTimeout(() => {
            if (!activeSession || activeSession.completed) return;
            activeSession.isHitStop = false;
            overlay.classList.remove("ultimate-vfx-is-hit-stop");
            try { onImpact(); } catch (e) {}
            releaseBoardImpact(clone, direction, reducedMotion);
            if (!reducedMotion) sword.classList.add("ultimate-vfx-sword-shake");
          }, hitStopDuration);
          activeSession.timerIds.push(hitStopTimeoutId);
        }

        if (simTime >= tImpact) {
          const postImpactTime = simTime - tImpact;
          fCtx.clearRect(0, 0, fractureCanvas.width, fractureCanvas.height);
          fractureModel.mainFractures.forEach((mainCrk) => {
            if (postImpactTime < mainCrk.startDelay) return;
            const progress = Math.min(1.0, (postImpactTime - mainCrk.startDelay) / 180);
            if (progress <= 0) return;
            const drawCount = Math.max(2, Math.floor(progress * mainCrk.points.length));

            fCtx.save();
            fCtx.beginPath();
            fCtx.moveTo(mainCrk.points[0].x, mainCrk.points[0].y + 2);
            for (let k = 1; k < drawCount; k++) fCtx.lineTo(mainCrk.points[k].x, mainCrk.points[k].y + 2);
            fCtx.strokeStyle = "rgba(0, 0, 0, 0.85)";
            fCtx.lineWidth = 6; fCtx.lineCap = "round"; fCtx.stroke(); fCtx.restore();

            fCtx.save();
            fCtx.beginPath();
            fCtx.moveTo(mainCrk.points[0].x, mainCrk.points[0].y);
            for (let k = 1; k < drawCount; k++) fCtx.lineTo(mainCrk.points[k].x, mainCrk.points[k].y);
            fCtx.strokeStyle = theme.impactColor;
            fCtx.lineWidth = 3; fCtx.lineCap = "round"; fCtx.stroke(); fCtx.restore();
          });
        }

        if (simTime > totalDuration - timing.fade) {
          overlay.style.opacity = Math.max(0, (totalDuration - simTime) / timing.fade);
        }

        activeSession.animationFrameId = requestAnimationFrame(tick);
      }
      activeSession.animationFrameId = requestAnimationFrame(tick);
    });
  }

  // 2. PIERCE (SPEAR/ARROW) IMPACK RENDERER
  function playPierceImpact(options = {}) {
    return new Promise((resolve) => {
      if (activeSession) finishSession("superseded");
      const {
        boardElement, targetCell, sourceCell, attackerOwner = "player", isKill = false,
        onImpact = () => {}, reducedMotion = prefersReducedMotion(), debugSeed
      } = options;

      if (!boardElement || !boardElement.parentNode) { onImpact(); resolve({ reason: "missing_board", impactTriggered: true }); return; }
      const targetCellEl = boardElement.querySelector(`[data-row="${targetCell.row}"][data-col="${targetCell.col}"]`);
      if (!targetCellEl) { onImpact(); resolve({ reason: "missing_target_cell", impactTriggered: true }); return; }

      activeSession = {
        style: "pierce", resolve, boardElement, animationFrameId: null, safetyTimeoutId: null,
        timerIds: [], audioNodes: [], overlay: null, clone: null, isHitStop: false, impactTriggered: false, completed: false
      };
      if (typeof state !== "undefined") state.isRolling = true;

      const theme = getLegionTheme(options);
      const wrapRect = boardElement.parentNode.getBoundingClientRect();
      const cellRect = targetCellEl.getBoundingClientRect();
      const impactX = cellRect.left - wrapRect.left + cellRect.width / 2;
      const impactY = cellRect.top - wrapRect.top + cellRect.height / 2;

      let srcX = impactX - 200;
      let srcY = impactY - 200;
      if (sourceCell) {
        const srcEl = boardElement.querySelector(`[data-row="${sourceCell.row}"][data-col="${sourceCell.col}"]`);
        if (srcEl) {
          const r = srcEl.getBoundingClientRect();
          srcX = r.left - wrapRect.left + r.width / 2;
          srcY = r.top - wrapRect.top + r.height / 2;
        }
      }

      const dx = impactX - srcX;
      const dy = impactY - srcY;
      const angleRad = Math.atan2(dy, dx);
      const angleDeg = (angleRad * 180) / Math.PI;
      const spearRotation = angleDeg - 135;

      const overlay = document.createElement("div");
      overlay.className = `ultimate-vfx-overlay style-pierce ${reducedMotion ? "is-reduced-motion" : ""}`;
      overlay.style.setProperty("--impact-color", theme.impactColor);
      const direction = prepareOverlay(overlay, attackerOwner, impactX, impactY);
      activeSession.overlay = overlay;

      const clone = boardElement.cloneNode(true);
      clone.className = (clone.className || "") + " ultimate-vfx-board-clone";
      clone.style.transformOrigin = `${impactX}px ${impactY}px`;
      overlay.appendChild(clone);
      activeSession.clone = clone;

      const spear = document.createElement("div");
      spear.className = "ultimate-vfx-pierce-weapon";
      spear.style.left = `${impactX}px`;
      spear.style.top = `${impactY}px`;
      spear.style.transform = `rotate(${spearRotation}deg)`;

      const spearVisual = document.createElement("div");
      spearVisual.className = "ultimate-vfx-pierce-visual";
      if (spearImage) {
        const img = spearImage.cloneNode(true);
        img.className = "ultimate-vfx-pierce-img";
        spearVisual.appendChild(img);
      } else {
        const fallback = document.createElement("div");
        fallback.className = "ultimate-vfx-pierce-fallback";
        spearVisual.appendChild(fallback);
      }
      spear.appendChild(spearVisual);
      overlay.appendChild(spear);

      boardElement.parentNode.appendChild(overlay);
      boardElement.style.opacity = "0";

      const timing = ultimateTiming(reducedMotion, isKill);
      const totalDuration = timing.total;
      const tImpact = timing.anticipation;

      playFocusRiseSound();
      activeSession.safetyTimeoutId = setTimeout(() => finishSession("safety_timeout"), 3500);

      let lastTime = performance.now();
      let simTime = 0;
      let hasImpacted = false;

      function tick(now) {
        if (!activeSession || activeSession.completed) return;
        const currentNow = (typeof now === "number" && now > 0) ? now : performance.now();
        const dt = Math.max(0, currentNow - lastTime);
        lastTime = currentNow;
        if (!activeSession.isHitStop) simTime += dt;
        if (simTime >= totalDuration) { finishSession("complete"); return; }

        if (simTime < tImpact) {
          const p = Math.max(0, simTime / tImpact);
          const dist = 300 * (1 - Math.pow(p, 3));
          applyBoardWindup(clone, p, direction, reducedMotion);
          spear.style.transform = `translate(${-Math.cos(angleRad) * dist}px, ${-Math.sin(angleRad) * dist}px) rotate(${spearRotation}deg) scale(${1 + (1 - p) * 0.65})`;
        }

        if (simTime >= tImpact && !hasImpacted) {
          hasImpacted = true;
          activeSession.impactTriggered = true;
          spear.style.transform = `translate(0, 0) rotate(${spearRotation}deg) scale(1)`;
          activeSession.isHitStop = true;
          overlay.classList.add("ultimate-vfx-is-hit-stop");
          playImpactSound();
          const hitStopTimer = setTimeout(() => {
            if (!activeSession || activeSession.completed) return;
            activeSession.isHitStop = false;
            overlay.classList.remove("ultimate-vfx-is-hit-stop");
            releaseBoardImpact(clone, direction, reducedMotion);
            try { onImpact(); } catch (e) {}
          }, timing.hitStop);
          activeSession.timerIds.push(hitStopTimer);
        }

        if (simTime > totalDuration - timing.fade) {
          overlay.style.opacity = Math.max(0, (totalDuration - simTime) / timing.fade);
        }
        activeSession.animationFrameId = requestAnimationFrame(tick);
      }
      activeSession.animationFrameId = requestAnimationFrame(tick);
    });
  }

  // 3. CLAW (ILLUSTRATED RAKE) IMPACT RENDERER
  function playClawImpact(options = {}) {
    return new Promise((resolve) => {
      if (activeSession) finishSession("superseded");
      const {
        boardElement, targetCell, attackerOwner = "player", onImpact = () => {}, reducedMotion = prefersReducedMotion(), isKill = false
      } = options;

      if (!boardElement || !boardElement.parentNode) { onImpact(); resolve({ reason: "missing_board", impactTriggered: true }); return; }
      const targetCellEl = boardElement.querySelector(`[data-row="${targetCell.row}"][data-col="${targetCell.col}"]`);
      if (!targetCellEl) { onImpact(); resolve({ reason: "missing_target_cell", impactTriggered: true }); return; }

      activeSession = {
        style: "claw", resolve, boardElement, animationFrameId: null, safetyTimeoutId: null,
        timerIds: [], audioNodes: [], overlay: null, clone: null, isHitStop: false, impactTriggered: false, completed: false
      };
      if (typeof state !== "undefined") state.isRolling = true;

      const theme = getLegionTheme(options);
      const wrapRect = boardElement.parentNode.getBoundingClientRect();
      const cellRect = targetCellEl.getBoundingClientRect();
      const impactX = cellRect.left - wrapRect.left + cellRect.width / 2;
      const impactY = cellRect.top - wrapRect.top + cellRect.height / 2;

      const overlay = document.createElement("div");
      overlay.className = `ultimate-vfx-overlay style-claw ${reducedMotion ? "is-reduced-motion" : ""}`;
      overlay.style.setProperty("--impact-color", theme.impactColor);
      overlay.style.setProperty("--fracture-inner", theme.innerColor);
      const direction = prepareOverlay(overlay, attackerOwner, impactX, impactY);
      activeSession.overlay = overlay;

      const clone = boardElement.cloneNode(true);
      clone.className = (clone.className || "") + " ultimate-vfx-board-clone";
      clone.style.transformOrigin = `${impactX}px ${impactY}px`;
      overlay.appendChild(clone);
      activeSession.clone = clone;

      const clawRig = document.createElement("div");
      clawRig.className = "ultimate-vfx-claw-rig";
      clawRig.style.left = `${impactX}px`;
      clawRig.style.top = `${impactY}px`;

      const clawHand = document.createElement("div");
      clawHand.className = "ultimate-vfx-claw-hand";
      if (clawImage) {
        const clawImg = clawImage.cloneNode(true);
        clawImg.className = "ultimate-vfx-claw-img";
        clawHand.appendChild(clawImg);
      } else {
        const clawFallback = document.createElement("div");
        clawFallback.className = "ultimate-vfx-claw-fallback";
        clawHand.appendChild(clawFallback);
      }
      clawRig.appendChild(clawHand);
      overlay.appendChild(clawRig);

      const gougeBox = document.createElement("div");
      gougeBox.className = "ultimate-vfx-claw-gouges";
      gougeBox.style.left = `${impactX}px`;
      gougeBox.style.top = `${impactY}px`;

      for (let i = 0; i < 3; i++) {
        const mark = document.createElement("div");
        mark.className = `ultimate-vfx-claw-gouge claw-line-${i + 1}`;
        mark.style.setProperty("--gouge-delay", `${i * 42}ms`);
        gougeBox.appendChild(mark);
      }
      overlay.appendChild(gougeBox);

      const flash = document.createElement("div");
      flash.className = "ultimate-vfx-flash ultimate-vfx-claw-flash";
      overlay.appendChild(flash);

      const inkBurst = document.createElement("div");
      inkBurst.className = "ultimate-vfx-claw-ink-burst";
      inkBurst.style.left = `${impactX}px`;
      inkBurst.style.top = `${impactY}px`;
      const particleCount = reducedMotion ? 3 : 11;
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("i");
        const angle = -2.65 + (i / Math.max(1, particleCount - 1)) * 1.9;
        const distance = 34 + (i % 4) * 13;
        particle.style.setProperty("--ink-x", `${Math.cos(angle) * distance}px`);
        particle.style.setProperty("--ink-y", `${Math.sin(angle) * distance}px`);
        particle.style.setProperty("--ink-rot", `${-80 + i * 23}deg`);
        inkBurst.appendChild(particle);
      }
      overlay.appendChild(inkBurst);

      boardElement.parentNode.appendChild(overlay);
      boardElement.style.opacity = "0";

      const timing = ultimateTiming(reducedMotion, isKill);
      const totalDuration = timing.total;
      const tImpact = timing.anticipation;
      const hitStopDuration = timing.hitStop;

      playFocusRiseSound();
      activeSession.safetyTimeoutId = setTimeout(() => finishSession("safety_timeout"), 3500);

      let lastTime = performance.now();
      let simTime = 0;
      let hasImpacted = false;

      function tick(now) {
        if (!activeSession || activeSession.completed) return;
        const currentNow = (typeof now === "number" && now > 0) ? now : performance.now();
        const dt = Math.max(0, currentNow - lastTime);
        lastTime = currentNow;
        if (!activeSession.isHitStop) simTime += dt;
        if (simTime >= totalDuration) { finishSession("complete"); return; }

        if (simTime < tImpact) {
          const windup = Math.min(1, simTime / tImpact);
          const eased = 1 - Math.pow(1 - windup, 3);
          applyBoardWindup(clone, windup, direction, reducedMotion);
          clawHand.style.opacity = Math.min(1, windup * 3);
          clawHand.style.transform = reducedMotion
            ? `translate(${direction * 38 * (1 - eased)}px, ${-42 * (1 - eased)}px) rotate(${direction * (-13 + 8 * eased)}deg) scale(${1.08 - 0.08 * eased})`
            : `translate(${direction * 150 * (1 - eased)}px, ${-175 * (1 - eased)}px) rotate(${direction * (-28 + 19 * eased)}deg) scale(${1.5 - 0.34 * eased})`;
        }

        if (simTime >= tImpact && !hasImpacted) {
          hasImpacted = true;
          activeSession.impactTriggered = true;
          activeSession.isHitStop = true;
          overlay.classList.add("ultimate-vfx-is-hit-stop");
          clawHand.classList.add("is-contact");
          flash.classList.add("is-active");
          playImpactSound();

          const hitStopTimer = setTimeout(() => {
            if (!activeSession || activeSession.completed) return;
            activeSession.isHitStop = false;
            overlay.classList.remove("ultimate-vfx-is-hit-stop");
            gougeBox.classList.add("is-raking");
            inkBurst.classList.add("is-active");
            releaseBoardImpact(clone, direction, reducedMotion);
            try { onImpact(); } catch (e) {}
          }, hitStopDuration);
          activeSession.timerIds.push(hitStopTimer);
        }

        if (simTime >= tImpact) {
          const rakeTime = simTime - tImpact;
          const rakeProgress = Math.min(1, rakeTime / (reducedMotion ? 180 : 310));
          const rakeEase = 1 - Math.pow(1 - rakeProgress, 3);
          clawHand.style.transform = reducedMotion
            ? `translate(${-direction * 38 * rakeEase}px, ${30 * rakeEase}px) rotate(${direction * (-5 - 8 * rakeEase)}deg) scale(${1 - 0.08 * rakeEase})`
            : `translate(${-direction * 125 * rakeEase}px, ${105 * rakeEase}px) rotate(${direction * (-9 - 17 * rakeEase)}deg) scale(${1.16 - 0.19 * rakeEase})`;
          if (rakeTime > 250) {
            clawHand.style.opacity = Math.max(0, 1 - (rakeTime - 250) / 260);
          }
        }

        if (simTime > totalDuration - timing.fade) {
          overlay.style.opacity = Math.max(0, (totalDuration - simTime) / timing.fade);
        }
        activeSession.animationFrameId = requestAnimationFrame(tick);
      }
      activeSession.animationFrameId = requestAnimationFrame(tick);
    });
  }

  // 4. MAGIC (SPELL EXPLOSION) IMPACK RENDERER
  function playMagicImpact(options = {}) {
    return new Promise((resolve) => {
      if (activeSession) finishSession("superseded");
      const {
        boardElement, targetCell, attackerOwner = "player", isKill = false, onImpact = () => {}, reducedMotion = prefersReducedMotion()
      } = options;

      if (!boardElement || !boardElement.parentNode) { onImpact(); resolve({ reason: "missing_board", impactTriggered: true }); return; }
      const targetCellEl = boardElement.querySelector(`[data-row="${targetCell.row}"][data-col="${targetCell.col}"]`);
      if (!targetCellEl) { onImpact(); resolve({ reason: "missing_target_cell", impactTriggered: true }); return; }

      activeSession = {
        style: "magic", resolve, boardElement, animationFrameId: null, safetyTimeoutId: null,
        timerIds: [], audioNodes: [], overlay: null, clone: null, isHitStop: false, impactTriggered: false, completed: false
      };
      if (typeof state !== "undefined") state.isRolling = true;

      const theme = getLegionTheme(options);
      const wrapRect = boardElement.parentNode.getBoundingClientRect();
      const cellRect = targetCellEl.getBoundingClientRect();
      const impactX = cellRect.left - wrapRect.left + cellRect.width / 2;
      const impactY = cellRect.top - wrapRect.top + cellRect.height / 2;

      const overlay = document.createElement("div");
      overlay.className = "ultimate-vfx-overlay style-magic";
      overlay.style.setProperty("--impact-color", theme.impactColor);
      const direction = prepareOverlay(overlay, attackerOwner, impactX, impactY);
      activeSession.overlay = overlay;

      const clone = boardElement.cloneNode(true);
      clone.className = (clone.className || "") + " ultimate-vfx-board-clone";
      clone.style.transformOrigin = `${impactX}px ${impactY}px`;
      overlay.appendChild(clone);
      activeSession.clone = clone;

      const magicBox = document.createElement("div");
      magicBox.className = "ultimate-vfx-magic-container";
      magicBox.style.left = `${impactX}px`;
      magicBox.style.top = `${impactY}px`;

      const circle1 = document.createElement("div");
      circle1.className = "ultimate-vfx-magic-circle outer-ring";
      const circle2 = document.createElement("div");
      circle2.className = "ultimate-vfx-magic-circle inner-ring";
      const core = document.createElement("div");
      core.className = "ultimate-vfx-magic-core";

      if (magicImage) {
        const magicArt = magicImage.cloneNode(true);
        magicArt.className = "ultimate-vfx-magic-art";
        magicBox.appendChild(magicArt);
      } else {
        const magicFallback = document.createElement("div");
        magicFallback.className = "ultimate-vfx-magic-art-fallback";
        magicBox.appendChild(magicFallback);
      }
      magicBox.appendChild(circle1);
      magicBox.appendChild(circle2);
      magicBox.appendChild(core);
      overlay.appendChild(magicBox);

      boardElement.parentNode.appendChild(overlay);
      boardElement.style.opacity = "0";

      const timing = ultimateTiming(reducedMotion, isKill);
      const totalDuration = timing.total;
      const tImpact = timing.anticipation;

      playFocusRiseSound();
      activeSession.safetyTimeoutId = setTimeout(() => finishSession("safety_timeout"), 3500);

      let lastTime = performance.now();
      let simTime = 0;
      let hasImpacted = false;

      function tick(now) {
        if (!activeSession || activeSession.completed) return;
        const currentNow = (typeof now === "number" && now > 0) ? now : performance.now();
        const dt = Math.max(0, currentNow - lastTime);
        lastTime = currentNow;
        if (!activeSession.isHitStop) simTime += dt;
        if (simTime >= totalDuration) { finishSession("complete"); return; }

        if (simTime < tImpact) {
          const charge = Math.min(1, simTime / tImpact);
          const eased = 1 - Math.pow(1 - charge, 3);
          applyBoardWindup(clone, charge, direction, reducedMotion);
          magicBox.style.opacity = Math.min(1, charge * 3);
          magicBox.style.transform = `translate(-50%, -50%) scale(${0.38 + eased * 0.62}) rotate(${direction * (1 - eased) * -12}deg)`;
        }

        if (simTime >= tImpact && !hasImpacted) {
          hasImpacted = true;
          activeSession.impactTriggered = true;
          magicBox.style.transform = "translate(-50%, -50%) scale(1) rotate(0deg)";
          magicBox.classList.add("is-exploded");
          activeSession.isHitStop = true;
          overlay.classList.add("ultimate-vfx-is-hit-stop");
          playImpactSound();
          const hitStopTimer = setTimeout(() => {
            if (!activeSession || activeSession.completed) return;
            activeSession.isHitStop = false;
            overlay.classList.remove("ultimate-vfx-is-hit-stop");
            releaseBoardImpact(clone, direction, reducedMotion);
            try { onImpact(); } catch (e) {}
          }, timing.hitStop);
          activeSession.timerIds.push(hitStopTimer);
        }

        if (simTime > totalDuration - timing.fade) {
          overlay.style.opacity = Math.max(0, (totalDuration - simTime) / timing.fade);
        }
        activeSession.animationFrameId = requestAnimationFrame(tick);
      }
      activeSession.animationFrameId = requestAnimationFrame(tick);
    });
  }

  function cancel() {
    finishSession("cancelled");
  }

  const UltimateVfx = {
    preload,
    canPlay,
    prefersReducedMotion,
    chooseVfxQuality,
    ownerDirection,
    ultimateTiming,
    buildFractureModel,
    getLegionTheme,
    normalizeLegionKey,
    playUltimateImpact,
    playGreatswordImpact,
    playPierceImpact,
    playClawImpact,
    playMagicImpact,
    cancel
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = UltimateVfx;
  } else {
    root.UltimateVfx = UltimateVfx;
  }
})(typeof window !== "undefined" ? window : this);
