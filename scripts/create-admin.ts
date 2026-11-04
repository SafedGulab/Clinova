// Run on your own machine only:  npx tsx --env-file=.env scripts/create-admin.ts
// Creates (or promotes) an administrator directly in the database. There is no public way to become admin.
import argon2 from "argon2";
import readline from "node:readline";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      const w = rl as unknown as { _writeToOutput: (s: string) => void };
      w._writeToOutput = (s: string) => process.stdout.write(s.includes(question) ? s : "*");
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  const email = (await ask("Admin email: ")).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email address.");
  const name = (await ask("Admin full name: ")).trim();
  if (name.length < 2) throw new Error("Enter a name.");
  const pw = await ask("Password (at least 12 characters): ", true);
  const pw2 = await ask("Repeat password: ", true);
  if (pw.length < 12 || pw !== pw2) throw new Error("Passwords must match and be at least 12 characters.");

  const passwordHash = await argon2.hash(pw, { type: argon2.argon2id });
  const now = new Date();
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: "ADMIN", emailVerifiedAt: now },
    create: { email, name, passwordHash, role: "ADMIN", emailVerifiedAt: now },
  });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "admin.bootstrap", entityType: "User", entityId: user.id } });
  console.log(`Administrator ready: ${email}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : "Failed.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
