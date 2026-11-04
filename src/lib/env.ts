import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  APP_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  // Required only when an email is actually sent; the mail module must fail loudly if these are missing.
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().email().optional(),
  BREVO_SENDER_NAME: z.string().optional(),
  ADMIN_SETUP_SECRET: z.string().optional(),
  // Required only when the AI specialty suggester is actually called; the AI module must fail loudly if missing.
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
});

let cached: z.infer<typeof schema> | undefined;

/** Server-only. Never import from client components. */
export function getEnv() {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const names = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Invalid or missing environment variables: ${names}. See .env.example.`);
    }
    cached = parsed.data;
  }
  return cached;
}
