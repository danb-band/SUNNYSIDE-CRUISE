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

export const createOrgAction = async (
  input: CreateOrgPayload,
): Promise<{ success: true; slug: string } | { success: false; error: string }> => {
  try {
    const userId = await getCurrentUserId();
    const org = await OrgService.createOrg(userId, input);
    return { success: true, slug: org.slug };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "오류가 발생했습니다." };
  }
};

export const getOrgBySlugAction = async (slug: string) => {
  return await OrgService.getOrgBySlug(slug);
};

export const getUserOrgsAction = async () => {
  const userId = await getCurrentUserId();
  return await OrgService.getUserOrgs(userId);
};

export const updateOrgAction = async (orgId: string, input: UpdateOrgPayload) => {
  const userId = await getCurrentUserId();
  return await OrgService.updateOrg(orgId, userId, input);
};

export const hardDeleteOrgAction = async (orgId: string) => {
  const userId = await getCurrentUserId();
  await OrgService.hardDeleteOrg(orgId, userId);
};

export const getOrgMembersAction = async (orgId: string) => {
  const userId = await getCurrentUserId();
  return await OrgService.getOrgMembers(orgId, userId);
};

export const getCurrentUserOrgRoleAction = async (orgId: string) => {
  const userId = await getCurrentUserId();
  return await OrgService.getOrgRole(orgId, userId);
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

    let emailSent = false;
    let emailError: string | undefined;

    try {
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

      emailSent = emailResult.sent;
      emailError = emailResult.error;
      if (emailResult.sent) {
        await OrgService.markInvitationEmailSent(invitation.id);
      }
    } catch (error) {
      emailSent = false;
      emailError = error instanceof Error ? error.message : "이메일 발송 실패";
    }

    return {
      success: true,
      data: { id: invitation.id, email: invitation.email, expiresAt: invitation.expiresAt },
      emailSent,
      ...(emailError && { emailError }),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "초대 생성에 실패했습니다.";
    return {
      success: false,
      error: message === "ALREADY_INVITED" ? "이미 유효한 초대가 진행 중입니다." : message,
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

export const leaveOrgAction = async (orgId: string) => {
  const userId = await getCurrentUserId();
  await OrgService.leaveOrg(orgId, userId);
};

export const getPendingInvitationsAction = async (orgId: string) => {
  const userId = await getCurrentUserId();
  return await OrgService.getPendingInvitations(orgId, userId);
};

export const getInvitationInfoAction = async (params: { token?: string; id?: string }) => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return await OrgService.getInvitationInfo(params, user?.email ?? undefined);
};

export const acceptInvitationByIdAction = async (invitationId: string) => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) throw new Error("인증이 필요합니다.");
  return await OrgService.acceptInvitationById(invitationId, user.id, user.email);
};

export const cancelInvitationByInviteeAction = async (invitationId: string) => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) throw new Error("인증이 필요합니다.");
  await OrgService.cancelInvitationByInvitee(invitationId, user.email);
};

export const getPendingInvitationsForUserAction = async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return [];
  return await OrgService.getPendingInvitationsForUser(user.email);
};
