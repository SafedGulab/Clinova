# Step 2: registration, login, email OTP (Brevo)

Status: written but NOT compiled or run by the author. Run `npm run typecheck && npm run build` first.

## Test it
1. `npm run dev`, open http://localhost:3000/register
2. Register with an email you can open (use fictional name). Check inbox AND spam for the 6-digit code.
3. Enter the code on /verify-otp. You should land on /dashboard.
4. Log out, sign in at /login. Try /forgot-password and /reset-password too.

## Brevo troubleshooting
- Terminal shows `Brevo send failed with HTTP status 401`: API key wrong, or Brevo "authorized IPs" blocking is still on.
- Status 400: the sender email is not verified in Brevo, or BREVO_SENDER_EMAIL does not match it exactly.
- Brevo may require phone verification before sending.

## Behaviour
OTP: 6 digits, keyed hash stored (never the code), 5-minute expiry, 5 attempts, 60 s resend cooldown, new code invalidates old ones.
Sessions: random token in an HTTP-only SameSite=Lax cookie; only a SHA-256 hash is stored. Passwords: Argon2id.
Rate limits are stored in Postgres. POSTs also check the Origin header (CSRF).

## Not done yet
Automated tests, CSP header, expired-session cleanup, admin role setup.
