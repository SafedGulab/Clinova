import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <AuthForm
      title="Welcome back"
      subtitle="Sign in to manage your appointments."
      endpoint="/api/auth/login"
      submitLabel="Sign in"
      redirectTo="/dashboard"
      errorRedirects={{ EMAIL_NOT_VERIFIED: "/verify-otp?email={email}" }}
      fields={[
        { name: "email", label: "Email", type: "email", autoComplete: "email", inputMode: "email" },
        { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
      ]}
      footer={{ text: "New to Clinova?", href: "/register", label: "Create an account" }}
    >
      <p className="mt-4 text-sm">
        <Link href="/forgot-password" className="font-medium text-teal hover:underline">
          Forgot your password?
        </Link>
      </p>
    </AuthForm>
  );
}
