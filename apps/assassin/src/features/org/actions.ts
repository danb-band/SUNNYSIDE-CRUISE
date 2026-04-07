"use server";

import { createServerSupabaseClient } from "@libs/supabase/server";
import { sendInviteEmail } from "@libs/email/sendInviteEmail";
import OrgService from "./service";
import {
  CreateOrgPayload,
  InviteMemberPayload,
  UpdateOrgPayload,
  inviteMemberSchema,
} from "./schema";

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

export const inviteMemberAction = async (
  orgId: string,
  input: InviteMemberPayload,
): Promise<
  | {
      success: true;
      data: { id: string; email: string; expiresAt: Date };
      emailSent: boolean;
      emailError?: string;
    }
  | { success: false; error: string }
> => {
  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const userId = await getCurrentUserId();
    const invitation = await OrgService.inviteMember(orgId, userId, parsed.data);

    // 이메일 발송에 필요한 조직명, 초대자 이름 조회
    const [org, inviterProfile] = await Promise.all([
      OrgService.getOrgById(orgId),
      OrgService.getProfileById(userId),
    ]);

    const emailResult = await sendInviteEmail({
      to: invitation.email,
      orgName: org?.name ?? orgId,
      inviterName: inviterProfile?.name,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      token: invitation.token,
    });

    return {
      success: true,
      data: { id: invitation.id, email: invitation.email, expiresAt: invitation.expiresAt },
      emailSent: emailResult.sent,
      ...(emailResult.error && { emailError: emailResult.error }),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "초대 생성에 실패했습니다.",
    };
  }
};

export const acceptInvitationAction = async (token: string) => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) throw new Error("인증이 필요합니다.");
  return await OrgService.acceptInvitation(token, user.id, user.email);
};

export const cancelInvitationAction = async (invitationId: string, orgId: string) => {
  const userId = await getCurrentUserId();
  await OrgService.cancelInvitation(invitationId, orgId, userId);
};

export const removeMemberAction = async (orgId: string, targetUserId: string) => {
  const userId = await getCurrentUserId();
  await OrgService.removeMember(orgId, targetUserId, userId);
};

export const getPendingInvitationsAction = async (orgId: string) => {
  const userId = await getCurrentUserId();
  return await OrgService.getPendingInvitations(orgId, userId);
};
