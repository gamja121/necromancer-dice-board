const BOARD_SIZE = 5;
const SETUP_UNIT_LIMIT = 4;
const TOTEM_CELL = { row: 2, col: 2 };
const TOTEMS = {
  beast: {
    label: "야수 토템",
    image: "assets/totem-beast.jpg",
    effect: "모든 유닛 반격 확률 +10%",
  },
  ice: {
    label: "얼음 토템",
    image: "assets/totem-ice.jpg",
    effect: "빙결이 걸릴 때 추가 피해 1",
  },
  undead: {
    label: "언데드 토템",
    image: "assets/totem-undead.jpg",
    effect: "공격·반격 주사위가 1이면 체력 1 회복",
  },
};
const MAP_NODES = [
  { id: "first", stage: 0, x: 50, y: 88, label: "버려진 초소", subtitle: "언데드 3", enemies: ["spear", "archer", "knight"] },
  { id: "frost", stage: 1, x: 30, y: 69, label: "서리 길", subtitle: "얼음 3", enemies: ["yeti", "seaWolf", "spear"] },
  { id: "beast", stage: 1, x: 70, y: 69, label: "야수 굴", subtitle: "야수 3", enemies: ["goblinSoldier", "yeti", "ogre"] },
  { id: "plague", stage: 2, x: 28, y: 49, label: "오염된 늪", subtitle: "역병 4", enemies: ["plagueFrog", "ghoul", "plague", "worm"] },
  { id: "grave", stage: 2, x: 72, y: 49, label: "왕가의 묘지", subtitle: "언데드 4", enemies: ["spear", "archer", "golem", "skeletonSummoner"] },
  { id: "gate", stage: 3, x: 50, y: 29, label: "악마의 문", subtitle: "악마 4", enemies: ["abyssEye", "doomExecutor", "demonDeathKnight", "ogre"] },
  { id: "throne", stage: 4, x: 50, y: 9, label: "얼어붙은 왕좌", subtitle: "최종 5", enemies: ["iceLord", "demonDeathKnight", "minotaur", "plague", "skeletonSummoner"] },
];
const MAP_EDGES = [
  ["first", "frost"], ["first", "beast"],
  ["frost", "plague"], ["frost", "grave"],
  ["beast", "plague"], ["beast", "grave"],
  ["plague", "gate"], ["grave", "gate"],
  ["gate", "throne"],
];
const campaign = {
  depth: 0,
  roster: ["spear", "archer", "knight"],
  unitProgress: {},
  completed: [],
  currentNodeId: null,
  finished: false,
  availableTotems: [],
  transitioning: false,
};
let audioContext = null;
const AUDIO_SETTINGS_KEY = "necromancer-audio-settings-v1";
const SFX_FILES = {
  ui: "assets/sfx/ui.ogg",
  move: "assets/sfx/move.ogg",
  diceTick: "assets/sfx/dice-tick.ogg",
  diceLand: "assets/sfx/dice-land.ogg",
  attack: "assets/sfx/attack.ogg",
  arrow: "assets/sfx/arrow.ogg",
  magic: "assets/sfx/magic.ogg",
  heavy: "assets/sfx/heavy.ogg",
  claw: "assets/sfx/claw.ogg",
  hit: "assets/sfx/hit.ogg",
  death: "assets/sfx/death.ogg",
  summon: "assets/sfx/summon.ogg",
  freeze: "assets/sfx/freeze.ogg",
  poison: "assets/sfx/poison.ogg",
  victory: "assets/sfx/victory.ogg",
};
const SFX_VOLUME_TRIM = {
  ui: 0.55,
  move: 0.55,
  diceTick: 0.3,
  diceLand: 0.7,
  arrow: 0.8,
  heavy: 0.85,
  summon: 0.75,
  victory: 0.8,
};
const SFX_VIBRATION = {
  heavy: 24,
  death: [28, 24, 38],
  summon: 18,
  victory: [24, 30, 45],
};
const sfxTemplates = new Map();
const pieceImageCache = new Map();
const PLAYERS = {
  player: { label: "플레이어", dir: -1, homeRows: [3, 4], goalRow: 0 },
  enemy: { label: "상대", dir: 1, homeRows: [0, 1], goalRow: 4 },
};

const UNIT_TYPES = {
  summoner: {
    label: "소환사",
    hp: 5,
    dice: [0, 1, 1, 1, 2, 2],
    image: "assets/summoner.jpg",
  },
  spear: {
    label: "해골 창병",
    legion: "skeleton",
    grade: "normal",
    hp: 2,
    dice: [0, 1, 1, 1, 1, 2],
    image: "assets/skeleton-spear.jpg",
  },
  archer: {
    label: "해골 궁수",
    legion: "skeleton",
    grade: "normal",
    hp: 2,
    dice: [0, 0, 1, 1, 2, 2],
    image: "assets/skeleton-archer.jpg",
  },
  knight: {
    label: "죽음의 기사",
    legion: "skeleton",
    grade: "advanced",
    hp: 4,
    dice: [0, 1, 2, 2, 2, 3],
    image: "assets/death-knight.jpg",
  },
  worm: {
    label: "묘지 벌레",
    legion: "corpse",
    grade: "normal",
    hp: 3,
    dice: [0, 1, 1, 1, 2, 2],
    image: "assets/grave-worm.jpg",
  },
  golem: {
    label: "시체 골렘",
    legion: "corpse",
    grade: "advanced",
    hp: 6,
    dice: [0, 1, 2, 2, 3, 3],
    image: "assets/flesh-golem.jpg",
  },
  ghoul: {
    label: "구울",
    legion: "corpse",
    grade: "normal",
    hp: 3,
    dice: [0, 1, 1, 2, 2, 2],
    image: "assets/ghoul.jpg",
  },
  ogre: {
    label: "오우거",
    legion: "beast",
    grade: "advanced",
    hp: 7,
    dice: [0, 1, 2, 2, 3, 3],
    image: "assets/ogre.jpg",
  },
  plague: {
    label: "역병술사",
    legion: "plague",
    grade: "advanced",
    hp: 3,
    dice: [0, 0, 1, 2, 2, 3],
    image: "assets/plague-doctor.jpg",
  },
  plagueFrog: {
    label: "역병 개구리",
    legion: "plague",
    grade: "normal",
    hp: 2,
    dice: [0, 0, 1, 1, 1, 2],
    image: "assets/plague-frog.jpg",
  },
  minotaur: {
    label: "미노타우르스",
    legion: "beast",
    grade: "advanced",
    hp: 5,
    dice: [0, 1, 2, 2, 3, 3],
    image: "assets/minotaur.jpg",
  },
  yeti: {
    label: "설인",
    legion: ["beast", "ice"],
    grade: "normal",
    hp: 3,
    dice: [0, 0, 1, 1, 1, 2],
    image: "assets/yeti.jpg",
  },
  iceLord: {
    label: "얼음 군주",
    legion: "ice",
    grade: "advanced",
    hp: 4,
    dice: [0, 1, 2, 2, 3, 3],
    image: "assets/ice-lord.jpg",
  },
  seaWolf: {
    label: "바다늑대",
    legion: "ice",
    grade: "normal",
    hp: 2,
    dice: [0, 0, 1, 1, 1, 2],
    image: "assets/sea-wolf.jpg",
  },
  spiderQueen: {
    label: "거미여왕",
    legion: "summon",
    grade: "hero",
    hp: 5,
    dice: [0, 1, 1, 2, 2, 3],
    image: "assets/spider-queen.jpg",
  },
  spiderling: {
    label: "새끼거미",
    legion: "summon",
    grade: "special",
    hp: 1,
    dice: [0, 0, 1, 1, 1, 2],
    image: "assets/spiderling.jpg",
    noCorpse: true,
  },
  goblinChief: {
    label: "고블린족장",
    legion: ["beast", "summon"],
    grade: "hero",
    hp: 5,
    dice: [0, 1, 1, 2, 2, 3],
    image: "assets/goblin-chief.jpg",
  },
  goblinCommoner: {
    label: "평민고블린",
    legion: "summon",
    grade: "special",
    hp: 2,
    dice: [0, 0, 1, 1, 1, 2],
    image: "assets/goblin-commoner.jpg",
    noCorpse: true,
  },
  goblinSoldier: {
    label: "고블린 병사",
    legion: "beast",
    grade: "normal",
    hp: 2,
    dice: [0, 0, 1, 1, 1, 2],
    image: "assets/goblin-soldier.jpg",
  },
  skeletonSummoner: {
    label: "해골소환술사",
    legion: ["skeleton", "summon"],
    grade: "hero",
    hp: 2,
    dice: [0, 0, 1, 1, 1, 2],
    image: "assets/skeleton-summoner.jpg",
  },
  doomExecutor: {
    label: "파멸의 집행자",
    legion: "demon",
    grade: "advanced",
    hp: 5,
    dice: [0, 1, 2, 2, 3, 3],
    image: "assets/doom-executor.jpg",
  },
  abyssEye: {
    label: "심연의 눈",
    legion: ["ice", "demon"],
    grade: "normal",
    hp: 2,
    dice: [0, 0, 1, 1, 1, 2],
    image: "assets/abyss-eye.jpg",
  },
  demonDeathKnight: {
    label: "데스 나이트",
    legion: "demon",
    grade: "hero",
    hp: 5,
    dice: [0, 1, 2, 2, 3, 3],
    image: "assets/demon-death-knight.jpg",
  },
};

const SETUP_RESERVE_TYPES = ["spear", "archer", "knight", "worm", "golem", "ghoul", "ogre", "plague", "plagueFrog", "minotaur", "yeti", "iceLord", "seaWolf", "spiderQueen", "goblinChief", "goblinSoldier", "skeletonSummoner", "doomExecutor", "abyssEye", "demonDeathKnight"];

const state = {
  phase: "setup",
  turn: "player",
  board: [],
  units: [],
  corpses: [],
  reserves: {
    player: [...SETUP_RESERVE_TYPES],
    enemy: [...SETUP_RESERVE_TYPES],
  },
  setupLimits: { player: 3, enemy: 3 },
  deployedTypes: [],
  selectedReserve: null,
  selectedUnitId: null,
  inspectedUnitId: null,
  inspectedCorpseId: null,
  inspectedLegionOwner: null,
  selectedTotem: null,
  mode: "move",
  validMoves: [],
  validAttacks: [],
  pendingRespawnUnitId: null,
  pendingSummon: null,
  pendingSpiderSummon: null,
  pendingGoblinSummon: null,
  pendingUndeadSummon: null,
  winner: null,
  winnerAnnounced: false,
  lastDice: "-",
  isRolling: false,
  musicMuted: false,
  musicVolume: 0.32,
  sfxVolume: 0.75,
  vibrationEnabled: true,
  effects: {
    attackerId: null,
    hitIds: [],
    blastCells: [],
    damages: [],
    attackStyle: null,
    attackOwner: null,
  },
  visualEffects: [],
  log: [],
  nextId: 1,
};

const boardEl = document.getElementById("board");
const mapScreen = document.getElementById("mapScreen");
const startScreen = document.getElementById("startScreen");
const continueCampaignBtn = document.getElementById("continueCampaignBtn");
const startCampaignBtn = document.getElementById("startCampaignBtn");
const mapRoute = document.getElementById("mapRoute");
const mapProgress = document.getElementById("mapProgress");
const campaignRosterEl = document.getElementById("campaignRoster");
const newCampaignBtn = document.getElementById("newCampaignBtn");
const battleScreen = document.getElementById("battleScreen");
const battleSidePanel = document.getElementById("battleSidePanel");
const setupBookEl = document.getElementById("setupBook");
const reserveEl = document.getElementById("reserve");
const actionPanel = document.getElementById("actionPanel");
const phaseText = document.getElementById("phaseText");
const turnText = document.getElementById("turnText");
const diceText = document.getElementById("diceText");
const playerLegionCard = document.getElementById("playerLegionCard");
const diceBox = document.getElementById("diceBox");
const diceLabel = document.getElementById("diceLabel");
const diceFace = document.getElementById("diceFace");
const logEl = document.getElementById("log");
const unitInfoEl = document.getElementById("unitInfo");
const attackBtn = document.getElementById("attackBtn");
const skipAttackBtn = document.getElementById("skipAttackBtn");
const endTurnBtn = document.getElementById("endTurnBtn");
const resetBtn = document.getElementById("resetBtn");
const musicBtn = document.getElementById("musicBtn");
const soundSettingsBtn = document.getElementById("soundSettingsBtn");
const battleMusic = document.getElementById("battleMusic");
const soundDialog = document.getElementById("soundDialog");
const musicVolumeRange = document.getElementById("musicVolumeRange");
const musicVolumeValue = document.getElementById("musicVolumeValue");
const sfxVolumeRange = document.getElementById("sfxVolumeRange");
const sfxVolumeValue = document.getElementById("sfxVolumeValue");
const vibrationToggle = document.getElementById("vibrationToggle");
const rewardDialog = document.getElementById("rewardDialog");
const rewardSubtitle = document.getElementById("rewardSubtitle");
const rewardSurvivors = document.getElementById("rewardSurvivors");
const rewardCaptures = document.getElementById("rewardCaptures");
const rewardOptions = document.getElementById("rewardOptions");
const rewardResult = document.getElementById("rewardResult");
const rewardContinueBtn = document.getElementById("rewardContinueBtn");
const choiceDialog = document.getElementById("choiceDialog");
const dialogTitle = document.getElementById("dialogTitle");
const dialogText = document.getElementById("dialogText");
const dialogActions = document.getElementById("dialogActions");

function makeBoard() {
  return Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => null));
}

function addLog(message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 18);
}

function triggerVisualEffect(kind, data, duration = 800) {
  const effect = { id: `visual-${state.nextId++}`, kind, ...data };
  state.visualEffects.push(effect);
  window.setTimeout(() => {
    state.visualEffects = state.visualEffects.filter((item) => item.id !== effect.id);
    render();
  }, duration);
  return effect;
}

function triggerStatusVisual(unit, kind, title, detail = "", duration = 820) {
  if (!unit || !state.units.includes(unit)) return null;
  return triggerVisualEffect(kind, {
    row: unit.row,
    col: unit.col,
    unitId: unit.id,
    title,
    detail,
  }, duration);
}

function triggerSummonVisual(unit) {
  triggerVisualEffect("summon", { row: unit.row, col: unit.col, unitId: unit.id }, 900);
}

function nextUnitId(type, owner) {
  const id = `${owner}-${type}-${state.nextId}`;
  state.nextId += 1;
  return id;
}

