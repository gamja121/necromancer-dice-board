# GitHub 브랜치 정리 감사 — 2026-10-08 (2차 재점검)

저장소: `gamja121/necromancer-dice-board`

> 이 문서는 같은 날 작성한 1차 분류를 **재검증하고 보수적으로 정정한 최종 판정**이다.
> 1차의 "55개 모두 정리 가능" 판단은 너무 공격적이었다. 실제 삭제는 아직 수행하지 않았다.

## 2차 점검에서 추가 확인한 항목

1. `main` 대비 각 브랜치의 ahead/behind 상태
2. diverged 브랜치의 고유 커밋 제목과 변경 파일
3. 브랜치에서 새로 추가됐던 파일이 현재 `main`에도 존재하는지
4. 주요 바이너리 자산의 Git blob SHA가 `main`과 동일한지
5. 현재 `main` 코드에 핵심 기능이 실제로 남아 있는지
6. 현재 열려 있는 Pull Request가 어떤 브랜치를 head로 사용하는지
7. 프로젝트 진행 기록에서 rollback 브랜치를 명시적으로 복구 지점으로 사용하고 있는지
8. 현재 `main`의 workflow/코드가 오래된 작업 브랜치를 직접 의존하는지

---

## 가장 중요한 정정

### 1. rollback 브랜치 22개는 "용량 찌꺼기"로 보면 안 됨

22개 rollback 브랜치는 모두 `ahead_by = 0`이다.
즉 브랜치가 가리키는 커밋은 이미 `main` 역사 안에 존재한다.

따라서 이 브랜치를 삭제해도:
- 현재 게임 파일은 사라지지 않지만
- **Git 저장 객체 용량도 사실상 줄지 않는다.**
- 대신 이름이 붙은 복구 지점만 사라진다.

특히 `AI_PROJECT_PROGRESS.md`에는 다음 두 브랜치를 명시적으로 **보존 브랜치**라고 기록해 두었다.

- `rollback/brand-causality-before-20260929`
- `rollback/asset-pipeline-before-20260929`

나머지 rollback 브랜치도 각 기능 변경 직전의 복구 지점으로 프로젝트 로그에 기록돼 있다.

**2차 판정: rollback 22개는 당분간 유지.**
현재 개발/이식이 안정된 뒤 태그 전환 또는 일괄 정리를 검토한다.

### 2. 오래된 브랜치가 617MB 전체 증가분의 원인이라고 단정할 수 없음

현재 `main` working tree는 약 **243.4MB**지만 GitHub 저장소 메타 크기는 약 **617.5MB**다.

그러나:
- ahead 0 브랜치는 이미 main과 객체를 공유하므로 용량 증가 원인이 아니다.
- diverged 작업 브랜치의 변경은 대부분 JS/CSS/MD/테스트 코드다.
- 큰 타이틀 MP4/MP3/WebP는 현재 main과 **동일 blob SHA**임을 확인했다.
- 마물 상점 카운터 PNG도 main과 **동일 SHA**다.
- 최종 투명 늪 타일 PNG도 main과 **동일 SHA**다.

따라서 브랜치 정리만으로 수백 MB가 줄어들 가능성은 낮다.
큰 차이는 **main의 긴 Git 역사에서 여러 번 교체된 이미지/오디오 등 과거 blob**과 Git 서버의 object retention 영향이 더 클 가능성이 높다.

실제 대폭 감량은 history rewrite / 새 저장소 이관 / LFS 재구성 같은 별도 작업이 필요하며, 이는 현재 브랜치 삭제보다 훨씬 위험한 작업이다.

---

# 최종 분류

전체 브랜치: **56**
- `main`: 1
- 기타 브랜치: 55

## A. 유지 권장 — 27개

### A-1. rollback 복구 지점 — 22개

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

**이유:** 복구 지점 역할이 명확하고, 삭제해도 용량 이득이 거의 없다.

### A-2. 현재 OPEN Pull Request의 head — 5개

현재 열려 있는 PR을 직접 확인했다.

- PR #22 → `chatgpt/title-fullscreen-landscape-on-start-20260930`
- PR #20 → `chatgpt/title-visibility-contrast-20260930`
- PR #11 → `chatgpt/ci-asset-pipeline-tests-20260929`
- PR #10 → `chatgpt/title-screen-clean-20260929`
- PR #1 → `codex/run-state-design-20260929`

5개 모두 현재 `open`, 미병합 상태이며 오래되어 mergeable=false 상태다.

**이유:** 기능 자체는 main에서 대부분 대체되었어도, 열린 PR 상태에서 head 브랜치를 먼저 지우는 것은 불필요한 위험이다.
정리하려면 **PR을 먼저 검토/종료한 후 브랜치를 삭제**한다.

