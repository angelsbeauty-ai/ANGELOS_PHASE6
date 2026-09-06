import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { createServiceSupabaseClient, createUserSupabaseClient } from '../config/supabase';
import type { UpdateOperationalControlsDto } from './dto/update-operational-controls.dto';

type HealthStatus = 'healthy' | 'degraded' | 'needs_attention' | 'disconnected' | 'paused' | 'unknown';
type Severity = 'urgent' | 'today' | 'later';

interface HealthFinding {
  component: string;
  capability?: string;
  provider?: string | null;
  status: HealthStatus;
  summary: string;
  actionPath?: string | null;
  impact?: Record<string, unknown>;
  details?: Record<string, unknown>;
  attention?: {
    severity: Severity;
    category: 'system' | 'integration' | 'automation' | 'messaging' | 'content' | 'booking' | 'finance' | 'security';
    dedupeKey: string;
    title: string;
    summary: string;
    sourceType?: string;
    sourceId?: string;
  };
}

@Injectable()
export class SystemHealthService {
  async getOverview(user: AuthUser, workspaceId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    await this.assertWorkspaceAccess(supabase, workspaceId);
    const [{ data: components, error: componentsError }, { data: attention, error: attentionError }, { data: controls, error: controlsError }] = await Promise.all([
      supabase.from('system_health_components').select('*').eq('workspace_id', workspaceId).order('component'),
      supabase.from('attention_items').select('*').eq('workspace_id', workspaceId).in('status', ['open', 'acknowledged']).order('last_seen_at', { ascending: false }),
      supabase.from('workspace_operational_controls').select('*').eq('workspace_id', workspaceId).single()
    ]);
    if (componentsError) throw new InternalServerErrorException(componentsError.message);
    if (attentionError) throw new InternalServerErrorException(attentionError.message);
    if (controlsError) throw new InternalServerErrorException(controlsError.message);
    const counts = { urgent: 0, today: 0, later: 0 };
    for (const item of attention ?? []) {
      if (item.status === 'open' && item.severity in counts) counts[item.severity as keyof typeof counts] += 1;
    }
    return {
      overallStatus: this.overallStatus((components ?? []).map((row: any) => row.status), controls),
      counts,
      controls,
      components: components ?? [],
      attention: this.sortAttention(attention ?? [])
    };
  }

