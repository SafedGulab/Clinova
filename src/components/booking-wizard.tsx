"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Spec = { id: string; name: string; description: string };
type Doc = { id: string; name: string; specialtyId: string; qualification: string; experienceYears: number; consultationFee: number };
type Slot = { startsAt: string; label: string };
type Intake = {
  fullName: string; dateOfBirth: string; phone: string; reasonForVisit: string; medicalHistory: string;
  currentMedications: string; allergies: string; emergencyContactName: string; emergencyContactPhone: string;
};
type Props = {
  specialties: Spec[]; doctors: Doc[]; initialSpecialtyId?: string; initialDoctorId?: string;
  minDate: string; maxDate: string; currency: string; defaultName: string;
};

const input = "w-full rounded-xl border border-slate-300 px-3 py-2 text-navy outline-none focus:border-teal focus:ring-2 focus:ring-teal/30";
const card = "w-full rounded-xl border p-4 text-left transition hover:border-teal";
const primary = "rounded-xl bg-navy px-5 py-2.5 font-medium text-white hover:bg-navy/90 disabled:opacity-50";
const secondary = "rounded-xl border border-slate-300 px-5 py-2.5 font-medium text-navy hover:bg-mist";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-navy">
      {label}{required ? "" : " (optional)"}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function BookingWizard(props: Props) {
  const router = useRouter();
  const [step, setStep] = useState(props.initialDoctorId ? 3 : props.initialSpecialtyId ? 2 : 1);
  const [specialtyId, setSpecialtyId] = useState(props.initialSpecialtyId ?? "");
  const [doctorId, setDoctorId] = useState(props.initialDoctorId ?? "");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [intake, setIntake] = useState<Intake>({
    fullName: props.defaultName, dateOfBirth: "", phone: "", reasonForVisit: "", medicalHistory: "",
    currentMedications: "", allergies: "", emergencyContactName: "", emergencyContactPhone: "",
  });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: props.currency, maximumFractionDigits: 0 });
  const doctor = props.doctors.find((d) => d.id === doctorId);
  const specialty = props.specialties.find((s) => s.id === specialtyId);
  const set = (k: keyof Intake) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setIntake((v) => ({ ...v, [k]: e.target.value }));

  useEffect(() => {
    if (!doctorId || !date) { setSlots(null); return; }
    let stale = false;
    setSlots(null);
    fetch(`/api/doctors/${doctorId}/slots?date=${date}`)
      .then((r) => r.json())
      .then((d) => { if (!stale) setSlots(d.ok ? d.slots : []); })
      .catch(() => { if (!stale) setSlots([]); });
    return () => { stale = true; };
  }, [doctorId, date, reloadKey]);

  function next(to: number) { setError(null); setStep(to); }

  function checkIntake() {
    const required: (keyof Intake)[] = ["fullName", "dateOfBirth", "phone", "reasonForVisit", "emergencyContactName", "emergencyContactPhone"];
    if (required.some((k) => !intake[k].trim())) return setError("Please fill in all required fields.");
    next(5);
  }

  async function submit() {
    if (!doctor || !slot) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: doctor.id, startsAt: slot.startsAt, intake: { ...intake, consent } }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) { router.push(`/appointments/${data.id}?new=1&mail=${data.emailSent ? 1 : 0}`); return; }
      const code = data?.error?.code as string | undefined;
      setError(data?.error?.message ?? "Booking failed. Please try again.");
      if (code === "SLOT_TAKEN" || code === "SLOT_UNAVAILABLE") { setSlot(null); setReloadKey((k) => k + 1); setStep(3); }
      else if (code === "VALIDATION") setStep(4);
      else if (code === "UNAUTHORIZED") router.push("/login");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const prettyDate = date ? new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "";
  const doctorsHere = props.doctors.filter((d) => d.specialtyId === specialtyId);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm text-slate-600">Step {step} of 5</p>
      <h1 className="mt-1 text-2xl font-semibold text-navy">
        {["", "Choose a service", "Choose a doctor", "Pick a date and time", "Patient intake", "Review and confirm"][step]}
      </h1>
      <p className="mt-1 text-xs text-slate-500">Demonstration clinic with fictional sample doctors. Do not enter real medical information.</p>

      <div className="mt-6 space-y-3">
        {step === 1 && props.specialties.map((s) => (
          <button key={s.id} className={`${card} ${s.id === specialtyId ? "border-teal bg-teal/5" : "border-slate-200"}`}
            onClick={() => { if (s.id !== specialtyId) { setDoctorId(""); setDate(""); setSlot(null); } setSpecialtyId(s.id); next(2); }}>
            <span className="block font-medium text-navy">{s.name}</span>
            <span className="block text-sm text-slate-600">{s.description}</span>
          </button>
        ))}

        {step === 2 && (doctorsHere.length === 0 ? <p className="text-sm text-slate-600">No doctors are available for this service yet.</p> : doctorsHere.map((d) => (
          <button key={d.id} className={`${card} ${d.id === doctorId ? "border-teal bg-teal/5" : "border-slate-200"}`}
            onClick={() => { if (d.id !== doctorId) { setDate(""); setSlot(null); } setDoctorId(d.id); next(3); }}>
            <span className="block font-medium text-navy">{d.name} <span className="ml-1 rounded-full bg-mist px-2 py-0.5 text-xs font-normal text-slate-600">Sample profile</span></span>
            <span className="block text-sm text-slate-600">{d.qualification} | {d.experienceYears} years | {money.format(d.consultationFee)}</span>
          </button>
        )))}

        {step === 3 && (
          <>
            <Field label="Date" required>
              <input type="date" className={input} value={date} min={props.minDate} max={props.maxDate} onChange={(e) => { setDate(e.target.value); setSlot(null); }} />
            </Field>
            {date && slots === null && <p className="text-sm text-slate-600">Loading available times...</p>}
            {date && slots?.length === 0 && <p className="text-sm text-slate-600">No times available on this date. Try another day.</p>}
            {slots && slots.length > 0 && (
              <div role="radiogroup" aria-label="Available times" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((s) => (
                  <button key={s.startsAt} role="radio" aria-checked={slot?.startsAt === s.startsAt} onClick={() => setSlot(s)}
                    className={`rounded-xl border px-2 py-2 text-sm ${slot?.startsAt === s.startsAt ? "border-teal bg-teal text-white" : "border-slate-300 text-navy hover:border-teal"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <Field label="Patient full name" required><input className={input} value={intake.fullName} onChange={set("fullName")} autoComplete="name" /></Field>
            <Field label="Date of birth" required><input type="date" className={input} value={intake.dateOfBirth} onChange={set("dateOfBirth")} max={props.minDate} /></Field>
            <Field label="Phone number" required><input type="tel" className={input} value={intake.phone} onChange={set("phone")} autoComplete="tel" /></Field>
            <Field label="Reason for visit" required><textarea className={input} rows={3} maxLength={500} value={intake.reasonForVisit} onChange={set("reasonForVisit")} /></Field>
            <Field label="Relevant medical history"><textarea className={input} rows={2} maxLength={1000} value={intake.medicalHistory} onChange={set("medicalHistory")} /></Field>
            <Field label="Current medications"><textarea className={input} rows={2} maxLength={1000} value={intake.currentMedications} onChange={set("currentMedications")} /></Field>
            <Field label="Allergies"><textarea className={input} rows={2} maxLength={1000} value={intake.allergies} onChange={set("allergies")} /></Field>
            <Field label="Emergency contact name" required><input className={input} value={intake.emergencyContactName} onChange={set("emergencyContactName")} /></Field>
            <Field label="Emergency contact phone" required><input type="tel" className={input} value={intake.emergencyContactPhone} onChange={set("emergencyContactPhone")} /></Field>
          </div>
        )}

        {step === 5 && doctor && slot && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-navy">
              <p><span className="text-slate-600">Service:</span> {specialty?.name}</p>
              <p><span className="text-slate-600">Doctor:</span> {doctor.name} (sample profile)</p>
              <p><span className="text-slate-600">When:</span> {prettyDate}, {slot.label}</p>
              <p><span className="text-slate-600">Fee:</span> {money.format(doctor.consultationFee)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-navy">
              <p><span className="text-slate-600">Patient:</span> {intake.fullName}, born {intake.dateOfBirth}</p>
              <p><span className="text-slate-600">Phone:</span> {intake.phone}</p>
              <p><span className="text-slate-600">Reason:</span> {intake.reasonForVisit}</p>
              <p><span className="text-slate-600">Emergency contact:</span> {intake.emergencyContactName}, {intake.emergencyContactPhone}</p>
              <p className="text-slate-600">Optional medical fields: {[intake.medicalHistory, intake.currentMedications, intake.allergies].filter((v) => v.trim()).length} of 3 provided</p>
            </div>
            <label className="flex items-start gap-2 text-sm text-navy">
              <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>I consent to Clinova collecting and processing the information I entered so the clinic can arrange my appointment. This is a college demonstration system, so I have not entered real medical information.</span>
            </label>
          </div>
        )}

        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>

      <div className="mt-8 flex gap-3">
        {step > 1 && <button className={secondary} onClick={() => next(step - 1)}>Back</button>}
        {step === 3 && <button className={primary} disabled={!slot} onClick={() => next(4)}>Continue</button>}
        {step === 4 && <button className={primary} onClick={checkIntake}>Review</button>}
        {step === 5 && <button className={primary} disabled={!consent || busy} onClick={submit}>{busy ? "Booking..." : "Confirm booking"}</button>}
      </div>
    </main>
  );
}
