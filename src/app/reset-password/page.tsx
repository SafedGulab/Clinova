import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { ResendButton } from "@/components/resend-button";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email = "" } = await searchParams;
  if (!email) {
    return (
      <main className="p-10">
        <p>Start from the <Link href="/forgot-password" className="text-teal underline">forgot password page</Link>.</p>
      </main>
    );
  }
  return (
    <AuthForm
      title="Choose a new password"
      subtitle={`Enter the 6-digit code sent to ${email} and your new password.`}
      endpoint="/api/auth/reset-password"
      submitLabel="Update password"
      redirectTo="/login"
      extra={{ email }}
      fields={[
        { name: "code", label: "Verification code", inputMode: "numeric", autoComplete: "one-time-code", maxLength: 6 },
        { name: "newPassword", label: "New password (at least 10 characters)", type: "password", autoComplete: "new-password" },
      ]}
      footer={{ text: "Back to", href: "/login", label: "Sign in" }}
    >
      <ResendButton email={email} purpose="PASSWORD_RESET" />
    </AuthForm>
  );
}
