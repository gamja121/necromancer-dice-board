(function (root) {
  "use strict";

  const SHEET_ROOT = "art/v2-style/animation-sheets/uploaded-raw/";
  const DEFAULT_COUNTS = Object.freeze({ attack: 5, hit: 4, death: 6 });

  function definition(file, counts = {}, backdrop = "dark") {
    const frameCount = { ...DEFAULT_COUNTS, ...counts };
    return {
      sheet: SHEET_ROOT + file + "-animation-sheet.jpg",
      counts: frameCount,
      backdrop,
      frameMs: { attack: 105, hit: 88, death: 118 },
      impactFrame: Math.max(1, Math.min(frameCount.attack - 2, 3))
    };
  }

  const DEFINITIONS = Object.freeze({
    spear: definition("skeleton-spear"), archer: definition("skeleton-archer"),
    knight: definition("skeleton-cavalry"), worm: definition("grave-worm"),
    golem: definition("obese-zombie", { hit: 5 }), ghoul: definition("ghoul", {}, "white"),
    ogre: definition("boulder-ogre"), plague: definition("plague-doctor"),
    plagueFrog: definition("poison-toad"), hydra: definition("hydra"),
    minotaur: definition("minotaur", {}, "white"), yeti: definition("yeti", {}, "white"),
    iceLord: definition("ice-lord", {}, "white"), seaWolf: definition("sea-wolf"),
    spiderQueen: definition("spider-queen"), spiderling: definition("giant-spider", { hit: 5 }),
    goblinChief: definition("goblin-shaman"), goblinCommoner: definition("goblin-commoner", {}, "white"),
    goblinSoldier: definition("goblin-soldier"), skeletonSummoner: definition("hooded-necromancer"),
    doomExecutor: definition("gargoyle"), abyssEye: definition("cyclops-monster"),
    demonDeathKnight: definition("death-knight"), hellMantis: definition("mantis-monster"),
    scorpionKnight: definition("scorpion-warrior", { hit: 3 }), ancientTreant: definition("treant"),
    stoneGolem: definition("stone-golem"), kraken: definition("octopus-monster"),
    crystalDevourer: definition("carnivorous-flower", { hit: 5 }),
    guardianSeed: definition("guardian-seed", { hit: 3, death: 4 }),
    ragingTreant: definition("raging-treant"), cerberus: definition("cerberus"),
    poisonMushroom: definition("mushroom-monster"), goblinRider: definition("goblin-rider", { death: 5 }),
    abyssHarpy: definition("harpy", { attack: 4, death: 5 }), troll: definition("orc-warrior"),
    boneGolem: definition("blood-skeleton", { hit: 5 }), forestFairy: definition("forest-fairy"),
    mummyGuardian: definition("mummy"), soulReaper: definition("reaper"),
    boneHound: definition("undead-hound"), mimic: definition("mimic"),
    icePrincess: definition("ice-princess", { attack: 6 }), siren: definition("siren")
  });

  const prepared = new Map();
  let playSequence = 0;

  function wait(ms) { return new Promise((resolve) => root.setTimeout(() => resolve(true), ms)); }
  function supports(type) { return Object.prototype.hasOwnProperty.call(DEFINITIONS, type); }
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new root.Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Motion sheet failed to load: " + src));
      image.src = src;
    });
  }

  function lineCandidates(pixels, width, y0, y1) {
    const candidates = [];
    const sampleCount = Math.max(1, Math.ceil((y1 - y0) / 3));
    for (let x = 0; x < width; x += 1) {
      let matches = 0;
      for (let y = y0; y < y1; y += 3) {
        const index = (y * width + x) * 4;
        const red = pixels[index]; const green = pixels[index + 1]; const blue = pixels[index + 2];
        const high = Math.max(red, green, blue); const low = Math.min(red, green, blue);
        if (high >= 42 && high <= 230 && high - low <= 28) matches += 1;
      }
      const score = matches / sampleCount;
      if (score >= .46) candidates.push({ x, score });
    }
    const groups = [];
    for (const candidate of candidates) {
      const last = groups[groups.length - 1];
      if (!last || candidate.x - last.end > 2) groups.push({ start: candidate.x, end: candidate.x, best: candidate });
      else {
        last.end = candidate.x;
        if (candidate.score > last.best.score) last.best = candidate;
      }
    }
    return groups.map((group) => ({ x: Math.round((group.start + group.end) / 2), score: group.best.score }));
  }

  function chooseBoundaries(candidates, count, width, rowIndex) {
    const usable = candidates.filter((item) => item.x >= width * .045 && item.x <= width * .998);
    let best = null;
    for (const start of usable.filter((item) => item.x <= width * .18)) {
      for (const end of usable.filter((item) => item.x >= start.x + width * .42)) {
        const step = (end.x - start.x) / count;
        if (step < width * .105 || step > width * .255) continue;
        const chosen = [start];
        let error = Math.abs(start.x - width * .08) / width;
        let valid = true;
        for (let index = 1; index < count; index += 1) {
          const target = start.x + step * index;
          const nearest = usable.reduce((current, item) => (
            Math.abs(item.x - target) < Math.abs(current.x - target) ? item : current
          ), usable[0]);
          const distance = Math.abs(nearest.x - target);
          if (distance > width * .045 || chosen.includes(nearest)) { valid = false; break; }
          chosen.push(nearest); error += distance / step;
        }
        if (!valid) continue;
        chosen.push(end);
        const scoreBonus = chosen.reduce((sum, item) => sum + item.score, 0) * .025;
        const rightPreference = rowIndex === 1 ? 0 : Math.abs(end.x - width * .992) / width * .3;
        const result = { points: chosen.map((item) => item.x), error: error + rightPreference - scoreBonus };
        if (!best || result.error < best.error) best = result;
      }
    }
    if (best) return best.points;
    const start = Math.round(width * .08);
    const end = Math.round(width * (rowIndex === 1 ? Math.min(.98, .08 + count * .18) : .99));
    return Array.from({ length: count + 1 }, (_, index) => Math.round(start + (end - start) * index / count));
  }

  function frameRectangles(sheet, definitionValue) {
    const scan = root.document.createElement("canvas");
    scan.width = sheet.naturalWidth || sheet.width; scan.height = sheet.naturalHeight || sheet.height;
    const context = scan.getContext("2d", { willReadFrequently: true });
    context.drawImage(sheet, 0, 0);
    const pixels = context.getImageData(0, 0, scan.width, scan.height).data;
    const motions = ["attack", "hit", "death"]; const result = {};
    motions.forEach((motion, rowIndex) => {
      const y0 = Math.round(scan.height * rowIndex / 3); const y1 = Math.round(scan.height * (rowIndex + 1) / 3);
      const candidates = lineCandidates(pixels, scan.width, y0 + 3, y1 - 3);
      const boundaries = chooseBoundaries(candidates, definitionValue.counts[motion], scan.width, rowIndex);
      result[motion] = boundaries.slice(0, -1).map((left, index) => [
        left + 2, y0 + 2, Math.max(8, boundaries[index + 1] - left - 4), Math.max(8, y1 - y0 - 4)
      ]);
    });
    return result;
  }

  function removeConnectedWhiteBackdrop(pixels, width, height) {
    const data = pixels.data;
    const visited = new Uint8Array(width * height);
    const queue = new Int32Array(width * height);
    let head = 0; let tail = 0;
    const enqueue = (x, y) => {
      const pixel = y * width + x;
      if (visited[pixel]) return;
      const index = pixel * 4;
      const red = data[index]; const green = data[index + 1]; const blue = data[index + 2];
      if (Math.min(red, green, blue) < 232 || Math.max(red, green, blue) - Math.min(red, green, blue) > 20) return;
      visited[pixel] = 1; queue[tail++] = pixel;
    };
    for (let x = 0; x < width; x += 1) { enqueue(x, 0); enqueue(x, height - 1); }
    for (let y = 1; y < height - 1; y += 1) { enqueue(0, y); enqueue(width - 1, y); }
    while (head < tail) {
      const pixel = queue[head++]; const x = pixel % width; const y = Math.floor(pixel / width);
      if (x > 0) enqueue(x - 1, y); if (x + 1 < width) enqueue(x + 1, y);
      if (y > 0) enqueue(x, y - 1); if (y + 1 < height) enqueue(x, y + 1);
    }
    for (let pixel = 0; pixel < visited.length; pixel += 1) {
      if (visited[pixel]) data[pixel * 4 + 3] = 0;
    }
  }

  function cropFrame(sheet, rect, backdrop) {
    const [sx, sy, sw, sh] = rect;
    const output = root.document.createElement("canvas"); output.width = sw; output.height = sh;
    const context = output.getContext("2d", { willReadFrequently: backdrop === "white" });
    context.drawImage(sheet, sx, sy, sw, sh, 0, 0, sw, sh);
    if (backdrop === "white") {
      const pixels = context.getImageData(0, 0, sw, sh);
      removeConnectedWhiteBackdrop(pixels, sw, sh);
      context.putImageData(pixels, 0, 0);
    }
    return output.toDataURL("image/png");
  }

  function prepare(type) {
    if (!supports(type)) return Promise.resolve(null);
    if (prepared.has(type)) return prepared.get(type);
    const definitionValue = DEFINITIONS[type];
    const promise = loadImage(definitionValue.sheet).then((sheet) => {
      const rectangles = frameRectangles(sheet, definitionValue);
      const frames = {
        attack: rectangles.attack.map((rect) => cropFrame(sheet, rect, definitionValue.backdrop)),
        hit: rectangles.hit.map((rect) => cropFrame(sheet, rect, definitionValue.backdrop)),
        death: rectangles.death.map((rect) => cropFrame(sheet, rect, definitionValue.backdrop))
      };
      frames.idle = frames.attack[frames.attack.length - 1]; return frames;
    }).catch((error) => { prepared.delete(type); throw error; });
    prepared.set(type, promise); return promise;
  }

  async function applyIdle(type, sprite, options = {}) {
    if (!supports(type) || !sprite) return false;
    const frames = await prepare(type); const guard = options.guard || (() => true);
    if (!frames || !guard() || sprite.dataset.motionPlayId) return false;
    sprite.classList.add("is-motion-sprite"); sprite.src = frames.idle; return true;
  }

  async function play(type, sprite, motion, options = {}) {
    if (!supports(type) || !sprite || !["attack", "hit", "death"].includes(motion)) return false;
    const frames = await prepare(type); const definitionValue = DEFINITIONS[type];
    const guard = options.guard || (() => true); const waitFor = options.wait || wait;
    if (!frames || !guard()) return false;
    const playId = String(++playSequence); sprite.dataset.motionPlayId = playId; sprite.classList.add("is-motion-sprite");
    const sequence = frames[motion]; const reducedMotion = root.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const indices = reducedMotion ? [Math.min(definitionValue.impactFrame, sequence.length - 1), sequence.length - 1]
      : sequence.map((_, index) => index);
    for (const index of [...new Set(indices)]) {
      if (!guard() || sprite.dataset.motionPlayId !== playId) return false;
      sprite.src = sequence[index]; options.onFrame?.(index, sequence.length);
      const continued = await waitFor(reducedMotion ? 1 : definitionValue.frameMs[motion]);
      if (continued === false) return false;
    }
    if (guard() && sprite.dataset.motionPlayId === playId && motion !== "death") sprite.src = frames.idle;
    if (sprite.dataset.motionPlayId === playId) delete sprite.dataset.motionPlayId;
    return true;
  }

  function preload(types = Object.keys(DEFINITIONS)) {
    return Promise.all(types.filter(supports).map((type) => prepare(type).catch(() => null)));
  }

  root.V2Motion = Object.freeze({
    supports, prepare, preload, applyIdle, play,
    registeredTypes: () => Object.keys(DEFINITIONS),
    sheetPath: (type) => DEFINITIONS[type]?.sheet || "",
    backdrop: (type) => DEFINITIONS[type]?.backdrop || "dark",
    impactFrame: (type) => DEFINITIONS[type]?.impactFrame ?? 0,
    frameCount: (type, motion) => DEFINITIONS[type]?.counts?.[motion] ?? 0
  });
})(window);
