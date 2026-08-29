# Sprint 12 Build Notes

## What was added

Sprint 12 closes the V1 feature roadmap with a real invite-only beta gate and Founder launch review loop.

### Backend/database

- `beta_invites` with hashed one-time tokens, cohort, optional email binding, label/region, expiry, redemption, and revocation.
- `beta_testers` with Founder approval, cohort, workspace attachment, and revocation.
- `beta_feedback` with explicit contact/quote permissions.
- `platform_release_state`, defaulting to `invite_only_beta` and `public_signup_enabled = false`.
- Atomic `redeem_beta_invite` database function with row locking to prevent double redemption races.
- Database-level invite check inside `create_workspace_with_owner`, preventing direct Supabase RPC bypass.
- Database-level V1 one-workspace check.
- Extended beta test windows: 30 days for student testers, 60 days for outside/partner testers.
- Backend Beta Access guard blocks mutations for revoked/unapproved workspaces while preserving read access.

### Mobile

- Onboarding now checks beta access before workspace creation and accepts a private invite token.
- Founder Admin can create/revoke beta invites and revoke redeemed tester access.
- Founder Admin shows a launch-readiness scorecard and private feedback summary.
- Beta Feedback screen separates ordinary private feedback from explicit testimonial quote permission.

## Launch-readiness philosophy

The scorecard is advisory. It deliberately cannot make AngelOS public. The Founder must still review real-world behavior, support load, security, platform health, and tester feedback before public launch.

## Production work after Sprint 12

The 12 feature sprints produce the V1 application foundation, but a production beta still requires infrastructure/provider hardening. Highest priority:

1. Run migrations against a real Staging Supabase project and seed the Founder account.
2. Install dependencies in a networked environment and run full API/mobile typechecks/builds.
3. Add automated API/database integration tests for auth, RLS, booking conflicts, idempotency, subscriptions, and beta gating.
4. Connect real social platform adapters one provider at a time, starting with verified scopes/capabilities.
5. Connect a real subscription payment provider and signed webhooks.
6. Add production push notifications.
7. Add Expo device voice recording/transcription and permission UX.
8. Replace memory-buffer large-video upload with resumable/streaming upload.
9. Configure Staging/Production secrets, backups, monitoring, domains, EAS builds, and TestFlight.
10. Run the Angels Beauty internal pilot before inviting external testers.
