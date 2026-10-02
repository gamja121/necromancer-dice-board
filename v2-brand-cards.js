(function(root) {
  "use strict";
  const R = typeof module !== "undefined" && module.exports ? require("./v2-rules.js") : root.V2Rules;
  const STORAGE_KEY = "necromancer-map-brand-cards-v1";
  const IMAGE_PATH = "art/v2-style/ui/brand-card.png?v=4";

  function createId() {
    if (root.crypto?.randomUUID) return `brand-card-${root.crypto.randomUUID()}`;
    return `brand-card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function blessingOnly(brand) {
    if (!brand || !R?.validateBrand?.(brand)) return null;
    const clean = { type: brand.type, bless: [...brand.bless], curse: [] };
    return clean.bless.length && R.validateBrand(clean) ? clean : null;
  }

  function validateCard(card) {
    return Boolean(card && typeof card.id === "string" && card.id && blessingOnly(card.brand));
  }

  function create(rng = Math.random) {
    const types = Object.keys(R?.definitions || {});
    if (!types.length) throw Error("Brand definitions are unavailable");
    const type = types[Math.floor(rng() * types.length)];
    const generated = R.brand(type, rng);
    const brand = blessingOnly(generated);
    if (!brand) throw Error("Invalid generated brand card");
    return { id: createId(), brand };
  }

  function load() {
    const run = root.V2RunStateRuntime?.snapshot?.();
    if (run && Array.isArray(run.brandCards)) {
      return run.brandCards.map((card) => ({ id: card.instanceId, brand: blessingOnly(card.brand) }))
        .filter((card) => card.brand && validateCard(card));
    }
    let saved = [];
    try {
      if (typeof sessionStorage !== "undefined") {
        const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
        if (Array.isArray(parsed)) saved = parsed.filter(validateCard);
      }
    } catch (_) {}
    return saved.map((card) => ({ id: card.id, brand: blessingOnly(card.brand) }))
      .filter((card) => card.brand && validateCard(card));
  }

  function save(cards) {
    const valid = Array.isArray(cards) ? cards.filter(validateCard) : [];
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
      return true;
    } catch (_) { return false; }
  }

  function add(card) {
    if (!validateCard(card)) return false;
    const cards = load();
    const copy = JSON.parse(JSON.stringify(card));
    if (cards.some((item) => item.id === copy.id)) copy.id = createId();
    cards.push(copy);
    return save(cards) ? copy : false;
  }

  function remove(cardId) {
    const cards = load();
    const next = cards.filter((card) => card.id !== cardId);
    if (next.length === cards.length) return false;
    return save(next);
  }

  async function addAsync(card) {
    if (!validateCard(card)) return false;
    const cards = load();
    const copy = JSON.parse(JSON.stringify(card));
    if (cards.some((item) => item.id === copy.id)) copy.id = createId();
    cards.push(copy);
    if (root.V2RunStateRuntime?.available) {
      const result = await root.V2RunStateRuntime.replaceBrandCards(cards, "brand-card-add");
      return result?.ok ? copy : false;
    }
    return save(cards) ? copy : false;
  }

  async function removeAsync(cardId) {
    const cards = load();
    const next = cards.filter((card) => card.id !== cardId);
    if (next.length === cards.length) return false;
    if (root.V2RunStateRuntime?.available) {
      const result = await root.V2RunStateRuntime.replaceBrandCards(next, "brand-card-remove");
      return Boolean(result?.ok);
    }
    return save(next);
  }

  function label(card) {
    if (!validateCard(card)) return "알 수 없는 낙인";
    const definition = R.definitions[card.brand.type];
    const name = (definition?.name || card.brand.type).replace(/의 낙인$/, "");
    const blessing = `축복 ${card.brand.bless.join(", ")}`;
    return card.brand.curse.length
      ? `${name} · ${blessing} · 저주 ${card.brand.curse.join(", ")}`
      : `${name} · ${blessing}`;
  }

  const api = Object.freeze({
    STORAGE_KEY, IMAGE_PATH, create, validateCard, load, save, add, remove, addAsync, removeAsync, label,
    imagePath: () => IMAGE_PATH
  });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.V2BrandCards = api;
})(globalThis);
