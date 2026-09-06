const { test } = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const http = require('node:http');
const https = require('node:https');
// This suite must never contact a database, AI provider, or messaging transport.
const denyNetwork = () => { throw new Error('Network access forbidden in synthetic tests'); };
global.fetch = denyNetwork;
net.Socket.prototype.connect = denyNetwork;
http.request = https.request = denyNetwork;
const config = require('../apps/api/dist/config/supabase');
let db;
config.createUserSupabaseClient = config.createServiceSupabaseClient = () => db;
const { MessagingService } = require('../apps/api/dist/messaging/messaging.service');
const { BookingsService } = require('../apps/api/dist/bookings/bookings.service');
const { AutomationsService } = require('../apps/api/dist/automations/automations.service');
const { ClientsService } = require('../apps/api/dist/clients/clients.service');
const { EmergencyReadOnlyGuard } = require('../apps/api/dist/common/guards/emergency-read-only.guard');
const { SystemHealthService } = require('../apps/api/dist/system-health/system-health.service');
const { AnalyticsService } = require('../apps/api/dist/analytics/analytics.service');
const user = { id: 'owner', accessToken: 'synthetic-token' };
const workspace = 'synthetic-workspace';
const ai = { generate: denyNetwork };

// Small in-memory query double executes predicates at mutation time, including CAS.
function database(seed = {}, failure) {
  const rows = structuredClone(seed);
  const calls = [];
  db = { rows, calls, from(table) {
    let action = 'select', payload, single = false, filters = [];
    const q = {
      select() { return q; }, order() { return q; }, limit() { return q; },
      eq(k, v) { filters.push(r => r[k] === v); return q; },
      neq(k, v) { filters.push(r => r[k] !== v); return q; },
      in(k, v) { filters.push(r => v.includes(r[k])); return q; },
      gte(k, v) { filters.push(r => r[k] >= v); return q; }, lte(k, v) { filters.push(r => r[k] <= v); return q; }, lt(k, v) { filters.push(r => r[k] < v); return q; }, gt(k, v) { filters.push(r => r[k] > v); return q; },
      single() { single = true; return q; }, maybeSingle() { single = true; return q; },
      insert(p) { action = 'insert'; payload = p; return q; },
      update(p) { action = 'update'; payload = p; return q; },
      then(resolve, reject) { return Promise.resolve().then(() => {
        calls.push({ table, action, payload });
        const forced = failure?.({ table, action, payload, rows });
        if (forced) return forced;
        rows[table] ??= [];
        let found = rows[table].filter(r => filters.every(f => f(r)));
        if (action === 'insert') {
          if (table === 'appointments' && rows[table].some(r => r.id === payload.id)) return { data: null, error: { code: '23505', message: 'Duplicate booking' } };
          if (table === 'message_send_attempts' && rows[table].some(r => r.workspace_id === payload.workspace_id && r.idempotency_key === payload.idempotency_key)) return { data: null, error: { code: '23505', message: 'Duplicate claim' } };
          const row = { id: `synthetic-${rows[table].length}`, ...payload };
          rows[table].push(row); found = [row];
        }
        if (action === 'update') found.forEach(r => Object.assign(r, payload));
        return { data: structuredClone(single ? found[0] ?? null : found), error: null };
      }).then(resolve, reject); }
    };
    return q;
  } };
  return db;
}
function message(provider = 'manual', status = 'draft') {
  return { id: 'message', workspace_id: workspace, status, direction: 'outbound', sender_type: 'owner', body: 'Synthetic reply', thread: { id: 'thread', external_thread_id: 'demo', channel: { id: 'channel', provider, status: 'connected' } } };
}
function context(url, method = 'POST') {
  return { switchToHttp: () => ({ getRequest: () => ({ method, originalUrl: url, params: { workspaceId: workspace }, headers: { authorization: 'Bearer synthetic' } }) }) };
}
const baseUrl = `/workspaces/${workspace}`;

