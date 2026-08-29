# AngelOS V1 — Sprint 1–12 Working Build

This repository contains the current AngelOS V1 feature implementation through Sprint 12.

## Sprint 1 — Foundation

- Mobile shell: Expo + React Native + TypeScript
- Backend shell: NestJS + TypeScript
- Supabase Auth/Postgres integration boundaries
- Workspace creation and strict tenant-isolation foundation
- Development / Staging / Production environment pattern
- Home and AI Assistant shell
- Backend health endpoint
- Error logging hooks

## Sprint 2 — AI Core

- Workspace-specific assistant profile
- Six AI role toggles
- Proactivity and floating-AI preferences
- Persistent workspace-scoped conversations/messages
- Approved-memory layer separate from chat history
- AngelOS operating/communication contract
- OpenAI Responses API backend adapter plus local mock mode
- Current-screen context channel
- Approval-required action proposals
- Backend-controlled action audit records
- Fresh-read verification before an action can become `succeeded`
- AI Settings mobile screen
- Real text chat mobile screen with approval cards

## Sprint 3 — CRM + Client Memory

- Workspace-isolated client profiles
- Client lifecycle status and Do Not Auto-Message flag
- Notes and treatment history
- Consent history
- Payment/follow-up history tables ready for later modules
- Mobile client list, create-client, and client-detail screens
- Context-aware `Ask AI` from a client record
- Bounded authorized CRM context injected into the AI prompt

## Sprint 4 — Booking + Calendar

- Workspace services with duration, buffers, and price snapshots
- Internal AngelOS calendar (Google Calendar remains optional)
- Business-hours configuration
- Hard vs soft conflict handling
- Database-level overlap protection for active appointments
- Appointment create/confirm/reschedule/cancel/complete lifecycle
- Append-only appointment event history
- Mobile Calendar, Services, and New Booking prototype flow

## Intentionally NOT connected yet

The V1 feature foundations are present, but production provider work is still explicit: live Meta/LINE/TikTok OAuth and webhooks, verified social publishing/messaging/analytics adapters, real subscription payment processing, production push delivery, and App Store/TestFlight infrastructure are not falsely marked complete.

Voice is part of the product contract, but device recording/transcription is not falsely marked complete in this package. The text/action/memory path is ready; the Expo recording adapter still needs target-SDK integration testing. Large public video uploads also need a resumable/streaming production path.

## Project layout

- `apps/mobile` — AngelOS iOS/iPad/Android client
- `apps/api` — AngelOS backend/API
- `packages/shared` — shared types/contracts
- `supabase/migrations` — database schema + RLS foundation
- `SPRINT_1_ACCEPTANCE.md` — Foundation acceptance criteria
- `SPRINT_2_ACCEPTANCE.md` — AI Core acceptance criteria
- `SPRINT_3_ACCEPTANCE.md` — CRM acceptance criteria
- `SPRINT_4_ACCEPTANCE.md` — Booking + Calendar acceptance criteria
- `SPRINT_5_ACCEPTANCE.md` — Messaging acceptance criteria
- `SPRINT_6_ACCEPTANCE.md` — Media Library acceptance criteria
- `SPRINT_7_ACCEPTANCE.md` — Content acceptance criteria
- `SPRINT_8_ACCEPTANCE.md` — Analytics + Marketing Coach acceptance criteria
- `SPRINT_9_ACCEPTANCE.md` — Finance + Automations acceptance criteria
- `SPRINT_10_ACCEPTANCE.md` — Needs Attention + System Health acceptance criteria
- `SPRINT_11_ACCEPTANCE.md` — Subscription + Founder Admin acceptance criteria
- `SPRINT_12_ACCEPTANCE.md` — Invite-Only Beta + Launch Gate acceptance criteria

## Local setup

1. Copy each `.env.example` to `.env`.
2. Configure a Supabase project.
3. Apply migrations in order from `supabase/migrations`.
4. Install dependencies with your package manager.
5. Start the API and mobile app.
6. Keep `AI_PROVIDER_MODE=mock` for zero-cost local UI testing, or set `AI_PROVIDER_MODE=openai` plus `OPENAI_API_KEY` for real model responses.

