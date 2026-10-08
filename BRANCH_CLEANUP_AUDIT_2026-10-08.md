# GitHub 브랜치 정리 감사 — 2026-10-08

저장소: `gamja121/necromancer-dice-board`

목적: 오래된 ChatGPT/Codex/rollback/임시 브랜치가 저장소 용량을 계속 잡고 있는지 확인하고, 삭제 위험도를 분류한다.

## 판정 기준

- **A — 바로 삭제 안전**: `main` 대비 `ahead_by = 0`. 즉 브랜치에만 존재하는 고유 커밋이 없고, 해당 브랜치의 커밋은 현재 `main`의 조상이다.
- **B — 삭제 유력 / 현행 main 대체 확인**: `ahead_by > 0`인 diverged 브랜치라 Git 관점에서는 고유 커밋이 남아 있지만, 해당 기능/자산/테스트가 현재 `main`에 이미 존재하거나 더 최신 구현으로 대체된 것이 확인된다. 자동 삭제는 하지 않고 최종 승인 후 삭제한다.
- **C — 보존/추가 확인 필요**: 현재 main에서 대체 여부가 확인되지 않았거나 고유 자산/작업이 남아 있는 경우.

## 전체 결과

- 전체 브랜치: **56**
- `main`: **1**
- 정리 대상: **55**
- A 바로 삭제 안전: **24**
- B 삭제 유력: **31**
- C 보존/추가 확인 필요: **0**

현재 검사 기준으로 작업 브랜치 55개 중 계속 유지해야 할 브랜치는 발견하지 못했다.
단, B 그룹은 고유 커밋이 존재하므로 사용자가 삭제를 승인하기 전에는 삭제하지 않는다.

---

## A — 바로 삭제 안전 (24)

### 일반/임시

- `asset-stage-hunter` — main보다 9커밋 뒤, ahead 0
- `tmp-forest-hq-upload` — main보다 984커밋 뒤, ahead 0

### rollback 브랜치 22개

모두 `ahead_by = 0`이며 현재 main의 과거 지점만 가리킨다.

- `rollback/altar-confirm-overlap-before-20260930`
- `rollback/asset-pipeline-before-20260929`
- `rollback/battle-speed-foundation-before-20260929`
- `rollback/battle-timing-split-before-20260929`
- `rollback/brand-causality-before-20260929`
- `rollback/combat-impact-tier-before-20260929`
- `rollback/contamination-test-control-before-20260929`
- `rollback/contamination-test-mobile-position-before-20260929`
- `rollback/contamination-test-visibility-before-20260929`
- `rollback/corruption-visuals-before-20260929`
- `rollback/fortune-prophecy-effects-before-20260930`
- `rollback/fortune-prophecy-ui-before-20260930`
- `rollback/fortune-stack-before-next-battle-20260930`
- `rollback/graveyard-brand-extraction-before-20260930`
- `rollback/hill-recon-before-20260930`
- `rollback/map-story-events-before-20260930`
- `rollback/monster-barter-shop-before-20260930`
- `rollback/post-tile-audit-before-fixes-20260930`
- `rollback/presentation-cleanup-before-20260929`
- `rollback/presentation-queue-before-20260929`
- `rollback/presentation-rail-before-20260929`
- `rollback/village-monster-shop-button-before-20260930`

**판정:** 삭제해도 현재 main 코드/자산이 사라지지 않는다. Git 브랜치 참조만 제거된다.

---

## B — 삭제 유력 / 현행 main 대체 확인 (31)

이 그룹은 모두 오래전에 갈라진 diverged 브랜치다. `main`보다 약 1,300~1,880커밋 뒤에 있으며, 브랜치 고유 커밋은 1~20개 정도 남아 있다.

### 백업/CI/Codex

- `backup-sync-temp-20261003`
  - 고유 변경: `.github/workflows/drive-backup-export.yml`
  - 현재 main에도 `drive-backup-export.yml` 존재.
- `codex/restore-ci-gates-20261003`
  - CI gate, 브라우저 검사, 각종 테스트 파일 변경.
  - 현재 main에 `verify-and-deploy.yml`, `scripts/check-v2-browser.js`, `test_ci_gate.js`, 관련 테스트들이 존재.
- `codex/run-state-design-20260929`
  - `RUN_STATE_DESIGN.md`, `CODEX_DEVELOPMENT_WORKFLOW.md` 등.
  - 현재 main에 해당 설계/워크플로 문서 존재.

### 게임 기능 작업 브랜치

- `chatgpt/add-polluted-swamp-20260930`
  - 오염 늪 타일/맵 반영. 현재 main에 `swamp.png` 및 최신 맵 구현 존재.
- `chatgpt/all-monsters-encounters-20260930`
  - 전투/조우 확장. 현재 main의 맵/전투 코드가 훨씬 이후 버전.
