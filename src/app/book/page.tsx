import { redirect } from "next/navigation";
import { BookingWizard } from "@/components/booking-wizard";
import { SiteShell } from "@/components/site-shell";
import { isSuggesterEnabled } from "@/lib/ai/suggest-specialty";
import { getCurrentUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/clinic";
import { db } from "@/lib/db";
import { addDays, localDateString } from "@/lib/time";

export default async function BookPage({ searchParams }: { searchParams: Promise<{ doctor?: string; specialty?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const sp = await searchParams;
  const [s, specialties, doctors] = await Promise.all([
    getSettings(),
    db.specialty.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, description: true } }),
    db.doctor.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, specialtyId: true, qualification: true, experienceYears: true, consultationFee: true },
    }),
  ]);
  const initialDoctor = doctors.find((d) => d.id === sp.doctor);
  const initialSpecialtyId = initialDoctor?.specialtyId ?? specialties.find((x) => x.slug === sp.specialty)?.id;
  const today = localDateString(new Date(), s.timezone);

  return (
    <SiteShell>
      <BookingWizard
        specialties={specialties.map(({ id, name, description }) => ({ id, name, description }))}
        doctors={doctors}
        initialSpecialtyId={initialSpecialtyId}
        initialDoctorId={initialDoctor?.id}
        minDate={today}
        maxDate={addDays(today, s.maxAdvanceDays)}
        currency={s.currency}
        defaultName={user.name}
        aiSuggestEnabled={isSuggesterEnabled()}
      />
    </SiteShell>
  );
}
