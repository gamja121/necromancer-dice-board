(() => {
  "use strict";

  const events = [
    {
      id: "forest_child_01",
      location: "forest",
      locationLabel: "숲",
      title: "오염된 아이",
      art: "art/v2-style/map-test/events/forest.jpg?v=20260927-2",
      once: true,
      conditions: { minContamination: 20, flagsFalse: ["child_event_seen"] },
      text: "숲 깊숙한 곳에서 오염에 잠식된 아이를 발견했다. 아직 의식은 남아 있지만 오래 버티지는 못할 것 같다.",
      choices: [
        {
          id: "save",
          text: "아이를 구한다",
          outcome: "아이를 업고 숲을 빠져나왔다. 마을에서 가족을 찾을 수 있을지도 모른다.",
          setFlags: { child_event_seen: true, child_saved: true },
          nextEvents: ["village_child_parent_01"]
        },
        {
          id: "kill",
          text: "고통이 번지기 전에 끝낸다",
          outcome: "오염의 확산은 막았지만, 아이의 영혼이 쉽게 사라지지는 않았다.",
          setFlags: { child_event_seen: true, child_dead: true },
          nextEvents: ["graveyard_child_spirit_01"]
        },
        {
          id: "leave",
          text: "그대로 두고 떠난다",
          outcome: "숲을 떠나는 동안 뒤에서 낮은 울음소리가 오래 따라왔다.",
          setFlags: { child_event_seen: true, child_abandoned: true },
          addContamination: 2,
          nextEvents: ["forest_child_changed_01"]
        }
      ]
    },
    {
      id: "village_child_parent_01",
      location: "village",
      locationLabel: "마을",
      title: "돌아온 아이",
      art: "art/v2-style/map-test/events/village.jpg?v=20260927-2",
      once: true,
      conditions: { flagsTrue: ["child_saved"], flagsFalse: ["child_parent_resolved"] },
      text: "마을 광장에서 아이를 알아본 부부가 달려온다. 하지만 오염 흔적 때문에 주민들은 가까이 오기를 두려워한다.",
      choices: [
        {
          id: "return",
          text: "아이를 가족에게 돌려보낸다",
          outcome: "가족은 연신 고개를 숙였다. 정화의 나무에 대한 오래된 이야기를 들을 수 있었다.",
          setFlags: { child_parent_resolved: true, purification_clue: true },
          nextEvents: ["altar_child_blessing_01"]
        },
        {
          id: "keep",
          text: "아직 위험하다며 데려간다",
          outcome: "가족은 반발했지만 아이의 상태를 확인할 시간이 생겼다.",
          setFlags: { child_parent_resolved: true, child_under_watch: true }
        }
      ]
    },
    {
      id: "graveyard_child_spirit_01",
      location: "graveyard",
      locationLabel: "공동묘지",
      title: "떠나지 못한 목소리",
      art: "art/v2-style/map-test/events/graveyard.jpg?v=20260927-2",
      once: true,
      conditions: { flagsTrue: ["child_dead"], flagsFalse: ["child_spirit_resolved"] },
      text: "낯익은 작은 그림자가 묘비 사이에 서 있다. 당신을 원망하는지, 도움을 원하는지 알 수 없다.",
      choices: [
        {
          id: "listen",
          text: "[사령술] 영혼의 말을 듣는다",
          requires: { monsterTags: ["skeleton"] },
          roll: { dc: 4, stat: "사령술", successText: "영혼은 오염원의 위치를 알려주고 조용히 사라졌다.", failText: "영혼은 비명을 지르며 흩어졌다." },
          successFlags: { child_spirit_resolved: true, corruption_source_clue: true },
          failFlags: { child_spirit_resolved: true },
          failContamination: 1
        },
        {
          id: "banish",
          text: "강제로 쫓아낸다",
          outcome: "영혼은 사라졌지만 묘지의 공기가 더 차가워졌다.",
          setFlags: { child_spirit_resolved: true },
          addContamination: 1
        }
      ]
    },
    {
      id: "forest_child_changed_01",
      location: "forest",
      locationLabel: "숲",
      title: "변해버린 흔적",
      art: "art/v2-style/map-test/events/forest.jpg?v=20260927-2",
      once: true,
      conditions: { minLoop: 2, flagsTrue: ["child_abandoned"], flagsFalse: ["child_changed_resolved"] },
      text: "전에 아이를 두고 떠났던 장소에 거대한 발톱 자국과 검은 털이 남아 있다. 무언가 숲 안쪽에서 당신을 지켜본다.",
      choices: [
        {
          id: "hunt",
          text: "흔적을 따라간다",
          outcome: "희귀 마물 조우 플래그가 열렸다. 실제 전투 연결은 이후 단계에서 붙일 수 있다.",
          setFlags: { child_changed_resolved: true, rare_child_monster_ready: true }
        },
        {
          id: "retreat",
          text: "추적하지 않는다",
          outcome: "위협을 남겨둔 채 숲에서 물러났다.",
          setFlags: { child_changed_resolved: true },
          addContamination: 2
        }
      ]
    },
    {
      id: "altar_child_blessing_01",
      location: "altar",
      locationLabel: "정화의 나무",
      title: "아이의 축복",
      art: "art/v2-style/map-test/events/altar.jpg?v=20260927-2",
      once: true,
      conditions: { flagsTrue: ["purification_clue"], flagsFalse: ["child_blessing_resolved"] },
      text: "정화의 나무 아래에 아이가 두고 간 작은 장식이 빛난다. 나무의 뿌리가 당신의 선택을 기억하는 듯하다.",
      choices: [
        {
          id: "purify",
          text: "빛을 받아들인다",
          outcome: "정화의 힘이 주변 오염을 밀어낸다.",
          setFlags: { child_blessing_resolved: true },
          addContamination: -3
        },
        {
          id: "deep",
          text: "더 깊은 정화를 시도한다",
          roll: { dc: 5, stat: "의지", successText: "정화가 깊은 곳까지 스며들었다.", failText: "오염이 역류하며 몸을 스쳤다." },
          successFlags: { child_blessing_resolved: true, deep_purification: true },
          successContamination: -5,
          failFlags: { child_blessing_resolved: true },
          failContamination: 1
        }
      ]
    }
  ];

  window.V2EventData = Object.freeze({
    events: Object.freeze(events.map((event) => Object.freeze(event)))
  });
})();