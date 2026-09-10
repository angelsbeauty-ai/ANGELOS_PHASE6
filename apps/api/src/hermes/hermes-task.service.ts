import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../auth/auth-user';
import { createUserSupabaseClient, createServiceSupabaseClient } from '../config/supabase';

/**
 * Hermes Task Store — persists everything n8n/Telegram/Hermes executes.
 *
 * Table: public.hermes_tasks (migration 20260908000000_hermes_tasks_table.sql)
 * - Idempotent on (workspace_id, source_ref) — retries don't duplicate
 * - Tracks intent, status lifecycle, Hermes result, n8n execution id, callback URL
 * - RLS: workspace members read/write; service_role full access for n8n callback
 */
@Injectable()
export class HermesTaskService {
  private async workspaceId(user: AuthUser): Promise<string> {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase
      .from('workspace_memberships')
      .select('workspace_id')
      .eq('user_id', user.id);

    if (error) throw new BadRequestException(error.message);
    const memberships = (data ?? []).map((r: any) => r.workspace_id);
    if (!memberships.length) throw new BadRequestException('No workspace found for this account');
    return memberships[0]; // V1: single workspace
  }

  async create(user: AuthUser, body: {
    source_ref?: string; source?: string; source_channel?: string;
    intent: string; task_text: string; task_json?: Record<string, any>;
    needs_owner_approval?: boolean; n8n_execution_id?: string; n8n_callback_url?: string;
  }): Promise<any> {
    const wsId = await this.workspaceId(user);
    const supabase = createUserSupabaseClient(user.accessToken);
    const now = new Date().toISOString();

    // Idempotency: return existing task if source_ref already exists
    if (body.source_ref) {
      const { data: existing } = await supabase
        .from('hermes_tasks')
        .select('id')
        .eq('workspace_id', wsId)
        .eq('source_ref', body.source_ref)
        .maybeSingle();
      if (existing) return this.getOne(user, existing.id);
    }

    const { data, error } = await supabase
      .from('hermes_tasks')
      .insert({
        workspace_id: wsId,
        source: body.source ?? 'telegram',
        source_ref: body.source_ref ?? null,
        source_channel: body.source_channel ?? null,
        intent: body.intent,
        task_text: body.task_text,
        task_json: body.task_json ?? null,
        status: 'queued',
        needs_owner_approval: body.needs_owner_approval ?? false,
        n8n_execution_id: body.n8n_execution_id ?? null,
        n8n_callback_url: body.n8n_callback_url ?? null,
        n8n_status: 'queued',
        created_by: user.id,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new BadRequestException('Could not create task');
    return data;
  }

  async getOne(user: AuthUser, taskId: string): Promise<any> {
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase
      .from('hermes_tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    if (error) throw new NotFoundException('Task not found');
    if (!data) throw new NotFoundException('Task not found');
    return data;
  }

  async listRecent(user: AuthUser, limit = 50): Promise<any[]> {
    const wsId = await this.workspaceId(user);
    const supabase = createUserSupabaseClient(user.accessToken);
    const { data, error } = await supabase
      .from('hermes_tasks')
      .select('*')
      .eq('workspace_id', wsId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async updateStatus(user: AuthUser, taskId: string, body: {
    status?: string; hermes_session_id?: string; hermes_result?: Record<string, any>;
    hermes_error?: string; hermes_started_at?: string; hermes_finished_at?: string;
    n8n_status?: string; approval_status?: string; approved_by?: string;
    approved_at?: string; needs_owner_approval?: boolean;
  }): Promise<any> {
    const supabase = createUserSupabaseClient(user.accessToken);
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const [k, v] of Object.entries(body)) {
      if (v !== undefined) updates[k] = v;
    }

    const { data, error } = await supabase
      .from('hermes_tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Task not found');
    return data;
  }
}
