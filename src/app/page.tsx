import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { db } from "@/lib/db";

const steps = [
  ["Create an account", "Register and verify your email with a one-time code."],
  ["Choose a doctor and time", "Pick a service, a doctor and an available slot."],
  ["Share your intake details", "Fill in the intake form once, as part of booking."],
];
const faqs = [
  ["Is this a real clinic?", "No. Clinova is a college project. The clinic, doctors and services are fictional sample data."],
  ["How do I confirm my email?", "We send a 6-digit code that expires after 5 minutes. Check your spam folder if it does not arrive."],
  ["Can I cancel an appointment?", "Yes. Open the appointment from your dashboard and choose Cancel appointment."],
  ["Who can see my intake form?", "Only the signed-in patient who entered it can view it in this version."],
];

export default async function Home() {
  const specialties = await db.specialty.findMany({ orderBy: { name: "asc" } });
  return (
    <SiteShell>
      <section className="bg-mist">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="max-w-2xl text-4xl font-semibold text-navy">Your Health, Your Time. Care Made Simple.</h1>
          <p className="mt-4 max-w-xl text-slate-600">Clinova lets patients register, verify their email, share intake information and book clinic appointments online.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/book" className="rounded-xl bg-navy px-5 py-3 font-medium text-white">Book Appointment</Link>
            <Link href="/services" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-navy">Explore Services</Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-semibold text-navy">Popular specialties</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {specialties.map((s) => (
            <Link key={s.id} href={`/book?specialty=${s.slug}`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-navy hover:border-teal">{s.name}</Link>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="text-2xl font-semibold text-navy">How it works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {steps.map(([t, d], i) => (
            <li key={t} className="rounded-2xl border border-slate-200 bg-white p-5">
              <span className="text-sm font-semibold text-teal">Step {i + 1}</span>
              <p className="mt-1 font-medium text-navy">{t}</p>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-navy">Trust and privacy</h2>
          <p className="mt-2 text-sm text-slate-600">Passwords are stored as Argon2id hashes, sign-in codes are never stored in readable form, and intake details are not shown on public pages or in emails. Clinova is a demonstration project and makes no claim of regulatory compliance.</p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <h2 className="text-2xl font-semibold text-navy">Frequently asked questions</h2>
        <div className="mt-4 space-y-2">
          {faqs.map(([q, a]) => (
            <details key={q} className="rounded-xl border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer font-medium text-navy">{q}</summary>
              <p className="mt-2 text-sm text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
