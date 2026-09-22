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
const auth = await authRes.json();
const token = auth.access_token;

const [servicesRes, clientsRes] = await Promise.all([
  fetch(base + '/workspaces/' + workspaceId + '/services', { headers: { Authorization: 'Bearer ' + token } }),
  fetch(base + '/workspaces/' + workspaceId + '/clients', { headers: { Authorization: 'Bearer ' + token } })
]);
const services = await servicesRes.json();
const clients = await clientsRes.json();
console.log('SVC', Array.isArray(services) ? services.map(s => s.name) : services);
console.log('CLIENT_COUNT', Array.isArray(clients) ? clients.length : 0);

const service = (services || []).find((s) => /PMU Consultation|Full Brow|Brow Touch|Standard/i.test(s.name)) || services?.[0];
const client = (clients || [])[0];
if (!service || !client) { console.log('MISSING_SERVICE_OR_CLIENT'); process.exit(1); }

const start = new Date();
start.setUTCDate(start.getUTCDate() + 1);
start.setUTCHours(2, 0, 0, 0); // ~11:00 JST
const end = new Date(start.getTime() + (service.duration_minutes || 60) * 60000);

const body = {
  clientId: client.id,
  serviceId: service.id,
  startAt: start.toISOString(),
  endAt: end.toISOString()
};
const create = await fetch(base + '/workspaces/' + workspaceId + '/appointments', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});
const text = await create.text();
let parsed; try { parsed = JSON.parse(text); } catch { parsed = text; }
console.log('BOOK_STATUS', create.status);
if (create.ok) console.log('BOOK_OK', { id: parsed.appointment?.id || parsed.id, service: service.name, client: client.display_name });
else console.log('BOOK_FAIL', typeof parsed === 'string' ? parsed.slice(0, 300) : JSON.stringify(parsed).slice(0, 300));