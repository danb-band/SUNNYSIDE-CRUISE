import { prisma } from "@libs/prisma/client";
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
async function addMember(orgId: string, userId: string, role: "OWNER" | "MEMBER") {
  return await prisma.orgMember.create({
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
async function createInvitation(orgId: string, email: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일

  return await prisma.orgInvitation.create({
    data: {
      orgId,
      email,
      token,
      role: "MEMBER",
      status: "PENDING",
      expiresAt,
    },
  });
}

async function getInvitationByToken(token: string) {
  return await prisma.orgInvitation.findUnique({ where: { token } });
}

async function getPendingInvitationsByOrg(orgId: string) {
  return await prisma.orgInvitation.findMany({
    where: { orgId, status: "PENDING" },
  });
}

async function updateInvitationStatus(id: string, status: "ACCEPTED" | "EXPIRED" | "CANCELLED") {
  return await prisma.orgInvitation.update({
    where: { id },
    data: { status },
  });
}

async function acceptInvitationAtomically(input: {
  invitationId: string;
  orgId: string;
  userId: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const existingMember = await tx.orgMember.findUnique({
      where: { orgId_userId: { orgId: input.orgId, userId: input.userId } },
    });

    if (!existingMember) {
      await tx.orgMember.create({
        data: { orgId: input.orgId, userId: input.userId, role: "MEMBER" },
      });
    }

    const invitationUpdate = await tx.orgInvitation.updateMany({
      where: { id: input.invitationId, status: "PENDING" },
      data: { status: "ACCEPTED" },
    });

    if (invitationUpdate.count !== 1) {
      throw new Error("초대 상태가 변경되어 수락할 수 없습니다.");
    }

    return { alreadyMember: Boolean(existingMember) };
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
  getPendingInvitationsByOrg,
  updateInvitationStatus,
  acceptInvitationAtomically,
};

export default OrgRepository;
