import { Injectable } from '@nestjs/common';
import { createServiceSupabaseClient } from '../config/supabase';

/**
 * Create Hermes tasks as the system (n8n), without user authentication.
 * Used by n8n when it creates tasks from Telegram messages.
 *
 * workspaceId is passed separately (from URL path param in controller).
 */
@Injectable()
export class HermesSystemService {
  async createAsSystem(
    workspaceId: string,
    body: {
      source_ref?: string;
      source?: string;
      source_channel?: string;
      intent: string;
      task_text: string;
      task_json?: Record<string, any>;
      needs_owner_approval?: boolean;
      n8n_execution_id?: string;
      n8n_callback_url?: string;
    },
    n8nExecutionId?: string
  ) {
    const supabase = createServiceSupabaseClient();
    const now = new Date().toISOString();
    const execId = n8nExecutionId ?? body.n8n_execution_id ?? 'n8n-' + now;

    // Idempotency check
    if (body.source_ref && workspaceId) {
      const { data: existing } = await supabase
        .from('hermes_tasks')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('source_ref', body.source_ref)
        .maybeSingle();
      if (existing) return this.getOneAsSystem(existing.id);
    }

    const { data, error } = await supabase
      .from('hermes_tasks')
      .insert({
        workspace_id: workspaceId ?? 'unknown',
        source: body.source ?? 'telegram',
        source_ref: body.source_ref ?? null,
        source_channel: body.source_channel ?? null,
        intent: body.intent,
        task_text: body.task_text,
        task_json: body.task_json ?? null,
        status: 'queued',
        needs_owner_approval: body.needs_owner_approval ?? false,
        n8n_execution_id: execId,
        n8n_callback_url: body.n8n_callback_url ?? null,
        n8n_status: 'queued',
        created_by: 'n8n',
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Could not create task');
    return data;
  }

  async getOneAsSystem(taskId: string) {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from('hermes_tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    if (error) throw new Error('Task not found');
    if (!data) throw new Error('Task not found');
    return data;
  }
}
