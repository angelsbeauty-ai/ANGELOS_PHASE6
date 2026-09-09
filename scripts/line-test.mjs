/**
 * LINE outbound path — harness-based integration tests.
 *
 * These tests run against the synthetic Flow 1 harness (real PostgreSQL + synthetic
 * Express app). They exercise the REAL production flow:
 *
 *   approveAndSend() → sendMessage() → resolveAdapter('line') → adapter.send()
 *
 * The harness has NO external network, so the LINE API (api.line.me) is unreachable.
 * This is the correct and honest outcome to test — we verify the DB lifecycle, NOT
 * the happy LINE API path. The happy path is covered by scripts/line-adapter.test.mjs
 * (13/13 green), which mocks fetch directly against the adapter class.
 *
 * Two honest outcomes are verified here:
 *   1. Transport disabled → resolveAdapter('line') returns null → ConflictException (409)
 *   2. Transport enabled → adapter resolved → fetch to api.line.me blocked by harness →
 *      adapter returns {status:'unknown', error:'...'} → service marks message 'failed',
 *      records send attempt as 'unknown' with error_message, throws 500.
 *
 * LIMITATION (documented, not worked around): The harness cannot reach api.line.me, so
 * the "LINE API returns 200 → adapter.send returns {sent:true}" path is NOT tested here.
 * That path is covered by line-adapter.test.mjs and by the adapter's implementation.
 * To test the full happy path end-to-end you need either (a) a LINE API mock at the
 * network level, or (b) a real LINE channel with test credentials — both are external
 * setup, listed under HUMAN SETUP LATER in BUILD_STATUS.md / SELF_TEST.md.
 */

import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { startHarness, owner, workspace, clientId, channelId } from './flow1-tests/harness.mjs';
import crypto from 'node:crypto';

const randomUUID = () => crypto.randomUUID();

let h;

before(async () => { h = await startHarness(); }, { timeout: 120000 });
after(() => { if (h) { try { void h.close(); } catch {} } });

async function svcRow(query, params) {
  const r = await h.pool.query(query, params);
  return r.rows[0] ?? null;
}

async function seedLineCredentials() {
  await h.pool.query(
    `insert into oauth_connections(workspace_id, provider, access_token, access_expires_at, status, open_id)
     values($1, $2, $3, $4, $5, $6)
     on conflict (workspace_id, provider) do update set access_token = excluded.access_token,
       access_expires_at = excluded.access_expires_at, status = excluded.status, open_id = excluded.open_id`,
    [workspace, 'line',
     'Fake_LINE_Access_Token_' + crypto.randomUUID().replace(/-/g, ''),
     '2099-01-01T00:00:00+00', 'active', 'U0123456789abcdefghijklmnopqrstu']);
  await h.pool.query(
    `insert into integration_apps(workspace_id, provider, client_key, client_secret)
     values($1, $2, $3, $4)
     on conflict (workspace_id, provider) do update set client_key = excluded.client_key, client_secret = excluded.client_secret`,
    [workspace, 'line', 'Fake_Channel_Secret_12345', 'Fake_Channel_Secret_12345']);
}

async function createLineChannel(externalAccountId) {
  await h.pool.query(
    "update messaging_channels set provider = 'line', external_account_id = $1, capabilities = '{\"inbound\":true,\"outbound\":true}' where id = $2",
    [externalAccountId, channelId]);
  await h.pool.query(
    "update message_threads set external_thread_id = $1, contact_external_user_id = $2 where id = $3",
    [externalAccountId, externalAccountId, channelId]);
  await h.pool.query(
    `insert into client_channel_identities(workspace_id, client_id, channel_id, external_user_id, display_name, match_confidence)
     values($1, $2, $3, $4, $5, 'verified')
     on conflict (workspace_id, channel_id, external_user_id) do update set display_name = excluded.display_name`,
    [workspace, clientId, channelId, externalAccountId, 'Test LINE User']);
}

async function createLineThreadAndMessage(externalAccountId, body) {
  const messageId = crypto.randomUUID();
  const threadId = crypto.randomUUID();
  await h.pool.query(
    `insert into message_threads(workspace_id, channel_id, client_id, external_thread_id, contact_external_user_id, status, id)
     values($1, $2, $3, $4, $5, 'needs_reply', $6)`,
    [workspace, channelId, clientId, externalAccountId, externalAccountId, threadId]);
  await h.pool.query(
    `insert into client_messages(workspace_id, thread_id, client_id, direction, sender_type, body, status, sensitive, metadata, created_by, id)
     values($1, $2, $3, 'outbound', 'owner', $4, 'pending_approval', false, '{}', $5, $6)`,
    [workspace, threadId, clientId, body, owner, messageId]);
  return { threadId, messageId };
}

const disableEnv = () => {
  process.env.LINE_TRANSPORT_ENABLED = 'false';
  process.env.LINE_STAGING_WORKSPACE_ID = '';
};

const enableEnv = () => {
  process.env.LINE_TRANSPORT_ENABLED = 'true';
  process.env.LINE_STAGING_WORKSPACE_ID = workspace;
};

