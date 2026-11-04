import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handle, ok, tooMany } from "@/lib/api";
import { issueOtp } from "@/lib/auth/otp";
import { rateLimit } from "@/lib/auth/rate-limit";
import { GENERIC_SENT, otpResponse } from "@/lib/auth/responses";
import { email, purpose } from "@/lib/auth/schemas";

const schema = z.object({ email, purpose });

export async function POST(req: NextRequest) {
  return handle(req, schema, async ({ email, purpose }, { ip }) => {
    const rl = await rateLimit(`resend:ip:${ip}`, 10, 3600);
    if (!rl.ok) return tooMany(rl.retryAfter);

    const user = await db.user.findUnique({ where: { email } });
    const eligible = user && (purpose === "VERIFY_EMAIL" ? !user.emailVerifiedAt : Boolean(user.emailVerifiedAt));
    if (!eligible) return ok({ message: GENERIC_SENT, retryAfter: 60 });
    return otpResponse(await issueOtp(user, purpose));
  });
}
