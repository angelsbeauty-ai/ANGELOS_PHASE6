# Sprint 10 Acceptance — Needs Attention + System Health

Sprint 10 is complete when AngelOS can detect meaningful workspace problems, surface owner-required work without noise, and enforce emergency pause controls instead of merely displaying them.

## Acceptance criteria

### Central Needs Attention
- [x] Workspace-scoped `attention_items` exist with Urgent / Today / Later severity.
- [x] Health-generated attention items deduplicate by workspace + issue key.
- [x] Owner can acknowledge an item without falsely resolving the underlying problem.
- [x] Acknowledged items remain acknowledged while the issue persists.
- [x] Health-generated items automatically resolve when fresh evidence shows the issue is gone.
- [x] The health checker only auto-resolves items it manages; future workflow-owned attention is not erased.
- [x] Needs Attention includes current owner-required messaging threads, owner-stopped automation jobs, and upcoming unconfirmed appointments.

### System Health
- [x] Component health is stored as Healthy / Degraded / Needs Attention / Disconnected / Paused / Unknown.
- [x] Health is capability-level rather than provider-wide only.
- [x] Database reachability is verified by authorized workspace access.
- [x] AngelOS media bucket availability is checked.
- [x] AI configuration state is visible without pretending an external provider ping occurred.
- [x] Messaging-channel health reflects each connected channel status/capability snapshot.
- [x] Failed outbound messages, failed content publishing, failed automations, and overdue background work are surfaced.
- [x] Optional/unconfigured components can remain Unknown without incorrectly making the whole workspace unhealthy.
- [x] Stale component rows are removed after a fresh health scan.

### Emergency controls
- [x] Pause AI Actions is persisted per workspace.
- [x] AI chat can remain available while approved AI mutations are blocked.
- [x] Pause Automations stops the due-job processor.
- [x] Emergency Read-only is enforced by a backend guard for normal workspace-changing routes.
- [x] Diagnostics/recovery controls remain reachable while Emergency Read-only is on.
- [x] Cancelling a proposed AI action remains possible during Emergency Read-only.

### Retry / duplicate safety
- [x] Failed message delivery can reuse the same idempotency record for a later safe retry rather than creating a duplicate send record.
- [x] Failed content publishing can reuse the same idempotency record for a later safe retry.
- [x] Already-verified sent/published operations return duplicate-prevented success rather than sending again.
- [x] Sprint 10 does not blindly auto-retry uncertain external sends/posts; owner/provider-specific retry policy remains safer until live adapters expose reliable error semantics.

### Owner-facing UI
- [x] Home shows the current Needs Attention count when health evidence exists.
- [x] System Health screen shows overall status, owner attention, component summaries, and last-check evidence.
- [x] Owner can run a health check manually.
- [x] Owner can acknowledge attention items.
- [x] Owner can toggle Pause AI Actions, Pause Automations, and Emergency Read-only.

## Honest limitations

- Live Meta/LINE/TikTok OAuth/token-expiry checks are not claimed until real provider adapters exist.
- Provider outages cannot be reliably distinguished from connection problems until those live adapters return normalized health evidence.
- Push-notification delivery for Urgent/Today items is not part of this sprint.
- A total database outage cannot persist its own database-health row; the independent API `/health` endpoint remains the outside-in liveness signal.