function createUnit(type, owner, row, col, diceOverride = null, options = {}) {
  const def = UNIT_TYPES[type];
  const unit = {
    id: nextUnitId(type, owner),
    type,
    owner,
    row,
    col,
    hp: def.hp,
    baseMaxHp: def.hp,
    maxHp: def.hp,
    dice: diceOverride ? [...diceOverride] : [...def.dice],
    poisoned: false,
    frozen: false,
    summonedNoCorpse: Boolean(options.summonedNoCorpse),
    capturedForCampaign: Boolean(options.capturedForCampaign),
  };
  state.units.push(unit);
  state.board[row][col] = unit.id;
  reconcileUnitHealthBonuses();
  return unit;
}

function createCorpse(row, col, sourceType, sourceOwner) {
  const target = randomInt(2, 6);
  const corpse = {
    id: `corpse-${state.nextId++}`,
    row,
    col,
    sourceType,
    sourceOwner,
    target,
    attemptsRemaining: 2,
  };
  state.corpses.push(corpse);
  return corpse;
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function rollDie(faces) {
  return faces[Math.floor(Math.random() * faces.length)];
}

function dicePips(value) {
  const count = Math.max(0, Math.min(6, Number(value) || 0));
  return count === 0 ? "×" : "●".repeat(count);
}

function diceNumbers(faces) {
  return faces.join(", ");
}

function diceFaceMarkup(value) {
  const count = Math.max(0, Math.min(6, Number(value) || 0));
  if (count === 0) return `<span class="dice-miss">×</span>`;
  return Array.from({ length: count }, (_, index) => `<i class="pip pip-${index + 1}"></i>`).join("");
}

function buildPieceImage(source) {
  if (pieceImageCache.has(source)) return pieceImageCache.get(source);
  const pending = new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const maxEdge = 480;
      const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0, width, height);
      const pixels = context.getImageData(0, 0, width, height);
      const data = pixels.data;
      const visited = new Uint8Array(width * height);
      const queue = new Int32Array(width * height);
      let head = 0;
      let tail = 0;
      const isBackground = (index) => {
        const offset = index * 4;
        const luminance = data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722;
        return luminance >= 238;
      };
      const enqueue = (index) => {
        if (visited[index] || !isBackground(index)) return;
        visited[index] = 1;
        queue[tail++] = index;
      };
      for (let x = 0; x < width; x += 1) {
        enqueue(x);
        enqueue((height - 1) * width + x);
      }
      for (let y = 0; y < height; y += 1) {
        enqueue(y * width);
        enqueue(y * width + width - 1);
      }
      while (head < tail) {
        const index = queue[head++];
        const x = index % width;
        const y = Math.floor(index / width);
        if (x > 0) enqueue(index - 1);
        if (x + 1 < width) enqueue(index + 1);
        if (y > 0) enqueue(index - width);
        if (y + 1 < height) enqueue(index + width);
      }
      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;
      for (let index = 0; index < visited.length; index += 1) {
        const offset = index * 4;
        if (visited[index]) {
          data[offset + 3] = 0;
          continue;
        }
        if (data[offset + 3] > 8) {
          const x = index % width;
          const y = Math.floor(index / width);
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
      context.putImageData(pixels, 0, 0);
      if (maxX < minX || maxY < minY) {
        resolve(source);
        return;
      }
      const padding = Math.max(4, Math.round(Math.max(maxX - minX, maxY - minY) * 0.035));
      const cropX = Math.max(0, minX - padding);
      const cropY = Math.max(0, minY - padding);
      const cropWidth = Math.min(width - cropX, maxX - minX + 1 + padding * 2);
      const cropHeight = Math.min(height - cropY, maxY - minY + 1 + padding * 2);
      const output = document.createElement("canvas");
      output.width = cropWidth;
      output.height = cropHeight;
      output.getContext("2d").drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      resolve(output.toDataURL("image/png"));
    };
    image.onerror = () => resolve(source);
    image.src = source;
  });
  pieceImageCache.set(source, pending);
  return pending;
}

function applyPieceImage(imageElement, source) {
  buildPieceImage(source).then((pieceSource) => {
    if (imageElement.isConnected) imageElement.src = pieceSource;
  });
}

function setDiceFace(value) {
  diceFace.dataset.value = String(Math.max(0, Math.min(6, Number(value) || 0)));
  diceFace.innerHTML = diceFaceMarkup(value);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clampVolume(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : fallback;
}

function loadAudioSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY) || "null");
    if (!saved) return;
    state.musicMuted = Boolean(saved.musicMuted);
    state.musicVolume = clampVolume(saved.musicVolume, state.musicVolume);
    state.sfxVolume = clampVolume(saved.sfxVolume, state.sfxVolume);
    state.vibrationEnabled = saved.vibrationEnabled !== false;
  } catch (_error) {
    // Keep defaults when a browser has stale or blocked storage.
  }
}

function saveAudioSettings() {
  try {
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify({
      musicMuted: state.musicMuted,
      musicVolume: state.musicVolume,
      sfxVolume: state.sfxVolume,
      vibrationEnabled: state.vibrationEnabled,
    }));
  } catch (_error) {
    // Audio controls still work for this session when storage is unavailable.
  }
}

function syncAudioControls() {
  const musicPercent = Math.round(state.musicVolume * 100);
  const sfxPercent = Math.round(state.sfxVolume * 100);
  musicVolumeRange.value = String(musicPercent);
  musicVolumeValue.value = String(musicPercent);
  sfxVolumeRange.value = String(sfxPercent);
  sfxVolumeValue.value = String(sfxPercent);
  vibrationToggle.checked = state.vibrationEnabled;
  if (battleMusic) battleMusic.volume = state.musicMuted ? 0 : state.musicVolume;
}

function vibrateFor(name) {
  if (!state.vibrationEnabled || state.musicMuted || !navigator.vibrate) return;
  const pattern = SFX_VIBRATION[name];
  if (pattern) navigator.vibrate(pattern);
}

function playSfxFile(name) {
  const source = SFX_FILES[name];
  if (!source || state.sfxVolume <= 0) return false;
  let template = sfxTemplates.get(name);
  if (!template) {
    template = new Audio(source);
    template.preload = "auto";
    sfxTemplates.set(name, template);
  }
  const sound = template.cloneNode();
  sound.volume = Math.min(1, state.sfxVolume * (SFX_VOLUME_TRIM[name] || 1));
  sound.play().catch(() => {});
  vibrateFor(name);
  return true;
}

function ensureAudioContext() {
  if (state.musicMuted || state.sfxVolume <= 0) return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext) audioContext = new AudioContextClass();
  if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
  return audioContext;
}

function sfxTone(frequency, duration, options = {}) {
  const context = ensureAudioContext();
  if (!context) return;
  const start = context.currentTime + (options.delay || 0);
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = options.type || "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  if (options.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime((options.gain || 0.055) * state.sfxVolume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playSfx(name) {
  if (state.musicMuted) return;
  if (playSfxFile(name)) return;
  switch (name) {
    case "ui":
      sfxTone(520, 0.06, { type: "square", gain: 0.025, endFrequency: 680 });
      break;
    case "move":
      sfxTone(180, 0.12, { type: "triangle", gain: 0.04, endFrequency: 330 });
      break;
    case "diceTick":
      sfxTone(700 + Math.random() * 180, 0.035, { type: "square", gain: 0.018 });
      break;
    case "diceLand":
      sfxTone(150, 0.13, { type: "triangle", gain: 0.07, endFrequency: 90 });
      sfxTone(820, 0.08, { type: "square", gain: 0.025, delay: 0.03 });
      break;
    case "attack":
      sfxTone(760, 0.14, { type: "sawtooth", gain: 0.055, endFrequency: 170 });
      break;
    case "arrow":
      sfxTone(1250, 0.16, { type: "triangle", gain: 0.035, endFrequency: 310 });
      break;
    case "magic":
      sfxTone(310, 0.28, { type: "sine", gain: 0.04, endFrequency: 920 });
      sfxTone(620, 0.2, { type: "triangle", gain: 0.025, delay: 0.05, endFrequency: 1180 });
      break;
    case "heavy":
      sfxTone(95, 0.24, { type: "square", gain: 0.09, endFrequency: 42 });
      break;
    case "claw":
      sfxTone(980, 0.13, { type: "sawtooth", gain: 0.045, endFrequency: 210 });
      sfxTone(760, 0.1, { type: "sawtooth", gain: 0.03, delay: 0.045, endFrequency: 180 });
      break;
    case "hit":
      sfxTone(120, 0.16, { type: "square", gain: 0.08, endFrequency: 55 });
      break;
    case "death":
      sfxTone(240, 0.34, { type: "sawtooth", gain: 0.055, endFrequency: 45 });
      break;
    case "summon":
      [260, 390, 520].forEach((frequency, index) => sfxTone(frequency, 0.28, { type: "sine", gain: 0.04, delay: index * 0.07, endFrequency: frequency * 1.3 }));
      break;
    case "freeze":
      [880, 1180, 1480].forEach((frequency, index) => sfxTone(frequency, 0.16, { type: "triangle", gain: 0.025, delay: index * 0.035 }));
      break;
    case "poison":
      sfxTone(190, 0.3, { type: "sine", gain: 0.045, endFrequency: 95 });
      break;
    case "victory":
      [392, 523, 659, 784].forEach((frequency, index) => sfxTone(frequency, 0.32, { type: "triangle", gain: 0.045, delay: index * 0.11 }));
      break;
    default:
      break;
  }
}

function updateMusicButton() {
  const muted = state.musicMuted;
  musicBtn.textContent = muted ? "♩" : "♪";
  musicBtn.title = muted ? "게임 소리 켜기" : "게임 소리 끄기";
  musicBtn.setAttribute("aria-label", musicBtn.title);
}

function startBattleMusic() {
  if (!battleMusic || state.musicMuted) return;
  battleMusic.volume = state.musicVolume;
  battleMusic.currentTime = 0;
  battleMusic.play().catch(() => {
    addLog("음악 재생이 차단되었습니다. 음악 버튼을 눌러 재생하세요.");
    render();
  });
}

function stopBattleMusic() {
  if (!battleMusic) return;
  battleMusic.pause();
  battleMusic.currentTime = 0;
}

function toggleBattleMusic() {
  state.musicMuted = !state.musicMuted;
  if (state.musicMuted) {
    battleMusic.pause();
    if (audioContext?.state === "running") audioContext.suspend().catch(() => {});
  } else if (["setup", "battle"].includes(state.phase)) {
    ensureAudioContext();
    battleMusic.volume = state.musicVolume;
    battleMusic.play().catch(() => {});
  }
  saveAudioSettings();
  syncAudioControls();
  updateMusicButton();
}

async function showDiceRoll(label, faces, finalValue = null) {
  state.isRolling = true;
  diceLabel.textContent = label;
  diceBox.classList.add("is-rolling");
  const rolls = 16;
  let value = faces[0];
  for (let index = 0; index < rolls; index += 1) {
    value = rollDie(faces);
    setDiceFace(value);
    playSfx("diceTick");
    await wait(90);
  }
  const final = finalValue ?? value;
  setDiceFace(final);
  diceBox.classList.remove("is-rolling");
  playSfx("diceLand");
  state.isRolling = false;
  return final;
}

function isInside(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function isTotemCell(row, col) {
  return row === TOTEM_CELL.row && col === TOTEM_CELL.col;
}

function cellKey(row, col) {
  return `${row}:${col}`;
}

function unitAt(row, col) {
  const id = state.board[row]?.[col];
  return id ? state.units.find((unit) => unit.id === id) : null;
}

function corpseAt(row, col) {
  return state.corpses.find((corpse) => corpse.row === row && corpse.col === col);
}

function isEmptyCell(row, col) {
  return isInside(row, col) && !isTotemCell(row, col) && !unitAt(row, col) && !corpseAt(row, col);
}

function homeRows(owner) {
  return PLAYERS[owner].homeRows;
}

function isHomeCell(owner, row) {
  return homeRows(owner).includes(row);
}

function isNormalUnit(unit) {
  return UNIT_TYPES[unit.type]?.grade === "normal";
}

function isSummonedUnit(unit) {
  return UNIT_TYPES[unit.type]?.grade === "special" || Boolean(unit.summonedNoCorpse);
}

function legionOf(unit) {
  const legion = UNIT_TYPES[unit.type]?.legion || null;
  return Array.isArray(legion) ? legion[0] : legion;
}

function legionsOf(unit) {
  const legion = UNIT_TYPES[unit.type]?.legion || null;
  if (!legion) return [];
  return Array.isArray(legion) ? legion : [legion];
}

function hasLegion(unit, legion) {
  return legionsOf(unit).includes(legion);
}

function legionCount(owner, legion) {
  return state.units.filter((unit) => unit.owner === owner && hasLegion(unit, legion)).length;
}

function isLegionActive(owner, legion) {
  if (legion === "skeleton") return legionCount(owner, "skeleton") >= 3;
  if (legion === "corpse") return legionCount(owner, "corpse") >= 2;
  if (legion === "beast") return legionCount(owner, "beast") >= 2;
  if (legion === "plague") return legionCount(owner, "plague") >= 2;
  if (legion === "ice") return legionCount(owner, "ice") >= 2;
  if (legion === "summon") return legionCount(owner, "summon") >= 2;
  if (legion === "demon") return legionCount(owner, "demon") >= 2;
  return false;
}

function summonHealthBonus(owner) {
  return isLegionActive(owner, "summon") ? 3 : 0;
}

function reconcileUnitHealthBonuses() {
  state.units.forEach((unit) => {
    const def = UNIT_TYPES[unit.type];
    const baseMaxHp = unit.baseMaxHp ?? def.hp;
    const bonus = isSummonedUnit(unit) ? summonHealthBonus(unit.owner) : 0;
    const nextMaxHp = baseMaxHp + bonus;
    if (unit.maxHp === nextMaxHp) return;
    const diff = nextMaxHp - unit.maxHp;
    unit.baseMaxHp = baseMaxHp;
    unit.maxHp = nextMaxHp;
    unit.hp = diff > 0 ? Math.min(unit.maxHp, unit.hp + diff) : Math.min(unit.hp, unit.maxHp);
    if (diff > 0 && bonus > 0) {
      triggerStatusVisual(unit, "summonBuff", "소환 강화", `HP +${diff}`, 980);
    }
  });
}

function effectiveAttackDice(unit) {
  const dice = [...unit.dice];
  if (isLegionActive(unit.owner, "skeleton") && UNIT_TYPES[unit.type]?.grade !== "hero") {
    const zeroIndex = dice.indexOf(0);
    if (zeroIndex !== -1) dice[zeroIndex] = 1;
  }
  return dice;
}

function corpseSummonBonus(owner) {
  return isLegionActive(owner, "corpse") ? 1 : 0;
}

function spiderlingCount(owner) {
  return state.units.filter((unit) => unit.owner === owner && unit.type === "spiderling").length;
}

function goblinCommonerCount(owner) {
  return state.units.filter((unit) => unit.owner === owner && unit.type === "goblinCommoner").length;
}

function homeEmptyCells(owner) {
  const cells = [];
  homeRows(owner).forEach((row) => {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (isEmptyCell(row, col)) cells.push({ row, col });
    }
  });
  return cells;
}

