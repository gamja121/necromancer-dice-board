const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "game.js"), "utf8");
const validationStart = source.indexOf("function validateDice(");
const validationEnd = source.indexOf("function campaignProgressFor(");

assert.notEqual(validationStart, -1, "validateDice()를 찾을 수 없습니다.");
assert.notEqual(validationEnd, -1, "검증 함수 블록의 끝을 찾을 수 없습니다.");

const storage = new Map();
const context = {
  console,
  CAMPAIGN_SAVE_KEY: "necromancer-campaign-save-v1",
  CAMPAIGN_SAVE_VERSION: 1,
  MAP_NODES: [{ id: "first" }, { id: "throne" }],
  TOTEMS: { beast: {}, ice: {}, undead: {} },
  UNIT_TYPES: {
    spear: { hp: 2, dice: [0, 1, 1, 1, 1, 2] },
    archer: { hp: 2, dice: [0, 0, 1, 1, 2, 2] },
    knight: { hp: 4, dice: [0, 1, 1, 2, 2, 3] },
    summoner: { hp: 5, dice: [0, 1, 1, 1, 2, 2] },
  },
  localStorage: {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
  },
};

vm.createContext(context);
vm.runInContext(
  `${source.slice(validationStart, validationEnd)}\nthis.loadCampaignSaveForTest = loadCampaignSave;`,
  context,
);

const saveKey = "necromancer-campaign-save-v1";

function baseSave(overrides = {}) {
  return {
    version: 1,
    depth: 2,
    roster: ["spear", "archer", "knight"],
    unitProgress: {
      spear: { hp: 2, dice: [0, 1, 1, 1, 1, 2] },
      archer: { hp: 2, dice: [0, 0, 1, 1, 2, 2] },
      knight: { hp: 4, dice: [0, 1, 1, 2, 2, 3] },
    },
    completed: ["first"],
    currentNodeId: null,
    finished: false,
    availableTotems: [],
    rewardState: null,
    ...overrides,
  };
}

function load(save) {
  storage.clear();
  if (save !== undefined) storage.set(saveKey, JSON.stringify(save));
  return context.loadCampaignSaveForTest();
}

assert.equal(load(), null, "세이브가 없으면 null이어야 합니다.");
assert.equal(load(baseSave()).depth, 2, "중간 원정을 불러와야 합니다.");
assert.equal(
  load(baseSave({ depth: 5, finished: true, completed: ["first", "throne"] })).finished,
  true,
  "완료된 원정을 불러와야 합니다.",
);
assert.equal(load(baseSave({ depth: 5, finished: false })), null, "미완료 depth 5를 거부해야 합니다.");
assert.equal(load(baseSave({ depth: 4, finished: true })), null, "완료 depth 4를 거부해야 합니다.");
assert.equal(load(baseSave({ depth: 5, finished: "false" })), null, "문자열 finished를 거부해야 합니다.");
assert.equal(load(baseSave({ version: 99 })), null, "구버전 세이브를 거부해야 합니다.");

const repaired = load(baseSave({
  unitProgress: {
    spear: { hp: 99, dice: [1, 1, 1, 1, 1, 1] },
    archer: { hp: 2, dice: [0, 0, 1, 1, 2, 2] },
    knight: { hp: 4, dice: [0, 1, 1, 2, 2, 3] },
  },
}));
assert.deepEqual(Array.from(repaired.unitProgress.spear.dice), [0, 1, 1, 1, 1, 2]);
assert.equal(repaired.unitProgress.spear.hp, 2, "잘못된 체력을 기본값으로 복구해야 합니다.");

console.log("Campaign save validation: all tests passed.");
