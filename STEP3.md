# Step 3: public pages, booking, intake, appointments

Status: written but NOT compiled or run by the author. Run `npm run typecheck && npm run build` first.

## Test it
1. `npm run dev`. Browse `/`, `/services`, `/doctors` (try the search and specialty filter).
2. Sign in, click Book Appointment, complete the 5 steps (use a date within the next 60 days; slots are Mon-Sat 9:00-17:00 in Asia/Kolkata).
3. Confirm the appointment page, the confirmation email, and the dashboard listing.
4. Open the same time slot again for the same doctor: it should no longer be offered.
5. Cancel the appointment from its page; you should get a cancellation email, and the slot becomes bookable again.

## How double-booking is prevented
The server re-validates the slot, and the PostgreSQL constraint `appointment_no_overlap` (added in step 1) rejects overlaps even if two requests race.

## Not done yet
Contact page, rescheduling, editing intake after booking, admin dashboard and roles, automated tests, reminders.
