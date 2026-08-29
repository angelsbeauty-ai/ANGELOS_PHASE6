# Sprint 11 Acceptance — Subscription + Founder Admin

Sprint 11 is accepted when the subscription lifecycle, founder controls, and privacy-safe product analytics exist as real backend-controlled behavior rather than UI-only labels.

## Subscription lifecycle

- Every new workspace automatically receives the `solo` plan and a 14-day trial.
- Public plan pricing is stored centrally as USD $49/month or $490/year.
- Trial expiry blocks business-changing writes and moves the workspace toward read-only access.
- Cancellation switches the workspace to a 60-day read-only state.
- Read-only/expired workspaces cannot create bookings, send AI mutations, publish content, run automations, or change business records.
- Subscription/System Health routes remain reachable so the owner can understand access and reactivate.
- Production card charging is **not** claimed until a real billing provider is connected.
- Development-only demo activation is gated by `BILLING_DEMO_MODE=true` and is rejected in production.

## Student discount

- Founder can generate a private, high-entropy, one-time student token.
- Only the SHA-256 hash is stored; the raw token is returned once to the founder.
- Default verified Angels Beauty student/alumni discount is 20%.
- Optional email binding prevents redemption by a different account.
- A redeemed token cannot be reused.
- The discount is attached to the workspace subscription and persists until program terms are intentionally changed later.

## Founder Admin

- Founder access is backend-enforced by `platform_founders` or the bootstrap `FOUNDER_USER_IDS` environment setting.
- Normal subscribers cannot open Founder Admin APIs.
- Founder overview exposes platform operations: workspace counts, subscription states, open attention counts, privacy-safe usage trends, and feature controls.
- It does **not** expose subscriber client names, messages, notes, finances, AI chat content, or private business strategy.
- Founder can pause/re-enable controlled capabilities using feature flags.
- Feature flags are wired to real risky action paths for AI mutations, messaging sends, content publishing, automation execution, and Marketing Coach generation.

## Product usage analytics

- AngelOS can record screen views, screen duration, feature use, workflow lifecycle, and generic tap/action keys.
- Product analytics are best-effort and can never interrupt normal business work.
- Dynamic record UUIDs are normalized to `:id` before storage so Founder Insights does not reveal which client/message/content record was opened.
- The event schema has no field for message content, client names, notes, finance values, or AI conversation text.

## V1 workspace limit

- V1 allows one main business workspace per subscriber account.
- The data model remains multi-workspace-ready for a future release.

## Acceptance scenario

1. New subscriber creates a workspace.
2. The workspace receives a 14-day `trialing` subscription automatically.
3. Subscriber can use normal write workflows during trial.
4. Founder creates a private 20% student token; verified student redeems it once.
5. Subscription pricing reflects the discount without creating a separate public student plan.
6. Subscriber cancels; workspace becomes read-only for 60 days and mutations are rejected.
7. Founder Admin shows the workspace as read-only and can see aggregate usage/health, but cannot browse private business content.
8. Founder pauses `content_publishing`; publish actions fail safely while CRM, Calendar, and other unrelated features remain usable.

## Explicitly not complete yet

- Real payment-provider checkout/webhooks/card charging.
- App Store / Play Store in-app-purchase policy implementation if required for the final distribution model.
- Automatic destructive data deletion at day 60; Sprint 11 marks access expiry, while the final legal retention/deletion worker must follow the launch privacy policy.
- Advanced AI/storage usage metering and paid overage tiers.
- Public beta applications; first beta remains invite-only and is Sprint 12.
