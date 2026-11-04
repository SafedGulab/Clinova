import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { ResendButton } from "@/components/resend-button";

export default async function VerifyOtpPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email = "" } = await searchParams;
  if (!email) {
    return (
      <main className="p-10">
        <p>Start from the <Link href="/register" className="text-teal underline">registration page</Link>.</p>
      </main>
    );
  }
  return (
    <AuthForm
      title="Verify your email"
      subtitle={`Enter the 6-digit code sent to ${email}. It expires in 5 minutes.`}
      endpoint="/api/auth/verify-otp"
      submitLabel="Verify and continue"
      redirectTo="/dashboard"
      extra={{ email }}
      fields={[{ name: "code", label: "Verification code", inputMode: "numeric", autoComplete: "one-time-code", maxLength: 6 }]}
      footer={{ text: "Wrong email?", href: "/register", label: "Start again" }}
    >
      <ResendButton email={email} purpose="VERIFY_EMAIL" />
    </AuthForm>
  );
}
