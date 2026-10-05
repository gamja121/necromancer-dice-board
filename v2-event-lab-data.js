(() => {
  "use strict";

  const events = [
    Object.freeze({
      id: "graveyard_child_ambush_lab_01",
      tags: Object.freeze(["사건", "공동묘지", "습격받는아이"]),
      location: "공동묘지",
      title: "습격받는 아이",
      description: "묘비 사이에서 아이가 뒷걸음친다. 바로 뒤, 구울이 몸을 일으킨다.",
      dialogue: Object.freeze({
        speaker: "아이",
        text: "…도와주세요!"
      }),
      choices: Object.freeze([
        Object.freeze({
          id: "protect",
          text: "아이를 구한다",
          outcome: "아이를 구하기 위해 구울 앞을 막아선다."
        }),
        Object.freeze({
          id: "leave",
          text: "지나친다",
          outcome: "아이의 비명이 뒤에서 끊긴다. 당신은 뒤돌아보지 않고 공동묘지를 빠져나간다."
        })
      ])
    })
  ];

  window.V2EventLabData = Object.freeze({
    events: Object.freeze(events)
  });
})();
