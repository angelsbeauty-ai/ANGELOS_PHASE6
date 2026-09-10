import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { createServiceSupabaseClient } from '../config/supabase';

/**
 * n8n callback endpoint — called by n8n when a Hermes task completes.
 *
 * Auth: called by n8n with its own auth (not user's Supabase token).
 * Uses service_role Supabase access. In production, add n8n-specific auth.
 */
@Injectable()
export class N8nCallbackService {
  async recordTaskResult(taskId: string, executionId: string, result: Record<string, any>, error?: string) {
    const supabase = createServiceSupabaseClient();
    const now = new Date().toISOString();

    const { data: task, error: fetchError } = await supabase
      .from('hermes_tasks')
      .select('*')
      .eq('id', taskId)
      .maybeSingle();

    if (fetchError || !task) throw new NotFoundException('Task not found');

    const status = error ? 'failed' : 'done';
    const updateResult = await supabase
      .from('hermes_tasks')
      .update({
        status,
        hermes_result: result,
        hermes_error: error ?? null,
        hermes_finished_at: now,
        n8n_status: status,
        n8n_execution_id: executionId ?? task.n8n_execution_id,
        updated_at: now
      })
      .eq('id', taskId)
      .select()
      .single();

    const data = updateResult.data;
    const updateErrorResult = updateResult.error;

    if (updateErrorResult || !data) throw new BadRequestException(updateErrorResult?.message ?? 'Update failed');
    if (!data) throw new NotFoundException('Task not found');

    // Fire Telegram callback if one was stored
    if (task.n8n_callback_url && task.source_channel === 'telegram') {
      this.fireCallback(task.n8n_callback_url, task, result, error);
    }

    return { success: true, taskId, status, executionId };
  }

  private fireCallback(callbackUrl: string, task: any, result: Record<string, any>, error?: string) {
    try {
      const text = this.buildReply(task, result, error);
      fetch(callbackUrl + '&text=' + encodeURIComponent(text), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch((e: any) => console.error('Telegram callback error:', e?.message ?? String(e)));
    } catch (e: any) {
      console.error('Callback error:', e?.message ?? String(e));
    }
  }

  private buildReply(task: any, result: Record<string, any>, error?: string): string {
    if (error) return `❌ Task failed: ${error}`;

    const intent = task.intent;
    if (intent === 'status' || intent === 'overview') {
      const app = (r: any) =>
        `🚦 **AngelOS Status**\n\nPending approvals: ${r.pendingApprovals ?? '?'}\nNeeds attention: ${r.needsAttention ?? '?'}\n${this.listItems(r.pendingApprovalsItems ?? [], 'Approvals')}\n${this.listItems(r.attentionItems ?? [], 'Attention')}`;
      return app(result);
    }
    if (intent === 'build' || intent === 'fix' || intent === 'review') {
      const parts = ['🔨 **Hermes Build Result**'];
      if (result.files_changed?.length) {
        parts.push(`**Files (${result.files_changed.length}):**`);
        result.files_changed.slice(0, 10).forEach((f: string) => parts.push(`- \`${f}\``));
      }
      if (result.test_result) parts.push(`**Tests:** ${result.test_result.status}`);
      if (result.summary) parts.push(result.summary);
      if (result.error) parts.push(`**Error:** ${result.error}`);
      return parts.join('\n');
    }
    if (intent === 'blockers') {
      const bl = result.blockers ?? result.blockers_list ?? [];
      if (!bl.length) return '🚧 **Blockers:** No active blockers.';
      return '🚧 **Blockers:**\n' + bl.map((b: any) => `- ${b.description ?? 'No description'}`).join('\n');
    }
    if (intent === 'next' || intent === 'plan') {
      if (!result.goal) return JSON.stringify(result, null, 2);
      const parts = [`🎯 **Hermes Task**`, ``, `GOAL: ${result.goal}`];
      if (result.files?.length) parts.push(`FILES: ${result.files.join(', ')}`);
      if (result.area) parts.push(`AREA: ${result.area}`);
      if (result.build?.length) { parts.push(`BUILD:`); result.build.forEach((s: string, i: number) => parts.push(`  ${i+1}. ${s}`)); }
      return parts.join('\n');
    }
    return result.summary ?? JSON.stringify(result, null, 2);
  }

  private listItems(items: any[], label: string): string {
    if (!items.length) return '';
    return `**${label}:**\n` + items.slice(0, 5).map((a: any) => {
      const name = a.clientName ?? a.title ?? a.content?.substring(0, 60) ?? '?';
      return `- ${name}`;
    }).join('\n') + (items.length > 5 ? `\n- ... and ${items.length - 5} more` : '');
  }
}
