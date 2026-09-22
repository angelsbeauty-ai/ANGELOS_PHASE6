const workspaceId = '2f420624-2422-4fc3-b00a-f697b68a877d';
const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anon = process.env.SUPABASE_PUBLISHABLE_KEY;
const base = 'https://angelosapi-staging.up.railway.app';

const sub = await fetch(supabaseUrl + '/rest/v1/workspace_subscriptions?workspace_id=eq.' + workspaceId + '&select=status,trial_ends_at,read_only_until,current_period_ends_at', {
  headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey }
});
const subBody = await sub.json();
console.log('SUB', subBody[0] ? { status: subBody[0].status, read_only_until: subBody[0].read_only_until } : 'NONE');

const emailA = process.env.STAGING_TEST_EMAIL_A;
const passA = process.env.STAGING_TEST_PASSWORD_A;
const authRes = await fetch(supabaseUrl + '/auth/v1/token?grant_type=password', {
  method: 'POST',
  headers: { apikey: anon, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: emailA, password: passA })
});
const authBody = await authRes.json();
if (!authRes.ok) { console.log('AUTH_FAIL', authRes.status); process.exit(1); }
const token = authBody.access_token;

const name = 'Walk Client ' + Date.now().toString(36);
const createRes = await fetch(base + '/workspaces/' + workspaceId + '/clients', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
  body: JSON.stringify({ displayName: name, language: 'en', status: 'active' })
});
const createText = await createRes.text();
let createBody; try { createBody = JSON.parse(createText); } catch { createBody = createText; }
console.log('CREATE_STATUS', createRes.status);
if (createRes.ok) console.log('CREATE_OK', createBody.display_name);
else console.log('CREATE_FAIL', typeof createBody === 'string' ? createBody.slice(0, 250) : JSON.stringify(createBody).slice(0, 250));

const contentRes = await fetch(base + '/workspaces/' + workspaceId + '/content', {
  headers: { Authorization: 'Bearer ' + token }
});
console.log('CONTENT_STATUS', contentRes.status);

const svc = await fetch(base + '/workspaces/' + workspaceId + '/services', {
  headers: { Authorization: 'Bearer ' + token }
});
const svcBody = await svc.json().catch(() => null);
console.log('SERVICES_STATUS', svc.status, 'COUNT', Array.isArray(svcBody) ? svcBody.length : 'n/a');

const hours = await fetch(base + '/workspaces/' + workspaceId + '/business-hours', {
  headers: { Authorization: 'Bearer ' + token }
});
const hoursBody = await hours.json().catch(() => null);
console.log('HOURS_STATUS', hours.status, 'COUNT', Array.isArray(hoursBody) ? hoursBody.length : 'n/a');

const clients = await fetch(base + '/workspaces/' + workspaceId + '/clients', {
  headers: { Authorization: 'Bearer ' + token }
});
const clientsBody = await clients.json().catch(() => null);
console.log('CLIENTS_STATUS', clients.status, 'COUNT', Array.isArray(clientsBody) ? clientsBody.length : 'n/a');