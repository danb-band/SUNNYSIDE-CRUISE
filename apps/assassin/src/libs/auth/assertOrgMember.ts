import { prisma } from "@libs/prisma/client";

export type OrgRole = "OWNER" | "ADMIN" | "MEMBER";

const ROLE_HIERARCHY: Record<OrgRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
};

/**
 * 현재 유저가 해당 org의 멤버인지 검사한다.
 * minRole이 지정되면 해당 권한 이상인지도 검사한다.
 * 검사 실패 시 Error를 throw한다.
 */
export async function assertOrgMember(
  userId: string,
  orgId: string,
  minRole?: OrgRole,
): Promise<void> {
  const member = await prisma.orgMember.findUnique({
    where: {
      orgId_userId: { orgId, userId },
    },
  });

  if (!member) {
    throw new Error("이 조직의 멤버가 아닙니다.");
  }

  if (minRole && ROLE_HIERARCHY[member.role as OrgRole] < ROLE_HIERARCHY[minRole]) {
    throw new Error(`이 작업을 수행하려면 ${minRole} 이상의 권한이 필요합니다.`);
  }
}
