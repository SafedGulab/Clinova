import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/clinic";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/time";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const s = await getSettings();
  const now = new Date();
  // Only this patient's own appointments are ever queried.
  const all = await db.appointment.findMany({
    where: { patientId: user.id },
    orderBy: { startsAt: "asc" },
    include: { doctor: { include: { specialty: true } } },
  });
  const isUpcoming = (a: (typeof all)[number]) => a.startsAt > now && (a.status === "PENDING" || a.status === "CONFIRMED");
  const upcoming = all.filter(isUpcoming);
  const past = all.filter((a) => !isUpcoming(a)).reverse();

  const row = (a: (typeof all)[number]) => (
    <li key={a.id}>
      <Link href={`/appointments/${a.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4 hover:border-teal">
        <span>
          <span className="block font-medium text-navy">{a.doctor.name} - {a.doctor.specialty.name}</span>
          <span className="block text-sm text-slate-600">{formatDateTime(a.startsAt, s.timezone)} | {a.reference}</span>
        </span>
        <StatusBadge status={a.status} />
      </Link>
    </li>
  );

  return (
    <SiteShell>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-navy">Welcome, {user.name}</h1>
          <Link href="/book" className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white">Book appointment</Link>
        </div>
        <p className="mt-1 text-sm text-slate-600">{user.email} | Email verified</p>

        <h2 className="mt-8 text-lg font-semibold text-navy">Upcoming appointments</h2>
        {upcoming.length === 0 ? <p className="mt-2 text-sm text-slate-600">No upcoming appointments.</p> : <ul className="mt-3 space-y-2">{upcoming.map(row)}</ul>}

        <h2 className="mt-8 text-lg font-semibold text-navy">Previous and cancelled</h2>
        {past.length === 0 ? <p className="mt-2 text-sm text-slate-600">Nothing here yet.</p> : <ul className="mt-3 space-y-2">{past.map(row)}</ul>}
      </main>
    </SiteShell>
  );
}
