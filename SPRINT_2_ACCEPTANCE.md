# Sprint 2 Acceptance Criteria — AI Core

## Assistant profile and roles
- Every workspace receives a default AI assistant profile and six enabled AI role records.
- Owner can change assistant name, personality prompt, proactivity, floating button mode, and guidance/explanation preferences.
- Owner can independently enable/disable Personal Assistant, Social Media Marketer, Content Creator, Business Manager, Business Advisor, and Consultant roles.
- All assistant settings are workspace-isolated with PostgreSQL RLS.

## Conversation core
- Authenticated owner can create a workspace-scoped AI conversation.
- Text messages persist in a workspace-scoped conversation history.
- Backend builds AI instructions from assistant profile, enabled roles, approved memory, workspace identity, and current-screen context.
- OpenAI is called only from the backend when `AI_PROVIDER_MODE=openai`; mobile never receives the API key.
- Development can run with `AI_PROVIDER_MODE=mock` so the app remains testable without paid provider calls.

## Guided-assistant behavior
- Prompt contract instructs AngelOS to identify the real goal, give one strongest recommendation, explain why when useful, and ask one focused next-step question when needed.
- Prompt contract reduces cognitive load when the owner sounds overwhelmed.
- AI explicitly avoids pretending that later CRM/booking/content tools are already connected.

## Memory
- Durable AI memory is separate from chat history.
- Only `approved` memory is injected as reusable business knowledge.
- Chat text is never silently promoted into permanent memory.
- “Remember that …” creates an approval-required action before durable memory is written.

## Safe action layer
- Sprint 2 registers only narrow assistant actions: rename assistant and approve reusable memory.
- Proposed actions are written to `ai_action_runs` with risk level and status.
- Permanent mutation happens only after explicit approval.
- Action success is verified with a fresh read before status becomes `succeeded`.
- Failed actions are recorded as failed rather than reported as successful.

## Context awareness
- AI messages can include current-screen/entity context.
- Context remains workspace-authorized and does not imply unrestricted data access.
- Later CRM/booking/content tools can register their own context/action adapters without rewriting the AI core.

## Mobile experience
- AI screen supports real text conversation through the backend.
- Approval card appears for a proposed persistent action.
- AI Settings screen exposes assistant profile, roles, proactivity, and floating-button preferences.

## Remaining Sprint 2 device adapter
- Voice capture/transcription is intentionally not marked complete in this package yet. The text/action/memory contract is ready for the same input path, but device recording should be added and tested against the target Expo SDK before Sprint 2 is declared fully complete.
