# Local Supabase Setup (Docker)

## Prerequisites

- Docker daemon running (Docker Desktop / Colima / OrbStack)
- Xcode Command Line Tools installed

## One-shot CLI (recommended)

From `apps/assassin`:

./supabase/setup-local-supabase.sh

## Login (local)

- Email: demo@local.test
- Password: demo1234

## Local env (apps/assassin/.env.local)

NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
DIRECT_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
DELETE_PW_PEPPER=<EXISTING>
DELETE_PW_BCRYPT_COST=12

## Manual Commands (optional)

### 1) Install Xcode Command Line Tools

xcode-select --install

### 2) Install Supabase CLI

brew install supabase/tap/supabase

### 3) Initialize Supabase in the repo

supabase init

### 4) Start local Supabase (Docker)

supabase start

If you use Colima and see a docker.sock mount error, run:

supabase start -x vector

### 5) Verify services

supabase status

### 6) Apply Prisma schema to local DB

pnpm assassin exec prisma db push

### 7) Seed demo data (example)

docker exec -i supabase_db_SUNNYSIDE-CRUISE psql -U postgres -d postgres <<'SQL'
BEGIN;
WITH demo_profile AS (
  INSERT INTO profiles (id, name)
  VALUES (gen_random_uuid(), 'Demo User')
  RETURNING id
), seasons AS (
  INSERT INTO season (id, name, "sortOrder", "isArchived")
  VALUES
    (gen_random_uuid(), 'Season 1', 1, false),
    (gen_random_uuid(), 'Season 2', 2, false)
  RETURNING id, name
)
INSERT INTO song (id, "seasonId", name, artist, description, "youtubeUrl", "sortOrder", "userId")
SELECT gen_random_uuid(), seasons.id, song_data.name, song_data.artist, song_data.description,
       song_data.youtube_url, song_data.sort_order, (SELECT id FROM demo_profile)
FROM seasons
JOIN (
  VALUES
    ('Season 1', 'Song A', 'Artist A', 'Demo song A', 'https://youtu.be/dQw4w9WgXcQ', 100),
    ('Season 1', 'Song B', 'Artist B', 'Demo song B', 'https://youtu.be/3GwjfUFyY6M', 200),
    ('Season 2', 'Song C', 'Artist C', 'Demo song C', 'https://youtu.be/oHg5SJYRHA0', 100)
) AS song_data(season_name, name, artist, description, youtube_url, sort_order)
  ON song_data.season_name = seasons.name;
COMMIT;
SQL

## Notes

- If Docker pulls time out, re-run `supabase start`.
- If `supabase start` fails on postgres image, pull it explicitly:
  docker pull public.ecr.aws/supabase/postgres:17.6.1.075
