import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, handle, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/clinic";
import { sendEmail } from "@/lib/mail/brevo";
import { appointmentEmail } from "@/lib/mail/appointment-email";
import { formatDateTime } from "@/lib/time";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(req, z.object({}), async () => {
    const user = await getCurrentUser();
    if (!user) return fail("UNAUTHORIZED", "Please sign in.", 401);

    const now = new Date();
    // Ownership, status and time are all checked inside the single UPDATE.
    const res = await db.appointment.updateMany({
      where: { id, patientId: user.id, status: { in: ["PENDING", "CONFIRMED"] }, startsAt: { gt: now } },
      data: { status: "CANCELLED", cancelledAt: now },
    });
    if (res.count !== 1) return fail("CANNOT_CANCEL", "This appointment can't be cancelled.", 409);

    const appt = await db.appointment.findFirst({ where: { id, patientId: user.id }, include: { doctor: { include: { specialty: true } } } });
    let emailSent = false;
    if (appt) {
      const s = await getSettings();
      const mail = appointmentEmail("cancelled", {
        name: user.name, reference: appt.reference, doctor: appt.doctor.name, specialty: appt.doctor.specialty.name,
        when: formatDateTime(appt.startsAt, s.timezone), clinic: s.clinicName,
      });
      emailSent = (await sendEmail({ to: user.email, toName: user.name, ...mail })).ok;
    }
    return ok({ emailSent });
  });
}
