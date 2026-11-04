import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const specialties = [
  { slug: "general-medicine", name: "General Medicine", description: "Everyday health concerns, check-ups and follow-ups." },
  { slug: "dermatology", name: "Dermatology", description: "Skin, hair and nail conditions." },
  { slug: "cardiology", name: "Cardiology", description: "Heart and blood-pressure related consultations." },
  { slug: "pediatrics", name: "Pediatrics", description: "Care for infants, children and adolescents." },
  { slug: "orthopedics", name: "Orthopedics", description: "Bones, joints and musculoskeletal problems." },
  { slug: "dental-care", name: "Dental Care", description: "Dental check-ups and oral health." },
];

// FICTIONAL sample profiles for demonstration only. Not real people or credentials.
const doctors = [
  { slug: "sample-general-1", name: "Dr. Sample Gupta", spec: "general-medicine", qualification: "Sample qualification (demo data)", years: 9, fee: 500 },
  { slug: "sample-general-2", name: "Dr. Sample Rao", spec: "general-medicine", qualification: "Sample qualification (demo data)", years: 5, fee: 400 },
  { slug: "sample-derm-1", name: "Dr. Sample Mehta", spec: "dermatology", qualification: "Sample qualification (demo data)", years: 7, fee: 700 },
  { slug: "sample-cardio-1", name: "Dr. Sample Nair", spec: "cardiology", qualification: "Sample qualification (demo data)", years: 12, fee: 1000 },
  { slug: "sample-peds-1", name: "Dr. Sample Iyer", spec: "pediatrics", qualification: "Sample qualification (demo data)", years: 8, fee: 600 },
  { slug: "sample-ortho-1", name: "Dr. Sample Khan", spec: "orthopedics", qualification: "Sample qualification (demo data)", years: 10, fee: 800 },
  { slug: "sample-dental-1", name: "Dr. Sample Bose", spec: "dental-care", qualification: "Sample qualification (demo data)", years: 6, fee: 450 },
];

async function main() {
  const specialtyIds = new Map<string, string>();
  for (const s of specialties) {
    const row = await prisma.specialty.upsert({ where: { slug: s.slug }, update: { name: s.name, description: s.description }, create: s });
    specialtyIds.set(s.slug, row.id);
  }

  for (const d of doctors) {
    const doctor = await prisma.doctor.upsert({
      where: { slug: d.slug },
      update: {},
      create: {
        slug: d.slug,
        name: d.name,
        specialtyId: specialtyIds.get(d.spec)!,
        qualification: d.qualification,
        experienceYears: d.years,
        consultationFee: d.fee,
        bio: "Fictional demonstration profile.",
        isSample: true,
      },
    });
    // Monday to Saturday, 09:00-17:00 (clinic local time)
    await prisma.doctorAvailability.createMany({
      data: [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({ doctorId: doctor.id, dayOfWeek, startMinute: 540, endMinute: 1020 })),
      skipDuplicates: true,
    });
  }

  await prisma.clinicSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, contactEmail: "contact@clinova.example", contactPhone: "+00 000 000 0000", address: "Demo address, not a real clinic" },
  });

  console.log("Seed complete: specialties, sample doctors, availability, clinic settings. No patient data created.");
}

main().finally(() => prisma.$disconnect());
