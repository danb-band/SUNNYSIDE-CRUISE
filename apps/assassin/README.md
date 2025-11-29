This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

```bash
pnpm install

pnpm assassin dev # at root
pnpm dev # at assassin directory
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
