const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type Details = { name: string; reference: string; doctor: string; specialty: string; when: string; clinic: string };
type Kind = "booked" | "confirmed" | "cancelled";

const COPY: Record<Kind, { subject: string; heading: string; note: string }> = {
  booked: { subject: "Clinova appointment request", heading: "Your appointment request is received", note: "Status: Pending. The clinic will confirm your appointment." },
  confirmed: { subject: "Clinova appointment confirmed", heading: "Your appointment is confirmed", note: "Please arrive a few minutes early." },
  cancelled: { subject: "Clinova appointment cancelled", heading: "Your appointment was cancelled", note: "No further action is needed." },
};

// Never include intake or medical information in emails.
export function appointmentEmail(kind: Kind, d: Details) {
  const c = COPY[kind];
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 0;color:#5B6B80;font-size:14px;width:120px">${k}</td><td style="padding:6px 0;font-size:14px;font-weight:bold">${esc(v)}</td></tr>`;
  const html = `<!doctype html><html><body style="margin:0;background:#F2F7FC;font-family:Arial,Helvetica,sans-serif;color:#0B2545">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid #D9E4F0;border-radius:12px">
<tr><td style="padding:28px 32px 8px;font-size:22px;font-weight:bold">Clino<span style="color:#13A89E">va</span></td></tr>
<tr><td style="padding:8px 32px;font-size:18px;font-weight:bold">${c.heading}</td></tr>
<tr><td style="padding:4px 32px">Hi ${esc(d.name)},</td></tr>
<tr><td style="padding:8px 32px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${row("Reference", d.reference)}${row("Doctor", d.doctor)}${row("Specialty", d.specialty)}${row("When", d.when)}${row("Clinic", d.clinic)}
</table></td></tr>
<tr><td style="padding:8px 32px 28px;font-size:13px;line-height:20px;color:#5B6B80">${c.note} This is a college demonstration system with fictional clinic data.</td></tr>
</table></td></tr></table></body></html>`;
  return { subject: `${c.subject} ${d.reference}`, html };
}
