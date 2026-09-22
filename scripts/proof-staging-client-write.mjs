const workspaceId = '2f420624-2422-4fc3-b00a-f697b68a877d';
const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anon = process.env.SUPABASE_PUBLISHABLE_KEY;
const base = 'https://angelosapi-staging.up.railway.app';

const emailA = process.env.STAGING_TEST_EMAIL_A;
const passA = process.env.STAGING_TEST_PASSWORD_A;
const authRes = await fetch(supabaseUrl + '/auth/v1/token?grant_type=password', {
  method: 'POST',
  headers: { apikey: anon, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: emailA, password: passA })
});
const authBody = await authRes.json();
if (!authRes.ok) { console.log('AUTH_FAIL'); process.exit(1); }
const userId = authBody.user.id;
const token = authBody.access_token;

// platform_founders unlocks BetaAccessGuard same as FOUNDER_USER_IDS
const pf = await fetch(supabaseUrl + '/rest/v1/platform_founders?user_id=eq.' + userId + '&select=user_id', {
  headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey }
});
const pfBody = await pf.json();
console.log('FOUNDER_ROW', Array.isArray(pfBody) ? pfBody.length : 0);
if (!Array.isArray(pfBody) || pfBody.length === 0) {
  const add = await fetch(supabaseUrl + '/rest/v1/platform_founders', {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: 'Bearer ' + serviceKey,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ user_id: userId })
  });
  console.log('ADD_FOUNDER', add.status, (await add.text()).slice(0, 160));
  if (!add.ok && add.status !== 409) {
    // try alternate column shapes later
  }
}

const name = 'Proof Client ' + Date.now().toString(36);
const createRes = await fetch(base + '/workspaces/' + workspaceId + '/clients', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
  body: JSON.stringify({ displayName: name, language: 'en' })
});
const createText = await createRes.text();
let createBody; try { createBody = JSON.parse(createText); } catch { createBody = createText; }
console.log('CREATE_STATUS', createRes.status);
if (createRes.ok) {
  console.log('CREATE_OK', { id: createBody.id, display_name: createBody.display_name });
  process.exit(0);
}
console.log('CREATE_FAIL', typeof createBody === 'string' ? createBody.slice(0, 300) : JSON.stringify(createBody).slice(0, 300));
process.exit(1);