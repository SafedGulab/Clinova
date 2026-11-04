import type { AppointmentStatus, Prisma } from "@prisma/client";
import Link from "next/link";
import { AdminActions } from "@/components/admin-actions";
import { SiteShell } from "@/components/site-shell";
import { StatusBadge } from "@/components/status-badge";
import { TrendChart } from "@/components/trend-chart";
import { requireAdmin } from "@/lib/auth/guard";
import { getSettings } from "@/lib/clinic";
import { db } from "@/lib/db";
import { addDays, formatDateTime, localDateString, zonedToUtc } from "@/lib/time";

const PAGE = 10;
const STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const s = await getSettings();
  const q = sp.q?.trim().slice(0, 60);
  const status = STATUSES.includes(sp.status ?? "") ? (sp.status as AppointmentStatus) : undefined;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const ci = (v: string) => ({ contains: v, mode: "insensitive" as const });
  const where: Prisma.AppointmentWhereInput = {
    ...(status ? { status } : {}),
    ...(q ? { OR: [{ reference: ci(q) }, { patient: { name: ci(q) } }, { patient: { email: ci(q) } }, { doctor: { name: ci(q) } }] } : {}),
  };

  const now = new Date();
  const today = localDateString(now, s.timezone);
  const dayStart = zonedToUtc(today, 0, s.timezone);
  const dayEnd = zonedToUtc(today, 24 * 60, s.timezone);
  const since = zonedToUtc(addDays(today, -13), 0, s.timezone);

  const [total, todayCount, pending, confirmed, patients, filteredCount, rows, recent, audit] = await Promise.all([
    db.appointment.count(),
    db.appointment.count({ where: { startsAt: { gte: dayStart, lt: dayEnd }, status: { not: "CANCELLED" } } }),
    db.appointment.count({ where: { status: "PENDING" } }),
    db.appointment.count({ where: { status: "CONFIRMED" } }),
    db.user.count({ where: { role: "PATIENT", emailVerifiedAt: { not: null } } }),
    db.appointment.count({ where }),
    db.appointment.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE,
      include: { patient: { select: { name: true, email: true } }, doctor: { select: { name: true } } },
    }),
    db.appointment.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { actor: { select: { name: true } } } }),
  ]);

  const counts = new Map<string, number>();
  for (const r of recent) {
    const k = localDateString(r.createdAt, s.timezone);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const trend = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(today, i - 13);
    return { date: d.slice(5), bookings: counts.get(d) ?? 0 };
  });

  const pages = Math.max(1, Math.ceil(filteredCount / PAGE));
  const link = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (status) u.set("status", status);
    u.set("page", String(p));
    return `/admin?${u.toString()}`;
  };
  const field = "rounded-xl border border-slate-300 px-3 py-2 text-sm text-navy outline-none focus:border-teal focus:ring-2 focus:ring-teal/30";
  const stats: [string, number][] = [["Total appointments", total], ["Today", todayCount], ["Pending", pending], ["Confirmed", confirmed], ["Registered patients", patients]];

  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-navy">Admin dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Signed in as {admin.name}. Patient intake details are not shown here.</p>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          {stats.map(([label, n]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-2xl font-semibold text-navy">{n}</p>
              <p className="text-xs text-slate-600">{label}</p>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-navy">Bookings created per day (last 14 days)</h2>
          <div className="mt-3"><TrendChart data={trend} /></div>
        </section>

        <section className="mt-8">
          <h2 className="font-semibold text-navy">Appointments</h2>
          <form method="get" className="mt-3 flex flex-wrap gap-3">
            <input name="q" defaultValue={q ?? ""} placeholder="Search reference, patient or doctor" aria-label="Search" className={`${field} w-72`} />
            <select name="status" defaultValue={status ?? ""} aria-label="Status" className={field}>
              <option value="">All statuses</option>
              {STATUSES.map((x) => <option key={x} value={x}>{x.charAt(0) + x.slice(1).toLowerCase()}</option>)}
            </select>
            <button type="submit" className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white">Filter</button>
          </form>
          {rows.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No appointments match.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-mist text-xs text-slate-600">
                  <tr><th className="p-3">Reference</th><th className="p-3">Patient</th><th className="p-3">Doctor</th><th className="p-3">When</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.id} className="border-t border-slate-100 align-top text-navy">
                      <td className="p-3 font-medium">{a.reference}</td>
                      <td className="p-3">{a.patient.name}<span className="block text-xs text-slate-500">{a.patient.email}</span></td>
                      <td className="p-3">{a.doctor.name}</td>
                      <td className="p-3">{formatDateTime(a.startsAt, s.timezone)}</td>
                      <td className="p-3"><StatusBadge status={a.status} /></td>
                      <td className="p-3"><AdminActions id={a.id} status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
            <span>Page {Math.min(page, pages)} of {pages} ({filteredCount} total)</span>
            <span className="flex gap-3">
              {page > 1 && <Link href={link(page - 1)} className="font-medium text-teal">Previous</Link>}
              {page < pages && <Link href={link(page + 1)} className="font-medium text-teal">Next</Link>}
            </span>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-semibold text-navy">Recent admin activity</h2>
          {audit.length === 0 ? <p className="mt-2 text-sm text-slate-600">No activity yet.</p> : (
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {audit.map((l) => (
                <li key={l.id}>{formatDateTime(l.createdAt, s.timezone)} | {l.actor?.name ?? "System"} | {l.action}</li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </SiteShell>
  );
}
