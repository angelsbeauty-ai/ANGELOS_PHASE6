# Sprint 12 Acceptance — Invite-Only Beta + Launch Gate

Sprint 12 is accepted when the private-beta boundary is real, feedback is privacy-safe, and launch readiness can be reviewed without automatically making AngelOS public.

## Invite-only access

- [x] Authentication can exist before beta approval, but workspace creation is blocked until the user has a Founder-approved beta invite.
- [x] Workspace creation is gated twice: in the NestJS service and inside the Supabase `create_workspace_with_owner` function so the API cannot be bypassed by calling the RPC directly.
- [x] Beta invite tokens are stored only as SHA-256 hashes.
- [x] Invite redemption is atomic and one-time at the database level.
- [x] Optional email binding prevents a token approved for one address from being used by another account.
- [x] Invites can be revoked before redemption.
- [x] Redeemed tester access can be revoked later without deleting business data.
- [x] Revoked beta workspaces become protected/read-only rather than destructively deleted.
- [x] Founder accounts can bypass the private-beta invite gate through trusted Founder authorization.

## Beta cohorts and test windows

- [x] Cohorts support Angels Beauty, students, outside businesses, and partners.
- [x] Public launch pricing/trial remains unchanged.
- [x] Student beta testers receive up to a 30-day trial window for testing.
- [x] Outside/partner beta testers receive up to a 60-day trial window for testing.
- [x] Extended beta windows start when the business workspace is created, not when the invite is generated.

## Beta feedback

- [x] Testers can submit bug, friction, idea, success, support, or testimonial-candidate feedback.
- [x] Private feedback is separate from testimonial permission.
- [x] Public quote permission is explicit and defaults to false.
- [x] Contact permission is explicit and defaults to false.
- [x] Founder Admin can review intentionally submitted feedback without exposing unrelated subscriber client/business content.

## Founder beta controls

- [x] Founder can create a private invite with cohort, optional approved email, tester/business label, region, and expiry.
- [x] Founder can revoke an unused invite.
- [x] Founder can revoke active beta access without deleting workspace data.
- [x] Founder sees approved tester counts, outside-business counts, 7/30-day activity, feedback counts, quote-approved testimonial candidates, and open urgent issues.

## Launch gate

- [x] Launch criteria include outside-business coverage, outside-business activity, unresolved urgent issues, testimonial candidates, and beta rating quality.
- [x] Sparse data does not falsely pass readiness checks.
- [x] A green scorecard only produces `ready_for_founder_review`.
- [x] Public signup remains disabled unless a separate explicit Founder-controlled production release action occurs.
- [x] No launch metric can auto-enable public signup.

## Privacy and security

- [x] Beta tables are RLS-enabled and do not expose direct subscriber mutation policies.
- [x] Beta tokens are never stored in plaintext after creation.
- [x] Product usage analytics remain aggregate/behavioral and do not include client names, message content, notes, finances, or private AI chat content.
- [x] Revoked testers may still submit beta feedback so product problems can be reported.
- [x] Workspace tenant isolation from earlier sprints remains intact.

## V1 boundary

Sprint 12 does not pretend the following production dependencies are complete:

- real payment processing/webhooks;
- real Instagram/Facebook/LINE/TikTok OAuth, webhooks, publishing, messaging, and verified analytics adapters;
- production device voice recording/transcription adapter;
- resumable/streaming large-video upload path;
- real push-notification credentials/delivery;
- final legal retention/deletion implementation;
- TestFlight/App Store distribution and production infrastructure credentials;
- full networked dependency install/typecheck/end-to-end device testing.

Those are production-hardening/deployment tasks after the V1 feature sprints, not hidden as “finished” in Sprint 12.