function activeLegionSummary(owner) {
  const active = [];
  if (isLegionActive(owner, "skeleton")) active.push("언데드");
  if (isLegionActive(owner, "corpse")) active.push("시체");
  if (isLegionActive(owner, "beast")) active.push("야수");
  if (isLegionActive(owner, "plague")) active.push("역병");
  if (isLegionActive(owner, "ice")) active.push("얼음");
  if (isLegionActive(owner, "summon")) active.push("소환");
  if (isLegionActive(owner, "demon")) active.push("악마");
  return active.length ? active.join(" ") : "없음";
}

function canCounterAttack(counterUnit, attacker) {
  if (!counterUnit || !attacker) return false;
  if (counterUnit.hp <= 0 || attacker.hp <= 0) return false;
  if (counterChance(counterUnit) <= 0) return false;
  return legalAttacks(counterUnit).some((cell) => cell.row === attacker.row && cell.col === attacker.col);
}

function counterChance(unit) {
  let chance = 0;
  if (hasLegion(unit, "beast") && isLegionActive(unit.owner, "beast")) chance += 0.3;
  if (state.selectedTotem === "beast") chance += 0.1;
  return chance;
}

function applyUndeadTotemHeal(unit, roll, actionLabel) {
  if (state.selectedTotem !== "undead" || roll !== 1 || !state.units.includes(unit)) return;
  if (unit.hp >= unit.maxHp) {
    addLog(`${UNIT_TYPES[unit.type].label} 언데드 토템 발동. 체력이 이미 가득 찼습니다.`);
    return;
  }
  unit.hp = Math.min(unit.maxHp, unit.hp + 1);
  triggerStatusVisual(unit, "heal", "영혼 회복", "HP +1", 900);
  playSfx("magic");
  addLog(`${UNIT_TYPES[unit.type].label} ${actionLabel} 주사위 1. 언데드 토템으로 체력 1 회복.`);
}

function isGoalCell(unit) {
  return isNormalUnit(unit) && unit.row === PLAYERS[unit.owner].goalRow;
}

function movementDeltas(unit) {
  const forward = PLAYERS[unit.owner].dir;
  if (unit.type === "summoner") {
    return [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1],
    ];
  }
  if (unit.type === "spear") {
    return [[forward, 0], [0, -1], [0, 1]];
  }
  if (unit.type === "archer") {
    return [[forward, -1], [forward, 0], [forward, 1], [0, -1], [0, 1]];
  }
  if (unit.type === "knight") {
    return [[forward, 0], [forward * 2, 0], [0, -1], [0, -2], [0, 1], [0, 2], [-forward, 0]];
  }
  if (unit.type === "worm") {
    return [[forward, 0], [forward, -1], [forward, 1], [0, -1], [0, 1]];
  }
  if (unit.type === "golem") {
    return [[forward, 0], [0, -1], [0, 1], [-forward, 0]];
  }
  if (unit.type === "ghoul") {
    return [[forward, 0], [forward * 2, 0], [forward, -1], [forward, 1]];
  }
  if (unit.type === "ogre") {
    return [[forward, 0], [0, -1], [0, 1]];
  }
  if (unit.type === "plague") {
    return [[forward, -1], [forward, 1], [0, -1], [0, 1], [-forward, 0]];
  }
  if (unit.type === "plagueFrog") {
    return [[forward, 0], [forward * 2, 0], [0, -1], [0, 1]];
  }
  if (unit.type === "minotaur") {
    return [[forward, 0], [0, -1], [0, 1], [-forward, 0]];
  }
  if (unit.type === "yeti") {
    return [[forward, 0], [0, -1], [0, 1]];
  }
  if (unit.type === "iceLord") {
    return [[forward, 0], [0, -1], [0, 1], [-forward, 0]];
  }
  if (unit.type === "seaWolf") {
    return [[forward, 0], [forward, -1], [forward, 1], [0, -1], [0, 1]];
  }
  if (unit.type === "spiderQueen") {
    return [[forward, 0], [forward, -1], [forward, 1], [0, -1], [0, 1], [-forward, 0]];
  }
  if (unit.type === "spiderling") {
    return [[forward, 0], [forward, -1], [forward, 1], [0, -1], [0, 1]];
  }
  if (unit.type === "goblinChief") {
    return [[forward, 0], [forward, -1], [forward, 1], [0, -1], [0, 1], [-forward, 0]];
  }
  if (unit.type === "goblinCommoner") {
    return [[forward, 0], [0, -1], [0, 1]];
  }
  if (unit.type === "goblinSoldier") {
    return [[forward, 0], [0, -1], [0, 1]];
  }
  if (unit.type === "skeletonSummoner") {
    return [[forward, 0], [0, -1], [0, 1]];
  }
  if (unit.type === "doomExecutor") {
    return [[forward, 0], [forward, -1], [forward, 1], [0, -1], [0, 1], [-forward, 0]];
  }
  if (unit.type === "abyssEye") {
    return [[forward, 0], [0, -1], [0, 1]];
  }
  if (unit.type === "demonDeathKnight") {
    return [[forward, 0], [forward * 2, 0], [0, -1], [0, -2], [0, 1], [0, 2], [-forward, 0]];
  }
  return [];
}

function attackDeltas(unit) {
  const forward = PLAYERS[unit.owner].dir;
  if (unit.type === "summoner") {
    return [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1],
    ];
  }
  if (unit.type === "spear") return [[forward, 0]];
  if (unit.type === "archer") {
    return [
      [forward, 0], [forward * 2, 0],
      [forward, -1], [forward, 1],
      [0, -2], [0, 2],
    ];
  }
  if (unit.type === "knight") return [[forward, -1], [forward, 0], [forward, 1]];
  if (unit.type === "worm") return [[forward, 0], [forward * 2, 0]];
  if (unit.type === "golem") return [[-1, 0], [1, 0], [0, -1], [0, 1]];
  if (unit.type === "ghoul") return [[forward, -1], [forward, 0], [forward, 1]];
  if (unit.type === "ogre") {
    return [
      [forward, 0], [0, -1], [0, 1], [-forward, 0],
      [forward, -1], [forward, 1],
    ];
  }
  if (unit.type === "plague") {
    return [
      [forward, -1], [forward, 0], [forward, 1],
      [forward * 2, -1], [forward * 2, 0], [forward * 2, 1],
    ];
  }
  if (unit.type === "plagueFrog") {
    return [[forward, 0]];
  }
  if (unit.type === "minotaur") {
    return [[forward, -1], [forward, 0], [forward, 1], [0, -1], [0, 1]];
  }
  if (unit.type === "yeti") {
    return [[forward, -1], [forward, 0], [forward, 1]];
  }
  if (unit.type === "iceLord") {
    return [[forward, 0], [forward * 2, 0], [forward, -1], [forward, 1]];
  }
  if (unit.type === "seaWolf") {
    return [[forward, -1], [forward, 0], [forward, 1]];
  }
  if (unit.type === "spiderQueen") {
    return [[forward, -1], [forward, 0], [forward, 1], [0, -1], [0, 1]];
  }
  if (unit.type === "spiderling") {
    return [[forward, 0]];
  }
  if (unit.type === "goblinChief") {
    return [[forward, -1], [forward, 0], [forward, 1], [0, -1], [0, 1]];
  }
  if (unit.type === "goblinCommoner") {
    return [[forward, 0]];
  }
  if (unit.type === "goblinSoldier") {
    return [[forward, 0]];
  }
  if (unit.type === "skeletonSummoner") {
    return [[forward, 0]];
  }
  if (unit.type === "doomExecutor") {
    return [[forward, -1], [forward, 0], [forward, 1], [0, -1], [0, 1]];
  }
  if (unit.type === "abyssEye") {
    return [[forward, 0]];
  }
  if (unit.type === "demonDeathKnight") {
    return [[forward, -1], [forward, 0], [forward, 1], [0, -1], [0, 1]];
  }
  return [];
}

function legalMoves(unit) {
  if (unit.frozen) return [];
  return movementDeltas(unit)
    .map(([dr, dc]) => ({ row: unit.row + dr, col: unit.col + dc }))
    .filter(({ row, col }) => {
      if (!isEmptyCell(row, col)) return false;
      if (unit.type === "summoner" && !isHomeCell(unit.owner, row)) return false;
      return true;
    });
}

function legalAttacks(unit) {
  if (unit.frozen) return [];
  return attackDeltas(unit)
    .map(([dr, dc]) => ({ row: unit.row + dr, col: unit.col + dc }))
    .filter(({ row, col }) => {
      if (!isInside(row, col)) return false;
      const target = unitAt(row, col);
      return target && target.owner !== unit.owner;
    });
}


const CAMPAIGN_SAVE_KEY = "necromancer-campaign-save-v1";
const CAMPAIGN_SAVE_VERSION = 1;

function autoSaveCampaign() {
  try {
    const saveData = {
      version: CAMPAIGN_SAVE_VERSION,
      depth: campaign.depth,
      roster: campaign.roster,
      unitProgress: campaign.unitProgress,
      completed: campaign.completed,
      currentNodeId: campaign.currentNodeId,
      finished: campaign.finished,
      availableTotems: campaign.availableTotems,
      rewardState: campaign.rewardState
    };
    localStorage.setItem(CAMPAIGN_SAVE_KEY, JSON.stringify(saveData));
  } catch (e) {
    console.error("Auto-save failed:", e);
  }
}

function hasSavedCampaign() {
  try {
    return localStorage.getItem(CAMPAIGN_SAVE_KEY) !== null;
  } catch (e) {
    return false;
  }
}

def_delete_saved = "deleteSavedCampaign"; // variable to bypass linter
function deleteSavedCampaign() {
  try {
    localStorage.removeItem(CAMPAIGN_SAVE_KEY);
  } catch (e) {
    console.error("Delete save failed:", e);
  }
}

function validateDice(dice, unitType) {
  if (!Array.isArray(dice) || dice.length !== 6) return false;
  let hasZero = false;
  for (let i = 0; i < 6; i++) {
    const v = dice[i];
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 3) {
      return false;
    }
    if (v === 0) hasZero = true;
  }
  return hasZero;
}