test('live LINE and Meta transports stop before a send claim', async () => {
  for (const provider of ['line', 'instagram', 'facebook']) {
    const memory = database({ client_messages: [message(provider)] });
    await assert.rejects(new MessagingService(ai).approveAndSend(user, workspace, 'message'), /Live provider transport/);
    assert.equal(memory.calls.filter(c => c.action !== 'select').length, 0);
  }
});
test('disconnected messaging channels cannot send', async () => {
  const row = message(); row.thread.channel.status = 'disconnected';
  database({ client_messages: [row] });
  await assert.rejects(new MessagingService(ai).approveAndSend(user, workspace, 'message'), /not connected/);
});
test('simultaneous message sends call the demo adapter once', async () => {
  database({ client_messages: [message()] });
  const service = new MessagingService(ai); let sends = 0;
  service.manualAdapter.send = async () => { sends++; return { status: 'sent', externalMessageId: 'synthetic-delivery' }; };
  const results = await Promise.allSettled([service.approveAndSend(user, workspace, 'message'), service.approveAndSend(user, workspace, 'message')]);
  assert.equal(sends, 1);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
});
test('uncertain or active delivery is never automatically retried', async () => {
  for (const status of ['queued', 'unknown', 'failed']) {
    database({ client_messages: [message()], message_send_attempts: [{ workspace_id: workspace, idempotency_key: 'message:message', status }] });
    await assert.rejects(new MessagingService(ai).approveAndSend(user, workspace, 'message'), /already claimed or uncertain/);
  }
});
test('send-attempt lookup errors stop delivery', async () => {
  database({ client_messages: [message()] }, ({ table }) => table === 'message_send_attempts' && { error: { message: 'lookup failed' } });
  await assert.rejects(new MessagingService(ai).approveAndSend(user, workspace, 'message'), /lookup failed/);
});
test('already sent messages do not create another delivery', async () => {
  const memory = database({ client_messages: [message('manual', 'sent')] });
  assert.equal((await new MessagingService(ai).approveAndSend(user, workspace, 'message')).duplicatePrevented, true);
  assert.equal(memory.calls.filter(c => c.action !== 'select').length, 0);
});
test('duplicate inbound messages stop before client or thread writes', async () => {
  const memory = database({ messaging_channels: [{ id: 'channel', workspace_id: workspace, provider: 'manual', status: 'connected' }], client_messages: [{ id: 'prior', workspace_id: workspace, external_message_id: 'inbound' }] });
  await assert.rejects(new MessagingService(ai).ingestDemoMessage(user, workspace, { channelId: 'channel', externalMessageId: 'inbound', body: 'Synthetic inbound' }), /already ingested/);
  assert.equal(memory.calls.filter(c => c.action !== 'select').length, 0);
});
test('booking terminal states cannot be resurrected', async () => {
  for (const status of ['cancelled', 'completed', 'no_show']) {
    const memory = database({ appointments: [{ id: 'booking', workspace_id: workspace, status }] });
    await assert.rejects(new BookingsService({}).confirm(user, workspace, 'booking'), /can no longer be marked/);
    assert.equal(memory.calls.filter(c => c.action !== 'select').length, 0);
  }
});
test('repeated booking transition creates no duplicate event', async () => {
  const memory = database({ appointments: [{ id: 'booking', workspace_id: workspace, status: 'confirmed' }] });
  const service = new BookingsService({ queueForAppointmentEvent: async () => [] });
  await service.confirm(user, workspace, 'booking');
  assert.equal(memory.calls.filter(c => c.action !== 'select').length, 0);
});
test('concurrent booking cancellation and confirmation cannot both win', async () => {
  const memory = database({ appointments: [{ id: 'booking', workspace_id: workspace, status: 'confirmation_pending', updated_at: 'initial' }] });
  const service = new BookingsService({ queueForAppointmentEvent: async () => [], cancelAppointmentJobs: async () => {} });
  const results = await Promise.allSettled([service.confirm(user, workspace, 'booking'), service.cancel(user, workspace, 'booking')]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(memory.rows.appointment_events.length, 1);
});
test('concurrent automation workers create only one follow-up', async () => {
  const job = { id: 'job', workspace_id: workspace, status: 'pending', attempt_count: 0, client_id: 'client', appointment_id: 'booking', rule: { trigger_type: 'appointment_completed', action_type: 'create_followup', name: 'Synthetic follow-up' } };
  const memory = database({ workspace_operational_controls: [{ workspace_id: workspace, pause_automations: false, emergency_read_only: false }], automation_jobs: [job], appointments: [{ id: 'booking', workspace_id: workspace, status: 'completed' }] });
  const service = new AutomationsService();
  await Promise.all([service.runOne(user, workspace, job), service.runOne(user, workspace, job)]);
  assert.equal(memory.rows.client_followups.length, 1);
});
test('CRM checks phone even when a different email is supplied', async () => {
  const memory = database({ clients: [{ id: 'existing', workspace_id: workspace, email: 'old@example.invalid', phone: 'synthetic-phone' }] });
  await assert.rejects(new ClientsService().create(user, workspace, { displayName: 'Synthetic', email: 'new@example.invalid', phone: 'synthetic-phone' }), /matching contact/);
  assert.equal(memory.rows.clients.length, 1);
});
test('CRM updates reject another client contact, but allow the same record', async () => {
  database({ clients: [{ id: 'one', workspace_id: workspace, email: 'one@example.invalid' }, { id: 'two', workspace_id: workspace, email: 'two@example.invalid' }] });
  const service = new ClientsService();
  await assert.rejects(service.update(user, workspace, 'two', { email: 'one@example.invalid' }), /matching contact/);
  await service.update(user, workspace, 'one', { email: 'one@example.invalid' });
});
test('CRM rejects whitespace names before database writes', async () => {
  const memory = database();
  await assert.rejects(new ClientsService().create(user, workspace, { displayName: '   ' }), /display name/);
  assert.equal(memory.calls.length, 0);
});
test('emergency guard fails closed on missing or unavailable controls', async () => {
  for (const failure of [undefined, ({ table }) => table === 'workspace_operational_controls' && { error: { message: 'offline' } }]) {
    database({ workspaces: [{ id: workspace }] }, failure);
    await assert.rejects(new EmergencyReadOnlyGuard().canActivate(context(`${baseUrl}/appointments`)), /safety controls unavailable/);
  }
});
test('query parameters cannot bypass emergency read-only', async () => {
  database({ workspaces: [{ id: workspace }], workspace_operational_controls: [{ workspace_id: workspace, emergency_read_only: true }] });
  await assert.rejects(new EmergencyReadOnlyGuard().canActivate(context(`${baseUrl}/appointments?next=/system-health`)), /read-only mode/);
});
test('emergency recovery and read access remain available', async () => {
  database(); const guard = new EmergencyReadOnlyGuard();
  assert.equal(await guard.canActivate(context(`${baseUrl}/system-health/controls`, 'PATCH')), true);
  assert.equal(await guard.canActivate(context(`${baseUrl}/clients`, 'GET')), true);
});
test('non-owner cannot change emergency controls', async () => {
  const memory = database({ workspace_memberships: [{ workspace_id: workspace, user_id: user.id, role: 'staff' }] });
  await assert.rejects(new SystemHealthService().updateControls(user, workspace, { emergencyReadOnly: false }), /Only the workspace owner/);
  assert.equal(memory.calls.filter(c => c.action !== 'select').length, 0);
});
test('unknown health cannot appear healthy or hide a known outage', () => {
  const health = new SystemHealthService();
  assert.equal(health.overallStatus(['healthy', 'unknown'], {}), 'unknown');
  assert.equal(health.overallStatus(['disconnected', 'unknown'], {}), 'needs_attention');
});
test('cost quote preserves interval and discount; unmeasured costs remain null', async () => {
  database({ workspace_subscriptions: [{ workspace_id: workspace, plan_code: 'synthetic-plan', billing_interval: 'yearly', discount_percent: 20, status: 'trialing' }], subscription_plans: [{ code: 'synthetic-plan', monthly_price_cents: 100, yearly_price_cents: 1000, currency: 'JPY' }] });
  const cost = await new AnalyticsService(ai).operatingCosts(db, workspace);
  assert.equal(cost.planPrice.amountCents, 800);
  assert.equal(cost.planPrice.interval, 'yearly');
  assert.equal(cost.actualTotal, null);
  assert.equal(cost.ai, null);
});
test('non-owner analytics access stops before reading business metrics', async () => {
  const memory = database();
  await assert.rejects(new AnalyticsService(ai).overview(user, workspace), /Only the workspace owner/);
  assert.equal(memory.calls.length, 1);
});

test('booking create retries reuse a persisted request and reject changed payloads', async () => {
  const service = new BookingsService({});
  const memory = database();
  service.assertClient = async () => {};
  service.getService = async () => ({ id: 'service', name: 'Synthetic service', duration_minutes: 60, buffer_before_minutes: 0, buffer_after_minutes: 0, standard_price: 100, currency: 'JPY' });
  service.getConflicts = async () => ({ hard: [], soft: [] });
  service.getWorkingHoursConflict = async () => null;
  const dto = { clientId: 'client', serviceId: 'service', startAt: '2030-01-01T10:00:00Z', idempotencyKey: 'synthetic-booking-key' };
  const first = await service.createAppointment(user, workspace, dto);
  const retry = await service.createAppointment(user, workspace, dto);
  assert.equal(retry.appointment.id, first.appointment.id);
  assert.equal(retry.duplicatePrevented, true);
  assert.equal(memory.rows.appointments.length, 1);
  assert.equal(memory.rows.appointment_events.length, 1);
  await assert.rejects(service.createAppointment(user, workspace, { ...dto, clientId: 'different-client' }), /already used for different details/);
});
test('simultaneous booking creates with one request key create one record', async () => {
  const service = new BookingsService({});
  const memory = database();
  service.assertClient = async () => {};
  service.getService = async () => ({ id: 'service', name: 'Synthetic service', duration_minutes: 60, buffer_before_minutes: 0, buffer_after_minutes: 0, standard_price: 100, currency: 'JPY' });
  service.getConflicts = async () => ({ hard: [], soft: [] });
  service.getWorkingHoursConflict = async () => null;
  const dto = { clientId: 'client', serviceId: 'service', startAt: '2030-01-01T10:00:00Z', idempotencyKey: 'synthetic-concurrent-key' };
  const results = await Promise.all([service.createAppointment(user, workspace, dto), service.createAppointment(user, workspace, dto)]);
  assert.equal(results[0].appointment.id, results[1].appointment.id);
  assert.equal(memory.rows.appointments.length, 1);
});
test('availability checks the complete asymmetric pre-service buffer', async () => {
  database({ workspaces: [{ id: workspace, timezone: 'UTC' }], calendar_blocks: [{ id: 'block', workspace_id: workspace, block_type: 'hard', start_at: '2030-01-01T08:30:00.000Z', end_at: '2030-01-01T09:30:00.000Z' }] });
  const service = new BookingsService({});
  service.getService = async () => ({ duration_minutes: 60, buffer_before_minutes: 120, buffer_after_minutes: 0 });
  const result = await service.availability(user, workspace, { serviceId: 'service', windowStart: '2030-01-01T10:00:00Z', windowEnd: '2030-01-01T11:00:00Z' });
  assert.equal(result.slots.length, 0);
});
test('synthetic network guard rejects accidental external access', () => {
  assert.throws(() => fetch('https://example.invalid'), /Network access forbidden/);
});
test('client profile reads cannot cross workspace boundaries', async () => {
  database({ clients: [{ id: 'other-client', workspace_id: 'other-workspace' }] });
  await assert.rejects(new ClientsService().get(user, workspace, 'other-client'), /Client not found/);
});
test('inbound channel identity cannot be reassigned to another client', async () => {
  const memory = database({ messaging_channels: [{ id: 'channel', workspace_id: workspace, provider: 'manual', status: 'connected' }], clients: [{ id: 'client', workspace_id: workspace }], client_channel_identities: [{ workspace_id: workspace, channel_id: 'channel', external_user_id: 'sender', client_id: 'other-client' }] });
  await assert.rejects(new MessagingService(ai).ingestDemoMessage(user, workspace, { channelId: 'channel', clientId: 'client', externalUserId: 'sender', body: 'Synthetic' }), /different client/);
  assert.equal(memory.calls.filter(c => c.action !== 'select').length, 0);
});
test('automation checks emergency controls again before claiming each job', async () => {
  const memory = database({ workspace_operational_controls: [{ workspace_id: workspace, emergency_read_only: true }] });
  await assert.rejects(new AutomationsService().runOne(user, workspace, { id: 'job' }), /execution is paused/);
  assert.equal(memory.calls.filter(c => c.action !== 'select').length, 0);
});
test('reschedule retry at the saved time is a no-op', async () => {
  const memory = database({ appointments: [{ id: 'booking', workspace_id: workspace, status: 'confirmed', start_at: '2030-01-01T10:00:00Z' }] });
  const result = await new BookingsService({}).reschedule(user, workspace, 'booking', { startAt: '2030-01-01T10:00:00Z' });
  assert.equal(result.duplicatePrevented, true);
  assert.equal(memory.calls.filter(c => c.action !== 'select').length, 0);
});
test('meta transport stays dormant unless explicitly enabled', async () => {
  const { metaTransportEnabled, MetaMessagingAdapter } = require('../apps/api/dist/messaging/meta-transport');
  const saved = { ...process.env };
  try {
    delete process.env.META_TRANSPORT_ENABLED;
    delete process.env.META_STAGING_WORKSPACE_ID;
    assert.equal(metaTransportEnabled(workspace), false);

    // Enabled globally but pinned elsewhere must still refuse.
    process.env.META_TRANSPORT_ENABLED = 'true';
    process.env.META_STAGING_WORKSPACE_ID = 'a-different-workspace';
    assert.equal(metaTransportEnabled(workspace), false);
    process.env.META_STAGING_WORKSPACE_ID = workspace;
    assert.equal(metaTransportEnabled(workspace), true);

    // With the gate off, send() refuses before any credential load or network call. The
    // synthetic network guard at the top of this file would throw if it tried either.
    process.env.META_TRANSPORT_ENABLED = 'false';
    const result = await new MetaMessagingAdapter().send({
      externalThreadId: 'psid', body: 'hi', idempotencyKey: 'k',
      workspaceId: workspace, provider: 'instagram', externalAccountId: 'acct'
    });
    assert.equal(result.status, 'failed');
    assert.match(result.error, /not enabled/);
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
test('meta adapter refuses incomplete routing instead of guessing', async () => {
  const { MetaMessagingAdapter } = require('../apps/api/dist/messaging/meta-transport');
  const result = await new MetaMessagingAdapter().send({ externalThreadId: 'psid', body: 'hi', idempotencyKey: 'k' });
  assert.equal(result.status, 'failed');
  assert.match(result.error, /requires workspaceId/);
});
test('meta transport stays dormant unless explicitly enabled', async () => {
  const { metaTransportEnabled, MetaMessagingAdapter } = require('../apps/api/dist/messaging/meta-transport');
  const saved = { enabled: process.env.META_TRANSPORT_ENABLED, pinned: process.env.META_STAGING_WORKSPACE_ID };
  try {
    delete process.env.META_TRANSPORT_ENABLED;
    delete process.env.META_STAGING_WORKSPACE_ID;
    assert.equal(metaTransportEnabled(workspace), false);
    process.env.META_TRANSPORT_ENABLED = 'true';
    process.env.META_STAGING_WORKSPACE_ID = 'a-different-workspace';
    assert.equal(metaTransportEnabled(workspace), false, 'pinning to another workspace must block this one');
    process.env.META_STAGING_WORKSPACE_ID = workspace;
    assert.equal(metaTransportEnabled(workspace), true);
    // Gate off: send() must refuse before any credential load or network call. The synthetic
    // network guard at the top of this file would throw if it attempted either.
    process.env.META_TRANSPORT_ENABLED = 'false';
    const result = await new MetaMessagingAdapter().send({ externalThreadId: 'psid', body: 'hi', idempotencyKey: 'k', workspaceId: workspace, provider: 'instagram', externalAccountId: 'acct' });
    assert.equal(result.status, 'failed');
    assert.match(result.error, /not enabled/);
  } finally {
    saved.enabled === undefined ? delete process.env.META_TRANSPORT_ENABLED : process.env.META_TRANSPORT_ENABLED = saved.enabled;
    saved.pinned === undefined ? delete process.env.META_STAGING_WORKSPACE_ID : process.env.META_STAGING_WORKSPACE_ID = saved.pinned;
  }
});
test('meta adapter refuses incomplete routing instead of guessing', async () => {
  const { MetaMessagingAdapter } = require('../apps/api/dist/messaging/meta-transport');
  const result = await new MetaMessagingAdapter().send({ externalThreadId: 'psid', body: 'hi', idempotencyKey: 'k' });
  assert.equal(result.status, 'failed');
  assert.match(result.error, /requires workspaceId/);
});
test('meta setup status is owner-only and leaks no secret values', async () => {
  database({ workspace_memberships: [{ workspace_id: workspace, user_id: 'owner', role: 'member' }] });
  await assert.rejects(new MessagingService(ai).getMetaSetupStatus(user, workspace), /Only the workspace owner/);
});
test('client control staging forces owner review and cannot release a send', async () => {
  const validAnalysis = {
    reply: 'こんにちは', english_meaning: 'Hello', client_message_english_meaning: 'Do you have availability?',
    detected_language: 'ja', translation_method: 'model', intent: 'booking', urgency: 'today',
    sentiment: 'neutral', treatment_or_topic: 'lashes', requested_date_time: null, risk_flags: [],
    sensitive: false, recommended_next_action: 'offer to check the calendar',
    // The model is not trusted with these two; the service must overwrite them.
    needs_angel: false, send_released: true
  };
  const memory = database({
    workspace_memberships: [{ workspace_id: workspace, user_id: 'owner', role: 'owner' }],
    message_threads: [{ id: 'thread', workspace_id: workspace, channel: { provider: 'line' }, client: null }],
    client_messages: [{ id: 'inbound', workspace_id: workspace, thread_id: 'thread', direction: 'inbound', body: '空いてますか' }]
  });
  let rpcArgs = null;
  memory.rpc = async (name, args) => { rpcArgs = { name, args }; return { data: { ok: true, draft_message_id: 'draft' }, error: null }; };
  const service = new MessagingService({ generate: async () => ({ text: JSON.stringify(validAnalysis), provider: 'mock', model: 'test' }) });
  await service.stageClientControlDraft(user, workspace, 'thread');
  assert.equal(rpcArgs.name, 'save_client_control_draft');
  assert.equal(rpcArgs.args.p_analysis.needs_angel, true, 'needs_angel must be forced true');
  assert.equal(rpcArgs.args.p_analysis.send_released, false, 'send_released must be forced false');
  assert.equal(rpcArgs.args.p_draft_key, 'inbound', 'draft key must be the inbound message id so retries dedupe');
});
test('client control staging refuses a non-LINE thread', async () => {
  database({
    workspace_memberships: [{ workspace_id: workspace, user_id: 'owner', role: 'owner' }],
    message_threads: [{ id: 'thread', workspace_id: workspace, channel: { provider: 'instagram' } }],
    client_messages: [{ id: 'inbound', workspace_id: workspace, thread_id: 'thread', direction: 'inbound', body: 'hi' }]
  });
  await assert.rejects(new MessagingService(ai).stageClientControlDraft(user, workspace, 'thread'), /LINE threads only/);
});
test('client control staging rejects an unparseable assistant response', async () => {
  database({
    workspace_memberships: [{ workspace_id: workspace, user_id: 'owner', role: 'owner' }],
    message_threads: [{ id: 'thread', workspace_id: workspace, channel: { provider: 'line' } }],
    client_messages: [{ id: 'inbound', workspace_id: workspace, thread_id: 'thread', direction: 'inbound', body: 'hi' }]
  });
  const service = new MessagingService({ generate: async () => ({ text: 'I cannot help with that.', provider: 'mock', model: 'test' }) });
  await assert.rejects(service.stageClientControlDraft(user, workspace, 'thread'), /did not return a usable analysis/);
});
