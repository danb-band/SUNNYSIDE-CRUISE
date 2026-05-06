import { prisma } from "@libs/prisma/client";
import { Prisma } from "../../generated/prisma/client";
import { CreateOrgPayload, UpdateOrgPayload } from "./schema";
import crypto from "crypto";
import { TransactionClient } from "@/libs/prisma/types";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

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

async function createOrg(input: CreateOrgPayload, tx?: TransactionClient) {
  const client = tx ?? prisma;
  return await client.org.create({
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

async function getOrgIdBySongId(songId: string): Promise<string | null> {
  const song = await prisma.song.findFirst({
    where: {
      id: songId,
      deletedAt: null,
    },
    select: {
      season: {
        select: {
          orgId: true,
        },
      },
    },
  });

  return song?.season.orgId ?? null;
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
  tx?: TransactionClient,
) {
  const plainToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(plainToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일
  const client = tx ?? prisma;

  const record = await client.orgInvitation.create({
    data: {
      orgId,
      email,
      token: tokenHash,
      role,
      status: "PENDING",
      expiresAt,
    },
  });

  // DB에는 해시 저장, 호출자에게는 평문 토큰 반환 (이메일 URL용)
  return { ...record, token: plainToken };
}

async function getInvitationByToken(token: string) {
  const tokenHash = hashToken(token);
  return await prisma.orgInvitation.findUnique({ where: { token: tokenHash } });
}

async function getInvitationById(id: string) {
  return await prisma.orgInvitation.findUnique({ where: { id } });
}

async function getPendingInvitationsByEmail(email: string) {
  return await prisma.orgInvitation.findMany({
    where: { email, status: "PENDING", expiresAt: { gt: new Date() } },
    include: { org: true },
    orderBy: { createdAt: "desc" },
  });
}

async function getValidPendingInvitationByEmail(orgId: string, email: string) {
  return await prisma.orgInvitation.findFirst({
    where: { orgId, email, status: "PENDING", expiresAt: { gt: new Date() } },
  });
}

async function getInvitationByIdAndOrgId(id: string, orgId: string) {
  return await prisma.orgInvitation.findFirst({
    where: { id, orgId },
  });
}

async function getPendingInvitationsByOrg(orgId: string) {
  return await prisma.orgInvitation.findMany({
    where: { orgId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
}

// 만료된 PENDING 초대를 EXPIRED로 정리 — 재초대 전 호출
async function markExpiredInvitations(
  orgId: string,
  email: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx ?? prisma;
  await client.orgInvitation.updateMany({
    where: { orgId, email, status: "PENDING", expiresAt: { lte: new Date() } },
    data: { status: "EXPIRED" },
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
  getOrgIdBySongId,
  updateMemberRole,
  removeMember,
  createInvitation,
  getInvitationByToken,
  getInvitationByIdAndOrgId,
  getInvitationById,
  getValidPendingInvitationByEmail,
  getPendingInvitationsByOrg,
  getPendingInvitationsByEmail,
  markExpiredInvitations,
  updateInvitationStatus,
  findUserIdByEmail,
  markInvitationEmailSent,
  getProfileById,
};

export default OrgRepository;
