# GitHub 이미지 업로드 작업 지침

이 문서는 ChatGPT/Codex가 사용자가 채팅에 올린 PNG/JPG 같은 **바이너리 이미지 파일을 이 저장소에 직접 추가할 때 먼저 확인해야 하는 작업 지침**이다.

## 핵심 원칙

이미지 업로드 요청을 받으면 먼저 이 문서를 읽고, 저장소의 최신 `main` 상태와 대상 폴더를 확인한 뒤 작업한다.

특히 GitHub 연결 도구에서 일반 `create_file` / `update_file`이 UTF-8 텍스트 전용이라 이미지 파일을 바로 넣을 수 없는 경우, "이미지는 못 올린다"거나 "도구가 없다"고 끝내지 않는다. 아래의 **Git blob → tree → commit → ref 방식**을 사용한다.

## 2026-09-25 실제 성공한 방식

사용자가 제공한 두 PNG를 다음 경로에 추가할 때 성공한 절차:

- `art/v2-style/ui/dice-control-exclude-1.png`
- `art/v2-style/ui/dice-control-exclude-2.png`
- 완료 커밋: `12acdb19b72119e4779c06d52b9c21d69da630da`

### 1. 대상 위치와 최신 브랜치 확인

1. 저장소: `gamja121/necromancer-dice-board`
2. 기본 브랜치: `main`
3. 대상 이미지 폴더의 기존 파일명을 먼저 조회한다.
4. 새 파일명이 기존 파일과 충돌하는지 확인한다.

예: 주사위 컨트롤 카드는 현재 주로 `art/v2-style/ui/` 아래에 있다.

### 2. 채팅 첨부 이미지의 실제 파일을 확보

채팅에 첨부된 이미지는 conversation file 또는 런타임의 `/mnt/data/...` 파일로 제공될 수 있다.

- 파일이 런타임에 마운트되어 있으면 그 실제 경로를 사용한다.
- 파일 ID만 있으면 Files 도구로 읽거나 materialize하여 실제 파일을 확보한다.
- 이미지 내용을 다시 생성하지 말고 사용자가 올린 원본 바이트를 그대로 사용한다.

### 3. PNG/JPG를 base64 문자열로 준비

GitHub의 `create_blob`은 `encoding: "base64"`를 지원한다.

직접 바이너리 업로드 액션을 찾지 못해도, 이미지 파일을 base64 한 줄 텍스트로 만든 후 그 문자열을 GitHub blob 생성에 넘길 수 있다.

예시 개념:

```bash
base64 -w0 input.png > input.b64.txt
```

환경에 따라 `base64` 옵션이 다르면 Python 등으로 동일하게 한 줄 base64 텍스트를 만든다.

중요: base64 텍스트 파일은 **중간 운반용**이며 저장소에는 올리지 않는다.

### 4. GitHub blob 생성

각 이미지마다 다음과 같이 blob을 만든다.

- repository: `gamja121/necromancer-dice-board`
- content: 이미지 전체 base64 문자열
- encoding: `base64`

결과로 이미지마다 blob SHA를 얻는다.

### 5. 최신 main의 parent commit과 base tree 확인

업로드 직전에 반드시 다시 최신 `main`을 조회한다.

1. `main` HEAD commit SHA 확인
2. 해당 commit의 tree SHA 확인
3. 그 tree SHA를 새 tree의 `base_tree_sha`로 사용

이 단계가 중요한 이유: 예전에 조회한 SHA를 그대로 쓰면 다른 최신 변경을 덮거나 비정상적인 commit을 만들 수 있다.

### 6. 새 tree 생성

기존 tree 위에 새 이미지 blob을 추가한다.

tree entry 예시:

```text
path: art/v2-style/ui/dice-control-exclude-1.png
mode: 100644
type: blob
sha: <create_blob 결과 SHA>
```

이미지가 여러 장이면 한 tree에 여러 entry를 넣어 한 번에 commit하는 것을 우선한다.

### 7. commit 생성

- `tree_sha`: 방금 만든 tree SHA
- `parent_sha`: 최신 main HEAD SHA
- commit message: 무엇을 추가했는지 짧고 명확하게 작성

예:

```text
art: add English exclude dice control cards
```

### 8. main ref 이동

생성한 commit SHA로 `main`을 fast-forward한다.

- branch: `main`
- force: `false`

`force: true`는 특별한 이유가 없는 한 사용하지 않는다.

### 9. 반드시 업로드 검증

성공 응답만 믿지 말고 다음을 다시 확인한다.

- 대상 경로에 파일이 실제 존재하는가
- 파일명이 정확한가
- `main` HEAD가 새 commit을 가리키는가
- 기존 파일을 실수로 교체/삭제하지 않았는가

가능하면 새 commit의 changed files에도 대상 이미지들이 표시되는지 확인한다.

## 기존 파일 교체일 때

새 파일 추가가 아니라 **기존 이미지 교체**라면 두 가지 방식이 있다.

1. Git blob/tree/commit 방식에서 같은 path에 새 blob SHA를 넣어 교체
2. 바이너리를 지원하는 별도 GitHub 액션이 현재 제공되면 그것을 사용

일반 텍스트용 `update_file`에 PNG/JPG 원본을 UTF-8 문자열처럼 넣지 않는다.

## 도구를 못 찾을 때 체크 순서

"이미지 업로드 도구가 없다"고 판단하기 전에 아래 순서로 확인한다.

1. GitHub에 `create_blob`, `create_tree`, `create_commit`, `update_ref`가 있는지 찾는다.
2. 첨부 이미지를 Files 도구 또는 런타임 `/mnt/data`에서 실제 파일로 접근할 수 있는지 확인한다.
3. 원본 이미지를 base64로 변환한다.
4. `create_blob(encoding=base64)` 방식으로 진행한다.
5. 최신 main/tree를 다시 확인하고 commit한다.
6. 결과를 재조회해 검증한다.

즉 **직접적인 "upload image" 버튼형 도구가 없어도 Git data API 조합으로 이미지 업로드가 가능하다.**

## 임시 파일 정리

base64 운반을 위해 Library 등에 임시 텍스트 파일을 만든 경우 작업 완료 후 삭제한다. 저장소에는 PNG/JPG와 필요한 문서만 남긴다.

## 작업 전 확인 규칙

앞으로 ChatGPT/Codex가 이 저장소에서 사용자가 "이 이미지 깃허브에 올려", "교체해", "저장해"라고 요청하면:

1. 이 `GITHUB_IMAGE_UPLOAD_WORKFLOW.md`를 먼저 읽는다.
2. 최신 저장소/브랜치/대상 경로를 확인한다.
3. 직접 바이너리 액션이 없으면 blob/tree/commit/ref 방식을 사용한다.
4. 업로드 후 파일 존재와 commit을 다시 검증한다.

이 규칙은 특히 `art/`, `art/v2-style/` 아래의 카드, 초상화, UI, 맵, 애니메이션 이미지 작업에 적용한다.
