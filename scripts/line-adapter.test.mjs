/**
 * Unit tests for the LINE messaging adapter.
 *
 * Chainable Supabase mock: every method (.eq/.in/.order) returns self so .eq().eq().maybeSingle()
 * chains work. Terminal methods (.maybeSingle/.limit) return the mock data.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const distRoot = path.resolve('apps/api/dist');
const lineTransport = require(path.join(distRoot, 'messaging/line-transport'));
const configModule = require(path.join(distRoot, 'config/supabase'));

const LineMessagingAdapter = lineTransport.LineMessagingAdapter;
const lineTransportEnabled = lineTransport.lineTransportEnabled;

const originalFetch = globalThis.fetch;
const originalCreateServiceSupabaseClient = configModule.createServiceSupabaseClient;

function cleanEnv() {
  for (const key of Object.keys(process.env)) {
    if (/SUPABASE|OPENAI|N8N|LINE_|META_|DATABASE_URL|^PG|RAILWAY/.test(key)) {
      delete process.env[key];
    }
  }
  process.env.NODE_ENV = 'staging';
}

/** Chainable Supabase mock builder. Every intermediate method returns self; terminals return data. */
function chainableMock(resultData) {
  const self = {
    eq(key, value) { return self; },
    in(key, vals) { return self; },
    order(key, opts) { return self; },
    limit(n) { return { data: resultData ? [resultData] : [], error: null }; },
    maybeSingle() { return { data: resultData || null, error: null }; }
  };
  return self;
}

/** Override createServiceSupabaseClient with a mock that serves the given rows per table. */
async function withMockSupabase(oauthRow, integrationRow, channelRow, fn) {
  configModule.createServiceSupabaseClient = () => ({
    from(table) {
      const row = table === 'oauth_connections' ? oauthRow : table === 'integration_apps' ? integrationRow : table === 'messaging_channels' ? channelRow : null;
      return {
        select(columns) { return chainableMock(row); }
      };
    }
  });
  try { return await fn(); }
  finally { configModule.createServiceSupabaseClient = originalCreateServiceSupabaseClient; }
}

/** Override global.fetch to capture and return the given response. Restoration happens AFTER fn settles. */
async function withFetchMock(mockResponse, fn) {
  const origFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' || input instanceof URL ? input : input.url;
    const captured = { url, headers: init?.headers, body: init?.body };
    return await mockResponse(captured);
  };
  try { return await fn(); }
  finally { globalThis.fetch = origFetch; }
}

function defaultSuccessFetch() {
  return async (captured) => ({ ok: true, status: 200, json: async () => ({}) });
}

test('LINE adapter is exported and constructable', () => {
  assert.ok(LineMessagingAdapter);
  const adapter = new LineMessagingAdapter();
  assert.ok(adapter);
  assert.equal(typeof adapter.send, 'function');
});

test('LINE transport disabled → send returns failed without calling API', async () => {
  cleanEnv();
  delete process.env.LINE_TRANSPORT_ENABLED;
  delete process.env.LINE_STAGING_WORKSPACE_ID;

  await withMockSupabase({ access_token: 'test-token', status: 'active', access_expires_at: '2099-01-01T00:00:00Z' }, null, null, async () => {
    const adapter = new LineMessagingAdapter();
    const calls = [];
    await withFetchMock(defaultSuccessFetch(), async (captured) => {
      calls.push(captured);
      return { ok: true, status: 200, json: async () => ({}) };
    }, async () => {
      const result = await adapter.send({
        workspaceId: 'test-workspace',
        externalAccountId: 'test-user-id',
        body: 'Hello LINE',
        idempotencyKey: 'msg-1'
      });
      assert.equal(result.status, 'failed');
      assert.ok(result.error?.includes('not enabled'), 'error should mention transport not enabled, got: ' + result.error);
      assert.equal(calls.length, 0, 'API must not be called when transport is disabled');
    });
  });
});

test('LINE missing credentials → fail closed without calling API', async () => {
  cleanEnv();
  process.env.LINE_TRANSPORT_ENABLED = 'true';
  process.env.LINE_STAGING_WORKSPACE_ID = 'test-workspace';

  await withMockSupabase(null, null, null, async () => {
    const adapter = new LineMessagingAdapter();
    const calls = [];
    await withFetchMock(defaultSuccessFetch(), async (captured) => {
      calls.push(captured);
      return { ok: true, status: 200, json: async () => ({}) };
    }, async () => {
      const result = await adapter.send({
        workspaceId: 'test-workspace',
        externalAccountId: 'test-user-id',
        body: 'Hello LINE',
        idempotencyKey: 'msg-1'
      });
      assert.equal(result.status, 'failed');
      assert.ok(result.error?.includes('No LINE account'), 'error should mention missing credential, got: ' + result.error);
      assert.equal(calls.length, 0, 'API must not be called when credentials are missing');
    });
  });
});

