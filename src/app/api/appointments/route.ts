import { randomInt } from "node:crypto";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { fail, handle, ok, tooMany } from "@/lib/api";
import { rateLimit } from "@/lib/auth/rate-limit";
import { getCurrentUser } from "@/lib/auth/session";
import { bookSchema } from "@/lib/booking/schemas";
import { getSlots } from "@/lib/booking/slots";
import { getSettings } from "@/lib/clinic";
import { sendEmail } from "@/lib/mail/brevo";
import { appointmentEmail } from "@/lib/mail/appointment-email";
import { formatDateTime, localDateString } from "@/lib/time";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newReference = () => "CLN-" + Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

export async function POST(req: NextRequest) {
  return handle(req, bookSchema, async (input) => {
    const user = await getCurrentUser();
    if (!user) return fail("UNAUTHORIZED", "Please sign in to book.", 401);
    const rl = await rateLimit(`book:user:${user.id}`, 10, 3600);
    if (!rl.ok) return tooMany(rl.retryAfter);

    const s = await getSettings();
    const startsAt = new Date(input.startsAt);
    // Re-derive the allowed slots on the server: availability, hours, past dates and existing bookings.
    const slots = await getSlots(input.doctorId, localDateString(startsAt, s.timezone));
    if (!slots.some((x) => x.startsAt === startsAt.toISOString())) {
      return fail("SLOT_UNAVAILABLE", "That time is no longer available. Please pick another.", 409);
    }
    const endsAt = new Date(startsAt.getTime() + s.slotMinutes * 60000);
    const { consent: _consent, dateOfBirth, ...intake } = input.intake;

    let appt;
    try {
      // Nested create runs as one transaction; the database exclusion constraint blocks overlaps under races.
      appt = await db.appointment.create({
        data: {
          reference: newReference(),
          patientId: user.id,
          doctorId: input.doctorId,
          startsAt,
          endsAt,
          intake: { create: { patientId: user.id, ...intake, dateOfBirth: new Date(`${dateOfBirth}T00:00:00Z`), consentGivenAt: new Date() } },
        },
        include: { doctor: { include: { specialty: true } } },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("appointment_no_overlap") || msg.includes("23P01")) {
        return fail("SLOT_TAKEN", "Someone just booked that time. Please choose another.", 409);
      }
      throw e;
    }

    // The booking is committed. An email failure is reported separately and never undoes it.
    const mail = appointmentEmail("booked", {
      name: user.name, reference: appt.reference, doctor: appt.doctor.name, specialty: appt.doctor.specialty.name,
      when: formatDateTime(appt.startsAt, s.timezone), clinic: s.clinicName,
    });
    const sent = await sendEmail({ to: user.email, toName: user.name, ...mail });
    return ok({ id: appt.id, reference: appt.reference, emailSent: sent.ok }, 201);
  });
}
