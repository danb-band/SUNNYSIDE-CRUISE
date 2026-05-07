import * as z from "zod";

export const profileSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  realName: z.string(),
});

export const updateProfileSchema = z.object({
  userId: z.uuid("유효한 사용자 ID가 필요합니다"),
  name: z.string().min(1, "이름을 입력해주세요"),
});

export type Profile = z.infer<typeof profileSchema>;
export type UpdateProfilePayload = z.infer<typeof updateProfileSchema>;
