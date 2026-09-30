(function (root) {
  "use strict";

  const Core = root.V2RunState;
  if (!Core) {
    root.V2RunStateRuntime = Object.freeze({
      available: false,
      bootstrap: async () => null,
      snapshot: () => null,
      flush: async () => null
    });
    return;
  }

  const backend = Core.createIndexedDbBackend(root.indexedDB);
  const store = Core.createRunStore(backend);
  let current = null;
  let readyPromise = null;
  let queue = Promise.resolve();
  let operationCounter = 0;

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function opId(prefix) {
    operationCounter += 1;
    const id = root.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${operationCounter.toString(36)}`;
    return `${prefix || "run"}:${id}`;
  }

  function legacyBrandCards(state) {
    return (state?.brandCards || []).map((card) => ({
      id: card.instanceId,
      brand: clone(card.brand)
    }));
  }

  function clearedSteps(state) {
    const tiles = state?.currentMap?.tiles || [];
    const cleared = new Set(state?.clearedTiles || []);
    const steps = [];
    tiles.forEach((tile, index) => {
      if (cleared.has(tile.tileInstanceId)) steps.push(index + 1);
    });
    return steps;
  }

  function projectLegacy(state = current) {
    if (!state || typeof root.sessionStorage === "undefined") return;
    const K = Core.LEGACY_KEYS;
    try {
      root.sessionStorage.setItem(K.roster, JSON.stringify(state.ownedMonsters || []));
      root.sessionStorage.setItem(K.diceCards, JSON.stringify((state.diceCards || []).map((card) => card.cardId)));
      root.sessionStorage.setItem(K.brandCards, JSON.stringify(legacyBrandCards(state)));
      root.sessionStorage.setItem(K.graveyardCorpses, JSON.stringify(state.graveyardCorpses || []));
      root.sessionStorage.setItem(K.contamination, String(state.contamination || 0));
      if (state.currentMap?.tiles?.length === 24) {
        root.sessionStorage.setItem(K.mapLayout, JSON.stringify(state.currentMap.tiles.map((tile) => tile.typeId)));
      }
      root.sessionStorage.setItem(K.clearedTiles, JSON.stringify(clearedSteps(state)));
      if (state.currentMap?.worldTreePrayed) root.sessionStorage.setItem(K.worldTreePrayed, "1");
      else root.sessionStorage.removeItem(K.worldTreePrayed);
      const prophecy = state.currentMap?.fortuneProphecy;
      const hasProphecy = prophecy && ["allyAttack","allyHp","allySpeed","enemyAttack"].some((key) => Number(prophecy[key]) > 0);
      if (hasProphecy) root.sessionStorage.setItem(K.fortuneProphecy, JSON.stringify(prophecy));
      else root.sessionStorage.removeItem(K.fortuneProphecy);
    } catch (_) {}
  }

  async function bootstrap() {
    if (readyPromise) return readyPromise;
    readyPromise = (async () => {
      current = await store.loadActive();
      if (current && !Array.isArray(current.graveyardCorpses)) current.graveyardCorpses = [];
      if (current?.currentMap && !current.currentMap.fortuneProphecy) {
        current.currentMap.fortuneProphecy = { allyAttack: 0, allyHp: 0, allySpeed: 0, enemyAttack: 0, rolls: [] };
      }
      if (!current) {
        const raw = Core.collectLegacyStorage(root.sessionStorage, root.localStorage);
        const migrated = await store.migrateLegacy(raw, {
          regionId: new URLSearchParams(root.location?.search || "").get("map") || "default"
        });
        if (!migrated.ok) throw new Error("runstate-migration-failed:" + migrated.errors.join(","));
        current = migrated.state;
      }
      projectLegacy(current);
      return clone(current);
    })().catch((error) => {
      console.warn("원정 세이브 초기화 실패", error);
      current = null;
      return null;
    });
    return readyPromise;
  }

  function snapshot() {
    return clone(current);
  }

  function commitExact(operationId, reducer) {
    queue = queue.then(async () => {
      if (!current) return { ok: false, reason: "runtime-unavailable" };
      const result = await store.commit(current.runId, current.revision, operationId, reducer);
      if (result.ok) {
        current = result.state;
        projectLegacy(current);
      } else {
        const latest = await store.loadRun(current.runId);
        if (latest) {
          current = latest;
          projectLegacy(current);
        }
        console.warn("원정 세이브 커밋 실패", operationId, result);
      }
      return result;
    });
    return queue;
  }

  function commit(prefix, reducer) {
    return commitExact(opId(prefix), reducer);
  }

  function replaceOwnedMonsters(monsters, prefix = "roster") {
    const next = clone(monsters || []);
    return commit(prefix, (draft) => { draft.ownedMonsters = next; });
  }

  function replaceDiceCards(cardIds, prefix = "dice-cards") {
    const existing = new Map((current?.diceCards || []).map((card) => [card.instanceId, card]));
    const poolByType = new Map();
    for (const card of existing.values()) {
      if (!poolByType.has(card.cardId)) poolByType.set(card.cardId, []);
      poolByType.get(card.cardId).push(card);
    }
    const next = (cardIds || []).map((cardId) => {
      const reuse = poolByType.get(cardId)?.shift();
      return reuse ? clone(reuse) : { instanceId: opId("dice-card"), cardId };
    });
    return commit(prefix, (draft) => { draft.diceCards = next; });
  }

  function replaceBrandCards(cards, prefix = "brand-cards") {
    const next = (cards || []).map((card) => ({
      instanceId: card.id || card.instanceId,
      brand: clone(card.brand)
    }));
    return commit(prefix, (draft) => { draft.brandCards = next; });
  }

  function setContamination(value, prefix = "contamination") {
    const next = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    return commit(prefix, (draft) => { draft.contamination = next; });
  }

  function setMapLayout(typeIds, options = {}) {
    const ids = Array.isArray(typeIds) ? typeIds.slice() : [];
    return commit(options.prefix || "map-layout", (draft) => {
      const previous = draft.currentMap?.tiles || [];
      const same = previous.length === ids.length && previous.every((tile, index) => tile.typeId === ids[index]);
      const tiles = same ? previous : ids.map((typeId) => ({ tileInstanceId: opId("tile"), typeId }));
      draft.currentMap = {
        ...(draft.currentMap || {}),
        mapInstanceId: same && draft.currentMap?.mapInstanceId ? draft.currentMap.mapInstanceId : opId("map"),
        regionId: options.regionId || draft.currentMap?.regionId || "default",
        lap: Number.isInteger(options.lap) ? options.lap : (draft.currentMap?.lap || 0),
        tiles,
        heroIndex: Number.isInteger(options.heroIndex) ? options.heroIndex : draft.currentMap?.heroIndex ?? null,
        lapReadyForRefresh: Boolean(options.lapReadyForRefresh),
        worldTreePrayed: Boolean(options.worldTreePrayed)
      };
      if (!same) draft.clearedTiles = [];
    });
  }

  function setBattleCheckpoint(checkpoint, prefix = "battle-checkpoint") {
    const next = clone(checkpoint);
    return commit(prefix, (draft) => {
      draft.battle = next;
      draft.phase = "battle";
    });
  }

  function clearBattleCheckpoint(nextPhase = "map-ready", prefix = "battle-checkpoint-clear") {
    return commit(prefix, (draft) => {
      draft.battle = null;
      draft.phase = nextPhase;
    });
  }

  function setMapProgress(options = {}) {
    return commit(options.prefix || "map-progress", (draft) => {
      if (!draft.currentMap) return;
      if (Number.isInteger(options.heroIndex)) draft.currentMap.heroIndex = options.heroIndex;
      if (typeof options.lapReadyForRefresh === "boolean") draft.currentMap.lapReadyForRefresh = options.lapReadyForRefresh;
      if (typeof options.worldTreePrayed === "boolean") draft.currentMap.worldTreePrayed = options.worldTreePrayed;
      if (options.fortuneProphecy && typeof options.fortuneProphecy === "object") {
        draft.currentMap.fortuneProphecy = clone(options.fortuneProphecy);
      }
      if (Number.isInteger(options.previousRoll) || options.previousRoll === null) draft.diceContext.previousRoll = options.previousRoll;
      if (typeof options.previousEffectiveCardId === "string" || options.previousEffectiveCardId === null) {
        draft.diceContext.previousEffectiveCardId = options.previousEffectiveCardId;
      }
      if (typeof options.pendingCardInstanceId === "string" || options.pendingCardInstanceId === null) {
        draft.diceContext.pendingCardInstanceId = options.pendingCardInstanceId;
      }
    });
  }

  function setClearedSteps(steps, prefix = "cleared-tiles") {
    const wanted = new Set((steps || []).filter((step) => Number.isInteger(step) && step >= 1 && step <= 24));
    return commit(prefix, (draft) => {
      const tiles = draft.currentMap?.tiles || [];
      draft.clearedTiles = tiles
        .map((tile, index) => wanted.has(index + 1) ? tile.tileInstanceId : null)
        .filter(Boolean);
    });
  }

  function applyBattleOutcome(options = {}) {
    const encounterId = String(options.encounterId || "");
    if (!encounterId) return Promise.resolve({ ok: false, reason: "encounter-id-required" });
    const roster = clone(options.ownedMonsters || []);
    const deadMonsters = clone(options.deadMonsters || []);
    const step = Number(options.clearedStep);
    return commitExact("battle-outcome:" + encounterId, (draft) => {
      draft.ownedMonsters = roster;
      if (!Array.isArray(draft.graveyardCorpses)) draft.graveyardCorpses = [];
      const corpseIds = new Set(draft.graveyardCorpses.map((corpse) => corpse.instanceId));
      for (const corpse of deadMonsters) {
        if (!corpse?.instanceId || corpseIds.has(corpse.instanceId)) continue;
        draft.graveyardCorpses.push(clone(corpse));
        corpseIds.add(corpse.instanceId);
      }
      if (options.won) {
        draft.contamination = Math.max(0, (Number(draft.contamination) || 0) - 1);
        if (Number.isInteger(step) && step >= 1 && step <= 24) {
          const tile = draft.currentMap?.tiles?.[step - 1];
          if (tile?.tileInstanceId && !draft.clearedTiles.includes(tile.tileInstanceId)) {
            draft.clearedTiles.push(tile.tileInstanceId);
          }
        }
      }
      draft.battle = null;
      draft.phase = "capture";
    });
  }

  function atomicRosterAndBrands(monsters, brands, prefix = "inheritance") {
    const roster = clone(monsters || []);
    const cards = (brands || []).map((card) => ({
      instanceId: card.id || card.instanceId,
      brand: clone(card.brand)
    }));
    return commit(prefix, (draft) => {
      draft.ownedMonsters = roster;
      draft.brandCards = cards;
    });
  }

  function atomicMonsterShopTrade(monsters, diceCardIds, brands, prefix = "monster-shop") {
    const roster = clone(monsters || []);
    const diceIds = clone(diceCardIds || []);
    const cards = (brands || []).map((card) => ({
      instanceId: card.id || card.instanceId,
      brand: clone(card.brand)
    }));
    return commit(prefix, (draft) => {
      draft.ownedMonsters = roster;
      const existing = new Map((draft.diceCards || []).map((card) => [card.instanceId, card]));
      const poolByType = new Map();
      for (const card of existing.values()) {
        if (!poolByType.has(card.cardId)) poolByType.set(card.cardId, []);
        poolByType.get(card.cardId).push(card);
      }
      draft.diceCards = diceIds.map((cardId) => {
        const reuse = poolByType.get(cardId)?.shift();
        return reuse ? clone(reuse) : { instanceId: opId("dice-card"), cardId };
      });
      draft.brandCards = cards;
    });
  }

  function atomicGraveyardExtraction(corpses, brands, prefix = "graveyard-extract") {
    const nextCorpses = clone(corpses || []);
    const cards = (brands || []).map((card) => ({
      instanceId: card.id || card.instanceId,
      brand: clone(card.brand)
    }));
    return commit(prefix, (draft) => {
      draft.graveyardCorpses = nextCorpses;
      draft.brandCards = cards;
    });
  }

  async function ensureFreshDefaults(defaults = {}) {
    await bootstrap();
    if (!current || current.revision !== 0) return snapshot();
    const noRoster = !current.ownedMonsters?.length;
    const noDice = !current.diceCards?.length;
    if (!noRoster && !noDice) return snapshot();
    await commit("fresh-defaults", (draft) => {
      if (noRoster && Array.isArray(defaults.ownedMonsters)) draft.ownedMonsters = clone(defaults.ownedMonsters);
      if (noDice && Array.isArray(defaults.diceCardIds)) {
        draft.diceCards = defaults.diceCardIds.map((cardId) => ({ instanceId: opId("dice-card"), cardId }));
      }
      if (defaults.regionId) draft.currentMap.regionId = defaults.regionId;
      if (Number.isInteger(defaults.heroIndex)) draft.currentMap.heroIndex = defaults.heroIndex;
    });
    return snapshot();
  }

  function flush() {
    return queue;
  }

  root.V2RunStateRuntime = Object.freeze({
    available: true,
    bootstrap,
    ensureFreshDefaults,
    snapshot,
    flush,
    replaceOwnedMonsters,
    replaceDiceCards,
    replaceBrandCards,
    setContamination,
    setMapLayout,
    setMapProgress,
    setBattleCheckpoint,
    clearBattleCheckpoint,
    setClearedSteps,
    atomicRosterAndBrands,
    atomicMonsterShopTrade,
    atomicGraveyardExtraction,
    applyBattleOutcome,
    commitExact,
    projectLegacy
  });
})(globalThis);
