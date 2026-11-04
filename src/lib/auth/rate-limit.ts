import { db } from "@/lib/db";

/** Fixed-window limiter stored in Postgres (works across serverless instances). One atomic statement. */
export async function rateLimit(key: string, limit: number, windowSec: number) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSec * 1000);
  const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt", "updatedAt")
    VALUES (${key}, 1, ${resetAt}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN ${resetAt} ELSE "RateLimit"."resetAt" END,
      "updatedAt" = ${now}
    RETURNING "count", "resetAt"`;
  const row = rows[0];
  return {
    ok: Number(row.count) <= limit,
    retryAfter: Math.max(1, Math.ceil((new Date(row.resetAt).getTime() - now.getTime()) / 1000)),
  };
}
