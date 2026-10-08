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
| Skeleton Spear | `art/v2-style/animation-sheets/green-raw/skeleton-spear-animation-sheet.jpg` | 1280×714 | 런타임 분해 프레임 280×270px | 높음 | 웹 전투는 `animation-test-frames/skeleton-spear/` 사용 |
| Ancient Treant | `art/v2-style/animation-sheets/green-raw/ancient-treant-animation-sheet.jpg` | 1280×575 | 런타임 분해 프레임 280×270px | 높음 | Godot 확대 시 원본 한계 노출 가능 |
| Stone Golem | `art/v2-style/animation-sheets/green-raw/stone-golem-animation-sheet.jpg` | 1280×698 | 런타임 분해 프레임 280×270px | 높음 | Godot 확대 시 원본 한계 노출 가능 |
| Doom Executor | `art/v2-style/animation-sheets/green-raw/doom-executor-animation-sheet.jpg` | 1280×575 | 런타임 분해 프레임 250×250px | 매우 높음 | 400px 이상 표시 시 확대율이 큼 |
| Plague Doctor | `art/v2-style/animation-sheets/green-raw/plague-doctor-animation-sheet.jpg` | 1280×575 | 런타임 분해 프레임 250×250px | 매우 높음 | 400px 이상 표시 시 확대율이 큼 |
| Death Knight | `art/v2-style/animation-sheets/green-raw/death-knight-animation-sheet.jpg` | 1280×796 | 런타임 분해 프레임 320×270px | 높음 | 세로 270px 기준이라 큰 화면 확대 시 한계 |
| Goblin Rider | `art/v2-style/animation-sheets/green-raw/goblin-rider-animation-sheet.jpg` | 1280×575 | 런타임 분해 프레임 280×270px | 높음 | PC 확대 시 선명도 저하 가능 |
| Orc Warrior | `art/v2-style/animation-sheets/green-raw/orc-warrior-animation-sheet.jpg` | 1280×698 | 런타임 분해 프레임 250×250px | 매우 높음 | 400px 이상 표시 시 확대율이 큼 |
| Boulder Ogre | `art/v2-style/animation-sheets/green-raw/boulder-ogre-animation-sheet.jpg` | 1280×714 | 런타임 분해 프레임 250×250px | 매우 높음 | 400px 이상 표시 시 확대율이 큼 |
| Plague Frog | `art/v2-style/animation-sheets/green-raw/plague-frog-animation-sheet.jpg` | 1280×575 | 런타임 분해 프레임 250×250px | 매우 높음 | 400px 이상 표시 시 확대율이 큼 |
| Goblin Chief | `art/v2-style/animation-sheets/green-raw/goblin-chief-animation-sheet.jpg` | 1280×575 | 런타임 분해 프레임 250×250px | 매우 높음 | 400px 이상 표시 시 확대율이 큼 |
| Grave Priest | `art/v2-style/animation-sheets/green-raw/grave-priest-animation-sheet.jpg` | 1280×576 | 런타임 분해 프레임 280×250px | 높음 | 세로 250px라 PC 확대 시 한계 |
| Forest Fairy | `art/v2-style/animation-sheets/green-raw/forest-fairy-animation-sheet.jpg` | 1280×633 | 런타임 분해 프레임 280×250px | 높음 | 세로 250px라 PC 확대 시 한계 |
| Skeleton Cavalry | `art/v2-style/animation-sheets/green-raw/skeleton-cavalry-animation-sheet.jpg` | 1280×714 | 런타임 분해 프레임 320×250px | 높음 | 세로 해상도 250px 기준 |
| Soul Reaper | `art/v2-style/animation-sheets/green-raw/soul-reaper-animation-sheet.jpg` | 1280×714 | 런타임 분해 프레임 320×250px | 높음 | 세로 해상도 250px 기준 |
| Mummy Guardian | `art/v2-style/animation-sheets/green-raw/mummy-guardian-animation-sheet.jpg` | 1280×714 | 런타임 분해 프레임 250×250px | 매우 높음 | 400px 이상 표시 시 확대율이 큼 |
| Ice Lord | `art/v2-style/animation-sheets/green-raw/ice-lord-animation-sheet.jpg` | 1280×957 | 런타임 분해 프레임 250×250px | 매우 높음 | 원본 시트는 크지만 전투 프레임은 250×250 |
| Kraken | `art/v2-style/animation-sheets/green-raw/kraken-animation-sheet.jpg` | 1280×575 | 런타임 분해 프레임 280×250px | 높음 | PC 확대 시 선명도 저하 가능 |
| Mimic | `art/v2-style/animation-sheets/green-raw/mimic-animation-sheet.jpg` | 1280×576 | 런타임 분해 프레임 320×250px | 높음 | 세로 250px 기준이라 확대 시 한계 |
| Mushroom Soldier | `art/v2-style/animation-sheets/green-raw/mushroom-soldier-animation-sheet.jpg` | 1280×576 | 런타임 분해 프레임 280×250px | 높음 | 세로 250px 기준이라 확대 시 한계 |
| Sea Wolf | `art/v2-style/animation-sheets/green-raw/sea-wolf-animation-sheet.jpg` | 1280×576 | 런타임 분해 프레임 280×250px | 높음 | PC 확대 시 선명도 저하 가능 |
| Siren | `art/v2-style/animation-sheets/green-raw/siren-animation-sheet.jpg` | 1280×698 | 런타임 분해 프레임 280×250px | 높음 | 세로 250px 기준이라 확대 시 한계 |
| Spider Knight | `art/v2-style/animation-sheets/green-raw/spider-knight-animation-sheet.jpg` | 1280×576 | 런타임 분해 프레임 280×250px | 높음 | PC 확대 시 선명도 저하 가능 |
| Spiderling | `art/v2-style/animation-sheets/green-raw/spiderling-animation-sheet.jpg` | 1280×698 | 런타임 분해 프레임 260×250px | 매우 높음 | 이번 확인군 중 가장 작은 프레임 폭 |
| Raging Treant | `art/v2-style/animation-sheets/green-raw/raging-treant-animation-sheet.jpg` | 1280×575 | 런타임 분해 프레임 300×250px | 높음 | 세로 250px 기준이라 확대 시 한계 |
| Corpse Slime | `art/v2-style/animation-sheets/green-raw/corpse-slime-animation-sheet.jpg` | 1280×575 | 런타임 분해 프레임 280×270px | 높음 | PC 확대 시 선명도 저하 가능 |
| Crystal Devourer | `art/v2-style/animation-sheets/green-raw/crystal-devourer-animation-sheet.jpg` | 1280×575 | 런타임 분해 프레임 280×250px | 높음 | 세로 250px 기준이라 확대 시 한계 |
| Flesh Golem | `art/v2-style/animation-sheets/green-raw/flesh-golem-animation-sheet.jpg` | 1280×575 | 런타임 분해 프레임 260×250px | 매우 높음 | 400px 이상 표시 시 확대율이 큼 |
| Grave Worm | `art/v2-style/animation-sheets/green-raw/grave-worm-animation-sheet.jpg` | 1280×714 | 런타임 분해 프레임 280×250px | 높음 | 세로 250px 기준이라 확대 시 한계 |
| Yeti | `art/v2-style/animation-sheets/green-raw/yeti-animation-sheet.jpg` | 1280×698 | 런타임 분해 프레임 250×250px | 매우 높음 | 400px 이상 표시 시 확대율이 큼 |
| Abyss Eye | `art/v2-style/animation-sheets/green-raw/abyss-eye-animation-sheet.jpg` | 1280×576 | 런타임 분해 프레임 280×250px | 높음 | 세로 250px 기준이라 확대 시 한계 |
| Cerberus | `art/v2-style/animation-sheets/green-raw/cerberus-animation-sheet.jpg` | 1280×714 | 런타임 분해 프레임 260×250px | 매우 높음 | 400px 이상 표시 시 확대율이 큼 |
| Goblin Commoner | `art/v2-style/animation-sheets/green-raw/goblin-commoner-animation-sheet.png` | 1280×575 | 런타임 분해 프레임 250×250px | 매우 높음 | 400px 이상 표시 시 확대율이 큼 |
| Minotaur | `art/v2-style/animation-sheets/green-raw/minotaur-animation-sheet.jpg` | 1280×714 | 런타임 분해 프레임 300×270px | 높음 | PC 확대 시 선명도 저하 가능 |
| Skeleton Archer | `art/v2-style/animation-sheets/green-raw/skeleton-archer-animation-sheet.jpg` | 1280×575 | 런타임 분해 프레임 280×250px | 높음 | 세로 250px 기준이라 확대 시 한계 |
| Abyss Claw Hunter | `art/v2-style/animation-sheets/green-raw/abyss-claw-hunter-animation-sheet.jpg` | 1280×714 | 런타임 분해 프레임 280×270px | 높음 | PC 확대 시 선명도 저하 가능 |
| Ghoul | `art/v2-style/animation-sheets/green-raw/ghoul-animation-sheet.jpg` | 1280×698 | 런타임 분해 프레임 250×250px | 매우 높음 | 400px 이상 표시 시 확대율이 큼 |
| Dracula | `art/v2-style/animation-sheets/uploaded-raw/dracula-attack.webp` | 1536×592 | 5×2 분할, 원본 셀 약 307×296px / 런타임 캔버스 320×320 | 높음 | 전투 테스트에서 시트를 직접 분할 사용 |

