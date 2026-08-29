# Production Hardening Phase 4 — Staging API Deployment Handoff

## Completed in this phase

- Re-opened the existing Phase 3 archive as the source of truth; no earlier work was rebuilt.
- Re-verified the connected live staging Supabase project: `hhzegavoyuicclsmrkwf`.
- Confirmed the database is PostgreSQL 17.6 and the application schema remains present.
- Confirmed staging currently has zero Auth users; no identity was fabricated.
- Confirmed there is no connected Railway/deployment app available in this ChatGPT session.
- Updated mobile/API Supabase client configuration to prefer modern publishable keys while preserving legacy anon-key fallback.
- Added a server deployment-environment verifier.
- Added a deliberate Founder bootstrap SQL template that requires a real staging `auth.users` UUID.
- Added the Railway staging variable checklist and two-tenant acceptance sequence.
- Verified Supabase can generate TypeScript types from the live staging schema, proving the Data API schema is introspectable. Generated types should be committed in the first fully networked engineering checkout using the supported CLI/tooling, not copied manually from chat output.

## External boundary reached

A real API deployment cannot be completed from this session because there is no connected Railway/hosting deployment tool and server secrets must not be invented or exposed:

- staging `SUPABASE_SERVICE_ROLE_KEY`
- server-only `OPENAI_API_KEY`
- hosting account/project authorization

The project is prepared so these are the only meaningful deployment inputs rather than code-design decisions.

## Next executable acceptance gate

After the API is deployed and Angel deliberately creates a staging Auth identity:

1. bind the Founder UUID,
2. create Angels Beauty Workspace,
3. create a second invited tester,
4. run authenticated two-tenant smoke/RLS tests,
5. configure EAS staging public values,
6. build/install the staging iOS app.