---

## B. 삭제 후보 — 26개

현재 main 대체 여부, 고유 커밋, 추가 파일, 주요 바이너리를 다시 검사했다.
이 그룹은 삭제 전에 원하면 branch 이름/HEAD SHA만 별도 기록하면 된다.

### 임시/백업/Codex

- `backup-sync-temp-20261003`
  - 고유 커밋은 "Temporary PR trigger for backup export", "Run temporary backup artifact".
  - backup workflow에 임시 `pull_request` trigger와 주석만 추가.
- `codex/restore-ci-gates-20261003`
  - 당시 추가된 `test_ci_gate.js`, `test_v2_service_worker.js`는 현재 main에도 존재.
  - 현재 CI도 `npm test` + browser test 필수 gate를 유지.

### 게임 기능

- `chatgpt/add-polluted-swamp-20260930`
  - 최초 늪 이미지 자체는 현재 main과 다르지만 이후 수정된 투명 버전으로 교체된 과거 단계.
- `chatgpt/all-monsters-encounters-20260930`
- `chatgpt/battle-checkpoint-20260929`
- `chatgpt/battle-rng-state-20260929`
  - 현재 main에 `v2-battle-rng.js`와 테스트 존재.
- `chatgpt/cache-cleanup-20260929`
- `chatgpt/cache-followup-20260929`
- `chatgpt/capture-resume-20260929`
  - 현재 main에 `capture-select / capture-locked / capture-success / capture-failed / capture-complete` 구현과 `test_v2_capture_resume.js` 존재.
- `chatgpt/fix-swamp-transparency-20260930`
  - 이 브랜치의 최종 `swamp.png`와 현재 main의 blob SHA가 정확히 동일.
- `chatgpt/force-landscape-launch-20260930`
  - 이후 main 정책은 manifest orientation=`any` 등으로 변경되어 해당 강제 정책은 구버전.
- `chatgpt/run-state-adapter-20260929`
  - 현재 main에 `v2-run-state.js`, `test_v2_run_state.js`, `RUN_STATE_DESIGN.md` 존재.
- `chatgpt/run-state-runtime-20260929`
  - 현재 main에 `v2-run-state-runtime.js`, 관련 회귀 테스트 및 checkpoint 구현 존재.
- `chatgpt/shop-counter-ui-20260930`
  - `monster-shop-counter.png`는 현재 main과 blob SHA가 정확히 동일.

### 타이틀 과거 단계

다음은 현재 main의 타이틀 구현으로 대체된 과거 단계다.

- `chatgpt/title-complete-20260930`
- `chatgpt/title-deploy-20260929`
- `chatgpt/title-layout-fix-20260930`
- `chatgpt/title-logo-up-exit-tone-20260930`
- `chatgpt/title-menu-layout-select-20260930`
- `chatgpt/title-remove-portrait-fix-overlap-20260930`
- `chatgpt/title-remove-rotate-guide-20260930`
- `chatgpt/title-screen-20260929`
- `chatgpt/title-screen-deploy-20260929`
- `chatgpt/title-screen-final-20260929`
- `chatgpt/title-structural-fix-cache-20260930`
- `chatgpt/title-video-final-20260930`

검증:
- `title-video-final`의 7개 최종 미디어 파일은 모두 현재 main과 **동일 blob SHA**.
- `title-deploy`, `title-screen`에만 남은 `.github/workflows/assemble-title-media.yml`은 옛 `.title-upload/*.b64` 조각을 합치는 일회성 업로드 도구이며 현재 런타임/배포에서 사용하지 않는다.
- `title-screen-deploy`, `title-screen-final`에 있는 `test_title_screen.js`는 현재 main에는 없지만, 오래된 `launch.css?v=2`, `launch.js?v=2`, 구형 UI ID를 검사하는 역사적 테스트다.
- 동일 계열 테스트는 OPEN PR #10의 `chatgpt/title-screen-clean-20260929`에도 남아 있으므로, 이 그룹을 삭제해도 당장은 테스트 원본 하나를 보존할 수 있다.
- 현재 main의 browser smoke는 타이틀 unlock, New Game, Continue 진입을 실제 브라우저에서 검사한다.

**판정:** B 26개는 높은 확률로 삭제 가능. 다만 실제 삭제는 A-2의 열린 PR과 분리해서 진행한다.

---

## C. 목록 정리용 삭제 가능하지만 용량 효과 없음 — 2개

- `asset-stage-hunter` — ahead 0 / main의 과거 지점
- `tmp-forest-hq-upload` — ahead 0 / main의 과거 지점

