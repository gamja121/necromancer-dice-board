# 애니메이션 시트 해상도 점검

> 목적: Godot/PC/Steam 화면에서 마물 애니메이션을 확대했을 때 발생할 수 있는 저해상도·흐림 문제를 추적한다.
> 기준: 실제 전투 런타임이 사용하는 시트와 프레임 크기를 우선 확인한다.
> 이 문서는 조사 기록이며, 아직 자산 교체는 수행하지 않았다.

## 현재 확인된 저해상도 위험 시트

| 마물 | 파일 | 시트 해상도 | 실제 프레임 크기(대략) | 위험도 | 메모 |
|---|---|---:|---:|---|---|
| Hell Mantis | `art/v2-style/animation-sheets/green-raw/hell-mantis-animation-sheet.jpg` | 1280×698 | 약 188~238 × 208~232px | 높음 | PC/Godot에서 400px 이상 확대 시 화질 저하 가능 |
| Guardian Seed | `art/v2-style/animation-sheets/green-raw/guardian-seed-animation-sheet.jpg` | 1280×698 | 약 180~266 × 188~230px | 높음 | 일부 프레임 폭이 200px 안팎 |
| Scorpion Knight | `art/v2-style/animation-sheets/green-raw/scorpion-knight-animation-sheet.jpg` | 1280×698 | 약 180~330 × 208~230px | 높음 | 가장 큰 프레임도 PC 확대에는 여유가 적음 |
| Bone Hound | `art/v2-style/animation-sheets/green-raw/bone-hound-animation-sheet.jpg` | 1280×698 | 약 184~236 × 180~234px | 매우 높음 | 사망 프레임이 특히 작음 |
| Hydra | `art/v2-style/animation-sheets/green-raw/hydra-1.jpg` | 1280×576 | 약 190~272 × 162~200px | 매우 높음 | 높이가 162px까지 내려가는 프레임 존재 |
| Abyss Harpy | `art/v2-style/animation-sheets/green-raw/abyss-harpy-animation-sheet.jpg` | 1280×698 | 약 222~260 × 210~220px | 높음 | 전체적으로 200px대 초중반 |
| Bone Golem | `art/v2-style/animation-sheets/green-raw/bone-golem-animation-sheet.jpg` | 1280×1280 | 약 230~280 × 258~270px | 중~높음 | 시트는 크지만 개별 프레임은 300px 미만 |
| Ice Princess | `art/v2-style/animation-sheets/green-raw/ice-princess-animation-sheet.jpg` | 1280×576 | 약 162~210 × 178~200px | 매우 높음 | 현재 확인군 중 가장 작은 축에 속함 |
| Goblin Soldier | `art/v2-style/animation-sheets/green-raw/goblin-soldier-1.jpg` | 1280×575 | 공격 178~248 × 204px, 사망 178~188 × 155px | 매우 높음 | 사망 프레임 높이 155px |
| Goblin Soldier | `art/v2-style/animation-sheets/green-raw/goblin-soldier-2.jpg` | 1280×575 | 피격 154~216 × 190px, 사망 190 × 113px | 최우선 | 매우 작은 사망 프레임 포함 |
| Hydra | `art/v2-style/animation-sheets/green-raw/hydra-2.jpg` | 1280×576 | 약 174~212 × 86px | 최우선 | 현재 확인된 프레임 중 세로 해상도가 가장 낮음 |
| Goblin Soldier | `art/v2-style/animation-sheets/green-raw/goblin-soldier-3.jpg` | 1280×575 | 약 190 × 113px | 최우선 | 마지막 사망 프레임용 보조 시트 |

## 현재 판단

- 시트 전체가 1280px이어도 한 시트 안에 여러 프레임을 배치하기 때문에 실제 한 프레임은 대부분 약 180~280px 수준이다.
- 모바일에서는 표시 크기가 작아 문제가 잘 드러나지 않지만, Godot에서 전투 마물을 400~600px 이상으로 확대하면 원본 디테일 부족이 눈에 띌 수 있다.
- 우선 교체 후보는 `hydra-2`, `goblin-soldier-2/3`, `ice-princess`, `hydra-1`, `bone-hound` 순으로 본다.
- 고해상도 교체 시 한 프레임 기준 최소 512px급, 가능하면 768~1024px급 원본을 확보하고 Godot에서 축소 표시하는 방향이 안전하다.

## 다음 조사 순서

1. 나머지 직접 참조 시트를 2~5개 단위로 계속 측정
2. 위험 시트 전체 목록 확정
3. 가장 심한 시트부터 고해상도 원본/재생성 여부 결정
