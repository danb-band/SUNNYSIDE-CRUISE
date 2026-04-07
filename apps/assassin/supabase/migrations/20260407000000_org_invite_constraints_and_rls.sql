-- Migration: org_invite_constraints_and_rls
-- 목적: org/org_member/org_invitation 테이블에 누락된 제약조건, 인덱스, RLS 추가
--
-- 이전 마이그레이션(20260320000000, 20260320000001)에서:
--   - 테이블 DDL, enum, 기본 인덱스(orgId/userId/token)는 이미 생성됨
--   - RLS 미적용, 중복 PENDING 초대 방지 인덱스 누락
--
-- 이 마이그레이션에서 추가하는 것:
--   1. org_invitation: partial unique index (orgId, email) WHERE status = 'PENDING'
--   2. org_invitation: email 단독 인덱스
--   3. org / org_member / org_invitation: RLS 활성화 + 정책

BEGIN;

-- ──────────────────────────────────────────────────────────────
-- 1. INDEXES
-- ──────────────────────────────────────────────────────────────

-- 중복 활성 초대 방지:
--   동일 org에 동일 email로 PENDING 초대가 둘 이상 존재하지 못하도록 DB 레벨에서 강제.
--   partial index로 PENDING 상태만 대상으로 하기 때문에
--   ACCEPTED/EXPIRED/CANCELLED 기록은 이력으로 여러 개 남길 수 있음.
CREATE UNIQUE INDEX IF NOT EXISTS "org_invitation_orgId_email_pending_idx"
  ON public.org_invitation ("orgId", email)
  WHERE status = 'PENDING';

-- 초대 수락 시 auth.email() 기준으로 초대 조회:
--   사용자가 로그인 후 본인 이메일로 된 초대를 찾을 때 사용.
--   token 조회(PK 수준)와 별개로 email 기준 조회 경로를 별도 인덱스로 지원.
CREATE INDEX IF NOT EXISTS "org_invitation_email_idx"
  ON public.org_invitation (email);

-- ──────────────────────────────────────────────────────────────
-- 2. RLS — org
-- ──────────────────────────────────────────────────────────────
-- 기존 calendar_event RLS와 달리, org는 멤버십 기반으로 접근을 제한함.
-- 서버 액션은 service_role key(RLS bypass)로 동작하므로
-- 여기서의 RLS는 클라이언트 직접 접근 및 anon 요청에 대한 보호 역할.

ALTER TABLE public.org ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view their org"  ON public.org;
DROP POLICY IF EXISTS "Authenticated users can create org" ON public.org;
DROP POLICY IF EXISTS "Org owners can update org"       ON public.org;
DROP POLICY IF EXISTS "Org owners can delete org"       ON public.org;

-- 자신이 멤버인 org만 조회 가능
CREATE POLICY "Org members can view their org"
  ON public.org FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_member
      WHERE "orgId" = org.id
        AND "userId" = auth.uid()
    )
  );

-- 인증된 사용자는 org 생성 가능 (생성 후 서비스 레이어에서 OWNER 멤버 추가)
CREATE POLICY "Authenticated users can create org"
  ON public.org FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- OWNER만 org 정보 수정 가능
CREATE POLICY "Org owners can update org"
  ON public.org FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_member
      WHERE "orgId" = org.id
        AND "userId" = auth.uid()
        AND role = 'OWNER'
    )
  );

-- OWNER만 org 삭제 가능
CREATE POLICY "Org owners can delete org"
  ON public.org FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_member
      WHERE "orgId" = org.id
        AND "userId" = auth.uid()
        AND role = 'OWNER'
    )
  );

-- ──────────────────────────────────────────────────────────────
-- 3. RLS — org_member
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.org_member ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view members"    ON public.org_member;
DROP POLICY IF EXISTS "Org admins can add members"      ON public.org_member;
DROP POLICY IF EXISTS "Org owners can update roles"     ON public.org_member;
DROP POLICY IF EXISTS "Org admins can remove members"   ON public.org_member;

-- 같은 org 멤버라면 멤버 목록 조회 가능
CREATE POLICY "Org members can view members"
  ON public.org_member FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_member AS m
      WHERE m."orgId" = org_member."orgId"
        AND m."userId" = auth.uid()
    )
  );

-- ADMIN 이상만 멤버 추가 가능
CREATE POLICY "Org admins can add members"
  ON public.org_member FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_member AS m
      WHERE m."orgId" = org_member."orgId"
        AND m."userId" = auth.uid()
        AND m.role = 'OWNER'
    )
  );

-- OWNER만 역할 변경 가능
CREATE POLICY "Org owners can update roles"
  ON public.org_member FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_member AS m
      WHERE m."orgId" = org_member."orgId"
        AND m."userId" = auth.uid()
        AND m.role = 'OWNER'
    )
  );

-- ADMIN 이상은 멤버 제거 가능, 또는 본인 스스로 탈퇴
CREATE POLICY "Org admins can remove members"
  ON public.org_member FOR DELETE
  USING (
    org_member."userId" = auth.uid()  -- 본인 탈퇴
    OR EXISTS (
      SELECT 1 FROM public.org_member AS m
      WHERE m."orgId" = org_member."orgId"
        AND m."userId" = auth.uid()
        AND m.role = 'OWNER'
    )
  );

-- ──────────────────────────────────────────────────────────────
-- 4. RLS — org_invitation
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.org_invitation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org admins can view invitations"     ON public.org_invitation;
DROP POLICY IF EXISTS "Invited user can view own invitation" ON public.org_invitation;
DROP POLICY IF EXISTS "Org admins can create invitations"   ON public.org_invitation;
DROP POLICY IF EXISTS "Org admins can cancel invitations"   ON public.org_invitation;
DROP POLICY IF EXISTS "Invited user can accept invitation"  ON public.org_invitation;

-- ADMIN 이상은 해당 org의 초대 목록 조회 가능
CREATE POLICY "Org admins can view invitations"
  ON public.org_invitation FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_member AS m
      WHERE m."orgId" = org_invitation."orgId"
        AND m."userId" = auth.uid()
        AND m.role = 'OWNER'
    )
  );

-- 초대받은 본인(이메일 일치)도 자신의 초대 조회 가능 — 수락 페이지에서 필요
CREATE POLICY "Invited user can view own invitation"
  ON public.org_invitation FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ADMIN 이상만 초대 생성 가능
CREATE POLICY "Org admins can create invitations"
  ON public.org_invitation FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_member AS m
      WHERE m."orgId" = org_invitation."orgId"
        AND m."userId" = auth.uid()
        AND m.role = 'OWNER'
    )
  );

-- ADMIN 이상은 초대 취소(status 업데이트) 가능
CREATE POLICY "Org admins can cancel invitations"
  ON public.org_invitation FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_member AS m
      WHERE m."orgId" = org_invitation."orgId"
        AND m."userId" = auth.uid()
        AND m.role = 'OWNER'
    )
  );

-- 초대받은 본인만 수락(status 업데이트) 가능
CREATE POLICY "Invited user can accept invitation"
  ON public.org_invitation FOR UPDATE
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

COMMIT;
