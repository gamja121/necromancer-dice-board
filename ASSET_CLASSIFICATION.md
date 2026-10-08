# 이미지 자산 분류표

> 2026-10-01 기준. **이미지 파일을 실제로 이동하거나 삭제한 것은 아니다.**
> 현재 코드가 기존 경로를 직접 참조하므로, 먼저 안전성 기준으로 분류만 했다.
> 실제 폴더 이동은 코드 경로와 service-worker 캐시 목록을 함께 바꿔야 한다.

## 요약

현재 저장소 이미지 약 **1,052개**를 다음 4종으로 나눈다.

### A. 게임 실사용 / 삭제 금지

실제 맵, 전투, 카드, 모션, UI에서 직접 읽는 자산. 삭제하면 깨진 이미지, 빈 카드, 모션 누락이 생길 수 있다.

- `art/v2-style/ui/` — 약 174개
  - 카드, 버튼, 낙인, 피해 숫자, 상태표시, 오염도, 지도책, 상점, 패널 등
  - `parchment-button-variant-01~04.png` 포함
- `art/v2-style/ui/info-portraits/` — 48개
  - 마물 정보창 초상화
- `art/v2-style/processed/192/` — 49개
  - 전투/목록에서 쓰는 경량 마물 이미지
- `art/v2-style/animation-sheets/green-raw/` — 51개, **혼합 폴더**
  - 특수 모션 모듈이 일부 시트를 실제 전투에서 직접 사용한다.
  - 확인된 실사용 예: hell-mantis, guardian-seed, scorpion-knight, bone-hound, hydra-1/2, abyss-harpy, bone-golem, ice-princess, goblin-soldier-1/2/3.
  - 폴더 전체 삭제/이동 금지. 나머지는 파일별 참조 검사 필요.
- `art/v2-style/animation-test-frames/` — 약 553개, **현재 전투 런타임 사용**
  - 일반 마물 모션 프레임 경로로 동적 참조됨.
- `art/v2-style/dice-test/frames/` — 18개, **현재 맵/전투 런타임 사용**
  - roll 12장 + result 6장
- `art/v2-style/animation-sheets/uploaded-raw/` — 1개
  - 드라큘라 등 실제 모션 참조
- `art/v2-style/battle-backgrounds/` — 6개
  - 전투 배경
- `art/v2-style/map-test/events/` — 22개
  - 집, 마을, 세계수, 제단, 보물상자, 계승창 등
- `art/v2-style/map-test/tiles/` — 19개
  - 실제 보드 타일
- `art/v2-style/map-test/maps/` — 3개
  - 기본/겨울/지옥 맵
- `art/v2-style/map-test/hero/` — 1개
  - 맵 주인공 토큰
- `art/v2-style/event-portraits/` — 17개
  - 재검사 시 현재 런타임 코드에서 직접 파일 경로 참조를 찾지 못했다.
  - 향후 이벤트용 자산일 가능성이 높으므로 **현재는 Source/Future 후보**로 취급하고 삭제는 보류한다.
- `art/v2-style/protagonist/` — 2개
  - 주인공 이벤트/맵용 이미지
- `assets/title/`, `assets/app-icon-*.png`, `assets/v2-battle-castle.png`
  - 타이틀/PWA/전투 기본 자산

**원칙: A는 지금 삭제 금지.**

## B. 개발·테스트용

재검사 결과 이 구역은 처음 분류보다 훨씬 좁다.

- `art/v2-style/dice-test/source/` — 2개
  - 주사위 제작 원본 성격
- 독립 테스트 페이지에서만 쓰는 자산은 파일별 확인 후 이 그룹으로 이동 가능

**중요 정정**
- `art/v2-style/animation-test-frames/`는 이름과 달리 **현재 전투 런타임에서 직접 사용한다.**
  `v2-auto-battle-practice.js`가 이 경로를 `FRAME_ROOT`로 두고 일반 마물의 공격/피격/사망 프레임을 동적으로 만든다.
  따라서 약 553개를 통째로 DevOnly로 옮기거나 삭제하면 안 된다.
- `art/v2-style/dice-test/frames/` 18개도 **현재 런타임 자산**이다.
  맵 이동 주사위와 전투 턴 주사위가 직접 사용하고 service-worker도 선캐시한다.

