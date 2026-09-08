import { Injectable } from '@nestjs/common';
import { createServiceSupabaseClient } from '../config/supabase';

/**
 * n8n-specific Hermes endpoints — shared-secret protected, no Bearer token required.
 *
 * n8n calls these endpoints with X-N8N-Secret header.
 * N8N_HERMES_SECRET must be set in Railway env vars.
 *
 * These endpoints:
 * - Create Hermes tasks from Telegram messages (build/fix/review intents)
 * - Get overview/status for /status command
 * - Trigger Hermes Builder execution
 */
@Injectable()
export class N8nHermesService {
  async createTask(body: Record<string, any>) {
    const supabase = createServiceSupabaseClient();
    const workspaceId = body.workspaceId || 'default';
    const now = new Date().toISOString();
    const execId = body.n8n_execution_id || 'n8n-' + now;

    const insertData = {
      workspace_id: workspaceId,
      source: body.source || 'telegram',
      source_ref: body.source_ref || null,
      source_channel: body.source_channel || null,
      intent: body.intent,
      task_text: body.task_text,
      task_json: body.task_json || null,
      status: 'queued',
      needs_owner_approval: body.needs_owner_approval || false,
      n8n_execution_id: execId,
      n8n_callback_url: body.n8n_callback_url || null,
      n8n_status: 'queued',
      created_by: null,
      created_at: now,
      updated_at: now
    };

    // Idempotency: check if source_ref already exists
    if (body.source_ref) {
      const { data: existing } = await supabase
        .from('hermes_tasks')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('source_ref', body.source_ref)
        .maybeSingle();
      if (existing) {
        const { data: task, error: fetchError } = await supabase
          .from('hermes_tasks')
          .select('*')
          .eq('id', existing.id)
          .single();
        if (fetchError || !task) throw new Error('Task not found after idempotency check');
        return task;
      }
    }

    const { data, error } = await supabase
      .from('hermes_tasks')
      .insert(insertData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create task: ${error.message}`);
    if (!data) throw new Error('No task returned after insert');
    return data;
  }

  async getOverview(workspaceId: string) {
    const supabase = createServiceSupabaseClient();
    const [approvalsResult, attentionResult] = await Promise.all([
      supabase
        .from('approvals')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('attention_items')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'open')
        .order('severity', { ascending: false })
    ]);

    const pendingApprovals = (approvalsResult.data ?? []).map((a: any) => ({
      id: a.id,
      type: a.type,
      status: a.status,
      sourceId: a.source_id,
      sourceChannel: a.source_channel,
      content: a.content,
      clientName: a.client_name,
      createdAt: a.created_at
    }));

    const attentionItems = (attentionResult.data ?? []).map((a: any) => ({
      id: a.id,
      severity: a.severity,
      title: a.title,
      summary: a.summary,
      status: a.status,
      managedBy: a.managed_by,
      createdAt: a.created_at
    }));

    return {
      workspaceId,
      pendingApprovals: pendingApprovals.length,
      needsAttention: attentionItems.length,
      pendingApprovalsItems: pendingApprovals,
      attentionItems
    };
  }

  async executeTask(taskId: string, model?: string, timeoutMs?: number) {
    const { HermesBuilderExecutor } = await import('./hermes-builder-executor.service');
    const executor = new HermesBuilderExecutor();
    return executor.execute({ taskId, model, timeoutMs });
  }
}
