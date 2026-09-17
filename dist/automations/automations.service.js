"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_1 = require("../config/supabase");
const DEFAULT_RULES = [
    { name: 'Booking confirmation', category: 'appointment', trigger_type: 'appointment_confirmed', action_type: 'owner_prompt', delay_minutes: 0, routine_category: 'booking_confirmation', action_config: { messageTemplate: 'Confirm the appointment and prepare the approved confirmation message.' } },
    { name: 'Aftercare follow-up', category: 'aftercare', trigger_type: 'appointment_completed', action_type: 'create_followup', delay_minutes: 60, routine_category: 'aftercare', action_config: { reason: 'Send approved aftercare and check that the client received it.' } },
    { name: 'Healing follow-up', category: 'followup', trigger_type: 'appointment_completed', action_type: 'create_followup', delay_minutes: 10080, routine_category: 'follow_up', action_config: { reason: 'Check healing progress and follow-up needs.' } },
    { name: 'Treatment recorded — aftercare', category: 'aftercare', trigger_type: 'treatment_recorded', action_type: 'create_followup', delay_minutes: 0, routine_category: 'aftercare', action_config: { reason: 'Client just had a treatment recorded. Send approved aftercare and check they received it.' } },
    { name: 'Treatment recorded — follow-up', category: 'followup', trigger_type: 'treatment_recorded', action_type: 'create_followup', delay_minutes: 0, routine_category: 'follow_up', action_config: { reason: 'Treatment recorded. Flag for owner follow-up if the client has open needs.' } },
];
let AutomationsService = class AutomationsService {
    async seedDefaults(user, workspaceId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: existing, error } = await supabase.from('automation_rules').select('name').eq('workspace_id', workspaceId);
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        const names = new Set((existing ?? []).map((row) => row.name));
        const rows = DEFAULT_RULES.filter((rule) => !names.has(rule.name)).map((rule) => ({ ...rule, workspace_id: workspaceId, enabled: false, created_by: user.id }));
        if (rows.length) {
            const inserted = await supabase.from('automation_rules').insert(rows);
            if (inserted.error)
                throw new common_1.InternalServerErrorException(inserted.error.message);
        }
        return this.listRules(user, workspaceId);
    }
    async listRules(user, workspaceId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase.from('automation_rules').select('*').eq('workspace_id', workspaceId).order('created_at');
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data ?? [];
    }
    async updateRule(user, workspaceId, ruleId, dto) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const updates = { updated_at: new Date().toISOString() };
        if (dto.enabled !== undefined)
            updates.enabled = dto.enabled;
        if (dto.delayMinutes !== undefined)
            updates.delay_minutes = dto.delayMinutes;
        if (dto.messageTemplate !== undefined)
            updates.action_config = { messageTemplate: dto.messageTemplate.trim() };
        const { data, error } = await supabase.from('automation_rules').update(updates).eq('workspace_id', workspaceId).eq('id', ruleId).select('*').single();
        if (error || !data)
            throw new common_1.NotFoundException('Automation rule not found');
        return data;
    }
    async listJobs(user, workspaceId) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data, error } = await supabase.from('automation_jobs').select('*,rule:automation_rules(name,category,trigger_type,action_type)').eq('workspace_id', workspaceId).order('scheduled_for', { ascending: false }).limit(100);
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return data ?? [];
    }
    async queueForAppointmentEvent(user, workspaceId, appointmentId, triggerType) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const [{ data: appointment, error: apptError }, { data: rules, error: rulesError }] = await Promise.all([
            supabase.from('appointments').select('id,client_id,status,start_at,end_at,service_name').eq('workspace_id', workspaceId).eq('id', appointmentId).single(),
            supabase.from('automation_rules').select('*').eq('workspace_id', workspaceId).eq('trigger_type', triggerType).eq('enabled', true)
        ]);
        if (apptError || !appointment)
            throw new common_1.NotFoundException('Appointment not found');
        if (rulesError)
            throw new common_1.InternalServerErrorException(rulesError.message);
        const jobs = [];
        for (const rule of rules ?? []) {
            const scheduledFor = new Date(Date.now() + Number(rule.delay_minutes) * 60000).toISOString();
            const idempotencyKey = `${triggerType}:${appointmentId}:${rule.id}`;
            const { data, error } = await supabase.from('automation_jobs').insert({ workspace_id: workspaceId, rule_id: rule.id, client_id: appointment.client_id, appointment_id: appointmentId, scheduled_for: scheduledFor, idempotency_key: idempotencyKey, created_by: user.id }).select('*').single();
            if (error) {
                if (error.code === '23505')
                    continue;
                throw new common_1.InternalServerErrorException(error.message);
            }
            jobs.push(data);
        }
        return jobs;
    }
    async handleTreatmentRecorded(user, workspaceId, clientId, treatmentData) {
        const supabase = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const eventId = crypto.randomUUID();
        try {
            await supabase
                .from('automation_events')
                .insert({
                id: eventId,
                workspace_id: workspaceId,
                event_type: 'treatment_recorded',
                client_id: clientId,
                payload: treatmentData,
                created_by: user.id,
            })
                .select('id')
                .single();
        }
        catch {
        }
        const [{ data: client, error: clientError }, { data: rules, error: rulesError }] = await Promise.all([
            supabase.from('clients').select('id,display_name').eq('workspace_id', workspaceId).eq('id', clientId).single(),
            supabase.from('automation_rules').select('*').eq('workspace_id', workspaceId).eq('trigger_type', 'treatment_recorded').eq('enabled', true),
        ]);
        if (clientError || !client)
            throw new common_1.NotFoundException('Client not found');
        if (rulesError)
            throw new common_1.InternalServerErrorException(rulesError.message);
        const jobs = [];
        for (const rule of rules ?? []) {
            const scheduledFor = new Date(Date.now() + Number(rule.delay_minutes) * 60000).toISOString();
            const idempotencyKey = `treatment_recorded:${clientId}:${rule.id}`;
            const { data, error } = await supabase.from('automation_jobs').insert({
                workspace_id: workspaceId,
                rule_id: rule.id,
                client_id: clientId,
                appointment_id: null,
                scheduled_for: scheduledFor,
                idempotency_key: idempotencyKey,
                created_by: user.id,
                evidence: { event_type: 'treatment_recorded', event_id: eventId, service_name: treatmentData?.service_name || null },
            }).select('*').single();
            if (error) {
                if (error.code === '23505')
                    continue;
                throw new common_1.InternalServerErrorException(error.message);
            }
            jobs.push(data);
        }
        return { client, jobs };
    }
    async cancelAppointmentJobs(user, workspaceId, appointmentId) {
        const userClient = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: appointment, error: appointmentError } = await userClient.from('appointments').select('id').eq('workspace_id', workspaceId).eq('id', appointmentId).single();
        if (appointmentError || !appointment)
            throw new common_1.NotFoundException('Appointment not found');
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { error } = await service.from('automation_jobs').update({ status: 'cancelled', updated_at: new Date().toISOString(), evidence: { reason: 'appointment_cancelled' } }).eq('workspace_id', workspaceId).eq('appointment_id', appointmentId).eq('status', 'pending');
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
    }
    async processDue(user, workspaceId, limit = 20) {
        const userClient = (0, supabase_1.createUserSupabaseClient)(user.accessToken);
        const { data: workspace, error: workspaceError } = await userClient.from('workspaces').select('id').eq('id', workspaceId).single();
        if (workspaceError || !workspace)
            throw new common_1.NotFoundException('Workspace not found');
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const { data: controls, error: controlsError } = await service.from('workspace_operational_controls').select('pause_automations,emergency_read_only').eq('workspace_id', workspaceId).single();
        if (controlsError)
            throw new common_1.InternalServerErrorException(controlsError.message);
        if (controls?.emergency_read_only)
            throw new common_1.ConflictException('AngelOS is in emergency read-only mode. Background writes are paused.');
        if (controls?.pause_automations)
            throw new common_1.ConflictException('Automations are paused by the workspace owner.');
        const { data: jobs, error } = await service.from('automation_jobs').select('*,rule:automation_rules(*)').eq('workspace_id', workspaceId).eq('status', 'pending').lte('scheduled_for', new Date().toISOString()).order('scheduled_for').limit(Math.min(Math.max(limit, 1), 100));
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        const results = [];
        for (const job of jobs ?? [])
            results.push(await this.runOne(user, workspaceId, job));
        return results;
    }
    async runOne(user, workspaceId, job) {
        const service = (0, supabase_1.createServiceSupabaseClient)();
        const controls = await service.from('workspace_operational_controls').select('pause_automations,emergency_read_only').eq('workspace_id', workspaceId).single();
        if (controls.error || !controls.data)
            throw new common_1.InternalServerErrorException('Operational safety controls unavailable');
        if (controls.data.pause_automations || controls.data.emergency_read_only)
            throw new common_1.ConflictException('Automation execution is paused');
        const { data: claimed, error: claimError } = await service.from('automation_jobs').update({ status: 'running', attempt_count: job.attempt_count + 1, updated_at: new Date().toISOString() }).eq('workspace_id', workspaceId).eq('id', job.id).eq('status', 'pending').select('id').maybeSingle();
        if (claimError)
            throw new common_1.InternalServerErrorException(claimError.message);
        if (!claimed)
            return { id: job.id, status: 'skipped', reason: 'already_claimed' };
        try {
            if (job.rule?.enabled === false)
                return await this.finishJob(service, workspaceId, job.id, 'skipped', { reason: 'rule_disabled' });
            const { data: appointment, error: appointmentError } = job.appointment_id ? await service.from('appointments').select('*').eq('workspace_id', workspaceId).eq('id', job.appointment_id).maybeSingle() : { data: null, error: null };
            if (appointmentError)
                throw new Error(appointmentError.message);
            if (job.rule.trigger_type === 'appointment_confirmed' && (!appointment || !['confirmed', 'arrival_info_sent', 'checked_in'].includes(appointment.status))) {
                return await this.finishJob(service, workspaceId, job.id, 'skipped', { reason: 'appointment_state_changed', status: appointment?.status ?? 'missing' });
            }
            if (job.rule.trigger_type === 'appointment_completed' && (!appointment || appointment.status !== 'completed')) {
                return await this.finishJob(service, workspaceId, job.id, 'skipped', { reason: 'appointment_not_completed', status: appointment?.status ?? 'missing' });
            }
            if (job.rule.action_type === 'create_followup') {
                const reason = job.rule.action_config?.reason || job.rule.name;
                const { error } = await service.from('client_followups').insert({ workspace_id: workspaceId, client_id: job.client_id, reason, due_at: new Date().toISOString(), status: 'open', auto_message_allowed: false, created_by: user.id });
                if (error)
                    throw new Error(error.message);
                return await this.finishJob(service, workspaceId, job.id, 'succeeded', { action: 'followup_created', reason });
            }
            if (job.rule.action_type === 'owner_prompt') {
                return await this.finishJob(service, workspaceId, job.id, 'needs_owner', { action: 'owner_prompt', message: job.rule.action_config?.messageTemplate || job.rule.name });
            }
            if (job.rule.action_type === 'client_message') {
                return await this.finishJob(service, workspaceId, job.id, 'needs_owner', { action: 'client_message', reason: 'A verified provider/template route is required before automated delivery.' });
            }
            throw new common_1.ConflictException('Unsupported automation action');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown automation failure';
            await service.from('automation_jobs').update({ status: 'failed', last_error: message, updated_at: new Date().toISOString() }).eq('workspace_id', workspaceId).eq('id', job.id);
            return { id: job.id, status: 'failed', error: message };
        }
    }
    async finishJob(service, workspaceId, jobId, status, evidence) {
        const { data, error } = await service.from('automation_jobs').update({ status, evidence, updated_at: new Date().toISOString() }).eq('workspace_id', workspaceId).eq('id', jobId).select('*').single();
        if (error)
            throw new Error(error.message);
        return data;
    }
};
exports.AutomationsService = AutomationsService;
exports.AutomationsService = AutomationsService = __decorate([
    (0, common_1.Injectable)()
], AutomationsService);
//# sourceMappingURL=automations.service.js.map