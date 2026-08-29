import assert from 'node:assert/strict';

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value.replace(/\/$/, '');
};

const supabaseUrl = required('SUPABASE_URL');
const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');
const founderEmail = required('FOUNDER_EMAIL').toLowerCase();
const founderLabel = process.env.FOUNDER_LABEL?.trim() || 'AngelOS Founder';

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)) {
  throw new Error('SUPABASE_URL does not look like a Supabase project URL');
}
if (!founderEmail.includes('@')) throw new Error('FOUNDER_EMAIL must be a valid email address');
if ((process.env.NODE_ENV ?? '').trim() === 'production' && process.env.ALLOW_PRODUCTION_FOUNDER_BOOTSTRAP !== 'true') {
  throw new Error('Production founder bootstrap is blocked unless ALLOW_PRODUCTION_FOUNDER_BOOTSTRAP=true is deliberately set');
}

const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  'Content-Type': 'application/json'
};

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...headers, ...(options.headers ?? {}) } });
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

console.log(`Looking up confirmed Supabase Auth user for ${founderEmail}...`);
let foundUser = null;
for (let page = 1; page <= 20 && !foundUser; page += 1) {
  const result = await request(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=1000`);
  const users = Array.isArray(result?.users) ? result.users : [];
  foundUser = users.find((user) => String(user.email ?? '').toLowerCase() === founderEmail) ?? null;
  if (users.length < 1000) break;
}

if (!foundUser) {
  throw new Error(`No Supabase Auth user exists for ${founderEmail}. Sign into the STAGING app first, then rerun this script.`);
}
assert.ok(foundUser.id, 'Auth user is missing an id');
if (!foundUser.email_confirmed_at && !foundUser.confirmed_at) {
  throw new Error(`Auth user ${founderEmail} exists but is not confirmed yet.`);
}

console.log(`Found user ${foundUser.id}. Assigning Founder access...`);
await request(`${supabaseUrl}/rest/v1/platform_founders?on_conflict=user_id`, {
  method: 'POST',
  headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
  body: JSON.stringify({ user_id: foundUser.id, label: founderLabel })
});

const founderRows = await request(`${supabaseUrl}/rest/v1/platform_founders?select=user_id,label,created_at&user_id=eq.${encodeURIComponent(foundUser.id)}`);
assert.equal(founderRows?.length, 1, 'Founder assignment could not be verified');
assert.equal(founderRows[0].user_id, foundUser.id, 'Founder verification returned the wrong user');

console.log(`Founder access verified for ${founderEmail} (${foundUser.id}).`);
