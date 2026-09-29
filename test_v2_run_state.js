"use strict";

const assert = require("node:assert/strict");
const RunState = require("./v2-run-state.js");

function sequenceIds(prefix = "id") {
  let index = 0;
  return () => prefix + "-" + (++index);
}

function makeLegacy() {
  const K = RunState.LEGACY_KEYS;
  return {
    [K.roster]: JSON.stringify([
      { instanceId: "monster-a", slug: "skeleton-spear", hp: 12, maxHp: 12, attack: 4, speed: 2, brands: [] },
      { instanceId: "monster-b", slug: "skeleton-archer", hp: 8, maxHp: 8, attack: 5, speed: 3, brands: [] }
    ]),
    [K.diceCards]: JSON.stringify(["reroll", "high"]),
    [K.brandCards]: JSON.stringify([
      { id: "brand-card-a", brand: { type: "critical", bless: [3], curse: [] } }
    ]),
    [K.contamination]: "27",
    [K.mapLayout]: JSON.stringify(Array.from({ length: 24 }, (_, index) => index === 3 ? "rare-monster" : "basic")),
    [K.clearedTiles]: JSON.stringify([4]),
    [K.worldTreePrayed]: "1",
    [K.contaminationWinPrefix + "encounter-a"]: "1",
    [K.battle]: JSON.stringify({ phase: "complete", state: { legacy: true } })
  };
}

function createMemoryBackend() {
  const runs = new Map();
  const backups = new Map();
  let activeRunId = null;
  return {
    async loadActive() {
      return activeRunId ? JSON.parse(JSON.stringify(runs.get(activeRunId))) : null;
    },
    async loadRun(runId) {
      const state = runs.get(runId);
      return state ? JSON.parse(JSON.stringify(state)) : null;
    },
    async putBackup(backup) {
      backups.set(backup.backupId, JSON.parse(JSON.stringify(backup)));
      return backup;
    },
    async getBackup(backupId) {
      const backup = backups.get(backupId);
      return backup ? JSON.parse(JSON.stringify(backup)) : null;
    },
    async createRun(state) {
      if (runs.has(state.runId)) throw new Error("runstate-already-exists");
      runs.set(state.runId, JSON.parse(JSON.stringify(state)));
      activeRunId = state.runId;
      return state;
    },
    async commit(nextState, expectedRevision) {
      const current = runs.get(nextState.runId);
      if (!current) return { ok: false, reason: "missing-run" };
      if (current.revision !== expectedRevision) return { ok: false, reason: "conflict", currentRevision: current.revision };
      backups.set("revision:" + current.runId + ":" + current.revision, {
        backupId: "revision:" + current.runId + ":" + current.revision,
        kind: "revision",
        state: JSON.parse(JSON.stringify(current))
      });
      runs.set(nextState.runId, JSON.parse(JSON.stringify(nextState)));
      activeRunId = nextState.runId;
      return { ok: true, state: JSON.parse(JSON.stringify(nextState)) };
    }
  };
}

