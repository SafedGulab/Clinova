"use client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button onClick={logout} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-navy hover:bg-mist">
      Log out
    </button>
  );
}
