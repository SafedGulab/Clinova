"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Field = { name: string; label: string; type?: string; autoComplete?: string; inputMode?: "numeric" | "text" | "email"; maxLength?: number };
type Props = {
  title: string;
  subtitle?: string;
  endpoint: string;
  fields: Field[];
  submitLabel: string;
  redirectTo: string; // "{email}" is replaced with the entered/extra email
  extra?: Record<string, string>;
  errorRedirects?: Record<string, string>;
  children?: React.ReactNode;
  footer?: { text: string; href: string; label: string };
};

export function AuthForm({ title, subtitle, endpoint, fields, submitLabel, redirectTo, extra, errorRedirects, children, footer }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const values = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, ...extra }),
      });
      const data = await res.json().catch(() => null);
      const email = encodeURIComponent(values.email ?? extra?.email ?? "");
      if (res.ok && data?.ok) {
        router.push(redirectTo.replace("{email}", email));
        router.refresh();
        return;
      }
      const code = data?.error?.code as string | undefined;
      if (code && errorRedirects?.[code]) {
        router.push(errorRedirects[code].replace("{email}", email));
        return;
      }
      setError(data?.error?.message ?? "Something went wrong. Please try again.");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-xl font-semibold text-navy">
          Clino<span className="text-teal">va</span>
        </Link>
        <h1 className="mt-6 text-2xl font-semibold text-navy">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          {fields.map((f) => (
            <div key={f.name}>
              <label htmlFor={f.name} className="mb-1 block text-sm font-medium text-navy">
                {f.label}
              </label>
              <input
                id={f.name}
                name={f.name}
                type={f.type ?? "text"}
                autoComplete={f.autoComplete}
                inputMode={f.inputMode}
                maxLength={f.maxLength}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-navy outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
              />
            </div>
          ))}
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-navy px-4 py-2.5 font-medium text-white hover:bg-navy/90 disabled:opacity-60"
          >
            {loading ? "Please wait..." : submitLabel}
          </button>
        </form>
        {children}
        {footer && (
          <p className="mt-6 text-sm text-slate-600">
            {footer.text}{" "}
            <Link href={footer.href} className="font-medium text-teal hover:underline">
              {footer.label}
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
