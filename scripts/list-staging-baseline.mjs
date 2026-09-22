const workspaceId = '2f420624-2422-4fc3-b00a-f697b68a877d';
const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const list = await fetch(supabaseUrl + '/rest/v1/services?workspace_id=eq.' + workspaceId + '&select=id,name,active,standard_price,duration_minutes&order=name', {
  headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey }
});
const body = await list.json();
console.log('SERVICES', (body || []).map((s) => ({ name: s.name, active: s.active, price: s.standard_price, mins: s.duration_minutes })));
const hours = await fetch(supabaseUrl + '/rest/v1/business_hours?workspace_id=eq.' + workspaceId + '&select=day_of_week,is_closed,start_time,end_time&order=day_of_week', {
  headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey }
});
const h = await hours.json();
console.log('HOURS_DAYS', Array.isArray(h) ? h.length : 0);