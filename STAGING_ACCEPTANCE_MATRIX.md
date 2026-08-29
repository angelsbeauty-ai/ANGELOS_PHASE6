# AngelOS Staging Acceptance Matrix

This is the gate between a successful code build and a TestFlight-ready private beta.

## 1. Foundation
- [ ] Clean install succeeds on a physical iPhone.
- [ ] Sign up, sign in, sign out, password recovery work.
- [ ] Session persists after app restart.
- [ ] Dev/Staging/Production app IDs do not collide.
- [ ] `/health` is healthy.
- [ ] `/health/ready` proves database readiness.

## 2. Tenant isolation / security
- [ ] Workspace A cannot read Workspace B via API.
- [ ] Workspace A cannot read Workspace B directly through Supabase client/RLS.
- [ ] Founder Admin does not expose subscriber private client/message/finance content.
- [ ] Service-role key is absent from mobile bundles and logs.
- [ ] Emergency read-only blocks business-changing actions.
- [ ] Revoked beta tester becomes protected read-only.

## 3. AI Core
- [ ] Assistant profile persists per workspace.
- [ ] Role toggles affect guidance behavior.
- [ ] AI can chat without mutation approval.
- [ ] Permanent memory changes require the correct approval path.
- [ ] Uncertain/high-risk actions do not silently execute.
- [ ] Action result is verified before success is reported.

## 4. CRM / Booking / Calendar
- [ ] Create/find client.
- [ ] Duplicate-client safeguards behave correctly.
- [ ] Create service with duration/buffer.
- [ ] Hard conflicts block booking.
- [ ] Soft conflicts request owner judgment.
- [ ] Double booking is blocked at database level.
- [ ] Reschedule/cancel preserves history.

## 5. Messaging
- [ ] Unknown sender becomes a new lead, never name-merged.
- [ ] Routine reply draft uses current business context.
- [ ] Sensitive/complaint message escalates to Needs Attention.
- [ ] Do Not Auto-Message prevents automation but not deliberate owner send.
- [ ] Duplicate send retry does not create duplicate outbound messages.

## 6. Media / Content
- [ ] Import from Photos creates a private AngelOS business copy.
- [ ] Deleting phone original does not break AngelOS media record.
- [ ] Cross-workspace media access fails.
- [ ] Marketing permission is rechecked before publish.
- [ ] Approved scheduled post does not require a second approval unless materially changed.
- [ ] Duplicate publish retry does not create a second post record.

## 7. Analytics / Marketing Coach
- [ ] Missing metrics stay null/unknown.
- [ ] Manual metrics are not labeled provider-synced.
- [ ] Business outcomes outrank vanity metrics in recommendations.
- [ ] Posting-time recommendations expose evidence/confidence.
- [ ] Insufficient-history state says testing/low confidence rather than claiming certainty.

## 8. Finance / Automations
- [ ] Expected price is separate from actual money received.
- [ ] Finance corrections/refunds preserve ledger history.
- [ ] Duplicate payment record is idempotent.
- [ ] Balance reminder never auto-sends without owner confirmation.
- [ ] Delayed automation rechecks current state before execution.
- [ ] Cancelled appointment prevents stale reminder execution.

## 9. Needs Attention / Health
- [ ] Failed operations become deduped owner-facing issues.
- [ ] Acknowledged is not treated as fixed.
- [ ] Fresh healthy evidence resolves stale issues.
- [ ] Pause AI Actions blocks mutations while chat remains available.
- [ ] Pause Automations blocks job execution.

## 10. Subscription / Beta
- [ ] New approved workspace receives correct trial window.
- [ ] Public trial is 14 days when public signup is eventually enabled.
- [ ] Student code applies 20% discount eligibility.
- [ ] Cancellation enters 60-day read-only period.
- [ ] Reactivation restores actions without rebuilding data.
- [ ] Workspace creation cannot bypass invite gate directly through Supabase RPC.
- [ ] Founder revoke does not delete tester data.

## 11. Product analytics / privacy
- [ ] Screen/feature usage is recorded without client/message/private-record IDs.
- [ ] Private feedback is separate from testimonial permission.
- [ ] No session replay or content capture is enabled by default.

## 12. Release blocker rule
TestFlight beta is blocked if any of these remain:
- Critical tenant-isolation/security failure.
- Data-loss path.
- Wrong-client message risk.
- Double booking.
- Duplicate money/send/publish action.
- AI falsely claiming action success.
- Backup/restore path unverified for staging data.
