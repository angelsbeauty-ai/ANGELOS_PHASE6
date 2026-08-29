# Sprint 7 Build Notes

## What changed

Sprint 7 adds the first complete Content OS slice:

- `content_posts` for the shared business idea/objective/status.
- `content_post_media` for ordered media selection without duplicating files.
- `content_variants` for platform-specific copy, format, schedule, and provider status.
- `content_publish_attempts` for backend-controlled idempotency and verification evidence.
- Content API for media review, draft generation, approval, variant edits, scheduling, and publishing.
- AI visual-review path for eligible still images when OpenAI mode is enabled.
- Deterministic media-ranking fallback when vision is unavailable.
- Content mobile list/create/detail screens.
- Context-aware Ask AI from a content post.

## Safety choices

- Unknown/private/treatment-only media is never silently promoted to marketing content.
- Consent/marketing permission is checked both when the draft is created and again at publish time.
- Live providers stop safely until their real transports/capabilities are connected.
- Publish attempts are not directly writable by the mobile client.
- A verified publish uses an idempotency key per platform variant to prevent duplicate sends.

## Current testing limitation

The repository still has no installed npm workspace dependencies in this container, so a clean full typecheck/build cannot run here. Static TypeScript diagnostics were used to check Sprint 7-specific code for errors beyond missing external modules/Expo base config, and `git diff --check` is clean.
