import argon2 from "argon2";
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { getEnv } from "@/lib/env";

export const hashPassword = (pw: string) => argon2.hash(pw, { type: argon2.argon2id });

export async function verifyPassword(hash: string, pw: string) {
  try {
    return await argon2.verify(hash, pw);
  } catch {
    return false;
  }
}

let dummy: string | undefined;
/** Used so login takes similar time whether or not the account exists. */
export async function dummyHash() {
  dummy ??= await hashPassword("clinova-dummy-password");
  return dummy;
}

export const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");
export const newOtpCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

// Keyed hash: a leaked database row alone cannot be used to brute-force the 6-digit code.
export function hashOtp(userId: string, purpose: string, code: string) {
  return createHmac("sha256", getEnv().SESSION_SECRET).update(`${userId}:${purpose}:${code}`).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
