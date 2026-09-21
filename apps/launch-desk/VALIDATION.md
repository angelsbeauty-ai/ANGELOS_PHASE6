# Launch Desk validation checklist

## Agent behavior
- [ ] Complete briefs produce a prioritized plan.
- [ ] P0/P1 priorities and explicit owners are present.
- [ ] A risk register is produced with mitigation thinking.
- [ ] An owner checklist is produced.
- [ ] Internal, email, and social copy are produced.
- [ ] Missing date, constraints, rollback, monitoring, or validation details become focused questions.
- [ ] extract_launch_tasks is called first.
- [ ] The readiness tool flags missing gates.

## Frontend flow
- [ ] User can enter product brief, audience, launch date, constraints, and assets.
- [ ] Build launch plan starts the API request.
- [ ] Tool progress appears while the agent runs.
- [ ] Model text appears progressively.
- [ ] Errors are visible.
- [ ] API key never appears in browser code.

## Tool outputs
- [ ] extract_launch_tasks returns prioritized task objects.
- [ ] check_launch_readiness returns status, score, rubric, and missing gates.
- [ ] generate_owner_checklist groups actions by owner.
- [ ] draft_channel_copy returns internal/email/social copy.

## Verification
- [ ] npm test
- [ ] npm run build
- [ ] Start API with a real OPENAI_API_KEY.
- [ ] Run npm run verify:stream.
- [ ] Verification reports at least one tool_progress and one text_delta event.
- [ ] Open http://localhost:5178 and confirm the same streamed behavior through the UI.
