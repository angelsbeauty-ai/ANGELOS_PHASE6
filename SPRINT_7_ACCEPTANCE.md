# Sprint 7 Acceptance — Content + Social Marketing Engine

Sprint 7 is accepted when the content workflow is structurally usable without pretending live social-provider publishing is connected.

## Required behavior

- [x] Content posts are workspace-isolated with RLS.
- [x] One content idea can have separate Instagram, Facebook, TikTok, and Manual/Demo variants.
- [x] Content status supports Draft/Prepared/Approved/Scheduled/Publishing/Published/Failed/Archived lifecycle.
- [x] Only uploaded media with valid marketing permission can enter a social post.
- [x] AngelOS can review unused eligible media and return one strongest recommendation.
- [x] Metadata/role ranking provides a deterministic fallback.
- [x] When OpenAI mode is enabled, eligible images can be sent through a bounded AI-vision review before selection.
- [x] If AI vision fails or is unavailable, AngelOS explicitly falls back rather than claiming a visual review happened.
- [x] A before/after pair may be preferred when it belongs to the same client and is eligible.
- [x] Post creation generates one strategy direction, hook, caption, CTA, hashtags, and editing instructions with a safe fallback.
- [x] The owner can edit each platform version independently.
- [x] Content must be explicitly approved before scheduling/publishing.
- [x] Once approved, scheduled content does not require a second approval unless material state changes in later provider validation.
- [x] Marketing permission is re-checked at publish time so withdrawn/restricted media cannot be published from an old approval.
- [x] Publish attempts are backend-controlled and idempotent.
- [x] Duplicate publishing is prevented after a verified success.
- [x] Media usage is recorded and content media becomes `posted` after all active variants publish.
- [x] AI can receive bounded context from the currently open content post.

## Honest provider boundary

- [x] Manual/Demo publishing verifies the publish lifecycle end-to-end.
- [x] Instagram/Facebook/TikTok variants can be prepared and scheduled structurally, but live publishing stops safely until real provider OAuth, capabilities, current platform rules, and publishing adapters are connected.
- [x] No code path reports a live social post as published when only a draft exists.

## Mobile prototype

- [x] Content list screen.
- [x] Create Content flow with goal selection and one recommended media direction.
- [x] Content detail screen with strategy explanation and platform variants.
- [x] Caption/hook/CTA editing.
- [x] Approval action.
- [x] Scheduling action.
- [x] Safe Manual/Demo publish action.
- [x] Ask AI about the current content post.

## Known hardening work before public production

- Background scheduler/queue must execute due scheduled posts without the app being open.
- Provider rule/capability registry must revalidate every live post immediately before publish.
- Real Instagram/Facebook/TikTok OAuth and publishing transports need provider review/scopes and integration tests.
- Video-quality review needs frame extraction or a video-capable analysis path; Sprint 7 AI vision reviews still images only.
- Structured-output schema enforcement should replace JSON-only prompting once the production AI response schema is finalized.
