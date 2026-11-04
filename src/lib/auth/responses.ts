import { fail, ok, tooMany } from "@/lib/api";
import type { IssueResult } from "./otp";

export const GENERIC_SENT = "If this email can be used, a 6-digit code has been sent. Check your inbox and spam folder.";

export function otpResponse(r: IssueResult) {
  if (r.ok) return ok({ message: GENERIC_SENT, retryAfter: 60 });
  if (r.reason === "cooldown") return ok({ message: "A code was sent recently. Please wait before requesting another.", retryAfter: r.retryAfter });
  if (r.reason === "limit") return tooMany(3600);
  if (r.reason === "not_configured") {
    return fail("EMAIL_NOT_CONFIGURED", "Email sending is not configured on the server. Set the BREVO_* variables (see README).", 503);
  }
  return fail("EMAIL_FAILED", "We could not send the email. Please try again in a few minutes.", 502);
}
