# ymm

Discord 채널에서 Claude Code CLI 또는 Codex CLI를 선택해서 원격 실행할 수 있는 Discord 봇입니다.

## 개요

Discord 메시지로 프롬프트를 보내면, 봇이 지정한 프로젝트 루트 경로에서 선택한 에이전트(Claude/Codex)를 실행하고 결과를 채널로 전송합니다. Claude 사용 시 세션 유지 기능으로 대화 맥락을 이어갈 수 있습니다.

두 에이전트 모두 실행 시점에 프로젝트 루트의 `CLAUDE.md`와 로컬 Codex skill/plugin 경로 목록을 프롬프트에 함께 주입받습니다. 따라서 Claude와 Codex가 동일한 작업 규칙과 보조 컨텍스트를 기준으로 동작합니다.

검증은 `npm test`, `npm run build`로 수행할 수 있습니다.

## 사전 요구사항

- [Node.js](https://nodejs.org/) v20 이상
- [Claude Code CLI](https://docs.anthropic.com/ko/docs/claude-code) (`claude` 명령어가 PATH에 등록되어 있어야 함)
- Codex CLI (`codex` 명령어가 PATH에 등록되어 있어야 함)
- Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications)에서 발급)

## 설치

```bash
npm install
```

## 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성하고 값을 채웁니다.

```bash
cp .env.example .env
```

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `DISCORD_TOKEN` | ✅ | Discord Bot Token |
| `ALLOWED_CHANNEL_IDS` | - | 봇이 응답할 채널 ID (쉼표로 구분). 미설정 시 모든 채널에서 응답 |
| `PROJECT_ROOT` | - | Claude Code가 실행될 프로젝트 루트 경로. 미설정 시 자동 감지 |
| `CODEX_BIN` | - | Codex CLI 실행 파일 이름 또는 경로 (기본값: `codex`) |

## 실행

```bash
# 개발 모드 (파일 변경 감지 자동 재시작)
npm run dev

# 프로덕션 빌드 후 실행
npm run build
npm start
```

## 사용 방법

봇이 활성화된 채널에서 메시지를 전송하면 Claude Code가 실행됩니다.

### 일반 메시지

```
버튼 컴포넌트에 hover 스타일을 추가해줘
```

### 파일 첨부

메시지에 파일을 첨부하면 Claude Code가 해당 파일을 참고하여 작업합니다.

### 명령어

| 명령어 | 설명 |
|--------|------|
| `!done` | 현재 채널의 세션을 초기화합니다 |
| `!stop` | 실행 중인 작업을 강제 종료하고 세션을 초기화합니다 |
| `!session` | 현재 활성 세션 ID를 확인합니다 |
| `!agent` | 현재 채널의 에이전트를 확인하거나 변경합니다 (`!agent claude`, `!agent codex`) |
| `!cost` | Claude Code 세션의 토큰 사용량을 확인합니다 |
| `#숫자` | GitHub 이슈 번호로 Claude Code 작업을 시작합니다 (예: `#42`) |
| `team N:작업` | N개 워커로 멀티 에이전트 병렬 실행합니다 (예: `team 3:버튼 리팩터`) |
| `/help` | 사용 가능한 명령어 목록을 표시합니다 |

### team 명령어

`team N:` 접두사를 붙이면 Claude Code가 N개의 워커를 병렬로 생성해 작업을 분산 처리합니다.

```
team 3:결제 모듈 전체 테스트 코드 작성해줘
team 2:#42
```

- `N`: 생성할 워커 수 (양의 정수)
- `:` 이후의 텍스트가 실제 작업 지시문이 됩니다
- `#숫자` 형식과 조합하면 이슈 기반 작업도 멀티 워커로 실행할 수 있습니다

## 세션 관리

채널별로 세션이 유지되어 같은 채널에서 연속된 대화 맥락으로 작업할 수 있습니다. `!done` 명령으로 세션을 초기화하면 다음 메시지부터 새 작업으로 시작합니다.

에이전트는 채널별로 선택할 수 있습니다.

```
!agent codex
!agent claude
```

- 기본값은 `claude`입니다.
- `!cost`는 Claude 에이전트에서만 동작합니다.

## Claude Code 허용 도구

보안상 다음 도구만 사용하도록 제한되어 있습니다.

- `Read` — 파일 읽기
- `Edit` — 파일 수정
- `Bash` — 터미널 명령 실행
- `Glob` — 파일 패턴 검색
- `Grep` — 파일 내용 검색

## 프로젝트 구조

```
src/
├── index.ts                  # 진입점
├── config.ts                 # 환경 변수 로드
├── claude/
│   ├── runner.ts             # Claude Code CLI 실행 및 스트림 처리
│   └── formatter.ts          # 도구 입력/결과 포맷팅
├── codex/
│   └── runner.ts             # Codex CLI 실행
└── discord/
    ├── bot.ts                # Discord 클라이언트 및 메시지 이벤트
    ├── attachments.ts        # 첨부파일 다운로드 및 프롬프트 빌드
    ├── agentStore.ts         # 채널별 에이전트(Claude/Codex) 관리
    ├── discordLogger.ts      # Discord 채널로 버퍼링하여 로그 전송
    └── sessionStore.ts       # 채널별 세션 ID 관리
```
