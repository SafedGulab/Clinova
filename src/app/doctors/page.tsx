import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { getSettings } from "@/lib/clinic";
import { db } from "@/lib/db";
import { fmtMinutes } from "@/lib/time";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function summarize(av: { dayOfWeek: number; startMinute: number; endMinute: number }[]) {
  if (av.length === 0) return "No availability set";
  const days = [...new Set(av.map((a) => a.dayOfWeek))].sort((a, b) => a - b);
  const contiguous = days.length >= 3 && days[days.length - 1] - days[0] === days.length - 1;
  const dayText = contiguous ? `${DAYS[days[0]]}-${DAYS[days[days.length - 1]]}` : days.map((d) => DAYS[d]).join(", ");
  const start = Math.min(...av.map((a) => a.startMinute));
  const end = Math.max(...av.map((a) => a.endMinute));
  return `${dayText}, ${fmtMinutes(start)} - ${fmtMinutes(end)}`;
}

export default async function DoctorsPage({ searchParams }: { searchParams: Promise<{ q?: string; specialty?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 60);
  const [settings, specialties, doctors] = await Promise.all([
    getSettings(),
    db.specialty.findMany({ orderBy: { name: "asc" } }),
    db.doctor.findMany({
      where: {
        isActive: true,
        ...(sp.specialty ? { specialty: { slug: sp.specialty } } : {}),
        ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
      },
      orderBy: { name: "asc" },
      include: { specialty: true, availability: true },
    }),
  ]);
  const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: settings.currency, maximumFractionDigits: 0 });
  const field = "rounded-xl border border-slate-300 px-3 py-2 text-navy outline-none focus:border-teal focus:ring-2 focus:ring-teal/30";

  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold text-navy">Doctors</h1>
        <p className="mt-2 text-sm text-slate-600">Sample profiles with fictional details, for demonstration only.</p>
        <form method="get" className="mt-6 flex flex-wrap gap-3">
          <input name="q" defaultValue={q ?? ""} placeholder="Search by name" aria-label="Search by name" className={field} />
          <select name="specialty" defaultValue={sp.specialty ?? ""} aria-label="Specialty" className={field}>
            <option value="">All specialties</option>
            {specialties.map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}
          </select>
          <button type="submit" className="rounded-xl bg-navy px-5 py-2 font-medium text-white">Filter</button>
        </form>
        {doctors.length === 0 ? (
          <p className="mt-8 text-slate-600">No doctors match your search.</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d) => (
              <div key={d.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold text-navy">{d.name}</h2>
                  {d.isSample && <span className="rounded-full bg-mist px-2 py-0.5 text-xs text-slate-600">Sample</span>}
                </div>
                <p className="text-sm font-medium text-teal">{d.specialty.name}</p>
                <p className="mt-2 text-sm text-slate-600">{d.qualification}</p>
                <p className="text-sm text-slate-600">{d.experienceYears} years experience</p>
                <p className="text-sm text-slate-600">Fee: {money.format(d.consultationFee)}</p>
                <p className="mt-1 flex-1 text-sm text-slate-600">Available: {summarize(d.availability)}</p>
                <Link href={`/book?doctor=${d.id}`} className="mt-4 rounded-xl bg-navy px-4 py-2 text-center text-sm font-medium text-white">Book appointment</Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </SiteShell>
  );
}