  async runHealthCheck(user: AuthUser, workspaceId: string) {
    const userClient = createUserSupabaseClient(user.accessToken);
    await this.assertWorkspaceAccess(userClient, workspaceId);
    const service = createServiceSupabaseClient();
    const now = new Date().toISOString();
    const findings: HealthFinding[] = [];

    findings.push({ component: 'database', status: 'healthy', summary: 'AngelOS business database is reachable.', details: { verification: 'workspace_read_succeeded' } });

    const { data: controls, error: controlsError } = await service.from('workspace_operational_controls').select('*').eq('workspace_id', workspaceId).single();
    if (controlsError || !controls) throw new InternalServerErrorException('Operational safety controls unavailable');
    if (controls.emergency_read_only) findings.push({ component: 'operations', status: 'paused', summary: 'Emergency read-only mode is enabled.', actionPath: '/system-health', impact: { writesPaused: true } });
    if (controls?.pause_ai_actions) findings.push({ component: 'ai', capability: 'actions', status: 'paused', summary: 'AI actions are paused by the owner.', actionPath: '/system-health', impact: { chatStillAvailable: true, mutationsPaused: true } });
    // A key alone does not mean real AI is running: AI_PROVIDER_MODE decides which provider is
    // used, and anything other than 'openai' serves canned mock responses. Reporting "healthy"
    // while every answer is a mock is the more dangerous failure, so it is called out explicitly.
    else if ((process.env.AI_PROVIDER_MODE ?? 'mock') !== 'openai') findings.push({
      component: 'ai', capability: 'actions', status: 'needs_attention',
      summary: `AI is running in ${process.env.AI_PROVIDER_MODE ?? 'mock'} mode, so replies and actions are simulated, not real.`,
      actionPath: '/system-health', details: { externalProviderPinged: false, providerMode: process.env.AI_PROVIDER_MODE ?? 'mock' },
      attention: { severity: 'today', category: 'system', dedupeKey: 'ai:provider_mode_not_live', title: 'AI is in mock mode', summary: 'AngelOS is answering with simulated AI output. Set AI_PROVIDER_MODE=openai for real responses.', sourceType: 'ai_provider' }
    });
    else if (process.env.OPENAI_API_KEY) findings.push({ component: 'ai', capability: 'actions', status: 'healthy', summary: 'AI action layer is configured.', details: { externalProviderPinged: false, providerMode: 'openai' } });
    else findings.push({
      component: 'ai', capability: 'actions', status: 'needs_attention', summary: 'AI provider key is not configured in this environment.', actionPath: '/system-health', details: { externalProviderPinged: false },
      attention: { severity: 'today', category: 'system', dedupeKey: 'ai:provider_not_configured', title: 'AI provider needs configuration', summary: 'AngelOS can load the app, but AI responses/actions will not work until the server-side AI provider key is configured.', sourceType: 'ai_provider' }
    });

    try {
      const { data: bucket, error: bucketError } = await service.storage.getBucket('angelos-media');
      if (bucketError || !bucket) findings.push({
        component: 'storage', capability: 'media_library', status: 'needs_attention', summary: 'AngelOS media storage could not be verified.', actionPath: '/media', details: { error: bucketError?.message ?? 'bucket_missing' },
        attention: { severity: 'urgent', category: 'system', dedupeKey: 'storage:media_bucket_unavailable', title: 'Media storage needs attention', summary: 'AngelOS could not verify the private media library. Avoid relying on new client media uploads until storage is restored.', sourceType: 'storage' }
      });
      else findings.push({ component: 'storage', capability: 'media_library', status: 'healthy', summary: 'Private AngelOS media storage is available.', details: { bucket: bucket.name } });
    } catch (caught) {
      findings.push({ component: 'storage', capability: 'media_library', status: 'degraded', summary: 'AngelOS could not complete the media-storage health check.', actionPath: '/media', details: { error: caught instanceof Error ? caught.message : 'unknown_error' } });
    }

    if (controls?.pause_automations) findings.push({ component: 'automations', status: 'paused', summary: 'Automations are paused by the owner.', actionPath: '/automations' });
    else {
      const { data: failedJobs, error: jobsError } = await service.from('automation_jobs').select('id,last_error,scheduled_for,rule:automation_rules(name)').eq('workspace_id', workspaceId).eq('status', 'failed').order('updated_at', { ascending: false }).limit(25);
      if (jobsError) throw new InternalServerErrorException(jobsError.message);
      if ((failedJobs ?? []).length) {
        findings.push({
          component: 'automations', status: 'needs_attention', summary: `${failedJobs!.length} automation job${failedJobs!.length === 1 ? '' : 's'} failed and need review.`, actionPath: '/automations',
          impact: { failedJobs: failedJobs!.length },
          attention: { severity: 'today', category: 'automation', dedupeKey: 'automation:failed_jobs', title: 'Automation failures need review', summary: `${failedJobs!.length} automation job${failedJobs!.length === 1 ? '' : 's'} failed. AngelOS will not silently treat them as complete.`, sourceType: 'automation_job' }
        });
      } else findings.push({ component: 'automations', status: 'healthy', summary: 'No failed automation jobs are currently detected.' });
    }

    const { data: channels, error: channelsError } = await service.from('messaging_channels').select('id,provider,display_name,status,capabilities').eq('workspace_id', workspaceId);
    if (channelsError) throw new InternalServerErrorException(channelsError.message);
    if (!(channels ?? []).length) findings.push({ component: 'messaging', status: 'unknown', summary: 'No messaging channels are connected yet.' });
    for (const channel of channels ?? []) {
      const provider = String(channel.provider);
      const status = provider !== 'manual' && channel.status === 'connected' ? 'needs_attention' : this.mapConnectionStatus(channel.status);
      findings.push({
        component: 'messaging', capability: `channel:${channel.id}`, provider, status,
        summary: provider !== 'manual' && channel.status === 'connected' ? `${channel.display_name}: live delivery transport is not implemented.` : status === 'healthy' ? `${channel.display_name} demo messaging is connected.` : `${channel.display_name} messaging status: ${channel.status}.`,
        actionPath: '/messages', details: { capabilities: channel.capabilities ?? {} },
        attention: ['needs_attention', 'disconnected'].includes(status) ? { severity: 'today', category: 'integration', dedupeKey: `messaging:${channel.id}:${channel.status}`, title: `${channel.display_name} needs attention`, summary: `Messaging is ${channel.status}. Review the connection before relying on automated sends.`, sourceType: 'messaging_channel', sourceId: channel.id } : undefined
      });
    }

    const { data: failedSends, error: sendsError } = await service.from('client_messages').select('id,thread_id,created_at').eq('workspace_id', workspaceId).eq('direction', 'outbound').eq('status', 'failed').order('created_at', { ascending: false }).limit(25);
    if (sendsError) throw new InternalServerErrorException(sendsError.message);
    if ((failedSends ?? []).length) findings.push({
      component: 'messaging', capability: 'delivery', status: 'needs_attention', summary: `${failedSends!.length} outbound message${failedSends!.length === 1 ? '' : 's'} failed to send.`, actionPath: '/messages', impact: { failedMessages: failedSends!.length },
      attention: { severity: 'today', category: 'messaging', dedupeKey: 'messaging:failed_outbound', title: 'Client messages failed to send', summary: `${failedSends!.length} outbound message${failedSends!.length === 1 ? '' : 's'} failed. Review them before retrying to avoid duplicates.`, sourceType: 'client_message' }
    });

    const { data: failedPublishes, error: publishError } = await service.from('content_variants').select('id,platform,scheduled_for').eq('workspace_id', workspaceId).eq('status', 'failed').order('updated_at', { ascending: false }).limit(25);
    if (publishError) throw new InternalServerErrorException(publishError.message);
    if ((failedPublishes ?? []).length) findings.push({
      component: 'publishing', status: 'needs_attention', summary: `${failedPublishes!.length} content item${failedPublishes!.length === 1 ? '' : 's'} failed to publish.`, actionPath: '/content', impact: { failedPublishes: failedPublishes!.length },
      attention: { severity: 'today', category: 'content', dedupeKey: 'content:failed_publish', title: 'Scheduled content failed to publish', summary: `${failedPublishes!.length} content item${failedPublishes!.length === 1 ? '' : 's'} failed. AngelOS will not mark them published without provider verification.`, sourceType: 'content_variant' }
    });
    else findings.push({ component: 'publishing', status: 'healthy', summary: 'No failed content publishing records are currently detected.' });

    const { data: overdue, error: overdueError } = await service.from('automation_jobs').select('id,scheduled_for').eq('workspace_id', workspaceId).eq('status', 'pending').lt('scheduled_for', new Date(Date.now() - 15 * 60 * 1000).toISOString()).limit(25);
    if (overdueError) throw new InternalServerErrorException(overdueError.message);
    if ((overdue ?? []).length && !controls?.pause_automations) findings.push({
      component: 'background_jobs', status: 'degraded', summary: `${overdue!.length} background job${overdue!.length === 1 ? '' : 's'} appear overdue.`, actionPath: '/automations', impact: { overdueJobs: overdue!.length },
      attention: { severity: 'today', category: 'system', dedupeKey: 'background:overdue_jobs', title: 'Background work is delayed', summary: `${overdue!.length} job${overdue!.length === 1 ? '' : 's'} are more than 15 minutes overdue. Check the worker before relying on delayed actions.`, sourceType: 'automation_job' }
    });

    const { data: ownerThreads, error: ownerThreadsError } = await service.from('message_threads').select('id,contact_display_name,priority,summary').eq('workspace_id', workspaceId).eq('needs_owner', true).neq('status', 'done').limit(50);
    if (ownerThreadsError) throw new InternalServerErrorException(ownerThreadsError.message);
    for (const thread of ownerThreads ?? []) {
      findings.push({
        component: 'owner_work', capability: `message:${thread.id}`, status: 'needs_attention', summary: `A client conversation needs the owner.`, actionPath: `/messages/${thread.id}`,
        attention: { severity: ['urgent','today','later'].includes(thread.priority) ? thread.priority as Severity : 'today', category: 'messaging', dedupeKey: `workflow:message:${thread.id}`, title: `${thread.contact_display_name || 'Client'} needs your reply`, summary: thread.summary || 'AngelOS needs your decision before continuing this conversation.', sourceType: 'message_thread', sourceId: thread.id }
      });
    }

    const { data: ownerJobs, error: ownerJobsError } = await service.from('automation_jobs').select('id,evidence,scheduled_for,rule:automation_rules(name)').eq('workspace_id', workspaceId).eq('status', 'needs_owner').limit(50);
    if (ownerJobsError) throw new InternalServerErrorException(ownerJobsError.message);
    for (const job of ownerJobs ?? []) {
      findings.push({
        component: 'owner_work', capability: `automation:${job.id}`, status: 'needs_attention', summary: 'An automation stopped safely for owner review.', actionPath: '/automations',
        attention: { severity: 'today', category: 'automation', dedupeKey: `workflow:automation:${job.id}`, title: (job as any).rule?.name || 'Automation needs your decision', summary: String((job as any).evidence?.message || 'AngelOS stopped before taking an action that needs owner approval.'), sourceType: 'automation_job', sourceId: job.id }
      });
    }

    const upcomingLimit = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: pendingAppointments, error: pendingError } = await service.from('appointments').select('id,service_name,start_at,client:clients(display_name)').eq('workspace_id', workspaceId).eq('status', 'confirmation_pending').lte('start_at', upcomingLimit).gte('start_at', now).limit(50);
    if (pendingError) throw new InternalServerErrorException(pendingError.message);
    for (const appointment of pendingAppointments ?? []) {
      findings.push({
        component: 'owner_work', capability: `booking:${appointment.id}`, status: 'needs_attention', summary: 'An upcoming booking still needs confirmation.', actionPath: '/calendar',
        attention: { severity: 'today', category: 'booking', dedupeKey: `workflow:booking:${appointment.id}`, title: `Upcoming booking is not confirmed`, summary: `${(appointment as any).client?.display_name || 'Client'} · ${appointment.service_name} · ${new Date(appointment.start_at).toLocaleString()}`, sourceType: 'appointment', sourceId: appointment.id }
      });
    }