**원칙: 이름에 test가 들어가더라도 현재 코드 참조를 우선한다. 폴더명만 보고 정리하지 않는다.**

## C. 원본·참고·백업 성격

게임 실행에 직접 필요한 최종 자산보다는 제작 원본이나 참고 자료 성격이 강하다.

- `art/v2-style/references/`
  - 화풍 기준, 업로드 원본, 카드 덱 레퍼런스
  - `event-art/graveyard-child-master-reference.webp`는 **사건 원화 공식 기준본**이므로 일반 백업 후보와 달리 GitHub에 유지한다.
- `art/v2-style/map-test/tiles-source/` — 14개
  - 타일 제작 원본 JPG
- `art/v2-style/map-test/hero-source/` — 1개
  - 주인공 토큰 제작 원본
- `art/v2-style/animation-sheets/replacements-2026-09-07/` — 4개
  - 교체 전후 작업 보관 성격
- `art/v2-style/processed/512/` — 12개
  - 고해상도 가공본. 현재 192 버전을 쓰는 화면이 많아 원본/백업 성격이 큼

**원칙: C는 Google Drive 백업 후 GitHub에서 빼기 좋은 후보이지만, 공식 기준 자산은 예외로 GitHub에 유지한다.**
단, 삭제 전 개별 경로 참조 검사를 한 번 더 해야 한다.

## D. 중복·검토 필요

같은 마물/기능이 여러 포맷이나 버전으로 존재해서 자동 삭제하면 위험한 그룹.

대표 사례:

- `ui/unit-card-*.jpg` + `ui/unit-card-*.png`
  - 다수 마물에 JPG/PNG가 함께 존재
  - 현재 화면에 따라 PNG 우선 또는 JPG 폴백이 있어 일괄 삭제 금지
- `ui/heal-cross.png` + `ui/heal-cross.webp`
- `ui/world-tree-prayer-digits.png`
- `ui/world-tree-prayer-digits-clean.png`
- `ui/world-tree-prayer-digits.webp`
- 일부 애니메이션 시트와 `animation-test-frames`가 같은 모션의 원본/분해본 관계

**원칙: D는 코드 참조를 파일별로 검사한 뒤 한쪽만 남긴다.**

---

## 정리 우선순위

1. **C 원본·참고 자료를 Google Drive 백업 폴더로 복사**
2. `references/`, `tiles-source/`, `hero-source/`, `processed/512/`, `replacements-2026-09-07/`, `dice-test/source/`를 백업 후보로 우선 검토
3. `animation-test-frames/`와 `dice-test/frames/`는 **이름과 무관하게 Runtime 유지**
4. D의 JPG/PNG/WEBP 중복을 파일별 참조 검사
5. A는 경로 구조를 바꾸지 않고 그대로 유지
6. Godot 전환 시 최종적으로 `Runtime/`, `Source/`, `DevOnly/` 구조로 재편

## 자동 검수 도구

- `npm run audit:assets`
- 실행 시 `ASSET_USAGE_AUDIT.generated.md`를 생성한다.
- 현재 게임 엔트리에서 직접/동적으로 참조되는 이미지는 `KEEP`, 원본·참고 후보는 `BACKUP_CANDIDATE`, 나머지는 `REVIEW`로 둔다.
- **자동으로 SAFE_DELETE 판정을 내리지 않는다.** 실제 삭제 전에 사람이 한 번 더 확인하는 구조다.

## 권장 최종 구조

```
art/
  Runtime/
    Monsters/
    Animation/
    Maps/
    Events/
    UI/
    Cards/
  DevOnly/
    AnimationTestFrames/
    DiceTest/
  Source/
    References/
    TileSources/
    HeroSources/
    HighRes/
    Replacements/
```

현재 웹 프로토타입에서는 경로 변경 위험이 크므로 **지금 바로 실제 이동하지 않고 분류표를 먼저 기준으로 삼는다.**
Godot 이관 시 위 구조로 옮기는 것이 가장 안전하다.


## 2026-10-01 재검사 메모

정적 경로 검색을 다시 수행해 다음 누락을 바로잡았다.

