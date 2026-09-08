import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { createServiceSupabaseClient } from '../config/supabase';

export interface ExecuteTaskRequest {
  taskId: string;
  model?: string;
  timeoutMs?: number;
  executionId?: string;
}

export interface ExecuteTaskResult {
  success: boolean;
  taskId: string;
  status: 'done' | 'failed' | 'timeout';
  files_changed?: string[];
  summary?: string;
  test_result?: { status: string; passed: number; failed: number };
  error?: string;
  durationMs?: number;
}

@Injectable()
export class HermesBuilderExecutor {
  /**
   * Execute a Hermes task and record the result in Supabase.
   * Also fires Telegram callback if one was stored with the task.
   */
  async execute(request: ExecuteTaskRequest): Promise<ExecuteTaskResult> {
    const supabase = createServiceSupabaseClient();
    const timeoutMs = request.timeoutMs ?? 300000;
    const startTime = Date.now();

    // Fetch the task
    const { data: task, error: fetchError } = await supabase
      .from('hermes_tasks')
      .select('*')
      .eq('id', request.taskId)
      .single();

    if (fetchError || !task) {
      return { success: false, taskId: request.taskId, status: 'failed', error: 'Task not found' };
    }

    if (!['queued', 'assigned', 'in_progress'].includes(task.status)) {
      return { success: false, taskId: request.taskId, status: 'failed', error: `Task is in ${task.status} status, cannot execute` };
    }

    // Set to building
    const now = new Date().toISOString();
    await supabase.from('hermes_tasks').update({
      status: 'building',
      hermes_started_at: now,
      n8n_status: 'building',
      updated_at: now
    }).eq('id', request.taskId).select().single();

    const executionId = request.executionId ?? 'executor-' + Date.now();

    try {
      // Execute the task (demo mode for now — real execution via OpenAI in production)
      const result = await this.executeTask(task, timeoutMs);

      // Record success
      const finishTime = new Date().toISOString();
      await supabase.from('hermes_tasks').update({
        status: 'done',
        hermes_result: result,
        hermes_finished_at: finishTime,
        n8n_status: 'done',
        n8n_execution_id: executionId,
        updated_at: finishTime
      }).eq('id', request.taskId).select().single();

      // Fire Telegram callback if one was stored
      if (task.n8n_callback_url && task.source_channel === 'telegram') {
        this.fireCallback(task.n8n_callback_url, task, result, undefined);
      }

      return {
        success: true,
        taskId: request.taskId,
        status: 'done',
        files_changed: result.files_changed,
        summary: result.summary,
        test_result: result.test_result,
        durationMs: Date.now() - startTime
      };
    } catch (e: any) {
      const errorMsg = e.message ?? String(e);
      const finishTime = new Date().toISOString();

      await supabase.from('hermes_tasks').update({
        status: 'failed',
        hermes_error: errorMsg,
        hermes_finished_at: finishTime,
        n8n_status: 'failed',
        updated_at: finishTime
      }).eq('id', request.taskId).select().single();

      if (task.n8n_callback_url && task.source_channel === 'telegram') {
        this.fireCallback(task.n8n_callback_url, task, {}, errorMsg);
      }

      return { success: false, taskId: request.taskId, status: 'failed', error: errorMsg, durationMs: Date.now() - startTime };
    }
  }

  /**
   * Demo execution — returns synthetic result based on intent.
   * Replace with real OpenAI + code execution in production.
   */
  private async executeTask(task: any, _timeoutMs: number): Promise<{
    files_changed?: string[];
    summary: string;
    test_result?: { status: string; passed: number; failed: number };
  }> {
    await this.sleep(300); // simulate thinking

    const intent = task.intent;
    const text = task.task_text ?? '';

    if (intent === 'build' || intent === 'fix' || intent === 'review') {
      return {
        files_changed: ['apps/api/src/hermes/hermes-task.service.ts', 'apps/api/src/hermes/hermes-control.controller.ts'],
        summary: `Demo: Task processed. Intent: ${intent}. Text preview: "${text.substring(0, 60)}...". In production, Hermes Builder would generate and apply code changes.`,
        test_result: { status: 'passed', passed: 13, failed: 0 }
      };
    }

    if (intent === 'status' || intent === 'overview') {
      return {
        summary: 'Demo: Status overview generated. In production, this would call the AngelOS overview API.',
        test_result: { status: 'passed', passed: 1, failed: 0 }
      };
    }

    return {
      summary: `Demo: Task processed. Intent: ${intent}. In production, Hermes Builder would handle this.`,
      test_result: { status: 'passed', passed: 1, failed: 0 }
    };
  }

  /**
   * Fire a Telegram callback with the result.
   * The callback URL was stored when the task was created (n8n passes it).
   */
  private async fireCallback(callbackUrl: string, task: any, result: Record<string, any>, error?: string) {
    const text = this.buildTelegramText(task, result, error);
    try {
      await fetch(callbackUrl + '&text=' + encodeURIComponent(text), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e: any) {
      console.error('Telegram callback error:', e.message ?? String(e));
    }
  }

  private buildTelegramText(task: any, result: Record<string, any>, error?: string): string {
    if (error) return `❌ Task failed: ${error}`;

    switch (task.intent) {
      case 'build':
      case 'fix':
      case 'review': {
        const parts = ['🔨 **Hermes Build Result**', ''];
        if (result.files_changed?.length) {
          parts.push(`**Files (${result.files_changed.length}):**`);
          result.files_changed.slice(0, 10).forEach((f: string) => parts.push(`- \`${f}\``));
          if (result.files_changed.length > 10) parts.push(`- ...and ${result.files_changed.length - 10} more`);
        }
        if (result.test_result) parts.push(`**Tests:** ${result.test_result.status} (${result.test_result.passed} passed, ${result.test_result.failed} failed)`);
        if (result.summary) parts.push(result.summary);
        return parts.join('\n');
      }
      case 'status':
      case 'overview':
        return '🚦 **Status:** Build result generated. Check the AngelOS dashboard for full details.';
      default:
        return result.summary ?? '✅ Task completed. See AngelOS dashboard for details.';
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
