import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { createServiceSupabaseClient, createUserSupabaseClient } from '../config/supabase';
import type { UpdateAutomationRuleDto } from './dto/update-automation-rule.dto';

const DEFAULT_RULES = [
  { name: 'Booking confirmation', category: 'appointment', trigger_type: 'appointment_confirmed', action_type: 'owner_prompt', delay_minutes: 0, routine_category: 'booking_confirmation', action_config: { messageTemplate: 'Confirm the appointment and prepare the approved confirmation message.' } },
  { name: 'Aftercare follow-up', category: 'aftercare', trigger_type: 'appointment_completed', action_type: 'create_followup', delay_minutes: 60, routine_category: 'aftercare', action_config: { reason: 'Send approved aftercare and check that the client received it.' } },
  { name: 'Healing follow-up', category: 'followup', trigger_type: 'appointment_completed', action_type: 'create_followup', delay_minutes: 10080, routine_category: 'follow_up', action_config: { reason: 'Check healing progress and follow-up needs.' } }
];

@Injectable()
export class AutomationsService {
  async seedDefaults(user: AuthUser, workspaceId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data: existing, error } = await supabase.from('automation_rules').select('name').eq('workspace_id', workspaceId);
    if (error) throw new InternalServerErrorException(error.message);
    const names = new Set((existing ?? []).map((row: any) => row.name));
    const rows = DEFAULT_RULES.filter((rule) => !names.has(rule.name)).map((rule) => ({ ...rule, workspace_id: workspaceId, enabled: false, created_by: user.id }));
    if (rows.length) {
      const inserted = await supabase.from('automation_rules').insert(rows);
      if (inserted.error) throw new InternalServerErrorException(inserted.error.message);
    }
    return this.listRules(user, workspaceId);
  }

  async listRules(user: AuthUser, workspaceId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase.from('automation_rules').select('*').eq('workspace_id', workspaceId).order('created_at');
    if (error) throw new InternalServerErrorException(error.message);
    return data ?? [];
  }

  async updateRule(user: AuthUser, workspaceId: string, ruleId: string, dto: UpdateAutomationRuleDto) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.enabled !== undefined) updates.enabled = dto.enabled;
    if (dto.delayMinutes !== undefined) updates.delay_minutes = dto.delayMinutes;
    if (dto.messageTemplate !== undefined) updates.action_config = { messageTemplate: dto.messageTemplate.trim() };
    const { data, error } = await supabase.from('automation_rules').update(updates).eq('workspace_id', workspaceId).eq('id', ruleId).select('*').single();
    if (error || !data) throw new NotFoundException('Automation rule not found');
    return data;
  }

  async listJobs(user: AuthUser, workspaceId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase.from('automation_jobs').select('*,rule:automation_rules(name,category,trigger_type,action_type)').eq('workspace_id', workspaceId).order('scheduled_for', { ascending: false }).limit(100);
    if (error) throw new InternalServerErrorException(error.message);
    return data ?? [];
  }

  async queueForAppointmentEvent(user: AuthUser, workspaceId: string, appointmentId: string, triggerType: 'appointment_confirmed' | 'appointment_completed') {
    const supabase = createUserSupabaseClient(user.accessToken);
    const [{ data: appointment, error: apptError }, { data: rules, error: rulesError }] = await Promise.all([
      supabase.from('appointments').select('id,client_id,status,start_at,end_at,service_name').eq('workspace_id', workspaceId).eq('id', appointmentId).single(),
      supabase.from('automation_rules').select('*').eq('workspace_id', workspaceId).eq('trigger_type', triggerType).eq('enabled', true)
    ]);
    if (apptError || !appointment) throw new NotFoundException('Appointment not found');
    if (rulesError) throw new InternalServerErrorException(rulesError.message);
    const jobs = [];
    for (const rule of rules ?? []) {
      const scheduledFor = new Date(Date.now() + Number((rule as any).delay_minutes) * 60000).toISOString();
      const idempotencyKey = `${triggerType}:${appointmentId}:${(rule as any).id}`;
      const { data, error } = await supabase.from('automation_jobs').insert({ workspace_id: workspaceId, rule_id: (rule as any).id, client_id: appointment.client_id, appointment_id: appointmentId, scheduled_for: scheduledFor, idempotency_key: idempotencyKey, created_by: user.id }).select('*').single();
      if (error) {
        if ((error as any).code === '23505') continue;
        throw new InternalServerErrorException(error.message);
      }
      jobs.push(data);
    }
    return jobs;
  }

  async cancelAppointmentJobs(user: AuthUser, workspaceId: string, appointmentId: string) {
    // Authorization is established by the authenticated booking mutation. Job state is backend-controlled.
    const userClient = createUserSupabaseClient(user.accessToken);
    const { data: appointment, error: appointmentError } = await userClient.from('appointments').select('id').eq('workspace_id', workspaceId).eq('id', appointmentId).single();
    if (appointmentError || !appointment) throw new NotFoundException('Appointment not found');
    const service = createServiceSupabaseClient();
    const { error } = await service.from('automation_jobs').update({ status: 'cancelled', updated_at: new Date().toISOString(), evidence: { reason: 'appointment_cancelled' } }).eq('workspace_id', workspaceId).eq('appointment_id', appointmentId).eq('status', 'pending');
    if (error) throw new InternalServerErrorException(error.message);
  }

  async processDue(user: AuthUser, workspaceId: string, limit = 20) {
    // Service-role execution must first prove the caller belongs to the requested workspace.
    const userClient = createUserSupabaseClient(user.accessToken);
    const { data: workspace, error: workspaceError } = await userClient.from('workspaces').select('id').eq('id', workspaceId).single();
    if (workspaceError || !workspace) throw new NotFoundException('Workspace not found');
    const service = createServiceSupabaseClient();
    const { data: controls, error: controlsError } = await service.from('workspace_operational_controls').select('pause_automations,emergency_read_only').eq('workspace_id', workspaceId).single();
    if (controlsError) throw new InternalServerErrorException(controlsError.message);
    if (controls?.emergency_read_only) throw new ConflictException('AngelOS is in emergency read-only mode. Background writes are paused.');
    if (controls?.pause_automations) throw new ConflictException('Automations are paused by the workspace owner.');
    const { data: jobs, error } = await service.from('automation_jobs').select('*,rule:automation_rules(*)').eq('workspace_id', workspaceId).eq('status', 'pending').lte('scheduled_for', new Date().toISOString()).order('scheduled_for').limit(Math.min(Math.max(limit, 1), 100));
    if (error) throw new InternalServerErrorException(error.message);
    const results = [];
    for (const job of jobs ?? []) results.push(await this.runOne(user, workspaceId, job as any));
    return results;
  }

  private async runOne(user: AuthUser, workspaceId: string, job: any) {
    const service = createServiceSupabaseClient();
    await service.from('automation_jobs').update({ status: 'running', attempt_count: job.attempt_count + 1, updated_at: new Date().toISOString() }).eq('workspace_id', workspaceId).eq('id', job.id);
    try {
      const { data: appointment } = job.appointment_id ? await service.from('appointments').select('*').eq('workspace_id', workspaceId).eq('id', job.appointment_id).maybeSingle() : { data: null } as any;
      if (job.rule.trigger_type === 'appointment_confirmed' && (!appointment || !['confirmed','arrival_info_sent','checked_in'].includes(appointment.status))) {
        return await this.finishJob(service, workspaceId, job.id, 'skipped', { reason: 'appointment_state_changed', status: appointment?.status ?? 'missing' });
      }
      if (job.rule.trigger_type === 'appointment_completed' && (!appointment || appointment.status !== 'completed')) {
        return await this.finishJob(service, workspaceId, job.id, 'skipped', { reason: 'appointment_not_completed', status: appointment?.status ?? 'missing' });
      }
      if (job.rule.action_type === 'create_followup') {
        const reason = job.rule.action_config?.reason || job.rule.name;
        const { error } = await service.from('client_followups').insert({ workspace_id: workspaceId, client_id: job.client_id, reason, due_at: new Date().toISOString(), status: 'open', auto_message_allowed: false, created_by: user.id });
        if (error) throw new Error(error.message);
        return await this.finishJob(service, workspaceId, job.id, 'succeeded', { action: 'followup_created', reason });
      }
      if (job.rule.action_type === 'owner_prompt') {
        return await this.finishJob(service, workspaceId, job.id, 'needs_owner', { action: 'owner_prompt', message: job.rule.action_config?.messageTemplate || job.rule.name });
      }
      if (job.rule.action_type === 'client_message') {
        return await this.finishJob(service, workspaceId, job.id, 'needs_owner', { action: 'client_message', reason: 'A verified provider/template route is required before automated delivery.' });
      }
      throw new ConflictException('Unsupported automation action');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown automation failure';
      await service.from('automation_jobs').update({ status: 'failed', last_error: message, updated_at: new Date().toISOString() }).eq('workspace_id', workspaceId).eq('id', job.id);
      return { id: job.id, status: 'failed', error: message };
    }
  }

  private async finishJob(service: ReturnType<typeof createServiceSupabaseClient>, workspaceId: string, jobId: string, status: string, evidence: Record<string, unknown>) {
    const { data, error } = await service.from('automation_jobs').update({ status, evidence, updated_at: new Date().toISOString() }).eq('workspace_id', workspaceId).eq('id', jobId).select('*').single();
    if (error) throw new Error(error.message);
    return data;
  }
}
