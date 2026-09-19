(function(root) {
  'use strict';
  // Authoritative 2026-09 design. Numeric stats are before legion/passive bonuses.
  const rows = [
    ['death-knight','데스 나이트',14,3,3,'hero','demon','critical healing','undying cold weak'],
    ['skeleton-spear','해골 병사',10,2,2,'normal','skeleton','vampire counter','initiative feast'],
    ['skeleton-archer','해골 궁수',8,3,2,'normal','skeleton','combo lightspeed','initiative undying'],
    ['skeleton-cavalry','해골 기사',12,3,2,'advanced','skeleton','critical guard','undying bone',.5,'speed',3],
    ['grave-worm','역병 벌레',10,2,3,'normal','plague insect','poison critical','weak initiative'],
    ['flesh-golem','살점 골렘',16,2,1,'advanced','corpse plague','poison healing','grudge late feast'],
    ['ghoul','구울',10,2,2,'normal','corpse','guard counter','bone cold'],
    ['boulder-ogre','오우거',14,3,2,'advanced','beast','guard counter','feast weak'],
    ['plague-doctor','역병술사',10,2,4,'advanced','plague','poison combo','weak initiative cold'],
    ['plague-frog','역병 개구리',9,2,4,'normal','plague','poison vampire','bone weak',.5,'attack',1],
    ['hydra','히드라',20,3,3,'hero','plague demon','critical vampire','grudge pack'],
    ['minotaur','미노타우루스',14,3,1,'advanced','beast','vampire lightspeed','late initiative'],
    ['yeti','설인',11,2,3,'normal','beast ice','freeze lightspeed','cold bone'],
    ['ice-lord','얼음 군주',12,3,5,'advanced','ice','freeze combo','weak feast'],
    ['sea-wolf','바다늑대',9,2,4,'normal','ice','freeze healing','cold weak'],
    ['spider-knight','거미 여왕',16,3,1,'hero','summon insect','summon healing','soul',1],
    ['spiderling','새끼거미',6,1,5,'special','summon','','',0],
    ['goblin-chief','고블린 족장',16,2,5,'hero','beast summon','summon critical','soul pack',1],
    ['goblin-commoner','평민 고블린',10,1,1,'special','summon beast','','',0],
    ['goblin-soldier','고블린 병사',9,2,4,'normal','beast','lightspeed critical','feast cold'],
    ['grave-priest','해골 소환사',13,3,4,'hero','skeleton summon','summon vampire','soul',1],
    ['doom-executor','흑각 악마',14,3,2,'advanced','demon','lightspeed guard','late grudge'],
    ['abyss-eye','외눈 괴수',8,2,3,'normal','ice demon','freeze summon','undying feast'],
    ['hell-mantis','지옥 사마귀',8,2,5,'normal','insect','healing counter','feast weak'],
    ['abyss-claw-hunter','심연 집게사냥꾼',13,2,5,'advanced','insect plague','healing poison','bone undying'],
    ['corpse-slime','시체 슬라임',12,2,1,'normal','corpse','lightspeed combo','late bone'],
    ['scorpion-knight','전갈 기사',8,3,1,'normal','insect','combo counter','feast initiative'],
    ['ancient-treant','숲의 장로',14,3,1,'advanced','plant element','guard healing','grudge late'],
    ['stone-golem','암석 골렘',16,3,2,'advanced','element','guard summon','bone feast'],
    ['kraken','크라켄',16,3,1,'hero','ice','freeze combo','weak grudge'],
    ['crystal-devourer','식인식물',16,2,2,'hero','plant summon','counter vampire','soul undying',1],
    ['guardian-seed','씨앗',6,0,1,'special','plant summon','','',0],
    ['raging-treant','광폭 고목',14,2,1,'advanced','plant','guard healing','late undying'],
    ['cerberus','케르베로스',12,3,4,'advanced','beast demon','counter summon','grudge cold'],
    ['mushroom-soldier','버섯 병사',8,2,4,'normal','plant plague','poison lightspeed','initiative cold'],
    ['goblin-rider','고블린 라이더',9,2,5,'normal','beast','combo vampire','bone cold'],
    ['abyss-harpy','심연 하피',12,3,5,'advanced','demon','critical counter','feast cold'],
    ['orc-warrior','오크 전사',14,3,3,'advanced','beast','lightspeed guard','initiative grudge'],
    ['bone-golem','뼈 골렘',15,3,2,'advanced','skeleton element','lightspeed vampire','late undying'],
    ['forest-fairy','픽시',10,3,4,'advanced','plant element','healing lightspeed','bone pack'],
    ['mummy-guardian','미이라',12,2,2,'normal','corpse','summon vampire','undying late'],
    ['soul-reaper','리치',13,3,5,'hero','skeleton corpse','combo critical','initiative grudge'],
    ['bone-hound','시체 사냥개',8,2,4,'normal','corpse','summon combo','undying bone'],
    ['mimic','미믹',13,3,2,'advanced','demon','summon guard','late initiative'],
    ['ice-princess','얼음 여왕',13,3,3,'advanced','ice element','freeze summon','weak pack'],
    ['siren','세이렌',14,3,1,'advanced','ice demon','freeze counter','grudge late']
  ];
  const split = s => s ? s.split(' ') : [];
  const units = Object.fromEntries(rows.map(([slug,name,hp,attack,speed,grade,legions,brands,passives,chance=.5,bonus='hp',amount=2]) => [slug,{slug,name,hp,attack,speed,grade,legions:split(legions),brands:split(brands),passives:split(passives),chance,bonus,amount}]));
  const passives = {
    initiative:['선제권','첫 라운드 최우선 선공'], undying:['불사귀','전투당 1회 치명상을 체력 1로 버팀'],
    bone:['뼈 덧대기','공격·반격 피해 -1, 최소 1'], weak:['약점 찌르기','디버프 대상 공격 피해 +1'],
    pack:['무리 우두머리','자신 포함 공유 군단의 생존 마물 3마리 이상이면 공격력 +1 (1~4번 슬롯, 중복 제외)'],
    soul:['영혼 소환','군단 처리 후 5번 슬롯이 비면 체력 1을 소모해 고유 소환물 생성'],
    grudge:['피의 원한','적에게 체력 피해를 받을 때마다 전투 중 공격력 +1 누적'],
    feast:['시체 포식','자신의 공격·중독 처치 시 전투 중 최대·현재 체력 +2'],
    cold:['냉혈한','자신보다 유효 속도가 낮은 적에게 피해 +1'], late:['후발주자','라운드 시작에 정해진 마지막 행동자의 공격력 +1']
  };
  const api={units,passives};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.V2DesignData=api;
})(globalThis);
