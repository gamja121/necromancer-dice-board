# 네크로멘서 앤드 다이스

주사위로 원정을 이어가고, 마물과 낙인을 조합하며, 사건과 선택으로 이야기를 만드는 로그라이크 덱빌딩 TRPG입니다.

이 저장소는 **V2 웹 프로토타입만** 배포합니다. V1 실행 코드와 전용 자산은 제거했습니다. 최종 Unity 이관 계획과 상세 기획은 [프로젝트 로드맵](PROJECT_VISION_ROADMAP.md)을 따릅니다.

## 실행

- [게임 시작](index.html): 원정 진입과 개발 도구 메뉴
- [원정](v2-map-practice.html): 24칸 지도, 주사위 컨트롤, 마물 편성, 보상, 계승
- [자동전투](v2-auto-battle-practice.html): 현재 V2 전투 규칙과 영혼 수확
- [이벤트 테스트](v2-event-lab.html): 사건 조건과 후속 분기
- 직접 조작 전투·모션·이미지·타일·효과음 테스트는 시작 화면의 개발 메뉴에서 접근합니다.

로컬 서버: `node scripts/v2-dev-server.js` → http://localhost:8788/

현재 원정은 브라우저 탭의 sessionStorage, 전투 이어하기는 localStorage를 사용합니다. 완전한 원정 영구 저장은 별도 개발 항목입니다.

## 현재 구현과 남은 작업

시작 마물 2마리와 주사위 컨트롤 카드 1장, 개체별 보유 목록, 1~4마리 전투 편성, 마물 영구 사망·영입, 보물 보상, 소비형 주사위 카드 18종, 낙인 계승, 숙영 회복, 오염도 및 단계별 타일 재생성까지 연결되어 있습니다.

Event Lab의 조건/선택/후속 사건 데이터는 아직 실제 맵 사건 선택기에 연결하기 전입니다. 정화 행동, 희귀·보스 전용 적 생성, 통합 원정 저장은 후속 개발 범위입니다. 최신 상태와 수정 내역은 [진행 기록](AI_PROJECT_PROGRESS.md)을 확인하세요.

## 코드 기준

| 영역 | 기준 파일 |
|---|---|
| 현재 전투 데이터·판정 | `v2-design-data.js`, `v2-rules.js` |
| 원정·전투 연결 | `v2-map-practice.js`, `v2-auto-battle-practice.js` |
| 주사위 컨트롤 | `v2-dice-control.js` |
| 사건 데이터·테스트 | `v2-event-data.js`, `v2-event-lab.js` |
| 직접 조작 전투의 마물 목록 | `v2-unit-data.js` |
| 원화·모션·UI | `art/v2-style/` |
| 설치·오프라인 | `manifest.webmanifest`, `service-worker.js` |

기존 V2 파일명과 저장 키는 호환성을 위해 유지합니다. 화면의 게임명은 **네크로멘서 앤드 다이스**입니다.

## 검증 및 작업 기록

- 분리 검증: `node test_v2_distribution.js`
- 전투 규칙: `node test_v2_rules.js`
- 주사위 능력: `node test_v2_dice_control.js`
- 맵 분포: `node test_v2_map_pool.js`
- 사건: `node test_v2_event_lab.js`
- [V1 제거 기록과 복구 기준](V2_MIGRATION.md)

작업 전 [GitHub 개발 운영 규칙](00_AI_GITHUB_DEV_RULES.md)과 [Codex 개발·자산 파이프라인](CODEX_DEVELOPMENT_WORKFLOW.md)을 읽습니다. 상세 기획은 [게임 규칙](GAME_DESIGN_RULES.md)과 [사건 설계](EVENT_STORY_DESIGN.md)를 따릅니다.
