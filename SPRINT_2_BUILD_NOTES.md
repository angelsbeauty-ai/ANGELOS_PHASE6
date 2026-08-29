# Sprint 2 Build Notes

## Provider boundary

The mobile app never receives an OpenAI API key. `apps/api/src/ai/ai-provider.service.ts` owns provider calls. The default development mode is `mock`; production can use `openai` through environment configuration.

The provider abstraction is intentionally small so AngelOS can route models differently later without changing the mobile app or business modules.

## Action boundary

Sprint 2 intentionally registers only two persistent actions:

- rename the assistant
- approve reusable memory

Both require explicit approval. Later CRM, booking, messaging, content, and finance tools must register through the same action/audit pattern with their own risk rules.

`ai_action_runs` and assistant-authored messages are backend-controlled. Workspace users can read their audit trail but cannot directly forge action success through normal authenticated RLS access.

## Validation performed in this environment

- TypeScript/TSX syntax transpilation check across the repository: passed.
- SQL structural/RLS presence check for Sprint 2 migration: passed.
- Git whitespace/diff check: passed.
- Pure action-planner tests for rename, memory proposal, and no-action messages: passed.

A full dependency install/typecheck could not run in this container because the npm registry is unreachable from the runtime. Run `npm install` and `npm run typecheck` in a normal networked development environment before merging/deploying.

## Known incomplete item

Voice capture/transcription remains the one explicit Sprint 2 device adapter not marked complete. It should use the same composer/action flow after transcription so speaking never auto-sends an action.
