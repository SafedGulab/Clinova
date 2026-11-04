import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CancelButton } from "@/components/cancel-button";
import { SiteShell } from "@/components/site-shell";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/clinic";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/time";

export default async function AppointmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string; mail?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const sp = await searchParams;
  // Scoped to the signed-in patient: another patient's id simply returns 404.
  const a = await db.appointment.findFirst({
    where: { id, patientId: user.id },
    include: { doctor: { include: { specialty: true } }, intake: { select: { id: true } } },
  });
  if (!a) notFound();
  const s = await getSettings();
  const cancellable = (a.status === "PENDING" || a.status === "CONFIRMED") && a.startsAt > new Date();

  return (
    <SiteShell>
      <main className="mx-auto max-w-2xl px-4 py-10">
        {sp.new === "1" && (
          <div role="status" className="mb-6 rounded-xl bg-teal/10 px-4 py-3 text-sm text-navy">
            <p className="font-medium">Your appointment request is saved.</p>
            <p>{sp.mail === "1" ? "A confirmation email has been sent." : "We could not send the confirmation email, but your booking is saved."}</p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-navy">Appointment {a.reference}</h1>
          <StatusBadge status={a.status} />
        </div>
        <div className="mt-6 space-y-1 rounded-2xl border border-slate-200 bg-white p-6 text-navy">
          <p><span className="text-slate-600">Doctor:</span> {a.doctor.name} (sample profile)</p>
          <p><span className="text-slate-600">Specialty:</span> {a.doctor.specialty.name}</p>
          <p><span className="text-slate-600">When:</span> {formatDateTime(a.startsAt, s.timezone)}</p>
          <p><span className="text-slate-600">Booked:</span> {formatDateTime(a.createdAt, s.timezone)}</p>
          <p><span className="text-slate-600">Intake form:</span> {a.intake ? "Submitted" : "Not submitted"}</p>
        </div>
        <div className="mt-6 flex flex-wrap items-start gap-3">
          {cancellable && <CancelButton id={a.id} />}
          <Link href="/dashboard" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-navy hover:bg-mist">Back to dashboard</Link>
        </div>
      </main>
    </SiteShell>
  );
}
