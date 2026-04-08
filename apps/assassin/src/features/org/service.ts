import OrgRepository from "./repository";
import { prisma } from "@libs/prisma/client";
import { assertOrgMember } from "@libs/auth/assertOrgMember";
import { CreateOrgPayload, InviteMemberPayload, UpdateOrgPayload } from "./schema";

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

const getOrgById = async (orgId: string) => {
  return await OrgRepository.getOrgById(orgId);
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

  const email = input.email.toLowerCase().trim();

  // 이미 가입된 유저라면 조직 멤버 여부 확인
  const existingUserId = await OrgRepository.findUserIdByEmail(email);
  if (existingUserId) {
    const existingMember = await OrgRepository.getMember(orgId, existingUserId);
    if (existingMember) {
      throw new Error("이미 조직의 멤버입니다.");
    }
  }

  // 기존 PENDING 초대 취소 후 재생성 — 두 작업을 트랜잭션으로 묶어 원자성 보장
  return await prisma.$transaction(async (tx) => {
    await OrgRepository.cancelPendingInvitationsByEmail(orgId, email, tx);
    return await OrgRepository.createInvitation(orgId, email, "MEMBER", tx);
  });
};

const acceptInvitation = async (token: string, userId: string, userEmail: string) => {
  const invitation = await OrgRepository.getInvitationByToken(token);

  if (!invitation) throw new Error("INVALID_TOKEN");

  // 상태별 명시적 에러 코드
  if (invitation.status === "ACCEPTED") throw new Error("ALREADY_ACCEPTED");
  if (invitation.status === "CANCELLED") throw new Error("REVOKED");
  if (invitation.status === "EXPIRED" || new Date() > invitation.expiresAt) {
    if (invitation.status !== "EXPIRED") {
      await OrgRepository.updateInvitationStatus(invitation.id, "EXPIRED");
    }
    throw new Error("EXPIRED");
  }

  // 초대 이메일과 로그인한 유저 이메일 정확히 일치해야 함
  if (invitation.email !== userEmail.toLowerCase().trim()) {
    throw new Error("EMAIL_MISMATCH");
  }

  // 멤버 추가와 초대 상태 업데이트를 트랜잭션으로 묶어 원자성 보장
  // 멱등성: 트랜잭션 안에서 이미 멤버인지 확인 후 추가
  await prisma.$transaction(async (tx) => {
    const existingMember = await OrgRepository.getMember(invitation.orgId, userId);
    if (!existingMember) {
      await OrgRepository.addMember(invitation.orgId, userId, "MEMBER", tx);
    }
    await OrgRepository.updateInvitationStatus(invitation.id, "ACCEPTED", tx);
  });

  const org = await OrgRepository.getOrgById(invitation.orgId);
  return org!;
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

const markInvitationEmailSent = async (invitationId: string) => {
  await OrgRepository.markInvitationEmailSent(invitationId);
};

const getProfileById = async (userId: string) => {
  return await OrgRepository.getProfileById(userId);
};

const getPendingInvitations = async (orgId: string, requesterId: string) => {
  await assertOrgMember(requesterId, orgId);
  return await OrgRepository.getPendingInvitationsByOrg(orgId);
};

const OrgService = {
  createOrg,
  getOrgById,
  getOrgBySlug,
  getUserOrgs,
  updateOrg,
  deleteOrg,
  getOrgMembers,
  inviteMember,
  acceptInvitation,
  cancelInvitation,
  removeMember,
  markInvitationEmailSent,
  getProfileById,
  getPendingInvitations,
};

export default OrgService;
