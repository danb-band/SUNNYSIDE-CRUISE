# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## 5. Issue Management (Discord → Claude Code Pipeline)

이 프로젝트는 Discord 요청 → GitHub 이슈 생성 → 코드 작업 순서로 동작합니다.

### 이슈 생성 규칙

Discord 요청을 받아 GitHub 이슈를 생성할 때:

- **영향 범위는 반드시 구체적인 파일/패키지 경로로 명시.** 모노레포의 경우 어느 패키지인지 반드시 포함.
- **완료 조건은 검증 가능한 형태로.** "구현한다" ❌ → "~를 호출하면 ~를 반환한다" ✅
- **모호한 요청은 가정을 `❓ 불명확한 사항` 섹션에 명시하고 진행.** 임의로 결정하지 않는다.
- label은 요청 성격에 따라 판단: 새 기능이면 `enhancement`, 리팩터링/문서화/설정이면 `task`

### 이슈 기반 작업 규칙

이슈를 읽고 작업을 시작하기 전:
- 이슈의 **영향 범위** 밖의 파일은 수정하지 않는다. (섹션 3과 동일 원칙)
- **완료 조건을 하나씩 체크**하며 작업하고, 모두 충족되면 종료한다. (섹션 4와 동일 원칙)
- 이슈에 명시되지 않은 변경이 필요하면 임의로 수정하지 않고 새 이슈를 생성한다.

### 브랜치 워크플로우

새 이슈 작업을 시작할 때는 반드시 아래 순서를 따른다:

```
1. git checkout dev
2. git pull origin dev
3. git checkout -b feature/<이슈번호>-<짧은-설명>
   예시: feature/12-add-init-command
4. 작업 후 PR을 dev 브랜치로 생성
```

- **main 브랜치에 직접 push 금지.** PR은 반드시 `dev`를 target으로 한다.
- PR 제목 형식: `[#이슈번호] <작업 내용 요약>`
- PR body에는 완료 조건 체크리스트를 그대로 복사해서 붙인다.

### 커밋 컨벤션

```
<type>(<scope>): <subject>

closes #<이슈번호>
```

- type: `feat` / `fix` / `refactor` / `docs` / `chore` / `test`
- scope: 영향 받는 패키지 또는 모듈명
- 예시: `feat(cli): add init command closes #12`

---

## 6. Safety Rules

**절대 하면 안 되는 것. 예외 없음.**

### 파괴적 명령어
- `rm -rf` 실행 금지
- `git push --force` / `git push -f` 금지
- `git reset --hard` 금지 (작업 중 이력 파괴)
- 조건 없는 DB 쿼리 금지: `DELETE FROM <table>`, `DROP TABLE`, `TRUNCATE`
- `chmod 777`, `chown` 등 권한 변경 금지

### 민감한 정보
- `.env`, `.env.*`, `.env.local` 등 환경변수 파일 커밋 금지
- API key, secret, token, password 하드코딩 금지
- `console.log` / 로그에 민감한 객체(req, user, token 등) 출력 금지
- 위 항목이 포함된 파일은 수정 전 반드시 확인하고, 의심스러우면 멈추고 물어본다

### 범위 이탈
- `node_modules/`, `dist/`, `build/` 직접 수정 금지
- `pnpm-lock.yaml`, `package-lock.json` 수동 편집 금지
- `.gitignore`에 등록된 파일 커밋 금지
- `main` 브랜치 직접 push 금지

> 위 항목이 필요하다고 판단되면, 실행하지 말고 이유와 함께 사용자에게 확인을 요청한다.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, clarifying questions come before implementation rather than after mistakes, every issue has verifiable acceptance criteria before work begins, and no destructive or sensitive operations are executed without explicit confirmation.