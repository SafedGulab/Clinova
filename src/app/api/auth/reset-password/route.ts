import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, handle, ok, tooMany } from "@/lib/api";
import { hashPassword } from "@/lib/auth/crypto";
import { verifyMessage, verifyOtp } from "@/lib/auth/otp";
import { rateLimit } from "@/lib/auth/rate-limit";
import { code, email, newPassword } from "@/lib/auth/schemas";

const schema = z.object({ email, code, newPassword });

export async function POST(req: NextRequest) {
  return handle(req, schema, async ({ email, code, newPassword }, { ip }) => {
    const a = await rateLimit(`reset:ip:${ip}`, 30, 3600);
    if (!a.ok) return tooMany(a.retryAfter);
    const b = await rateLimit(`reset:email:${email}`, 20, 3600);
    if (!b.ok) return tooMany(b.retryAfter);

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.emailVerifiedAt) return fail("INVALID_CODE", "Invalid or expired code.", 400);

    const result = await verifyOtp(user.id, "PASSWORD_RESET", code);
    if (!result.ok) return fail("INVALID_CODE", verifyMessage(result), 400);

    const passwordHash = await hashPassword(newPassword);
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { passwordHash } }),
      db.session.deleteMany({ where: { userId: user.id } }), // sign out everywhere
    ]);
    return ok({ message: "Password updated. Please sign in." });
  });
}