1. `animation-test-frames/`는 단순 테스트 산출물이 아니라 현재 자동전투의 동적 프레임 루트다.
2. `dice-test/frames/`는 현재 맵과 자동전투 양쪽에서 직접 사용한다.
3. `event-portraits/`는 현재 코드에서 직접 참조가 확인되지 않아 실사용 확정 그룹에서 제외했다.
4. `processed/512/`, `references/`, `tiles-source/`, `hero-source/`, `animation-sheets/replacements-2026-09-07/`는 현재 런타임 직접 참조를 찾지 못했다. 단, 제작 스크립트나 향후 작업 원본 가치가 있어 백업 후 정리 대상으로만 본다.
5. 동적 경로(`FRAME_ROOT`, 카드 slug 조합 등)가 있으므로 단순 문자열 검색에서 '미사용'으로 나와도 즉시 삭제하지 않는다.

**삭제 안전 규칙:** 실제 삭제 전에는 (1) 런타임 코드 참조, (2) 동적 경로 생성, (3) service-worker 캐시, (4) 제작 스크립트, (5) 테스트 의존성을 모두 확인한다.


## 2026-10-01 이중 검수 결과

정리 후보 폴더를 서로 다른 두 방식으로 재검사했다.

- 1차: 전체 경로 문자열 검색
- 2차: 축약 경로·폴더명·관련 제작 스크립트 이름 재검색

현재 결과:
- `processed/512/`: 런타임 직접 참조 미검출
- `references/`: 런타임 직접 참조 미검출
- `animation-sheets/replacements-2026-09-07/`: 런타임 직접 참조 미검출
- `tiles-source/`: 런타임 참조는 없지만 `scripts/process-map-test-tiles.ps1`의 제작 원본
- `hero-source/`: 런타임 참조는 없지만 `scripts/process-map-test-tiles.ps1`의 제작 원본
- `dice-test/source/`: 런타임 참조는 없지만 `scripts/process-dice-test-sheet.ps1`의 제작 원본

따라서 위 자산은 **삭제 후보가 아니라 백업/외부보관 후보**로만 취급한다.
Google Drive 등 외부 백업 확인 전에는 GitHub에서 삭제하지 않는다.


## 2026-10-08 저장소 재점검

이번 점검은 삭제 없이 상태만 확인했다.

- 현재 `main` 트리: 약 **1,302개 파일 / 243.4MB**
- 이미지: **1,069개 / 약 230.7MB**
- 2026-10-01의 약 1,052개 이미지와 비교하면 약 **17개 증가**로, 최근에 이미지 찌꺼기가 대량으로 다시 쌓인 상태는 아니다.
- GitHub 저장소 메타데이터 크기: 약 **632,285KB(약 617.5MB)**. 현재 `main` 트리보다 훨씬 크므로 과거 커밋/브랜치가 저장 용량을 상당히 유지하고 있는 것으로 본다.
- 현재 브랜치 수: **56개**
  - `main`: 1
  - `chatgpt/*`: 28
  - `rollback/*`: 22
  - `codex/*`: 2
  - 임시/백업/스테이징 계열: 3
- 따라서 이번 시점의 가장 큰 '찌꺼기' 후보는 새 이미지 파일보다 **오래된 작업/롤백/임시 브랜치**다. 브랜치 삭제는 복구 필요성을 확인한 뒤 별도 작업으로 수행한다.
- 기존 백업 후보였던 `processed/512/`, `animation-sheets/replacements-2026-09-07/`는 현재 `main`에서 보이지 않는다.
- 남아 있는 Source/Backup 후보(`references/`, `tiles-source/`, `hero-source/`, `dice-test/source/`)는 합계 약 **6.5MB**로 크지 않다.
- `animation-test-frames/` 약 **23.8MB**는 이름과 달리 현재 런타임 사용 자산이므로 삭제 금지.
- `ui/` 약 **173MB**가 현재 트리의 가장 큰 비중을 차지한다. 카드 PNG/JPG, 정보 초상화, 주사위 제어 카드 등 실사용/폴백 관계가 있어 단순 용량만 보고 삭제하지 않는다.
- `abyss-claw-hunter-attack-03-generated.png`와 `...original-target.png`는 런타임 직접 사용은 아니지만 현재 테스트가 존재를 검사하므로, 삭제하려면 테스트/제작 흐름을 함께 정리해야 한다.

**현재 판정:** 새 찌꺼기가 다시 대량 축적된 것은 아니다. `main` 자산은 이전보다 비교적 정리된 상태이며, 다음 정리 우선순위는 파일 삭제보다 오래된 브랜치 정리 여부 검토다.
