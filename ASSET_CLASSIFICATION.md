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
- `art/v2-style/animation-sheets/green-raw/` — 51개
  - 실제 전투 공격/피격/사망 모션 시트
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
  - 이벤트 NPC 초상화
- `art/v2-style/protagonist/` — 2개
  - 주인공 이벤트/맵용 이미지
- `assets/title/`, `assets/app-icon-*.png`, `assets/v2-battle-castle.png`
  - 타이틀/PWA/전투 기본 자산

**원칙: A는 지금 삭제 금지.**

## B. 개발·테스트용

본 게임 핵심 런타임보다 모션 테스트, 이미지 테스트, 주사위 테스트 등에 주로 사용한다.
게임 배포 용량을 줄일 때 별도 개발 폴더 또는 외부 백업으로 뺄 수 있지만, 테스트 페이지를 계속 쓸 거면 유지한다.

- `art/v2-style/animation-test-frames/` — 약 **553개**
  - 가장 큰 이미지 묶음
  - 공격/피격/사망을 낱장 프레임으로 잘라 둔 테스트 자산
- `art/v2-style/dice-test/frames/` — 18개
- `art/v2-style/dice-test/source/` — 2개

**원칙: B는 게임 본편만 놓고 보면 정리 후보지만, 개발 중에는 유지 권장.**

## C. 원본·참고·백업 성격

게임 실행에 직접 필요한 최종 자산보다는 제작 원본이나 참고 자료 성격이 강하다.

- `art/v2-style/references/` — 47개
  - 화풍 기준, 업로드 원본, 카드 덱 레퍼런스
- `art/v2-style/map-test/tiles-source/` — 14개
  - 타일 제작 원본 JPG
- `art/v2-style/map-test/hero-source/` — 1개
  - 주인공 토큰 제작 원본
- `art/v2-style/animation-sheets/replacements-2026-09-07/` — 4개
  - 교체 전후 작업 보관 성격
- `art/v2-style/processed/512/` — 12개
  - 고해상도 가공본. 현재 192 버전을 쓰는 화면이 많아 원본/백업 성격이 큼

**원칙: C는 Google Drive 백업 후 GitHub에서 빼기 가장 좋은 후보.**
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
2. **B의 553개 animation-test-frames를 개발용 보관으로 분리**
3. D의 JPG/PNG/WEBP 중복을 파일별 참조 검사
4. A는 경로 구조를 바꾸지 않고 그대로 유지
5. Unity 전환 시 최종적으로 `Runtime/`, `Source/`, `DevOnly/` 구조로 재편

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
Unity 이관 시 위 구조로 옮기는 것이 가장 안전하다.
