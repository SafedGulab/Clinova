import type { AppointmentStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, handle, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/clinic";
import { appointmentEmail } from "@/lib/mail/appointment-email";
import { sendEmail } from "@/lib/mail/brevo";
import { formatDateTime } from "@/lib/time";

const schema = z.object({ status: z.enum(["CONFIRMED", "COMPLETED", "CANCELLED"]) });
// Allowed transitions: target status -> statuses it may come from.
const FROM: Record<"CONFIRMED" | "COMPLETED" | "CANCELLED", AppointmentStatus[]> = {
  CONFIRMED: ["PENDING"],
  COMPLETED: ["CONFIRMED"],
  CANCELLED: ["PENDING", "CONFIRMED"],
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(req, schema, async ({ status }) => {
    const admin = await getCurrentUser();
    if (!admin) return fail("UNAUTHORIZED", "Please sign in.", 401);
    if (admin.role !== "ADMIN") return fail("FORBIDDEN", "You do not have access to this action.", 403);

    const appt = await db.appointment.findUnique({
      where: { id },
      include: { patient: { select: { name: true, email: true } }, doctor: { include: { specialty: true } } },
    });
    if (!appt) return fail("NOT_FOUND", "Appointment not found.", 404);

    const now = new Date();
    const changed = await db.$transaction(async (tx) => {
      const res = await tx.appointment.updateMany({
        where: { id, status: { in: FROM[status] } },
        data: { status, ...(status === "CANCELLED" ? { cancelledAt: now } : {}) },
      });
      if (res.count !== 1) return false;
      // Audit entries hold references and statuses only, never intake or medical content.
      await tx.auditLog.create({
        data: { actorId: admin.id, action: "appointment.status_changed", entityType: "Appointment", entityId: id, metadata: { reference: appt.reference, from: appt.status, to: status } },
      });
      return true;
    });
    if (!changed) return fail("INVALID_TRANSITION", "That status change is not allowed.", 409);

    let emailSent: boolean | null = null; // null = no email for this change
    if (status === "CONFIRMED" || status === "CANCELLED") {
      const s = await getSettings();
      const mail = appointmentEmail(status === "CONFIRMED" ? "confirmed" : "cancelled", {
        name: appt.patient.name, reference: appt.reference, doctor: appt.doctor.name, specialty: appt.doctor.specialty.name,
        when: formatDateTime(appt.startsAt, s.timezone), clinic: s.clinicName,
      });
      emailSent = (await sendEmail({ to: appt.patient.email, toName: appt.patient.name, ...mail })).ok;
    }
    return ok({ emailSent });
  });
}
