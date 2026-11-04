import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handle, ok, tooMany } from "@/lib/api";
import { hashPassword } from "@/lib/auth/crypto";
import { issueOtp } from "@/lib/auth/otp";
import { rateLimit } from "@/lib/auth/rate-limit";
import { GENERIC_SENT, otpResponse } from "@/lib/auth/responses";
import { email, newPassword } from "@/lib/auth/schemas";

const schema = z.object({ name: z.string().trim().min(2, "Enter your full name.").max(80), email, password: newPassword });

export async function POST(req: NextRequest) {
  return handle(req, schema, async ({ name, email, password }, { ip }) => {
    const rl = await rateLimit(`register:ip:${ip}`, 10, 3600);
    if (!rl.ok) return tooMany(rl.retryAfter);

    const existing = await db.user.findUnique({ where: { email } });
    if (existing?.emailVerifiedAt) return ok({ message: GENERIC_SENT, retryAfter: 60 }); // no account enumeration

    const passwordHash = await hashPassword(password);
    const user = existing
      ? await db.user.update({ where: { id: existing.id }, data: { name, passwordHash } }) // refresh pending registration
      : await db.user.create({ data: { name, email, passwordHash } });
    return otpResponse(await issueOtp(user, "VERIFY_EMAIL"));
  });
}
