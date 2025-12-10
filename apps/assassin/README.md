This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

```bash
pnpm install

pnpm assassin dev # at root
pnpm dev # at assassin directory
```

### Prisma init

```bash
pnpm install # (새로운 환경변수 추가)
pnpm assassin exec prisma init # (prisma init)
pnpm assassin db:pull # (supabase database를 읽어서 prisma/schema.prisma 파일을 자동 생성)
pnpm assassin db:generate # (prisma/schema.prisma를 읽어서 타입과 클라이언트 코드 생성)
```

### 디렉토리 구조

```
assassin/
├── src/
│   ├── app/ (App Router 구조)
│   │   └── song/[songId]
│   ├── components/
│   │   ├── common/
│   │   ├── season/
│   │   └── song/
│   ├── features/ (도메인, 비즈니스 로직. UI로직 XXXXX)
│   │   ├── comment/
│   │   ├── player/
│   │   ├── season/
│   │   └── song/
│   ├── libs/
│   │   └── supabase/ (DB 클라이언트)
│   │   └── utils/
│   └── stores/ (상태 관리)

```
