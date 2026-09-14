import { BadRequestException, Body, ConflictException, Controller, Get, NotFoundException, Param, Post, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { createServiceSupabaseClient } from '../config/supabase';
import { N8nSecretGuard } from '../common/guards/n8nsecret.guard';
import { validateBoundedCodexTask } from './hermes-task.service';

const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const terminal = new Set(['done', 'failed', 'timeout', 'cancelled', 'rejected', 'awaiting_approval']);

@Controller('workspaces/:workspaceId/integrations/codex/tasks')
@UseGuards(N8nSecretGuard)
export class CodexIntegrationController {
  private client() { return createServiceSupabaseClient(); }

  private async conversation(workspaceId: string, conversationId: string) {
    if (!uuid(workspaceId) || !uuid(conversationId)) throw new BadRequestException('Valid workspace and conversation IDs are required');
    const { data, error } = await this.client().from('ai_conversations').select('id,created_by')
      .eq('workspace_id', workspaceId).eq('id', conversationId).maybeSingle();
    if (error) throw new ServiceUnavailableException('Conversation lookup failed');
    if (!data) throw new NotFoundException('Conversation not found in workspace');
    return data;
  }

  private async task(workspaceId: string, taskId: string) {
    if (!uuid(workspaceId) || !uuid(taskId)) throw new BadRequestException('Valid workspace and task IDs are required');
    const { data, error } = await this.client().from('hermes_tasks').select('*')
      .eq('workspace_id', workspaceId).eq('id', taskId).eq('source_channel', 'codex_integration').maybeSingle();
    if (error) throw new ServiceUnavailableException('Task lookup failed');
    if (!data) throw new NotFoundException('Integration task not found in workspace');
    return data;
  }

  @Post()
  async submit(@Param('workspaceId') workspaceId: string, @Body() body: {
    conversation_id: string; request_id: string; intent: string; task_text: string; task_json?: Record<string, any>;
  }) {
    const spec = validateBoundedCodexTask(body);
    if (!uuid(body.request_id)) throw new BadRequestException('request_id must be a stable UUID reused on retries');
    const conversation = await this.conversation(workspaceId, body.conversation_id);
    const client = this.client();
    const { data: controls, error: controlsError } = await client.from('workspace_operational_controls')
      .select('emergency_read_only,pause_ai_actions').eq('workspace_id', workspaceId).maybeSingle();
    if (controlsError || !controls) throw new ServiceUnavailableException('Workspace controls unavailable');
    if (controls.emergency_read_only || controls.pause_ai_actions) throw new ConflictException('Development tasks are paused');
    const sourceRef = `codex:${body.conversation_id}:${body.request_id}`;
    const expected = { intent: body.intent, task_text: body.task_text, task_json: spec };
    const { data, error } = await client.from('hermes_tasks').insert({
      ...expected, workspace_id: workspaceId, source: 'api', source_channel: 'codex_integration',
      source_ref: sourceRef, status: 'queued', n8n_status: 'queued', created_by: conversation.created_by,
      needs_owner_approval: false
    }).select('*').single();
    if (!error) return data;
    if (error.code !== '23505') throw new ServiceUnavailableException('Task submission failed');
    const { data: existing, error: lookupError } = await client.from('hermes_tasks').select('*')
      .eq('workspace_id', workspaceId).eq('source_ref', sourceRef).maybeSingle();
    if (lookupError || !existing) throw new ServiceUnavailableException('Task retry lookup failed');
    if (existing.intent !== expected.intent || existing.task_text !== expected.task_text ||
      JSON.stringify(existing.task_json?.files) !== JSON.stringify(spec.files) ||
      JSON.stringify(existing.task_json?.acceptance_criteria) !== JSON.stringify(spec.acceptance_criteria)) {
      throw new ConflictException('request_id already belongs to a different task');
    }
    return existing;
  }

  @Get(':taskId/status')
  async status(@Param('workspaceId') workspaceId: string, @Param('taskId') taskId: string) {
    const task = await this.task(workspaceId, taskId);
    return { id: task.id, status: task.status, result: task.hermes_result, error: task.hermes_error,
      started_at: task.hermes_started_at, finished_at: task.hermes_finished_at };
  }

  @Post(':taskId/deliver')
  async deliver(@Param('workspaceId') workspaceId: string, @Param('taskId') taskId: string) {
    const task = await this.task(workspaceId, taskId);
    if (!terminal.has(task.status)) throw new ConflictException('Task has no final report yet');
    const conversationId = String(task.source_ref ?? '').split(':')[1];
    await this.conversation(workspaceId, conversationId);
    const result = task.hermes_result ?? {};
    const report = { taskId: task.id, status: task.status, summary: result.summary ?? task.hermes_error ?? '',
      changedFiles: result.files_changed ?? [], tests: result.test_result ?? { status: 'not_run', commands: [] },
      blockers: result.blockers ?? (task.hermes_error ? [task.hermes_error] : []),
      approvalRequired: result.approval_required ?? [], sourceCheckoutModified: result.source_checkout_modified ?? null };
    const metadata = { type: 'development_task_result', ...report };
    const content = `${report.summary}\n\n${JSON.stringify(report, null, 2)}\n\nCode changes are not applied automatically.`;
    const { error } = await this.client().from('ai_messages').insert({ id: task.id, workspace_id: workspaceId,
      conversation_id: conversationId, author_type: 'assistant', content, metadata });
    if (error && error.code !== '23505') throw new ServiceUnavailableException('Report delivery failed');
    if (error) {
      const { data, error: lookupError } = await this.client().from('ai_messages').select('metadata')
        .eq('id', task.id).eq('workspace_id', workspaceId).eq('conversation_id', conversationId).maybeSingle();
      if (lookupError || data?.metadata?.type !== 'development_task_result' || data?.metadata?.taskId !== task.id) {
        throw new ConflictException('Report ID collision');
      }
    }
    return { delivered: true, task_id: task.id, message_id: task.id, already_delivered: !!error };
  }
}
