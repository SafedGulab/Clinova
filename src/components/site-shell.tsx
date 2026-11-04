import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/clinic";
import { LogoutButton } from "./logout-button";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link href="/" className="text-xl font-semibold text-navy">
            Clino<span className="text-teal">va</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-5 text-sm font-medium text-navy">
            <Link href="/services">Services</Link>
            <Link href="/doctors">Doctors</Link>
            {user ? (
              <>
                <Link href="/dashboard">Dashboard</Link>
                {user.role === "ADMIN" && <Link href="/admin">Admin</Link>}
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login">Sign in</Link>
                <Link href="/register" className="rounded-xl bg-navy px-4 py-2 text-white">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-slate-200 bg-mist">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600">
          <p className="font-semibold text-navy">Clinova</p>
          <p className="mt-1">College project demonstration. Clinic, doctors and services shown here are fictional sample data.</p>
          <p className="mt-1">Contact: {settings.contactEmail}</p>
        </div>
      </footer>
    </div>
  );
}
