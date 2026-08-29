# AngelOS Staging Founder + Tenant Isolation Test

Do this only after the staging API is deployed.

## 1. Angel staging identity

1. Use the AngelOS staging mobile build/login screen to create or sign into Angel's deliberate staging account.
2. Read the exact staging Supabase Auth UUID.
3. Add that UUID to Railway `FOUNDER_USER_IDS`.
4. Run `scripts/founder-bootstrap.sql.example` with that exact UUID against STAGING only.
5. Restart/redeploy the API after environment changes.

The UUID, not email/user metadata, is the authorization identity.

## 2. Founder workspace

Create **Angels Beauty Workspace** through the app/API. The database function permits the Founder identity even while public signup is off.

Verify the automatic workspace defaults exist:

- AI assistant profile + six roles
- workspace subscription/trial
- operational controls
- business workspace membership

## 3. Second tester

Create a separate staging Auth identity. Do not make it Founder.

For private beta, redeem a Founder-created beta invite before it creates a workspace. Create a separate test business workspace.

## 4. Required isolation assertions

Using both users' real access tokens, run `npm run test:staging` with the staging smoke environment.

The test must prove:

- user A can see A's workspace through API and direct Supabase RLS
- user B can see B's workspace through API and direct Supabase RLS
- user A cannot see B's workspace/client records
- user B cannot see A's workspace/client records
- storage paths remain workspace-isolated
- Founder Admin does not expose subscriber private notes/messages/finances as ordinary product analytics

Any cross-tenant visibility is a release blocker.
