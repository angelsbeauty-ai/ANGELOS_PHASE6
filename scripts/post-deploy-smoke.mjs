import assert from 'node:assert/strict';

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value.replace(/\/$/, '');
};

const apiUrl = required('STAGING_API_URL');
if (!apiUrl.startsWith('https://')) throw new Error('STAGING_API_URL must use https://');

async function request(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    const text = await response.text();
    let body;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (!response.ok) {
      throw new Error(`${path} returned ${response.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
    }
    return { response, body };
  } finally {
    clearTimeout(timeout);
  }
}

console.log('1/4 HTTPS API liveness');
const live = await request('/health');
assert.equal(live.body?.status, 'healthy');
assert.equal(live.body?.service, 'angelos-api');
assert.ok(live.body?.timestamp);

console.log('2/4 Supabase-backed readiness');
const ready = await request('/health/ready');
assert.equal(ready.body?.status, 'ready');
assert.equal(ready.body?.checks?.database, 'ready');
assert.ok(Number.isFinite(ready.body?.latencyMs));

console.log('3/4 No server implementation details leaked');
const serializedReady = JSON.stringify(ready.body).toLowerCase();
for (const forbidden of ['service_role', 'postgres://', 'password=', 'stack', 'supabase_service_role_key']) {
  assert.equal(serializedReady.includes(forbidden), false, `Readiness response leaked forbidden marker: ${forbidden}`);
}

console.log('4/4 Basic response hardening');
const serverHeader = live.response.headers.get('server') ?? '';
if (serverHeader) console.log(`  server header present: ${serverHeader}`);
const contentType = live.response.headers.get('content-type') ?? '';
assert.ok(contentType.includes('application/json'), `Expected JSON content type, received ${contentType}`);

console.log('AngelOS post-deploy smoke test passed.');
