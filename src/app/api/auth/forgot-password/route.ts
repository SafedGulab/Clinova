import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, handle, ok, tooMany } from "@/lib/api";
import { issueOtp } from "@/lib/auth/otp";
import { rateLimit } from "@/lib/auth/rate-limit";
import { GENERIC_SENT } from "@/lib/auth/responses";
import { email } from "@/lib/auth/schemas";
import { isMailConfigured } from "@/lib/mail/brevo";

const schema = z.object({ email });

export async function POST(req: NextRequest) {
  return handle(req, schema, async ({ email }, { ip }) => {
    const rl = await rateLimit(`forgot:ip:${ip}`, 10, 3600);
    if (!rl.ok) return tooMany(rl.retryAfter);
    if (!isMailConfigured()) {
      return fail("EMAIL_NOT_CONFIGURED", "Email sending is not configured on the server. Set the BREVO_* variables (see README).", 503);
    }
    const user = await db.user.findUnique({ where: { email } });
    if (user?.emailVerifiedAt) await issueOtp(user, "PASSWORD_RESET"); // same response whether or not the account exists
    return ok({ message: GENERIC_SENT, retryAfter: 60 });
  });
}
