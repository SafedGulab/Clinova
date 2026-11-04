import { NextRequest } from "next/server";
import { clientIp, fail, ok, tooMany } from "@/lib/api";
import { rateLimit } from "@/lib/auth/rate-limit";
import { getSlots } from "@/lib/booking/slots";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rl = await rateLimit(`slots:ip:${clientIp(req)}`, 120, 600);
    if (!rl.ok) return tooMany(rl.retryAfter);
    const date = req.nextUrl.searchParams.get("date") ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("VALIDATION", "Pick a valid date.", 400);
    return ok({ slots: await getSlots(id, date) });
  } catch (e) {
    console.error("API error:", e instanceof Error ? e.name : "unknown");
    return fail("SERVER_ERROR", "Could not load time slots.", 500);
  }
}
