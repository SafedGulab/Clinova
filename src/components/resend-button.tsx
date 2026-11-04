"use client";
import { useEffect, useState } from "react";

export function ResendButton({ email, purpose }: { email: string; purpose: "VERIFY_EMAIL" | "PASSWORD_RESET" }) {
  const [wait, setWait] = useState(60);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function resend() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        setWait(data.retryAfter ?? 60);
        setMsg(data.message);
      } else {
        if (data?.retryAfter) setWait(data.retryAfter);
        setMsg(data?.error?.message ?? "Could not resend the code.");
      }
    } catch {
      setMsg("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 text-sm text-slate-600">
      <button type="button" onClick={resend} disabled={busy || wait > 0} className="font-medium text-teal hover:underline disabled:text-slate-400 disabled:no-underline">
        {wait > 0 ? `Resend code in ${wait}s` : "Resend code"}
      </button>
      {msg && <p role="status" className="mt-2">{msg}</p>}
    </div>
  );
}