둘 다 현재 코드나 열린 PR에서 참조되지 않는다.

**판정:** 브랜치 목록을 깔끔하게 만드는 목적이면 삭제 가능.
하지만 main의 조상 커밋만 가리키므로 저장소 용량 절감 효과는 사실상 없다.

---

## 현재 삭제 금지선

2차 점검 시점에는 아래 작업을 하지 않는다.

- rollback 22개 삭제 금지
- OPEN PR head 5개 삭제 금지
- main history rewrite 금지
- 이미지/오디오 과거 blob 강제 제거 금지
- force push 금지

## 가장 안전한 다음 단계

1. 현재 상태 그대로 유지
2. 오래된 OPEN PR 5개의 목적이 현재 main에서 완전히 대체됐는지 최종 검토
3. 필요 없으면 PR부터 close
4. B 그룹 26개만 삭제 후보로 처리
5. 삭제 후 branch count/배포/CI 확인
6. **저장소 용량이 실제로 얼마나 줄었는지 다시 측정**
7. 감소폭이 작으면 브랜치가 아니라 Git history의 대형 binary blob 문제로 확정하고, Godot 이관 시 새 clean repo 전략을 우선 검토

## 결론

1차의 "55개 모두 삭제" 방향은 보수적으로 철회한다.

현재 최종 권장은:

- **유지: 27개** (rollback 22 + OPEN PR head 5)
- **삭제 후보: 26개**
- **목록 정리용: 2개** (용량 효과 거의 없음)
- **main: 1개**

그리고 현재 저장소의 수백 MB 차이는 브랜치 수만으로 설명되지 않는다.
안전을 최우선으로 하면, 지금은 rollback과 열린 PR을 남기고 **명백히 대체된 26개 작업 브랜치만 별도 승인 후 정리**하는 것이 맞다.


---

# 3차 최종 삭제 목록 재점검 — 2026-10-08

사용자 요청에 따라 **삭제 대상으로 잡아둔 브랜치만 다시 검사**했다. 이번 검사는 삭제 직전 확인 수준으로 진행했으며, 아직 실제 삭제는 하지 않았다.

## 추가 검증 항목

- 현재 전체 Pull Request 28개(open/closed/merged)를 다시 조회
- 삭제 후보가 현재 OPEN PR의 head인지 재확인
- 삭제 후보 중 merged PR 브랜치는 실제 `merged_at`까지 확인
- 미병합/PR 없음 브랜치는 고유 커밋과 고유 파일을 다시 확인
- 현재 main의 4개 GitHub Actions workflow가 옛 브랜치 이름에 의존하는지 확인
- 주요 타이틀/늪/상점 바이너리 SHA를 main과 비교
- 현재 main HEAD `6e6ab7e2a6965f1f8ab900cbe830d541c79891ac`의 `Verify and deploy` 실행 성공 확인

## 삭제 목록에서 제외 상태 재확인

다음은 **삭제 금지** 상태를 그대로 유지한다.

- rollback 22개
- OPEN PR head 5개
  - `chatgpt/title-fullscreen-landscape-on-start-20260930` — PR #22
  - `chatgpt/title-visibility-contrast-20260930` — PR #20
  - `chatgpt/ci-asset-pipeline-tests-20260929` — PR #11
  - `chatgpt/title-screen-clean-20260929` — PR #10
  - `codex/run-state-design-20260929` — PR #1

이 27개는 최종 삭제 목록에 포함하지 않는다.

## 최종 삭제 가능 — 28개

### 1) 이미 Pull Request가 merge된 브랜치 — 21개

아래 브랜치는 GitHub에서 PR의 `merged_at`을 직접 확인했다. 소스 브랜치를 지워도 merge된 main 내용과 PR 기록은 유지된다.

- `codex/restore-ci-gates-20261003` — PR #28 merged
- `chatgpt/shop-counter-ui-20260930` — PR #26 merged
- `chatgpt/fix-swamp-transparency-20260930` — PR #25 merged
- `chatgpt/all-monsters-encounters-20260930` — PR #24 merged
- `chatgpt/add-polluted-swamp-20260930` — PR #23 merged
- `chatgpt/force-landscape-launch-20260930` — PR #21 merged
- `chatgpt/title-structural-fix-cache-20260930` — PR #19 merged
- `chatgpt/title-remove-portrait-fix-overlap-20260930` — PR #18 merged
- `chatgpt/title-layout-fix-20260930` — PR #17 merged
- `chatgpt/title-logo-up-exit-tone-20260930` — PR #16 merged
- `chatgpt/title-remove-rotate-guide-20260930` — PR #15 merged
- `chatgpt/title-menu-layout-select-20260930` — PR #14 merged
- `chatgpt/title-video-final-20260930` — PR #13 merged
- `chatgpt/title-complete-20260930` — PR #12 merged
- `chatgpt/cache-followup-20260929` — PR #8 merged
- `chatgpt/cache-cleanup-20260929` — PR #7 merged
- `chatgpt/capture-resume-20260929` — PR #6 merged
- `chatgpt/battle-rng-state-20260929` — PR #5 merged
- `chatgpt/battle-checkpoint-20260929` — PR #4 merged
- `chatgpt/run-state-runtime-20260929` — PR #3 merged
- `chatgpt/run-state-adapter-20260929` — PR #2 merged

