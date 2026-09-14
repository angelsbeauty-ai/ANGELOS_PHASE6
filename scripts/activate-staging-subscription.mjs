/**
 * Staging-only: set workspace_subscriptions to active for founder pilot writes.
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WORKSPACE_ID
 * Refuses NODE_ENV=production.
 */
const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(name + ' is required');
  return value.replace(/\/$/, '');
};

if ((process.env.NODE_ENV ?? '').trim() === 'production') {
  throw new Error('Refusing NODE_ENV=production');
}

const supabaseUrl = required('SUPABASE_URL');
const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');
const workspaceId = required('WORKSPACE_ID');
const dryRun = process.env.SEED_DRY_RUN === 'true';

const headers = {
  apikey: serviceRoleKey,
  Authorization: 'Bearer ' + serviceRoleKey,
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Prefer: 'return=representation'
};

async function request(path, options = {}) {
  const response = await fetch(supabaseUrl + path, {
    ...options,
    headers: { ...headers, ...(options.headers ?? {}) }
  });
  const text = await response.text();
  let body = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }
  if (!response.ok) {
    throw new Error((options.method ?? 'GET') + ' ' + path + ' failed (' + response.status + '): ' + (typeof body === 'string' ? body : JSON.stringify(body)));
  }
  return body;
}

const rows = await request('/rest/v1/workspace_subscriptions?workspace_id=eq.' + encodeURIComponent(workspaceId) + '&select=workspace_id,status,trial_ends_at,read_only_until,plan_code');
const row = Array.isArray(rows) ? rows[0] : null;
console.log('BEFORE', row ? { status: row.status, trial_ends_at: row.trial_ends_at, read_only_until: row.read_only_until, plan_code: row.plan_code } : 'NO_ROW');

const now = new Date();
const trialEnds = new Date(now.getTime() + 90 * 86400000).toISOString();
const periodEnd = new Date(now.getTime() + 90 * 86400000).toISOString();

if (!row) {
  const payload = {
    workspace_id: workspaceId,
    plan_code: 'angelos_solo',
    status: 'active',
    billing_interval: 'monthly',
    provider: 'staging',
    trial_ends_at: null,
    current_period_ends_at: periodEnd,
    cancelled_at: null,
    read_only_started_at: null,
    read_only_until: null,
    grace_ends_at: null,
    discount_percent: 0,
    updated_at: now.toISOString()
  };
  console.log(dryRun ? 'DRY_INSERT' : 'INSERT', { status: payload.status, current_period_ends_at: payload.current_period_ends_at });
  if (!dryRun) {
    try {
      await request('/rest/v1/workspace_subscriptions', { method: 'POST', body: JSON.stringify(payload) });
    } catch (err) {
      // plan_code may differ — retry minimal fields after reading plans
      console.log('INSERT_FAIL_RETRY', String(err.message || err).slice(0, 200));
      throw err;
    }
  }
} else {
  const patch = {
    status: 'active',
    provider: row.provider || 'staging',
    trial_ends_at: null,
    current_period_ends_at: periodEnd,
    cancelled_at: null,
    read_only_started_at: null,
    read_only_until: null,
    grace_ends_at: null,
    updated_at: now.toISOString()
  };
  console.log(dryRun ? 'DRY_PATCH' : 'PATCH', patch);
  if (!dryRun) {
    await request('/rest/v1/workspace_subscriptions?workspace_id=eq.' + encodeURIComponent(workspaceId), {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
  }
}

const after = await request('/rest/v1/workspace_subscriptions?workspace_id=eq.' + encodeURIComponent(workspaceId) + '&select=workspace_id,status,trial_ends_at,read_only_until,current_period_ends_at');
const a = Array.isArray(after) ? after[0] : null;
console.log('AFTER', a ? { status: a.status, trial_ends_at: a.trial_ends_at, read_only_until: a.read_only_until, current_period_ends_at: a.current_period_ends_at } : 'NO_ROW');
console.log('DONE');