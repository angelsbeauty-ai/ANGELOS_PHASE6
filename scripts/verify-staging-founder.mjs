import assert from 'node:assert/strict';

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value.replace(/\/$/, '');
};

const supabaseUrl = required('SUPABASE_URL');
const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');
const founderEmail = required('FOUNDER_EMAIL').toLowerCase();

const headers = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, Accept: 'application/json' };
async function jsonFetch(url) {
  const response = await fetch(url, { headers });
  const text = await response.text();
  let body = null;
  if (text) { try { body = JSON.parse(text); } catch { body = text; } }
  if (!response.ok) throw new Error(`GET ${url} failed (${response.status}): ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  return body;
}

let user = null;
for (let page = 1; page <= 20 && !user; page += 1) {
  const data = await jsonFetch(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=1000`);
  const users = Array.isArray(data?.users) ? data.users : [];
  user = users.find((item) => String(item.email ?? '').toLowerCase() === founderEmail) ?? null;
  if (users.length < 1000) break;
}
assert.ok(user?.id, `No Auth user found for ${founderEmail}`);

const founderRows = await jsonFetch(`${supabaseUrl}/rest/v1/platform_founders?select=user_id,label&user_id=eq.${encodeURIComponent(user.id)}`);
assert.equal(founderRows?.length, 1, `Founder access is not assigned to ${founderEmail}`);

const releaseRows = await jsonFetch(`${supabaseUrl}/rest/v1/platform_release_state?select=stage,public_signup_enabled&id=eq.main`);
assert.equal(releaseRows?.length, 1, 'platform_release_state main row missing');
assert.equal(releaseRows[0].stage, 'invite_only_beta');
assert.equal(releaseRows[0].public_signup_enabled, false);

console.log(`Founder access + private beta gate verified for ${founderEmail}.`);