- `chatgpt/battle-checkpoint-20260929`
  - 전투 체크포인트. 현재 main에 체크포인트/원정 상태 구현과 관련 테스트 존재.
- `chatgpt/battle-rng-state-20260929`
  - `v2-battle-rng.js`, RNG 테스트. 현재 main에 해당 모듈/테스트 존재.
- `chatgpt/cache-cleanup-20260929`
- `chatgpt/cache-followup-20260929`
  - 구형 service-worker/cache 정리 브랜치. 현재 main의 캐시 파일이 훨씬 이후 버전.
- `chatgpt/capture-resume-20260929`
  - 영혼수확/재개. 현재 main에 `test_v2_capture_resume.js`와 관련 구현 기록 존재.
- `chatgpt/ci-asset-pipeline-tests-20260929`
  - 여러 CI/asset 테스트. 현재 main에 동일 계열 테스트와 최신 CI가 존재.
- `chatgpt/fix-swamp-transparency-20260930`
  - 늪 투명도 수정. 현재 main에 최신 `swamp.png`와 맵 코드 존재.
- `chatgpt/force-landscape-launch-20260930`
  - 가로 화면/런처. 현재 main에 최신 `index.html`, `launch.css`, `launch.js` 존재.
- `chatgpt/run-state-adapter-20260929`
  - `v2-run-state.js` 및 설계. 현재 main에 최신 버전 존재.
- `chatgpt/run-state-runtime-20260929`
  - 런타임 저장 흐름. 현재 main에 `v2-run-state-runtime.js` 및 관련 테스트 존재.
- `chatgpt/shop-counter-ui-20260930`
  - 마물 상점 카운터 UI. 현재 main에 `monster-shop-counter.png`와 최신 상점 UI 존재.

### 타이틀 화면 작업 브랜치 15개

- `chatgpt/title-complete-20260930`
- `chatgpt/title-deploy-20260929`
- `chatgpt/title-fullscreen-landscape-on-start-20260930`
- `chatgpt/title-layout-fix-20260930`
- `chatgpt/title-logo-up-exit-tone-20260930`
- `chatgpt/title-menu-layout-select-20260930`
- `chatgpt/title-remove-portrait-fix-overlap-20260930`
- `chatgpt/title-remove-rotate-guide-20260930`
- `chatgpt/title-screen-20260929`
- `chatgpt/title-screen-clean-20260929`
- `chatgpt/title-screen-deploy-20260929`
- `chatgpt/title-screen-final-20260929`
- `chatgpt/title-structural-fix-cache-20260930`
- `chatgpt/title-video-final-20260930`
- `chatgpt/title-visibility-contrast-20260930`

현재 main에는 다음 최종 자산/구현이 존재한다.

- `index.html`
- `launch.css`
- `launch.js`
- `assets/title/title-loop.mp4`
- `assets/title/title-theme.mp3`
- `assets/title/title-logo.webp`
- `assets/title/new-game.webp`
- `assets/title/continue.webp`
- `assets/title/options.webp`
- `assets/title/exit.webp`

두 초기 타이틀 브랜치에만 남아 있던 `.github/workflows/assemble-title-media.yml`도 확인했다. 이 워크플로는 특정 옛 브랜치의 `.title-upload/package/*.b64` 조각을 합쳐 타이틀 미디어를 만드는 **일회성 업로드 조립 도구**이며 해당 브랜치 이름에 직접 묶여 있다. 완성된 타이틀 미디어가 이미 main에 있으므로 현재 런타임/배포에는 필요하지 않다.

**판정:** 15개 모두 현행 타이틀 구현으로 대체된 과거 작업 브랜치로 본다.

---

## C — 보존/추가 확인 필요 (0)

이번 검사에서는 별도로 유지해야 할 브랜치를 찾지 못했다.

다만 B 그룹은 Git 기준으로 완전 병합된 브랜치가 아니라 **고유 커밋이 남은 오래된 작업 브랜치**다. 따라서 삭제는 사용자가 명시적으로 승인한 뒤 수행한다.

## 권장 정리 순서

1. A 그룹 24개를 먼저 삭제
2. main 정상 동작/배포 확인
3. B 그룹 31개를 삭제
4. 브랜치 목록을 다시 확인해 `main`만 남았는지 점검
5. GitHub 저장소 표시 크기는 즉시 줄지 않을 수 있으므로 이후 서버 측 garbage collection 반영을 기다린다

## 주의

브랜치를 삭제해도 현재 main의 파일은 삭제되지 않는다.
다만 diverged 브랜치의 고유 커밋은 브랜치 참조가 사라진 뒤 장기적으로 GitHub의 정리 대상이 될 수 있으므로, B 그룹은 이번 문서에 이름과 목적을 남긴 뒤 삭제하는 방식을 권장한다.
