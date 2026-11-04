import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, handle, ok, tooMany } from "@/lib/api";
import { dummyHash, verifyPassword } from "@/lib/auth/crypto";
import { issueOtp } from "@/lib/auth/otp";
import { rateLimit } from "@/lib/auth/rate-limit";
import { otpResponse } from "@/lib/auth/responses";
import { email } from "@/lib/auth/schemas";
import { createSession } from "@/lib/auth/session";

const schema = z.object({ email, password: z.string().min(1, "Enter your password.").max(128) });

export async function POST(req: NextRequest) {
  return handle(req, schema, async ({ email, password }, { ip }) => {
    const a = await rateLimit(`login:ip:${ip}`, 20, 900);
    if (!a.ok) return tooMany(a.retryAfter);
    const b = await rateLimit(`login:email:${email}`, 10, 900);
    if (!b.ok) return tooMany(b.retryAfter);

    const user = await db.user.findUnique({ where: { email } });
    const valid = await verifyPassword(user?.passwordHash ?? (await dummyHash()), password);
    if (!user || !valid) return fail("INVALID_CREDENTIALS", "Invalid email or password.", 401);

    if (!user.emailVerifiedAt) {
      const r = await issueOtp(user, "VERIFY_EMAIL");
      if (!r.ok && (r.reason === "not_configured" || r.reason === "email_failed")) return otpResponse(r);
      return fail("EMAIL_NOT_VERIFIED", "Please verify your email to continue.", 403);
    }
    await createSession(user.id);
    return ok({ redirect: "/dashboard" });
  });
}
