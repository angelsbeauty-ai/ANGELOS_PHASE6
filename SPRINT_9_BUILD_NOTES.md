# Sprint 9 Build Notes

## What changed

Sprint 9 adds the first usable finance layer and a state-aware automation engine.

Finance deliberately remains lightweight: it is not accounting software. The ledger preserves history and separates booked value from actual money received. Refunds/corrections are additive history rather than overwrites.

Automations use `trigger → scheduled job → state re-check → action → evidence`. Rules are disabled by default so AngelOS does not silently begin messaging clients after an upgrade. Appointment confirmation and completion can queue enabled rules; cancellation invalidates pending work.

## Important safety decisions

- A database-calculated outstanding balance never directly triggers a client payment reminder.
- A client-message automation is not considered deliverable just because a body exists. It needs a verified channel/provider route and approved routine category/template.
- Delayed actions do not trust the state that existed when the job was scheduled; they re-read the appointment before acting.
- Job completion is written with the backend service role after an authenticated user/worker initiates processing, so the client app cannot forge success.

## Intentional V1 boundaries

- No taxes, payroll, bank reconciliation, invoicing, or full bookkeeping in Sprint 9.
- No payment processing; AngelOS tracks received money only.
- No live automatic Instagram/LINE/etc. aftercare/reminder delivery until provider transports are genuinely connected.
- The current `process-due` endpoint is a prototype execution hook. Production will invoke equivalent logic from the background worker/queue and surface failures through Sprint 10 System Health.
