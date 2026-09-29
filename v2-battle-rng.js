(function (root, factory) {
  "use strict";
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.V2BattleRng = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const VERSION = 1;
  const ALGORITHM = "xorshift32";
  const FALLBACK_SEED = 0x6d2b79f5;

  function normalizeSeed(value) {
    const seed = Number(value) >>> 0;
    return seed || FALLBACK_SEED;
  }

  function createSeed() {
    try {
      const cryptoObject = root && root.crypto;
      if (cryptoObject && typeof cryptoObject.getRandomValues === "function") {
        const values = new Uint32Array(1);
        cryptoObject.getRandomValues(values);
        return normalizeSeed(values[0]);
      }
    } catch (_) {}
    const mixed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
    return normalizeSeed(mixed);
  }

  function create(seed = createSeed()) {
    let state = normalizeSeed(seed);

    function next() {
      let x = state >>> 0;
      x ^= (x << 13) >>> 0;
      x ^= x >>> 17;
      x ^= (x << 5) >>> 0;
      state = x >>> 0;
      return state / 4294967296;
    }

    function snapshot() {
      return { version: VERSION, algorithm: ALGORITHM, state: state >>> 0 };
    }

    return Object.freeze({
      next,
      snapshot,
      value: () => state >>> 0
    });
  }

  function restore(snapshot) {
    if (!snapshot || snapshot.version !== VERSION || snapshot.algorithm !== ALGORITHM) {
      throw new Error("Unsupported battle RNG snapshot");
    }
    if (!Number.isInteger(snapshot.state) || snapshot.state < 0 || snapshot.state > 0xffffffff) {
      throw new Error("Invalid battle RNG state");
    }
    return create(snapshot.state);
  }

  return Object.freeze({
    VERSION,
    ALGORITHM,
    createSeed,
    create,
    restore
  });
});
