import { AuthForm } from "@/components/auth-form";

export default function ForgotPasswordPage() {
  return (
    <AuthForm
      title="Reset your password"
      subtitle="Enter your email and we will send a 6-digit code if an account exists."
      endpoint="/api/auth/forgot-password"
      submitLabel="Send code"
      redirectTo="/reset-password?email={email}"
      fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email", inputMode: "email" }]}
      footer={{ text: "Remembered it?", href: "/login", label: "Sign in" }}
    />
  );
}
