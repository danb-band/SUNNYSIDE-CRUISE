-- Step 2: 기본 org 생성 후 백필, 그 다음 NOT NULL 제약 추가
-- 프로덕션에서는 이 마이그레이션 전에 백필 스크립트를 별도 실행해야 함

-- 기본 org 생성 (개발 환경용)
INSERT INTO org (id, name, slug, "createdAt", "updatedAt")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Organization',
  'default',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- 기존 season 레코드에 기본 orgId 백필
UPDATE season SET "orgId" = '00000000-0000-0000-0000-000000000001' WHERE "orgId" IS NULL;

-- 기존 calendar_event 레코드에 기본 orgId 백필
UPDATE calendar_event SET "orgId" = '00000000-0000-0000-0000-000000000001' WHERE "orgId" IS NULL;

-- NOT NULL 제약 추가
ALTER TABLE season ALTER COLUMN "orgId" SET NOT NULL;
ALTER TABLE calendar_event ALTER COLUMN "orgId" SET NOT NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS "season_orgId_idx" ON season("orgId");
CREATE INDEX IF NOT EXISTS "calendar_event_orgId_idx" ON calendar_event("orgId");
CREATE INDEX IF NOT EXISTS "org_member_orgId_idx" ON org_member("orgId");
CREATE INDEX IF NOT EXISTS "org_member_userId_idx" ON org_member("userId");
CREATE INDEX IF NOT EXISTS "org_invitation_orgId_idx" ON org_invitation("orgId");
CREATE INDEX IF NOT EXISTS "org_invitation_token_idx" ON org_invitation(token);