function loadCampaignSave() {
  try {
    const raw = localStorage.getItem(CAMPAIGN_SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;

    if (data.version !== CAMPAIGN_SAVE_VERSION) return null;

    if (typeof data.depth !== "number" || !Number.isInteger(data.depth) || data.depth < 0 || data.depth > 4) {
      return null;
    }

    if (!Array.isArray(data.completed)) return null;
    const validNodeIds = MAP_NODES.map(node => node.id);
    const validatedCompleted = [];
    for (const nodeId of data.completed) {
      if (validNodeIds.includes(nodeId)) {
        validatedCompleted.push(nodeId);
      }
    }

    if (!Array.isArray(data.availableTotems)) return null;
    const validTotemKeys = Object.keys(TOTEMS);
    const validatedTotems = [];
    for (const key of data.availableTotems) {
      if (validTotemKeys.includes(key)) {
        validatedTotems.push(key);
      }
    }

    if (!Array.isArray(data.roster) || data.roster.length === 0) return null;
    const validatedRoster = [];
    for (const type of data.roster) {
      if (UNIT_TYPES[type] && type !== "summoner") {
        validatedRoster.push(type);
      }
    }
    if (validatedRoster.length === 0) return null;

    if (typeof data.unitProgress !== "object" || data.unitProgress === null) return null;
    const validatedProgress = {};
    for (const type of validatedRoster) {
      const progress = data.unitProgress[type];
      const defaultProg = defaultCampaignProgress(type);
      if (typeof progress === "object" && progress !== null) {
        let validatedHp = progress.hp;
        if (typeof validatedHp !== "number" || !Number.isInteger(validatedHp) || validatedHp < 1 || validatedHp > UNIT_TYPES[type].hp) {
          validatedHp = defaultProg.hp;
        }
        let validatedDice = progress.dice;
        if (!validateDice(validatedDice, type)) {
          validatedDice = [...defaultProg.dice];
        }
        validatedProgress[type] = { hp: validatedHp, dice: validatedDice };
      } else {
        validatedProgress[type] = defaultProg;
      }
    }

    let validatedCurrentNodeId = data.currentNodeId;
    if (validatedCurrentNodeId !== null && !validNodeIds.includes(validatedCurrentNodeId)) {
      validatedCurrentNodeId = null;
    }

    let validatedRewardState = null;
    if (typeof data.rewardState === "object" && data.rewardState !== null) {
      const rs = data.rewardState;
      if (Array.isArray(rs.survivors) && Array.isArray(rs.capturedTypes) && typeof rs.resultText === "string" && typeof rs.applied === "boolean") {
        if (rs.chosenKey === null || ["heal", "dice", "totem"].includes(rs.chosenKey)) {
          const validatedSurvivors = [];
          for (const s of rs.survivors) {
            if (s && typeof s === "object" && UNIT_TYPES[s.type] && typeof s.hp === "number" && typeof s.maxHp === "number") {
              validatedSurvivors.push({
                type: s.type,
                hp: Math.max(0, Math.min(UNIT_TYPES[s.type].hp, s.hp)),
                maxHp: UNIT_TYPES[s.type].hp
              });
            }
          }
          const validatedCapturedTypes = [];
          for (const c of rs.capturedTypes) {
            if (UNIT_TYPES[c]) {
              validatedCapturedTypes.push(c);
            }
          }
          validatedRewardState = {
            survivors: validatedSurvivors,
            capturedTypes: validatedCapturedTypes,
            chosenKey: rs.chosenKey,
            resultText: rs.resultText,
            applied: rs.applied
          };
        }
      }
    }

    return {
      version: CAMPAIGN_SAVE_VERSION,
      depth: data.depth,
      roster: validatedRoster,
      unitProgress: validatedProgress,
      completed: validatedCompleted,
      currentNodeId: validatedCurrentNodeId,
      finished: Boolean(data.finished),
      availableTotems: validatedTotems,
      rewardState: validatedRewardState
    };
  } catch (e) {
    console.error("Failed to load/parse campaign save:", e);
    return null;
  }
}

function defaultCampaignProgress(type) {
  const def = UNIT_TYPES[type];
  return { hp: def.hp, dice: [...def.dice] };
}

function campaignProgressFor(type) {
  if (!campaign.unitProgress[type]) campaign.unitProgress[type] = defaultCampaignProgress(type);
  return campaign.unitProgress[type];
}

function createCampaignUnit(type, owner, row, col) {
  const progress = campaignProgressFor(type);
  const unit = createUnit(type, owner, row, col, progress.dice);
  unit.hp = Math.max(1, Math.min(unit.maxHp, progress.hp));
  return unit;
}

function resetCampaign() {
  stopBattleMusic();
  if (rewardDialog.open) rewardDialog.close();
  battleScreen.classList.remove("is-victorious");
  mapScreen.classList.remove("is-arriving", "is-departing");
  campaign.depth = 0;
  campaign.roster = ["spear", "archer", "knight"];
  campaign.unitProgress = Object.fromEntries(campaign.roster.map((type) => [type, defaultCampaignProgress(type)]));
  campaign.completed = [];
  campaign.currentNodeId = null;
  campaign.finished = false;
  campaign.availableTotems = [];
  campaign.transitioning = false;
  campaign.rewardState = null;
  state.phase = "map";
  state.winner = null;
  state.winnerAnnounced = false;
  state.selectedTotem = null;
  render();
}

function enterCampaignBattle(nodeId) {
  if (campaign.transitioning) return;
  campaign.transitioning = true;
  mapScreen.classList.remove("is-arriving");
  mapScreen.classList.add("is-departing");
  playSfx("ui");
  window.setTimeout(() => {
    mapScreen.classList.remove("is-departing");
    campaign.transitioning = false;
    startCampaignBattle(nodeId);
  }, 460);
}

function startCampaignBattle(nodeId) {
  const node = MAP_NODES.find((item) => item.id === nodeId && item.stage === campaign.depth);
  if (!node || campaign.finished) return;
  ensureAudioContext();
  playSfx("ui");
  campaign.currentNodeId = node.id;
  battleScreen.classList.toggle("is-boss-battle", node.stage >= 4);
  state.phase = "setup";
  state.turn = "player";
  state.board = makeBoard();
  state.units = [];
  state.corpses = [];
  state.reserves = {
    player: [...campaign.roster],
    enemy: [...node.enemies],
  };
  state.setupLimits = {
    player: Math.min(SETUP_UNIT_LIMIT, campaign.roster.length),
    enemy: node.enemies.length,
  };
  state.deployedTypes = [];
  state.selectedReserve = null;
  state.selectedUnitId = null;
  state.inspectedUnitId = null;
  state.inspectedCorpseId = null;
  state.inspectedLegionOwner = null;
  state.selectedTotem = null;
  state.mode = "move";
  state.validMoves = [];
  state.validAttacks = [];
  state.pendingRespawnUnitId = null;
  state.pendingSummon = null;
  state.pendingSpiderSummon = null;
  state.pendingGoblinSummon = null;
  state.pendingUndeadSummon = null;
  state.winner = null;
  state.winnerAnnounced = false;
  state.lastDice = "-";
  state.isRolling = false;
  state.effects = {
    attackerId: null,
    hitIds: [],
    blastCells: [],
    damages: [],
    attackStyle: null,
    attackOwner: null,
  };
  state.visualEffects = [];
  state.log = [];
  state.nextId = 1;
  createUnit("summoner", "player", 4, 2);
  battleMusic.playbackRate = node.stage >= 4 ? 0.92 : 1;
  addLog(`${node.label} 진입. 보유 유닛 중 ${state.setupLimits.player}마리를 배치하세요.`);
  render();
  startBattleMusic();
}

function setupCompleteFor(owner) {
  return state.units.filter((unit) => unit.owner === owner && unit.type !== "summoner").length >= state.setupLimits[owner];
}

function advanceSetupIfNeeded() {
  if (state.phase !== "setup") return;
  if (state.turn === "player" && setupCompleteFor("player")) {
    state.turn = "enemy";
    state.selectedReserve = null;
    addLog("상대 배치 차례입니다.");
    render();
    window.setTimeout(autoEnemySetup, 450);
  }
  if (state.turn === "enemy" && setupCompleteFor("enemy")) {
    state.phase = "battle";
    state.turn = "player";
    state.selectedReserve = null;
    addLog("전투 시작. 플레이어 턴입니다.");
  }
}

function autoEnemySetup() {
  if (state.phase !== "setup" || state.turn !== "enemy") return;
  while (!setupCompleteFor("enemy") && state.reserves.enemy.length) {
    const type = state.reserves.enemy[0];
    const cells = [];
    homeRows("enemy").forEach((row) => {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (isEmptyCell(row, col)) cells.push({ row, col });
      }
    });
    const picked = cells[Math.floor(Math.random() * cells.length)];
    createUnit(type, "enemy", picked.row, picked.col);
    state.reserves.enemy = state.reserves.enemy.filter((item) => item !== type);
    addLog(`상대 ${UNIT_TYPES[type].label} 자동 배치.`);
  }
  advanceSetupIfNeeded();
  render();
}

function ownerLabel(owner) {
  return PLAYERS[owner].label;
}

function currentUnit() {
  return state.units.find((unit) => unit.id === state.selectedUnitId);
}

function inspectedUnit() {
  return state.units.find((unit) => unit.id === state.inspectedUnitId);
}

function inspectedCorpse() {
  return state.corpses.find((corpse) => corpse.id === state.inspectedCorpseId);
}

function selectUnit(unit) {
  if (state.phase !== "battle" || state.winner) return;
  playSfx("ui");
  state.inspectedUnitId = unit.id;
  state.inspectedCorpseId = null;
  state.inspectedLegionOwner = null;
  if (unit.owner !== state.turn) return;
  if (unit.frozen) {
    state.selectedUnitId = null;
    state.validMoves = [];
    state.validAttacks = [];
    addLog(`${UNIT_TYPES[unit.type].label} 빙결. 이번 턴 이동/공격 불가.`);
    render();
    return;
  }
  state.selectedUnitId = unit.id;
  state.inspectedCorpseId = null;
  state.mode = "move";
  state.validMoves = legalMoves(unit);
  state.validAttacks = legalAttacks(unit);
  render();
}

function moveUnit(unit, row, col) {
  playSfx("move");
  state.board[unit.row][unit.col] = null;
  unit.row = row;
  unit.col = col;
  state.board[row][col] = unit.id;
  state.validMoves = [];
  state.validAttacks = legalAttacks(unit);
  state.mode = "postMove";
  addLog(`${ownerLabel(unit.owner)} ${UNIT_TYPES[unit.type].label} 이동.`);
  if (state.validAttacks.length) {
    addLog("공격할 대상을 선택하거나 공격 생략을 누르세요.");
    if (unit.owner === "enemy") {
      window.setTimeout(async () => {
        const attacks = legalAttacks(unit);
        if (!attacks.length) {
          finishUnitAction(unit);
          render();
          return;
        }
        const targetCell = attacks[Math.floor(Math.random() * attacks.length)];
        const target = unitAt(targetCell.row, targetCell.col);
        if (target) await attackTarget(unit, target);
      }, 500);
    }
  } else {
    finishUnitAction(unit);
  }
  render();
}

async function attackTarget(attacker, target) {
  if (state.isRolling) return;
  const attackDice = effectiveAttackDice(attacker);
  const undeadBonus = isLegionActive(attacker.owner, "skeleton") && UNIT_TYPES[attacker.type]?.grade !== "hero";
  const plaguePoison = hasLegion(attacker, "plague") && isLegionActive(attacker.owner, "plague");
  const iceFreeze = hasLegion(attacker, "ice") && isLegionActive(attacker.owner, "ice");
  const demonDouble = hasLegion(attacker, "demon") && isLegionActive(attacker.owner, "demon") && Math.random() < 0.3;
  const rolledDamage = await showDiceRoll(`${UNIT_TYPES[attacker.type].label} 공격`, attackDice);
  applyUndeadTotemHeal(attacker, rolledDamage, "공격");
  const damage = demonDouble ? rolledDamage * 2 : rolledDamage;
  if (demonDouble && rolledDamage > 0) {
    triggerStatusVisual(attacker, "demonBurst", "악마 폭주", `${rolledDamage} ×2`, 1050);
    playSfx("magic");
    render();
    await wait(420);
  }
  state.lastDice = `${UNIT_TYPES[attacker.type].label}: ${rolledDamage}${demonDouble ? ` → ${damage} (악마 군단)` : ""}${undeadBonus ? " (언데드 군단)" : ""}${plaguePoison ? " (중독)" : ""}${iceFreeze ? " (빙결)" : ""}`;

  const attackCells = attacker.type === "knight"
    ? attackDeltas(attacker)
      .map(([dr, dc]) => ({ row: attacker.row + dr, col: attacker.col + dc }))
      .filter(({ row, col }) => isInside(row, col))
    : [{ row: target.row, col: target.col }];
  const targets = attacker.type === "knight"
    ? attackCells
      .map((cell) => unitAt(cell.row, cell.col))
      .filter((unit) => unit && unit.owner !== attacker.owner)
    : [target];

  await playAttackEffect(attacker, targets, damage, attackCells);

  if (attacker.type === "knight") {
    targets.forEach((hit) => {
      hit.hp -= damage;
    });
    applyPoison(attacker, targets);
    applyFreeze(attacker, targets);
    addLog(`죽음의 기사 전방 범위 공격 ${damage}. ${targets.length}명에게 피해.${demonDouble ? " 악마 군단 2배 발동." : ""}`);
    targets.filter((hit) => hit.hp <= 0).forEach(killUnit);
  } else {
    target.hp -= damage;
    applyPoison(attacker, [target]);
    applyFreeze(attacker, [target]);
    addLog(`${UNIT_TYPES[attacker.type].label} 공격 주사위 ${rolledDamage}. ${UNIT_TYPES[target.type].label}에게 ${damage} 피해.${demonDouble ? " 악마 군단 2배 발동." : ""}`);
    if (target.hp <= 0) {
      killUnit(target);
    }
  }
  await resolveBeastCounters(attacker, targets);
  if (await maybeBeginSpiderSummon(attacker, rolledDamage)) {
    state.validAttacks = [];
    render();
    return;
  }
  if (await maybeBeginGoblinSummon(attacker, rolledDamage)) {
    state.validAttacks = [];
    render();
    return;
  }
  if (await maybeBeginUndeadSummon(attacker, rolledDamage)) {
    state.validAttacks = [];
    render();
    return;
  }
  state.validAttacks = [];
  if (state.units.includes(attacker)) {
    finishUnitAction(attacker);
  } else if (!state.winner) {
    state.selectedUnitId = null;
    state.validMoves = [];
    state.validAttacks = [];
    state.mode = "move";
    endTurn();
    return;
  }
  render();
}

async function resolveBeastCounters(attacker, targets) {
  if (state.winner || !state.units.includes(attacker)) return;
  const counters = targets.filter((unit) => state.units.includes(unit) && canCounterAttack(unit, attacker));
  for (const counter of counters) {
    if (state.winner || !state.units.includes(attacker)) return;
    const chance = counterChance(counter);
    if (Math.random() >= chance) {
      addLog(`${UNIT_TYPES[counter.type].label} 반격 실패 (${Math.round(chance * 100)}%).`);
      continue;
    }
    triggerStatusVisual(counter, "counter", "반격!", `${Math.round(chance * 100)}% 발동`, 900);
    playSfx("heavy");
    render();
    await wait(360);
    const damage = await showDiceRoll(`${UNIT_TYPES[counter.type].label} 반격`, effectiveAttackDice(counter));
    applyUndeadTotemHeal(counter, damage, "반격");
    state.lastDice = `${UNIT_TYPES[counter.type].label} 반격: ${damage}`;
    await playAttackEffect(counter, [attacker], damage, [{ row: attacker.row, col: attacker.col }]);
    attacker.hp -= damage;
    addLog(`${UNIT_TYPES[counter.type].label} 반격 ${damage} (${Math.round(chance * 100)}%).`);
    if (attacker.hp <= 0) {
      killUnit(attacker);
      return;
    }
  }
}

async function maybeBeginSpiderSummon(attacker, damage) {
  if (damage !== 0 || attacker.type !== "spiderQueen") return false;
  if (!state.units.includes(attacker) || state.winner) return false;
  if (spiderlingCount(attacker.owner) >= 1) {
    addLog("새끼거미가 이미 있어 추가 소환할 수 없습니다.");
    return false;
  }
  const cells = homeEmptyCells(attacker.owner);
  if (!cells.length) {
    addLog("새끼거미를 소환할 빈 우리 영역이 없습니다.");
    return false;
  }
  state.selectedUnitId = null;
  state.validMoves = [];
  state.validAttacks = [];
  state.pendingSpiderSummon = { owner: attacker.owner };
  state.mode = "spiderSummonPlace";
  addLog("거미여왕 소환 발동. 우리 영역에 새끼거미를 배치하세요.");
  if (attacker.owner === "enemy") {
    const picked = cells[Math.floor(Math.random() * cells.length)];
    await wait(350);
    placeSpiderSummon(picked.row, picked.col);
  }
  return true;
}

function placeSpiderSummon(row, col) {
  const pending = state.pendingSpiderSummon;
  if (!pending || !isHomeCell(pending.owner, row) || !isEmptyCell(row, col)) return false;
  if (spiderlingCount(pending.owner) >= 1) return false;
  const unit = createUnit("spiderling", pending.owner, row, col);
  triggerSummonVisual(unit);
  playSfx("summon");
  state.pendingSpiderSummon = null;
  state.mode = "move";
  addLog("새끼거미 소환 완료.");
  endTurn();
  return true;
}

async function maybeBeginGoblinSummon(attacker, damage) {
  if (damage !== 0 || attacker.type !== "goblinChief") return false;
  if (!state.units.includes(attacker) || state.winner) return false;
  if (goblinCommonerCount(attacker.owner) >= 1) {
    addLog("평민고블린이 이미 있어 추가 소환할 수 없습니다.");
    return false;
  }
  const cells = homeEmptyCells(attacker.owner);
  if (!cells.length) {
    addLog("평민고블린을 소환할 빈 우리 영역이 없습니다.");
    return false;
  }
  state.selectedUnitId = null;
  state.validMoves = [];
  state.validAttacks = [];
  state.pendingGoblinSummon = { owner: attacker.owner };
  state.mode = "goblinSummonPlace";
  addLog("고블린족장 소환 발동. 우리 영역에 평민고블린을 배치하세요.");
  if (attacker.owner === "enemy") {
    const picked = cells[Math.floor(Math.random() * cells.length)];
    await wait(350);
    placeGoblinSummon(picked.row, picked.col);
  }
  return true;
}

function placeGoblinSummon(row, col) {
  const pending = state.pendingGoblinSummon;
  if (!pending || !isHomeCell(pending.owner, row) || !isEmptyCell(row, col)) return false;
  if (goblinCommonerCount(pending.owner) >= 1) return false;
  const unit = createUnit("goblinCommoner", pending.owner, row, col);
  triggerSummonVisual(unit);
  playSfx("summon");
  state.pendingGoblinSummon = null;
  state.mode = "move";
  addLog("평민고블린 소환 완료.");
  endTurn();
  return true;
}

