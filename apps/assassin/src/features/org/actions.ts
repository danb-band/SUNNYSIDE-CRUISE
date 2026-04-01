"use server";

import { createServerSupabaseClient } from "@libs/supabase/server";
import OrgService from "./service";
import { CreateOrgPayload, InviteMemberPayload, UpdateOrgPayload } from "./schema";

async function getCurrentUserId(): Promise<string> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");
  return user.id;
}

export const createOrgAction = async (input: CreateOrgPayload) => {
  const userId = await getCurrentUserId();
  return await OrgService.createOrg(userId, input);
};

export const getOrgBySlugAction = async (slug: string) => {
  return await OrgService.getOrgBySlug(slug);
};

export const getUserOrgsAction = async (userId: string) => {
  return await OrgService.getUserOrgs(userId);
};

export const updateOrgAction = async (orgId: string, input: UpdateOrgPayload) => {
  const userId = await getCurrentUserId();
  return await OrgService.updateOrg(orgId, userId, input);
};

export const deleteOrgAction = async (orgId: string) => {
  const userId = await getCurrentUserId();
  await OrgService.deleteOrg(orgId, userId);
};

export const getOrgMembersAction = async (orgId: string) => {
  const userId = await getCurrentUserId();
  return await OrgService.getOrgMembers(orgId, userId);
};

export const inviteMemberAction = async (orgId: string, input: InviteMemberPayload) => {
  const userId = await getCurrentUserId();
  return await OrgService.inviteMember(orgId, userId, input);
};

export const acceptInvitationAction = async (token: string) => {
  const userId = await getCurrentUserId();
  return await OrgService.acceptInvitation(token, userId);
};

export const cancelInvitationAction = async (invitationId: string, orgId: string) => {
  const userId = await getCurrentUserId();
  await OrgService.cancelInvitation(invitationId, orgId, userId);
};

export const removeMemberAction = async (orgId: string, targetUserId: string) => {
  const userId = await getCurrentUserId();
  await OrgService.removeMember(orgId, targetUserId, userId);
};
