const workspaceId = '2f420624-2422-4fc3-b00a-f697b68a877d';
const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const anon = process.env.SUPABASE_PUBLISHABLE_KEY;
const base = 'https://angelosapi-staging.up.railway.app';
const emailA = process.env.STAGING_TEST_EMAIL_A;
const passA = process.env.STAGING_TEST_PASSWORD_A;
const auth = await (await fetch(supabaseUrl + '/auth/v1/token?grant_type=password', {
  method: 'POST',
  headers: { apikey: anon, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: emailA, password: passA })
})).json();
const token = auth.access_token;
const headers = { Authorization: 'Bearer ' + token };
const [line, meta, cal] = await Promise.all([
  fetch(base + '/workspaces/' + workspaceId + '/messaging/line/status', { headers }),
  fetch(base + '/workspaces/' + workspaceId + '/messaging/meta/status', { headers }),
  fetch(base + '/workspaces/' + workspaceId + '/calendar?start=' + encodeURIComponent(new Date().toISOString()) + '&end=' + encodeURIComponent(new Date(Date.now()+7*864e5).toISOString()), { headers })
]);
const lineBody = await line.json().catch(()=>({}));
const metaBody = await meta.json().catch(()=>({}));
const calBody = await cal.json().catch(()=>({}));
console.log('LINE', line.status, {
  configured: lineBody?.channelCredentials?.configured,
  conn: lineBody?.connection?.status || null,
  token: lineBody?.connection?.tokenPresent || false
});
console.log('META', meta.status, {
  app: metaBody?.appCredentials?.configured,
  connections: (metaBody?.connections || []).map(c => ({ provider: c.provider, status: c.status, token: c.tokenPresent, expired: c.expired }))
});
console.log('CAL', cal.status, {
  appointments: Array.isArray(calBody?.appointments) ? calBody.appointments.length : 0,
  blocks: Array.isArray(calBody?.blocks) ? calBody.blocks.length : 0
});