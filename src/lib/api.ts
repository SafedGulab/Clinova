import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export function ok(data: Record<string, unknown> = {}, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export function fail(code: string, message: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error: { code, message }, ...extra }, { status });
}

export function tooMany(retryAfter: number) {
  return NextResponse.json(
    { ok: false, error: { code: "RATE_LIMITED", message: "Too many attempts. Please wait and try again." }, retryAfter },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// CSRF defence for cookie-authenticated POSTs (on top of SameSite=Lax): Origin must match our host.
function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function handle<T extends z.ZodTypeAny>(
  req: NextRequest,
  schema: T,
  fn: (input: z.infer<T>, ctx: { ip: string }) => Promise<NextResponse>,
) {
  if (!sameOrigin(req)) return fail("BAD_ORIGIN", "Request blocked.", 403);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("BAD_JSON", "Invalid request.", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  try {
    return await fn(parsed.data, { ip: clientIp(req) });
  } catch (e) {
    console.error("API error:", e instanceof Error ? e.name : "unknown"); // never log bodies, codes or tokens
    return fail("SERVER_ERROR", "Something went wrong. Please try again.", 500);
  }
}