test('LINE adapter sends to correct API endpoint with Bearer token', async () => {
  cleanEnv();
  process.env.LINE_TRANSPORT_ENABLED = 'true';
  process.env.LINE_STAGING_WORKSPACE_ID = 'test-workspace';

  await withMockSupabase({ access_token: 'test-channel-access-token', status: 'active', access_expires_at: '2099-01-01T00:00:00Z' }, null, null, async () => {
    const adapter = new LineMessagingAdapter();
    const calls = [];
    await withFetchMock((captured) => {
      calls.push(captured);
      return { ok: true, status: 200, json: async () => ({}) };
    }, async () => {
      const result = await adapter.send({
        workspaceId: 'test-workspace',
        externalAccountId: 'U123456789abcdef',
        body: 'Reply from AngelOS',
        idempotencyKey: 'msg-1'
      });
      assert.equal(result.status, 'sent');

      assert.equal(calls.length, 1);
      const call = calls[0];
      assert.ok(call.url.includes('api.line.me/v2/bot/message/push'), 'URL should be LINE Messaging API push endpoint, got: ' + call.url);
      assert.equal(call.headers['Authorization'], 'Bearer test-channel-access-token');
      const body = JSON.parse(call.body);
      assert.equal(body.to, 'U123456789abcdef');
      assert.equal(body.messages[0].type, 'text');
      assert.equal(body.messages[0].text, 'Reply from AngelOS');
    });
  });
});

test('LINE adapter rejects empty body', async () => {
  cleanEnv();
  process.env.LINE_TRANSPORT_ENABLED = 'true';
  process.env.LINE_STAGING_WORKSPACE_ID = 'test-workspace';

  await withMockSupabase({ access_token: 'test-token', status: 'active', access_expires_at: '2099-01-01T00:00:00Z' }, null, null, async () => {
    const adapter = new LineMessagingAdapter();
    const calls = [];
    await withFetchMock(defaultSuccessFetch(), async (captured) => {
      calls.push(captured);
      return { ok: true, status: 200, json: async () => ({}) };
    }, async () => {
      const result = await adapter.send({
        workspaceId: 'test-workspace',
        externalAccountId: 'U123456789',
        body: '',
        idempotencyKey: 'msg-1'
      });
      assert.equal(result.status, 'failed');
      assert.ok(result.error?.includes('non-empty'));
      assert.equal(calls.length, 0);
    });
  });
});

test('LINE adapter rejects body over 5000 chars', async () => {
  cleanEnv();
  process.env.LINE_TRANSPORT_ENABLED = 'true';
  process.env.LINE_STAGING_WORKSPACE_ID = 'test-workspace';

  await withMockSupabase({ access_token: 'test-token', status: 'active', access_expires_at: '2099-01-01T00:00:00Z' }, null, null, async () => {
    const adapter = new LineMessagingAdapter();

    const calls = [];
    await withFetchMock(defaultSuccessFetch(), async (captured) => {
      calls.push(captured);
      return { ok: true, status: 200, json: async () => ({}) };
    }, async () => {
      const result = await adapter.send({
        workspaceId: 'test-workspace',
        externalAccountId: 'U123456789',
        body: 'x'.repeat(5001),
        idempotencyKey: 'msg-1'
      });
      assert.equal(result.status, 'failed');
      assert.ok(result.error?.includes('5000'), 'error should mention 5000 limit, got: ' + result.error);
      assert.equal(calls.length, 0);
    });
  });
});

test('LINE adapter returns failed on HTTP error from LINE API', async () => {
  cleanEnv();
  process.env.LINE_TRANSPORT_ENABLED = 'true';
  process.env.LINE_STAGING_WORKSPACE_ID = 'test-workspace';

  await withMockSupabase({ access_token: 'test-token', status: 'active', access_expires_at: '2099-01-01T00:00:00Z' }, null, null, async () => {
    const adapter = new LineMessagingAdapter();

    await withFetchMock(async (captured) => ({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid access token' } })
    }), async () => {
      const result = await adapter.send({
        workspaceId: 'test-workspace',
        externalAccountId: 'U123456789',
        body: 'Reply',
        idempotencyKey: 'msg-1'
      });
      assert.equal(result.status, 'failed');
      assert.ok(result.error?.includes('Invalid access token') || result.error?.includes('LINE API error'), 'error should mention the reason, got: ' + result.error);
      assert.equal(result.raw?.error?.message, 'Invalid access token');
    });
  });
});

