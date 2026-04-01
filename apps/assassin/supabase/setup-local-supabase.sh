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

demo_users = [
    ("demo@local.test",    "Demo User"),
    ("user01@local.test",  "김민지"),
    ("user02@local.test",  "이준서"),
    ("user03@local.test",  "박서연"),
    ("user04@local.test",  "최현우"),
    ("user05@local.test",  "정유나"),
    ("user06@local.test",  "강도현"),
    ("user07@local.test",  "윤지아"),
    ("user08@local.test",  "임태양"),
    ("user09@local.test",  "서하은"),
]

for email, name in demo_users:
    payload = json.dumps({
        "email": email,
        "password": "demo1234",
        "email_confirm": True,
        "user_metadata": {"name": name},
    })
    subprocess.run(
        [
            "curl", "-s", "-X", "POST",
            f"{api_url}/auth/v1/admin/users",
            "-H", f"apikey: {secret_key}",
            "-H", f"Authorization: Bearer {secret_key}",
            "-H", "Content-Type: application/json",
            "-d", payload,
        ],
        check=False,
    )
PY

# Drop cross-schema FK before Prisma introspects (Prisma cannot manage auth schema)
docker exec -i "$db_container" psql -U postgres -d postgres \
  -c "ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;"

# Apply SQL migrations first (must run before prisma db push so nullable→backfill→NOT NULL pattern works)
for migration in "$SCRIPT_DIR/migrations"/*.sql; do
  [ -f "$migration" ] || continue
  echo "Applying migration: $(basename "$migration")"
  docker exec -i "$db_container" psql -U postgres -d postgres < "$migration"
done

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

# Seed demo data
cat <<'SQL' | docker exec -i "$db_container" psql -U postgres -d postgres
BEGIN;

-- Profiles (10 users)
INSERT INTO profiles (id, name, "realName")
SELECT u.id, v.realname, v.realname
FROM auth.users u
JOIN (VALUES
  ('demo@local.test',    'Demo User'),
  ('user01@local.test',  '김민지'),
  ('user02@local.test',  '이준서'),
  ('user03@local.test',  '박서연'),
  ('user04@local.test',  '최현우'),
  ('user05@local.test',  '정유나'),
  ('user06@local.test',  '강도현'),
  ('user07@local.test',  '윤지아'),
  ('user08@local.test',  '임태양'),
  ('user09@local.test',  '서하은')
) AS v(email, realname) ON u.email = v.email
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, "realName" = EXCLUDED."realName";

-- Seasons (4개, 1-3 archived)
INSERT INTO season (id, name, "sortOrder", "isArchived")
SELECT gen_random_uuid(), v.name, v.sort_order, v.archived
FROM (VALUES
  ('Season 1', 1, true),
  ('Season 2', 2, true),
  ('Season 3', 3, true),
  ('Season 4', 4, false)
) AS v(name, sort_order, archived)
WHERE NOT EXISTS (SELECT 1 FROM season WHERE name = v.name);

-- Songs (20곡, 시즌당 5곡)
INSERT INTO song (id, "seasonId", name, artist, description, "youtubeUrl", "sortOrder", "userId")
SELECT
  gen_random_uuid(),
  s.id,
  v.song_name,
  v.artist,
  v.description,
  'https://youtu.be/dQw4w9WgXcQ',
  v.sort_order,
  (SELECT id FROM auth.users WHERE email = 'demo@local.test' LIMIT 1)
FROM season s
JOIN (VALUES
  ('Season 1', 'Dynamite',      'BTS',          '신나는 영어 팝 싱글',        100),
  ('Season 1', '소격동',         'IU',           '감성적인 스트링 발라드',     200),
  ('Season 1', '너의 이름은',   'YOASOBI',      '애니 OST 기반 J-pop',        300),
  ('Season 1', 'Love Dive',     'IVE',          '아이돌 팝',                  400),
  ('Season 1', 'Pink Venom',    'BLACKPINK',    '블랙핑크 컴백 타이틀',       500),
  ('Season 2', 'Hype Boy',      'NewJeans',     '뉴진스 데뷔 타이틀',         100),
  ('Season 2', 'After LIKE',    'IVE',          '아이브 히트 팝',             200),
  ('Season 2', 'ANTIFRAGILE',   'Le Sserafim',  '르세라핌 강렬 트랙',         300),
  ('Season 2', 'Nxde',          '(G)I-DLE',     '여자아이들 콘셉추얼 팝',     400),
  ('Season 2', 'Queencard',     '(G)I-DLE',     '여자아이들 걸크러시',        500),
  ('Season 3', 'Ditto',         'NewJeans',     '뉴진스 감성 R&B',            100),
  ('Season 3', 'Eve, Psyche & The Bluebeard''s wife', 'Le Sserafim', '르세라핌 무드 트랙', 200),
  ('Season 3', 'Cupid',         'FIFTY FIFTY',  '피프티피프티 바이럴 팝',     300),
  ('Season 3', 'Spicy',         'aespa',        '에스파 강렬 일렉트로닉',     400),
  ('Season 3', 'Cool with You', 'NewJeans',     '뉴진스 여름 감성',           500),
  ('Season 4', 'I AM',          'IVE',          '아이브 자신감 넘치는 팝',    100),
  ('Season 4', 'OMG',           'NewJeans',     '뉴진스 몽환적 팝',           200),
  ('Season 4', 'Supernova',     'aespa',        '에스파 우주적 팝',           300),
  ('Season 4', 'Attention',     'NewJeans',     '뉴진스 청량 데뷔 트랙',      400),
  ('Season 4', 'UNFORGIVEN',    'Le Sserafim',  '르세라핌 컴백 타이틀',       500)
) AS v(season_name, song_name, artist, description, sort_order)
  ON v.season_name = s.name
WHERE NOT EXISTS (SELECT 1 FROM song WHERE name = v.song_name AND "seasonId" = s.id);

-- Players (곡당 5명: 보컬·기타·베이스·드럼·키보드, 유저 순환)
DO $$
DECLARE
  v_song_id    UUID;
  v_user_ids   UUID[];
  v_instruments TEXT[] := ARRAY['VOCAL', 'GUITAR', 'BASS', 'DRUM', 'KEYBOARD'];
  v_offset     INTEGER := 0;
BEGIN
  IF (SELECT COUNT(*) FROM player) > 0 THEN RETURN; END IF;

  SELECT ARRAY_AGG(id ORDER BY email) INTO v_user_ids
  FROM auth.users WHERE email LIKE '%@local.test';

  FOR v_song_id IN SELECT id FROM song ORDER BY "createdAt" LOOP
    FOR i IN 1..5 LOOP
      INSERT INTO player (id, "songId", user_id, instrument)
      VALUES (
        gen_random_uuid(), v_song_id,
        v_user_ids[((v_offset + i - 1) % array_length(v_user_ids, 1)) + 1],
        v_instruments[i]
      );
    END LOOP;
    v_offset := (v_offset + 1) % array_length(v_user_ids, 1);
  END LOOP;
END $$;

-- Comments (곡당 3개, 유저·텍스트 순환)
DO $$
DECLARE
  v_song_id  UUID;
  v_user_ids UUID[];
  v_texts    TEXT[] := ARRAY[
    '연습할 때 이 파트 너무 어려웠는데 잘 된 것 같아요!',
    '이번 공연에서 제일 좋았어요 ㅎㅎ',
    '다음에 또 하고 싶다',
    '키보드 파트 너무 멋있었어요',
    '보컬 소름이었음',
    '드럼 솔로 구간 최고!',
    '베이스 라인이 살아있네요',
    '기타 리프 연습 열심히 했죠 ㅎ',
    '합주할 때 이 곡 제일 재밌었음',
    '다음 시즌에도 꼭 하고 싶어요'
  ];
  v_offset INTEGER := 0;
BEGIN
  IF (SELECT COUNT(*) FROM comment) > 0 THEN RETURN; END IF;

  SELECT ARRAY_AGG(id ORDER BY email) INTO v_user_ids
  FROM auth.users WHERE email LIKE '%@local.test';

  FOR v_song_id IN SELECT id FROM song ORDER BY "createdAt" LOOP
    FOR i IN 1..3 LOOP
      INSERT INTO comment (id, "songId", content, "userId")
      VALUES (
        gen_random_uuid(), v_song_id,
        v_texts[((v_offset + i - 1) % array_length(v_texts, 1)) + 1],
        v_user_ids[((v_offset + i) % array_length(v_user_ids, 1)) + 1]
      );
    END LOOP;
    v_offset := (v_offset + 2) % array_length(v_user_ids, 1);
  END LOOP;
END $$;

-- Song likes (곡당 3~7개) + likeCount 업데이트
DO $$
DECLARE
  v_song_id  UUID;
  v_user_ids UUID[];
  v_like_cnt INTEGER;
  v_offset   INTEGER := 0;
BEGIN
  IF (SELECT COUNT(*) FROM song_like) > 0 THEN RETURN; END IF;

  SELECT ARRAY_AGG(id ORDER BY email) INTO v_user_ids
  FROM auth.users WHERE email LIKE '%@local.test';

  FOR v_song_id IN SELECT id FROM song ORDER BY "createdAt" LOOP
    v_like_cnt := 3 + (v_offset % 5);
    FOR i IN 1..v_like_cnt LOOP
      INSERT INTO song_like (id, "songId", "userId")
      VALUES (
        gen_random_uuid(), v_song_id,
        v_user_ids[((v_offset + i - 1) % array_length(v_user_ids, 1)) + 1]
      )
      ON CONFLICT ("songId", "userId") DO NOTHING;
    END LOOP;
    UPDATE song SET "likeCount" = v_like_cnt WHERE id = v_song_id;
    v_offset := (v_offset + 3) % array_length(v_user_ids, 1);
  END LOOP;
END $$;

-- Calendar events (8개: 합주 4 + 공연 4)
INSERT INTO calendar_event (id, title, location, "startDate", "endDate")
SELECT gen_random_uuid(), v.title, v.location, v.start_date::timestamptz, v.end_date::timestamptz
FROM (VALUES
  ('합주 #1',       '합주실 A',       now() - interval '60 days', now() - interval '60 days' + interval '3 hours'),
  ('합주 #2',       '합주실 B',       now() - interval '30 days', now() - interval '30 days' + interval '3 hours'),
  ('합주 #3',       '합주실 A',       now() - interval '7 days',  now() - interval '7 days'  + interval '3 hours'),
  ('합주 #4',       '합주실 C',       now() + interval '14 days', now() + interval '14 days' + interval '3 hours'),
  ('정기 공연 1회', '홍대 클럽 FF',   now() - interval '45 days', now() - interval '45 days' + interval '2 hours'),
  ('정기 공연 2회', '대학로 소극장',  now() - interval '15 days', now() - interval '15 days' + interval '2 hours'),
  ('버스킹',        '연대 앞 광장',   now() + interval '3 days',  now() + interval '3 days'  + interval '90 minutes'),
  ('정기 공연 3회', '강남 재즈바',    now() + interval '21 days', now() + interval '21 days' + interval '2 hours')
) AS v(title, location, start_date, end_date)
WHERE NOT EXISTS (SELECT 1 FROM calendar_event WHERE title = v.title);

-- RSVP (전원 응답, ~1/5 확률로 NOT_ATTENDING)
DO $$
DECLARE
  v_event_id UUID;
  v_user_ids UUID[];
  v_idx      INTEGER := 0;
BEGIN
  IF (SELECT COUNT(*) FROM calendar_event_rsvp) > 0 THEN RETURN; END IF;

  SELECT ARRAY_AGG(id ORDER BY email) INTO v_user_ids
  FROM auth.users WHERE email LIKE '%@local.test';

  FOR v_event_id IN SELECT id FROM calendar_event ORDER BY "startDate" LOOP
    FOR i IN 1..array_length(v_user_ids, 1) LOOP
      INSERT INTO calendar_event_rsvp (id, "eventId", "userId", status)
      VALUES (
        gen_random_uuid(), v_event_id,
        v_user_ids[i],
        CASE WHEN (v_idx + i) % 5 = 0 THEN 'NOT_ATTENDING'::"RsvpStatus" ELSE 'ATTENDING'::"RsvpStatus" END
      )
      ON CONFLICT ("eventId", "userId") DO NOTHING;
    END LOOP;
    v_idx := v_idx + 1;
  END LOOP;
END $$;

-- CalendarEventSong (이벤트당 4곡, 순환)
DO $$
DECLARE
  v_event_id UUID;
  v_song_ids UUID[];
  v_offset   INTEGER := 0;
BEGIN
  IF (SELECT COUNT(*) FROM calendar_event_song) > 0 THEN RETURN; END IF;

  SELECT ARRAY_AGG(id ORDER BY "createdAt") INTO v_song_ids FROM song;

  FOR v_event_id IN SELECT id FROM calendar_event ORDER BY "startDate" LOOP
    FOR i IN 1..4 LOOP
      INSERT INTO calendar_event_song (id, "eventId", "songId")
      VALUES (
        gen_random_uuid(), v_event_id,
        v_song_ids[((v_offset + i - 1) % array_length(v_song_ids, 1)) + 1]
      )
      ON CONFLICT ("eventId", "songId") DO NOTHING;
    END LOOP;
    v_offset := (v_offset + 4) % array_length(v_song_ids, 1);
  END LOOP;
END $$;

-- Org members (demo user → OWNER, 나머지 → MEMBER)
INSERT INTO org_member (id, "orgId", "userId", role)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  u.id,
  CASE WHEN u.email = 'demo@local.test' THEN 'OWNER'::"OrgRole" ELSE 'MEMBER'::"OrgRole" END
FROM auth.users u
WHERE u.email LIKE '%@local.test'
ON CONFLICT ("orgId", "userId") DO NOTHING;

COMMIT;
SQL

echo "Local Supabase is running."
echo "Login: demo@local.test / demo1234  (+ user01~user09@local.test, 동일 비밀번호)"
echo "Update apps/assassin/.env.local with Project URL + Publishable key from 'supabase status'."