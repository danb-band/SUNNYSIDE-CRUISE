"use server";

import { createServerSupabaseClient } from "@libs/supabase/server";
import OrgService from "./service";
import { CreateOrgPayload, InviteMemberPayload, UpdateOrgPayload } from "./schema";

async function getCurrentUserIdentity(): Promise<{ id: string; email: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");
  if (!user.email) throw new Error("인증된 사용자 이메일을 확인할 수 없습니다.");
  return { id: user.id, email: user.email };
}

export const createOrgAction = async (input: CreateOrgPayload) => {
  const { id: userId } = await getCurrentUserIdentity();
  return await OrgService.createOrg(userId, input);
};

export const getOrgBySlugAction = async (slug: string) => {
  return await OrgService.getOrgBySlug(slug);
};

export const getUserOrgsAction = async (userId: string) => {
  return await OrgService.getUserOrgs(userId);
};

export const updateOrgAction = async (orgId: string, input: UpdateOrgPayload) => {
  const { id: userId } = await getCurrentUserIdentity();
  return await OrgService.updateOrg(orgId, userId, input);
};

export const deleteOrgAction = async (orgId: string) => {
  const { id: userId } = await getCurrentUserIdentity();
  await OrgService.deleteOrg(orgId, userId);
};

export const getOrgMembersAction = async (orgId: string) => {
  const { id: userId } = await getCurrentUserIdentity();
  return await OrgService.getOrgMembers(orgId, userId);
};

export const inviteMemberAction = async (orgId: string, input: InviteMemberPayload) => {
  const { id: userId, email } = await getCurrentUserIdentity();
  return await OrgService.inviteMember(orgId, { userId, email }, input);
};

export const acceptInvitationAction = async (token: string) => {
  const { id: userId, email } = await getCurrentUserIdentity();
  return await OrgService.acceptInvitation(token, { userId, email });
};

export const cancelInvitationAction = async (invitationId: string, orgId: string) => {
  const { id: userId } = await getCurrentUserIdentity();
  await OrgService.cancelInvitation(invitationId, orgId, userId);
};

export const removeMemberAction = async (orgId: string, targetUserId: string) => {
  const { id: userId } = await getCurrentUserIdentity();
  await OrgService.removeMember(orgId, targetUserId, userId);
};
