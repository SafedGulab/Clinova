import { db } from "@/lib/db";
import { getSettings } from "@/lib/clinic";
import { addDays, dayOfWeek, formatTime, localDateString, zonedToUtc } from "@/lib/time";

export type Slot = { startsAt: string; label: string };

/** Bookable slots for one doctor on one local date (clinic timezone). The server re-checks this on booking. */
export async function getSlots(doctorId: string, dateStr: string): Promise<Slot[]> {
  const s = await getSettings();
  const now = new Date();
  const today = localDateString(now, s.timezone);
  if (dateStr < today || dateStr > addDays(today, s.maxAdvanceDays)) return [];

  const doctor = await db.doctor.findFirst({ where: { id: doctorId, isActive: true }, select: { id: true } });
  if (!doctor) return [];
  const windows = await db.doctorAvailability.findMany({ where: { doctorId, dayOfWeek: dayOfWeek(dateStr) } });
  if (windows.length === 0) return [];

  const dayStart = zonedToUtc(dateStr, 0, s.timezone);
  const dayEnd = zonedToUtc(dateStr, 24 * 60, s.timezone);
  const booked = await db.appointment.findMany({
    where: { doctorId, status: { not: "CANCELLED" }, startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } },
    select: { startsAt: true, endsAt: true },
  });

  const out = new Map<string, Slot>();
  for (const w of windows) {
    const from = Math.max(w.startMinute, s.openMinute);
    const to = Math.min(w.endMinute, s.closeMinute);
    for (let m = from; m + s.slotMinutes <= to; m += s.slotMinutes) {
      const start = zonedToUtc(dateStr, m, s.timezone);
      const end = new Date(start.getTime() + s.slotMinutes * 60000);
      if (start <= now) continue;
      if (booked.some((b) => b.startsAt < end && b.endsAt > start)) continue;
      out.set(start.toISOString(), { startsAt: start.toISOString(), label: formatTime(start, s.timezone) });
    }
  }
  return [...out.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
