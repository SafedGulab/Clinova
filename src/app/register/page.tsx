import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <AuthForm
      title="Create your account"
      subtitle="We will email you a 6-digit code to verify your address."
      endpoint="/api/auth/register"
      submitLabel="Create account"
      redirectTo="/verify-otp?email={email}"
      fields={[
        { name: "name", label: "Full name", autoComplete: "name" },
        { name: "email", label: "Email", type: "email", autoComplete: "email", inputMode: "email" },
        { name: "password", label: "Password (at least 10 characters)", type: "password", autoComplete: "new-password" },
      ]}
      footer={{ text: "Already have an account?", href: "/login", label: "Sign in" }}
    />
  );
}
