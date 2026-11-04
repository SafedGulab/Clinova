import { NextRequest } from "next/server";
import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { destroySession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  return handle(req, z.object({}), async () => {
    await destroySession();
    return ok();
  });
}
