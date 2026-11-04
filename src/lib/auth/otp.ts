import type { OtpPurpose } from "@prisma/client";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/mail/brevo";
import { otpEmail } from "@/lib/mail/templates";
import { hashOtp, newOtpCode, safeEqual } from "./crypto";
import { rateLimit } from "./rate-limit";

export const OTP_TTL_S = 5 * 60;
export const OTP_COOLDOWN_S = 60;
export const OTP_MAX_ATTEMPTS = 5;

export type IssueResult =
  | { ok: true }
  | { ok: false; reason: "cooldown"; retryAfter: number }
  | { ok: false; reason: "limit" | "not_configured" | "email_failed" };

export async function issueOtp(user: { id: string; email: string; name: string }, purpose: OtpPurpose): Promise<IssueResult> {
  const now = new Date();
  const last = await db.otpVerification.findFirst({
    where: { userId: user.id, purpose },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (last) {
    const wait = OTP_COOLDOWN_S - Math.floor((now.getTime() - last.createdAt.getTime()) / 1000);
    if (wait > 0) return { ok: false, reason: "cooldown", retryAfter: wait };
  }
  if (!(await rateLimit(`otp-send:${user.id}:${purpose}`, 5, 3600)).ok) return { ok: false, reason: "limit" };

  const code = newOtpCode();
  const otp = await db.$transaction(async (tx) => {
    // Invalidate older codes and create the new one together.
    await tx.otpVerification.updateMany({
      where: { userId: user.id, purpose, consumedAt: null, invalidatedAt: null },
      data: { invalidatedAt: now },
    });
    return tx.otpVerification.create({
      data: { userId: user.id, purpose, codeHash: hashOtp(user.id, purpose, code), expiresAt: new Date(now.getTime() + OTP_TTL_S * 1000) },
    });
  });

  const { subject, html } = otpEmail(user.name, code, purpose);
  const sent = await sendEmail({ to: user.email, toName: user.name, subject, html });
  if (!sent.ok) {
    await db.otpVerification.update({ where: { id: otp.id }, data: { invalidatedAt: new Date() } });
    return { ok: false, reason: sent.reason };
  }
  return { ok: true };
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "expired" | "locked" }
  | { ok: false; reason: "invalid"; attemptsLeft: number };

export async function verifyOtp(userId: string, purpose: OtpPurpose, code: string): Promise<VerifyResult> {
  const now = new Date();
  const otp = await db.otpVerification.findFirst({
    where: { userId, purpose, consumedAt: null, invalidatedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.expiresAt <= now) return { ok: false, reason: "expired" };
  if (otp.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, reason: "locked" };

  // Count the attempt first, atomically and only while still allowed.
  const bumped = await db.otpVerification.updateMany({
    where: { id: otp.id, attempts: { lt: OTP_MAX_ATTEMPTS }, consumedAt: null, invalidatedAt: null, expiresAt: { gt: now } },
    data: { attempts: { increment: 1 } },
  });
  if (bumped.count !== 1) return { ok: false, reason: "locked" };

  if (!safeEqual(otp.codeHash, hashOtp(userId, purpose, code))) {
    return { ok: false, reason: "invalid", attemptsLeft: Math.max(0, OTP_MAX_ATTEMPTS - (otp.attempts + 1)) };
  }
  // Single-use: only one concurrent request can flip consumedAt.
  const used = await db.otpVerification.updateMany({
    where: { id: otp.id, consumedAt: null, invalidatedAt: null },
    data: { consumedAt: now },
  });
  return used.count === 1 ? { ok: true } : { ok: false, reason: "expired" };
}

export function verifyMessage(r: Exclude<VerifyResult, { ok: true }>) {
  if (r.reason === "invalid") return `Incorrect code. ${r.attemptsLeft} attempt${r.attemptsLeft === 1 ? "" : "s"} left.`;
  if (r.reason === "locked") return "Too many incorrect attempts. Please request a new code.";
  return "Invalid or expired code.";
}