async function maybeBeginUndeadSummon(attacker, damage) {
  if (damage !== 0 || attacker.type !== "skeletonSummoner") return false;
  if (!state.units.includes(attacker) || state.winner) return false;
  const cells = homeEmptyCells(attacker.owner);
  if (!cells.length) {
    addLog("언데드를 소환할 빈 우리 영역이 없습니다.");
    return false;
  }
  const roll = await showDiceRoll("언데드 소환", [1, 2, 3]);
  const summonTypeByRoll = { 1: "spear", 2: "archer", 3: "knight" };
  const type = summonTypeByRoll[roll];
  state.selectedUnitId = null;
  state.validMoves = [];
  state.validAttacks = [];
  state.pendingUndeadSummon = { owner: attacker.owner, type };
  state.mode = "undeadSummonPlace";
  addLog(`해골소환술사 소환 발동. ${UNIT_TYPES[type].label}을 우리 영역에 배치하세요.`);
  if (attacker.owner === "enemy") {
    const picked = cells[Math.floor(Math.random() * cells.length)];
    await wait(350);
    placeUndeadSummon(picked.row, picked.col);
  }
  return true;
}

function placeUndeadSummon(row, col) {
  const pending = state.pendingUndeadSummon;
  if (!pending || !isHomeCell(pending.owner, row) || !isEmptyCell(row, col)) return false;
  const unit = createUnit(pending.type, pending.owner, row, col, null, { summonedNoCorpse: true });
  triggerSummonVisual(unit);
  playSfx("summon");
  state.pendingUndeadSummon = null;
  state.mode = "move";
  addLog(`${UNIT_TYPES[pending.type].label} 소환 완료.`);
  endTurn();
  return true;
}

function applyPoison(attacker, targets) {
  if (!hasLegion(attacker, "plague") || !isLegionActive(attacker.owner, "plague")) return;
  const affected = targets.filter((unit) => state.units.includes(unit) && unit.hp > 0);
  if (affected.length) playSfx("poison");
  affected
    .forEach((unit) => {
      unit.poisoned = true;
      triggerStatusVisual(unit, "poisonBurst", "중독", "다음 턴 -1", 900);
      addLog(`${UNIT_TYPES[unit.type].label} 중독. 다음 자기 턴에 1 피해.`);
    });
  if (affected.length) render();
}

function applyFreeze(attacker, targets) {
  if (!hasLegion(attacker, "ice") || !isLegionActive(attacker.owner, "ice")) return;
  const affected = targets.filter((unit) => state.units.includes(unit) && unit.hp > 0);
  if (affected.length) playSfx("freeze");
  affected
    .forEach((unit) => {
      unit.frozen = true;
      addLog(`${UNIT_TYPES[unit.type].label} 빙결. 다음 자기 턴 이동/공격 불가.`);
      if (state.selectedTotem === "ice") {
        unit.hp -= 1;
        triggerStatusVisual(unit, "iceShatter", "빙결 파쇄", "-1", 900);
        addLog(`${UNIT_TYPES[unit.type].label} 얼음 토템 피해 1.`);
      } else {
        triggerStatusVisual(unit, "freezeBurst", "빙결", "이동·공격 금지", 980);
      }
    });
  if (affected.length) render();
}

function clearFrozenUnits(owner) {
  state.units
    .filter((unit) => unit.owner === owner && unit.frozen)
    .forEach((unit) => {
      unit.frozen = false;
      addLog(`${UNIT_TYPES[unit.type].label} 빙결 해제.`);
    });
}

async function applyTurnStartPoison(owner) {
  const poisonedUnits = state.units.filter((unit) => unit.owner === owner && unit.poisoned);
  if (!poisonedUnits.length) return;
  playSfx("poison");
  window.setTimeout(() => playSfx("hit"), 120);
  state.isRolling = true;
  poisonedUnits.forEach((unit) => triggerStatusVisual(unit, "poisonTick", "독성 발작", "HP -1", 960));
  state.effects = {
    attackerId: null,
    hitIds: poisonedUnits.map((unit) => unit.id),
    blastCells: poisonedUnits.map((unit) => ({ row: unit.row, col: unit.col })),
    damages: poisonedUnits.map((unit) => ({ row: unit.row, col: unit.col, value: 1 })),
  };
  render();
  await wait(760);
  poisonedUnits.forEach((unit) => {
    if (!state.units.includes(unit)) return;
    unit.poisoned = false;
    unit.hp -= 1;
    addLog(`${UNIT_TYPES[unit.type].label} 중독 피해 1.`);
  });
  poisonedUnits.filter((unit) => unit.hp <= 0 && state.units.includes(unit)).forEach(killUnit);
  state.effects = {
    attackerId: null,
    hitIds: [],
    blastCells: [],
    damages: [],
  };
  state.isRolling = false;
}

function attackStyleFor(unit) {
  if (["archer"].includes(unit.type)) return "ranged";
  if (["summoner", "plague", "iceLord", "skeletonSummoner", "abyssEye", "spiderQueen", "goblinChief"].includes(unit.type)) return "magic";
  if (["knight", "golem", "ogre", "minotaur", "doomExecutor", "demonDeathKnight"].includes(unit.type)) return "heavy";
  if (["worm", "ghoul", "plagueFrog", "yeti", "seaWolf", "spiderling"].includes(unit.type)) return "claw";
  return "melee";
}

async function playAttackEffect(attacker, targets, damage, attackCells) {
  const attackStyle = attackStyleFor(attacker);
  const soundByStyle = { ranged: "arrow", magic: "magic", heavy: "heavy", claw: "claw", melee: "attack" };
  playSfx(soundByStyle[attackStyle]);
  if (damage > 0) window.setTimeout(() => playSfx("hit"), 130);
  state.effects = {
    attackerId: attacker.id,
    hitIds: targets.map((unit) => unit.id),
    blastCells: attackCells,
    damages: targets.map((unit) => ({ row: unit.row, col: unit.col, value: damage })),
    attackStyle,
    attackOwner: attacker.owner,
    isMiss: damage === 0,
    isPowerHit: damage >= 3,
  };
  render();
  await wait(760);
  state.effects = {
    attackerId: null,
    hitIds: [],
    blastCells: [],
    damages: [],
    attackStyle: null,
    attackOwner: null,
    isMiss: false,
    isPowerHit: false,
  };
}

function killUnit(unit) {
  playSfx("death");
  const deathRow = unit.row;
  const deathCol = unit.col;
  state.board[unit.row][unit.col] = null;
  state.units = state.units.filter((item) => item.id !== unit.id);
  const finalEnemy = unit.owner === "enemy" && !state.units.some((item) => item.owner === "enemy");
  triggerVisualEffect("death", {
    row: deathRow,
    col: deathCol,
    type: unit.type,
    owner: unit.owner,
    final: finalEnemy,
  }, finalEnemy ? 1100 : 850);
  reconcileUnitHealthBonuses();
  if (UNIT_TYPES[unit.type]?.noCorpse || unit.summonedNoCorpse) {
    addLog(`${UNIT_TYPES[unit.type].label} 사망. 소환된 유닛이라 시체를 남기지 않습니다.`);
    checkCampaignVictory();
    return;
  }
  if (unit.type === "summoner") {
    state.winner = unit.owner === "player" ? "enemy" : "player";
    addLog(`${ownerLabel(unit.owner)} 소환사가 쓰러졌습니다.`);
    window.setTimeout(announceWinner, 150);
    return;
  }
  const corpse = createCorpse(unit.row, unit.col, unit.type, unit.owner);
  addLog(`${UNIT_TYPES[unit.type].label} 사망. 시체 생성, 소환 목표 ${corpse.target}+.`);
  checkCampaignVictory();
}

function checkCampaignVictory() {
  if (state.phase !== "battle" || state.winner) return;
  if (state.units.some((unit) => unit.owner === "enemy")) return;
  state.winner = "player";
  battleScreen.classList.add("is-victorious");
  addLog("적 유닛을 모두 처치했습니다.");
  window.setTimeout(announceWinner, 1050);
}

function finishUnitAction(unit) {
  if (state.winner) return;
  if (isGoalCell(unit)) {
    if (unit.owner === "enemy") {
      if (Math.random() < 0.7) {
        beginRespawnPlacement(unit);
        const cells = [];
        homeRows("enemy").forEach((row) => {
          for (let col = 0; col < BOARD_SIZE; col += 1) {
            if (isEmptyCell(row, col)) cells.push({ row, col });
          }
        });
        if (cells.length) {
          const picked = cells[Math.floor(Math.random() * cells.length)];
          window.setTimeout(() => placeRespawn(picked.row, picked.col), 400);
          return;
        }
      }
      endTurn();
      return;
    }
    state.pendingRespawnUnitId = unit.id;
    showRespawnDialog(unit);
    return;
  }
  endTurn();
}

async function endTurn() {
  if (state.winner) {
    render();
    return;
  }
  clearFrozenUnits(state.turn);
  state.turn = state.turn === "player" ? "enemy" : "player";
  state.selectedUnitId = null;
  state.inspectedCorpseId = null;
  state.selectedReserve = null;
  state.mode = "move";
  state.validMoves = [];
  state.validAttacks = [];
  addLog(`${ownerLabel(state.turn)} 턴입니다.`);
  await applyTurnStartPoison(state.turn);
  render();
  if (state.winner) return;
  if (state.turn === "enemy") {
    window.setTimeout(runEnemyTurn, 650);
  }
}

function showDialog(title, text, actions) {
  dialogTitle.textContent = title;
  dialogText.textContent = text;
  dialogActions.innerHTML = "";
  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action.label;
    button.addEventListener("click", () => {
      choiceDialog.close();
      action.onClick();
    });
    dialogActions.appendChild(button);
  });
  if (choiceDialog.open) choiceDialog.close();
  choiceDialog.showModal();
}

function announceWinner() {
  if (!state.winner || state.winnerAnnounced) return;
  state.winnerAnnounced = true;
  const playerWon = state.winner === "player";
  if (playerWon) playSfx("victory");
  const captured = survivingCapturedTypes();
  if (playerWon) {
    showVictoryRewardScreen(captured);
    return;
  }
  showDialog(
    playerWon ? "승리!" : "패배",
    playerWon
      ? `적을 모두 처치했습니다.${captured.length ? ` 생존한 포획 유닛: ${captured.map((type) => UNIT_TYPES[type].label).join(", ")}` : ""}`
      : "내 소환사가 쓰러졌습니다.",
    playerWon
      ? [{ label: campaign.depth >= 4 ? "원정 결과" : "맵으로", onClick: completeCampaignBattle }]
      : [
        { label: "다시 도전", onClick: () => startCampaignBattle(campaign.currentNodeId) },
        { label: "새 원정", onClick: resetCampaign },
      ],
  );
}

function survivingCapturedTypes() {
  return [...new Set(state.units
    .filter((unit) => unit.owner === "player" && unit.capturedForCampaign)
    .map((unit) => unit.type))];
}

function saveBattleProgress(capturedTypes) {
  state.deployedTypes.forEach((type) => {
    const survivor = state.units.find((unit) => unit.owner === "player" && unit.type === type && !unit.summonedNoCorpse);
    const progress = campaignProgressFor(type);
    if (survivor) {
      progress.hp = Math.max(1, Math.min(UNIT_TYPES[type].hp, survivor.hp));
      progress.dice = [...survivor.dice];
    } else {
      progress.hp = 1;
    }
  });
  capturedTypes.forEach((type) => {
    const survivor = state.units.find((unit) => unit.owner === "player" && unit.type === type && unit.capturedForCampaign);
    if (!campaign.roster.includes(type)) campaign.roster.push(type);
    campaign.unitProgress[type] = survivor
      ? { hp: Math.max(1, Math.min(UNIT_TYPES[type].hp, survivor.hp)), dice: [...survivor.dice] }
      : defaultCampaignProgress(type);
  });
}

function healCampaignRoster() {
  let healed = 0;
  campaign.roster.forEach((type) => {
    const progress = campaignProgressFor(type);
    const gain = Math.max(0, UNIT_TYPES[type].hp - progress.hp);
    healed += gain;
    progress.hp = UNIT_TYPES[type].hp;
  });
  return healed;
}

function upgradeCampaignDie() {
  const candidates = [];
  campaign.roster.forEach((type) => {
    const progress = campaignProgressFor(type);
    progress.dice.forEach((value, index) => {
      if (value > 0 && value < 3) candidates.push({ type, index, value });
    });
  });
  if (!candidates.length) return null;
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  campaign.unitProgress[picked.type].dice[picked.index] += 1;
  return picked;
}

function unlockCampaignTotem() {
  const locked = Object.keys(TOTEMS).filter((key) => !campaign.availableTotems.includes(key));
  if (!locked.length) return null;
  const key = locked[Math.floor(Math.random() * locked.length)];
  campaign.availableTotems.push(key);
  return key;
}

function applyCampaignReward(key) {
  if (key === "heal") {
    const healed = healCampaignRoster();
    playSfx("magic");
    return healed > 0 ? `원정대 체력을 총 ${healed} 회복했습니다.` : "원정대가 이미 최상의 상태입니다.";
  }
  if (key === "dice") {
    const upgraded = upgradeCampaignDie();
    if (!upgraded) {
      const healed = healCampaignRoster();
      return `강화 가능한 주사위가 없어 원정대를 대신 ${healed} 회복했습니다.`;
    }
    playSfx("diceLand");
    return `${UNIT_TYPES[upgraded.type].label}의 공격 주사위 ${upgraded.value}이 ${upgraded.value + 1}로 강화됐습니다.`;
  }
  const totemKey = unlockCampaignTotem();
  if (!totemKey) {
    const upgraded = upgradeCampaignDie();
    return upgraded
      ? `모든 토템을 보유 중입니다. ${UNIT_TYPES[upgraded.type].label}의 주사위를 대신 강화했습니다.`
      : "모든 토템과 주사위 강화가 완성됐습니다.";
  }
  playSfx("summon");
  return `${TOTEMS[totemKey].label}을 획득했습니다. 다음 전투 배치에서 선택할 수 있습니다.`;
}

