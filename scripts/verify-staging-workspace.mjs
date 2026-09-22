import assert from 'node:assert/strict';

/**
 * Read-only staging check: founder Auth user + platform_founders + workspace membership.
 * Does NOT create data, apply SQL, or call Railway.
 *
 * Required env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FOUNDER_EMAIL
 */
const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value.replace(/\/$/, '');
};

const supabaseUrl = required('SUPABASE_URL');
const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');
const founderEmail = required('FOUNDER_EMAIL').toLowerCase();

if ((process.env.NODE_ENV ?? '').trim() === 'production') {
  throw new Error('Refusing to run against NODE_ENV=production. Use staging only.');
}

const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  Accept: 'application/json'
};

async function jsonFetch(url) {
  const response = await fetch(url, { headers });
  const text = await response.text();
  let body = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }
  if (!response.ok) {
    throw new Error(`GET ${url} failed (${response.status}): ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return body;
}

let user = null;
for (let page = 1; page <= 20 && !user; page += 1) {
  const data = await jsonFetch(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=1000`);
  const users = Array.isArray(data?.users) ? data.users : [];
  user = users.find((item) => String(item.email ?? '').toLowerCase() === founderEmail) ?? null;
  if (users.length < 1000) break;
}
assert.ok(user?.id, `No Auth user for ${founderEmail}. Sign into the STAGING app first.`);

const founderRows = await jsonFetch(
  `${supabaseUrl}/rest/v1/platform_founders?select=user_id,label&user_id=eq.${encodeURIComponent(user.id)}`
);
assert.equal(founderRows?.length, 1, `Founder not assigned. Run: node scripts/bootstrap-founder.mjs`);

const memberships = await jsonFetch(
  `${supabaseUrl}/rest/v1/workspace_memberships?select=workspace_id,role,workspace:workspaces(id,name,timezone,currency)&user_id=eq.${encodeURIComponent(user.id)}`
);

if (!Array.isArray(memberships) || memberships.length === 0) {
  console.log(JSON.stringify({
    ok: false,
    next: 'Create the one V1 workspace while signed into the STAGING app (API create_workspace_with_owner). Then rerun this script.',
    founderUserId: user.id,
    founderEmail
  }, null, 2));
  process.exit(2);
}

const workspaceIds = memberships.map((m) => m.workspace_id).filter(Boolean);
let servicesCount = 0;
let clientsCount = 0;
if (workspaceIds.length === 1) {
  const wid = workspaceIds[0];
  const services = await jsonFetch(
    `${supabaseUrl}/rest/v1/services?select=id&workspace_id=eq.${encodeURIComponent(wid)}`
  );
  const clients = await jsonFetch(
    `${supabaseUrl}/rest/v1/clients?select=id&workspace_id=eq.${encodeURIComponent(wid)}`
  );
  servicesCount = Array.isArray(services) ? services.length : 0;
  clientsCount = Array.isArray(clients) ? clients.length : 0;
}

console.log(JSON.stringify({
  ok: true,
  founderEmail,
  founderUserId: user.id,
  workspaces: memberships.map((m) => m.workspace),
  baseline: { servicesCount, clientsCount },
  tip: servicesCount === 0
    ? 'Workspace exists but has no services yet — add baseline services in staging UI or a future seed script.'
    : 'Workspace has some services; core modules can be exercised against real data.'
}, null, 2));