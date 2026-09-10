import { Injectable } from '@nestjs/common';
import { createServiceSupabaseClient } from '../config/supabase';

/**
 * Record a Hermes Builder result into Supabase.
 * Called from the n8n callback endpoint.
 * Separated from the executor so it can be called independently.
 */
@Injectable()
export class HermesBuilderResultRecorder {
  async recordResult(
    taskId: string,
    executionId: string,
    result: Record<string, any>,
    error?: string
  ) {
    const supabase = createServiceSupabaseClient();

    const status = error ? 'failed' : 'done';
    const now = new Date().toISOString();

    // Safely serialize the result for JSON storage
    let serializedResult: Record<string, any>;
    try {
      serializedResult = JSON.parse(JSON.stringify(result));
    } catch {
      serializedResult = { raw: String(result) };
    }

    const values = {
      status,
      hermes_result: serializedResult,
      hermes_error: error ?? null,
      n8n_execution_id: executionId,
      n8n_status: status,
      updated_at: now
    };

    const { error: updateError } = await supabase
      .from('hermes_tasks')
      .update(values)
      .eq('id', taskId);

    if (updateError) {
      return { success: false, taskId, error: updateError.message };
    }

    // Fetch the updated task to check for callback URL
    const { data: task } = await supabase
      .from('hermes_tasks')
      .select('n8n_callback_url, source_channel')
      .eq('id', taskId)
      .single();

    if (task?.n8n_callback_url && task.source_channel === 'telegram') {
      this.fireCallback(task.n8n_callback_url, result, error);
    }

    return { success: true, taskId, status };
  }

  private fireCallback(callbackUrl: string, result: Record<string, any>, error?: string) {
    // Fire-and-forget callback to n8n's stored callback URL
    // Build a simple text reply
    const text = error
      ? `❌ Hermes task failed: ${error}`
      : `✅ Hermes task completed. Result recorded.`;

    fetch(callbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, result, error })
    }).catch(() => { /* fire-and-forget */ });
  }
}
