-- Step 1: org 관련 테이블 생성 + Season/CalendarEvent에 nullable orgId 추가

-- org_role enum
CREATE TYPE org_role AS ENUM ('OWNER', 'MEMBER');

-- invitation_status enum
CREATE TYPE invitation_status AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- org 테이블
CREATE TABLE org (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- org_member 테이블
CREATE TABLE org_member (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId" UUID NOT NULL REFERENCES org(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role org_role NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("orgId", "userId")
);

-- org_invitation 테이블
CREATE TABLE org_invitation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId" UUID NOT NULL REFERENCES org(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  role org_role NOT NULL DEFAULT 'MEMBER',
  status invitation_status NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- season에 nullable orgId 추가
ALTER TABLE season ADD COLUMN "orgId" UUID REFERENCES org(id);

-- calendar_event에 nullable orgId 추가
ALTER TABLE calendar_event ADD COLUMN "orgId" UUID REFERENCES org(id);
