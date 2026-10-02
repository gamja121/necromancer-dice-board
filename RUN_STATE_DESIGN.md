# RunState 통합 저장 설계 및 이행 계획

- 조사 기준: main `24477d0`까지 재확인 (2026-09-29).
- 상태: **계약/어댑터 1단계 구현 / 런타임 미연결**. `v2-run-state.js`에 schema 검증, legacy 변환, IndexedDB 어댑터, revision/operation 멱등성 기반을 추가했으며 기존 게임 writer는 아직 전환하지 않는다.
- 기준: GAME_DESIGN_RULES.md, CODEX_DEVELOPMENT_WORKFLOW.md §19·20. 이후 규칙 변경은 별도 승인.
- 현재 구현 단위: UI와 분리된 순수 schema 검증기·legacy 변환기·IndexedDB 저장소 어댑터와 실패 주입 테스트. 다음 단계는 최신 main의 map/home/altar writer를 어댑터 뒤로 점진 전환하는 것이다.

## 2026-10-02 낙인 정책 저장 불변식

- RunState의 `brandCards[]`는 저장 경계에서 항상 `curse=[]`로 정규화한다.
- `ownedMonsters[]`와 `graveyardCorpses[]`는 저장 경계에서 `V2Rules.normalizeUnitBrands()`를 적용한다.
- 기존 저장의 후속 낙인 저주/저주와 겹친 축복, 구형 낙인카드 저주, RunState 전투 체크포인트 내부의 구형 낙인은 bootstrap의 `brand-policy-migration-v1`에서 한 번 영구 정리한다.
- 이후 `replaceOwnedMonsters`, 전투 종료, capture, 상점 교환, 계승 등 어떤 commit 경로도 이 불변식을 우회할 수 없다.

## 1. 현재 저장 지점과 누락

| 기존 위치/키 | 실제 내용·작성자 | 이행 대상 |
|---|---|---|
| session: necromancer-map-roster-v2 | map, auto-battle, home-inheritance, altar-ritual이 개체 배열 작성 | ownedMonsters |
| session: necromancer-map-dice-control-v1 | map의 카드 종류 ID 배열, 중복 가능 | diceCards, 각 카드 별 instanceId |
| session: necromancer-map-brand-cards-v1 | V2BrandCards 및 집 UI의 독립 소비형 낙인 카드 | brandCards: 기존 id를 instanceId로 보존, **축복 눈금만 보존하고 curse=[] 강제** |
| session: necromancer-map-contamination-v1 | map/auto-battle의 오염도 숫자 | contamination |
| session: necromancer-map-layout-v2 | map의 타일 종류 ID 24개 | currentMap.tiles |
| session: necromancer-map-layout-v1 | 기존 layout 읽기에서 제거하는 구형 값 | 원문 백업만, 자동 삭제 금지 |
| session: necromancer-map-cleared-monsters-v1 | auto-battle이 기록하는 1-based 칸 번호 | mapInstanceId로 범위 제한한 clearedTiles |
| session: necromancer-map-world-tree-prayed-v1 | map의 기도 완료 플래그 | currentMap.worldTreePrayed |
| session: necromancer-map-contamination-win-v1:<encounter> | 승리 오염도 중복 적용 방지 마커 | 조우 완료 트랜잭션 영수증 |
| local: necromancer-v2-battle-v1 | 규칙 snapshot, phase, roll, actions, queue | 연결 검증된 battle만 |
| local: necromancer-audio-settings-v1 | 오디오 설정 | 원정 밖 설정으로 유지 |
| session: necromancer-v2-music-handoff | 화면 간 음악 전달 | 원정 저장에서 제외 |

키의 v1 접미사는 삭제된 게임 V1이라는 뜻이 아니다. 일괄 삭제하지 않는다.

코드 근거:
- v2-map-practice.js: loadOwnedRoster, loadSavedMapLayout, confirmMonsterBattle, diceControlState, rollAndMove.
- v2-auto-battle-practice.js: saveBattle/resumeBattle, persistMapAllyOutcome, finishBattle, setupCorpseCapture, returnToMap.
- v2-rules.js: snapshot/restore.
- v2-home-inheritance.js: inherit. v2-altar-ritual.js: saveRoster.

