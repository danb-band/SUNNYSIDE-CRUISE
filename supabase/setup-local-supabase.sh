#!/usr/bin/env bash
set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI not found. Install with: brew install supabase/tap/supabase" >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker Desktop and retry." >&2
  exit 1
fi

# Initialize Supabase if not present
if [ ! -d "./supabase" ]; then
  supabase init
fi

# Start local Supabase
supabase start

status_json=$(supabase status --output json)

# Create demo auth user (idempotent)
STATUS_JSON="$status_json" python - <<'PY'
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

# Apply Prisma schema
pnpm assassin exec prisma db push

# Seed demo data
cat <<'SQL' | docker exec -i supabase_db_SUNNYSIDE-CRUISE psql -U postgres -d postgres
BEGIN;
WITH demo_profile AS (
  INSERT INTO profiles (id, name)
  SELECT id, 'Demo User'
  FROM auth.users
  WHERE email = 'demo@local.test'
  ON CONFLICT (id) DO NOTHING
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
       song_data.youtube_url, song_data.sort_order, (SELECT id FROM demo_profile LIMIT 1)
FROM seasons
JOIN (
  VALUES
    ('Season 1', 'Song A', 'Artist A', 'Demo song A', 'https://youtu.be/dQw4w9WgXcQ', 100),
    ('Season 1', 'Song B', 'Artist B', 'Demo song B', 'https://youtu.be/3GwjfUFyY6M', 200),
    ('Season 2', 'Song C', 'Artist C', 'Demo song C', 'https://youtu.be/oHg5SJYRHA0', 100)
) AS song_data(season_name, name, artist, description, youtube_url, sort_order)
  ON song_data.season_name = seasons.name;

WITH u AS (
  SELECT id FROM auth.users WHERE email = 'demo@local.test' LIMIT 1
), s AS (
  SELECT id FROM song ORDER BY "createdAt" ASC LIMIT 1
)
INSERT INTO comment (id, "songId", content, "userId")
SELECT gen_random_uuid(), s.id, 'Demo comment', u.id
FROM u, s;
COMMIT;
SQL

echo "Local Supabase is running."
echo "Login: demo@local.test / demo1234"
echo "Update apps/assassin/.env.local with Project URL + Publishable key from 'supabase status'."