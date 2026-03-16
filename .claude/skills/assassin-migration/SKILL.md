---
name: assassin-migration
description: >
  Guide for adding a new Supabase migration to the assassin app.
  Use this skill whenever a new DB table, column, enum, index, RLS policy, trigger, or
  Prisma model change is needed. Triggers on requests like "add a table", "create a migration",
  "add a column to X", "new Prisma model", "DB schema 변경", "RLS 추가", "마이그레이션 만들어줘",
  or any request that requires touching prisma/schema.prisma or supabase/migrations/.
---

# Assassin App Migration Guide

## Architecture Overview

This project uses **two schema sources of truth** that must stay in sync:

| File | Role |
|---|---|
| `apps/assassin/prisma/schema.prisma` | Prisma ORM model definitions (TypeScript types + query client) |
| `apps/assassin/supabase/migrations/*.sql` | Actual DDL applied to the Supabase Postgres DB |

Prisma does **not** generate or apply migrations here — SQL migrations are written by hand and applied via the Supabase CLI. Prisma then introspects the DB to stay in sync.

---

## Step-by-Step Workflow

### 1. Write the SQL migration file

Create a new file in `apps/assassin/supabase/migrations/`:

```
YYYYMMDDHHMMSS_<short_description>.sql
```

Timestamp format: `20260315120000` (date + time, no separators). Use the current date/time. Keep descriptions lowercase with underscores: `add_user_votes`, `add_rls_to_season`.

### 2. Update `prisma/schema.prisma`

Add the corresponding Prisma model(s) to mirror the new table(s). The Prisma model must match the SQL schema exactly — field names, types, and constraints.

### 3. Apply locally & regenerate the Prisma client

```bash
# Apply the migration to the local Supabase DB
cd apps/assassin
supabase db push          # OR: supabase migration up

# Regenerate Prisma client from the updated DB schema
pnpm --filter assassin db:generate
```

---

## SQL Migration Patterns

### Basic table (no RLS)

```sql
-- Migration: add_<table_name>

CREATE TABLE IF NOT EXISTS public.<table_name> (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  -- fields...
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT <table_name>_pkey PRIMARY KEY (id)
);

CREATE INDEX "<table_name>_<field>_idx" ON public.<table_name>("<field>");
```

### Table with RLS (most common)

Wrap in a transaction. Always `DROP POLICY IF EXISTS` before `CREATE POLICY` so re-runs are safe.

```sql
-- Migration: add_<table_name>

BEGIN;

CREATE TABLE IF NOT EXISTS public.<table_name> (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  "userId"    uuid        NOT NULL,
  -- fields...
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT <table_name>_pkey PRIMARY KEY (id),
  CONSTRAINT <table_name>_user_id_fkey
    FOREIGN KEY ("userId") REFERENCES public.profiles(id)
    ON DELETE NO ACTION ON UPDATE NO ACTION
);

ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view <table_name>" ON public.<table_name>;
DROP POLICY IF EXISTS "Users can manage their own <table_name>" ON public.<table_name>;

CREATE POLICY "Anyone can view <table_name>"
  ON public.<table_name> FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own <table_name>"
  ON public.<table_name> FOR ALL
  USING (auth.uid() = "userId");

COMMIT;
```

### Adding Realtime support

Add this block when the table needs live updates (e.g., collaborative features):

```sql
ALTER TABLE public.<table_name> REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = '<table_name>'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.<table_name>;
  END IF;
END $$;
```

### Adding a column to an existing table

```sql
-- Migration: add_<column>_to_<table>

ALTER TABLE public.<table_name>
  ADD COLUMN IF NOT EXISTS "<columnName>" <type> NOT NULL DEFAULT <default>;
```

### Adding an enum type

Declare enum before the table that uses it:

```sql
CREATE TYPE "<EnumName>" AS ENUM ('VALUE_A', 'VALUE_B');
```

---

## RLS Policy Reference

Choose the right policy based on access intent:

| Intent | USING clause |
|---|---|
| Public read | `true` |
| Owner only | `auth.uid() = "userId"` |
| Authenticated users | `auth.role() = 'authenticated'` |
| Write check (INSERT) | Use `WITH CHECK (...)` instead of `USING` |

---

## Prisma Schema Conventions

Mirror the SQL table exactly. Key rules:

- `@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` for UUID primary keys
- `@db.Timestamptz(6)` for timestamp fields
- `@@map("<table_name>")` to map the Prisma model name to the actual table name
- Add `/// This model contains row level security...` comment above models with RLS
- Relations use `@relation(fields: [...], references: [...], onDelete: ..., onUpdate: ...)`

```prisma
/// This model contains row level security and requires additional setup for migrations.
model ExampleModel {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @db.Uuid
  content   String
  createdAt DateTime @default(now()) @db.Timestamptz(6)
  updatedAt DateTime @default(now()) @db.Timestamptz(6)
  profile   Profile  @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@map("example_model")
}
```

---

## Checklist

```
[ ] 1. Create supabase/migrations/YYYYMMDDHHMMSS_<description>.sql
[ ] 2. Write DDL — use IF NOT EXISTS / IF NOT EXISTS for idempotency
[ ] 3. Add indexes for foreign keys and frequently queried fields
[ ] 4. Enable RLS + add policies if the table holds user data
[ ] 5. Add Realtime support if the table needs live updates
[ ] 6. Update prisma/schema.prisma to mirror the new table
[ ] 7. Run: supabase db push (or supabase migration up)
[ ] 8. Run: pnpm --filter assassin db:generate
[ ] 9. Verify Prisma client reflects the new model
```

---

## Important Notes

- **Never edit `src/generated/prisma/`** — this is auto-generated by `db:generate`.
- **`pnpm assassin db:pull`** re-introspects the DB into `schema.prisma`. Use it if the DB and schema drift apart, but be careful — it overwrites manual Prisma changes.
- **Column name casing**: Postgres stores unquoted names as lowercase, but this project uses camelCase with quotes (e.g., `"userId"`, `"createdAt"`). Always quote camelCase column names in SQL.
- **Migration files are append-only**: never edit an existing migration that has been applied. Create a new one instead.