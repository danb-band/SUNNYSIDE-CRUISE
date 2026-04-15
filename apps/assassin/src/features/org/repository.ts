import { prisma } from "@libs/prisma/client";
import { Prisma } from "../../generated/prisma/client";
import { CreateOrgPayload, UpdateOrgPayload } from "./schema";
import crypto from "crypto";

async function getOrgById(id: string) {
  return await prisma.org.findUnique({ where: { id } });
}

async function getOrgBySlug(slug: string) {
  return await prisma.org.findUnique({ where: { slug } });
}

async function getOrgsByUserId(userId: string) {
  return await prisma.org.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
  });
}

async function createOrg(input: CreateOrgPayload) {
  return await prisma.org.create({
    data: {
      name: input.name,
      slug: input.slug,
    },
  });
}

async function updateOrg(id: string, input: UpdateOrgPayload) {
  return await prisma.org.update({
    where: { id },
    data: { name: input.name },
  });
}

async function deleteOrg(id: string) {
  await prisma.org.delete({ where: { id } });
}

// OrgMember
async function addMember(
  orgId: string,
  userId: string,
  role: "OWNER" | "MEMBER",
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;
  return await client.orgMember.create({
    data: { orgId, userId, role },
  });
}

async function getMember(orgId: string, userId: string) {
  return await prisma.orgMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });
}

async function getOrgMembers(orgId: string) {
  return await prisma.orgMember.findMany({
    where: { orgId },
    include: { profile: true },
  });
}

async function updateMemberRole(orgId: string, userId: string, role: "OWNER" | "MEMBER") {
  return await prisma.orgMember.update({
    where: { orgId_userId: { orgId, userId } },
    data: { role },
  });
}

async function removeMember(orgId: string, userId: string) {
  await prisma.orgMember.delete({
    where: { orgId_userId: { orgId, userId } },
  });
}

// OrgInvitation
async function createInvitation(
  orgId: string,
  email: string,
  role: "MEMBER",
  tx?: Prisma.TransactionClient,
) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일
  const client = tx ?? prisma;

  return await client.orgInvitation.create({
    data: {
      orgId,
      email,
      token,
      role,
      status: "PENDING",
      expiresAt,
    },
  });
}

async function getInvitationByToken(token: string) {
  return await prisma.orgInvitation.findUnique({ where: { token } });
}

async function getInvitationByIdAndOrgId(id: string, orgId: string) {
  return await prisma.orgInvitation.findFirst({
    where: { id, orgId },
  });
}

async function getPendingInvitationsByOrg(orgId: string) {
  return await prisma.orgInvitation.findMany({
    where: { orgId, status: "PENDING", expiresAt: { gt: new Date() } },
  });
}

async function updateInvitationStatus(
  id: string,
  status: "ACCEPTED" | "EXPIRED" | "CANCELLED",
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;
  return await client.orgInvitation.update({
    where: { id },
    data: { status },
  });
}

async function getProfileById(userId: string) {
  return await prisma.profile.findUnique({ where: { id: userId } });
}

// auth.users는 Prisma 스키마 외부(Supabase Auth 스키마)이므로 raw query 사용
async function findUserIdByEmail(email: string): Promise<string | null> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM auth.users WHERE email = ${email} LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

async function markInvitationEmailSent(id: string): Promise<void> {
  await prisma.orgInvitation.update({
    where: { id },
    data: { emailSentAt: new Date() },
  });
}

// 동일 (orgId, email)의 PENDING 초대를 모두 취소 — 재초대 시 호출
async function cancelPendingInvitationsByEmail(
  orgId: string,
  email: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx ?? prisma;
  await client.orgInvitation.updateMany({
    where: { orgId, email, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
}

const OrgRepository = {
  getOrgById,
  getOrgBySlug,
  getOrgsByUserId,
  createOrg,
  updateOrg,
  deleteOrg,
  addMember,
  getMember,
  getOrgMembers,
  updateMemberRole,
  removeMember,
  createInvitation,
  getInvitationByToken,
  getInvitationByIdAndOrgId,
  getPendingInvitationsByOrg,
  updateInvitationStatus,
  findUserIdByEmail,
  cancelPendingInvitationsByEmail,
  markInvitationEmailSent,
  getProfileById,
};

export default OrgRepository;
