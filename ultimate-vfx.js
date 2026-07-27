/* ultimate-vfx.js v23 - Shattered Board Crater VFX */
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

    // Metallic ring
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

  // Preloading image asset
  function preload() {
    if (preloadPromise) return preloadPromise;
    preloadPromise = new Promise((resolve) => {
      if (typeof Image === "undefined") {
        resolve(null);
        return;
      }
      const img = new Image();
      img.src = "./greatsword.png";
      img.onload = () => {
        swordImage = img;
        resolve(img);
      };
      img.onerror = () => {
        swordImage = null;
        resolve(null);
      };
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

  // 4-Tier Automatic Quality Selector
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

  // Seeded Pseudo-Random Generator (Mulberry32)
  function createSeededRandom(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Canonical Game Legion Keys & Priority
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

  // Build deterministic Shattered Board Crater Model
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

    // Quality tier counts
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

    // Split crater polygon into wedge pieces
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

    // Generate main fracture polylines
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

    // Generate branch fractures
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

    // Generate debris particles
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

    // Generate dust cloud particles
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

  // Main animation play
  function playGreatswordImpact(options = {}) {
    return new Promise((resolve) => {
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
        reducedMotion = prefersReducedMotion(),
        attackerId,
        targetId,
        battleToken,
        debugSeed,
        quality: explicitQuality
      } = options;

      if (!boardElement || !boardElement.parentNode) {
        onImpact();
        resolve({ reason: "missing_board", impactTriggered: true });
        return;
      }

      const targetCellEl = boardElement.querySelector(
        `[data-row="${targetCell.row}"][data-col="${targetCell.col}"]`
      );

      if (!targetCellEl) {
        onImpact();
        resolve({ reason: "missing_target_cell", impactTriggered: true });
        return;
      }

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
        state.isRolling = true;
      }

      const quality = reducedMotion ? "reduced" : normalizeQuality(explicitQuality || chooseVfxQuality());
      const theme = getLegionTheme(options);

      const wrapRect = boardElement.parentNode.getBoundingClientRect();
      const cellRect = targetCellEl.getBoundingClientRect();
      const impactX = cellRect.left - wrapRect.left + cellRect.width / 2;
      const impactY = cellRect.top - wrapRect.top + cellRect.height / 2;

      const fractureModel = buildFractureModel({
        quality,
        debugSeed,
        attackerId,
        targetId,
        battleToken,
        timestamp: Date.now(),
        impactX,
        impactY,
        cellWidth: cellRect.width,
        cellHeight: cellRect.height,
        isKill,
        attackAngle: attackerOwner === "player" ? (Math.PI / 4) : (-Math.PI / 4)
      });
      activeSession.fractureModel = fractureModel;

      const overlay = document.createElement("div");
      overlay.className = `ultimate-vfx-overlay ${reducedMotion ? "is-reduced-motion" : ""} quality-${quality}`;
      overlay.style.setProperty("--impact-color", theme.impactColor);
      overlay.style.setProperty("--fracture-inner", theme.innerColor);
      overlay.style.setProperty("--fracture-edge", theme.edgeColor);
      overlay.style.setProperty("--dust-color", theme.dustColor);
      activeSession.overlay = overlay;

      const clone = boardElement.cloneNode(true);
      clone.removeAttribute("id");
      clone.className = (clone.className || "") + " ultimate-vfx-board-clone";
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

      if (swordImage) {
        const imgEl = swordImage.cloneNode(true);
        imgEl.className = "ultimate-vfx-greatsword-img";
        sword.appendChild(imgEl);
      } else {
        const fallbackEl = document.createElement("div");
        fallbackEl.className = "ultimate-vfx-greatsword-fallback";
        sword.appendChild(fallbackEl);
      }
      overlay.appendChild(sword);

      boardElement.parentNode.appendChild(overlay);
      boardElement.style.opacity = "0";

      const hitStopDuration = isKill ? 80 : 60;
      const totalDuration = isKill ? 1350 : 1200;
      const tImpact = reducedMotion ? 150 : 430;

      playFocusRiseSound();
      const whooshTimerId = setTimeout(() => {
        playWhooshSound();
      }, Math.max(0, tImpact - 220));
      activeSession.timerIds.push(whooshTimerId);

      requestAnimationFrame(() => {
        reticle.classList.add("is-active");
      });

      activeSession.safetyTimeoutId = setTimeout(() => {
        console.warn("Ultimate VFX safety timeout triggered.");
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

        if (!activeSession.isHitStop) {
          simTime += dt;
        }

        if (simTime >= totalDuration) {
          finishSession("complete");
          return;
        }

        if (simTime < tImpact) {
          const dropProgress = Math.max(0, simTime / tImpact);
          const easedP = Math.pow(dropProgress, 3.5);

          if (reducedMotion) {
            const tx = 40 * (1 - easedP);
            const ty = -100 * (1 - easedP);
            sword.style.opacity = Math.min(1, dropProgress * 3.0);
            sword.style.transform = `translate(${tx}px, ${ty}px) scale(${1.0 + 0.3 * (1 - easedP)})`;
          } else {
            const tx = 160 * (1 - easedP);
            const ty = -320 * (1 - easedP);
            const scale = 1.0 + 1.2 * (1 - easedP);
            const rotZ = -45 * (1 - easedP);
            const rotY = -12 * (1 - easedP);
            sword.style.opacity = Math.min(1, dropProgress * 2.5);
            sword.style.transform = `translate(${tx}px, ${ty}px) rotateZ(${rotZ}deg) rotateY(${rotY}deg) scale(${scale})`;
          }

          shadow.style.opacity = easedP * 0.7;
          shadow.style.transform = `translate(-50%, -50%) scale(${easedP})`;
        }

        if (simTime >= tImpact && !hasImpacted) {
          hasImpacted = true;
          if (activeSession) {
            activeSession.impactTriggered = true;
          }
          sword.style.transform = "translate(0, 0) rotateZ(0deg) scale(1)";
          shadow.style.transform = "translate(-50%, -50%) scale(1)";

          activeSession.isHitStop = true;
          overlay.classList.add("ultimate-vfx-is-hit-stop");
          playImpactSound();

          pieceDOMs.forEach((pDOM) => {
            pDOM.classList.add("is-sunk");
          });

          flash.classList.add("is-active");
          const flashTimerId = setTimeout(() => {
            flash.classList.remove("is-active");
          }, 120);
          activeSession.timerIds.push(flashTimerId);

          const hitStopTimeoutId = setTimeout(() => {
            if (!activeSession || activeSession.completed) return;
            activeSession.isHitStop = false;
            overlay.classList.remove("ultimate-vfx-is-hit-stop");

            try {
              onImpact();
            } catch (e) {
              console.error("VFX onImpact callback error:", e);
            }

            if (!reducedMotion) {
              sword.classList.add("ultimate-vfx-sword-shake");
            }
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

            const totalPoints = mainCrk.points.length;
            const drawCount = Math.max(2, Math.floor(progress * totalPoints));

            fCtx.save();
            fCtx.beginPath();
            fCtx.moveTo(mainCrk.points[0].x, mainCrk.points[0].y + 2);
            for (let k = 1; k < drawCount; k++) {
              fCtx.lineTo(mainCrk.points[k].x, mainCrk.points[k].y + 2);
            }
            fCtx.strokeStyle = "rgba(0, 0, 0, 0.85)";
            fCtx.lineWidth = 6;
            fCtx.lineCap = "round";
            fCtx.lineJoin = "round";
            fCtx.stroke();
            fCtx.restore();

            fCtx.save();
            fCtx.beginPath();
            fCtx.moveTo(mainCrk.points[0].x, mainCrk.points[0].y);
            for (let k = 1; k < drawCount; k++) {
              fCtx.lineTo(mainCrk.points[k].x, mainCrk.points[k].y);
            }
            fCtx.strokeStyle = theme.impactColor;
            fCtx.lineWidth = 3;
            fCtx.lineCap = "round";
            fCtx.lineJoin = "round";
            fCtx.stroke();
            fCtx.restore();

            fCtx.save();
            fCtx.beginPath();
            fCtx.moveTo(mainCrk.points[0].x + 1, mainCrk.points[0].y - 1);
            for (let k = 1; k < drawCount; k++) {
              fCtx.lineTo(mainCrk.points[k].x + 1, mainCrk.points[k].y - 1);
            }
            fCtx.strokeStyle = theme.edgeColor;
            fCtx.lineWidth = 1;
            fCtx.lineCap = "round";
            fCtx.lineJoin = "round";
            fCtx.stroke();
            fCtx.restore();
          });

          fractureModel.branchFractures.forEach((bCrk) => {
            if (postImpactTime < bCrk.startDelay) return;
            const progress = Math.min(1.0, (postImpactTime - bCrk.startDelay) / 120);
            if (progress <= 0) return;

            const drawCount = Math.max(2, Math.floor(progress * bCrk.points.length));

            fCtx.save();
            fCtx.beginPath();
            fCtx.moveTo(bCrk.points[0].x, bCrk.points[0].y);
            for (let k = 1; k < drawCount; k++) {
              fCtx.lineTo(bCrk.points[k].x, bCrk.points[k].y);
            }
            fCtx.strokeStyle = theme.edgeColor;
            fCtx.lineWidth = 1.5;
            fCtx.lineCap = "round";
            fCtx.stroke();
            fCtx.restore();
          });
        }

        if (simTime >= tImpact + hitStopDuration && !reducedMotion) {
          const dtSec = dt / 1000;
          debrisDOMs.forEach((item) => {
            const deb = item.data;
            deb.x += deb.vx * dtSec;
            deb.y += deb.vy * dtSec;
            deb.vz -= deb.gravity * dtSec;
            deb.rotation += deb.rotSpeed * dtSec;

            const curZ = Math.max(0, deb.vz);
            const scale = deb.scale * (1 + curZ / 300) * deb.depth;

            item.el.style.transform = `translate(${deb.x - impactX}px, ${deb.y - impactY - curZ}px) rotate(${deb.rotation}deg) scale(${scale})`;
            item.shadowEl.style.transform = `translate(${deb.x - impactX}px, ${deb.y - impactY}px) scale(${deb.scale * 0.8})`;
            item.shadowEl.style.opacity = Math.max(0, 0.6 - curZ / 250);
          });
        }

        if (simTime >= tImpact + hitStopDuration) {
          const dustTime = (simTime - (tImpact + hitStopDuration)) / 1000;
          dCtx.clearRect(0, 0, dustCanvas.width, dustCanvas.height);

          fractureModel.dust.forEach((d) => {
            const progress = Math.min(1.0, dustTime * d.expandRate);
            const r = d.size * (0.3 + progress * 0.7);
            const alpha = d.maxOpacity * (1 - progress);
            if (alpha <= 0) return;

            const currX = impactX + (d.targetX - impactX) * progress;
            const currY = impactY + (d.targetY - impactY) * progress;

            dCtx.save();
            dCtx.beginPath();
            dCtx.arc(currX, currY, r, 0, Math.PI * 2);
            dCtx.fillStyle = theme.dustColor;
            dCtx.globalAlpha = alpha;
            dCtx.fill();
            dCtx.restore();
          });
        }

        if (simTime > totalDuration - 300) {
          const fadeP = (totalDuration - simTime) / 300;
          overlay.style.opacity = Math.max(0, fadeP);
        }

        activeSession.animationFrameId = requestAnimationFrame(tick);
      }

      activeSession.animationFrameId = requestAnimationFrame(tick);
    });
  }

  function cancel() {
    finishSession("cancelled");
  }

  // Export module API
  const UltimateVfx = {
    preload,
    canPlay,
    prefersReducedMotion,
    chooseVfxQuality,
    buildFractureModel,
    getLegionTheme,
    normalizeLegionKey,
    playGreatswordImpact,
    cancel
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = UltimateVfx;
  } else {
    root.UltimateVfx = UltimateVfx;
  }
})(typeof window !== "undefined" ? window : this);