확인된 위험:
1. 지도 저장은 sessionStorage, 전투는 localStorage로 분리되어 원정 단위 일관성이 없다. 브라우저 세션 복원 정책에 기대어 영구 보존을 보장할 수 없다.
2. 지도 종류·복귀 위치·조우 ID·선택 개체는 URL에 의존한다. 지도 layout 복원도 resume 파라미터가 있을 때만 시도한다.
3. heroIndex, lapReadyForRefresh, previousDiceRoll, previousDiceControlId, pendingDiceControlId, 보물 선택 상태는 메모리 변수다. 재시작 시 반복/재발동 카드와 이동·보상을 정확히 이어갈 정보가 부족하다.
4. 규칙 snapshot에 instanceId가 없다. 동일 종류 마물의 전투 후 HP/사망 반영에서 slug 대체 식별은 안전하지 않다.
5. 전투 local snapshot에 runId/encounterId/mapInstanceId가 없다. 다른 조우 또는 시험 전투 저장을 현 원정에 자동 결합하면 안 된다.
6. finishBattle은 HP/사망, 오염도, 처치 칸을 별도 쓰기로 반영하고 영입 선택 전에 complete 저장을 한다. 영입 대상·남은 시도·초과 보유 교환은 해당 snapshot으로 복원할 수 없다.
7. 일부 저장 실패를 무시하고 화면은 완료 상태로 넘어간다. 새 저장 계층은 실패를 명시적으로 반환해야 한다.
8. 마물 생성/판정 RNG와 연출 Math.random이 혼재한다. 새 seed를 넣는 것만으로 이전 전투의 난수를 복원할 수는 없다.
9. 840cfef의 독립 낙인 카드 적용은 roster 저장 후 카드 제거를 별도로 수행한다. 제거 실패 시 되돌리기를 시도하지만 중단/두 번째 저장 실패는 원자적으로 보호되지 않는다. 새 저장에서는 낙인 부여와 카드 소비를 같은 transaction으로 처리한다.

## 2. 제안 데이터 계약

JSON 직렬화 가능한 값만 저장한다. DOM, 이미지, 타이머, 함수, Map/Set은 저장하지 않는다.
아래는 필드 계약이며 실행 가능한 예시 저장 파일은 아니다.

| 필드 | 타입·역할 |
|---|---|
| saveVersion | 정수 1부터, 순차 migration 버전 |
| rulesVersion | 규칙 데이터 호환 식별자. saveVersion과 별개 |
| runId | 원정 UUID, 원정 시작 시 한 번 생성 |
| revision | 성공한 commit마다 증가하는 정수 |
| updatedAt | UTC ISO 문자열, 충돌 우선순위를 시각만으로 결정하지 않음 |
| phase | map-ready / map-moving / tile-event / battle / capture / reward-choice / returning / finished |
| currentMap | mapInstanceId, regionId(default/winter/hell), lap, tiles[24], heroIndex(0..23), lapReadyForRefresh, worldTreePrayed |
| currentMap.tiles[] | tileInstanceId, typeId. 동일 typeId 타일도 다른 instanceId |
| contamination | 정수 0..100 |
| ownedMonsters[] | instanceId, slug, maxHp, currentHp, attack, speed, brands, altarEnhancements; 영구 수치만 |
| party[] | 소유 개체 instanceId, 슬롯 순서 1~4. 공유 소환 슬롯은 battle 안에만 존재 |
| diceCards[] | instanceId, cardId. 같은 카드 종류의 복수 보유 보존 |
| brandCards[] | instanceId, brand(type, bless[], curse=[]). 마물에 붙은 낙인과 별도인 **축복 전용** 소모품 |
| diceContext | previousRoll(null 또는 1..6), previousEffectiveCardId(null 또는 카드 종류), pendingCardInstanceId |
| movement | null 또는 operationId, fromIndex, targetIndex, resolvedRoll, 경유 집 효과 등 확정된 이동 결과 |
| clearedTiles | 현재 mapInstanceId의 tileInstanceId 배열 |
| eventFlags | 명시적 scope(run/map/visit)를 가진 사건 상태 |
| battle | null 또는 아래 전투 계약 |
| pendingOperation | null 또는 operationId, kind, sourceId, 확정 결과·선택지, stage |
| claimedRewards | rewardId와 결과/포기 영수증. 수령과 포기를 구분 |
| appliedOperations | 상태 변경 operationId 영수증, 원정 동안 중복 실행 방지 |
| rngState | algorithm, algorithmVersion, state, drawCount. 게임 판정 전용 |
| migration | sourceVersion, backupId, 완료 여부, 복구 경고·누락 필드 |

낙인 종류/축복·저주 눈금과 순서, 제단 강화 횟수 및 영구 스탯을 그대로 보존한다.
전투 중 식물 군단 등의 임시 HP 보정은 소유 개체의 영구 maxHp로 저장하지 않는다.
실제 이행에서 모르는 필드는 원문 백업에 유지하고 경고한다. 알 수 없는 마물/카드를 조용히 삭제하거나 새 랜덤 개체로 교체하지 않는다.

