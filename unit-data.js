/**
 * unit-data.js
 * 네크로멘서 십이장기 공용 유닛 데이터 및 WFC 적 자동 생성 메타데이터 레지스트리
 */

var UNIT_TYPES = {
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
  hellMantis: {
    label: "지옥 사마귀",
    legion: "insect",
    grade: "normal",
    hp: 2,
    dice: [0, 0, 1, 1, 2, 2],
    image: "assets/hell-mantis.jpg",
  },
  scorpionKnight: {
    label: "전갈 기사",
    legion: "insect",
    grade: "advanced",
    hp: 4,
    dice: [0, 1, 1, 2, 2, 3],
    image: "assets/scorpion-knight.jpg",
  },
  ancientTreant: {
    label: "고목 정령",
    legion: ["plant", "element"],
    grade: "advanced",
    hp: 5,
    dice: [0, 0, 1, 1, 2, 3],
    image: "assets/ancient-treant.jpg",
  },
  stoneGolem: {
    label: "암석 골렘",
    legion: "element",
    grade: "advanced",
    hp: 6,
    dice: [0, 0, 1, 2, 2, 3],
    image: "assets/stone-golem.jpg",
  },
  kraken: {
    label: "크라켄",
    legion: "ice",
    grade: "hero",
    hp: 5,
    dice: [0, 1, 2, 2, 3, 3],
    image: "assets/kraken.jpg",
  },
};

var ENCOUNTER_UNIT_META = {
  spear: {
    cost: 2.0,
    minStage: 1,
    roles: ["frontline"],
    themes: ["undead"],
    maxCopies: 2,
    weight: 100,
    directSpawn: true,
  },
  archer: {
    cost: 2.0,
    minStage: 1,
    roles: ["ranged"],
    themes: ["undead"],
    maxCopies: 2,
    weight: 100,
    directSpawn: true,
  },
  worm: {
    cost: 2.5,
    minStage: 1,
    roles: ["frontline"],
    themes: ["corpse"],
    maxCopies: 2,
    weight: 100,
    directSpawn: true,
  },
  ghoul: {
    cost: 2.5,
    minStage: 1,
    roles: ["frontline"],
    themes: ["corpse"],
    maxCopies: 2,
    weight: 100,
    directSpawn: true,
  },
  plagueFrog: {
    cost: 2.0,
    minStage: 1,
    roles: ["status"],
    themes: ["plague"],
    maxCopies: 2,
    weight: 100,
    directSpawn: true,
  },
  yeti: {
    cost: 2.5,
    minStage: 1,
    roles: ["frontline", "status"],
    themes: ["beast", "ice"],
    maxCopies: 2,
    weight: 100,
    directSpawn: true,
  },
  seaWolf: {
    cost: 2.0,
    minStage: 1,
    roles: ["frontline"],
    themes: ["ice"],
    maxCopies: 2,
    weight: 100,
    directSpawn: true,
  },
  goblinSoldier: {
    cost: 2.0,
    minStage: 1,
    roles: ["frontline"],
    themes: ["beast"],
    maxCopies: 2,
    weight: 100,
    directSpawn: true,
  },
  abyssEye: {
    cost: 2.5,
    minStage: 2,
    roles: ["ranged", "status"],
    themes: ["ice", "demon"],
    maxCopies: 2,
    weight: 90,
    directSpawn: true,
  },
  knight: {
    cost: 4.0,
    minStage: 1,
    roles: ["frontline", "heavy"],
    themes: ["undead"],
    maxCopies: 1,
    weight: 45,
    directSpawn: true,
    bossAnchor: true,
  },
  plague: {
    cost: 4.0,
    minStage: 2,
    roles: ["status", "ranged"],
    themes: ["plague"],
    maxCopies: 1,
    weight: 45,
    directSpawn: true,
  },
  minotaur: {
    cost: 4.5,
    minStage: 2,
    roles: ["frontline", "heavy"],
    themes: ["beast"],
    maxCopies: 1,
    weight: 45,
    directSpawn: true,
  },
  iceLord: {
    cost: 4.5,
    minStage: 2,
    roles: ["status", "frontline"],
    themes: ["ice"],
    maxCopies: 1,
    weight: 45,
    directSpawn: true,
    bossAnchor: true,
  },
  doomExecutor: {
    cost: 4.5,
    minStage: 2,
    roles: ["burst", "frontline"],
    themes: ["demon"],
    maxCopies: 1,
    weight: 45,
    directSpawn: true,
  },
  golem: {
    cost: 5.0,
    minStage: 2,
    roles: ["tank", "heavy"],
    themes: ["corpse"],
    maxCopies: 1,
    weight: 40,
    directSpawn: true,
  },
  ogre: {
    cost: 5.5,
    minStage: 2,
    roles: ["tank", "heavy"],
    themes: ["beast"],
    maxCopies: 1,
    weight: 40,
    directSpawn: true,
    bossAnchor: true,
  },
  spiderQueen: {
    cost: 5.5,
    minStage: 2,
    roles: ["summoner", "status"],
    themes: ["summon"],
    maxCopies: 1,
    weight: 15,
    directSpawn: true,
    bossAnchor: true,
  },
  goblinChief: {
    cost: 5.5,
    minStage: 2,
    roles: ["summoner", "frontline"],
    themes: ["beast", "summon"],
    maxCopies: 1,
    weight: 15,
    directSpawn: true,
    bossAnchor: true,
  },
  skeletonSummoner: {
    cost: 5.5,
    minStage: 2,
    roles: ["summoner"],
    themes: ["undead", "summon"],
    maxCopies: 1,
    weight: 15,
    directSpawn: true,
    bossAnchor: true,
  },
  demonDeathKnight: {
    cost: 6.0,
    minStage: 3,
    roles: ["burst", "heavy"],
    themes: ["demon"],
    maxCopies: 1,
    weight: 15,
    directSpawn: true,
    bossAnchor: true,
  },
  hellMantis: {
    cost: 2.0,
    minStage: 1,
    roles: ["frontline"],
    themes: ["insect"],
    maxCopies: 2,
    weight: 100,
    directSpawn: true,
  },
  scorpionKnight: {
    cost: 4.0,
    minStage: 2,
    roles: ["frontline", "heavy"],
    themes: ["insect"],
    maxCopies: 1,
    weight: 45,
    directSpawn: true,
  },
  ancientTreant: {
    cost: 4.5,
    minStage: 2,
    roles: ["frontline", "tank"],
    themes: ["plant", "element"],
    maxCopies: 1,
    weight: 45,
    directSpawn: true,
  },
  stoneGolem: {
    cost: 5.0,
    minStage: 2,
    roles: ["frontline", "tank", "heavy"],
    themes: ["element"],
    maxCopies: 1,
    weight: 40,
    directSpawn: true,
  },
  kraken: {
    cost: 5.5,
    minStage: 2,
    roles: ["ranged", "status"],
    themes: ["ice"],
    maxCopies: 1,
    weight: 15,
    directSpawn: true,
  },
  spiderling: {
    cost: 1.0,
    minStage: 99,
    roles: ["special"],
    themes: ["summon"],
    maxCopies: 0,
    weight: 0,
    directSpawn: false,
  },
  goblinCommoner: {
    cost: 1.0,
    minStage: 99,
    roles: ["special"],
    themes: ["summon"],
    maxCopies: 0,
    weight: 0,
    directSpawn: false,
  },
};

