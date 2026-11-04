import { db } from "@/lib/db";

export async function getSettings() {
  const s = await db.clinicSettings.findUnique({ where: { id: 1 } });
  return (
    s ?? {
      id: 1, clinicName: "Clinova Demo Clinic", contactEmail: "contact@clinova.example", contactPhone: "", address: "",
      timezone: "Asia/Kolkata", currency: "INR", slotMinutes: 30, openMinute: 540, closeMinute: 1020, maxAdvanceDays: 60,
      updatedAt: new Date(),
    }
  );
}