(async () => {
  const ids = sequenceIds("migrate");
  const legacy = makeLegacy();
  const converted = RunState.convertLegacy(legacy, {
    uuid: ids,
    now: () => Date.UTC(2026, 8, 29, 10, 30, 0),
    rulesVersion: "test-rules"
  });

  assert.equal(converted.ok, true, converted.errors.join(", "));
  assert.equal(converted.state.saveVersion, 1);
  assert.equal(converted.state.rulesVersion, "test-rules");
  assert.equal(converted.state.contamination, 27);
  assert.equal(converted.state.ownedMonsters.length, 2);
  assert.deepEqual(converted.state.ownedMonsters.map((unit) => unit.instanceId), ["monster-a", "monster-b"]);
  assert.deepEqual(converted.state.diceCards.map((card) => card.cardId), ["reroll", "high"]);
  assert.equal(new Set(converted.state.diceCards.map((card) => card.instanceId)).size, 2);
  assert.equal(converted.state.brandCards[0].instanceId, "brand-card-a");
  assert.deepEqual(converted.state.brandCards[0].brand, { type: "critical", bless: [3], curse: [] });
  assert.equal(converted.state.currentMap.tiles.length, 24);
  assert.equal(converted.state.currentMap.tiles[3].typeId, "rare-monster");
  assert.equal(converted.state.clearedTiles.length, 1);
  assert.equal(converted.state.clearedTiles[0], converted.state.currentMap.tiles[3].tileInstanceId);
  assert.equal(converted.state.currentMap.worldTreePrayed, true);
  assert(converted.state.appliedOperations.includes("legacy-contamination-win:encounter-a"));
  assert(converted.warnings.includes("legacy-battle:kept-in-backup-not-auto-linked"));
  assert.deepEqual(converted.backup.raw, legacy, "Legacy backup must preserve exact scoped key/value data.");
  assert.equal(RunState.validateRunState(converted.state).ok, true);

  const badDuplicate = makeLegacy();
  const duplicateRoster = JSON.parse(badDuplicate[RunState.LEGACY_KEYS.roster]);
  duplicateRoster[1].instanceId = duplicateRoster[0].instanceId;
  badDuplicate[RunState.LEGACY_KEYS.roster] = JSON.stringify(duplicateRoster);
  const duplicateResult = RunState.convertLegacy(badDuplicate, { uuid: sequenceIds("dup") });
  assert.equal(duplicateResult.ok, false);
  assert(duplicateResult.errors.includes("legacy-roster:duplicate-instanceId"), "Ambiguous duplicate monster IDs must block migration.");

  const broken = makeLegacy();
  broken[RunState.LEGACY_KEYS.diceCards] = "{broken";
  const brokenResult = RunState.convertLegacy(broken, { uuid: sequenceIds("broken") });
  assert(brokenResult.warnings.some((warning) => warning.includes("legacy-json-invalid:")), "Broken legacy JSON must be reported, not silently invented.");

  const storeBackend = createMemoryBackend();
  const store = RunState.createRunStore(storeBackend, {
    uuid: sequenceIds("store"),
    now: () => Date.UTC(2026, 8, 29, 11, 0, 0),
    rulesVersion: "test-rules"
  });
  const migrated = await store.migrateLegacy(makeLegacy(), {
    uuid: sequenceIds("store-migrate"),
    now: () => Date.UTC(2026, 8, 29, 11, 0, 0)
  });
  assert.equal(migrated.ok, true);
  const runId = migrated.state.runId;
  const initial = await store.loadRun(runId);
  assert.equal(initial.revision, 0);

  const first = await store.commit(runId, 0, "op:test-contamination", (draft) => {
    draft.contamination = 28;
  });
  assert.equal(first.ok, true);
  assert.equal(first.state.revision, 1);
  assert.equal(first.state.contamination, 28);

  const duplicate = await store.commit(runId, 1, "op:test-contamination", (draft) => {
    draft.contamination = 99;
  });
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.state.contamination, 28, "Same operation ID must not apply twice.");

  const conflict = await store.commit(runId, 0, "op:stale-tab", (draft) => {
    draft.contamination = 50;
  });
  assert.equal(conflict.ok, false);
  assert.equal(conflict.reason, "conflict");
  assert.equal(conflict.currentRevision, 1);

  const invalid = await store.commit(runId, 1, "op:invalid-state", (draft) => {
    draft.contamination = 101;
  });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.reason, "invalid");
  const afterInvalid = await store.loadRun(runId);
  assert.equal(afterInvalid.revision, 1);
  assert.equal(afterInvalid.contamination, 28, "Invalid commit must leave the previous good revision untouched.");

  const revisionBackup = await storeBackend.getBackup("revision:" + runId + ":0");
  assert(revisionBackup && revisionBackup.state.revision === 0, "Successful commit must preserve the previous revision.");

  const storage = {
    data: makeLegacy(),
    get length() { return Object.keys(this.data).length; },
    key(index) { return Object.keys(this.data)[index] || null; },
    getItem(key) { return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : null; }
  };
  const collected = RunState.collectLegacyStorage(storage, storage);
  assert.equal(collected[RunState.LEGACY_KEYS.roster], storage.data[RunState.LEGACY_KEYS.roster]);
  assert.equal(collected[RunState.LEGACY_KEYS.contaminationWinPrefix + "encounter-a"], "1");

  console.log("PASS: RunState schema, legacy migration, backup, idempotency and revision conflict checks");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
