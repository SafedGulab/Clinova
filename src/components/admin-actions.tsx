"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: "CONFIRMED" | "COMPLETED" | "CANCELLED") {
    if (next === "CANCELLED" && !window.confirm("Cancel this appointment? The patient will be emailed.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/appointments/${id}/status`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) router.refresh();
      else setError(data?.error?.message ?? "Could not update.");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  const btn = "rounded-lg border px-2.5 py-1 text-xs font-medium disabled:opacity-50";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {status === "PENDING" && <button disabled={busy} onClick={() => change("CONFIRMED")} className={`${btn} border-teal text-teal hover:bg-teal/10`}>Confirm</button>}
      {status === "CONFIRMED" && <button disabled={busy} onClick={() => change("COMPLETED")} className={`${btn} border-blue-300 text-blue-700 hover:bg-blue-50`}>Complete</button>}
      {(status === "PENDING" || status === "CONFIRMED") && <button disabled={busy} onClick={() => change("CANCELLED")} className={`${btn} border-red-300 text-red-700 hover:bg-red-50`}>Cancel</button>}
      {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
