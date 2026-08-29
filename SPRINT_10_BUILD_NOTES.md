# Sprint 10 Build Notes

## What changed

- Added `system_health_components`, `attention_items`, and `workspace_operational_controls`.
- Added backend health scanning for storage, AI configuration, messaging channels/delivery, content publishing, automations, overdue jobs, owner-required conversations, and upcoming unconfirmed bookings.
- Added auto-resolution for cleared health-managed issues while preserving acknowledged active issues.
- Added a global Emergency Read-only guard for workspace-changing routes, with diagnostics and AI chat exemptions.
- Wired Pause AI Actions into AI action approval and Pause Automations into background-job processing.
- Added a System Health mobile screen and Home attention summary.
- Reworked message/content attempt handling so failed operations can safely reuse an idempotency record on retry.

## Design choice: no reckless “Fix everything” button

AngelOS only calls something repaired when it can verify it. Sprint 10 therefore does not blanket-retry failed external messages/posts. Those operations can be duplicate-prone and provider error semantics are not connected yet. The system surfaces the failure, preserves evidence, and supports retry-safe idempotency when a controlled retry is initiated.

## Health evidence vs user settings

Normal users can read health evidence but cannot directly forge component status or resolve an issue in the database. Owner acknowledgement means “I saw this,” not “the system is healthy.” Fresh health evidence resolves the issue.

## Validation performed in this environment

- TypeScript/TSX syntax transpile checks on changed Sprint 10 files.
- SQL migration structure checks for tables/RLS/read policies.
- `git diff --check` whitespace validation.
- Static checks for workspace scoping, emergency controls, and idempotency reuse.

A complete package install/full project typecheck still requires a networked dev environment because npm dependencies are not installed in this container.