### 전투 계약

battleVersion, encounterId, origin(run 또는 lab), mapInstanceId, tileInstanceId,
allyInstanceIds, 확정된 적 개체 및 enemy instanceId, 전장 ID,
규칙 snapshot, turnQueue(개체 ID 참조), round, lastRoll, actionCount,
checkpoint, actionSequence, result, capture를 저장한다.

규칙 snapshot의 last/poison source/queue 관계도 안정적인 ID로 연결하거나,
동일 snapshot 내부의 index로 유지할 경우 모든 참조 범위와 중복 슬롯을 검증한다.
rules.snapshot/restore 왕복에서 instanceId 보존을 먼저 검증한다.
고정된 군단 활성/원소 억제와 소환물 상태도 저장한다. 복원 시 전투 시작 효과를 재적용하지 않는다.

capture에는 시체 후보별 이미 확정한 목표 눈금, 선택 대상, 남은 시도,
사용한 시도 ID/결과, 획득 후보 개체 전체, 보유 초과 시 선택 대기를 포함한다.
complete는 전투 종료이지 보상 수령 완료를 뜻하지 않는다. 둘을 별도 단계로 나눈다.
lab 저장은 원정 저장과 다른 namespace로 분리하고 원정 결과를 수정할 권한이 없다.

## 3. 저장소와 원자성

제안: IndexedDB의 원정 저장소에 current / 이전 정상 revision / operation 영수증을 동일 readwrite transaction으로 저장한다.
localStorage의 여러 키에 순차 쓰기하는 구조를 새 권위 저장소로 삼지 않는다.
DB 이름/버전과 store 구조는 어댑터 구현 PR에서 고정한다.
초기 store 제안: runs(key=runId), metadata(key=activeRun), backups(key=backupId).
영수증은 초기에는 RunState 내부에 두어 별도 보상 쓰기와 분리되지 않게 한다.

commit(runId, expectedRevision, operationId, command):
1. 트랜잭션 안에서 현재 revision/권위 runId/operation 영수증을 읽는다.
2. 이미 적용된 operation이면 기존 결과만 반환한다. 다른 payload로 같은 ID를 재사용하면 실패한다.
3. revision 불일치는 conflict로 반환하고 오래된 탭의 쓰기를 중단한다.
4. 복사 상태에 순수 reducer를 적용하고 schema·참조·규칙 불변식을 검사한다.
5. 이전 정상본과 다음 상태, 완료 영수증을 같은 트랜잭션으로 기록한다.
6. transaction complete 이후에만 성공 UI·화면 이동·연출을 진행한다.

IndexedDB transaction 안에서 네트워크/이미지 로딩/별도 비동기 작업을 기다리지 않는다.
게임 난수는 후보 상태에서 소비하고 결과와 다음 rngState를 함께 commit한다.
UUID 생성은 게임 RNG를 소비하지 않는다.
여러 탭은 revision 충돌로 차단한다. BroadcastChannel은 갱신 알림일 뿐 잠금 보장이 아니다.
용량 부족·접근 차단·중단 시 원본 유지, 실패 안내, 재시도/내보내기. 성공했다고 표시하지 않는다.
IndexedDB 역시 사용자 삭제/브라우저 정책에 의한 유실 가능성이 있으므로 JSON 내보내기를 제공한다.

## 4. 중단 지점별 정책

| 행동 | 저장 완료 시점 | 복구/중복 처리 |
|---|---|---|
| 주사위 카드 사용 | 카드 소비, 결과·직전 효과, 이동 결과를 하나로 commit 후 연출 | pending 이동을 완료, 재굴림/재소비 금지 |
| 일반 이동·워프 | 결과/도착지/경유 효과 확정 후 연출 | 기존 결과 사용, 도착 사건은 visit ID로 한 번 생성 |
| 전투 진입 | 편성 ID, 적 개체, 조우·타일 ID 확정 후 페이지 이동 | URL보다 저장을 신뢰, 오래된 조우 URL 거부 |
| 전투 행동 | 행동 판정·큐 이동·RNG·상태를 한 번에 commit 후 연출 | 마지막 확정 행동 다음부터, 데미지 연출은 건너뛰어도 판정 재실행 금지 |
| 전투 종료 | 사망 제거·HP·오염도·처치·capture 준비를 단일 commit | 같은 encounter 종료 command는 no-op |
| 영입/보물 | 제시 후보를 먼저 저장, 선택/교환/포기는 operation으로 확정 | 후보·목표·남은 시도 재추첨 금지 |
| 계승/제단 | donor 제거와 recipient 수치/낙인 및 RNG를 단일 commit | 완료 영수증 반환, donor 재사용 금지 |
| 독립 낙인 카드 적용 | 카드 소비와 대상 낙인 추가를 단일 commit | 마물 희생 없음, 동일 카드 중복 사용 금지 |
| 세계수/집 회복 | 판정 결과/오염도/기도 flag 또는 회복 HP를 함께 commit | 해당 방문 효과 재적용 금지 |
| 맵 교체 | 새 mapInstanceId·배치·경유 효과·map scope 초기화를 함께 commit | 이전 맵 처치/기도 플래그 혼입 금지 |

