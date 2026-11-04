-- Run this inside the initial migration (see README step 3). Not executed or tested by the author.
-- Prevents two non-cancelled appointments for the same doctor from overlapping in time,
-- even under simultaneous requests. Requires the btree_gist extension.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Appointment"
  ADD CONSTRAINT appointment_no_overlap
  EXCLUDE USING gist (
    "doctorId" WITH =,
    tsrange("startsAt", "endsAt") WITH &&
  )
  WHERE (status <> 'CANCELLED');
