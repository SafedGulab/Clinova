# Clinova - Step 1: scaffold, database schema, seed

Status: source written, NOT yet installed, compiled or run. Versions in package.json are caret ranges chosen
without network access; if `npm install` reports a conflict, report the message and fix it before continuing.

## Local setup
1. `npm install`
2. `cp .env.example .env` and fill in values (a free Neon or Supabase Postgres works; set DIRECT_URL = DATABASE_URL if unsure).
   Generate SESSION_SECRET with `openssl rand -base64 48`.
3. Create the first migration WITHOUT applying it:
   `npx prisma migrate dev --name init --create-only`
   Then open `prisma/migrations/<timestamp>_init/migration.sql` and append the contents of
   `prisma/manual/appointment_no_overlap.sql` at the end (double-booking protection).
4. Apply it: `npx prisma migrate dev`
5. Seed: `npm run db:seed`
6. Check: `npm run typecheck && npm run build`, then `npm run dev`.

## Production (later)
Use `npx prisma migrate deploy` against the production database; never `migrate dev`.
Set all variables from `.env.example` in Vercel project settings. Do not commit `.env`.

## Design notes
- Passwords: Argon2id (added with auth). OTPs and session tokens are stored only as hashes.
- Rate limiting uses the `RateLimit` table so it works on serverless.
- `AuditLog.metadata` and application logs must never contain intake or medical content.
- Doctors seeded here are fictional (`isSample = true`).
