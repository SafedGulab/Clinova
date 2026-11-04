const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function otpEmail(name: string, code: string, purpose: "VERIFY_EMAIL" | "PASSWORD_RESET") {
  const verify = purpose === "VERIFY_EMAIL";
  const subject = verify ? "Your Clinova verification code" : "Your Clinova password reset code";
  const lead = verify ? "Use this code to verify your email address." : "Use this code to reset your password.";
  const html = `<!doctype html><html><body style="margin:0;background:#F2F7FC;font-family:Arial,Helvetica,sans-serif;color:#0B2545">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border:1px solid #D9E4F0;border-radius:12px">
<tr><td style="padding:28px 32px 8px;font-size:22px;font-weight:bold;color:#0B2545">Clino<span style="color:#13A89E">va</span></td></tr>
<tr><td style="padding:8px 32px;font-size:15px;line-height:22px">Hi ${esc(name)},<br>${lead}</td></tr>
<tr><td align="center" style="padding:16px 32px"><div style="display:inline-block;letter-spacing:8px;font-size:32px;font-weight:bold;background:#F2F7FC;border-radius:10px;padding:14px 22px">${code}</div></td></tr>
<tr><td style="padding:8px 32px 28px;font-size:13px;line-height:20px;color:#5B6B80">This code expires in 5 minutes. If you did not request it, you can ignore this email. Never share this code with anyone.</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, html };
}
