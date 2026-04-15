import { z } from "zod";

export type OrgRole = "OWNER" | "MEMBER";

export const ROLE_HIERARCHY: Record<OrgRole, number> = {
  OWNER: 2,
  MEMBER: 1,
};

export const orgSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "slug는 소문자, 숫자, 하이픈만 허용"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createOrgSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "slug는 소문자, 숫자, 하이픈만 허용"),
});

export const updateOrgSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export const orgMemberSchema = z.object({
  id: z.uuid(),
  orgId: z.uuid(),
  userId: z.uuid(),
  role: z.enum(["OWNER", "MEMBER"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const orgInvitationSchema = z.object({
  id: z.uuid(),
  orgId: z.uuid(),
  email: z.email(),
  token: z.string(),
  role: z.enum(["OWNER", "MEMBER"]),
  status: z.enum(["PENDING", "ACCEPTED", "EXPIRED", "CANCELLED"]),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const inviteMemberSchema = z.object({
  email: z.email(),
  role: z.enum(["MEMBER"]).default("MEMBER"),
});

export type Org = z.infer<typeof orgSchema>;
export type CreateOrgPayload = z.infer<typeof createOrgSchema>;
export type UpdateOrgPayload = z.infer<typeof updateOrgSchema>;
export type OrgMember = z.infer<typeof orgMemberSchema>;
export type OrgInvitation = z.infer<typeof orgInvitationSchema>;
export type InviteMemberPayload = z.infer<typeof inviteMemberSchema>;
