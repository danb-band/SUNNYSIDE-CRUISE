# ymm

Discord 채널에서 Claude Code CLI를 원격으로 실행할 수 있는 Discord 봇입니다.

## 개요

Discord 메시지로 프롬프트를 보내면, 봇이 지정한 프로젝트 루트 경로에서 Claude Code를 실행하고 결과를 채널로 전송합니다. 세션 유지 기능을 통해 대화 맥락을 이어가며 작업할 수 있습니다.

## 사전 요구사항

- [Node.js](https://nodejs.org/) v20 이상
- [Claude Code CLI](https://docs.anthropic.com/ko/docs/claude-code) (`claude` 명령어가 PATH에 등록되어 있어야 함)
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
| `!session` | 현재 활성 세션 ID를 확인합니다 |

## 세션 관리

채널별로 세션이 유지되어 같은 채널에서 연속된 대화 맥락으로 작업할 수 있습니다. `!done` 명령으로 세션을 초기화하면 다음 메시지부터 새 작업으로 시작합니다.

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
└── discord/
    ├── bot.ts                # Discord 클라이언트 및 메시지 이벤트
    ├── attachments.ts        # 첨부파일 다운로드 및 프롬프트 빌드
    ├── discordLogger.ts      # Discord 채널로 버퍼링하여 로그 전송
    └── sessionStore.ts       # 채널별 세션 ID 관리
```
