# Sprint 9 Acceptance — Finance + Automations

## Finance

- [x] AngelOS uses the existing append-style client payment ledger instead of a second finance source of truth.
- [x] Ledger entries support expected, deposit, payment, discount, refund, and explicit correction effects.
- [x] Payment writes support an idempotency key so a retry cannot silently create the same receipt twice.
- [x] Appointment-linked finance entries are tenant-safe and must belong to the same client/workspace.
- [x] `actualIncome` counts only money actually received (`deposit`/`payment`), minus refunds and explicit income corrections.
- [x] Booked/expected value is not counted as income.
- [x] Appointment finance summary calculates expected total, discounts, actual received, refunds, and amount due.
- [x] A calculated amount due is marked as requiring owner confirmation before any client reminder. No balance reminder is auto-sent from finance calculations.
- [x] Mobile Finance screen shows actual income, method totals, recent ledger history, and the unpaid-balance safety rule.
- [x] Client detail offers a fast path to record actual money received.

## Automations

- [x] Automation rules and jobs are workspace-isolated.
- [x] Starter rules are created disabled. The owner must explicitly enable them.
- [x] Appointment confirmation/completion queues enabled matching rules with an idempotency key.
- [x] Appointment cancellation cancels pending jobs for that appointment.
- [x] Delayed jobs re-read the current appointment state before acting.
- [x] If the relevant appointment state changed, the job is skipped rather than firing an outdated action.
- [x] Follow-up automation can create a structured CRM follow-up.
- [x] Owner-prompt automation can escalate work that needs human judgment.
- [x] Automated client-message jobs stop at `needs_owner` until a verified provider + approved template/routine route exists; Sprint 9 does not fake delivery.
- [x] Automation job status/evidence is backend-controlled; ordinary workspace users can read jobs but cannot directly mark a job succeeded.
- [x] Automation screen allows owners to see rules, enable/disable them, inspect job status, and manually process due jobs in the prototype.

## Reliability / validation

- [x] Finance retry protection is enforced by a unique workspace/idempotency key.
- [x] Automation enqueue retry protection is enforced by a unique workspace/idempotency key.
- [x] Static TypeScript syntax transpilation passes for Sprint 9 source files.
- [x] SQL sanity checks confirm RLS and tenant-scoped foreign-key structure for new Sprint 9 tables.
- [ ] Full dependency-backed TypeScript build remains blocked in this container because project npm dependencies are not installed.
- [ ] Production background scheduler/worker hosting is deferred to Sprint 10 system-health/background operations hardening.
- [ ] Live provider auto-send remains blocked until real OAuth/provider transports and approved routine-message rules are connected.
