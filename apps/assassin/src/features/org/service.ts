import OrgRepository from "./repository";
import { assertOrgMember } from "@libs/auth/assertOrgMember";
import { CreateOrgPayload, InviteMemberPayload, UpdateOrgPayload } from "./schema";
import { normalizeEmail } from "./utils/normalizeEmail";

const createOrg = async (creatorUserId: string, input: CreateOrgPayload) => {
  const existing = await OrgRepository.getOrgBySlug(input.slug);
  if (existing) {
    throw new Error("이미 사용 중인 slug입니다.");
  }

  const org = await OrgRepository.createOrg(input);
  // 생성자를 OWNER로 자동 등록
  await OrgRepository.addMember(org.id, creatorUserId, "OWNER");

  return org;
};

const getOrgBySlug = async (slug: string) => {
  const org = await OrgRepository.getOrgBySlug(slug);
  if (!org) {
    throw new Error("조직을 찾을 수 없습니다.");
  }
  return org;
};

const getUserOrgs = async (userId: string) => {
  return await OrgRepository.getOrgsByUserId(userId);
};

const updateOrg = async (orgId: string, requesterId: string, input: UpdateOrgPayload) => {
  await assertOrgMember(requesterId, orgId, "OWNER");
  return await OrgRepository.updateOrg(orgId, input);
};

const deleteOrg = async (orgId: string, requesterId: string) => {
  await assertOrgMember(requesterId, orgId, "OWNER");
  await OrgRepository.deleteOrg(orgId);
};

const getOrgMembers = async (orgId: string, requesterId: string) => {
  await assertOrgMember(requesterId, orgId);
  return await OrgRepository.getOrgMembers(orgId);
};

const inviteMember = async (orgId: string, requesterId: string, input: InviteMemberPayload) => {
  await assertOrgMember(requesterId, orgId, "OWNER");
  return await OrgRepository.createInvitation(orgId, input.email);
};

const acceptInvitation = async (token: string, authUser: { userId: string; email: string }) => {
  const invitation = await OrgRepository.getInvitationByToken(token);

  if (!invitation) {
    throw new Error("유효하지 않은 초대 토큰입니다.");
  }

  if (invitation.status === "CANCELLED") {
    throw new Error("취소된 초대입니다.");
  }

  if (invitation.status === "ACCEPTED") {
    throw new Error("이미 수락된 초대입니다.");
  }

  if (invitation.status === "EXPIRED") {
    throw new Error("만료된 초대입니다.");
  }

  if (new Date() > invitation.expiresAt) {
    await OrgRepository.updateInvitationStatus(invitation.id, "EXPIRED");
    throw new Error("만료된 초대입니다.");
  }

  const normalizedInviteEmail = normalizeEmail(invitation.email);
  const normalizedUserEmail = normalizeEmail(authUser.email);
  if (normalizedInviteEmail !== normalizedUserEmail) {
    throw new Error("초대된 이메일과 현재 로그인한 계정 이메일이 일치하지 않습니다.");
  }

  const result = await OrgRepository.acceptInvitationAtomically({
    invitationId: invitation.id,
    orgId: invitation.orgId,
    userId: authUser.userId,
  });

  const org = await OrgRepository.getOrgById(invitation.orgId);
  if (!org) {
    throw new Error("조직을 찾을 수 없습니다.");
  }

  return {
    org,
    alreadyMember: result.alreadyMember,
    invitationStatus: "ACCEPTED" as const,
  };
};

const cancelInvitation = async (invitationId: string, orgId: string, requesterId: string) => {
  await assertOrgMember(requesterId, orgId, "OWNER");
  await OrgRepository.updateInvitationStatus(invitationId, "CANCELLED");
};

const removeMember = async (orgId: string, targetUserId: string, requesterId: string) => {
  await assertOrgMember(requesterId, orgId, "OWNER");

  const targetMember = await OrgRepository.getMember(orgId, targetUserId);
  if (targetMember?.role === "OWNER") {
    throw new Error("OWNER는 제거할 수 없습니다.");
  }

  await OrgRepository.removeMember(orgId, targetUserId);
};

const OrgService = {
  createOrg,
  getOrgBySlug,
  getUserOrgs,
  updateOrg,
  deleteOrg,
  getOrgMembers,
  inviteMember,
  acceptInvitation,
  cancelInvitation,
  removeMember,
};

export default OrgService;
