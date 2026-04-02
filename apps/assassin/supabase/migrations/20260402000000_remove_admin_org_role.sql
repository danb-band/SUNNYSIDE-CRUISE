BEGIN;

-- ADMIN 롤 제거 전 기존 데이터를 MEMBER로 다운그레이드
UPDATE org_member SET role = 'MEMBER' WHERE role = 'ADMIN';
UPDATE org_invitation SET role = 'MEMBER' WHERE role = 'ADMIN';

-- org_role enum에서 ADMIN 제거
ALTER TYPE org_role RENAME TO org_role_old;
CREATE TYPE org_role AS ENUM ('OWNER', 'MEMBER');

ALTER TABLE org_member
  ALTER COLUMN role TYPE org_role USING role::text::org_role;

ALTER TABLE org_invitation
  ALTER COLUMN role TYPE org_role USING role::text::org_role;

DROP TYPE org_role_old;

COMMIT;
