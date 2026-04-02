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
async function addMember(orgId: string, userId: string, role: "OWNER" | "ADMIN" | "MEMBER") {
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

async function updateMemberRole(orgId: string, userId: string, role: "OWNER" | "ADMIN" | "MEMBER") {
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
async function createInvitation(orgId: string, email: string, role: "ADMIN" | "MEMBER") {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일

  return await prisma.orgInvitation.create({
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
};

export default OrgRepository;