repeat는 previousRoll을, echo는 previousEffectiveCardId를 사용한다.
현재 코드도 echo 사용 후 effectiveCardId를 기록한다. echo 자체를 직전 효과로 저장해 재귀 호출시키지 않는다.
소모 대기 카드가 존재하면 UI 취소/복원 정책을 명시한다. 이미 결과가 확정된 카드는 반환하지 않는다.
rewardId는 단순 tile type이나 칸 번호가 아니라 run/map/visit 또는 encounter 및 reward slot으로 구성한다.
현재 반복 방문 가능한 보상 여부를 바꾸지 않고 방문마다 별도 ID를 발급한다.

## 5. 기존 저장 이행

### 절차

1. 기존 화면 초기화(loadOwnedRoster 등의 보정·삭제)보다 먼저 원본 키를 문자열 그대로 읽는다.
2. 키 누락과 문자열 null/깨진 JSON을 구분한다. 기존 session/local 값과 해당 prefix 승리 마커를 legacy 백업으로 저장한다. 전체 브라우저 저장소를 수집하지 않는다.
3. 백업 저장 및 재읽기 검증이 실패하면 자동 이행하지 않는다. 내보내기 경로 제공.
4. 순수 변환기가 후보와 경고를 만든다. 기존 정상 instanceId 유지, 없는 ID는 한 번 발급하여 후보에 고정한다.
5. 중복 ID가 있고 전투 참조가 모호하면 멋대로 합치지 않는다. 원문 유지 및 사용자 복구 선택.
6. 후보 검증 후 권위 RunState와 migration 완료 marker를 동일 트랜잭션으로 commit한다.
7. 같은 legacy 입력에 대한 재실행은 이미 생성된 runId/개체를 재사용한다.
8. 성공해도 기존 키는 삭제하지 않는다. 명시적 정리 단계 전까지 백업 유지.

### 복원 불가능한 정보 처리

- 기존 저장에 없는 RNG 과거 상태는 복구할 수 없다. 새 알고리즘 시작점을 migration 경계로 기록한다.
- 이전 주사위 결과/직전 효과가 없다면 null로 두고 반복/재발동 사용 불가를 설명한다. 임의 숫자로 채우지 않는다.
- 지도 종류/위치는 유효한 현 탭 컨텍스트를 보조 자료로 사용할 수 있으나 신뢰된 조우 연결로 간주하지 않는다.
- layout만 있고 위치/진행을 확정할 수 없다면 자동 새 지도 생성·기존 진행 덮어쓰기를 하지 않는다. 보유 목록만 가져오기 등 복구 선택을 제시한다.
- 독립 local 전투 저장은 자동으로 현재 원정에 합치지 않는다. instanceId·조우 연결이 없으면 별도 격리된 전투 복원만 후보로 제공한다.
- 기존 complete 전투의 영입 처리 여부는 추정하여 보상을 새로 지급하지 않는다.
- 기존 로더가 허용하는 100개와 실제 보유 상한 10개의 불일치: 자동 잘라내기 금지, 초과 데이터를 보존하고 해소 UI로 처리한다.
- 미래 saveVersion, 알 수 없는 규칙 버전은 읽기 전용·내보내기만 허용한다. 구버전 앱의 덮어쓰기 금지.

### 이중 쓰기 금지

이행 기간에도 진실의 원천은 하나다. legacy writer와 새 writer를 동시에 활성화하지 않는다.
어댑터 뒤로 map/battle/home/altar 접근을 모으고, 관련 소비자 전환을 함께 배포한다.
필요한 legacy 호환 출력은 새 상태에서 만든 읽기 전용 사본이며, 이를 새 상태로 다시 import하지 않는다.
기존 코드로의 rollback은 새 저장을 이해하지 못한다. 단순 구버전 배포를 데이터 복구라고 부르지 않는다.
새 저장 내보내기/백업과 기능 비활성화 경로를 먼저 마련하고 구버전 쓰기를 차단한다.

## 6. 단계별 PR과 검증

