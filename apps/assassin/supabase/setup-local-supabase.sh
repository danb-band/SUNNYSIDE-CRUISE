#!/usr/bin/env bash
set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI not found. Install with: brew install supabase/tap/supabase" >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker and retry." >&2
  exit 1
fi

# Supabase CLI requires config.toml to be in cwd
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

docker_context="$(docker context show 2>/dev/null || true)"
docker_endpoint="$(docker context inspect "$docker_context" --format '{{(index .Endpoints "docker").Host}}' 2>/dev/null || true)"

# Initialize Supabase if not present
if [ ! -f "config.toml" ]; then
  supabase init
fi

# Start local Supabase
if [[ "$docker_endpoint" == *"/.colima/"* ]]; then
  echo "Detected Colima Docker socket. Starting Supabase with '-x vector' to avoid docker.sock mount issue."
  supabase start -x vector
else
  supabase start
fi

status_json=$(supabase status --output json)

# Derive local DB URL and container name from supabase status
local_db_url=$(echo "$status_json" | python3 -c "import json,sys; s=json.load(sys.stdin); print(s['DB_URL'])")
db_container=$(docker ps --filter "name=supabase_db_" --format "{{.Names}}" | head -1)

if [ -z "$db_container" ]; then
  echo "Could not find supabase_db container. Is Supabase running?" >&2
  exit 1
fi

echo "Using DB container: $db_container"
echo "Using DB URL: $local_db_url"

# Create demo auth user (idempotent)
python_cmd=""
if command -v python3 >/dev/null 2>&1; then
  python_cmd="python3"
elif command -v python >/dev/null 2>&1; then
  python_cmd="python"
else
  echo "Python not found. Install with: brew install python" >&2
  exit 1
fi

STATUS_JSON="$status_json" "$python_cmd" - <<'PY'
import json
import os
import subprocess

status = json.loads(os.environ["STATUS_JSON"])
api_url = status["API_URL"]
secret_key = status["SECRET_KEY"]

payload = '{"email":"demo@local.test","password":"demo1234","email_confirm":true}'

subprocess.run(
  [
    "curl",
    "-s",
    "-X",
    "POST",
    f"{api_url}/auth/v1/admin/users",
    "-H",
    f"apikey: {secret_key}",
    "-H",
    f"Authorization: Bearer {secret_key}",
    "-H",
    "Content-Type: application/json",
    "-d",
    payload,
  ],
  check=False,
)
PY

# Drop cross-schema FK before Prisma introspects (Prisma cannot manage auth schema)
docker exec -i "$db_container" psql -U postgres -d postgres \
  -c "ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;"

# Apply Prisma schema (explicitly use local DB URL so prisma.config.ts doesn't fall back to remote)
DATABASE_URL="$local_db_url" DIRECT_URL="$local_db_url" pnpm exec prisma db push

# Ensure realtime publication + replica identity for core tables
cat <<'SQL' | docker exec -i "$db_container" psql -U postgres -d postgres
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'season' AND relnamespace = 'public'::regnamespace) THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.season;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    ALTER TABLE public.season REPLICA IDENTITY FULL;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'song' AND relnamespace = 'public'::regnamespace) THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.song;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    ALTER TABLE public.song REPLICA IDENTITY FULL;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'comment' AND relnamespace = 'public'::regnamespace) THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.comment;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    ALTER TABLE public.comment REPLICA IDENTITY FULL;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'player' AND relnamespace = 'public'::regnamespace) THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.player;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    ALTER TABLE public.player REPLICA IDENTITY FULL;
  END IF;
END $$;
SQL

# Apply SQL migrations
for migration in "$SCRIPT_DIR/migrations"/*.sql; do
  [ -f "$migration" ] || continue
  echo "Applying migration: $(basename "$migration")"
  docker exec -i "$db_container" psql -U postgres -d postgres < "$migration"
done

# Seed demo data
cat <<'SQL' | docker exec -i "$db_container" psql -U postgres -d postgres
BEGIN;

-- Profile
INSERT INTO profiles (id, name)
SELECT id, 'Demo User' FROM auth.users WHERE email = 'demo@local.test'
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Seasons
INSERT INTO season (id, name, "sortOrder", "isArchived")
SELECT gen_random_uuid(), v.name, v.sort_order, false
FROM (VALUES ('Season 1', 1), ('Season 2', 2)) AS v(name, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM season WHERE name = v.name);

-- Songs
INSERT INTO song (id, "seasonId", name, artist, description, "youtubeUrl", "sortOrder", "userId")
SELECT
  gen_random_uuid(),
  s.id,
  v.song_name,
  v.artist,
  v.description,
  v.youtube_url,
  v.sort_order,
  (SELECT id FROM auth.users WHERE email = 'demo@local.test' LIMIT 1)
FROM season s
JOIN (VALUES
  ('Season 1', 'Song A', 'Artist A', 'Demo song A', 'https://youtu.be/dQw4w9WgXcQ', 100),
  ('Season 1', 'Song B', 'Artist B', 'Demo song B', 'https://youtu.be/3GwjfUFyY6M', 200),
  ('Season 2', 'Song C', 'Artist C', 'Demo song C', 'https://youtu.be/oHg5SJYRHA0', 100)
) AS v(season_name, song_name, artist, description, youtube_url, sort_order)
  ON v.season_name = s.name
WHERE NOT EXISTS (SELECT 1 FROM song WHERE name = v.song_name AND "seasonId" = s.id);

-- Comment
INSERT INTO comment (id, "songId", content, "userId")
SELECT gen_random_uuid(), s.id, 'Demo comment', u.id
FROM
  (SELECT id FROM auth.users WHERE email = 'demo@local.test' LIMIT 1) u,
  (SELECT id FROM song ORDER BY "createdAt" ASC LIMIT 1) s
WHERE NOT EXISTS (SELECT 1 FROM comment WHERE content = 'Demo comment');

-- Calendar events
INSERT INTO calendar_event (id, title, location, "startDate", "endDate")
SELECT gen_random_uuid(), v.title, v.location, v.start_date::timestamptz, v.end_date::timestamptz
FROM (VALUES
  ('합주', '합주실 A', now() + interval '2 days', now() + interval '2 days' + interval '2 hours'),
  ('공연', '대공연장', now() + interval '7 days', now() + interval '7 days' + interval '3 hours')
) AS v(title, location, start_date, end_date)
WHERE NOT EXISTS (SELECT 1 FROM calendar_event WHERE title = v.title);

COMMIT;
SQL

echo "Local Supabase is running."
echo "Login: demo@local.test / demo1234"
echo "Update apps/assassin/.env.local with Project URL + Publishable key from 'supabase status'."