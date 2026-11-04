import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { newToken, sha256 } from "./crypto";

const COOKIE = "clinova_session";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db.session.create({ data: { userId, tokenHash: sha256(token), expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { select: { id: true, name: true, email: true, role: true, emailVerifiedAt: true } } },
  });
  if (!s || s.expiresAt <= new Date() || !s.user.emailVerifiedAt) return null;
  return s.user;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: sha256(token) } });
  jar.delete(COOKIE);
}
