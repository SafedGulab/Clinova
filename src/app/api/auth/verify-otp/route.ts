import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, handle, ok, tooMany } from "@/lib/api";
import { verifyMessage, verifyOtp } from "@/lib/auth/otp";
import { rateLimit } from "@/lib/auth/rate-limit";
import { code, email } from "@/lib/auth/schemas";
import { createSession } from "@/lib/auth/session";

const schema = z.object({ email, code });

export async function POST(req: NextRequest) {
  return handle(req, schema, async ({ email, code }, { ip }) => {
    const rl = await rateLimit(`verify:ip:${ip}`, 30, 3600);
    if (!rl.ok) return tooMany(rl.retryAfter);
    const rlEmail = await rateLimit(`verify:email:${email}`, 20, 3600);
    if (!rlEmail.ok) return tooMany(rlEmail.retryAfter);

    const user = await db.user.findUnique({ where: { email } });
    if (!user || user.emailVerifiedAt) return fail("INVALID_CODE", "Invalid or expired code.", 400);

    const result = await verifyOtp(user.id, "VERIFY_EMAIL", code);
    if (!result.ok) return fail("INVALID_CODE", verifyMessage(result), 400);

    await db.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
    await createSession(user.id);
    return ok({ redirect: "/dashboard" });
  });
}