## 참고: 런타임 직접 사용 아님

- `art/v2-style/animation-sheets/green-raw/abyss-claw-hunter-attack-03-generated.png` — 공격 3프레임 복구용 생성 파일. 현재 런타임 직접 참조는 확인되지 않음.
- `art/v2-style/animation-sheets/green-raw/abyss-claw-hunter-attack-03-original-target.png` — 원본 편집 타깃 250×250. 현재 런타임 직접 참조는 확인되지 않음.

## 현재 판단

- 시트 전체가 1280~1536px이어도 한 시트 안에 여러 프레임을 배치하기 때문에 실제 한 프레임은 대부분 약 180~320px 수준이다.
- 모바일에서는 표시 크기가 작아 문제가 잘 드러나지 않지만, Godot에서 전투 마물을 400~600px 이상으로 확대하면 원본 디테일 부족이 눈에 띌 수 있다.
- 우선 교체 후보는 `hydra-2`, `goblin-soldier-2/3`, `ice-princess`, `hydra-1`, `bone-hound`, `doom-executor`, `plague-doctor` 순으로 본다.
- 고해상도 교체 시 한 프레임 기준 최소 512px급, 가능하면 768~1024px급 원본을 확보하고 Godot에서 축소 표시하는 방향이 안전하다.

## 다음 조사 순서

1. green-raw 및 직접 참조 예외 시트 1차 전수 점검 완료
2. 위험 시트 전체 우선순위 확정
3. 가장 심한 시트부터 고해상도 원본/재생성 여부 결정
