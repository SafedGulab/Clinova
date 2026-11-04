import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max, `Please keep this under ${max} characters.`).optional().transform((v) => (v ? v : undefined));
const phone = z.string().trim().regex(/^[+\d][\d\s\-()]{6,19}$/, "Enter a valid phone number.");

export const intakeSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the patient's full name.").max(100),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the date of birth.")
    .refine((v) => {
      const d = new Date(`${v}T00:00:00Z`);
      return !Number.isNaN(d.getTime()) && d <= new Date() && d.getUTCFullYear() >= 1900;
    }, "Enter a valid date of birth."),
  phone,
  reasonForVisit: z.string().trim().min(3, "Tell us briefly why you are visiting.").max(500),
  medicalHistory: optionalText(1000),
  currentMedications: optionalText(1000),
  allergies: optionalText(1000),
  emergencyContactName: z.string().trim().min(2, "Enter an emergency contact name.").max(100),
  emergencyContactPhone: phone,
  consent: z.literal(true, { errorMap: () => ({ message: "Consent is required to book." }) }),
});

export const bookSchema = z.object({
  doctorId: z.string().min(1),
  startsAt: z.string().datetime({ message: "Pick a time slot." }),
  intake: intakeSchema,
});
