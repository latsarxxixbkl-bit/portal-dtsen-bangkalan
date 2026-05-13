// Resend client (server-only). Email pengiriman opsional — bila RESEND_API_KEY
// belum diset, semua pemanggilan akan no-op + log.
import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend | null {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  _resend = new Resend(key);
  return _resend;
}

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Portal DTSEN <onboarding@resend.dev>";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://portal-dtsen-bangkalan.vercel.app";
