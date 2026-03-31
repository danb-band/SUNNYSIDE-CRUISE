-- Step 2: 기본 org 생성 후 백필, 그 다음 NOT NULL 제약 추가
-- 프로덕션에서는 이 마이그레이션 전에 백필 스크립트를 별도 실행해야 함

-- 기본 org 생성 (개발 환경용)
INSERT INTO org (id, name, slug, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Organization',
  'default',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- 기존 season 레코드에 기본 org_id 백필
UPDATE season SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;

-- 기존 calendar_event 레코드에 기본 org_id 백필
UPDATE calendar_event SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;

-- NOT NULL 제약 추가
ALTER TABLE season ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE calendar_event ALTER COLUMN org_id SET NOT NULL;

-- 인덱스 추가
CREATE INDEX idx_season_org_id ON season(org_id);
CREATE INDEX idx_calendar_event_org_id ON calendar_event(org_id);
CREATE INDEX idx_org_member_org_id ON org_member(org_id);
CREATE INDEX idx_org_member_user_id ON org_member(user_id);
CREATE INDEX idx_org_invitation_org_id ON org_invitation(org_id);
CREATE INDEX idx_org_invitation_token ON org_invitation(token);