### 2) 임시 백업 실행 브랜치 — 1개

- `backup-sync-temp-20261003`
  - PR #27은 closed / unmerged.
  - 고유 커밋 2개는 "Temporary PR trigger for backup export", "Run temporary backup artifact".
  - 실제 diff는 `.github/workflows/drive-backup-export.yml`에 임시 `pull_request:` 트리거와 주석을 추가한 3줄뿐.
  - 현재 main의 backup workflow는 `main` push + `workflow_dispatch` 구조로 정상 존재.
  - 최종 판정: **삭제 안전**.

### 3) 현행 타이틀로 완전히 대체된 옛 실험 브랜치 — 4개

- `chatgpt/title-deploy-20260929`
- `chatgpt/title-screen-20260929`
- `chatgpt/title-screen-deploy-20260929`
- `chatgpt/title-screen-final-20260929`

재검증 결과:
- 네 브랜치 모두 현재 OPEN PR의 head가 아니다.
- `title-screen-deploy`의 PR #9는 이미 closed / unmerged다.
- 옛 `index.html / launch.css / launch.js`는 이후 merge된 title 브랜치들과 현재 main 구현으로 대체됐다.
- `assemble-title-media.yml`은 옛 `.title-upload/*.b64`를 합치기 위한 일회성 업로드 workflow이며 main에 없고 현재 배포도 의존하지 않는다.
- 옛 `test_title_screen.js`는 main의 현재 캐시 버전과 맞지 않는 역사적 테스트이고 현재 CI에서 실행되지 않는다.
- 현재 main의 browser smoke는 title unlock, New Game, Continue를 실제 브라우저로 검사한다.
- 최종 타이틀 7개 미디어 파일은 `chatgpt/title-video-final-20260930`과 현재 main의 Git blob SHA가 모두 동일하다.
- 최종 판정: **삭제 안전**.

### 4) main의 과거 커밋만 가리키는 정리용 브랜치 — 2개

- `asset-stage-hunter` — ahead 0
- `tmp-forest-hq-upload` — ahead 0

둘 다:
- 브랜치 고유 커밋 없음
- OPEN PR 없음
- 현재 main workflow에서 브랜치명 참조 없음

최종 판정: **삭제 안전**. 단 저장소 용량 절감 효과는 거의 없다.

## 현재 workflow 의존성 확인

main에 있는 workflow는 다음과 같다.

- `drive-backup-export.yml`
- `image-backup.yml`
- `stage-clean-info-window.yml`
- `verify-and-deploy.yml`

확인 결과:
- 배포/검증은 `main` 기준
- 백업 workflow도 `main` 기준
- `stage-clean-info-window.yml`의 `.asset-stage/**`는 **파일 경로 조건**이며 `asset-stage-hunter` 브랜치 의존이 아니다.
- 삭제 예정 브랜치 이름을 직접 요구하는 현행 workflow는 없다.

## 삭제 직전 기준선

- main HEAD: `6e6ab7e2a6965f1f8ab900cbe830d541c79891ac`
- GitHub Actions: **Verify and deploy = success**
- 삭제 작업은 main 파일을 수정하지 않고 branch ref만 제거해야 한다.
- rollback 22개와 OPEN PR head 5개는 건드리지 않는다.

## 최종 결론

**삭제 목록 28개는 현재 상태 기준으로 실제 삭제해도 된다.**

위험도가 가장 낮은 근거:
1. 21개는 이미 PR merge 완료
2. 2개는 고유 커밋이 아예 없음
3. 1개는 임시 backup 실행용 3줄 diff뿐
4. 나머지 4개 옛 title 실험은 현재 main과 merge된 후속 title 구현으로 대체됨
5. 삭제 후보 중 OPEN PR head는 0개
6. 현재 workflow 의존 브랜치는 0개
7. main 최신 CI/배포 검증 성공

단, 이번 검사는 **브랜치 삭제 안전성**에 대한 최종 판정이다. 브랜치를 삭제한다고 저장소 용량이 크게 줄어든다는 뜻은 아니다.
