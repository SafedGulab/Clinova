# Step 4: administrator role and dashboard

Status: written but NOT compiled or run by the author. Run `npm run typecheck && npm run build` first.

## Create the first administrator (on your own machine)
    npx tsx --env-file=.env scripts/create-admin.ts
Use an email address DIFFERENT from your patient test account. The password is typed hidden and stored as an Argon2id hash.
There is no public way to become an admin and no default account.

## Test it
1. Sign in as the admin: the header shows an Admin link; open /admin.
2. Book an appointment as a patient (second browser or private window), then Confirm / Complete / Cancel it from /admin.
3. Confirm the patient receives the confirmation / cancellation email, and the patient dashboard badge updates.
4. As the patient, open /admin: you should get a 404 page.

## Not done yet
Doctor availability and settings management, patient/doctor management pages, contact page, rescheduling,
intake editing, automated tests, README, deployment.
