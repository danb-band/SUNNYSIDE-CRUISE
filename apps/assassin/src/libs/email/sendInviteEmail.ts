import { resend } from "./client";

interface SendInviteEmailParams {
  to: string;
  orgName: string;
  inviterName?: string;
  role: string;
  expiresAt: Date;
  token: string;
}

interface SendInviteEmailResult {
  sent: boolean;
  error?: string;
}

export async function sendInviteEmail({
  to,
  orgName,
  inviterName,
  role,
  expiresAt,
  token,
}: SendInviteEmailParams): Promise<SendInviteEmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const acceptUrl = `${appUrl}/invite/accept?token=${token}`;

  const expiresAtFormatted = expiresAt.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const inviterLine = inviterName ? `${inviterName}님이 ` : "";

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@example.com",
      to,
      subject: `[${orgName}] 조직 초대장`,
      html: `
        <p>${inviterLine}<strong>${orgName}</strong>에 초대했습니다.</p>
        <p>역할: <strong>${role}</strong></p>
        <p>초대 만료일: ${expiresAtFormatted}</p>
        <br />
        <a href="${acceptUrl}" style="display:inline-block;padding:10px 20px;background:#000;color:#fff;text-decoration:none;border-radius:4px;">
          초대 수락하기
        </a>
        <br /><br />
        <p style="color:#666;font-size:12px;">링크가 작동하지 않으면 아래 주소를 브라우저에 붙여넣으세요:<br />${acceptUrl}</p>
      `,
    });

    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "이메일 발송 실패",
    };
  }
}
