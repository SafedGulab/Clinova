"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CancelButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    if (!window.confirm("Cancel this appointment? This cannot be undone.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${id}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) router.refresh();
      else setError(data?.error?.message ?? "Could not cancel. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button onClick={cancel} disabled={busy} className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60">
        {busy ? "Cancelling..." : "Cancel appointment"}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