function showVictoryRewardScreen(capturedTypes) {
  saveBattleProgress(capturedTypes);
  battleScreen.classList.add("is-victorious");
  const survivors = state.units.filter((unit) => unit.owner === "player" && unit.type !== "summoner" && !unit.summonedNoCorpse);
  
  campaign.rewardState = {
    survivors: survivors.map((unit) => ({
      type: unit.type,
      hp: Math.max(0, unit.hp),
      maxHp: unit.maxHp,
    })),
    capturedTypes: [...capturedTypes],
    chosenKey: null,
    resultText: "",
    applied: false,
  };
  autoSaveCampaign();

  rewardSubtitle.textContent = `${campaign.depth + 1}층 깊이를 탐험했습니다. 전리품과 보상을 선택하세요.`;
  rewardSurvivors.innerHTML = `<strong>생존 유닛</strong><div>${survivors.length ? survivors.map((unit) => `
    <span><img src="${UNIT_TYPES[unit.type].image}" alt=""><b>${UNIT_TYPES[unit.type].label}</b><small>HP ${Math.max(0, unit.hp)}/${unit.maxHp}</small></span>
  `).join("") : "<em>생존 유닛 없음</em>"}</div>`;
  rewardCaptures.innerHTML = capturedTypes.length
    ? `<strong>소환 포획</strong><p>${capturedTypes.map((type) => UNIT_TYPES[type].label).join(", ")}</p>`
    : `<strong>소환 포획</strong><p>이미 포획했거나 소환하지 않았습니다.</p>`;
  rewardResult.textContent = "";
  rewardContinueBtn.hidden = true;
  rewardContinueBtn.textContent = campaign.depth >= 4 ? "원정 완료" : "지도로";
  
  const rewards = [
    { key: "heal", mark: "+", title: "군단 치료", detail: "모든 보유 유닛 체력 회복" },
    { key: "dice", mark: "D", title: "주사위 강화", detail: "무작위 공격 주사위 눈 +1 강화" },
    { key: "totem", mark: "T", title: "토템 잠금해제", detail: "무작위 패시브 토템 하나 획득" },
  ];
  rewardOptions.innerHTML = "";
  rewards.forEach((reward) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `reward-option reward-${reward.key}`;
    button.innerHTML = `<i aria-hidden="true">${reward.mark}</i><span><b>${reward.title}</b><small>${reward.detail}</small></span>`;
    button.addEventListener("click", () => {
      rewardOptions.querySelectorAll("button").forEach((item) => { item.disabled = true; });
      button.classList.add("is-chosen");
      
      const result = applyCampaignReward(reward.key);
      
      if (campaign.rewardState) {
        campaign.rewardState.chosenKey = reward.key;
        campaign.rewardState.resultText = result;
        campaign.rewardState.applied = true;
      }
      autoSaveCampaign();

      rewardResult.textContent = result;
      rewardContinueBtn.hidden = false;
    }, { once: true });
    rewardOptions.appendChild(button);
  });
  if (rewardDialog.open) rewardDialog.close();
  rewardDialog.showModal();
}

function restoreRewardScreen() {
  const rs = campaign.rewardState;
  if (!rs) return;

  state.phase = "battle";
  state.winner = "player";
  state.winnerAnnounced = true;
  state.board = makeBoard();
  state.units = [];
  state.corpses = [];
  state.reserves = { player: [], enemy: [] };

  battleScreen.classList.add("is-victorious");
  rewardSubtitle.textContent = `${campaign.depth + 1}층 깊이를 탐험했습니다. 전리품과 보상을 확인하세요.`;
  rewardSurvivors.innerHTML = `<strong>생존 유닛</strong><div>${rs.survivors.length ? rs.survivors.map((unit) => `
    <span><img src="${UNIT_TYPES[unit.type].image}" alt=""><b>${UNIT_TYPES[unit.type].label}</b><small>HP ${Math.max(0, unit.hp)}/${unit.maxHp}</small></span>
  `).join("") : "<em>생존 유닛 없음</em>"}</div>`;
  rewardCaptures.innerHTML = rs.capturedTypes.length
    ? `<strong>소환 포획</strong><p>${rs.capturedTypes.map((type) => UNIT_TYPES[type].label).join(", ")}</p>`
    : `<strong>소환 포획</strong><p>이미 포획했거나 소환하지 않았습니다.</p>`;
  
  rewardResult.textContent = rs.resultText || "";
  rewardContinueBtn.hidden = !rs.chosenKey;
  rewardContinueBtn.textContent = campaign.depth >= 4 ? "원정 완료" : "지도로";

  const rewards = [
    { key: "heal", mark: "+", title: "군단 치료", detail: "모든 보유 유닛 체력 회복" },
    { key: "dice", mark: "D", title: "주사위 강화", detail: "무작위 공격 주사위 눈 +1 강화" },
    { key: "totem", mark: "T", title: "토템 잠금해제", detail: "무작위 패시브 토템 하나 획득" },
  ];
  
  rewardOptions.innerHTML = "";
  rewards.forEach((reward) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `reward-option reward-${reward.key}`;
    if (rs.chosenKey === reward.key) {
      button.classList.add("is-chosen");
    }
    button.disabled = rs.chosenKey !== null;
    button.innerHTML = `<i aria-hidden="true">${reward.mark}</i><span><b>${reward.title}</b><small>${reward.detail}</small></span>`;
    
    button.addEventListener("click", () => {
      rewardOptions.querySelectorAll("button").forEach((item) => { item.disabled = true; });
      button.classList.add("is-chosen");
      
      const result = applyCampaignReward(reward.key);
      
      rs.chosenKey = reward.key;
      rs.resultText = result;
      rs.applied = true;
      autoSaveCampaign();

      rewardResult.textContent = result;
      rewardContinueBtn.hidden = false;
    }, { once: true });
    
    rewardOptions.appendChild(button);
  });

  if (rewardDialog.open) rewardDialog.close();
  rewardDialog.showModal();
  render();
}

function completeCampaignBattle() {
  stopBattleMusic();
  survivingCapturedTypes().forEach((type) => {
    if (!campaign.roster.includes(type)) campaign.roster.push(type);
  });
  if (campaign.currentNodeId && !campaign.completed.includes(campaign.currentNodeId)) {
    campaign.completed.push(campaign.currentNodeId);
  }
  campaign.depth += 1;
  campaign.currentNodeId = null;
  campaign.finished = campaign.depth >= 5;
  campaign.transitioning = false;
  campaign.rewardState = null;
  state.phase = "map";
  state.winner = null;
  state.winnerAnnounced = false;
  battleScreen.classList.remove("is-victorious");
  
  autoSaveCampaign();
  
  render();
  mapScreen.classList.add("is-arriving");
  window.setTimeout(() => mapScreen.classList.remove("is-arriving"), 700);
}

function showRespawnDialog(unit) {
  showDialog(
    "전선을 돌파했습니다",
    `${UNIT_TYPES[unit.type].label}이 적 끝줄에 도착했습니다. 본진으로 재소환하고 체력 회복, 공격 주사위 1면 +1 강화를 받을까요?`,
    [
      { label: "재소환", onClick: () => beginRespawnPlacement(unit) },
      { label: "그대로 둠", onClick: () => endTurn() },
    ],
  );
}

function upgradeAttackDie(unit) {
  const candidates = unit.dice
    .map((value, index) => ({ value, index }))
    .filter((face) => face.value > 0 && face.value < 3);
  if (!candidates.length) return null;
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  unit.dice[picked.index] += 1;
  return picked.index;
}

function beginRespawnPlacement(unit) {
  const index = upgradeAttackDie(unit);
  unit.hp = unit.maxHp;
  state.board[unit.row][unit.col] = null;
  unit.row = null;
  unit.col = null;
  state.pendingRespawnUnitId = unit.id;
  state.mode = "respawn";
  addLog(`${UNIT_TYPES[unit.type].label} 재소환 준비. ${index === null ? "강화 가능한 주사위 면이 없습니다." : `주사위 ${index + 1}번 면이 +1 강화되었습니다.`}`);
  render();
}

function placeRespawn(row, col) {
  const unit = state.units.find((item) => item.id === state.pendingRespawnUnitId);
  if (!unit || !isHomeCell(unit.owner, row) || !isEmptyCell(row, col)) return;
  unit.row = row;
  unit.col = col;
  state.board[row][col] = unit.id;
  triggerSummonVisual(unit);
  playSfx("summon");
  state.pendingRespawnUnitId = null;
  state.mode = "move";
  addLog(`${UNIT_TYPES[unit.type].label} 본진 재소환 완료.`);
  endTurn();
}

async function tryCorpseSummon(corpse) {
  if (state.phase !== "battle" || state.winner) return;
  if (state.isRolling) return;
  const owner = state.turn;
  corpse.attemptsRemaining = Math.max(0, (corpse.attemptsRemaining ?? 2) - 1);
  const roll = await showDiceRoll("시체 소환", [1, 2, 3, 4, 5, 6]);
  const bonus = corpseSummonBonus(owner);
  const total = roll + bonus;
  state.lastDice = `시체 소환: ${roll}${bonus ? `+${bonus}` : ""}`;
  if (total < corpse.target) {
    if (corpse.attemptsRemaining <= 0) {
      state.corpses = state.corpses.filter((item) => item.id !== corpse.id);
      triggerVisualEffect("corpseBreak", {
        row: corpse.row,
        col: corpse.col,
      }, 850);
      playSfx("death");
      addLog(`시체 소환 2회 실패. ${UNIT_TYPES[corpse.sourceType].label} 시체가 사라졌습니다.`);
    } else {
      triggerVisualEffect("corpseFail", {
        row: corpse.row,
        col: corpse.col,
      }, 650);
      addLog(`시체 소환 실패. ${total} / 목표 ${corpse.target}+. 남은 기회 ${corpse.attemptsRemaining}회.`);
    }
    endTurn();
    return;
  }
  beginCorpseSummonPlacement(corpse, owner, total);
}

function beginCorpseSummonPlacement(corpse, owner, roll) {
  state.pendingSummon = {
    corpseId: corpse.id,
    owner,
    type: corpse.sourceType,
  };
  state.mode = "summonPlace";
  state.selectedUnitId = null;
  state.validMoves = [];
  state.validAttacks = [];
  addLog(`소환 성공. ${roll} / 목표 ${corpse.target}+. ${UNIT_TYPES[corpse.sourceType].label}을 ${ownerLabel(owner)} 영역에 배치하세요.`);
  render();
}

function placeCorpseSummon(row, col) {
  const pending = state.pendingSummon;
  if (!pending || !isHomeCell(pending.owner, row) || !isEmptyCell(row, col)) return false;
  const corpse = state.corpses.find((item) => item.id === pending.corpseId);
  if (!corpse) return false;
  const unit = createUnit(pending.type, pending.owner, row, col, null, {
    capturedForCampaign: pending.owner === "player" && corpse.sourceOwner === "enemy",
  });
  triggerSummonVisual(unit);
  playSfx("summon");
  state.corpses = state.corpses.filter((item) => item.id !== corpse.id);
  state.pendingSummon = null;
  state.mode = "move";
  addLog(`${UNIT_TYPES[pending.type].label} 시체 소환 완료.${pending.owner === "player" && corpse.sourceOwner === "enemy" ? " 전투에서 생존하면 원정대에 합류합니다." : ""}`);
  endTurn();
  return true;
}

async function runEnemyTurn() {
  if (state.phase !== "battle" || state.turn !== "enemy" || state.winner || state.isRolling) return;

  const corpse = state.corpses.find((item) => !unitAt(item.row, item.col));
  if (corpse && Math.random() < 0.45) {
    await tryCorpseSummon(corpse);
    if (state.mode === "summonPlace" && state.pendingSummon?.owner === "enemy") {
      const cells = [];
      homeRows("enemy").forEach((row) => {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
          if (isEmptyCell(row, col)) cells.push({ row, col });
        }
      });
      if (cells.length) {
        const picked = cells[Math.floor(Math.random() * cells.length)];
        await wait(350);
        placeCorpseSummon(picked.row, picked.col);
        return;
      }
      state.pendingSummon = null;
      state.mode = "move";
      endTurn();
      return;
    }
    return;
  }

  const enemyUnits = state.units.filter((unit) => unit.owner === "enemy");
  const attackers = enemyUnits
    .map((unit) => ({ unit, attacks: legalAttacks(unit) }))
    .filter((entry) => entry.attacks.length);

  if (attackers.length) {
    const entry = attackers[Math.floor(Math.random() * attackers.length)];
    state.selectedUnitId = entry.unit.id;
    state.validMoves = legalMoves(entry.unit);
    state.validAttacks = entry.attacks;
    render();
    await wait(450);
    const targetCell = entry.attacks[Math.floor(Math.random() * entry.attacks.length)];
    const target = unitAt(targetCell.row, targetCell.col);
    if (target) await attackTarget(entry.unit, target);
    return;
  }

  const movers = enemyUnits
    .map((unit) => ({ unit, moves: legalMoves(unit) }))
    .filter((entry) => entry.moves.length);

  if (movers.length) {
    const entry = movers[Math.floor(Math.random() * movers.length)];
    state.selectedUnitId = entry.unit.id;
    state.validMoves = entry.moves;
    state.validAttacks = legalAttacks(entry.unit);
    render();
    await wait(450);
    const move = entry.moves[Math.floor(Math.random() * entry.moves.length)];
    moveUnit(entry.unit, move.row, move.col);
    return;
  }

  addLog("상대가 행동할 수 없어 턴을 넘깁니다.");
  endTurn();
}

async function handleCellClick(row, col) {
  if (state.winner) return;
  const unit = unitAt(row, col);
  const corpse = corpseAt(row, col);
  if (unit) {
    state.inspectedUnitId = unit.id;
    state.inspectedCorpseId = null;
    state.inspectedLegionOwner = null;
    render();
  }
  if (state.isRolling || state.turn === "enemy") return;
  if (state.phase === "setup") {
    handleSetupCell(row, col);
    return;
  }
  if (state.mode === "respawn") {
    placeRespawn(row, col);
    return;
  }
  if (state.mode === "summonPlace") {
    placeCorpseSummon(row, col);
    return;
  }
  if (state.mode === "spiderSummonPlace") {
    placeSpiderSummon(row, col);
    return;
  }
  if (state.mode === "goblinSummonPlace") {
    placeGoblinSummon(row, col);
    return;
  }
  if (state.mode === "undeadSummonPlace") {
    placeUndeadSummon(row, col);
    return;
  }
  if (corpse && !unit && state.mode === "move") {
    state.inspectedCorpseId = corpse.id;
    state.inspectedUnitId = null;
    state.inspectedLegionOwner = null;
    render();
    tryCorpseSummon(corpse);
    return;
  }
  if (unit && unit.owner === state.turn && state.mode === "move") {
    selectUnit(unit);
    return;
  }
  const selected = currentUnit();
  if (!selected) return;
  if (state.validAttacks.some((cell) => cell.row === row && cell.col === col)) {
    const target = unitAt(row, col);
    if (target) await attackTarget(selected, target);
    return;
  }
  if (state.mode === "move" && state.validMoves.some((cell) => cell.row === row && cell.col === col)) {
    moveUnit(selected, row, col);
    return;
  }
}

