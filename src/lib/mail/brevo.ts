import { getEnv } from "@/lib/env";

export type MailResult = { ok: true } | { ok: false; reason: "not_configured" | "email_failed" };

export function isMailConfigured() {
  const e = getEnv();
  return Boolean(e.BREVO_API_KEY && e.BREVO_SENDER_EMAIL);
}

export async function sendEmail(p: { to: string; toName: string; subject: string; html: string }): Promise<MailResult> {
  const e = getEnv();
  if (!e.BREVO_API_KEY || !e.BREVO_SENDER_EMAIL) return { ok: false, reason: "not_configured" };
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": e.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: e.BREVO_SENDER_NAME || "Clinova", email: e.BREVO_SENDER_EMAIL },
        to: [{ email: p.to, name: p.toName }],
        subject: p.subject,
        htmlContent: p.html,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error("Brevo send failed with HTTP status", res.status); // status only, never the key or body
      return { ok: false, reason: "email_failed" };
    }
    return { ok: true };
  } catch {
    console.error("Brevo send error (network or timeout)");
    return { ok: false, reason: "email_failed" };
  }
}
