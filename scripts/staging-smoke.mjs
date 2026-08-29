import assert from 'node:assert/strict';

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value.replace(/\/$/, '');
};

const optional = (name) => process.env[name]?.trim() || null;

const apiUrl = required('STAGING_API_URL');
const supabaseUrl = required('STAGING_SUPABASE_URL');
const clientKey = process.env.STAGING_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.STAGING_SUPABASE_ANON_KEY?.trim();
if (!clientKey) throw new Error('STAGING_SUPABASE_PUBLISHABLE_KEY or STAGING_SUPABASE_ANON_KEY is required');
const emailA = required('STAGING_TEST_EMAIL_A');
const passwordA = required('STAGING_TEST_PASSWORD_A');
const emailB = optional('STAGING_TEST_EMAIL_B');
const passwordB = optional('STAGING_TEST_PASSWORD_B');

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }
  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${url} failed (${response.status}): ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return body;
}

async function signIn(email, password) {
  const body = await jsonFetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: clientKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  assert.ok(body?.access_token, `Supabase login did not return access_token for ${email}`);
  assert.ok(body?.user?.id, `Supabase login did not return user for ${email}`);
  return { accessToken: body.access_token, userId: body.user.id };
}

async function api(path, accessToken, options = {}) {
  return jsonFetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  });
}

async function supabaseRest(path, accessToken) {
  return jsonFetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: clientKey,
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });
}

console.log('1/6 API liveness');
const live = await jsonFetch(`${apiUrl}/health`);
assert.equal(live.status, 'healthy');

console.log('2/6 API/database readiness');
const ready = await jsonFetch(`${apiUrl}/health/ready`);
assert.equal(ready.status, 'ready');

console.log('3/6 Test user A auth + API authorization');
const userA = await signIn(emailA, passwordA);
const workspacesA = await api('/workspaces', userA.accessToken);
assert.ok(Array.isArray(workspacesA), 'GET /workspaces must return an array');
console.log(`  user A workspaces: ${workspacesA.length}`);

console.log('4/6 User A direct RLS view matches API visibility');
const directA = await supabaseRest('workspaces?select=id,name', userA.accessToken);
assert.ok(Array.isArray(directA), 'Direct Supabase workspaces query must return an array');
const apiIdsA = new Set(workspacesA.map((row) => row.id));
for (const row of directA) assert.ok(apiIdsA.has(row.id), `RLS exposed workspace ${row.id} not visible through API`);

if (emailB && passwordB) {
  console.log('5/6 Cross-tenant API/RLS isolation with user B');
  const userB = await signIn(emailB, passwordB);
  const workspacesB = await api('/workspaces', userB.accessToken);
  assert.ok(Array.isArray(workspacesB));
  const directB = await supabaseRest('workspaces?select=id,name', userB.accessToken);
  const idsA = new Set(workspacesA.map((row) => row.id));
  const idsB = new Set(workspacesB.map((row) => row.id));
  for (const id of idsA) assert.ok(!idsB.has(id), `Workspace ${id} is visible to both test tenants through API`);
  for (const row of directB) assert.ok(!idsA.has(row.id), `Workspace ${row.id} from tenant A leaked through direct RLS query to tenant B`);
  console.log(`  user B workspaces: ${workspacesB.length}`);
} else {
  console.log('5/6 Cross-tenant test skipped (STAGING_TEST_EMAIL_B/PASSWORD_B not supplied)');
}

console.log('6/6 Founder/private beta gate sanity');
const betaA = await api('/beta/me', userA.accessToken);
assert.ok(betaA && typeof betaA === 'object', 'GET /beta/me must return beta access state');

console.log('AngelOS staging smoke test passed.');