function handleSetupCell(row, col) {
  if (!state.selectedReserve) return;
  if (setupCompleteFor(state.turn)) return;
  if (!isHomeCell(state.turn, row) || !isEmptyCell(row, col)) return;
  if (state.turn === "player" && row === 4 && col === 2) return;
  if (state.turn === "enemy" && row === 0 && col === 2) return;
  const type = state.selectedReserve;
  if (state.turn === "player") {
    createCampaignUnit(type, state.turn, row, col);
    if (!state.deployedTypes.includes(type)) state.deployedTypes.push(type);
  } else {
    createUnit(type, state.turn, row, col);
  }
  state.reserves[state.turn] = state.reserves[state.turn].filter((item) => item !== type);
  state.selectedReserve = null;
  addLog(`${ownerLabel(state.turn)} ${UNIT_TYPES[type].label} 배치.`);
  advanceSetupIfNeeded();
  render();
}

function zoneClass(row) {
  if (row <= 1) return "enemy-zone";
  if (row === 2) return "neutral-zone";
  return "player-zone";
}

function renderBoard() {
  const moveSet = new Set(state.validMoves.map((cell) => cellKey(cell.row, cell.col)));
  const attackSet = new Set(state.validAttacks.map((cell) => cellKey(cell.row, cell.col)));
  const blastSet = new Set(state.effects.blastCells.map((cell) => cellKey(cell.row, cell.col)));
  const damageByCell = new Map(state.effects.damages.map((item) => [cellKey(item.row, item.col), item.value]));
  const visualsByCell = new Map();
  state.visualEffects.forEach((effect) => {
    const key = cellKey(effect.row, effect.col);
    if (!visualsByCell.has(key)) visualsByCell.set(key, []);
    visualsByCell.get(key).push(effect);
  });
  boardEl.classList.toggle("is-combat-active", Boolean(state.effects.attackStyle));
  boardEl.classList.toggle("is-combat-hit", Boolean(state.effects.attackStyle) && !state.effects.isMiss);
  boardEl.classList.toggle("is-power-hit", Boolean(state.effects.isPowerHit));
  ["melee", "ranged", "magic", "heavy", "claw"].forEach((style) => {
    boardEl.classList.toggle(`combat-${style}`, state.effects.attackStyle === style);
  });
  boardEl.innerHTML = "";
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = `cell ${zoneClass(row)}`;
      cell.setAttribute("aria-label", `${row + 1}행 ${col + 1}열`);
      if (isTotemCell(row, col)) {
        cell.classList.add("is-totem-cell");
        cell.setAttribute("aria-label", state.selectedTotem ? TOTEMS[state.selectedTotem].label : "토템 자리");
        cell.disabled = true;
        if (state.selectedTotem) {
          const totem = TOTEMS[state.selectedTotem];
          const totemEl = document.createElement("div");
          totemEl.className = "totem-piece";
          totemEl.innerHTML = `<img src="${totem.image}" alt="${totem.label}"><strong>${totem.label}</strong>`;
          cell.appendChild(totemEl);
        } else {
          cell.innerHTML = `<span class="totem-slot-label">토템</span>`;
        }
        boardEl.appendChild(cell);
        continue;
      }
      if (moveSet.has(cellKey(row, col))) cell.classList.add("is-move");
      if (attackSet.has(cellKey(row, col))) cell.classList.add("is-attack");
      if (blastSet.has(cellKey(row, col))) cell.classList.add("is-blast");
      if (state.mode === "respawn" && isHomeCell(state.turn, row) && isEmptyCell(row, col)) {
        cell.classList.add("is-summon");
      }
      if (state.mode === "summonPlace" && state.pendingSummon && isHomeCell(state.pendingSummon.owner, row) && isEmptyCell(row, col)) {
        cell.classList.add("is-summon");
      }
      if (state.mode === "spiderSummonPlace" && state.pendingSpiderSummon && isHomeCell(state.pendingSpiderSummon.owner, row) && isEmptyCell(row, col)) {
        cell.classList.add("is-summon");
      }
      if (state.mode === "goblinSummonPlace" && state.pendingGoblinSummon && isHomeCell(state.pendingGoblinSummon.owner, row) && isEmptyCell(row, col)) {
        cell.classList.add("is-summon");
      }
      if (state.mode === "undeadSummonPlace" && state.pendingUndeadSummon && isHomeCell(state.pendingUndeadSummon.owner, row) && isEmptyCell(row, col)) {
        cell.classList.add("is-summon");
      }
      const unit = unitAt(row, col);
      const corpse = corpseAt(row, col);
      const visualEffects = visualsByCell.get(cellKey(row, col)) || [];
      if (visualEffects.some((effect) => effect.kind === "summon")) cell.classList.add("is-summoning");
      if (visualEffects.some((effect) => effect.kind === "corpseFail")) cell.classList.add("is-corpse-fail");
      if (visualEffects.some((effect) => effect.kind === "corpseBreak")) cell.classList.add("is-corpse-breaking");
      if (unit?.id === state.selectedUnitId) cell.classList.add("is-selected");
      if (unit?.id === state.inspectedUnitId) cell.classList.add("is-inspected");
      if (unit?.poisoned) cell.classList.add("is-poisoned");
      if (unit?.frozen) cell.classList.add("is-frozen");
      if (unit?.id === state.effects.attackerId) {
        cell.classList.add("is-striking", `strike-${state.effects.attackStyle || "melee"}`, `from-${state.effects.attackOwner || unit.owner}`);
      }
      if (unit && state.effects.hitIds.includes(unit.id)) {
        cell.classList.add(state.effects.isMiss ? "is-miss" : "is-hit");
        if (state.effects.attackStyle) cell.classList.add(`hit-${state.effects.attackStyle}`);
        if (state.effects.isPowerHit) cell.classList.add("is-power-hit");
      }
      if (corpse?.id === state.inspectedCorpseId) cell.classList.add("is-inspected");
      if (unit) cell.appendChild(renderUnit(unit));
      if (!unit && corpse) cell.appendChild(renderCorpse(corpse));
      visualEffects.forEach((effect) => cell.appendChild(renderVisualEffect(effect)));
      if (unit && state.effects.hitIds.includes(unit.id) && state.effects.attackStyle) {
        const effect = document.createElement("span");
        effect.className = `combat-effect effect-${state.effects.attackStyle} from-${state.effects.attackOwner}${state.effects.isMiss ? " is-miss" : ""}`;
        effect.setAttribute("aria-hidden", "true");
        cell.appendChild(effect);
      }
      if (damageByCell.has(cellKey(row, col))) {
        const damage = document.createElement("div");
        damage.className = `damage-pop${state.effects.isMiss ? " is-miss" : ""}${state.effects.isPowerHit ? " is-power-hit" : ""}`;
        const damageValue = damageByCell.get(cellKey(row, col));
        damage.textContent = damageValue === 0 ? "MISS" : `-${damageValue}`;
        cell.appendChild(damage);
      }
      cell.addEventListener("click", () => handleCellClick(row, col));
      boardEl.appendChild(cell);
    }
  }
}

function renderVisualEffect(effect) {
  const element = document.createElement("span");
  element.className = `visual-effect visual-${effect.kind}${effect.final ? " is-final" : ""}`;
  element.setAttribute("aria-hidden", "true");
  if (effect.kind === "death") {
    const def = UNIT_TYPES[effect.type];
    const image = document.createElement("img");
    image.src = def.image;
    image.alt = "";
    element.appendChild(image);
    applyPieceImage(image, def.image);
  } else if (effect.kind === "corpseBreak") {
    element.innerHTML = `<img src="assets/corpse.jpg" alt="">`;
  } else if (effect.title) {
    const title = document.createElement("strong");
    title.textContent = effect.title;
    element.appendChild(title);
    if (effect.detail) {
      const detail = document.createElement("small");
      detail.textContent = effect.detail;
      element.appendChild(detail);
    }
  }
  return element;
}

function renderUnit(unit) {
  const def = UNIT_TYPES[unit.type];
  const healthPercent = Math.max(0, Math.min(100, (unit.hp / unit.maxHp) * 100));
  const healthColor = healthPercent <= 33 ? "#d43d3d" : healthPercent <= 66 ? "#e0a11b" : "#2ea45f";
  const card = document.createElement("div");
  card.className = `unit-card ${unit.owner}`;
  card.innerHTML = `
    <span class="unit-stand" aria-hidden="true"></span>
    <img src="${def.image}" alt="${def.label}">
    <span class="unit-health" aria-label="체력 ${unit.hp}/${unit.maxHp}"><i style="width:${healthPercent}%;background:${healthColor}"></i></span>
  `;
  applyPieceImage(card.querySelector("img"), def.image);
  return card;
}

function renderCorpse(corpse) {
  const el = document.createElement("div");
  el.className = "corpse";
  el.innerHTML = `<img src="assets/corpse.jpg" alt="시체"><span class="corpse-attempts">${corpse.attemptsRemaining ?? 2}회</span>`;
  return el;
}

function renderReserve() {
  reserveEl.innerHTML = "";
  setupBookEl.innerHTML = "";
  const isPlayerSetup = state.phase === "setup" && state.turn === "player";
  const units = isPlayerSetup && !setupCompleteFor("player") ? state.reserves[state.turn] : [];
  actionPanel.hidden = state.phase === "setup";
  setupBookEl.classList.toggle("is-hidden", !isPlayerSetup);
  diceBox.hidden = isPlayerSetup;
  if (!isPlayerSetup) {
    if (state.phase === "setup") {
      diceBox.hidden = true;
    }
    return;
  }

  if (campaign.availableTotems.length) {
    const totemPicker = document.createElement("section");
    totemPicker.className = "totem-picker";
    totemPicker.innerHTML = `<strong>중앙 토템</strong><div class="totem-options"></div>`;
    const options = totemPicker.querySelector(".totem-options");
    campaign.availableTotems.forEach((key) => {
      const totem = TOTEMS[key];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "totem-option";
      if (state.selectedTotem === key) button.classList.add("is-selected");
      button.innerHTML = `<img src="${totem.image}" alt=""><span><b>${totem.label}</b><small>${totem.effect}</small></span>`;
      button.addEventListener("click", () => {
        state.selectedTotem = key;
        addLog(`${totem.label} 선택. 양쪽 진영 모두 효과를 받습니다.`);
        render();
      });
      options.appendChild(button);
    });
    setupBookEl.appendChild(totemPicker);
  } else {
    const noTotem = document.createElement("p");
    noTotem.className = "no-totem";
    noTotem.textContent = "이번 원정은 토템 없이 시작합니다.";
    setupBookEl.appendChild(noTotem);
  }

  const unitShelf = document.createElement("div");
  unitShelf.className = "setup-unit-shelf";
  if (!units.length) {
    const empty = document.createElement("p");
    empty.textContent = "배치 완료. 전투를 준비합니다.";
    unitShelf.appendChild(empty);
    setupBookEl.appendChild(unitShelf);
    return;
  }
  units.forEach((type) => {
    const def = UNIT_TYPES[type];
    const card = document.createElement("button");
    card.type = "button";
    card.className = "reserve-card";
    if (state.selectedReserve === type) card.classList.add("is-selected");
    card.innerHTML = `
      <img src="${def.image}" alt="${def.label}">
      <span><strong>${def.label}</strong><span>HP ${def.hp} · 주사위 ${def.dice.map(dicePips).join(" ")}</span></span>
    `;
    card.addEventListener("click", () => {
      playSfx("ui");
      state.selectedReserve = type;
      render();
    });
    unitShelf.appendChild(card);
  });
  setupBookEl.appendChild(unitShelf);
}

function renderLog() {
  logEl.innerHTML = "";
  state.log.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = entry;
    logEl.appendChild(li);
  });
}

function describeMovement(unit) {
  if (unit.type === "spiderQueen") return "앞/앞대각/좌우/뒤 1칸";
  if (unit.type === "spiderling") return "앞/앞대각/좌우 1칸";
  if (unit.type === "goblinChief") return "앞/앞대각/좌우/뒤 1칸";
  if (unit.type === "goblinCommoner") return "앞/좌우 1칸, 뒤로 불가";
  if (unit.type === "goblinSoldier") return "앞/좌우 1칸, 뒤로 불가";
  if (unit.type === "skeletonSummoner") return "앞/좌우 1칸";
  if (unit.type === "doomExecutor") return "앞/앞대각/좌우/뒤 1칸";
  if (unit.type === "abyssEye") return "앞/좌우 1칸, 뒤로 불가";
  if (unit.type === "demonDeathKnight") return "앞/좌우 1~2칸, 뒤 1칸";
  if (unit.type === "iceLord") return "상하좌우 1칸";
  if (unit.type === "seaWolf") return "앞/앞대각/좌우 1칸, 뒤로 불가";
  if (unit.type === "plagueFrog") return "앞 1~2칸, 좌우 1칸";
  if (unit.type === "yeti") return "앞/좌/우 1칸";
  if (unit.type === "minotaur") return "상하좌우 1칸";
  if (unit.type === "summoner") return "자기 영역 안에서 1칸";
  if (unit.type === "spear") return "앞/좌/우 1칸, 뒤로 불가";
  if (unit.type === "archer") return "앞/앞대각/좌/우 1칸, 뒤로 불가";
  if (unit.type === "knight") return "앞/좌/우 1~2칸, 뒤 1칸";
  if (unit.type === "worm") return "앞/앞대각/좌/우 1칸";
  if (unit.type === "golem") return "상하좌우 1칸";
  if (unit.type === "ghoul") return "앞 1~2칸, 앞대각 1칸";
  if (unit.type === "ogre") return "앞/좌/우 1칸";
  if (unit.type === "plague") return "앞대각/좌/우/뒤 1칸";
  return "-";
}

function describeAttack(unit) {
  if (unit.type === "spiderQueen") return "전방 3칸, 좌우 1칸";
  if (unit.type === "spiderling") return "정면 1칸";
  if (unit.type === "goblinChief") return "전방 3칸, 좌우 1칸";
  if (unit.type === "goblinCommoner") return "정면 1칸";
  if (unit.type === "goblinSoldier") return "정면 1칸";
  if (unit.type === "skeletonSummoner") return "정면 1칸";
  if (unit.type === "doomExecutor") return "전방 3칸, 좌우 1칸";
  if (unit.type === "abyssEye") return "정면 1칸";
  if (unit.type === "demonDeathKnight") return "전방 3칸, 좌우 1칸";
  if (unit.type === "iceLord") return "정면 1~2칸, 앞대각";
  if (unit.type === "seaWolf") return "전방 3칸";
  if (unit.type === "plagueFrog") return "정면 1칸";
  if (unit.type === "yeti") return "전방 3칸";
  if (unit.type === "minotaur") return "전방 3칸, 좌우 1칸";
  if (unit.type === "summoner") return "인접 1칸";
  if (unit.type === "spear") return "정면 1칸";
  if (unit.type === "archer") return "전방 1~2칸, 앞대각, 좌우 2칸";
  if (unit.type === "knight") return "전방 3칸 스플래시";
  if (unit.type === "worm") return "정면 1~2칸";
  if (unit.type === "golem") return "상하좌우 1칸";
  if (unit.type === "ghoul") return "전방 3칸";
  if (unit.type === "ogre") return "근접 6칸";
  if (unit.type === "plague") return "전방 1~2줄 범위";
  return "-";
}

