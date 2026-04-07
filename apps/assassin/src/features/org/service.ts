import crypto from "crypto";
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
    await tx.orgInvitation.updateMany({
      where: { orgId, email, status: "PENDING" },
      data: { status: "CANCELLED" },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return await tx.orgInvitation.create({
      data: { orgId, email, token, role: "MEMBER", status: "PENDING", expiresAt },
    });
  });
};

const acceptInvitation = async (token: string, userId: string) => {
  const invitation = await OrgRepository.getInvitationByToken(token);

  if (!invitation) {
    throw new Error("유효하지 않은 초대 토큰입니다.");
  }

  if (invitation.status !== "PENDING") {
    throw new Error("이미 처리된 초대입니다.");
  }

  if (new Date() > invitation.expiresAt) {
    await OrgRepository.updateInvitationStatus(invitation.id, "EXPIRED");
    throw new Error("만료된 초대입니다.");
  }

  // 멤버 추가와 초대 상태 업데이트를 트랜잭션으로 묶어 원자성 보장
  await prisma.$transaction(async (tx) => {
    await tx.orgMember.create({ data: { orgId: invitation.orgId, userId, role: "MEMBER" } });
    await tx.orgInvitation.update({ where: { id: invitation.id }, data: { status: "ACCEPTED" } });
  });

  return OrgRepository.getOrgById(invitation.orgId);
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

const getProfileById = async (userId: string) => {
  return await OrgRepository.getProfileById(userId);
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
  getProfileById,
};

export default OrgService;