/**
 * 유닛 레지스트리 무결성 검증 함수
 */
function validateUnitRegistry(unitTypes, metaData) {
  const types = unitTypes || (typeof UNIT_TYPES !== "undefined" ? UNIT_TYPES : {});
  const meta = metaData || (typeof ENCOUNTER_UNIT_META !== "undefined" ? ENCOUNTER_UNIT_META : {});

  const errors = [];
  const validLegions = new Set(["skeleton", "corpse", "beast", "plague", "ice", "summon", "demon", "insect", "plant", "element"]);

  for (const key of Object.keys(meta)) {
    if (!types[key]) {
      errors.push(`ENCOUNTER_UNIT_META key '${key}' does not exist in UNIT_TYPES.`);
    }
  }

  for (const key of Object.keys(types)) {
    if (key === "summoner") continue;
    if (!meta[key]) {
      errors.push(`UNIT_TYPES key '${key}' missing from ENCOUNTER_UNIT_META.`);
    }
    const unit = types[key];
    const legions = Array.isArray(unit.legion) ? unit.legion : [unit.legion];
    if (!legions.length || legions.some((legion) => !validLegions.has(legion))) {
      errors.push(`UNIT_TYPES key '${key}' has an invalid legion.`);
    }
    if (!Number.isInteger(unit.hp) || unit.hp < 1) {
      errors.push(`UNIT_TYPES key '${key}' must have positive integer hp.`);
    }
    if (!Array.isArray(unit.dice) || unit.dice.length !== 6 || unit.dice.some((face) => !Number.isInteger(face) || face < 0 || face > 3) || !unit.dice.includes(0)) {
      errors.push(`UNIT_TYPES key '${key}' must have six 0-3 dice faces including zero.`);
    }
  }

  if (meta.spiderling && meta.spiderling.directSpawn !== false) {
    errors.push(`spiderling must have directSpawn: false.`);
  }
  if (meta.goblinCommoner && meta.goblinCommoner.directSpawn !== false) {
    errors.push(`goblinCommoner must have directSpawn: false.`);
  }

  if (meta.summoner) {
    errors.push(`summoner must not be included in ENCOUNTER_UNIT_META.`);
  }

  if (errors.length > 0) {
    throw new Error(`Unit Registry Validation Failed:\n- ` + errors.join("\n- "));
  }

  return true;
}

if (typeof window !== "undefined") {
  window.UNIT_TYPES = UNIT_TYPES;
  window.ENCOUNTER_UNIT_META = ENCOUNTER_UNIT_META;
  window.validateUnitRegistry = validateUnitRegistry;
}
if (typeof globalThis !== "undefined") {
  globalThis.UNIT_TYPES = UNIT_TYPES;
  globalThis.ENCOUNTER_UNIT_META = ENCOUNTER_UNIT_META;
  globalThis.validateUnitRegistry = validateUnitRegistry;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    UNIT_TYPES,
    ENCOUNTER_UNIT_META,
    validateUnitRegistry,
  };
}
