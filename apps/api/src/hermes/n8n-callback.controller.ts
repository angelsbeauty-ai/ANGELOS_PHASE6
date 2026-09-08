import { Body, Controller, Post, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { HermesBuilderResultRecorder } from './hermes-builder-result-recorder.service';
import { N8nSecretGuard } from '../common/guards/n8nsecret.guard';

/**
 * n8n callback endpoint — called by n8n when Hermes Builder completes a task.
 *
 * Flow:
 *   1. Telegram message → n8n → creates task via POST /hermes/tasks
 *   2. n8n triggers Hermes Builder execution
 *   3. Hermes Builder executes → n8n receives result
 *   4. n8n POSTs result to /hermes/n8n/callback
 *   5. Callback records result in Supabase + fires Telegram reply if callback_url stored
 *
 * Protected by N8nSecretGuard — n8n includes X-N8N-Secret header.
 * N8N_HERMES_SECRET must be set in Railway env vars.
 */
@Controller('workspaces/:workspaceId/hermes/n8n')
@UseGuards(N8nSecretGuard)
export class N8nCallbackController {
  constructor(private readonly recorder: HermesBuilderResultRecorder) {}

  /**
   * Called by n8n after Hermes Builder finishes executing a task.
   * Records the result and fires a Telegram reply if a callback URL was stored.
   */
  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async callback(
    @Body() body: {
      taskId: string;
      executionId?: string;
      result?: Record<string, any>;
      error?: string;
    }
  ) {
    return this.recorder.recordResult(
      body.taskId,
      body.executionId ?? 'n8n-' + Date.now(),
      body.result ?? {},
      body.error
    );
  }
}