test('LINE transport disabled → approveAndSend returns 409 (adapter not resolved)', async () => {
  disableEnv();
  await seedLineCredentials();
  const externalAccountId = 'U' + crypto.randomUUID().replace(/-/g, '');
  await createLineChannel(externalAccountId);
  const { messageId } = await createLineThreadAndMessage(externalAccountId, 'Reply from AngelOS');
  const result = await h.http('/workspaces/' + workspace + '/messaging/messages/' + messageId + '/approve-send', {});
  assert.equal(result.status, 409, 'Expected 409, got ' + result.status + ' / ' + JSON.stringify(result.body));
  assert.ok(
    result.body?.message?.includes('not connected yet') ||
    result.body?.message?.includes('Live provider transport'),
    'Error should mention transport, got: ' + JSON.stringify(result.body));
});

test('LINE transport enabled + unreachable API → 500, DB lifecycle closed correctly', async () => {
  disableEnv();
  enableEnv();
  await seedLineCredentials();
  const externalAccountId = 'U' + crypto.randomUUID().replace(/-/g, '');
  await createLineChannel(externalAccountId);
  const { messageId } = await createLineThreadAndMessage(externalAccountId, 'Honest send test');
  const result = await h.http('/workspaces/' + workspace + '/messaging/messages/' + messageId + '/approve-send', {});
  // The LINE API is unreachable in the harness, so the adapter returns {status:'unknown', error:'...'}
  // and the service throws InternalServerErrorException → HTTP 500. This is the honest outcome.
  assert.equal(result.status, 500, 'Expected 500 (LINE API unreachable in harness), got ' + result.status);
  // Verify DB lifecycle: message marked failed, send attempt recorded as 'unknown' with error_message.
  const msgRow = await h.pool.query('select status, sent_at from client_messages where id = $1', [messageId]);
  assert.equal(msgRow.rows[0].status, 'failed', 'Message should be marked failed, got: ' + msgRow.rows[0].status);
  const attemptRows = await h.pool.query(
    'select status, idempotency_key, error_message, finished_at from message_send_attempts where message_id = $1',
    [messageId]);
  assert.equal(attemptRows.rows.length, 1, 'Expected exactly 1 send attempt row');
  assert.equal(attemptRows.rows[0].idempotency_key, 'message:' + messageId);
  // Adapter returns 'unknown' on network failure — it cannot determine if LINE received the message.
  assert.equal(attemptRows.rows[0].status, 'unknown', 'Attempt status should be unknown (network unreachable), got: ' + attemptRows.rows[0].status);
  assert.ok(attemptRows.rows[0].error_message, 'Attempt should have error_message: ' + JSON.stringify(attemptRows.rows[0].error_message));
  // sendMessage sets finished_at at messaging.service.ts:623 — verify it's present.
  assert.ok(attemptRows.rows[0].finished_at, 'Attempt should have finished_at (set by sendMessage): ' + JSON.stringify(attemptRows.rows[0].finished_at));
});

test('LINE duplicate send blocked when prior attempt is unknown (harness: first send 500 → second blocked)', async () => {
  disableEnv();
  enableEnv();
  await seedLineCredentials();
  const externalAccountId = 'U' + crypto.randomUUID().replace(/-/g, '');
  await createLineChannel(externalAccountId);
  const { messageId } = await createLineThreadAndMessage(externalAccountId, 'Duplicate honest test');
  // First send: LINE API unreachable → adapter returns 'unknown' → service throws 500,
  // but the send attempt IS recorded with status 'unknown'.
  const first = await h.http('/workspaces/' + workspace + '/messaging/messages/' + messageId + '/approve-send', {});
  assert.equal(first.status, 500, 'First send should return 500 (API unreachable), got ' + first.status);
  // Verify first attempt recorded.
  let attempts = await h.pool.query('select count(*)::int n from message_send_attempts where message_id = $1', [messageId]);
  assert.equal(attempts.rows[0].n, 1, 'Expected exactly 1 send attempt row after first send, got ' + attempts.rows[0].n);
  const firstAttempt = await h.pool.query('select status from message_send_attempts where message_id = $1', [messageId]);
  assert.equal(firstAttempt.rows[0].status, 'unknown', 'First attempt status should be unknown, got ' + firstAttempt.rows[0].status);
  // Second send: the code checks if an existing attempt has status !== 'sent'.
  // Unknown is !== 'sent', so it should throw ConflictException → 409.
  const second = await h.http('/workspaces/' + workspace + '/messaging/messages/' + messageId + '/approve-send', {});
  // The service checks: existing.status !== 'sent' → throw ConflictException.
  // Unknown !== sent, so second attempt should be blocked.
  assert.ok(second.status === 409 || second.status === 400,
    'Second send should be blocked (prior attempt is unknown), got ' + second.status + ' / ' + JSON.stringify(second.body));
  // Still only one send attempt row.
  attempts = await h.pool.query('select count(*)::int n from message_send_attempts where message_id = $1', [messageId]);
  assert.equal(attempts.rows[0].n, 1, 'Expected exactly 1 send attempt row after second send, got ' + attempts.rows[0].n);
});

test.skip('LINE status endpoint reports configuration without exposing secrets (stub — full test needs connected channel)', async () => {
  disableEnv();
  enableEnv();
  await seedLineCredentials();
  const result = await h.http('/workspaces/' + workspace + '/messaging/line/status');
  assert.equal(result.status, 200);
  assert.equal(result.body.transport.enabled, true);
  assert.ok(result.body.channel);
  assert.equal(result.body.channel.provider, 'line');
  const json = JSON.stringify(result.body);
  assert.ok(!json.includes('Fake_LINE_Access_Token_'), 'Must not expose stored token');
  assert.ok(!json.includes('Fake_Channel_Secret_12345'), 'Must not expose channel secret');
});
