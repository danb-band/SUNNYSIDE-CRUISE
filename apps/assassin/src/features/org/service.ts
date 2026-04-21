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

  // 유효한 초대가 이미 존재하면 중복 초대 차단
  const validPending = await OrgRepository.getValidPendingInvitationByEmail(orgId, email);
  if (validPending) {
    throw new Error("ALREADY_INVITED");
  }

  // 만료된 PENDING 정리 후 새 초대 생성
  return await prisma.$transaction(async (tx) => {
    await OrgRepository.markExpiredInvitations(orgId, email, tx);
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

const leaveOrg = async (orgId: string, userId: string) => {
  const member = await OrgRepository.getMember(orgId, userId);
  if (!member) throw new Error("조직의 멤버가 아닙니다.");
  if (member.role === "OWNER") throw new Error("OWNER는 조직을 나갈 수 없습니다.");
  await OrgRepository.removeMember(orgId, userId);
};

const getInvitationInfo = async (params: { token?: string; id?: string }, userEmail?: string) => {
  let invitation;
  if (params.token) {
    invitation = await OrgRepository.getInvitationByToken(params.token);
  } else if (params.id) {
    invitation = await OrgRepository.getInvitationById(params.id);
  } else {
    throw new Error("INVALID_TOKEN");
  }

  if (!invitation) throw new Error("INVALID_TOKEN");
  if (invitation.status === "ACCEPTED") throw new Error("ALREADY_ACCEPTED");
  if (invitation.status === "CANCELLED") throw new Error("REVOKED");
  if (invitation.status === "EXPIRED" || new Date() > invitation.expiresAt)
    throw new Error("EXPIRED");

  if (params.id && userEmail && invitation.email !== userEmail.toLowerCase().trim()) {
    throw new Error("EMAIL_MISMATCH");
  }

  const org = await OrgRepository.getOrgById(invitation.orgId);
  return { invitationId: invitation.id, orgName: org!.name };
};

const acceptInvitationById = async (invitationId: string, userId: string, userEmail: string) => {
  const invitation = await OrgRepository.getInvitationById(invitationId);
  if (!invitation) throw new Error("INVALID_TOKEN");
  if (invitation.status === "ACCEPTED") throw new Error("ALREADY_ACCEPTED");
  if (invitation.status === "CANCELLED") throw new Error("REVOKED");
  if (invitation.status === "EXPIRED" || new Date() > invitation.expiresAt) {
    if (invitation.status !== "EXPIRED") {
      await OrgRepository.updateInvitationStatus(invitation.id, "EXPIRED");
    }
    throw new Error("EXPIRED");
  }
  if (invitation.email !== userEmail.toLowerCase().trim()) throw new Error("EMAIL_MISMATCH");

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

const cancelInvitationByInvitee = async (invitationId: string, userEmail: string) => {
  const invitation = await OrgRepository.getInvitationById(invitationId);
  if (!invitation) throw new Error("INVALID_TOKEN");
  if (invitation.email !== userEmail.toLowerCase().trim()) throw new Error("EMAIL_MISMATCH");
  if (invitation.status !== "PENDING") throw new Error("REVOKED");
  await OrgRepository.updateInvitationStatus(invitationId, "CANCELLED");
};

const getPendingInvitationsForUser = async (userEmail: string) => {
  return await OrgRepository.getPendingInvitationsByEmail(userEmail.toLowerCase().trim());
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
  acceptInvitationById,
  getInvitationInfo,
  cancelInvitation,
  cancelInvitationByInvitee,
  removeMember,
  leaveOrg,
  markInvitationEmailSent,
  getProfileById,
  getPendingInvitations,
  getPendingInvitationsForUser,
};

export default OrgService;
