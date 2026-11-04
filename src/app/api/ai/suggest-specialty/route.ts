import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, handle, ok, tooMany } from "@/lib/api";
import { rateLimit } from "@/lib/auth/rate-limit";
import { getCurrentUser } from "@/lib/auth/session";
import { suggestSpecialty } from "@/lib/ai/suggest-specialty";

const schema = z.object({
  symptoms: z.string().trim().min(3, "Please describe your symptoms.").max(500, "Please keep this under 500 characters."),
});

export async function POST(req: NextRequest) {
  return handle(req, schema, async (input) => {
    const user = await getCurrentUser();
    if (!user) return fail("UNAUTHORIZED", "Please sign in to use the suggester.", 401);

    // Modest budget: the model costs money and the suggestion is advisory, so twenty per hour per user is plenty.
    const rl = await rateLimit(`ai-suggest:user:${user.id}`, 20, 3600);
    if (!rl.ok) return tooMany(rl.retryAfter);

    const catalog = await db.specialty.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true },
    });

    const result = await suggestSpecialty(input.symptoms, catalog);
    if (!result.ok) {
      if (result.code === "DISABLED") return fail("AI_DISABLED", result.message, 503);
      return fail("AI_UPSTREAM", result.message, 502);
    }

    // Audit entry carries the outcome only; the symptom text is intake-adjacent and must not be stored here.
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "ai.specialty_suggested",
        entityType: "User",
        entityId: user.id,
        metadata: { specialtyId: result.specialtyId },
      },
    });

    return ok({ specialtyId: result.specialtyId, reason: result.reason });
  });
}
