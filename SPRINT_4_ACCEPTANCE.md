# Sprint 4 Acceptance Criteria — Booking + Calendar

## Services and availability rules
- Workspace owner can create/list active services with duration, buffers, price snapshot, and currency.
- Business hours can be configured per weekday.
- If business hours are configured, outside-hours requests become a soft owner decision rather than an automatic rejection.
- If no hours are configured, AngelOS does not invent working-hour restrictions.

## Conflict protection
- Existing active appointments are hard conflicts.
- Hard/personal calendar blocks are unavailable.
- Soft/student/content/other blocks require explicit owner override.
- Buffer time participates in conflict checks.
- Database exclusion constraint independently prevents overlapping active appointment busy ranges, protecting against race-condition double booking.

## Booking lifecycle
- Owner can create an appointment from an existing client + service.
- New appointments begin at `confirmation_pending`.
- Owner can confirm, reschedule, cancel, and complete an appointment.
- Rescheduling re-runs hard/soft conflict checks.
- Appointment price/service/duration are snapshotted so later service edits do not rewrite historical bookings.
- Appointment changes append history events rather than overwriting the event trail.

## Calendar
- Owner can query a time window and receive appointments plus calendar blocks.
- Mobile Calendar shows the next seven days and exposes New Booking.
- Mobile service setup exists for early end-to-end testing.
- Prototype New Booking screen lets owner choose client/service/date/time and explicitly override a soft conflict.

## Timezone behavior
- Mobile converts owner-entered local date/time to an ISO timestamp using the device timezone.
- Backend stores timestamps in UTC (`timestamptz`).
- Working-hours checks use the workspace IANA timezone, not the server timezone.

## Still later
- Google Calendar sync is optional and not required for AngelOS booking to work.
- Client-facing interactive booking cards, reminders, arrival instructions, and messaging confirmations connect in later milestones.