    await this.persistFindings(service, workspaceId, findings, now);
    await this.cleanupStaleComponents(service, workspaceId, findings);
    await this.resolveClearedAttention(service, workspaceId, findings, now);
    return this.getOverview(user, workspaceId);
  }

  async listAttention(user: AuthUser, workspaceId: string) {
    const supabase = createUserSupabaseClient(user.accessToken);
    await this.assertWorkspaceAccess(supabase, workspaceId);
    const { data, error } = await supabase.from('attention_items').select('*').eq('workspace_id', workspaceId).neq('status', 'resolved').order('last_seen_at', { ascending: false });
    if (error) throw new InternalServerErrorException(error.message);
    return this.sortAttention(data ?? []);
  }

  async acknowledgeAttention(user: AuthUser, workspaceId: string, attentionId: string) {
    const userClient = createUserSupabaseClient(user.accessToken);
    await this.assertWorkspaceAccess(userClient, workspaceId);
    const service = createServiceSupabaseClient();
    const now = new Date().toISOString();
    const { data, error } = await service.from('attention_items').update({ status: 'acknowledged', acknowledged_at: now, acknowledged_by: user.id, updated_at: now }).eq('workspace_id', workspaceId).eq('id', attentionId).neq('status', 'resolved').select('*').single();
    if (error || !data) throw new NotFoundException('Attention item not found');
    return data;
  }

  async updateControls(user: AuthUser, workspaceId: string, dto: UpdateOperationalControlsDto) {
    const membershipClient = createUserSupabaseClient(user.accessToken);
    const { data: owner, error: ownerError } = await membershipClient.from('workspace_memberships').select('role').eq('workspace_id', workspaceId).eq('user_id', user.id).eq('role', 'owner').maybeSingle();
    if (ownerError || !owner) throw new ForbiddenException('Only the workspace owner can change operational controls');
    const userClient = createUserSupabaseClient(user.accessToken);
    await this.assertWorkspaceAccess(userClient, workspaceId);
    const service = createServiceSupabaseClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: user.id };
    if (dto.pauseAiActions !== undefined) updates.pause_ai_actions = dto.pauseAiActions;
    if (dto.pauseAutomations !== undefined) updates.pause_automations = dto.pauseAutomations;
    if (dto.emergencyReadOnly !== undefined) updates.emergency_read_only = dto.emergencyReadOnly;
    if (dto.reason !== undefined) updates.reason = dto.reason.trim() || null;
    const { data, error } = await service.from('workspace_operational_controls').update(updates).eq('workspace_id', workspaceId).select('*').single();
    if (error || !data) throw new NotFoundException('Workspace operational controls not found');
    return data;
  }

  private async persistFindings(service: ReturnType<typeof createServiceSupabaseClient>, workspaceId: string, findings: HealthFinding[], now: string) {
    for (const finding of findings) {
      const row = {
        workspace_id: workspaceId, component: finding.component, capability: finding.capability ?? 'core', provider: finding.provider ?? null,
        status: finding.status, summary: finding.summary, impact: finding.impact ?? {}, details: finding.details ?? {}, action_path: finding.actionPath ?? null,
        last_checked_at: now, last_success_at: finding.status === 'healthy' ? now : undefined, updated_at: now
      };
      const { error } = await service.from('system_health_components').upsert(row, { onConflict: 'workspace_id,component,capability' });
      if (error) throw new InternalServerErrorException(error.message);
      if (finding.attention) await this.upsertAttention(service, workspaceId, finding.attention, finding, now);
    }
  }

  private async upsertAttention(service: ReturnType<typeof createServiceSupabaseClient>, workspaceId: string, attention: NonNullable<HealthFinding['attention']>, finding: HealthFinding, now: string) {
    const row = {
      workspace_id: workspaceId, severity: attention.severity, category: attention.category, managed_by: 'system_health', dedupe_key: attention.dedupeKey,
      title: attention.title, summary: attention.summary, status: 'open', source_type: attention.sourceType ?? null, source_id: attention.sourceId ?? null,
      action_path: finding.actionPath ?? null, impact: finding.impact ?? {}, evidence: finding.details ?? {}, last_seen_at: now, resolved_at: null, updated_at: now
    };
    const { data: existing } = await service.from('attention_items').select('id,first_seen_at,status').eq('workspace_id', workspaceId).eq('dedupe_key', attention.dedupeKey).maybeSingle();
    if (existing?.status === 'acknowledged') row.status = 'acknowledged';
    const { error } = existing
      ? await service.from('attention_items').update(row).eq('workspace_id', workspaceId).eq('id', existing.id)
      : await service.from('attention_items').insert({ ...row, first_seen_at: now });
    if (error) throw new InternalServerErrorException(error.message);
  }

  private async resolveClearedAttention(service: ReturnType<typeof createServiceSupabaseClient>, workspaceId: string, findings: HealthFinding[], now: string) {
    const activeKeys = findings.flatMap((finding) => finding.attention ? [finding.attention.dedupeKey] : []);
    const { data: open, error } = await service.from('attention_items').select('id,dedupe_key').eq('workspace_id', workspaceId).eq('managed_by', 'system_health').in('status', ['open', 'acknowledged']);
    if (error) throw new InternalServerErrorException(error.message);
    for (const item of open ?? []) {
      if (!activeKeys.includes(item.dedupe_key)) {
        const result = await service.from('attention_items').update({ status: 'resolved', resolved_at: now, updated_at: now }).eq('workspace_id', workspaceId).eq('id', item.id);
        if (result.error) throw new InternalServerErrorException(result.error.message);
      }
    }
  }

  private async cleanupStaleComponents(service: ReturnType<typeof createServiceSupabaseClient>, workspaceId: string, findings: HealthFinding[]) {
    const active = new Set(findings.map((finding) => `${finding.component}:${finding.capability ?? 'core'}`));
    const { data: existing, error } = await service.from('system_health_components').select('id,component,capability').eq('workspace_id', workspaceId);
    if (error) throw new InternalServerErrorException(error.message);
    for (const row of existing ?? []) {
      if (!active.has(`${row.component}:${row.capability}`)) {
        const removed = await service.from('system_health_components').delete().eq('workspace_id', workspaceId).eq('id', row.id);
        if (removed.error) throw new InternalServerErrorException(removed.error.message);
      }
    }
  }

  private sortAttention(items: any[]) {
    const rank: Record<string, number> = { urgent: 0, today: 1, later: 2 };
    return [...items].sort((a, b) => (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9) || new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime());
  }

  private mapConnectionStatus(status: string): HealthStatus {
    if (status === 'connected') return 'healthy';
    if (status === 'degraded') return 'degraded';
    if (status === 'needs_attention') return 'needs_attention';
    if (status === 'disconnected') return 'disconnected';
    if (status === 'paused') return 'paused';
    return 'unknown';
  }

  private overallStatus(statuses: string[], controls: any) {
    if (controls?.emergency_read_only) return 'paused';
    const known = statuses.filter((status) => status !== 'unknown');
    if (known.includes('disconnected') || known.includes('needs_attention')) return 'needs_attention';
    if (known.includes('degraded')) return 'degraded';
    if (known.includes('paused')) return 'paused';
    if (statuses.includes('unknown')) return 'unknown';
    if (known.length && known.every((status) => status === 'healthy')) return 'healthy';
    return 'unknown';
  }

  private async assertWorkspaceAccess(supabase: ReturnType<typeof createUserSupabaseClient>, workspaceId: string) {
    const { data, error } = await supabase.from('workspaces').select('id').eq('id', workspaceId).single();
    if (error || !data) throw new NotFoundException('Workspace not found');
  }
}
