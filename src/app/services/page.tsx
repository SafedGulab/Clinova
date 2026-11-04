import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { db } from "@/lib/db";

export default async function ServicesPage() {
  const specialties = await db.specialty.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { doctors: { where: { isActive: true } } } } } });
  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold text-navy">Services</h1>
        <p className="mt-2 text-sm text-slate-600">Configurable demonstration clinic services. These are sample entries, not real providers.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {specialties.map((s) => (
            <div key={s.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-navy">{s.name}</h2>
              <p className="mt-1 flex-1 text-sm text-slate-600">{s.description}</p>
              <p className="mt-3 text-xs text-slate-500">{s._count.doctors} sample doctor{s._count.doctors === 1 ? "" : "s"}</p>
              <Link href={`/book?specialty=${s.slug}`} className="mt-3 rounded-xl bg-navy px-4 py-2 text-center text-sm font-medium text-white">Book appointment</Link>
            </div>
          ))}
        </div>
      </main>
    </SiteShell>
  );
}
