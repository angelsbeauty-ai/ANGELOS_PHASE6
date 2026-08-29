# Sprint 5 Acceptance — Unified Messaging + AI Receptionist

## Goal
Create the provider-neutral unified inbox foundation AngelOS needs before live Instagram/Facebook/LINE/TikTok adapters are connected.

## Included
- Workspace-isolated messaging channels and capability/status records.
- Unified message threads with priority, intent, status, and Needs Owner state.
- Channel identity matching to CRM clients.
- Previously unseen channel identities create a **new CRM lead**; AngelOS never merges people by similar display name.
- Inbound/outbound message history attached to the correct workspace/thread/client.
- AI receptionist draft generation using bounded client/thread context.
- Drafts are approval-aware under Guided Autonomy.
- Owner-authored replies and explicit owner approval can send through the current transport.
- `Do Not Auto-Message` blocks autonomous AI sending but does not block an owner from deliberately sending a reviewed reply.
- Translation preserves the original message and stores translation as a display layer.
- Private internal notes are stored separately and are never client-visible.
- Booking/reschedule threads carry subtle context into Calendar.
- Sensitive/complaint messages escalate to Needs Owner.
- Basic suspected-phishing detection quarantines the thread as spam/scam; AngelOS does not open/follow links.
- Send attempts use an idempotency key and backend-only delivery evidence.
- Duplicate send requests return verified prior success rather than sending twice.
- Mobile screens: unified inbox and conversation detail.
- Safe Manual/Demo transport for end-to-end testing.

## Explicitly not claimed complete
- Live Meta/Instagram/Facebook OAuth, webhooks, and outbound API delivery.
- Live LINE OAuth/webhooks/delivery.
- Live TikTok messaging integration (must remain capability-dependent).
- Rich native interactive message cards.
- Automatic routine-message send rules across live providers.

Those providers plug into `MessagingProviderAdapter`; the inbox/CRM/safety model does not need to be rebuilt.

## Acceptance flow
1. Authenticated owner opens Messages.
2. Owner creates a demo availability inquiry.
3. AngelOS creates a new CRM lead for the unseen channel identity instead of guessing a match.
4. Thread is classified as booking-related and appears in the unified inbox.
5. Owner opens the thread and can translate the inbound message.
6. AngelOS produces one AI receptionist draft without inventing availability.
7. Owner can open Calendar with the active inquiry context carried forward.
8. Owner explicitly approves the AI draft or writes an edited owner reply.
9. Demo transport sends once; a repeated send attempt is duplicate-protected.
10. Thread moves to Waiting Client after verified send.
11. Private internal notes remain separate from client-visible messages.

## Safety checks
- All messaging tables use workspace RLS.
- Normal users cannot forge provider send-attempt evidence.
- AI/inbound message writes and delivery-state updates are backend-controlled.
- Unknown identity creates a new lead; similar name alone never merges records.
- Sensitive/complaint/phishing-like content is not auto-sent or silently handled.
- Live provider delivery is refused until a verified adapter exists.
