/**
 * event-data.js
 * 네크로멘서 십이장기 - 14종 랜덤 선택지 이벤트 데이터 모듈
 * (DOM 의존성 없음)
 */

(function (exports) {
  "use strict";

  const EVENTS = [
    {
      id: "ancient_altar",
      stages: [1, 2, 3],
      title: "피묻은 고대 제단",
      paragraphs: [
        "버려진 신전 터 한가운데 검붉은 피로 물든 어두운 석조 제단이 솟아 있습니다.",
        "제단 표면에 새겨진 주술 문양이 희미한 붉은빛을 발산하며 영혼의 생명력을 갈구합니다."
      ],
      choices: [
        {
          id: "sacrifice_hp",
          label: "선혈 바치기 (아군 1명 체력 1 희생, 토템 1개 획득)",
          resultText: "제단에 피를 흘리자 강렬한 흑마법의 기운이 솟구치며 신비로운 토템이 손에 쥐어집니다.",
          effect: { type: "sacrifice_hp_for_totem", hpCost: 1 }
        },
        {
          id: "pray_altar",
          label: "기도 올리기 (전체 아군 체력 1 회복)",
          resultText: "제단에 감도는 은은한 영혼의 온기가 전 군단의 상처를 보듬어 줍니다.",
          effect: { type: "heal_all", amount: 1 }
        },
        {
          id: "ignore_altar",
          label: "지나가기 (무시)",
          resultText: "불길한 기운을 뒤로하고 제단을 지나쳐 계속 이동합니다.",
          effect: { type: "none" }
        }
      ]
    },
    {
      id: "wandering_gravekeeper",
      stages: [1, 2],
      title: "방랑하는 무덤지기",
      paragraphs: [
        "녹슨 등불을 든 늙은 무덤지기가 흙투성이 수레를 끌며 다가옵니다.",
        "\"죽은 자의 유품에 관심이 있으신가, 아니면 군단의 무기를 다듬어 드릴까?\""
      ],
      choices: [
        {
          id: "buy_totem",
          label: "유품 수색하기 (랜덤 토템 1개 획득)",
          resultText: "무덤지기의 수레 깊은 곳에서 오래된 영혼의 유물이 발굴되었습니다.",
          effect: { type: "totem" }
        },
        {
          id: "sharpen_weapon",
          label: "무기 강화 (무작위 아군 주사위 눈 1개 강화)",
          resultText: "무덤지기의 숫돌 작업으로 군단 유닛의 주사위 위력이 한층 강해졌습니다.",
          effect: { type: "upgrade_die" }
        },
        {
          id: "decline_keeper",
          label: "거절하고 지나가기",
          resultText: "무덤지기에게 인사하고 조용히 길을 떠납니다.",
          effect: { type: "none" }
        }
      ]
    },
    {
      id: "cursed_fountain",
      stages: [1, 2, 3],
      title: "저주받은 영혼의 샘",
      paragraphs: [
        "짙은 안개 속에서 청록색 빛을 뿜는 고요한 샘물을 발견했습니다.",
        "물밑에서 수많은 영혼들의 낮게 읊조리는 소리가 들려옵니다."
      ],
      choices: [
        {
          id: "drink_deep",
          label: "깊게 마시기 (무작위 아군 최대 체력 +1)",
          resultText: "샘물을 마시자 아군 유닛의 뼈와 육신이 영혼의 정수로 더욱 튼튼해졌습니다.",
          effect: { type: "max_hp", amount: 1 }
        },
        {
          id: "splash_roster",
          label: "군단 축복하기 (전체 아군 체력 1 회복)",
          resultText: "샘물을 군단 전원에 뿌리자 지친 유닛들의 상처가 씻은 듯 나았습니다.",
          effect: { type: "heal_all", amount: 1 }
        }
      ]
    },
    {
      id: "abandoned_armory",
      stages: [1, 2],
      title: "버려진 군사 무기고",
      paragraphs: [
        "오래전 전쟁에서 방치된 어두운 무기고 공터입니다.",
        "녹슨 갑주와 부러진 칼날 사이에서 여전히 마력이 깃든 보물상자와 방어구가 보입니다."
      ],
      choices: [
        {
          id: "search_chest",
          label: "보물상자 열기 (토템 1개 획득)",
          resultText: "잠긴 궤짝을 부수자 찬란한 빛을 발하는 마법 토템을 발견했습니다.",
          effect: { type: "totem" }
        },
        {
          id: "strengthen_armor",
          label: "갑주 보강 (아군 1명 최대 체력 +1)",
          resultText: "무기고의 튼튼한 철판을 이식하여 유닛의 최대 체력이 증가했습니다.",
          effect: { type: "max_hp", amount: 1 }
        }
      ]
    },
    {
      id: "whispering_golem",
      stages: [2, 3],
      title: "속삭이는 바위 골렘",
      paragraphs: [
        "길가에 거대한 바위 거인이 멈춰 서 있습니다.",
        "가슴 중앙의 룬 문자가 번뜩이며 심오한 지혜의 질문을 건네옵니다."
      ],
      choices: [
        {
          id: "accept_rune",
          label: "룬의 가르침 받기 (주사위 눈 1개 강화)",
          resultText: "골렘의 룬 문자가 군단의 주사위에 깃들어 강력한 숫자로 다듬어졌습니다.",
          effect: { type: "upgrade_die" }
        },
        {
          id: "rest_near_golem",
          label: "골렘 그늘에서 휴식 (전체 체력 1 회복)",
          resultText: "골렘이 만들어 준 거대한 그늘 아래에서 군단이 안전하게 안식을 취했습니다.",
          effect: { type: "heal_all", amount: 1 }
        }
      ]
    },
    {
      id: "bone_collector",
      stages: [1, 2, 3],
      title: "뼈 수집가 데스몬드",
      paragraphs: [
        "거대한 해골 마차를 끄는 기이한 상인이 군단을 막아서며 미소를 짓습니다.",
        "\"희귀한 뼈 모형이나 고대 토템과 교환하지 않겠나?\""
      ],
      choices: [
        {
          id: "trade_bone",
          label: "뼈 연마술 받기 (아군 1명 주사위 눈 1개 강화)",
          resultText: "데스몬드의 정밀한 뼈 연마 기술로 주사위의 성능이 강화되었습니다.",
          effect: { type: "upgrade_die" }
        },
        {
          id: "trade_totem",
          label: "희귀 토템 매입 (토템 1개 획득)",
          resultText: "데스몬드의 마차 깊숙한 곳에서 전설적인 토템을 손에 넣었습니다.",
          effect: { type: "totem" }
        }
      ]
    },
    {
      id: "plague_mist",
      stages: [2, 3],
      title: "독무의 계곡",
      paragraphs: [
        "녹색 독무가 자욱하게 깔린 위험한 계곡 입구입니다.",
        "돌아서 가면 길을 돌아가야 하지만, 정면 돌파하면 강력한 마력 정수를 얻을 수도 있습니다."
      ],
      choices: [
        {
          id: "brave_mist",
          label: "정면 돌파 (아군 1명 체력 1 손실, 무작위 아군 최대 체력 +2)",
          resultText: "독무의 지독한 시련을 견뎌낸 유닛이 강인한 생체 마력을 얻어 최대 체력이 폭발적으로 증가했습니다.",
          effect: { type: "risk_max_hp", hpCost: 1, maxHpGain: 2 }
        },
        {
          id: "bypass_mist",
          label: "우회하기 (무탈하게 통과)",
          resultText: "안전한 산길로 돌아가 피해 없이 독무 계곡을 벗어났습니다.",
          effect: { type: "none" }
        }
      ]
    },
    {
      id: "soul_forge",
      stages: [2, 3],
      title: "언데드 영혼 대장간",
      paragraphs: [
        "푸른 영혼의 불꽃이 솟구치는 거대한 대장간입니다.",
        "망령 대장장이가 망치를 들고 군단의 장비를 재제련할 준비를 하고 있습니다."
      ],
      choices: [
        {
          id: "reforge_dice",
          label: "주사위 재제련 (주사위 눈 1개 강화)",
          resultText: "영혼의 불꽃 속에서 주사위가 단단하게 단조되어 새로운 힘을 얻었습니다.",
          effect: { type: "upgrade_die" }
        },
        {
          id: "reforge_totem",
          label: "영혼 불꽃 유물 융합 (토템 1개 획득)",
          resultText: "대장간의 영혼 정수를 응축하여 묵직한 영혼 토템을 완성했습니다.",
          effect: { type: "totem" }
        }
      ]
    },
    {
      id: "frozen_monument",
      stages: [3],
      title: "빙결의 영웅 비석",
      paragraphs: [
        "영원히 돋아난 얼음 속에 고대 영웅의 시신과 장비가 봉인되어 있습니다.",
        "차가운 냉기 사이로 고대의 권능이 울려 퍼집니다."
      ],
      choices: [
        {
          id: "thaw_monument",
          label: "얼음 해제 (무작위 아군 최대 체력 +1 & 주사위 눈 1개 강화)",
          resultText: "비석의 봉인을 해제하자 흘러나온 고대의 냉기 마력이 아군 유닛을 극도로 강화시켰습니다.",
          effect: { type: "hero_buff" }
        },
        {
          id: "absorb_chill",
          label: "냉기 흡수 (전체 아군 체력 1 회복)",
          resultText: "비석의 맑은 정수를 군단 전체가 흡수하여 체력을 회복했습니다.",
          effect: { type: "heal_all", amount: 1 }
        }
      ]
    },
    {
      id: "mimic_nest",
      stages: [1, 2, 3],
      title: "수상한 의문의 궤짝",
      paragraphs: [
        "길가 한가운데 금빛 광채를 뿜는 화려한 궤짝이 덩그러니 놓여 있습니다.",
        "궤짝 덮개가 아주 미세하게 숨을 쉬듯 들썩이는 것 같기도 합니다."
      ],
      choices: [
        {
          id: "open_mimic",
          label: "과감하게 과짝 열기 (토템 획득 또는 아군 1명 체력 1 손실)",
          resultText: "궤짝 속의 영혼 유물을 성공적으로 갈고리로 낚아채 토템을 얻었습니다!",
          effect: { type: "totem" }
        },
        {
          id: "pass_mimic",
          label: "의심하고 지나치기",
          resultText: "함정일지도 모르는 궤짝을 건드리지 않고 신중하게 길을 이어갑니다.",
          effect: { type: "none" }
        }
      ]
    },
    {
      id: "demon_contract",
      stages: [2, 3],
      title: "피의 악마 계약서",
      paragraphs: [
        "어둠 속에서 붉은 눈빛의 악마 계약자가 나타나 칠흑 같은 계약서를 내밀어 옵니다.",
        "\"대가 없는 힘은 없다. 너의 생명력을 조금 내놓는다면 최고의 보상을 주지.\""
      ],
      choices: [
        {
          id: "sign_contract",
          label: "계약 체결 (아군 1명 체력 1 손실, 무작위 아군 주사위 눈 2개 강화)",
          resultText: "핏빛 서명을 남기자 검은 악마의 마력이 유닛의 주사위를 파괴적으로 강화했습니다.",
          effect: { type: "demon_boost" }
        },
        {
          id: "refuse_contract",
          label: "계약 거절",
          resultText: "악마의 간사한 제안을 단칼에 거절하고 돌아섭니다.",
          effect: { type: "none" }
        }
      ]
    },
    {
      id: "celestial_meteor",
      stages: [1, 2, 3],
      title: "떨어진 운석 파편",
      paragraphs: [
        "하늘에서 떨어진 운석이 깊은 구덩이를 파고 은은한 보랏빛 파동을 뿜어내고 있습니다.",
        "신비로운 별의 정수가 주위에 가득합니다."
      ],
      choices: [
        {
          id: "touch_meteor",
          label: "운석 파편 접촉 (전체 아군 최대 체력 +1)",
          resultText: "운석의 보랏빛 마력이 군단 전체에 스며들어 모두의 생명력이 상승했습니다.",
          effect: { type: "max_hp_all", amount: 1 }
        },
        {
          id: "mine_fragment",
          label: "파편 채굴 (토템 1개 획득)",
          resultText: "운석 파편을 가공하여 신비한 정수가 담긴 토템을 제작했습니다.",
          effect: { type: "totem" }
        }
      ]
    },
    {
      id: "shadow_library",
      stages: [2, 3],
      title: "그림자 서고",
      paragraphs: [
        "지하 깊은 곳에 은밀히 숨겨진 금서들이 가득한 그림자 서고입니다.",
        "금지된 흑마법 서적들이 둥둥 떠다니며 비밀을 펼쳐 보여줍니다."
      ],
      choices: [
        {
          id: "read_forbidden_book",
          label: "금서 읽기 (주사위 눈 1개 강화 & 최대 체력 +1)",
          resultText: "금서에 적힌 고대 흑마법 주문을 습득하여 능력이 비약적으로 상승했습니다.",
          effect: { type: "hero_buff" }
        },
        {
          id: "search_scroll",
          label: "토템 주문서 탐색 (토템 1개 획득)",
          resultText: "서고 구석에서 강력한 마법 토템이 봉인된 양피지를 획득했습니다.",
          effect: { type: "totem" }
        }
      ]
    },
    {
      id: "wandering_spirits",
      stages: [1, 2, 3],
      title: "방황하는 위령의 정원",
      paragraphs: [
        "전쟁으로 억울하게 죽은 영혼들이 모여 부유하는 안식의 정원입니다.",
        "영혼들의 평온한 은총이 공간 전체를 감싸고 있습니다."
      ],
      choices: [
        {
          id: "bless_spirits",
          label: "영혼 성불하기 (전체 아군 체력 2 회복)",
          resultText: "영혼들을 성불시켜 주자 감사의 마음으로 군단의 모든 상처를 완벽히 치유해 주었습니다.",
          effect: { type: "heal_all", amount: 2 }
        },
        {
          id: "absorb_spirits",
          label: "영혼 정수 수확 (토템 1개 획득)",
          resultText: "떠도는 영혼 정수를 영혼 구체로 응축하여 새로운 토템을 획득했습니다.",
          effect: { type: "totem" }
        }
      ]
    }
  ];

  function getEventsForStage(stageIndex) {
    const stageNum = stageIndex + 1;
    return EVENTS.filter(e => e.stages.includes(stageNum));
  }

  function getRandomEvent(stageIndex, rngFunc = Math.random) {
    const pool = getEventsForStage(stageIndex);
    if (pool.length === 0) return EVENTS[0];
    const idx = Math.floor(rngFunc() * pool.length);
    return pool[idx];
  }

  exports.EVENTS = EVENTS;
  exports.getEventsForStage = getEventsForStage;
  exports.getRandomEvent = getRandomEvent;

})(typeof exports !== "undefined" ? exports : (window.EventData = {}));
