# Sprint 1 Acceptance Criteria

## Authentication
- User can sign up and sign in from the mobile login screen through Supabase Auth.
- API rejects missing/invalid bearer tokens on protected routes.

## Workspace creation
- Authenticated user can create a workspace through the protected RPC.
- Creator becomes workspace owner automatically.
- Workspace creation validates non-empty name.

## Tenant isolation
- Workspace rows are protected by PostgreSQL RLS.
- User can list only workspaces they belong to.
- Direct unauthenticated workspace access fails.
- No client-supplied workspace membership can bypass RLS.

## App shell
- Home screen renders.
- AI placeholder screen renders.
- Workspace onboarding screen renders and calls the API.

## Health
- `GET /health` returns a healthy API status.

## Environment safety
- Secrets live only in environment variables.
- Service-role key is backend-only.
- Mobile app uses only Supabase anon key and authenticated user JWT.

## Sprint 1 non-goals
- No CRM data model.
- No booking/calendar model.
- No messaging integrations.
- No AI provider calls.
- No media storage.
