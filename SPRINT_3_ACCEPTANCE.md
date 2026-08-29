# Sprint 3 Acceptance Criteria — CRM + Client Memory

## Client identity
- Authenticated workspace owner can create, list, search, view, and update clients.
- Client records are strictly workspace-scoped with PostgreSQL RLS.
- Create flow checks obvious exact contact duplicates before inserting a second profile.
- One client record can carry lead/client lifecycle status and Do Not Auto-Message state.

## Connected history
- Client detail returns notes, treatment records, consent history, payment-history rows, and follow-up rows as one connected client view.
- Treatment records are appended rather than overwriting prior sessions.
- Notes are typed and timestamped.
- Consent status is stored independently from treatment notes.
- Finance/follow-up tables exist under the client record even though their full automation modules arrive later.

## Mobile CRM
- Client list renders and supports name search.
- Owner can create a basic client without filling unnecessary fields.
- Client detail shows summary, treatment history, notes, consent state, and placeholders for later connected finance/follow-up behavior.
- Owner can add a note and a treatment record from the client screen.

## AI context integration
- Client detail can open the assistant with client context attached.
- Backend verifies workspace authorization before loading client facts.
- AI receives only a bounded client context: basic client state, up to 3 recent treatments, and up to 5 recent notes.
- AI is instructed not to pretend later booking/messaging/content/finance actions are available.

## Tenant isolation
- All CRM tables carry `workspace_id` and are protected by membership RLS.
- Child records use composite foreign keys `(client_id, workspace_id)` so a row cannot be attached to a client from another workspace.