1. **계약/어댑터 PR**: 순수 검증기, legacy 변환, 버전 migration, IDB 저장·백업·revision 충돌 테스트. 런타임 연결 없음.
2. **원정 연결 PR**: 지도/카드/보유/계승/제단의 모든 writer를 어댑터 뒤로 이동. legacy import UI와 명시적 저장 오류.
3. **전투 연결 PR**: instanceId 포함 snapshot, 조우 연결, 행동 체크포인트, capture/초과 교환·복귀 멱등성.
4. **원정 한 바퀴 검증**: 실제 브라우저 종료·재실행/오프라인/복수 탭/업데이트/기기 테스트.
각 단계는 이전 단계 검증이 통과한 뒤 적용한다. 중간 단계에서 전체 복구 완료라고 보고하지 않는다.

필수 테스트 행렬:
- 모든 18종 주사위 카드, 중복 카드, repeat/echo 이력의 저장 왕복 및 소비 직후 중단.
- 같은 slug 2개체, 사망 1개체, 계승 donor 영구 제거, 소환물 roster 제외.
- 제단 강화 및 낙인 눈금·순서 보존, 임시 전투 HP 보정 제외.
- 독립 낙인 카드는 **축복 전용**으로 저장한다. 구형 카드의 저주는 bootstrap 정책 마이그레이션에서 제거하며, 보물 획득·적용·소비 도중 중단 시 카드만 소모되거나 낙인만 복제되는 부분 저장을 금지한다.
- 전투 전/행동 전후/종료/capture 시도/초과 교환/귀환 단계에서 강제 중단.
- 같은 operation 2회 호출, 같은 보상 복귀 2회, 이전 맵 조우 URL, 다른 runId 거절.
- 정상·빈·손상·일부 키 누락·중복 ID·초과 보유·미래 버전 legacy fixture.
- 백업 실패, quota, transaction abort, commit 직후 화면 이동 실패: 이전 또는 다음 정상 상태만 관측.
- 복수 탭 동시 expectedRevision 쓰기: 하나만 성공, 다른 탭 conflict.
- 같은 seed/명령의 uninterrupted와 checkpoint 복원 실행 결과·RNG 소비 횟수 일치.
- lab 저장과 원정/오디오 설정 상호 불변.
- 모바일 실제 기기 종료/복원 별도 기록. 브라우저 모바일 폭 테스트를 실제 휴대폰 검사로 대체하지 않는다.

기존 28개 회귀(840cfef 기준)와 브라우저 smoke를 유지하고 위 테스트는 추가한다.
이번 설계는 아직 이 테스트들을 통과한 구현이 아니다.

## 7. 결정 대기·범위

- 위치/전투 연결을 잃은 legacy 저장의 복구 선택 UX, 원정 종료 후 장기 계승 보존 범위는 구현 전 확정한다.
- RNG 알고리즘/직렬화 규격과 IDB schema는 계약 PR에서 테스트 벡터와 함께 고정한다.
- 개발용 재생성 버튼과 새 원정 시작은 분리하며 삭제/초기화는 명시적 사용자 동작으로 제한한다.
- 공통 애니메이션은 다음 별도 작업. 자산 history 청소, 모든 이미지 최적화, Godot 전체 이식은 이번 범위 밖이다.


## 8. 1단계 구현 메모 (2026-09-29)

- `v2-run-state.js`: saveVersion 1 계약, 기본 RunState 생성, 검증, legacy scoped raw 수집/변환, IndexedDB backend, revision 충돌 및 operationId 멱등성 store를 추가했다.
- migration은 기존 session/local 키를 삭제하지 않는다. 먼저 legacy backup을 저장하고 재읽기 검증이 성공한 경우에만 새 run을 생성한다.
- 기존 local battle은 encounter/run 연결 근거가 부족하므로 자동 결합하지 않고 backup에만 보존하며 경고를 남긴다.
- 기존 roster의 정상 instanceId는 그대로 유지한다. 중복 instanceId는 자동 병합하지 않고 migration 실패로 돌린다.
- 주사위 카드의 기존 저장은 카드 종류만 있으므로 이행 경계에서 개별 instanceId를 발급한다.
- `test_v2_run_state.js`: 정상 변환, 손상 JSON 경고, 중복 monster ID 차단, backup 보존, revision 충돌, 동일 operation 중복 실행 방지, invalid commit의 이전 정상본 보존을 검사한다.
- 이 단계에서는 HTML/service worker/map/battle에 새 모듈을 로드하지 않는다. 즉 기존 플레이 저장 동작은 의도적으로 그대로이며, 테스트가 검증된 다음 writer 전환 PR에서 실제 적용한다.