## Current acceptance goal

A Founder-approved beta user can authenticate, redeem a private invite, create an isolated workspace, configure AngelOS, manage clients/bookings/messages/media/content/analytics/finance/automations, receive Needs Attention/System Health guidance, and submit private beta feedback. Founder Admin can control beta access and review launch readiness without exposing unrelated subscriber private business data.

## Sprint 5 — Unified Messaging + AI Receptionist

Added the provider-neutral smart inbox foundation: message channels, CRM identity matching/new-lead creation, intent/priority classification, AI drafts, translation, private internal notes, booking-context handoff to Calendar, Needs Owner escalation, phishing-safe handling, backend-controlled send evidence, and idempotent delivery. A Manual/Demo adapter supports honest end-to-end testing; live Meta/LINE/TikTok transports are intentionally not claimed until their verified OAuth/webhook adapters are connected.

## Sprint 6 — Media Library

Phone-first media is now scaffolded: device Photos/Camera can import into a private AngelOS-managed storage bucket, assets are workspace-isolated, client/appointment/treatment links are represented without duplicating files, marketing permission/content status travel with the asset, and signed view/export URLs are backend-controlled. Google Drive is optional rather than required. See `SPRINT_6_ACCEPTANCE.md`.

## Sprint 7 — Content + Social Marketing Engine

Added the first Content OS slice: workspace-scoped content posts, platform-specific variants, media eligibility checks, one strongest media recommendation, bounded AI visual review for eligible still images with deterministic fallback, AI-generated strategy/caption/hook/CTA/editing guidance, owner approval, scheduling, backend-controlled idempotent publish attempts, publish-time consent rechecks, and content-aware AI context. Manual/Demo publishing verifies the lifecycle honestly; live Instagram/Facebook/TikTok transport remains intentionally blocked until real provider connections and capability checks exist. See `SPRINT_7_ACCEPTANCE.md`.


## Sprint 8 — Analytics + AI Marketing Coach

Added workspace-scoped analytics snapshots, audience-activity evidence, a marketing profile, simple mobile Analytics UI, posting-time recommendations with explicit confidence, business-outcome-first content ranking, and an AI Marketing Coach that gives one strongest next action from bounded evidence. Missing metrics remain null, manual entries cannot masquerade as provider sync, and sparse history returns a test-and-learn recommendation rather than a fake universal best time. Live social analytics/local-event research remain explicit future provider adapters. See `SPRINT_8_ACCEPTANCE.md`.

## Sprint 9 — Finance + Automations

Finance now tracks ledger history with actual-received income, refunds/discounts/corrections, appointment summaries, retry-safe idempotency, and the hard rule that a calculated balance never auto-messages a client without owner confirmation.

Automations now have workspace-scoped rules/jobs, disabled-by-default starter workflows, appointment-event enqueueing, cancellation cleanup, state re-checks before delayed work, structured follow-up creation, owner escalation, and duplicate-safe job keys. Live routine client-message automation remains safely blocked until verified provider transports/templates are connected.

See `SPRINT_9_ACCEPTANCE.md` and `SPRINT_9_BUILD_NOTES.md`.


## Sprint 10 — Needs Attention + System Health

Added the owner-facing health/attention layer: capability-level health records, Urgent/Today/Later attention, acknowledgement without fake resolution, fresh-evidence auto-resolution, media-storage verification, AI configuration status, messaging/publishing/automation failure detection, overdue-job detection, and owner-work signals for conversations/automations/upcoming unconfirmed bookings.

Emergency controls are now functional: Pause AI Actions blocks AI mutations while chat remains available; Pause Automations blocks due-job execution; Emergency Read-only is enforced by a backend guard for normal workspace-changing requests while diagnostics/recovery remain reachable. Message and publish attempts were also hardened so a failed operation can reuse its existing idempotency record for a safe controlled retry.

See `SPRINT_10_ACCEPTANCE.md` and `SPRINT_10_BUILD_NOTES.md`.

## Sprint 11 — Subscription + Founder Admin

Sprint 11 adds the V1 subscription/access-control foundation and platform founder controls:

