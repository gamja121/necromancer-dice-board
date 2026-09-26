(function (root) {
  "use strict";

  const ROOT = "art/v2-style/ui/";
  const numbers = [1, 2, 3, 4, 5, 6];
  const cards = [
    ...numbers.map((value) => ({ id: `fixed-${value}`, label: `눈금 ${value}`, description: `주사위 눈금 ${value}이 나온다`, values: [value], image: String(value) })),
    { id: "low", label: "작은수", description: "1, 2, 3 중 하나가 나온다", values: [1, 2, 3], image: "low" },
    { id: "high", label: "큰수", description: "4, 5, 6 중 하나가 나온다", values: [4, 5, 6], image: "high" },
    { id: "odd", label: "홀수", description: "1, 3, 5 중 하나가 나온다", values: [1, 3, 5], image: "odd" },
    { id: "even", label: "짝수", description: "2, 4, 6 중 하나가 나온다", values: [2, 4, 6], image: "even" },
    ...numbers.map((value) => ({ id: `exclude-${value}`, label: `제외 ${value}`, description: `${value}을 제외한 눈금이 나온다`, values: numbers.filter((candidate) => candidate !== value), image: `exclude-${value}` })),
    { id: "repeat", label: "반복", description: "직전 주사위 눈금을 한 번 더 적용한다", kind: "repeat", image: "repeat" },
    { id: "echo", label: "효과 재발동", description: "직전 카드의 효과를 한 번 더 발동한다", kind: "echo", image: "echo" }
  ].map((card) => Object.freeze(card));
  const byId = new Map(cards.map((card) => [card.id, card]));

  function choose(values, random = Math.random) {
    const sample = Math.max(0, Math.min(.999999999, Number(random()) || 0));
    return values[Math.floor(sample * values.length)];
  }

  function validRoll(value) {
    return Number.isInteger(value) && value >= 1 && value <= 6;
  }

  function resolve(cardId, state = {}, random = Math.random) {
    const selected = byId.get(cardId);
    if (!selected) return { ok: false, reason: "존재하지 않는 카드입니다." };
    let effect = selected;
    if (selected.kind === "echo") {
      effect = byId.get(state.previousCardId);
      if (!effect) return { ok: false, reason: "재발동할 직전 카드가 없습니다." };
    }
    if (effect.kind === "repeat") {
      if (!validRoll(state.previousRoll)) return { ok: false, reason: "반복할 직전 주사위 눈금이 없습니다." };
      return { ok: true, value: state.previousRoll, selectedCardId: selected.id, effectiveCardId: effect.id, label: selected.label };
    }
    return { ok: true, value: choose(effect.values, random), selectedCardId: selected.id, effectiveCardId: effect.id, label: selected.label };
  }

  function canUse(cardId, state = {}) {
    const card = byId.get(cardId);
    if (!card) return { ok: false, reason: "존재하지 않는 카드입니다." };
    if (card.kind === "repeat" && !validRoll(state.previousRoll)) return { ok: false, reason: "먼저 주사위를 한 번 굴려야 합니다." };
    if (card.kind === "echo") {
      const previous = byId.get(state.previousCardId);
      if (!previous) return { ok: false, reason: "먼저 다른 컨트롤 카드를 사용해야 합니다." };
      if (previous.kind === "repeat" && !validRoll(state.previousRoll)) return { ok: false, reason: "반복할 직전 주사위 눈금이 없습니다." };
    }
    return { ok: true };
  }

  function imagePath(card, locale = "ko") {
    return `${ROOT}dice-control-${locale === "ko" ? "ko-" : ""}${card.image}.png`;
  }

  root.V2DiceControl = Object.freeze({ cards: Object.freeze(cards), resolve, canUse, imagePath });
})(globalThis);
