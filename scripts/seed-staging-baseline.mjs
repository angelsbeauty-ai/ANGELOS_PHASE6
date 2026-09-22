import assert from 'node:assert/strict';

/**
 * Staging-only baseline seed: services + business hours for an existing workspace.
 * Does NOT create Auth users, workspaces, apply SQL migrations, or touch Railway.
 *
 * Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FOUNDER_EMAIL
 * Optional: WORKSPACE_ID (otherwise uses the founder\'s first membership)
 *          SEED_DRY_RUN=true to print plan only
 */
const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value.replace(/\/$/, '');
};

const supabaseUrl = required('SUPABASE_URL');
const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');
const founderEmail = required('FOUNDER_EMAIL').toLowerCase();
const dryRun = process.env.SEED_DRY_RUN === 'true';

if ((process.env.NODE_ENV ?? '').trim() === 'production') {
  throw new Error('Refusing NODE_ENV=production. Staging only.');
}
if (/production/i.test(supabaseUrl) && !/supabase\.co/i.test(supabaseUrl)) {
  // soft note only — Supabase URLs don\'t include "production"
}

const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  Accept: 'application/json',
  'Content-Type': 'application/json'
};

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options.headers ?? {}) }
  });
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

let user = null;
for (let page = 1; page <= 20 && !user; page += 1) {
  const data = await request(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=1000`);
  const users = Array.isArray(data?.users) ? data.users : [];
  user = users.find((item) => String(item.email ?? '').toLowerCase() === founderEmail) ?? null;
  if (users.length < 1000) break;
}
assert.ok(user?.id, `No Auth user for ${founderEmail}. Sign into staging app first.`);

const founderRows = await request(
  `${supabaseUrl}/rest/v1/platform_founders?select=user_id&user_id=eq.${encodeURIComponent(user.id)}`
);
assert.equal(founderRows?.length, 1, 'Founder not assigned. Run npm run staging:bootstrap-founder first.');

let workspaceId = process.env.WORKSPACE_ID?.trim() || null;
if (!workspaceId) {
  const memberships = await request(
    `${supabaseUrl}/rest/v1/workspace_memberships?select=workspace_id&user_id=eq.${encodeURIComponent(user.id)}`
  );
  assert.ok(memberships?.length, 'No workspace yet. Create the V1 workspace in the staging app, then rerun.');
  workspaceId = memberships[0].workspace_id;
}

const workspaces = await request(
  `${supabaseUrl}/rest/v1/workspaces?select=id,name,currency,timezone&id=eq.${encodeURIComponent(workspaceId)}`
);
assert.equal(workspaces?.length, 1, 'Workspace not found');
const workspace = workspaces[0];
const currency = workspace.currency || 'JPY';

const existingServices = await request(
  `${supabaseUrl}/rest/v1/services?select=id,name&workspace_id=eq.${encodeURIComponent(workspaceId)}`
);
const existingHours = await request(
  `${supabaseUrl}/rest/v1/business_hours?select=day_of_week&workspace_id=eq.${encodeURIComponent(workspaceId)}`
);

const baselineServices = [
  { name: 'PMU Consultation', duration_minutes: 30, standard_price: 0 },
  { name: 'Brow Touch-up', duration_minutes: 90, standard_price: 15000 },
  { name: 'Full Brow Session', duration_minutes: 150, standard_price: 45000 }
].map((s) => ({
  workspace_id: workspaceId,
  name: s.name,
  duration_minutes: s.duration_minutes,
  buffer_before_minutes: 0,
  buffer_after_minutes: 15,
  standard_price: s.standard_price,
  currency,
  active: true,
  created_by: user.id
}));

const hours = [];
for (let day = 0; day <= 6; day += 1) {
  const closed = day === 0; // Sunday closed default
  hours.push({
    workspace_id: workspaceId,
    day_of_week: day,
    is_closed: closed,
    start_time: closed ? null : '10:00:00',
    end_time: closed ? null : '18:00:00'
  });
}

const existingNames = new Set((existingServices ?? []).map((row) => String(row.name ?? '').toLowerCase()));
const missingBaseline = baselineServices.filter((s) => !existingNames.has(String(s.name).toLowerCase()));

const plan = {
  workspaceId,
  workspaceName: workspace.name,
  currency,
  willInsertServices: missingBaseline.map((s) => s.name),
  willUpsertHours: existingHours.length < 7,
  dryRun
};

if (dryRun) {
  console.log(JSON.stringify({ ok: true, plan }, null, 2));
  process.exit(0);
}

let insertedServices = [];
if (missingBaseline.length > 0) {
  insertedServices = await request(`${supabaseUrl}/rest/v1/services`, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(missingBaseline)
  });
}

if (existingHours.length < 7) {
  await request(`${supabaseUrl}/rest/v1/business_hours?on_conflict=workspace_id,day_of_week`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(hours)
  });
}

const servicesAfter = await request(
  `${supabaseUrl}/rest/v1/services?select=id,name,duration_minutes,standard_price&workspace_id=eq.${encodeURIComponent(workspaceId)}`
);
const hoursAfter = await request(
  `${supabaseUrl}/rest/v1/business_hours?select=day_of_week,is_closed,start_time,end_time&workspace_id=eq.${encodeURIComponent(workspaceId)}&order=day_of_week`
);

console.log(JSON.stringify({
  ok: true,
  workspaceId,
  workspaceName: workspace.name,
  insertedServiceNames: Array.isArray(insertedServices) ? insertedServices.map((s) => s.name) : plan.willInsertServices,
  servicesCount: Array.isArray(servicesAfter) ? servicesAfter.length : 0,
  businessHoursDays: Array.isArray(hoursAfter) ? hoursAfter.length : 0,
  next: 'Run npm run staging:verify-workspace, then exercise bookings/AI against this staging workspace.'
}, null, 2));