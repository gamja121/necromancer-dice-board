(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.V2RunState = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SAVE_VERSION = 1;
  const DEFAULT_RULES_VERSION = "v2-current";
  const DB_NAME = "necromancer-dice-runs";
  const DB_VERSION = 1;
  const ACTIVE_RUN_KEY = "activeRun";

  const LEGACY_KEYS = Object.freeze({
    roster: "necromancer-map-roster-v2",
    diceCards: "necromancer-map-dice-control-v1",
    brandCards: "necromancer-map-brand-cards-v1",
    contamination: "necromancer-map-contamination-v1",
    mapLayout: "necromancer-map-layout-v2",
    legacyMapLayout: "necromancer-map-layout-v1",
    clearedTiles: "necromancer-map-cleared-monsters-v1",
    worldTreePrayed: "necromancer-map-world-tree-prayed-v1",
    fortuneProphecy: "necromancer-fortune-prophecy-v1",
    graveyardCorpses: "necromancer-map-graveyard-corpses-v1",
    battle: "necromancer-v2-battle-v1",
    contaminationWinPrefix: "necromancer-map-contamination-win-v1:"
  });

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function nowIso(now) {
    if (typeof now === "function") return new Date(now()).toISOString();
    return new Date().toISOString();
  }

  function defaultUuid() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    return "run-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  }

  function idFactory(uuid) {
    return typeof uuid === "function" ? uuid : defaultUuid;
  }

  function createEmptyRun(options = {}) {
    const makeId = idFactory(options.uuid);
    return {
      saveVersion: SAVE_VERSION,
      rulesVersion: options.rulesVersion || DEFAULT_RULES_VERSION,
      runId: options.runId || makeId(),
      revision: 0,
      updatedAt: nowIso(options.now),
      phase: "map-ready",
      currentMap: {
        mapInstanceId: options.mapInstanceId || null,
        regionId: options.regionId || "default",
        lap: 0,
        tiles: [],
        heroIndex: null,
        lapReadyForRefresh: false,
        worldTreePrayed: false,
        fortuneProphecy: { allyAttack: 0, allyHp: 0, allySpeed: 0, enemyAttack: 0, rolls: [] },
        hillScout: { scouted: false, intel: [] }
      },
      contamination: 0,
      ownedMonsters: [],
      party: [],
      diceCards: [],
      brandCards: [],
      graveyardCorpses: [],
      diceContext: {
        previousRoll: null,
        previousEffectiveCardId: null,
        pendingCardInstanceId: null
      },
      movement: null,
      clearedTiles: [],
      eventFlags: {},
      battle: null,
      pendingOperation: null,
      claimedRewards: [],
      appliedOperations: [],
      rngState: null,
      migration: {
        sourceVersion: null,
        backupId: null,
        completed: false,
        warnings: []
      }
    };
  }

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function uniqueStrings(items) {
    if (!Array.isArray(items)) return false;
    const seen = new Set();
    for (const item of items) {
      if (typeof item !== "string" || !item || seen.has(item)) return false;
      seen.add(item);
    }
    return true;
  }

  function validateRunState(state) {
    const errors = [];
    if (!isPlainObject(state)) return { ok: false, errors: ["state:not-object"] };
    if (state.saveVersion !== SAVE_VERSION) errors.push(state.saveVersion > SAVE_VERSION ? "saveVersion:future" : "saveVersion:unsupported");
    if (typeof state.runId !== "string" || !state.runId) errors.push("runId:invalid");
    if (!Number.isInteger(state.revision) || state.revision < 0) errors.push("revision:invalid");
    if (typeof state.updatedAt !== "string" || !state.updatedAt) errors.push("updatedAt:invalid");
    if (typeof state.phase !== "string" || !state.phase) errors.push("phase:invalid");
    if (!Number.isInteger(state.contamination) || state.contamination < 0 || state.contamination > 100) errors.push("contamination:invalid");

    const map = state.currentMap;
    if (!isPlainObject(map)) {
      errors.push("currentMap:invalid");
    } else {
      if (map.heroIndex !== null && (!Number.isInteger(map.heroIndex) || map.heroIndex < 0 || map.heroIndex > 23)) errors.push("currentMap.heroIndex:invalid");
      if (!Array.isArray(map.tiles) || ![0, 24].includes(map.tiles.length)) errors.push("currentMap.tiles:length");
      if (!Number.isInteger(map.lap) || map.lap < 0) errors.push("currentMap.lap:invalid");
      if (typeof map.worldTreePrayed !== "boolean") errors.push("currentMap.worldTreePrayed:invalid");
      if (map.fortuneProphecy != null) {
        const prophecy = map.fortuneProphecy;
        const validProphecy = isPlainObject(prophecy) &&
          ["allyAttack","allyHp","allySpeed","enemyAttack"].every((key) => Number.isInteger(prophecy[key]) && prophecy[key] >= 0) &&
          Array.isArray(prophecy.rolls) && prophecy.rolls.every((value) => Number.isInteger(value) && value >= 1 && value <= 6);
        if (!validProphecy) errors.push("currentMap.fortuneProphecy:invalid");
      }
      if (map.hillScout != null) {
        const scout = map.hillScout;
        const validScout = isPlainObject(scout) && typeof scout.scouted === "boolean" && Array.isArray(scout.intel) &&
          scout.intel.every((entry) => isPlainObject(entry) &&
            Number.isInteger(entry.step) && entry.step >= 1 && entry.step <= 24 &&
            ["monster","rare-monster","boss"].includes(entry.tileType) &&
            Number.isInteger(entry.count) && entry.count >= 1 && entry.count <= 4 &&
            ["normal","advanced","hero"].includes(entry.grade) &&
            typeof entry.legion === "string" && entry.legion);
        if (!validScout) errors.push("currentMap.hillScout:invalid");
      }
    }

    if (!Array.isArray(state.ownedMonsters)) errors.push("ownedMonsters:invalid");
    else {
      const ids = state.ownedMonsters.map((unit) => unit && unit.instanceId);
      if (ids.some((id) => typeof id !== "string" || !id)) errors.push("ownedMonsters:instanceId");
      else if (new Set(ids).size !== ids.length) errors.push("ownedMonsters:duplicate-instanceId");
    }

    if (!Array.isArray(state.diceCards)) errors.push("diceCards:invalid");
    else {
      const ids = state.diceCards.map((card) => card && card.instanceId);
      if (ids.some((id) => typeof id !== "string" || !id)) errors.push("diceCards:instanceId");
      else if (new Set(ids).size !== ids.length) errors.push("diceCards:duplicate-instanceId");
    }

    if (!Array.isArray(state.brandCards)) errors.push("brandCards:invalid");
    else {
      const ids = state.brandCards.map((card) => card && card.instanceId);
      if (ids.some((id) => typeof id !== "string" || !id)) errors.push("brandCards:instanceId");
      else if (new Set(ids).size !== ids.length) errors.push("brandCards:duplicate-instanceId");
    }

    if (!Array.isArray(state.graveyardCorpses)) errors.push("graveyardCorpses:invalid");
    else {
      const ids = state.graveyardCorpses.map((corpse) => corpse && corpse.instanceId);
      if (ids.some((id) => typeof id !== "string" || !id)) errors.push("graveyardCorpses:instanceId");
      else if (new Set(ids).size !== ids.length) errors.push("graveyardCorpses:duplicate-instanceId");
      if (state.graveyardCorpses.some((corpse) =>
        !isPlainObject(corpse) || typeof corpse.slug !== "string" || !corpse.slug ||
        !Array.isArray(corpse.brands))) errors.push("graveyardCorpses:entry");
    }

    if (!uniqueStrings(state.clearedTiles)) errors.push("clearedTiles:invalid");
    if (!Array.isArray(state.claimedRewards)) errors.push("claimedRewards:invalid");
    if (!Array.isArray(state.appliedOperations)) errors.push("appliedOperations:invalid");
    return { ok: errors.length === 0, errors };
  }

  function parseJson(raw, key, warnings) {
    if (raw == null) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      warnings.push("legacy-json-invalid:" + key);
      return null;
    }
  }

  function normalizeMonster(unit, makeId) {
    if (!isPlainObject(unit)) return null;
    const copy = clone(unit);
    if (typeof copy.instanceId !== "string" || !copy.instanceId) copy.instanceId = makeId();
    return copy;
  }

  function legacyBackupId(makeId) {
    return "legacy-" + makeId();
  }

  function convertLegacy(rawLegacy, options = {}) {
    const raw = isPlainObject(rawLegacy) ? rawLegacy : {};
    const makeId = idFactory(options.uuid);
    const warnings = [];
    const errors = [];
    const backupId = options.backupId || legacyBackupId(makeId);
    const state = createEmptyRun({
      uuid: makeId,
      now: options.now,
      rulesVersion: options.rulesVersion,
      regionId: options.regionId || "default"
    });

    const roster = parseJson(raw[LEGACY_KEYS.roster], LEGACY_KEYS.roster, warnings);
    if (roster != null && !Array.isArray(roster)) errors.push("legacy-roster:not-array");
    if (Array.isArray(roster)) {
      state.ownedMonsters = roster.map((unit) => normalizeMonster(unit, makeId)).filter(Boolean);
      const ids = state.ownedMonsters.map((unit) => unit.instanceId);
      if (new Set(ids).size !== ids.length) errors.push("legacy-roster:duplicate-instanceId");
    }

    const dice = parseJson(raw[LEGACY_KEYS.diceCards], LEGACY_KEYS.diceCards, warnings);
    if (dice != null && !Array.isArray(dice)) errors.push("legacy-dice:not-array");
    if (Array.isArray(dice)) {
      state.diceCards = dice.map((cardId) => ({ instanceId: makeId(), cardId }));
      if (state.diceCards.some((card) => typeof card.cardId !== "string" || !card.cardId)) errors.push("legacy-dice:invalid-cardId");
    }

    const brandCards = parseJson(raw[LEGACY_KEYS.brandCards], LEGACY_KEYS.brandCards, warnings);
    if (brandCards != null && !Array.isArray(brandCards)) errors.push("legacy-brand:not-array");
    if (Array.isArray(brandCards)) {
      state.brandCards = brandCards.map((card) => {
        if (!isPlainObject(card)) return null;
        const copy = clone(card);
        return {
          instanceId: typeof copy.id === "string" && copy.id ? copy.id : makeId(),
          brand: clone(copy.brand)
        };
      }).filter(Boolean);
    }

    const graveyard = parseJson(raw[LEGACY_KEYS.graveyardCorpses], LEGACY_KEYS.graveyardCorpses, warnings);
    if (graveyard != null && !Array.isArray(graveyard)) errors.push("legacy-graveyard:not-array");
    if (Array.isArray(graveyard)) {
      state.graveyardCorpses = graveyard.filter((corpse) =>
        isPlainObject(corpse) && typeof corpse.instanceId === "string" && corpse.instanceId &&
        typeof corpse.slug === "string" && corpse.slug && Array.isArray(corpse.brands)
      ).map((corpse) => clone(corpse));
    }

    const contaminationRaw = raw[LEGACY_KEYS.contamination];
    if (contaminationRaw != null) {
      const contamination = Number(contaminationRaw);
      if (Number.isFinite(contamination)) state.contamination = Math.max(0, Math.min(100, Math.round(contamination)));
      else warnings.push("legacy-contamination:invalid");
    }

    const layout = parseJson(raw[LEGACY_KEYS.mapLayout], LEGACY_KEYS.mapLayout, warnings);
    if (layout != null) {
      if (Array.isArray(layout) && layout.length === 24 && layout.every((id) => typeof id === "string" && id)) {
        state.currentMap.mapInstanceId = options.mapInstanceId || makeId();
        state.currentMap.tiles = layout.map((typeId) => ({ tileInstanceId: makeId(), typeId }));
      } else {
        warnings.push("legacy-map-layout:unusable");
      }
    }

    if (Number.isInteger(options.heroIndex) && options.heroIndex >= 0 && options.heroIndex <= 23) {
      state.currentMap.heroIndex = options.heroIndex;
    } else if (raw.heroIndex != null) {
      const legacyHero = Number(raw.heroIndex);
      if (Number.isInteger(legacyHero) && legacyHero >= 0 && legacyHero <= 23) state.currentMap.heroIndex = legacyHero;
      else warnings.push("legacy-heroIndex:invalid");
    }

    state.currentMap.worldTreePrayed = raw[LEGACY_KEYS.worldTreePrayed] === "1";
    const fortune = parseJson(raw[LEGACY_KEYS.fortuneProphecy], LEGACY_KEYS.fortuneProphecy, warnings);
    if (fortune && isPlainObject(fortune)) {
      state.currentMap.fortuneProphecy = {
        allyAttack: Math.max(0, Math.floor(Number(fortune.allyAttack) || 0)),
        allyHp: Math.max(0, Math.floor(Number(fortune.allyHp) || 0)),
        allySpeed: Math.max(0, Math.floor(Number(fortune.allySpeed) || 0)),
        enemyAttack: Math.max(0, Math.floor(Number(fortune.enemyAttack) || 0)),
        rolls: Array.isArray(fortune.rolls) ? fortune.rolls.filter((value) => Number.isInteger(value) && value >= 1 && value <= 6).slice(-24) : []
      };
    }

    const cleared = parseJson(raw[LEGACY_KEYS.clearedTiles], LEGACY_KEYS.clearedTiles, warnings);
    if (Array.isArray(cleared) && state.currentMap.tiles.length === 24) {
      state.clearedTiles = cleared.filter((step) => Number.isInteger(step) && step >= 1 && step <= 24)
        .map((step) => state.currentMap.tiles[step - 1].tileInstanceId);
    } else if (cleared != null && !Array.isArray(cleared)) {
      warnings.push("legacy-cleared:not-array");
    } else if (Array.isArray(cleared) && cleared.length && state.currentMap.tiles.length !== 24) {
      warnings.push("legacy-cleared:layout-missing");
    }

    for (const [key, value] of Object.entries(raw)) {
      if (key.startsWith(LEGACY_KEYS.contaminationWinPrefix) && value === "1") {
        const encounterId = key.slice(LEGACY_KEYS.contaminationWinPrefix.length);
        if (encounterId) state.appliedOperations.push("legacy-contamination-win:" + encounterId);
      }
    }

    if (raw[LEGACY_KEYS.battle] != null) warnings.push("legacy-battle:kept-in-backup-not-auto-linked");
    if (raw[LEGACY_KEYS.legacyMapLayout] != null) warnings.push("legacy-map-v1:kept-in-backup");

    state.migration = {
      sourceVersion: "legacy-split-storage",
      backupId,
      completed: errors.length === 0,
      warnings: [...warnings]
    };

    const validation = validateRunState(state);
    errors.push(...validation.errors);
    return {
      ok: errors.length === 0,
      state,
      warnings,
      errors: [...new Set(errors)],
      backup: {
        backupId,
        kind: "legacy",
        createdAt: nowIso(options.now),
        raw: clone(raw)
      }
    };
  }

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("indexeddb-request-failed"));
    });
  }

  function transactionDone(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error || new Error("indexeddb-transaction-aborted"));
      tx.onerror = () => {};
    });
  }

  function createIndexedDbBackend(indexedDb, options = {}) {
    if (!indexedDb || typeof indexedDb.open !== "function") throw new Error("indexeddb-unavailable");
    const dbName = options.dbName || DB_NAME;

    function open() {
      return new Promise((resolve, reject) => {
        const request = indexedDb.open(dbName, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("runs")) db.createObjectStore("runs", { keyPath: "runId" });
          if (!db.objectStoreNames.contains("metadata")) db.createObjectStore("metadata", { keyPath: "key" });
          if (!db.objectStoreNames.contains("backups")) db.createObjectStore("backups", { keyPath: "backupId" });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("indexeddb-open-failed"));
      });
    }

    async function loadActive() {
      const db = await open();
      try {
        const tx = db.transaction(["metadata", "runs"], "readonly");
        const meta = await requestResult(tx.objectStore("metadata").get(ACTIVE_RUN_KEY));
        const run = meta && meta.runId ? await requestResult(tx.objectStore("runs").get(meta.runId)) : null;
        await transactionDone(tx);
        return run ? clone(run) : null;
      } finally {
        db.close();
      }
    }

    async function loadRun(runId) {
      const db = await open();
      try {
        const tx = db.transaction("runs", "readonly");
        const run = await requestResult(tx.objectStore("runs").get(runId));
        await transactionDone(tx);
        return run ? clone(run) : null;
      } finally {
        db.close();
      }
    }

    async function putBackup(backup) {
      const db = await open();
      try {
        const tx = db.transaction("backups", "readwrite");
        tx.objectStore("backups").put(clone(backup));
        await transactionDone(tx);
        return clone(backup);
      } finally {
        db.close();
      }
    }

    async function getBackup(backupId) {
      const db = await open();
      try {
        const tx = db.transaction("backups", "readonly");
        const backup = await requestResult(tx.objectStore("backups").get(backupId));
        await transactionDone(tx);
        return backup ? clone(backup) : null;
      } finally {
        db.close();
      }
    }

    async function createRun(state) {
      const validation = validateRunState(state);
      if (!validation.ok) throw new Error("runstate-invalid:" + validation.errors.join(","));
      const db = await open();
      try {
        const tx = db.transaction(["runs", "metadata"], "readwrite");
        const runs = tx.objectStore("runs");
        const existing = await requestResult(runs.get(state.runId));
        if (existing) {
          tx.abort();
          throw new Error("runstate-already-exists");
        }
        runs.add(clone(state));
        tx.objectStore("metadata").put({ key: ACTIVE_RUN_KEY, runId: state.runId });
        await transactionDone(tx);
        return clone(state);
      } finally {
        db.close();
      }
    }

    async function commit(nextState, expectedRevision) {
      const validation = validateRunState(nextState);
      if (!validation.ok) return { ok: false, reason: "invalid", errors: validation.errors };
      const db = await open();
      try {
        const tx = db.transaction(["runs", "metadata", "backups"], "readwrite");
        const runs = tx.objectStore("runs");
        const current = await requestResult(runs.get(nextState.runId));
        if (!current) {
          tx.abort();
          return { ok: false, reason: "missing-run" };
        }
        if (current.revision !== expectedRevision) {
          tx.abort();
          return { ok: false, reason: "conflict", currentRevision: current.revision };
        }
        const revisionBackup = {
          backupId: "revision:" + current.runId + ":" + current.revision,
          kind: "revision",
          createdAt: nextState.updatedAt,
          state: clone(current)
        };
        tx.objectStore("backups").put(revisionBackup);
        runs.put(clone(nextState));
        tx.objectStore("metadata").put({ key: ACTIVE_RUN_KEY, runId: nextState.runId });
        await transactionDone(tx);
        return { ok: true, state: clone(nextState) };
      } finally {
        db.close();
      }
    }

    return Object.freeze({ open, loadActive, loadRun, putBackup, getBackup, createRun, commit });
  }

  function createRunStore(backend, options = {}) {
    if (!backend) throw new Error("runstate-backend-required");
    const makeId = idFactory(options.uuid);

    async function migrateLegacy(rawLegacy, migrationOptions = {}) {
      const converted = convertLegacy(rawLegacy, {
        ...migrationOptions,
        uuid: migrationOptions.uuid || makeId,
        now: migrationOptions.now || options.now,
        rulesVersion: migrationOptions.rulesVersion || options.rulesVersion
      });
      if (!converted.ok) return converted;

      await backend.putBackup(converted.backup);
      const verified = await backend.getBackup(converted.backup.backupId);
      if (!verified || JSON.stringify(verified.raw) !== JSON.stringify(converted.backup.raw)) {
        return { ...converted, ok: false, errors: [...converted.errors, "legacy-backup-verification-failed"] };
      }

      await backend.createRun(converted.state);
      return { ...converted, state: clone(converted.state) };
    }

    async function commit(runId, expectedRevision, operationId, reducer) {
      if (typeof operationId !== "string" || !operationId) return { ok: false, reason: "operation-id-required" };
      if (typeof reducer !== "function") return { ok: false, reason: "reducer-required" };
      const current = await backend.loadRun(runId);
      if (!current) return { ok: false, reason: "missing-run" };
      if (current.revision !== expectedRevision) return { ok: false, reason: "conflict", currentRevision: current.revision };

      const prior = current.appliedOperations.find((entry) => {
        if (typeof entry === "string") return entry === operationId;
        return entry && entry.operationId === operationId;
      });
      if (prior) return { ok: true, duplicate: true, state: clone(current), receipt: clone(prior) };

      const candidate = clone(current);
      let reducerResult;
      try {
        reducerResult = reducer(candidate);
      } catch (error) {
        return { ok: false, reason: "reducer-failed", error: String(error && error.message || error) };
      }
      if (reducerResult && reducerResult !== candidate) Object.assign(candidate, reducerResult);
      candidate.revision = current.revision + 1;
      candidate.updatedAt = nowIso(options.now);
      candidate.appliedOperations = [...candidate.appliedOperations, {
        operationId,
        revision: candidate.revision
      }];

      const validation = validateRunState(candidate);
      if (!validation.ok) return { ok: false, reason: "invalid", errors: validation.errors };
      return backend.commit(candidate, expectedRevision);
    }

    return Object.freeze({
      loadActive: () => backend.loadActive(),
      loadRun: (runId) => backend.loadRun(runId),
      migrateLegacy,
      commit,
      getBackup: (backupId) => backend.getBackup(backupId)
    });
  }

  function collectLegacyStorage(sessionStorageLike, localStorageLike) {
    const raw = {};
    function read(storage, key) {
      if (!storage || typeof storage.getItem !== "function") return;
      const value = storage.getItem(key);
      if (value !== null) raw[key] = value;
    }
    [
      LEGACY_KEYS.roster,
      LEGACY_KEYS.diceCards,
      LEGACY_KEYS.brandCards,
      LEGACY_KEYS.contamination,
      LEGACY_KEYS.mapLayout,
      LEGACY_KEYS.legacyMapLayout,
      LEGACY_KEYS.clearedTiles,
      LEGACY_KEYS.worldTreePrayed
    ].forEach((key) => read(sessionStorageLike, key));
    read(localStorageLike, LEGACY_KEYS.battle);

    if (sessionStorageLike && Number.isInteger(sessionStorageLike.length) && typeof sessionStorageLike.key === "function") {
      for (let index = 0; index < sessionStorageLike.length; index += 1) {
        const key = sessionStorageLike.key(index);
        if (typeof key === "string" && key.startsWith(LEGACY_KEYS.contaminationWinPrefix)) read(sessionStorageLike, key);
      }
    }
    return raw;
  }

  return Object.freeze({
    SAVE_VERSION,
    DEFAULT_RULES_VERSION,
    DB_NAME,
    DB_VERSION,
    LEGACY_KEYS,
    createEmptyRun,
    validateRunState,
    convertLegacy,
    collectLegacyStorage,
    createIndexedDbBackend,
    createRunStore
  });
});