function patternCells(unit, kind) {
  const deltas = kind === "move" ? movementDeltas(unit) : attackDeltas(unit);
  const center = 2;
  return deltas
    .map(([dr, dc]) => ({ row: center + dr, col: center + dc }))
    .filter(({ row, col }) => isInside(row, col));
}

function patternBoard(unit, kind) {
  const cells = new Set(patternCells(unit, kind).map((cell) => cellKey(cell.row, cell.col)));
  const label = kind === "move" ? "이동 범위" : "공격 범위";
  let html = `<div class="pattern-wrap"><strong>${label}</strong><div class="pattern-board ${kind}">`;
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const classes = ["pattern-cell"];
      if (row === 2 && col === 2) classes.push("origin");
      if (cells.has(cellKey(row, col))) classes.push("active");
      html += `<span class="${classes.join(" ")}"></span>`;
    }
  }
  html += "</div></div>";
  return html;
}

function legionInfoRows(owner) {
  const rows = [
    { key: "skeleton", name: "언데드", target: 3, effect: "영웅 제외 우리편 전체 공격 주사위 0 하나를 1로 변경" },
    { key: "corpse", name: "시체", target: 2, effect: "시체 소환 주사위 +1" },
    { key: "beast", name: "야수", target: 2, effect: "야수 유닛이 공격받고 생존 시 30% 확률 반격" },
    { key: "plague", name: "역병", target: 2, effect: "역병 유닛 공격 후 생존 대상에게 1턴 중독" },
    { key: "ice", name: "얼음", target: 2, effect: "얼음 유닛 공격 후 생존 대상에게 1턴 빙결" },
    { key: "summon", name: "소환", target: 2, effect: "소환물 최대 체력 +3" },
    { key: "demon", name: "악마", target: 2, effect: "악마 유닛 공격 시 30% 확률 최종 피해 2배" },
  ];
  return rows.map((row) => ({ ...row, count: legionCount(owner, row.key), active: isLegionActive(owner, row.key) }));
}

function renderLegionInfo(owner) {
  const rows = legionInfoRows(owner);
  const totem = state.selectedTotem ? TOTEMS[state.selectedTotem] : null;
  unitInfoEl.innerHTML = `
    <h2 class="unit-info-title"><span>${ownerLabel(owner)} 군단</span><b>${activeLegionSummary(owner)}</b></h2>
    <div class="unit-info-card compact-info legion-info">
      <dl>
        ${totem ? `<div class="is-active"><dt>공용 ${totem.label}</dt><dd>${totem.effect}</dd></div>` : ""}
        ${rows.map((row) => `
          <div class="${row.active ? "is-active" : ""}">
            <dt>${row.name} ${row.count}/${row.target}</dt>
            <dd>${row.active ? "활성" : "대기"} · ${row.effect}</dd>
          </div>
        `).join("")}
      </dl>
    </div>
  `;
  unitInfoEl.classList.remove("is-hidden");
}

function renderUnitInfo() {
  if (!unitInfoEl) return;
  if (state.inspectedLegionOwner) {
    renderLegionInfo(state.inspectedLegionOwner);
    return;
  }
  const unit = inspectedUnit();
  const corpse = inspectedCorpse();
  if (corpse) {
    const source = UNIT_TYPES[corpse.sourceType];
    unitInfoEl.innerHTML = `
      <h2>시체</h2>
      <div class="unit-info-card compact-info">
        <dl>
          <div><dt>필요</dt><dd>${corpse.target}+</dd></div>
          <div><dt>기회</dt><dd>${corpse.attemptsRemaining ?? 2}회 남음</dd></div>
          <div><dt>소환</dt><dd>${source?.label || "유닛"}</dd></div>
        </dl>
      </div>
    `;
    unitInfoEl.classList.remove("is-hidden");
    return;
  }
  if (!unit) {
    state.inspectedUnitId = null;
    state.inspectedCorpseId = null;
    unitInfoEl.innerHTML = "";
    unitInfoEl.classList.add("is-hidden");
    return;
  }
  const def = UNIT_TYPES[unit.type];
  const gradeLabels = {
    normal: "일반",
    advanced: "고급",
    hero: "영웅",
    special: "소환물",
  };
  const gradeLabel = unit.summonedNoCorpse ? "소환물" : gradeLabels[def.grade] || "왕";
  const legionNames = { skeleton: "언데드", corpse: "시체", beast: "야수", plague: "역병", ice: "얼음", summon: "소환", demon: "악마" };
  const legionTargets = { skeleton: 3, corpse: 2, beast: 2, plague: 2, ice: 2, summon: 2, demon: 2 };
  const legionLabel = legionsOf(unit).length
    ? legionsOf(unit)
      .map((legion) => `${legionNames[legion]} ${legionCount(unit.owner, legion)}/${legionTargets[legion]}${isLegionActive(unit.owner, legion) ? " 활성" : ""}`)
      .join(" / ")
    : "없음";
  unitInfoEl.innerHTML = `
    <h2 class="unit-info-title"><span>${def.label}</span><b>${gradeLabel} HP ${unit.hp}/${unit.maxHp}</b></h2>
    <div class="unit-info-card compact-info">
      <dl>
        <div><dt>군단</dt><dd>${legionLabel}</dd></div>
        ${unit.poisoned ? "<div><dt>상태</dt><dd>중독</dd></div>" : ""}
        ${unit.frozen ? "<div><dt>상태</dt><dd>빙결</dd></div>" : ""}
        <div><dt>공격</dt><dd>${describeAttack(unit)}</dd></div>
        <div><dt>주사위</dt><dd>${diceNumbers(unit.dice)}</dd></div>
      </dl>
      <div class="pattern-section">
        ${patternBoard(unit, "move")}
        ${patternBoard(unit, "attack")}
      </div>
    </div>
  `;
  unitInfoEl.classList.remove("is-hidden");
}

function closeInfoPopup() {
  if (!state.inspectedUnitId && !state.inspectedCorpseId && !state.inspectedLegionOwner) return;
  state.inspectedUnitId = null;
  state.inspectedCorpseId = null;
  state.inspectedLegionOwner = null;
  render();
}

function renderCampaignMap() {
  mapProgress.textContent = campaign.finished
    ? "최종 전투를 돌파했습니다. 원정 완료!"
    : `${campaign.depth + 1}/5 구역 · 불이 켜진 전투를 선택하세요.`;
  campaignRosterEl.innerHTML = `<strong>원정대 ${campaign.roster.length}</strong>`;
  campaign.roster.forEach((type) => {
    const def = UNIT_TYPES[type];
    const progress = campaignProgressFor(type);
    const item = document.createElement("span");
    item.className = "campaign-roster-unit";
    item.innerHTML = `<img src="${def.image}" alt=""><span><b>${def.label}</b><small>HP ${progress.hp}/${def.hp}</small></span>`;
    campaignRosterEl.appendChild(item);
  });

  mapRoute.innerHTML = "";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("route-lines");
  MAP_EDGES.forEach(([fromId, toId]) => {
    const from = MAP_NODES.find((node) => node.id === fromId);
    const to = MAP_NODES.find((node) => node.id === toId);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", from.x);
    line.setAttribute("y1", from.y);
    line.setAttribute("x2", to.x);
    line.setAttribute("y2", to.y);
    if (to.stage <= campaign.depth) line.classList.add("is-reached");
    svg.appendChild(line);
  });
  mapRoute.appendChild(svg);

  MAP_NODES.forEach((node) => {
    const completed = campaign.completed.includes(node.id);
    const available = !campaign.finished && node.stage === campaign.depth;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `map-node${completed ? " is-completed" : ""}${available ? " is-available" : ""}`;
    button.style.left = `${node.x}%`;
    button.style.top = `${node.y}%`;
    button.disabled = !available;
    const preview = UNIT_TYPES[node.enemies[0]];
    button.innerHTML = `
      <span class="map-node-image"><img src="${preview.image}" alt=""></span>
      <strong>${completed ? "완료" : node.label}</strong>
      <small>${node.subtitle}</small>
    `;
    if (available) button.addEventListener("click", () => enterCampaignBattle(node.id));
    mapRoute.appendChild(button);
  });
}

function render() {
  const isStart = state.phase === "start";
  const isMap = state.phase === "map";
  const isBattle = ["setup", "battle"].includes(state.phase);

  startScreen.hidden = !isStart;
  mapScreen.hidden = !isMap;
  battleScreen.hidden = !isBattle;
  battleSidePanel.hidden = !isBattle;

  updateMusicButton();
  if (isStart) {
    return;
  }
  if (isMap) {
    renderCampaignMap();
    return;
  }
  reconcileUnitHealthBonuses();
  phaseText.textContent = activeLegionSummary("player");
  turnText.textContent = state.winner ? `${ownerLabel(state.winner)} 승리` : ownerLabel(state.turn);
  diceText.textContent = activeLegionSummary("enemy");
  const selected = currentUnit();
  attackBtn.disabled = !selected || state.turn === "enemy" || state.phase !== "battle" || !["move", "postMove"].includes(state.mode) || !state.validAttacks.length;
  skipAttackBtn.disabled = !selected || state.turn === "enemy" || state.phase !== "battle" || !["move", "postMove"].includes(state.mode);
  endTurnBtn.disabled = state.turn === "enemy" || state.phase !== "battle" || ["respawn", "summonPlace", "spiderSummonPlace", "goblinSummonPlace", "undeadSummonPlace"].includes(state.mode) || Boolean(state.winner);
  renderBoard();
  renderUnitInfo();
  renderReserve();
  renderLog();
}

attackBtn.addEventListener("click", () => {
  const unit = currentUnit();
  if (!unit) return;
  state.mode = "attack";
  state.validAttacks = legalAttacks(unit);
  addLog("공격 범위가 표시되었습니다.");
  render();
});

skipAttackBtn.addEventListener("click", () => {
  const unit = currentUnit();
  if (!unit) return;
  addLog(`${UNIT_TYPES[unit.type].label} 공격 생략.`);
  finishUnitAction(unit);
});

endTurnBtn.addEventListener("click", () => {
  playSfx("ui");
  endTurn();
});
resetBtn.addEventListener("click", handleResetBtnClick);
newCampaignBtn.addEventListener("click", handleResetBtnClick);
musicBtn.addEventListener("click", toggleBattleMusic);
soundSettingsBtn.addEventListener("click", () => {
  syncAudioControls();
  soundDialog.showModal();
});
musicVolumeRange.addEventListener("input", () => {
  state.musicVolume = Number(musicVolumeRange.value) / 100;
  musicVolumeValue.value = musicVolumeRange.value;
  if (battleMusic) battleMusic.volume = state.musicMuted ? 0 : state.musicVolume;
  saveAudioSettings();
});
sfxVolumeRange.addEventListener("input", () => {
  state.sfxVolume = Number(sfxVolumeRange.value) / 100;
  sfxVolumeValue.value = sfxVolumeRange.value;
  saveAudioSettings();
});
sfxVolumeRange.addEventListener("change", () => playSfx("ui"));
vibrationToggle.addEventListener("change", () => {
  state.vibrationEnabled = vibrationToggle.checked;
  saveAudioSettings();
  if (state.vibrationEnabled && navigator.vibrate) navigator.vibrate(25);
});
rewardDialog.addEventListener("cancel", (event) => event.preventDefault());
rewardContinueBtn.addEventListener("click", () => {
  rewardDialog.close();
  completeCampaignBattle();
});
playerLegionCard.addEventListener("click", () => {
  state.inspectedLegionOwner = "player";
  state.inspectedUnitId = null;
  state.inspectedCorpseId = null;
  render();
});
playerLegionCard.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  state.inspectedLegionOwner = "player";
  state.inspectedUnitId = null;
  state.inspectedCorpseId = null;
  render();
});
document.addEventListener("click", (event) => {
  if (event.target.closest(".cell") || event.target.closest("#unitInfo") || event.target.closest(".status-card")) return;
  closeInfoPopup();
});



function initGameApp() {
  loadAudioSettings();
  
  campaign.depth = 0;
  campaign.roster = ["spear", "archer", "knight"];
  campaign.unitProgress = Object.fromEntries(campaign.roster.map((type) => [type, defaultCampaignProgress(type)]));
  campaign.completed = [];
  campaign.currentNodeId = null;
  campaign.finished = false;
  campaign.availableTotems = [];
  campaign.transitioning = false;
  campaign.rewardState = null;
  
  state.phase = "start";
  state.winner = null;
  state.winnerAnnounced = false;
  state.selectedTotem = null;
  
  const hasSave = hasSavedCampaign();
  continueCampaignBtn.disabled = !hasSave;
  
  render();
}

function handleResetBtnClick() {
  if (confirm("기존 진행 데이터를 삭제하고 새 원정을 시작하시겠습니까?")) {
    deleteSavedCampaign();
    resetCampaign();
    autoSaveCampaign();
    state.phase = "map";
    render();
  }
}

continueCampaignBtn.addEventListener("click", () => {
  const save = loadCampaignSave();
  if (save) {
    campaign.depth = save.depth;
    campaign.roster = save.roster;
    campaign.unitProgress = save.unitProgress;
    campaign.completed = save.completed;
    campaign.currentNodeId = save.currentNodeId;
    campaign.finished = save.finished;
    campaign.availableTotems = save.availableTotems;
    campaign.rewardState = save.rewardState;
    campaign.transitioning = false;
    
    if (campaign.rewardState) {
      restoreRewardScreen();
    } else {
      state.phase = "map";
      render();
    }
  } else {
    resetCampaign();
    autoSaveCampaign();
  }
});

startCampaignBtn.addEventListener("click", () => {
  if (hasSavedCampaign()) {
    if (confirm("기존 진행 데이터를 삭제하고 새 원정을 시작하시겠습니까?")) {
      deleteSavedCampaign();
      resetCampaign();
      autoSaveCampaign();
      state.phase = "map";
      render();
    }
  } else {
    resetCampaign();
    autoSaveCampaign();
    state.phase = "map";
    render();
  }
});

loadAudioSettings();
syncAudioControls();
initGameApp();