test('LINE adapter returns unknown on network failure (no auto-retry)', async () => {
  cleanEnv();
  process.env.LINE_TRANSPORT_ENABLED = 'true';
  process.env.LINE_STAGING_WORKSPACE_ID = 'test-workspace';

  await withMockSupabase({ access_token: 'test-token', status: 'active', access_expires_at: '2099-01-01T00:00:00Z' }, null, null, async () => {
    const adapter = new LineMessagingAdapter();

    await withFetchMock(async () => { throw new Error('Network unreachable'); }, async () => {
      const result = await adapter.send({
        workspaceId: 'test-workspace',
        externalAccountId: 'U123456789',
        body: 'Reply',
        idempotencyKey: 'msg-1'
      });
      assert.equal(result.status, 'unknown');
      assert.ok(result.error);
      // The adapter itself does not retry. The caller (messaging.service.ts) is responsible
      // for idempotency and retry policy.
    });
  });
});

test('LINE credential status reporting does not expose secrets', async () => {
  cleanEnv();
  process.env.LINE_TRANSPORT_ENABLED = 'true';
  process.env.LINE_STAGING_WORKSPACE_ID = 'test-workspace';

  const supabaseMock = {
    from(table) {
      if (table === 'integration_apps') {
        return { select(columns) { return chainableMock({ client_key: ' CHANNEL_SECRET_NOT_EXPOSED ', client_secret: ' CHANNEL_SECRET_NOT_EXPOSED ' }); } };
      }
      if (table === 'oauth_connections' || table === 'messaging_channels') {
        return { select(columns) { return chainableMock(null); } };
      }
      return { select(columns) { return chainableMock(null); } };
    }
  };

  const origCreate = configModule.createServiceSupabaseClient;
  configModule.createServiceSupabaseClient = () => supabaseMock;
  try {
    const status = await lineTransport.lineCredentialStatus('test-workspace');
    assert.equal(status.channelCredentials.configured, true);
    assert.ok(!JSON.stringify(status).includes('CHANNEL_SECRET_NOT_EXPOSED'), 'status must not expose channel secrets');
  } finally {
    configModule.createServiceSupabaseClient = origCreate;
  }
});

test('LINE transport gate respects pinned workspace', async () => {
  cleanEnv();
  process.env.LINE_TRANSPORT_ENABLED = 'true';
  process.env.LINE_STAGING_WORKSPACE_ID = 'pinned-workspace';

  // Pinned workspace can send.
  assert.equal(lineTransportEnabled('pinned-workspace'), true, 'pinned workspace should be enabled');
  // Different workspace cannot send.
  assert.equal(lineTransportEnabled('other-workspace'), false, 'other workspace should be disabled');
  // No workspace arg when pinned is set → true (matches Meta: no filter = allow all).
  assert.equal(lineTransportEnabled(), true, 'no workspace arg with pinned set should allow (matches Meta pattern)');
});

test('LINE transport gate off when env var absent', async () => {
  cleanEnv();
  delete process.env.LINE_TRANSPORT_ENABLED;
  delete process.env.LINE_STAGING_WORKSPACE_ID;

  assert.equal(lineTransportEnabled('any-workspace'), false);
  assert.equal(lineTransportEnabled(), false);
});

test('LINE send with undefined workspaceId fails fast', async () => {
  cleanEnv();
  process.env.LINE_TRANSPORT_ENABLED = 'true';

  await withMockSupabase({ access_token: 'fake-token', status: 'active', access_expires_at: '2099-01-01T00:00:00Z' }, null, null, async () => {
    const adapter = new LineMessagingAdapter();
    const calls = [];
    await withFetchMock(defaultSuccessFetch(), async (captured) => {
      calls.push(captured);
      return { ok: true, status: 200, json: async () => ({}) };
    }, async () => {
      const result = await adapter.send({
        workspaceId: undefined,
        externalAccountId: 'U123',
        body: 'test',
        idempotencyKey: 'msg-1'
      });
      assert.equal(result.status, 'failed');
      assert.ok(result.error?.includes('workspaceId'));
      assert.equal(calls.length, 0);
    });
  });
});

test('LINE send with undefined externalAccountId fails fast', async () => {
  cleanEnv();
  process.env.LINE_TRANSPORT_ENABLED = 'true';
  process.env.LINE_STAGING_WORKSPACE_ID = 'test-ws';

  await withMockSupabase({ access_token: 'fake-token', status: 'active', access_expires_at: '2099-01-01T00:00:00Z' }, null, null, async () => {
    const adapter = new LineMessagingAdapter();
    const calls = [];
    await withFetchMock(defaultSuccessFetch(), async (captured) => {
      calls.push(captured);
      return { ok: true, status: 200, json: async () => ({}) };
    }, async () => {
      const result = await adapter.send({
        workspaceId: 'test-ws',
        externalAccountId: undefined,
        body: 'test',
        idempotencyKey: 'msg-1'
      });
      assert.equal(result.status, 'failed');
      assert.ok(result.error?.includes('externalAccountId') || result.error?.includes('user id'));
      assert.equal(calls.length, 0);
    });
  });
});
