import { Resend } from "resend";

// RESEND_API_KEY는 서버 전용 환경변수 (클라이언트에 노출 금지)
export const resend = new Resend(process.env.RESEND_API_KEY!);