- 14-day Solo trial seeded automatically for each workspace.
- Working plan configuration: **$49/month or $490/year**.
- Verified Angels Beauty student/alumni 20% discount through private one-time tokens.
- 60-day read-only period after cancellation.
- Global mutation guard when a workspace is read-only/expired.
- Provider-ready billing boundary without pretending card charging is connected.
- Founder Admin with workspace/subscription/health counts, feature flags, and privacy-safe product usage analytics.
- Founder-only backend authorization.
- Platform feature switches that can pause AI mutations, messaging sends, content publishing, automation execution, or Marketing Coach generation without shutting down unrelated modules.
- Route-level usage analytics for screen visits/time with record identifiers stripped before storage.
- V1 one-main-workspace limit, while preserving a multi-workspace-ready schema for later.

See `SPRINT_11_ACCEPTANCE.md` and `SPRINT_11_BUILD_NOTES.md` for the exact boundary and known production work still required.


## Sprint 12 — Invite-Only Beta + Launch Gate

Sprint 12 completes the V1 feature roadmap with a real private-beta boundary: Founder-approved one-time invites, atomic redemption, database-level workspace-creation gating, beta cohorts, extended test windows, revocable tester access, private feedback with separate testimonial permission, and a Founder launch-readiness scorecard. Public signup remains off and cannot be enabled automatically by metrics.

The V1 feature sprints are now complete. Remaining work is production hardening and deployment: verified social-provider adapters, payment processing/webhooks, device voice, resumable large-video uploads, push delivery, full networked builds/tests, staging/production infrastructure, TestFlight/App Store setup, and the real Angels Beauty/internal beta run.

See `SPRINT_12_ACCEPTANCE.md` and `SPRINT_12_BUILD_NOTES.md`.

## Production Hardening — Phase 1

After the 12 V1 feature sprints, AngelOS now has the first staging-readiness layer: fail-fast production environment validation, restricted production CORS configuration, graceful backend shutdown, separate liveness/readiness probes, a non-root API Docker image, Railway deployment config, Expo EAS build profiles, separate Dev/Staging/Production mobile app identifiers, explicit React Native Supabase session persistence, CI checks, migration-order verification, and a staging acceptance matrix.

See `PRODUCTION_HARDENING_PHASE_1.md` and `STAGING_ACCEPTANCE_MATRIX.md`.

## Production hardening Phase 2
Staging verification is now scripted. See `PRODUCTION_HARDENING_PHASE_2.md`, `STAGING_RUNBOOK.md`, and `STAGING_ACCEPTANCE_MATRIX.md`.

Key commands once a real staging environment exists:

```bash
npm run verify:static
npm run typecheck
npm run build:api
npm run test:staging
```

The `angelos-staging-verification` GitHub workflow runs the same gate using staging-only test accounts. No production customer data should ever be used for these tests.

## Live staging

See [`LIVE_STAGING_STATUS.md`](./LIVE_STAGING_STATUS.md) for the current connected staging database status, advisor findings, and migration-history caveat.


## Production hardening Phase 4

Staging API deployment handoff is prepared. Supabase client configuration now prefers publishable keys; Railway/server secret requirements, deliberate Founder bootstrap, and the live two-tenant acceptance sequence are documented. A real host deployment remains blocked only by external hosting authorization and server-only secrets; no credentials are fabricated or committed. See `PRODUCTION_HARDENING_PHASE_4_STAGING_DEPLOYMENT.md`.

## Production hardening Phase 5

The live staging database is ready. Phase 5 adds the first real acceptance gate around API deployment and Founder bootstrap without storing server secrets in the repo. After the founder deliberately creates/signs into a staging Auth account, run `npm run bootstrap:founder` from a trusted server environment, then `npm run verify:founder`. Full details are in `PRODUCTION_HARDENING_PHASE_5_LIVE_ACCEPTANCE.md`.

## Production hardening phase 10

The next networked-machine gate is now one command:

```bash
npm run prepare:networked-release
```

It upgrades Expo to SDK 57 using Expo tooling, requires a generated lockfile, performs a clean `npm ci`, and runs the full AngelOS build/typecheck/Expo verification sequence. It fails before package changes when npm is unavailable.
